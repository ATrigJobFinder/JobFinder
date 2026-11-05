# Version 26: accurate highlights, editable previews, Tailor to resume and cover letter pages

## Highlights behind text boxes
- The cause of the drift: a `mark` has 2px of padding each side, and the highlight layer behind a box (`.hl-back`) is meant to take exactly the room the words do. Every highlight pushed the words after it a little to the right of the words in the box. The marks behind a box now have no padding, and both layers spell out the same type settings (`29-v26.css`).

## Previews you can type in (`18d-editable-previews.js`)
- Tailor to resume, the cover letter in Tailor, Create or edit cover letter and Create or edit resume. Select text on the page and change it. Headings, dates, the letterhead and the address block stay fixed, because they are built from other details.
- Each box on the page is a "block". When one changes, its owner writes the new words back to where they came from (`apply`); the page isn't rebuilt while you type, and is laid out again when you click away (`commit`).
  - Tailor to resume: the resume text (found by its words, ignoring spaces and capitals; if the words appear twice it can't tell which, so the change isn't kept).
  - Letters: the paragraph's box, the greeting and the sign-off.
  - Create or edit resume: the answer that holds exactly those words (`20h-builder-preview-edit.js`); a skills line goes back into its group. Anything it can't place is underlined with dots and goes back when you click away, with a note.
- The example resume (nothing finished yet) and a sample letter can't be typed on.

## Tailor to resume
- The editable boxes on the left are gone. The left shows the match, then **Changes from your answers** (grouped by the part of the resume they sit in, each with Revert and **Show in the preview**).
- The right is laid out like the cover letter: Resume preview and score, a **Breakdown** with **Where the ad's key skills appear** above the preview, then the design and the page. **Highlight the key skills** is on by default; **Highlight what changed** marks the words your answers added in blue.

## Tailor: cover letter
- The detail boxes are gone (they stay behind the scenes). **Ready to write** is kept; select a detail, or Edit, to correct it there.
- Opening the page writes the letter. It uses the letters added on the first page, or your cover letters from Create or edit cover letter and the ones you saved. A letter already written for the same job is left alone; **Write it again** makes a new one. If your name isn't known it asks for it first.
- The page follows the Cover letter tab of Create or edit cover letter: Your letter with each paragraph's word count, purpose and "Why this paragraph", the sign-off, **Before you send it**, and a Download section; the preview has the score, the breakdown, **Change design** and the page.

## Not done
- Per-paragraph Write with AI / Reword, and Check the whole letter with AI, are on Create or edit cover letter only: they write from your profile, not from a job ad.
- The designs preview in Templates is not editable (it shows a design, not your words).
