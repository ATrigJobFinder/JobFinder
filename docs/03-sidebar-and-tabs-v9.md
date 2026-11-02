# Job Finder: sidebar and new tabs (v9, 28 Oct 2026)

The artifact (titled "Job Finder", same URL as the resume scanner, version 9) is now an app with a sidebar and four tabs. See resume-scanner-v1.md and cover-letter-step.md for the original "Tailor to a job" tab.

## Shell
- **Sidebar:** a toggle in the top bar switches it between expanded (icon, label and description) and an icon rail on desktop; the choice is remembered in localStorage. Below 900px it becomes a drawer with a scrim; Escape closes it, and it's `inert` while closed.
- **Routing:** each tab has a hash route (`#scanner`, `#builder`, `#cv`, `#interview`), so the browser's Back button works. The last tab used is remembered.
- **Shared profile:** the Resume creator, CV templates and Interview prep share one saved profile, stored privately in `db` at `data/users/<uid>/resumeProfile` (localStorage outside Claude). Practice history is in `data/users/<uid>/interviewPractice`, last 60 attempts.
- **Capabilities:** unchanged (sample, db, downloads, user).
- **Links between tabs:**
  - The scanner has "Use the resume I built".
  - The cover letter has "Next: practise for the interview".
  - The Resume creator ends with "Choose a design", "Tailor it to a job ad" and "Practise for interviews".

## Resume creator (8 steps)
Steps: Goal, Contact, Summary, Experience, Education, Skills, Extras, Review. There's a live A4 preview in the Professional design and a "Resume strength" score.
- **Goal:** target job title (which becomes the headline), kind of work (10 job types) and career stage. Students lead with education.
- **Contact:** Australian advice (suburb and state only; no date of birth, photo or marital status). Includes work rights and driver's licence.
- **Summary:** four questions (who you are, strengths, a result, what's next), then "Write my summary".
- **Experience:** per job, four questions (responsibilities, achievements, tools, people). "Turn my answers into bullet points" offers suggestions to add one by one or all at once.
  - A live coach on each bullet checks for an action word, a number, length, "I"/"my", "responsible for" and past tense for past jobs.
  - There's a word-starter list. Dates auto-format to "Feb 2023".
- **Education:** grade, awards, coursework, thesis or project. "Still studying" makes the end date "(expected)".
- **Skills:** chip editors for technical skills, software, licences, languages and strengths. Suggestions come from your answers (via the skill taxonomy) and from common skills for the job type.
- **Extras:** projects, volunteering, awards, publications, interests, availability and referees ("on request" or listed).
- **Review:** health checklist with "Fix" links. Downloads Word/PDF in the Professional design, or copies as text.
- **Import:** upload a PDF/Word resume or use the one in the scanner. `profileFromText` parses it into the profile (labelled skill lines, Coursera-style certificates, referee lines, volunteering lines), with Undo.
- **AI (Chrome built-in, then Claude, then no AI):**
  - Every output is checked by `honest()`: no numbers or hard skills that aren't in the user's own text, no buzzwords, clichés, "I"/"my" or "responsible for", and a length range. Bullets that fail are dropped.
  - If the AI's summary fails, the page says so and uses the template version instead.

## CV templates (11 designs)
| Template | Formality | Layout | ATS-friendly |
|---|---|---|---|
| Professional | 4 | Single column | Yes |
| Classic | 5 | Single column | Yes |
| Executive | 5 | Single column | Yes |
| Corporate | 4 | Colour band | Yes |
| Technical | 3 | Single column, skills first | Yes |
| Modern | 3 | Light sidebar | No |
| Minimal | 3 | Dates in the margin | Yes |
| Creative | 2 | Dark sidebar | No |
| Friendly | 1 | Pill headings, availability up front | Yes |
| Hands-on (trades) | 2 | Licences first | Yes |
| Academic CV | 5 | Education and publications first | Yes |

- **Picking:** choose a job type and a casual-to-formal slider. Templates rank as best match first, with the rest by formality distance. Each template has 5 accent colours, and there are tips for each job type.
- **Sample data:** without the user's details, previews use made-up "Sam Taylor" data and downloads are disabled.
- **Renderers:** one template spec drives all three: `cvHtml` (page preview with page-break marks), `cvDocx` (styles, numbering bullets, tables for sidebars and dates in the margin) and `cvPdf` (jsPDF flow layout with page breaks).
- **Tested:**
  - All 11 .docx files pass the Office schema validator.
  - LibreOffice renders each on one page, matching the preview.
  - The PDFs match.
- **Gotchas fixed:**
  - Template display name vs. name-style field: the style field is now `nm`.
  - Font names with quotes broke the inline `style` attribute: it's now escaped.
  - jsPDF measures text with kerning but draws without it: widths are now measured without kerning (`getStringUnitWidth(t, {kerning: {}})`).
  - Word sidebar shading: rows now have a minimum height of about one page.

## Interview prep
- **"How you'll be asked":** 15 formats, each with where you meet it, example phrasings, why they ask, how to answer (steps), length and what to watch out for, plus "Practise these". The formats:
  - Behavioural (STAR), situational, "Tell me about yourself", motivation, strengths-based, technical
  - Case study, selection criteria (government), one-way video, phone screening, panel
  - Group exercise and assessment centre, psychometric tests, curveballs, your questions for them
- **"Practise":** about 70 questions across 10 types, with "Most common" as the default filter.
  - **Job-specific questions:** generated from the scanned job ad (title, company, required skills, duties, soft skills), or from the Resume creator target.
  - **Modes:** one question at a time, a 5-question mock interview with a summary, or a timed video mode (30 seconds to think, 2 minutes to answer, then locked).
  - **Voice input:** where the browser allows it; it hides itself if blocked.
- **Rating:**
  - Built-in checks (`ruleRate`) always run: STAR cues, topic match (for example, a persuasion question needs a persuasion story), I vs. we, numbers, steps, priorities, filler words, and length windows for each type.
  - Scores have caps for short answers.
  - Chrome AI, or else Claude, adds coaching. Its scores are held to the built-in caps, so an AI 10/10 on a 20-word answer becomes 3.
  - **Feedback shows:** a score out of 10 with change since the last try, five criterion bars with notes, what worked, what to improve, a "stronger answer" outline using the user's own sentences with [prompts] for gaps, and a likely follow-up to answer.
- **"Your progress":** attempt count, average of the last 10, strongest and weakest question types, a trend bar chart, recent attempts with "Practise again", and clear history.

## Source
The built file is self-contained. During this session the parts lived in `/home/claude/job-finder/src/` and were assembled by `build.py`:
- `base.html` holds the scanner.
- The other parts are `shell.html`, `app/profile/builder/cvtemplates/cvrender/cv/interview-data/interview/init.js` and the matching css/html files.

That folder lives only in the session's temporary workspace, so future edits should start by reading the published artifact.

## Open ideas
- AI-generated job-specific interview questions (currently built from rules).
- Exporting a CV straight into the Tailor flow keeping the chosen template.
- Two-page warnings in the CV tab for students.
