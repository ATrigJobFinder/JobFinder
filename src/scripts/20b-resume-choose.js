/* ===================== Review: choose what goes on this resume ===================== */
// A vertical list of every section, entry and line. Each can be left off this version (it stays in the profile),
// sections can be moved up and down, and every part shows how many lines it takes, so a one-page resume is easy to reach.
// "Fit to one page" hides the least useful parts first and says why for each.

/* --- How many lines things take: measured from the chosen design, its type size, spacing and margins --- */
// A hidden copy of the design is drawn at page size, and the real line height, text width and spacing are read from it.
// (If that can't be done, an estimate from the design's numbers is used.)
let geoCache = { sig: "", g: null };
function pageGeometry() {
  const tpl = tplWithPrefs(builderTpl());
  const sig = [tpl.key, tpl.margin, tpl.size, tpl.lh, tpl.gap].join("|");
  if (geoCache.sig === sig && geoCache.g) return geoCache.g;
  let g = null;
  try { g = measuredGeometry(tpl); } catch { g = null; }
  if (!g) {
    const m = tpl.margin || 16, size = tpl.size || 10.5, lh = tpl.lh || 1;
    const sideW = tpl.layout === "sidebar" ? (tpl.side || 0.32) : 0;
    g = { cap: Math.max(20, Math.floor((297 - 2 * m) * 2.835 / (size * 1.38 * lh)) - 5), head: 5, entry: 1.3, sec: 2, tpl, measured: false, sidebar: !!sideW,
      chars: Math.max(40, Math.floor((210 * (1 - sideW) - 2 * m) * 2.835 / (size * 0.5)) - 6), sideChars: Math.max(20, Math.floor((210 * sideW - 12) * 2.835 / (size * 0.5))) };
  }
  geoCache = { sig, g };
  return g;
}
function measuredGeometry(tpl) {
  if (!document.body) return null;
  const host = document.createElement("div");
  host.className = "paper-sheet";
  host.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;";
  host.innerHTML = cvHtml(cvModel(SAMPLE_PROFILE, tpl), tpl, {});
  document.body.appendChild(host);
  try {
    const li = host.querySelector(".cv-ul li"), main = host.querySelector(".cv-mainc") || host.querySelector(".cv-body");
    if (!li || !main) return null;
    const px = v => parseFloat(v) || 0, cs = getComputedStyle(li), fs = px(cs.fontSize) || 14;
    let lineH = px(cs.lineHeight); if (!(lineH > 0)) lineH = fs * 1.35;
    const margin = (tpl.margin || 16) * 3.7795;
    const box = el => { if (!el) return 0; const c = getComputedStyle(el); return el.getBoundingClientRect().height + px(c.marginTop) + px(c.marginBottom); };
    // the name block (only when it sits in the main column)
    const headEl = host.querySelector(".cv-mainc .cv-head, .cv-body > .cv-head, .cv-band");
    // a section's heading, and an entry's title row, beyond the lines of text under them
    const secEl = host.querySelector(".cv-s-experience") || host.querySelector(".cv-sec"), hEl = secEl && secEl.querySelector(".cv-h");
    const entryEl = host.querySelector(".cv-entry");
    const lis = entryEl ? [...entryEl.querySelectorAll("li")] : [];
    const entryExtra = entryEl ? box(entryEl) - lis.reduce((a, x) => a + x.getBoundingClientRect().height, 0) : 1.3 * lineH;
    const secExtra = secEl ? box(hEl) + px(getComputedStyle(secEl).marginTop) + px(getComputedStyle(secEl).paddingTop) : 2 * lineH;
    const sideEl = host.querySelector(".cv-side"), sideLi = sideEl && sideEl.querySelector("li, .cv-g, .cv-chips span");
    const sideW = sideLi ? sideLi.getBoundingClientRect().width : (sideEl ? sideEl.getBoundingClientRect().width - 2 * margin / 2 : 0);
    return {
      cap: Math.max(20, Math.floor((1123 - 2 * margin) / lineH)), head: Math.max(2, Math.round(box(headEl) / lineH)), entry: Math.max(1, Math.round(entryExtra / lineH * 10) / 10), sec: Math.max(1, Math.round(secExtra / lineH * 10) / 10),
      chars: Math.max(30, Math.floor(li.getBoundingClientRect().width / (fs * 0.5))), sideChars: sideEl ? Math.max(16, Math.floor(sideW / (fs * 0.5))) : 0, sidebar: !!sideEl, lineH, tpl, measured: true
    };
  } finally { host.remove(); }
}
const chLines = (text, chars) => Math.max(1, Math.ceil(String(text).length / chars));

// Every section the resume could have, in the order it prints, with its entries and lines
function chooseSections(p) {
  const geo = pageGeometry(), { chars, tpl } = geo, cv = p.cv, T = TITLE_SETS[tpl.titles] || TITLE_SETS.standard;
  const hideL = new Set(cv.hideLines.map(s => norm(s))), hideS = new Set(cv.hideSections);
  const whyOf = k => { const r = cv.hideWhy.find(x => x.startsWith(k + "||")); return r ? r.slice(k.length + 2) : ""; };
  const row = (text, key) => { const t = String(text); return { text: t, key: key || t, off: hideL.has(norm(key || t)), lines: chLines(t, chars), why: whyOf("line:" + (key || t)) }; };
  const entries = (list, ttl, rowsOf, when) => p[list].map((e, i) => [e, i]).filter(([e]) => e.done !== false && hasContent(e) && ttl(e))
    .map(([e, i]) => ({ list, i, title: ttl(e), dates: when(e), off: !!e.hidden, why: e.hideWhy || "", rows: rowsOf(e).map(t => row(t)) }));
  const S = {};
  if (p.summary.trim()) S.summary = { single: p.summary.trim() };
  S.experience = { entries: entries("experience", e => [e.title, e.org].filter(Boolean).join(" at "), e => e.bullets.map(val).filter(Boolean), e => rangeOf(e)) };
  S.education = { entries: entries("education", e => [e.degree, e.inst].filter(Boolean).join(", "), e => eduLines(e, p), e => rangeOf(e, true)) };
  if (p.extras.projects) S.projects = { entries: entries("projects", e => e.name, e => linesOf(e.details), e => rangeOf(e)) };
  if (p.extras.volunteering) S.volunteering = { entries: entries("volunteering", e => [e.title, e.org].filter(Boolean).join(" at "), e => e.bullets.map(val).filter(Boolean), e => rangeOf(e)) };
  const groups = [["Technical", p.skills.hard], ["Software & tools", p.skills.software], ["Languages", p.skills.languages], ["Strengths", p.skills.soft]].filter(([, a]) => a.some(val));
  // one row for each group of skills, with each skill under it that can be left off by itself
  const skillRow = (label, a) => {
    const items = a.map(val).filter(Boolean).map(t => ({ text: t, key: `skill:${label}:${t}`, off: hideL.has(norm(`skill:${label}:${t}`)) }));
    const on = items.filter(x => !x.off), r = row(`${label}: ${on.map(x => x.text).join(", ")}`, "skills:" + label);
    return Object.assign(r, { label, items, shown: on.length, lines: on.length ? chLines(r.text, chars) : 0 });
  };
  if (groups.length) S.skills = { rows: groups.map(([label, a]) => skillRow(label, a)) };
  if (p.skills.certs.some(val)) S.certs = { rows: p.skills.certs.map(val).filter(Boolean).map(t => row(t)) };
  if (p.extras.awards && linesOf(p.awards).length) S.awards = { rows: linesOf(p.awards).map(t => row(t)) };
  if (p.extras.publications && linesOf(p.publications).length) S.publications = { rows: linesOf(p.publications).map(t => row(t)) };
  if (p.extras.interests && p.interests.trim()) S.interests = { single: p.interests.trim() };
  if (p.extras.availability && availabilityText(p)) S.availability = { single: availabilityText(p) };
  if (p.extras.referees) S.referees = { single: p.referees.mode === "list" && finished(p.referees.list).some(r => r.name) ? `${finished(p.referees.list).filter(r => r.name).length} referee${finished(p.referees.list).filter(r => r.name).length === 1 ? "" : "s"} with contact details` : "Available on request" };
  const order = orderedSections(tpl, p).filter(k => S[k]);
  return order.map(k => {
    const s = S[k], off = hideS.has(k), side = geo.sidebar && SIDE_KEYS.has(k), cols = side ? geo.sideChars : chars;
    // a sidebar design wraps its side column's text narrower than the main column's
    if (side) { for (const r of s.rows || []) r.lines = r.items && !r.shown ? 0 : chLines(r.text, cols); for (const en of s.entries || []) for (const r of en.rows) r.lines = chLines(r.text, cols); }
    let lines = 0;
    if (s.single) lines = chLines(s.single, cols);
    else if (s.entries) lines = s.entries.reduce((a, e) => a + (e.off ? 0 : geo.entry + e.rows.reduce((b, r) => b + (r.off ? 0 : r.lines), 0)), 0);
    else lines = s.rows.reduce((a, r) => a + (r.off ? 0 : r.lines), 0);
    return { key: k, title: T[k] || k, off, side, why: whyOf("sec:" + k), single: s.single, entries: s.entries, rows: s.rows, lines: Math.round(lines + geo.sec) };
  });
}
// Lines used in the main column, and (for a sidebar design) in the side column
const chTotal = secs => pageGeometry().head + secs.reduce((a, s) => a + (s.off || s.side ? 0 : s.lines), 0);
const chSideTotal = secs => secs.reduce((a, s) => a + (s.off || !s.side ? 0 : s.lines), 0);

// The page count the preview actually shows (it is drawn from the same ticks), or null before it has been drawn
const livePages = () => { const f = $("bPaper"); const n = f ? +f.dataset.pages : 0; return n > 0 ? n : null; };
const SKILLS_TICKED_MAX = 4;
function chooseInner() {
  const p = P(), secs = chooseSections(p), geo = pageGeometry();
  const pages = builder.chPages === 2 ? 2 : 1;
  let capAll = geo.cap * pages;
  const total = chTotal(secs), sideT = geo.sidebar ? chSideTotal(secs) : 0;
  // The preview is the truth. If it shows the pages we want, the lines used are within the maximum; if it shows more, they are not.
  const live = livePages();
  if (live != null && live <= pages && Math.max(total, sideT) > capAll) capAll = Math.max(total, sideT);
  else if (live != null && live > pages && Math.max(total, sideT) <= capAll) capAll = Math.max(1, Math.max(total, sideT) - 1);
  const over = total - capAll, pct = Math.min(100, Math.round(total / capAll * 100)), sideOver = sideT - capAll;
  const lineWord = n => `${n} line${n === 1 ? "" : "s"}`;
  const expected = live != null ? live : Math.max(1, Math.ceil(Math.max(total, sideT) / geo.cap));
  const pageWord = pages === 2 ? "Two pages hold" : "One page holds";
  const grip = (data, label) => `<span class="drag-h ch-grip" draggable="true" ${data} title="Drag to move" aria-label="Drag to move ${esc(label)}">${GRIP_SVG}</span>`;
  const whyNote = (why, key) => why ? `<p class="ch-why"><b>Hidden to fit the page:</b> ${esc(why)} <button class="linkish" type="button" data-act="ch-restore" data-key="${esc(key)}">Put it back</button></p>` : "";
  const entryHtml = e => `<li class="ch-entry${e.off ? " off" : ""}" data-ch-entry="${e.list}.${e.i}">
      <div class="ch-row">${grip(`data-ch-drag="entry" data-list="${e.list}" data-i="${e.i}"`, e.title)}<label class="q-check"><input type="checkbox" data-show="${e.list}.${e.i}"${e.off ? "" : " checked"}><span class="ch-txt"><b>${esc(e.title)}</b>${e.dates ? ` <span class="small muted">${esc(e.dates)}</span>` : ""}</span></label><span class="ch-count">${e.off ? "off" : lineWord(Math.round(pageGeometry().entry + e.rows.reduce((b, r) => b + (r.off ? 0 : r.lines), 0)))}</span></div>
      ${whyNote(e.why, `entry:${e.list}.${e.i}`)}
      ${e.rows.length && !e.off ? `<ul class="ch-rows">${e.rows.map(r => rowHtml(r, e)).join("")}</ul>` : ""}</li>`;
  const skillItemHtml = x => `<label class="ch-skill${x.off ? " off" : ""}"><input type="checkbox" data-ch-line="${esc(x.key)}"${x.off ? "" : " checked"}><span>${esc(x.text)}</span></label>`;
  const groupHtml = r => `<li class="${r.off ? "off" : ""}"><div class="ch-row"><label class="q-check"><input type="checkbox" data-ch-line="${esc(r.key)}"${r.off ? "" : " checked"}><span class="ch-txt"><b>${esc(r.label)}</b> <span class="small muted">${r.items.length === 1 ? "1 skill" : r.shown === r.items.length ? `${r.items.length} skills` : `${r.shown} of ${r.items.length} shown`}</span></span></label><span class="ch-count">${r.off ? "off" : r.lines}</span></div>${r.off ? "" : `<div class="ch-skills" role="group" aria-label="${esc(r.label)}: tick up to ${SKILLS_TICKED_MAX} to show">${r.items.map(skillItemHtml).join("")}</div>
      <p class="ch-skill-note small muted">Up to ${SKILLS_TICKED_MAX} ticked here: ${SKILLS_TICKED_MAX} is a good number, because recruiters skim and a short list of your best reads as confident.${r.shown > SKILLS_TICKED_MAX ? ` <button class="linkish" type="button" data-act="ch-top4" data-label="${esc(r.label)}">Keep my top ${SKILLS_TICKED_MAX}</button>` : ""}</p>`}</li>`;
  const rowHtml = (r, en) => r.items ? groupHtml(r) : `<li class="${r.off ? "off" : ""}"${en && (en.list === "experience" || en.list === "volunteering") ? ` data-ch-row="${en.list}.${en.i}"` : ""}><div class="ch-row">${en && (en.list === "experience" || en.list === "volunteering") && !r.off ? grip(`data-ch-drag="row" data-list="${en.list}" data-i="${en.i}" data-text="${esc(r.text)}"`, "this bullet point") : ""}<label class="q-check"><input type="checkbox" data-ch-line="${esc(r.key)}"${r.off ? "" : " checked"}><span class="ch-txt">${esc(r.text.length > 150 ? r.text.slice(0, 147) + "…" : r.text)}</span></label><span class="ch-count">${r.off ? "off" : r.lines}</span></div>${whyNote(r.why, "line:" + r.key)}</li>`;
  const secHtml = s => `<li class="ch-sec${s.off ? " off" : ""}" data-sec="${s.key}">
      <div class="ch-sec-head">${grip(`data-ch-drag="sec" data-key="${s.key}"`, s.title)}<label class="q-check"><input type="checkbox" data-ch-sec="${s.key}"${s.off ? "" : " checked"}><span class="ch-txt"><b>${esc(s.title)}</b></span></label><span class="ch-count">${s.off ? "off" : lineWord(s.lines)}</span></div>
      ${whyNote(s.why, "sec:" + s.key)}
      ${s.off ? "" : s.single ? `<p class="ch-single small muted">${esc(s.single.length > 160 ? s.single.slice(0, 157) + "…" : s.single)}</p>` : s.entries ? `<ul class="ch-entries">${s.entries.map(entryHtml).join("") || '<li class="small muted">Nothing finished here yet.</li>'}</ul>` : `<ul class="ch-rows">${s.rows.map(r => rowHtml(r)).join("")}</ul>`}</li>`;
  // A design with two columns: the lines are counted and listed for each column, the left (side) column first
  let list;
  if (geo.sidebar) {
    const left = secs.filter(s => s.side), right = secs.filter(s => !s.side);
    const colHead = (n, name, used) => `<li class="ch-col-head"><b>Column ${n}</b> <span class="small muted">${name}</span><span class="ch-count${used > capAll ? " over" : ""}">${used} of ${capAll} lines</span></li>`;
    list = colHead(1, "left, the side column", sideT) + (left.map(secHtml).join("") || '<li class="small muted">Nothing in this column.</li>')
      + colHead(2, "right, the main column", total) + chooseList(right, secHtml, p);
  } else list = chooseList(secs, secHtml, p);
  return `<div class="ch-info" role="note"><span class="ch-i" aria-hidden="true">i</span><p>With what is ticked below, your resume is expected to run to <b>${expected} page${expected === 1 ? "" : "s"}</b>${live != null ? " (as the preview shows it)" : ""}. ${expected <= 1 ? "That fits on one page." : expected === 2 ? "Two pages is fine for most experienced people; press Fit to one page if you want just one." : "That is long. Aim for two at most."}</p></div>
    <div class="ch-meter ${over > 0 ? "over" : "fits"}" role="status">
      <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <span>About <b>${Math.max(total, sideT)} lines</b> in the longest column. ${pageWord} about <b>${capAll}</b> in the ${esc(geo.tpl.name)} layout with ${geo.tpl.margin} mm margins${geo.tpl.lh && geo.tpl.lh !== 1 ? ` and ${geo.tpl.lh}× line spacing` : ""}. ${over > 0 || sideOver > 0 ? `<b>${lineWord(Math.max(over, sideOver))} over</b>, so it runs onto ${pages === 2 ? "a third page" : "a second page"}.` : `It fits on ${pages === 2 ? "two pages" : "one page"}${capAll - Math.max(total, sideT) >= 4 ? ` with about ${lineWord(capAll - Math.max(total, sideT))} to spare` : ""}.`}${geo.sidebar ? ` Column 1 uses ${sideT} lines and column 2 uses ${total}.` : ""}</span></div>
    <div class="b-actions"><button class="btn primary" type="button" data-act="ch-fit">Fit to one page</button><button class="btn" type="button" data-act="ch-fit2">Fit on two pages</button><button class="btn" type="button" data-act="ch-all">Show everything again</button></div>
    <p class="small muted" id="chNote" role="status">${builder.chNote ? esc(builder.chNote) : "Fit to one page or two pages hides the least useful parts first, newest and most relevant last, and says why for each. It checks both columns, then checks the preview, and keeps going until the preview agrees. If there's room later, press it again and it ticks back what it hid. Drag the handles to change the order."}</p>
    <ol class="ch-list${geo.sidebar ? " two-col" : ""}">${list || '<li class="small muted">Finish a job or qualification first, and it will show here.</li>'}</ol>`;
}
function chooseHtml() {
  const drafts = draftsIn(P()).length;
  return `<div class="b-sub">Choose what goes on this resume</div><p class="q-hint">Your profile keeps everything. Untick any section, job, bullet point or line you don't want on this version, and drag the handles to change the order. The numbers are lines on the page. You can save each version under its own name below.</p>
    <div class="ch-box" id="bChoose">${chooseInner()}</div>${drafts ? `<p class="small muted">${drafts} draft ${drafts === 1 ? "entry isn't" : "entries aren't"} on your resume until ${drafts === 1 ? "it's" : "they're"} finished.</p>` : ""}`;
}
function refreshChoose() {
  touchProfile("builder");
  renderPreview();   // first, so the page count in the box below is the one the preview shows
  const el = $("bChoose");
  if (el) el.innerHTML = chooseInner();
}

/* --- Fit to one page: hide the least useful things first, each with its reason --- */
function planOnePage(p, pages = 1, shrink = 0) {
  const secs = chooseSections(p), geo = pageGeometry(), cap = geo.cap * pages - shrink;
  const pri = entryPriority(p), target = val(p.target.title) || "the job you're going for";
  const steps = [];
  const sec = k => secs.find(s => s.key === k && !s.off);
  // 1. sections that matter least to a recruiter
  const ORDER = [["interests", "Interests are the least useful section for most recruiters, so it goes first when space is tight."], ["publications", "Publications only matter for research roles; this takes space from your experience."], ["awards", "Awards help, but your experience and skills matter more when there's only one page."], ["availability", "Availability can be said in your cover letter or when you're contacted."], ["volunteering", "Volunteering is the next thing to drop: your paid experience is stronger evidence."], ["projects", "Projects are shown in your experience and education already."]];
  // 2. older or less related jobs and qualifications, lowest priority first
  const entryStep = (list, prefix) => (sec(list) ? sec(list).entries : []).filter(e => !e.off).map(e => ({ e, pr: { high: 3, medium: 2, low: 1 }[pri[prefix + (e.i + 1)]] || 2 })).sort((a, b) => a.pr - b.pr || b.e.i - a.e.i);
  const queue = [];
  for (const [k, why] of ORDER) if (sec(k)) queue.push({ type: "sec", key: k, why, lines: sec(k).lines });
  // trim long lists of bullets on older jobs (keep the first two), and the subjects line on older qualifications
  for (const { e, pr } of entryStep("experience", "E")) if (pr < 3) e.rows.slice(2).filter(r => !r.off).forEach(r => queue.push({ type: "line", key: r.key, why: `An older, less related job (${e.title}): its first two bullet points say enough.`, lines: r.lines }));
  for (const { e } of entryStep("education", "D").slice(0, 3)) e.rows.filter(r => !r.off && /^Relevant coursework/i.test(r.text)).forEach(r => queue.push({ type: "line", key: r.key, why: `The subjects line takes space and your degree already tells the story (${e.title}).`, lines: r.lines }));
  for (const { e, pr } of entryStep("experience", "E")) if (pr === 1 && secs.find(s => s.key === "experience").entries.filter(x => !x.off).length > 2) queue.push({ type: "entry", key: `entry:experience.${e.i}`, list: "experience", i: e.i, why: `Older and less related to ${target}, so it ranks lowest of your jobs.`, lines: Math.round(pageGeometry().entry + e.rows.reduce((a, r) => a + r.lines, 0)) });
  for (const { e, pr } of entryStep("education", "D")) if (pr === 1 && secs.find(s => s.key === "education").entries.filter(x => !x.off).length > 1) queue.push({ type: "entry", key: `entry:education.${e.i}`, list: "education", i: e.i, why: "School-level study isn't needed once you have a higher qualification.", lines: Math.round(pageGeometry().entry + e.rows.reduce((a, r) => a + r.lines, 0)) });
  // 3. last resort: the third bullet point onward on every remaining job
  for (const { e } of entryStep("experience", "E")) e.rows.slice(3).filter(r => !r.off).forEach(r => queue.push({ type: "line", key: r.key, why: `Your first three bullet points for ${e.title} are the strongest; the rest don't fit.`, lines: r.lines }));
  let total = chTotal(secs);
  const seen = new Set();
  for (const q of queue) {
    if (total <= cap) break;
    const id = q.type + q.key;
    if (seen.has(id)) continue;
    seen.add(id); steps.push(q); total -= q.lines;
  }
  // a design with a side column: that column has to fit on its own too, so the least useful side sections go if it runs over
  let sideT = geo.sidebar ? chSideTotal(secs) : 0;
  if (geo.sidebar && sideT > cap) {
    const rank = k => { const i = ORDER.findIndex(o => o[0] === k); return i < 0 ? 99 : i; };
    for (const s of secs.filter(x => x.side && !x.off && x.key !== "contact").sort((a, b) => rank(a.key) - rank(b.key) || b.lines - a.lines)) {
      if (sideT <= cap) break;
      const id = "sec" + s.key;
      if (seen.has(id)) continue;
      seen.add(id); steps.push({ type: "sec", key: s.key, why: "The side column runs past the page on its own, and this matters least in it.", lines: s.lines }); sideT -= s.lines;
    }
  }
  return { steps, total, cap, fits: total <= cap && sideT <= cap, side: sideT };
}
// Put back one thing that was hidden (a section, a line, or a whole job or qualification)
function restoreKey(p, key) {
  const cv = p.cv;
  if (key.startsWith("sec:")) cv.hideSections = cv.hideSections.filter(x => x !== key.slice(4));
  else if (key.startsWith("line:")) cv.hideLines = cv.hideLines.filter(x => norm(x) !== norm(key.slice(5)));
  else if (key.startsWith("entry:")) { const [l, i] = key.slice(6).split("."); const e = p[l] && p[l][+i]; if (e) { e.hidden = false; e.hideWhy = ""; } }
  cv.hideWhy = cv.hideWhy.filter(x => !x.startsWith(key + "||"));
}
// The sections in order, with a tick box for the driver's licence straight under the profile
function chooseList(secs, secHtml, p) {
  const html = secs.map(secHtml);
  if (val(p.contact.licence)) {
    const off = !!p.cv.hideLicence;
    const lic = `<li class="ch-sec ch-lic${off ? " off" : ""}"><div class="ch-sec-head"><label class="q-check"><input type="checkbox" data-ch-lic="1"${off ? "" : " checked"}><span class="ch-txt"><b>Driver's licence</b> <span class="small muted">${esc(p.contact.licence)}</span></span></label><span class="ch-count">${off ? "off" : "1 line"}</span></div></li>`;
    const k = secs.findIndex(s => s.key === "summary");
    html.splice(k + 1, 0, lic);
  }
  return html.join("");
}
const HIDE_LISTS = ["experience", "education", "projects", "volunteering"];
const hideSnap = p => JSON.stringify({ s: p.cv.hideSections, l: p.cv.hideLines, w: p.cv.hideWhy, e: HIDE_LISTS.map(k => p[k].map(x => [x.hidden, x.hideWhy])) });
function hideLoad(p, snap) {
  const o = JSON.parse(snap);
  p.cv.hideSections = o.s; p.cv.hideLines = o.l; p.cv.hideWhy = o.w;
  HIDE_LISTS.forEach((k, n) => p[k].forEach((x, i) => { [x.hidden, x.hideWhy] = o.e[n][i]; }));
}
// If there's room, tick back what an earlier fit hid, the most useful first. Stops at the first one that wouldn't fit.
function restoreFit(p, pages) {
  const geo = pageGeometry(), cap = geo.cap * pages;
  const entryKeys = HIDE_LISTS.flatMap(l => p[l].map((x, i) => x.hidden && x.hideWhy ? `entry:${l}.${i}` : null).filter(Boolean));
  const keys = [...entryKeys, ...p.cv.hideWhy.map(x => x.split("||")[0]).reverse()];
  let n = 0;
  for (const key of keys) {
    const before = hideSnap(p);
    restoreKey(p, key);
    const secs = chooseSections(p);
    if (chTotal(secs) > cap || (geo.sidebar && chSideTotal(secs) > cap)) { hideLoad(p, before); break; }
    n++;
  }
  return n;
}
function applyPlan(p, plan) {
  const cv = p.cv;
  const setWhy = (k, why) => { cv.hideWhy = cv.hideWhy.filter(x => !x.startsWith(k + "||")); cv.hideWhy.push(`${k}||${why}`); };
  for (const s of plan.steps) {
    if (s.type === "sec") { if (!cv.hideSections.includes(s.key)) cv.hideSections.push(s.key); setWhy("sec:" + s.key, s.why); }
    else if (s.type === "line") { if (!cv.hideLines.some(x => norm(x) === norm(s.key))) cv.hideLines.push(s.key); setWhy("line:" + s.key, s.why); }
    else if (s.type === "entry") { const e = p[s.list][s.i]; if (e) { e.hidden = true; e.hideWhy = s.why; } }
  }
}
function chooseAct(act, b) {
  const p = P(), cv = p.cv;
  if (act === "ch-up" || act === "ch-down") {
    const keys = chooseSections(p).map(s => s.key), k = keys.indexOf(b.dataset.key), j = k + (act === "ch-up" ? -1 : 1);
    if (k < 0 || j < 0 || j >= keys.length) return;
    [keys[k], keys[j]] = [keys[j], keys[k]];
    cv.order = keys; builder.chNote = "";
    refreshChoose();
    const again = document.querySelector(`#bChoose [data-act="${act}"][data-key="${b.dataset.key}"]`); if (again && !again.disabled) again.focus();
    return;
  }
  if (act === "ch-fit" || act === "ch-fit2") {
    const pages = act === "ch-fit2" ? 2 : 1, word = pages === 1 ? "one page" : "two pages";
    builder.chPages = pages;
    const back = restoreFit(p, pages);   // anything an earlier fit hid comes back first if there's room now
    const plan = planOnePage(p, pages), sideNote = pageGeometry().sidebar ? " Both columns were checked." : "";
    let hidden = plan.steps.length, stillOver = !plan.fits;
    if (hidden) applyPlan(p, plan);
    // the preview has the last word: while it still shows more pages than asked for, hide a little more
    renderPreview();
    for (let tries = 0, extra = 2; tries < 10 && livePages() != null && livePages() > pages; tries++, extra += 2) {
      const more = planOnePage(p, pages, extra);
      if (!more.steps.length) break;
      applyPlan(p, more); hidden += more.steps.length; renderPreview();
    }
    stillOver = livePages() != null ? livePages() > pages : stillOver;
    if (!hidden) builder.chNote = (back ? `Put back ${back} thing${back === 1 ? "" : "s"} that fit now. ` : "") + (!stillOver ? `It fits on ${word}, and the preview agrees. Nothing to hide.` : "There's nothing left that's safe to hide. Shorten your bullet points or choose a more compact design.") + sideNote;
    else builder.chNote = (back ? `Put back ${back}, ` : "") + `hid ${hidden} thing${hidden === 1 ? "" : "s"} to fit ${word}${stillOver ? ", but the preview still shows it a little over" : ", and the preview agrees"}. Each has its reason below, with a button to put it back.` + sideNote;
    refreshChoose();
    return;
  }
  if (act === "ch-top4") {
    const grp = (chooseSections(p).find(x => x.key === "skills") || { rows: [] }).rows.find(r => r.label === b.dataset.label);
    if (grp) { const keep = new Set(grp.items.filter(x => !x.off).slice(0, SKILLS_TICKED_MAX).map(x => x.key)); for (const x of grp.items) if (!x.off && !keep.has(x.key)) cv.hideLines.push(x.key); }
    builder.chNote = "";
    refreshChoose();
    return;
  }
  if (act === "ch-all") {
    cv.hideSections = []; cv.hideLines = []; cv.hideWhy = [];
    for (const l of ["experience", "education", "projects", "volunteering"]) p[l].forEach(e => { e.hidden = false; e.hideWhy = ""; });
    builder.chNote = "Everything is back on this resume."; builder.chPages = 1;
    refreshChoose();
    return;
  }
  if (act === "ch-restore") {
    restoreKey(p, b.dataset.key);
    builder.chNote = "";
    refreshChoose();
  }
}
onInit(() => {
  $("bForm").addEventListener("change", e => {
    const t = e.target, p = P(), cv = p.cv;
    if (t.dataset.chLic) {
      cv.hideLicence = !t.checked;
      builder.chNote = ""; refreshChoose();
    } else if (t.dataset.chSec) {
      const k = t.dataset.chSec;
      cv.hideSections = t.checked ? cv.hideSections.filter(x => x !== k) : [...new Set([...cv.hideSections, k])];
      cv.hideWhy = cv.hideWhy.filter(x => !x.startsWith("sec:" + k + "||"));
      builder.chNote = ""; refreshChoose();
    } else if (t.dataset.chLine != null) {
      const k = t.dataset.chLine;
      if (t.checked && /^skill:/.test(k)) {
        const ticked = t.closest(".ch-skills") ? t.closest(".ch-skills").querySelectorAll("input:checked").length : 0;
        if (ticked > SKILLS_TICKED_MAX) { t.checked = false; builder.chNote = ""; const n = t.closest("li") && t.closest("li").querySelector(".ch-skill-note"); if (n) { n.classList.add("warnflash"); n.textContent = `That's ${SKILLS_TICKED_MAX} already. ${SKILLS_TICKED_MAX} is a good number: untick one first if you'd like this one instead.`; } return; }
      }
      cv.hideLines = t.checked ? cv.hideLines.filter(x => norm(x) !== norm(k)) : [...cv.hideLines, k];
      cv.hideWhy = cv.hideWhy.filter(x => !x.startsWith("line:" + k + "||"));
      builder.chNote = ""; refreshChoose();
    } else if (t.dataset.show && t.closest("#bChoose")) {
      const [list, i] = t.dataset.show.split("."), x = p[list][+i];
      if (x) x.hideWhy = "";
      builder.chNote = ""; refreshChoose();
    }
  });
});

/* --- Before downloading: two other designs to try, and a way to ask for new ones --- */
function designSuggestHtml() {
  const cur = builderTpl().key, ranked = rankTemplates().filter(r => r.t.key !== cur);
  if (!ranked.length) return "";
  const n = ranked.length, start = ((builder.altSeed || 0) * 2) % n, picks = [ranked[start], n > 1 ? ranked[(start + 1) % n] : null].filter(Boolean);
  const data = cvData();
  const card = ({ t }) => `<button type="button" class="tpl-card" data-act="tpl" data-tpl="${t.key}" aria-pressed="false" aria-label="Switch to ${esc(t.name)}. ${esc(t.goodFor)}"><span class="tpl-thumb"><div>${cvHtml(cvModel(data, t), t, { accent: t.accent })}</div></span><span class="tpl-name">${esc(t.name)}</span>${t.ats ? '<span class="tpl-badges"><span class="tpl-badge ats">ATS-friendly</span></span>' : ""}</button>`;
  return `<div class="b-sub">Try another design?</div><div class="ch-newdesign">
      <p><b>Want a new design?</b> You're using <b>${esc(builderTpl().name)}</b>. Here ${picks.length === 1 ? "is another that suits" : "are two others that suit"} ${esc(lowerFirst(jobLabel(cvJobType()) || "your kind of work"))}. Tap one to switch; your details carry over.</p>
      <div class="b-tpls">${picks.map(card).join("")}</div>
      <div class="b-actions"><button class="btn" type="button" data-act="alt-more">Suggest two different designs</button><button class="btn ghost" type="button" data-act="to-cv">Browse all ${CV_TEMPLATES.length} designs</button></div></div>`;
}
