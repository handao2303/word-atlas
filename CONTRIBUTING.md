# Contributing

Thanks for helping make Word Atlas better for Vietnamese learners.

## Fixing a word

Corrections are the most valuable contribution. Open an issue with the word `id`, the problem and a suggested fix, or send a pull request:

1. Vietnamese meanings, collocations and tips live in `vi/translations/<n>.json`. Edit the entry there, then run `python3 scripts/vi/check_vi.py <n>` and `python3 scripts/vi/apply_vi.py` to rebuild `public/atlas/`.
2. Problems with the English definition, examples, illustration or audio come from the upstream dataset; see [docs/pipeline.md](docs/pipeline.md) and consider reporting them to [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas) as well.
3. Run `npm run check:atlas` and `npm test`.
4. Explain the change in the pull request and link a reliable dictionary when relevant.

## Code

- TypeScript strict mode and React function components; no state-management or UI framework dependencies.
- Code, comments, commit messages and documentation are in English. User-facing text is in Vietnamese.
- Keep the app local-first: it must work without Supabase variables (local-only mode).
- Check visual changes in light and dark themes and at 375px phone width.
- Before committing, run `npm test`, `npm run check:atlas` and `npm run build`.

## New content

When adding images, recordings or text, state their source and license. Only content that can be redistributed under CC BY 4.0 is accepted.

## Security

Never paste API keys, the Supabase `service_role` key or the Google client secret into issues, pull requests, screenshots or logs. See [SECURITY.md](SECURITY.md).
