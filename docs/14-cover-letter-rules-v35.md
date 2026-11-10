# Cover letter rules, the plan and the quick questions (v35)

The idea, from the cover letter AI spec: **the person supplies the facts and the reason, the AI supplies the wording, and code checks every number, every name and every banned phrase.**

Both cover letter writers use it: **Create or edit cover letter** (`23e-letter-writer.js`) and **Tailor to a job** (`15-cover-letter.js`).

## Where it lives

| File | What it is |
|---|---|
| `src/scripts/14b-letter-rules.js` | `LR`: pure functions, no page, profile or AI. The banned list, number grounding, Australian spelling, unknown names, the copy guard, per-paragraph and between-paragraph checks, the ad's instructions (no cover letter, pitch, selection criteria, salary, word limit, checks), situation, length, dates and years, the greeting, Re: line, email subject, the fallback close, and the questions. |
| `src/scripts/23h-letter-plan.js` | The plan panel (situation, length, quick questions, referral, move, trial shift), the notes the writers are given, Lock, Add a detail, Different example, Copy as email, and the close facts put in by code. Used by both pages. |
| `src/styles/48-letter-plan.css` | Styles for the above. |
| `tests/letter-rules.test.mjs`, `tests/letter-fixtures.mjs` | Unit tests for `LR` and the three fixtures from the spec (Alex, Jordan, Mia). `npm test` |
| `scripts/letter-golden.mjs` | The golden run: prints the three fixture letters with what the code-side rules say about each paragraph. `npm run golden` |

## What it does

**Both writers**
- One banned-phrase list: the resume scanner's, the old cover letter list and the spec's extras. The checker (`coverQuality`, 14a) and the writers use the same one.
- Every figure in a paragraph must be in the facts that writer was given (number words, "per cent" and `$70,000` are normalised). A name that isn't in anything the person gave is refused.
- Australian spelling is put right in code. The greeting is the person's chosen name, else the one in the ad ("Applications to Ms Rahman"), else "Dear Hiring Manager,", and never a guessed title. The Re: line carries the job's place and reference. The close gets the salary (only when the person gave one), the licences and checks the ad asks for that they hold, and a paid trial shift, in code, if the writer left them out.
- The situation (first job, career change, returning to work, stepping back, internal, expression of interest) is worked out from the resume and can be changed. A referral (only with permission) and a move become notes in the facts.
- Length: standard (250 to 400 words) or short (180 to 300), by situation and kind of job, changeable. A word limit in the ad keeps the letter inside it.
- An ad that says not to send a cover letter, or asks for a pitch or selection criteria, is said so before anything is written; the person can still choose to write one.
- "Copy as email": subject line, no letter head or date, "My resume is attached." at the start of the close.

**Create or edit cover letter**: the panel under "What your letter is written from"; Lock (typing locks too), Add a detail and Different example on each paragraph; Start from my profile keeps locked paragraphs and writes again any paragraph that repeats another's words.

**Tailor to a job**: the same panel on the cover letter step; Lock and Add a detail on each paragraph (Write it again keeps what is locked); a second turn with the bigger AI when a paragraph uses a banned phrase.

## Differences from the spec

- The planner is code, not an AI call. The site already matches resume evidence to the ad's requirements (`lwNeeds`, `lwProofs`), so the plan, the hook and the questions come from that.
- The resume is already structured in the profile, so there is no resume-extraction call. The ad is read by the site's existing rules plus `LR.adInstructions`.
- The writers keep the site's existing shape (the Create or edit writer makes one sentence per field; Tailor writes the whole letter), with the spec's checks added to them.
- Not built: the recruiter-note mode, and a pitch/selection-criteria writer (the notice is shown instead).
- The spec's "I/My at most 50%" rule is applied from 8 sentences up, like the site checker; the spec's own Mia example letter is short enough to start 6 of 7 sentences with "I".
