# Job Finder v11: Resume creator and LinkedIn upgrades (28 Oct 2026)

Version 11 of the Job Finder artifact (same URL). These changes came from Andrew's review of the Resume creator. Shared-data rules are unchanged from v10.

## Resume creator

**Order (9 steps):** Layout, Goal, Contact, Experience, Education, Skills, Extras, Summary, Review.
- **Layout first.** Choose the kind of work, then one of the 11 designs (best matches first) and a colour. The preview and downloads use that layout. The Review step offers "Change layout", and warns when a two-column design is used for job portals.
- **Summary near the end,** so it can draw on everything else:
  - Its four questions are filled in from earlier steps the first time (degree and uni, top skills, a bullet with a number, target job).
  - The summary box stays hidden until "Write my summary" is clicked (or "or write it myself").
  - The prompt now includes finished jobs' bullets, grades, certificates, projects and awards.

**Inputs**
- **Capitals.** Names are capitalised when you leave the box, handling Mc, O'Brien, double-barrelled names and particles like "van" and "de". Job titles, employers, degrees and universities typed all in lower or upper case get Title Case, keeping acronyms like RMIT, UWA, HVAC and IT. Emails are lower-cased.
- **Segmented boxes:**
  - Phone: a country code (default AU +61) plus the number, spaced the usual way ("466 022 120"). It's stored as "+61 466 022 120".
  - Location: suburb or city plus state. The state is filled in automatically for known places, e.g. "North Melbourne" gives VIC.
  - Grade: the number plus a unit (WAM, GPA out of 7, GPA out of 4, ATAR or Other). The unit is guessed from the number (over 7 is WAM, 4 to 7 is GPA out of 7, up to 4 is GPA out of 4) and switches if the number no longer fits. On the resume: "WAM: 64.52", "GPA: 3.3/4".
  - Dates: Started, Finished and "I work here now" sit on one row.
- **Suggestions while typing:**
  - Browser autofill attributes on contact details.
  - Lists for job titles, employers, about 60 Australian universities and TAFEs, common degrees, places and driver's licence types.
  - Picking a university fills in its city.
- **Dates.** Type "Nov 2012", "11/2012", "11/12" or "2012-11". A "Show dates as" switch (Nov 2012 or 11/2012) controls how they appear. They're stored as "Nov 2012".
- **Enter** moves to the next box in the same section. It skips the country code and a state that's already filled. At the end of a section it jumps to the Finish or Next button. Shift+Enter gives a new line, and multi-line boxes (awards, project details) keep Enter for new lines.
- **Blank values.** "-", "n/a", "none" and the like are treated as empty, so no "• -" lines appear.
- **Availability.** "When can you start?" (immediately, 1, 2 or 4 weeks' notice, or a date) plus days and hours. On the resume: "Available to start with two weeks' notice. …".
- **Skills step order.** Software and tools, licences and certificates, then technical skills, languages and strengths.
- **No jolt when adding a job or qualification.** Other cards keep their state, the page doesn't move while it redraws, then it scrolls smoothly to the new card.

**Bullet points**
- **Fuller AI bullets.** 4 to 6 bullets of 14 to 28 words: what you did, how (the tools and people you named) and the scale or result. Suggestions under 9 words are dropped.
- **Vague answers.** A responsibilities answer like "Normal sales stuff" gets a prompt to list real tasks.
- **No-AI fallback is richer:**
  - Achievements come first.
  - Short tasks are grouped two or three to a bullet, with tools and team or customer details added.
  - Gerunds ("Hitting") become verbs ("Hit").
  - Weak openers are swapped ("Responsible for" becomes "Managed").
- **Suggestions are editable** before you add them. After the first run the button becomes "Suggest more" (new ones, no repeats) plus "Try again".
- **Fix buttons on coach notes:** action word, add more detail, too long, I/my, past or present tense, buzzwords. "Add one" asks for the number, then works it in.
  - Each fix goes AI first, then built-in rules.
  - A fix is only accepted if the problem is gone and no facts were added or lost.
- **Reword** offers three wordings. Without AI it swaps the opening verb.
- **Text boxes grow** to fit their text.

**Finishing entries**
- Each job and qualification has "Finish this job" / "Finish this qualification". What finishing does:
  - Checks the required fields (title, employer, start date and at least one bullet).
  - Tidies the entry: capitals, tense, no full stops, blank values cleared.
  - Polishes it with AI. The AI must keep the same number of bullets and the same facts, and may only change the capitals of names.
  - Marks it "On your resume", with Undo.
- **Only finished entries** appear in the preview, downloads and the text version. Entries saved before v11 count as finished.
- **Leaving Experience or Education with drafts** offers "Finish them and continue" or "Continue without them".

**Whole-resume AI check (Review step)**
- **How it works:**
  - Tick "Keep it to one page" if you want that, then "Check my whole resume".
  - Every line has an id. The AI suggests up to 8 edits (cut, shorten or rewrite) plus advice.
  - You accept or keep each one, or accept the rest in one go.
- **Rules:**
  - Rewrites can't add facts.
  - Every job keeps at least two bullets.
  - Referees and Strengths can only be cut, not rewritten.
- **Without AI,** built-in rules cut in this order: interests, then the referees line, then bullets without numbers from older jobs, then coursework, until it fits. Long bullets and bullets without numbers get advice.
- **After accepting,** the page count updates ("It now fits on one page").

**Chrome AI download.** A progress-bar card in the corner replaces the "Downloading … 100%" text. It only appears while the model is really downloading. While AI is working, a moving bar shows under the status message.

## LinkedIn review
- **Profile link field,** prefilled from the resume:
  - "Open my profile" opens it.
  - The link is checked for random characters at the end, which ticks or unticks the custom-URL item and suggests a cleaner link.
  - The page explains that LinkedIn doesn't let other websites read profiles, so the PDF export is how to import.
- **"Write my About with AI"** sits next to the About box, with "Use this" and "Copy".
- **"Complete, back to Home"** at the bottom of the results marks the LinkedIn step reviewed on Home.

## Testing
- New test of the whole flow with no AI, with a simulated Claude (including a bad first answer, which was rejected and retried), and at phone size in dark mode (no sideways scroll).
- Earlier tests (scanner, cover letter, tabs, tracker, LinkedIn import, job board and hiring, interviews) all still pass.

## Source
- New file `src/resume-plus.js` holds the inputs, finishing, fixes, reword and AI check.
- Changes to `builder.js`, `profile.js` (fields `phoneCode`, `prefs.dateStyle`, `prefs.onePage`, `startWhen`, `gradeType`, `done`), `cvtemplates.js`, `linkedin.js`, `ai.js` (bullet prompt), `app.js` (download bar), `builder.css` and `more.css`.
