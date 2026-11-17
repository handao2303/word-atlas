# Translating Word Atlas into Vietnamese

Audience: Vietnamese learners preparing for IELTS (band 5–7). The goal is clear, natural,
dictionary-style Vietnamese — the kind of gloss a good Anh–Việt dictionary would give.

## Input: `vi/src/<n>.json`

An array of words. Each item:

```json
{"id": "generation", "w": "generation",
 "s": [["n.", "一代人；一代", "people born and living at roughly the same time"], ...],
 "c": ["future generations｜后代", "generation gap｜代沟"],
 "t": "表示“一代人”时可数；表示“产生”时通常不可数。",
 "n": "(optional usage note, Chinese)"}
```

`s` = senses as [part of speech, Chinese gloss, English definition].
`c` = collocations "english｜Chinese gloss".  `t` = usage tip in Chinese.

## Output: `vi/translations/<n>.json` (same number n)

ONE JSON object keyed by id, covering EVERY item of the input, in the same order:

```json
{
  "generation": {
    "s": ["thế hệ; đời", "sự tạo ra; sự phát (điện)", "thế hệ (sản phẩm)"],
    "c": ["các thế hệ tương lai", "khoảng cách thế hệ"],
    "t": "Nghĩa “thế hệ” là danh từ đếm được; nghĩa “sự tạo ra” thường không đếm được."
  }
}
```

Rules:
- `s`: exactly one string per sense, same order. A short Vietnamese gloss (1–3 meanings
  separated by "; "), NOT a long definition. Use both the Chinese gloss and the English
  definition to get the precise sense. Do not repeat the part of speech.
- `c`: exactly one string per collocation, same order: the Vietnamese meaning of the
  English phrase only (do not repeat the English).
- `t`: translate the tip into natural Vietnamese. Keep English words as they are. If the tip
  only makes sense for Chinese speakers (e.g. it is about Chinese characters or a Chinese
  word), rewrite it into something useful for Vietnamese learners about the same English
  word, or use "" if nothing useful remains.
- `n`: only if the input has `n`; translate it.
- No Chinese characters or Chinese punctuation (，；：“” etc.) anywhere in the output.
  Use Vietnamese/ASCII punctuation: , ; : “ ” ( ).
- Valid JSON (UTF-8, double quotes, escape inner double quotes or use “ ”).

Write the file in pieces if needed, but the final file must be one valid JSON object.
After writing, run `python3 scripts/vi/check_vi.py <n>` from the repo root and fix every
problem it reports until it prints `OK`.
