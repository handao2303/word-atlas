/**
 * Optional Supabase login + progress sync.
 * Enabled only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time;
 * without them the app works exactly as before (local-only).
 */
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { mergeProgress } from "../store/merge";
import { publicStats, type PublicStats } from "../store/stats";
import {
  adopt,
  flush,
  localChangedAt,
  sanitizeProgress,
  sanitizeSettings,
  store,
  type Settings,
} from "../store/store";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = "word_atlas_sync";

export const cloudEnabled = !!(URL_ && KEY);
export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/* ---------- tiny observable for auth + sync status ---------- */

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";
interface CloudState {
  ready: boolean;
  session: Session | null;
  status: SyncStatus;
  lastSync: number | null;
}
let cs: CloudState = { ready: !cloudEnabled, session: null, status: "idle", lastSync: null };
const subs = new Set<() => void>();
const set = (patch: Partial<CloudState>) => {
  cs = { ...cs, ...patch };
  subs.forEach((l) => l());
};
export function useCloud() {
  return useSyncExternalStore(
    (l) => (subs.add(l), () => subs.delete(l)),
    () => cs,
    () => cs,
  );
}

if (supabase) {
  supabase.auth.getSession().then(({ data }) => set({ ready: true, session: data.session }));
  supabase.auth.onAuthStateChange((_e, session) => set({ ready: true, session }));
}

export async function sendLoginLink(email: string) {
  if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
  });
  if (!error) return { error: null };
  if (/signups? not allowed|not found|otp_disabled/i.test(error.message))
    return { error: "Email này chưa được cấp quyền vào trang." };
  if (/rate|security purposes/i.test(error.message)) return { error: "Gửi quá nhiều lần, đợi một phút rồi thử lại." };
  return { error: error.message };
}

export async function signInWithGoogle() {
  if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } },
  });
  return { error: error?.message ?? null };
}

/** Errors Supabase puts in the URL after a failed OAuth redirect (e.g. sign-ups disabled). */
export function oauthErrorFromUrl(): string | null {
  const p = new URLSearchParams(location.hash.replace(/^#/, "") || location.search);
  const msg = p.get("error_description");
  if (!msg) return null;
  history.replaceState(null, "", location.pathname);
  if (/signups? not allowed|not allowed/i.test(msg)) return "Tài khoản Google này chưa được cấp quyền vào trang.";
  return msg.replace(/\+/g, " ");
}

export async function signOut() {
  await pushNow();
  await supabase?.auth.signOut();
}

/* ---------- sync ---------- */

let datasetId: string | null = null;
let pushTimer: number | undefined;
let applying = false;
let pulling: Promise<void> | null = null;

async function pull() {
  if (!supabase || !cs.session || !datasetId) return;
  const id = datasetId;
  set({ status: "syncing" });
  const { data, error } = await supabase
    .from(TABLE)
    .select("progress, settings, updated_at")
    .eq("dataset_id", id)
    .maybeSingle();
  if (error) return set({ status: navigator.onLine ? "error" : "offline" });
  if (!data) return pushNow();
  const remoteAt = Date.parse(data.updated_at) || 0;
  const localAt = localChangedAt(id);
  const st = store.get();
  const remoteProgress = sanitizeProgress(data.progress, id);
  const merged = mergeProgress(st.progress, remoteProgress, localAt >= remoteAt);
  const settings: Settings =
    localAt >= remoteAt ? st.settings : { ...sanitizeSettings(data.settings), onboarded: st.settings.onboarded || !!data.settings?.onboarded };
  applying = true;
  adopt(merged, settings, Math.max(localAt, remoteAt));
  applying = false;
  // Local had something the cloud did not: send the merged copy back.
  if (localAt > remoteAt || JSON.stringify(merged.cards) !== JSON.stringify(remoteProgress.cards)) await pushNow();
  else set({ status: "synced", lastSync: Date.now() });
}

export async function pushNow() {
  window.clearTimeout(pushTimer);
  if (!supabase || !cs.session || !datasetId) return;
  flush();
  const { progress, settings } = store.get();
  if (progress.datasetId !== datasetId) return;
  set({ status: "syncing" });
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: cs.session.user.id,
      dataset_id: datasetId,
      progress: { ...progress, session: null },
      settings,
      ...profile(cs.session),
      stats: publicStats(progress),
      updated_at: new Date(localChangedAt(datasetId) || Date.now()).toISOString(),
    },
    { onConflict: "user_id,dataset_id" },
  );
  set(error ? { status: navigator.onLine ? "error" : "offline" } : { status: "synced", lastSync: Date.now() });
}

function profile(session: Session) {
  const m = session.user.user_metadata ?? {};
  const email = session.user.email ?? "";
  return {
    display_name: (m.full_name || m.name || email.split("@")[0] || "Bạn học").toString().slice(0, 60),
    avatar_url: (m.avatar_url || m.picture || null) as string | null,
  };
}

export interface LeaderRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  stats: Partial<PublicStats> | null;
  updated_at: string;
}

/** Everyone's public summary for this dataset (requires sign-in). With push, sends our own summary first. */
export async function fetchLeaderboard(id: string, push = false): Promise<{ rows: LeaderRow[]; error: string | null }> {
  if (!supabase || !cs.session) return { rows: [], error: "Cần đăng nhập để xem bảng xếp hạng." };
  if (push) await pushNow();
  const { data, error } = await supabase.rpc("word_atlas_leaderboard", { p_dataset: id });
  if (error) return { rows: [], error: navigator.onLine ? "Không tải được bảng xếp hạng." : "Đang offline." };
  return { rows: (data ?? []) as LeaderRow[], error: null };
}

function schedulePush() {
  if (applying) return;
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void pushNow(), 3000);
}

/** Start syncing the given dataset for the signed-in user. Returns a stop function. */
export function startSync(id: string) {
  if (!supabase) return () => {};
  datasetId = id;
  pulling = pull().finally(() => (pulling = null));
  let last = store.get();
  const unsub = store.subscribe(() => {
    const now = store.get();
    if (now.progress !== last.progress || now.settings !== last.settings) schedulePush();
    last = now;
  });
  const onVis = () => {
    if (document.visibilityState === "hidden") void pushNow();
    else if (!pulling) pulling = pull().finally(() => (pulling = null));
  };
  const onOnline = () => void pull();
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("online", onOnline);
  return () => {
    unsub();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("online", onOnline);
    void pushNow();
    datasetId = null;
  };
}
