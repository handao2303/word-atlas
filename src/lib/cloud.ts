/**
 * Optional Supabase login + progress sync.
 * Enabled only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time;
 * without them the app works exactly as before (local-only).
 */
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";
import { lc, lcChangedAt, lcStats, mergeLc, sanitizeLc, type LcStats } from "../leetcode/progress";
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

/** The part of the signed-in email before "@", used as the visible name. */
export function emailName(session: Session | null | undefined) {
  return (session?.user.email ?? "").split("@")[0] || null;
}

export interface LeaderRow {
  user_id: string;
  email_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  stats: Partial<PublicStats> | null;
  updated_at: string;
  /** LeetCode summary, joined in from the "leetcode" dataset row. */
  lc?: Partial<LcStats> | null;
}

/** Everyone's public summary for this dataset (requires sign-in). With push, sends our own summary first. */
export async function fetchLeaderboard(id: string, push = false): Promise<{ rows: LeaderRow[]; error: string | null }> {
  if (!supabase || !cs.session) return { rows: [], error: "Cần đăng nhập để xem bảng xếp hạng." };
  if (push) await Promise.all([pushNow(), pushLc()]);
  const [words, code] = await Promise.all([
    supabase.rpc("word_atlas_leaderboard", { p_dataset: id }),
    supabase.rpc("word_atlas_leaderboard", { p_dataset: LC }),
  ]);
  if (words.error) return { rows: [], error: navigator.onLine ? "Không tải được bảng xếp hạng." : "Đang offline." };
  const lcBy = new Map(((code.data ?? []) as LeaderRow[]).map((r) => [r.user_id, r.stats as Partial<LcStats> | null]));
  return { rows: ((words.data ?? []) as LeaderRow[]).map((r) => ({ ...r, lc: lcBy.get(r.user_id) ?? null })), error: null };
}

/* ---------- LeetCode progress: its own row (dataset_id "leetcode") in the same table ---------- */

const LC = "leetcode";
let lcTimer: number | undefined;
let lcApplying = false;

async function pullLc() {
  if (!supabase || !cs.session) return;
  const { data, error } = await supabase.from(TABLE).select("progress, updated_at").eq("dataset_id", LC).maybeSingle();
  if (error) return;
  if (!data) return pushLc();
  const remoteAt = Date.parse(data.updated_at) || 0;
  const localAt = lcChangedAt();
  const remote = sanitizeLc(data.progress);
  const merged = mergeLc(lc.get(), remote);
  lcApplying = true;
  lc.adopt(merged, Math.max(localAt, remoteAt));
  lcApplying = false;
  if (JSON.stringify(merged) !== JSON.stringify(remote)) await pushLc();
}

export async function pushLc() {
  window.clearTimeout(lcTimer);
  if (!supabase || !cs.session) return;
  const p = lc.get();
  await supabase.from(TABLE).upsert(
    {
      user_id: cs.session.user.id,
      dataset_id: LC,
      progress: p,
      settings: {},
      ...profile(cs.session),
      stats: lcStats(p),
      updated_at: new Date(lcChangedAt() || Date.now()).toISOString(),
    },
    { onConflict: "user_id,dataset_id" },
  );
}

/** Keep LeetCode progress in sync for the signed-in user. Returns a stop function. */
export function startLcSync() {
  if (!supabase) return () => {};
  void pullLc();
  const unsub = lc.subscribe(() => {
    if (lcApplying) return;
    window.clearTimeout(lcTimer);
    lcTimer = window.setTimeout(() => void pushLc(), 2000);
  });
  const onVis = () => void (document.visibilityState === "hidden" ? pushLc() : pullLc());
  document.addEventListener("visibilitychange", onVis);
  return () => {
    unsub();
    document.removeEventListener("visibilitychange", onVis);
    void pushLc();
  };
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

/* ---------- shared leaderboard state (Today and Rank pages read the same copy) ---------- */

interface Board {
  rows: LeaderRow[] | null;
  error: string | null;
  loading: boolean;
  at: number;
}
let board: Board = { rows: null, error: null, loading: false, at: 0 };
const boardSubs = new Set<() => void>();
const setBoard = (patch: Partial<Board>) => {
  board = { ...board, ...patch };
  boardSubs.forEach((l) => l());
};

export async function refreshLeaderboard(id: string, push = false) {
  if (board.loading) return;
  setBoard({ loading: true });
  const r = await fetchLeaderboard(id, push);
  setBoard({ rows: r.error ? board.rows : r.rows, error: r.error, loading: false, at: Date.now() });
}

/** Leaderboard rows, refreshed after every successful sync of our own progress. */
export function useLeaderboard(id: string) {
  const { session, lastSync } = useCloud();
  const snap = useSyncExternalStore(
    (l) => (boardSubs.add(l), () => boardSubs.delete(l)),
    () => board,
    () => board,
  );
  useEffect(() => {
    if (cloudEnabled && session) void refreshLeaderboard(id);
  }, [id, session, lastSync]);
  return { ...snap, me: session?.user.id ?? null, refresh: () => refreshLeaderboard(id, true) };
}
