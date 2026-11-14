-- The employers on the Unlisted jobs page (everyone without a full guide). Run once in Supabase
-- (SQL Editor > New query > paste > Run). Safe to run again.
-- Then fill the table from data/directory/ with:  npm run seed:directory   (see docs/26-directory-in-supabase.md)
-- Anyone can read these rows with the public key; only the seed script (service role key) can change them.
create table if not exists public.directory_employers (
  slug         text primary key,                          -- the name in lower case with dashes, e.g. "bendigo-and-adelaide-bank"
  name         text not null,
  sort_key     text collate "C" not null,                 -- the name in lower case, for A to Z order
  industry     text not null,                             -- a key of GUIDE_INDUSTRIES, e.g. "banking"
  size         text not null check (size in ('small', 'medium', 'large', 'global')),
  size_rank    smallint not null,                         -- 0 small … 3 global, for ordering by size
  states       text[] not null,                           -- e.g. {NSW,VIC} or {National}
  careers_url  text not null,
  grad_url     text,
  asx          text,
  profile      jsonb not null default '{}'::jsonb,        -- about (paragraphs), spec, staff, hq, roles, social, advice
  search       text not null,                             -- everything the Search box looks in, in lower case
  updated_at   timestamptz not null default now()
);
create index if not exists directory_employers_industry on public.directory_employers (industry, size_rank desc, sort_key);
create index if not exists directory_employers_order on public.directory_employers (size_rank desc, sort_key);

alter table public.directory_employers enable row level security;
drop policy if exists "Anyone can read the directory" on public.directory_employers;
create policy "Anyone can read the directory" on public.directory_employers for select to anon, authenticated using (true);
grant select on public.directory_employers to anon, authenticated;

-- How many employers match the filters, by industry. The page uses this for the totals and the industry headings,
-- so it never has to download the whole list. q is the search text, sz a size or 'all', st a state or 'all'.
create or replace function public.directory_counts(q text default '', sz text default 'all', st text default 'all')
returns table (industry text, n integer)
language sql stable security invoker set search_path = public
as $$
  select d.industry, count(*)::int
  from public.directory_employers d
  where (sz = 'all' or d.size = sz)
    and (st = 'all' or d.states && array[st, 'National'])
    and (coalesce(q, '') = '' or position(lower(q) in d.search) > 0)
  group by d.industry
$$;
grant execute on function public.directory_counts(text, text, text) to anon, authenticated;
