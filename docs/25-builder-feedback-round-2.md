# Create or edit resume: feedback round 2

## Opening page
- A file chosen on the Create or edit resume page is **read at once**. There is no "Upload to profile" button. The card shows "Reading it…", then "Read. Your details are filled in" with "Choose a different file", and Next goes on to the questions. A file that can't be read leaves the reason on the message line and the "Choose a different file" link. This is `autoRead` on `FILE_SETS.builder` (`20-resume-creator.js`: `bStageFile`, `bShowFileCard`, `bCommitFile`). Pasting a whole LinkedIn page is read at once too (the button now says "Read my LinkedIn page"). The cover letter and LinkedIn opening pages still have "Upload to profile".
- The sentence about LinkedIn not letting other sites read a profile is replaced by **How to download your LinkedIn profile as a PDF**: three steps, each with a picture (`#bLiHowto` in `index.html`, styles in `53-builder-round5.css`). The pictures are simple drawings made in SVG, not screenshots, and say so underneath. To use real screenshots, put the images in each `<figure>` in place of the `<svg>`. The steps go away once a file has been read.

## Sections that need an AI
- With no AI connected, each "Tell us about this job" and "Tell us about you" box is greyed out with a button over it: **Connect AI to use this section**. It goes to Choose your AI. Nothing inside can be reached with the keyboard while it is greyed out.
- "Connected" is now the same test as the Next button's "Connect an AI?" question (`aiIsConnected`, in `20i`). Before, a browser AI that still had to download its model counted as connected for the greying out, but not for the question.

## Job, qualification, project, volunteering and referee cards
- Buttons are **Delete**, **Hide** (and **Show**) and **Finish**. A job inside an employer's stack also has **Split**, which takes it out of the stack so it gets its own company heading on the resume. A split job that has other jobs at the same employer waiting also has **Stack**, which puts it back. Pressing either shows an Undo.
- Every one of those buttons explains itself when hovered or focused (`tipBtn`, `cardTips` in `20-resume-creator.js`; the words are read out as the button's description).
- How Split works: a job has a `grp` (empty by default). Jobs are stacked when they have the same employer **and** the same `grp` (`stackKey` in `20j-builder-v34.js`, used by the builder and by `stackRoles` for the preview and downloads). Split gives the job a `grp` of its own; a title added to a split job (+ Add a promotion or new title) takes its `grp`, so it joins that job.
- The paragraph about stacked jobs and the "Finish checks this job…" paragraph are gone; the second is now Finish's hover text.
- Finishing a card scrolls to the **first job, the first qualification, or the top of the Extras box** the card belongs to (Projects, Volunteering, Referees, Awards…), instead of the top of the page (`scrollToListStart`).
- If you press Next with an unfinished job, the notice under the cards is brought up to date as you finish jobs (`syncPending`). When none are left it turns green with a **Continue to …** button.

## Education
- A subject written as "Engineering (Mechanical)" is split into the subject **Engineering** and the discipline **Mechanical** (`splitDiscipline` in `19-profile.js`), whether it comes from an uploaded resume, LinkedIn or is typed. Only broad subjects that ask a follow-up (`VAGUE_SUBJECTS`, which moved to `19-profile.js` because the profile reads it when it loads) are split, and "(Honours)" stays. The qualification's name is unchanged: "Bachelor of Engineering (Mechanical)".
- A heading, **Academic highlights**, sits above Scholarships or awards, the subjects and the thesis.

## Extras
- An older single availability line ("Looking for full-time work. Available to start with two weeks' notice.") is sorted into the work type, the **When can you start?** list and the days and hours boxes (`migrateAvailability`, run for every profile that is loaded or imported). What's left over goes in "Days you can work", and the same sentence is never printed twice. The two grey notes ("Hours per week shows up here…" and "Saved from before…") are gone.
- **Awards**, **Publications** and **Interests** fold to a short summary of their lines when finished, like a finished job above them, with **Edit** to open them again.
- Referees on an uploaded resume are read into **one referee each** (`parseReferees`): everything on one line, one detail to a line, or labelled "Name:", "Role:", "Phone:", "Email:". A blank line, a new "Name:", or a name after a phone or email starts the next one.

## Fit to one page / two pages
- One press now fits twice. It fits by the design's estimate, draws the preview, measures how far the estimate was out, then fits again to the measured size: anything hidden that still fits is put back (each put-back is checked on the preview), or a little more is hidden if the preview still shows too many pages. The note under the buttons says how far out the first estimate was.

## Tests
- `tests/builder-round5.test.mjs`: referee layouts, availability lines, subject and discipline, and Split.

## Round 3
- **Connect AI is a pop-up.** The greyed-out AI sections, and the "Connect an AI?" question on the resume, cover letter and LinkedIn opening pages, now open Choose your AI in a pop-up over the page (`openConnectPopup` in `36-connect-ai-page.js`: it moves the Choose your AI section into a dialog and puts it back on close). Closing it returns to the same page, and the sections follow whatever was chosen. If an AI is connected when it closes, Next carries on.
- **With no AI connected the AI boxes are always folded** (`aiGateMark` in `20g`, and `aiBoxOpen`), including after coming back from the pop-up. Typing bullet points by hand and "+ Add a bullet point" still work without an AI.
- **Year 12 certificates are written in full:** "Year 12" with the certificate WACE shows "Year 12 Western Australian Certificate of Education (WACE)". Also done for VCE, HSC, QCE, SACE, TCE and NTCET (`SCHOOL_CERTS` in `19-profile.js`). Anything else stays "Year 12 (…)". A resume that says "Year 12 (WACE)" is written in full when it is read.
- **Languages:** the empty row has a (greyed) × so the boxes don't change size when a language is added.
- **Your summary** says (optional).
- **Save to my profile…** on the Review page is blue. Leaving the builder from the Review page (to another part of the site), or closing the tab, with a version that isn't saved asks: save it (or make a free account if there isn't one), leave without saving, or stay (`20l-builder-leave.js`). Saving, or opening a saved version, counts as saved until something changes.

## Round 4: Create or edit cover letter
- **No upload button.** A resume, LinkedIn PDF or old letter chosen on the cover letter's opening page is read at once (`autoRead` on `FILE_SETS.letter` and `FILE_SETS.letterOld`). A pasted LinkedIn page is read at once too; its button says "Read my LinkedIn page". As on the resume page, the details go into the same saved profile data, which is not a separate upload.
- **Layout step like the resume's** (`renderLetterDesigns` in `23a`): a "Search designs" box of filters that switch on and off (the same filters as the resume), the designs (12 at a time, with "Show more"), **Colour**, **Font**, **Line spacing** and **Page margins**. A design, colour or font chosen here changes the letter only (`cv.letterAccent` / `cv.letterAccentFor`, `prefs.letterFont`; `letterStyle` and `letterAccentOf` read them). Tailor to a job keeps its smaller box (`renderLetterDesignsCompact`).
- **Before you send it:** with no AI connected, the Reword buttons go to the paragraph and select the sentence they are about, instead of opening Reword (`ckFix`).
- **Copy text and Copy as email are gone.**
- **Leaving the cover letter page** with a letter that has changed since it was opened or last saved asks to save it to the profile, like the resume's Review page (`20l-builder-leave.js`). Saving a letter now needs an account where accounts are switched on, as saving a resume does.
- **Who is this letter for?** has a third choice, **An email template**: a template (placeholders for the job and company) written as an email: a subject line, no letter head or date, the name and phone under the sign-off, and "My resume is attached." at the start of the close. Download is plain text only (`BL().mode === "email"`, `ltEmail()`).
- **What your letter is written from can be changed** (`23g`): each row has **Change**: your details (edits the profile's contact details), your best proof (choose any line of your resume, or write your own), your study (choose which qualification), your skills (tick the ones to name). Each job-ad requirement has "Use a different proof" (any line of your resume, or none). Choices are kept in `BL().use`; they go to the AI as notes (`lwInputs`) and shape the no-AI letter (`lwEdu`, `lwSkillsUse`, `lwPinFirst`).

## Round 5
- **Choose your AI, Gemini:** connecting a key (and the "Test it" button) tests Gemini 3.5 Flash-Lite only. It no longer steps through models, and it no longer saves a lower model as the one in use (`aicTestKey`, `aicTestNow` in `36-connect-ai-page.js`).
- **Cover letters are only written by the top Gemini model** (`gemini-3.8-flash`, `AI_PROVIDERS.gemini.model`). `topOnly` is set on the cover letter writer (`adviceWrite`) and on every AI call made while the cover letter page is showing (`aiJSONInner`). With a Gemini key: if the key is set to any other model, `aiTopGate` stops the call before anything is asked; if the top model doesn't answer, there is no fall back to an older version or to Flash-Lite (`aiChatInner`). Either way the error is `top_only`, nothing is written, and Write all puts back the letter you had and says why (`lwStart`). Other AIs are not affected.
- **Upload my resume or LinkedIn on the cover letter page is temporary.** What is read goes into `ltTemp` and is used only while the cover letter page is showing (`P()` returns it there). Nothing is added to the profile; the design choices (`cv`, `prefs`) stay the profile's own. "Choose a different file" or "Read from my profile" lets it go; it is also gone on reload. Details edited under "What your letter is written from" change this temporary copy.
- **Job title you are applying for** is at the top of the Cover letter step, not the Layout step.
- **Layout step:** "Search designs" is a collapsible card like the resume's cards; the design cards are the same size as the resume's (the letter's own larger grid is gone); a **Spelling (language)** menu is added, the same as the resume's.

## Round 5 correction
- Cover letters may be written by **Gemini 3.8 Flash, Gemini 3.6 Flash or Gemini 3 Flash** (`GEMINI_WRITERS`, `geminiWriterOk` in `14-ai-engines.js`), not only 3.8. The one the key is set to is tried first, then the others in that order when it is busy, over its limit or not found. Flash-Lite and every other model are refused: a key set to one of those, or all three failing, gives the `top_only` error and nothing is written. A refused key stops straight away.

## Round 6
- **Loading text names the model.** The progress lines on the page ("Writing your cover letter with Gemini 3.8 Flash…"), the bar at the bottom ("Gemini 3.8 Flash is working…", with Stop) and the corner card ("Writing with …") say which model is being used. When a model doesn't answer and the next is tried (Gemini 3.8 → 3.6 → 3 for a cover letter), the lines change to "Gemini 3.8 Flash didn't answer. Writing your cover letter with Gemini 3.6 Flash…". `aiModelLabel`, `aiNowLabel` and `aiSetModel` are in `14-ai-engines.js`; each call passes `onModel` so its own progress line follows.
- **Disconnect stops every AI request.** Disconnecting, removing the key or switching AI now calls `aiStopAll` (from `setAiEngine`), which also cancels connection tests (`aiExtraCtls`), and hides the bar and the corner card.
- **Cover letter Layout step:** the filters sit under the heading with no collapsible box. The matching resume's design has a tick stamp at the top right of its card instead of the "Your resume's design" label; hovering it says "Matching resume uploaded" (a file brought in for this letter) or "Matching resume from profile".

## Round 7
- **Matching resume stamp** is a small resume (page with lines) icon, not a tick.
- **Effort for Write all** (`ltEffortRender`, `LW_EFFORT` in `23e-letter-writer.js`): above the Write all button, **Low / Medium / High (recommended)**, each with a time. Shown only for an AI that thinks (a Gemini 3+ key, or gpt-oss); High is the default. The choice (`BL().effort`) goes to the AI as its reasoning effort. The times start from a rough guess (medium about 12 s plus 0.05 s a word, low half of that, high double) and are replaced by the person's own recent letter times, kept for each level and scaled between levels when a level has none yet.
- **The AI is told what the letter is judged on.** The prompt has a `<judged_on>` block (`adviceJudged` in `14c-letter-advice.js`), written from the same rules as "Before you send it": the same words in two paragraphs, where a degree, date, tool, project or employer may appear, repeated words, habit and banned words, sentence and paragraph lengths, the opening, tense, numbers, dashes and spelling. It says words that belong to the job (the job title, its field: "engineering" in an engineering job) may repeat as often as the job needs.
- **The checks agree:** the "words used again and again" check no longer marks the job's own words (`clJobWords`, `opts.jobWords` in `coverQuality`).
- **Sign Up:** the leave-page question's button says "Sign Up" (it said "Make a free account").
