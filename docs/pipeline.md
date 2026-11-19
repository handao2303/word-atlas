# Content pipeline

There are two pipelines: the upstream one that generated the original Chinese/English content, media and audio, and this edition's Vietnamese translation step.

## Vietnamese translation (this edition)

```bash
python3 scripts/vi/prep_vi.py     # extract upstream data into vi/orig/, write vi/src/<n>.json
# translate each chunk into vi/translations/<n>.json, following vi/TRANSLATE.md
python3 scripts/vi/check_vi.py    # every word present, counts match, no Chinese left
python3 scripts/vi/apply_vi.py    # write the Vietnamese fields into public/atlas/
```

`apply_vi.py` always starts from the upstream originals (extracted from the pinned upstream commit), so it can be re-run safely after editing a translation.

## Upstream generation

All upstream scripts are in `scripts/atlas/`. They read credentials only from environment variables or a directory outside the repository (see [SECURITY.md](../SECURITY.md)). Intermediate files go to the git-ignored `.local/forge/`, so runs can resume.

1. **Headwords:** `.local/forge/headwords.json`, each item `{hid, word, raw}`. `raw` is an optional sense hint used only to decide which senses matter; it is never copied into the output.
2. **Entry text** `gen_text.py`: batches of 10 words, generated as JSON following the writing rules in [`gen_text.py`](../scripts/atlas/gen_text.py) (accuracy first, original sentences, two example types, no invented etymology, neutral and safe). The prompts produce Chinese glosses.
3. **Illustrations** `gen_images.py`: each entry carries a `scene` description, combined with a shared style prompt to render a 1024px image, compressed to a 768px WebP master. Generated in learning-path order.
4. **Pronunciation** `gen_word_audio.py`: ElevenLabs, UK voice "Alice" and US voice "Sarah".
5. **Example recordings** `gen_sentence_audio.py`: reads `ex[0]` aloud, in learning-path order.
6. **Build** `build_atlas.py`: cleans fields, sorts, chunks, and writes `public/atlas/` and `data/`.
7. **Check** `npm run check:atlas`: structure, ordering, references and media files.

```bash
export SUB2_BASE_URL=... SUB2_API_KEY=... ELEVENLABS_API_KEY=...
python3 scripts/atlas/gen_text.py --workers 8
python3 scripts/atlas/gen_images.py --workers 8 --follow
python3 scripts/atlas/gen_word_audio.py
python3 scripts/atlas/gen_sentence_audio.py --follow
python3 scripts/atlas/build_atlas.py
npm run check:atlas
```

`SUB2_BASE_URL` points at any OpenAI-compatible API. Re-running `build_atlas.py` overwrites `public/atlas/` with Chinese text; run `scripts/vi/apply_vi.py` afterwards.

## Quality limits

Automatic checks cover structure, fields, ordering and files, not semantic correctness. Illustrations, examples and translations were not proofread entry by entry; please open an issue or pull request when you find a problem.
