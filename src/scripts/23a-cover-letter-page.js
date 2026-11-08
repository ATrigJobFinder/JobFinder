/* ===================== Cover letters: designs that match each resume template, and the Create or edit cover letter page ===================== */
// A letter takes its fonts, colour and name styling from the resume template you've chosen
function letterStyle(tpl, accent) {
  const t = tpl || DEFAULT_LETTER_STYLE;
  if (!tpl) return DEFAULT_LETTER_STYLE;
  return {
    body: t.body, head: t.head, accent: accent || t.accent, caps: !!(t.nm && t.nm.caps), track: t.nm && t.nm.track ? Math.round(t.nm.track * 250) : 0,
    align: t.nm && t.nm.align === "center" ? "center" : "left",
    look: t.layout === "band" ? "band" : t.layout === "sidebar" ? "side" : "rule",
    pdf: (FONTS[t.body] || FONTS.Calibri).pdf, pdfHead: (FONTS[t.head] || FONTS.Calibri).pdf, name: t.name
  };
}
// The design chosen in Templates (or the best match for your job type)
// The letter's spacing and margins, chosen on the Create or edit cover letter page (same options as the resume)
const LETTER_MARGINS = { narrow: { mm: 16, label: "Narrow" }, normal: { mm: 23, label: "Normal" }, wide: { mm: 30, label: "Wide" } };
function letterLayout(prefs) {
  const pr = prefs || (profile && profile.data && profile.data.prefs) || {};
  const sp = SPACING[pr.letterSpacing] || SPACING.normal, mg = LETTER_MARGINS[pr.letterMargins] || LETTER_MARGINS.normal;
  return { lh: sp.lh, gap: sp.gap, mm: mg.mm };
}
// The letter's design: the resume's own, or (with "Match my cover letter and resume design" off) one chosen just for the letter
function resumeDesign() {
  const c = P().cv, k = cvState.selected || c.template;
  return CV_TEMPLATES.some(t => t.key === k) ? tplByKey(k) : rankTemplates()[0].t;
}
function letterTpl() {
  const c = P().cv, ok = k => CV_TEMPLATES.some(t => t.key === k);
  if (!letterMatched() && ok(c.letterTemplate)) return tplByKey(c.letterTemplate);
  return resumeDesign();
}
function letterAccentOf(t) {
  const c = P().cv, sep = !letterMatched() && CV_TEMPLATES.some(x => x.key === c.letterTemplate);
  const tk = sep ? c.letterTemplate : c.template, a = sep ? c.letterAccent : c.accent;
  return tk === t.key && t.accents.includes(a) ? a : t.accent;
}
// The letter starts with the resume's design. Choosing another one changes the letter only, never the resume.
function pickLetterTpl(key) {
  const c = P().cv;
  if (key === resumeDesign().key) P().prefs.letterMatch = true;
  else { P().prefs.letterMatch = false; c.letterTemplate = key; c.letterAccent = ""; }
  touchProfile("letter");
}
function currentLetterStyle() {
  try { const t = letterTpl(); return { ...letterStyle(t, letterAccentOf(t)), ...letterLayout() }; }
  catch { return { ...DEFAULT_LETTER_STYLE, ...letterLayout() }; }
}
function letterHtml(L, st) {
  const css = k => (FONTS[k] || FONTS.Calibri).css;
  const name = st.caps ? L.name.toUpperCase() : L.name;
  const lay = { ...letterLayout(), ...(st.mm ? { mm: st.mm, lh: st.lh, gap: st.gap } : {}) };
  // gaps ([XXX], [the company]…) are highlighted yellow
  return `<div class="lt-sheet lt-${st.look} ${st.align === "center" ? "lt-center" : ""}" style="--lt-accent:${st.accent};--lt-body:${esc(css(st.body))};--lt-head:${esc(css(st.head))};--lt-track:${st.caps ? (st.track / 250).toFixed(2) + "em" : "0"};--lt-mm:${lay.mm};--lt-lh:${lay.lh};--lt-gap:${lay.gap}">
    <header class="lt-head"><div class="lt-name">${esc(name)}</div><div class="lt-contact">${esc(L.contact.join("  |  "))}</div></header>
    <div class="lt-date">${esc(L.date)}</div>
    <div class="lt-to">${L.recipient.map(gapHtml).join("<br>")}</div>
    ${L.re ? `<div class="lt-re">${gapHtml(L.re)}</div>` : ""}
    <p>${gapHtml(L.salutation)}</p>
    ${L.paragraphs.map(p => `<p class="lt-p">${gapHtml(p)}</p>`).join("")}
    <p class="lt-sign">${gapHtml(L.signoff)}</p>
    <p class="lt-signname">${esc(L.signName)}</p>
  </div>`;
}

/* --- The base letter: written once, reused when tailoring --- */
// What a blank looks like in the letter: the box's name, then an example, in yellow brackets
const PH = { who: "[Hiring manager's name, e.g. Sam Lee]", company: "[Company name, e.g. Sydney Water]", role: "[Job title, e.g. Graduate Engineer]" };
// a template for any job unless you've chosen "A specific job" (or already typed a job, company or recipient)
const ltTemplate = () => { try { const d = BL(); return d.mode === "template" || (!d.mode && !d.role && !d.company && !d.recipient); } catch { return false; } };
const baseLetter = privateDoc("baseLetter", "jobfinder.baseLetter.v1", () => ({ role: "", company: "", recipient: "", salutation: "Dear Hiring Manager,", parts: COVER_PARTS.map(p => ({ part: p.key, text: "" })), signoff: "Yours sincerely,", mode: "template" }));
const BL = () => baseLetter.data;
const blText = () => BL().parts.map(p => p.text.trim()).filter(Boolean);
function baseLetterParts(forSample) {
  const p = forSample || !hasProfile(P()) ? SAMPLE_PROFILE : P(), c = p.contact, d = BL();
  const paras = blText();
  const sample = forSample || !paras.length;
  return {
    name: c.name || "Your name",
    contact: [c.location, c.phone ? `${c.phoneCode && !/^(\+|0)/.test(c.phone) ? c.phoneCode + " " : ""}${c.phone}` : "", c.email, c.linkedin ? shortUrl(c.linkedin) : ""].filter(Boolean),
    date: todayAU(),
    // a blank is a placeholder that says what goes there, highlighted yellow; a template leaves the job, company and name as placeholders
    recipient: ltTemplate() ? [PH.who, PH.company] : [d.recipient || PH.who, d.company || PH.company],
    re: ltTemplate() ? `Re: Application for ${PH.role}` : (d.role || p.target.title) ? `Re: Application for ${d.role || p.target.title}` : `Re: Application for ${PH.role}`,
    salutation: ltTemplate() ? "Dear Hiring Manager," : d.salutation || "Dear Hiring Manager,",
    paragraphs: sample ? letterFromProfile(p).map(x => x.text) : paras,
    signoff: d.signoff || "Yours sincerely,",
    signName: c.name || ""
  };
}
// A general letter written from the profile, without AI. Gaps are left in [brackets] for you to fill.
function letterFromProfile(p) {
  const role = ltTemplate() ? PH.role : BL().role || p.target.title || PH.role;
  const company = ltTemplate() ? PH.company : BL().company;   // blank stays a placeholder, filled when the company is typed in
  const edu = shown(p.education).find(e => e.degree || e.inst) || p.education.find(e => e.degree || e.inst);
  const exps = shown(p.experience).filter(e => (e.title || e.org) && e.bullets.length).slice(0, 2);
  // "Event management" reads naturally mid-sentence as "event management"; names like Canva or SQL stay as they are
  const skills = [...p.skills.hard, ...p.skills.software].slice(0, 3).map(s => / /.test(s) && /^[A-Z][a-z]+( [a-z]+)+$/.test(s) ? lowerFirst(s) : s);
  const soft = p.skills.soft.slice(0, 3).map(s => s.toLowerCase());
  const clause = b => { const t = String(b).replace(/[.\s]+$/, ""); return ACTION_START.test(t) ? "I " + t[0].toLowerCase() + t.slice(1) : null; };
  const eduLine = edu ? (edu.current ? `I am currently completing a ${edu.degree}${edu.inst ? ` at ${edu.inst}` : ""}${edu.end ? `, finishing in ${showDate(edu.end)}` : ""}.` : `I hold a ${edu.degree}${edu.inst ? ` from ${edu.inst}` : ""}.`) : "";
  const out = [];
  out.push({ part: "opening", text: `I am applying for the ${role} role${company ? ` at ${company}` : ""}. ${eduLine}${skills.length ? ` I would bring practical experience in ${listJoin(skills)} to your team.` : ""}`.replace(/\s+/g, " ").trim() });
  const exp = exps.map((e, i) => {
    const cl = e.bullets.map(clause).filter(Boolean);
    if (!cl.length) return "";
    const first = i === 0 ? `As ${/^[aeiou]/i.test(e.title) ? "an" : "a"} ${e.title}${e.org ? ` at ${e.org}` : ""}, ${cl[0]}.` : `${e.org ? `At ${e.org}` : `As ${e.title}`}, ${cl[0]}.`;
    // the most recent job gets more examples, so the paragraph proves the point
    return first + cl.slice(1, i === 0 ? 3 : 2).map(c => ` ${c.replace(/^I /, "I also ")}.`).join("");
  }).filter(Boolean);
  out.push({ part: "experience", text: exp.length ? exp.join(" ") + " [Why this experience matters for the job]" : "[Your most relevant job or project: what you did and what came of it.]" });
  const proj = edu && val(edu.project) ? ` I also completed ${lowerFirst(val(edu.project).replace(/^(thesis|project|capstone)\s*:\s*/i, (m, w) => `a ${w.toLowerCase()} on `).replace(/[.\s]+$/, "").replace(/ on ([A-Z])(?=[a-z])/, (m, c) => " on " + c.toLowerCase()))}.` : "";
  const certs = p.skills.certs.length ? ` I also hold ${listJoin(p.skills.certs.slice(0, 2))}.` : "";
  const subj = edu ? pickSubjects(edu, p).slice(0, 5) : [];
  out.push({ part: "education", text: edu && subj.length ? `My studies have given me a strong foundation, including ${listJoin(subj)}.${proj}${p.skills.software.length ? ` I am proficient in ${listJoin(p.skills.software.slice(0, 3))}.` : ""}${certs}` : p.skills.software.length ? `I am proficient in ${listJoin(p.skills.software.slice(0, 3))}.${proj}${certs}` : edu ? `My ${edu.degree} has given me a strong foundation for this role.${proj}${certs}` : "[The study, tools and certificates behind your experience.]" });
  out.push({ part: "motivation", text: `I am particularly drawn to ${company || "[the company]"} because [one specific reason: a project, a value or the work they do].${soft.length ? ` My experience has also developed my ${listJoin(soft)}, which I would bring to your team.` : ""}` });
  out.push({ part: "closing", text: `Thank you for considering my application. I would welcome the opportunity to discuss how I could contribute${p.availability ? `, and I am available ${lowerFirst(p.availability.replace(/[.\s]+$/, "").replace(/^available\s+/i, "")).replace(/,\s*available\s+/i, ", ")}` : ""}.` });
  return out;
}
// Your base letter also becomes a "previous letter" in Tailor to a job, so its best sentences get reused
const BASE_LETTER_NAME = "My cover letter (from Job Finder)";
async function syncBaseToTailor() {
  const text = blText().join("\n\n");
  await coverReady;
  cover.letters = cover.letters.filter(l => l.name !== BASE_LETTER_NAME);
  TOKEN_RE.lastIndex = 0;
  if (wordCount(text) >= 40 && !TOKEN_RE.test(text)) cover.letters = [{ name: BASE_LETTER_NAME, text, added: new Date().toISOString() }, ...cover.letters].slice(0, 3);
  TOKEN_RE.lastIndex = 0;
  renderLetterFiles();
  await saveCoverStore();
}
function renderLetterPage() {
  const d = BL();
  renderSignAlts();
  for (const k of ["role", "company", "recipient", "salutation", "signoff"]) { const el = document.querySelector(`[data-lt="${k}"]`); if (el && document.activeElement !== el) el.value = d[k] || ""; }
  const roleEl = $("lt-role"); if (roleEl && !d.role) roleEl.placeholder = P().target.title || "e.g. Graduate Engineer";
  // blank company / addressed-to boxes are yellow and read [XXX] in the letter
  for (const k of ["role", "company", "recipient"]) { const el = document.querySelector(`[data-lt="${k}"]`); if (el) el.classList.toggle("gap-input", !String(d[k] || "").trim()); }
  const box = $("ltParts");
  if (!box.dataset.built) {
    box.innerHTML = COVER_PARTS.map((p, i) => `<div class="lt-part"><label class="q-label" for="ltp-${i}">${i + 1}. ${esc(p.label)} <span class="opt" id="ltw-${i}"></span></label><p class="q-hint">${esc(p.purpose)}</p><div id="ltg-${i}"></div>
      <div class="hl-wrap"><div class="hl-back" id="ltb-${i}" aria-hidden="true"></div><textarea id="ltp-${i}" data-ltp="${i}" rows="8" spellcheck="true" placeholder="Write this paragraph, or use Write with AI below."></textarea></div>
      <div class="lt-part-acts" id="lta-${i}"></div><div class="lt-alts bl-alts" id="lts-${i}"></div></div>`).join("");
    box.dataset.built = "1";
  }
  d.parts.forEach((p, i) => { const el = $("ltp-" + i); if (el && document.activeElement !== el) el.value = p.text; partCount(i); $("ltg-" + i).innerHTML = $("ltg-" + i).dataset.stage === letterStage() ? $("ltg-" + i).innerHTML : clGuideHtml(p.part, letterStage()); $("ltg-" + i).dataset.stage = letterStage(); });
  const r = letterRange(), st = (STAGES.find(s => s.key === letterStage()) || {}).label;
  ltTargetText();
  renderLetterDesigns();
  renderLetterPreview();
  renderSavedLetters();
  if (typeof ltV22Render === "function") ltV22Render();
}
// The first thing on the page: pick a design, then set its spacing and margins (the same choices as the resume)
function renderLetterDesigns(boxId = "ltDesigns") {
  const box = $(boxId);
  if (!box) return;
  const sel = letterTpl().key, ranked = rankTemplates(), L = baseLetterParts();
  const mine = resumeDesign(), show = [mine, ...ranked.map(r => r.t).filter(t => t.key !== mine.key)].slice(0, 6);
  if (!show.some(t => t.key === sel)) show.splice(1, 0, tplByKey(sel));
  const lay = P().prefs, cur = { sp: lay.letterSpacing || "normal", mg: lay.letterMargins || "normal" };
  const seg = (path, opts, now, label, unit) => `<div class="q"><div class="q-label" id="lts_${path}">${label}</div><div class="seg seg-fill" role="group" aria-labelledby="lts_${path}">${Object.entries(opts).map(([k, o]) => `<button type="button" data-lt-pref="${path}" data-val="${k}" aria-pressed="${now === k}"><span>${o.label}</span><small>${unit(o)}</small></button>`).join("")}</div></div>`;
  box.innerHTML = `<div class="b-tpls lt-tpls" role="group" aria-label="Cover letter designs, best match first">${show.map(t => `<button type="button" class="tpl-card" data-lt-tpl="${t.key}" aria-pressed="${sel === t.key}" aria-label="${esc(t.name)}. ${esc(t.goodFor)}"><span class="tpl-thumb"><div>${letterHtml(L, { ...letterStyle(t, sel === t.key ? currentLetterStyle().accent : t.accent), ...letterLayout() })}</div></span><span class="tpl-name">${esc(t.name)}</span>${t.key === mine.key ? `<span class="tpl-mine">Your resume's design</span>` : ""}</button>`).join("")}</div>
    <div class="b-actions"><button class="linkish" type="button" id="ltAllDesigns">See all ${CV_TEMPLATES.length} designs</button></div>
    <p class="small muted lt-design-note">Your cover letter design matches your resume's default design, so it is listed first. Choosing a different design here changes the cover letter only, not your resume.</p>
    <div class="page-setup">${seg("spacing", SPACING, cur.sp, "Line spacing", o => o.unit)}${seg("margins", LETTER_MARGINS, cur.mg, "Page margins", o => o.mm + " mm")}</div>`;
  fitThumbs();
}
// The preview can be typed in: a paragraph goes back into its box on the left, the greeting and sign-off into theirs
// (keepPaper: update the checks and counts but leave the page as it is, because someone is typing on it)
const ltEditor = {
  note: "Select a paragraph in the preview to change it. The boxes on the left follow.",
  noteId: "ltEditNote", label: "Your cover letter. Select any paragraph to change it.",
  enabled: () => blText().length > 0,
  get locked() { return ".lt-head, .lt-date, .lt-to, .lt-re, .lt-signname" + (ltTemplate() ? ", .lt-sheet > p:not(.lt-p):not(.lt-sign):not(.lt-signname)" : ""); },
  apply(old, nw, el) {
    const sheet = el instanceof Element && el.closest(".lt-sheet");
    if (!sheet) return false;
    const text = nw.replace(/\s+/g, " ").trim(), d = BL();
    if (el.classList.contains("lt-p")) {
      const at = d.parts.map((p, k) => p.text.trim() ? k : -1).filter(k => k >= 0)[[...sheet.querySelectorAll(".lt-p")].indexOf(el)];
      if (at == null || !d.parts[at]) return false;
      d.parts[at].text = text;
      const ta = $("ltp-" + at); if (ta) ta.value = text;
      lwBack(at, text); partCount(at);
      baseLetter.save();
      return true;
    }
    if (el.classList.contains("lt-sign")) { d.signoff = text; const i = $("lt-sign"); if (i) i.value = text; baseLetter.save(); return true; }
    if (el.parentElement === sheet && el.tagName === "P" && !el.className) { d.salutation = text; const i = $("lt-sal"); if (i) i.value = text; baseLetter.save(); return true; }
    return false;
  },
  after() { renderLetterPreview(true); syncBaseToTailor(); },
  commit() { renderLetterPreview(); }
};
function renderLetterPreview(keepPaper) {
  const st = currentLetterStyle(), L = baseLetterParts();
  if (!keepPaper) {
    mountPaper($("ltPaper"), letterHtml(L, st));
    paperEditable($("ltPaper"), ltEditor);
    if (ltMeasureFit()) { ltTargetText(); COVER_PARTS.forEach((_, k) => partCount(k)); }
  }
  $("ltDesign").textContent = `Design: ${st.name}`;
  const text = blText().join(" "), wc = wordCount(text);
  // gaps: [brackets] in the paragraphs, plus a blank company or "addressed to", which read [XXX]
  const bodyGaps = (text.match(TOKEN_RE) || []).length, d = BL();
  const blanks = ltTemplate() ? [] : [!String(d.recipient || "").trim() && "who it is addressed to", !String(d.company || "").trim() && "the company"].filter(Boolean);
  const gaps = bodyGaps + blanks.length;
  for (const el of document.querySelectorAll("#ltParts [data-ltp]")) lwBack(+el.dataset.ltp, el.value);
  const own = blText().length > 0, r = letterRange();
  const parts = BL().parts, lab = i => partOf(parts[i].part).label;
  // words the AI put in that aren't in the profile (shown in red in the paragraph)
  const made = parts.flatMap((pp, k) => (pp.madeUp || []).filter(t => pp.text.includes(t)).map(t => ({ i: k, t })));
  const thinIdx = parts.map((p, i) => p.text.trim() && wordCount(p.text) < partMin(p.part, r) ? i : -1).filter(i => i >= 0);
  const quality = own ? coverQuality(parts.map(p => p.text), profileToText(P()) + "\n" + (d.role || "") + " " + (d.company || "")) : [];
  // each warning can be clicked to jump to the paragraph it's about, and has a button that fixes just that one thing
  const goBtn = i => `<button class="linkish" type="button" data-ck="go:${i}">Go to ${esc(lab(i).toLowerCase())}</button>`;
  const row = (cls, title, detail, acts, go) => `<li class="ck${go ? " ck-go" : ""}"${go ? ` data-ck-go="${go}" tabindex="0" role="button" aria-label="${esc(String(title).replace(/<[^>]+>/g, ""))}. Go to it"` : ""}><span class="ico ${cls}"></span><div><div class="title">${title}</div><div class="detail">${detail}</div>${acts ? `<div class="ck-acts">${acts}</div>` : ""}</div></li>`;
  const shortest = parts.map((p, i) => [i, wordCount(p.text) - partMin(p.part, r)]).filter(([i]) => parts[i].text.trim()).sort((a, b) => a[1] - b[1])[0];
  const longest = parts.map((p, i) => [i, wordCount(p.text)]).sort((a, b) => b[1] - a[1])[0];
  const fixLabel = { dash: "Fix the dashes", exclaim: "Fix the exclamation marks", reword: "Reword", go: "Go to" };
  const qualityRows = quality.map(q => {
    const where = q.where || [], first = where[0];
    const acts = first == null ? "" : where.slice(0, 4).map(i => q.fix === "go" ? goBtn(i) : `<button class="btn" type="button" data-ck="${q.fix}:${i}">${q.fix === "reword" ? "Reword " + esc(lab(i).toLowerCase()) : fixLabel[q.fix] + " in " + esc(lab(i).toLowerCase())}</button>`).join("");
    return row("warn", esc(q.title), esc(q.detail), acts, first == null ? "" : "part:" + first);
  }).join("");
  $("ltChecks").innerHTML = own ? `<h3 class="ck-head">Before you send it</h3><p class="small muted">Select a warning to jump to it. Each button changes just that one thing.</p><ul class="checks lt-checklist">
    ${row(wc >= r[0] && wc <= r[1] ? "pass" : "warn", `${wc} words`, wc < r[0] ? `A little short. About ${r[0]} to ${r[1]} words fill one page at your spacing and margins.` : wc <= r[1] ? `Fits one page (${r[0]} to ${r[1]} words).` : `Trim it to ${r[1]} words or fewer so it fits on one page.`,
      wc < r[0] && shortest ? (EXPAND_PARTS.has(parts[shortest[0]].part) ? `<button class="btn" type="button" data-ck="expand:${shortest[0]}">Expand ${esc(lab(shortest[0]).toLowerCase())} with AI</button>` : goBtn(shortest[0])) : wc > r[1] && longest ? goBtn(longest[0]) : "",
      wc < r[0] && shortest ? "part:" + shortest[0] : wc > r[1] && longest ? "part:" + longest[0] : "")}
    ${thinIdx.length ? thinIdx.map(i => row("warn", `Too short: ${esc(lab(i).toLowerCase())}`, `${wordCount(parts[i].text)} words. It needs at least ${partMin(parts[i].part, r)}. Add a detail or an example.`, EXPAND_PARTS.has(parts[i].part) ? `<button class="btn" type="button" data-ck="expand:${i}">Expand with AI</button>${goBtn(i)}` : goBtn(i), "part:" + i)).join("") : row("pass", "Every paragraph has enough to it", "Each one does its job.", "", "")}
    ${ltTemplate() ? row("pass", "A template: its gaps are meant to be there", bodyGaps ? `The yellow gaps are for each job's details. Fill them in when you send the letter to a job.` : "No gaps to fill.", bodyGaps ? '<button class="btn" type="button" data-ck="gap">Go to the next gap</button>' : "", bodyGaps ? "gap" : "") : row(gaps ? "warn" : "pass", gaps ? `<mark class="gap-mark">${gaps} gap${gaps === 1 ? "" : "s"} to fill</mark>` : "No gaps left", gaps ? `Missing information is highlighted in yellow${blanks.length ? ` (${esc(listJoin(blanks))} shows as [XXX])` : ""}. You can save and come back to it. Fill each one before you send the letter.` : "Ready to send, or to tailor to a job.",
      gaps ? `${bodyGaps ? '<button class="btn" type="button" data-ck="gap">Go to the next gap</button>' : ""}${!String(d.company || "").trim() ? '<button class="btn" type="button" data-ck="field:company">Add the company</button>' : ""}${!String(d.recipient || "").trim() ? '<button class="btn" type="button" data-ck="field:recipient">Add who it is addressed to</button>' : ""}` : "", gaps ? (bodyGaps ? "gap" : !String(d.company || "").trim() ? "field:company" : "field:recipient") : "")}
    ${made.length ? row("warn", `${made.length} detail${made.length === 1 ? "" : "s"} not in your profile`, `${esc(listJoin(made.slice(0, 5).map(m => m.t)))}. Hover the red words in the paragraph to keep one (it's saved to your profile) or discard it.`, goBtn(made[0].i), "part:" + made[0].i) : ""}
    ${qualityRows}
    ${quality.length ? "" : row("pass", "Reads like you wrote it", "No clichés, long dashes or repeated openings.", "", "")}
  </ul>` : `<p class="small muted">The preview shows a sample letter. Select <b>Start from my profile</b> to write yours.</p>`;
  const sc = letterScore(parts, r, wc, gaps, quality.concat(made)), se = $("ltScore");
  if (se) se.innerHTML = `Cover letter strength: <span style="color:${sc >= 80 ? "var(--good)" : sc >= 60 ? "var(--accent)" : "var(--warn)"}">${sc}/100</span>`;
  // a letter with gaps can still be saved, copied and downloaded as a draft (Word highlights the gaps yellow)
  ["ltDl", "ltCopy"].forEach(id => { $(id).disabled = !own; });
  $("ltSave").disabled = !own;
  if (typeof ltV22Preview === "function") ltV22Preview();
  lfRender();
  $("ltDlStatus").textContent = !own ? "" : gaps && !ltTemplate() ? `${gaps} gap${gaps === 1 ? "" : "s"} still highlighted in yellow. You can save or download it as a draft; Word keeps the highlight.` : "";
}
async function downloadBaseLetter(kind, btn) {
  const L = baseLetterParts(), st = currentLetterStyle();
  const name = `${(L.signName || "Cover").replace(/[\\/:*?"<>|]+/g, "")} - Cover Letter${BL().role ? ` - ${BL().role}` : ""}`.replace(/[\\/:*?"<>|]+/g, "").slice(0, 150) + "." + kind;
  if (kind === "txt") return downloadTextFile(name, letterPlainText(L), $("ltDlStatus"), btn);
  await downloadMade(name, () => kind === "pdf" ? buildCoverPdf(L, st) : buildCoverDocx(L, st), $("ltDlStatus"), btn);
}
const letterPlainText = L => [L.name, L.contact.join(" | "), "", L.date, "", ...L.recipient, "", L.re, "", L.salutation, "", ...L.paragraphs.flatMap(p => [p, ""]), L.signoff, "", L.signName].join("\n");
let ltSaveTimer = null;
function letterEdited() {
  baseLetter.save();
  clearTimeout(ltSaveTimer);
  ltSaveTimer = setTimeout(() => { renderLetterPreview(); syncBaseToTailor(); }, 400);
}
onInit(() => {
  const ltEdit = e => {
    const k = e.target.dataset.lt, i = e.target.dataset.ltp;
    if (k) {
      BL()[k] = e.target.value;
      if (["role", "company", "recipient"].includes(k)) e.target.classList.toggle("gap-input", !e.target.value.trim());
      // a company or role typed in fills the matching [gap] in the letter
      const gap = { company: "[the company]", role: "[the role]" }[k], v = e.target.value.trim();
      if (gap && v && e.type === "change") BL().parts.forEach((p, j) => { if (p.text.includes(gap)) { p.text = p.text.split(gap).join(v); const el = $("ltp-" + j); if (el) el.value = p.text; } });
      letterEdited();
    }
    else if (i != null) { BL().parts[+i].text = e.target.value; lwBack(+i, e.target.value); partCount(+i); letterEdited(); }
  };
  $("view-letter").addEventListener("input", ltEdit);
  $("view-letter").addEventListener("change", e => { if (e.target.dataset.lt) ltEdit(e); });
  $("ltFromProfile").addEventListener("click", async () => {
    const st = $("ltStatus"), btn = $("ltFromProfile");
    if (!hasProfile(P())) { st.textContent = "Add your details in the resume builder first, so the letter has something to draw on."; return; }
    if (blText().length && !confirmReplace(btn)) return;
    // the AI writes each section in turn (23e-letter-writer.js); anything it can't write is filled in from the standard version
    await lwStart(btn);
    syncBaseToTailor();
  });
  $("ltPickBtn").addEventListener("click", async () => {
    const box = $("ltPick"), b = $("ltPickBtn"), open = box.hidden;
    box.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { await savedLetters.ready; renderLetterPick(); }
  });
  $("ltImport").addEventListener("click", () => $("ltFile").click());
  $("ltFile").addEventListener("change", async () => { const f = $("ltFile").files[0]; $("ltFile").value = ""; if (f) await ltImportFile(f); });
  dlMenu("ltDl", { docx: b => downloadBaseLetter("docx", b), pdf: b => downloadBaseLetter("pdf", b), txt: b => downloadBaseLetter("txt", b) });
  $("ltCopy").addEventListener("click", async () => {
    const L = baseLetterParts(), b = $("ltCopy");
    const text = letterPlainText(L);
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; } catch { b.textContent = "Couldn't copy"; }
    setTimeout(() => { b.textContent = "Copy text"; }, 1800);
  });
  $("ltDesignBtn").addEventListener("click", () => openView("cv", { kind: "letter" }));
  $("ltSave").addEventListener("click", saveLetterTemplate);
  $("view-letter").addEventListener("click", e => {
    const x = e.target.closest("[data-lt-expand]"); if (x) { expandPart(+x.dataset.ltExpand, x); return; }
    const wr = e.target.closest("[data-lt-write]"); if (wr) { writePartAI(+wr.dataset.ltWrite, wr); return; }
    const rm = e.target.closest("[data-lt-rwmenu]"); if (rm) { rewordMenu(+rm.dataset.ltRwmenu); return; }
    const rs = e.target.closest("[data-lt-rwsel]");
    if (rs) { const [ri, what] = rs.dataset.ltRwsel.split("."), box = $("lts-" + ri); rwSel[ri] = what === "all" ? -1 : what === "pick" ? (Number.isInteger(rwSel[ri]) && rwSel[ri] >= 0 ? rwSel[ri] : -2) : +what; if (box) box.innerHTML = rewordMenuHtml(+ri); return; }
    const rw = e.target.closest("[data-lt-rw]"); if (rw) { const [ri, mode] = rw.dataset.ltRw.split("."); rewordPart(+ri, rw, mode); return; }
    const alt = e.target.closest("[data-lt-alt]");
    if (alt) {
      const [i, k] = alt.dataset.ltAlt.split(".").map(Number), box = $("lts-" + i), p = BL().parts[i];
      if (box && box._alts && box._alts[k] && p) { p.text = box._alts[k]; const el = $("ltp-" + i); if (el) el.value = p.text; box.innerHTML = ""; lwMarkMadeUp(i); baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor(); }
      return;
    }
    const ac = e.target.closest("[data-lt-altclose]"); if (ac) { const box = $("lts-" + ac.dataset.ltAltclose); if (box) box.innerHTML = ""; return; }
    const tp = e.target.closest("[data-lt-tpl]");
    if (tp) { pickLetterTpl(tp.dataset.ltTpl); renderLetterDesigns(); renderLetterPreview(); return; }
    const pf = e.target.closest("[data-lt-pref]");
    if (pf) { P().prefs[pf.dataset.ltPref === "spacing" ? "letterSpacing" : "letterMargins"] = pf.dataset.val; touchProfile("letter"); renderLetterDesigns(); renderLetterPreview(); return; }
    if (e.target.closest("#ltAllDesigns")) { openView("cv", { kind: "letter" }); return; }
    const u = e.target.closest("[data-lt-use]");
    if (u) {
      if (blText().length && !confirmReplace(u)) return;
      const t = (savedLetters.data.list || [])[+u.dataset.ltUse]; if (!t) return;
      const before = JSON.parse(JSON.stringify(BL()));
      Object.assign(BL(), JSON.parse(JSON.stringify(t.letter)));
      baseLetter.save(true); renderLetterPage(); syncBaseToTailor();
      $("ltPick").hidden = true; $("ltPickBtn").setAttribute("aria-expanded", "false"); ltShowStep(1);
      const st = $("ltStatus"); st.innerHTML = `Started from “${esc(t.name)}”. <button class="linkish" type="button" id="ltUndoUse">Undo</button>`;
      $("ltUndoUse").onclick = () => { Object.assign(BL(), before); baseLetter.save(true); renderLetterPage(); syncBaseToTailor(); st.textContent = "Restored your letter."; };
      return;
    }
    const del = e.target.closest("[data-lt-del]");
    if (del) { if (del.dataset.sure !== "1") { del.dataset.sure = "1"; del.textContent = "Delete it?"; setTimeout(() => { if (del.isConnected) { del.dataset.sure = ""; del.textContent = "Delete"; } }, 4000); return; } savedLetters.data.list.splice(+del.dataset.ltDel, 1); savedLetters.save(true); renderSavedLetters(); }
  });
  viewHooks.letter = () => Promise.all([baseLetter.ready, savedLetters.ready]).then(renderLetterPage);
  baseLetter.on(() => { if (currentView === "letter") renderLetterPage(); if (currentView === "cv" && cvLetters()) renderCv(); syncBaseToTailor(); });
  onProfile(() => { if (currentView === "letter") renderLetterPreview(); });
});
/* --- Each paragraph's length: a minimum for each, and Expand with AI for a thin one --- */
function partCount(i) {
  const p = BL().parts[i], w = $("ltw-" + i), acts = $("lta-" + i);
  if (!p || !w) return;
  const n = wordCount(p.text), min = partMin(p.part, letterRange());
  const aim = partTarget(p.part, letterRange());
  w.textContent = n ? `${n} words · aim for about ${aim}` : `aim for about ${aim} words`;
  w.classList.toggle("short", !!n && n < min); w.classList.toggle("good", n >= min);
  // Opening, Experience and Education and skills can be expanded with AI (or written, when empty); every paragraph can be reworded.
  // "Why this company" is your own reason, so AI only drafts it when it's empty.
  const keepNote = ($("ltx-" + i) || {}).innerHTML || "";
  if (acts && !acts.dataset.busy) acts.innerHTML = `${EXPAND_PARTS.has(p.part) ? `<button class="btn" type="button" data-lt-expand="${i}">${n ? "Expand with AI" : "Write with AI"}</button>` : !n ? `<button class="btn" type="button" data-lt-write="${i}">Write with AI</button>` : ""}${n ? `<button class="btn" type="button" data-lt-rwmenu="${i}" aria-haspopup="true" title="Other ways to say it: shorter, longer, casual or formal, or in your own words">Reword…</button>` : ""}<span class="small muted lt-note" id="ltx-${i}">${keepNote}</span>`;
}
/* --- Write a paragraph with AI, using the craft rules and the rules for your career stage --- */
// Every AI job on this page writes one paragraph of a letter: begin with context, and use full sentences only
const EXPAND_PARTS = new Set(["opening", "experience", "education", "motivation", "closing"]);
// Is this text one paragraph of full sentences? Returns what's wrong, or "".
function proseOk(t) {
  const x = String(t || "").trim();
  if (/^\s*([-*•▪–]|\d+[.)])\s/m.test(x) || /\n/.test(x)) return "it must be one paragraph of full sentences, not a list";
  if (!/[.!?]["”']?$/.test(x)) return "it must end with a full stop";
  // (full sentences starting with a capital letter is a suggestion in the prompt, not a rule the answer is rejected for)
  return "";
}
const hardPhrase = t => { for (const re of CL_HARD) { const m = String(t).match(re); if (m) return m[0]; } return ""; };
function partSource(i) {
  const d = BL();
  return { facts: profileToText(P()).slice(0, 5000), src: [profileToText(P()), d.role, d.company, d.recipient, BL().parts.map(p => p.text).join("\n")].join("\n") };
}
// Writing a paragraph from your profile: see 23e-letter-writer.js (one sentence per field, checked, with the standard version as a fallback)
const writePartAI = (i, btn) => lwWriteOne(i, btn);
/* --- Reword: up to three other ways to say a paragraph --- */
const LT_REWORD_NANO = `You write different wordings of one paragraph of a formal Australian cover letter.
Rules:
1. Write 3 versions. Each says what the original says, in a different way. You may add or drop detail where it reads better, and a [bracketed gap] may stay, move or go.
2. Change the sentence structure and the opening words, not the meaning. Each reads as plain, warm, confident first-person writing.
3. Each is about the length you are given, no clichés, no em dashes, no exclamation marks.
4. Each is ONE paragraph of full sentences, not a list. It opens with a sentence that gives context (who you are, or what the paragraph is about) before the detail.
5. Never name a company, employer, product or person that is not in the original or the details.
6. Never write a phone number, email address, link or LinkedIn: the letter head already has them.
7. Copy every number exactly as it appears in the original. Never add anything about the company's reputation, values, culture or work.
8. At most one sentence begins with "I". Never write "I am writing to", eager, passionate, excited, thrilled or dynamic. No contractions unless you are told they are fine: write "I am", never "I'm".
Reply with JSON only: {"options": ["...", "...", "..."]}`;
// The ways to reword a paragraph (the "Reword as…" menu): size is the length to aim for, note is said to the AI
const RW_MODES = {
  same: { label: "Another way to say it", note: "" },
  shorter: { label: "Shorter", size: o => o * 0.75, note: "Make it noticeably shorter (about a quarter fewer words) by cutting the least useful detail." },
  longer: { label: "Longer", size: o => o * 1.25, note: "Make it a little longer (about a quarter more words) with more detail from the candidate's details. Do not pad." },
  casual: { label: "More casual", note: "Make it more casual and conversational (contractions are fine), still professional." },
  formal: { label: "More formal", note: "Make it more formal and polished, with no contractions." },
  fit: { label: "To fit the page", size: (o, aim) => aim, note: "" },
  custom: { label: "In your own words", note: "" }
};
// The sentences of a paragraph (a full stop inside a [gap] doesn't end one)
function ltSentences(text) {
  const masked = String(text).replace(/\[[^\]]*\]|\{[^}]*\}/g, m => m.replace(/\./g, "\u0001"));
  return (masked.match(/[^.!?]+(?:[.!?]+["”']?|$)\s*/g) || [masked]).map(x => x.replace(/\u0001/g, ".")).filter(x => x.trim());
}
const rwSel = {};   // which sentence of each paragraph is being reworded (-1: the whole paragraph, -2: choosing a sentence)
const rwShort = t => { const w = t.trim().split(/\s+/); return w.slice(0, 7).join(" ") + (w.length > 7 ? "…" : ""); };
function rewordMenuHtml(i) {
  const p = BL().parts[i], sents = ltSentences(p.text), sel = Number.isInteger(rwSel[i]) && rwSel[i] >= 0 && sents[rwSel[i]] ? rwSel[i] : -1, choosing = sel >= 0 || rwSel[i] === -2;
  const b = (k, extra = "") => `<button type="button" data-lt-rw="${i}.${k}"${extra}>${esc(RW_MODES[k].label)}${k === "shorter" ? " <small>−25%</small>" : k === "longer" ? " <small>+25%</small>" : ""}</button>`;
  return `<div class="lt-rw" data-nohelp="1">
    <p class="small muted rw-head">How should it change?</p>
    <div class="rw-row"><span class="rw-lab">Reword</span><div class="seg" role="group" aria-label="What to reword"><button type="button" data-lt-rwsel="${i}.all" aria-pressed="${!choosing}">The whole paragraph</button><button type="button" data-lt-rwsel="${i}.pick" aria-pressed="${choosing}"${sents.length < 2 ? " disabled" : ""}>One sentence</button></div></div>
    ${choosing ? `<div class="rw-sents" role="group" aria-label="Choose the sentence">${sents.map((t, k) => `<button type="button" class="rw-sent" data-lt-rwsel="${i}.${k}" aria-pressed="${sel === k}"><b>${k + 1}</b> ${esc(rwShort(t))}</button>`).join("")}</div>${sel < 0 ? `<p class="small muted">Choose the sentence to reword.</p>` : ""}` : ""}
    <div class="rw-row"><span class="rw-lab">Length</span><div class="seg seg-fill" role="group" aria-label="Length">${b("shorter")}${b("longer")}</div></div>
    <div class="rw-row"><span class="rw-lab">Tone</span><div class="seg seg-fill" role="group" aria-label="Tone">${b("casual")}${b("formal")}</div></div>
    <div class="rw-row"><span class="rw-lab">Or</span><div class="seg" role="group" aria-label="Other ways">${b("same")}${b("fit", choosing ? " disabled" : "")}</div></div>
    <div class="seg-in"><input type="text" id="rwFree${i}" maxlength="120" placeholder="Or say it yourself, e.g. lead with my software skills" aria-label="Tell the AI how to change this paragraph"><button class="btn" type="button" data-lt-rw="${i}.custom">Reword</button></div>
    <button class="linkish" type="button" data-lt-altclose="${i}">Close</button></div>`;
}
function rewordMenu(i) {
  const box = $("lts-" + i);
  if (!box) return;
  if (box.dataset.menu === "1") { box.innerHTML = ""; box.dataset.menu = ""; return; }
  box.dataset.menu = "1"; box._alts = null; rwSel[i] = -1;
  box.innerHTML = rewordMenuHtml(i);
}
const ltClean = t => stripMarkup(String(t == null ? "" : t)).replace(/\s+/g, " ").trim();
const LT_REWORD_ONE_NANO = `You write different wordings of ONE sentence from a paragraph of a formal Australian cover letter.
Rules:
1. Write 3 versions of that sentence. Each says what the sentence says, in a different way: change the structure and most of the words, not just one or two.
2. Each is exactly ONE sentence that ends with a full stop, about the length you are given, in plain, warm, confident first-person writing. No clichés, no em dashes, no exclamation marks.
3. Each must fit where the sentence sits in the paragraph and must not repeat what the other sentences already say.
4. Never name a company, employer, product or person that is not in the sentence or the details. A [bracketed gap] may stay or move.
5. Never write a phone number, email address, link or LinkedIn.
6. Copy every number exactly as it appears in the sentence. Never add anything about the company's reputation, values, culture or work.
7. Never write "I am writing to", eager, passionate, excited, thrilled or dynamic. No contractions unless you are told they are fine: write "I am", never "I'm".
Reply with JSON only: {"options": ["...", "...", "..."]}`;
const LT_NO_NAMES = "\nThis letter is a template for any job: never name a company, employer, product or person. Where the company goes, write [the company].";
async function rewordPart(i, btn, mode = "same") {
  const d = BL(), p = d.parts[i], box = $("lts-" + i);
  let M = RW_MODES[mode] || RW_MODES.same;
  if (mode === "custom") {
    const how = (($("rwFree" + i) || {}).value || "").trim();
    if (!how) { const inp = $("rwFree" + i); if (inp) inp.focus(); return; }
    M = { ...M, note: `Change it like this: ${how}` };
  }
  // one chosen sentence, or the whole paragraph
  const sents = ltSentences(p.text), sIdx = Number.isInteger(rwSel[i]) ? rwSel[i] : -1, one = sIdx >= 0 && !!sents[sIdx] && mode !== "fit", scope = one ? sents[sIdx].trim() : p.text;
  if (rwSel[i] === -2 && mode !== "fit") { if (box) box.innerHTML = rewordMenuHtml(i); return; }
  // a rewording stays within about 15% of the length it's aiming for (the paragraph's own length, or what the menu choice asks for)
  const orig = wordCount(scope), n = Math.max(one ? 6 : 15, Math.round(M.size ? M.size(orig, partTarget(p.part, letterRange())) : orig)), lo = one ? 0.8 : 0.85, hi = one ? 1.2 : 1.15;
  const show = m => { if (box) box.innerHTML = `<p class="progress">${esc(m)}</p>`; };
  if (box) box.dataset.menu = "";
  btn.disabled = true; show("Finding other ways to say it…");
  // why a version can't be used, or "": the same rules the AI is told to follow
  // contractions go back to full words unless the original has them or the casual tone was asked for
  const keepContr = mode === "casual" || new RegExp(CL_CONTRACTION_RE.source, "i").test(scope);
  const fixWording = t => keepContr ? ltClean(t) : clNoContractions(ltClean(t));
  const bad = (t, seen) => {
    const ct = contactIn(t, p.part); if (ct) return contactWhy(ct, p.part);
    const hp = hardPhrase(t); if (hp) return `it uses "${hp}"`;
    // praise of the company that wasn't in the original is made up (a claim you wrote yourself is left alone)
    const cc = clCompanyClaim(t, d.company); if (cc && !clCompanyClaim(scope, d.company)) return `it says "${cc}" about the company, which isn't in the original or the details`;
    if (one) { if (/\n/.test(t) || ltSentences(t).length !== 1) return "it must be exactly one sentence"; if (!/[.]["”']?$/.test(t)) return "it must end with a full stop"; }
    else { const pr = proseOk(t); if (pr) return pr; }
    if (/—|!/.test(t)) return "it uses a long dash or an exclamation mark";
    if (wordCount(t) < n * lo - 3 || wordCount(t) > n * hi + 5) return `it isn't close enough to ${n} words`;
    if (changedWords(scope, t) < 2) return "it only changes one word: reword it properly";
    if (seen.has(norm(t))) return "it repeats another version";
    return "";
  };
  const seen0 = new Set([norm(scope)]);
  const nano = one ? LT_REWORD_ONE_NANO : LT_REWORD_NANO;
  const res = await aiJSON({ nano, full: nano + "\n\n" + CL_CRAFT, label: "Rewording", progress: show,
    prompt: one ? `This is one sentence from the "${partOf(p.part).label}" paragraph of a cover letter. Reword only this sentence.\nSentence:\n${scope}\nThe whole paragraph, for context only (do not copy other sentences into it):\n${p.text}\nAbout ${n} words (the sentence has ${orig}).${M.note ? "\n" + M.note : ""}${ltTemplate() ? LT_NO_NAMES : ""}\nThe candidate's details (for checking only):\n${profileToText(P()).slice(0, 3000)}`
      : `This is the "${partOf(p.part).label}" paragraph (${partOf(p.part).purpose}) of a cover letter. Keep it one paragraph of full sentences that opens with context.\nAbout ${n} words (the original has ${orig}).${M.note ? "\n" + M.note : ""}${ltTemplate() ? LT_NO_NAMES : ""}\nOriginal:\n${p.text}\nThe candidate's details (for checking only):\n${profileToText(P()).slice(0, 3500)}`,
    expect: n * 7 * 3 + 150,   // three versions of the paragraph, in characters
    schema: { type: "object", properties: { options: { type: "array", items: { type: "string" } } }, required: ["options"] },
    check: x => {
      const seen = new Set(seen0), why = [], ok = [];
      for (const t of (Array.isArray(x.options) ? x.options : []).map(fixWording).filter(Boolean)) { const w = bad(t, seen); if (w) why.push(w); else { seen.add(norm(t)); ok.push(t); } }
      return ok.length ? { ok: true, value: ok.slice(0, 3) } : { ok: false, why: why[0] || "write 3 different versions of the paragraph" };
    } });
  let list = res.data || [];
  // instead of giving up, show the AI which rule each version broke and ask it to change just that part
  if (!list.length && res.raw && Array.isArray(res.raw.options)) {
    const seen = new Set(seen0), got = [];
    for (const t of res.raw.options.map(fixWording).filter(Boolean)) {
      if (got.length >= 3) break;
      const w = bad(t, seen);
      if (!w) { seen.add(norm(t)); got.push(t); continue; }
      const fx = await aiFixText({ text: t, why: w, check: x => bad(x, seen), progress: show, context: CL_CRAFT_SHORT, expect: n * 7 + 100 });
      if (fx.text) { seen.add(norm(fx.text)); got.push(fx.text); }
    }
    list = got;
  }
  btn.disabled = false;
  if (list.length && box) {
    box.innerHTML = `<span class="small muted">Pick a new wording${one ? ` for sentence ${sIdx + 1}` : ""} (by ${esc(viaWords(res.via || res.rawVia))}). Check every detail is true:</span>${list.map((t, k) => `<button type="button" class="bl-alt" data-lt-alt="${i}.${k}">${esc(t)}</button>`).join("")}<button class="linkish" type="button" data-lt-altclose="${i}">Close</button>`;
    // a chosen sentence goes back into the paragraph in its own place
    box._alts = one ? list.map(t => sents.map((x, k) => k === sIdx ? t + (x.match(/\s*$/) || [""])[0] : x).join("")) : list;
  } else if (box) box.innerHTML = `<span class="small">${res.rejected ? aiMissHtml(aiMissWords(res)) : esc(aiMissWords(res) || "No other wordings this time.")} </span>${aiRawHtml(res)} <button class="linkish" type="button" data-lt-altclose="${i}">Close</button>`;
}
const LT_EXPAND_NANO = `You lengthen one paragraph of an Australian cover letter so it does its job fully.
Rules:
1. Keep everything it already says. Add detail from the candidate's details: never invent tasks, tools, numbers, employers or dates.
2. First person ("I"), formal, specific, Australian spelling. Never write a phone number, email address, link or LinkedIn: the letter head already has them.
3. Reach the length you're given with real detail, not padding. No clichés ("passionate", "team player", "hard-working").
4. The result is ONE paragraph of full sentences, not a list. It opens with a sentence that gives context (who you are, or what the paragraph is about) before the detail.
5. If a helpful detail is missing (for example why this company), write a short gap in square brackets such as [one specific reason] instead of guessing. Never name a company, employer, product or person that is not in the details.
6. Copy every number exactly as it appears in the details. You know nothing about the company except its name: never say anything about its reputation, values, culture, products or work.
7. At most one sentence begins with "I". Never write "I am writing to", eager, passionate, excited, thrilled or dynamic. No contractions: write "I am", never "I'm".
Reply with JSON only: {"text": "..."}`;
async function expandPart(i, btn) {
  if (!BL().parts[i].text.trim()) return writePartAI(i, btn);
  const d = BL(), p = d.parts[i], part = partOf(p.part), r = letterRange(), min = partMin(p.part, r), aim = partTarget(p.part, r), note = $("ltx-" + i), acts = $("lta-" + i), box = $("lts-" + i);
  const facts = profileToText(P()).slice(0, 5000);
  // praise of the company that wasn't already in the paragraph is made up (a claim you wrote yourself is left alone)
  const hadClaim = !!clCompanyClaim(p.text, d.company);
  const chk = t => {
    const ct = contactIn(t, p.part); if (ct) return contactWhy(ct, p.part);
    if (wordCount(t) < min * 0.9) return `it needs at least ${min} words`;
    const cc = hadClaim ? "" : clCompanyClaim(t, d.company); if (cc) return `it says "${cc}" about the company, but you know nothing about it except its name`;
    return proseOk(t);
  };
  const show = m => { if (box) { box.dataset.menu = ""; box.innerHTML = `<p class="progress">${esc(m)}</p>`; } };
  if (acts) acts.dataset.busy = "1";
  btn.disabled = true; show("Adding detail…");
  let res = await aiJSON({ nano: LT_EXPAND_NANO, label: "Expanding", progress: show, expect: Math.round(aim * 1.3 * 7) + 100,
    prompt: `Paragraph: ${part.label} (${part.purpose})\nAbout ${aim} words\nIt says now: ${p.text}\nRole: ${ltTemplate() ? "[the role]" : d.role || P().target.title || "(not given)"}\nCompany: ${ltTemplate() ? "[the company]" : d.company || "(not given: use [the company])"}${ltTemplate() ? LT_NO_NAMES : ""}\nThe candidate's details:\n${facts}`,
    schema: TEXT_SCHEMA, check: x => { const t = clNoContractions(ltClean(x.text)), w = chk(t); return w ? { ok: false, why: w } : { ok: true, value: t }; } });
  let text = res.data;
  // instead of giving up, show the AI the rule it broke and ask it to change just that part
  if (!text && res.raw && res.raw.text) {
    const fx = await aiFixText({ text: ltClean(res.raw.text), why: res.rawWhy || "it broke a rule", check: chk, progress: show, context: CL_CRAFT_SHORT });
    if (fx.text) { text = fx.text; res = { ...res, via: res.rawVia || res.via }; }
  }
  if (acts) delete acts.dataset.busy;
  btn.disabled = false;
  if (box) box.innerHTML = "";
  if (text) { lwApply(i, text); const n2 = $("ltx-" + i); if (n2) n2.textContent = `Expanded by ${viaWords(res.via)}. Check every detail is true.`; }
  else if (note) note.innerHTML = aiMissHtml(aiMissWords(res)) + " Add a detail or an example yourself." + aiRawHtml(res);
}

/* --- Saving the letter to your profile as a named template --- */
const savedLetters = privateDoc("savedLetters", "jobfinder.savedLetters.v1", () => ({ list: [] }));
const savedLetterRows = (list, del) => `<ul class="saved-list">${list.map((x, k) => `<li><span class="saved-name"><b>${esc(x.name)}</b><span class="small muted">Saved ${esc(fmtSaved(x.saved))} · ${wordCount((x.letter.parts || []).map(p => p.text).join(" "))} words</span></span><span class="b-actions"><button class="btn" type="button" data-lt-use="${k}">Use it</button>${del ? `<button class="btn ghost" type="button" data-lt-del="${k}">Delete</button>` : ""}</span></li>`).join("")}</ul>`;
function renderSavedLetters() {
  const box = $("ltSaved");
  if (!box) return;
  const list = savedLetters.data.list || [];
  box.innerHTML = list.length ? `<div class="b-sub">Your cover letter templates</div>${savedLetterRows(list, true)}` : "";
  const pick = $("ltPick"); if (pick && !pick.hidden) renderLetterPick();
}
// "Use a cover letter from my profile": the letters you've saved to your profile, to start from
// Bring in a letter (a file, or text pasted on the opening page): sort it into the five paragraphs. Returns true when it worked.
async function ltImportFile(f) {
  ltSay(`Reading ${f.name}…`);
  try { return ltImportText((await readFile(f)).text, f.name); }
  catch (e) { ltSay(e && e.message ? e.message : "Couldn't read that file.", true); return false; }
}
function ltImportText(text, label) {
  try {
    const paras = String(text || "").split(/\n\s*\n/).map(t => t.replace(/\s+/g, " ").trim()).filter(t => wordCount(t) >= 12 && !/^(dear|yours|kind regards|regards|sincerely)\b/i.test(t));
    if (!paras.length) throw new Error(`Couldn't find the paragraphs in ${label}.`);
    const five = paras.length <= 5 ? paras : [paras[0], paras.slice(1, -2).join(" "), paras[paras.length - 2], "", paras[paras.length - 1]];
    BL().parts = COVER_PARTS.map((p, i) => ({ part: p.key, text: five[i] || "" }));
    baseLetter.save(true); renderLetterPage(); syncBaseToTailor();
    if (typeof ltShowStep === "function") ltShowStep(1);
    ltSay(`Brought in ${paras.length} paragraph${paras.length === 1 ? "" : "s"} from ${label}. Check each one sits under the right heading.`);
    return true;
  } catch (e) { ltSay(e && e.message ? e.message : "Couldn't read that.", true); return false; }
}
// A message under the buttons; on the opening page it shows there too
function ltSay(m, bad) {
  const st = $("ltStatus"); if (st) st.textContent = m;
  const w = $("ltwStatus"); if (w) { w.textContent = typeof ltWelcomeOn !== "undefined" && ltWelcomeOn ? m : ""; w.classList.toggle("err", !!bad); }
}
function renderLetterPick(box = $("ltPick")) {
  const list = savedLetters.data.list || [];
  box.innerHTML = `<div class="b-sub">Cover letters in your profile</div>` + (list.length ? savedLetterRows(list, false) : `<p class="small muted">You haven't saved a cover letter to your profile yet. Write one, then press <b>Save to my profile…</b> on the Cover letter tab, and it will be here next time.</p>`);
}
async function saveLetterTemplate() {
  const st = $("ltDlStatus");
  if (!blText().length) { st.textContent = "Write your letter first, then save it."; return; }
  const gapsNow = (blText().join(" ").match(TOKEN_RE) || []).length + (BL().company.trim() ? 0 : 1) + (BL().recipient.trim() ? 0 : 1);
  const d = BL();
  const name = await askName({ title: "Save as a cover letter template", text: "It's saved to your profile, so you can start your next letter from it. Saving again with the same name replaces it.", label: "Name it", value: [d.role || P().target.title || "My cover letter", d.company].filter(Boolean).join(" – ") });
  if (!name) return;
  await savedLetters.ready;
  const list = savedLetters.data.list = (savedLetters.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), letter: JSON.parse(JSON.stringify(d)) });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedLetters.save(true);
  renderSavedLetters();
  st.textContent = `“${name}” is ${whereWords(savedLetters.where === "loading" ? profile.where : savedLetters.where)}.${gapsNow ? ` It was saved with ${gapsNow} gap${gapsNow === 1 ? "" : "s"} still highlighted in yellow. Fill ${gapsNow === 1 ? "it" : "them"} in when you use it.` : ""}`;
}

// Ask before writing over a letter you've already started
function confirmReplace(btn) {
  if (btn.dataset.sure === "1") { btn.dataset.sure = ""; btn.textContent = btn.dataset.was; return true; }
  btn.dataset.was = btn.textContent; btn.dataset.sure = "1"; btn.textContent = "Replace my letter?";
  setTimeout(() => { if (btn.dataset.sure === "1") { btn.dataset.sure = ""; btn.textContent = btn.dataset.was; } }, 4000);
  return false;
}

/* --- Warnings under the letter: select one to jump to it; each Fix changes just that one thing --- */
function goPart(i, o = {}) {
  const el = $("ltp-" + i);
  if (!el) return;
  const wrap = el.closest(".lt-part");
  smoothTo(wrap, 80);
  setTimeout(() => {
    el.focus({ preventScroll: true });
    if (o.gap) { const m = new RegExp(TOKEN_RE.source).exec(el.value); if (m) el.setSelectionRange(m.index, m.index + m[0].length); }
  }, reduceMotion() ? 0 : 350);
  wrap.classList.remove("flash-part"); void wrap.offsetWidth; wrap.classList.add("flash-part");
}
function ckGo(spec) {
  const [kind, arg] = String(spec).split(":");
  if (kind === "part" || kind === "go") return goPart(+arg);
  if (kind === "gap") { const i = BL().parts.findIndex(p => new RegExp(TOKEN_RE.source).test(p.text)); if (i >= 0) goPart(i, { gap: true }); return; }
  if (kind === "field") { const el = document.querySelector(`[data-lt="${arg}"]`); if (el) { smoothTo(el.closest("label") || el, 90); setTimeout(() => el.focus({ preventScroll: true }), reduceMotion() ? 0 : 350); } }
}
function setPartText(i, text) {
  const p = BL().parts[i];
  p.text = text;
  const el = $("ltp-" + i); if (el) el.value = text;
  baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
}
function ckFix(spec) {
  const [kind, arg] = String(spec).split(":"), i = +arg, p = BL().parts[i];
  if (kind === "go" || kind === "gap" || kind === "field") return ckGo(spec);
  if (!p) return;
  if (kind === "dash") { setPartText(i, fixDashes(p.text)); goPart(i); return; }
  if (kind === "exclaim") { setPartText(i, fixExclaims(p.text)); goPart(i); return; }
  if (kind === "expand") { goPart(i); return expandPart(i, document.querySelector(`[data-lt-expand="${i}"]`) || {}); }
  if (kind === "reword") { goPart(i); return rewordMenu(i); }
}
/* --- Sign-off: other ways to close that suit the greeting, always shown below the box --- */
let signOpen = false;
function renderSignAlts() {
  const box = $("ltSignAlts");
  if (box) box.innerHTML = signOpen ? signOptions().map(x => `<button type="button" class="bl-alt" data-lt-sign="${esc(x)}">${esc(x)}</button>`).join("") : `<button class="btn" type="button" data-lt-signmore="1" aria-expanded="false">More</button>`;
}
// six sign-offs that suit the greeting, other than the one in use
function signOptions() {
  const d = BL(), named = !/\b(hiring manager|sir|madam|team|to whom)\b/i.test(d.salutation || ""), cur = norm(d.signoff || "");
  const pool = named ? ["Yours sincerely,", "Kind regards,", "Warm regards,", "Best regards,", "With thanks,", "Many thanks,", "Regards,"] : ["Yours faithfully,", "Kind regards,", "Yours sincerely,", "Regards,", "Many thanks,", "Warm regards,", "Best wishes,"];
  return pool.filter(x => norm(x) !== cur).slice(0, 6);
}
onInit(() => {
  $("ltChecks").addEventListener("click", e => {
    const fix = e.target.closest("[data-ck]");
    if (fix) { e.stopPropagation(); ckFix(fix.dataset.ck); return; }
    const go = e.target.closest("[data-ck-go]");
    if (go) ckGo(go.dataset.ckGo);
  });
  $("ltChecks").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-ck-go]")) { e.preventDefault(); ckGo(e.target.dataset.ckGo); } });
  $("ltSignAlts").addEventListener("click", e => {
    const b = e.target.closest("[data-lt-sign]");
    if (b) { BL().signoff = b.dataset.ltSign; $("lt-sign").value = BL().signoff; signOpen = false; renderSignAlts(); letterEdited(); return; }
    if (e.target.closest("[data-lt-signmore]")) { signOpen = true; renderSignAlts(); const first = $("ltSignAlts").querySelector("[data-lt-sign]"); if (first) first.focus(); }
  });
});
