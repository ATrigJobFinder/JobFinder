# Job Finder v14: what the job needs, more templates, ideas from similar sites (29 Oct 2026)

## Why the CIMIC graduate ad showed no skills
- **The wrong section:** a job-board line, "Salary undisclosed", was read as a "Salary" heading. So everything after it was treated as company information and nothing was scored.
- **The criteria lead-in was missed:** "To be successful in this program, you will have the capability to:" is 12 words, too long to count as a heading.
- **Behaviours, not skill names:** the criteria were written as behaviours ("work autonomously and as part of a team"), which the skills list didn't know.

## How a job ad is read now
**Job-board lines are set aside** (`META_LINE`, `LOC_LINE` in `04-scanner-analysis.js`)
- Pay, work type, "Posted 9d ago", ratings, "View all jobs" and the SEEK category ("Civil/Structural Engineering (Engineering)") are recognised as job details.
- Location lines ("Melbourne VIC") are too.
- None of these are headings, and none are scored.

**Long lead-ins count as headings:** a requirements lead-in ending in a colon is a heading up to 20 words.

**Lists of options are separate:**
- "…in the following disciplines:" starts an options list: the candidate needs one of these, not all of them.
- These lines aren't scored as skills.
- The list ends at the first full sentence.

**The skills list knows behaviour phrasing** (`02-skills-taxonomy.js`)
- Examples: "part of a team", "collaboratively", "learn new skills", "flexible", "outcome driven", "high quality", "positive relationships", "stakeholders", "innovate", "creative solutions".
- New soft skills: Safety mindset, Accountability, Empathy, Conflict resolution.
- Stakeholder management moved from hard to soft.
- New hard skills: 12d Model, inspection and test plans, temporary works, quantity take-offs, cost planning, environmental management, incident investigation, cash handling, RSA, food safety, recruitment, employee relations, patient care, lesson planning, forklift licence, working at heights, police check, NDIS worker screening, security clearance.

**Scoring changes**
- **No technical skills asked for:** soft skills carry the weight (40 instead of 10).
- **Programs, not job titles:** a program name like "CIMIC Group Graduate Program 2027" isn't scored as a job title. A tip suggests putting the discipline in the headline instead.
- **Cleaner key terms:** the company's own name, and the opening company paragraphs (when the ad has a requirements section), aren't counted as key terms.

## "What this job needs" (new panel in Tailor to a job; `04a-job-requirements.js`)
**1. Must-haves to apply.** Each gets You meet this, Probably not, or Check this, using the Resume creator profile or, failing that, the resume text.

| Must-have | What it's checked against |
|---|---|
| Work rights | Your stated work rights |
| Security clearance | Your resume |
| Licences, tickets and checks | Your resume and licence |
| Relocating or travelling | Always "Check this", with a reminder to say you're willing |
| Where the jobs are | Your state |
| Program and study stage | Your qualification's dates (see below) |
| Disciplines list | Your degree or target job |
| Qualification level | Your resume |
| "Completed within the last two years" | Your finish date |
| Years of experience | Shown, to check yourself |
| Closing date | Days left |

The program and study-stage check knows that a 2027 graduate intake starts early in 2027. So someone finishing Nov 2027 is told to look at vacation programs or the 2028 intake.

**2. Selection criteria.**
- Every line of the criteria list is shown as essential.
- Each line is turned into skills, with evidence for each:
  - **Shown:** in a sentence or bullet point.
  - **Listed only:** just named, for example in a skills list.
  - **Hinted at:** a bullet point suits the skill but doesn't name it.
  - **Missing.**
- Licences and checks count as shown once they're listed.
- Gaps get a question ("What task did you own from start to finish on your own?") and a link to step 4.
- Lines that aren't skills (relocation, qualifications) say what to do instead.
- "Draft an example answer (STAR)" writes a 100 to 170 word answer to that criterion from the resume lines that fit it best. The fact checks apply. With no AI, it gives a STAR frame around the best matching line.

**3. Nice to have.** Lines from the desirable section, shown separately.

**4. What they value.**
- Taken from lines about values, culture and commitment (for example "through collaboration, innovation and a commitment to safety and performance").
- These are also passed to the cover letter, for the motivation paragraph.

**5. Usually expected (not in the ad, not scored).**
- 19 role profiles (civil, mechanical, electrical, QS and commercial, construction management, mining, environment, safety, software, data, finance, HR, marketing, IT support, health, education, hospitality, trades, admin).
- Each lists skills recruiters assume but don't write down, shown as on or not on the resume.
- For an ad that takes several disciplines, the profile is picked from the candidate's own degree.

**Double-check with AI.**
- The AI lists every requirement, each with a quote from the ad.
- Anything whose quote isn't word for word in the ad is thrown out.
- Only things the rules missed are shown.

## Ideas taken from similar sites
- **Teal: Not relevant.** Any missing skill can be marked "Not relevant". It's left out of the score, and "Put back" brings it back. Teal does the same in its Matching Mode, where it's called "ignore".
- **Jobscan: must-haves and evidence.** Searchability-style checks (work rights, qualification, experience, closing date), plus evidence checks.
- **Resume Worded and Rezi: repeated verbs.** The Resume creator health check now flags the same opening word on 3 or more bullet points.
- **Kickresume and Zety-style galleries: template filters.** Both template pickers have filters: All, ATS-friendly, Simple, Modern, Formal, Creative, Two columns.
- **SEEK and Australian Public Service practice: selection criteria answers.** STAR drafts for each criterion.

## Seven new templates (18 in all)
| Template | Style | Notes |
|---|---|---|
| Compact | Simple, ATS | 9.5 pt Arial, 12 mm margins, fits more on one page |
| Harvard | Formal, ATS | Centred, serif, education first (new `order: "eduFirst"`) |
| Timeline | Modern, ATS | Dates down the left with a line and dot per entry (new `dates: "timeline"`) |
| Elegant | Formal, ATS | Georgia headings over Calibri, short accent bar under each heading (new `heading: "short"`) |
| Bold | Modern, ATS | Dark header band, short-bar headings, skills as tags |
| Slate | Creative, two columns | Light sidebar, short-bar headings, skills as tags |
| Public Service | Formal, ATS | Plain, 11 pt Arial, ruled headings, for government roles |

The new heading and date styles work in all three renderers:
- **Page preview (CSS).**
- **Word:** a narrow paragraph with a thick bottom border for the bar, and a left cell border for the timeline.
- **PDF:** a drawn bar, line and dot.

Every template has a `style` tag for the filters.

## Testing (headless Chromium)
- **The CIMIC ad:**
  - Job-board lines are set aside.
  - 11 soft skills are scored, with the criteria highlighted.
  - The must-haves are found: work rights, relocation, locations, the 2027 intake (Probably not, for a Nov 2027 finish), the discipline, and the closing date (5 days).
  - The values found are safety, collaboration, innovation and performance.
  - The civil "usually expected" list is shown.
- **Not relevant:** changes the score, and Put back works.
- **The built-in example ad:** still scores sensibly. "Completed within the last two years" is checked against the finish date.
- **With a stand-in AI:**
  - The double-check kept 2 new items with exact quotes and threw out one with a made-up quote.
  - The STAR draft passed the fact checks.
- **All 7 new templates:**
  - Shown in the preview.
  - Downloaded as Word, with the XML well-formed.
  - Downloaded as PDF, at 1 page.
- **Filters** work in both pickers.
- **Earlier tests** all still pass.
- **Phone size in dark mode:** no sideways scroll, and no page errors anywhere.
