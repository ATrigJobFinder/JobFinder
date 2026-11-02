# Job Finder: Resume Scanner

Live app: https://claude.ai/artifact/Bk11QgPQR3YWbuTvMCVt6v (private until shared).
- v1 built 27 Oct 2026.
- Same day: v2 (skill sorter), v3 (smarter skill selection, weaving, download), v4 (natural wording, step-by-step flow), v5 (learn-on-the-job sections) and v7 (soft skills stay where placed).
- The cover letter step is documented in cover-letter-step.md.

## Page flow (v4)
- A stepper runs across the top: 1 Your resume → 2 Job ad → 3 Scan → 4 Place skills → 5 Download resume → 6 Cover letter. Each step shows done or current, and clicking a step jumps to it.
- Nothing is scored until the user scans. The Scan button is disabled until the resume has 40+ words and the ad has 30+ words, and a hint says what's missing.
- "Try an example" fills both inputs but doesn't scan.
- After a scan, the inputs collapse into a summary bar with a "Change resume or job ad" button. Editing the inputs after a scan shows an "out of date" banner and fades the results.
- Download uses the updated resume from step 4 (including edits made in its box), or otherwise the resume as scanned.

## What it does
- Upload a resume (PDF via pdf.js 3.11.174, Word .docx via mammoth 1.8.0, or .txt) or paste text. Parsing runs in the browser.
- Results include:
  - A match score with a per-category breakdown
  - A "Fix these first" list
  - Hard and soft skills, with priorities
  - The job ad, highlighted
  - ATS checks and recruiter tips
- There's an optional AI review by Claude.
- The scanner warns about letter-spaced PDF headings.

## Skill selection (v3, v5)
- The job ad is read section by section:
  - **Not scored (weight 0):**
    - About us, Benefits, How to apply, and equal-opportunity text
    - **Learn-on-the-job sections and lines:** headings like "You'll gain exposure to:", "What you'll learn", "Learning and development", "Training provided" and "Rotations"; lines like "you'll gain/learn/develop…", "opportunity to learn/work on…", "we'll train you in…" and "on-the-job training"
    - **"Not required" lines:** "No prior experience with X is required", "X is not essential". A line that also says "desirable" stays nice-to-have.
  - **Counted:** requirements (weight 1), duties (0.8), nice-to-haves (0.5).
  - **Lower weight:** text before the first heading (0.5).
  - **Ads with no headings:** read as one body (0.8).
- Phrases like "experience with", "knowledge of" or "exposure to" (as prior experience) give ×1.25.
- A skill directly followed by team, department or manager gets ×0.3.
- About 60 generic terms are marked "weak" and only count in requirements, duties or nice-to-haves.
- Umbrella skills:
  - A CAD package on the resume counts as "CAD".
  - "AutoCAD or similar CAD software" doesn't list CAD separately.
- Skills that aren't counted are listed under Hard skills in two groups: "You'll learn these on the job" and "Also mentioned, not scored".
- Soft-skill matching recognises natural word forms (v7): communicated, collaborated, solved problems, resolved issues, proactively, took the initiative, building relationships/rapport, adapting, learning quickly, supervised.

## Skill sorter and weaving (v7 rules)
- Drag (or tap, then tap a target) each missing skill to:
  - a job, education entry or section
  - the Skills section
  - "Not applicable"
- The optional note asks "What did you do with it?" or "When did you show it?".
- Answers are saved privately in `db` at `data/users/<id>/skillMemory`, or in localStorage outside Claude. Known skills are placed automatically.
- **Everything goes where it was placed.** The Profile is never edited by the sorter: the user found AI profile rewrites with "demonstrating **problem-solving**" / "known for" / "proving" unacceptable.
- Where things go:
  - **A skill with an action note:** the AI weaves it into the most related bullet or writes a new bullet from the note. Without AI, the note becomes a bullet.
  - **A skill with a name-only note:** goes into the Skills section as "engineering drawings (HyperMesh)".
  - **A technical skill with no note:** the AI may weave it into a bullet it clearly fits. Otherwise it goes on the matching Skills line, and the change log says so and suggests adding a note.
  - **A soft skill with no note:**
    - First, the AI weaves it lightly into a bullet in that same job, using a natural word form and at most about 5 added words (e.g. "proactively wrote code…").
    - Otherwise, the code adds a short phrase to the bullet in that job with the most related cues. Examples: ", communicating clearly with the team", ", solving problems as they arose", " with close attention to detail", ", taking the initiative", ", drawing on interpersonal skills".
    - If no bullet in that job fits, the skill is not added. The change log asks for a note, with a job-relevant example.
  - **A soft skill dropped on the Skills section:** goes on a "Strengths:" line there.
- The AI is tried in this order: Chrome's built-in AI (top-level pages only), then Claude, then the no-AI rules.
- Code checks block AI wording that does any of the following:
  - adds skills or figures that weren't given
  - drops existing facts or keeps less than 60% of a bullet
  - adds more than 2 + 3 words per skill when there's no note (20 with a note)
  - uses first person
  - uses markdown (`**`, `__`; markup is stripped first)
  - uses filler: "demonstrating", "showcasing", "proving", "known for", "adept at", "abilities", "leveraging", "utilising", "while applying … skills", "passionate"
- Headings with colons, such as "WORK EXPERIENCE: ENGINEERING & ANALYTICAL", are recognised. Nothing is inserted under a heading line.

## Download in the original format
- **Word upload:** the original .docx is edited in place (JSZip 3.10.1, line diff against its paragraphs), keeping its formatting.
- **PDF or pasted text:** a clean ATS-friendly .docx.
- **Text upload:** .txt.
- Saved through the artifact `downloads` capability, or a normal browser download outside Claude.

## Scoring (our own formula)
- Weights: hard skills 40, ATS readability 15, soft skills 10, job title 10, other key terms 10, recruiter tips 10, education 5.
- Missing categories are dropped and the remaining weights rescaled.

## Open items
- Check with the user whether the "Selected as one of 5 candidates from more than 500 applicants" bullet was removed on purpose.
- Warn when edits push a one-page resume onto a second page.
- Move to a real codebase (Next.js + Supabase + Stripe on Vercel). Chrome's built-in AI works there.
