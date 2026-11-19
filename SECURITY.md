# Security and privacy

## Where data lives

- **Progress** is stored in the browser's `localStorage` and, when signed in, in the Supabase table `word_atlas_sync`. Row level security lets each user read and write only their own rows.
- **Leaderboard data** is a small public summary per user (display name, Google avatar URL, words learned and mastered, streak, the last eight days of answer counts). Every signed-in user can read these summaries through `word_atlas_leaderboard()`; the detailed progress column stays private.
- **Sign-in** uses Google OAuth through Supabase Auth. The app never sees passwords. Email, phone and anonymous sign-in are disabled, and the Google client is in Testing mode, so only listed test users can sign in.
- There is no analytics or third-party tracking. Imported backups are validated field by field and malformed data is dropped.

## Credentials

- The browser only needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_MEDIA_BASE`. These are bundled into the client and are safe to publish; the anon key is limited by row level security.
- Never commit or expose the Supabase `service_role` key or the Google OAuth client secret. The client secret lives only in the Supabase Google provider settings.
- The upstream content scripts in `scripts/atlas/` read model API keys from environment variables (`SUB2_BASE_URL`, `SUB2_API_KEY`, `ELEVENLABS_API_KEY`) or a directory outside the repository (`ATLAS_SECRETS`). Do not store secrets in `VITE_*` variables.
- If a credential leaks, revoke or rotate it with the provider immediately.

## Reporting

Please report security issues privately through GitHub (*Security → Report a vulnerability*) instead of opening a public issue.
