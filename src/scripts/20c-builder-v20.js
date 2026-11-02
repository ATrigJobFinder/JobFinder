/* ===================== Version 20: resume builder additions ===================== */

/* --- Date order: jobs and qualifications, newest first --- */
const sortBtn = list => P()[list].length > 1 ? `<button class="btn" type="button" data-act="sort-date" data-list="${list}">Sort by date, newest first</button><span class="small muted sort-note" id="bSort-${list}" role="status">${sortNoteHtml(list)}</span>` : "";
function sortNoteHtml(list) {
  const n = builder.sortNote;
  return n && n.list === list ? `${esc(n.text)}${n.before ? ' <button class="linkish" type="button" data-act="sort-undo" data-list="' + list + '">Undo</button>' : ""}` : "";
}
// "Nov 2023" → a number of months; a current role counts as now; no date at all sorts last
function dateRank(s, current) {
  if (current) return Infinity;
  const f = fmtDate(s), m = f.match(/^([A-Z][a-z]{2}) ((?:19|20)\d{2})$/);
  if (m) return +m[2] * 12 + MON3.indexOf(m[1]);
  const y = f.match(/^((?:19|20)\d{2})$/);
  return y ? +y[1] * 12 + 6 : -Infinity;
}
const cmpNum = (a, b) => a === b ? 0 : a > b ? 1 : -1;
function sortByDate(list) {
  const p = P(), arr = p[list];
  const key = e => { const end = dateRank(e.end, e.current), start = dateRank(e.start); return [end === -Infinity ? start : end, start]; };
  const sorted = arr.map((e, k) => ({ e, k })).sort((a, b) => { const x = key(a.e), y = key(b.e); return cmpNum(y[0], x[0]) || cmpNum(y[1], x[1]) || a.k - b.k; }).map(x => x.e);
  const same = sorted.every((e, k) => e === arr[k]);
  if (same) builder.sortNote = { list, text: "Already in date order, newest first." };
  else {
    keepOpen();
    const before = arr.slice(), openNow = new Set([...builder.open[list]].map(i => arr[i]));
    arr.splice(0, arr.length, ...sorted);
    builder.open[list] = new Set(sorted.map((e, k) => openNow.has(e) ? k : -1).filter(k => k >= 0));
    builder.foldOpen = {}; builder.sugg = {}; builder.alts = {}; builder.genned = new Set(); builder.extraAlts = {};
    builder.sortNote = { list, text: "Now in date order, newest first.", before };
    touchProfile("builder");
  }
  renderBuilder(false);
}
function sortUndo(list) {
  const n = builder.sortNote;
  if (!n || n.list !== list || !n.before) return;
  const arr = P()[list];
  keepOpen();
  const openNow = new Set([...builder.open[list]].map(i => arr[i]));
  arr.splice(0, arr.length, ...n.before);
  builder.open[list] = new Set(arr.map((e, k) => openNow.has(e) ? k : -1).filter(k => k >= 0));
  builder.foldOpen = {}; builder.sugg = {}; builder.alts = {}; builder.genned = new Set();
  builder.sortNote = { list, text: "Put back the way it was." };
  touchProfile("builder"); renderBuilder(false);
}

/* --- "Tell us about this job" folds away once there are bullet points; a click opens it again --- */
onInit(() => {
  $("bForm").addEventListener("click", e => {
    const sm = e.target.closest("details.b-fold > summary");
    if (!sm) return;
    const d = sm.parentElement;
    builder.foldOpen[+d.dataset.fold] = !d.open;   // the click is about to flip it
    const hint = sm.querySelector(".muted"); if (hint) hint.textContent = d.open ? "Your answers are saved. Click to see or change them." : "";
  });
  $("bForm").addEventListener("click", e => { const b = e.target.closest('[data-act="sort-undo"]'); if (b) sortUndo(b.dataset.list); });
});

/* --- One more bullet point, written to say something the others don't --- */
const BULLET_ONE_NANO = `You write ONE new resume bullet point for a job, from the candidate's own answers.
Rules:
1. Use only what they wrote. Never invent numbers, tools, results, team sizes or tasks.
2. It must cover something the existing bullet points do NOT already say. Do not repeat, reword or overlap any fact in them: choose a different task, tool, person or result from the answers.
3. One complete sentence without "I": a strong action verb, what they did, how (the tools or people they named), and why it mattered or what came of it. 16 to 30 words.
4. Past tense for a past job, present tense for a current job. Start with a verb that none of the existing bullet points starts with.
5. No "I", "my", "responsible for", clichés or full stop at the end.
Reply with JSON only: {"bullets": ["..."]}`;
// Does a new bullet repeat information the others already give?
const overlapsAny = (t, others) => others.some(o => similarity(norm(t), norm(o)) >= 0.4 || keepsFacts(o, t) >= 0.6 || keepsFacts(t, o) >= 0.6 || firstWord(o) === firstWord(t));
const firstWord = t => (String(t).match(/^[A-Za-z]+/) || [""])[0].toLowerCase();
async function addOneBullet(i, btn) {
  const p = P(), e = p.experience[i];
  keepOpen();
  const have = e.bullets.map(b => b.trim()).filter(Boolean);
  const box = () => $("bSugg" + i);
  const emptyBox = note => {
    if (!e.bullets.length || e.bullets[e.bullets.length - 1].trim()) e.bullets.push("");
    touchProfile("builder"); renderBuilder(false);
    if (note && box()) box().innerHTML = `<p class="small muted">${esc(note)}</p>`;
    const rows = document.querySelectorAll(`#bForm details[data-card="experience"][data-i="${i}"] .bl-item textarea`);
    if (rows.length) rows[rows.length - 1].focus();
  };
  if (!Object.values(e.answers).some(v => v.trim())) return emptyBox("Answer the questions above and this button writes the next bullet point for you. Here is an empty one to type in.");
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = "Writing one…";
  const progress = m => { if (box()) box().innerHTML = `<p class="progress">${esc(m)}</p>`; };
  const src = [Object.values(e.answers).join("\n"), e.bullets.join("\n"), e.title, e.org].join("\n");
  let item = "", via = "", r = null;
  try {
    r = await aiJSON({ nano: BULLET_ONE_NANO, full: BULLET_ONE_NANO, examples: BULLET_EXAMPLES.map(([u, a]) => [u, { bullets: a.bullets.slice(0, 1) }]), label: "Writing a bullet point", progress, schema: BULLETS_SCHEMA,
      prompt: bulletPrompt(e, []) + `\nWrite exactly one new bullet point. It must not overlap with these existing ones:\n${have.map(b => "- " + b).join("\n") || "(none)"}`,
      check: d => {
        const ok = (Array.isArray(d.bullets) ? d.bullets : []).map(b => honest(b, src, { min: 12, max: 34 })).filter(Boolean).filter(b => !overlapsAny(b, have));
        return ok.length ? { ok: true, value: ok.slice(0, 1) } : { ok: false, why: "write one bullet point of 16 to 30 words about something the existing bullet points don't mention, using only their details" };
      } });
    if (r.data) { item = r.data[0]; via = `Written by ${viaWords(r.via)} from your answers, about something your other bullet points don't cover.`; }
  } finally { btn.disabled = false; btn.textContent = label; }
  if (!item) {
    const c = answersToBullets(e).filter(b => !overlapsAny(b, have));
    if (c.length) { item = c[0]; via = `${r && r.tried ? aiMissWords(r) + " " : ""}Made from your answers without AI. Edit it so it's true and sounds like you.`; }
  }
  if (!item) return emptyBox(`${r && r.tried && r.tried.length ? aiMissWords(r) + " " : ""}Everything in your answers is already in your bullet points. Here is an empty one to type in, or add more detail to your answers above.`);
  const x = tidy(String(item)).replace(/[.\s]+$/, "");
  e.bullets = e.bullets.filter(b => b.trim());
  e.bullets.push(x);
  if (r && r.data) aiMade(x);
  builder.genned.add(i); delete builder.foldOpen[i];
  builder.sugg[i] = { items: [], added: [x], via, ai: !!(r && r.data) };
  touchProfile("builder"); renderBuilder(false);
  const rows = document.querySelectorAll(`#bForm details[data-card="experience"][data-i="${i}"] .bl-item textarea`);
  if (rows.length) rows[rows.length - 1].focus({ preventScroll: true });
}

/* --- Projects: Finish rewrites the lines as resume points (the name stays as you wrote it) --- */
const POLISH_PROJ_NANO = `You rewrite the lines about one project so they read as strong resume points.
Rules:
1. Keep every fact. Never add tools, numbers, results, people or tasks that aren't there.
2. Each line becomes one complete sentence: a strong action verb first (past tense if finished, present tense if ongoing), then what was built or done, how or with what, and what came of it.
3. Turn casual or vague words into professional ones that mean the same. Spell out short forms. Fix spelling (Australian) and capitals, including tool names.
4. 8 to 30 words each, no full stop at the end, never "I", "me" or "my". Don't start two lines with the same verb.
5. Return the same number of lines, in the same order.
Reply with JSON only: {"bullets": ["..."]}`;
function polishProject(e, progress) {
  const lines = linesOf(e.details);
  if (!lines.length) return Promise.resolve({ data: null, via: null });
  const src = [e.name, e.org, lines.join("\n")].join("\n");
  const prompt = `<project>${e.name}${e.org ? ` (${e.org})` : ""}${e.current ? ", ongoing: present tense" : ", finished: past tense"}</project>\n<lines>\n${lines.map((b, k) => `${k + 1}. ${b}`).join("\n")}\n</lines>`;
  return aiJSON({ nano: POLISH_PROJ_NANO, full: POLISH_PROJ_NANO, prompt, schema: BULLETS_SCHEMA, label: "Rewriting this project", progress,
    check: d => {
      const bl = (Array.isArray(d.bullets) ? d.bullets : []).map(b => stripMarkup(String(b)).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "")).filter(Boolean);
      if (bl.length !== lines.length) return { ok: false, why: `return exactly ${lines.length} lines, in the same order` };
      for (let k = 0; k < bl.length; k++) {
        const why = factCheck(bl[k], src, { noFirstPerson: true, min: 3, max: 36 });
        if (why) return { ok: false, why: `line ${k + 1}: ${why}` };
        if (keepsFacts(lines[k], bl[k]) < 0.5) return { ok: false, why: `line ${k + 1} lost facts from the original` };
      }
      return { ok: true, value: bl };
    } }).then(r => r.data ? { ...r, data: { details: r.data.join("\n") } } : r);
}

/* --- Next steps after the resume --- */
function nextStepsHtml() {
  const p = P(), ad = p.target.specific && val(p.target.ad);
  const card = (act, tag, head, text, go) => `<button type="button" class="nx-card" data-act="${act}"><span class="nx-tag">${tag}</span><b>${head}</b><span class="nx-text">${text}</span><span class="nx-go">${go} <i aria-hidden="true">→</i></span></button>`;
  return `<div class="b-sub">What next?</div><p class="q-hint">Your resume is done. These three make it work harder for you.</p><div class="b-next nx">`
    + card("to-scanner", "Most useful", ad ? "Tailor this resume to your job ad" : "Tailor it to a real job ad", "Paste an ad to see your match score, the skills it asks for that you haven't shown, and get your resume and a cover letter shaped around that job.", "Tailor to a job")
    + card("to-letter", "Do this next", "Write a cover letter that sounds like you", "Five short paragraphs, drafted from this resume. Every gap is highlighted in yellow so nothing is sent unfinished.", "Create a cover letter")
    + card("to-linkedin", "Quick win", "Make your LinkedIn match your resume", "Get a headline, About section and skills list written from this resume, so recruiters see the same strong story everywhere.", "Improve my LinkedIn")
    + `</div>`;
}
