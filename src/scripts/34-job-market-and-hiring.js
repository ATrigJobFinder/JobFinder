/* ===================== Job market: shared jobs, talent pool, invitations and applications ===================== */
// Shared documents (everyone who can open Job Finder reads them; each person writes only their own):
//   jobs/<id>    an employer's company profile and job ads
//   talent/<id>  a job seeker's opt-in profile for employers to find
//   outbox/<id>  an employer's invitations to apply (toIds lists who they're for)
//   apps/<id>    a job seeker's applications to jobs posted here (employerIds lists who they're for)
const market = { started: false, settled: false, db: null, uid: null, user: null, canWrite: null, canEdit: false, employers: [], talent: [], invites: [], incoming: [], myApps: null, outbox: null, myJobs: null, error: "" };
const hiring = privateDoc("hiring", "jobfinder.hiring.v1", () => ({ status: {}, notes: {}, ratings: {}, log: {}, seen: {}, pools: [], searches: [], local: null, localApps: [], localOutbox: null, demo: null }));
const EXAMPLE_JOBS = [
  { id: "ex1", title: "Graduate Mechanical Engineer", company: "Coastline Energy Services", location: "Brisbane, QLD", workType: "Full time", remote: "Hybrid", salary: "$75,000 to $82,000 + super", posted: "2026-10-20", source: "Coastline Energy careers page", sourceType: "company", url: "https://example.com/coastline/careers/grad-mech", description: "Join our engineering team delivering solar, battery storage and HVAC projects for commercial clients across Queensland. You will produce 3D models and drawings in SolidWorks or AutoCAD, carry out FEA and hand calculations, support HVAC and piping design, and prepare technical reports. Requirements: Bachelor of Engineering (Mechanical), SolidWorks or AutoCAD, FEA, strong written communication. Job reference: CES-2041.", example: true },
  { id: "ex2", title: "Graduate Mechanical Engineer - Brisbane", company: "Coastline Energy Services Pty Ltd", location: "Brisbane QLD 4000", workType: "Full time", remote: "", salary: "", posted: "2026-10-22", source: "Example job board", sourceType: "board", url: "https://example.com/board/job/88123", description: "Coastline Energy Services is hiring a graduate mechanical engineer for solar, battery and HVAC projects. Job reference: CES-2041.", example: true },
  { id: "ex3", title: "Data Analyst", company: "Harbour Bank", location: "Sydney, NSW", workType: "Full time", remote: "Hybrid", salary: "$90,000 to $100,000 + super", posted: "2026-10-18", source: "Harbour Bank careers", sourceType: "company", url: "https://example.com/harbour/careers/da-77", description: "Turn customer and transaction data into insights for our retail banking team. Build dashboards in Power BI, write SQL queries, clean data in Python and present findings to stakeholders. Requirements: SQL, Power BI or Tableau, Python, attention to detail, communication. Ref: HB-77.", example: true },
  { id: "ex4", title: "Data Analyst (Retail Banking)", company: "Harbour Bank Limited", location: "Sydney CBD", workType: "Full time", remote: "", salary: "$90k - $100k", posted: "2026-10-19", source: "Example aggregator", sourceType: "aggregator", url: "https://example.com/aggregator/12345", description: "Turn customer and transaction data into insights for our retail banking team. Build dashboards in Power BI, write SQL queries, clean data in Python and present findings to stakeholders.", example: true },
  { id: "ex5", title: "Retail Team Member (Casual)", company: "Greenleaf Grocers", location: "Melbourne, VIC", workType: "Casual", remote: "On-site", salary: "$26.50 an hour + penalty rates", posted: "2026-10-24", source: "Greenleaf careers", sourceType: "company", url: "https://example.com/greenleaf/jobs/rtm", description: "Serve customers, run the registers, restock shelves and keep the store tidy. Weekend availability needed. Customer service experience preferred; training provided.", example: true },
  { id: "ex6", title: "Junior Civil Drafter", company: "Northline Consulting", location: "Perth, WA", workType: "Full time", remote: "On-site", salary: "$65,000 to $72,000 + super", posted: "2026-10-15", source: "Northline careers", sourceType: "company", url: "https://example.com/northline/drafter", description: "Prepare civil drawings in AutoCAD and Civil 3D for subdivisions and roads, working with senior engineers. Requirements: AutoCAD, Civil 3D, attention to detail; Certificate IV or Diploma in drafting preferred.", example: true },
  { id: "ex7", title: "Customer Service Officer", company: "Riverbend Water", location: "Remote (Australia)", workType: "Part time", remote: "Remote", salary: "$62,000 pro rata", posted: "2026-10-21", source: "Riverbend Water careers", sourceType: "company", url: "https://example.com/riverbend/cso", description: "Answer customer calls and emails about accounts and water services, resolve complaints, and record cases in our CRM. Requirements: customer service, communication, CRM experience.", example: true }
];

/* --- Connecting --- */
async function startMarket() {
  if (market.started) return market.ready;
  market.started = true;
  market.ready = (async () => {
    await memoryReady;
    // the job board, talent pool and applications are shared through Claude; a Job Finder account keeps only your own things
    market.db = memory.viaAccount ? null : memory.db; market.uid = memory.viaAccount ? null : memory.uid;
    if (!market.db || !market.uid) market.settled = true;   // (outside Claude there's nothing to wait for)
    else setTimeout(() => { if (!market.settled) { market.settled = true; marketChanged(); } }, 3000);
    try { market.user = window.claude && window.claude.use ? await window.claude.use("user") : null; } catch { market.user = null; }
    if (market.user) { try { market.canWrite = await market.user.can("data.write"); } catch { market.canWrite = null; } try { market.canEdit = await market.user.canEdit(); } catch { market.canEdit = false; } }
    if (!market.db || !market.uid) return;
    const db = market.db, uid = market.uid;
    const live = (ref, fn) => { try { ref.onSnapshot(fn, e => { market.error = e && e.code; }); } catch (e) { market.error = "unavailable"; } };
    live(db.collection("jobs"), snap => { market.employers = snap.docs.filter(d => d.exists).map(d => ({ uid: d.id, ...JSON.parse(JSON.stringify(d.data())) })); market.myJobs = market.employers.find(e => e.uid === uid) || null; market.settled = true; marketChanged(); });
    live(db.collection("talent"), snap => { market.talent = snap.docs.filter(d => d.exists).map(d => ({ uid: d.id, ...JSON.parse(JSON.stringify(d.data())) })).filter(t => t.visible !== false); marketChanged(); });
    live(db.collection("outbox").where("toIds", "array-contains", uid), snap => { market.invites = snap.docs.flatMap(d => ((d.data() || {}).invites || []).filter(i => i.to === uid).map(i => ({ ...i, from: d.id }))); marketChanged(); });
    live(db.collection("apps").where("employerIds", "array-contains", uid), snap => { market.incoming = snap.docs.flatMap(d => ((d.data() || {}).items || []).filter(i => i.employerId === uid).map(i => ({ ...i, candidate: d.id, name: (d.data() || {}).name }))); marketChanged(); });
    live(db.doc("apps/" + uid), snap => { market.myApps = snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null; marketChanged(); });
    live(db.doc("outbox/" + uid), snap => { market.outbox = snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null; marketChanged(); });
    marketChanged();
  })();
  return market.ready;
}
let mkTimer = null;
function marketChanged() { clearTimeout(mkTimer); mkTimer = setTimeout(() => { if (currentView === "jobs") renderJobs(); emRefresh(); if (currentView === "home") renderHome(); if (currentView === "companies" && typeof refreshJobTabs === "function") refreshJobTabs(); }, 120); }
const canPost = () => market.db && market.uid && market.canWrite !== false;
const shareNote = () => !market.db ? "Posting, the talent pool and applications need this page to be opened in Claude, where they're shared between everyone who can open Job Finder." : market.canWrite === false ? "You can browse, but your access to this page is view-only, so you can't post or apply here. Ask the owner for Contributor or Editor access." : "";
// Status messages survive the re-renders that live updates cause
const flash = {};
function say(id, text, err) { flash[id] = { text, err: !!err, t: Date.now() }; const el = $(id); if (el) { el.textContent = text; el.classList.toggle("err", !!err); } }
function statusHTML(id, cls = "status-line", tag = "span") { const f = flash[id], live = f && Date.now() - f.t < 10000; return `<${tag} class="${cls}${live && f.err ? " err" : ""}" id="${id}" role="status">${live ? esc(f.text) : ""}</${tag}>`; }
async function safeWrite(fn, statusId) {
  try { await fn(); return true; }
  catch (e) {
    const code = e && e.code;
    if (code === "invalid_argument") market.canWrite = false;
    if (statusId) say(statusId, code === "quota_exceeded" ? "Job Finder's shared storage is full. Remove old jobs, then try again." : code === "invalid_argument" ? "Your access to this page doesn't allow saving shared data." : "Couldn't save just now. Try again in a moment.", true);
    return false;
  }
}

/* --- All jobs, merged --- */
// shared data comes from other people, so only ever link to web pages
const safeUrl = u => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || "").trim()) ? String(u).trim() : "";
function allJobs() {
  // ads people posted here: shared ones, and (outside Claude) the ones posted from this browser
  const docs = [...market.employers];
  if ((!market.db || market.canWrite === false) && hiring.data.local) docs.push({ uid: EM_LOCAL_ID, ...hiring.data.local });
  const site = docs.flatMap(e => (e.jobs || []).filter(j => j.status !== "closed" && j.status !== "draft" && !(j.closes && j.closes < todayISO())).map(j => {
    const t = emTier(j), co = e.employer || {};
    return { ...j, company: co.name || "Employer", employerUid: e.uid, key: e.uid + ":" + j.id, source: "Job Finder", sourceType: "site", url: "", promo: t.promo, brand: t.brand ? { name: co.name, logo: co.logo, colour: co.colour, about: co.about } : null, sellingPoints: t.brand ? (j.sellingPoints || []).filter(Boolean) : [], questions: j.questions || [] };
  }));
  const mine = T().filter(i => i.title && (i.jd || i.url)).map(i => ({ id: "t" + i.id, trackerId: i.id, title: i.title, company: i.company, location: i.location, url: safeUrl(i.url), description: i.jd, source: "Saved by you", sourceType: "user", posted: (i.created || "").slice(0, 10) }));
  // made-up examples only show when nothing real has been posted yet
  const list = site.length ? [...site, ...mine] : [...EXAMPLE_JOBS, ...mine];
  return DEDUP.cluster(list);
}
// Which of your details strong matches are worked out from: your profile (the resume builder) or your resume (the one in Tailor to a job)
const jbFromNow = () => jobsUI.from || (hasProfile(P()) ? "profile" : "resume");
function jobMatch(j) {
  const p = P(), fromProfile = jbFromNow() === "profile";
  const mine = fromProfile
    ? new Set([...skillSet(hasProfile(p) ? profileToText(p) : ""), ...[...p.skills.hard, ...p.skills.software].flatMap(s => [...skillSet(s)])])
    : new Set([...skillSet(els.resume.value || "")]);
  const want = (j.skills && j.skills.length ? j.skills : [...skillSet([j.title, j.description].join("\n"))]).filter(s => (SKILLS.find(k => k.name === s) || {}).kind === "hard");
  if (!want.length || !mine.size) return null;
  const have = want.filter(s => mine.has(s));
  const titleBonus = p.target.title && similarity(zoneKey(p.target.title), zoneKey(j.title)) >= 0.4 ? 15 : 0;
  return { pct: Math.min(100, Math.round(have.length / want.length * 85) + titleBonus), have, missing: want.filter(s => !mine.has(s)) };
}
const jobsUI = { by: "title", q: "", eduLevel: "", eduType: "", from: "", where: "", type: "", remote: "", source: "", payMin: "", payMax: "", sort: "match", open: null, applyFor: null, limit: 40 };
// What the "Searching by" roller picks, and which box of jobsUI the search bar writes to
const JB_MODES = {
  title: { field: "q", ph: "Job title, skill or company", label: "Search by job title, skill or company" },
  education: { field: "", ph: "", label: "Search by education" },   // two drop-downs, Level and Type, instead of a search box
  strong: { field: "q", ph: "Jobs you're a strong fit for. Add a keyword to narrow them", label: "Narrow your strong matches by keyword" }
};
// Education: the level and the type (field of study). A job matches if its words mention both.
const EDU_LEVELS = { "Certificate III or IV": /\bcert(?:ificate)?\.?\s*(?:iii|iv|3|4)\b/i, Diploma: /\bdiploma\b/i, "Bachelor degree": /\b(?:bachelor|undergraduate|degree)\b/i, Honours: /\bhonou?rs\b|\bhons\b/i, "Graduate certificate or diploma": /\bgraduate (?:certificate|diploma)\b/i, Masters: /\bmaster'?s?\b/i, PhD: /\bph\.?d\b|\bdoctora/i };
const EDU_TYPES = { Engineering: /\bengineer/i, "IT and computer science": /\b(?:it|information technology|computer|computing|software|cyber ?security|data science)\b/i, Business: /\b(?:business|commerce|management|marketing)\b/i, "Accounting and finance": /\b(?:accounting|finance|economics|actuarial)\b/i, Health: /\b(?:health|nursing|medical|pharmacy|physiotherapy|allied)\b/i, Education: /\b(?:education|teaching)\b/i, Law: /\b(?:law|legal|juris)/i, Science: /\b(?:science|biology|chemistry|physics|environmental)\b/i, "Arts and design": /\b(?:arts?|design|media|communication|creative)\b/i, "Construction and trades": /\b(?:construction|building|architecture|surveying|trade|apprentice)/i };
const STRONG_PCT = 60;   // the same line the employer side calls a strong match
const PAY_STEPS = [40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 250];   // thousands a year
// Pay is written every which way ("$75,000 to $82,000 + super", "$90k - $100k", "$26.50 an hour"), so turn it into a yearly range
function parsePay(text) {
  const t = String(text || ""); if (!t) return null;
  const hits = [...t.matchAll(/(\$)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/gi)].filter(m => m[1] || m[3]);
  const nums = hits.map(m => parseFloat(m[2].replace(/,/g, "")) * (m[3] ? 1000 : 1)).filter(n => n > 0);
  if (!nums.length) return null;
  const per = /\b(hour|hr|p\/?h)\b/i.test(t) ? 1976 : /\b(day|daily)\b/i.test(t) ? 260 : /\b(week|wk|pw)\b/i.test(t) ? 52 : 1;
  const yr = nums.map(n => per === 1 && n < 500 ? n * 1976 : n * per);
  return [Math.min(...yr), Math.max(...yr)];
}
const workMode = j => j.remote || (/\bremote\b/i.test(j.location || "") ? "Remote" : "");
const fmtPayStep = k => "$" + k + "k";
function jobFilters(list) {
  const q = jobsUI.q.trim().toLowerCase(), w = jobsUI.where.trim().toLowerCase(), lvl = EDU_LEVELS[jobsUI.eduLevel], typ = EDU_TYPES[jobsUI.eduType];
  const eduText = j => [j.title, j.description, ...(j.requirements || [])].join(" ");
  const lo = jobsUI.payMin ? +jobsUI.payMin * 1000 : 0, hi = jobsUI.payMax ? +jobsUI.payMax * 1000 : Infinity;
  const strong = jobsUI.by === "strong";
  // listings from the database were already searched there (full-text, state and type), so only the other filters apply to them
  return list.filter(j => (j.fromDb || ((!q || [j.title, j.company, j.description].join(" ").toLowerCase().includes(q))
    && (!w || [j.location, j.remote].join(" ").toLowerCase().includes(w) || (w === "remote" && /remote/i.test(j.location + " " + j.remote)))
    && (!lvl || lvl.test(eduText(j))) && (!typ || typ.test(eduText(j)))
    && (!jobsUI.type || j.workType === jobsUI.type)))
    && (!jobsUI.remote || workMode(j).toLowerCase() === jobsUI.remote.toLowerCase())
    && (!strong || (j.m && j.m.pct >= STRONG_PCT))
    && (!(lo || hi < Infinity) || (p => p && p[1] >= lo && p[0] <= hi)(parsePay(j.salary)))
    && (!jobsUI.source || (jobsUI.source === "site" ? j.sourceType === "site" : jobsUI.source === "user" ? (j.sourceType === "user" || j.also.some(a => a.sourceType === "user")) : j.sourceType !== "site" && j.sourceType !== "user")));
}
/* --- The filter bar: the "Searching by" roller, search box, pay, where you'll work --- */
const RO_H = 34;   // height of one roller row (matches .jb-ro in the stylesheet)
function jbSetMode(by, scroll) {
  if (!JB_MODES[by]) return;
  jobsUI.by = by; jobsUI.limit = 40;
  renderJobs();
}
function jbPaintWheel(t) {
  if (!t) return;
  const pos = t.scrollTop / RO_H;
  [...t.children].forEach((b, i) => { const d = i - pos, a = Math.abs(d); b.style.opacity = String(Math.max(0.2, 1 - 0.5 * a)); b.style.transform = `perspective(160px) rotateX(${Math.max(-70, Math.min(70, -d * 38))}deg) scale(${Math.max(0.78, 1 - 0.1 * a)})`; });
}
const jbDragging = t => !!t && t.classList.contains("drag");
// A mouse can drag a wheel up and down (a finger already can). It snaps to the nearest row when let go.
function jbDragWheel(track) {
  let id = null, y0 = 0, s0 = 0;
  const move = e => {
    if (e.pointerId !== id) return;
    const dy = e.clientY - y0;
    if (!track._moved) { if (Math.abs(dy) < 4) return; track._moved = true; track.style.scrollSnapType = "none"; track.classList.add("drag"); }   // (only now, so a plain click still reaches the row)
    track.scrollTop = s0 - dy;
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; window.removeEventListener("pointermove", move, true); window.removeEventListener("pointerup", end, true); window.removeEventListener("pointercancel", end, true);
    if (!track.classList.contains("drag")) return;
    track.classList.remove("drag"); track.style.scrollSnapType = "";
    track.scrollTo({ top: Math.max(0, Math.min(track.children.length - 1, Math.round(track.scrollTop / RO_H))) * RO_H, behavior: reduceMotion() ? "auto" : "smooth" });
    setTimeout(() => { track._moved = false; }, 0);
  };
  track.addEventListener("pointerdown", e => {
    if (e.pointerType === "touch" || e.button) return;   // (a finger already scrolls it)
    id = e.pointerId; y0 = e.clientY; s0 = track.scrollTop; track._moved = false;
    window.addEventListener("pointermove", move, true); window.addEventListener("pointerup", end, true); window.addEventListener("pointercancel", end, true);
  });
  track.addEventListener("click", e => { if (track._moved) { e.stopPropagation(); e.preventDefault(); } }, true);
}
// Pay: one drop-down holding two wheels, From and To
const PAY_ITEMS = ["", ...PAY_STEPS.map(String)];
const jbPayText = () => { const a = jobsUI.payMin, b = jobsUI.payMax; return a && b ? `${fmtPayStep(a)} – ${fmtPayStep(b)}` : a ? `From ${fmtPayStep(a)}` : b ? `Up to ${fmtPayStep(b)}` : "Any pay"; };
function jbPaySync() {
  const txt = $("jbPayText"); if (!txt) return;
  txt.textContent = jbPayText(); $("jbPayBtn").classList.toggle("on", !!(jobsUI.payMin || jobsUI.payMax));
  const open = !$("jbPayPop").hidden;
  document.querySelectorAll("#jbPay .jb-wheel").forEach(w => {
    const t = w.querySelector(".jb-roller-track"), i = Math.max(0, PAY_ITEMS.indexOf(jobsUI[w.dataset.w]));
    [...t.children].forEach((b, n) => b.setAttribute("aria-selected", String(n === i)));
    if (open && !jbDragging(t) && Math.abs(t.scrollTop - i * RO_H) > 1) t.scrollTop = i * RO_H;
    jbPaintWheel(t);
  });
}
function jbSetPay(key, v) {
  if (jobsUI[key] === v) return;
  jobsUI[key] = v;
  if (+jobsUI.payMin && +jobsUI.payMax && +jobsUI.payMin > +jobsUI.payMax) jobsUI[key === "payMin" ? "payMax" : "payMin"] = v;   // From can't be above To
  jobsUI.limit = 40; renderJobs();
}
// Education: read your level and type from your profile or resume (highest qualification wins)
const EDU_RANK = [["PhD", /\bph\.?d\b|\bdoctor(?:ate|al)?\b/i], ["Masters", /\bmaster(?:'?s)?\b|\bm\.?(?:eng|sc|ba|com)\b/i], ["Graduate certificate or diploma", /\bgraduate (?:certificate|diploma)\b|\bgrad\.? ?(?:cert|dip)/i], ["Bachelor degree", /\bbachelor|\bundergraduate\b|\bb\.?(?:eng|sc|com|bus)\b/i], ["Honours", /\bhonou?rs\b|\bhons\b/i], ["Diploma", /\bdiploma\b/i], ["Certificate III or IV", /\bcert(?:ificate)?\.?\s*(?:iii|iv|3|4)\b/i]];
function jbEduFromMe() {
  const p = P();
  const fromProfile = () => p.education.map(e => [e.degree, e.level, e.subject, e.level2, e.subject2].filter(Boolean).join(" ")).filter(Boolean);
  const fromResume = () => { try { return parseResume(els.resume.value || "").zones.filter(z => z.kind === "education").map(z => z.label || "").filter(Boolean); } catch { return []; } };
  const order = jbFromNow() === "resume" ? [["resume", fromResume], ["profile", fromProfile]] : [["profile", fromProfile], ["resume", fromResume]];
  for (const [src, get] of order) {
    let best = null;
    for (const line of get()) {
      const rank = EDU_RANK.findIndex(([, re]) => re.test(line));
      let type = "", at = Infinity;
      for (const [k, re] of Object.entries(EDU_TYPES)) { const m = re.exec(line); if (m && m.index < at) { at = m.index; type = k; } }
      if ((rank >= 0 || type) && (!best || (rank >= 0 && (best.rank < 0 || rank < best.rank)))) best = { rank, level: rank >= 0 ? EDU_RANK[rank][0] : "", type };
    }
    if (best) return { level: best.level, type: best.type, src };
  }
  return null;
}
function jbEduAssist() {
  const note = $("jbEduNote"); if (!note) return;
  const s = jbEduFromMe();
  if (s && !jobsUI.eduTried) { jobsUI.eduTried = true; if (!jobsUI.eduLevel && !jobsUI.eduType) { jobsUI.eduLevel = s.level; jobsUI.eduType = s.type; } }   // fills itself in once; after that it's yours to change
  note.hidden = false;
  if (!s) { note.textContent = "Add your education to your profile or resume and we'll suggest your level and type here."; return; }
  const words = [s.level, s.type].filter(Boolean).join(", "), src = s.src === "resume" ? "resume" : "profile";
  note.innerHTML = jobsUI.eduLevel === s.level && jobsUI.eduType === s.type
    ? `Filled in from your ${src}: ${esc(words)}. Change it if that's not right.`
    : `Your ${src} suggests ${esc(words)}. <button type="button" class="linkish" data-edu-fill>Use this</button>`;
}
// Recommended searches: what you typed before, then jobs and industries from your profile or resume
const JB_HIST_KEY = "jobfinder.jobsearches.v1";
const jbHistory = () => { try { const h = JSON.parse(lsGet(JB_HIST_KEY) || "[]"); return Array.isArray(h) ? h.filter(x => typeof x === "string") : []; } catch { return []; } };
function jbRemember(q) {
  q = String(q || "").trim(); if (q.length < 3) return;
  const h = [q, ...jbHistory().filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
  lsSet(JB_HIST_KEY, JSON.stringify(h));
}
// industries (from the home page's list) that a person's experience points to: any role in the industry that their resume or profile names, or shares a word with their job titles
function jbIndustries(text, titles) {
  const words = new Set(titles.flatMap(t => String(t).toLowerCase().split(/[^a-z]+/)).filter(w => w.length >= 5));
  const scored = GLOBE_TREE.map(([name, key, subs]) => {
    const roles = [...new Set([...(GLOBE_ROLES[key] || []), ...Object.values(subs).flat()])];
    const score = roles.reduce((n, r) => n + (text.includes(r.toLowerCase()) ? 2 : 0) + (r.toLowerCase().split(/[^a-z]+/).some(w => words.has(w)) ? 1 : 0), 0);
    return [name, score];
  }).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  return scored.slice(0, 3).map(x => x[0]);
}
function jbRecommended() {
  const p = P(), has = hasProfile(p);
  const text = (has ? profileToText(p) : els.resume.value || "").toLowerCase();
  const titles = has ? p.experience.map(e => e.title).filter(Boolean) : [];
  const out = [], seen = new Set(), add = x => { x = String(x || "").trim(); const k = x.toLowerCase(); if (x && !seen.has(k)) { seen.add(k); out.push(x); } };
  jbHistory().slice(0, 4).forEach(add);
  if (has && p.target.title) add(p.target.title);
  titles.slice(0, 3).forEach(add);
  if (text) jbIndustries(text, titles).forEach(add);
  return out.slice(0, 8);
}
function syncJobFilters() {
  const by = jobsUI.by, mode = JB_MODES[by], q = $("jbQ");
  if (!q) return;
  const edu = by === "education";
  document.querySelectorAll("#jbBySeg .jb-segb").forEach(b => b.setAttribute("aria-checked", String(b.dataset.by === by)));
  if (edu) jbEduAssist(); else $("jbEduNote").hidden = true;
  jbPaySync();
  // the field it says: a search box, or for education the Level and Type drop-downs; the location box is always to the right
  $("jbSearchBox").hidden = edu; $("jbEdu").hidden = !edu; $("jbStrong").hidden = by !== "strong";
  if (mode.field) { q.dataset.jbf = mode.field; q.placeholder = mode.ph; $("jbQLabel").textContent = mode.label; if (document.activeElement !== q) q.value = jobsUI[mode.field]; }
  const w = $("jbWhere"); if (w && document.activeElement !== w) w.value = jobsUI.where;
  for (const [id, key] of [["jbType", "type"], ["jbSource", "source"], ["jbSort", "sort"], ["jbRemote", "remote"], ["jbEduLevel", "eduLevel"], ["jbEduType", "eduType"]]) { const el = $(id); if (el && el.value !== jobsUI[key]) el.value = jobsUI[key]; }
  if (by === "strong") {
    const f = $("jbFrom"), now = jbFromNow(); if (f && f.value !== now) f.value = now;
    const p = P(), empty = now === "profile" ? !hasProfile(p) : !String(els.resume.value || "").trim();
    $("jbFromNote").textContent = empty ? (now === "profile" ? "Your profile is empty. Add your details in Create or edit resume, or switch to your resume." : "No resume yet. Paste or upload one in Tailor to a job, or switch to your profile.") : now === "profile" ? "Using the skills and experience in your profile." : "Using the resume you added in Tailor to a job.";
  }
  const rec = by === "education" ? [] : jbRecommended(), cur = (jobsUI.q || "").toLowerCase();
  const sg = $("jbSuggest");
  sg.innerHTML = rec.length ? `<span class="jb-sg-l">Recommended searches</span>` + rec.map(x => `<button type="button" class="jb-sg${cur === x.toLowerCase() ? " on" : ""}" data-sg="${esc(x)}">${esc(x)}</button>`).join("") : "";
  sg.hidden = !rec.length;
  // searches typed under another heading stay on, shown as chips so they can be taken off
  const chips = [["q", "Job", by === "education"], ["eduLevel", "Level", !edu], ["eduType", "Education type", !edu]].filter(([k, , show]) => show && jobsUI[k].trim());
  const act = $("jbActive");
  act.hidden = !chips.length;
  act.innerHTML = chips.length ? chips.map(([k, l]) => `<button type="button" class="jb-chip" data-clear="${k}" aria-label="Remove ${l}: ${esc(jobsUI[k])}">${l}: ${esc(jobsUI[k])} <span aria-hidden="true">×</span></button>`).join("") + `<button type="button" class="jb-chip clear" data-clear="all">Clear all</button>` : "";
}
// The bell: how many saved applications are waiting to be filled out (jobs in the tracker still at "Saved")
function jbBell() {
  const b = $("jbBell"), n = $("jbBellN"); if (!b || !n) return;
  const c = (T() || []).filter(i => i.stage === "saved").length;
  n.hidden = !c; n.textContent = c > 9 ? "9+" : String(c);
  b.classList.toggle("has", c > 0);
  b.setAttribute("aria-label", c ? `${c} saved application${c === 1 ? "" : "s"} waiting to be filled out. Open the Application tracker` : "No saved applications waiting. Open the Application tracker");
  b.title = c ? `${c} saved application${c === 1 ? "" : "s"} waiting to be filled out` : "Application tracker: nothing saved is waiting";
}
// the tracker entry for a job, if it's in there
const jobTracked = j => T().find(i => DEDUP.same(DEDUP.prep({ title: i.title, company: i.company, location: i.location }), DEDUP.prep(j)));
// the employer's own careers page: the listing if it came from the company, else the company directory, else a search for it
function careerLink(j) {
  const own = [j, ...(j.also || [])].find(x => x.sourceType === "company" && safeUrl(x.url) && !/\/\/(?:www\.)?example\.com\b/i.test(x.url));
  if (own) return { url: safeUrl(own.url), exact: true };
  const nm = s => norm(String(s || "")).replace(/\b(pty|ltd|limited|group|australia|the)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const co = nm(j.company);
  const hit = co.length > 3 && COMPANY_DIRECTORY.find(c => { const d = nm(c.n); return d && (d === co || ((co.startsWith(d) || d.startsWith(co)) && Math.min(d.length, co.length) > 3)); });
  if (hit && hit.u) return { url: hit.u, exact: true };
  return { url: "https://www.google.com/search?q=" + encodeURIComponent(`${j.company || ""} careers jobs Australia`), exact: false };
}
function renderJobs() {
  const box = $("jbList");
  if (!box) return;
  const merged = allJobs();
  for (const j of merged) j.m = jobMatch(j);
  const total = merged.reduce((a, j) => a + 1 + j.also.length, 0), dupes = total - merged.length;
  syncJobFilters();
  const rank = j => (j.m ? j.m.pct : -1) + (j.promo ? 12 : 0);
  const list = jobFilters(merged).sort((a, b) => jobsUI.sort === "new" ? (b.promo ? 1 : 0) - (a.promo ? 1 : 0) || String(b.posted || "").localeCompare(String(a.posted || "")) : rank(b) - rank(a));
  const examples = merged.some(j => j.example);
  $("jbSummary").innerHTML = `${list.length} job${list.length === 1 ? "" : "s"}${dupes ? `. <b>${dupes} duplicate${dupes === 1 ? "" : "s"} merged</b> from ${total} listings` : ""}.${jobsUI.payMin || jobsUI.payMax ? " Jobs that don't list their pay are hidden while a pay filter is on." : ""}${examples ? ' <span class="tag">Examples</span> These are made-up listings to show how it works, until employers post jobs or listings are imported.' : ""}`;
  $("jbNote").textContent = ""; $("jbNote").hidden = true;   // (the note about posting and applications is for the hiring pages)
  const myApplied = new Set([...((market.myApps || {}).items || []).map(i => i.jobKey), ...(hiring.data.localApps || []).map(a => EM_LOCAL_ID + ":" + a.jobId)]);
  const tracked = jobTracked;
  jbBell();
  // keep the open job on the page even if it's past the limit
  const openIx = list.findIndex(j => (j.key || j.id) === jobsUI.open);
  if (openIx >= jobsUI.limit) jobsUI.limit = openIx + 1;
  // on a wide screen an opened job shows beside the list, not inside it
  const wide = matchMedia("(min-width: 900px)").matches;
  const warn = `<p class="job-warn" role="note"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.01"/></svg><span><b>Be careful:</b> don't supply credit card details or bank details when applying to a job.</span></p>`;
  const cardsHtml = list.slice(0, jobsUI.limit).map(j => {
    const tr = tracked(j), m = j.m, open = jobsUI.open === (j.key || j.id);
    return `<article class="job${open ? " open" : ""}" data-job="${esc(j.key || j.id)}">
      <button type="button" class="job-main" data-jb="open" aria-expanded="${open}"><span class="job-title">${j.brand ? emLogo(j.brand, "sm") : ""}${esc(j.title)}${j.promo ? ' <span class="emp-promo-tag">Promoted</span>' : ""}</span><span class="job-co">${esc(j.company || "")}${j.location ? ` · ${esc(j.location)}` : ""}</span>
        <span class="job-meta">${[j.workType, j.remote, j.salary].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}${j.posted ? `<span>Posted ${fmtDay(j.posted)}</span>` : ""}</span>${j.sellingPoints && j.sellingPoints.length ? `<span class="job-sp">${j.sellingPoints.map(x => `<span>${esc(x)}</span>`).join("")}</span>` : ""}</button>
      <div class="job-side">${m && m.pct > 0 ? `<span class="job-match ${m.pct >= 70 ? "hi" : m.pct >= 45 ? "mid" : "lo"}">${m.pct}% match</span>` : ""}<span class="job-src">${j.srcUrl ? `<a href="${esc(j.srcUrl)}" target="_blank" rel="noopener">${esc(j.source)}</a>` : esc(j.source)}${j.also.length ? ` + ${j.also.length} more` : ""}</span>${j.example ? '<span class="tag">Example</span>' : ""}${myApplied.has(j.key) ? '<span class="chip found">Applied</span>' : tr ? `<span class="chip found">${esc((STAGES_T.find(s => s.key === tr.stage) || {}).label)}</span>` : ""}</div>
      ${open && !wide ? jobDetail(j, tr, myApplied.has(j.key)) + warn : ""}
    </article>`;
  }).join("") + (list.length > jobsUI.limit ? `<button class="btn" type="button" id="jbMore">Show more (${list.length - jobsUI.limit} left)</button>` : "");
  const openJ = wide ? list.find(j => (j.key || j.id) === jobsUI.open) : null;
  if (openJ) {
    const k = openJ.key || openJ.id;
    box.innerHTML = `<div class="jb-split"><div class="jb-split-list">${cardsHtml}</div><aside class="jb-split-detail" data-job="${esc(k)}" aria-label="Job details"><div class="jb-dh"><div><h2>${openJ.brand ? emLogo(openJ.brand, "sm") : ""}${esc(openJ.title)}${openJ.promo ? ' <span class="emp-promo-tag">Promoted</span>' : ""}</h2><p>${esc(openJ.company || "")}${openJ.location ? ` · ${esc(openJ.location)}` : ""}</p><p class="job-meta">${[openJ.workType, openJ.remote, openJ.salary].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}${openJ.posted ? `<span>Posted ${fmtDay(openJ.posted)}</span>` : ""}</p></div>${(t => `<button class="jb-bm${t ? " on" : ""}" type="button" data-jb="bookmark" aria-pressed="${!!t}" aria-label="${t ? "Saved to your Application tracker. Press to remove it" : "Save to your Application tracker"}" title="${t ? "Saved" : "Save to Application tracker"}"><svg viewBox="0 0 24 24" width="20" height="20" fill="${t ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1z"/></svg></button>`)(tracked(openJ))}</div>${jobDetail(openJ, tracked(openJ), myApplied.has(openJ.key), true)}${warn}</aside></div>`;
  } else box.innerHTML = cardsHtml || `<p class="empty">${jobsUI.by === "strong" ? "No strong matches yet. Add your skills in the resume builder, or scan your resume, and the jobs you're a strong fit for show up here." : "No jobs match those filters."}</p>`;
  renderInvites();
}
function jobDetail(j, tr, applied, split) {
  const m = j.m, cl = j.sourceType === "site" ? null : careerLink(j), dupe = cl && cl.exact && cl.url === safeUrl(j.url);
  return `<div class="job-detail">
    ${m ? `<div class="job-skills">${m.have.length ? `<span class="small">You have:</span>${m.have.map(s => `<span class="chip found">${esc(s)}</span>`).join("")}` : ""}${m.missing.length ? `<span class="small">You're missing:</span>${m.missing.map(s => `<span class="chip missing">${esc(s)}</span>`).join("")}` : ""}</div>` : ""}
    ${j.sellingPoints && j.sellingPoints.length ? `<ul class="emp-sp">${j.sellingPoints.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    <p class="job-desc">${esc(j.description || "No description.")}</p>
    ${j.brand && j.brand.about ? `<p class="small job-about"><b>About ${esc(j.company)}.</b> ${esc(j.brand.about)}</p>` : ""}
    ${j.requirements && j.requirements.length ? `<ul class="small">${j.requirements.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
    ${j.also.length ? `<p class="small muted">Also listed on: ${j.also.map(a => a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.source)}</a>` : esc(a.source)).join(", ")}. Shown once here.</p>` : ""}
    ${j.example ? `<p class="small muted">This is a made-up example listing.</p>` : ""}
    <div class="b-actions">
      ${j.sourceType === "site" ? (applied ? `<span class="chip found">You've applied</span>` : `<button class="btn primary" type="button" data-jb="apply">Apply on Job Finder</button>`) : j.url && !j.example ? `<a class="btn primary" href="${esc(j.url)}" target="_blank" rel="noopener" data-jb="ext">Apply on ${esc(j.source)} ↗</a>` : ""}
      ${cl && !dupe ? `<a class="btn${j.url && !j.example ? "" : " primary"}" href="${esc(cl.url)}" target="_blank" rel="noopener"${cl.exact ? ' data-jb="ext"' : ""}>${cl.exact ? "Apply on career page ↗" : "Find their careers page ↗"}</a>` : ""}
      <button class="btn" type="button" data-jb="tailor">Tailor my resume to it</button>
      ${tr ? `<a class="btn" href="#tracker">In Application tracker: ${esc((STAGES_T.find(s => s.key === tr.stage) || {}).label)}</a>` : split ? "" : `<button class="btn" type="button" data-jb="save">Save to Application tracker</button>`}
    </div>
    ${jobsUI.applyFor === (j.key || j.id) ? applyForm(j) : ""}
  </div>`;
}
function talentFromProfile() {
  const p = P();
  return { name: p.contact.name, headline: p.target.title || (p.experience[0] || {}).title || "", location: p.contact.location, summary: p.summary.slice(0, 600), skills: [...new Set([...p.skills.hard, ...p.skills.software, ...p.skills.certs])].slice(0, 30), titles: p.experience.filter(e => e.title).slice(0, 4).map(e => `${e.title}${e.org ? ` at ${e.org}` : ""}`), education: p.education.filter(e => e.degree).slice(0, 2).map(e => `${e.degree}${e.inst ? `, ${e.inst}` : ""}${e.current ? " (studying)" : ""}`), workRights: p.contact.workRights, stage: p.target.stage, jobType: p.target.jobType };
}
const apQ = (q, i) => {
  const n = "apq-" + q.id, lab = `<span class="ap-q-t">${i + 1}. ${esc(q.text)}</span>`;
  if (q.type === "yes") return `<fieldset class="ap-q"><legend>${lab}</legend><label class="q-check"><input type="radio" name="${n}" value="Yes"> Yes</label><label class="q-check"><input type="radio" name="${n}" value="No"> No</label></fieldset>`;
  if (q.type === "choice") return `<label class="field ap-q">${lab}<select name="${n}"><option value="">Choose one…</option>${(q.options || []).map(o => `<option>${esc(o)}</option>`).join("")}</select></label>`;
  if (q.type === "number") return `<label class="field ap-q">${lab}<input type="number" name="${n}" min="0" step="any" inputmode="decimal"></label>`;
  return `<label class="field ap-q">${lab}<textarea name="${n}" rows="3" maxlength="800"></textarea></label>`;
};
function applyForm(j) {
  const t = market.talent.find(x => x.uid === market.uid);
  const local = j.employerUid === EM_LOCAL_ID;
  return `<form class="apply-form" data-apply="${esc(j.key)}"><h3>Apply for ${esc(j.title)}</h3>
    ${!t ? `<p class="small">Applying shares your Job Finder profile with ${esc(j.company)}: ${esc([talentFromProfile().name, talentFromProfile().headline].filter(Boolean).join(", ") || "add your details in the resume builder first")}.</p>` : ""}
    <label class="field" for="apNote">A short note to the employer <span class="muted">(optional)</span><textarea id="apNote" rows="3" placeholder="Why you're interested, in two or three sentences"></textarea></label>
    ${(j.questions || []).length ? `<fieldset class="ap-qs" data-nohelp><legend>Questions from ${esc(j.company)}</legend>${j.questions.map(apQ).join("")}</fieldset>` : ""}
    <label class="q-check"><input type="checkbox" id="apResume" checked> Include my resume from the resume builder</label>
    <p class="small muted">${local ? "This ad was posted from this browser, so your application is saved here, for the employer view on this browser." : "On this prototype, applications are stored where other people using this Job Finder could technically read them. Don't include anything you wouldn't put on a resume."}</p>
    <div class="b-actions"><button class="btn primary" type="submit">Send my application</button><button class="btn ghost" type="button" data-jb="cancel">Cancel</button></div>${statusHTML("apStatus", "status-line", "p")}</form>`;
}
async function submitApplication(form, j) {
  const local = j.employerUid === EM_LOCAL_ID;
  if (!local && !canPost()) { say("apStatus", shareNote(), true); return; }
  const p = P();
  if (!hasProfile(p)) { say("apStatus", "Add your details in the resume builder first, so the employer can see who you are.", true); return; }
  // the employer's questions: every one needs an answer
  const answers = [];
  for (const q of j.questions || []) {
    const els = form.querySelectorAll('[name="apq-' + q.id + '"]');
    const v = q.type === "yes" ? ((form.querySelector('[name="apq-' + q.id + '"]:checked') || {}).value || "") : String((els[0] && els[0].value) || "").trim();
    if (!v) { say("apStatus", "Answer every question from " + j.company + " first: “" + q.text.slice(0, 70) + (q.text.length > 70 ? "…" : "") + "”", true); if (els[0]) els[0].focus(); return; }
    answers.push({ qid: q.id, q: q.text, a: v });
  }
  if (local) {
    const rest = (hiring.data.localApps || []).filter(a => a.jobId !== j.id);
    rest.push({ candidate: EM_LOCAL_ID, name: p.contact.name, jobId: j.id, title: j.title, company: j.company, note: $("apNote").value.trim().slice(0, 1200), resume: $("apResume").checked ? profileToText(p).slice(0, 12000) : "", applied: new Date().toISOString(), answers, profile: talentFromProfile() });
    hiring.data.localApps = rest.slice(-60); hiring.save(true);
    trackJob({ title: j.title, company: j.company, location: j.location, jd: j.description, source: "Job Finder" }, "applied");
    jobsUI.applyFor = null; toast("Application sent. It's saved in this browser, for the employer view."); renderJobs(); emNavBadge();
    return;
  }
  const doc = market.db.doc("apps/" + market.uid);
  const cur = market.myApps || { items: [], employerIds: [] };
  const item = { jobKey: j.key, employerId: j.employerUid, jobId: j.id, title: j.title, company: j.company, note: $("apNote").value.trim().slice(0, 1200), resume: $("apResume").checked ? profileToText(p).slice(0, 12000) : "", applied: new Date().toISOString(), answers };
  const items = [...cur.items.filter(i => i.jobKey !== j.key), item].slice(-40);
  const body = { name: p.contact.name, items, employerIds: [...new Set(items.map(i => i.employerId))], updated: new Date().toISOString() };
  say("apStatus", "Sending…");
  if (await safeWrite(() => doc.set(body), "apStatus")) {
    market.myApps = body;
    await safeWrite(() => market.db.doc("talent/" + market.uid).set({ ...talentFromProfile(), visible: (market.talent.find(x => x.uid === market.uid) || {}).visible !== false, updated: new Date().toISOString() }), "apStatus");
    trackJob({ title: j.title, company: j.company, location: j.location, jd: j.description, source: "Job Finder" }, "applied");
    jobsUI.applyFor = null;
    renderJobs();
  }
}
function renderInvites() {
  const box = $("jbInvites"); if (!box) return;
  const inv = [...market.invites, ...((hiring.data.localOutbox || {}).invites || []).filter(i => i.to === EM_LOCAL_ID).map(i => ({ ...i, from: EM_LOCAL_ID }))].sort((a, b) => String(b.sent || "").localeCompare(String(a.sent || "")));
  box.hidden = !inv.length;
  box.innerHTML = inv.length ? `<h2>Messages and invitations</h2><ul class="inv-list">${inv.map(i => `<li><p><b>${esc(i.company || "An employer")}</b> ${i.kind === "message" ? "sent you a message about" : "invited you to apply for"} <b>${esc(i.title || "a job")}</b>.</p>${i.message ? `<p class="small inv-msg">${esc(i.message)}</p>` : ""}${i.kind === "message" ? "" : `<button class="btn" type="button" data-inv="${esc(i.from + ":" + i.jobId)}">View the job</button>`}</li>`).join("")}</ul>` : "";
}

/* --- Employer: company profile, job ads, candidates, applicants --- */
const JOBAD_NANO = `You write clear, inclusive Australian job ads from an employer's notes.
Rules:
1. Use only what the notes say. Never invent pay, benefits, requirements, locations or company facts.
2. Plain English, second person ("you will"), Australian spelling.
3. Keep "must have" to the essentials in the notes (no more than 6). Put anything optional in "nice to have".
4. Avoid words that put groups off: "young", "digital native", "rockstar", "ninja", "aggressive", "native English speaker".
Reply with JSON only.`;
const JOBAD_SCHEMA = { type: "object", properties: { summary: { type: "string" }, duties: { type: "array", items: { type: "string" } }, musts: { type: "array", items: { type: "string" } }, nices: { type: "array", items: { type: "string" } }, offer: { type: "array", items: { type: "string" } } }, required: ["summary", "duties", "musts", "nices", "offer"] };
const MASC = ["aggressive", "ambitious", "assertive", "autonomous", "competitive", "confident", "decisive", "determined", "dominant", "driven", "fearless", "headstrong", "independent", "outspoken", "self-reliant", "superior", "ninja", "rockstar", "guru", "crush", "dominate"];
const FEMI = ["collaborative", "committed", "compassionate", "considerate", "cooperative", "empathetic", "interpersonal", "nurturing", "supportive", "sympathetic", "understanding", "warm", "loyal", "kind"];
function checkAd(job) {
  const text = [job.title, job.summary, ...(job.duties || []), ...(job.musts || []), ...(job.nices || []), ...(job.offer || [])].join(" \n ");
  const words = (re, list) => list.filter(w => new RegExp("\\b" + w.replace("-", "[- ]?") + "\\w*", "i").test(re));
  const masc = words(text, MASC), femi = words(text, FEMI);
  const out = [];
  if (!job.salary) out.push(["warn", "Add a pay range. Ads with pay get more applications, and candidates can see straight away if it fits."]);
  const age = text.match(/\b(young|youthful|digital natives?|recent graduates? only|energetic|fresh blood|mature)\b/i);
  if (age) out.push(["bad", `“${age[0]}” can discourage applicants by age and may breach anti-discrimination law. Describe the skills you need instead.`]);
  if (/native (english )?speaker/i.test(text)) out.push(["bad", "“Native speaker” excludes people by origin. Ask for “fluent English” instead."]);
  if (masc.length >= 3 && masc.length > femi.length + 1) out.push(["warn", `Words like ${masc.slice(0, 4).map(w => `“${w}”`).join(", ")} lean masculine and can put some applicants off. Balance them, for example “collaborative” or “supportive”.`]);
  if ((job.musts || []).length > 7) out.push(["warn", `${job.musts.length} must-haves is a lot. Many good candidates only apply when they meet every one, so keep the essentials and move the rest to “nice to have”.`]);
  const wc = wordCount(text);
  if (wc > 700) out.push(["warn", `It's ${wc} words. Ads under about 500 words are easier to read on a phone.`]);
  if (wc < 80) out.push(["warn", "It's short. Say what the person will do day to day and what you offer."]);
  if (!job.location) out.push(["warn", "Add a location, or say it's remote."]);
  if (!out.length) out.push(["ok", "Clear and inclusive. Nothing to fix."]);
  return out;
}
const emptyJobAd = () => ({ id: uid8(), title: "", location: "", workType: "Full time", remote: "On-site", salary: "", summary: "", duties: [], musts: [], nices: [], offer: [], skills: [], closes: "", status: "open", posted: todayISO(), notes: "" });
const jobAdText = j => [j.summary, j.duties.length ? "What you'll do:\n" + j.duties.map(x => "- " + x).join("\n") : "", j.musts.length ? "What you'll need:\n" + j.musts.map(x => "- " + x).join("\n") : "", j.nices.length ? "Nice to have:\n" + j.nices.map(x => "- " + x).join("\n") : "", j.offer.length ? "What we offer:\n" + j.offer.map(x => "- " + x).join("\n") : ""].filter(Boolean).join("\n\n");
// the skills an ad asks for (not what it offers)
const adSkills = j => [...skillSet([j.title, j.summary, ...(j.duties || []), ...(j.musts || []), ...(j.nices || [])].join("\n"))];
// How well a person fits an ad, 0 to 100: the ad's hard skills (full marks for covering half of them, or three), the words of the job title,
// the place, and the kind of work they want. Soft skills only count when the ad names nothing else.
let EM_STOP = null;
const emTitleStems = t => { EM_STOP = EM_STOP || new Set("and the for with senior junior mid level assistant team member officer".split(" ")); return new Set(String(t || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2 && !EM_STOP.has(w)).map(w => w.slice(0, 6))); };
function candidateMatch(c, job) {
  const all = adSkills(job), isHard = s => (SKILLS.find(k => k.name === s) || {}).kind === "hard";
  const hard = all.filter(isHard), want = hard.length >= 2 ? hard : all;
  const have = new Set([...skillSet([c.headline, c.summary, (c.skills || []).join(", "), (c.titles || []).join("; ")].join("\n"))]);
  const hit = want.filter(s => have.has(s));
  const skillPart = want.length ? 60 * Math.min(1, hit.length / Math.max(3, want.length * 0.5)) : 30;
  const ad = emTitleStems(job.title), cand = emTitleStems([c.headline, ...(c.titles || [])].join(" "));
  const overlap = ad.size ? [...ad].filter(w => cand.has(w)).length / ad.size : 0;
  const titlePart = 25 * Math.min(1, overlap / 0.6);
  const locPart = job.remote === "Remote" || !job.location || !c.location || DEDUP.place(job.location) === DEDUP.place(c.location) ? 10 : 0;
  const typePart = c.jobType && job.workType && c.jobType === job.workType ? 5 : 0;
  return { pct: Math.min(100, Math.round(skillPart + titlePart + locPart + typePart)), hit, missing: want.filter(s => !have.has(s)) };
}
async function saveEmployer(employer, jobs, st) {
  if (!canPost()) { say(st, shareNote(), true); return false; }
  const body = { employer, jobs: jobs.slice(0, 30).map(j => ({ ...j, summary: String(j.summary || "").slice(0, 3000) })), updated: new Date().toISOString() };
  const ok = await safeWrite(() => market.db.doc("jobs/" + market.uid).set(body), st);
  if (ok) { market.myJobs = { uid: market.uid, ...body }; const i = market.employers.findIndex(e => e.uid === market.uid); if (i >= 0) market.employers[i] = market.myJobs; else market.employers.push(market.myJobs); }
  return ok;
}
onInit(() => {
  $("jbEduLevel").insertAdjacentHTML("beforeend", Object.keys(EDU_LEVELS).map(k => `<option>${k}</option>`).join(""));
  $("jbEduType").insertAdjacentHTML("beforeend", Object.keys(EDU_TYPES).map(k => `<option>${k}</option>`).join(""));
  trk.on(jbBell); jbBell();
  // "Searching by": three buttons, like a tab bar (no wheel). Arrow keys move between them.
  const seg = $("jbBySeg");
  if (seg) seg.addEventListener("keydown", e => {
    const keys = Object.keys(JB_MODES), i = keys.indexOf(jobsUI.by);
    const n = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : null;
    if (n === null) return;
    e.preventDefault(); jbSetMode(keys[Math.max(0, Math.min(keys.length - 1, n))]);
    const b = seg.querySelector('[aria-checked="true"]'); if (b) b.focus();
  });
  // pay: a drop-down with a From wheel and a To wheel
  const payBtn = $("jbPayBtn"), payPop = $("jbPayPop");
  const showPay = on => { payPop.hidden = !on; payBtn.setAttribute("aria-expanded", String(on)); if (on) jbPaySync(); };
  document.querySelectorAll("#jbPay .jb-wheel").forEach(w => {
    const t = w.querySelector(".jb-roller-track"), key = w.dataset.w;
    t.innerHTML = PAY_ITEMS.map(v => `<button type="button" class="jb-wo" role="option" tabindex="-1" aria-selected="false">${v ? fmtPayStep(v) : key === "payMin" ? "No minimum" : "No maximum"}</button>`).join("");
    let st = 0, raf = 0;
    t.addEventListener("scroll", () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; jbPaintWheel(t); });
      clearTimeout(st); st = setTimeout(() => { if (!jbDragging(t) && !payPop.hidden) jbSetPay(key, PAY_ITEMS[Math.max(0, Math.min(PAY_ITEMS.length - 1, Math.round(t.scrollTop / RO_H)))]); }, 140);
    }, { passive: true });
    t.addEventListener("click", e => { const b = e.target.closest(".jb-wo"); if (b) t.scrollTo({ top: [...t.children].indexOf(b) * RO_H, behavior: reduceMotion() ? "auto" : "smooth" }); });
    jbDragWheel(t);
  });
  payBtn.addEventListener("click", () => showPay(payPop.hidden));
  $("jbPayDone").addEventListener("click", () => { showPay(false); payBtn.focus(); });
  $("jbPayClear").addEventListener("click", () => { jobsUI.payMin = ""; jobsUI.payMax = ""; jobsUI.limit = 40; renderJobs(); });
  $("jbPay").addEventListener("keydown", e => { if (e.key === "Escape" && !payPop.hidden) { e.preventDefault(); showPay(false); payBtn.focus(); } });
  document.addEventListener("click", e => { if (!payPop.hidden && !e.target.closest("#jbPay")) showPay(false); });
  // the Find jobs button (Enter in a search box does the same)
  const findJobs = () => {
    clearTimeout(jobsUI.t); jobsUI.limit = 40;
    if (jobsUI.q.trim()) jbRemember(jobsUI.q);
    const a = document.activeElement; if (a && (a.id === "jbQ" || a.id === "jbWhere") && a.blur) a.blur();
    renderJobs();
    const bar = document.querySelector("#view-jobs .jb-listbar"); if (bar) bar.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  };
  $("jbFind").addEventListener("click", findJobs);
  for (const id of ["jbQ", "jbWhere"]) $(id).addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); findJobs(); } });
  $("view-jobs").addEventListener("input", e => { const f = e.target.dataset.jbf; if (f) { jobsUI[f] = e.target.value; jobsUI.limit = 40; clearTimeout(jobsUI.t); jobsUI.t = setTimeout(renderJobs, 150); if (f === "q") { clearTimeout(jobsUI.t3); jobsUI.t3 = setTimeout(() => jbRemember(jobsUI.q), 1800); } } });
  $("view-jobs").addEventListener("change", e => { const f = e.target.dataset.jbf; if (f) { jobsUI[f] = e.target.value; renderJobs(); } });
  $("view-jobs").addEventListener("click", async e => {
    if (e.target.closest("[data-edu-fill]")) { const s = jbEduFromMe(); if (s) { jobsUI.eduLevel = s.level; jobsUI.eduType = s.type; jobsUI.limit = 40; renderJobs(); } return; }
    const ro = e.target.closest(".jb-segb");
    if (ro) { jbSetMode(ro.dataset.by); return; }
    const sg = e.target.closest("[data-sg]");
    if (sg) { const v = sg.dataset.sg; jobsUI.q = jobsUI.q.toLowerCase() === v.toLowerCase() ? "" : v; if (jobsUI.by === "education") jobsUI.by = "title"; if (jobsUI.q) jbRemember(jobsUI.q); $("jbQ").value = jobsUI.q; jobsUI.limit = 40; renderJobs(); return; }
    const clr = e.target.closest("[data-clear]");
    if (clr) { const k = clr.dataset.clear; if (k === "all") Object.assign(jobsUI, { q: "", eduLevel: "", eduType: "", where: "", type: "", remote: "", source: "", payMin: "", payMax: "" }); else jobsUI[k] = ""; jobsUI.limit = 40; renderJobs(); return; }
    const inv = e.target.closest("[data-inv]");
    if (inv) { jobsUI.open = inv.dataset.inv; jobsUI.source = ""; renderJobs(); const el = document.querySelector(`[data-job="${CSS.escape(inv.dataset.inv)}"]`); if (el) el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); return; }
    if (e.target.closest("#jbMore")) { jobsUI.limit += 40; renderJobs(); return; }
    if (e.target.closest("#jbAddBtn")) { const f = $("jbAdd"); f.hidden = !f.hidden; if (!f.hidden) $("jbAddText").focus(); return; }
    if (e.target.closest("#jbAddSave")) {
      const text = $("jbAddText").value.trim(), url = $("jbAddUrl").value.trim();
      if (wordCount(text) < 15) { say("jbAddStatus", "Paste the whole ad, so we can read the title, company and skills.", true); return; }
      const it = trackJob({ title: detectTitle(text, "") || "Job from an ad", company: companyFrom(text), jd: text, url, source: url ? (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Saved by you"; } })() : "Saved by you" }, "saved");
      $("jbAddText").value = ""; $("jbAddUrl").value = ""; $("jbAdd").hidden = true;
      jobsUI.open = "t" + it.id; renderJobs();
      return;
    }
    const b = e.target.closest("[data-jb]"); if (!b) return;
    const card = b.closest("[data-job]"), key = card && card.dataset.job;
    const j = allJobs().find(x => (x.key || x.id) === key);
    const a = b.dataset.jb;
    if (a === "open") { jobsUI.open = jobsUI.open === key ? null : key; jobsUI.applyFor = null; renderJobs(); const c = document.querySelector(`[data-job="${CSS.escape(key)}"] .job-main`); if (c) c.focus(); return; }
    if (!j) return;
    if (a === "save") { trackJob({ title: j.title, company: j.company, location: j.location, url: j.url, jd: j.description, source: j.source }, "saved"); renderJobs(); }
    else if (a === "tailor") { els.jd.value = [j.title, j.company + (j.location ? " – " + j.location : ""), "", j.description].join("\n"); els.title.value = j.title; updateCounts(); updateFlow(); openView("scanner"); setTimeout(() => goTo(els.resume.value.trim() ? "scanRow" : "step-resume"), 80); }
    else if (a === "ext") trackJob({ title: j.title, company: j.company, location: j.location, url: j.url, jd: j.description, source: j.source }, "applied");
    else if (a === "apply") { jobsUI.applyFor = key; renderJobs(); const f = document.querySelector(".apply-form textarea"); if (f) f.focus(); }
    else if (a === "cancel") { jobsUI.applyFor = null; renderJobs(); }
    else if (a === "bookmark") {
      const tr = jobTracked(j);
      if (!tr) { trackJob({ title: j.title, company: j.company, location: j.location, url: j.url, jd: j.description, source: j.source }, "saved"); toast("Saved to your Application tracker."); }
      else if (tr.stage === "saved") { trk.data.items = T().filter(x => x !== tr); trk.save(); jbBell(); toast("Removed from your saved jobs."); }
      else toast(`It's in your Application tracker as ${(STAGES_T.find(s => s.key === tr.stage) || { label: tr.stage }).label.toLowerCase()}. Change it there.`, "warn");
      renderJobs();
    }
  });
  $("view-jobs").addEventListener("submit", e => { const f = e.target.closest("[data-apply]"); if (!f) return; e.preventDefault(); const j = allJobs().find(x => x.key === f.dataset.apply); if (j) submitApplication(f, j); });
  viewHooks.jobs = () => { renderJobs(); startMarket().then(() => { if (currentView === "jobs") renderJobs(); }); };
  // invitations show on Home too
  memoryReady.then(() => setTimeout(startMarket, 1500));
});

