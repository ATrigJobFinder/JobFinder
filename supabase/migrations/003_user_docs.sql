-- Job Finder accounts: run this once in your Supabase project (SQL Editor › New query › Run).
-- One row per saved document per person: their resume profile, cover letters, applications, practice and so on.
-- Row level security means each person can only ever read and change their own rows.

create table if not exists public.user_docs (
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 64),
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, name)
);

alter table public.user_docs enable row level security;

drop policy if exists "Read own docs" on public.user_docs;
drop policy if exists "Add own docs" on public.user_docs;
drop policy if exists "Change own docs" on public.user_docs;
drop policy if exists "Delete own docs" on public.user_docs;

create policy "Read own docs" on public.user_docs for select to authenticated using (auth.uid() = user_id);
create policy "Add own docs" on public.user_docs for insert to authenticated with check (auth.uid() = user_id);
create policy "Change own docs" on public.user_docs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own docs" on public.user_docs for delete to authenticated using (auth.uid() = user_id);

-- Keep one document to a sensible size (a resume profile with saved versions is well under this).
alter table public.user_docs drop constraint if exists user_docs_body_size;
alter table public.user_docs add constraint user_docs_body_size check (pg_column_size(body) < 2000000);
