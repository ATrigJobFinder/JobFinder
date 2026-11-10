# Job Finder

A free resume-to-job website for Australian job seekers, with a side for employers. Build a resume, match it to a job ad, write the cover letter, find and track jobs, practise interviews and aptitude tests, and plan courses. People can connect their own AI to do the writing, and every AI answer is checked against their own details.

This folder is version 25. The Job Finder artifact in Claude is still version 12 until you publish this one (see Build).

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
  index.html          the page's markup: the menu (a bar across the top on wide screens, a drawer on phones), and one <section> per tab
  styles/             the CSS, one file per part of the app, joined in file-name order
  scripts/            the JavaScript, one file per part of the app, joined in file-name order
scripts/
  build.mjs           joins src/ into one self-contained page in dist/
  serve.mjs           the local server behind npm run dev
  make-places.mjs     rebuilds the suburb and country-code list (src/scripts/20a-…)
  make-schools.mjs    builds the list of Australian schools (src/scripts/21b-…) from ACARA's file
  make-globe.mjs      rebuilds the land map for the Home globe (src/scripts/36e-…)
  make-globe-texture.mjs  rebuilds the satellite picture of the Earth for the Home globe (src/scripts/36g-…)
account/
  supabase.sql        the database table and rules for optional sign-up accounts (see Accounts)
dist/
  job-finder.html     the page as published to Claude
  index.html          the same page as a full HTML document, to host anywhere
docs/                 notes on how each version works, oldest first
```

### The script files share one scope

The scripts are joined, in order, inside a single function. A function or variable in one file can be used in any other, just as when it was one long file. Two rules keep that working:

- Keep the number prefixes. They set the order, and code that runs straight away (not inside a function) can only use things from earlier files.
- When you add a file, give it a number between its neighbours, for example `20b-my-feature.js`.

`jsconfig.json` lets VS Code's Go to Definition and Find All References work across these files.

| Files | Part of the app |
|---|---|
| 01–16 | Tailor to a job: skills taxonomy, scanning, results, the skill sorter, Word download, file reading, AI review, cover letter. 07a and 07b are the optional accounts (settings, then sign-up, sign-in and saving to the account). 07c and 18c are the Developer button (see the site as a brand new visitor, then restore your data). 16b is the "Fit the job's criteria" step before the cover letter. 04a reads what a job needs: selection criteria, must-haves, values and the skills usually expected. 04b to 04k are data: the company guides (135 employers, one file per industry group). 04l is data: the employer directory, with each employer's own careers page. 16a switches Tailor to a job between resume, cover letter or both |
| 20i | Create or edit resume, extra lists and helpers: the opening page (upload, LinkedIn or start from scratch), the areas within each industry, employers that fit a job title, follow-up boxes for broad subjects like "Professional Engineering", tools going into Skills, bullet points in order of importance, and the "+5" when a job is finished. |
| 20j | Resume builder round 3: the industry box you type in (with aliases such as “nursing”), Back to start, stacking roles at the same employer under one company heading (`stackRoles`, used by `cvModel`), and the font choice (`prefs.font`, applied in `tplWithPrefs` and for matching cover letters). |
| 20k | The one prompt that writes the resume summary, like the cover letter: a summary of the Resume Advice page, the whole resume, the job ad and the answers to "Tell us about you". See `docs/24-resume-builder-feedback-round.md` |
| 25c–25d, 27a | Interviews. 25c is the voice side: punctuating speech, the delivery check (pace, pauses, filler words, volume, lighting, all worked out on the device with no AI), and the camera and microphone helpers. 25d runs a phone or video practice (question read aloud, answer recorded, playback). 27a is Get ready: pick a job from the Application tracker or type the title, company and level, and get a six-step plan that fits. Practice opens in a full-page room (a `<dialog>`) with a camera and microphone check first, a choice to rate or move on after each answer, and a summary at the end. The Get ready, Practise and Your progress tabs share the advice pages' look (the `.ig` classes), with their own styles in `43-interview-updates.css`. |
| 23g | What the cover letter is written from: your resume's best proof, the optional job ad (its top three requirements, each paired with your resume evidence), your own reason for the employer and your start date. `23e-letter-writer.js` turns these into one short, first-person, formal prompt per paragraph and checks the answer; styles in `46-letter-inputs.css`. |
| 29a | The opening pages for the cover letter and LinkedIn, like the resume builder's. On the resume builder and LinkedIn pages, step 1 is bringing in your resume. On the cover letter page, **Read from my profile** comes first and **Upload my resume or LinkedIn** second, and it is one file: a single box takes a resume or a LinkedIn PDF (or a pasted LinkedIn page), shown as a card with a bulleted summary, the same as the resume builder's (`FILE_SETS` in 20-resume-creator.js). **Next: Layout** goes on to the layout, asking first if no AI is connected, and nothing is written until the person asks. An optional old letter can still be added beside it. Then read from your profile, or write by hand, and showing or hiding the site footer. The footer's markup is at the end of `index.html`; styles in `45-footer-and-welcome.css`. It shows on every page except the globe on the home page. |
| 30–31b | Aptitude tests. 30 is the test descriptions, 31 the question generators (numerical, verbal, logical, abstract, judgement, speed), 31a the library labels and four more tests (mechanical, spatial, error checking, memory) with the "common for your job" lists, and 31b the page, the full-page test room (test mode or learn mode) and the results. Styles in `44-aptitude-updates.css`. |
| 36n–36r | The three checker pages (Resume, Cover letter and LinkedIn advice, shown in the menu as Resume Advice, Cover Letter Advice and LinkedIn Advice) and what goes with them. 36q is the contents column on small screens (a small see-through button and a slide-out list). 36r is the Advice buttons in Create or edit resume, which open the matching part of the Resume checker in a pop-up. Their styles are `39`–`41` and `42-advice-updates.css` |
| 14, 17, 36 | AI: the engines people can connect (14), prompts for small models and `aiJSON` (17), the Connect your AI page and the landing page (36). 36e to 36k are the Home globe (land map, globe, satellite picture, realistic Earth shader, Google street view), see `docs/17-home-globe.md` |
| 18–19 | App shell (the menu, tabs, routing) and the shared profile. The menu is a header bar from 900px up (`27-header-nav.css`) |
| 20–23 | Resume builder (20g is version 25: AI-only buttons greyed out when no AI is connected, sorting, dragging, second colour), resume and cover letter templates (102 designs: 18 base designs at the top of 22, and 84 variants made from them by `TPL_VARIANTS`) and the Word and PDF renderers. 20a is data: every Australian suburb and town, and every country's calling code. 21a is data: job titles, employers, universities and TAFEs, subjects, licences, and the skills and certificates common in each industry. 21b is data: Australian schools (empty until you run `make-schools.mjs`). 23a is the Create or edit cover letter page and the matching letter designs; 23b is Create or edit profile |
| 24–27 | Interviews |
| 28–32 | Applications tracker, LinkedIn review, aptitude tests, learning |
| 33–34 | Duplicate matching, the job board (34, with `candidateMatch`, which scores how well a person fits an ad), talent pool and the ad check |
| 34c–34i | The Employer side, laid out like SEEK's employer site: Dashboard, Jobs, a five-step Post a job (candidate questions with must-haves, ad types, branding), Candidates (pipeline, panel, notes, messages), Talent Search (saved searches, talent pools), Reports and a Company profile. 34c is the shared pieces and data, 34d is sample data (“Try sample data”), 34e to 34i are the pages. Styles in `49-employer.css`. See `docs/23-employer-side-v36.md` |
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

## Places and phone codes

`src/scripts/20a-places-and-phone-codes.js` is generated. To rebuild it (for example after Australia Post adds suburbs):

```
npm install --no-save aus-postcode-suburbs countries-list
node scripts/make-places.mjs
```

The suburb data comes from the `aus-postcode-suburbs` package (ISC licence, from Australia Post locality data) and the country list from `countries-list` (MIT licence).

## Notes

The `docs/` folder holds the notes written as each version was built: what every feature does, the rules the AI checks follow, and what was tested.
