"""Validate vi/translations/<n>.json against vi/src/<n>.json.

Usage: python3 scripts/vi/check_vi.py [n ...]   (no args = all chunks)
Prints one line per chunk: OK, MISSING, or the problems found.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "vi" / "src"
TR = ROOT / "vi" / "translations"
CJK = re.compile(r"[一-鿿　-〿＀-￯]")
VI = re.compile(r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", re.I)

nums = sys.argv[1:] or sorted((p.stem for p in SRC.glob("*.json")), key=int)
bad = 0
for n in nums:
    src = json.loads((SRC / f"{n}.json").read_text(encoding="utf-8"))
    p = TR / f"{n}.json"
    if not p.exists():
        print(f"{n}: MISSING")
        bad += 1
        continue
    try:
        tr = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"{n}: INVALID JSON {e}")
        bad += 1
        continue
    probs = []
    for it in src:
        t = tr.get(it["id"])
        if not isinstance(t, dict):
            probs.append(f"{it['id']}: missing")
            continue
        s, c = t.get("s", []), t.get("c", [])
        if len(s) != len(it["s"]):
            probs.append(f"{it['id']}: s has {len(s)}, need {len(it['s'])}")
        if len(c) != len(it["c"]):
            probs.append(f"{it['id']}: c has {len(c)}, need {len(it['c'])}")
        vals = [*s, *c, t.get("t", ""), t.get("n", "")]
        if any(not isinstance(v, str) for v in vals):
            probs.append(f"{it['id']}: non-string value")
            continue
        if any(CJK.search(v) for v in vals):
            probs.append(f"{it['id']}: still contains Chinese")
        if any(not v.strip() for v in s):
            probs.append(f"{it['id']}: empty meaning")
        if s and not any(VI.search(v) for v in s + c) and len(" ".join(s)) > 12:
            probs.append(f"{it['id']}: meanings look untranslated")
    extra = set(tr) - {it["id"] for it in src}
    if extra:
        probs.append(f"unexpected ids: {sorted(extra)[:5]}")
    if probs:
        bad += 1
        print(f"{n}: {len(probs)} problems: " + " | ".join(probs[:8]))
    else:
        print(f"{n}: OK ({len(src)} words)")
sys.exit(1 if bad else 0)
