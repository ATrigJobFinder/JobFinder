# v29: a more modern look, and a new Find jobs filter bar

## Look (whole site)
`src/styles/33-modern-look.css` is the last stylesheet, so it overrides the older ones.
- Buttons (`.btn`): rounded, soft gradient and shadow, a small lift on hover, a pressed feel. `.btn.primary` is a gradient.
- Drop-downs (`select`): rounded with their own arrow.
- Search boxes (`input[type="search"]`): soft pill with a glow when focused.

To go back to the old look, delete `33-modern-look.css` and run `npm run build`. (The Find jobs filter bar styles live in the same file, so the bar falls back to unstyled boxes. To keep the new bar and drop only the global look, delete the first three sections of the file, down to the Find jobs heading.)

## Find jobs
- "Searching by:" roller (Job Title, Education, Geography, Strong applicant). It writes to the search bar's matching box: `q`, `edu`, `where`. Strong applicant keeps jobs you match at 60% or more, and the search bar narrows them. What you typed under another heading stays on and shows as a chip.
- Pay from / up to drop-downs ($40k to $250k a year). Pay in each ad is read into a yearly range (`parsePay`: `$75,000 to $82,000`, `$90k`, `$26.50 an hour`). Ads with no pay are hidden while a pay filter is on.
- On-site / Hybrid / Remote toggle (click again to turn off).
- Removed: the "Let employers find you" box (`#jbTalent`) and its code (`renderTalentCard`, the Join/Hide/Update talent-pool buttons). Employers can still see anyone already in the talent pool.
- Fixed: `renderJobs` called `renderDbExtras`, which doesn't exist in this build, and threw an error each time.

## Resume builder fixes and one look for form fields
- (i) help icons are added in the same frame a form is redrawn (`36c-field-help.js`), so they no longer vanish and pop back when you tick a driver's licence.
- Location boxes in Experience and Education are marked `nofill` (random name, read-only until focused, `autocomplete="nope"`), like the Referees fields, so Chrome doesn't fill them.
- Referees' phone uses the same country-and-number box as Contact (`phoneQ({ path })` in `21-resume-creator-inputs.js`). The country is kept beside the number as `phoneIso`.
- `36z-ui-polish.js`: a double-click on a button, list option or drop-down no longer selects words or leaves a box lit.
- `33-modern-look.css` (last section): text boxes, drop-downs, the phone box, pick lists, chips, segmented switches and cards share one corner size (`--field-r`), fill, hover and focus ring.
