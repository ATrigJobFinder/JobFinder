-- Employers live in the database (run this once in Supabase: SQL Editor > New query > paste > Run).
-- Safe to run again. It adds the employers table, links jobs to employers, hides aggregator listings for companies we already read
-- directly, and updates the search function and views.

create table if not exists public.employers (
  id                  bigint generated always as identity primary key,
  name                text not null,
  website             text,
  ats                 text not null,       -- greenhouse | lever | lever_eu | ashby | workable | smartrecruiters | recruitee | personio | teamtailor | (unsupported ones such as workday, pageup, bamboohr are saved as 'paused')
  token               text not null,       -- board name / slug / company ID for that system
  careers_url         text,
  status              text not null default 'active',   -- active | paused | broken | no_au_jobs | rejected
  discovered_via      text,                -- manual | careers_page | slug_probe | list:<name>
  industry            text,
  hq_state            text,
  last_checked_at     timestamptz,
  last_success_at     timestamptz,
  last_total_jobs     int,
  last_au_jobs        int,
  consecutive_errors  int not null default 0,
  notes               text,
  created_at          timestamptz not null default now(),
  -- extras used by the importer
  name_key            text,                -- the name with "Pty Ltd" and the like removed, to match aggregator listings
  zero_au_weeks       int not null default 0,
  last_error          text,
  unique (ats, token)
);
create index if not exists employers_status_idx on public.employers (status);
create index if not exists employers_name_key_idx on public.employers (name_key);

alter table public.employers enable row level security;   -- no policy: the public key can't read this table, only the views below

alter table public.jobs add column if not exists employer_id bigint references public.employers (id) on delete set null;
alter table public.jobs add column if not exists company_key text;
create index if not exists jobs_employer_idx on public.jobs (employer_id);
create index if not exists jobs_company_key_idx on public.jobs (company_key);

-- Companies we read directly, safe for the public to see (no health details)
drop view if exists public.employers_public cascade;
create view public.employers_public as
select id, name, website, careers_url, industry, hq_state, last_au_jobs as au_jobs, last_success_at
from public.employers where status = 'active' and coalesce(last_au_jobs, 0) > 0;

-- Names of companies whose own feed is read: their Adzuna and Jooble listings are hidden, since the employer's own listing replaces them
drop view if exists public.employers_covered cascade;
create view public.employers_covered as
select distinct name_key from public.employers where status = 'active' and coalesce(last_au_jobs, 0) > 0 and name_key is not null and name_key <> '';

-- One row per duplicate group; an employer's own listing first, then Adzuna, then Jooble, then the newest.
drop view if exists public.jobs_public cascade;
create view public.jobs_public with (security_invoker = true) as
select distinct on (dedupe_key)
  id, source, source_id, title, company, location, city, state, is_remote, description,
  salary_min, salary_max, salary_text, job_type, category, url, posted_at, first_seen_at, last_seen_at, dedupe_key, search, employer_id
from public.jobs j
where j.source like 'employer:%' or j.company_key is null or j.company_key = '' or j.company_key not in (select name_key from public.employers_covered)
order by dedupe_key,
  case when source like 'employer:%' then 0 when source = 'adzuna' then 1 else 2 end,
  coalesce(posted_at, first_seen_at) desc;

-- Search: full-text, best match first then newest. p_direct = only jobs read from the employer's own board. p_employer = one company.
drop function if exists public.search_jobs(text, text, text, text, text, integer, integer);
create or replace function public.search_jobs(
  q text default '', p_state text default '', p_category text default '', p_type text default '', p_where text default '',
  lim integer default 20, off integer default 0, p_direct boolean default false, p_employer bigint default null
) returns table (
  id bigint, source text, title text, company text, location text, city text, state text, is_remote boolean, description text,
  salary_min numeric, salary_max numeric, salary_text text, job_type text, category text, url text, posted_at timestamptz, first_seen_at timestamptz,
  employer_id bigint, total bigint
) language sql stable security invoker set search_path = public as $$
  select j.id, j.source, j.title, j.company, j.location, j.city, j.state, j.is_remote, left(j.description, 20000),
         j.salary_min, j.salary_max, j.salary_text, j.job_type, j.category, j.url, j.posted_at, j.first_seen_at, j.employer_id,
         count(*) over () as total
  from public.jobs_public j
  where (coalesce(q, '') = '' or j.search @@ websearch_to_tsquery('english', q))
    and (coalesce(p_state, '') = '' or j.state = p_state)
    and (coalesce(p_category, '') = '' or j.category = p_category)
    and (coalesce(p_type, '') = '' or j.job_type = p_type)
    and (coalesce(p_where, '') = '' or j.location ilike '%' || p_where || '%' or (lower(p_where) = 'remote' and j.is_remote))
    and (not coalesce(p_direct, false) or j.source like 'employer:%')
    and (p_employer is null or j.employer_id = p_employer)
  order by case when coalesce(q, '') = '' then 0 else ts_rank(j.search, websearch_to_tsquery('english', q)) end desc,
           coalesce(j.posted_at, j.first_seen_at) desc
  limit least(greatest(lim, 1), 100) offset greatest(off, 0)
$$;

grant select on public.jobs_public to anon, authenticated;
grant select on public.employers_public to anon, authenticated;
grant select on public.employers_covered to anon, authenticated;
grant execute on function public.search_jobs(text, text, text, text, text, integer, integer, boolean, bigint) to anon, authenticated;
