# Job Finder

A free resume-to-job website for Australian job seekers, with a side for employers. Build a resume, match it to a job ad, write the cover letter, find and track jobs, practise interviews and aptitude tests, and plan courses. People can connect their own AI to do the writing, and every AI answer is checked against their own details.

This folder is version 20. The Job Finder artifact in Claude is still version 12 until you publish this one (see Build).

## Run it

You need [Node.js](https://nodejs.org) 18 or later. There's nothing else to install.

```
npm run dev
```

Then open **http://localhost:5173**. Edit any file in `src/` and the page reloads by itself.

In VS Code you can also press **Ctrl+Shift+B** (Cmd+Shift+B on a Mac) to run the "Run Job Finder" task.

## What's where

```
src/
  index.html          the page's markup: sidebar, and one <section> per tab
  styles/             the CSS, one file per part of the app, joined in file-name order
  scripts/            the JavaScript, one file per part of the app, joined in file-name order
scripts/
  build.mjs           joins src/ into one self-contained page in dist/
  serve.mjs           the local server behind npm run dev
  sync-dedup.mjs      copies the duplicate matcher to the collector
  make-places.mjs     rebuilds the suburb and country-code list (src/scripts/20a-…)
  make-schools.mjs    builds the list of Australian schools (src/scripts/21b-…) from ACARA's file
account/
  supabase.sql        the database table and rules for optional sign-up accounts (see Accounts)
dist/
  job-finder.html     the page as published to Claude
  index.html          the same page as a full HTML document, to host anywhere
collector/            gathers real job listings for "Import listings" (see its README)
research/             the employer list still to check, and the careers links found so far
docs/                 notes on how each version works, oldest first
```

### The script files share one scope

The scripts are joined, in order, inside a single function. A function or variable in one file can be used in any other, just as when it was one long file. Two rules keep that working:

- Keep the number prefixes. They set the order, and code that runs straight away (not inside a function) can only use things from earlier files.
- When you add a file, give it a number between its neighbours, for example `20b-my-feature.js`.

`jsconfig.json` lets VS Code's Go to Definition and Find All References work across these files.

| Files | Part of the app |
|---|---|
| 01–16 | Tailor to a job: skills taxonomy, scanning, results, the skill sorter, Word download, file reading, AI review, cover letter. 07a and 07b are the optional accounts (settings, then sign-up, sign-in and saving to the account). 16b is the "Fit the job's criteria" step before the cover letter. 04a reads what a job needs: selection criteria, must-haves, values and the skills usually expected. 04b to 04k are data: the company guides (135 employers, one file per industry group). 04l is data: the employer directory, with each employer's own careers page. 16a switches Tailor to a job between resume, cover letter or both |
| 14, 17, 36 | AI: the engines people can connect (14), prompts for small models and `aiJSON` (17), the Connect your AI page and the landing page (36) |
| 18–19 | App shell (sidebar, tabs, routing) and the shared profile |
| 20–23 | Resume builder, resume and cover letter templates (102 designs: 18 base designs at the top of 22, and 84 variants made from them by `TPL_VARIANTS`) and the Word and PDF renderers. 20a is data: every Australian suburb and town, and every country's calling code. 21a is data: job titles, employers, universities and TAFEs, subjects, licences, and the skills and certificates common in each industry. 21b is data: Australian schools (empty until you run `make-schools.mjs`). 23a is the Create or edit cover letter page and the matching letter designs; 23b is Create or edit profile |
| 24–27 | Interviews |
| 28–32 | Applications tracker, LinkedIn review, aptitude tests, learning |
| 33–34 | Duplicate matching, the job board, talent pool and hiring |
| 35, 35a, 37 | Home plan, the Company guides page (35a: every employer, the full guides, picking employers for the Application tracker, and finding the company in a job ad) and start-up |

## Build

```
npm run build
```

This writes `dist/job-finder.html` and `dist/index.html`.

- **To update the Claude artifact,** give Claude `dist/job-finder.html`, or this whole folder, and ask it to publish to the Job Finder artifact.
- **To put it on your own website,** upload `dist/index.html` to any static host, such as Vercel, Netlify, Cloudflare Pages or GitHub Pages.

## Outside Claude: what's different

The same page runs in both places. When it isn't inside Claude:

- **Saving:** everything people enter is saved in their own browser (localStorage) instead of their Claude account. If you set up accounts (below), people can sign up and keep it all with their account instead.
- **AI:** "Claude on your account" isn't available. Connect your AI comes into its own here:
  - Downloading an AI into the browser works (it needs WebGPU for WebLLM). The first download is 0.5 to 4.5 GB; after that it loads from the browser's cache in 10 to 60 seconds, and the page shows the time left.
  - Your own API key works.
- **Downloads:** Word and PDF files are saved as normal browser downloads.
- **Shared features need Claude for now:** the job board's shared jobs, the talent pool, invitations, applications and Hiring all use Claude's shared database. On your own site they need a backend. The plan in the notes is Next.js with Supabase on Vercel.

## Accounts

People can use Job Finder without signing up. On your own website you can also let them sign up, so their profile, resumes, cover letters, applications and practice are kept with their account and follow them to other devices. Inside Claude this isn't needed: everything is already saved to each person's Claude account, and the sign-up button doesn't show.

Accounts use [Supabase](https://supabase.com) (the free plan is enough to start):

1. Create a Supabase project.
2. In the project, open **SQL Editor › New query**, paste in `account/supabase.sql` and press **Run**. This makes one table, `user_docs`, with rules so each person can only read and change their own rows.
3. Under **Authentication › Providers**, keep **Email** on. Decide whether people must confirm their email (**Confirm email**); Job Finder handles both.
4. Under **Authentication › URL Configuration**, set the **Site URL** to your website's address, so the confirmation and password-reset emails link back to it.
5. Copy the project URL and the **anon** public key from **Project Settings › API** into `src/scripts/07a-account-config.js`, then `npm run build`.

When someone signs up, whatever they already saved in that browser is copied into their account first, so nothing is lost. Signing out leaves the browser empty again. **Create or edit profile › Your data and account** lets people delete everything in their account.

The anon key is meant to be public. What each person can see is enforced by the database rules, not by keeping the key secret. Never put the **service_role** key in the page.

## Schools

The "School" box in the resume builder suggests universities, TAFEs and colleges out of the box. To suggest every Australian school as well, build `src/scripts/21b-schools-data.js` from ACARA's School Profile list:

1. Download **School Profile** from [ACARA Data Access](https://www.acara.edu.au/contact-us/acara-data-access) (free; it asks a few questions first).
2. Either save it as CSV from Excel, or run `npm install --no-save xlsx` so the script can read the .xlsx directly.
3. Run:

```
node scripts/make-schools.mjs "path/to/School Profile 2025.xlsx"
npm run build
```

It keeps secondary, combined and special schools (about 3,000), and fills in each one's suburb and state. Add `--all` to include primary schools too. Check ACARA's licence terms for the year you download before publishing the list.

## Collector

`npm run collect` gathers real jobs from company career sites and job APIs into `collector/jobs.json`. You can then load that file with **Find jobs › Import listings**. Copy `collector/sources.example.json` to `collector/sources.json` first and list the companies you want. See `collector/README.md`.

## Places and phone codes

`src/scripts/20a-places-and-phone-codes.js` is generated. To rebuild it (for example after Australia Post adds suburbs):

```
npm install --no-save aus-postcode-suburbs countries-list
node scripts/make-places.mjs
```

The suburb data comes from the `aus-postcode-suburbs` package (ISC licence, from Australia Post locality data) and the country list from `countries-list` (MIT licence).

## Notes

The `docs/` folder holds the notes written as each version was built: what every feature does, the rules the AI checks follow, and what was tested.
