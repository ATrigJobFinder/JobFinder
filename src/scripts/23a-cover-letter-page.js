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
const ltTemplate = () => { try { return BL().mode === "template"; } catch { return false; } };
const baseLetter = privateDoc("baseLetter", "jobfinder.baseLetter.v1", () => ({ role: "", company: "", recipient: "", salutation: "Dear Hiring Manager,", parts: COVER_PARTS.map(p => ({ part: p.key, text: "" })), signoff: "Yours sincerely," }));
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
  out.push({ part: "closing", text: `Thank you for considering my application. I would welcome the opportunity to discuss how I could contribute${p.availability ? `, and I am available ${lowerFirst(p.availability.replace(/[.\s]+$/, "").replace(/^available\s+/i, "")).replace(/,\s*available\s+/i, ", ")}` : ""}.${p.contact.phone || p.contact.email ? ` I can be contacted ${listJoin([p.contact.phone && `on ${p.contact.phone}`, p.contact.email && `at ${p.contact.email}`].filter(Boolean)).replace(" and ", " or ")}.` : ""}` });
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
  if ($("clRemember").checked) await saveCoverStore();
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
      <div class="lt-part-acts" id="lta-${i}"></div><div class="lt-alts" id="lts-${i}"></div></div>`).join("");
    box.dataset.built = "1";
  }
  d.parts.forEach((p, i) => { const el = $("ltp-" + i); if (el && document.activeElement !== el) el.value = p.text; partCount(i); $("ltg-" + i).innerHTML = $("ltg-" + i).dataset.stage === letterStage() ? $("ltg-" + i).innerHTML : clGuideHtml(p.part, letterStage()); $("ltg-" + i).dataset.stage = letterStage(); });
  const r = letterRange(), st = (STAGES.find(s => s.key === letterStage()) || {}).label;
  $("ltTarget").textContent = `Aim for ${r[0]} to ${r[1]} words in all${st ? ` (${lowerFirst(st)})` : ""}.`;
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
function renderLetterPreview() {
  const st = currentLetterStyle(), L = baseLetterParts();
  mountPaper($("ltPaper"), letterHtml(L, st));
  $("ltDesign").textContent = `Design: ${st.name}`;
  const text = blText().join(" "), wc = wordCount(text);
  // gaps: [brackets] in the paragraphs, plus a blank company or "addressed to", which read [XXX]
  const bodyGaps = (text.match(TOKEN_RE) || []).length, d = BL();
  const blanks = ltTemplate() ? [] : [!String(d.recipient || "").trim() && "who it is addressed to", !String(d.company || "").trim() && "the company"].filter(Boolean);
  const gaps = bodyGaps + blanks.length;
  for (const el of document.querySelectorAll("#ltParts [data-ltp]")) { const back = $("ltb-" + el.dataset.ltp); if (back) back.innerHTML = gapHtml(el.value) + "\n"; }
  const own = blText().length > 0, r = letterRange();
  const parts = BL().parts, lab = i => partOf(parts[i].part).label;
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
    ${row(wc >= r[0] && wc <= r[1] ? "pass" : "warn", `${wc} words`, wc < r[0] ? `A little short. Aim for ${r[0]} to ${r[1]} words at your stage, so each paragraph does its job.` : wc <= r[1] ? `Right for your stage (${r[0]} to ${r[1]} words).` : `Trim it to ${r[1]} words or fewer so it stays tight.`,
      wc < r[0] && shortest ? (EXPAND_PARTS.has(parts[shortest[0]].part) ? `<button class="btn" type="button" data-ck="expand:${shortest[0]}">Expand ${esc(lab(shortest[0]).toLowerCase())} with AI</button>` : goBtn(shortest[0])) : wc > r[1] && longest ? goBtn(longest[0]) : "",
      wc < r[0] && shortest ? "part:" + shortest[0] : wc > r[1] && longest ? "part:" + longest[0] : "")}
    ${thinIdx.length ? thinIdx.map(i => row("warn", `Too short: ${esc(lab(i).toLowerCase())}`, `${wordCount(parts[i].text)} words. It needs at least ${partMin(parts[i].part, r)}. Add a detail or an example.`, EXPAND_PARTS.has(parts[i].part) ? `<button class="btn" type="button" data-ck="expand:${i}">Expand with AI</button>${goBtn(i)}` : goBtn(i), "part:" + i)).join("") : row("pass", "Every paragraph has enough to it", "Each one does its job.", "", "")}
    ${row(gaps ? "warn" : "pass", gaps ? `<mark class="gap-mark">${gaps} gap${gaps === 1 ? "" : "s"} to fill</mark>` : "No gaps left", gaps ? `Missing information is highlighted in yellow${blanks.length ? ` (${esc(listJoin(blanks))} shows as [XXX])` : ""}. You can save and come back to it. Fill each one before you send the letter.` : "Ready to send, or to tailor to a job.",
      gaps ? `${bodyGaps ? '<button class="btn" type="button" data-ck="gap">Go to the next gap</button>' : ""}${!String(d.company || "").trim() ? '<button class="btn" type="button" data-ck="field:company">Add the company</button>' : ""}${!String(d.recipient || "").trim() ? '<button class="btn" type="button" data-ck="field:recipient">Add who it is addressed to</button>' : ""}` : "", gaps ? (bodyGaps ? "gap" : !String(d.company || "").trim() ? "field:company" : "field:recipient") : "")}
    ${qualityRows}
    ${quality.length ? "" : row("pass", "Reads like you wrote it", "No clichés, long dashes or repeated openings.", "", "")}
  </ul>` : `<p class="small muted">The preview shows a sample letter. Select <b>Start from my profile</b> to write yours.</p>`;
  const sc = letterScore(parts, r, wc, gaps, quality), se = $("ltScore");
  if (se) se.innerHTML = `Cover letter strength: <span style="color:${sc >= 80 ? "var(--good)" : sc >= 60 ? "var(--accent)" : "var(--warn)"}">${sc}/100</span>`;
  // a letter with gaps can still be saved, copied and downloaded as a draft (Word highlights the gaps yellow)
  ["ltDocx", "ltPdf", "ltCopy"].forEach(id => { $(id).disabled = !own; });
  $("ltSave").disabled = !own;
  if (typeof ltV22Preview === "function") ltV22Preview();
  $("ltDlStatus").textContent = !own ? "" : gaps ? `${gaps} gap${gaps === 1 ? "" : "s"} still highlighted in yellow. You can save or download it as a draft; Word keeps the highlight.` : "";
}
async function downloadBaseLetter(kind, btn) {
  const L = baseLetterParts(), st = currentLetterStyle();
  const name = `${(L.signName || "Cover").replace(/[\\/:*?"<>|]+/g, "")} - Cover Letter${BL().role ? ` - ${BL().role}` : ""}`.replace(/[\\/:*?"<>|]+/g, "").slice(0, 150) + "." + kind;
  await downloadMade(name, () => kind === "pdf" ? buildCoverPdf(L, st) : buildCoverDocx(L, st), $("ltDlStatus"), btn);
}
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
    else if (i != null) { BL().parts[+i].text = e.target.value; const back = $("ltb-" + i); if (back) back.innerHTML = gapHtml(e.target.value) + "\n"; partCount(+i); letterEdited(); }
  };
  $("view-letter").addEventListener("input", ltEdit);
  $("view-letter").addEventListener("change", e => { if (e.target.dataset.lt) ltEdit(e); });
  $("ltFromProfile").addEventListener("click", async () => {
    const st = $("ltStatus"), btn = $("ltFromProfile");
    if (!hasProfile(P())) { st.textContent = "Add your details in the resume builder first, so the letter has something to draw on."; return; }
    if (blText().length && !confirmReplace(btn)) return;
    // say it's being written, on the Cover letter tab where the result will appear
    btn.disabled = true; st.classList.add("busy");
    st.innerHTML = `<span class="lt-spin" aria-hidden="true"></span> Writing your cover letter from your profile…`;
    ltShowStep(1); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
    await new Promise(r => setTimeout(r, 900));
    BL().parts = letterFromProfile(P());
    if (!BL().role && P().target.title) BL().role = P().target.title;
    baseLetter.save(true); renderLetterPage(); syncBaseToTailor();
    btn.disabled = false; st.classList.remove("busy");
    st.textContent = "Written from your profile. Fill in anything in [brackets], and make each paragraph sound like you.";
  });
  $("ltPickBtn").addEventListener("click", async () => {
    const box = $("ltPick"), b = $("ltPickBtn"), open = box.hidden;
    box.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { await savedLetters.ready; renderLetterPick(); }
  });
  $("ltImport").addEventListener("click", () => $("ltFile").click());
  $("ltFile").addEventListener("change", async () => {
    const f = $("ltFile").files[0], st = $("ltStatus"); $("ltFile").value = "";
    if (!f) return;
    st.textContent = `Reading ${f.name}…`;
    try {
      const { text } = await readFile(f);
      const paras = text.split(/\n\s*\n/).map(t => t.replace(/\s+/g, " ").trim()).filter(t => wordCount(t) >= 12 && !/^(dear|yours|kind regards|regards|sincerely)\b/i.test(t));
      if (!paras.length) throw new Error(`Couldn't find the paragraphs in ${f.name}.`);
      const five = paras.length <= 5 ? paras : [paras[0], paras.slice(1, -2).join(" "), paras[paras.length - 2], "", paras[paras.length - 1]];
      BL().parts = COVER_PARTS.map((p, i) => ({ part: p.key, text: five[i] || "" }));
      baseLetter.save(true); renderLetterPage(); syncBaseToTailor();
      st.textContent = `Brought in ${paras.length} paragraph${paras.length === 1 ? "" : "s"} from ${f.name}. Check each one sits under the right heading.`;
    } catch (e) { st.textContent = e && e.message ? e.message : "Couldn't read that file."; }
  });
  $("ltDocx").addEventListener("click", () => downloadBaseLetter("docx", $("ltDocx")));
  $("ltPdf").addEventListener("click", () => downloadBaseLetter("pdf", $("ltPdf")));
  $("ltCopy").addEventListener("click", async () => {
    const L = baseLetterParts(), b = $("ltCopy");
    const text = [L.name, L.contact.join(" | "), "", L.date, "", ...L.recipient, "", L.re, "", L.salutation, "", ...L.paragraphs.flatMap(p => [p, ""]), L.signoff, "", L.signName].join("\n");
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; } catch { b.textContent = "Couldn't copy"; }
    setTimeout(() => { b.textContent = "Copy text"; }, 1800);
  });
  $("ltTailor").addEventListener("click", () => {
    tailorMode = tailorMode === "resume" ? "both" : tailorMode;
    try { localStorage.setItem(TAILOR_KEY, tailorMode); } catch { /* storage blocked */ }
    applyTailorMode(); openView("scanner");
  });
  $("ltDesignBtn").addEventListener("click", () => openView("cv", { kind: "letter" }));
  $("ltSave").addEventListener("click", saveLetterTemplate);
  $("view-letter").addEventListener("click", e => {
    const x = e.target.closest("[data-lt-expand]"); if (x) { expandPart(+x.dataset.ltExpand, x); return; }
    const wr = e.target.closest("[data-lt-write]"); if (wr) { writePartAI(+wr.dataset.ltWrite, wr); return; }
    const rs = e.target.closest("[data-lt-reword-size]"); if (rs) { rewordPart(+rs.dataset.ltRewordSize, rs, true); return; }
    const rw = e.target.closest("[data-lt-reword]"); if (rw) { rewordPart(+rw.dataset.ltReword, rw); return; }
    const alt = e.target.closest("[data-lt-alt]");
    if (alt) {
      const [i, k] = alt.dataset.ltAlt.split(".").map(Number), box = $("lts-" + i), p = BL().parts[i];
      if (box && box._alts && box._alts[k] && p) { p.text = box._alts[k]; const el = $("ltp-" + i); if (el) el.value = p.text; box.innerHTML = ""; baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor(); }
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
  w.textContent = n ? `${n} words · at least ${min}` : `at least ${min} words`;
  w.classList.toggle("short", !!n && n < min); w.classList.toggle("good", n >= min);
  // Opening, Experience and Education and skills can be expanded with AI (or written, when empty); every paragraph can be reworded.
  // "Why this company" is your own reason, so AI only drafts it when it's empty.
  const keepNote = ($("ltx-" + i) || {}).innerHTML || "";
  if (acts && !acts.dataset.busy) acts.innerHTML = `${EXPAND_PARTS.has(p.part) ? `<button class="btn" type="button" data-lt-expand="${i}">${n ? "Expand with AI" : "Write with AI"}</button>` : !n ? `<button class="btn" type="button" data-lt-write="${i}">Write with AI</button>` : ""}${n ? `<button class="btn" type="button" data-lt-reword="${i}" title="Other ways to say it, about the same length">Reword</button><button class="btn" type="button" data-lt-reword-size="${i}" title="Reword to about ${Math.round(min * 1.2)} words, the recommended length for this paragraph">Reword to the right size</button>` : ""}<span class="small muted lt-note" id="ltx-${i}">${keepNote}</span>`;
}
/* --- Write a paragraph with AI, using the craft rules and the rules for your career stage --- */
// Every AI job on this page writes one paragraph of a letter: begin with context, and use full sentences only
const EXPAND_PARTS = new Set(["opening", "experience", "education"]);
// Is this text one paragraph of full sentences? Returns what's wrong, or "".
function proseOk(t) {
  const x = String(t || "").trim();
  if (/^\s*([-*•▪–]|\d+[.)])\s/m.test(x) || /\n/.test(x)) return "it must be one paragraph of full sentences, not a list";
  if (!/[.!?]["”']?$/.test(x)) return "it must end with a full stop";
  const ss = x.replace(TOKEN_RE, " Xx ").split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  if (!ss.length || ss.some(s => wordCount(s) < 3 || !/^[A-Z“"'(]/.test(s))) return "every sentence must be a full sentence that starts with a capital letter";
  return "";
}
const LT_WRITE_NANO = `You write one paragraph of a formal Australian cover letter for a real person, in the first person.
Rules:
1. Use only facts from the candidate's details. Never invent tasks, tools, numbers, employers, qualifications or dates.
2. Where a helpful detail is missing, write a short gap in square brackets such as [one specific reason], and never guess.
3. Concrete beats general: one specific example with its result beats a list of qualities.
4. Australian spelling, no clichés, no em dashes, no exclamation marks, at most two sentences starting with "I".
5. Reach the length you're given with real detail, not padding.
6. This is ONE paragraph of prose in a letter, not a list. Open with a sentence that gives context (who you are, or what this paragraph is about) before the detail. Use full sentences only: no bullet points, no fragments, no headings, no lists of keywords.
Reply with JSON only: {"text": "..."}`;
const hardPhrase = t => { for (const re of CL_HARD) { const m = String(t).match(re); if (m) return m[0]; } return ""; };
function partSource(i) {
  const d = BL();
  return { facts: profileToText(P()).slice(0, 5000), src: [profileToText(P()), d.role, d.company, d.recipient, BL().parts.map(p => p.text).join("\n")].join("\n") };
}
async function writePartAI(i, btn) {
  const d = BL(), p = d.parts[i], part = partOf(p.part), r = letterRange(), min = partMin(p.part, r), note = $("ltx-" + i), acts = $("lta-" + i);
  const { facts, src } = partSource(i), g = CL_GUIDE[p.part], stage = letterStage();
  if (!hasProfile(P())) { if (note) note.textContent = "Add your details in the resume builder first, so there's something to write from."; return; }
  const others = d.parts.filter((x, k) => k !== i && x.text.trim()).map(x => `${partOf(x.part).label}: ${x.text}`).join("\n");
  const toks = p.text.match(TOKEN_RE) || [];
  if (acts) acts.dataset.busy = "1";
  btn.disabled = true;
  const res = await aiJSON({ nano: LT_WRITE_NANO, full: LT_WRITE_NANO + "\n\n" + CL_CRAFT, prompt: `Write the "${part.label}" paragraph. Its job: ${part.purpose}
Good looks like: ${g.good}
At this career stage (${(STAGES.find(s => s.key === stage) || {}).label || stage}): ${clRule(p.part, stage)}
Avoid: ${g.avoid}
Length: ${min} to ${Math.round(min * 1.5)} words.
Role: ${d.role || P().target.title || "(not given: use [the role])"}
Company: ${d.company || "(not given: use [the company])"}
${others ? `The other paragraphs so far (don't repeat them):\n${others}\n` : ""}
A paragraph written for someone else, to show how it's built (never reuse its words, facts or numbers):
${g.example}

The candidate's details:
${facts}`, schema: TEXT_SCHEMA, label: "Writing", progress: m => { if (note) note.textContent = m; },
    check: x => {
      const t = stripMarkup(String(x.text || "")).replace(/\s+/g, " ").trim();
      const hp = hardPhrase(t); if (hp) return { ok: false, why: `it uses "${hp}"` };
      if (/—|!/.test(t)) return { ok: false, why: "it uses a long dash or an exclamation mark" };
      if (wordCount(t) < min * 0.9) return { ok: false, why: `it needs at least ${min} words` };
      const pr = proseOk(t); if (pr) return { ok: false, why: pr };
      return { ok: true, value: t };
    } });
  if (acts) delete acts.dataset.busy;
  btn.disabled = false;
  if (res.data) {
    p.text = res.data; const el = $("ltp-" + i); if (el) el.value = p.text;
    baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
    const n2 = $("ltx-" + i) || (() => { const a = $("lta-" + i); if (a) a.insertAdjacentHTML("beforeend", `<span class="small muted" id="ltx-${i}"></span>`); return $("ltx-" + i); })();
    if (n2) n2.textContent = `Written by ${viaWords(res.via)} from your profile. Check every detail is true and sounds like you.`;
  } else if (note) note.innerHTML = aiMissHtml(aiMissWords(res)) + " Write it yourself, or start from your profile." + aiRawHtml(res);
}
/* --- Reword: up to three other ways to say a paragraph --- */
const LT_REWORD_NANO = `You write different wordings of one paragraph of a formal Australian cover letter.
Rules:
1. Write 3 versions. Each keeps every [bracketed gap] exactly and says what the original says, in a different way. You may add or drop detail where it reads better.
2. Change the sentence structure and the opening words, not the meaning. Each reads as plain, warm, confident first-person writing.
3. Each is about the same length as the original, no clichés, no em dashes, no exclamation marks.
4. Each is ONE paragraph of full sentences, not a list. It opens with a sentence that gives context (who you are, or what the paragraph is about) before the detail.
Reply with JSON only: {"options": ["...", "...", "..."]}`;
async function rewordPart(i, btn, toSize) {
  const d = BL(), p = d.parts[i], note = $("ltx-" + i), box = $("lts-" + i), { src } = partSource(i);
  // by default a rewording stays within about 15% of the length it's rewording; "to the right size" aims for the recommended length
  const n = toSize ? Math.round(partMin(p.part, letterRange()) * 1.2) : wordCount(p.text), lo = toSize ? 0.85 : 0.85, hi = toSize ? 1.15 : 1.15;
  const toks = p.text.match(TOKEN_RE) || [];
  btn.disabled = true;
  if (box) box.innerHTML = `<p class="progress">Finding other ways to say it…</p>`;
  const res = await aiJSON({ nano: LT_REWORD_NANO, full: LT_REWORD_NANO + "\n\n" + CL_CRAFT, prompt: `This is the "${partOf(p.part).label}" paragraph (${partOf(p.part).purpose}) of a cover letter. Keep it one paragraph of full sentences that opens with context.\nAbout ${n} words.\nOriginal:\n${p.text}\nThe candidate's details (for checking only):\n${profileToText(P()).slice(0, 3500)}`,
    schema: { type: "object", properties: { options: { type: "array", items: { type: "string" } } }, required: ["options"] }, label: "Rewording", progress: m => { if (box) box.innerHTML = `<p class="progress">${esc(m)}</p>`; },
    check: x => {
      const seen = new Set([norm(p.text)]), why = [];
      const opts = (Array.isArray(x.options) ? x.options : []).map(t => stripMarkup(String(t)).replace(/\s+/g, " ").trim()).filter(Boolean);
      const bad = t => {
        if (!toks.every(k => t.includes(k))) return "it left out a [bracketed gap]";
        const hp = hardPhrase(t); if (hp) return `it uses "${hp}"`;
        const pr = proseOk(t); if (pr) return pr;
        if (/—|!/.test(t)) return "it uses a long dash or an exclamation mark";
        if (wordCount(t) < n * lo - 3 || wordCount(t) > n * hi + 5) return "it isn't close enough to the paragraph's length";
        if (seen.has(norm(t))) return "it repeats another version";
        return "";
      };
      const ok = opts.filter(t => { const w = bad(t); if (w) { why.push(w); return false; } seen.add(norm(t)); return true; });
      if (ok.length) return { ok: true, value: ok.slice(0, 3) };
      return { ok: false, why: why[0] || "write 3 different versions of the paragraph" };
    } });
  btn.disabled = false;
  if (res.data && box) {
    box.innerHTML = `<span class="small muted">Pick one to use instead (by ${esc(viaWords(res.via))}). Check every detail is true:</span>${res.data.map((t, k) => `<button type="button" class="bl-alt" data-lt-alt="${i}.${k}">${esc(t)}</button>`).join("")}<button class="linkish" type="button" data-lt-altclose="${i}">Close</button>`;
    box._alts = res.data;
  } else if (box) box.innerHTML = `<span class="small">${res.rejected ? aiMissHtml(aiMissWords(res)) : esc(aiMissWords(res) || "No other wordings this time.")} ${res.rejected ? "" : " Rewording needs an AI; connect one in Connect your AI."}</span>${aiRawHtml(res)} <button class="linkish" type="button" data-lt-altclose="${i}">Close</button>`;
}
const LT_EXPAND_NANO = `You lengthen one paragraph of an Australian cover letter so it does its job fully.
Rules:
1. Keep everything it already says. Add only facts from the candidate's details: never invent tasks, tools, numbers, employers or dates.
2. First person ("I"), formal, specific, Australian spelling. Keep any [bracketed gap] exactly as it is.
3. Reach the length you're given with real detail, not padding. No clichés ("passionate", "team player", "hard-working").
4. The result is ONE paragraph of full sentences, not a list. It opens with a sentence that gives context (who you are, or what the paragraph is about) before the detail.
Reply with JSON only: {"text": "..."}`;
async function expandPart(i, btn) {
  if (!BL().parts[i].text.trim()) return writePartAI(i, btn);
  const d = BL(), p = d.parts[i], part = partOf(p.part), r = letterRange(), min = partMin(p.part, r), note = $("ltx-" + i), acts = $("lta-" + i);
  const facts = profileToText(P()).slice(0, 5000), src = [facts, p.text, d.role, d.company].join("\n");
  const toks = p.text.match(TOKEN_RE) || [];
  if (acts) acts.dataset.busy = "1";
  btn.disabled = true;
  const res = await aiJSON({ nano: LT_EXPAND_NANO, prompt: `Paragraph: ${part.label} (${part.purpose})\nAim for: ${min} to ${Math.round(min * 1.6)} words\nIt says now: ${p.text}\nRole: ${d.role || P().target.title || "(not given)"}\nCompany: ${d.company || "(not given)"}\nThe candidate's details:\n${facts}`, schema: TEXT_SCHEMA, label: "Expanding", progress: m => { if (note) note.textContent = m; },
    check: x => {
      const t = stripMarkup(String(x.text || "")).replace(/\s+/g, " ").trim();
      if (toks.some(k => !t.includes(k))) return { ok: false, why: "keep every [bracketed gap] exactly as it is" };
      if (wordCount(t) < min * 0.9) return { ok: false, why: `it needs at least ${min} words` };
      const pr = proseOk(t); if (pr) return { ok: false, why: pr };
      return { ok: true, value: t };
    } });
  if (acts) delete acts.dataset.busy;
  btn.disabled = false;
  if (res.data) { p.text = res.data; const el = $("ltp-" + i); if (el) el.value = p.text; baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor(); const n2 = $("ltx-" + i); if (n2) n2.textContent = `Expanded by ${viaWords(res.via)}. Check every detail is true.`; else { const a = $("lta-" + i); if (a) a.innerHTML = `<span class="small muted">Expanded by ${esc(viaWords(res.via))}. Check every detail is true.</span>`; } }
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
function renderLetterPick() {
  const box = $("ltPick"), list = savedLetters.data.list || [];
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
  if (kind === "reword") { goPart(i); return rewordPart(i, document.querySelector(`[data-lt-reword="${i}"]`) || {}); }
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
