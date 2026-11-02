# Job Finder v12: landing-page Home and Connect your AI (29 Oct 2026)

Version 12 of the Job Finder artifact (same URL). Shared-data rules and capabilities are unchanged from v10/v11.

## Home is now a landing page
- **Hero:** "From blank page to job offer, free." with a highlighter swipe on "free". It has the buttons "Build my resume" and "Connect your AI", plus a line saying which AI is writing right now.
- **Demo on the right:** a job ad and a resume sheet, with matching skills highlighted and a "Match 86%" badge. The resume belongs to the made-up "Sam Taylor" and is labelled as an example. It says which AI is in use ("Written from Sam's answers by …").
- **Sections, in order:**
  - **Tools:** four cards (Resume creator, Tailor to a job, Find jobs, Interviews and tests), plus links to the rest.
  - **"Bring your own AI":** six bars rising from easiest to best, with the recommended options highlighted and the one in use marked. Clicking a bar opens Connect your AI at that option.
  - **"Honest by design":** nothing made up, your key stays with you, free to use.
  - **The six-step plan:** unchanged ids (`homeTitle`, `homeProgress`, `homeToday`, `homePlan`), so the greeting and Today panel still work.
  - **A "Hiring?" strip** that switches to employer mode.

## Connect your AI (new view `#connect`)
- **Where it's reached:** a sidebar item under Home (shown in both modes). The AI chip in the sidebar footer now opens this view, not the old help popup.
- **Status card:** the current engine, a "Test it" button, and a setting "If my chosen AI fails, use Claude instead" (on by default).
- **The ladder,** from easiest to best. Options 3 and 5 are marked as recommended, and a suggestion box pushes them.

| # | Option | Engine id | Notes |
|---|---|---|---|
| 1 | No AI: built-in rules | `rules` | |
| 2 | Chrome's built-in AI | `chrome` | Shows live availability and requirements |
| 3 | Download an AI into your browser ("Best free and private") | `webllm` / `tfjs` | WebLLM 0.2.85: Qwen 2.5 1.5B, Llama 3.2 3B (suggested), Qwen 2.5 7B. Transformers.js 4.3.1: Qwen3 0.6B (suggested), Llama 3.2 1B. Loaded with dynamic import from jsDelivr. WebLLM runs in a blob module worker, falling back to the main thread. Download progress bar. Detects WebGPU. |
| 4 | Run an AI app on your computer | `local` | Ollama (localhost:11434/v1) or LM Studio (localhost:1234/v1). "Find my models" and setup tips. |
| 5 | Bring your own key ("Best results for most people") | `key` | Gemini (free, `gemini-3.5-flash-lite`), OpenRouter (free `:free` models, list loaded automatically), Groq, Claude (`claude-haiku-5-5`, with the `anthropic-dangerous-direct-browser-access` header), OpenAI, or any OpenAI-compatible service. "Load models", show/hide key, "Remember on this device", "Remove key". |
| 6 | Job Finder AI | `claude` | Inside Claude this is Claude on the viewer's account ("Use Claude"). On the website it shows "Coming soon" (paid plan). |

- `auto` (the default) behaves as before: Chrome's AI if it's ready, otherwise Claude, otherwise rules.
- Every option uses "Test and use": a short JSON test call, and the option is switched to only if it passes.

## How it's wired (ai-core)
- **One interface:** every tool already calls `sample.json(prompt or messages)`. `refreshSample()` points `sample` at:
  - `userSample` for webllm, tfjs, local or key
  - the real Claude sample (`claudeSample`) for auto, chrome or claude
  - `null` for rules
- **Same checks:** all existing checks (`factCheck`, `honest()`, the guards, the attribution checks) still run on every answer.
- **userSample:**
  - Adds a JSON-only system prompt.
  - `extractJSON` strips `<think>` blocks and code fences and finds the JSON object; one retry if that fails.
  - On error it falls back to Claude when available and the fallback setting is on.
  - Error codes: `bad_key`, `rate_limited`, `blocked`, `local_refused`, `no_webgpu`, `invalid_json`, `cancelled`, with plain-English messages.
- **Chrome is skipped** unless the engine is `auto` or `chrome`. `chromeAIState()` wraps the new `chromeAIRaw()`.
- **Labels follow the engine.** `AI_NAME()` and `AI_LONG()` replaced the hard-coded "Claude" in engine notes and via labels (scanner, cover letter, summary, interview rating, `viaWords`).
- **Storage:**
  - Settings in localStorage `jobfinder.ai.v1`.
  - The API key only in localStorage or sessionStorage `jobfinder.aikey.v1`, depending on "Remember". It is never written to the shared db.

## Limits
- **Inside Claude's preview,** the page's CSP blocks requests to other sites and model downloads. So options 3 to 5 only work once Job Finder is hosted as its own site. The page says so in each option, and tests fail with a clear message.
- **Groq's free tier and model names** weren't checked this session. Users load the model list with their key.

## Testing
- **Headless Chromium:**
  - Home and Connect at 1280 px (light) and 390 px (dark): no sideways scroll, no console errors.
  - Mocked Gemini endpoint: Load models (embedding models filtered out), then Test and use switches the engine. The chip shows "AI: Gemini". The scanner's AI review ran through the key (3 calls) and rendered.

## Source
From v12 on, the source is the `job-finder` project folder (see the README there): `src/index.html`, `src/styles/*.css` and `src/scripts/*.js`, joined by `scripts/build.mjs` into `dist/job-finder.html` (published to Claude) and `dist/index.html` (standalone).
