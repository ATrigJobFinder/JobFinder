-- Messages from the Contact or help page. Run once in Supabase (SQL Editor > New query > paste > Run). Safe to run again.
-- Anyone can send a message; nobody can read them with the public key. You read them in Supabase: Table Editor > support_messages.
create table if not exists public.support_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text check (char_length(name) <= 80),
  email       text not null check (char_length(email) between 5 and 160),
  kind        text check (char_length(kind) <= 40),
  message     text not null check (char_length(message) between 10 and 4000),
  page        text check (char_length(page) <= 60),
  handled     boolean not null default false
);
alter table public.support_messages enable row level security;
drop policy if exists "Anyone can send a message" on public.support_messages;
create policy "Anyone can send a message" on public.support_messages for insert to anon, authenticated with check (true);
grant insert on public.support_messages to anon, authenticated;
