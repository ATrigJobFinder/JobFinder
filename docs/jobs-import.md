# Weekly jobs import

Every Sunday night (about 3am Monday in Sydney) a free GitHub Actions job collects current Australian **engineering** jobs from three places, saves them in a free Supabase database, deletes anything older than 30 days (see the note below about employers), and the **Find jobs** page reads them.

```
GitHub Actions (weekly) -> jobs-import/import-jobs.mjs -> Supabase database
                                                              ^
Netlify website (Find jobs) -- public read-only key ----------+
```

The website never writes to the database, and the import never runs on the website's host.

| Source | What it is | Notes |
|---|---|---|
| Employer feeds | Public job-board feeds from Greenhouse, Lever, Ashby, Workable, SmartRecruiters and Recruitee | The employers are listed in `config/employers.yaml` |
| Adzuna | Adzuna's job search API | Needs the Adzuna **app id** and **app key** |
| Jooble | Jooble's job search API | Needs the Jooble key |

Only Australian jobs are kept. Engineering is decided by the job title (see `jobs-import/lib/engineering.mjs`). To widen it, set `"engineering_only": false` in `config/search.json`.

---

## Set it up once

### 1. Create the free database (Supabase)

1. Go to **supabase.com** and sign up (the GitHub button is quickest). Choose **New project**, name it `jobfinder`, pick a database password (save it somewhere, you won't need it again), and choose the region **Southeast Asia (Singapore)** or **Australia (Sydney)** if it's offered. Wait a minute or two while it's created.
2. In the left menu open **SQL Editor** > **New query**. Open the file `supabase/migrations/001_jobs.sql` from this project, copy everything, paste it in, and press **Run**. You should see "Success". That creates the tables and the rules that let the public read jobs and nothing else.
3. In the left menu open **Project Settings** (the gear) > **API**. You need three things from this page:
   - **Project URL** (looks like `https://abcdefghijkl.supabase.co`)
   - the **anon / public** key (a long code). It's meant to be public: it can only read.
   - the **service_role / secret** key (another long code). **This one can change everything. Never put it in the website, in code, or in a chat.** It only goes into GitHub's secrets (step 3).

### 2. Tell the website where the database is

In `src/scripts/07a-account-config.js` fill in `JOBS_CFG` with the Project URL and the **anon** key (never the service key). Save, commit and push; Netlify rebuilds the site. Until you do, Find jobs shows its example jobs.

### 3. Give GitHub the secrets

In your GitHub repository: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**. Add each of these (name on the left, value on the right):

| Secret name | Value |
|---|---|
| `SUPABASE_URL` | the Project URL |
| `SUPABASE_SERVICE_KEY` | the **service_role** key |
| `SUPABASE_ANON_KEY` | the **anon** key (used only by the keep-alive job) |
| `ADZUNA_APP_ID` | Adzuna app id (the short code, about 8 characters) |
| `ADZUNA_APP_KEY` | Adzuna app key (the long code, 32 characters) |
| `JOOBLE_API_KEY` | your Jooble key |

Optional settings go on the **Variables** tab of the same page (not secrets): `ADZUNA_MAX_CALLS_PER_RUN`, `JOOBLE_MAX_CALLS_PER_RUN` (both default to 200) and `MAX_AGE_DAYS` (default 30).

### 4. Run it

On GitHub open the **Actions** tab > **Import jobs** > **Run workflow**. Tick **Dry run** the first time: it fetches and counts but writes nothing. Then run it again without the tick for the real import. After that it runs every Sunday by itself.

---

## Day to day

**Add an employer.** Find the company's job page. If its address looks like `boards.greenhouse.io/NAME`, `jobs.lever.co/NAME`, `jobs.ashbyhq.com/NAME`, `apply.workable.com/NAME`, `jobs.smartrecruiters.com/NAME` or `NAME.recruitee.com`, then `NAME` is the token. Test it:

```
node jobs-import/import-jobs.mjs --check-employer greenhouse NAME
```

It prints how many Australian engineering jobs it found. If that's more than zero, add three lines to `config/employers.yaml`:

```yaml
- name: Example Company
  ats: greenhouse
  token: NAME
  active: true
```

Companies on other systems (Workday, SuccessFactors, their own site) can't be read this way. That includes most large engineering consultancies, so Adzuna and Jooble cover them instead.

**Change the call budgets.** On GitHub: **Settings** > **Secrets and variables** > **Actions** > **Variables**: set `ADZUNA_MAX_CALLS_PER_RUN` or `JOOBLE_MAX_CALLS_PER_RUN`. Each run stops cleanly when its budget is used and says so in the log. Adzuna is searched page 1 of every city first, then page 2 of every city, so even a small budget covers the whole country. If a city is missing from Find jobs, check the variable isn't set too low (the default is 200). Adzuna's free plan allows roughly 1,000 calls a month, so 200 a week is about right; check your own limit on your Adzuna dashboard. To change what is searched for (categories, keywords, cities) edit `config/search.json`.

**Run it by hand.** Actions tab > Import jobs > Run workflow. On your own computer: copy `.env.example` to `.env`, fill it in, then `node jobs-import/import-jobs.mjs` (add `DRY_RUN=true` to only count).

**See what happened.** Each run's log is on the Actions tab. The database keeps a summary of every run for 90 days in the `import_runs` table (Supabase: **Table Editor** > `import_runs`): counts fetched, added and updated per source, calls used, rows deleted and any problems. `node jobs-import/import-jobs.mjs --report` prints totals by source and state.

**If a source stops working.** The other sources still run, and the run only fails (and GitHub emails you) if every source failed. Open the failed run's log and look for the `!` lines.
- *Adzuna or Jooble errors (401, 403):* the key is wrong or has been switched off. Check it on their site and update the secret.
- *Adzuna or Jooble 429:* you've hit their limit. Lower the budget, or wait.
- *One employer fails:* it is skipped and **none of its existing jobs are deleted**. Run `--check-employer` for it; if the board has been renamed or moved to a different system, fix or remove its line in `config/employers.yaml`.

---

## How old listings are removed

- **Adzuna and Jooble** listings are removed 30 days after their posted date (`MAX_AGE_DAYS`).
- **Employers' own jobs** are removed as soon as the employer's feed stops listing them (the job has closed). A job still open on the employer's page stays, however long ago it was first posted, so a job that has been open for 40 days is not deleted and re-added every week. If an employer is taken out of `config/employers.yaml`, its jobs go 30 days after they were last seen. If you would rather remove employer jobs by posted date too, change `deleteOld` in `jobs-import/lib/db.mjs`.
- If a feed can't be fetched, none of that employer's jobs are removed.

## Two things that can switch it off

- **GitHub pauses scheduled workflows after 60 days with no commits to the repository.** GitHub emails you before it does. To notice: the Actions tab shows a banner "This scheduled workflow is disabled because there hasn't been activity in this repository for at least 60 days", and "Last updated" on Find jobs stops moving. To fix it, open the workflow and press **Enable workflow**, or make any small commit.
- **Free Supabase projects pause after about a week with no activity.** Visitors to Find jobs count as activity, and the **Keep Supabase awake** workflow reads one row every 3 days. If a project is ever paused, press **Restore** on supabase.com.

---

## Rules of the sources

- **Adzuna** (developer.adzuna.com/docs/terms_of_service): every Adzuna ad you show must be labelled "Adzuna" with a link to Adzuna's own site (Find jobs does this in the ad's source label and says "Jobs by Adzuna" under the list; Adzuna's terms ask for a logo of at least 116 x 23 px, so add their logo file if you want to match that exactly). Link visitors to the ad using Adzuna's `redirect_url` (Find jobs does). Their terms limit **commercial** use: free keys are for evaluation, and a site that earns money needs a licence from Adzuna. Don't use the data for anything other than showing the jobs. Read the terms page yourself and ask Adzuna if unsure.
- **Jooble** (jooble.org/info/terms): links go to Jooble's own page for each job, which then sends people on. The terms page wasn't readable when this was built, so read it before launching.
- **Employer feeds** are public, and each job links to the employer's own page.
- **Not used:** SEEK, Indeed, LinkedIn or any other site that forbids scraping.

## What's where

| Path | What it is |
|---|---|
| `supabase/migrations/001_jobs.sql` | The tables, the public read rules, the `jobs_public` view and the search function |
| `jobs-import/` | The importer (no packages needed, just Node 18 or newer) |
| `config/employers.yaml` | The employers |
| `config/search.json` | What Adzuna and Jooble are asked for |
| `tests/` | Unit tests, with saved samples in `tests/fixtures/`. Run `node --test` |
| `.github/workflows/` | The weekly import and the keep-alive |
| `src/scripts/34b-jobs-database.js` | The part of Find jobs that reads the database |
