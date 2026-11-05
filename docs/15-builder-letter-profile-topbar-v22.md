# v22: undo, resume builder changes, cover letter sections, profile, top bar, Find jobs

## Two new database steps (Supabase > SQL Editor > New query > paste > Run)

| File | What it switches on |
|---|---|
| `supabase/migrations/004_support_messages.sql` | The **Contact or help** page. Messages arrive in Supabase > Table Editor > `support_messages`. Until it's run, the form says messages can't be received yet. |
| `supabase/migrations/005_delete_account.sql` | **Delete my account and all data** on the profile page. Run `003_user_docs.sql` first. Until it's run, deleting says the feature isn't switched on and changes nothing. |

## Undo and redo

Ctrl+Z (Cmd+Z on a Mac) undoes the last change to your profile: typing in bursts, deleting a bullet point, using an AI wording, sorting, importing. Ctrl+Y (or Ctrl+Shift+Z) redoes. The arrows at the top of the page do the same. While you're typing in a box, Ctrl+Z first undoes that box's own typing; once you've stopped for a few seconds it undoes the whole profile. It keeps the last 80 steps for this visit.

Code: `src/scripts/19a-undo.js`; `touchProfile` in `19-profile.js` records each step.

## Top bar

The bar is solid with an accent line so it stands out. Undo, redo, **Contact or help**, then **Log in** and **Sign up** (with a **Profile** link while you are signed out). Once signed in, your initial and name are one button that opens a menu: Profile, Create or edit resume, Create or edit cover letter, Contact or help and **Sign out**. Create or edit profile moved from the side menu to the top bar. The two menu items **Create or edit resume** and **Create or edit cover letter** get a yellow dot while something is unfinished (hover for the reason).

The top bar also shows which AI is connected (Chrome on this device, your own AI, or none yet); pressing it opens Connect your AI.

## Resume builder

- **Imports:** after a resume or LinkedIn import, the "Start from what you already have" box closes and a green message says it loaded.
- **Contact:** driver's licence is a set of vehicle types you tick (car, motorcycle, light, medium, heavy rigid, heavy combination, multi-combination). It is added to Licences and certificates for you.
- **(i):** opens after a 0.15 second hover, is grey, and the one on bullet points sits on the "Bullet points" heading, not on every bullet. Wording changes are in `36c-field-help.js`.
- **Experience:** "Tell us about this job" stays open and is marked "For the AI only: not on your resume". Bullet points are marked "This is what your resume shows, word for word". "Suggest more" is gone. "Need a word to start a bullet point?" is inside each job. Cards drag by the dots at their left. Sort by date is at the top of the page.
- **Education:** Sort by level; second degree boxes come before the tick box; "+ Add a thesis or major project" opens a kind (Thesis, Major project and so on) and a title box; the resume still prints "Thesis: Title". Resumes show the 3 subjects closest to the job.
- **Finish** no longer polishes jobs or qualifications with AI (it only tidies and adds them to your resume).
- **Dates:** "12 2023" works as well as "Nov 2023", "12/2023", "November 2023". A finish before the start shows an error and stops Finish. Volunteering dates are optional.
- **Strengths** can be up to 12, and all show on the resume.
- **Awards and Publications** are one box per line with an Add button.
- **Review:** the AI check box is gone. **Fit to one page** and **Fit on two pages** hide the least useful things, and press again to tick back what now fits. A design with a side column is counted column by column. Spelling is one menu. The three "What next?" cards are Most useful (cover letter), Do this next (LinkedIn), Quick win (tailor to a job).
- **Preview:** scrolls on its own, marks the part you're editing in yellow, and shrinks a very long name rather than breaking a word.
- **Downloads** ask for the file name first.

## AI wording

If an AI's reworded awards, project or volunteering lines fail the fact check, they are now shown anyway, with a note saying exactly why (for example "the number 40% isn't in the facts"), instead of "Rewording this needs AI". When a rewording is thrown away for changing facts, the message is red and says which: "added" (something not in your details came in) or "dropped" (something was left out). It also no longer asks the AI a second time, which was doubling the wait. After 15 seconds the message says a small AI can take up to a minute.

## Cover letter page

Two sections, **Layout** and **Cover letter**, each with the designs or the letter on the left and the preview (centred in its box) on the right, like the resume builder. Downloads and the three "What next?" cards are in the Cover letter section. A choice between **A specific job** and **A template for any job** (the note on what the two choices do is an (i) beside "Who is this letter for?"; a template has no job, company or addressed-to boxes; they stay yellow placeholders such as "[Company name, e.g. Sydney Water]", and the greeting is "Dear Hiring Manager,"). **Reword** stays within about 15% of the paragraph's length; **Reword to the right size** aims for the recommended length. The 1 or 2 pages choice is gone. The letter starts in your resume's default design, listed first with a tag; choosing another design changes the letter only, never the resume (the old "match" tick box is gone). **Next** at the bottom of the Layout section moves to the Cover letter section. **Cover letter strength /100** sits above the preview, like the resume's. **Start from my profile** shows "Writing your cover letter from your profile…" and moves to the Cover letter section. **Use a cover letter from my profile** lists the letters you've saved. Sign-off shows one **More** button; it opens six choices and folds away again when you pick one. The AI no longer rejects cover letter wordings for adding or dropping facts (it still keeps your [bracketed gaps], length and style rules). When an answer is still rejected, the red message says which rule and the AI's actual wording is shown under it. Three "What next?" cards at the bottom.

## Writing the cover letter sections with AI (`src/scripts/23e-letter-writer.js`)

Built so a small or fast model (Gemini Flash-Lite, Chrome's built-in AI) gets each section right:

1. **Code picks the facts** each paragraph needs (role, company, kind of work, the best two or three bullet points, study, tools), not the whole profile.
2. **One call per paragraph**, with a short prompt, one worked example, and a JSON shape with **one field per sentence** (`s1`, `s2`…), each with its own small job (for Experience: scene, first action, other action, result with number, why it matters).
3. **Code checks every sentence** (length, capital, full stop, no dashes) and the whole paragraph (clichés, no more than two sentences starting with "I", long enough). A missing full stop is put back. If a check fails, the AI is asked once more and told the exact field that was wrong.
4. **Never a hole in the letter:** a paragraph the AI can't get right is filled with the standard (no AI) version, with the AI's own words shown under it. After two paragraphs in a row fail with an error (for example a bad key), the rest are written without AI. A rate-limit answer waits 5 seconds and tries once more.

**Start from my profile** runs this for all five paragraphs in turn and shows "Writing your cover letter: Experience (2 of 5)…". **Write with AI** on one paragraph runs it for that paragraph only. **What kind of work is this for?** (the same choice as the resume builder) is at the top of the Layout section.

**Letter type:** "A template for any job" is now the first (left) choice and the default, unless a letter already has a job, company or recipient typed in. **Replies cut off:** a model reached through a key (Gemini) is now told how long the answer will be, so a reword of three paragraphs gets enough room; if a reply still stops part-way it is asked again with twice the room, and if it fails the message says "the reply was cut off or broken" instead of showing a JSON error.

## Cover letter: fixing, made-up details, Reword as…, page fit

- **A rejected answer is fixed, not dropped.** When a paragraph, sentence or wording breaks a rule, the AI is shown the exact rule and asked to change just that part (up to three tries, "Asking the AI to fix just that part (try 2 of 3)…"). Only if it still fails does the standard version go in, with the AI's words shown. Code: `aiFixText` in `17-ai-prompts.js`, and the loop in `lwWrite` (`23e-letter-writer.js`).
- **Made-up details are red.** Numbers and skills in AI-written text that aren't in your profile get a red highlight in the paragraph box. Hover one: **Keep and save** adds a skill to your profile (a figure to `prefs.okFacts`) so it isn't flagged again; **Discard** takes a skill out of the sentence, or turns a figure into a `[a figure]` gap. A warning row also lists them under the letter.
- **No invented companies.** The writer, reword and expand prompts say never to name a company, employer, product or person that isn't in the facts; in a template the company stays `[the company]`.
- **Expand with AI** is on all five paragraphs (Why this company and Close included).
- **Reword as…** replaces Reword and Reword to the right size. It opens: Another way to say it, Shorter, Longer, More casual, More formal, To fit the page.
- **Words that fit the page.** The preview is measured (how tall a word is at your design, spacing and margins, less the heading and sign-off) to give the words that fill one page, then shared between the paragraphs in rough proportion (`PART_SHARE`). It sets "aim for about N words" on each paragraph, the length warnings, the writer's target and the strength score. Code: `ltMeasureFit` in `23e-letter-writer.js`, `partMin` / `partTarget` in `15-cover-letter.js`.
- AI progress and suggestions use the resume builder's moving bar and blue suggestion box. Going back to Layout refits the design thumbnails. Pages can now be up to 1840px wide.

## Profile page

"What you've built" lists the names of your saved resumes under Resume and your saved letters under Cover letter. **Download my data** is now one zip with readable files. **Delete my account and all data** asks you to type "I want to delete my account and all data", offers the download first, and checks it's you (your password, or signing in again with Google, Facebook or Apple).

## Find jobs

The note about posting and the talent pool is gone. On a wide screen, opening a job puts the list on the left and the whole job on the right; on a phone it opens inside the list as before.


## Tailor to a job in four pages, a Stop button, and cover letter fixes

**AI**
- "Claude on your account" is gone (the page no longer reads `window.claude`), and so is the "If my chosen AI fails, use Claude" tick box. Without a working AI, the built-in rules fill in.
- A **Stop** bar (`#aiStopBar`, 14-ai-engines.js) shows at the bottom of the screen while any AI call runs (`aiBegin` / `aiEnd`; counted in `aiChat`, `withChromeAI` and `aiJSON`). Stop (`aiStopAll`) aborts the request in flight and bumps `aiRun.gen`; anything that loops (Start from my profile, `aiJSON`) checks the generation and stops, so later steps don't carry on. Stopped paragraphs get the standard (no AI) version and say so.

**Cover letter writing**
- A gap is any `[bracket]` or `{brace}` pair, empty or long, never running across another bracket (`GAP_SRC` in 14a-cover-craft.js). Pasted `[]` and the long "[one specific reason…]" gaps now highlight, and what you type between the brackets stays highlighted.
- Rewording and expanding no longer fail because the AI left out a `[gap]`.
- The closing (and every paragraph) never repeats a phone number, email address, link or LinkedIn: those are in the letter head. This is in the prompts and checked in code (`contactIn`), and the no-AI closing no longer adds them.

**Tailor to a job**
- Page 1: the job ad box fills its sheet; the Scan button sits on the right; "Optional: AI review" and "Remember my cover letters" are gone; the cover letter part has **Use a cover letter from my profile** and takes dropped files anywhere in it, like the resume above; the "when did you show it" boxes have no (i).
- "Save answers to profile and tailor my resume" now opens **Tailor to resume** (page 2) straight away. Half the screen is the resume to edit, with the ad's technical skills (green), soft skills (purple) and the ones not in the text (dashed chips) highlighted; under the skills sit the changes your answers made (what it said, what it says now; select one to find it in the text). The other half is the preview (it can highlight the key skills too).
- **Fit the job's criteria** is its own page (page 3), and the **Cover letter** is its own page (page 4). The (i) under "A few quick questions" now sits on the question's heading, so it no longer shifts the layout each time you pick an answer.
- Page 4 copies Create or edit cover letter: the letter details and paragraph boxes on the left (key skills highlighted in them), and on the right the Breakdown above the Cover letter preview, with a strength score. Point at a paragraph in the breakdown, the preview or the left and it lights up in all three; select it to jump to it.
- Anything optional left blank is left out: no `[XXX]`, and a sentence that still has a gap for something optional (where you saw the ad, availability, the hiring manager…) is dropped, or the greeting goes back to "Dear Hiring Manager,". Only the role, company and your name remain as gaps to fill.

## Version 24: Download as…, a cleaner score, and the tailor pages reworked

- **Download as…** is one button everywhere (Tailor to resume, cover letter, Create or edit resume, saved resumes, Templates, Create or edit cover letter). It opens a small menu: Word, PDF or plain text. Code: `src/scripts/11a-download-menu.js` (`dlMenu(id, {docx, pdf, txt})`, `data-dlmenu` on the button).
- **(i)** is sized in `em`, just under the text beside it.
- **Score breakdown:** job title is no longer scored (it can't apply before the resume is tailored). Each row explains itself on hover or focus (what it is, why it matters, its weight) and is no longer a link. **Details** opens a pop-up (`<dialog id="detModal">`) holding What this job needs, the highlighted ad, ATS readability and Recruiter tips.
- **Not relevant** is a quiet × that shows when you point at a missing skill's row.
- **Selection criteria** no longer pick up benefits. Headings with a curly apostrophe ("What’s in it for you?") are recognised, benefit lines (salary, bonuses, probation, schedule, leave…) are treated as company info, and a line ending in "?" is never a criterion.
- **Place your skills** is always open; the note box now asks "How did you show this? (optional)".
- **Tailor to resume** shows the resume in parts (`rsSplit`/`rsJoin`), with the changes your answers made under the part they sit in: the old words, the suggestion, and **Revert** (and "Use the suggestion again"). The preview is the resume in the person's own design (`resumeTextModel` in `18b-resume-template-preview.js` feeds `cvHtml`), and the match ring is filled to the number in it. Download as Word keeps an uploaded Word file's layout; otherwise Word and PDF follow the preview design.
- **Removed:** the Next buttons after the scan (except Cover letter only), Rescan with this version, Copy text on this page, and "I've applied" on this page.
- The progress bar follows the page you are on (step 5, 6 or 7).
- **Fit the job's criteria:** the criteria list is gone; every criterion (with its resume evidence) now goes to the cover letter prompt automatically (`fitForCover().criteria` and `.fit`). Must-haves are green, yellow or red bubbles. The pasted ad sits on the right. Answer chips write into their box and are redrawn in place (no more flicker of the (i)).
- **Cover letter page:** laid out like Create or edit cover letter. The Craft check sits under the sign-off, the per-paragraph cards on the right are gone (their warnings sit under each paragraph box and in the Craft check), the buttons run along the bottom, and **Tailor another job** replaces "Next: practise for the interview".
