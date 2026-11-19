-- Leaderboard: each user writes a small public summary (stats) alongside their progress.
-- Any signed-in user can read everyone's summary through word_atlas_leaderboard();
-- the detailed progress column stays private to its owner (RLS on the table is unchanged).
alter table public.word_atlas_sync
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists stats jsonb not null default '{}'::jsonb;

create or replace function public.word_atlas_leaderboard(p_dataset text)
returns table (user_id uuid, display_name text, avatar_url text, stats jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.user_id, s.display_name, s.avatar_url, s.stats, s.updated_at
  from public.word_atlas_sync s
  where s.dataset_id = p_dataset
    and auth.uid() is not null;
$$;

revoke all on function public.word_atlas_leaderboard(text) from public, anon;
grant execute on function public.word_atlas_leaderboard(text) to authenticated;
