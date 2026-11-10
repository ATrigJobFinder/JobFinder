# Employer side, rebuilt on the layout of SEEK's employer site

The old Hiring page (three tabs and a form) is replaced by a small employer site. You reach it from the **Developer circle** (Ctrl+D, then Employer), the **Switch to employer** button on the landing page, or `?dev=1` in the address. Employer mode gets its own navy header so it's clear which side you're on.

SEEK's logged-in screens aren't public, so this follows what SEEK publishes about its hirer product (Ad Centre, Candidate Management, Talent Search, "must have" screening questions, "Not suitable", team notes, bulk email, ad tiers) and the usual shape of a hirer dashboard. It uses Job Finder's own name, colours and wording, not SEEK's.

## Pages

| Menu | View id | What it does |
|---|---|---|
| Dashboard | `employer` | Welcome banner, set-up checklist, tiles (open jobs, new, shortlisted, interviewing, offers), your open jobs with a pipeline bar, latest candidates, "needs your attention" (new candidates, ads closing in 5 days, no questions, flagged wording, unfinished drafts), talent-pool teaser, tips |
| Jobs | `emp-jobs` | Open / Drafts / Closed / Expired tabs, search, sort, a table with ad type, candidates (and how many are new), a pipeline bar and the closing date. Per job: Candidates, Edit, Copy as a draft, Extend 30 days, Close, Reopen, Delete |
| Post a job | `emp-post` | Five steps with a live preview of the ad, an **ad strength** meter and the ad check beside it (see below) |
| Candidates | `emp-candidates` | The pipeline: All, New, Shortlisted, Interview, Offer, Accepted, Not suitable. Filters (job, fit, must-haves, rating, applied), search with OR / NOT / "phrases" and highlighting, ratings, bulk move and bulk message, CSV download, and the candidate panel |
| Talent Search | `emp-talent` | Search everyone in the talent pool (same search language), filter by work rights, what they want and career stage, compare against one of your jobs, save searches, keep named **talent pools**, invite to apply |
| Reports | `emp-reports` | Period and job filters, tiles, a hiring funnel, applications per day (or week), a per-job table, invitations and how many applied, and **market insights** (similar ads and typical pay against yours). Charts have a "View as a table" |
| Company | `emp-company` | Name, tagline, industry, size, website, about, culture, ABN (checksum checked), logo upload (shrunk to 160 px), colour, benefits, who's hiring; a live preview and a profile-strength meter |
| Job market | `jobs` | Unchanged: the same Find jobs list job seekers use |

### Post a job
1. **Job details:** title, location, where, work type, category (the 31 industries), pay (per year, hour or day, shown or hidden, "plus super"), closing date.
2. **Description:** optional rough notes that **Write the ad from my notes** sorts into sections (with an AI if one is connected, checked against the notes, `emDraftAd`), then summary, what they'll do, need, nice to have and offer.
3. **Candidate questions:** yes/no, choose one, a number, or written. Mark **Must have** (and which answers are acceptable). Suggestions come from the ad's wording (`emSuggestQs`) and there's a library of 19. Job seekers can't see which are must-haves. Anyone who fails one is moved to **Not suitable** unless you turn that off.
4. **Ad type and branding:** Basic, Advanced (logo, colour, three selling points) or Premium (also listed above equal matches, with a "Promoted" tag). All are free. They do change what job seekers see in Find jobs.
5. **Review and post:** blocking problems (company name, title, location, a short summary, biased wording, a past closing date, empty questions) are listed with links to the step, then a summary.

Close-by ads leave Find jobs on their closing date and show as **Expired**.

### Candidates
- **Fit** is worked out without AI (`candidateMatch` in 34, which now scores out of 100 as: hard skills 60 (full marks for covering half the ad's skills or three, whichever is more), job-title words 25, place 10, kind of work 5). High is 60 and up (the same line as "strong match" in Find jobs), Good is 40 and up. The panel says why in a sentence and shows which skills are on their profile and which aren't.
- **Panel** (opens beside the list; Esc closes it, Tab stays inside, and the arrow buttons move through the list): Overview, Resume, Questions (each answer marked ✓ or ✗ for must-haves), and Notes and activity. Stage, a 1 to 5 star rating and Message sit at the top.
- **Messages** use templates (thanks, interview, invite, next steps, not this time) with {first name}, {job}, {company} and {recruiter} filled in. Choosing a template can also move the person's stage. A message to someone who hasn't applied goes out as an **invitation**.
- Stages, ratings, notes, activity, pools and saved searches are private to the employer (`hiring` document). Phone and email are never shared.

## Where the data lives (`emMode()`)
| Mode | When | Ads and applications |
|---|---|---|
| `shared` | Opened in Claude, with write access | `jobs/<id>`, `apps/<id>`, `talent/<id>` and `outbox/<id>`, as before, so other people see the ads and apply |
| `local` | Anywhere else, or view-only | Kept in this browser (`hiring.data.local`, `localApps`, `localOutbox`). Ads show in Find jobs here, and applying here comes back to the employer view, so the whole loop can be tried on one computer |
| `demo` | **Try sample data** | A made-up company, six ads, 25 people and 23 applications in `hiring.data.demo`, kept apart from everything real and never posted. **Leave sample data** removes it |

The shared documents gain: `tier`, `sellingPoints`, `questions` and `closes` on ads; `colour`, `logo`, `tagline`, `industry`, `size`, `culture`, `benefits` and `recruiter` on the company; `answers` on applications; and `kind: "message" | "invite"` on outbox items. Older ads still load (missing fields get defaults). Job seekers' Find jobs shows branding and selling points, a "Promoted" tag, the employer's questions in the apply form (every one must be answered), and messages as well as invitations.

Logos and colours come from other people's documents, so only `data:image/…;base64` images and `#rrggbb` colours are drawn (`emLogoSrc`, `emColour`).

## Code
| File | Part |
|---|---|
| `34-job-market-and-hiring.js` | Still the shared market: connecting, `allJobs`, the Find jobs list and apply form (now with the employer's questions and local applications), invitations, the ad check, `candidateMatch` |
| `34c-employer-core.js` | Stages, ad tiers, question library, the data accessors (`emMode`, `emAds`, `emApplicants`, `emTalent`, `emStore`), scoring, screening, the search language, dialogs and the `data-em` / `data-emi` / `data-emc` handler tables |
| `34d-employer-demo.js` | Sample data |
| `34e-employer-dashboard-jobs.js` | Dashboard and Jobs |
| `34f-employer-post.js` | Post a job |
| `34g-employer-candidates.js` | Candidates, messages and the candidate panel |
| `34h-employer-talent.js` | Talent Search, pools, saved searches |
| `34i-employer-company-reports.js` | Company profile, Reports and start-up |
| `49-employer.css` | All the employer styles, including the navy header and the stage colours |

Each page draws itself from `EM_PAGES[view]`; buttons carry `data-em="action"` and are handled in `emAct` (inputs in `emIn`, drop-downs in `emCh`). The employer pages and dialogs carry `data-nohelp` so the field-help icons (36c) stay off them.

## Tested
In a real Chrome, driven over the DevTools protocol:
- Every page, in sample data, at 1440, 820 and 390 px wide, light and dark: no sideways scrolling and no console errors. Every seeker view still opens without errors, and the 35 existing tests pass.
- Post a job through all five steps in `local` mode, find it as a job seeker, be stopped until every question is answered, apply, and see the applicant (with the must-have result) as the employer.
- Two people sharing a mock database in `shared` mode: A posts, B applies with answers, A sees B arrive (the menu badge counts them, and clears once opened), moves, rates, notes and messages them, and B sees the message. A's stages are in A's private document.
- Jobs: close, reopen, copy, delete, search, edit through the wizard. Candidates: boolean search with highlighting, bulk move, bulk message with the rejection template. Talent Search: invite, save to a pool, save a search. Leaving sample data.

## Not done
- No team accounts: notes are the employer's own. A team would need real accounts and a backend.
- No views or clicks per ad, because nothing records them. Reports show only what's actually recorded.
- Messages arrive inside Job Finder only. There's no email.
- Applications and talent profiles are still readable by every Contributor of the artifact (see `04-both-sides-of-the-market-v10.md`).
