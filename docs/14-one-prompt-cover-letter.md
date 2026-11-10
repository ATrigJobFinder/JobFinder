# One prompt writes the cover letter

## What changed
- Every per-sentence prompt, fix-up turn and reviewer that wrote cover letters is gone. One prompt now does the job (`src/scripts/14c-letter-advice.js`).
- The prompt holds:
  - `LETTER_ADVICE`, a short summary of the **Cover Letter Advice** page. Edit it there when the page changes.
  - the resume (the profile as resume text; jobs from an uploaded resume that are still drafts count too),
  - the job ad, role, company, "why this company", availability, and any "Add a detail" the person typed.
- The AI writes the whole letter body in one go. `adviceSplit` cuts the answer into paragraphs (dropping any greeting or sign-off the AI added) and `advicePlace` puts them in the boxes: Opening, Experience, Education and skills, Why this company, Close.
  - Six or more paragraphs: the extras join "Why this company"; the last is always the Close.
  - Four paragraphs leave "Education and skills" empty; three also leave out "Why this company". An empty box keeps its Write with AI button.
- Used by **Create or edit cover letter** (Write all, and Write with AI on one box, which runs the same prompt and fills only that box) and by the **Tailor to a job** letter page.
- No AI, or an unusable answer: the standard letter built from the resume is used, as before.

## Removed
- `23e-letter-writer.js`: the sentence plan, per-paragraph facts, the checker, the correction loop, the whole-letter reviewer.
- `15-cover-letter.js`: `COVER_RULES`, `coverPrompt`, `factSheet`, the attribution and style correction turns.
- `17-ai-prompts.js`: `COVER_NANO` and `nanoCover`.

## Not changed
Reword, Expand with AI and the full-letter check still have their own prompts. Checks that run in code (clichés, made-up figures and skills, wrong-job flags) still run on the finished letter.

## Writing settings and keys (added later)
- Writing jobs send temperature 0.7, top_p 0.95 and room for a whole letter to every AI (`AI_WRITING` in `14-ai-engines.js`). Gemini's thinking models get no temperature.
- Test and use stops after 10 seconds and steps down to a lower model (`testKeyWithFallback`): lower versions of the same line first, then, for Gemini, Groq, Cerebras, Mistral and OpenRouter, the next best chat models.
- Load models drops voice, speech, safety and embedding models and puts the best chat model first (`aiRankModels`). Groq used to list alphabetically, so a voice model was picked and refused.
- A 400 or 403 that is about the model is reported as such (`bad_model`), not as a refused key. A 413 is reported as "too large" (`too_large`). Both let the test try another model.
- Groq and Cerebras get `max_completion_tokens`; their gpt-oss models also get `reasoning_effort: "medium"` and 2,000 tokens of room for the thinking. Groq's free plan is about 8,000 tokens a minute, so the room is kept small.

## Privacy safeguard (`src/scripts/14d-ai-privacy.js`)
- Every request to an AI reached with the person's own key (the only way anything leaves for a company's AI) goes through `aiScrubMessages` in `aiChatInner`. It swaps email addresses, phone numbers, street addresses, LinkedIn and other web links, the saved name (and referees' names), TFN/Medicare/passport numbers and dates of birth for labels like `[EMAIL_1]`. The suburb and state is swapped on a resume's contact line only.
- A separate check (`privLeaks`) then looks for the saved email, phone, links and name in the cleaned messages. If any is still there, the request is stopped (`privacy_block`) and nothing is sent.
- The labels are put back in the answer (`privRestore`), so letters keep the real details. Answers that are JSON stay valid.
- Not removed: work history, study, skills, the job ad, and anything else typed. A name that is not saved in the profile can't be recognised.
- The AI in the browser (WebLLM, Transformers.js) and Chrome's built-in AI run on the computer, so they are not cleaned.
- Shown to the person: the "Privacy safeguard" panel on Choose your AI (with a live count and "See exactly what would be sent") and a one-line note under Write all on the cover letter page.
