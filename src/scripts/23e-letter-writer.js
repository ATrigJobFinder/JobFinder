/* ===================== Version 23: writing the cover letter sections with AI, reliably ===================== */
// One short job at a time, so a small or fast model (Gemini Flash-Lite, Chrome's built-in AI) gets it right:
//  1. Code picks the few facts each paragraph needs (not the whole profile).
//  2. The AI gets a short prompt, one worked example, and a JSON shape with one field per sentence (s1, s2, …),
//     each field with its own small job. A model writes one sentence far more reliably than a whole paragraph.
//  3. Code checks each sentence and the whole paragraph, and aiJSON asks once more naming the exact field that was wrong.
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
    if (stage) L.push(`Level: ${lowerFirst(stage)}`);
    if (edu) L.push(`Study: ${lwStudy(edu)}`);
    const proj = p.projects.find(x => x.done !== false && x.name);
    if (job) { const b = lwBestBullets(job.bullets, 1)[0] || ""; L.push(`Best result: As ${/^[aeiou]/i.test(job.title) ? "an" : "a"} ${job.title || "team member"}${job.org ? ` at ${job.org}` : ""}, ${ACTION_START.test(b) ? lowerFirst(b) : b}`); }
    else if (proj) L.push(`Best result: ${lwClean(proj.name)}${proj.details ? ": " + lwClean(proj.details).slice(0, 200) : ""}`);
    empty = !edu && !job && !proj;
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
    const other = jobs[1];   // a different job from the Experience paragraph's, so the two paragraphs prove different things
    if (other) L.push(`Other job: ${lwJobLine(other)}`, ...lwBestBullets(other.bullets, 1).map(b => `- ${b}`));
    empty = !edu && !tools.length && !p.skills.certs.length;
  } else if (part === "motivation") {
    const soft = p.skills.soft.slice(0, 3); if (soft.length) L.push(`Strengths: ${listJoin(soft)}`);
    if (val(p.summaryQ.next)) L.push(`Wants next: ${lwClean(val(p.summaryQ.next))}`);
    if (stage) L.push(`Level: ${lowerFirst(stage)}`);
    L.push(`Company details: ${tpl || !d.company ? "(none given)" : "(none given beyond the name)"}`);
  } else {
    if (availabilityText(p)) L.push(`Available: ${lwClean(availabilityText(p))}`);
    const offer = job ? lwBestBullets(job.bullets, 1)[0] : [...p.skills.hard, ...p.skills.software][0];
    if (offer) L.push(`One thing to offer: ${offer.length > 140 ? offer.slice(0, 140).replace(/\s+\S*$/, "") : offer}`);
  }
  return { text: L.join("\n"), empty };
}

/* --- 2. What each sentence is for, and one worked example per paragraph --- */
const LW_BASE = `You write one paragraph of an Australian cover letter, as JSON with one field per sentence.
Rules:
1. Use only the facts given. Never invent employers, numbers, tools or dates.
2. Each field is ONE sentence of 12 to 30 words, in the first person, in plain warm English.
3. Do exactly the job given for each field.
4. If a fact you need is missing, write a short gap in square brackets, such as [one specific reason].
5. No dashes, no exclamation marks, no clichés (passionate, team player, results-driven, perfect fit).
6. At most two sentences begin with "I".
Reply with JSON only.`;
const LW_PLAN = {
  opening: {
    fields: ["Name the role and the company, and say what you hold or are studying.", "Give your strongest result, with its number, from the facts.", "Link that result to what this kind of role needs."],
    example: [`Role: Backend Developer
Company: Tallowood
Level: early career (1 to 5 years)
Kind of work: Software and IT
Study: Bachelor of Computer Science, RMIT University, finished 2023
Best result: As a Software Developer at Parcelpoint, rewrote the slowest endpoint of the returns API in Go, cutting average response time from 1.8 seconds to 240 milliseconds across about 9,000 daily requests`,
      { s1: "I am applying for the Backend Developer role at Tallowood, with a Bachelor of Computer Science from RMIT University and hands-on experience building APIs.", s2: "As a Software Developer at Parcelpoint, I rewrote the slowest endpoint of the returns API in Go and cut average response time from 1.8 seconds to 240 milliseconds across about 9,000 daily requests.", s3: "Measurable performance work like this is what a backend role depends on, and it is the part of my work I enjoy most." }]
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
    fields: ["Name your study and the subjects or project closest to the role.", "Name the tools you use, and one example of using them or of how you work.", "Link that to something this role will need."],
    example: [`Role: Graduate Accountant
Company: Delta Partners
Study: Bachelor of Commerce (Accounting), University of Melbourne, finishing 2026
Subjects: Auditing, Taxation Law and Financial Reporting
Tools and skills: Xero, Excel and MYOB
Other job: Barista at Cafe Nori (2023 to now)
- Trained six new staff and was trusted to close and cash up alone`,
      { s1: "My Bachelor of Commerce (Accounting) at the University of Melbourne, finishing in 2026, has covered Auditing, Taxation Law and Financial Reporting.", s2: "I use Xero, Excel and MYOB, and alongside my degree I have worked at Cafe Nori since 2023, where I trained six new staff and was trusted to close and cash up on my own.", s3: "Staying accurate when things get busy is a habit I expect to rely on during audit season at Delta Partners." }]
  },
  motivation: {
    fields: ["Say why you want to work at this company. If the facts give no company details, write one gap in square brackets for the specific reason.", "Say what kind of work you want to do and why it suits you.", "Tie one of your strengths to what you would do there.", "Say what you would like to do first in the role."],
    example: [`Role: Digital Producer
Company: Fernleaf Health
Strengths: communication and attention to detail
Wants next: to work on patient-facing products
Level: early career (1 to 5 years)
Company details: (none given beyond the name)`,
      { s1: "Fernleaf Health stands out to me because [one specific thing about their products or patients that you admire].", s2: "Patient-facing digital work is where I think good design matters most, and it is the work I want to do next.", s3: "My communication and attention to detail would help me turn clinic feedback into clear improvements.", s4: "I would start by learning how your team decides what to build, then contribute from the first project." }]
  },
  closing: {
    fields: ["Say in one sentence what you would contribute.", "Invite them to talk.", "Give your availability, if it is in the facts.", "Thank them."],
    example: [`Role: Graduate Accountant
Company: Delta Partners
Available: from February 2027
One thing to offer: accuracy under pressure`,
      { s1: "I would welcome the chance to talk about the graduate program and how my accuracy under pressure could support your audit team.", s2: "Please feel free to suggest a time that suits you, in person or online.", s3: "I am available to start from February 2027.", s4: "Thank you for considering my application." }]
  }
};
const lwKeys = part => LW_PLAN[part].fields.map((_, i) => "s" + (i + 1));
const lwUser = (part, facts) => `Facts:\n${facts}\n\nWrite the "${partOf(part).label}" paragraph. Fields:\n${LW_PLAN[part].fields.map((f, i) => `s${i + 1}: ${f}`).join("\n")}`;

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
function lwCheck(part, d) {
  const keys = lwKeys(part), min = partMin(part, letterRange());
  // a missing full stop is put back rather than sending the model round again
  const ss = keys.map(k => { const s = lwClean(stripMarkup(String(d && d[k] != null ? d[k] : ""))); return s ? s + "." : ""; });
  for (let i = 0; i < keys.length; i++) { const why = lwSentenceProblem(ss[i]); if (why) return { ok: false, why: `field ${keys[i]} ${why}` }; }
  const text = ss.join(" "), hp = hardPhrase(text);
  if (hp) return { ok: false, why: `it uses "${hp}", which recruiters skip: say it another way` };
  const iStarts = ss.filter(s => /^I\b/.test(s)).length;
  if (iStarts > 2) return { ok: false, why: `${iStarts} sentences begin with "I": at most two may` };
  const floor = Math.round(min * 0.75);
  if (wordCount(text) < floor) return { ok: false, why: `it has ${wordCount(text)} words and needs at least ${floor}: add detail from the facts to the shorter sentences` };
  const pr = proseOk(text); if (pr) return { ok: false, why: pr };
  return { ok: true, value: text };
}

/* --- 4. Writing one paragraph --- */
const lwSleep = ms => new Promise(r => setTimeout(r, ms));
// → { text, res }  text is "" when the AI couldn't give a usable paragraph (res says why); text is null when there was nothing to write from
async function lwWrite(i, { progress = () => {} } = {}) {
  const part = BL().parts[i].part, plan = LW_PLAN[part], f = lwFacts(part);
  if (f.empty) return { text: null, res: null };
  const min = partMin(part, letterRange());
  const rules = `${LW_BASE}\nThis paragraph is about ${min} to ${Math.round(min * 1.4)} words in all.`;
  const run = () => aiJSON({
    expect: Math.round(min * 1.4 * 7) + 40 * lwKeys(part).length,   // the sentences in characters, plus the field names
    nano: rules, full: `${rules}\n\n${CL_CRAFT_SHORT}`, examples: [[lwUser(part, plan.example[0]), plan.example[1]]],
    prompt: lwUser(part, f.text), label: `Writing ${partOf(part).label.toLowerCase()}`, progress,
    schema: { type: "object", properties: Object.fromEntries(lwKeys(part).map(k => [k, { type: "string" }])), required: lwKeys(part) },
    check: d => lwCheck(part, d)
  });
  let res = await run();
  // a free key can be asked too fast: wait a few seconds and try once more
  if (!res.data && res.error && res.error.code === "rate_limited") { progress("The AI asked us to slow down; trying again in a few seconds…"); await lwSleep(5000); res = await run(); }
  return { text: res.data || "", res };
}
// Put a paragraph in the letter and the box
function lwApply(i, text) {
  const p = BL().parts[i]; p.text = text;
  const el = $("ltp-" + i); if (el) el.value = text;
  baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
}
let lwBusy = false;
// One paragraph, from its Write with AI button
async function lwWriteOne(i, btn) {
  if (lwBusy) return;
  const note = $("ltx-" + i), acts = $("lta-" + i);
  if (!hasProfile(P())) { if (note) note.textContent = "Add your details in the resume builder first, so there's something to write from."; return; }
  lwBusy = true; if (acts) acts.dataset.busy = "1"; if (btn) btn.disabled = true;
  try {
    const r = await lwWrite(i, { progress: m => { if (note) note.textContent = m; } });
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
  const say = t => { st.innerHTML = `<span class="lt-spin" aria-hidden="true"></span> ${esc(t)}`; };
  ltShowStep(1); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  if (!ltTemplate() && !BL().role && P().target.title) BL().role = P().target.title;
  BL().parts = COVER_PARTS.map(p => ({ part: p.key, text: "" }));
  baseLetter.save(true); renderLetterPage();
  const by = [], filled = [], misses = [];
  let noAi = false, errorsInARow = 0;
  try {
    for (let i = 0; i < COVER_PARTS.length; i++) {
      const label = COVER_PARTS[i].label, note = () => $("ltx-" + i);
      say(`Writing your cover letter: ${label} (${i + 1} of ${COVER_PARTS.length})…`);
      let r = { text: null, res: null };
      if (!noAi && errorsInARow < 2) r = await lwWrite(i, { progress: m => say(`${label} (${i + 1} of ${COVER_PARTS.length}): ${m}`) });
      if (r.res && !r.res.tried.length) noAi = true;
      errorsInARow = r.res && r.res.error && !r.res.data ? errorsInARow + 1 : 0;
      if (r.text) { lwApply(i, r.text); by.push(viaWords(r.res.via)); filled.push(i); const n = note(); if (n) n.textContent = `Written by ${viaWords(r.res.via)}. Check every detail is true.`; }
      else {
        // nothing usable from the AI: the standard version, so the letter is never left with a hole in it
        lwApply(i, fallback[i].text);
        const n = note();
        if (n && r.res) n.innerHTML = aiMissHtml(aiMissWords(r.res)) + " The standard version is in the box instead; here is what the AI wrote:" + aiRawHtml(r.res);
        else if (n) n.textContent = noAi ? "Written without AI (none is connected)." : "Written from your profile without AI.";
        if (r.res) misses.push(label);
      }
    }
  } finally { lwBusy = false; btn.disabled = false; st.classList.remove("busy"); }
  const who = by.length ? by[0] : "";
  st.textContent = noAi ? "No AI is connected, so this was written from your profile without one. Connect an AI (top bar) and press Write with AI on any paragraph. Fill in anything in [brackets]."
    : misses.length ? `${filled.length} of ${COVER_PARTS.length} paragraphs written by ${who}. ${listJoin(misses)} used the standard version because the AI's answer wasn't usable: its words are shown under ${misses.length === 1 ? "it" : "each"}. Check every detail is true.`
    : filled.length === COVER_PARTS.length ? `All ${COVER_PARTS.length} paragraphs written by ${who}. Check every detail is true, fill in anything in [brackets], and make each paragraph sound like you.`
    : "Written from your profile. Fill in anything in [brackets], and make each paragraph sound like you.";
}
