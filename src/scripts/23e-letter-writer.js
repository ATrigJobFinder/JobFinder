/* ===================== Version 23: writing the cover letter sections with AI, reliably ===================== */
// One short job at a time, so a small or fast model (Gemini Flash-Lite, Chrome's built-in AI) gets it right:
//  1. Code picks the few facts each paragraph needs (not the whole profile).
//  2. The AI gets a short prompt, one worked example, and a JSON shape with one field per sentence (s1, s2, …),
//     each field with its own small job. A model writes one sentence far more reliably than a whole paragraph.
//  3. Code checks each sentence and the whole paragraph, and aiJSON asks once more naming the exact field that was wrong.
//     It also puts contractions back in full and keeps the "why this company" gap blank, rather than trusting the model to.
//  4. If a paragraph still isn't usable, the standard (no AI) version is put in its place and the AI's own words are shown under it.

/* --- 1. The facts for one paragraph --- */
const lwClean = t => String(t || "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
const lwBestBullets = (bullets, n) => bullets.map((b, i) => ({ b: lwClean(b), i })).filter(x => x.b)
  .map(x => ({ ...x, s: (/\d/.test(x.b) ? 3 : 0) + (/[%$]/.test(x.b) ? 1 : 0) + (ACTION_START.test(x.b) ? 1 : 0) + (wordCount(x.b) >= 8 ? 1 : 0) }))
  .sort((a, c) => c.s - a.s || a.i - c.i).slice(0, n).sort((a, c) => a.i - c.i).map(x => x.b);
// The finished jobs with bullets, closest to the job first (then most recent)
function lwJobs(p) {
  const want = contentWords([p.target.title, p.target.jobType ? jobLabel(p.target.jobType) : "", ...(COMMON_SKILLS[p.target.jobType] || { hard: [] }).hard].join(" "));
  const score = e => { let n = 0; for (const w of contentWords([e.title, ...e.bullets].join(" "))) if (want.has(w)) n += 2; return n + e.bullets.filter(b => /\d/.test(b)).length; };
  return shown(p.experience).filter(e => (e.title || e.org) && e.bullets.some(b => lwClean(b))).map((e, i) => ({ e, i, s: score(e) })).sort((a, b) => b.s - a.s || a.i - b.i).map(x => x.e);
}
const lwStudy = e => e ? [e.degree, e.inst].filter(Boolean).join(", ") + (e.current ? (e.end ? `, finishing ${showDate(e.end)}` : ", currently studying") : e.end ? `, finished ${showDate(e.end)}` : "") : "";
const lwJobLine = e => `${[e.title, e.org].filter(Boolean).join(" at ")}${rangeOf(e) ? ` (${rangeOf(e)})` : ""}`;
// → { text, empty }  (empty: there's nothing to say about this yet, so the AI isn't asked)
function lwFacts(part) {
  const p = P(), d = BL(), tpl = ltTemplate();
  const role = tpl ? "[the role]" : d.role || p.target.title || "[the role]", company = tpl ? "[the company]" : d.company || "[the company]";
  const stage = (STAGES.find(s => s.key === letterStage()) || {}).label || "";
  const edu = shown(p.education).find(e => e.degree || e.inst), jobs = lwJobs(p), job = jobs[0];
  const L = [`Role: ${role}`, `Company: ${company}`];
  if (p.target.jobType) L.push(`Kind of work: ${jobLabel(p.target.jobType)}`);
  let empty = false;
  if (part === "opening") {
    // who you are: level, study and main skills only. Jobs and their results belong to the Experience paragraph
    if (stage) L.push(`Level: ${lowerFirst(stage)}`);
    if (edu) L.push(`Study: ${lwStudy(edu)}`);
    const skills = [...p.skills.hard, ...p.skills.software].slice(0, 3); if (skills.length) L.push(`Main skills: ${listJoin(skills)}`);
    empty = !edu && !skills.length && !(jobs.length || p.projects.some(x => x.done !== false && x.name));
    } else if (part === "experience") {
    const proj = p.projects.find(x => x.done !== false && x.name), vol = p.volunteering.find(x => x.done !== false && (x.role || x.org));
    if (job) { L.push(`Job: ${lwJobLine(job)}`, ...lwBestBullets(job.bullets, 3).map(b => `- ${b}`)); }
    else if (proj) L.push(`Project: ${lwClean(proj.name)}${proj.org ? ` (${proj.org})` : ""}`, ...(proj.details ? [`- ${lwClean(proj.details).slice(0, 300)}`] : []));
    else if (vol) L.push(`Volunteering: ${[vol.role, vol.org].filter(Boolean).join(" at ")}`, ...(vol.details ? [`- ${lwClean(vol.details).slice(0, 300)}`] : []));
    else empty = true;
  } else if (part === "education") {
    if (edu) { L.push(`Study: ${lwStudy(edu)}`); const sub = pickSubjects(edu, p).slice(0, 3); if (sub.length) L.push(`Subjects: ${listJoin(sub)}`); if (val(edu.project)) L.push(`Project: ${lwClean(val(edu.project))}`); }
    const tools = [...p.skills.software, ...p.skills.hard].slice(0, 4); if (tools.length) L.push(`Tools and skills: ${listJoin(tools)}`);
    if (p.skills.certs.length) L.push(`Certificates: ${listJoin(p.skills.certs.slice(0, 2))}`);
    empty = !edu && !tools.length && !p.skills.certs.length;
  } else if (part === "motivation") {
    const soft = p.skills.soft.slice(0, 3); if (soft.length) L.push(`Strengths: ${listJoin(soft)}`);
    if (val(p.summaryQ.next)) L.push(`Wants next: ${lwClean(val(p.summaryQ.next))}`);
    if (stage) L.push(`Level: ${lowerFirst(stage)}`);
    L.push(`Company details: ${tpl || !d.company ? "(none given)" : "(none given beyond the name)"}`);
  } else {
    if (availabilityText(p)) L.push(`Available: ${lwClean(availabilityText(p))}`);
    const offer = [...p.skills.soft, ...p.skills.hard, ...p.skills.software][0];   // a strength or skill, not a job: jobs stay in Experience
    if (offer) L.push(`One thing to offer: ${offer.length > 140 ? offer.slice(0, 140).replace(/\s+\S*$/, "") : offer}`);
  }
  return { text: L.join("\n"), empty };
}

/* --- 2. What each sentence is for, and one worked example per paragraph --- */
// The rules (clWriteRules, in 14a-cover-craft.js) are the set that scored best when Chrome's AI wrote letters for eight different resumes
const LW_BASE = `You write one paragraph of an Australian cover letter, as JSON with one field per sentence.
Rules:
${clWriteRules("none")}
9. Where the facts say [the company] or [the role], write it exactly as it is.
10. Each field is ONE sentence in the first person. Do exactly the job given for each field.
Reply with JSON only, one string per field.`;
const LW_GAP = "[one specific reason]";
const LW_GAP_RULE = `\nIn s1 the bracket must read exactly ${LW_GAP}: never write anything else inside the brackets.`;
const LW_FIX_NANO = `You fix one paragraph of a cover letter, written as JSON with one sentence per field. You are told which rule it broke.
Change only the field or fields that break the rule. Keep every other field word for word.
Reply with the whole JSON again, and nothing else.`;
const LW_PLAN = {
  opening: {
    fields: ["Name the role and the company, and say what you hold or are studying.", "Say what you are strongest at, using only the study and main skills in the facts.", "Say what draws you to this kind of role, in general terms. No jobs, results or numbers: those go in the next paragraph."],
    example: [`Role: Backend Developer
Company: Tallowood
Level: early career (1 to 5 years)
Kind of work: Software and IT
Study: Bachelor of Computer Science, RMIT University, finished 2023
Main skills: Go, SQL and API design`,
      { s1: "I am applying for the Backend Developer role at Tallowood, with a Bachelor of Computer Science from RMIT University.", s2: "My strongest skills are Go, SQL and API design, and I enjoy turning a slow or tangled system into a clear one.", s3: "Backend work rewards careful, measurable engineering, and that is the kind of role I am looking for." }]
  },
  experience: {
    fields: ["Set the scene: where you worked and what the problem or situation was.", "Say the first thing you personally did about it.", "Say what else you did, or how you did it.", "Give the result, with its number.", "Say why that matters to this employer's work."],
    example: [`Role: Sales Operations Analyst
Company: Northgate
Job: Sales Operations Coordinator at Brightline (2022 to now)
- Moved quarterly forecasts from twelve regional spreadsheets into Salesforce (forecasts were often 20% off)
- Set up a weekly pipeline review with each regional lead
- Built a win-probability model from two years of deal history; forecasts now land within 6% of actual revenue`,
      { s1: "When I joined the sales operations team at Brightline, quarterly forecasts were pulled together by hand from twelve regional spreadsheets and were often 20 per cent off.", s2: "I moved the process into Salesforce so every region reported in one place.", s3: "I also set up a weekly pipeline review with each regional lead and built a win-probability model from two years of deal history.", s4: "Forecasts now land within 6 per cent of actual revenue.", s5: "Accurate numbers like these let a commercial team plan with confidence, which is the support I would like to give at Northgate." }]
  },
  education: {
    fields: ["Name your study and the subjects or project closest to the role.", "Name the tools and certificates you use, and what each lets you do. Study and skills only: no jobs.", "Link that to something this role will need."],
    example: [`Role: Graduate Accountant
Company: Delta Partners
Study: Bachelor of Commerce (Accounting), University of Melbourne, finishing 2026
Subjects: Auditing, Taxation Law and Financial Reporting
Tools and skills: Xero, Excel and MYOB`,
      { s1: "My Bachelor of Commerce (Accounting) at the University of Melbourne, finishing in 2026, has covered Auditing, Taxation Law and Financial Reporting.", s2: "I use Xero, Excel and MYOB, which let me reconcile accounts and build the checks an audit relies on.", s3: "That grounding in accuracy and process is what I expect to draw on during audit season at Delta Partners." }]
  },
  motivation: {
    fields: ["Say why you want to work at this company. If the facts give no company details, write one gap in square brackets for the specific reason.", "Say what kind of work you want to do and why it suits you.", "Tie one of your strengths to what you would do there.", "Say what you would like to do first in the role."],
    example: [`Role: Digital Producer
Company: Fernleaf Health
Strengths: communication and attention to detail
Wants next: to work on patient-facing products
Level: early career (1 to 5 years)
Company details: (none given beyond the name)`,
      { s1: "Fernleaf Health stands out to me because [one specific reason].", s2: "Patient-facing digital work is where I think good design matters most, and it is the work I want to do next.", s3: "My communication and attention to detail would help me turn clinic feedback into clear improvements.", s4: "I would start by learning how your team decides what to build, then contribute from the first project." }]
  },
  closing: {
    fields: ["Say in one sentence what you would contribute.", "Invite them to talk, without giving a phone number, email address or LinkedIn (they are in the letter head).", "Give your availability, if it is in the facts.", "Thank them."],
    example: [`Role: Graduate Accountant
Company: Delta Partners
Available: from February 2027
One thing to offer: accuracy under pressure`,
      { s1: "I would welcome the chance to talk about the graduate program and how my accuracy under pressure could support your audit team.", s2: "Please feel free to suggest a time that suits you, in person or online.", s3: "I am available to start from February 2027.", s4: "Thank you for considering my application." }]
  }
};
const lwKeys = part => LW_PLAN[part].fields.map((_, i) => "s" + (i + 1));
// (the motivation paragraph is told exactly what its gap says, so the AI doesn't fill it with a made-up reason)
const lwUser = (part, facts) => `Facts:\n${facts}\n\nWrite the "${partOf(part).label}" paragraph. Fields:\n${LW_PLAN[part].fields.map((f, i) => `s${i + 1}: ${f}`).join("\n")}${part === "motivation" ? LW_GAP_RULE : ""}`;

/* --- 3. Checking the answer, field by field --- */
function lwSentenceProblem(s) {
  const n = wordCount(s);
  if (!s) return "is empty";
  if (n < 4 || n > 45) return `has ${n} words: write one sentence of 12 to 30 words`;
  if (/\n/.test(s)) return "must be one sentence on one line";
  if (!/[.]["”']?$/.test(s)) return "must end with a full stop";
  if (/—|–|!/.test(s)) return "has a dash or an exclamation mark";
  return "";
}
// Work experience belongs to the Experience paragraph: no other paragraph may name an employer from the profile
function lwScopeProblem(part, text) {
  if (part === "experience") return "";
  const t = text.toLowerCase();
  for (const e of P().experience) {
    const org = lwClean(e.org);
    if (org.length >= 4 && t.includes(org.toLowerCase())) return `it names “${org}”, a job from your profile. Jobs belong in the Experience paragraph only: leave it out here`;
  }
  return "";
}
function lwCheck(part, d) {
  const keys = lwKeys(part), min = partMin(part, letterRange());
  // a missing full stop is put back rather than sending the model round again
  // (contractions are put back in full: the model writes "I'm" even when told not to)
  const ss = keys.map(k => { const s = lwClean(clNoContractions(stripMarkup(String(d && d[k] != null ? d[k] : "")))); return s ? s + "." : ""; });
  // The AI knows nothing about the company, so the one gap in the first sentence stays a blank to fill in, never a made-up reason.
  // ([the company] and [the role] in a template letter are left alone)
  if (part === "motivation" && ss[0]) { let seen = false; ss[0] = ss[0].replace(/\[[^\]\n]*\]/g, m => /^\[\s*the (company|role)\s*\]$/i.test(m) || seen ? m : (seen = true, LW_GAP)); }
  for (let i = 0; i < keys.length; i++) { const why = lwSentenceProblem(ss[i]); if (why) return { ok: false, why: `field ${keys[i]} ${why}` }; }
  const text = ss.join(" "), hp = hardPhrase(text);
  const claim = clCompanyClaim(text, ltTemplate() ? "" : BL().company);
  if (claim) return { ok: false, why: `it says "${claim}" about the company, but you know nothing about it except its name: take out anything about its reputation, values or work` };
  if (hp) return { ok: false, why: `it uses "${hp}", which recruiters skip: say it another way` };
  const iStarts = ss.filter(s => /^I\b/.test(s)).length;
  if (iStarts > 2) return { ok: false, why: `${iStarts} sentences begin with "I": at most two may` };
  const floor = Math.round(min * 0.75);
  if (wordCount(text) < floor) return { ok: false, why: `it has ${wordCount(text)} words and needs at least ${floor}: add detail from the facts to the shorter sentences` };
  const ct = contactIn(text, part); if (ct) return { ok: false, why: contactWhy(ct, part) };
  const pr = proseOk(text); if (pr) return { ok: false, why: pr };
  const sc = lwScopeProblem(part, text); if (sc) return { ok: false, why: sc };
  return { ok: true, value: text };
}

/* --- 4. Writing one paragraph --- */
const lwSleep = ms => new Promise(r => setTimeout(r, ms));
// → { text, res }  text is "" when the AI couldn't give a usable paragraph (res says why); text is null when there was nothing to write from
async function lwWrite(i, { progress = () => {} } = {}) {
  const part = BL().parts[i].part, plan = LW_PLAN[part], f = lwFacts(part);
  if (f.empty) return { text: null, res: null };
  const T = partTarget(part, letterRange());   // the words this paragraph gets so the whole letter fills the page
  const rules = `${LW_BASE}\nThis paragraph is about ${T} words in all.${ltTemplate() ? "\nThis letter is a template for any job: the company is [the company]. Never name a company, employer, product or person." : ""}`;
  const schema = { type: "object", properties: Object.fromEntries(lwKeys(part).map(k => [k, { type: "string" }])), required: lwKeys(part) };
  const expect = Math.round(T * 1.3 * 7) + 40 * lwKeys(part).length;   // the sentences in characters, plus the field names
  const run = () => aiJSON({
    expect, nano: rules, full: `${rules}\n\n${CL_CRAFT_SHORT}`, examples: [[lwUser(part, plan.example[0]), plan.example[1]]],
    prompt: lwUser(part, f.text), label: `Writing ${partOf(part).label.toLowerCase()}`, progress, schema,
    check: d => lwCheck(part, d)
  });
  let res = await run();
  // a free key can be asked too fast: wait a few seconds and try once more
  if (!res.data && res.error && res.error.code === "rate_limited") { progress("The AI asked us to slow down; trying again in a few seconds…"); await lwSleep(5000); res = await run(); }
  // instead of giving up, show the AI the rule it broke and ask it to change just that part, until it passes (three tries)
  if (!res.data && res.raw && typeof res.raw === "object" && !res.error) {
    let raw = res.raw, why = res.rawWhy || "it broke a rule", fixed = null;
    for (let k = 1; k <= 3 && !fixed; k++) {
      progress(`That didn't pass (${why}). Asking the AI to fix just that part (try ${k} of 3)…`);
      const fx = await aiJSON({ nano: LW_FIX_NANO, full: `${LW_FIX_NANO}\n\n${CL_CRAFT_SHORT}`, label: "Fixing", progress, noRetry: true, expect, schema,
        prompt: `Your paragraph, one sentence per field:\n${JSON.stringify(raw)}\n\nIt broke this rule: ${why}.\nChange only what breaks the rule. Keep every other field exactly as it is. Reply with the whole JSON again.`,
        check: d => lwCheck(part, d) });
      if (fx.data) fixed = fx; else if (fx.raw && typeof fx.raw === "object") { raw = fx.raw; why = fx.rawWhy || why; } else break;
    }
    if (fixed) res = { ...fixed, rejected: true };
  }
  return { text: res.data || "", res };
}
// Put a paragraph in the letter and the box
function lwApply(i, text) {
  const p = BL().parts[i]; p.text = text;
  const el = $("ltp-" + i); if (el) el.value = text;
  lwMarkMadeUp(i);
  baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
}
let lwBusy = false;
// What the AI is doing, in the paragraph's own box, with the moving bar the resume builder uses
const lwProgress = i => m => { const b = $("lts-" + i); if (b) { b.dataset.menu = ""; b.innerHTML = `<p class="progress">${esc(m)}</p>`; } };
const lwProgressEnd = i => { const b = $("lts-" + i); if (b && b.querySelector(".progress") && !b._alts) b.innerHTML = ""; };
// One paragraph, from its Write with AI button
async function lwWriteOne(i, btn) {
  if (lwBusy) return;
  const note = $("ltx-" + i), acts = $("lta-" + i);
  if (!hasProfile(P())) { if (note) note.textContent = "Add your details in the resume builder first, so there's something to write from."; return; }
  lwBusy = true; if (acts) acts.dataset.busy = "1"; if (btn) btn.disabled = true;
  try {
    const r = await lwWrite(i, { progress: lwProgress(i) });
    lwProgressEnd(i);
    if (acts) delete acts.dataset.busy;
    if (r.text) { lwApply(i, r.text); const n2 = $("ltx-" + i); if (n2) n2.textContent = `Written by ${viaWords(r.res.via)} from your profile. Check every detail is true and sounds like you.`; }
    else if (r.text === null) { if (note) note.textContent = "There's nothing in your profile for this paragraph yet. Add it in the resume builder, or write it yourself."; }
    else if (note) note.innerHTML = aiMissHtml(aiMissWords(r.res)) + " Write it yourself, or start from your profile." + aiRawHtml(r.res);
  } finally { lwBusy = false; if (acts) delete acts.dataset.busy; if (btn) btn.disabled = false; }
}
// Start from my profile: the AI writes each paragraph in turn; any it can't write is filled in from the standard version
async function lwStart(btn) {
  if (lwBusy) return;
  const st = $("ltStatus"), fallback = letterFromProfile(P());
  lwBusy = true; btn.disabled = true; st.classList.add("busy");
  const say = t => { st.textContent = t; };
  ltShowStep(1); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  if (!ltTemplate() && !BL().role && P().target.title) BL().role = P().target.title;
  BL().parts = COVER_PARTS.map(p => ({ part: p.key, text: "" }));
  baseLetter.save(true); renderLetterPage();
  const by = [], filled = [], misses = [], gen = aiRun.gen;
  let noAi = false, errorsInARow = 0, stopped = false;
  try {
    for (let i = 0; i < COVER_PARTS.length; i++) {
      const label = COVER_PARTS[i].label, note = () => $("ltx-" + i);
      if (aiRun.gen !== gen) stopped = true;
      say(`Writing your cover letter: ${label} (${i + 1} of ${COVER_PARTS.length})…`);
      let r = { text: null, res: null };
      if (!noAi && !stopped && errorsInARow < 2) { const pr = lwProgress(i); r = await lwWrite(i, { progress: m => { say(`${label} (${i + 1} of ${COVER_PARTS.length}): ${m}`); pr(m); } }); lwProgressEnd(i); }
      if (aiRun.gen !== gen) stopped = true;
      if (r.res && !r.res.tried.length && !r.res.cancelled) noAi = true;
      errorsInARow = r.res && r.res.error && !r.res.data && !r.res.cancelled ? errorsInARow + 1 : 0;
      if (r.text) { lwApply(i, r.text); by.push(viaWords(r.res.via)); filled.push(i); const n = note(); if (n) n.textContent = `Written by ${viaWords(r.res.via)}. Check every detail is true.`; }
      else {
        // nothing usable from the AI: the standard version, so the letter is never left with a hole in it
        lwApply(i, fallback[i].text);
        const n = note();
        if (n && stopped) n.textContent = "Stopped. The standard version (written without AI) is here instead.";
        else if (n && r.res) n.innerHTML = aiMissHtml(aiMissWords(r.res)) + " The standard version is in the box instead; here is what the AI wrote:" + aiRawHtml(r.res);
        else if (n) n.textContent = noAi ? "Written without AI (none is connected)." : "Written from your profile without AI.";
        if (r.res && !stopped) misses.push(label);
      }
    }
  } finally { lwBusy = false; btn.disabled = false; st.classList.remove("busy"); }
  const who = by.length ? by[0] : "";
  st.textContent = stopped ? `Stopped. ${filled.length ? `${filled.length} paragraph${filled.length === 1 ? " was" : "s were"} written by the AI` : "Nothing was written by the AI"}; the rest use the standard version from your profile. Press Write with AI on any paragraph to try again.`
    : noAi ? "No AI is connected, so this was written from your profile without one. Choose an AI (top bar) and press Write with AI on any paragraph. Fill in anything in [brackets]."
    : misses.length ? `${filled.length} of ${COVER_PARTS.length} paragraphs written by ${who}. ${listJoin(misses)} used the standard version because the AI's answer wasn't usable: its words are shown under ${misses.length === 1 ? "it" : "each"}. Check every detail is true.`
    : filled.length === COVER_PARTS.length ? `All ${COVER_PARTS.length} paragraphs written by ${who}. Check every detail is true, fill in anything in [brackets], and make each paragraph sound like you.`
    : "Written from your profile. Fill in anything in [brackets], and make each paragraph sound like you.";
}

/* --- How many words fit the page, split between the paragraphs --- */
// Measured from the preview: how tall a word is at this design, spacing and margins, and how much of the page is left once the heading,
// address block and sign-off are in. The paragraphs get shares of it in rough proportion (see PART_SHARE).
let ltFitW = 0;
function ltFitRange() { return ltFitW ? [Math.round(ltFitW * 0.88 / 10) * 10, ltFitW] : null; }
function ltMeasureFit(root = "#ltPaper") {
  const ps = [...document.querySelectorAll(root + " .lt-p")], sheet = document.querySelector(root + " .lt-sheet");
  if (ps.length < 2 || !sheet) return false;
  const last = ps[ps.length - 1], top = ps[0].offsetTop, bottom = last.offsetTop + last.offsetHeight, bodyH = bottom - top;
  const words = ps.reduce((a, el) => a + wordCount(el.textContent), 0);
  if (bodyH < 100 || words < 40) return false;
  const name = sheet.querySelector(".lt-signname"), endY = name ? name.offsetTop + name.offsetHeight : bottom;
  const after = (endY - bottom) + (parseFloat(getComputedStyle(sheet).paddingBottom) || 0);
  const avail = 1123 - top - after;   // an A4 page is 1123 px tall in the preview
  const w = Math.floor(words * avail / bodyH * 0.97 / 10) * 10;
  if (!(w >= 150 && w <= 1200) || w === ltFitW) return false;
  ltFitW = w;
  return true;
}
function ltTargetText() {
  const el = $("ltTarget"), r = letterRange();
  if (el) el.textContent = ltFitW ? `About ${ltFitW} words fit on one page at your spacing and margins. Aim for ${r[0]} to ${r[1]} words in all, shared out between the paragraphs.` : `Aim for ${r[0]} to ${r[1]} words in all.`;
}

/* --- Made-up details: red in the paragraph; hover to keep (saved to your profile) or discard --- */
const lwEsc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Numbers and skills in AI-written text that aren't in your profile (or already approved)
function madeUpIn(text) {
  const p = P(), d = BL(), src = [profileToText(p), d.role, d.company, d.recipient, ...(p.prefs.okFacts || [])].join("\n");
  const clean = String(text).replace(TOKEN_RE, " "), okNums = new Set(numsOf(src)), have = skillSet(src), out = new Set();
  TOKEN_RE.lastIndex = 0;
  for (const n of numsOf(clean)) if (!okNums.has(n) && !/^(19|20)\d{2}$/.test(n)) out.add(n);
  const nt = norm(clean);
  for (const [name, info] of findSkills(nt)) {
    if (info.skill.kind !== "hard" || have.has(name)) continue;
    // the words as they're written in the letter
    info.skill.re.lastIndex = 0; const m = info.skill.re.exec(nt); let surf = "";
    if (m) { const f = clean.match(new RegExp(lwEsc(m[0]), "i")); if (f) surf = f[0]; }
    if (!surf && clean.toLowerCase().includes(name.toLowerCase())) surf = name;
    if (surf) out.add(surf);
  }
  return [...out];
}
function lwMarkMadeUp(i) {
  const p = BL().parts[i];
  if (!p) return;
  p.madeUp = madeUpIn(p.text);
  lwBack(i, p.text);
}
// The text behind the box: gaps in yellow, made-up details in red
function lwBack(i, text) {
  const back = $("ltb-" + i);
  if (!back) return;
  const p = BL().parts[i] || {}, terms = (p.madeUp || []).filter(t => t && String(text).includes(t)).filter((t, k, a) => !a.some(o => o !== t && o.includes(t)));
  const segs = String(text).split(new RegExp("(" + GAP_SRC + ")"));   // gaps sit at the odd places
  back.innerHTML = segs.map((s, k) => {
    if (k % 2) return gapHtml(s);
    let h = esc(s);
    for (const t of terms) { const e = esc(t); h = h.split(e).join(`<mark class="made-up" data-term="${e}">${e}</mark>`); }
    return h;
  }).join("") + "\n";
}
// Keep it: it's saved to your profile, so it isn't flagged again
function lwKeep(i, term) {
  const p = P();
  if (/^[0-9]/.test(term)) { p.prefs.okFacts = [...new Set([...(p.prefs.okFacts || []), term])]; }
  else {
    const hit = findSkills(norm(term)).keys().next().value, kind = ((SKILLS.find(s => s.name === hit) || {}).kind) || "hard", list = kind === "soft" ? p.skills.soft : p.skills.hard;
    if (!list.some(x => norm(x) === norm(term))) list.push(term);
  }
  lwDropTerm(i, term);
  touchProfile("letter");
}
// Discard it: a figure becomes a gap to fill in; a skill is taken out, and the list around it tidied
function lwDiscard(i, term) {
  const bp = BL().parts[i], e = lwEsc(term);
  let t = bp.text;
  if (/^[0-9]/.test(term)) t = t.replace(new RegExp("(?<![\\w.])" + e + "(?![\\w])"), "[a figure]");
  else {
    const before = t;
    t = t.replace(new RegExp("(,\\s*)?\\band\\s+" + e + "\\b", "i"), "");
    if (t === before) t = t.replace(new RegExp("\\b" + e + "\\s*(,|and)\\s*", "i"), "");
    if (t === before) t = t.replace(new RegExp(",\\s*" + e + "\\b", "i"), "");
    if (t === before) t = t.replace(new RegExp("\\b" + e + "\\b", "i"), "");
    t = t.replace(/\s+([,.])/g, "$1").replace(/\s{2,}/g, " ").trim();
  }
  bp.text = t;
  const el = $("ltp-" + i); if (el) el.value = t;
  lwDropTerm(i, term);
  baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
}
function lwDropTerm(i, term) {
  const bp = BL().parts[i]; bp.madeUp = (bp.madeUp || []).filter(x => x !== term);
  lwBack(i, bp.text); baseLetter.save(true); renderLetterPreview();
}
onInit(() => {
  const parts = $("ltParts");
  if (!parts) return;
  let pop = null, hideT = 0, cur = null;
  const hide = () => { if (pop) pop.hidden = true; cur = null; };
  const hideSoon = () => { clearTimeout(hideT); hideT = setTimeout(hide, 350); };
  const make = () => {
    if (pop) return pop;
    pop = document.createElement("div"); pop.className = "made-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "A detail that isn't in your profile"); pop.hidden = true;
    pop.addEventListener("mouseenter", () => clearTimeout(hideT)); pop.addEventListener("mouseleave", hideSoon);
    pop.addEventListener("click", e => {
      const b = e.target.closest("[data-mu]"); if (!b || !cur) return;
      const { i, term } = cur; hide();
      if (b.dataset.mu === "keep") lwKeep(i, term); else lwDiscard(i, term);
    });
    document.body.appendChild(pop); return pop;
  };
  const show = (i, term, rect) => {
    clearTimeout(hideT);
    if (cur && cur.i === i && cur.term === term && pop && !pop.hidden) return;
    cur = { i, term };
    const num = /^[0-9]/.test(term), el = make();
    el.innerHTML = `<p><b>“${esc(term)}”</b> ${num ? "is a figure that isn't in your profile." : "is a skill that isn't in your profile."}</p><p class="small">${num ? "Keep it if it's true (it won't be flagged again). Discard leaves a gap to fill in." : "Keep it if you have it: it's added to your skills and won't be flagged again. Discard takes it out of the sentence."}</p><div class="b-actions"><button class="btn primary" type="button" data-mu="keep">Keep and save</button><button class="btn" type="button" data-mu="discard">Discard</button></div>`;
    el.hidden = false;
    const w = el.offsetWidth, vw = document.documentElement.clientWidth;
    el.style.left = Math.max(8, Math.min(rect.left, vw - w - 8)) + "px";
    el.style.top = Math.min(rect.bottom + 6, window.innerHeight - el.offsetHeight - 8) + "px";
  };
  // the red words sit behind the box, so find the one under the pointer by its position
  parts.addEventListener("mousemove", e => {
    const ta = e.target.closest && e.target.closest("textarea[data-ltp]"), back = ta && $("ltb-" + ta.dataset.ltp);
    if (!back) return;
    for (const m of back.querySelectorAll("mark.made-up")) for (const r of m.getClientRects()) {
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { show(+ta.dataset.ltp, m.dataset.term, r); return; }
    }
    if (pop && !pop.hidden) hideSoon();
  });
  parts.addEventListener("mouseleave", () => { if (pop && !pop.hidden) hideSoon(); });
});
