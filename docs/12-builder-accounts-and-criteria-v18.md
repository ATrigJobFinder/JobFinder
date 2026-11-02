# Version 18: resume builder overhaul, accounts, the criteria step, 102 designs

## Accounts (optional)

- People can still use everything without signing up. On your own website, **Sign up** in the sidebar keeps everything with the person's account (`07a-account-config.js`, `07b-account.js`, `account/supabase.sql`). Setup is in the README under Accounts.
- Storage goes through the same `doc(path).get()/set()` interface as before, so every page (profile, saved resumes, cover letters, applications, interviews, practice) saves to the account without its own code changing. `privateDoc` registers each document so sign-up can bring across what's already in the browser.
- Signing up copies the browser's data into the account first. Signing out clears it from the browser. Create or edit profile › Your data and account can delete everything in the account.
- Inside Claude the button doesn't show, because data is already saved to the person's Claude account. Wording across the app ("saved in this browser", "saved to your account") comes from `accountWords()`.

## Create or edit resume

### Starting from what you have
- **Start from my resume or LinkedIn** opens one panel: upload a resume (PDF, Word or text), or a LinkedIn profile as a PDF (More › Save to PDF on the profile), or paste either. The text is read without AI first (`profileFromLinkedIn`, `answersFromBullets`), then, if the AI box is ticked and an AI is connected, a validated AI pass fills what the rules missed (`aiReadProfile`). Nothing it reads replaces what's already filled in unless that part is empty.
- A LinkedIn link on its own can't be read: LinkedIn blocks other sites from loading profiles and its terms forbid scraping. The panel says so and shows the two-click PDF route. Create or edit LinkedIn's import uses the same reader, now including certificates and languages.

### The preview
- Titled **Preview of Complete Resume**, with a note that it shows every achievement; you choose what goes on each resume at the end, and the rest stays in the profile for jobs it suits. Hidden items and unfinished drafts are counted under the preview.

### Goal
- **The job title** suggests from about 800 Australian job titles grouped by industry (`21a-suggestion-lists.js`) and accepts anything typed. It's put in title case as you type ("it support officer" → "IT Support Officer", "ios developer" → "iOS Developer").
- **Applying for a specific job?** Paste the whole ad and the company name. The builder then picks the subjects, skills and examples that match, and **Tailor it to this job's ad** (at the end) sends the resume and the ad to Tailor to a job.
- **Kind of work** is a grid of 31 industries (the main SEEK categories). Picked tiles change colour only, with no tick, so nothing moves. Old profiles' "corporate" and "creative" are mapped to Banking and Marketing.

### Layout
- 102 designs. Filters are multi-select within each row (ATS-friendly, style, layout, type, dates) and show 12 at a time with **Show more**.
- Line spacing and page margins fill the row, with units on every option ("1.15× lines", "12 mm").

### Contact
- **First name** and **Last name** (surname particles like "van der" stay lower case). Old profiles' full names are split.
- Questions in a row line up on the box, not the label, even when one label wraps.

### Experience and volunteering
- Job title and employer suggest from the lists; any value can be typed.
- Dates that can't be read turn red with an example of what works.
- **Suggested bullets** read as sentences, explain what the work was for, and are pitched to the job in the goal.
- **Fix** for "start with an action word" asks the AI for verb options that keep the facts, or offers verb choices without AI.
- **Reword** and every other AI button use whichever AI is connected (browser AI, own key or Claude). If none is connected, or the answer is rejected by the fact checks, the message says which and why.
- **Polish** tidies the whole entry; after a change it reads **Polish again**. **Finish** polishes (if not already) and closes the card.
- **Hide** on each job keeps it in the profile but off this resume.
- The "Add one" number box has a close button.

### Education
- **Qualification** is a level (Year 12, Certificate I–IV, Diploma, Bachelor, Honours, Master, PhD and so on) and a subject, shown merged on the resume ("Bachelor of Engineering (Honours) (Mechanical)").
- **University, TAFE or school** suggests every university, TAFE and major college, and fills in its city. Schools need the ACARA list (README › Schools).
- **Relevant subjects:** list them all. The resume shows up to six, picked by how well they match the job (`pickSubjects`).

### Skills, licences, languages
- Licences and certificates suggest as you type. Each skills box offers more examples "common for this kind of job", by industry.
- Languages ask for a level directly; the "How well?" option is gone.

### Projects, volunteering, awards, publications, interests, referees
- Project dates use the same format and checks as jobs.
- Each has Polish and Finish. Referees are added one at a time, each with its own card.

### Summary
- **Reword** offers another version; **Accept** marks it done.

### Review
- Choose which jobs, projects and extras go on this resume, then **Save to my profile** asks for a name. Up to 12 saved resumes, each downloadable or reopenable.

### Spelling
- Inputs use the browser's spellcheck in Australian English (`lang="en-AU"`).
- Autocorrect fixes common misspellings and American spellings as you type ("recieve", "organize" → "organise") and shows an **Undo** note.

## Tailor to a job

- The **Resume and cover letter / Resume only / Cover letter only** switch fits its box with no gap.
- There's no separate job title box: paste the whole ad and the title and company are read from it.
- A new step, **Fit the job's criteria** (`16b-criteria-step.js`), comes before the cover letter. It has two parts:
  1. **The job's criteria:** each criterion with the best evidence from your profile written as a sentence; Use, Skip or Use all, and **Make these sentences stronger** with AI.
  2. **Quick questions:** clickable options for why this company and what interests you about the role (from the company guide and the ad's duties), what you'd bring, and when you can start, each with room for your own words.
  The answers flow into the cover letter, with or without AI.

## Cover letters

- Length depends on career stage: 250–400 words for students and graduates, up to 420 early in a career, 300–450 for a career change and 350–500 for experienced people. Each part has a minimum, shown as you write, and **Expand with AI** for a part that's too short.
- **Save as a template** keeps up to 12 letters in the profile to start from later.
- Drafts from the profile use more of it: a second example, a project, certificates and the subjects that fit.

## Templates

- 102 designs: the 18 originals plus 84 variants (`TPL_VARIANTS` in 22) with other fonts, colours, headings and layouts. Each has its family, ATS rating and style, and the gallery pages through them 24 at a time.

## Tested (in a headless browser, with a stand-in AI)

- Every builder step: filters, alignment, title case, every type-ahead list, red dates, autocorrect, suggestions, Reword, Fix, Polish, Finish, Hide, education merge and subject picking, referees one at a time, summary Reword and Accept, review and saving.
- Tailor to a job in all three modes, the criteria step and the cover letter it feeds (251–292 words for a graduate).
- The cover letter page's word targets, Expand and saved templates.
- Accounts against a stand-in Supabase: sign up, bringing browser data across, saving, signing out and in, wrong password.
- All 102 designs to HTML, Word and PDF.
- Every tab on a computer and a phone screen: no errors and no sideways scrolling.

A real AI wasn't available while building, so the AI prompts were checked with a stand-in that returns realistic answers; try them with your connected AI.
