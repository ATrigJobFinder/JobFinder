/* ===================== Cover letters: designs that match each resume template, and the Create or edit cover letter page ===================== */
// A letter takes its fonts, colour and name styling from the resume template you've chosen
function letterStyle(tpl, accent) {
  const t = tpl || DEFAULT_LETTER_STYLE;
  if (!tpl) return DEFAULT_LETTER_STYLE;
  // the resume's font follows into a letter that matches it
  const lf = ((profile && profile.data && profile.data.prefs) || {}).letterFont;   // a font chosen on the cover letter's own Layout page
  const fp = FONTS[lf] ? lf : typeof fontPref === "function" && letterMatched() ? fontPref() : "";
  return {
    body: fp || t.body, head: fp || t.head, accent: accent || t.accent, caps: !!(t.nm && t.nm.caps), track: t.nm && t.nm.track ? Math.round(t.nm.track * 250) : 0,
    align: t.nm && t.nm.align === "center" ? "center" : "left",
    look: t.layout === "band" ? "band" : t.layout === "sidebar" ? "side" : "rule",
    pdf: (FONTS[fp || t.body] || FONTS.Calibri).pdf, pdfHead: (FONTS[fp || t.head] || FONTS.Calibri).pdf, name: t.name
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
  const c = P().cv;
  if (c.letterAccent && t.accents.includes(c.letterAccent) && (letterMatched() ? c.letterAccentFor === t.key : c.letterTemplate === t.key)) return c.letterAccent;   // a colour chosen for the letter on its own Layout page
  const sep = !letterMatched() && CV_TEMPLATES.some(x => x.key === c.letterTemplate);
  const tk = sep ? c.letterTemplate : c.template, a = sep ? c.letterAccent : c.accent;
  return tk === t.key && t.accents.includes(a) ? a : t.accent;
}
// The letter starts with the resume's design. Choosing another one changes the letter only, never the resume.
function pickLetterTpl(key) {
  const c = P().cv;
  if (key === resumeDesign().key) { P().prefs.letterMatch = true; c.letterAccent = ""; }
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
  const vars = `--lt-accent:${st.accent};--lt-body:${esc(css(st.body))};--lt-head:${esc(css(st.head))};--lt-track:${st.caps ? (st.track / 250).toFixed(2) + "em" : "0"};--lt-mm:${lay.mm};--lt-lh:${lay.lh};--lt-gap:${lay.gap}`;
  // an email: the subject line, the greeting, the paragraphs, then the name and how to reach you. No letter head and no date.
  if (L.email) return `<div class="lt-sheet lt-email lt-${st.look}" style="${vars}">
    <div class="lt-subject"><span>Subject</span>${gapHtml(L.subject)}</div>
    <p>${gapHtml(L.salutation)}</p>
    ${L.paragraphs.map(p => `<p class="lt-p">${gapHtml(p)}</p>`).join("")}
    <p class="lt-sign">${gapHtml(L.signoff)}</p>
    <p class="lt-signname">${esc(L.signName)}</p>
    <p class="lt-emailcontact">${esc(L.contact.join("  |  "))}</p>
  </div>`;
  // gaps ([XXX], [the company]…) are highlighted yellow
  return `<div class="lt-sheet lt-${st.look} ${st.align === "center" ? "lt-center" : ""}" style="--lt-accent:${st.accent};--lt-body:${esc(css(st.body))};--lt-head:${esc(css(st.head))};--lt-track:${st.caps ? (st.track / 250).toFixed(2) + "em" : "0"};--lt-mm:${lay.mm};--lt-lh:${lay.lh};--lt-gap:${lay.gap}">
    <header class="lt-head"><div class="lt-name">${esc(name)}</div><div class="lt-contact">${esc(L.contact.join("  |  "))}</div></header>
    <div class="lt-date">${esc(L.date)}</div>
    ${L.recipient && L.recipient.length ? `<div class="lt-to">${L.recipient.map(gapHtml).join("<br>")}</div>` : ""}
    ${L.greetFirst ? `<p>${gapHtml(L.salutation)}</p>${L.re ? `<div class="lt-re">${gapHtml(L.re)}</div>` : ""}` : `${L.re ? `<div class="lt-re">${gapHtml(L.re)}</div>` : ""}<p>${gapHtml(L.salutation)}</p>`}
    ${L.paragraphs.map(p => `<p class="lt-p">${gapHtml(p)}</p>`).join("")}
    <p class="lt-sign">${gapHtml(L.signoff)}</p>
    <p class="lt-signname">${esc(L.signName)}</p>
  </div>`;
}

/* --- The base letter: written once, reused when tailoring --- */
// What a blank looks like in the letter: the box's name, then an example, in yellow brackets
const PH_TITLE = "[Job title]";
const PH = { who: "[Hiring manager's name, e.g. Sam Lee]", company: "[Company name, e.g. Sydney Water]", role: "[Job title, e.g. Graduate Engineer]" };
// The blanks in a template letter, written [LABEL: what to put there] (each is about ten words, so a template fills about the space it should)
const LT_TPL = {
  hook: "[PROJECT/SECTOR HOOK: one specific project, product or part of the sector that draws you to them]",
  credential: "[HEADLINE CREDENTIAL: your strongest degree, result or experience for this role]",
  tailored: "[TAILORED LINE: link your major project or a course to this role, in one sentence]",
  requirement: "[KEY REQUIREMENT FROM AD: the skill or experience the ad lists first]"   // sits inside paragraph 4, so tailoring to a job fills just this blank
};
// In a template, paragraphs 1, 3 and 5 are described for this structure (paragraph 4 keeps its own heading, "Why this company")
const LT_TPL_PARTS = {
  opening: { label: "Opening", purpose: "The role, one line on why this company in particular (a project or sector hook), and your headline credential." },
  education: { label: "Education and skills", purpose: "Your most relevant degree, the subjects, tools and certificates, then a tailored line linking your major project or a course to the role." },
  closing: { label: "Close", purpose: "Thanks, your availability, and a call to action." }
};
// a template for any job unless you've chosen "A specific job" (or already typed a job, company or recipient)
// "Who is this letter for?": a template for any job, a specific job, or an email template (a template written as an email: a subject line, no letter head)
const ltEmail = () => { try { return BL().mode === "email"; } catch { return false; } };
const ltTemplate = () => { try { const d = BL(); return d.mode === "template" || d.mode === "email" || (!d.mode && !d.role && !d.company && !d.recipient); } catch { return false; } };
const baseLetter = privateDoc("baseLetter", "jobfinder.baseLetter.v1", () => ({ role: "", company: "", recipient: "", salutation: "Dear Hiring Manager,", parts: COVER_PARTS.map(p => ({ part: p.key, text: "" })), signoff: "Kind regards,", mode: "template", plan: {} }));   // "Kind regards" is the safe Australian default whether or not you have a name to write to
const BL = () => baseLetter.data;
const blText = () => BL().parts.map(p => p.text.trim()).filter(Boolean);
function baseLetterParts(forSample) {
  const p = forSample || !hasProfile(P()) ? SAMPLE_PROFILE : P(), c = p.contact, d = BL();
  const paras = blText();
  const sample = forSample || !paras.length;
  const asEmail = ltEmail() && !forSample;
  return {
    email: asEmail,
    // an email: the subject line, and the resume is attached in the close
    subject: asEmail ? LR.emailSubject(PH_TITLE, c.name || "Your name", "") : "",
    name: c.name || "Your name",
    contact: [c.location, c.phone ? `${c.phoneCode && !/^(\+|0)/.test(c.phone) ? c.phoneCode + " " : ""}${c.phone}` : "", c.email, c.linkedin ? shortUrl(c.linkedin) : ""].filter(Boolean),
    date: todayAU(),
    // no inside address (who it goes to and the company's name): the greeting names the person, and the opening names the employer
    recipient: [],
    greetFirst: true,   // the greeting comes first, then the Re: line
    // the Re: line is the job title, with the place and any reference number the ad gives (never "Application for…")
    re: ltTemplate() ? `Re: ${PH.role}` : ((d.role || p.target.title) ? (ltReLine() || `Re: ${d.role || p.target.title}`) : `Re: ${PH.role}${String(d.ref || "").trim() ? ` (Ref ${String(d.ref).trim()})` : ""}`),
    salutation: ltTemplate() ? "Dear Hiring Manager," : LR.greeting(d.salutation && !/^dear hiring manager,?$/i.test(d.salutation.trim()) ? d.salutation : d.recipient, ""),
    paragraphs: (sample ? letterFromProfile(p).map(x => x.text).filter(t => t.trim()) : paras).map((t, k, all) => asEmail && k === all.length - 1 && !/resume is attached/i.test(t) ? "My resume is attached. " + t : t),
    signoff: d.signoff || "Kind regards,",
    signName: c.name || ""
  };
}
// A paragraph that is only [brackets]: nothing written yet, so nothing for the AI to expand or reword
const ltBracketOnly = t => !!String(t || "").trim() && !String(t).replace(/\[[^\]\n]*\]/g, "").replace(/[\s.,;:]/g, "");
// The Experience paragraph when no job on the resume has bullet points to tell: the whole paragraph is brackets, about ten words each,
// so it is clear what to write and it fills about the right space. Experience comes from jobs only (never a project or volunteering).
function experienceFromProfile(p) {
  const job = lwRankJobs(p, lwAllJobs(p))[0];   // the job closest to the one applied for
  const a = t => /^[aeiou]/i.test(t) ? "an" : "a", where = job ? (job.title ? `your work as ${a(job.title)} ${job.title}${job.org ? ` at ${job.org}` : ""}` : `your work at ${job.org}`) : "your most relevant job";
  return [`[Where you worked and the problem or situation you faced, in one sentence.]`, `[The first thing you personally did about it, and the tools you used.]`, `[What else you did, with one specific example from ${where}.]`, `[How you did it, and who you worked with or led.]`, `[The result, with a number such as a percentage, amount or count.]`, `[Why that result matters for the job you are applying for.]`].join(" ");
}
// A general letter written from the profile, without AI. Gaps are left in [brackets] for you to fill.
function letterFromProfile(p) {
  const role = ltTemplate() ? PH.role : BL().role || p.target.title || PH.role;
  const company = ltTemplate() ? PH.company : BL().company;   // blank stays a placeholder, filled when the company is typed in
  const edu = lwEdu(p);   // the degree closest to the job
  const exps = lwJobs(p).slice(0, 2);   // the jobs with bullets, closest to the job first
  // "Event management" reads naturally mid-sentence as "event management"; names like Canva or SQL stay as they are
  const skills = lwSkillsUse(p).slice(0, 3).map(s => / /.test(s) && /^[A-Z][a-z]+( [a-z]+)+$/.test(s) ? lowerFirst(s) : s);
  // a bullet that starts with a verb becomes "I led…"; one that doesn't ("Customer service for 150+ guests") becomes "my work included…"
  const clause = b => { const t = String(b).replace(/[.\s]+$/, ""); if (!t) return null; return (ACTION_START.test(t) || /^(cut|hit|let|shut|split|spread|grew|drove|rose|saw|began|became|bought|caught|dealt|fed|got|hired|knew|left|lost|paid|rode|sought|stood|swept|threw|understood)(?![a-z])/i.test(t)) ? { t: "I " + t[0].toLowerCase() + t.slice(1), verb: true } : { t: "my work included " + t[0].toLowerCase() + t.slice(1), verb: false }; };
  const eduLine = edu && !edu.degree ? (edu.inst ? `I studied at ${edu.inst}.` : "") : edu ? (lwEduStatus(edu).inProgress ? `I am currently completing a ${edu.degree}${edu.inst ? ` at ${edu.inst}` : ""}${edu.end ? `, finishing in ${showDate(edu.end)}` : ""}.` : `I hold a ${edu.degree}${edu.inst ? ` from ${edu.inst}` : ""}.`) : "";
  const out = [];
  // Template: the role, one line on why this company in particular, then the headline credential
  const credential = `${eduLine}${skills.length ? ` I would bring practical experience in ${listJoin(skills)}.` : ""}`.trim() || LT_TPL.credential;
  out.push({ part: "opening", text: (ltTemplate()
    ? `I am applying for the ${role} role at ${company}. What draws me to this employer in particular is ${LT_TPL.hook}. ${credential}`
    : `I am applying for the ${role} role${company ? ` at ${company}` : ""}. ${eduLine}${skills.length ? ` I would bring practical experience in ${listJoin(skills)}.` : ""}`).replace(/\s+/g, " ").trim() });
  const exp = exps.map((e, i) => {
    const cl = lwPinFirst(lwBestBullets(e.bullets, 4), e.bullets).map(clause).filter(Boolean);
    if (!cl.length) return "";
    const first = i === 0 ? `As ${/^[aeiou]/i.test(e.title) ? "an" : "a"} ${e.title}${e.org ? ` at ${e.org}` : ""}, ${cl[0].t}.` : `${e.org ? `At ${e.org}` : `As ${e.title}`}, ${cl[0].t}.`;
    // the closest job gets more examples, so the paragraph proves the point
    return first + cl.slice(1, i === 0 ? 3 : 2).map(c => c.verb ? ` ${c.t.replace(/^I /, "I also ")}.` : ` ${c.t.replace(/^my work included/, "My work also included")}.`).join("");
  }).filter(Boolean);
  out.push({ part: "experience", text: exp.length ? exp.join(" ") + " [One line on why this experience matters for this job.]" : experienceFromProfile(p) });
  const proj = edu && val(edu.project) ? ` I also completed ${lowerFirst(val(edu.project).replace(/^(thesis|project|capstone)\s*:\s*/i, (m, w) => `a ${/^(thesis|project|capstone)$/i.test(w) ? "major project" : w.toLowerCase()} on `).replace(/[.\s]+$/, "").replace(/ on ([A-Z])(?=[a-z])/, (m, c) => " on " + c.toLowerCase()))}.` : "";
  const certs = p.skills.certs.length ? ` I also hold ${listJoin(p.skills.certs.slice(0, 2))}.` : "";
  const subj = edu ? pickSubjects(edu, p).slice(0, 5) : [];
  // Education and skills runs to about 100 words: the most relevant degree, the subjects and project, the tools and certificates, and a line that ties them to the role
  const when = edu && lwEduStatus(edu).inProgress ? (edu.end ? `, finishing in ${showDate(edu.end)},` : ", which I am completing now,") : edu && edu.end ? `, finished in ${showDate(edu.end)},` : "";
  const degreeS = edu && edu.degree ? `My ${edu.degree}${edu.inst ? ` at ${edu.inst}` : ""}${when} is the foundation I would bring to the ${role} role.` : edu && edu.inst ? `I studied at ${edu.inst}.` : "";
  const subjS = subj.length ? ` My coursework included ${listJoin(subj)}.` : "";
  const toolsS = p.skills.software.length ? ` I work with ${listJoin(p.skills.software.slice(0, 3))}.` : "";
  const eduText = `${degreeS}${subjS}${proj}${toolsS}${certs}`.trim();
  // Template: ends with a tailored line that links the major project or a course to the role
  const eduGaps = "[Your degree or course, where you studied it and when you finish.] [The subjects or project closest to the job, and what they taught you.] [The tools and certificates you use, and what each lets you do.]";
  out.push({ part: "education", text: ltTemplate() ? `${eduText || eduGaps} ${LT_TPL.tailored}` : (eduText || `${eduGaps} [Why that study and those skills matter for this role.]`) });
  const why = ltTemplate() ? "" : lwClean(BL().why);   // the person's own reason for choosing this employer, if they gave one
  // brackets that are not the company's name are about ten words each, so a template fills about the space it should
  // Template: why this company, with the ad's key requirement written into the paragraph itself as its own blank
  out.push({ part: "motivation", text: ltTemplate()
    ? `I want to work at ${company || "[the company]"} because [one specific reason you want to work for this employer]. I want to do [the work you want to do and why it suits you], and the ad's key requirement, ${LT_TPL.requirement}, is where I would contribute most. [One strength of yours, and how it would help this team do its work.]`
    : why ? `I want to work at ${company} because ${/^I( |')/.test(why) ? why : lowerFirst(why)}.` : "" });   // (no reason given: the paragraph waits for one)
  const avail = lwClean(BL().avail) || p.availability;   // the start date typed for this letter, or the one in the profile
  const availTxt = avail ? lowerFirst(String(avail).replace(/[.\s]+$/, "").replace(/^available\s+/i, "")).replace(/,\s*available\s+/i, ", ") : "";
  // Template: thanks first, then availability, then a call to action
  const reach = [p.contact.phone, p.contact.email].filter(Boolean)[0];
  out.push({ part: "closing", text: ltTemplate()
    ? clNoContractions(`Thank you for considering my application. ${availTxt ? `I am available ${availTxt.replace(/^available\s+/i, "")}.` : "[AVAILABILITY: when you can start and the days you can work.]"} I would welcome the chance to discuss the role${reach ? `, and I can be reached on ${reach}` : ""}.`)
    : clNoContractions(LR.closeFallback({ availability: availTxt })) });
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
  for (const k of ["role", "company", "recipient", "salutation", "signoff", "ref"]) { const el = document.querySelector(`[data-lt="${k}"]`); if (el && document.activeElement !== el) el.value = d[k] || ""; }
  const roleEl = $("lt-role"); if (roleEl && !d.role) roleEl.placeholder = P().target.title || "e.g. Graduate Engineer";
  // blank company / addressed-to boxes are yellow and read [XXX] in the letter
  for (const k of ["role", "company"]) { const el = document.querySelector(`[data-lt="${k}"]`); if (el) el.classList.toggle("gap-input", !String(d[k] || "").trim()); }
  const box = $("ltParts");
  if (!box.dataset.built) {
    box.innerHTML = COVER_PARTS.map((p, i) => `<div class="lt-part"><label class="q-label" for="ltp-${i}">${i + 1}. <span id="ltl-${i}">${esc(p.label)}</span> <span class="opt" id="ltw-${i}"></span></label><p class="q-hint" id="lth-${i}">${esc(p.purpose)}</p><div id="ltg-${i}"></div>
      <div class="hl-wrap"><div class="hl-back" id="ltb-${i}" aria-hidden="true"></div><textarea id="ltp-${i}" data-ltp="${i}" rows="8" spellcheck="true" placeholder="Write this paragraph, or use Write with AI below."></textarea></div>
      <div class="lt-part-acts" id="lta-${i}"></div><div class="lt-alts bl-alts" id="lts-${i}"></div></div>`).join("");
    box.dataset.built = "1";
  }
  COVER_PARTS.forEach((p, i) => { const t = (ltTemplate() && LT_TPL_PARTS[p.key]) || p, l = $("ltl-" + i), h = $("lth-" + i); if (l) l.textContent = t.label; if (h) h.textContent = t.purpose; });
  d.parts.forEach((p, i) => { const el = $("ltp-" + i); if (el && document.activeElement !== el) el.value = p.text; partCount(i); $("ltg-" + i).innerHTML = $("ltg-" + i).dataset.stage === letterStage() ? $("ltg-" + i).innerHTML : clGuideHtml(p.part, letterStage()); $("ltg-" + i).dataset.stage = letterStage(); });
  ltTargetText();
  renderLetterDesigns();
  renderLetterPreview();
  renderSavedLetters();
  if (typeof ltV22Render === "function") ltV22Render();
  ltEffortRender();
}
// The Layout step: the same choices as the resume's Layout step. Search the designs (filters that switch on and off), pick one, then its colour, font,
// line spacing and page margins. A design, colour or font chosen here changes the cover letter only, never the resume.
const ltUi = { filter: [], show: 12 };
function ltDesignList() {
  const sel = letterTpl().key, ranked = rankTemplates(), mine = resumeDesign();
  const list = ranked.filter(({ t }) => tplMatches(t, ltUi.filter) || t.key === sel).map(r => r.t);
  const i = list.findIndex(t => t.key === mine.key);
  if (i > 0 && !ltUi.filter.length) list.unshift(...list.splice(i, 1));   // your resume's own design first, when nothing is filtered out
  return list;
}
// Tailor to a job has a smaller version of the same choices (its own box, with only the design, spacing and margins)
function renderLetterDesignsCompact(boxId) {
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
function renderLetterDesigns(boxId = "ltDesigns") {
  if (boxId !== "ltDesigns") return renderLetterDesignsCompact(boxId);
  const box = $(boxId);
  if (!box) return;
  const sel = letterTpl(), L = baseLetterParts(), mine = resumeDesign(), cs = currentLetterStyle();
  const list = ltDesignList(), shown = list.slice(0, ltUi.show);
  if (!shown.some(t => t.key === sel.key)) shown.unshift(sel);
  const best = rankTemplates().filter(r => r.rec).slice(0, 3).map(r => r.t.key);
  const lay = P().prefs, cur = { sp: lay.letterSpacing || "normal", mg: lay.letterMargins || "normal" };
  const seg = (path, opts, now, label, unit) => `<div class="q"><div class="q-label" id="lts_${path}">${label}</div><div class="seg seg-fill" role="group" aria-labelledby="lts_${path}">${Object.entries(opts).map(([k, o]) => `<button type="button" data-lt-pref="${path}" data-val="${k}" aria-pressed="${now === k}"><span>${o.label}</span><small>${unit(o)}</small></button>`).join("")}</div></div>`;
  const left = list.length - ltUi.show;
  const fontCur = FONTS[lay.letterFont] ? lay.letterFont : "";
  // The matching resume's stamp (top right of its card): hover for where that resume came from
  const stampWhy = ltTemp ? "Matching resume uploaded" : "Matching resume from profile";
  box.innerHTML = `<div class="lt-search"><p class="q-hint">Choose as many filters as you like: a design has to match one choice from each row you use.</p>${tplFilterHtml(ltUi.filter, "data-lt-filter data-val")}</div>
    <div class="b-tpls lt-tpls" role="group" aria-label="Cover letter designs, best match first">${shown.map(t => `<button type="button" class="tpl-card" data-lt-tpl="${t.key}" aria-pressed="${sel.key === t.key}" aria-label="${esc(t.name)}. ${esc(t.goodFor)}${t.key === mine.key ? ". " + stampWhy : ""}"><span class="tpl-thumb"><div>${letterHtml(L, { ...letterStyle(t, sel.key === t.key ? cs.accent : t.accent), ...letterLayout() })}</div></span><span class="tpl-name">${esc(t.name)}</span>${t.key === mine.key ? `<span class="tpl-stamp" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h5M9.5 15h5M9.5 18h3"/></svg><span class="tpl-stamp-tip" role="tooltip">${stampWhy}</span></span>` : ""}${best.includes(t.key) || t.ats ? `<span class="tpl-badges">${best.includes(t.key) ? '<span class="tpl-badge">Best match</span>' : ""}${t.ats ? '<span class="tpl-badge ats">ATS-friendly</span>' : ""}</span>` : ""}</button>`).join("") || `<p class="small muted">No design matches all of those. Switch one of the filters off.</p>`}</div>
    ${left > 0 ? `<div class="b-actions"><button class="btn" type="button" data-lt-more="1">Show ${Math.min(12, left)} more designs</button><span class="small muted">${list.length} ${list.length === 1 ? "match" : "matches"}</span></div>` : ""}
    <p class="small muted lt-design-note">Your cover letter starts in your resume's design. Choosing a different design, colour or font here changes the cover letter only, not your resume.</p>
    <div class="q"><div class="q-label" id="ltColL">Colour</div><div class="swatches" role="group" aria-labelledby="ltColL">${sel.accents.map(a => `<button type="button" class="swatch" data-lt-accent="${a}" style="background:${a}" aria-pressed="${a === cs.accent}" aria-label="Accent colour ${a}"></button>`).join("")}</div></div>
    <div class="q"><label class="q-label" for="ltFontSel">Font</label><select id="ltFontSel" data-lt-font="1"><option value="">${esc(sel.body === sel.head ? sel.body : sel.head + " and " + sel.body)} (the design's own${letterMatched() && fontPref() ? ", or your resume's font" : ""})</option>${fontOptions(fontCur)}</select><p class="q-hint">Every font here is read well by applicant tracking systems, and is used in the preview, Word and PDF.</p></div>
    <div class="page-setup">${seg("spacing", SPACING, cur.sp, "Line spacing", o => o.unit)}${seg("margins", LETTER_MARGINS, cur.mg, "Page margins", o => o.mm + " mm")}</div>${languageQ()}`;
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
// What ltValidate (23e) finds in the letter, as rows like the other checks: the same kind of problem is one row, with a button to go to its paragraph
const LT_ISSUE_TITLES = { tense: "A degree still in progress is written as finished", repeat_term: "The same name or date in too many paragraphs", repeat_stem: "The same word again and again", too_long: "A paragraph is longer than its budget", too_many_sentences: "Too many sentences in a paragraph", opening_title: "The opening doesn't name the job", opening_employer: "The opening doesn't name the employer", filler: "A sentence that explains why something matters", banned: "Stiff or padded wording", placeholder: "A gap that was never filled in" };
function ltIssueRows() {
  try {
    const by = {};
    for (const x of ltValidate()) if (LT_ISSUE_TITLES[x.type] && x.type !== "placeholder") (by[x.type] = by[x.type] || []).push(x);
    const quoted = d => ((String(d).match(/[“"]([^”"]{3,70})[”"]/) || [])[1] || "").replace(/…$/, "").trim().toLowerCase();
    return Object.entries(by).map(([type, list]) => ({
      where: [...new Set(list.map(x => x.i))], fix: "reword", level: "warn", title: LT_ISSUE_TITLES[type], detail: list.slice(0, 3).map(x => x.detail).join("; "),
      fixes: list.map(x => { const q = quoted(x.detail); return { i: x.i, ask: type === "banned" || type === "filler" ? `Reword it: ${x.detail}.` : x.detail, test: (type === "banned" || type === "filler") && q ? (s2 => s2.toLowerCase().includes(q)) : null }; })
    }));
  } catch { return []; }
}
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
  const blanks = ltTemplate() ? [] : [!String(d.role || "").trim() && "the job title", !String(d.company || "").trim() && "the company"].filter(Boolean);
  const gaps = bodyGaps + blanks.length;
  const own = blText().length > 0, r = letterRange();
  const parts = BL().parts, lab = i => partOf(parts[i].part).label;
  // words the AI put in that aren't in the profile (shown in red in the paragraph)
  const made = parts.flatMap((pp, k) => (pp.madeUp || []).filter(t => pp.text.includes(t)).map(t => ({ i: k, t })));
  const thinIdx = parts.map((p, i) => p.text.trim() && wordCount(p.text) < partMin(p.part, r) ? i : -1).filter(i => i >= 0);
  const quality = own ? coverQuality(parts.map(p => p.text), profileToText(P()) + "\n" + (d.role || "") + " " + (d.company || "") + "\n" + String(ltPlan().salary || ""), { allowSalary: !!ltPlan().salary, jobWords: ltJobWords() }).concat(ltIssueRows()) : [];
  // each warning can be clicked to jump to the paragraph it's about, and has a button that fixes just that one thing
  const goBtn = i => `<button class="linkish" type="button" data-ck="go:${i}">Go to ${esc(lab(i).toLowerCase())}</button>`;
  const row = (cls, title, detail, acts, go) => `<li class="ck${go ? " ck-go" : ""}"${go ? ` data-ck-go="${go}" tabindex="0" role="button" aria-label="${esc(String(title).replace(/<[^>]+>/g, ""))}. Go to it"` : ""}><span class="ico ${cls}"></span><div><div class="title">${title}</div><div class="detail">${detail}</div>${acts ? `<div class="ck-acts">${acts}</div>` : ""}</div></li>`;
  const shortest = parts.map((p, i) => [i, wordCount(p.text) - partMin(p.part, r)]).filter(([i]) => parts[i].text.trim()).sort((a, b) => a[1] - b[1])[0];
  const longest = parts.map((p, i) => [i, wordCount(p.text)]).sort((a, b) => b[1] - a[1])[0];
  // every warning that is about words has a button that opens Reword on the one sentence it is about (or the paragraph, when it is about all of it)
  ltQualityNow = quality;
  // (after the warnings are worked out: each sentence a warning is about is marked in soft yellow in its paragraph)
  for (const el of document.querySelectorAll("#ltParts [data-ltp]")) lwBack(+el.dataset.ltp, el.value);
  const qualityRows = quality.map((q, qi) => {
    const where = q.where || [], first = where[0];
    const acts = first == null ? "" : where.slice(0, 4).map(i => { const t = ltFixTarget(q, i, parts[i].text); return q.fix === "go" ? goBtn(i) : `<button class="btn" type="button" data-ck="rw:${qi}:${i}">${t.sel >= 0 ? `Reword sentence ${t.sel + 1} in ${esc(lab(i).toLowerCase())}` : `Reword ${esc(lab(i).toLowerCase())}`}</button>`; }).join("");
    return row("warn", esc(q.title), esc(q.detail), acts, first == null ? "" : "part:" + first);
  }).join("");
  $("ltChecks").innerHTML = own ? `<h3 class="ck-head">Before you send it</h3><p class="small muted">Select a warning to jump to it. The sentence it is about is highlighted in <mark class="ck-flag-key">soft yellow</mark> in the paragraphs above. Each button opens Reword on just that sentence, with the problem already written in.</p><ul class="checks lt-checklist">
    ${row(wc >= r[0] && wc <= r[1] ? "pass" : "warn", `${wc} words`, wc < r[0] ? `A little short. About ${r[0]} to ${r[1]} words fill one page at your spacing and margins.` : wc <= r[1] ? `Fits one page (${r[0]} to ${r[1]} words).` : `Trim it to ${r[1]} words or fewer so it fits on one page.`,
      wc < r[0] && shortest ? `<button class="btn" type="button" data-ck="rwlen:${shortest[0]}:longer">Reword ${esc(lab(shortest[0]).toLowerCase())}</button>` : wc > r[1] && longest ? `<button class="btn" type="button" data-ck="rwlen:${longest[0]}:shorter">Reword ${esc(lab(longest[0]).toLowerCase())}</button>` : "",
      wc < r[0] && shortest ? "part:" + shortest[0] : wc > r[1] && longest ? "part:" + longest[0] : "")}
    ${thinIdx.length ? thinIdx.map(i => row("warn", `Too short: ${esc(lab(i).toLowerCase())}`, `${wordCount(parts[i].text)} words. It needs at least ${partMin(parts[i].part, r)}. Add a detail or an example.`, `<button class="btn" type="button" data-ck="rwlen:${i}:longer">Reword ${esc(lab(i).toLowerCase())}</button>`, "part:" + i)).join("") : row("pass", "Every paragraph has enough to it", "Each one does its job.", "", "")}
    ${ltTemplate() ? row("pass", "A template: its gaps are meant to be there", bodyGaps ? `The yellow gaps are for each job's details. Fill them in when you send the letter to a job.` : "No gaps to fill.", "", "") : row(gaps ? "warn" : "pass", gaps ? `<mark class="gap-mark">${gaps} gap${gaps === 1 ? "" : "s"} to fill</mark>` : "No gaps left", gaps ? `Missing information is highlighted in yellow${blanks.length ? ` (still to add: ${esc(listJoin(blanks))})` : ""}. You can save and come back to it. Fill each one before you send the letter.` : "Ready to send, or to tailor to a job.",
      gaps ? `${bodyGaps ? '<button class="btn" type="button" data-ck="gap">Go to the next gap</button>' : ""}${!String(d.company || "").trim() ? '<button class="btn" type="button" data-ck="field:company">Add the company</button>' : ""}${!String(d.role || "").trim() ? '<button class="btn" type="button" data-ck="field:role">Add the job title</button>' : ""}` : "", gaps ? (bodyGaps ? "gap" : !String(d.company || "").trim() ? "field:company" : "field:role") : "")}
    ${made.length ? row("warn", `${made.length} detail${made.length === 1 ? "" : "s"} not in your profile`, `${esc(listJoin(made.slice(0, 5).map(m => m.t)))}. Hover the red words in the paragraph to keep one (it's saved to your profile) or discard it.`, goBtn(made[0].i), "part:" + made[0].i) : ""}
    ${qualityRows}
    ${quality.length ? "" : row("pass", "Reads like you wrote it", "No clichés, long dashes or repeated openings.", "", "")}
  </ul>` : `<p class="small muted">The preview shows a sample letter. Select <b>Start from my profile</b> to write yours.</p>`;
  const sc = letterScore(parts, r, wc, gaps, quality.concat(made)), se = $("ltScore");
  if (se) se.innerHTML = `Cover letter strength: <span style="color:${sc >= 80 ? "var(--good)" : sc >= 60 ? "var(--accent)" : "var(--warn)"}">${sc}/100</span>`;
  // a letter with gaps can still be saved, copied and downloaded as a draft (Word highlights the gaps yellow)
  ["ltDl"].forEach(id => { const b = $(id); if (b) b.disabled = !own; });
  $("ltSave").disabled = !own;
  if (typeof ltV22Preview === "function") ltV22Preview();
  $("ltDlStatus").textContent = !own ? "" : gaps && !ltTemplate() ? `${gaps} gap${gaps === 1 ? "" : "s"} still highlighted in yellow. You can save or download it as a draft; Word keeps the highlight.` : "";
}
async function downloadBaseLetter(kind, btn) {
  const L = baseLetterParts(), st = currentLetterStyle();
  const name = `${(L.signName || "Cover").replace(/[\\/:*?"<>|]+/g, "")} - ${L.email ? "Cover Email" : "Cover Letter"}${BL().role ? ` - ${BL().role}` : ""}`.replace(/[\\/:*?"<>|]+/g, "").slice(0, 150) + "." + kind;
  if (kind === "txt") return downloadTextFile(name, letterPlainText(L), $("ltDlStatus"), btn);
  await downloadMade(name, () => kind === "pdf" ? buildCoverPdf(L, st) : buildCoverDocx(L, st), $("ltDlStatus"), btn);
}
const letterPlainText = L => L.email ? [`Subject: ${L.subject}`, "", L.salutation, "", ...L.paragraphs.flatMap(p => [p, ""]), L.signoff, L.signName, L.contact.filter(x => /\d{6,}|@/.test(x)).join(" | ")].filter((x, k, a) => !(x === "" && a[k - 1] === "")).join("\n").trim() : [L.name, L.contact.join(" | "), "", L.date, "", ...(L.recipient && L.recipient.length ? [...L.recipient, ""] : []), ...(L.greetFirst ? [L.salutation, "", ...(L.re ? [L.re, ""] : [])] : [...(L.re ? [L.re, ""] : []), L.salutation, ""]), ...L.paragraphs.flatMap(p => [p, ""]), L.signoff, "", L.signName].join("\n");
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
      if (["role", "company"].includes(k)) e.target.classList.toggle("gap-input", !e.target.value.trim());
      // a company or role typed in fills the matching [gap] in the letter
      const gap = { company: "[the company]", role: "[the role]" }[k], v = e.target.value.trim();
      if (gap && v && e.type === "change") BL().parts.forEach((p, j) => { if (p.text.includes(gap)) { p.text = p.text.split(gap).join(v); const el = $("ltp-" + j); if (el) el.value = p.text; } });
      letterEdited();
    }
    else if (i != null) { const bp = BL().parts[+i]; bp.text = e.target.value; lwBack(+i, e.target.value); partCount(+i); letterEdited(); }
  };
  $("view-letter").addEventListener("input", ltEdit);
  $("view-letter").addEventListener("change", e => {
    if (e.target.dataset.lt) ltEdit(e);
    else if (e.target.matches && e.target.matches('select[data-v22="lang"]')) { P().prefs.lang = e.target.value; touchProfile("letter"); applySpellLang(); renderLetterDesigns(); renderLetterPreview(); }   // the spelling the page checks and fixes to
    else if (e.target.dataset.ltFont) { P().prefs.letterFont = e.target.value; touchProfile("letter"); renderLetterDesigns(); renderLetterPreview(); }   // the letter's font; empty follows the design (or the resume's font)
  });
  // Start from my profile (top of the page) and Write all (top of the letter) do the same thing
  const writeAll = async btn => {
    const st = $("ltStatus");
    if (!hasProfile(P())) { st.textContent = "Add your details in the resume builder first, so the letter has something to draw on."; return; }
    if (blText().length && !confirmReplace(btn)) return;
    // the AI writes each section in turn (23e-letter-writer.js); anything it can't write is filled in from the standard version
    await lwStart(btn);
    syncBaseToTailor();
  };
  $("ltFromProfile").addEventListener("click", () => writeAll($("ltFromProfile")));
  $("ltWriteAll").addEventListener("click", () => writeAll($("ltWriteAll")));
  $("ltPickBtn").addEventListener("click", async () => {
    const box = $("ltPick"), b = $("ltPickBtn"), open = box.hidden;
    box.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { await savedLetters.ready; renderLetterPick(); }
  });
  $("ltImport").addEventListener("click", () => $("ltFile").click());
  $("ltFile").addEventListener("change", async () => { const f = $("ltFile").files[0]; $("ltFile").value = ""; if (f) await ltImportFile(f); });
  // (an email template is plain text: Word and PDF are not offered for it)
  dlMenu("ltDl", { get docx() { return ltEmail() ? null : b => downloadBaseLetter("docx", b); }, get pdf() { return ltEmail() ? null : b => downloadBaseLetter("pdf", b); }, txt: b => downloadBaseLetter("txt", b) });
  $("ltDesignBtn").addEventListener("click", () => openView("cv", { kind: "letter" }));
  $("ltSave").addEventListener("click", saveLetterTemplate);
  $("view-letter").addEventListener("click", e => {
    const wr = e.target.closest("[data-lt-write]"); if (wr) { writePartAI(+wr.dataset.ltWrite, wr); return; }
    const rm = e.target.closest("[data-lt-rwmenu]"); if (rm) { rewordMenu(+rm.dataset.ltRwmenu); return; }
    const alt = e.target.closest("[data-lt-alt]");
    if (alt) {
      const [i, k] = alt.dataset.ltAlt.split(".").map(Number), box = $("lts-" + i), p = BL().parts[i];
      if (box && box._alts && box._alts[k] && p) { p.text = box._alts[k]; const el = $("ltp-" + i); if (el) el.value = p.text; box.innerHTML = ""; lwMarkMadeUp(i); baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor(); }
      return;
    }
    const ac = e.target.closest("[data-lt-altclose]"); if (ac) { const box = $("lts-" + ac.dataset.ltAltclose); if (box) box.innerHTML = ""; return; }
    const tp = e.target.closest("[data-lt-tpl]");
    if (tp) { pickLetterTpl(tp.dataset.ltTpl); renderLetterDesigns(); renderLetterPreview(); return; }
    const ef = e.target.closest("[data-lt-effort]");
    if (ef) { BL().effort = ef.dataset.ltEffort; baseLetter.save(); ltEffortRender(); return; }
    const fl = e.target.closest("[data-lt-filter]");
    if (fl) { const v = fl.dataset.val; ltUi.filter = v === "all" ? [] : ltUi.filter.includes(v) ? ltUi.filter.filter(x => x !== v) : [...ltUi.filter, v]; ltUi.show = 12; renderLetterDesigns(); return; }
    if (e.target.closest("[data-lt-more]")) { ltUi.show += 12; renderLetterDesigns(); return; }
    const sw = e.target.closest("[data-lt-accent]");
    if (sw) { const c = P().cv, t = letterTpl(); c.letterAccent = sw.dataset.ltAccent; c.letterAccentFor = t.key; if (!letterMatched()) c.letterTemplate = t.key; touchProfile("letter"); renderLetterDesigns(); renderLetterPreview(); return; }
    const pf = e.target.closest("[data-lt-pref]");
    if (pf) { P().prefs[pf.dataset.ltPref === "spacing" ? "letterSpacing" : "letterMargins"] = pf.dataset.val; touchProfile("letter"); renderLetterDesigns(); renderLetterPreview(); return; }
    if (e.target.closest("#ltAllDesigns")) { openView("cv", { kind: "letter" }); return; }
    const u = e.target.closest("[data-lt-use]");
    if (u) {
      if (blText().length && !confirmReplace(u)) return;
      const t = (savedLetters.data.list || [])[+u.dataset.ltUse]; if (!t) return;
      const before = JSON.parse(JSON.stringify(BL()));
      Object.assign(BL(), JSON.parse(JSON.stringify(t.letter)));
      ltSavedSig = letterSig();
      baseLetter.save(true); renderLetterPage(); syncBaseToTailor();
      $("ltPick").hidden = true; $("ltPickBtn").setAttribute("aria-expanded", "false"); ltShowStep(1);
      const st = $("ltStatus"); st.innerHTML = `Started from “${esc(t.name)}”. <button class="linkish" type="button" id="ltUndoUse">Undo</button>`;
      $("ltUndoUse").onclick = () => { Object.assign(BL(), before); baseLetter.save(true); renderLetterPage(); syncBaseToTailor(); st.textContent = "Restored your letter."; };
      return;
    }
    const del = e.target.closest("[data-lt-del]");
    if (del) { if (del.dataset.sure !== "1") { del.dataset.sure = "1"; del.textContent = "Delete it?"; setTimeout(() => { if (del.isConnected) { del.dataset.sure = ""; del.textContent = "Delete"; } }, 4000); return; } savedLetters.data.list.splice(+del.dataset.ltDel, 1); savedLetters.save(true); renderSavedLetters(); }
  });
  viewHooks.letter = () => Promise.all([baseLetter.ready, savedLetters.ready]).then(() => { renderLetterPage(); if (!ltSavedSig) ltSavedSig = letterSig(); });   // (what was there when the page opened is not "unsaved": only what is changed or written here)
  baseLetter.on(() => { if (currentView === "letter") renderLetterPage(); if (currentView === "cv" && cvLetters()) renderCv(); syncBaseToTailor(); });
  onProfile(() => { if (currentView === "letter") renderLetterPreview(); });
});
/* --- Each paragraph's length: a minimum for each. A thin paragraph is made longer with Reword (Longer) --- */
function partCount(i) {
  const p = BL().parts[i], w = $("ltw-" + i), acts = $("lta-" + i);
  if (!p || !w) return;
  const n = wordCount(p.text), min = partMin(p.part, letterRange()), blank = ltBracketOnly(p.text);
  const aim = partTarget(p.part, letterRange());
  w.textContent = n ? `${n} words · aim for about ${aim}` : `aim for about ${aim} words`;
  w.classList.toggle("short", !!n && n < min); w.classList.toggle("good", n >= min);
  // An empty paragraph can be written with AI; one with words in it can be reworded (shorter, longer, another tone, or in your own words).
  const keepNote = ($("ltx-" + i) || {}).innerHTML || "";
  if (acts && !acts.dataset.busy) acts.innerHTML = `${!n || blank ? `<button class="btn" type="button" data-lt-write="${i}">Write with AI</button>` : ""}${n && !blank ? `<button class="btn" type="button" data-lt-rwmenu="${i}" aria-haspopup="true" title="Other ways to say it: shorter, longer, casual or formal, or in your own words">Reword…</button>` : ""}${ltPartExtras(i)}<span class="small muted lt-note" id="ltx-${i}">${keepNote}</span>`;
}
/* --- Write a paragraph with AI, using the craft rules and the rules for your career stage --- */
// Every AI job on this page writes one paragraph of a letter: begin with context, and use full sentences only
// Is this text one paragraph of full sentences? Returns what's wrong, or "".
function proseOk(t) {
  const x = String(t || "").trim();
  if (/^\s*([-*•▪–]|\d+[.)])\s/m.test(x) || /\n/.test(x)) return "it must be one paragraph of full sentences, not a list";
  if (!/[.!?]["”']?$/.test(x)) return "it must end with a full stop";
  // (full sentences starting with a capital letter is a suggestion in the prompt, not a rule the answer is rejected for)
  return "";
}
const hardPhrase = t => { for (const re of CL_HARD) { const m = String(t).match(re); if (m) return m[0]; } return LR.patternsFound(t)[0] || ""; };
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
8. No more than two sentences in a row begin with "I". Never write "I am writing to", "My name is", "in short", "from day one", eager, passionate, excited, thrilled or dynamic. No contractions unless you are told they are fine: write "I am", never "I'm".
Reply with JSON only: {"options": ["...", "...", "..."]}`;
// The ways to reword a paragraph (the "Reword as…" menu): size is the length to aim for, note is said to the AI
const RW_MODES = {
  same: { label: "Another way to say it", note: "" },
  shorter: { label: "Shorter", size: o => o * 0.75, note: "Make it noticeably shorter (about a quarter fewer words) by cutting the least useful detail." },
  longer: { label: "Longer", size: o => o * 1.25, note: "Make it a little longer (about a quarter more words) with more detail from the candidate's details. Do not pad." },
  casual: { label: "More casual", note: "Make it more casual and conversational (contractions are fine), still professional." },
  formal: { label: "More formal", note: "Make it more formal and polished, with no contractions." },
  simpler: { label: "Simpler words", note: "Use simpler, shorter everyday words. Keep every fact and every number exactly." },
  personal: { label: "More personal", note: "Make it sound more personal and specific to this applicant, using only the details already in the original. Add no new facts." },
  fit: { label: "To fit the page", size: (o, aim) => aim, note: "" },
  custom: { label: "In your own words", note: "" }
};
// The sentences of a paragraph (a full stop inside a [gap] doesn't end one)
function ltSentences(text) {
  const masked = String(text).replace(/\[[^\]]*\]|\{[^}]*\}/g, m => m.replace(/\./g, "\u0001"));
  return (masked.match(/[^.!?]+(?:[.!?]+["”']?|$)\s*/g) || [masked]).map(x => x.replace(/\u0001/g, ".")).filter(x => x.trim());
}
const rwSel = {};   // which sentence of each cover letter paragraph is being reworded (-1: the whole paragraph); set when the popup's Reword is pressed
const rwShort = t => { const w = t.trim().split(/\s+/); return w.slice(0, 7).join(" ") + (w.length > 7 ? "…" : ""); };
// The Reword box is ONE popup used everywhere on the site (cover letter paragraphs, resume bullet points, the summary, extras): pick as many changes
// as you like (one length, one tone, and more), or say it yourself, and, for text of several sentences, choose which sentence. Then press Reword.
// ctx: { title, sub, text, sentences (offer "One sentence"), fit (offer "To fit the page"), sel (-1 whole text), modes[], free, go({ modes, free, sel }) }
const rwUi = { ctx: null, sel: -1, modes: new Set(), opener: null, free: "" };
const RW_GROUPS = { length: ["shorter", "longer"], tone: ["casual", "formal"] };
function rwModalHtml() {
  const c = rwUi.ctx, sents = c.sentences ? ltSentences(c.text) : [], st = rwUi.sel, sel = st >= 0 && sents[st] ? st : -1, choosing = c.sentences && (sel >= 0 || st === -2);
  const on = k => rwUi.modes.has(k);
  const tog = (k, extra = "") => `<button type="button" data-rw-mode="${k}" aria-pressed="${on(k)}"${extra}>${esc(RW_MODES[k].label)}${k === "shorter" ? " <small>−25%</small>" : k === "longer" ? " <small>+25%</small>" : ""}</button>`;
  return `<div class="rw-box" role="dialog" aria-modal="true" aria-labelledby="rwTitle" data-nohelp="1">
    <button type="button" class="rw-x" data-rw-close="1" aria-label="Close">×</button>
    <h2 id="rwTitle">${esc(c.title || "Reword this paragraph")}</h2>
    <p class="small muted rw-sub">${esc(c.sub || "Choose as many changes as you like, then press Reword. You will get up to three wordings to pick from.")}</p>
    ${c.sentences ? `<div class="rw-sec"><span class="rw-lab">What to reword</span><div class="seg" role="group" aria-label="What to reword"><button type="button" data-rw-scope="all" aria-pressed="${!choosing}">The whole paragraph</button><button type="button" data-rw-scope="pick" aria-pressed="${choosing}"${sents.length < 2 ? " disabled" : ""}>One sentence</button></div></div>` : ""}
    ${choosing ? `<div class="rw-sents" role="group" aria-label="Choose the sentence">${sents.map((t, k) => `<button type="button" class="rw-sent" data-rw-sent="${k}" aria-pressed="${sel === k}"><b>${k + 1}</b><span>${esc(rwShort(t))}</span></button>`).join("")}</div>${sel < 0 ? `<p class="small muted">Choose the sentence to reword.</p>` : ""}` : ""}
    <div class="rw-sec"><span class="rw-lab">Length</span><div class="seg" role="group" aria-label="Length">${tog("shorter", on("fit") ? " disabled" : "")}${tog("longer", on("fit") ? " disabled" : "")}</div></div>
    <div class="rw-sec"><span class="rw-lab">Tone</span><div class="seg" role="group" aria-label="Tone">${tog("casual")}${tog("formal")}</div></div>
    <div class="rw-sec"><span class="rw-lab">Also</span><div class="seg" role="group" aria-label="Also">${tog("simpler")}${tog("personal")}${c.fit ? tog("fit", choosing || on("shorter") || on("longer") ? " disabled" : "") : ""}</div></div>
    <div class="rw-sec"><label class="rw-lab" for="rwFree">Or say it yourself</label><input type="text" id="rwFree" maxlength="240" placeholder="e.g. lead with my software skills" value="${esc(rwUi.free || "")}"></div>
    <div class="rw-act"><button type="button" class="btn" data-rw-close="1">Cancel</button><button type="button" class="btn primary" data-rw-go="1"${choosing && sel < 0 ? " disabled" : ""}>Reword</button></div>
  </div>`;
}
function rwRender(focusSel) {
  const host = $("rwModal"); if (!host) return;
  const keep = ($("rwFree") || {}).value; if (keep !== undefined) rwUi.free = keep;
  host.innerHTML = rwModalHtml();
  if (focusSel) { const f = host.querySelector(focusSel); if (f) f.focus(); }
}
function rwClose() {
  const host = $("rwModal"); if (host) host.remove();
  document.body.classList.remove("rw-open");
  document.removeEventListener("keydown", rwKey, true);
  const o = rwUi.opener; rwUi.opener = null; rwUi.ctx = null; if (o && o.isConnected) o.focus({ preventScroll: true });
}
function rwKey(e) {
  if (e.key === "Escape") { e.preventDefault(); rwClose(); return; }
  if (e.key !== "Tab") return;
  const f = [...document.querySelectorAll("#rwModal button:not([disabled]), #rwModal input")]; if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function rwOpen(ctx) {
  if ($("rwModal")) return;
  rwUi.ctx = ctx; rwUi.modes = new Set((ctx.modes || []).filter(k => RW_MODES[k])); rwUi.free = ctx.free || ""; rwUi.sel = Number.isInteger(ctx.sel) ? ctx.sel : -1; rwUi.opener = document.activeElement;
  const host = document.createElement("div"); host.id = "rwModal"; host.className = "rw-modal";
  document.body.appendChild(host); document.body.classList.add("rw-open");
  host.addEventListener("click", e => {
    if (e.target === host || e.target.closest("[data-rw-close]")) { rwClose(); return; }
    const m = e.target.closest("[data-rw-mode]");
    if (m) {
      const k = m.dataset.rwMode, was = rwUi.modes.has(k);
      for (const g of Object.values(RW_GROUPS)) if (g.includes(k)) g.forEach(x => rwUi.modes.delete(x));   // one length, one tone
      if (!was) rwUi.modes.add(k);
      rwRender(`[data-rw-mode="${k}"]`); return;
    }
    const sc = e.target.closest("[data-rw-scope]");
    if (sc) { rwUi.sel = sc.dataset.rwScope === "all" ? -1 : (rwUi.sel >= 0 ? rwUi.sel : -2); if (rwUi.sel !== -1) rwUi.modes.delete("fit"); rwRender(`[data-rw-scope="${sc.dataset.rwScope}"]`); return; }
    const se = e.target.closest("[data-rw-sent]");
    if (se) { rwUi.sel = +se.dataset.rwSent; rwRender(`[data-rw-sent="${se.dataset.rwSent}"]`); return; }
    if (e.target.closest("[data-rw-go]")) {
      const free = (($("rwFree") || {}).value || "").trim(), modes = [...rwUi.modes], sel = rwUi.sel >= 0 ? rwUi.sel : -1, go = rwUi.ctx && rwUi.ctx.go;
      rwClose();
      if (go) go({ modes, free, sel });
    }
  });
  document.addEventListener("keydown", rwKey, true);
  // a problem already written in "Or say it yourself": the Reword button is ready to press
  rwRender(rwUi.free ? "[data-rw-go]" : ctx.sentences ? "[data-rw-scope=all]" : "[data-rw-mode]");
}
// The cover letter's Reword button on one paragraph. o: { sel (a sentence to start on), modes[], free (what is wrong, written for the person) }
function rewordMenu(i, o = {}) {
  if ($("rwModal")) return;
  const box = $("lts-" + i);
  if (box) { box.innerHTML = ""; box.dataset.menu = ""; box._alts = null; }
  rwOpen({
    title: "Reword this paragraph", text: BL().parts[i].text, sentences: true, fit: true, sel: Number.isInteger(o.sel) ? o.sel : -1, modes: o.modes || [], free: o.free || "",
    go: ({ modes, free, sel }) => {
      rwSel[i] = sel;
      const b = document.querySelector(`[data-lt-rwmenu="${i}"]`) || document.createElement("button");
      rewordPart(i, b, "combo", { modes: modes.length || free ? modes : ["same"], free });
    }
  });
}
// What a set of chosen changes asks of the AI: the length to aim for and the notes it is told
function rwCombine(modes, free) {
  const ms = modes.map(k => RW_MODES[k]).filter(Boolean);
  const size = (ms.find(m => m.size) || {}).size;
  const notes = ms.map(m => m.note).filter(Boolean); if (free) notes.push(`Change it like this: ${free}`);
  return { label: "Reword", size, note: notes.join(" ") };
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
async function rewordPart(i, btn, mode = "same", combo = null) {
  const d = BL(), p = d.parts[i], box = $("lts-" + i);
  const g0 = ltGate(); if (!g0.ok) { if (box) box.innerHTML = `<span class="small">${esc(ltGateSay(g0, null))}</span> <button class="linkish" type="button" data-lt-altclose="${i}">Close</button>`; return; }
  const picked = combo ? combo.modes : [mode], has = k => picked.includes(k);
  const M = combo ? rwCombine(combo.modes, combo.free) : (RW_MODES[mode] || RW_MODES.same);
  // one chosen sentence, or the whole paragraph
  const sents = ltSentences(p.text), sIdx = Number.isInteger(rwSel[i]) ? rwSel[i] : -1, one = sIdx >= 0 && !!sents[sIdx] && !has("fit"), scope = one ? sents[sIdx].trim() : p.text;
  // a rewording stays within about 15% of the length it's aiming for (the paragraph's own length, or what the menu choice asks for)
  const orig = wordCount(scope), n = Math.max(one ? 6 : 15, Math.round(M.size ? M.size(orig, partTarget(p.part, letterRange())) : orig)), lo = one ? 0.8 : 0.85, hi = one ? 1.2 : 1.15;
  const show = m => { if (box) box.innerHTML = `<p class="progress">${esc(m)}</p>`; };
  if (box) box.dataset.menu = "";
  btn.disabled = true; show("Finding other ways to say it…");
  // why a version can't be used, or "": the same rules the AI is told to follow
  // contractions go back to full words unless the original has them or the casual tone was asked for
  const keepContr = has("casual") || new RegExp(CL_CONTRACTION_RE.source, "i").test(scope);
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
  const res = await aiJSON({ nano, full: nano + "\n\n" + CL_CRAFT, label: "Rewording", tier: one ? "small" : "", progress: show,
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
      const fx = await aiFixText({ text: t, why: w, check: x => bad(x, seen), progress: show, context: CL_CRAFT_SHORT, expect: n * 7 + 100, tier: one ? "small" : "" });
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
    // from the opening page the person stays there until they press Next, which goes to Layout; from anywhere else it goes to the paragraphs
    if (typeof ltWelcomeOn !== "undefined" && ltWelcomeOn) ltWelcomeHold = true;
    else if (typeof ltShowStep === "function") ltShowStep(1);
    ltSay(`Brought in ${paras.length} paragraph${paras.length === 1 ? "" : "s"} from ${label}. Check each one sits under the right heading.`);
    return true;
  } catch (e) { ltSay(e && e.message ? e.message : "Couldn't read that.", true); return false; }
}
// A message under the buttons; on the opening page it shows there too
function ltSay(m, bad) {
  const st = $("ltStatus"); if (st) st.textContent = m;
  const w = $("ltwLetterStatus"); if (w) { w.textContent = typeof ltWelcomeOn !== "undefined" && ltWelcomeOn ? m : ""; w.classList.toggle("err", !!bad); }
}
function renderLetterPick(box = $("ltPick")) {
  const list = savedLetters.data.list || [];
  box.innerHTML = `<div class="b-sub">Cover letters in your profile</div>` + (list.length ? savedLetterRows(list, false) : `<p class="small muted">You haven't saved a cover letter to your profile yet. Write one, then press <b>Save to my profile…</b> on the Cover letter tab, and it will be here next time.</p>`);
}
async function saveLetterTemplate() {
  const st = $("ltDlStatus");
  if (!blText().length) { st.textContent = "Write your letter first, then save it."; return; }
  // saving to your profile needs an account (inside Claude, or where accounts aren't switched on, it saves privately as before)
  if (saveNeedsAccount()) {
    acctDialog("up");
    const m = document.querySelector("#acctDlg #acctMsg");
    if (m) { m.textContent = "Saving a cover letter to your profile needs a free account. Sign up or sign in, then press Save again."; m.className = "acct-msg"; }
    return;
  }
  const gapsNow = (blText().join(" ").match(TOKEN_RE) || []).length + (BL().company.trim() ? 0 : 1) + (BL().role.trim() ? 0 : 1);
  const d = BL();
  const name = await askName({ title: "Save as a cover letter template", text: "It's saved to your profile, so you can start your next letter from it. Saving again with the same name replaces it.", label: "Name it", value: [d.role || P().target.title || "My cover letter", d.company].filter(Boolean).join(" – ") });
  if (!name) return;
  await savedLetters.ready;
  const list = savedLetters.data.list = (savedLetters.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), letter: JSON.parse(JSON.stringify(d)) });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedLetters.save(true);
  ltSavedSig = letterSig();   // (saved: leaving this page won't ask)
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
    if (o.sentence) { const at = el.value.indexOf(o.sentence); if (at >= 0) el.setSelectionRange(at, at + o.sentence.length); }
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
// The warnings from the last time the page was drawn, so a button can find the one it belongs to
let ltQualityNow = [];
// The sentence of paragraph i a warning is about, and what to say is wrong with it: { sel (a sentence number, or -1 for the whole paragraph), ask }
function ltFixTarget(q, i, text) {
  const f = (q.fixes || []).find(x => x.i === i) || q, ss = ltSentences(text);
  let sel = -1;
  try {
    if (typeof f.pick === "function") sel = f.pick(ss);
    else if (typeof f.test === "function") sel = ss.findIndex(x => f.test(x));
  } catch { sel = -1; }
  if (ss.length < 2 && sel === 0) sel = -1;   // (one sentence is the whole paragraph)
  return { sel: Number.isInteger(sel) && sel >= 0 ? sel : -1, ask: f.ask || q.ask || q.detail || "" };
}
function ckFix(spec) {
  const [kind, arg, arg2] = String(spec).split(":"), i = +arg, p = BL().parts[i];
  if (kind === "go" || kind === "gap" || kind === "field") return ckGo(spec);
  if (!p) return;
  // No AI connected: Reword has nobody to ask, so the button simply takes you to the paragraph (the sentence it is about is selected), ready to edit by hand
  if (typeof aiGateOn !== "undefined" && aiGateOn && ["rw", "rwlen", "reword"].includes(kind)) {
    const pi = kind === "rw" ? +arg2 : i, q = kind === "rw" ? ltQualityNow[+arg] : null, t = q ? ltFixTarget(q, pi, BL().parts[pi].text) : { sel: -1 };
    return goPart(pi, { sentence: t.sel >= 0 ? (ltSentences(BL().parts[pi].text)[t.sel] || "").trim() : "" });
  }
  if (kind === "rw") { const q = ltQualityNow[+arg], pi = +arg2, t = q ? ltFixTarget(q, pi, BL().parts[pi].text) : { sel: -1, ask: "" }; goPart(pi); return rewordMenu(pi, { sel: t.sel, free: t.ask }); }
  if (kind === "rwlen") { goPart(i); return rewordMenu(i, { modes: [arg2 === "shorter" ? "shorter" : "longer"], free: arg2 === "shorter" ? "Cut the least useful detail." : "Add one specific detail or example from my profile." }); }
  if (kind === "reword") { goPart(i); return rewordMenu(i); }
}
/* --- Sign-off: other ways to close that suit the greeting, always shown below the box --- */
let signOpen = false;
function renderSignAlts() {
  const box = $("ltSignAlts");
  if (box) box.innerHTML = signOpen ? signOptions().map(x => `<button type="button" class="bl-alt" data-lt-sign="${esc(x)}">${esc(x)}</button>`).join("") : `<button class="btn" type="button" data-lt-signmore="1" aria-expanded="false">More Sign-offs…</button>`;
}
// six sign-offs that suit the greeting, other than the one in use
function signOptions() {
  const d = BL(), named = !/\b(hiring manager|sir|madam|team|to whom)\b/i.test(d.salutation || ""), cur = norm(d.signoff || "");
  const pool = named ? ["Yours sincerely,", "Kind regards,", "Warm regards,", "Best regards,", "With thanks,", "Many thanks,", "Regards,"] : ["Yours faithfully,", "Kind regards,", "Yours sincerely,", "Regards,", "Many thanks,", "Warm regards,", "Best wishes,"];
  return pool.filter(x => norm(x) !== cur).slice(0, 6);
}
// The other sign-offs fold back into the button when you don't pick one: a click or a keypress somewhere else, or Escape
function signClose(focusBack) {
  if (!signOpen) return;
  signOpen = false; renderSignAlts();
  if (focusBack) { const b = $("ltSignAlts").querySelector("[data-lt-signmore]"); if (b) b.focus(); }
}
onInit(() => {
  document.addEventListener("pointerdown", e => { if (signOpen && !e.target.closest("#ltSignAlts")) signClose(false); }, true);
  document.addEventListener("focusin", e => { if (signOpen && !e.target.closest("#ltSignAlts")) signClose(false); });
  document.addEventListener("keydown", e => { if (signOpen && e.key === "Escape") { e.preventDefault(); signClose(true); } });
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
