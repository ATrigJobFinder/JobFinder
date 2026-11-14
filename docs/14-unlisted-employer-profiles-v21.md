# Version 21: a profile for every Unlisted jobs employer

## What changed

Every employer on the Unlisted jobs page (the directory, not just the 135 full guides) is now an expandable card in the same format as the big companies:

- **Header:** name, industry, size, staff band (where known), states and ASX code.
- **About:** industry, company size (estimate), where they're based, where they work, ASX code, specialties, and a **two-paragraph summary** (what the organisation does, then the kinds of roles and how people get in).
- **How to apply:** the careers page and graduate page (own website only) and a short list of roles they hire for.
- **Jobs:** jobs on Job Finder from that employer (matched on the start of the company name).

Anything that couldn't be confirmed is left out rather than guessed: an empty "Based in", staff band or social row simply doesn't show.

**Advice** (rounds 5 and 6): directory employers also have an Advice tab with what they look for, resume, cover letter and interview tips. For most employers it is general advice for the kind of employer (30 kinds: hospital, aged care, council, police and emergency services, university, school, TAFE, airline, football club, law firm and so on, chosen by `dirAdviceKey()`), and every tip carries an **Industry tip** label so it isn't mistaken for something the employer said. The text is in `src/scripts/04o-directory-advice.js`.

For seven high-volume employers (Bunnings, Australia Post, McDonald's Australia, Bupa, Woodside Energy, Rio Tinto and Officeworks) the tab starts with what the employer itself says about hiring, read from its own pages: how they hire, their advice, and checks and eligibility. Each tip is marked **From their site** and links to the page, and the card says steps change so the live page should be checked. This is in `src/scripts/04s-directory-company-advice.js`; add an entry there (with a source on the employer's own site) to give another employer the same treatment.

**Social links** (round 5): the "Find them online" row shows LinkedIn, Facebook, Instagram, X and YouTube links for most employers. They were read from each employer's own careers page and home page, and a link is kept only when the page name matches the employer's name or website. They are in `src/scripts/04q-directory-social.js`.

Search on the page now also looks inside the summaries and specialties, so searching "submarine" finds ASC.

## Where it lives

**Since `docs/26-directory-in-supabase.md`:** the employer and profile files below (`04l`'s list, `04m2`–`04m72`, `04n`, `04p`–`04z`) are in `data/directory/`, not `src/scripts/`. They are sent to Supabase with `npm run seed:directory`, and the page loads them 50 at a time. `04o` (advice by kind of employer) and `35a` are still in `src/scripts/`.

| File | What it holds |
| --- | --- |
| `src/scripts/04l-company-directory.js` | The first 458 employers, and the empty `DIR_PROFILES` object |
| `src/scripts/04m2-company-directory-more.js` | 106 more employers (round 4, all links checked) |
| `src/scripts/04m3-company-directory-more2.js` | 256 more employers (round 5): councils, hospital networks, TAFEs, charities, football clubs and venues, arts bodies, utilities, agencies, chains, car brands, technology |
| `src/scripts/04m10-company-directory-more9.js` | 110 more employers (round 12): equipment makers, aged care and allied health, recruiters and consultancies, developers and home builders, real estate, fashion and trade retail, rail, solar and renewables |
| `src/scripts/04z-profiles-r12.js` | Two-paragraph profiles for the round 12 employers |
| `src/scripts/04m11-company-directory-more10.js` | 43 more employers (round 13): diagnostics and allied health, pharma and medtech, tech vendors, retail brands, food and drink makers, building products, equipment hire, travel, cinemas, a snow resort and a racing club. Links were checked by script; candidates already in the directory or the full guides were dropped |
| `src/scripts/04z-profiles-r13.js` | Two-paragraph profiles for the round 13 employers |
| `src/scripts/04m12`–`04m72` (`...-more11` to `...-more71`) and `04z-profiles-r14` to `r74` | Rounds 14 to 74 (663 more employers): law firms and lending groups, primary health networks, regional water businesses and catchment bodies, aged care, disability and relationship charities, Aboriginal health services, pathway colleges and sport institutes, home builders and contractors, travel and attractions, mining, gas and ports, real estate, clubs, fitness and hospitals |
| `src/scripts/04m9-company-directory-more8.js` | 139 more employers (round 11): state departments, courts, ombudsmen and regulators, ports, community housing, unions and peak bodies, car brands, mining, fitness, tech vendors, engineers and builders |
| `src/scripts/04x-profiles-r11-*.js` and `04y-profiles-r11-*.js` | Two-paragraph profiles for the round 11 employers |
| `src/scripts/04m8-company-directory-more7.js` | 220 more employers (round 10): technology, retail, food and drink, travel, transport, research institutes, Aboriginal organisations, real estate, law, arts, sport and media |
| `src/scripts/04w-profiles-r10-*.js` | Two-paragraph profiles for the round 10 employers |
| `src/scripts/04m7-company-directory-more6.js` | 271 more employers (round 9): rural and remote councils in every state and the NT, independent schools, TAFE and education services, defence industry, pathology and aged care, community peak bodies, finance and insurance, media, builders and architects |
| `src/scripts/04v-profiles-r9-*.js` | Two-paragraph profiles for the round 9 employers |
| `src/scripts/04m6-company-directory-more5.js` | 164 more employers (round 8): councils in every state and the NT, health services, retail, sport clubs and venues, legal and oversight bodies, charities, health funds and banks |
| `src/scripts/04u-profiles-r8-*.js` | Two-paragraph profiles for the round 8 employers |
| `src/scripts/04m5-company-directory-more4.js` | 198 more employers (round 7): regional and metropolitan councils, independent schools in the ACT, Tasmania and the Northern Territory, legal aid bodies, fire services, super funds and insurers, airports and ports, mining, energy, technology |
| `src/scripts/04t-profiles-r7-*.js` | Two-paragraph profiles for the round 7 employers (councils, schools, agencies and charities, business) |
| `src/scripts/04m4-company-directory-more3.js` | 165 more employers (round 6): regional councils, private schools and school systems, medical research institutes, more charities, engineering firms, finance, travel, retail, tech and games studios |
| `src/scripts/04o-directory-advice.js` | The Advice tab text, by kind of employer |
| `src/scripts/04s-directory-company-advice.js` | Advice taken from seven employers' own hiring pages |
| `src/scripts/04q-directory-social.js` | Verified social links |
| `src/scripts/04n-profiles-*.js`, `04p-profiles-r5-*.js`, `04r-profiles-r6-*.js` | The profiles, one file per group of industries. Keyed by the exact employer name. Councils and football clubs use a shared pattern with details specific to each one |
| `src/scripts/35a-company-guides.js` | `dirCard()` draws the card; `siteJobsForEmp()` finds its jobs |
| `tests/directory-profiles.test.mjs` | Fails if an employer has no profile, a profile has fewer than two paragraphs, a year appears in the text, or a link goes to a job board |

A profile looks like this (only `about` and `spec` are required):

```js
"Employer name": { about: ["First paragraph.", "Second paragraph."], spec: ["Three", "or more", "specialties"], staff: "1,001–5,000 employees", hq: "Sydney, NSW", roles: ["Role", "Role"], social: { linkedin: "https://…" } }
```

To add an employer: add a row to `data/directory/04m2-company-directory-more.js` and a profile with the same name to an `04n` file there, run `npm test`, then `npm run seed:directory`.

## How the research was done

- **Finding careers pages.** For each candidate employer a script tried the usual careers page addresses on the employer's own website (and, if none loaded, read its home page for a Careers, Jobs or Work with us link) and kept only a page that loaded and still looked like a careers page after redirects. Round 4 added 106 employers, round 5 added 256, round 6 added 165 and round 7 added 198 and round 8 added 164 and round 9 added 271 and round 10 added 220 and round 11 added 139 and round 12 added 110, taking the directory to 2,087 and the page to 2,214 employers with the 135 full guides. Rounds 13 to 74 then added 706 more (directory 2,793, page 2,928 with the full guides). From round 13 on, candidate employers were first checked against every name already in the scripts, and each careers link was loaded by script on the employer's own site. For employers whose sites block automated requests (Western Health, Domain, Kogan, Port of Melbourne, Perth Airport, Melbourne Storm and a dozen charities and lenders) the careers page was confirmed by search instead of a direct check. Where a site asks crawlers not to access it (broncos.com.au) or blocks them with no search result (most other NRL clubs, Visa, Magellan, Lockton, Greenpeace Australia Pacific), the employer is left out rather than listed unverified, and goes on the hand-check list in `docs/15-careers-pages-to-check-by-hand.md` (889 employers) so the links can be found in a normal browser.
- **Summaries** were written from what is publicly known about each organisation, and a sample was checked against search results. Years and exact numbers are left out so the text doesn't go out of date. Staff figures are bands, and Company size is labelled an estimate.
- **Tests** (`tests/directory-profiles.test.mjs`) fail if an employer has no profile, a profile has fewer than two paragraphs or contains a year, a link goes to a job board, an advice block is incomplete or a social link is on the wrong network.
- One fix to older data: Mondelez's careers link was on http and now points to its https careers page.

## Still to do

- Check the remaining profiles against each employer's own About page, starting with the ones that mention a parent company or a recent merger (Insignia, Healthscope, Foxtel, Rex, Anglo American, Crown, Star).
- Company-specific advice for more of the employers people apply to most. Seven have it so far; ALDI's site has no job-seeker advice to read.
- Employers still missing because their sites block automated checks: most NRL clubs, several NSW health districts (NSW Health recruits through its own central site), Visa, Magellan, Lockton and Greenpeace Australia Pacific. Also more regional councils, private schools in Tasmania, the ACT and the Northern Territory, and more local charities.
