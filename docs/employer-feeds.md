# Employer feeds

Employer feeds are the main source of jobs on Find jobs. Each one is a company's own job board, read directly from its hiring system, so the job link, the full description and the apply button are the employer's own. Adzuna and Jooble fill the gaps. When the same company is read directly, its Adzuna and Jooble listings are hidden.

This builds on `docs/jobs-import.md` (the database, the weekly import and how to set up the secrets). Read that first if you haven't.

## One-time setup after pulling this update

1. In Supabase: **SQL Editor** > **New query**, paste all of `supabase/migrations/002_employers.sql`, **Run**. (Run `001_jobs.sql` first if you never did.)
2. In GitHub: **Actions** > **Import jobs** > **Run workflow**. The first run fills the new `employers` table with the 13 employers that were in `config/employers.yaml`. After that, the table is the only list and the yaml file is never used again.
3. **Actions** > **Discover employers** > **Run workflow**. Tick **Dry run** the first time to see the report without saving anything, then run it again unticked.

No new secrets are needed.

## How discovery works

Discovery runs on the 2nd of each month, and whenever you press Run. It is separate from the weekly import.

1. **Candidates.** It reads `data/candidates.csv`, a list of Australian companies built from the lists already in this project (the company directory, the company guides and the research files), plus `data/candidates-extra.csv`, which you can add to by hand (one company per line: name, website, industry, state, source). Every month it also adds the company names that turn up most in Adzuna and Jooble results but aren't employers yet, so the list grows by itself. To rebuild `candidates.csv` after editing those lists: `node jobs-import/build-candidates.mjs`.
2. **Finding the hiring system.** For each candidate it opens the company's careers page (and its home page, and a few usual addresses such as `/careers` and `/jobs`) and looks for the hiring system's address or embed: Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Personio and Teamtailor. This is the most reliable method. It obeys the website's `robots.txt`, sends a clear bot name, and makes one request at a time to each site, with a pause between them.
3. **Name guessing (only if nothing was found).** It tries a few likely board names (at most 5 per hiring system) against the six systems with documented public boards. A guessed board is only accepted if its jobs clearly belong to the company, for example its website name appears in the job links or text.
4. **Checking.** The board is fetched once. With at least 1 Australian job it is added as `active`. If it works but has no Australian jobs, it is added as `no_au_jobs` (checked again each month). If it fails, nothing is added and the reason is in the report.
5. **Other hiring systems.** If the careers page uses Workday, PageUp, SuccessFactors, Taleo, Oracle, iCIMS, JobAdder, BambooHR or Breezy, the employer is saved as `paused` with a note, ready if you ever approve reading those (see "Not built" below).
6. **Report.** The run prints a report and saves it as `discovery-report.md` (open the finished run on the Actions tab and download the **discovery-report** file). It lists candidates checked, boards found by system, employers added, the Australian jobs they add, the top 20 new employers, and why the rest weren't added.

## Employer statuses

| Status | Meaning |
|---|---|
| `active` | Fetched every week. Its Australian jobs are on the site. |
| `no_au_jobs` | Its board works but has had no Australian jobs for 8 weeks (or when it was found). Checked again each month, and it goes back to `active` when Australian jobs appear. |
| `broken` | Its feed failed 3 weeks in a row. It isn't fetched. Each month, discovery looks at its careers page in case it moved to another hiring system, and fixes it if so. |
| `paused` | Not fetched: either you paused it, or it uses a system with no official feed. |
| `rejected` | Removed by you. It stays in the table so discovery doesn't add it again. |

## Add, pause or remove an employer (no code)

On GitHub: **Actions** > **Add or manage an employer** > **Run workflow**.

- **Add:** choose `add`, paste the company's careers page address (or any page that links to its jobs) in `careers_url`, and optionally type its name. Leave **save** unticked the first time. The log shows the hiring system it found, the board name, how many Australian jobs it has and a few job titles. If it looks right, run it again with **save** ticked.
- **Pause, resume or remove:** choose the action and type the employer's name or number in `name`.

On your own computer the same thing is `node jobs-import/add-employer.mjs <url> [--name "X"] [--save]` and `--pause`, `--resume`, `--remove "name or number"`. To test one board by hand: `node jobs-import/import-jobs.mjs --check-employer greenhouse boardname`.

## The weekly import and the numbers to watch

The weekly import now reads the `employers` table. Every active employer is fetched, a few at a time per hiring system (never more than 5 at once to one system, with a short pause between requests), and its health is recorded in the table: when it was last checked and last worked, how many jobs it had and how many were Australian.

At the end of the run's log (and in `import_runs`) you get:
- active employers, how many fetched and how many failed, and newly broken ones
- Australian jobs from employer feeds, how many were new, updated, and closed (removed because the employer no longer lists them)
- **the share of the site's jobs that come straight from employers.** This is the main progress number. Run `node jobs-import/import-jobs.mjs --report` any time to see it again.

Rules it follows:
- If an employer's fetch fails, none of its jobs are removed. If its feed comes back empty while we hold more than 5 of its jobs, nothing is removed that week either, since that looks like a glitch.
- Employer jobs stay for as long as the employer's feed lists them (see "How old listings are removed" in `jobs-import.md`).
- All industries are kept from employer feeds. To keep only engineering ones, set `"employers_engineering_only": true` in `config/search.json`.

## What shows on the site

- **Direct from employer only** (a tick box on Find jobs) shows only jobs read from the company's own board.
- **Companies hiring** (a panel on Find jobs) lists the active employers with their job counts. Choosing one shows a company page: its name, website, careers page and its current Australian jobs.
- Each employer job shows the full description with an **Apply** button that goes to the employer's own page.

## Hiring systems

| System | Status |
|---|---|
| Greenhouse, Lever (and EU Lever), Ashby, SmartRecruiters, Workable, Recruitee | Built. Documented public job board APIs. Greenhouse, Lever, Ashby and SmartRecruiters were tested against live boards. Workable and Recruitee follow their documented format; no board using them has turned up yet, so they are tested with sample data only. |
| Personio | Built. Its XML feed is documented by Personio (developer.personio.de). Tested with sample data only so far. |
| Teamtailor | Built. Its RSS feed is described in Teamtailor's support guide ("RSS feed: how-to guide"). Tested with sample data only so far. |
| BambooHR, Breezy HR | **Not built.** Their careers pages do load a public list, but neither company documents it as a public API, so it could change without notice. Ask if you want them. |
| JobAdder, PageUp | **Not built.** No official public feed was found. |
| Workday, SuccessFactors, Taleo, Oracle, iCIMS and custom sites | **Not built (Tier 3).** See below. |

### Not built: Workday and similar (Tier 3)

Many of the biggest Australian employers (universities, banks, miners, government) use these. There is no documented public feed. The two ways of reading them are Workday's internal web addresses (undocumented, can change without warning, and the employers' terms may not allow it) or the JobPosting data on careers pages (only works where the page includes it). Discovery records every such employer it meets as `paused`, so the real number of employers this would add is in the discovery report and the `employers` table (filter by status `paused`). Nothing is built for them without your approval, and if you approve, the rules are: obey robots.txt, a clear bot name with a contact address, slow requests, and a way to remove any employer that asks.

## If a hiring system changes its feed

You will see its employers turn `broken` in the weekly summary ("newly broken") after three weeks, or earlier in the log as `!` lines. Run `--check-employer` for one of them to see the error. If the whole system changed, only its adapter in `jobs-import/lib/mappers.mjs` needs updating, and the saved samples in `tests/fixtures/` show what the old answer looked like. Run `node --test` before and after.

## Files

| Path | What it is |
|---|---|
| `supabase/migrations/002_employers.sql` | The `employers` table, the link from jobs to employers, the public views and the search function |
| `jobs-import/import-jobs.mjs` | The weekly import |
| `jobs-import/discover.mjs`, `lib/discovery.mjs`, `lib/detect.mjs` | Discovery |
| `jobs-import/add-employer.mjs` | Add, pause, resume or remove an employer |
| `jobs-import/build-candidates.mjs`, `data/candidates*.csv` | The candidate list |
| `.github/workflows/discover-employers.yml`, `add-employer.yml` | The monthly discovery and the add-an-employer form |
| `tests/employers.test.mjs` | Tests for health rules, discovery, robots.txt, politeness and the new adapters |
