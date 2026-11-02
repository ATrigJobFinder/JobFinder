# Job Finder: Cover letter step (step 6)

Added 27 Oct 2026 to the same app as the resume scanner (see resume-scanner-v1.md). The scanner part is paused for now. Updated the same day (artifact version 8) after a Chrome AI letter mixed up which job did what and left "[Start Date]", "[Phone Number]" and "[Email Address]" in the closing.

## Flow
- The stepper now has six steps. After "Download resume" (step 5), a "Next: cover letter" button leads to step 6. The button becomes the main action once the resume has been downloaded.
- Step 6 appears after a scan. Its fields are prefilled from the ad and the resume:
  - Role: the job title found in the ad. This field was added in v8 and can be edited.
  - Company: the company line of the ad.
  - Hiring manager: picked up when the ad says "contact Jane Smith".
  - Your name, email, phone and location.
- The user adds:
  - Previous cover letters (upload up to 3 as PDF/Word/text, or paste one). These are remembered privately in `db` at `data/users/<id>/coverLetters`, or in localStorage outside Claude, along with availability.
  - Optionally: where they saw the ad, "Why this company?", availability and the company address.
- **Readiness checklist (v8)**, shown above "Write my cover letter" and updated as the user types:
  - Needed: name, phone, email, role, company. Each shows ✓ with its value, or ! with what's missing (e.g. "Phone: not found in your resume. Add it so they can call you"). Clicking the label jumps to the field.
  - Optional: hiring manager, where the ad was seen, why this company, availability. Each says what happens if it's left blank (e.g. "not given, so the letter won't mention a start date").

## Letter structure (five paragraphs)
1. **Opening:** the role and company, where the ad was seen, who you are (degree and stage), and one reason you fit.
2. **Experience:** two or three most relevant roles, tied to the ad, with evidence.
3. **Education and skills:** degree, coursework, and tools that match the ad.
4. **Why this company:** the user's reason, plus the soft skills the ad asks for, shown through examples.
5. **Close:** thanks, availability and a request for an interview.

Around the paragraphs: the sender header, date (Australian format), recipient block, a "Re: Application for …" line, "Dear Hiring Manager," (or the name given), and "Yours sincerely,". Target length is 280–380 words.

## Writing
- The AI is tried in this order:
  1. Chrome's built-in AI, with a JSON schema (top-level pages only)
  2. Claude
  3. A no-AI template
- **Fact sheet (v8).** Both AIs now get the resume as facts grouped by job, not just raw text:
  - `<candidate>`: name, phone, email and location.
  - `<experience_by_employer>`: entries like "[2] Consulting Analyst at Provaris Energy, 10/2021 – 12/2022", each followed by that job's bullets.
  - `<education>`: each degree with its dates and lines.
  - Chrome's small model gets a compact prompt: the fact sheet, only the scored parts of the ad (about 2,500 characters), and one previous letter trimmed to 1,500 characters. Claude also gets the full resume text and up to three letters.
- **New rules in the prompt (v8):**
  - Every experience must be credited to the employer it's listed under. Never move a task to another job, and never merge two jobs.
  - Use the real name, phone and email.
  - Never write placeholders or square brackets. If a detail isn't given, leave it out.
- The no-AI template is assembled from:
  - the best-matching role bullets, using short employer names (e.g. "R.M. Williams", not the full address line)
  - the education entry and its coursework
  - matched tools, or the resume's own tools
  - one reusable sentence from a previous letter that's about the candidate's own roles
  - The contact sentence is left out if there's no phone or email.
- The prompt bans clichés and invented facts. It may say the candidate is keen to learn something the ad mentions.

## Getting the jobs right (v8)
- `attributionIssues` checks each sentence that names exactly one job, by employer or by job title:
  - **Title paired with the wrong employer.** "As a Night Desk Operator at Provaris Energy" is flagged, because that title belongs to Skye Asset Management.
  - **Work credited to the wrong job.** The sentence's content words are compared with each job's bullets. It's flagged when another job overlaps by at least 3 words and by at least 2 more than the named job.
- When the AI's draft has issues, it gets one correction turn listing each problem. Chrome uses the same session; Claude gets the draft as the assistant turn, followed by the correction.
- If the problem is still there, that paragraph is swapped for the template's paragraph of the same part. The breakdown says "The AI credited this work to the wrong job, so this paragraph was rebuilt from your resume."
- The check also runs live on user edits and appears as a flag in the breakdown.
- Sentence splitting no longer breaks at initials, so "R.M. Williams" stays in one sentence.

## Placeholders and "To finish your letter" (v8)
- **Auto-fill.** Any bracketed placeholder is filled from the fields if the value is known. Both `[…]` and `{…}` are recognised. Covered: phone, email, name, company, hiring manager (falls back to "Hiring Manager"), role, where the ad was seen, start date or availability, date and location. This applies to the greeting, paragraphs and sign-off.
- **"To finish your letter" panel.** Anything still unfilled appears in this panel above the letter. Each item shows:
  - a plain label, such as "Your phone number" or "When you can start"
  - where it is, with the sentence quoted
  - an input with **Add** (Enter works too) and **Leave it out**, which removes that sentence
- Adding a known detail also fills the matching field, so the letterhead and future letters use it.
- Gaps are highlighted in the letter. "Download Word" and "Download PDF" stay disabled until none are left, with a status message saying how many remain.
- The breakdown flags "Has a gap to fill: …" per paragraph.

## Readable version and breakdown
- The letter is shown as a white page in both themes, and every paragraph is editable in place.
- Beside it, the breakdown shows:
  - Key skills from the ad covered by the letter, out of those the resume shows
  - Word count, and whether it fits one page
  - Number of things to check
- For each paragraph, the breakdown shows:
  - its role in the structure
  - skills from the ad it mentions
  - the resume or previous-letter text it's based on (AI quotes are verified against the sources)
  - checks
- Checks run on every edit:
  - A technical skill that isn't in the resume or previous letters, judged per sentence. These are not flagged:
    - "Keen to learn Revit".
    - A sentence that points at the ad without claiming the skill (v8), e.g. "the design support this internship involves".
  - These are still flagged:
    - "Proficient in AutoCAD", when AutoCAD isn't in the resume or previous letters.
    - A soft skill the resume doesn't show: "back it up with an example".
    - A figure that isn't in the user's material. Resume dates don't count, and ad figures are only allowed in the opening and close. The user's own details, such as a phone number typed in, count as their material (v8).
    - Clichés ("team player", "passionate", "I am writing to express my interest", …), matched as whole words.
  - Wrong-job and gap checks (v8), described above.
- The breakdown also lists key skills the user has but hasn't mentioned.

## Downloads
- **Word:** Calibri, A4, navy letter-spaced name, contact line with a rule, justified paragraphs.
- **PDF:** jsPDF 2.5.1 (cdnjs), Helvetica, the same layout, justified.
- Both are saved through the `downloads` capability. The filename is "<Name> - Cover Letter - <Role>.docx/.pdf".
- Tested on the user's resume:
  - The Word file passed the Office format checks.
  - Both the Word and PDF files rendered on one page.
  - No sideways scrolling at phone size, and no errors.

## v8 tests (simulated Chrome AI)
- **AI credits the Provaris hydrogen study to Worley and leaves [Company Name], [Start Date] and [Phone Number]:**
  - One correction turn fixed the employers.
  - Company, phone and email were filled from the fields.
  - [Start Date] appeared in the panel, and downloads unlocked once it was filled.
- **AI repeats the mistake:** the experience paragraph was rebuilt from the resume and noted in the breakdown.
- **Phone and company cleared:**
  - The checklist showed both as needed.
  - The panel asked for 3 details, and filling them updated the letterhead and the fields.
- **Typed edits:** wrong employer, title at the wrong employer, and title-only mix-ups were all flagged live.
- No errors, and no sideways scroll at 390px in dark mode.
