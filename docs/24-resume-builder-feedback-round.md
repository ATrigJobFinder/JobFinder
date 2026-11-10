# Create or edit resume: feedback round

## Goal step and layout
- The Goal step gets its green tick as soon as any starter button is picked (the career stage, or a job title). It used to need both (`stepState` in `20-resume-creator.js`).
- The Layout step always draws its designs with `EXAMPLE_PROFILE` (`19-profile.js`): the made-up person with every part filled in (summary, experience, education with awards and a thesis, skills, certificates, a project, volunteering, awards, a publication, interests, availability and two referees). The builder's own preview uses it too until something is finished. `SAMPLE_PROFILE` is unchanged and still used by the cover letter and the template gallery.

## Inputs
- Location boxes say "Suburb or City". A place typed exactly (for example "Parramatta") is still filled in with its state when you leave the box; one that could be several places still has to be picked.
- The folded "Tell us about this job" and "Tell us about you" boxes show more of what is inside (`47-builder-round4.css`).
- Education levels read "Incomplete or Junior Secondary (Year 10)" and "Completed Senior Secondary (Year 12)". What goes on the resume is still "Year 10" and "Year 12".
- **Scholarships or awards** is now the same bubble box as **Specific relevant subjects**: type one and press Enter, click a bubble to edit it, drag to rearrange. Both come from one editor in `20f-builder-v23.js` (`chipListQ`, with `data-fld` saying which list). Awards are stored one per line, so a comma can stay inside one ("Dean's List, 2024"); old text with commas shows as one bubble that can be edited. All awards go on the resume, in one line.
- The subjects box suggests school subjects (`HS_SUBJECTS` in `21a-suggestion-lists.js`) for Year 10 and Year 12, and the usual study areas plus school subjects for everything else. The text under both boxes now says to press Enter to add and drag to rearrange. The awards box has its own ideas (`AWARD_IDEAS`).
- Ticking Projects or Volunteering opens the new, empty entry.
- Capitals are no longer "corrected" in the builder (job titles, employers, schools, subjects, referees). Many words are acronyms. Imports from an uploaded resume or LinkedIn still tidy ALL CAPS headings.
- A job no longer needs a bullet point to be finished.

## Bullet points and the summary
- `BULLET_STYLE` (`17-ai-prompts.js`) is the Resume Advice rules for a bullet point: a complete sentence, starting with an action verb, a number only when the facts have one, never "I" or "my". It is added to every prompt that writes or rewords a bullet point: writing from answers, one more bullet, fix, reword, Finish polish, projects and volunteering, and weaving skills in.
- `dropFirstPerson` (`03-text-helpers.js`) removes "I", "we" and "my" in code too: on Finish (`tidyLine`), in the Fix button, in the AI answer checks (`honest`) and in the no-AI bullets.
- **Your summary** is written by one prompt, like the cover letter (`20k-summary-advice.js`): a short summary of the Resume Advice page (`SUMMARY_ADVICE`), the whole resume, the job ad if one was pasted, and the answers to "Tell us about you". The answer is still checked in code (no made-up numbers or skills, no "I" or "my", no clichés, length, the result they are proud of, never "graduate" for a student). With no AI, or an unusable answer, the summary is put together from the answers as before.
- The **Accept** button under the summary is gone. The summary is on the resume as soon as it is written. When you leave the box it gets tidy spacing and a full stop.

## Fit to one page
- After each draw of the preview, `learnCap` notes whether the lines counted fitted on one page and on two. `fitCap` moves the design's estimate to what the preview has shown, so the next press of Fit aims for the real number. "Put back what an earlier fit hid" now draws the preview after each thing it puts back and keeps it only while the preview still shows the pages asked for.
- Fit to one page and Fit on two pages keep at most 8 skills in all (`capSkills`): the ones in the job ad first, then those the resume shows in a job, study or project. The rest are unticked in the Skills list and are not put back by a later fit.

## LinkedIn profile reading (checked against a real LinkedIn PDF)
- Contact: the email, mobile number and profile link in the sidebar's Contact box are now read (the street address is not copied). Wrapped lines of the link are joined.
- Headline: the part that is a job title is used ("Data Analyst" from "… Student | Data Analyst | Experience in Renewables"). Student and "experience in" parts are skipped.
- Jobs: each description is joined into whole sentences first (PDF lines wrap mid-sentence), then each sentence is a bullet point with "I" and "my" dropped and an action word at the start (`liBullets`). Sentences like "I am proficient in…" and a line about the company itself are left out. A job's text no longer runs into the next job's company name, and each job's place is read.
- Titles are kept as LinkedIn has them (no capital "corrections"), so "Retail Sales Assistant / WHS Committee Member" stays one title.
- Education: wrapped lines are joined, dates with months are read, "Master's Degree, Mechanical Engineering" becomes level Master and subject Mechanical Engineering, and "High School Diploma, Mathematics Methods, Physics…" becomes Year 12 with those as its relevant subjects. A finish date in the future means still studying.
- An About written as "I…" is not copied in as the resume summary (the Summary step writes one); the import message says so.
- `window.__jfLi` is a test hook (`parseColumns`, `toProfile`) for checking the reader without a PDF file.

## Noticed, not changed
- The word swaps in `PHRASE_SWAPS` (`21-resume-creator-inputs.js`) contain stray backspace characters where `\b` should be, so those swaps never match. Fixing it would make Reword change more words, so it is left for you to decide.

## Roles at one employer, in designs with a column of dates
- In the designs that put dates in a left column (Timeline and the other "gutter" designs), roles at one employer show the company and its place at the top of the right-hand column, with the dot, as for any job. Under it each title is a job like any other: its own dates in the left column, the title and bullet points on the right. `stackRoles(list, make, grouped)` in `20j-builder-v34.js` makes the grouped item (`roles`), and the HTML, Word and PDF renderers in `22-cv-renderers.js` draw a company entry followed by one ordinary entry per role. Designs with dates on the right keep the stacked rows.
- On the input side, an employer with several titles has **Employer** and **Location** once, at the top of its card, above "One employer, 2 titles, newest first…". Typing the employer changes it for every title under it. The title cards inside have no Employer or Location box of their own. The location comes from the newest title's entry (`experience.<first>.location`).
- `window.__jfCv` is a test hook (`model`, `html`, `docx`, `pdf`, `tpl`).
