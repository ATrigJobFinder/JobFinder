# v23: resume builder, cover letter and Tailor to a job polish

Build with `npm run build` (writes `dist/job-finder.html` and `dist/index.html`). Nothing here needs a new database step.

## Everywhere

- **Choose your AI** replaces "Connect your AI" in the side menu, the page title, the buttons and every message that points there.
- **Side menu** opens the moment the pointer touches it (it used to wait 120 ms) and closes 140 ms after it leaves (`setPeek`, `18-app-shell.js`).
- **(i)** is a solid grey disc with a cut-out "i", drawn with a CSS mask so it follows light and dark mode (`.hinfo`, end of `25-v22.css`). It turns the accent colour on hover.
- **Upload boxes** (`.drop`) centre their buttons and words both ways. The stray (i) inside them is gone.
- **Previews are real pages.** `mountPaper` (`22-cv-renderers.js`) now shares the content over A4 sheets: anything that would straddle a page edge is pushed onto the next page (a heading goes with the line after it), and a grey gap marked "Page 2" separates the sheets. This applies to the resume builder, Templates, Tailor to resume, both cover letter previews and the cover letter in Tailor. The page count and "fit on one page" maths read from it.
- **Highlight** on the preview is lighter (less opaque fill, thin soft outline). On the Goal and Summary steps a faint "Your profile goes here" placeholder shows in the preview until a summary exists, so the Profile section can always be highlighted (`ghostSummary` in `cvModel`).
- **Bottom message with Undo.** `actToast(text, undo)` (`18-app-shell.js`) shows at the bottom of the screen for 3 seconds. "Saved. It's on your resume. Undo" uses it; the line under the card is gone.

## Create or edit resume

- **Cards:** the grip is a clean 6-dot icon (not "⋮⋮"). **On your resume / Draft** and **Hidden** sit in fixed columns, and the dates in another, so they line up down the list. Typing a job title no longer overwrites the grip with the title (that was the "double up" when editing a draft).
- **Moving things slides.** Move up, Move down, dragging a card, Sort by date, Sort by level and dragging a bullet point all animate (FLIP, `flipCapture`/`flipPlay` in `20f-builder-v23.js`; set `builder.animate = true` before `renderBuilder`).
- **Bullet points** have a grip on the left: drag one up or down. **Action words** can be dragged onto a bullet point (or clicked after clicking into one) and replace its first word.
- **Try again…** no longer deletes anything first. It asks what you want (More formal, More casual, Shorter, Longer, More about results, More about teamwork, or your own words), writes the new bullet points, swaps them in for the AI's last ones (only the ones you haven't edited), and offers Undo. The "Added 3 bullet points above" box and "Written and polished by…" line are gone.
- **Reword** must change more than one word (`changedWords` in `10-skill-weaving.js`): AI answers that only swap one word are refused, and the no-AI version swaps the verb plus a phrase (`PHRASE_SWAPS`). Reword and its "up to three other ways" line are gone from Awards and achievements; the Awards ✕ now removes its box.
- **Summary:** Write it again now has to include "What's one result you're proud of" (numbers checked in `proofMissing`; the standard version already did). **Reword…** opens Another way to say it, Shorter, Longer, More casual, More formal, and a box for your own instruction.
- **Education:** Sort by level puts a doctorate first and Year 10 last (it was the other way round), with Honours above a plain bachelor. "Now in order of level… Undo" sits under the sort buttons. **Relevant subjects** is an input that turns each answer into a bubble: click one to remove it (with Undo), drag to reorder; only the first 3 show on the resume (`subjectsQ`). "Add a thesis or major project" and "Remove the thesis or project" are both buttons.
- **Contact:** the line under Driver's licence is under the choices.
- **Skills:** Software and tools and Technical skills suggest things that go with what you've already picked ("Goes well with what you've picked", `RELATED_CLUSTERS` in `21a-suggestion-lists.js`). After **Suggest more**, a small underlined **hide** folds the list back.
- **Review:** Choose what goes on this resume has a tick box for the driver's licence straight under Profile. **Fit on two pages** raises the bar to two pages ("About 56 lines. Two pages hold about 102…"); Fit to one page puts it back.

## Create or edit cover letter

- **Each paragraph stays in its lane** (`lwFacts`, `23e-letter-writer.js`): Opening gets level, study and main skills; Experience gets the job; Education and skills gets study, subjects, tools and certificates (no jobs); Why this company gets strengths and what you want next; Close gets availability and one strength or skill. The prompt says so, and a paragraph that names one of your employers outside Experience is sent back (`lwScopeProblem`).
- **Reword as…** is laid out in pairs: Length (Shorter −25% | Longer +25%), Tone (More casual | More formal), Or (Another way to say it | To fit the page). **The whole paragraph / One sentence** picks a single sentence to reword; the options replace just that sentence.
- **Template mode** no longer flags "x gaps to fill" (it says the gaps are meant to be there).
- **Tailor it to a job** button is gone from this tab.
- **Check the whole letter with AI** (`23f-letter-fullcheck.js`): one AI pass fixes repeated words, long sentences and ideas said twice, keeping every fact, number and [gap]. The changes go into the letter; **Go back to my original** puts a paragraph (or all of them) back, and **Use the checked wording again** redoes it. Without an AI it lists what it found.

## Tailor to a job

- **Score out of 100:** Must-haves 25, ATS readability 20, Hard skills 20, Education 15, Soft skills 10, Recruiter tips 10. Must-haves is first in the Score breakdown (met counts in full, "check it yourself" counts half). "Other key terms" is no longer scored. `analyse` now works out the must-haves itself (`res.needs`), so the before and after scores in Tailor agree with the dial.
- **Start over** asks first: the button changes to "Clear it all? Press again" for four seconds. (Nothing to lose in the example, so it just clears.)
