# Job Finder v13: AI in the browser, smarter inputs and a gentler AI check (29 Oct 2026)

These changes come from Andrew's review of v12. Shared-data rules are unchanged.

## Connect your AI: three options
1. **AI in your browser** ("Best free and private"). It merges the old Chrome option with the download option. There are three ways to run it:
   - **Chrome's built-in AI:** nothing to download if Chrome already has it. Live status is shown.
   - **WebLLM:** suggested.
   - **Transformers.js.**
2. **Bring your own key** ("Best results for most people").
3. **Job Finder AI:** Claude inside Claude; "coming soon" on the website.

What's gone:
- "No AI: built-in rules" is no longer an option, but built-in templates still fill in when no AI answers.
- "Run an AI app on your computer" (Ollama, LM Studio) has been removed.
- Saved choices of `rules` or `local` now become `auto`.

**Home "Bring your own AI" stairs**
- **Three steps.** Each column has a fixed-height slot, so all bars stand on one baseline and the labels start on one line.
- **"In use"** is a small pill inside the bar, so it doesn't push anything around.

## Why WebLLM was slow, and what changed
**Why it was slow**
- **First visit:** the whole model downloads (0.5 to 4.5 GB).
- **Every visit:** the model is loaded onto the graphics card and its shaders compiled (10 to 60 seconds).
- **Writing:** every word is worked out on the person's own computer.
- **Long prompts:** the in-browser models were also sent the long prompts written for Claude, with up to 1,500 tokens out and a retry when the JSON was bad.

**What changed**
- **Short prompts.** In-browser models now get the short one-job-at-a-time prompts written for Chrome's small model (`*_NANO` plus worked examples). `withChromeAI()` hands out a `browserSession()` with the same `prompt`/`clone`/`destroy` shape when the engine is `webllm` or `tfjs`.
- **JSON schema.** WebLLM is given the JSON schema as `response_format`, so the answers parse first time.
- **No double attempt.** If the in-browser model fails, `afterSmall()` goes straight to Claude (when allowed) instead of asking the same model again with the long prompt.
- **Time estimates:**
  - Before downloading, each model shows its size, the download time on a typical 50 Mbps NBN connection, and its writing speed. This is "on a typical laptop" until measured, then "on this computer".
  - It also says how long a summary, bullet points and a cover letter take.
  - While loading, the bar names the stage ("Downloading the AI (one time only)", "Loading the AI from this computer", "Setting up your graphics card"), with MB done and the time left.
  - While writing, a corner card shows "Writing with WebLLM in your browser · About 10 seconds left".
  - Speed is measured from WebLLM's own figures (prefill and decode tokens a second), or by counting streamed tokens with Transformers.js. A running average is saved in `jobfinder.ai.v1` under `speed`.
- **Warm-up:** if the chosen model is already downloaded, it's loaded in the background 2.5 seconds after the page opens.
- **"Why does this take a while?"** explains all of this on the Connect page.

## Resume creator
- **Phone.** A country picker with flags and full country names: search by name or code, with common countries first. It has all 248 countries and saves `contact.phoneIso`. Typing "+44 …" switches the country by itself. Number spacing is specific to AU, UK, NZ and India.
- **Suburb or town** (contact, each job and each qualification):
  - Only real places are accepted, picked from a list of about 16,600 Australian suburbs and towns (with postcodes and rough positions), a few regions (Gold Coast, Central Coast…), about 100 cities abroad, and "Remote".
  - Matching works on "Richmond", "richmond vic", "3121" or an exact name.
  - The state is filled in automatically.
  - Anything unknown shows a message and isn't saved.
  - Data comes from `scripts/make-places.mjs` (Australia Post localities via `aus-postcode-suburbs`, and `countries-list`). `placeCoords()` gives a place's position for later use.
- **Dates.** "Show dates as" has Nov 2012, November 2012 and 11/2012 (`prefs.dateStyle`: `words`, `long`, `numeric`).
- **Still studying.** A qualification whose finish date is after today ticks "I'm still studying" by itself and says what the person will be called, for example "a penultimate-year student".
- **Languages.** "+ Add a language" opens two lists: the language (about 85, including Auslan and Aboriginal languages, or type another) and how well (Native or bilingual, Fluent, Good enough for work, Conversational, Basic). They're stored as before ("Vietnamese (fluent)").
- **Page setup** (Layout and Review steps):
  - Line spacing: Compact, Normal or Roomy.
  - Margins: Narrow 12 mm, Normal (the design's own) or Wide 22 mm.
  - The settings apply to the preview, Word and PDF, and to the CV templates tab (`tplWithPrefs()`).
- **Downloads use the chosen design.** Resume creator downloads now use the chosen layout and colour; before, they always used Professional.
- **Finish this job** now explains itself under the button.

## AI writing rules
- **Bullet points:** short related tasks are combined into fuller bullets. The rules ask for 3 to 5 bullets of 15 to 30 words, results first, and a different verb for each.
- **Polishing (Finish):** a proper rewrite into professional resume language: a strong verb, then action, method and scale; casual words made precise; shorthand spelled out; spelling and capitals fixed. It keeps the same facts and the same number of bullets. Qualifications get their subjects, project line and awards tidied too.
- **Summary:**
  - The prompt now gives the study status worked out from the dates ("Still studying … expected to finish Nov 2027. Today is October 2026, so they are a penultimate-year student. Never call them a graduate").
  - A current student called a "recent graduate" is rejected and retried once with the reason.
  - The pre-filled "how would you describe yourself" line and the no-AI template use the study year too.
- **Whole-resume AI check:**
  - **Actions:** combine (2 or 3 bullets from the same job), shorten, reword, then cut as a last resort.
  - **Priority:** every job and qualification is labelled high, medium or low priority, from recency and relevance to the target job.
  - **Rules for cuts:**
    - Cuts on high-priority entries are refused.
    - The profile can't be cut, only shortened or reworded, and never below 20 words.
    - Every cut needs a real reason (four or more words, not just "space").
    - Every job keeps two bullets.
  - **Display:** suggestions are shown combine first, with cuts last (lowest priority first), each with "Why: …".
  - **Without AI:** it first joins two short bullets in the least important job, then cuts interests, the referees line and low-priority lines, and suggests Compact spacing if it still runs over.

## LinkedIn review
LinkedIn doesn't let other websites read a profile from its link, even a public one. So the import now sits right under the link field, with two ways to bring a profile in:
1. **Save to PDF**, then drop or choose the PDF (drag and drop now works).
2. **Copy the profile page and paste it.** `liFromPage()` reads the name, headline, location, About, Experience (put into the PDF's order), Education and Skills, ignoring LinkedIn's buttons and repeated lines. It also ticks location, 500+ connections and Featured.

## Testing
- **Headless Chromium checks:**
  - Stairs on one baseline at 1280 px and 390 px.
  - The country picker (search, Enter, "+44" switching).
  - The place picker (list, arrows, postcode search, an unknown place refused, typed exact match accepted).
  - Long dates in the form and preview.
  - Still studying ticked from a future date.
  - Languages added and saved.
  - Spacing and margins changing the preview.
  - Phone size in dark mode with no sideways scroll.
  - No page errors.
- **A stand-in WebLLM** (served in place of the CDN module) checked:
  - Download stages and progress, the test call and the measured speed saved.
  - "In use" on the stairs.
  - Bullet points sent with the short prompt and the JSON schema.
  - The corner time-left card.
  - Polish on Finish.
  - A "recent graduate" summary for a current student rejected, then the penultimate-year version accepted.
  - The AI check: the profile cut and the reasonless cut were refused; the combine and the reasoned low-priority cut were kept.
- **LinkedIn paste:** a sample profile page filled the headline, About, 2 roles, 3 skills and education.
