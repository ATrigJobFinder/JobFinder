# Job Finder v16: Company guides for every industry (29 Oct 2026)

Company guides now cover **135 graduate employers across 16 industries**, up from 29 engineering firms.

## Who's included
- **The 2026 SEEK Grad Top100:** all of it except Ivory Group (99 of 100). Ivory Group didn't publish enough to write a guide.
- **The 29 engineering employers from v15.**
- **Other big graduate employers outside the Top100:** law firms, McKinsey, Bain, Microsoft, Canva, Woolworths, Origin, Transport for NSW, the Victorian Government, DFAT, Sydney Water, Boeing, Medibank, Qantas, Ramsay Health Care and News Corp.
- **SEEK Grad finalists:** bp and Ampol.

| Industry | Companies | Highest ranked |
|---|---|---|
| Accounting and advisory | 15 | EY (#1) |
| Consulting and IT services | 10 | Capgemini (#4) |
| Banking, super and insurance | 13 | ANZ (#5) |
| Engineering consultancies | 17 | GHD (#8) |
| Trading and investment banking | 6 | Citadel Securities (#10) |
| Technology and telecommunications | 10 | Amazon (#12) |
| Government and regulators | 17 | Careers at Council (#21) |
| Retail and consumer goods | 8 | Kmart Group (#29) |
| Construction, infrastructure and property | 10 | Ventia (#32) |
| Energy and utilities | 7 | Jemena-Zinfra (#34) |
| Health and pharmaceuticals | 4 | CSL (#42) |
| Transport, logistics and automotive | 3 | Mainfreight (#53) |
| Defence and aerospace | 3 | Thales (#54) |
| Mining and resources | 5 | Newmont (#59) |
| Law | 5 | Lander & Rogers (#61) |
| Sport and media | 2 | AFL (#95) |

## Grouping by industry
**Group by industry** (the default)
- Each industry is a section you can open or close.
- Its heading shows how many companies it has and which is ranked highest.
- Industries are ordered by their best-ranked company.

**One ranked list:** every company in one list, numbered 1 to 135.

**Other filters**
- **Industry menu:** shows one industry, with a count for each.
- **Size:** Small, Medium, Large or Global.
- **Order:** ranking, small to big, big to small, or A to Z.
- **Search:** finds names, values and industries.

**Remembered:** the layout, industry, size and order you choose are kept on your device.

**Each card has three badges**
- Its Top100 place (or "Not in the Top100").
- Its engineering category place, for the top 5 engineering firms.
- Its place within its industry, for example "#3 of 15 in Accounting".

## Ranking
- **Top100 order:** companies are ranked by their place in the 2026 Top100.
- **The rest:** companies outside it follow, biggest first, then A to Z.
- **No manual order:** the order is now worked out from the data, so the order of the data files doesn't matter.

## Finding the company in a job ad
**Main rule**
- If the ad's company line names one of the companies, that company is chosen.
- Otherwise, the company named most often wins.
- Each company sets how many mentions it needs (`minHits`) when its name is also an everyday word, acronym or skill.

| Name in the ad | Mentions needed |
|---|---|
| ANZ | 3 (it's also short for Australia and New Zealand) |
| nbn | 3 |
| TikTok | 3 (also a marketing skill) |
| ATO, ASIC, APRA | 3 (often just mentioned in accounting and finance ads) |
| ASD | 3 (also short for autism spectrum disorder) |
| Microsoft | 3 |
| Amazon | 2 (AWS skills don't count) |
| AMP, eBay, Allens, Bain, Toyota, AFL | 2 |
| Councils, the RBA | 2 |
| The Alternative, the Victorian Public Service | 2 |
| The v15 weak names (Jacobs, Hatch, Downer, Beca, Northrop, BAE) | 2 |

**SEEK:** only matched by "SEEK Limited", "join SEEK" and similar. Ads copied from the SEEK website mention SEEK without being from it.

**The "Wrong company?" menu** in Tailor to a job is grouped by industry.

**Cover letter:** a company with no stated purpose no longer leaves an empty "purpose" line in the AI prompt or the hint.

## Data files
| File | Companies |
|---|---|
| `04b-company-guides-data.js` | Shared settings (industries, sizes, link names) and the 29 engineering employers |
| `04c-guides-accounting.js` | Accounting and advisory |
| `04d-guides-finance.js` | Banking, super and insurance |
| `04e-guides-trading.js` | Trading and investment banking |
| `04f-guides-consulting-it.js` | Consulting and IT services |
| `04g-guides-tech.js` | Technology and telecommunications |
| `04h-guides-government.js` | Government and regulators (the APS Values are shared) |
| `04i-guides-energy.js` | Energy and utilities |
| `04j-guides-industry.js` | Mining, property, defence, retail, health, law, logistics, sport |
| `04k-guides-more.js` | Big employers outside the Top100 |

To add a company, push an object onto `COMPANY_GUIDES` in the right file. Its rank is worked out from `top100` and `size`.

Every tip is `[text, source key]`. A data check confirmed:
- Every source key points to a link.
- Every link type has a display name.
- Every industry exists.
- No company key is used twice.

## Testing (headless Chromium)
**The page**
- Shows 135 companies in 16 industries.
- Closing an industry section stays closed when you search.
- Search "integrity": 16 companies in 7 industries.
- Small: 6 companies.
- Law, ranked within the industry: Lander & Rogers, HSF Kramer, KWM, Allens, G+T.
- The ranked list has no groups and 135 cards.

**Detection**
| Ad | Result |
|---|---|
| Deloitte, EY, CommBank, Brisbane City Council | Found |
| An ad copied from SEEK | No match |
| ATO mentioned twice | No match |
| AWS skills | No match |
| TikTok as a skill | No match |
| "ANZ region" | No match |
| "ASD" for autism | No match |

**Scanner and cover letter**
- A Deloitte ad shows the Deloitte guide and the cover letter hint.
- The letter is addressed to Deloitte.
- The company menu has 16 industry groups.
- The CIMIC ad still shows the CIMIC guide.

**Phone in dark mode:** no sideways scroll, with a card open or closed.

**Earlier tests:** all still pass, including the tracker's guide button, with no page errors.
