-- Leaderboard: each user writes a small public summary (stats) alongside their progress.
-- Any signed-in user can read everyone's summary through word_atlas_leaderboard();
-- the detailed progress column stays private to its owner (RLS on the table is unchanged).
alter table public.word_atlas_sync
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists stats jsonb not null default '{}'::jsonb;

-- Lists every account (so people who signed in but have not studied yet still appear),
-- with the part of the email before "@" as a recognisable name. Full emails are not exposed.
drop function if exists public.word_atlas_leaderboard(text);
create function public.word_atlas_leaderboard(p_dataset text)
returns table (
  user_id uuid,
  email_name text,
  display_name text,
  avatar_url text,
  stats jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id,
    split_part(u.email, '@', 1),
    coalesce(s.display_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    coalesce(s.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
    coalesce(s.stats, '{}'::jsonb),
    s.updated_at
  from auth.users u
  left join public.word_atlas_sync s
    on s.user_id = u.id and s.dataset_id = p_dataset
  where auth.uid() is not null
    and u.deleted_at is null;
$$;

revoke all on function public.word_atlas_leaderboard(text) from public, anon;
grant execute on function public.word_atlas_leaderboard(text) to authenticated;
