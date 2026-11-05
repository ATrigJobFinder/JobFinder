/* ===================== Tailor to a job: fit the job's criteria (its own step, before the cover letter) ===================== */
// Each selection criterion from the ad is matched to the best line in your resume, with a sentence the letter can use (nothing to pick: they all
// go to the letter). This page shows the must-haves (green, yellow or red) and a few quick questions with answers to click, so the letter is easier to write.
// var, not const: the page flow (06) checks it before this file has run
var fit = { items: [], key: "", jd: "", done: false, text: { why: "", interest: "", bring: "", avail: "", source: "" }, dateOn: false, availDate: "" };
const FIT_AVAIL = [["immediately", "Immediately"], ["after two weeks' notice", "After two weeks' notice"], ["after four weeks' notice", "After four weeks' notice"], ["full time over the summer break", "Full time over summer"], ["part time while I complete my studies", "Part time while I study"], ["date", "From a date…"]];
const FIT_SOURCE = ["SEEK", "LinkedIn", "Indeed", "Jora", "GradConnection", "Prosple", "your careers page", "my university's careers portal"];
// Reasons to choose this company, from the ad's own words and the company's careers pages
function whyOptions() {
  const jd = (lastScan && lastScan.jd) || "", g = guideForCover(), n = lastResult && lastResult.needs, out = [];
  const add = (v, label) => { if (v && !out.some(o => o.v === v)) out.push({ v, label: label || v }); };
  if (g && g.purpose) add(`its purpose, ${lowerFirst(g.purpose.replace(/[.\s]+$/, ""))}, matters to me`, `Its purpose: ${g.purpose.replace(/[.\s]+$/, "")}`);
  for (const v of [...((n && n.values) || []).map(x => x.name), ...((g && g.values) || [])].slice(0, 4)) add(`it values ${lowerFirst(v)}`, `It values ${lowerFirst(v)}`);
  const RULES = [
    [/graduate (program|programme)|development program|rotation/i, "its graduate program builds real skills through structured rotations", "The graduate program"],
    [/training|learning|mentor|coaching|development opportunit/i, "it offers training and mentoring to help people grow", "Training and mentoring"],
    [/career (progression|path|growth)|progression|grow your career|promot/i, "there are clear paths to grow a career", "Room to grow a career"],
    [/flexib|hybrid|work from home|remote/i, "it supports flexible and hybrid working", "Flexible working"],
    [/sustainab|renewable|net zero|climate|environment/i, "its work on sustainability matters to me", "Its work on sustainability"],
    [/safety|safe work|zero harm/i, "it puts safety first", "Its safety culture"],
    [/divers|inclusi|belong/i, "it is committed to diversity and inclusion", "Diversity and inclusion"],
    [/innovat|technolog|digital|data/i, "it uses new technology to do things better", "Its use of new technology"],
    [/communit|customer|patient|client|people we serve/i, "its work makes a real difference to the people it serves", "The difference its work makes"],
    [/award|leading|largest|best|top employer|trusted/i, "it has a strong reputation as an employer", "Its reputation as an employer"],
    [/project|infrastructure|build|delivery/i, "the projects it works on interest me", "The projects it works on"]
  ];
  for (const [re, v, l] of RULES) if (re.test(jd)) add(v, l);
  add("its values match my own", "Its values match mine");
  add("it has a strong reputation in the industry", "Its reputation in the industry");
  return out.slice(0, 10);
}
// What the role involves, from the ad's duty lines: "the chance to prepare engineering drawings"
const AD_HEADING = /^(about (the|this|our|us)\b.*|what you('ll| will) (do|need|bring)|who you are|what we('re| are) looking for|what we offer|your (role|responsibilities)|key (responsibilities|duties)|responsibilities|duties|the role|about you|requirements|benefits|why join us|how to apply)\b/i;
function interestOptions() {
  const all = readJobAd((lastScan && lastScan.jd) || "").filter(L => L.kind === "duty" && !AD_HEADING.test(L.text.trim()) && !/:\s*$/.test(L.text));
  // the ad's bullet points first: they're the actual tasks
  const lines = [...all.filter(L => BULLET_RE.test(L.text)), ...all.filter(L => !BULLET_RE.test(L.text))].map(L => tidy(L.text)).filter(t => wordCount(t) >= 4);
  const out = [];
  for (const t of lines) {
    let s = t.replace(/^(you will|you'll|the role (will|involves)|responsibilities include|this includes)\s+/i, "").replace(/[.;:\s]+$/, "");
    const words = s.split(/\s+/);
    if (words.length > 12) s = words.slice(0, 12).join(" ").replace(/[,;:]$/, "") + "…";
    const v = `the chance to ${lowerFirst(s)}`;
    if (!out.some(o => o.v === v)) out.push({ v: v.replace(/…$/, ""), label: s[0].toUpperCase() + s.slice(1) });
    if (out.length >= 6) break;
  }
  const missing = lastResult ? [...lastResult.hard].filter(x => !x.found && x.priority !== "Required").slice(0, 2).map(x => x.name) : [];
  if (missing.length) out.push({ v: `the chance to learn ${listJoin(missing.map(inSentence))}`, label: `Learning ${listJoin(missing)}` });
  return out;
}
// What you'll bring: the skills the ad asks for that your resume shows
function bringOptions() {
  if (!lastResult) return [];
  const resumeSkills = skillSet(finalText());
  return [...lastResult.hard, ...lastResult.soft].filter(x => resumeSkills.has(x.name)).sort((a, b) => (b.priority === "Required") - (a.priority === "Required") || b.rel - a.rel).slice(0, 8).map(x => ({ v: x.name, label: x.name }));
}
// The resume line that best backs up a criterion
// (a line already used for another criterion counts for less, so each criterion gets its own example where there is one)
function fitEvidence(text, skills, bullets, used = new Set()) {
  const want = contentWords(text + " " + skills.join(" "));
  let top = null, score = 0;
  for (const b of bullets) {
    let s = 0;
    for (const w of contentWords(b.text)) if (want.has(w)) s++;
    s += skills.filter(x => skillSet(b.text).has(x)).length * 2 + (numsOf(b.text).length ? 0.5 : 0);
    if (s >= 2 && used.has(b.text)) s -= 1.5;
    if (s > score) { score = s; top = b; }
  }
  if (score < 2 || !top) return null;
  used.add(top.text);
  return top;
}
// "At Woolworths, I resolved help desk requests…" from the evidence line
function fitSentence(ev, names) {
  if (!ev) return "";
  // a qualification: "I am completing a Bachelor of…" or "I hold a Diploma of…"
  if (ev.kind === "edu") { const [deg, inst] = ev.text.split(/\s+·\s+|\s+\|\s+/); return `I ${ev.current ? "am completing" : "hold"} ${aOrAn(deg)} ${deg.trim()}${inst ? ` ${ev.current ? "at" : "from"} ${shortOrg(inst)}` : ""}.`; }
  // a skills or licences line ("Software: MATLAB, Python"): name what it shows
  if (ev.kind === "line") return !(names || []).length ? "" : names.every(n => /licen[cs]e|card|check|certific|ticket|first aid/i.test(n)) ? `I hold ${listJoin(names.map(n => /^[A-Z][a-z]/.test(n) && !/^(White|Blue|Working|First)/.test(n) ? lowerFirst(n) : n))}.` : `I have hands-on experience with ${listJoin(names.map(inSentence))}.`;
  const org = shortOrg(String(ev.where || "").split(/\s+·\s+|\s+\|\s+/)[1] || "");
  const t = tidy(ev.text);
  // "Designed…" → "I designed…"; a line that starts with a thing → "My experience includes…"
  const c = asClause(t) || (isActionStart(t) ? "I " + lowerFirst(startVerb(t, false)) : `my experience includes ${lowerFirst(t)}`);
  return `${org ? `At ${org}, ` : ""}${org ? c : c[0].toUpperCase() + c.slice(1)}.`;
}
function buildFit() {
  const n = lastResult && lastResult.needs;
  if (!n) return [];
  const parsed = parseResume(finalText());
  const bullets = parsed.zones.flatMap(z => (z.bullets || []).map(b => ({ text: b.text, where: z.label })));
  const items = [], used = new Set();
  const eduZ = parsed.zones.find(z => z.kind === "education");
  for (const c of n.criteria) {
    const sk = c.skills.map(s => s.name), ok = c.skills.filter(s => (s.status === "shown" || s.status === "implied") && s.line);
    let ev = fitEvidence(c.text, sk, bullets, used);
    // no bullet point stands out: use the line the check found (a skills line, the summary), or the qualification itself
    if (!ev && ok.length) {
      const s = ok.find(x => !used.has(x.line)) || ok[0], b = bullets.find(x => x.text === s.line);
      // a bullet point, or a list of skills; a sentence from the summary isn't evidence on its own
      const listy = /^[A-Za-z &/]{2,30}:/.test(s.line) || ((s.line.match(/,/g) || []).length >= 2 && !isActionStart(s.line));
      if (b || listy) { ev = b || { text: s.line, where: "", kind: "line" }; used.add(s.line); }
    }
    if (!ev && eduZ && /\b(degree|bachelor|diploma|qualification|certificate|studying|graduate|tertiary)\b/i.test(c.text)) ev = { text: eduZ.label, where: "", kind: "edu", current: /present|expected|current/i.test(parsed.lines[eduZ.headIdx] || "") };
    items.push({ kind: "Criterion", text: c.text, skills: sk, ev, names: ok.map(s => s.name), gap: c.skills.find(s => s.status === "missing" || s.status === "listed") });
  }
  if (!n.criteria.length) for (const x of [...lastResult.hard, ...lastResult.soft].filter(x => x.priority === "Required").slice(0, 6)) { const ev = fitEvidence(x.name, [x.name], bullets, used); items.push({ kind: "Asked for", text: x.name, skills: [x.name], ev, gap: x.found ? null : { name: x.name } }); }
  for (const m of n.must) items.push({ kind: "Must-have", text: m.label, quote: m.quote, you: m.you, note: m.note, skills: [], ev: null });
  return items.map((it, k) => { const say = fitSentence(it.ev, it.names); return { ...it, id: k, say, state: say && it.kind !== "Must-have" ? "yes" : "" }; });
}
// The answers are kept in their boxes. A chip adds its words to the box (and takes them out again); the box is what the letter uses.
const FIT_MULTI = new Set(["why", "interest", "bring"]);
const fitSep = k => k === "bring" ? ", " : "; ";
const fitList = k => String(fit.text[k] || "").split(k === "bring" ? /\s*[,;]\s*/ : /\s*;\s*|\n+/).map(s => s.trim()).filter(Boolean);
const fitOn = (k, v) => FIT_MULTI.has(k) ? fitList(k).includes(v) : k === "avail" && v === "date" ? fit.dateOn : fit.text[k] === v;
// show the answer in its box and the chips pressed or not, without redrawing the page (a redraw would blink every (i) on it)
function fitSync(k) {
  const box = $("fitBox-" + k);
  if (box && box.value !== fit.text[k]) box.value = fit.text[k];
  document.querySelectorAll(`#fitBody [data-fitq="${k}"]`).forEach(c => c.setAttribute("aria-pressed", String(fitOn(k, c.dataset.v))));
}
function fitChip(k, v) {
  if (FIT_MULTI.has(k)) { const l = fitList(k), i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); fit.text[k] = l.join(fitSep(k)); }
  else if (k === "avail" && v === "date") { fit.dateOn = !fit.dateOn; fit.text.avail = fit.dateOn ? fitDateWords() : ""; const d = $("fitAvailDate"); if (d) { d.hidden = !fit.dateOn; if (fit.dateOn) d.focus(); } }
  else { fit.dateOn = k === "avail" ? false : fit.dateOn; fit.text[k] = fit.text[k] === v ? "" : v; if (k === "avail") { const d = $("fitAvailDate"); if (d) d.hidden = true; } }
  fitSync(k);
}
function fitDateWords() {
  if (!fit.availDate) return "";
  const d = new Date(fit.availDate + "T00:00:00");
  return isNaN(d) ? "" : `from ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
const MH_WORDS = { yes: "You meet this", check: "Check this", no: "Probably not" };
function renderFit() {
  const box = $("fitBody");
  if (!box || !lastResult) return;
  const key = lastScan.jd + "\n" + finalText();
  const ad = $("fitAd"); if (ad && ad.dataset.jd !== lastScan.jd) { ad.textContent = lastScan.jd; ad.dataset.jd = lastScan.jd; }
  if (fit.key === key && box.dataset.built === key) return;
  if (fit.jd !== lastScan.jd) { fit.jd = lastScan.jd; fit.text = { why: "", interest: "", bring: "", avail: "", source: "" }; fit.dateOn = false; fit.availDate = ""; }
  if (fit.key !== key) { fit.key = key; fit.items = buildFit(); fit.done = false; }
  const crit = fit.items.filter(x => x.kind !== "Must-have"), must = fit.items.filter(x => x.kind === "Must-have");
  const withEv = crit.filter(x => x.say).length;
  const bubble = m => `<li class="mh-bubble you-${m.you}"><span class="mh-dot" aria-hidden="true"></span><div><div class="mh-top"><b>${esc(m.text)}</b><span class="mh-state">${esc(MH_WORDS[m.you] || "Check this")}</span></div>${m.quote ? `<q>${esc(m.quote)}</q>` : ""}${m.note ? `<p class="small">${esc(m.note)}</p>` : ""}</div></li>`;
  const chips = (q, opts) => `<div class="opt-chips" role="group">${opts.map(o => `<button type="button" class="opt-chip" data-fitq="${q}" data-v="${esc(o.v)}" aria-pressed="${fitOn(q, o.v)}">${esc(o.label)}</button>`).join("")}</div>`;
  const why = whyOptions(), interest = interestOptions(), bring = bringOptions(), co = $("clCompany").value.trim() || companyFrom(lastScan.jd) || "this company";
  const area = (k, ph) => `<textarea id="fitBox-${k}" data-fitbox="${k}" rows="2" spellcheck="true" placeholder="${esc(ph)}">${esc(fit.text[k])}</textarea>`;
  box.dataset.built = key;
  box.innerHTML = `<div class="fit-crit-note"><b>${crit.length}</b> ${crit.length === 1 ? "criterion" : "criteria"} from the ad, <b>${withEv}</b> backed up by your resume. They are used when your cover letter is written, so you don't need to do anything here.</div>
    ${must.length ? `<div class="b-sub">Must-haves to apply</div><p class="q-hint">Green: you meet it. Yellow: check it yourself. Red: you probably don't.</p><ul class="mh-list">${must.map(bubble).join("")}</ul>` : `<p class="small muted">This ad doesn't list any must-haves to apply.</p>`}
    <div class="b-sub">A few quick questions</div><p class="q-hint">Select the answers that are true for you. Each one is written into the box below it, which you can edit. They go straight into your letter, so it sounds like you chose this job on purpose.</p>
    <div class="fit-qs">
      <div class="fit-q"><b>Why ${esc(co)}?</b>${chips("why", why)}${area("why", "Or say it in your own words, e.g. I've used their app for years and want to help build it")}</div>
      ${interest.length ? `<div class="fit-q"><b>What interests you most about the role?</b>${chips("interest", interest)}${area("interest", "Or in your own words")}</div>` : ""}
      ${bring.length ? `<div class="fit-q"><b>What will you bring that they asked for?</b><p class="q-hint">Pick two or three. They lead your opening paragraph.</p>${chips("bring", bring)}${area("bring", "Or name them yourself, separated by commas")}</div>` : ""}
      <div class="fit-q"><b>When can you start?</b>${chips("avail", FIT_AVAIL.map(([v, l]) => ({ v, label: l })))}<input type="date" id="fitAvailDate" value="${esc(fit.availDate)}" min="${todayISO()}" aria-label="Start date" ${fit.dateOn ? "" : "hidden"}><input type="text" id="fitBox-avail" data-fitbox="avail" value="${esc(fit.text.avail)}" placeholder="Or type it, e.g. from 1 December" autocomplete="off"></div>
      <div class="fit-q"><b>Where did you see the ad?</b>${chips("source", FIT_SOURCE.map(v => ({ v, label: v[0].toUpperCase() + v.slice(1) })))}<input type="text" id="fitBox-source" data-fitbox="source" value="${esc(fit.text.source)}" placeholder="Or type it" autocomplete="off"></div>
    </div>`;
}
// The answers, as the words the letter uses
function fitWhyText() { return fitList("why").map(s => s.replace(/^because\s+/i, "").replace(/[.\s]+$/, "")).filter(Boolean).slice(0, 3); }
function fitAvailText() { return String(fit.text.avail || "").trim(); }
function fitToLetter() {
  const why = fitWhyText();
  if (why.length) { $("clWhy").value = listJoin(why); $("clWhy").dataset.auto = "0"; }
  const av = fitAvailText(); if (av) $("clAvail").value = av;
  const src = String(fit.text.source || "").trim(); if (src) $("clSource").value = src;
  renderReady();
}
// For the letter: every selection criterion (those the resume backs up come with a sentence), what interests them and what they bring.
// Nothing here is chosen by hand: the criteria are the ad's, and a sentence is only offered where the resume has the evidence.
const fitForCover = () => ({
  fit: fit.items.filter(x => x.kind !== "Must-have" && x.state === "yes" && val(x.say)).map(x => ({ criterion: x.text, say: x.say.trim(), ev: x.ev ? x.ev.text : "" })).filter((x, k, a) => a.findIndex(y => norm(y.say) === norm(x.say)) === k),
  criteria: fit.items.filter(x => x.kind !== "Must-have").map(x => x.text).slice(0, 10),
  interest: fitList("interest").slice(0, 2),
  bring: fitList("bring").slice(0, 3)
});
// Wiring (this runs before the app shell, so it's wired directly, like the rest of Tailor to a job)
$("fitBody").addEventListener("click", e => {
  const q = e.target.closest("[data-fitq]");
  if (q) fitChip(q.dataset.fitq, q.dataset.v);
});
$("fitBody").addEventListener("input", e => {
  const t = e.target;
  if (t.dataset && t.dataset.fitbox) {
    const k = t.dataset.fitbox; fit.text[k] = t.value;
    if (k === "avail") { fit.dateOn = false; const d = $("fitAvailDate"); if (d) d.hidden = true; }
    document.querySelectorAll(`#fitBody [data-fitq="${k}"]`).forEach(c => c.setAttribute("aria-pressed", String(fitOn(k, c.dataset.v))));
  }
  if (t.id === "fitAvailDate") { fit.availDate = t.value; fit.text.avail = fitDateWords(); fitSync("avail"); }
});
$("fitNext").addEventListener("click", () => { fitToLetter(); fit.done = true; prefillCover(); updateFlow(); goTo("sec-cover"); });
