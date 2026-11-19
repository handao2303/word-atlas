<div align="center">

<img src="docs/assets/cover-v2.jpg" alt="Word Atlas — illustrated IELTS vocabulary" width="100%">

# Word Atlas · Vietnamese edition

**Illustrated IELTS vocabulary for Vietnamese learners: 7,298 words, UK/US audio, spaced repetition, Google sign-in, cloud sync and a friends leaderboard.**

[Live site](https://word-atlas-vi.vercel.app) (invite only) · [Upstream project](https://github.com/designfuchen/word-atlas) · [Dataset format](docs/dataset.md)

[![Code: MIT](https://img.shields.io/badge/Code-MIT-17283B?style=flat-square)](LICENSE)
[![Dataset: CC BY 4.0](https://img.shields.io/badge/Dataset-CC_BY_4.0-AD5038?style=flat-square)](CONTENT_LICENSE.md)

</div>

---

This is a fork of [词光 · Word Atlas](https://github.com/designfuchen/word-atlas) by [@designfuchen](https://github.com/designfuchen), an open-source illustrated IELTS vocabulary app. The original targets Chinese speakers. This edition:

- translates the whole interface into **Vietnamese**;
- adds **Vietnamese meanings** for all 13,733 senses, 24,722 collocations and 7,298 usage tips (English definitions are kept next to them);
- adds **Google sign-in** (Supabase Auth), restricted to an allow-list;
- **syncs progress** across devices with a conflict-free merge;
- adds a **leaderboard** so a study group can see who is putting in the work;
- serves the 37k illustration and audio files from a CDN so the app fits on Vercel's free tier.

Everything else — the illustrations, recordings, FSRS scheduler, word galaxy and typing studio — comes from the upstream project.

## Features

| | |
| :--- | :--- |
| **Look** | One original illustration per word, Vietnamese meanings plus the English definition, two example sentences, collocations, word family and a usage tip. |
| **Listen** | UK and US pronunciation and a recording of the everyday example for every word. |
| **Recall** | Meaning quiz, picture cloze, listening and spelling, scheduled by [FSRS](https://github.com/open-spaced-repetition/ts-fsrs). Only the first answer counts. |
| **Search** | English prefix search, or Vietnamese meanings with or without diacritics (`moi truong` finds *environment*). |
| **Sync** | Sign in with Google and continue on any device. Offline study merges cleanly when you reconnect. |
| **Compete** | Leaderboard by answers this week, words mastered, words learned or current streak. Only totals are shared, never the word list. |

## Architecture

```
Browser ──► Vercel        app bundle + Vietnamese word data (≈15 MB)
        ──► jsDelivr      illustrations and audio, pinned to an upstream commit
        ──► Supabase      Google sign-in, progress sync, leaderboard RPC
                 └─► Google OAuth (Testing mode; test users are the allow-list)
```

- **Frontend:** React 19, TypeScript, Vite, ts-fsrs, WebGL2 (galaxy view).
- **Data:** `public/atlas/index.json` (compact index) and `public/atlas/entries/<n>.json` (100 entries per chunk). The `zh` fields hold the Vietnamese text in this edition.
- **Backend:** one Supabase table, `word_atlas_sync`, with row level security, plus the `word_atlas_leaderboard()` function. See [`supabase/`](supabase).

### Access control

Only Google sign-in is enabled in Supabase; email, phone and anonymous sign-in are off. The Google OAuth client is in **Testing** mode, so Google only lets listed test users through. To give someone access, add their Gmail address under *Google Auth Platform → Audience → Test users*. Their Supabase account is created on first sign-in.

### Sync and merge

Each device keeps progress in `localStorage` and pushes it to Supabase a few seconds after a change. On load (and when the tab regains focus) the client pulls the remote copy and merges it ([`src/store/merge.ts`](src/store/merge.ts)):

- each card keeps whichever side was reviewed most recently, so no review is lost;
- daily stats take the per-field maximum;
- bookmarks, mistakes and settings follow the newer copy.

### Leaderboard

Every push also writes the user's display name, avatar and a small summary ([`src/store/stats.ts`](src/store/stats.ts)): words learned, words mastered, streak and the last eight days of activity. `word_atlas_leaderboard()` is a `security definer` function that returns these summaries to signed-in users only, so the private `progress` column never leaves its owner. Stale weeks and lapsed streaks count as zero for the viewer.

## Run locally

Requires **Node.js 20+**. The repository contains every illustration and recording, so the first clone is large (≈1.4 GB).

```bash
git clone https://github.com/handao2303/word-atlas.git
cd word-atlas
npm ci
npm run dev        # http://localhost:5188
```

Without Supabase variables the app runs local-only: no sign-in, progress stays in the browser, and the leaderboard page explains that it needs the online version.

```bash
npm test             # unit tests (merge, stats, typing, text, SRS)
npm run check:atlas  # dataset structure and media checks
npm run build        # static build in dist/
```

## Deploy

1. **Supabase:** create a project and run [`supabase/schema.sql`](supabase/schema.sql) and then [`supabase/leaderboard.sql`](supabase/leaderboard.sql) in the SQL editor. Under *Authentication → Sign In / Providers*, enable Google, disable Email, and keep anonymous sign-ins off. Add your site URL to *URL Configuration*.
2. **Google Cloud:** create an OAuth client of type *Web application* with the redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, keep the app in Testing mode and add test users. Paste the client ID and secret into the Supabase Google provider.
3. **Vercel:** import the repository and set these environment variables:

   | Variable | Value |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | the project's anon / publishable key |
   | `VITE_MEDIA_BASE` | `https://cdn.jsdelivr.net/gh/designfuchen/word-atlas@0f1bae41fe5428f0f44781e60282525407b5ae46/public/atlas` |

   [`.vercelignore`](.vercelignore) keeps the media out of the upload; the build serves them from `VITE_MEDIA_BASE`.

All three `VITE_*` values end up in the browser bundle and are safe to publish. Never put the Supabase `service_role` key or the Google client secret in the repository.

## Translation workflow

The Vietnamese data was produced from the upstream Chinese glosses and English definitions:

```bash
python3 scripts/vi/prep_vi.py     # split the original data into vi/src/<n>.json
# translate each chunk into vi/translations/<n>.json (format: vi/TRANSLATE.md)
python3 scripts/vi/check_vi.py    # validate counts, leftover Chinese, missing items
python3 scripts/vi/apply_vi.py    # merge into public/atlas/
```

The originals are re-extracted from the upstream commit when needed, so `vi/orig/` and `vi/src/` are not committed. Fixes to a meaning go into `vi/translations/` followed by `apply_vi.py`.

## Project layout

```
src/
  atlas/        data loading and types
  lib/cloud.ts  Supabase client, sign-in, sync, leaderboard fetch
  pages/        Today, Atlas, Learn, Practice, Rank, Me, About
  store/        local store, FSRS wrapper, merge and public stats
  ui/           shared components (AuthGate, EntryView, Palette, …)
public/atlas/   word index, entry chunks, illustrations, audio
scripts/vi/     Vietnamese translation pipeline
scripts/atlas/  upstream content-generation pipeline (Chinese)
supabase/       SQL for the sync table and leaderboard
docs/           dataset format, learning model, upstream READMEs
```

## Content and limitations

Definitions, examples, illustrations and recordings were generated by the upstream project with AI models and checked automatically, not proofread entry by entry. The Vietnamese meanings were also machine-translated and spot-checked. Expect occasional mistakes; corrections are welcome. This is not an official IELTS word list.

## License and credits

- Code: [MIT](LICENSE), from [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas) with changes in this fork.
- Dataset, illustrations and recordings: [CC BY 4.0](CONTENT_LICENSE.md), credit **Word Atlas contributors (词光)**. This fork modifies the dataset by replacing the Chinese text with Vietnamese translations.
- Recordings: ElevenLabs voices "Alice" (UK) and "Sarah" (US), as described upstream.
