/* ===================== AI layer: prompts tuned for Chrome's on-device model ===================== */
// Gemini Nano (Chrome's built-in model) is small. It does best with:
//  - a short system prompt: a role, five or six numbered rules, "Reply with JSON only"
//  - one or two worked examples (user/assistant pairs) that show the exact output
//  - one focused job per prompt, with only the facts that job needs
//  - a JSON schema (responseConstraint), and one retry that names what was wrong
// Claude gets the same task with the fuller instructions.

const fewShot = examples => examples.flatMap(([u, a]) => [{ role: "user", content: u }, { role: "assistant", content: typeof a === "string" ? a : JSON.stringify(a) }]);
const examplesAsText = examples => examples.length ? "\n\nExample.\nInput:\n" + examples.map(([u, a]) => `${u}\nOutput:\n${typeof a === "string" ? a : JSON.stringify(a)}`).join("\n\nAnother example.\nInput:\n") : "";
// Parse, and if the model wandered off format, ask once more on the same session
async function nanoJSON(session, text, schema) {
  const raw = await session.prompt(text, { responseConstraint: schema, signal: aiRun.ctl.signal });
  try { return parseOrThrow(raw); }
  catch { if (aiRun.ctl.signal.aborted) throw aiError("cancelled"); return parseOrThrow(await session.prompt("That wasn't valid JSON. Reply again with only the JSON.", { responseConstraint: schema, signal: aiRun.ctl.signal })); }
}
// One task, three engines: the small model (in this browser, or Chrome's), then a bigger AI, then nothing (the caller has a fallback).
// check(data) returns { ok: true, value } or { ok: false, why } so a bad answer gets one corrected retry.
// The result says what happened, so the page can tell people honestly: tried (which AIs were asked), rejected (an answer broke a rule), error (one couldn't be reached).
async function aiJSON(task) {
  const gen = aiBegin();
  try {
    const r = await aiJSONInner(task, gen);
    // Stop was pressed while this was running: say so, whatever it was part-way through
    return aiRun.gen !== gen ? { data: null, via: null, rejected: false, tried: r.tried || [], error: aiError("cancelled"), cancelled: true } : r;
  } finally { aiEnd(gen); }
}
async function aiJSONInner(task, gen) {
  const { nano, full, examples = [], prompt, schema, check, progress = () => {}, label = "Working", noRetry = false, expect } = task;
  let rejected = false, error = null, raw = null, rawWhy = "", rawVia = null;
  const tried = [];
  aiLastProblem = null;
  let slowT = 0;
  const chrome = await withChromeAI(progress, async make => {
    tried.push("chrome");
    progress(`${label} with ${SMALL()}…`);
    // a small AI can take a minute on longer wording: say so, so it doesn't look stuck
    slowT = setTimeout(() => progress(`${label} with ${SMALL()}: still working. This AI can take up to a minute on longer wording…`), 15000);
    const s = await make(nano, examples, expect);
    let d = await nanoJSON(s, prompt, schema), r = check(d);
    if (!r.ok) {
      rejected = true; raw = d; rawWhy = r.why; rawVia = "chrome";
      // a second try doubles the wait, so a caller that shows the first answer with a note can skip it
      if (!noRetry) { d = await nanoJSON(s, `Your answer broke a rule: ${r.why}. Fix it and reply again with only the JSON.`, schema); r = check(d); if (!r.ok) { raw = d; rawWhy = r.why; } }
    }
    return r.ok ? r.value : null;
  });
  clearTimeout(slowT);
  if (chrome != null) return { data: chrome, via: "chrome", rejected, tried };
  if (aiRun.gen !== gen) return { data: null, via: null, rejected, tried };
  if (smallEngine() && aiLastProblem && !error) error = aiLastProblem;
  const big = afterSmall();
  if (big) {
    tried.push("claude");
    progress(`${label} with ${BIG_NAME()}…`);
    const first = `${full || nano}${examplesAsText(examples)}\n\nNow the real input:\n${prompt}`;
    try {
      const d1 = await big.json(first, { cache: false });
      let r = check(d1);
      if (!r.ok) {
        rejected = true; raw = d1; rawWhy = r.why; rawVia = "claude";
        if (!noRetry) {
          const d2 = await big.json([{ role: "user", content: first }, { role: "assistant", content: JSON.stringify(d1) }, { role: "user", content: `Your answer broke a rule: ${r.why}. Fix it and reply again with only the JSON.` }], { cache: false });
          r = check(d2);
          if (!r.ok) { raw = d2; rawWhy = r.why; }
        }
      }
      if (r.ok) return { data: r.value, via: "claude", rejected, tried };
    } catch (e) { error = e; }
  }
  return { data: null, via: null, rejected, tried, error, raw, rawWhy, rawVia };
}
// A long job done as several short prompts, for small models. Each step can use what the earlier steps wrote (done[key]),
// so steps that belong together, like the sentences of one paragraph, build on each other. Steps run one after another and the pieces are put together at the end.
// step: { key, label, nano, full?, examples?, prompt(done), schema, check?(data, done) → {ok, value} | {ok: false, why}, skip?(done) }
async function aiChain(steps, { progress = () => {}, signal } = {}) {
  const done = {}, missed = [];
  for (const [i, s] of steps.entries()) {
    if (signal && signal.aborted) throw aiError("cancelled");
    if (s.skip && s.skip(done)) continue;
    const r = await aiJSON({ nano: s.nano, full: s.full || s.nano, examples: s.examples || [], prompt: s.prompt(done), schema: s.schema, check: d => (s.check ? s.check(d, done) : { ok: true, value: d }), label: s.label, progress: m => progress(`${m} (step ${i + 1} of ${steps.length})`) });
    if (r.data != null) done[s.key] = r.data; else missed.push({ key: s.key, why: aiMissWords(r) });
  }
  return { done, missed };
}
const viaWords = via => via === "chrome" ? SMALL() : via === "claude" ? BIG_NAME() : "built-in rules (no AI)";
// Why there's no AI answer, in plain words
function aiMissWords(r) {
  if (!r || r.data) return "";
  if (r.cancelled) return "Stopped.";
  const who = r.tried && r.tried.includes("claude") ? BIG_NAME() : r.tried && r.tried.length ? SMALL() : "";
  if (!who) return USER_ENGINES.has(aiCfg.engine) && !aiUsable() ? "Your chosen AI isn't set up yet (see Choose your AI)." : "No AI is connected here, so this was done without it. Pick one under Choose your AI.";
  // a reply that stopped part-way (it hit the length limit) or wasn't JSON at all
  if (r.error && (r.error instanceof SyntaxError || r.error.code === "invalid_json")) return `${who} replied, but the reply was cut off or broken, so it wasn't used. Try again.`;
  if (r.error) return `Couldn't get an answer from ${who}: ${aiErrWords(r.error)}`;
  if (r.rejected) {
    // say which: it put something in that wasn't in your details ("added"), or left something out ("dropped")
    const drift = factDrift(r.rawWhy), why = r.rawWhy && drift ? ` (${r.rawWhy.replace(/^it /, "")})` : "";
    return drift ? `${who} answered, but its wording ${drift} facts${why}, so it wasn't used.` : `${who} answered, but its wording broke a rule${r.rawWhy ? ` (${r.rawWhy})` : ""}, so it wasn't used.`;
  }
  return `${who} didn't give a usable answer this time.`;
}
// "added" when the wording brought in something that isn't in your details, "dropped" when it left something out, "" for other rules (length, cliché)
const factDrift = why => /dropped|left out|leaves out|keep every|keep everything|bracketed gap|doesn't keep|missing/i.test(why || "") ? "dropped" : /isn't in the facts|placeholder|adds|new /i.test(why || "") ? "added" : "";
// The same message for a page, in red, with the word that matters in bold
function aiMissHtml(text) {
  const t = esc(text || "");
  const m = t.replace(/\b(added|dropped)\b/, "<b class=\"ai-key\">$1</b>");
  return /ai-key/.test(m) ? `<span class="ai-red">${m}</span>` : t;
}
// Instead of giving up on a rejected piece of text, show the AI the rule it broke and ask it to change just that part, until it passes.
// check(text) → "" when it's fine, otherwise the reason. → { text, res } (text is null if it still fails after the tries)
const TEXT_FIX_NANO = `You fix one piece of writing from a cover letter. You are told which rule it broke.
Change only the part that breaks the rule. Keep everything else word for word.
Reply with JSON only: {"text": "..."}`;
async function aiFixText({ text, why, check, progress = () => {}, tries = 3, context = "", expect }) {
  let cur = text, reason = why, last = null;
  for (let k = 1; k <= tries; k++) {
    progress(`That didn't pass (${reason}). Asking the AI to fix just that part (try ${k} of ${tries})…`);
    last = await aiJSON({
      nano: TEXT_FIX_NANO, full: TEXT_FIX_NANO + (context ? "\n\n" + context : ""), label: "Fixing", progress, noRetry: true, expect: expect || Math.max(300, cur.length * 2),
      prompt: `This broke a rule: ${reason}.\nWrite it again, changing only what breaks that rule.\nText:\n${cur}`,
      schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
      check: d => { const t = stripMarkup(String(d && d.text || "")).replace(/\s+/g, " ").trim(); const w = t ? check(t) : "it was empty"; return w ? { ok: false, why: w } : { ok: true, value: t }; }
    });
    if (last.data) return { text: last.data, res: last };
    const rt = last.raw && last.raw.text != null ? String(last.raw.text).trim() : "";
    if (!rt && !last.rawWhy) break;
    if (rt) cur = rt;
    reason = last.rawWhy || reason;
  }
  return { text: null, res: last };
}
// What the AI actually wrote when its answer wasn't used, so you can see what went wrong
function aiRawHtml(r) {
  const raw = r && r.raw;
  if (raw == null) return "";
  // one field per sentence (s1, s2, …) reads as one paragraph
  const list = Array.isArray(raw.options) ? raw.options : raw.text != null ? [raw.text] : Array.isArray(raw) ? raw : /^s\d+$/.test(Object.keys(raw)[0] || "") ? [Object.values(raw).join(" ")] : [raw];
  const items = list.map(x => (typeof x === "string" ? x : JSON.stringify(x)) || "").map(x => x.trim()).filter(Boolean);
  return items.length ? `<div class="ai-raw"><b>What ${esc(r.rawVia === "claude" ? BIG_NAME() : SMALL())} wrote (not used):</b>${items.map(t => `<p>${esc(t)}</p>`).join("")}</div>` : "";
}
// Facts in, facts out: nothing the candidate didn't give us
function factCheck(text, sources, o = {}) {
  const t = String(text || "").trim();
  if (!t) return "it was empty";
  if (/\[[^\]]{2,40}\]|\{[^}]{2,40}\}/.test(t)) return "it has a placeholder in square brackets";
  const okNums = new Set(numsOf(sources));
  const badNum = numsOf(t).find(n => !okNums.has(n) && !(o.years && /^(19|20)\d{2}$/.test(n)));
  if (badNum) return `the number ${badNum} isn't in the facts`;
  const have = skillSet(sources);
  const badSkill = [...skillSet(t)].find(s => !have.has(s) && (SKILLS.find(k => k.name === s) || {}).kind === "hard");
  if (badSkill) return `${badSkill} isn't in the facts`;
  const cl = [...CLICHES, ...COVER_CLICHES].find(c => c !== "responsible for" && new RegExp("\\b" + c.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "\\b", "i").test(t));
  if (cl) return `it uses the cliché "${cl}"`;
  if (FILLER.test(t)) return "it uses filler words like 'leveraging' or 'demonstrating'";
  if (o.noFirstPerson && /\b(I|my|me)\b/.test(t)) return "it uses I or my";
  const w = wordCount(t);
  if (o.min && w < o.min) return `it's too short (${w} words)`;
  if (o.max && w > o.max) return `it's too long (${w} words, the limit is ${o.max})`;
  return "";
}

/* --- Resume weaving, for the small model --- */
const WEAVE_NANO = `You edit one job's bullet points on a resume so they show skills the candidate confirmed.
Rules:
1. Use only facts from the bullets and notes. Never invent tools, numbers, results or tasks.
2. Put each skill inside an action, using its exact wording. Never tack it on with "demonstrating", "showcasing", "leveraging" or "utilising".
3. When you rewrite a bullet, keep every fact in it and change as few words as possible.
4. A soft skill with no note: add at most five words to a bullet whose action already involves it.
5. If a skill doesn't fit any bullet naturally, put it in not_woven.
6. Start with a past-tense verb, under 30 words, no full stop, never I, me or my.
Reply with JSON only.`;
const WEAVE_EXAMPLES = [[
  `Job: Retail Assistant · Bright Shoes
Existing bullets (numbered):
1. Served up to 80 customers a shift and processed sales on the POS system
2. Restocked shelves and counted stock each week
Skills to show:
- "Stock control" (technical skill). Note: "reordered low stock in the store's inventory app".
- "Attention to detail" (soft skill). No note.
- "SAP" (technical skill). No note.`,
  { edits: [{ bullet: 2, text: "Restocked shelves and handled stock control, counting stock weekly and reordering low lines in the store's inventory app", skills: ["Stock control"] }, { bullet: 1, text: "Served up to 80 customers a shift and processed sales on the POS system with close attention to detail", skills: ["Attention to detail"] }], new_bullets: [], not_woven: ["SAP"] }
]];
const PROFILE_NANO = `You lightly edit the profile paragraph at the top of a resume so it names strengths the candidate confirmed.
Rules:
1. Keep every fact, number, qualification and employer. Change as few words as possible.
2. Use each strength's exact wording inside an existing sentence, or add one short sentence.
3. No filler ("leveraging", "showcasing", "passionate"), no I, me or my, under 90 words.
Reply with JSON only.`;

/* --- Cover letter, one paragraph at a time --- */
const COVER_NANO = `You write one part of a formal Australian cover letter.
Rules:
1. Use only the facts given. Never invent tasks, tools, numbers, employers or dates. Copy every number exactly as it appears in the facts.
2. First person ("I"), formal, specific, Australian spelling. Sentences of 12 to 30 words.
3. Begin a sentence with "I" only when you are told to start with it. Otherwise begin with "My", or with the job or the study, for example "At ..." or "During ...".
4. Never write placeholders or square brackets. If a fact is missing, leave it out.
5. No clichés or hype: "I am writing to", eager, passionate, excited, thrilled, "team player", "hard-working", "results-driven", "perfect fit", dynamic. Never write utilising, leveraging, demonstrating, showcasing, honed, or furthermore: say what you did in plain words. No dashes, no exclamation marks, and no contractions: write "I am", never "I'm".
6. Never name a company, school, product or person that is not in the facts. Names that appear in an example are not yours.
7. Say about the company only what the facts say. Never add its reputation, values, culture, products or work from your own knowledge.
8. Start exactly as told, and keep to the sentence count asked for.
9. ${CL_CRAFT_SHORT}
Reply with JSON only: {"text": "..."}`;
const COVER_EXAMPLES = [[
  `Write 1 sentence about this ONE job, linked to what the ad asks for.
Job: Engineering Intern at Brightwater Solar
Facts from the resume:
- Modelled mounting brackets in SolidWorks and ran FEA in ANSYS, cutting component mass by 18%
- Prepared technical reports for design reviews
The ad asks for: SolidWorks, FEA, technical reports
Start with: "At Brightwater Solar, I"`,
  { text: "At Brightwater Solar, I modelled mounting brackets in SolidWorks and ran FEA in ANSYS, cutting component mass by 18%, and prepared technical reports for design reviews." }
]];
const TEXT_SCHEMA = { type: "object", properties: { text: { type: "string" } }, required: ["text"] };
async function nanoCover(ctx, make, progress) {
  const s0 = await make(COVER_NANO, COVER_EXAMPLES);
  const t = templateLetter(ctx);
  const tPart = k => (t.paragraphs.find(p => p.part === k) || {}).text || "";
  const hard = ctx.have.filter(x => x.kind === "hard").sort((a, b) => b.rel - a.rel).map(x => x.name);
  const soft = ctx.have.filter(x => x.kind === "soft").map(x => x.name);
  const resumeText = ctx.resume + "\n" + ctx.letters.join("\n");
  // ask for one part; check it; retry once; otherwise use the plain version of that part
  // strict: check against this part's facts only (each job sees only its own bullets)
  // before: the letter written so far, given to each part so the paragraphs read as one letter and don't repeat each other.
  // A two-sentence part is written a sentence at a time: the second is asked for knowing the first.
  const part = async (key, ask, facts, start, sentences, strict, before = "") => {
    const s = await s0.clone();
    try {
      const src = strict ? facts : resumeText + "\n" + facts;
      const sofar = before ? `\nThe letter so far (carry on from it, don't repeat it):\n${before.length > 600 ? "…" + before.slice(-600) : before}` : "";
      const write = async (prompt, mustStart) => {
        // contractions are put back in full before checking ("I'm applying" would otherwise fail the "start with" check)
        const full = x => { if (x && typeof x.text === "string") x.text = clNoContractions(x.text); return x; };
        let d = full(await nanoJSON(s, prompt, TEXT_SCHEMA));
        const bad = t => {
          let why = factCheck(t, src, { years: true });
          if (!why && strict) { const other = ctx.roles.find(r => r.orgShort && !facts.includes(r.orgShort) && String(t).toLowerCase().includes(r.orgShort.toLowerCase())); if (other) why = `it mentions ${other.orgShort}, a different job`; }
          if (!why && mustStart && !String(t).trim().toLowerCase().startsWith(mustStart.toLowerCase().slice(0, 12))) why = `it must start with "${mustStart}"`;
          return why;
        };
        let why = bad(d.text);
        if (why) { d = full(await nanoJSON(s, `Your answer broke a rule: ${why}. Write it again and reply with only the JSON.`, TEXT_SCHEMA)); why = bad(d.text); }
        return why ? null : stripMarkup(String(d.text)).replace(/\s+/g, " ").trim();
      };
      if (sentences === "2 sentences") {
        const a = await write(`Write 1 sentence about ${ask}.\n${facts}${sofar}\nStart with: "${start}"`, start);
        if (!a) return null;
        const b = await write(`Write the next sentence of the same paragraph. Don't repeat anything already said; add one new fact from the facts above.\nAlready written in this paragraph: ${a}`, "");
        return b ? `${a} ${b}` : a;
      }
      return await write(`Write ${sentences} about ${ask}.\n${facts}${sofar}\nStart with: "${start}"`, start);
    } finally { try { s.destroy(); } catch { /* gone */ } }
  };
  const soFar = () => paras.map(p => p.text).join(" ");
  const paras = [];
  const e = ctx.edu[0];
  progress(`Writing your opening with ${SMALL()}…`);
  const open = await part("opening", "why the candidate is applying (the opening paragraph)",
    `Role: ${ctx.title}\nCompany: ${ctx.company || "(not given)"}\nWhere the ad was seen: ${ctx.source || "(not given)"}\nStudy: ${e ? `${e.degree}${e.inst ? ` at ${e.inst.split(",")[0]}` : ""}${e.current && e.ends ? `, graduating ${e.ends}` : ""}` : "(not given)"}\nStrongest matching skills: ${hard.slice(0, 3).join(", ") || "(none)"}`,
    `I am applying for the ${ctx.title} position${ctx.company ? ` at ${ctx.company}` : ""}`, "2 sentences");
  paras.push({ part: "opening", text: open || tPart("opening"), evidence: e ? [e.degree] : [], repaired: !open });
  // experience: each job on its own, so nothing moves between employers
  const roles = ctx.roles.slice().sort((a, b) => b.score - a.score).filter(r => r.bullets.length).slice(0, 2);
  const lines = [];
  for (const [i, r] of roles.entries()) {
    progress(`Writing about ${r.orgShort || r.title} with ${SMALL()}…`);
    const top = r.bullets.slice().sort((a, b) => b.score - a.score).slice(0, 3);
    const start = i === 0 ? `As ${aOrAn(r.title)} ${r.title}${r.orgShort ? ` at ${r.orgShort}` : ""}, I` : r.orgShort ? `At ${r.orgShort}, I` : `In my role as ${r.title}, I`;
    const line = await part("experience", "this ONE job, linked to what the ad asks for",
      `Job: ${r.title}${r.orgShort ? ` at ${r.orgShort}` : ""}\nFacts from the resume:\n${top.map(b => "- " + b.text).join("\n")}\nThe ad asks for: ${[...new Set(top.flatMap(b => b.skills))].join(", ") || hard.slice(0, 4).join(", ") || "(see the facts)"}`, start, "1 or 2 sentences", true, (soFar() + " " + lines.join(" ")).trim());
    if (line) lines.push(line);
  }
  paras.push(lines.length ? { part: "experience", text: lines.join(" "), evidence: roles.map(r => r.label) } : { part: "experience", text: tPart("experience"), evidence: roles.map(r => r.label), repaired: true });
  progress(`Writing about your study and skills with ${SMALL()}…`);
  const tools = ctx.resumeHard.filter(n => hard.includes(n)).slice(0, 5);
  const edu = e ? await part("education", "the candidate's study and technical skills",
    `Qualification: ${e.degree}${e.inst ? `, ${e.inst.split(",")[0]}` : ""}\nRelevant subjects: ${e.coursework || "(not given)"}\nSkills and tools from the resume that the ad asks for: ${tools.join(", ") || "(none)"}`, `My ${e.degree}`, "2 sentences", false, soFar()) : null;
  if (tPart("education")) paras.push({ part: "education", text: edu || tPart("education"), evidence: e ? [e.coursework || e.degree] : [], repaired: !edu });
  progress(`Writing why you want this job with ${SMALL()}…`);
  const softRole = ctx.roles.slice().sort((a, b) => b.bullets.filter(x => soft.some(sn => skillSet(x.text).has(sn))).length - a.bullets.filter(x => soft.some(sn => skillSet(x.text).has(sn))).length)[0];
  const mot = await part("motivation", "why the candidate wants this job, and the people skills it needs",
    `Company: ${ctx.company || "(not given)"}\nThe candidate's reason, in their words: ${ctx.why || "(not given)"}\nWhat interests them about the role: ${(ctx.interest || []).join("; ") || "(not given)"}\nWhat the role involves: ${ctx.dutyLine || "(not given)"}\nSoft skills the ad asks for: ${soft.slice(0, 3).join(", ") || "(none)"}${(ctx.values || []).length ? `\nWhat the company says it values: ${ctx.values.slice(0, 4).join(", ")}` : ""}${ctx.guide && ctx.guide.purpose ? `\nThe company's stated purpose: ${ctx.guide.purpose}` : ""}${softRole ? `\nOne job that shows them: ${softRole.title}${softRole.orgShort ? ` at ${softRole.orgShort}` : ""}: ${softRole.bullets.slice(0, 2).map(b => b.text).join("; ")}` : ""}`,
    ctx.company ? `I am drawn to ${ctx.company}` : "I am drawn to this role", "2 sentences", false, soFar());
  paras.push({ part: "motivation", text: mot || tPart("motivation"), evidence: softRole ? [softRole.label] : [], repaired: !mot });
  // the close is the same every time: thanks, availability and contact details from the form, never placeholders
  paras.push({ part: "closing", text: tPart("closing"), evidence: [] });
  return { salutation: ctx.recipient ? `Dear ${ctx.recipient},` : "Dear Hiring Manager,", paragraphs: paras.filter(p => p.text), signoff: "Yours sincerely,", via: `Written by ${SMALL()}, one paragraph at a time` };
}

/* --- Resume creator: summary and bullet points --- */
const SUMMARY_NANO = `You write the 2 or 3 sentence profile at the top of an Australian resume.
Rules:
1. Use only the candidate's facts. Never invent skills, tools, numbers or achievements.
2. 40 to 75 words. No "I", no "my".
3. Who they are, then their strongest skills with one piece of evidence, then what they want next.
3b. If they gave "A result they're proud of", it must be in the summary as the piece of evidence, with its numbers kept exactly.
4. Still studying? Say their year of study, like "Penultimate-year engineering student". Never call a current student a graduate.
5. No clichés ("hard-working", "team player", "passionate", "results-driven") and no buzzwords ("leverage", "utilise").
Reply with JSON only: {"summary": "..."}`;
const SUMMARY_EXAMPLES = [[
  `<their_answers>
How they describe themselves: retail assistant studying business part time
Strongest skills: customer service, cash handling, rostering
A result they're proud of: trained 4 new staff
What they want next: an office administration role
</their_answers>
<experience>
- Retail Assistant at Kmart (2022 – Present): Served 100+ customers a day; Trained 4 new staff on the registers
</experience>`,
  { summary: "Retail assistant and part-time business student with three years of customer-facing work. Skilled in customer service, cash handling and rostering, and trusted to train 4 new staff on the registers. Looking for an office administration role where organisation and people skills count." }
], [
  `<study>Still studying Bachelor of Engineering (Honours) at Curtin University, expected to finish Nov 2027. Today is October 2026, so they are a penultimate-year student. Never call them a graduate or recent graduate.</study>
<their_answers>
Strongest skills: SolidWorks, technical reports
What they want next: a summer vacation placement in mining engineering
</their_answers>`,
  { summary: "Penultimate-year Bachelor of Engineering (Honours) student at Curtin University, skilled in SolidWorks design and technical report writing. Looking for a summer vacation placement in mining engineering to build site experience before graduating in 2027." }
]];
const BULLET_NANO = `You turn a candidate's answers about one job into polished resume bullet points, ready to use.
Rules:
1. Use only what they wrote. Never invent numbers, tools, results or team sizes. Keep numbers exactly.
2. Each bullet follows this formula: action verb + what they did + the result, with a number where possible. A complete sentence without "I"; "what they did" can say how (the tools or people they named). If no result is given, say what the work achieved in plain words, never invent a number.
3. Describe each task the way a capable person in that role would, with its usual purpose (a barista "kept orders moving through the morning rush"). Never add a task, tool, number or result.
4. Combine short, related tasks into one fuller bullet. Write 3 to 5 bullets of 16 to 30 words, the most important (biggest results and responsibilities) first.
5. Past tense for a past job, present tense for a current job. Each starts with a different strong verb. No "I", "my", "responsible for", clichés or full stops.
Reply with JSON only: {"bullets": ["..."]}`;
const BULLET_EXAMPLES = [[
  `<job>Café Supervisor at Grind Coffee, 2021 – 2024 (a past job: use past tense)</job>
<their_answers>
Main responsibilities: opened and closed the café, made coffee, supervised the floor
Achievements and results: trained 6 new baristas; cut morning wait times by sorting the order queue
Tools, software, equipment: Square POS, Deputy rosters
Who they worked with or for: a team of 6, up to 300 customers a day
</their_answers>`,
  { bullets: ["Cut morning wait times for up to 300 customers a day by reorganising how the order queue was sorted and worked through", "Supervised a team of 6 on the café floor, opening and closing the café and managing staff rosters in Deputy so every shift was covered", "Trained 6 new baristas to make coffee to the café's standard and use the Square POS system confidently"] }
]];

/* --- Interview answers --- */
const IV_NANO = `You are an Australian interview coach. Rate one practice answer and coach the candidate.
Rules:
1. Base every comment on what they wrote. Never invent experience for them.
2. Score each criterion 1 to 10: 5 is acceptable, 7 good, 9 or 10 rare. A short or off-topic answer scores low.
3. strengths and improvements: 1 to 3 short, specific points each.
4. stronger_answer: their own answer reorganised with the framework, under 150 words, with [square-bracket prompts] where a detail is missing.
5. follow_up: one question an interviewer would ask next.
Reply with JSON only.`;
const IV_EXAMPLES = [[
  `<question type="Behavioural">Tell me about a time you had to meet a tight deadline.</question>
<framework>STAR: Situation, Task, Action (most of it, in "I"), Result.</framework>
<criteria>Structure, Relevance, Evidence, Result, Delivery</criteria>
<answer words="34">
We had a big uni assignment due and the group was behind so we all worked really hard over the weekend and got it done in time. It was stressful but we did it.
</answer>`,
  { overall: 4, scores: [{ criterion: "Structure", score: 4, note: "There's a situation and an outcome, but no clear task or actions." }, { criterion: "Relevance", score: 7, note: "On topic: a real deadline." }, { criterion: "Evidence", score: 3, note: "All 'we': it's not clear what you did." }, { criterion: "Result", score: 4, note: "Submitted on time, but no mark or feedback." }, { criterion: "Delivery", score: 3, note: "About 15 seconds; aim for 1.5 to 2 minutes." }], strengths: ["You picked a real example with a genuine deadline."], improvements: ["Say what you personally did, step by step, using 'I'.", "Finish with the result: the mark or what the tutor said."], stronger_answer: "Situation: In my [year] group assignment for [subject], we were [how far] behind with [time] left.\nTask: I needed to [your goal].\nAction: I [what you did first], then [next step], and [how you kept everyone on track].\nResult: We submitted on time and got [mark or feedback]. I learned [one lesson].", follow_up: "What did you personally do to get the group back on track?" }
]];

