# Header menu, Choose your AI, and the resume builder (v25)

## The menu is a header bar (wide screens)
- From 900px up, the old sidebar is a bar across the top (`27-header-nav.css`): logo, the tools in a row, then Job seeker / Employer and the Developer button. Under it, the thin bar with the AI bubble, undo and redo, help and the account. On a phone it is still the drawer.
- Each item has a short name (`.sn-short`) and the full name (`.sn-full`, used in the drawer and as the tooltip). Below 1700px the icons go and only names show; below 1180px only icons show, with the name for the page you are on.
- The Developer button turns into **Viewing as visitor** while you look at the site as a new visitor. Press it to go back to your own data.
- The AI bubble's disconnect cross sits inside the bubble at the right, in grey.

## Home
- **Job or industry** is a dropdown that fills in as you type, like Location. Arrow keys move, Enter picks, Tab takes the grey completion. "No experience needed" is one of the choices.
- A strip along the bottom: "No experience? No worries." with a button that searches for jobs that ask for none.
- **Jobs near me** now flies down through the clouds to the map (when a Google Maps key is set; with no key it shows the card as before).

## Choose your AI
- Each way shows only its dot points and the recommendation. The long paragraphs and the "why does it take a while" notes are gone.
- The browser's own AI is named for the browser (`BROWSER_INFO`, `BROWSER_AI()` in 14). Chrome and Edge let a website use the on-device model. Opera's Aria and Brave's Leo are chat assistants that a website cannot call, so for those the page says so and points to WebLLM.
- Downloads are called out as one-time.
- Company choices are split into **Free** (Gemini, OpenRouter, Groq, Mistral, Cerebras, Hugging Face) and **Pay per use** (Claude, OpenAI, other). Mistral, Cerebras and Hugging Face are new and have not been tried with real keys.
- The Model size box is gone (it is still worked out from the model's name).
- A model, key or built-in AI only becomes the saved choice after its test passes. If the test fails, the previous choice is put back and the message says nothing was changed (`aicTrialKey`, `aicTestKey`, `aicTestBuiltIn`).

## Create or edit resume
- **Goal is step 1.** It asks where you are in your career (now including "Starting out, no experience yet"), then the industry, then the job title. The Layout step no longer asks what kind of work it is for; the Goal's industry picks the designs.
- **Step ticks:** green only when the whole step is complete, yellow while it is a draft (`stepState` in 20).
- **Experience:** "Turn into bullet points" is at the bottom of the "Tell us about this job" box. "Need an action word?" is the list's name. With no AI connected, **Fix** on "Start with an action word" opens that list.
- **Education:** "Education title" with a green "This shows on your resume" bubble, editable (`degreeCustom` stops the level and subject from rewriting it). "Show N subjects on my resume" is a number from 1 to 8 (`subjectsShown`). Hide from resume now says what it does.
- **Sort by** is one drop-down in Experience and Education: date, level (education) and **Re-order by hand**, which shows a short how-to.
- Cards have drag handles (including referees). Awards and publications lines have handles too. The Move up / Move down buttons are gone.
- **Referees:** the boxes ask the browser not to fill them in (they start read-only until you click in).
- **Extras:** Availability is now Days you can work and Hours per week.
- **Summary:** the four questions sit in the blue "for the AI only" box, with Write my summary at the bottom. "How should I structure my summary?" is a blue panel under it. Accept is on the right. The Summary step only turns green once it is accepted.
- **Skills and licences:** one card for each box with a count, and the ideas tucked under it.
- **Colour:** designs with a side column get a second row of colours for the side column.
- **Imported resumes** open every job and qualification as a draft. Pressing continue with drafts takes you back to the first one.
- **Choose what goes on this resume:**
  - A blue (i) box says how many pages the preview shows.
  - The lines meter follows the preview: if the preview shows one page, the lines used count as within the maximum.
  - Fit to one page checks both columns, then the preview, and keeps hiding until the preview agrees.
  - Two-column designs list column 1 (left) then column 2 (right), each with its own line count.
  - Sections, jobs and qualifications, and bullet points (jobs and volunteering) are dragged by their handles.
  - At most 4 skills can be ticked in a group, with the reason, and a "Keep my top 4" button.
- The preview scrolls to the part you are editing. Design thumbnails re-scale whenever their box changes size.

## Anything that needs an AI
Buttons that only an AI can do (Reword…, Try again…, Write with AI, Expand with AI) are greyed out and crossed through when no AI is connected, and pressing one goes to Choose your AI (`20g`). Turn into bullet points, Write my summary and Add a bullet point still work, because built-in rules fill them in.

## (i) icons
Checked and fixed in `36c-field-help.js`: Licences and certificates no longer shows the driver's licence text, a referee's name, phone, email and organisation no longer read as yours, a second degree's subject is no longer described as a level, a project's "For or with" is no longer an employer, and the new boxes have their own text.

## Not done, or only partly
- Tailor to a job does not bring back hidden entries by itself; the note on Hide says what it really does.
- Opera and Brave's own assistants cannot be used by a website.
- "Each part draggable" covers sections, jobs, qualifications and bullet points, not single skills or moving a section from one column to the other.

## Header drop-downs and developer options (later change)
- The top bar has Home, Your AI, **Application documents** (resume, cover letter, templates, LinkedIn), **Find work** (find jobs, tailor, company guides), Tracker and **Get ready** (interviews, aptitude tests, learning). Groups open on hover or focus, or when pressed. In the phone drawer they are plain headings.
- The Job seeker / Employer switch and the Developer button are hidden. **Ctrl+Shift+D** shows or hides both (turning them off while in Employer mode goes back to Job seeker). While viewing as a new visitor they stay shown.
- The blue line under the top bar and the box round a heading you've just moved to are gone.
