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

## Profile page

"What you've built" lists the names of your saved resumes under Resume and your saved letters under Cover letter. **Download my data** is now one zip with readable files. **Delete my account and all data** asks you to type "I want to delete my account and all data", offers the download first, and checks it's you (your password, or signing in again with Google, Facebook or Apple).

## Find jobs

The note about posting and the talent pool is gone. On a wide screen, opening a job puts the list on the left and the whole job on the right; on a phone it opens inside the list as before.
