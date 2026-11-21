import assert from "node:assert/strict";
import { test } from "node:test";

// render.ts imports DOM-only libraries; resolveLink is pure, so test it through a light copy of the module.
const { resolveLink } = await import("./links");

const ctx = {
  src: "thinkings/tree.en.md",
  repo: "azl397985856/leetcode",
  commit: "abc",
  files: { "thinkings/union-find.en.md": "g/union-find", "problems/1.two-sum.en.md": "p/1" },
};

test("links to bundled write-ups stay in the app", () => {
  assert.deepEqual(resolveLink("union-find.en.md", ctx), { href: "#/code/g/union-find", internal: true });
  assert.deepEqual(resolveLink("../problems/1.two-sum.en.md", ctx), { href: "#/code/p/1", internal: true });
});

test("other problems go to leetcode.com, other files to GitHub", () => {
  assert.equal(resolveLink("../problems/94.binary-tree-inorder-traversal.md", ctx)!.href, "https://leetcode.com/problems/binary-tree-inorder-traversal/");
  assert.equal(resolveLink("./heap.md", ctx)!.href, "https://github.com/azl397985856/leetcode/blob/abc/thinkings/heap.md");
  assert.equal(resolveLink("#top", ctx), null);
});

test("absolute GitHub links into the repo are resolved like relative ones", () => {
  assert.deepEqual(resolveLink("https://github.com/azl397985856/leetcode/blob/master/thinkings/union-find.en.md", ctx), { href: "#/code/g/union-find", internal: true });
  assert.equal(resolveLink("https://github.com/azl397985856/leetcode/blob/master/problems/365.water-and-jug-problem.md", ctx)!.href, "https://leetcode.com/problems/water-and-jug-problem/");
  assert.equal(resolveLink("https://example.com/x", ctx)!.href, "https://example.com/x");
});
