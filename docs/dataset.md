# Dataset format

## `data/word-atlas.json`

An array ordered along the learning path (CEFR from easy to hard, topics shuffled within a level). Each entry:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | URL-safe unique id, also the media file name, e.g. `principle`, `day-off` |
| `w` | string | Headword |
| `uk` / `us` | string | British / American IPA, with slashes |
| `senses` | `{pos, zh, en}[]` | 1–3 senses: part of speech, translated gloss, short English definition |
| `ex` | `{en, zh}[]` | Two original examples: `ex[0]` is a short everyday sentence, `ex[1]` a longer IELTS-style one |
| `col` | string[] | Common collocations, formatted `english phrase｜translation` |
| `fam` | string[] | Word family, formatted `word (pos)` |
| `syn` / `ant` | string[] | Synonyms / antonyms |
| `tip` | string | One usage or confusable-word tip |
| `cefr` | `A1`…`C2` | Estimated level |
| `topic` | string | One of 19 topics: education, work, technology, science, environment, health, society, government, economy, media, arts, travel, city, nature, daily, emotion, thinking, sport, history |
| `note` | string | Optional usage warning (offensive, dated, spelling notes, …) |

In `data/` the translated fields (`zh`, the right side of `col`, `tip`, `note`) are the upstream **Chinese**. In `public/atlas/` they hold **Vietnamese**; the field names are kept so the app and the upstream tools stay compatible. When no Vietnamese meaning exists, `senses[].zh` falls back to the English definition and `ex[].zh` is empty.

## `data/word-atlas.csv`

The same content as a table. Multi-value fields are joined with ` | `, ` ; ` or `, `. UTF-8.

## Web data in `public/atlas/`

- `index.json`: compact index; each row in `words` is `[id, word, gloss, ipa, cefrIndex, topicIndex, media]`. `gloss` is the short meaning shown in lists and quizzes. `media` is a bit mask: `1` illustration, `2` UK audio, `4` US audio, `8` example recording.
- `entries/<n>.json`: full entries, 100 per chunk; chunk `n` holds index rows `n*100` to `n*100+99`.
- `img/<id>.webp` (512px), `thumb/<id>.webp` (256px).
- `audio/uk/<id>.mp3`, `audio/us/<id>.mp3`, `audio/ex/<id>.mp3` (recording of `ex[0]`).

In production the media are served from `VITE_MEDIA_BASE` (jsDelivr) instead of `public/atlas/`. Media coverage follows the bit mask in `index.json`; do not assume every word has every file.

## License

CC BY 4.0, credit "Word Atlas contributors". See [CONTENT_LICENSE.md](../CONTENT_LICENSE.md).
