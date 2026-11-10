/* ===================== Cover letter ===================== */
// A proven five-part structure: each paragraph has one job to do
const COVER_PARTS = [
  { key: "opening", label: "Opening", purpose: "Names the job and the employer, then gives your strongest relevant result with its number. It's the part most hiring managers read." },
  { key: "experience", label: "Experience", purpose: "Proof of their top requirement as one short story: what you did, the result with its number, and why it matters to them." },
  { key: "education", label: "Education and skills", purpose: "About 100 words. Your most relevant degree, the subjects or project closest to the job, and the tools you use, as proof of their next requirement." },
  { key: "motivation", label: "Why this company", purpose: "One specific reason you want this employer, in your own words, tied to something true about you. AI can't make this up for you." },
  { key: "closing", label: "Close", purpose: "One line on what you'd contribute, an invitation to talk, your availability and thanks." }
];
const partOf = k => COVER_PARTS.find(p => p.key === k) || { key: k, label: "Paragraph", purpose: "" };
// How long a letter should be: 330 to 390 words in five paragraphs, one page (an ad's word limit, or a short letter the person chooses, is smaller).
// (the global rules: every letter is 330 to 390 words, whatever the stage)
const LETTER_WORDS = { student: [330, 390], early: [330, 390], returning: [330, 390], change: [330, 390], experienced: [330, 390] };
// each paragraph's words come from the budgets in 14b (opening 55 to 70, work experience 95 to 110, education and skills 75 to 90, why this company 65 to 85, the close 35 to 50)
// and are scaled when the letter's range is smaller or larger than the standard one
const PART_KIND = { opening: "opening", experience: "experience", education: "education", motivation: "why", closing: "close" };
function letterStage(text) {
  if (hasProfile(P())) return stageOf(P());
  return /expected|currently (studying|completing)|penultimate|final[- ]year/i.test(text || "") ? "student" : "early";
}
// length: "short" or "standard" (the cover letter rules in 14b); with none given, the Create or edit cover letter page's own choice
const letterRange = (text, length, limit) => {
  const len = length || (typeof ltLength === "function" ? ltLength() : "standard");
  let r = len === "short" ? LR.LENGTH.short : (LETTER_WORDS[letterStage(text)] || LETTER_WORDS.student);
  // an ad that sets a word limit keeps the whole letter inside it (the letter head and sign-off take about 40 words)
  const lim = limit != null ? limit : length ? 0 : (typeof ltWordLimit === "function" ? ltWordLimit() : 0);
  if (lim) { const hi = Math.max(90, Math.min(r[1], lim - 40)); return [Math.round(hi * 0.85 / 10) * 10, hi]; }
  // the words that fit one page at the chosen spacing and margins (measured from the preview), when known
  const fit = typeof ltFitRange === "function" ? ltFitRange() : null;
  // (never more than the advice allows, even when more would fit on the page)
  if (fit) { const hi = Math.min(fit[1], r[1]); return [Math.min(fit[0], Math.round(hi * 0.88 / 10) * 10), hi]; }
  return r;
};
// The fewest words each paragraph should have, so none of them is thin
const partBudget = (key, range) => { const bud = (LR.BUDGET.standard[PART_KIND[key]] || [20, 50]), k = Math.min(1.15, Math.max(0.4, (range[1] || 390) / 390)); return [bud[0] * k, bud[1] * k]; };
const partMin = (key, range) => Math.max(10, Math.round(partBudget(key, range)[0] * 0.8 / 5) * 5);
// about how many words this paragraph should have: the middle of its budget
const partTarget = (key, range) => { const b = partBudget(key, range); return Math.round((b[0] + b[1]) / 2 / 5) * 5; };
const COVER_CLICHES = ["to whom it may concern", "i am writing to express my interest", "i am writing to apply", "team player", "hard-working", "hardworking", "hard working", "passionate", "perfect fit", "great fit", "ideal candidate", "think outside the box", "go-getter", "results-driven", "dynamic", "synergy", "i believe i would be", "dear sir/madam", "dear sir or madam"];
const CL_KEY = "jobfinder.coverLetters.v1";
const JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const cover = { letters: [], where: "loading", doc: null, draft: null, ctx: null, prefilledFor: null, downloaded: false, plan: {}, adOkFor: "" };

// --- Remembering previous cover letters (privately, per person) ---
const coverReady = memoryReady.then(async () => {
  try {
    if (memory.db && memory.uid) {
      cover.doc = memory.db.doc("data/users/" + memory.uid + "/coverLetters");
      const snap = await cover.doc.get();
      if (snap.exists) { const d = snap.data() || {}; cover.letters = Array.isArray(d.letters) ? d.letters.slice(0, 3) : []; if (d.availability && !$("clAvail").value) $("clAvail").value = d.availability; }
      cover.where = "account";
      return;
    }
  } catch { cover.doc = null; }
  try {
    const raw = localStorage.getItem(CL_KEY);
    if (raw) { const d = JSON.parse(raw) || {}; cover.letters = Array.isArray(d.letters) ? d.letters.slice(0, 3) : []; if (d.availability && !$("clAvail").value) $("clAvail").value = d.availability; }
    cover.where = "browser";
  } catch { cover.where = "none"; }
}).finally(renderLetterFiles);

async function saveCoverStore() {
  const body = { version: 1, letters: cover.letters.slice(0, 3).map(l => ({ name: String(l.name).slice(0, 120), text: String(l.text).slice(0, 20000), added: l.added })), availability: $("clAvail").value.trim(), updated: new Date().toISOString() };
  if (cover.doc) { try { await cover.doc.set(body); cover.where = "account"; return; } catch { cover.doc = null; } }
  try { localStorage.setItem(CL_KEY, JSON.stringify(body)); cover.where = "browser"; } catch { cover.where = "none"; }
}
function renderLetterFiles() {
  const ul = $("clFiles");
  if (!ul) return;
  ul.innerHTML = "";
  // each letter: its icon, its name and what was found in it (paragraphs, words, who it is written to)
  for (const [i, l] of cover.letters.entries()) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "cl-file";
    name.innerHTML = `${tlIcon(l.name)}<span class="cl-file-t"><b>${esc(l.name)}</b><span class="small muted">${esc(tlLetterParts(l.text).join(" · "))}</span></span>`;
    const x = document.createElement("button");
    x.type = "button"; x.className = "linkish"; x.textContent = "Remove";
    x.setAttribute("aria-label", `Remove ${l.name}`);
    x.onclick = async () => { cover.letters.splice(i, 1); renderLetterFiles(); await saveCoverStore(); };
    li.append(name, x);
    ul.appendChild(li);
  }
  const where = { account: `${accountWords()[0].toUpperCase()}${accountWords().slice(1)}.`, browser: "Saved in this browser only.", none: "Can't be saved on this page.", loading: "Loading your saved letters…" }[cover.where];
  $("clStore").textContent = cover.letters.length ? `${cover.letters.length} saved letter${cover.letters.length === 1 ? "" : "s"}. ${where}` : (cover.where === "loading" ? where : "");
  tlRender();
}
async function addLetterFiles(files) {
  const status = $("clStore");
  for (const f of [...files].slice(0, 3)) {
    status.textContent = `Reading ${f.name}…`;
    try {
      const { text } = await readFile(f);
      if (wordCount(text) < 40) { status.textContent = `${f.name} has too little text to use.`; continue; }
      cover.letters = [{ name: f.name, text, added: new Date().toISOString() }, ...cover.letters.filter(l => l.name !== f.name)].slice(0, 3);
    } catch (e) { status.textContent = e && e.message ? e.message : `Couldn't read ${f.name}.`; }
  }
  renderLetterFiles();
  await saveCoverStore();
  renderLetterFiles();
}

// --- Facts for the letter, taken from the resume and the ad ---
const titleCase = s => s.toLowerCase().replace(/(^|[\s'’-])\S/g, c => c.toUpperCase());
function candidateFrom(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let name = lines[0] || "";
  if (name === name.toUpperCase()) name = titleCase(name);
  const header = lines.slice(0, 6).join("  ");
  const email = (header.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i) || [""])[0];
  const phone = ((header.match(/(?:\+|\()?\d[\d\s().\-]{7,}\d/g) || []).find(p => { const d = p.replace(/\D/g, ""); return d.length >= 9 && d.length <= 13; }) || "").trim();
  const loc = (header.match(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)?,? (?:VIC|NSW|QLD|WA|SA|TAS|ACT|NT))\b/) || [""])[0];
  const linkedin = (header.match(/linkedin\.com\/in\/[A-Za-z0-9_\-]+\/?/i) || [""])[0];
  return { name, email, phone, location: loc, linkedin };
}
function companyFrom(jd) {
  const lines = readJobAd(jd);
  const c = lines.find(L => L.kind === "company");
  // "CIMIC Graduates" or "Arup Early Careers" (a careers account) → the company itself
  if (c) return c.text.trim().split(/\s+[–—|·-]\s+|\s*·\s*/)[0].trim().replace(/\s+(?:graduates?|early careers|careers|recruitment|talent(?: acquisition)?|jobs)$/i, "");
  const m = jd.match(/\b(?:at|join) ([A-Z][A-Za-z&.'-]+(?: [A-Z][A-Za-z&.'-]+){0,3})\b/);
  return m ? m[1] : "";
}
// Who the ad says to write to: "Applications to Ms Rahman", "Contact Priya Rahman" ... A title (Ms, Mr, Dr) is kept as the ad writes it.
function recipientFrom(jd) {
  const lead = "(?:contact|enquiries to|questions,? (?:please )?(?:contact|email)|reach out to|address your application to|applications? (?:should be )?(?:addressed |sent |submitted )?to|send (?:your )?applications? to|attention:?|attn:?|hiring manager:?)";
  for (const m of String(jd || "").matchAll(new RegExp(lead + "\\s+(.{0,40})", "ig"))) {
    const n = m[1].match(/^(?:(?:Ms|Mr|Mrs|Miss|Mx|Dr|Prof)\.?\s+[A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?|[A-Z][a-z]+(?:\s+[A-Z][a-z'’-]+){1,2})/);
    if (!n) continue;
    const name = n[0].replace(/^(Ms|Mr|Mrs|Miss|Mx|Dr|Prof)\./, "$1");
    if (name.toLowerCase() !== String(companyFrom(jd) || "").toLowerCase()) return name;   // (a company is not a person)
  }
  return "";
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function endDateWords(line) {
  const m = line.match(RANGE_TEST);
  if (!m) return "";
  const end = m[2].trim();
  let mm = end.match(/^(\d{1,2})\s*\/\s*((?:19|20)\d{2})$/);
  if (mm) return `${MONTH_NAMES[+mm[1] - 1] || ""} ${mm[2]}`.trim();
  mm = end.match(/^([A-Za-z]+)\.?\s+((?:19|20)\d{2})$/);
  if (mm) { const i = MONTH_NAMES.findIndex(n => n.toLowerCase().startsWith(mm[1].toLowerCase().slice(0, 3))); return `${i >= 0 ? MONTH_NAMES[i] : mm[1]} ${mm[2]}`; }
  return end;
}
// "Provaris Energy Ltd (ASX: PV1)" → "Provaris Energy"; "R.M. Williams, Claremont Quarter (Perth)…" → "R.M. Williams"
const shortOrg = org => org.split(/[,(]/)[0].replace(/\b(pty|ltd|limited|inc|llc|plc)\b\.?/gi, "").replace(/\s+/g, " ").trim();
function coverContext() {
  const resume = finalText();
  const parsed = parseResume(resume);
  const res = lastResult;
  const scored = [...res.hard, ...res.soft];
  const resumeSkills = skillSet(resume);
  const have = scored.filter(x => resumeSkills.has(x.name));       // skills the ad wants that the (updated) resume shows
  const edu = parsed.zones.filter(z => z.kind === "education").map(z => {
    const [degree, inst] = z.label.split(/\s+·\s+|\s+\|\s+/);
    const head = parsed.lines[z.headIdx] || "";
    const coursework = (z.bullets.find(b => /^coursework\s*:/i.test(b.text)) || {}).text || "";
    const yr = (head.match(RANGE_TEST) || [])[2] || "";
    const future = /present|current|expected/i.test(head) || (/(\d{4})/.test(yr) && +yr.match(/(\d{4})/)[1] >= new Date().getFullYear());
    return { degree: (degree || "").trim(), inst: (inst || "").trim(), coursework: coursework.replace(/^coursework\s*:\s*/i, ""), current: future, ends: endDateWords(head), dates: ((head.match(RANGE_TEST) || [""])[0] + (/\(expected\)/i.test(head) ? " (expected)" : "")).trim(), lines: z.bullets.map(b => b.text) };
  });
  const roles = parsed.zones.filter(z => z.kind === "role").map(z => {
    const [title, org] = z.label.split(/\s+·\s+|\s+\|\s+/);
    const scoredBullets = z.bullets.map(b => {
      const sk = [...skillSet(b.text)].filter(n => have.some(h => h.name === n));
      return { text: b.text, skills: sk, score: sk.reduce((a, n) => a + (have.find(h => h.name === n) || {}).rel, 0) + (numsOf(b.text).length ? 0.3 : 0) + (ACTION_START.test(b.text) ? 0.2 : 0) };
    });
    const head = parsed.lines[z.headIdx] || "";
    const orgFull = (org || "").trim();
    return { title: (title || "").trim(), org: orgFull, orgShort: shortOrg(orgFull), dates: (head.match(RANGE_TEST) || [""])[0], bullets: scoredBullets, score: scoredBullets.reduce((a, b) => a + b.score, 0), label: z.label };
  });
  const plan = cover.plan || (cover.plan = {}), adx = LR.adInstructions(lastScan.jd);
  const roleNow = $("clRole").value.trim() || detectTitle(lastScan.jd, lastScan.title) || "";
  const sit = hasProfile(P()) ? lrSituation(P(), { role: roleNow, eoi: plan.situation === "expression_of_interest" }, plan.situation) : { value: plan.situation || "standard", auto: "standard", reason: "", from_field: "", to_field: "" };
  const length = lrLengthOf(plan, sit.value, adx);
  return {
    plan, adx, sit, length,
    resume, jd: lastScan.jd, title: $("clRole").value.trim() || detectTitle(lastScan.jd, lastScan.title) || "the advertised position",
    company: $("clCompany").value.trim(), recipient: $("clRecipient").value.trim(), address: $("clAddress").value.trim(),
    source: $("clSource").value.trim(), why: $("clWhy").value.trim(), avail: $("clAvail").value.trim(),
    cand: { name: $("clName").value.trim(), email: $("clEmail").value.trim(), phone: $("clPhone").value.trim(), location: $("clLocation").value.trim(), linkedin: candidateFrom(resume).linkedin },
    letters: cover.letters.map(l => l.text).concat($("clPaste").value.trim() ? [$("clPaste").value.trim()] : []),
    have, required: have.filter(x => x.priority === "Required"), edu, roles,
    resumeHard: [...findSkills(norm(resume)).values()].filter(x => x.skill.kind === "hard").sort((a, b) => b.count - a.count).map(x => x.skill.name),
    resumeSoft: [...findSkills(norm(resume)).values()].filter(x => x.skill.kind === "soft").map(x => x.skill.name),
    reusable: reusableSentences(cover.letters.map(l => l.text).concat($("clPaste").value.trim() ? [$("clPaste").value.trim()] : []), roles),
    dutyLine: (readJobAd(lastScan.jd).find(L => L.kind === "duty" && BULLET_RE.test(L.text)) || {}).text || (lastResult && lastResult.needs && lastResult.needs.criteria[0] ? lastResult.needs.criteria[0].text : ""),
    // what the company says it stands for: the ad's own words first, then its careers pages (Company guides)
    values: [...new Set([...(lastResult && lastResult.needs ? lastResult.needs.values.map(v => v.name) : []), ...((guideForCover() || {}).values || [])])].slice(0, 8),
    guide: guideForCover(),
    // from "Fit the job's criteria": the sentences chosen, what interests them and what they'll bring
    ...fitForCover(),
    range: letterRange(resume, length, adx.wordLimit || 0)
  };
}
// Sentences from earlier letters that are about the candidate's own roles (not the old employer they were writing to)
function reusableSentences(letters, roles) {
  const orgs = roles.map(r => r.org.split(/[,(]/)[0].replace(/\b(pty|ltd|limited|inc)\b\.?/gi, "").trim()).filter(o => o.length > 2);
  const out = [];
  for (const l of letters) {
    for (const sent of l.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z])/)) {
      const t = sent.trim();
      const n = wordCount(t);
      if (n < 10 || n > 45 || !/[.!]$/.test(t)) continue;
      if (/\b(your|you|this position|this role|the position|vacation student position|apply|applying|thank you|available|sincerely|dear)\b/i.test(t)) continue;
      if (!orgs.some(o => t.toLowerCase().includes(o.toLowerCase()))) continue;
      out.push({ text: t, soft: findSkills(norm(t)).size ? [...findSkills(norm(t)).values()].filter(x => x.skill.kind === "soft").length : 0 });
    }
  }
  return out.sort((a, b) => b.soft - a.soft);
}
function prefillCover() {
  if (!lastResult) return;
  const key = lastScan.jd + "\n" + finalText().slice(0, 200);
  if (cover.prefilledFor === key) return;
  cover.prefilledFor = key;
  const set = (id, v) => { const el = $(id); if (!el.value.trim() || el.dataset.auto === "1") { el.value = v || ""; el.dataset.auto = "1"; } };
  const c = candidateFrom(finalText());
  const g = activeGuide();
  set("clRole", detectTitle(lastScan.jd, lastScan.title)); set("clCompany", companyFrom(lastScan.jd) || (g ? g.name.split(" (")[0] : "")); set("clRecipient", recipientFrom(lastScan.jd));
  renderGuideHint();
  set("clName", c.name); set("clEmail", c.email); set("clPhone", c.phone); set("clLocation", c.location);
  renderReady();
}
// Before writing: what the letter will use, what's missing, and what happens to anything left blank
const READY_NEED = [
  ["clName", "Name", "needed to sign the letter"],
  ["clPhone", "Phone", "not found in your resume. Add it so they can call you"],
  ["clEmail", "Email", "not found in your resume. Add it so they can reply"],
  ["clRole", "Role", "couldn't find the job title in the ad. Add it"],
  ["clCompany", "Company", "couldn't find the company in the ad. Add it so the letter can name them"]
];
const READY_OPT = [
  ["clRecipient", "Hiring manager", "not given, so it opens “Dear Hiring Manager”"],
  ["clSource", "Where you saw the ad", "not given, so the letter won't mention it"],
  ["clWhy", "Why this company", "not given, so the letter points to details in the ad. Your own reason reads better"],
  ["clAvail", "Availability", "not given, so the letter won't mention a start date"]
];
// A detail being typed in the box (null: none). The details themselves live in the boxes behind the scenes (clRole, clCompany…), and every
// one can be corrected here: select its name, or Edit.
let readyEdit = null;
function renderReady() {
  const el = $("clReady");
  if (!el || !lastResult) return;
  const v = id => $(id).value.trim();
  const short = t => t.length > 60 ? t.slice(0, 57) + "…" : t;
  const need = READY_NEED.filter(([id]) => !v(id));
  const item = ([id, label, why], cls) => {
    if (readyEdit === id) return `<li class="ed"><span class="mark" aria-hidden="true">✎</span><span class="ready-edit"><label for="clReadyIn">${esc(label)}</label><input type="text" id="clReadyIn" data-ready-in="${id}" autocomplete="off" value="${esc($(id).value)}"><span class="small muted">Press Enter or click away to keep it.</span></span></li>`;
    return `<li class="${cls}"><span class="mark" aria-hidden="true">${cls === "ok" ? "✓" : cls === "need" ? "!" : "–"}</span><span>${cls === "ok" ? `<b>${esc(label)}:</b> ${esc(short(v(id)))} <button class="linkish edit" type="button" data-focus="${id}" aria-label="Edit ${esc(label)}">Edit</button>` : `<button class="linkish" type="button" data-focus="${id}">${esc(label)}</button>: ${esc(why)}`}</span></li>`;
  };
  el.innerHTML = `<h3>${need.length ? `Add ${need.length === 1 ? "one detail" : need.length + " details"} to finish your letter` : "Ready to write"}</h3>
    <p class="muted">${need.length ? "The letter uses your real details and never makes them up, so anything missing is left out." : "Your letter will use these details. Anything left blank is left out, never made up."}</p>
    <ul>${READY_NEED.map(r => item(r, v(r[0]) ? "ok" : "need")).join("")}${READY_OPT.map(r => item(r, v(r[0]) ? "ok" : "opt")).join("")}</ul>`;
  const inp = $("clReadyIn");
  if (inp) { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); }
  renderCoverPlan();
}

// --- Writing it ---
const listJoin = arr => arr.length <= 1 ? (arr[0] || "") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
const lowerFirst = s => s ? s[0].toLowerCase() + s.slice(1) : s;
function asClause(bullet) {
  const t = tidy(bullet);
  return ACTION_START.test(t) ? "I " + lowerFirst(t) : null;
}
function templateLetter(ctx) {
  const e = ctx.edu[0];
  const hard = ctx.have.filter(x => x.kind === "hard").sort((a, b) => b.rel - a.rel);
  const soft = ctx.have.filter(x => x.kind === "soft");
  const roles = ctx.roles.slice().sort((a, b) => b.score - a.score).filter(r => r.bullets.length).slice(0, 2);
  const paras = [];
  const eduSentence = e ? (e.current ? `I am currently completing a ${e.degree}${e.inst ? ` at ${e.inst.split(",")[0]}` : ""}${e.ends ? `, graduating in ${e.ends}` : ""}` : `I hold a ${e.degree}${e.inst ? ` from ${e.inst.split(",")[0]}` : ""}`) : "";
  const top = (ctx.bring && ctx.bring.length ? ctx.bring : (hard.length ? hard.map(x => x.name) : ctx.resumeHard)).slice(0, 3).map(inSentence);
  paras.push({ part: "opening", text: `I am applying for the ${ctx.title} position${ctx.company ? ` at ${ctx.company}` : ""}${ctx.source ? `, as advertised on ${ctx.source}` : ""}.${eduSentence ? " " + eduSentence + "." : ""}${top.length ? ` I would bring practical experience in ${listJoin(top)} to your team.` : ""}`, evidence: e ? [e.degree] : [] });
  const exp = [];
  roles.forEach((r, i) => {
    const b = r.bullets.slice().sort((x, y) => y.score - x.score).find(x => asClause(x.text));
    if (!b) return;
    exp.push(i === 0 ? `As ${/^[aeiou]/i.test(r.title) ? "an" : "a"} ${r.title}${r.orgShort ? ` at ${r.orgShort}` : ""}, ${asClause(b.text)}.` : `${r.orgShort ? `At ${r.orgShort}` : `In my role as ${r.title}`}, ${asClause(b.text)}.`);
  });
  const shown = hard.filter(x => x.priority === "Required" || x.rel >= 0.8).slice(0, 4).map(x => inSentence(x.name));
  // (a sentence about the qualification is left for the opening, which already names it)
  const chosen = [...new Set((ctx.fit || []).filter(f => !(e && /^I (hold|am completing) an? /.test(f.say))).map(f => f.say.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, 4);
  // with fewer than three chosen, add the other jobs' best examples too (never the same line twice)
  const usedEv = new Set((ctx.fit || []).map(f => norm(f.ev)));
  const more = chosen.length >= 3 ? [] : roles.map((r, i) => { const b = r.bullets.slice().sort((x, y) => y.score - x.score).find(x => asClause(x.text) && !usedEv.has(norm(x.text))); return b ? `${r.orgShort ? `At ${r.orgShort}` : `In my role as ${r.title}`}, ${asClause(b.text)}.` : ""; }).filter(Boolean).slice(0, 3 - chosen.length);
  if (chosen.length) paras.push({ part: "experience", text: [...chosen, ...more].join(" ") + (shown.length ? ` Together, this work has given me hands-on experience in ${listJoin(shown)}, which your role calls for.` : ""), evidence: (ctx.fit || []).map(f => f.ev).filter(Boolean) });
  else if (exp.length) paras.push({ part: "experience", text: exp.join(" ") + (shown.length ? ` This work has given me hands-on experience in ${listJoin(shown)}, which your role calls for.` : ""), evidence: roles.map(r => r.label) });
  const tools = (hard.length ? hard.map(x => x.name) : ctx.resumeHard).filter(n => ["software", "programming"].includes(skillGroup(n, "hard"))).slice(0, 4);
  const techn = hard.filter(x => !tools.includes(x.name) && !shown.includes(inSentence(x.name))).slice(0, 3).map(x => inSentence(x.name));
  const projLine = e ? (e.lines || []).find(l => /^(thesis|project|capstone|major project)\b/i.test(l)) : "";
  if (e || tools.length) paras.push({ part: "education", text: `${e && e.coursework ? `My studies have given me a strong technical foundation, including ${listJoin(e.coursework.split(/;\s*|,\s*/).slice(0, 3))}.` : "My studies have given me a strong technical foundation."}${projLine ? ` I also completed ${lowerFirst(projLine.replace(/^(thesis|project|capstone|major project)\s*:\s*/i, (m, w) => `a ${/^(thesis|project|capstone)$/i.test(w) ? "major project" : w.toLowerCase()} on `).replace(/[.\s]+$/, "").replace(/ on ([A-Z])(?=[a-z])/, (m, c) => " on " + c.toLowerCase()))}.` : ""}${tools.length ? ` I am proficient in ${listJoin(tools)}` : ""}${tools.length && techn.length ? `, and I am comfortable with ${listJoin(techn)}.` : tools.length ? "." : techn.length ? ` I am comfortable with ${listJoin(techn)}.` : ""}`, evidence: e ? [e.coursework || e.degree].filter(Boolean) : [] });
  const duty = tidy(ctx.dutyLine || "");
  const softs = (soft.length ? soft.map(x => x.name) : ctx.resumeSoft).slice(0, 3).map(softPhrase);
  const otherRole = ctx.roles.find(r => !roles.includes(r));
  const reuse = (ctx.reusable || []).find(r => r.soft > 0);
  const interest = (ctx.interest || []).length ? ` What interests me most about the role is ${listJoin(ctx.interest.map(x => lowerFirst(x.replace(/[.\s]+$/, ""))))}.` : "";
  paras.push({ part: "motivation", text: `${ctx.why ? `I am particularly drawn to ${ctx.company || "your organisation"} because ${lowerFirst(ctx.why.replace(/[.\s]+$/, ""))}.` : duty ? `I am particularly drawn to this role because it would allow me to ${lowerFirst(duty)}.` : `I am particularly drawn to this role and the chance to contribute to ${ctx.company || "your team"}.`}${interest}${reuse ? " " + reuse.text : softs.length ? ` My experience${otherRole && otherRole.orgShort ? ` at ${otherRole.orgShort}` : " across my roles"} has also developed my ${listJoin(softs)}, which I would bring to your team.` : ""}`, evidence: reuse ? [reuse.text] : otherRole ? [otherRole.label] : [] });
  paras.push({ part: "closing", text: `Thank you for considering my application. I would welcome the opportunity to discuss how my skills and experience could support ${ctx.company || "your team"}${ctx.avail ? `, and I am available ${ctx.avail.replace(/[.\s]+$/, "")}` : ""}.`, evidence: [] });
  return { salutation: ctx.recipient ? `Dear ${ctx.recipient},` : "Dear Hiring Manager,", paragraphs: paras, signoff: "Yours sincerely,", via: "Written from your resume and the ad, without AI" };
}

// For Chrome's small on-device model: only the parts of the ad that matter, and shorter extracts
function adEssentials(jd) {
  const lines = readJobAd(jd).filter(L => L.text.trim() && !NOT_SCORED.has(L.kind));
  return lines.map(L => L.text.trim()).join("\n").slice(0, 2500);
}
// Fill in anything the AI left as a placeholder that we already know; keep a list of what's still missing
const ph = inner => new RegExp(`[\\[{]\\s*(?:${inner})\\s*[\\]}]`, "gi");
const PLACEHOLDERS = [
  { re: ph("(?:your\\s+)?(?:phone|mobile|contact)(?:\\s+number)?"), label: "Your phone number", field: "clPhone", get: c => c.cand.phone, set: (c, v) => { c.cand.phone = v; } },
  { re: ph("(?:your\\s+)?e-?mail(?:\\s+address)?"), label: "Your email address", field: "clEmail", get: c => c.cand.email, set: (c, v) => { c.cand.email = v; } },
  { re: ph("(?:your\\s+)?(?:full\\s+)?name"), label: "Your name", field: "clName", get: c => c.cand.name, set: (c, v) => { c.cand.name = v; } },
  { re: ph("(?:the\\s+)?(?:company|organisation|organization|employer)(?:'s)?(?:\\s+name)?"), label: "The company's name", field: "clCompany", get: c => c.company, set: (c, v) => { c.company = v; } },
  { re: ph("(?:hiring\\s+manager|recipient|manager)(?:'s)?(?:\\s+name)?"), label: "The hiring manager's name", field: "clRecipient", get: c => c.recipient || "Hiring Manager", set: (c, v) => { c.recipient = v; } },
  { re: ph("(?:the\\s+)?(?:position|role|job title|position title|job)(?:\\s+title)?"), label: "The job title", field: "clRole", get: c => c.title, set: (c, v) => { c.title = v; } },
  { re: ph("source|job board|platform|website|where (?:you|I) saw the (?:ad|advertisement|role)"), label: "Where you saw the ad", field: "clSource", get: c => c.source, set: (c, v) => { c.source = v; } },
  { re: ph("start date|availability|available date|date available|notice period"), label: "When you can start", field: "clAvail", get: c => c.avail, set: (c, v) => { c.avail = v; } },
  { re: ph("date|today's date"), label: "Today's date", get: () => todayAU() },
  { re: ph("(?:your\\s+)?(?:location|city|suburb|address)"), label: "Your location", field: "clLocation", get: c => c.cand.location, set: (c, v) => { c.cand.location = v; } }
];
// Sentences, without breaking at initials such as "R.M. Williams"
const sentencesOf = t => t.split(/(?<!\b[A-Z]\.)(?<=[.!?])\s+/);
const TOKEN_RE = new RegExp(GAP_SRC, "g");
const placeholderFor = tok => PLACEHOLDERS.find(x => new RegExp(x.re.source, "i").test(tok));
function fillPlaceholders(text, ctx) {
  let t = text;
  for (const x of PLACEHOLDERS) { const v = x.get(ctx); if (v) t = t.replace(x.re, v); }
  return t;
}
// Every gap still in the letter, where it is, and what fills it
function missingTokens(draft) {
  const out = new Map();
  const scan = (text, where) => {
    for (const tok of text.match(TOKEN_RE) || []) {
      if (out.has(tok)) continue;
      const sentence = (sentencesOf(text).find(x => x.includes(tok)) || text).trim();
      out.set(tok, { tok, where, sentence, ph: placeholderFor(tok) });
    }
  };
  scan(draft.salutation, "salutation");
  draft.paragraphs.forEach((p, i) => scan(p.text, i));
  scan(draft.signoff, "signoff");
  return [...out.values()];
}
// Who did what where: a sentence that names one job (by employer or job title) must describe work listed under that job
const titleKey = r => (r.title.split(/\s+[–—-]\s+|,|\|/)[0] || "").trim();
const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function attributionIssues(draft, ctx) {
  const issues = [];
  const roleWords = r => contentWords(r.bullets.map(b => b.text).join(" ") + " " + r.title);
  const nameOf = r => r.orgShort || titleKey(r);
  draft.paragraphs.forEach((p, pi) => {
    for (const sent of sentencesOf(p.text)) {
      const low = sent.toLowerCase();
      const byOrg = ctx.roles.filter(r => r.orgShort.length > 2 && low.includes(r.orgShort.toLowerCase()));
      const byTitle = ctx.roles.filter(r => titleKey(r).length > 5 && low.includes(titleKey(r).toLowerCase()));
      // "As a Data Analyst at Provaris Energy": the title from one job with the employer of another
      if (byOrg.length === 1 && byTitle.length === 1 && byTitle[0] !== byOrg[0]) {
        issues.push({ pi, sentence: sent, user: `Calls you ${titleKey(byTitle[0])} at ${byOrg[0].orgShort}, but that was your job at ${nameOf(byTitle[0])}.`, ai: `"${sent}" puts the job title ${titleKey(byTitle[0])} at ${byOrg[0].orgShort}, but in <experience_by_employer> that title is at ${nameOf(byTitle[0])}.` });
        continue;
      }
      const named = byOrg.length ? byOrg : byTitle;
      if (named.length !== 1) continue;
      const r = named[0];
      let rest = sent;
      for (const k of [r.orgShort, titleKey(r)]) if (k) rest = rest.replace(new RegExp(escRe(k), "gi"), " ");
      const claim = contentWords(rest);
      const overlap = other => { const w = roleWords(other); let n = 0; for (const x of claim) if (w.has(x)) n++; return n; };
      const own = overlap(r);
      let best = null, bestN = 0;
      for (const o of ctx.roles) if (o !== r) { const n = overlap(o); if (n > bestN) { bestN = n; best = o; } }
      if (best && bestN >= 3 && bestN >= own + 2) issues.push({ pi, sentence: sent, user: `Names ${nameOf(r)}, but your resume lists this work under ${nameOf(best)}. Check which job it came from.`, ai: `"${sent}" names ${nameOf(r)}, but in <experience_by_employer> that work is listed under ${nameOf(best)}.` });
    }
  });
  return issues;
}
function polishDraft(d, ctx) {
  d.salutation = fillPlaceholders(d.salutation, ctx);
  d.signoff = fillPlaceholders(d.signoff, ctx);
  d.paragraphs.forEach(p => { p.text = fillPlaceholders(p.text, ctx); });
  dropBlankGaps(d);
  // made in code, never trusted to the model: Australian spelling, the greeting (a name the person gave, else Hiring Manager), the facts of the close
  d.paragraphs.forEach(p => { p.text = LR.auSpelling(p.text); });
  d.salutation = LR.greeting(ctx.recipient, "");
  const cl = d.paragraphs.find(p => p.part === "closing");
  if (cl && ctx.plan) cl.text = lrEnsureClose(cl.text, { salary: ctx.plan.salary, trial: lrTrialOn(ctx.plan, ctx.sit.value, lrTrialFits(ctx.jd, ctx.title, ctx.adx.employmentType)), held: LR.adInstructions(ctx.resume).checks.filter(c => LR.adInstructions(ctx.jd).checks.includes(c)) });
  return d;
}
// Anything optional the person left blank is left out: a sentence that still has a gap for it is taken out, and a greeting or sign-off with one
// goes back to the usual words. Only the role, company and name stay as gaps to fill (the letter can't be sent without them).
const MUST_FILL = new Set(["clRole", "clCompany", "clName"]);
function dropBlankGaps(d) {
  const open = t => (t.match(TOKEN_RE) || []).some(tok => { const ph = placeholderFor(tok); return !(ph && MUST_FILL.has(ph.field)); });
  if (open(d.salutation)) d.salutation = "Dear Hiring Manager,";
  if (open(d.signoff)) d.signoff = "Yours sincerely,";
  d.paragraphs.forEach(p => { if (open(p.text)) p.text = sentencesOf(p.text).filter(x => !open(x)).join(" ").trim(); });
  d.paragraphs = d.paragraphs.filter(p => p.text);
  return d;
}
// The letter is written by ONE prompt (14c-letter-advice.js): a summary of the Cover Letter Advice page, this resume and the ad. The AI's answer is split
// into the paragraphs below. With no AI (or no usable answer) the letter is assembled from the resume and the ad.
async function writeCover(ctx, progress) {
  const extra = [
    (ctx.interest || []).length ? `What interests the applicant most about the role: ${ctx.interest.join("; ")}` : "",
    (ctx.bring || []).length ? `What the applicant wants to lead with: ${ctx.bring.join(", ")}` : "",
    // the applicant's own words from "Add a detail" and from the questions before the letter is written
    ...Object.entries((ctx.plan || {}).details || {}).filter(([, v]) => String(v || "").trim()).map(([part, v]) => `The applicant adds, for the ${partOf(part).label} paragraph (their own words): ${String(v).trim()}`),
    ...Object.entries((ctx.plan || {}).gaps || {}).filter(([, v]) => String(v || "").trim()).map(([k, v]) => `The applicant adds, about "${k}" (their own words): ${String(v).trim()}`)
  ];
  progress("Writing your cover letter from the Cover Letter Advice and your resume…");
  const { paragraphs, res } = await adviceWrite({ resume: ctx.resume, ad: adEssentials(ctx.jd) || ctx.jd, role: ctx.title, company: ctx.company, why: ctx.why, avail: ctx.avail, source: ctx.source, extra, words: ctx.range }, progress);
  if (paragraphs) {
    const parts = COVER_PARTS.map((c, i) => ({ part: c.key, text: paragraphs[i], evidence: [], adPoints: [] })).filter(p => p.text);
    return polishDraft({ salutation: "Dear Hiring Manager,", paragraphs: parts, signoff: "Yours sincerely,", via: `Written by ${viaWords(res.via)} from the Cover Letter Advice and your resume` }, ctx);
  }
  const d = polishDraft(templateLetter(ctx), ctx);
  d.via = `${aiMissWords(res)} ${d.via}`.trim();
  return d;
}

// --- Checks: anything the letter says that the resume, previous letters or your details don't support ---
function letterChecks(draft, ctx) {
  const sources = [ctx.resume, ...ctx.letters, ctx.why, ctx.avail, ctx.source, ctx.company, ctx.recipient, ctx.title, ctx.address, ctx.cand.name, ctx.cand.phone, ctx.cand.email, ctx.cand.location, ...(ctx.interest || []), ...(ctx.fit || []).map(f => f.say), ...(ctx.guide ? [ctx.guide.name, ctx.guide.purpose, ...ctx.guide.values] : [])].join("\n");
  const okSkills = new Set([...skillSet(ctx.resume), ...ctx.letters.flatMap(l => [...skillSet(l)])]);
  // dates like "12/2022" shouldn't vouch for "12 buildings": count figures with dates removed, plus the years themselves
  const okNums = new Set([...numsOf(sources.replace(RANGE_ALL, " ").replace(new RegExp(MY, "gi"), " ")), ...(sources.match(/\b(19|20)\d{2}\b/g) || [])]);
  const adNums = new Set(numsOf(ctx.jd));
  const kindOf = name => (SKILLS.find(x => x.name === name) || {}).kind;
  const scoredNames = new Set([...lastResult.hard, ...lastResult.soft].map(x => x.name));
  const LEARNING = /\b(keen|eager|looking forward|excited|hope|hoping) to (learn|develop|build|grow|gain|deepen|expand)|opportunity to (learn|develop|gain|build)|\bwant to learn\b/i;
  // "the design support this internship involves" points at the ad; "I am proficient in…" is a claim
  const AD_REF = /\b(involves|requires|calls for|offers|exposure to|is seeking|are seeking|looking for)\b/i;
  const CLAIM = /\b(proficient|experienced|skilled|expertise|hands-on|practical experience|experience in|I have)\b/i;
  const sourceNorm = norm(sources);
  return draft.paragraphs.map(p => {
    const flags = [];
    const sentences = p.text.split(/(?<=[.!?])\s+/);
    const sk = [...skillSet(p.text)];
    for (const s of sk) {
      if (okSkills.has(s) || s === "Willingness to learn") continue;
      // judge each skill by the sentence it sits in: "keen to learn Revit" is fine, "proficient in AutoCAD" is a claim
      const learning = sentences.filter(x => skillSet(x).has(s)).every(x => LEARNING.test(x) || (AD_REF.test(x) && !CLAIM.test(x)));
      if (learning) continue;
      flags.push(kindOf(s) === "soft"
        ? `Says you have ${softPhrase(s)}, but your resume doesn't show it yet. Back it up with an example.`
        : `Mentions ${s}, which isn't in your resume or previous letters. Check it isn't claimed as experience.`);
    }
    // figures in the opening or close may come from the ad ("12-week internship"); elsewhere they must come from you
    const allowAd = p.part === "opening" || p.part === "closing";
    for (const n of numsOf(p.text)) if (!okNums.has(n) && !(allowAd && adNums.has(n))) flags.push(`The figure ${n} isn't in your resume. Check it's right.`);
    for (const c of COVER_CLICHES) if (new RegExp("\\b" + c.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "\\b", "i").test(p.text)) flags.push(`"${c}" is a cliché. Say something specific instead.`);
    for (const b of LR.bannedFound(p.text)) if (!COVER_CLICHES.includes(b)) flags.push(`"${b}" reads as AI-written. Replace it with a specific fact.`);
    const evidence = p.evidence.filter(q => q.length > 6 && sourceNorm.includes(norm(q).replace(/[.…\s]+$/, "")));
    return { ad: sk.filter(s => scoredNames.has(s)), evidence, flags };
  });
}

// --- Showing it: the letter as a page, and a breakdown beside it ---
const todayAU = () => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
function letterParts(draft, ctx) {
  const contact = [ctx.cand.location, ctx.cand.phone, ctx.cand.email, ctx.cand.linkedin].filter(Boolean);
  // a hiring manager, company or address left blank is left out, never shown as a placeholder
  const recipient = [ctx.recipient, ctx.company, ctx.address].filter(Boolean);
  return { name: ctx.cand.name || "Your name", contact, date: todayAU(), recipient, re: LR.reLine(ctx.title, { location: LR.adLocation(ctx.jd, ctx.title), ref: lrAdRef(ctx.jd), expressionOfInterest: ctx.sit && ctx.sit.value === "expression_of_interest", targetRole: ctx.plan && ctx.plan.target }), salutation: draft.salutation, paragraphs: draft.paragraphs.map(p => p.text), signoff: draft.signoff, signName: ctx.cand.name || "" };
}
// The letter: laid out like the Cover letter tab of Create or edit cover letter. The paragraphs to edit (each with its guide, and the ad's key
// skills highlighted in them), the sign-off, then what to check before sending, all on the left; the breakdown above the preview on the right.
function renderCover() {
  const out = $("clOut"), d = cover.draft;
  if (!out || !d) return;
  out.innerHTML = `
  <div id="clFinish"></div>
  <section class="panel lt-form cl-edit" aria-labelledby="clEditH">
    <div class="panel-head"><h2 id="clEditH">Your letter</h2><p>Five paragraphs, each with one job to do. Saved as you type, gaps and all: the breakdown and the preview update as you edit, and the ad's key skills are highlighted in your words. <span class="lt-target" id="clTarget"></span></p></div>
    <div class="q-grid"><label class="field" for="clSal">Greeting<input type="text" id="clSal" autocomplete="off"></label></div>
    <div class="lt-parts" id="clParts">${d.paragraphs.map((p, i) => `<div class="lt-part" data-cli="${i}">
      <label class="q-label" for="clp-${i}">${i + 1}. ${esc(partOf(p.part).label)} <span class="opt" id="clw-${i}"></span></label>
      <p class="q-hint">${esc(partOf(p.part).purpose)}</p>
      <div id="clg-${i}">${clGuideHtml(p.part, letterStage())}</div>
      <div class="hl-wrap"><div class="hl-back" id="clb-${i}" aria-hidden="true"></div><textarea id="clp-${i}" data-clp="${i}" rows="8" spellcheck="true" placeholder="Write this paragraph."></textarea></div>
      <div class="lt-part-acts cl-part-acts" id="cla-${i}"></div><div class="lt-alts bl-alts" id="clx-${i}"></div>
      <div class="cl-flags" id="clf-${i}"></div>
    </div>`).join("")}</div>
    <div class="lt-signoff"><label class="field" for="clSign">Sign-off<input type="text" id="clSign" autocomplete="off"></label></div>
    <div id="clChecks"></div>
  </section>`;
  $("clGenRow").hidden = true;
  $("clSal").value = d.salutation; $("clSign").value = d.signoff;
  d.paragraphs.forEach((p, i) => { const ta = $("clp-" + i); ta.value = p.text; clBack(i); growBox(ta); clPartActs(i); });
  let t;
  const later = () => { clearTimeout(t); t = setTimeout(() => { renderBreakdown(); renderFinish(); clPreview(); }, 250); };
  out.querySelector("#clParts").addEventListener("input", e => {
    const ta = e.target.closest("[data-clp]"); if (!ta) return;
    const i = +ta.dataset.clp; d.paragraphs[i].text = ta.value.replace(/\s+/g, " ").trim();
    clBack(i); growBox(ta); later();
  });
  out.querySelector("#clParts").addEventListener("click", e => {
    const dt = e.target.closest("[data-cl-detail]"), go = e.target.closest("[data-cl-detail-go]");
    if (dt) { clDetailBox(+dt.dataset.clDetail); return; }
    if (go) clDetailGo(+go.dataset.clDetailGo);
  });
  $("clSal").addEventListener("input", e => { d.salutation = e.target.value; later(); });
  $("clSign").addEventListener("input", e => { d.signoff = e.target.value; later(); });
  $("clActions").hidden = false;
  $("clStatus").textContent = `${d.via}. The breakdown and the preview update as you type.`;
  renderBreakdown();
  renderFinish();
  clPreview();
  // the highlight behind a box is only right once the box has its final width
  requestAnimationFrame(() => d.paragraphs.forEach((p, i) => { const ta = $("clp-" + i); if (ta) growBox(ta); }));
}
// The text behind a paragraph's box: the ad's key skills (green for technical, purple for soft) and any gap (yellow)
function clBack(i) {
  const back = $("clb-" + i), ta = $("clp-" + i);
  if (!back || !ta) return;
  const names = tailorKeyNames();
  back.innerHTML = ta.value.split(new RegExp("(" + GAP_SRC + ")")).map((s, k) => k % 2 ? gapHtml(s) : skillHighlightHtml(s, names)).join("") + "\n";
}
// The preview of the whole letter, in the letter's design; each paragraph in it points back at its box on the left
function clPreview() {
  const d = cover.draft, ctx = cover.ctx;
  if (!d || !$("clPaper")) return;
  const st = currentLetterStyle(), L = letterParts(d, ctx);
  mountPaper($("clPaper"), letterHtml(L, st));
  $("clPaper").querySelectorAll(".lt-p").forEach((el, i) => { el.dataset.cli = i; el.title = "Select to edit this paragraph"; });
  $("clDesign").textContent = `Design: ${st.name}`;
  paperEditable($("clPaper"), clEditor);
  // how many words fit the page at this design, spacing and margins: measured from this preview too
  if (ltMeasureFit("#clPaper")) { ctx.range = letterRange(); renderBreakdown(); }
}
// The preview can be typed in: a paragraph, the greeting and the sign-off go back into the letter on the left (the letterhead, date and
// address come from your details, so they stay as they are)
const clEditor = {
  note: "Select a paragraph in the preview to change it. The boxes on the left, the breakdown and the checks follow.",
  noteId: "clEditNote", locked: ".lt-head, .lt-date, .lt-to, .lt-re, .lt-signname", label: "Your cover letter. Select any paragraph to change it.",
  enabled: () => !!cover.draft,
  apply(old, nw, el) {
    const d = cover.draft, sheet = el instanceof Element && el.closest(".lt-sheet");
    if (!d || !sheet) return false;
    const text = nw.replace(/\s+/g, " ").trim();
    if (el.classList.contains("lt-p")) {
      const i = [...sheet.querySelectorAll(".lt-p")].indexOf(el), p = d.paragraphs[i];
      if (!p) return false;
      p.text = text;
      const ta = $("clp-" + i); if (ta) { ta.value = text; growBox(ta); }
      clBack(i);
      return true;
    }
    if (el.classList.contains("lt-sign")) { d.signoff = text; $("clSign").value = text; return true; }
    if (el.parentElement === sheet && el.tagName === "P" && !el.className) { d.salutation = text; $("clSal").value = text; return true; }
    return false;
  },
  after() { renderBreakdown(); renderFinish(); },
  commit() { clPreview(); }
};
// "To finish your letter": anything the letter still needs from you, with a box to fill each one in
function renderFinish() {
  const box = $("clFinish"), d = cover.draft, ctx = cover.ctx;
  if (!box || !d) return;
  const gaps = missingTokens(d);
  const status = $("clStatus");
  { const b = $("clDl"); if (b) b.disabled = gaps.length > 0; }
  if (!gaps.length) {
    if (box.innerHTML) { box.innerHTML = ""; status.textContent = `${d.via}. The breakdown and the preview update as you type.`; }
    return;
  }
  status.textContent = `Fill in the ${gaps.length === 1 ? "gap" : gaps.length + " gaps"} above to download your letter.`;
  // don't rebuild while someone is typing in one of these boxes
  if (box.contains(document.activeElement) && box.dataset.sig === gaps.map(g => g.tok).join("|")) return;
  box.dataset.sig = gaps.map(g => g.tok).join("|");
  const whereText = g => g.where === "salutation" ? "In the greeting" : g.where === "signoff" ? "In the sign-off" : `In paragraph ${g.where + 1}`;
  const clip = t => t.length > 160 ? t.slice(0, 157) + "…" : t;
  box.innerHTML = `<div class="cl-finish" role="region" aria-label="To finish your letter">
    <h3>To finish your letter</h3>
    <p>The letter needs ${gaps.length === 1 ? "one detail" : gaps.length + " details"} it couldn't find in your resume or the details at the top. Add ${gaps.length === 1 ? "it" : "them"}, or leave ${gaps.length === 1 ? "it" : "them"} out.</p>
    ${gaps.map((g, i) => `<div class="cl-miss">
      <label class="field" for="clGap${i}">${esc(g.ph ? g.ph.label : g.tok.slice(1, -1))}<input type="text" id="clGap${i}" data-i="${i}" autocomplete="off" placeholder="${esc(g.ph && g.ph.field === "clAvail" ? "e.g. from 1 December" : "")}"></label>
      <button class="btn primary" type="button" data-fill="${i}">Add</button>
      <button class="btn ghost" type="button" data-drop="${i}">Leave it out</button>
      <div class="where">${esc(whereText(g))}: “${esc(clip(g.sentence))}”</div>
    </div>`).join("")}
  </div>`;
  const fill = i => {
    const g = gaps[i], v = $("clGap" + i).value.trim();
    if (!v) { $("clGap" + i).focus(); return; }
    if (g.ph && g.ph.set) {
      // a known detail: save it to the matching field too, so the letterhead and any later letter use it
      g.ph.set(ctx, v);
      if (g.ph.field) { $(g.ph.field).value = v; $(g.ph.field).dataset.auto = "0"; renderReady(); }
      polishDraft(d, ctx);
    }
    const swap = t => t.split(g.tok).join(v);
    d.salutation = swap(d.salutation); d.signoff = swap(d.signoff);
    d.paragraphs.forEach(p => { p.text = swap(p.text); });
    renderCover();
  };
  const drop = i => {
    const g = gaps[i];
    if (g.where === "salutation") d.salutation = ctx.recipient ? `Dear ${ctx.recipient},` : "Dear Hiring Manager,";
    else if (g.where === "signoff") d.signoff = "Yours sincerely,";
    // take out the sentence the gap sits in, wherever it appears
    d.paragraphs.forEach(p => { p.text = sentencesOf(p.text).filter(x => !x.includes(g.tok)).join(" ").trim(); });
    d.paragraphs = d.paragraphs.filter(p => p.text);
    renderCover();
  };
  box.querySelectorAll("[data-fill]").forEach(b => b.addEventListener("click", () => fill(+b.dataset.fill)));
  box.querySelectorAll("[data-drop]").forEach(b => b.addEventListener("click", () => drop(+b.dataset.drop)));
  box.querySelectorAll("input[data-i]").forEach(inp => inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); fill(+inp.dataset.i); } }));
}
// The breakdown, above the preview: each card is one paragraph; point at it to see it on the left and in the preview, select it to edit it
function renderBreakdown() {
  const el = $("clBreak"), d = cover.draft, ctx = cover.ctx;
  if (!el || !d) return;
  const checks = letterChecks(d, ctx);
  // checked live, so edits that move work to the wrong employer are caught too
  for (const iss of attributionIssues(d, ctx)) if (checks[iss.pi]) checks[iss.pi].flags.push(iss.user);
  d.paragraphs.forEach((p, i) => { const toks = p.text.match(TOKEN_RE); if (toks && checks[i]) checks[i].flags.push(`Has a gap to fill: ${[...new Set(toks)].join(", ")}.`); });
  d.paragraphs.forEach((p, i) => { const c = contactIn(p.text, p.part); if (c && checks[i]) checks[i].flags.push(`Includes "${c}". Your contact details are already in the letter head, so leave them out.`); });
  const text = d.paragraphs.map(p => p.text).join(" ");
  const wc = wordCount(text), r = letterRange();
  ctx.range = r;
  const inLetter = skillSet(text);
  const keySkills = ctx.have.filter(x => x.priority === "Required" || x.rel >= 0.8);
  const covered = keySkills.filter(x => inLetter.has(x.name));
  const notYet = keySkills.filter(x => !inLetter.has(x.name));
  // the craft rules: clichés, AI-sounding habits, sentence openings, long sentences, figures that aren't yours
  const quality = coverQuality(d.paragraphs.map(p => p.text), [ctx.resume, ...ctx.letters, ctx.why, ctx.avail, ctx.title, ctx.company, ctx.jd, ctx.plan && ctx.plan.salary].join("\n"), { allowSalary: !!(ctx.plan && ctx.plan.salary) });
  const flagCount = checks.reduce((a, c) => a + c.flags.length, 0) + quality.length;
  document.querySelectorAll("#clParts .lt-part").forEach((p, i) => p.classList.toggle("flagged", !!(checks[i] && checks[i].flags.length)));
  d.paragraphs.forEach((p, i) => { const w = $("clw-" + i); if (w) { const n = wordCount(p.text), min = partMin(p.part, r); w.textContent = `${n} words · aim for about ${partTarget(p.part, r)}${n < min ? " (a little short)" : ""}`; } });
  const gaps = missingTokens(d).length;
  const sc = letterScore(d.paragraphs, r, wc, gaps, quality, true), se = $("clScore");
  if (se) se.innerHTML = `Cover letter strength: <span style="color:${sc >= 80 ? "var(--good)" : sc >= 60 ? "var(--accent)" : "var(--warn)"}">${sc}/100</span>`;
  el.innerHTML = `
    <h3>Breakdown</h3>
    <div class="cl-stats">
      <div class="cl-stat"><b>${keySkills.length ? `${covered.length}/${keySkills.length}` : "–"}</b><span>${keySkills.length ? "key skills from the ad" : "key skills matched. Place your skills in step 4 first"}</span></div>
      <div class="cl-stat"><b>${wc}</b><span>words${wc < r[0] ? `, aim for ${r[0]} to ${r[1]}` : wc <= r[1] ? `, fits one page (${r[0]} to ${r[1]})` : `, trim it to ${r[1]} or fewer`}</span></div>
      <div class="cl-stat"><b style="color:${flagCount ? "var(--warn)" : "var(--good)"}">${flagCount}</b><span>thing${flagCount === 1 ? "" : "s"} to check</span></div>
    </div>
    ${letterSkillReview(d)}
    ${notYet.length ? `<div class="cl-gaps"><b>Key skills you have but haven't mentioned</b><div class="chips">${notYet.map(x => `<span class="chip missing" title="${esc(x.priority)}">${esc(x.name)}</span>`).join("")}</div><span class="small muted">Work one or two in if there's room. You don't need all of them.</span></div>` : ""}`;
  const tg = $("clTarget"); if (tg) tg.textContent = typeof ltFitW !== "undefined" && ltFitW ? `About ${ltFitW} words fit on one page at your spacing and margins. Aim for ${r[0]} to ${r[1]} words in all, shared out between the paragraphs.` : `Aim for ${r[0]} to ${r[1]} words in all.`;
  // what's wrong with a paragraph is shown under its box on the left
  d.paragraphs.forEach((p, i) => { const f = $("clf-" + i); if (f) f.innerHTML = ((checks[i] && checks[i].flags) || []).map(x => `<div class="cl-flag">${esc(x)}</div>`).join("") + (p.repaired ? `<div class="cl-note">The AI credited this work to the wrong job, so this paragraph was rebuilt from your resume.</div>` : ""); });
  // the craft check, below the sign-off
  const ck = $("clChecks");
  if (ck) {
    const row = (cls, title, detail, acts) => `<li class="ck"><span class="ico ${cls}"></span><div><div class="title">${title}</div><div class="detail">${detail}</div>${acts ? `<div class="ck-acts">${acts}</div>` : ""}</div></li>`;
    const goBtn = i => `<button class="linkish" type="button" data-tk="go:${i}">Go to paragraph ${i + 1}</button>`;
    const flagRows = d.paragraphs.flatMap((p, i) => ((checks[i] && checks[i].flags) || []).map(f => row("warn", `Paragraph ${i + 1}: ${esc(partOf(p.part).label.toLowerCase())}`, esc(f), goBtn(i))));
    const qualityRows = quality.map(q => { const w = q.where || [], kind = q.fix === "dash" || q.fix === "exclaim" ? q.fix : "go"; return row("warn", esc(q.title), esc(q.detail), w.slice(0, 4).map(i => kind === "go" ? goBtn(i) : `<button class="btn" type="button" data-tk="${kind}:${i}">${kind === "dash" ? "Fix the dashes in" : "Fix the marks in"} paragraph ${i + 1}</button>`).join("")); }).join("");
    ck.innerHTML = `<h3 class="ck-head">Before you send it</h3><p class="small muted">Select a button to jump to the paragraph, or to fix just that one thing.</p><ul class="checks lt-checklist">
      ${row(wc >= r[0] && wc <= r[1] ? "pass" : "warn", `${wc} words`, wc < r[0] ? `A little short. About ${r[0]} to ${r[1]} words fill one page at your spacing and margins.` : wc <= r[1] ? `Fits one page (${r[0]} to ${r[1]} words).` : `Trim it to ${r[1]} words or fewer so it fits on one page.`, "")}
      ${row(gaps ? "warn" : "pass", gaps ? `${gaps} gap${gaps === 1 ? "" : "s"} to fill` : "No gaps left", gaps ? "Fill each one above before you download the letter." : "Nothing is left to fill in.", "")}
      ${flagRows}${qualityRows}
      ${quality.length ? "" : row("pass", "Reads like you wrote it", "No clichés, long dashes or repeated openings.", "")}
    </ul>`;
  }
}
// The letter as an email: a subject line, no letter head or date, and the resume attached in the close
function coverEmailText() {
  const L = letterParts(cover.draft, cover.ctx), paras = L.paragraphs.slice();
  if (paras.length) paras[paras.length - 1] = "My resume is attached. " + paras[paras.length - 1];
  const subject = LR.emailSubject(cover.ctx.title, L.name, lrAdRef(cover.ctx.jd));
  return [`Subject: ${subject}`, "", L.salutation, "", ...paras.flatMap(p => [p, ""]), L.signoff, L.name, cover.ctx.cand.phone || ""].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function coverPlainText() {
  const L = letterParts(cover.draft, cover.ctx);
  return [L.name, L.contact.join(" | "), "", L.date, "", ...L.recipient, "", L.re, "", L.salutation, "", ...L.paragraphs.flatMap(p => [p, ""]), L.signoff, "", L.signName].join("\n");
}

// --- Word and PDF files, in the same design as your resume (see letterStyle in 23a) ---
const DEFAULT_LETTER_STYLE = { body: "Calibri", head: "Calibri", accent: "#1F3A5F", caps: true, track: 30, align: "left", look: "rule", pdf: "helvetica", pdfHead: "helvetica", name: "Professional", lh: 1, gap: 1, mm: 23 };
async function buildCoverDocx(L, st = DEFAULT_LETTER_STYLE) {
  await loadScript(JSZIP);
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const hex = h => String(h).replace("#", "").toUpperCase();
  const A = hex(st.accent), band = st.look === "band";
  const run1 = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="${o.font || st.body}" w:hAnsi="${o.font || st.body}" w:cs="${o.font || st.body}"/>${o.b ? "<w:b/>" : ""}<w:color w:val="${o.color || "1E2533"}"/>${o.sp ? `<w:spacing w:val="${o.sp}"/>` : ""}<w:sz w:val="${o.sz || 22}"/>${o.hl ? '<w:highlight w:val="yellow"/>' : ""}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  // any gap left in [brackets] is highlighted yellow in the Word file, so it can't be sent by accident
  const run = (t, o = {}) => String(t).split(new RegExp("(" + GAP_SRC + ")")).filter(Boolean).map(seg => run1(seg, { ...o, hl: /^[\[{].*[\]}]$/.test(seg) })).join("");
  const LH = st.lh || 1, GAP = st.gap || 1;
  const para = (runs, o = {}) => `<w:p><w:pPr>${o.pbdr || ""}${o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>` : ""}<w:spacing w:before="${o.before || 0}" w:after="${Math.round((o.after ?? 0) * (o.keepGap ? 1 : GAP))}" w:line="${Math.round((o.line || 276) * LH)}" w:lineRule="auto"/>${o.ind ? `<w:ind w:left="${o.ind}" w:right="${o.ind}"/>` : ""}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ""}</w:pPr>${runs}</w:p>`;
  const jc = st.align === "center" ? "center" : "";
  const nameText = st.caps ? L.name.toUpperCase() : L.name;
  const body = [];
  if (band) {
    body.push(para(run(nameText, { b: true, sz: 34, color: "FFFFFF", sp: st.caps ? st.track : 0, font: st.head }), { shd: A, before: 0, after: 0, jc, ind: 120 }));
    body.push(para(run(L.contact.join("   |   "), { sz: 19, color: "FFFFFF" }), { shd: A, after: 360, jc, ind: 120 }));
  } else {
    const side = st.look === "side" ? `<w:pBdr><w:left w:val="single" w:sz="36" w:space="10" w:color="${A}"/></w:pBdr>` : "";
    body.push(para(run(nameText, { b: true, sz: 34, color: A, sp: st.caps ? st.track : 0, font: st.head }), { after: 40, jc, pbdr: side }));
    body.push(para(run(L.contact.join("   |   "), { sz: 19, color: "5B6474" }), { after: 360, jc, pbdr: `<w:pBdr>${st.look === "side" ? `<w:left w:val="single" w:sz="36" w:space="10" w:color="${A}"/>` : ""}<w:bottom w:val="single" w:sz="8" w:space="6" w:color="${A}"/></w:pBdr>` }));
  }
  body.push(para(run(L.date), { after: 240 }));
  (L.recipient || []).forEach((r, i) => body.push(para(run(r), { after: i === L.recipient.length - 1 ? 240 : 0 })));
  // (a letter written on the Create or edit cover letter page has no inside address, and the greeting comes before the Re: line)
  if (L.greetFirst) { body.push(para(run(L.salutation), { after: 200 })); if (L.re) body.push(para(run(L.re, { b: true }), { after: 200 })); }
  else { if (L.re) body.push(para(run(L.re, { b: true }), { after: 240 })); body.push(para(run(L.salutation), { after: 200 })); }
  for (const p of L.paragraphs) body.push(para(run(p), { after: 200, jc: "both" }));
  body.push(para(run(L.signoff), { before: 80, after: 600 }));
  body.push(para(run(L.signName, { b: true })));
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${Math.round((st.mm || 23) * 56.7)}" w:right="${Math.round((st.mm || 23) * 56.7)}" w:bottom="${Math.round((st.mm || 23) * 56.7)}" w:left="${Math.round((st.mm || 23) * 56.7)}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const zip = new window.JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file("word/document.xml", docXml);
  return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
}
async function buildCoverPdf(L, st = DEFAULT_LETTER_STYLE) {
  await loadScript(JSPDF);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  // The built-in PDF fonts cover basic Latin; swap typographic marks they can't show
  const safe = s => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x00-\xFF]/g, "");
  const rgb = h => { const n = parseInt(String(h).replace("#", ""), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const [ar, ag, ab] = rgb(st.accent);
  const M = st.mm || 23, W = 210 - 2 * M, LH = 5.2 * (st.lh || 1), PGAP = 3.6 * (st.gap || 1), center = st.align === "center", band = st.look === "band", side = st.look === "side";
  const X = center ? 105 : M + (side ? 4 : 0), opt = center ? { align: "center" } : {};
  let y = 24;
  const ensure = h => { if (y + h > 297 - 20) { doc.addPage(); y = 22; } };
  const nameText = safe(st.caps ? L.name.toUpperCase() : L.name);
  // contact details wrap between items, so a line never starts with a separator
  doc.setFont(st.pdf, "normal"); doc.setFontSize(9);
  const contactLines = [];
  for (const c of L.contact.map(safe)) { const cur = contactLines[contactLines.length - 1]; if (cur && doc.getTextWidth(cur + "   |   " + c) <= W - (side ? 4 : 0)) contactLines[contactLines.length - 1] = cur + "   |   " + c; else contactLines.push(c); }
  if (band) { doc.setFillColor(ar, ag, ab); doc.rect(0, 0, 210, 18 + contactLines.length * 4.2 + 6, "F"); }
  if (side) { doc.setFillColor(ar, ag, ab); doc.rect(M, 18.5, 1.6, 7 + contactLines.length * 4.2, "F"); }
  doc.setFont(st.pdfHead, "bold"); doc.setFontSize(17);
  if (band) doc.setTextColor(255, 255, 255); else doc.setTextColor(ar, ag, ab);
  doc.text(nameText, X, y, { ...opt, charSpace: st.caps ? 0.4 : 0 }); y += 6;
  doc.setFont(st.pdf, "normal"); doc.setFontSize(9);
  if (band) doc.setTextColor(255, 255, 255); else doc.setTextColor(91, 100, 116);
  for (const line of contactLines) { doc.text(line, X, y, opt); y += 4.2; }
  if (band) y += 8;
  else { y += 1.5; doc.setDrawColor(ar, ag, ab); doc.setLineWidth(0.5); doc.line(M, y, M + W, y); y += 9; }
  doc.setFontSize(10.5); doc.setTextColor(30, 37, 51); doc.setFont(st.pdf, "normal");
  doc.text(safe(L.date), M, y); y += LH * 2;
  for (const r of L.recipient || []) { doc.text(safe(r), M, y); y += LH; }
  if (L.recipient && L.recipient.length) y += LH;
  const reLine = () => { if (L.re) { doc.setFont(st.pdf, "bold"); doc.text(safe(L.re), M, y); y += LH * 2; doc.setFont(st.pdf, "normal"); } };
  if (L.greetFirst) { doc.text(safe(L.salutation), M, y); y += LH * 1.8; reLine(); }
  else { reLine(); doc.text(safe(L.salutation), M, y); y += LH * 1.8; }
  for (const p of L.paragraphs) {
    const lines = doc.splitTextToSize(safe(p), W);
    ensure(lines.length * LH);
    doc.text(lines, M, y, { lineHeightFactor: 1.45 * (st.lh || 1), maxWidth: W, align: "justify" });
    y += lines.length * LH + PGAP;
  }
  ensure(LH * 5);
  y += 1; doc.text(safe(L.signoff), M, y); y += LH * 3.2;
  doc.setFont(st.pdf, "bold"); doc.text(safe(L.signName), M, y);
  return doc.output("blob");
}
async function downloadCover(kind) {
  const status = $("clStatus"), btn = $("clDl");
  const L = letterParts(cover.draft, cover.ctx);
  const name = `${(L.signName || "Cover").replace(/[\\/:*?"<>|]+/g, "")} - Cover Letter - ${cover.ctx.title}`.replace(/[\\/:*?"<>|]+/g, "").slice(0, 150) + "." + kind;
  btn.disabled = true;
  status.textContent = `Preparing your ${{ pdf: "PDF", txt: "text file" }[kind] || "Word file"}…`;
  try {
    const st = currentLetterStyle();
    const blob = kind === "txt" ? new Blob([coverPlainText()], { type: "text/plain;charset=utf-8" }) : kind === "pdf" ? await buildCoverPdf(L, st) : await buildCoverDocx(L, st);
    status.textContent = "Confirm the download in the prompt…";
    await saveFile(name, blob);
    status.textContent = `Downloaded ${name}.`;
    cover.downloaded = true;
    updateFlow();
  } catch (e) {
    const code = e && e.code;
    status.textContent = code === "declined" ? "Download cancelled." : code === "rate_limited" ? "A download prompt is already open. Finish that one first." : "Couldn't create the file. Try again, or use Copy text.";
  } finally { btn.disabled = false; }
}

const coverJobKey = () => lastScan ? lastScan.jd + "\n" + lastScan.title : "";
// opts.auto: the letter is being written because the page opened (not because a button was pressed)
async function generateCover(opts) {
  const out = $("clOut"), btn = $("clGenerate"), auto = !!(opts && opts.auto === true);
  if (!lastResult || cover.writing) return;
  if (!$("clName").value.trim()) { readyEdit = "clName"; renderReady(); $("clEngine").textContent = "Add your name first."; return; }
  const notice = lrAdNotice(LR.adInstructions(lastScan.jd));
  if (notice && cover.adOkFor !== coverJobKey()) {
    out.innerHTML = `<div class="panel lr-notice" role="status"><p>${esc(notice)}</p><div class="b-actions"><button class="btn" type="button" id="clAdGo">Write a letter anyway</button></div></div>`;
    $("clAdGo").addEventListener("click", () => { cover.adOkFor = coverJobKey(); generateCover(); }, { once: true });
    return;
  }
  cover.writing = true;
  if ($("clPaste").value.trim() && wordCount($("clPaste").value) >= 40) {
    const pasted = $("clPaste").value.trim();
    if (!cover.letters.some(l => l.text === pasted)) { cover.letters = [{ name: "Pasted letter", text: pasted, added: new Date().toISOString() }, ...cover.letters].slice(0, 3); renderLetterFiles(); }
    $("clPaste").value = "";
  }
  await saveCoverStore(); renderLetterFiles();
  const ctx = coverContext();
  btn.disabled = true;
  const progress = m => { out.innerHTML = `<p class="progress">${esc(m)}</p>`; };
  progress("Writing your cover letter…");
  try {
    cover.ctx = ctx;
    cover.draft = await writeCover(ctx, progress);
    cover.draftFor = coverJobKey();
    cover.downloaded = false;
    renderCover();
    updateFlow();
    if (!auto) $("clOut").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  } finally { btn.disabled = false; cover.writing = false; }
}
async function describeCoverEngine() {
  const st = await chromeAIState();
  $("clEngine").textContent = smallEngine() ? `Written by ${SMALL()}, ${smallWhere()}, one short step at a time.${smallEngine() === "key" ? "" : " The corner shows roughly how long is left."}`
    : st === "available" ? `Written by ${BROWSER_AI()}, on this device.`
    : (st === "downloadable" || st === "downloading") ? BROWSER_AI() + " is tried first, then " + (sample ? AI_NAME() : "the template") + "."
    : sample ? "Written by " + AI_NAME() + ". Takes about a minute."
    : "No AI on this page, so the letter is assembled from your resume and the ad. You can edit every paragraph.";
}

