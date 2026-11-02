/* ===================== Tailor to a job: fit the job's criteria (its own step, before the cover letter) ===================== */
// Each selection criterion and must-have from the ad, matched to the best line in your resume, with a sentence
// you can use in the letter. Then a few quick questions with answers to click, so the letter is easier to write.
// var, not const: the page flow (06) checks it before this file has run
var fit = { items: [], key: "", done: false, chips: { why: [], interest: [], bring: [], avail: "", source: "" }, own: { why: "", interest: "" }, availDate: "" };
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
  return items.map((it, k) => ({ ...it, id: k, say: fitSentence(it.ev, it.names), state: "" }));
}
function renderFit() {
  const box = $("fitBody");
  if (!box || !lastResult) return;
  const key = lastScan.jd + "\n" + finalText().slice(0, 300);
  if (fit.key !== key) { fit.key = key; fit.items = buildFit(); fit.done = false; fit.chips = { why: [], interest: [], bring: [], avail: fit.chips.avail, source: fit.chips.source }; }
  const crit = fit.items.filter(x => x.kind !== "Must-have"), must = fit.items.filter(x => x.kind === "Must-have");
  const withEv = crit.filter(x => x.say).length, used = crit.filter(x => x.state === "yes").length;
  const item = x => `<li class="fit-item${x.state ? " " + x.state : ""}" data-fit-id="${x.id}">
    <div class="fit-head"><span class="chk-act">${esc(x.kind)}</span><span class="fit-crit">${esc(x.text)}</span></div>
    ${x.say ? `<p class="fit-ev">${x.ev.kind === "edu" ? "Your qualification" : "Your best evidence"}: <q>${esc(x.ev.text)}</q>${x.ev.where ? ` <span class="muted">(${esc(x.ev.where.replace(/\s+·\s+/, ", "))})</span>` : ""}</p>
      <p class="fit-say" contenteditable="true" spellcheck="true" data-fit-say="${x.id}" aria-label="Sentence for your letter about: ${esc(x.text)}">${esc(x.say)}</p>
      <div class="b-actions">${x.state === "yes" ? '<span class="chip found">In your letter</span><button class="linkish" type="button" data-fit-act="undo">Take it out</button>' : x.state === "no" ? '<span class="small muted">Skipped</span><button class="linkish" type="button" data-fit-act="undo">Undo</button>' : '<button class="btn primary" type="button" data-fit-act="yes">Use in my letter</button><button class="btn" type="button" data-fit-act="no">Skip</button>'}${x.via ? `<span class="small muted">Written by ${esc(viaWords(x.via))}</span>` : ""}</div>`
      : `<p class="fit-gap"><b>Not shown in your resume yet.</b> ${esc(x.gap && GAP_Q[x.gap.name] ? GAP_Q[x.gap.name] : `Think of a time you showed this at work, study or volunteering. Add it as a bullet point in your resume, or mention it in the letter in your own words.`)}</p>`}
  </li>`;
  const mustItem = m => `<li class="fit-item${m.you === "yes" ? " yes" : ""}"><div class="fit-head"><span class="chk-act">${esc(m.kind)}</span><span class="fit-crit">${esc(m.text)}</span><span class="small muted">${esc(YOU_WORDS[m.you] || "")}</span></div>${m.quote ? `<p class="fit-ev"><q>${esc(m.quote)}</q></p>` : ""}${m.note ? `<p class="small">${esc(m.note)}</p>` : ""}</li>`;
  const chips = (q, opts, multi) => `<div class="opt-chips" role="group">${opts.map(o => { const on = multi ? fit.chips[q].includes(o.v) : fit.chips[q] === o.v; return `<button type="button" class="opt-chip" data-fitq="${q}" data-v="${esc(o.v)}" aria-pressed="${on}">${esc(o.label)}</button>`; }).join("")}</div>`;
  const why = whyOptions(), interest = interestOptions(), bring = bringOptions(), co = $("clCompany").value.trim() || companyFrom(lastScan.jd) || "this company";
  box.innerHTML = `<div class="fit-summary"><span><b>${crit.length}</b> ${crit.length === 1 ? "thing" : "things"} the ad asks for</span><span><b>${withEv}</b> backed up by your resume</span><span><b>${used}</b> in your letter</span>${withEv > used ? '<button class="btn" type="button" data-fit-act="all">Use all of them</button>' : ""}</div>
    ${crit.length ? `<ul class="fit-list">${crit.map(item).join("")}</ul>` : `<p class="small muted">This ad doesn't list its criteria, so your letter will follow the skills it asks for.</p>`}
    ${withEv ? `<div class="b-actions"><button class="btn" type="button" id="fitAi">Make these sentences stronger with AI</button><span class="engine-note" id="fitAiNote" role="status"></span></div>` : ""}
    ${must.length ? `<div class="b-sub">Must-haves to apply</div><ul class="fit-list">${must.map(mustItem).join("")}</ul>` : ""}
    <div class="b-sub">A few quick questions</div><p class="q-hint">Click the answers that are true for you. They go straight into your letter, so it sounds like you chose this job on purpose.</p>
    <div class="fit-qs">
      <div class="fit-q"><b>Why ${esc(co)}?</b>${chips("why", why, true)}<textarea id="fitWhyOwn" rows="2" spellcheck="true" placeholder="Or say it in your own words, e.g. I've used their app for years and want to help build it">${esc(fit.own.why)}</textarea></div>
      ${interest.length ? `<div class="fit-q"><b>What interests you most about the role?</b>${chips("interest", interest, true)}<textarea id="fitInterestOwn" rows="2" spellcheck="true" placeholder="Or in your own words">${esc(fit.own.interest)}</textarea></div>` : ""}
      ${bring.length ? `<div class="fit-q"><b>What will you bring that they asked for?</b><p class="q-hint">Pick two or three. They lead your opening paragraph.</p>${chips("bring", bring, true)}</div>` : ""}
      <div class="fit-q"><b>When can you start?</b>${chips("avail", FIT_AVAIL.map(([v, l]) => ({ v, label: l })), false)}${fit.chips.avail === "date" ? `<input type="date" id="fitAvailDate" value="${esc(fit.availDate)}" min="${todayISO()}" aria-label="Start date">` : ""}</div>
      <div class="fit-q"><b>Where did you see the ad?</b>${chips("source", FIT_SOURCE.map(v => ({ v, label: v[0].toUpperCase() + v.slice(1) })), false)}</div>
    </div>`;
}
// The answers, as the words the letter uses
function fitWhyText() { return [...fit.chips.why, fit.own.why.trim().replace(/^because\s+/i, "").replace(/[.\s]+$/, "")].filter(Boolean).slice(0, 3); }
function fitAvailText() {
  if (fit.chips.avail === "date") { if (!fit.availDate) return ""; const d = new Date(fit.availDate + "T00:00:00"); return isNaN(d) ? "" : `from ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; }
  return fit.chips.avail;
}
function fitToLetter() {
  const why = fitWhyText();
  if (why.length) { $("clWhy").value = listJoin(why); $("clWhy").dataset.auto = "0"; }
  const av = fitAvailText(); if (av) $("clAvail").value = av;
  if (fit.chips.source) $("clSource").value = fit.chips.source;
  renderReady();
}
// For the letter: the criteria sentences chosen, what interests them and what they bring
const fitForCover = () => ({
  fit: fit.items.filter(x => x.state === "yes" && val(x.say)).map(x => ({ criterion: x.text, say: x.say.trim(), ev: x.ev ? x.ev.text : "" })).filter((x, k, a) => a.findIndex(y => norm(y.say) === norm(x.say)) === k),
  interest: [...fit.chips.interest, fit.own.interest.trim().replace(/[.\s]+$/, "")].filter(Boolean).slice(0, 2),
  bring: fit.chips.bring.slice(0, 3)
});
const FIT_NANO = `You write one sentence for a cover letter that shows how the candidate meets one selection criterion.
Rules:
1. Use only the evidence given. Never invent tasks, tools, numbers, employers or results.
2. First person ("I"), past tense for past work, Australian spelling, 18 to 40 words.
3. Name the employer when the evidence gives one, and link the work to what the criterion asks for.
4. No clichés ("passionate", "team player", "hard-working") and no placeholders.
Reply with JSON only: {"sentence": "..."}`;
const FIT_EXAMPLES = [[
  `Criterion: Strong customer service and communication skills
Evidence: Served up to 80 customers a shift and resolved complaints calmly (Retail Assistant · Bright Shoes)`,
  { sentence: "At Bright Shoes, I served up to 80 customers a shift and resolved complaints calmly, which built the clear, patient communication this role calls for." }
]];
async function fitStronger(btn) {
  const note = $("fitAiNote"), todo = fit.items.filter(x => x.ev && x.state !== "no").slice(0, 6);
  if (!todo.length) return;
  btn.disabled = true; note.classList.add("busy");
  let n = 0, last = null;
  try {
    for (const [k, x] of todo.entries()) {
      note.textContent = `Writing ${k + 1} of ${todo.length}…`;
      const src = [x.ev.text, x.ev.where, x.text].join("\n");
      const r = await aiJSON({ nano: FIT_NANO, examples: FIT_EXAMPLES, prompt: `Criterion: ${x.text}\nEvidence: ${x.ev.text}${x.ev.where ? ` (${x.ev.where})` : ""}`, schema: { type: "object", properties: { sentence: { type: "string" } }, required: ["sentence"] }, label: "Writing", progress: m => { note.textContent = `${m} (${k + 1} of ${todo.length})`; },
        check: d => { const t = stripMarkup(String(d.sentence || "")).replace(/\s+/g, " ").trim(); const why = factCheck(t, src, { years: true, min: 12, max: 45 }); return why ? { ok: false, why } : keepsFacts(x.ev.text, t) < 0.5 ? { ok: false, why: "keep the facts from the evidence" } : { ok: true, value: /[.!?]$/.test(t) ? t : t + "." }; } });
      last = r;
      if (r.data) { x.say = r.data; x.via = r.via; n++; }
    }
  } finally { btn.disabled = false; note.classList.remove("busy"); }
  renderFit();
  const n2 = $("fitAiNote"); if (n2) n2.textContent = n ? `Rewrote ${n} sentence${n === 1 ? "" : "s"}. Check each is true, then use the ones you like.` : aiMissWords(last);
}
// Wiring (this runs before the app shell, so it's wired directly, like the rest of Tailor to a job)
$("fitBody").addEventListener("click", e => {
  const t = e.target;
  const q = t.closest("[data-fitq]");
  if (q) {
    const k = q.dataset.fitq, v = q.dataset.v;
    if (Array.isArray(fit.chips[k])) fit.chips[k] = fit.chips[k].includes(v) ? fit.chips[k].filter(x => x !== v) : [...fit.chips[k], v];
    else fit.chips[k] = fit.chips[k] === v ? "" : v;
    const y = window.scrollY; renderFit(); window.scrollTo(0, y);
    if (k === "avail" && v === "date") { const d = $("fitAvailDate"); if (d) d.focus(); }
    return;
  }
  const a = t.closest("[data-fit-act]");
  if (a) {
    const y = window.scrollY;
    if (a.dataset.fitAct === "all") fit.items.forEach(x => { if (x.say && x.state !== "no") x.state = "yes"; });
    else { const li = a.closest("[data-fit-id]"), x = li && fit.items[+li.dataset.fitId]; if (x) x.state = a.dataset.fitAct === "undo" ? "" : a.dataset.fitAct; }
    renderFit(); window.scrollTo(0, y); updateFlow(); return;
  }
  if (t.closest("#fitAi")) fitStronger(t.closest("#fitAi"));
});
$("fitBody").addEventListener("input", e => {
  const t = e.target;
  if (t.dataset && t.dataset.fitSay != null) { const x = fit.items[+t.dataset.fitSay]; if (x) x.say = t.textContent.replace(/\s+/g, " ").trim(); }
  if (t.id === "fitWhyOwn") fit.own.why = t.value;
  if (t.id === "fitInterestOwn") fit.own.interest = t.value;
  if (t.id === "fitAvailDate") fit.availDate = t.value;
});
$("fitNext").addEventListener("click", () => { fitToLetter(); fit.done = true; prefillCover(); updateFlow(); goTo("sec-cover"); });
