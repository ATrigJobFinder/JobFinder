# The Unlisted jobs directory in Supabase, and a lighter page

## What changed

The page had grown to 7 MB, and opening Unlisted jobs drew all 2,919 employers at once (about 300,000 elements), which took close to a minute in a test browser.

- **The directory is in the database.** The 2,784 employers without a full guide are in a Supabase table, `directory_employers`. The page asks for **50 at a time**, already filtered and ordered by the database, and shows a **Show 50 more** button. The 135 full guides stay in the page, because Tailor to a job needs them to recognise the company in an ad.
- **Industries open on demand.** In "Group by industry" each industry is a closed heading with its count. Opening one loads its first 50. A search always comes back as one list.
- **The website is several files.** `dist/index.html` is now only the markup (about 360 KB). The styles, the script and the picture of the Earth are separate files in `dist/assets/`, which browsers keep after the first visit.
- **The Home globe starts when Home is shown.** It used to be built on every page load, whichever page you opened. The Earth picture is only downloaded then too.

Measured in headless Chrome on the same machine:

| | Before | After |
| --- | --- | --- |
| Page size | 7.0 MB, one file | 0.36 MB page + 2.9 MB script + 0.5 MB styles (kept by the browser), 0.6 MB picture on Home only |
| Opening Unlisted jobs | about 52 s, 303,000 elements | about 0.3 s, 6,400 elements |
| Opening an industry | (already drawn) | about 0.4 s for 50 employers |
| Loading a page other than Home | about 4 s | about 1 s |

## One-time setup

1. In Supabase, open **SQL Editor > New query**, paste `supabase/migrations/006_directory_employers.sql` and run it. It creates the table, lets anyone read it (and nobody change it) with the public key, and adds `directory_counts`, which the page uses for totals.
2. Fill the table. Either:
   - **With the script.** Copy the service role key from **Project Settings > API keys** into a file called `.env` in this folder (git ignores it; never put this key in `src/`):
     ```
     SUPABASE_SERVICE_ROLE_KEY=...
     ```
     then run `npm run seed:directory`.
   - **Without a key.** Run `npm run seed:directory -- --sql`, then paste each of the ten files in `supabase/seed/` into the SQL Editor and run it.
3. Deploy as usual. Host the whole `dist` folder, not just `index.html`.

Until steps 1 and 2 are done, Unlisted jobs shows the 135 full guides and a note that the other employers couldn't be loaded.

## Changing the directory

The employers and their profiles are still files in this repository, now in `data/directory/` instead of `src/scripts/`. Edit them as before, run `npm test`, then run `npm run seed:directory` again. It adds new employers, updates changed ones and removes ones that are no longer in the files. `npm run seed:directory -- --dry` shows what would be sent.

## Where it lives

| File | What it does |
| --- | --- |
| `data/directory/` | The employers and profiles (the old `04l` array, `04m2`–`04m72`, `04n`–`04z`) |
| `scripts/directory-data.mjs` | Reads those files and makes one row per employer |
| `scripts/seed-directory.mjs` | Sends the rows to Supabase, or writes them as SQL |
| `supabase/migrations/006_directory_employers.sql` | The table, its read-only rule and `directory_counts` |
| `src/scripts/35b-directory-remote.js` | Asks for pages of 50, totals by industry, one employer by name, and names by industry. Remembers what it has loaded |
| `src/scripts/35a-company-guides.js` | Draws the lists: guides and database rows merged in one order, 50 at a time |
| `scripts/build.mjs` | Writes the one-file page and the split website |

Other places that used the directory now ask the database for one employer by name and fill in when the answer arrives: the careers-page note in Tailor to a job, the careers link on a job in Find jobs, and the company step of the interview plan. The Employer box in the resume builder suggests guide companies straight away and directory names once they have loaded.

## Things to know

- **Inside Claude** the page can't reach Supabase, so the Claude artifact (`dist/job-finder.html`) shows the full guides only on Unlisted jobs.
- **Opening the page from your disk:** use `dist/job-finder.html`. `dist/index.html` needs its `assets` folder beside it and a web server (`npm run dev` is one), or the globe can't use its picture.
- **Slugs.** Each row's key is its name in lower case with dashes. Two employers shared one: Central Coast Council in NSW and in Tasmania. The one with words in brackets keeps them (`central-coast-council-tasmania`).
- **A duplicate to tidy:** "Chemist Warehouse" and "Chemist Warehouse (Sigma Healthcare)" are both in `data/directory/` and both show.
- **The scripts still load together.** Profiling showed that running every page's script takes well under half a second; the time was going on the globe, the page's size and the employer list. Splitting the script by page would be a large change for a small gain, so it wasn't done.
