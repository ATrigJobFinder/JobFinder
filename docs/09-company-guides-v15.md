# Job Finder v15: Company guides (29 Oct 2026)

A new page, **Company guides** (sidebar, under Find work), covers 29 engineering employers in Australia, from small consultancies to global firms. Each one opens to show:
- What it looks for
- Resume
- Cover letter
- Interview and assessments
- How to apply
- Who can apply, and when
- Its purpose, values and goals

Every tip carries a link to where it came from:
- **Graduate page, Values page, How to apply, and so on:** the company's own site.
- **Prosple profile:** the employer's profile on Prosple.
- **Graduate reviews:** what graduates reported about recruitment on Prosple.
- **Our tip:** our suggestion, built from what the company says it wants. These are marked so they're never mistaken for the company's words.

## How the list is ranked
**The ranking.** Companies are ranked by the 2026 SEEK Grad Top100 (GradConnection's student vote). Places 1 to 14 are the engineering employers in its top 100, in order:

| # | Company | Top100 | Engineering category |
|---|---|---|---|
| 1 | GHD | 8 | 2 |
| 2 | Aurecon | 9 | 1 |
| 3 | Arup | 15 | 3 |
| 4 | Ventia | 32 | |
| 5 | AECOM | 36 | 5 |
| 6 | Hatch | 38 | 4 |
| 7 | Wood | 55 | |
| 8 | Lendlease | 58 | |
| 9 | ACOR Consultants | 65 | |
| 10 | Lucid Consulting Australia | 66 | |
| 11 | CIMIC Group and CPB Contractors | 75 | |
| 12 | Worley | 83 | |
| 13 | Rio Tinto | 85 | |
| 14 | Jacobs | 86 | |

Places 15 to 29 weren't in the Top100. They follow, biggest first: WSP, Acciona, Stantec, BHP, Downer, John Holland, Fulton Hogan, Laing O'Rourke, BAE Systems Australia, Fortescue, Beca, SMEC, Northrop, TTW and pitt&sherry.

**Sizes**
- **Small:** under 500 staff.
- **Medium:** 500 to 5,000.
- **Large:** over 5,000.
- **Global:** a large firm working in many countries.

Staff numbers are shown only where a source gave one.

**Filters**
- **Sector:** consultancies, construction, resources or defence.
- **Size:** any of the four sizes above.
- **Order:** ranking, small to big, big to small, or A to Z.
- **Search:** finds names, values and sectors. For example, "courage" finds Rio Tinto and Fortescue.
- **Open all and Close all:** expand or collapse every company.

## How it helps an application
**Tailor to a job**
- When the scanned ad is from one of these companies, "What this job needs" starts with a short guide. It shows their values and the top two resume, cover letter and interview tips, with a link to the full guide.
- **Detection:** the company line of the ad is checked first, then mentions anywhere in the ad.
  - Names that are also ordinary words or surnames need two mentions: Jacobs, Hatch, Downer, Beca, Northrop and BAE.
  - Northrop Grumman isn't mistaken for Northrop.
  - "wood" (the material) isn't mistaken for Wood.
- **Wrong company?** A menu lets you pick another, or none.
- **Ads that name no company:** the panel offers the same menu.
- **"Tailor my resume for X"** on a guide does one of two things:
  - If no ad is loaded, it takes you to the job ad box, and the guide applies to the next ad, unless that ad names another company.
  - If the loaded ad is theirs, it applies the guide straight away.

**Cover letter**
- **Values:** the company's values are added to the ones read from the ad, which the AI uses in the motivation paragraph. Its purpose and what it looks for are given to the AI too, to choose which of your real examples to lead with.
- **Fact check:** the company's name, purpose and values count as known facts, so mentioning them isn't flagged.
- **Hint under "Why this company?":** shows their purpose and values, so you can say which one you share, with an example.
- **Company name:** it's filled in from the guide when the ad doesn't name one.
- **Careers-account names are cleaned up:** names like "CIMIC Graduates" or "Arup Early Careers" become the company name.

**Applications**
- An application whose company matches a guide gets a "Company guide" button.

## Notable rules from the research
- **Arup:** asks candidates not to use AI writing assistants, and to apply for one role only.
- **Jacobs:** publishes AI rules for candidates.
  - AI may organise your experience and check spelling, but you must personalise what it writes and never invent achievements.
  - No AI is allowed in interviews or technical assessments.
  - Misuse can disqualify you.
- **BHP and Fortescue:** take one file. Put your cover letter in the same file as your resume.
- **BHP:** a cover letter and transcript aren't needed at first.
- **CIMIC:** open to Australian or NZ citizens and Australian permanent residents only.
- **John Holland:** open to citizens, permanent residents, or anyone with full working rights in Australia or NZ.
- **Short application windows:**
  - Beca: 16 to 29 March in 2026.
  - ACOR: 2 March to 6 April.
  - Worley: February to March.
  - Acciona: March and September.

## Where it lives
- `src/scripts/04b-company-guides-data.js` has the data, one object per company:
  - `match`: how the company is found in an ad.
  - `look`, `resume`, `cover`, `interview`, `elig`: tips, each as `[text, source key]`.
  - `process`: the steps to apply.
  - `links`: the sources.
  - It loads early so the scanner can use it.
- `src/scripts/35a-company-guides.js` has:
  - The page.
  - `detectGuide`, `activeGuideKey` and `guideForName`.
  - The scanner panel (`guideNeedsHtml`).
  - The cover letter hint (`renderGuideHint`) and context (`guideForCover`).
- `src/styles/18-company-guides.css` has the styles.

To add a company, add an object to `COMPANY_GUIDES`. Its place in the array is its rank.

## Testing (headless Chromium)
**The page**
- 29 cards, and opening one works.
- Filters: Small shows ACOR, Lucid, TTW and pitt&sherry. Resources shows Rio Tinto, BHP and Fortescue.
- Orders and search work.
- On a phone in dark mode, there's no sideways scroll.

**Detection**
| Text | Result |
|---|---|
| A real Jacobs ad | Found |
| "Sarah Jacobs" mentioned once | Not found |
| Northrop Grumman | Not found |
| Northrop | Found |
| "wood products" | Not found |
| "Join Wood" | Found |
| BHP | Found |
| pitt&sherry | Found |
| Laing O’Rourke, with a curly apostrophe | Found |

**The CIMIC ad**
- The CIMIC guide appears, and the cover letter hint shows.
- The letter is addressed to "CIMIC".
- Switching to GHD from the menu, then to none, works.

**Choosing a company first**
- Choosing WSP on its guide, then scanning an ad that names no company, applies the WSP guide.
- "See the full guide" opens WSP's card.

**Applications:** a Beca application shows a "Beca guide" button, which opens Beca's card.

**Earlier tests:** all still pass, with no page errors.
