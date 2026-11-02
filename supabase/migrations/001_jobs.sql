-- Australian jobs import: run this once in your Supabase project (SQL Editor > New query > paste > Run).
-- It is safe to run again: nothing is dropped except the view and function, which are recreated.

create table if not exists public.jobs (
  id              bigint generated always as identity primary key,
  source          text not null,          -- 'adzuna' | 'jooble' | 'employer:greenhouse' | 'employer:lever' | ...
  source_id       text not null,          -- the job's ID at the source (for employer feeds: "<board token>:<id>")
  title           text not null,
  company         text,
  location        text,                   -- display text, e.g. "Parramatta, NSW"
  city            text,
  state           text,                   -- NSW, VIC, QLD, WA, SA, TAS, ACT, NT, or null
  is_remote       boolean default false,
  description     text,                   -- sanitised HTML or plain text; a snippet for aggregators
  salary_min      numeric,
  salary_max      numeric,
  salary_text     text,
  job_type        text,                   -- full time, part time, contract, casual...
  category        text,
  url             text not null,          -- the link a visitor clicks
  posted_at       timestamptz,            -- date the source says it was posted
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  dedupe_key      text not null,          -- hash of title + company + city, the same across sources
  search          tsvector generated always as (
                    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(description, '')), 'C')
                  ) stored,
  unique (source, source_id)
);

create index if not exists jobs_search_idx on public.jobs using gin (search);
create index if not exists jobs_state_idx on public.jobs (state);
create index if not exists jobs_posted_idx on public.jobs (posted_at desc);
create index if not exists jobs_dedupe_idx on public.jobs (dedupe_key);

-- One row per import run
create table if not exists public.import_runs (
  id              bigint generated always as identity primary key,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text,                   -- ok | partly failed | failed | dry run
  dry_run         boolean not null default false,
  summary         jsonb,                  -- per source: fetched, inserted, updated, skipped
  api_calls       jsonb,                  -- calls used per source
  deleted_old     integer default 0,      -- listings removed for being older than MAX_AGE_DAYS
  deleted_closed  integer default 0,      -- employer jobs removed because the employer's feed no longer lists them
  errors          jsonb
);
create index if not exists import_runs_started_idx on public.import_runs (started_at desc);

-- Row level security: the public (anon) key can only read. Only the import script, with the secret service key, can write.
alter table public.jobs enable row level security;
alter table public.import_runs enable row level security;
drop policy if exists "Anyone can read jobs" on public.jobs;
create policy "Anyone can read jobs" on public.jobs for select to anon, authenticated using (true);
-- (import_runs has no policy: the public key can't read it. The site reads only the view below.)

-- One row per duplicate group: an employer's own listing first, then Adzuna, then Jooble, then the newest.
-- security_invoker makes the view obey the policy on the jobs table.
drop view if exists public.jobs_public cascade;
create view public.jobs_public with (security_invoker = true) as
select distinct on (dedupe_key)
  id, source, source_id, title, company, location, city, state, is_remote, description,
  salary_min, salary_max, salary_text, job_type, category, url, posted_at, first_seen_at, last_seen_at, dedupe_key, search
from public.jobs
order by dedupe_key,
  case when source like 'employer:%' then 0 when source = 'adzuna' then 1 else 2 end,
  coalesce(posted_at, first_seen_at) desc;

-- Keyword search on the view: full-text, best match first, then newest. Also gives the total for paging.
create or replace function public.search_jobs(
  q text default '', p_state text default '', p_category text default '', p_type text default '', p_where text default '',
  lim integer default 20, off integer default 0
) returns table (
  id bigint, source text, title text, company text, location text, city text, state text, is_remote boolean, description text,
  salary_min numeric, salary_max numeric, salary_text text, job_type text, category text, url text, posted_at timestamptz, first_seen_at timestamptz,
  total bigint
) language sql stable security invoker set search_path = public as $$
  select j.id, j.source, j.title, j.company, j.location, j.city, j.state, j.is_remote, left(j.description, 6000),
         j.salary_min, j.salary_max, j.salary_text, j.job_type, j.category, j.url, j.posted_at, j.first_seen_at,
         count(*) over () as total
  from public.jobs_public j
  where (coalesce(q, '') = '' or j.search @@ websearch_to_tsquery('english', q))
    and (coalesce(p_state, '') = '' or j.state = p_state)
    and (coalesce(p_category, '') = '' or j.category = p_category)
    and (coalesce(p_type, '') = '' or j.job_type = p_type)
    and (coalesce(p_where, '') = '' or j.location ilike '%' || p_where || '%' or (lower(p_where) = 'remote' and j.is_remote))
  order by case when coalesce(q, '') = '' then 0 else ts_rank(j.search, websearch_to_tsquery('english', q)) end desc,
           coalesce(j.posted_at, j.first_seen_at) desc
  limit least(greatest(lim, 1), 100) offset greatest(off, 0)
$$;

-- "Last updated": the finish time of the latest successful run, and nothing else about the runs
drop view if exists public.last_import;
create view public.last_import as
select max(finished_at) as finished_at from public.import_runs where status in ('ok', 'partly failed') and not dry_run;

grant select on public.jobs_public to anon, authenticated;
grant select on public.last_import to anon, authenticated;
grant execute on function public.search_jobs(text, text, text, text, text, integer, integer) to anon, authenticated;
