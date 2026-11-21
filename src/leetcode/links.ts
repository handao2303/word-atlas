/** Link resolution for the bundled LeetCode write-ups (pure, testable in Node). */
export interface LinkContext {
  /** Path of the document inside the upstream repo, e.g. "problems/1.two-sum.en.md". */
  src: string;
  repo: string;
  commit: string;
  /** Upstream path -> in-app doc ref. */
  files: Record<string, string>;
}

export const FAKE = "https://repo.invalid/";

/** Where a link inside a write-up should go: an in-app page, the problem on leetcode.com, or the upstream file. */
export function resolveLink(href: string, ctx: LinkContext): { href: string; internal: boolean } | null {
  if (!href || href.startsWith("#")) return null;
  let path: string;
  const gh = new RegExp(`^https?://github\\.com/${ctx.repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/blob/[^/]+/(.+?)(?:#.*)?$`, "i").exec(href);
  if (gh) path = decodeURIComponent(gh[1]);
  else if (/^(mailto:|https?:)/i.test(href)) return { href, internal: false };
  else
    try {
      path = decodeURIComponent(new URL(href, FAKE + ctx.src).pathname.slice(1));
    } catch {
      return null;
    }
  const ref = ctx.files[path];
  if (ref) return { href: `#/code/${ref}`, internal: true };
  const pm = /^problems\/\d+\.([a-z0-9-]+?)(?:[.-]en)?\.md$/i.exec(path);
  if (pm) return { href: `https://leetcode.com/problems/${pm[1].toLowerCase()}/`, internal: false };
  if (/\.md$/i.test(path)) return { href: `https://github.com/${ctx.repo}/blob/${ctx.commit}/${path}`, internal: false };
  return { href: assetUrl(path, ctx), internal: false };
}

export const assetUrl = (path: string, ctx: LinkContext) => `https://cdn.jsdelivr.net/gh/${ctx.repo}@${ctx.commit}/${path.split("/").map(encodeURIComponent).join("/")}`;

