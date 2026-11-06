# Version 29: company guides for the top 100 employers

Applies to the 99 guides that are in the SEEK Grad Top100 (place 78 has no guide). Other guides get the same tabs, with only what their guide holds.

## Each guide has four tabs (About opens first)
- **About** (`04m-company-profiles.js`): a short summary, industry, a **size estimate** (a band, such as "10,001+ employees worldwide"), specialties, **social icons** (LinkedIn, Facebook, Instagram, X, YouTube), then purpose and values.
- **Advice**: what they look for, resume, cover letter and interview tips. These are for anyone applying. A tip that mentions graduates, university, transcripts, internships and the like is moved into its own list under **For recent graduates** (`isGradTip` in 35a).
- **How to apply**: **Where to apply** (careers page, graduate page and any other page of theirs that helps: program, streams, how to apply, expression of interest, resume and interview advice and so on), **The steps**, and **Who can apply, and when** (tagged for recent graduates).
- **Jobs**: jobs from this company that are listed on Job Finder (employer posts and ones you saved), with a count on the tab. Pressing one opens it in Find jobs. It updates when the job market finishes loading.
- Gone: the top-right buttons (Tailor my resume for..., Careers page, Graduates, Copy their values). The careers and graduate pages are now in How to apply.

## Years left out
- The dates in the guides' timing and eligibility lines were rewritten without years ("Applications open in early March and close in early April").
- "2026 SEEK Grad Top100" is now "SEEK Grad Top100", and the "checked October 2026" notes are gone. The years in the data were scanned for; none are left in the top 100.

## Where the new information came from
- **Social links:** read from each company's own website (footer links) with a script, then checked by eye. For a handful of companies whose site blocked the script, an official LinkedIn or other page was added by name and **not checked online** (CBA, CSL, Newmont, Allianz, Nestlé, Fujitsu, SEEK, KordaMentha, Citadel Securities, Alinta, UNIQLO, Telstra, Optus, EY). No icons are shown for Wood, MM Electrical, DBG Health or QBE.
- **Summary, specialties and size band:** written for Job Finder from general knowledge of each company, not copied from a source. Size is an estimate on purpose: check the company's own site for exact figures.

## Round 2
- **About** now reads: Find them online (icons) first, then industry, size and specialties, then the company summary last (summary and icons swapped).
- **Purpose, values and goals** moved from About to the top of **Advice**.
- **The company's own advice pages are blue links inside the section they belong to** (Resume and cover letter advice in Resume and in Cover letter, Interview advice in Interview and assessments; also their application tips and graduate advice pages where they have one). They are no longer in the footer line of Advice or in How to apply. Only Aurecon has resume and interview pages saved so far; the other companies show a link only where one is on file.
