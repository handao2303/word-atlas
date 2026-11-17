"""Build the Vietnamese edition of the web atlas data.

Reads the original (Chinese) data from vi/orig/ (backed up on first run) and the
Vietnamese translations from vi/translations/*.json, then rewrites
public/atlas/index.json and public/atlas/entries/*.json so every `zh` field holds
Vietnamese. Anything not translated yet falls back to the English definition
(meanings) or is hidden (example translations, tips), so no Chinese is shown.

Translation file format (one object per batch file):
  { "<id>": { "s": ["nghĩa 1", "nghĩa 2"],      # one per sense, same order
              "c": ["nghĩa cụm 1", ...],          # one per collocation, same order
              "t": "mẹo dùng từ",                  # tip
              "n": "lưu ý",                        # note (only when the original had one)
              "x": ["dịch câu 1", "dịch câu 2"] }  # optional example translations
  }

Usage: python3 scripts/vi/apply_vi.py
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "public" / "atlas"
ORIG = ROOT / "vi" / "orig"
TR = ROOT / "vi" / "translations"
CJK = re.compile(r"[一-鿿]")

TOPICS_VI = {
    "education": "Giáo dục", "work": "Công việc", "technology": "Công nghệ", "science": "Khoa học",
    "environment": "Môi trường", "health": "Sức khoẻ", "society": "Xã hội", "government": "Chính trị – Pháp luật",
    "economy": "Kinh tế", "media": "Truyền thông", "arts": "Nghệ thuật", "travel": "Du lịch",
    "city": "Đô thị", "nature": "Thiên nhiên", "daily": "Đời sống", "emotion": "Cảm xúc",
    "thinking": "Tư duy", "sport": "Thể thao", "history": "Lịch sử",
}


UPSTREAM = "0f1bae41fe5428f0f44781e60282525407b5ae46"  # last upstream commit (Chinese data)


def backup():
    """Extract the original Chinese data from the upstream commit into vi/orig/."""
    if (ORIG / "index.json").exists():
        return
    import subprocess

    (ORIG / "entries").mkdir(parents=True, exist_ok=True)
    show = lambda path: subprocess.run(["git", "-C", str(ROOT), "show", f"{UPSTREAM}:{path}"], check=True, capture_output=True).stdout
    (ORIG / "index.json").write_bytes(show("public/atlas/index.json"))
    for f in (PUB / "entries").glob("*.json"):
        (ORIG / "entries" / f.name).write_bytes(show(f"public/atlas/entries/{f.name}"))


def load_translations():
    tr = {}
    for f in sorted(TR.glob("*.json")) if TR.exists() else []:
        tr.update(json.loads(f.read_text(encoding="utf-8")))
    return tr


def clean(s):
    """Drop anything that still contains Chinese."""
    return "" if not s or CJK.search(s) else s.strip()


def first_en(en):
    """Short English gloss for lists/quizzes: first clause of the definition."""
    en = en.strip().rstrip(".")
    keep = len(en) > 1 and en[1].isupper()  # acronyms like "TV", "UK"
    return en if keep else en[:1].lower() + en[1:]


def main():
    backup()
    tr = load_translations()
    idx = json.loads((ORIG / "index.json").read_text(encoding="utf-8"))
    gloss = {}
    stats = {"entries": 0, "vi_senses": 0, "en_senses": 0, "vi_col": 0, "vi_tip": 0}

    for f in sorted((ORIG / "entries").glob("*.json"), key=lambda p: int(p.stem)):
        out = []
        for e in json.loads(f.read_text(encoding="utf-8")):
            t = tr.get(e["id"], {})
            stats["entries"] += 1
            sv = t.get("s", [])
            for i, s in enumerate(e["senses"]):
                vi = clean(sv[i]) if i < len(sv) else ""
                stats["vi_senses" if vi else "en_senses"] += 1
                s["zh"] = vi or first_en(s["en"])
            xv = t.get("x", [])
            for i, x in enumerate(e["ex"]):
                x["zh"] = clean(xv[i]) if i < len(xv) else ""
            cv = t.get("c", [])
            cols = []
            for i, c in enumerate(e["col"]):
                en = re.split(r"[｜|]", c)[0].strip()
                vi = clean(cv[i]) if i < len(cv) else ""
                stats["vi_col"] += bool(vi)
                cols.append(f"{en}｜{vi}" if vi else en)
            e["col"] = cols
            e["tip"] = clean(t.get("t", ""))
            stats["vi_tip"] += bool(e["tip"])
            if e.get("note"):
                e["note"] = clean(t.get("n", "")) or ("" if CJK.search(e["note"]) else e["note"])
            for k in ("fam", "syn", "ant"):
                e[k] = [x for x in e[k] if not CJK.search(x)]
            # list/quiz gloss in the same shape as the original: "n. nghĩa 1; nghĩa 2"
            pos = e["senses"][0]["pos"] if e["senses"] else ""
            parts = []
            for s in [s for s in e["senses"] if s["pos"] == pos][:2]:
                for p in s["zh"].split(";"):
                    p = p.strip()
                    if p and p.lower() not in (x.lower() for x in parts):
                        parts.append(p)
            gloss[e["id"]] = f"{pos} {'; '.join(parts[:4])}".strip()
            out.append(e)
        (PUB / "entries" / f.name).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    for row in idx["words"]:
        row[2] = gloss.get(row[0], row[2] if not CJK.search(row[2]) else "")
    idx["topics"] = [[k, TOPICS_VI.get(k, k)] for k, _ in idx["topics"]]
    (PUB / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
