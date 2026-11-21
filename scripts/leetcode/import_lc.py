#!/usr/bin/env python3
"""Copy the English write-ups of azl397985856/leetcode into public/leetcode/.

The source is licensed CC BY-NC-ND 4.0, so files are copied byte for byte (no edits,
no translation). Only metadata we write ourselves (titles, levels, tags, study tracks)
lives in catalog.json.

Usage: python3 scripts/leetcode/import_lc.py /path/to/leetcode-checkout
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
CATALOG = json.loads((pathlib.Path(__file__).parent / "catalog.json").read_text())
OUT = ROOT / "public" / "leetcode"


def main(src: pathlib.Path):
    head = subprocess.check_output(["git", "-C", str(src), "rev-parse", "HEAD"], text=True).strip()
    if head != CATALOG["commit"]:
        sys.exit(f"checkout is at {head}, catalog pins {CATALOG['commit']}")
    docs = OUT / "docs"
    docs.mkdir(parents=True, exist_ok=True)
    for old in docs.glob("*.md"):
        old.unlink()

    seen_p, seen_g = set(), set()
    for t in CATALOG["tracks"]:
        for p in t["problems"]:
            key = str(p)
            assert key in CATALOG["problems"], key
            assert key not in seen_p, f"problem {key} is in two tracks"
            seen_p.add(key)
        for g in t["guides"]:
            assert g in CATALOG["guides"], g
            seen_g.add(g)
    assert seen_p == set(CATALOG["problems"]), set(CATALOG["problems"]) ^ seen_p
    assert seen_g == set(CATALOG["guides"]), set(CATALOG["guides"]) ^ seen_g

    files = {}  # source path -> in-app doc ref, for resolving links between write-ups
    problems, guides = {}, {}
    for key, p in CATALOG["problems"].items():
        ref = f"p/{key}"
        body = (src / p["file"]).read_bytes()
        assert body.strip(), p["file"]
        (docs / f"p-{key}.md").write_bytes(body)
        files[p["file"]] = ref
        num = int(key) if key.isdigit() else None
        url = p.get("url") or f"https://leetcode.com/problems/{p['slug']}/"
        problems[key] = {
            "id": key,
            "num": num,
            "title": p["title"],
            "level": p["level"],
            "tags": p["tags"],
            "url": url,
            "src": p["file"],
            **({"premium": True} if p.get("premium") else {}),
        }
    for key, g in CATALOG["guides"].items():
        body = (src / g["file"]).read_bytes()
        (docs / f"g-{key}.md").write_bytes(body)
        files[g["file"]] = f"g/{key}"
        guides[key] = {"id": key, "title": g["title"], "src": g["file"], "words": len(re.findall(rb"\w+", body))}

    index = {
        "source": {k: CATALOG[k] for k in ("repo", "commit", "author", "license", "licenseUrl")},
        "tracks": [{**t, "problems": [str(p) for p in t["problems"]]} for t in CATALOG["tracks"]],
        "problems": problems,
        "guides": guides,
        "files": files,
    }
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")))
    (OUT / "LICENSE.md").write_text(
        f"Files in `docs/` are unmodified copies of English write-ups from "
        f"https://github.com/{CATALOG['repo']} (commit {CATALOG['commit']}),\n"
        f"by {CATALOG['author']}, licensed {CATALOG['license']} ({CATALOG['licenseUrl']}).\n"
        "They are reproduced here without changes for non-commercial study.\n"
    )
    print(f"{len(problems)} problems, {len(guides)} guides -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main(pathlib.Path(sys.argv[1]))
