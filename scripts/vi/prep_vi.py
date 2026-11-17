"""Write compact translation sources: vi/src/<n>.json, one per entries chunk.

Each item: {"id", "w", "s": [[pos, zh, en], ...], "c": ["english｜中文", ...], "t": tip_zh, "n": note?}
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORIG = ROOT / "vi" / "orig" / "entries"
OUT = ROOT / "vi" / "src"
OUT.mkdir(parents=True, exist_ok=True)

for f in sorted(ORIG.glob("*.json"), key=lambda p: int(p.stem)):
    items = []
    for e in json.loads(f.read_text(encoding="utf-8")):
        it = {"id": e["id"], "w": e["w"], "s": [[s["pos"], s["zh"], s["en"]] for s in e["senses"]], "c": e["col"], "t": e["tip"]}
        if e.get("note"):
            it["n"] = e["note"]
        items.append(it)
    (OUT / f.name).write_text(json.dumps(items, ensure_ascii=False, indent=0), encoding="utf-8")
print(len(list(OUT.glob("*.json"))), "chunks")
