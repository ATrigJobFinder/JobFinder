/* ===================== Writing the update ===================== */
// The AI's brief. Code checks below enforce honesty and natural wording whatever the AI returns.
const WEAVE_RULES = `You update one job on a candidate's resume so it shows skills the candidate has confirmed they used in that job.

Rules:
- Use only facts from the existing bullets and the candidate's notes. Never invent tasks, tools, results, numbers, employers or dates.
- Write the way a strong resume reads: concrete actions and results, plain words, no filler. Never tack a skill on with phrases like "while applying ... skills", "leveraging", "utilising", "showcasing" or "demonstrating".
- For a skill WITH a note: if an existing bullet already describes that work, rewrite that bullet so the skill and the note's detail are part of the action. Otherwise write one new bullet from the note and say which existing bullet it should follow.
- For a skill WITHOUT a note: only rewrite an existing bullet if that task genuinely involved the skill and the skill fits into the action itself (for example "Built 3D models of bracket designs in SolidWorks" for "3D modelling"). If it would read as tacked on, leave the bullets alone and list the skill in "not_woven".
- For a soft skill WITHOUT a note: weave it lightly into the bullet in this job where the action already involves it, using the most natural word form rather than the label. For example "Communicated operational updates to colleagues…" for communication, "…to solve problems and identify opportunities…" for problem solving, "…with close attention to detail" for attention to detail. Add no more than five words, add no new details, and use a different bullet for each soft skill where you can. If no bullet involves it, list it in "not_woven".
- Never use bold, asterisks, quotation marks or labels. Never add phrases like "demonstrating", "showcasing", "proving", "known for", "leveraging", "utilising" or "while applying ... skills".
- When you rewrite a bullet, keep every fact, number and tool already in it and change as few words as possible.
- Use each skill's wording exactly as given, and echo the job ad's phrasing where it is true.
- Match the existing bullets: start with a strong past-tense verb, keep under 30 words, no full stop at the end, Australian spelling, never I, me or my.
- Rewrite each bullet at most once. You may weave two skills into one bullet.`;
const PROFILE_RULES = `You lightly edit the profile paragraph at the top of a resume so it names some strengths the candidate has confirmed.

Rules:
- Keep every fact, number, qualification and employer already in the paragraph. Change as few words as possible.
- Work the listed strengths into an existing sentence, or add one short sentence. Use each strength's wording exactly as given.
- Plain, confident resume language: no filler such as "leveraging", "showcasing" or "passionate".
- Australian spelling. Keep it under 90 words. Avoid I, me and my.`;
const LM_OPTS = { expectedInputs: [{ type: "text", languages: ["en"] }], expectedOutputs: [{ type: "text", languages: ["en"] }] };
const PLAN_SCHEMA = {
  type: "object",
  properties: {
    edits: { type: "array", items: { type: "object", properties: { bullet: { type: "integer" }, text: { type: "string" }, skills: { type: "array", items: { type: "string" } } }, required: ["bullet", "text", "skills"] } },
    new_bullets: { type: "array", items: { type: "object", properties: { after: { type: "integer" }, text: { type: "string" }, skills: { type: "array", items: { type: "string" } } }, required: ["after", "text", "skills"] } },
    not_woven: { type: "array", items: { type: "string" } }
  },
  required: ["edits", "new_bullets", "not_woven"]
};
const PROFILE_SCHEMA = { type: "object", properties: { profile: { type: "string" } }, required: ["profile"] };
const AS_WRITTEN = "From your note";
const FIRST_PERSON = /(^|[^A-Za-z'])(I|me|my|My)(?![A-Za-z'])/;
const FILLER = /\b(while (applying|demonstrating|utili[sz]ing|leveraging|showing)|leverag\w*|utili[sz]\w*|showcas\w*|demonstrat\w*|proving|proven (ability|track)|known for|adept at|skills? in action|passionate|abilities)\b|\*\*|__/i;

// Where skills land in a Skills section, by kind of skill
const SOFTWARE = new Set(["SolidWorks", "AutoCAD", "CATIA", "Creo", "Siemens NX", "Autodesk Inventor", "Fusion 360", "Revit", "Civil 3D", "MicroStation", "ANSYS", "Abaqus", "COMSOL", "MATLAB", "Simulink", "LabVIEW", "Microsoft Excel", "Power BI", "Tableau", "Jira", "Microsoft Project", "Primavera P6", "SAP", "Salesforce", "QGIS", "GIS", "Google Earth Pro", "Microsoft Office", "Microsoft Word", "PowerPoint", "Xero", "MYOB", "Git", "Docker", "Kubernetes", "AWS", "Microsoft Azure", "Google Cloud", "Linux", "CAD", "SCADA", "PLC"]);
const PROGRAMMING = new Set(["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "SQL", "VBA", "HTML", "CSS", "React.js", "Node.js", "pandas", "NumPy", "APIs"]);
const LICENCES = new Set(["Driver's licence", "White Card", "First aid", "Working with Children Check"]);
const skillGroup = (name, kind) => LICENCES.has(name) ? "licence" : PROGRAMMING.has(name) ? "programming" : SOFTWARE.has(name) ? "software" : kind === "soft" ? "soft" : "technical";
const GROUP_LABEL = { licence: /\b(licen[cs]es?|tickets?|clearances?)\b/i, programming: /\b(programming|languages?|coding|code)\b/i, software: /\b(software|tools?|programs|cad|applications|technolog\w*|platforms?)\b/i, soft: /\b(soft|personal|strengths|interpersonal)\b/i, technical: /\b(engineering|technical|analysis|skills|expertise|capabilit\w*|core|specialis\w*)\b/i };
const GROUP_NEW = { licence: "Licences", programming: "Programming", software: "Software", soft: "Strengths", technical: "Additional skills" };
// "HVAC" and "SolidWorks" keep their capitals; "Engineering calculations" reads better as "engineering calculations" mid-sentence
// How a soft skill reads inside a sentence (each phrase still contains a form the scanner recognises)
const SOFT_PHRASE = { "Problem solving": "problem-solving skills", "Communication": "clear communication", "Time management": "good time management", "Customer focus": "a customer focus", "Willingness to learn": "a willingness to learn", "Negotiation": "negotiation skills", "Decision making": "sound decision-making", "Prioritisation": "good prioritisation", "Working independently": "the ability to work independently", "Attention to detail": "attention to detail", "Organisational skills": "organisational skills" };
// How a soft skill can sit lightly at the end of a bullet, and which kinds of bullet it suits
const SOFT_WEAVE = {
  "Communication": { add: ", communicating clearly with the team", fit: /colleague|team|client|customer|stakeholder|message|update|report|present|liais|explain|staff|community/i , eg: "briefed the night team on open trades" },
  "Problem solving": { add: ", solving problems as they arose", fit: /issue|problem|identif|analys|improv|fix|fault|trouble|emergenc|risk|resolv/i , eg: "fixed a recurring stock count error" },
  "Teamwork": { add: ", collaborating closely with the team", fit: /team|colleague|cross-functional|staff|together|group/i , eg: "worked with the design team on site layouts" },
  "Leadership": { add: ", showing leadership", fit: /\bled\b|lead|supervis|train|coordinat|manag|mentor/i , eg: "trained two new starters" },
  "Critical thinking": { add: ", applying critical thinking", fit: /analys|assess|evaluat|review|insight|decision/i },
  "Attention to detail": { add: " with close attention to detail", fit: /check|accura|data|clean|drawing|monitor|inspect|report|stock|record/i , eg: "checked every survey map before issue" },
  "Time management": { add: " while meeting deadlines", fit: /deadline|roster|schedul|deliver|shift|overnight|time/i , eg: "balanced shifts with full-time study" },
  "Organisational skills": { add: ", staying well organised", fit: /roster|stock|deliver|organis|schedul|coordinat|record/i },
  "Adaptability": { add: ", adapting to changing priorities", fit: /change|emergenc|shift|new|various|range/i , eg: "covered different roles when short-staffed" },
  "Initiative": { add: ", taking the initiative", fit: /identif|improv|independ|\bown\b|opportunit|suggest|initiat/i , eg: "built a tracking sheet without being asked" },
  "Analytical skills": { add: ", applying analytical thinking", fit: /analys|data|model|assess|insight|trend/i },
  "Stakeholder management": { add: ", working closely with stakeholders", fit: /client|stakeholder|council|supplier|subcontract|contractor|consultant|government|liais/i, eg: "kept the council and two subcontractors updated each week" },
  "Safety mindset": { add: ", following safe work practices", fit: /safe|safety|hazard|ppe|whs|ohs|induction|toolbox|risk/i, eg: "ran the morning toolbox talk on site" },
  "Accountability": { add: ", taking ownership of the result", fit: /\bown|accountab|responsib|deliver|sign[- ]off/i },
  "Empathy": { add: ", with empathy", fit: /patient|client|customer|care|resident|student|participant|complain/i },
  "Conflict resolution": { add: ", resolving conflicts calmly", fit: /complain|conflict|dispute|escalat|difficult|upset/i, eg: "calmed an upset customer and found a fix" },
  "Interpersonal skills": { add: ", drawing on interpersonal skills", fit: /customer|client|colleague|staff|team|relay|community|children|people/i , eg: "built rapport with regular customers" },
  "Customer focus": { add: " with a strong customer focus", fit: /customer|client|sales|retail|store|service/i , eg: "handled customer fittings and returns" },
  "Working independently": { add: ", working independently", fit: /\bsole|independ|overnight|\bown\b/i , eg: "ran the overnight desk alone" },
  "Mentoring": { add: ", including mentoring", fit: /train|support|staff|new|junior/i },
  "Negotiation": { add: ", negotiating outcomes", fit: /supplier|client|contract|agree|price/i },
  "Presentation skills": { add: ", including presentations", fit: /present|report|brief|insight|stakeholder/i },
  "Decision making": { add: ", applying sound decision-making", fit: /decision|emergenc|trade|risk|assess/i },
  "Creativity": { add: ", bringing creative ideas", fit: /design|idea|improv|visualis|develop/i },
  "Resilience": { add: ", staying resilient under pressure", fit: /pressure|emergenc|overnight|high-stakes|deadline/i },
  "Prioritisation": { add: ", prioritising tasks", fit: /task|roster|deliver|schedul|multiple/i },
  "Willingness to learn": { add: ", with a willingness to learn", fit: /learn|new|train|program|student|intern/i, eg: "picked up the store system in my first week" }
};
const softPhrase = name => SOFT_PHRASE[name] || name.toLowerCase();
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const inSentence = name => /[A-Z].*[A-Z]|^[A-Z]{2,}|\d/.test(name) || SOFTWARE.has(name) || PROGRAMMING.has(name) ? name : name.toLowerCase();

async function chromeAIState() { return aiChromeAllowed() ? chromeAIRaw() : "absent"; }
async function chromeAIRaw() {
  try {
    if (!("LanguageModel" in self)) return "absent";
    return await self.LanguageModel.availability(LM_OPTS);
  } catch { return "absent"; }
}
async function describeEngine() {
  const el = $("engineNote");
  if (!el) return;
  const st = await chromeAIState();
  if (!$("engineNote")) return;
  if (smallEngine()) el.textContent = `Wording by ${SMALL()}, ${smallWhere()}.${smallEngine() === "key" ? "" : " The corner shows roughly how long it takes."}`;
  else if (st === "available") el.textContent = `Wording by ${BROWSER_AI()}, on this device.`;
  else if (st === "downloadable" || st === "downloading") el.textContent = `${BROWSER_AI()} is tried first. The first time, the browser downloads its model, which can take a few minutes${sample ? ". If it can't run, " + AI_NAME() + " words it instead." : "."}`;
  else if (sample) el.textContent = "Wording by " + AI_NAME() + ".";
  else el.textContent = "No AI on this page, so your notes are added as you wrote them.";
}

const tidy = s => String(s).trim().replace(BULLET_RE, "").replace(/[.\s]+$/, "");
const stripMarkup = s => typeof s === "string" ? s.replace(/\*\*|__|`/g, "").replace(/^["“]|["”]$/g, "") : s;
// Standalone figures only: "3D", "AS4041" and "Fusion 360"-style names are part of a skill, not a claim
const numsOf = s => (String(s).match(/(?<![A-Za-z0-9])\d[\d,.]*%?(?![A-Za-z])/g) || []).map(n => n.replace(/[.,]+$/, ""));
// How many words of b are not in a: a wording that only swaps one word doesn't count as reworded
const changedWords = (a, b) => { const pool = {}; for (const w of (String(a).toLowerCase().match(/[a-z0-9%$'’-]+/g) || [])) pool[w] = (pool[w] || 0) + 1; let n = 0; for (const w of (String(b).toLowerCase().match(/[a-z0-9%$'’-]+/g) || [])) { if (pool[w] > 0) pool[w]--; else n++; } return n; };
const contentWords = s => new Set((norm(s).match(/[a-z][a-z0-9+#]{3,}/g) || []).filter(w => !STOP.has(w)).map(stem));
const skillSet = s => new Set(findSkills(norm(s)).keys());
const mentions = (text, skill) => findSkills(norm(text)).has(skill) || norm(text).includes(norm(skill));
const keptShare = (orig, t) => { const ow = contentWords(orig), tw = contentWords(t); let k = 0; for (const w of ow) if (tw.has(w)) k++; return ow.size ? k / ow.size : 1; };

// A rewritten bullet must keep the original's facts, add only the confirmed skills, and read naturally
function guardEdit(orig, text, claimed, notesText, maxAdd = 20) {
  if (typeof text !== "string" || !tidy(text)) return "returned nothing";
  if (/\*\*|__/.test(text)) return "added formatting marks";
  const t = tidy(text);
  if (wordCount(t) > 45) return "made a bullet too long";
  if (wordCount(t) - wordCount(orig) > maxAdd) return "added too much to an existing bullet";
  if (FIRST_PERSON.test(t)) return "used first person";
  if (FILLER.test(t) && !FILLER.test(orig)) return "tacked a skill on with filler wording";
  const tNums = new Set(numsOf(t));
  for (const n of numsOf(orig)) if (!tNums.has(n)) return `dropped the figure ${n}`;
  const okNums = new Set([...numsOf(orig), ...numsOf(notesText), ...numsOf(claimed.join(" "))]);
  for (const n of tNums) if (!okNums.has(n)) return `added the number ${n}, which you didn't give`;
  const oSk = skillSet(orig), tSk = skillSet(t);
  for (const s of oSk) if (!tSk.has(s)) return `removed ${s} from a bullet`;
  const allowed = new Set([...oSk, ...claimed, ...skillSet(notesText)]);
  for (const s of tSk) if (!allowed.has(s)) return `added ${s}, which you didn't confirm`;
  for (const c of claimed) if (!mentions(t, c)) return `left out ${c}`;
  if (keptShare(orig, t) < 0.6) return "changed too much of an existing bullet";
  return null;
}
// A new bullet may only say what the note says
function guardNew(text, claimed, notesText) {
  if (typeof text !== "string" || !tidy(text)) return "returned nothing";
  const t = tidy(text);
  if (wordCount(t) > 35) return "wrote a bullet that was too long";
  if (FIRST_PERSON.test(t)) return "used first person";
  if (FILLER.test(t)) return "tacked a skill on with filler wording";
  const okNums = new Set([...numsOf(notesText), ...numsOf(claimed.join(" "))]);
  for (const n of numsOf(t)) if (!okNums.has(n)) return `added the number ${n}, which you didn't give`;
  const allowed = new Set([...claimed, ...skillSet(notesText)]);
  for (const s of skillSet(t)) if (!allowed.has(s)) return `added ${s}, which you didn't confirm`;
  for (const c of claimed) if (!mentions(t, c)) return `left out ${c}`;
  return null;
}
function guardProfile(orig, text, claimed) {
  if (typeof text !== "string" || !text.trim()) return "returned nothing";
  const t = text.trim();
  if (wordCount(t) > Math.max(95, wordCount(orig) + 25)) return "made the profile too long";
  if (FIRST_PERSON.test(t) && !FIRST_PERSON.test(orig)) return "used first person";
  if (FILLER.test(t) && !FILLER.test(orig)) return "added filler wording or formatting";
  if (wordCount(t) - wordCount(orig) > 25) return "added too much to your profile";
  const tNums = new Set(numsOf(t));
  for (const n of numsOf(orig)) if (!tNums.has(n)) return `dropped the figure ${n}`;
  for (const n of tNums) if (!numsOf(orig).includes(n)) return `added the number ${n}`;
  const oSk = skillSet(orig), tSk = skillSet(t);
  for (const s of oSk) if (!tSk.has(s)) return `removed ${s}`;
  for (const s of tSk) if (!oSk.has(s) && !claimed.includes(s)) return `added ${s}, which you didn't confirm`;
  for (const c of claimed) if (!mentions(t, c)) return `left out ${c}`;
  if (keptShare(orig, t) < 0.7) return "rewrote too much of your profile";
  return null;
}

// Is the note an action ("drafted bracket drawings") or just a name ("HyperMesh", "Risk and Project Management class")?
const ACTION_START = /^(?:[a-z]+ed|built|led|ran|wrote|made|drew|set|gave|took|kept|met|sold|taught|won|did|brought|chose|found|held|sent|spent|put|read|use|used|design|draft|build|run|write|create|prepare|model|analy[sz]e|calculate|check|manage|lead|train|support|assist|help|size|map|produce|develop|test|review|inspect|plan|coordinate|present|report|monitor|maintain|install|operate|program|code|automate|survey|estimate|draw|weld|machine|commission|research|teach|mentor|organise|organize|negotiate|serve|handle|solve|fix|improve|reduce|increase|deliver|complete|conduct|perform|apply|implement|work|worked|liaise|communicate)\b/i;
const isAction = note => ACTION_START.test(note.trim());
function literalBullet(s) {
  let t = tidy(s.note);
  t = t[0].toUpperCase() + t.slice(1);
  if (mentions(t, s.name)) return t;
  const g = skillGroup(s.name, s.kind);
  if (g === "software" || g === "programming") return `${t} using ${s.name}`;
  if (s.kind === "soft") return `${t}, showing ${softPhrase(s.name)}`;
  return `${t} (${inSentence(s.name)})`;
}
// Where a note-based bullet sits: after the existing bullet it has most in common with
function relatedBullet(zone, s) {
  const want = contentWords(s.note + " " + (s.adLine || "") + " " + s.name);
  let best = zone.bullets.length - 1, bestN = 0;
  zone.bullets.forEach((b, i) => { let n = 0; for (const w of contentWords(b.text)) if (want.has(w)) n++; if (n > bestN) { bestN = n; best = i; } });
  return best;
}

function rolePrompt(g) {
  const z = g.zone;
  return `Job: ${z.label}
Existing bullets (numbered):
${z.bullets.map((b, i) => `${i + 1}. ${b.text}`).join("\n") || "(none)"}
Skills to show:
${g.skills.map(s => `- "${s.name}" (${s.kind === "soft" ? "soft skill" : "technical skill"}). ${s.note ? `Note: "${s.note}".` : "No note."}${s.adLine ? ` The job ad says: "${s.adLine}"` : ""}`).join("\n")}`;
}
const profilePrompt = (text, strengths) => `Profile paragraph:
"${text}"
Strengths to work in, worded exactly: ${strengths.map(s => `"${inSentence(s)}"`).join(", ")}`;
const JSON_SHAPE = `{"edits": [{"bullet": 2, "text": "rewritten bullet", "skills": ["skill"]}], "new_bullets": [{"after": 1, "text": "new bullet", "skills": ["skill"]}], "not_woven": ["skill"]}`;

// Check what the AI proposed against the rules; keep only what passes
function checkPlan(g, raw, via) {
  const z = g.zone, res = { edits: [], adds: [], rejected: [] };
  const byName = n => g.skills.find(s => norm(s.name) === norm(String(n)));
  const covered = new Set(), used = new Set();
  for (const e of (raw && Array.isArray(raw.edits) ? raw.edits : [])) {
    const i = Number(e && e.bullet) - 1;
    if (!(i >= 0 && i < z.bullets.length) || used.has(i)) continue;
    const claimed = [...new Set((Array.isArray(e.skills) ? e.skills : []).map(byName).filter(Boolean).map(s => s.name))].filter(n => !covered.has(n));
    if (!claimed.length) continue;
    const noted = claimed.some(n => byName(n).note);
    e.text = stripMarkup(e.text);
    const why = guardEdit(z.bullets[i].text, e.text, claimed, claimed.map(n => byName(n).note).join(" \n "), noted ? 20 : 2 + 3 * claimed.length);
    if (why) { res.rejected.push(why); continue; }
    res.edits.push({ i, text: tidy(e.text), skills: claimed, via });
    used.add(i); claimed.forEach(n => covered.add(n));
  }
  for (const a of (raw && Array.isArray(raw.new_bullets) ? raw.new_bullets : [])) {
    const claimed = [...new Set((Array.isArray(a && a.skills) ? a.skills : []).map(byName).filter(s => s && s.note).map(s => s.name))].filter(n => !covered.has(n));
    if (!claimed.length) continue;
    a.text = stripMarkup(a.text);
    const why = guardNew(a.text, claimed, claimed.map(n => byName(n).note).join(" \n "));
    if (why) { res.rejected.push(why); continue; }
    let after = Number(a.after) - 1;
    if (!Number.isFinite(after) || after < 0 || after >= z.bullets.length) after = z.bullets.length - 1;
    res.adds.push({ after, text: tidy(a.text), skills: claimed, via });
    claimed.forEach(n => covered.add(n));
  }
  res.covered = covered;
  return res;
}
// Whatever the AI didn't weave in:
//  - an action note becomes a bullet in that job (or a "Project:" line under an education entry)
//  - a short note like "HyperMesh" becomes "engineering drawings (HyperMesh)" in the Skills section
//  - a soft skill with no note goes into the Profile; a technical skill with no note goes into the Skills section
function finishPlan(g, plan) {
  plan = plan || { edits: [], adds: [], rejected: [], covered: new Set() };
  plan.toSkills = []; plan.toProfile = []; plan.softLeft = [];
  for (const s of g.skills) {
    if (plan.covered.has(s.name)) continue;
    if (s.note && isAction(s.note)) {
      const text = g.zone.kind === "education" && !g.zone.marker ? "Project: " + literalBullet(s) : literalBullet(s);
      plan.adds.push({ after: relatedBullet(g.zone, s), text, skills: [s.name], via: AS_WRITTEN });
    } else if (s.note) plan.toSkills.push({ name: s.name, kind: s.kind, entry: `${inSentence(s.name)} (${tidy(s.note)})` });
    else if (s.kind === "soft") plan.softLeft.push(s);
    else plan.toSkills.push({ name: s.name, kind: s.kind, entry: inSentence(s.name) });
  }
  return plan;
}

// The small-model path: the AI downloaded into this browser if that's the choice, otherwise Chrome's own.
// make(rules, examples) gives a session with prompt(), clone() and destroy(), whichever it is.
async function chromeSampling() {
  try { const pr = self.LanguageModel.params && await self.LanguageModel.params(); if (pr && pr.defaultTopK) return { temperature: Math.min(AI_WRITING.temperature, pr.maxTemperature || AI_WRITING.temperature), topK: pr.defaultTopK }; } catch { /* leave it at the browser's own settings */ }
  return {};
}
async function withChromeAI(progress, fn) {
  const gen = aiBegin();
  try { return await withChromeAIInner(progress, fn); }
  finally { aiEnd(gen); }
}
async function withChromeAIInner(progress, fn) {
  const be = smallEngine();
  if (be) {
    try { return await fn(async (rules, examples = [], expect, mo = {}) => browserSession(be, rules, examples, undefined, expect, mo)); }
    catch (e) { aiLastProblem = e; return null; }
  }
  const st = await chromeAIState();
  if (!(st === "available" || st === "downloadable" || st === "downloading")) return null;
  const sessions = [];
  try {
    // rules: a short system prompt; examples: [[user, assistant], …] worked examples for the small model
    const make = async (rules, examples = [], expect, mo = {}) => {
      const base = {
        ...LM_OPTS, initialPrompts: [{ role: "system", content: rules }, ...fewShot(examples)],
        monitor(m) { if (st !== "available") m.addEventListener("downloadprogress", e => aiDownloadProgress(e.loaded || 0, progress)); }
      };
      // writing prose: a warmer temperature, only where the browser says what it allows (it takes a temperature and a topK together); otherwise its own settings
      const samp = mo.writing ? await chromeSampling() : {};
      let s; try { s = await self.LanguageModel.create({ ...base, ...samp }); } catch (e) { if (!Object.keys(samp).length) throw e; s = await self.LanguageModel.create(base); }
      sessions.push(s); return s;
    };
    return await fn(make);
  } catch { return null; }   // no working model here (e.g. Chromium's echo stub, or blocked in a frame): use the next option
  finally { for (const s of sessions) try { s.destroy(); } catch { /* gone */ } }
}
const parseOrThrow = raw => { const d = JSON.parse(raw); if (!d || typeof d !== "object") throw new Error("bad"); return d; };

async function planWeaving(groups, profileJob, progress) {
  const plans = new Map();
  let profile = null;
  // 1. The small model: in this browser, or Chrome's built-in AI (Gemini Nano)
  const chrome = await withChromeAI(progress, async make => {
    const out = { plans: [], profile: null };
    if (groups.length) {
      const base = await make(WEAVE_NANO, WEAVE_EXAMPLES);
      for (let i = 0; i < groups.length; i++) {
        progress(`Weaving skills into ${groups[i].zone.label} with ${SMALL()} (${i + 1} of ${groups.length})…`);
        const s = await base.clone();
        try { const d = await nanoJSON(s, rolePrompt(groups[i]), PLAN_SCHEMA); if (!Array.isArray(d.edits)) throw new Error("bad"); out.plans.push(d); }
        finally { s.destroy(); }
      }
    }
    if (profileJob) {
      progress(`Working your strengths into your profile with ${SMALL()}…`);
      const p = await make(PROFILE_NANO);
      out.profile = (await nanoJSON(p, profilePrompt(profileJob.text, profileJob.strengths), PROFILE_SCHEMA)).profile;
    }
    return out;
  });
  if (chrome) {
    groups.forEach((g, i) => plans.set(g.zone.id, finishPlan(g, checkPlan(g, chrome.plans[i], `Woven in by ${SMALL()}`))));
    if (profileJob) profile = { text: chrome.profile, via: `Woven in by ${SMALL()}` };
    return { plans, profile };
  }
  // 2. A bigger AI (a key): one call for every job and the profile
  const big = afterSmall();
  if (big && (groups.length || profileJob)) {
    progress(`Weaving your skills in with ${BIG_NAME()}…`);
    try {
      const data = await big.json(`${WEAVE_RULES}

Do this for each job below.${profileJob ? `

Also: ${PROFILE_RULES.replace(/^You /, "you ")}` : ""}

Reply with only JSON: {"jobs": [{"id": "z1", ...}]${profileJob ? `, "profile": "the edited profile paragraph"` : ""}}, where each job object has this shape: ${JSON_SHAPE}

${groups.map(g => `<job id="${g.zone.id}">\n${rolePrompt(g)}\n</job>`).join("\n\n")}${profileJob ? `\n\n<profile>\n${profilePrompt(profileJob.text, profileJob.strengths)}\n</profile>` : ""}`, { cache: false });
      const jobs = Array.isArray(data && data.jobs) ? data.jobs : [];
      for (const g of groups) plans.set(g.zone.id, finishPlan(g, checkPlan(g, jobs.find(j => j && j.id === g.zone.id), "Woven in by " + BIG_NAME())));
      if (profileJob) profile = { text: data && data.profile, via: "Woven in by " + BIG_NAME() };
      return { plans, profile };
    } catch { /* fall through */ }
  }
  // 3. No AI
  for (const g of groups) plans.set(g.zone.id, finishPlan(g, null));
  return { plans, profile: null };
}

async function applyPlacements(save) {
  const outEl = $("updateOut"), applyBtn = $("applyBtn");
  if (!outEl || !place.placements.size) return;
  const { lines: orig, zones, skillsSec, summarySec } = place.parsed;
  if (save) {
    const now = new Date().toISOString();
    for (const [name, p] of place.placements) {
      const z = zones.find(z => z.id === p.zoneId);
      memory.skills[name] = p.zoneId === "__na" ? { zone: "na", updated: now }
        : p.zoneId === "__skills" ? { zone: "skills", updated: now }
        : { zone: z.kind, key: z.key, label: z.label, note: (p.note || "").trim(), updated: now };
    }
    if (applyBtn) applyBtn.disabled = true;
    outEl.innerHTML = `<p class="progress">Saving your answers…</p>`;
    await saveMemory();
    renderMemoryLine();
  }
  const groups = new Map(), direct = [];
  for (const [name, p] of place.placements) {
    if (p.zoneId === "__na") continue;
    const info = place.missing.find(s => s.name === name) || {};
    const s = { name, kind: info.kind || "hard", note: tidy(p.note || ""), adLine: info.adLine || "" };
    if (p.zoneId === "__skills") { direct.push(s); continue; }
    const z = zones.find(z => z.id === p.zoneId);
    if (!z) continue;
    if (!groups.has(z.id)) groups.set(z.id, { zone: z, skills: [] });
    groups.get(z.id).skills.push(s);
  }
  // Soft skills stay in the job you put them in. Only those dropped on the Skills section go to the Profile.
  const profileLines = summarySec ? orig.map((l, i) => ({ l, i })).filter(x => x.i >= summarySec.start && x.i <= summarySec.end && x.l.trim()) : [];
  const profileText = profileLines.map(x => x.l.trim()).join(" ");
  // Everything goes where it was placed: skills dropped on the Skills section stay in the Skills section
  const strengths = [];
  const directSkills = direct;
  let profileJob = profileText && strengths.length ? { text: profileText, strengths } : null;

  const progress = msg => { const el = $("updateOut"); if (el) el.innerHTML = `<p class="progress">${esc(msg)}</p>`; };
  if (applyBtn) applyBtn.disabled = true;
  progress("Updating your resume…");
  const groupList = [...groups.values()].filter(g => g.skills.length);
  let woven;
  try { woven = await planWeaving(groupList, profileJob, progress); }
  finally { const b = $("applyBtn"); if (b) b.disabled = false; }

  const lines = orig.slice();
  const ops = [];
  let seq = 0;
  const changes = [];
  const safeAt = at => { while (at > 0 && (isHeadingLine(lines[at], at) || !lines[at].trim())) at--; return at; };
  const toSkills = directSkills.map(s => ({ name: s.name, kind: s.kind, entry: s.note ? `${inSentence(s.name)} (${s.note})` : inSentence(s.name) }));

  for (const g of groupList) {
    const z = g.zone, plan = woven.plans.get(z.id);
    const ch = { where: z.label, items: [], rejected: plan.rejected };
    // Soft skills the AI didn't weave in: add a short, natural phrase to the bullet in this job that fits best
    const edited = new Map(plan.edits.map(e => [e.i, e]));
    const touched = new Set();
    for (const sk of plan.softLeft) {
      const w = SOFT_WEAVE[sk.name] || { add: `, showing ${softPhrase(sk.name)}`, fit: /./ };
      const pool = z.bullets.map((b, i) => ({ b, i, text: edited.has(i) ? edited.get(i).text : b.text }))
        .filter(x => !touched.has(x.i) && !/^(coursework|scholarship|thesis|project)\s*:/i.test(x.text) && wordCount(x.text) + wordCount(w.add) <= 40);
      // the bullet with the most signs that the skill was involved (talking to people, fixing problems…)
      const hits = x => (x.text.match(new RegExp(w.fit.source, "gi")) || []).length;
      const best = pool.filter(x => hits(x) > 0).sort((a, b) => hits(b) - hits(a))[0];
      // No bullet in this job clearly involves it: don't force it in or move it elsewhere; ask for a note instead
      if (!best) { ch.items.push({ type: "note", after: `${sk.name} wasn't added: no bullet here clearly involves it. Add a few words on how you used it in this job${w.eg ? ` (for example "${w.eg}")` : ""} and update again.` }); continue; }
      const prev = edited.get(best.i);
      edited.set(best.i, { i: best.i, text: best.text.replace(/[.\s]+$/, "") + w.add, skills: [...(prev ? prev.skills : []), sk.name], via: prev ? prev.via : "Added lightly to a bullet in this job" });
      touched.add(best.i);
    }
    for (const e of edited.values()) {
      const b = z.bullets[e.i];
      ops.push({ at: b.idx, replace: b.marker + e.text, seq: seq++ });
      ch.items.push({ type: "edit", before: b.text, after: e.text, via: e.via + ` · included ${e.skills.join(", ")}` });
    }
    for (const a of plan.adds) {
      const at = safeAt(a.after >= 0 && z.bullets[a.after] ? z.bullets[a.after].idx : z.last);
      ops.push({ at, insert: z.marker + a.text, blank: z.blankStyle, seq: seq++ });
      ch.items.push({ type: "add", after: a.text, via: a.via + " · new bullet" });
    }
    for (const t of plan.toSkills) {
      toSkills.push(t);
      if (!/\(/.test(t.entry)) ch.items.push({ type: "note", after: `${t.name} went into your skills section: no bullet here clearly involves it. Add a note to put it in this job instead.` });
    }
    for (const n of plan.toProfile) toSkills.push({ name: n, kind: "soft", entry: inSentence(n) });   // only when there is no Profile section
    if (ch.items.length || ch.rejected.length) changes.push(ch);
  }

  // Profile (soft skills dropped on the Skills section, or ones with no bullet to sit in)
  if (!profileJob && profileText && strengths.length) profileJob = { text: profileText, strengths };
  if (profileJob) {
    let text = stripMarkup(woven.profile && woven.profile.text), via = woven.profile && woven.profile.via, rejected = [];
    const why = text ? guardProfile(profileText, text, profileJob.strengths) : "returned nothing";
    if (why) {
      if (text) rejected.push(why);
      // "a willingness to learn" reads best last
      const list = profileJob.strengths.slice().sort((a, b) => (a === "Willingness to learn") - (b === "Willingness to learn")).map(softPhrase);
      const joined = list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0];
      text = profileText.replace(/\s*$/, "") + (/[.!?]$/.test(profileText.trim()) ? "" : ".") + ` Strengths include ${joined}.`;
      via = "Added as a closing sentence";
    }
    ops.push({ at: profileLines[0].i, replace: text, seq: seq++ });
    for (const x of profileLines.slice(1)) ops.push({ at: x.i, remove: true, seq: seq++ });
    changes.unshift({ where: summarySec.title, items: [{ type: "edit", before: profileText, after: text, via: `${via} · named ${profileJob.strengths.map(inSentence).join(", ")}` }], rejected });
  }

  // Skills section: each skill goes on the line that suits it (software with software, licences with licences…)
  if (toSkills.length) {
    const sec = skillsSec;
    const byLine = new Map(), newLines = new Map();
    const labelled = [];
    let plainList = -1, last = -1;
    if (sec) {
      for (let i = sec.start; i <= sec.end; i++) {
        if (!lines[i].trim()) continue;
        last = i;
        const m = lines[i].match(/^\s*([^,:]{2,40}):\s/);
        if (m) labelled.push({ i, label: m[1] });
        else if (plainList < 0 && (lines[i].match(/,/g) || []).length >= 2) plainList = i;
      }
    }
    for (const t of toSkills) {
      const g = skillGroup(t.name, t.kind);
      const hit = labelled.find(l => GROUP_LABEL[g].test(l.label)) || (g !== "licence" && g !== "soft" ? labelled.find(l => GROUP_LABEL.technical.test(l.label)) : null);
      const at = hit ? hit.i : (!labelled.length && plainList >= 0 && g !== "licence") ? plainList : null;
      if (at !== null) { if (!byLine.has(at)) byLine.set(at, []); byLine.get(at).push(t.entry); }
      else { const key = labelled.length || plainList < 0 ? GROUP_NEW[g] : ""; if (!newLines.has(key)) newLines.set(key, []); newLines.get(key).push(t.entry); }
    }
    const ch = { where: sec ? sec.title : "New Skills section", items: [], rejected: [] };
    for (const [at, entries] of byLine) {
      const newLine = lines[at].replace(/[.;\s]+$/, "") + (lines[at].includes(";") ? "; " : ", ") + entries.join(", ");
      ops.push({ at, replace: newLine, seq: seq++ });
      ch.items.push({ type: "edit", before: lines[at].trim(), after: newLine.trim(), via: "Added to the matching line in your skills section" });
    }
    const extra = [...newLines].map(([label, entries]) => (label ? label + ": " : "") + cap1(entries.join(", ")));
    if (extra.length) {
      if (sec && last >= 0) { ops.push({ at: last, insertMany: extra, seq: seq++ }); }
      else { let end = lines.length - 1; while (end > 0 && !lines[end].trim()) end--; ops.push({ at: end, insertMany: ["", "SKILLS", ...extra], seq: seq++ }); }
      for (const e of extra) ch.items.push({ type: "add", after: e, via: sec ? "New line in your skills section" : "New Skills section at the end" });
    }
    changes.push(ch);
  }

  // Apply bottom-up; inserts after the same line go in reverse so the final order matches
  ops.sort((a, b) => b.at - a.at || b.seq - a.seq);
  for (const op of ops) {
    if (op.remove) lines.splice(op.at, 1);
    else if (op.replace !== undefined) lines[op.at] = op.replace;
    else if (op.insertMany) lines.splice(op.at + 1, 0, ...op.insertMany);
    else lines.splice(op.at + 1, 0, ...(op.blank ? ["", op.insert] : [op.insert]));
  }
  const newText = lines.join("\n");
  const before = lastResult.overall;
  const after = analyse(newText, lastScan.jd, lastScan.title, fileInfo, { ignore: scanIgnore }).overall;
  renderUpdate(newText, before, after, changes);
}

function renderUpdate(newText, before, after, changes) {
  const el = $("updateOut");
  if (!el) return;
  const na = [...place.placements].filter(([, p]) => p.zoneId === "__na").map(([n]) => n);
  // The updated resume and what changed are shown on the next page, Tailor to resume, which opens now.
  // (the text is kept in a hidden box: finalText() reads it, and so does the page after this one)
  place.update = { before, after, changes, na };
  el.innerHTML = `<p class="small">Your answers are saved and your resume is updated. <button class="linkish" type="button" id="toResumeAgain">Open Tailor to resume</button></p><textarea id="newResume" hidden aria-hidden="true"></textarea>`;
  $("newResume").value = newText;
  resumeEdit = null;
  $("toResumeAgain").onclick = () => goTo("sec-download");
  updateFlow();
  goTo("sec-download");
}
