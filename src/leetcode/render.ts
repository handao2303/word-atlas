/** Markdown -> sanitized HTML with highlighted code. Loaded on demand (kept out of the main bundle). */
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import { marked } from "marked";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c", c);
hljs.registerLanguage("java", java);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);
hljs.registerAliases(["py", "python3"], { languageName: "python" });
hljs.registerAliases(["JavaScript", "Javascript", "node"], { languageName: "javascript" });
hljs.registerAliases(["C++", "c++"], { languageName: "cpp" });

import { assetUrl, FAKE, resolveLink, type LinkContext } from "./links";

export function renderMarkdown(md: string, ctx: LinkContext): string {
  const raw = marked.parse(md, { async: false, gfm: true }) as string;
  const clean = DOMPurify.sanitize(raw, { FORBID_TAGS: ["style", "form", "input"], FORBID_ATTR: ["style"] });
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, "text/html");
  const root = doc.body.firstElementChild!;
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href")!;
    if (href.startsWith("#")) {
      a.setAttribute("data-anchor", decodeURIComponent(href.slice(1)));
      a.setAttribute("href", "javascript:void 0");
      return;
    }
    const r = resolveLink(href, ctx);
    if (!r) return a.removeAttribute("href");
    a.setAttribute("href", r.href);
    if (!r.internal) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });
  root.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src")!.trim();
    if (!/^https?:/i.test(src)) {
      try {
        img.setAttribute("src", assetUrl(decodeURIComponent(new URL(src.replace(/\s+/g, ""), FAKE + ctx.src).pathname.slice(1)), ctx));
      } catch {
        img.remove();
        return;
      }
    }
    img.setAttribute("loading", "lazy");
    img.setAttribute("referrerpolicy", "no-referrer");
  });
  root.querySelectorAll("h1, h2, h3, h4").forEach((h, i) => {
    if (!h.id) h.id = `s-${i}-${(h.textContent ?? "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60)}`;
  });
  root.querySelectorAll("pre code").forEach((code) => {
    const lang = [...code.classList].find((x) => x.startsWith("language-"))?.slice(9);
    const text = code.textContent ?? "";
    const known = lang && hljs.getLanguage(lang);
    code.innerHTML = known ? hljs.highlight(text, { language: lang!, ignoreIllegals: true }).value : escapeHtml(text);
    code.classList.add("hljs");
    if (known) code.parentElement!.setAttribute("data-lang", hljs.getLanguage(lang!)!.name ?? lang!);
  });
  root.querySelectorAll("table").forEach((t) => {
    const wrap = doc.createElement("div");
    wrap.className = "md-table";
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });
  return root.innerHTML;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "#39" }[ch]};`);

/** Highlight one SQL snippet (for the sandbox solution view). */
export const highlightSql = (code: string) => hljs.highlight(code, { language: "sql", ignoreIllegals: true }).value;
