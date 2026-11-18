-- Word Atlas (bản tiếng Việt): bảng lưu tiến độ học, mỗi người chỉ đọc/ghi được dòng của mình.
create table if not exists public.word_atlas_sync (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  dataset_id text not null,
  progress jsonb not null,
  settings jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, dataset_id)
);

alter table public.word_atlas_sync enable row level security;

drop policy if exists "read own progress" on public.word_atlas_sync;
drop policy if exists "insert own progress" on public.word_atlas_sync;
drop policy if exists "update own progress" on public.word_atlas_sync;

create policy "read own progress" on public.word_atlas_sync
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own progress" on public.word_atlas_sync
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own progress" on public.word_atlas_sync
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
