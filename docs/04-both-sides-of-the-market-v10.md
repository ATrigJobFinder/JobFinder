# Job Finder v10: both sides of the market (28 Oct 2026)

Version 10 of the Job Finder artifact (same URL). It adds a job seeker / employer switch, a Home plan, a de-duplicated job board, an applications tracker, LinkedIn review, screening and interview preparation, aptitude test practice, learning plans, and hiring tools. It also rewrites every AI prompt for Chrome's built-in model. See job-finder-tabs.md for the Resume creator, CV templates and the original interview tab, and resume-scanner-v1.md / cover-letter-step.md for "Tailor to a job".

## Navigation
- A **Job seeker / Employer** switch at the top of the sidebar (remembered).
- **Job seeker** has four groups:
  - Home
  - Find work: Find jobs, Applications
  - Stand out: Resume creator, CV templates, Tailor to a job, LinkedIn review
  - Get ready: Interviews, Aptitude tests, Learning
- **Employer** has Hiring and Job market (the same Find jobs list).
- The sidebar footer shows the AI status (Chrome AI on, downloading, Claude, or built-in rules), with a "why" panel listing Chrome's requirements.

## Home
- Six steps in order: resume, LinkedIn, find and track, tailor, prepare, keep learning.
- Each step's status comes from the person's own data, and the first unfinished step is marked "Next".
- A "Today" panel lists overdue follow-ups, interviews in the next 7 days and invitations to apply.

## Chrome AI prompts (the core idea)
Gemini Nano is small, so each prompt asks for one thing and is checked before it's shown.
- **How each prompt is built:**
  - A short system prompt with 5–6 numbered rules and "Reply with JSON only".
  - One or two worked examples, given as real user/assistant turns.
  - A JSON schema passed as `responseConstraint`.
- **Checking:**
  - Every answer is checked by `factCheck`: no numbers or hard skills that aren't in the person's own text, no placeholders, no clichés, and length limits.
  - A failed check gets one retry that names the broken rule.
  - If that fails too, the page uses a template and says so.
- **Engine order:** Chrome built-in AI, then Claude (`sample.json`, which gets the same rules with the examples as text), then built-in rules.
- **Cover letter:** written paragraph by paragraph, with one call per job. Each experience paragraph is checked against only that job's facts, which stops employer mix-ups.
- **Where Chrome AI runs:** Chrome 148+ on desktop, with about 22 GB free disk and a GPU with more than 4 GB, or 16 GB RAM and 4 cores. It needs the page opened in its own tab (top level). Inside the claude.ai frame the browser blocks it, so the page uses Claude there.

## Find jobs (one list, no duplicates)
- **Sources:**
  - Jobs employers post here (shared `jobs/<id>`).
  - Imported listings (`feed/<id>/chunks/c#`).
  - Jobs the person saved or pasted in.
  - Until real jobs exist, seven clearly labelled made-up examples, including duplicate pairs to show merging.
- **Merging:** `DEDUP.cluster`.
  - Same company (ignoring "Pty Ltd" and the like) plus any one of: the same reference or link; title similarity of at least 0.75 in the same place; or description similarity of at least 0.6 with title similarity of at least 0.4.
  - The best source becomes the main listing (in order: posted here, company/ATS, aggregator, board, saved by the person); the others show as "Also listed on".
- **Filters:** keywords, place, work type and source, sorted by best match or newest, 40 at a time.
- **Match %:** the person's skills against the ad's hard skills, plus a bonus when the job title matches theirs.
- **Actions:** apply (on Job Finder, or a link out that also marks the job as applied), tailor my resume, save to Applications, practise interview questions.
- **Talent pool:** opt-in. Employers see name, headline, location, skills, job titles and education; never phone or email. It can be hidden at any time.
- **Invitations** from employers show in Find jobs and on Home.

## Applications tracker
- Six stages: Saved, Applied, Screening, Interview, Offer, Closed, each with a tip.
- Each card has a stage menu and a "Next" button.
- **Details:** dates, follow-up (Applied sets it to +7 days), interview time, pay, contact, notes, the saved ad and stage history.
- **Links:** "Tailor" and "Prep" link straight to those tools. "I've applied" buttons in Tailor and the cover letter add the job automatically.
- **Other:** CSV export. The same job isn't added twice (dedup rules).
- **Storage:** private (`data/users/<id>/applications`).

## LinkedIn review
- **Input:** upload the LinkedIn "Save to PDF" export, or paste sections. "Fill gaps from my resume" adds missing details.
- **Score out of 100:**
  - Headline 15, About 20, Experience 20, Skills 15, Basics 15, Proof 10, Match to target job 5.
  - Fixes are ranked by points gained.
- **AI:** writes a better headline and About from the person's own facts, checked and with a template fallback.

## Interviews: new "Get ready" tab and phone screening
- **Screening practice:** a six-question phone screening practice mode.
- **Screening answer sheet:** pitch, why this role, salary, start date, work rights, and interviewing elsewhere.
- **How to practise:** five steps plus a one-week plan.
- **STAR story bank:** eight competencies, each with a status ("Needs a result", "Use 'I'") and "Practise with this story", which pre-fills the answer.

## Aptitude tests
- **Six formats with fresh generated questions:**
  - Numerical: tables, percentages, ratios.
  - Verbal: true / false / cannot say.
  - Logical: sequences and syllogisms.
  - Abstract: SVG shape sequences.
  - Situational judgement.
  - A CCAT-style speed mix.
- Each test is timed like the real thing, with tips on "How to score well", a result with advice for the weakest skill, and a full review.
- The page explains percentiles and norm groups, and says plainly that these are not IQ tests.

## Learning
- **Skill gaps** come from the scanned ad, common skills for the target job type, aptitude results and LinkedIn.
- **The catalogue:**
  - About 29 real Australian options with codes and links, e.g. CPCWHS1001 White Card, HLTAID011 First Aid, TLILIC0003 forklift, RSA, CHC33021, BSB40920, PL-300, AZ-900, AWS CCP, CSWA.
  - Plus Fee-Free TAFE, MicroCred Seeker microcredentials and Open Universities Australia.
- **Goal switch:** "a job sooner" or "a better career".
- **AI plan:** may only pick ids from the catalogue.
- **Plan:** a checklist that is ticked off as courses are done.

## Hiring (employer)
- **Company profile:** folds away once saved.
- **Post a job:**
  - Jot down notes, then "Draft the ad from my notes" (AI, checked against the notes; with no AI the notes are sorted into sections).
  - A live ad check flags a missing pay range, age-coded words, "native speaker", masculine-coded language, too many must-haves, length and a missing location.
- **Your jobs:** each shows its applicant count and how many strong matches are in the talent pool.
- **Find candidates:** everyone in the talent pool, including people who haven't applied, scored against the chosen job. Shows pool size, strong matches, the skills top matches are missing, and "Invite to apply".
- **Applicants:** note, resume and match %, plus a private status (New, Shortlisted, Interview, Offer, Not progressing) in `data/users/<id>/hiring`.

## Shared data and access rules
| Path | Who reads | Who writes |
|---|---|---|
| `jobs/<id>`: an employer's company and ads | everyone who can open the page | that person (Contributor or above) |
| `feed/<id>/…`: imported listings | everyone | owner and editors |
| `talent/<id>`: opt-in profiles | Contributors and above | that person |
| `outbox/<id>`: invitations (`toIds`) | Contributors and above | that person |
| `apps/<id>`: applications (`employerIds`) | Contributors and above | that person |
| `data/users/<id>/…`: everything else | only that person | only that person |

- **Checked after publishing:** someone with view-only access can't read talent profiles, and a Contributor can't overwrite another person's document.
- **Limits:**
  - View-only people can browse jobs but can't post, apply or join the talent pool (the page says so).
  - Applications and talent profiles are readable by every Contributor of this artifact, not only the employer. The apply form says this. A public launch would need a real backend with per-employer access.

- **Reads:** Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee, Adzuna (API key), and schema.org JobPosting pages (robots.txt checked, 1 request a second).
- **Output:** drops closed jobs, merges duplicates with the same `dedup` code as the site, and writes `jobs.json` for "Import listings".
- **Not used:** Seek, LinkedIn and Indeed, because their terms don't allow it.
- **Network:** Claude's workspace can't reach these sites until they're allowed in Settings › Capabilities, so for now it runs on the user's computer or a server.

## Testing done
- **Two-person simulation with a shared mock database:** an employer posts, a seeker joins the pool, the employer invites, the seeker applies, the employer shortlists; then a feed import and a view-only person.
- **Aptitude:** all six formats run end to end.
- **Learning:** plan building checked.
- **Interviews:** the screening and story flows checked.
- **Mobile:** 390 px dark mode with no overflow.
- **Regressions:** the earlier scanner, cover letter and tab tests still pass.

## Source
Parts were in `/home/claude/job-finder/src/` (session workspace only) and assembled by `build.py`. New since v9:
- **Scripts:** `ai.js`, `store.js`, `tracker.js`, `linkedin.js`, `interview2.js`, `aptitude-data.js`, `aptitude.js`, `learning.js`, `dedup.js`, `market.js`, `home.js`
- **Markup:** `views1-3.html`
- **Styles:** `more.css`, `market.css`

For future edits, start from the published artifact.

## Open ideas
- Per-employer private applications (needs a backend).
- Email notifications for invitations.
