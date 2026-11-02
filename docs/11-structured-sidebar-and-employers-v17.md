# Version 17: structured sidebar, cover letter and profile pages, every employer

## Sidebar

The sidebar is in this order:

1. **Home**, **Connect your AI**
2. **Build your basics:** Create or edit resume, Create or edit cover letter, Resume and cover letter templates, Create or edit LinkedIn, Create or edit profile
3. **Find work:** Find jobs, Tailor to a job, Company guides
4. **Application tracker** (on its own)
5. **Get ready:** Interviews, Aptitude tests, Learning

When the sidebar is collapsed to icons on a computer, hovering over it (or tabbing into it) opens it over the page after a short pause, and moving away closes it again. Clicking an item closes it. On phones the menu button opens the drawer as before. The code is `setPeek` in `18-app-shell.js` and the `[data-peek]` rules in `01-app-shell.css`.

## Tailor to a job: resume, cover letter or both

A three-way switch at the top of Tailor to a job (`16a-tailor-mode.js`) chooses what to tailor:

- **Both** (the default): every step, as before.
- **Resume:** hides the cover letter step.
- **Cover letter:** hides the skill placement, job-ad highlights, AI review and resume download, and renumbers the steps: resume, job ad, scan, cover letter.

The choice is remembered in the browser.

## Create or edit cover letter

A new page (`23a-cover-letter-page.js`) for one general letter you can send anywhere and reuse when tailoring.

- **Five parts**, each with what it's for: opening, experience, education and skills, why this company, close.
- **Start from my profile** writes a first draft from the resume details without AI. Anything it can't know is left in [brackets]. Typing a company or role fills the matching [the company] or [the role] gap.
- **Upload a letter** reads a Word, PDF or text letter and sorts its paragraphs into the five parts.
- **Checks:** word count, gaps left in brackets, and overused phrases. Downloads stay off until the gaps are filled.
- **Design:** the letter uses the fonts, colour and name style of the resume template you've chosen, so the two match. Templates with a coloured band put the name in a band, sidebar templates get a coloured bar down the side, and the rest get a rule under the name. Word and PDF follow the same design (`buildCoverDocx` and `buildCoverPdf` in 15 now take a style).
- **Reuse when tailoring:** once the letter has 40 or more words and no gaps, it's added to Tailor to a job's previous letters as "My cover letter (from Job Finder)", so its best sentences get reused.

## Resume and cover letter templates

The templates page has a **Resumes / Cover letters** switch. In cover letter mode the gallery shows your letter (or a sample) in each design, and the editor downloads the letter in the chosen design. Change design on the cover letter page opens this view.

## Create or edit profile

A new page (`23b-profile-page.js`) for the details every page uses: contact details, work rights, licence, availability, the job you want, career stage and date style. It also shows what you've built so far (resume, cover letter, design, LinkedIn), lets you download everything as one JSON file, and delete your profile (applications, cover letter and LinkedIn notes are kept).

## Create or edit LinkedIn

A new **Improve my profile / Create a new one** switch. Create mode hides the import steps and shows three steps: make the account, **Fill everything from my profile** (headline, About, experience, skills and education from your resume, without AI), then add a photo and a custom link.

## Company guides: every employer, official links only

- **Every employer:** the page lists the 135 companies with a full guide plus the employer directory (`04l-company-directory.js`). Directory rows show the industry, size, states, ASX code and links to the careers page and graduate page.
- **Links only to the employer's own website.** Each careers link was found by searching for the employer's careers page and keeping only a page on its own domain. The guides' links to Prosple, university careers portals, GradConnection, Study Perth, Built In and similar sites were removed. Tips that came from those sites keep a plain "Graduate reviews" or "Job listing" label (dashed border, not linked), and the card says which sites they were drawn from.
- **Filters:** search, industry, state (an employer marked National shows for every state), size, all employers or full guides only, grouped or one list.
- **Sending your resume to many employers:** tick employers (or **Select all shown**) and choose **Add to Application tracker**. Each is saved as "General application" at Saved, with its careers link, so you can work through them. Adding the same employer twice doesn't duplicate it. The tracker now holds up to 400 items.
- **In Tailor to a job:** if the ad's company line names a directory employer without a full guide, "What this job needs" links to its careers page.
- **Name change:** King & Wood Mallesons' Australian firm became **Mallesons** in March 2026 after splitting from King & Wood. The guide now uses that name and still recognises the old one in ads.
- **New industries** for the directory: education and research; community services and not-for-profits; hospitality, tourism and leisure; agriculture, food and drink; manufacturing and industrial; recruitment, facilities and member services. Health now includes aged care, and government includes police and emergency services.

## Employer research so far

The research is limited to about 200 web searches per session, so it's done in rounds.

- **Round 1:** the 135 guides' careers pages and the first 67 directory employers (banks, super funds, insurers, trading firms, accounting and consulting firms).
- **Round 2:** 200 more: every state and territory government jobs site, police, fire and ambulance services, state health departments and big hospital groups, private hospitals, health insurers and aged care, state education departments, TAFEs, Catholic school systems, early learning, 15 universities and CSIRO, the big retailers, hotels, casinos and fast food, miners and mining services, energy and water utilities, airlines, rail, freight and airports, builders and property groups, federal departments and agencies, capital city councils, and big tech companies.
- **Round 3:** 191 more: community services and not-for-profits, recruitment and facilities firms, the motoring clubs, 25 law firms, TV, radio and sporting bodies, manufacturers, defence and aerospace companies, agriculture, food and drink, more retailers and consumer brands, Australian tech companies and telcos, 16 more universities, more federal agencies and councils, and some energy and engineering firms.

That makes **593 employers in 22 industries** (135 with a full guide). `research/employers-to-check.txt` lists the last 158 (mostly hospitals, pharmaceutical companies, builders and property firms, engineering consultancies, mining, energy, water and transport companies, regional councils and a few banks). Ask Claude to continue the employer research for the final round.

No careers page on the employer's own site turned up for Optus, News Corp Australia, J.P. Morgan, REA Group, Amcor, Thomson Geer, SBS, ARN Media, Southern Cross Austereo, and the Departments of the Prime Minister and Cabinet, Attorney-General, Infrastructure, Industry and Veterans' Affairs, so they aren't linked yet.

Name changes found along the way: Heritage and People's Choice is now People First Bank, Ashurst is now Ashurst Perkins Coie, the King & Wood Mallesons Australian firm is now Mallesons, and Pilbara Minerals trades as PLS.

## Tested

- Sidebar order, hover open and close, and that clicking closes it.
- Tailor modes: the steps shown and their numbers in each mode, and which sections are hidden.
- Cover letter: from profile, the bracket check, the company filling its gap, Word and PDF downloads in a band, side and rule design.
- Templates in cover letter mode: 18 letter thumbnails, downloads.
- Profile: fields save to the profile, the summary of what's built.
- LinkedIn create mode: fill from profile and score.
- Company guides: no links to job boards, graduate sites or job platforms among the 1,518 links on the page, the state and guides-only filters, select all and bulk add of 54 banking employers, no duplicates on a second add.
- A Bendigo and Adelaide Bank ad shows its careers link in Tailor to a job.
- Earlier tests (versions 12 to 16) still pass. No sideways scrolling at phone width.
