# Job Finder collector

Gathers current jobs from company career sites and job APIs, merges duplicates, and writes `jobs.json`. In Job Finder, open **Find jobs** and choose **Import listings (owner)** to load the file. Everyone using Job Finder then sees those jobs, merged with jobs employers post on the site and jobs people save, with each job shown once.

## Run it

Needs Node 18 or later. Nothing to install.

```
cp sources.example.json sources.json      # then list the companies and searches you want
node collect.mjs                          # writes jobs.json
```

From the project folder you can also run `npm run collect`.

Options: `--sources other.json`, `--out feed.json`, and `--fixtures fixtures` (reads saved sample responses in a `fixtures/` folder instead of the internet, for testing).

For Adzuna, register at developer.adzuna.com for a free app ID and key, then set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.

## Where jobs come from

| Type | What it reads | What you give it |
|---|---|---|
| `greenhouse` | Greenhouse Job Board API | the board token in `boards.greenhouse.io/<token>` |
| `lever` | Lever Postings API | the site name in `jobs.lever.co/<site>` |
| `ashby` | Ashby public job posting API | the board name in `jobs.ashbyhq.com/<board>` |
| `smartrecruiters` | SmartRecruiters Posting API | the company ID in `jobs.smartrecruiters.com/<id>` |
| `workable` | The feed behind Workable career pages | the account in `apply.workable.com/<account>` |
| `recruitee` | Recruitee careers site API | the site in `<site>.recruitee.com` |
| `adzuna` | Adzuna job search API (an aggregator of many boards) | a search, plus your API key |
| `jsonld` | Any careers page that marks up its jobs for Google (schema.org `JobPosting`) | the page URL |

Most large employers use one of these hiring systems. To find which, open the company's careers page and look at where the "Apply" link goes.

## How duplicates are removed

The same job is often on the company's site, an aggregator and a job board, worded slightly differently. Two listings count as the same job when they're at the same company (ignoring "Pty Ltd" and the like) and either:

- share an ad reference number or link, or
- have nearly the same title (abbreviations like "Sr" and "Eng" expanded, filler like "Urgent" ignored) in the same place, or
- have near-identical descriptions and similar titles.

The company's own listing is kept as the main one, and the others are listed under "also listed on". Jobs whose closing date has passed are dropped. The same rules run again in Job Finder when imported jobs meet jobs posted on the site and jobs people saved.

`dedup.cjs` is a copy of `src/scripts/33-dedup.js` from the site, so both sides match jobs the same way. If you change the matching rules, run `npm run sync-dedup` to copy them across again.

## Doing this fairly and legally

- It only uses official APIs and public feeds that companies publish so their jobs can be found. It doesn't log in to anything or get around any blocks.
- For `jsonld` pages it checks the site's robots.txt first, sends at most one request a second to any site, and identifies itself.
- Don't add Seek, LinkedIn or Indeed pages: their terms don't allow automated collection. Adzuna's API covers much of the same market through an agreement, and links each job back to where it was posted.
- Every job links back to the original ad, and people apply there.
- Each API has its own terms, including how to credit the source (Job Finder shows the source on every listing). Read the current terms for any API you add.

## Running it on a schedule

Run it daily on any computer or server (cron, Windows Task Scheduler, or a GitHub Action), then import the new `jobs.json`. Claude can also run it as a scheduled task and load the results straight into Job Finder's shared data, once the job sites are allowed in Claude's network settings (Settings › Capabilities).
