/* ===================== Your details: one profile shared by the Resume creator, CV templates and interview prep ===================== */
const PROFILE_KEY = "jobfinder.profile.v1";
// The kinds of work people choose from: the industries Australian job sites use, plus graduate programs.
// fam: the broader groups the designs and tips were written for (see jobFam).
const JOB_TYPES = [
  { key: "graduate", label: "Graduate program or internship", formality: 4, fam: ["graduate"] },
  { key: "accounting", label: "Accounting", formality: 5, fam: ["corporate"] },
  { key: "admin", label: "Administration and office support", formality: 3, fam: ["corporate", "graduate"] },
  { key: "media", label: "Advertising, arts and media", formality: 2, fam: ["creative"] },
  { key: "banking", label: "Banking and financial services", formality: 5, fam: ["corporate"] },
  { key: "callcentre", label: "Call centre and customer service", formality: 2, fam: ["hospitality"] },
  { key: "community", label: "Community services and aged care", formality: 3, fam: ["health"] },
  { key: "construction", label: "Construction", formality: 2, fam: ["trades", "engineering"] },
  { key: "consulting", label: "Consulting and strategy", formality: 5, fam: ["corporate"] },
  { key: "design", label: "Design and architecture", formality: 2, fam: ["creative"] },
  { key: "education", label: "Education and childcare", formality: 4, fam: ["health", "academic"] },
  { key: "engineering", label: "Engineering", formality: 4, fam: ["engineering"] },
  { key: "agriculture", label: "Farming, animals and conservation", formality: 2, fam: ["trades"] },
  { key: "government", label: "Government and defence", formality: 5, fam: ["government"] },
  { key: "health", label: "Healthcare and medical", formality: 4, fam: ["health"] },
  { key: "hospitality", label: "Hospitality and tourism", formality: 1, fam: ["hospitality"] },
  { key: "hr", label: "Human resources and recruitment", formality: 4, fam: ["corporate"] },
  { key: "tech", label: "IT, software and data", formality: 3, fam: ["tech"] },
  { key: "insurance", label: "Insurance and superannuation", formality: 5, fam: ["corporate"] },
  { key: "legal", label: "Legal", formality: 5, fam: ["corporate"] },
  { key: "management", label: "Management and executive", formality: 5, fam: ["corporate"] },
  { key: "logistics", label: "Manufacturing, transport and logistics", formality: 2, fam: ["trades"] },
  { key: "marketing", label: "Marketing and communications", formality: 3, fam: ["creative"] },
  { key: "mining", label: "Mining, resources and energy", formality: 3, fam: ["trades", "engineering"] },
  { key: "property", label: "Real estate and property", formality: 3, fam: ["corporate"] },
  { key: "retail", label: "Retail and consumer products", formality: 1, fam: ["hospitality"] },
  { key: "sales", label: "Sales", formality: 3, fam: ["corporate"] },
  { key: "science", label: "Science and laboratory", formality: 4, fam: ["academic", "engineering"] },
  { key: "sport", label: "Sport, fitness and recreation", formality: 2, fam: ["hospitality"] },
  { key: "trades", label: "Trades and services", formality: 2, fam: ["trades"] },
  { key: "academic", label: "Academic and research", formality: 5, fam: ["academic"] }
];
// Choices saved by older versions
const OLD_JOB_TYPES = { corporate: "banking", creative: "marketing" };
const jobTypeOf = k => JOB_TYPES.find(j => j.key === (OLD_JOB_TYPES[k] || k)) || null;
const jobLabel = k => (jobTypeOf(k) || {}).label || "";
// A job type and the broader groups behind it ("retail" → retail, hospitality)
const jobFam = k => { const j = jobTypeOf(k); return j ? [j.key, ...j.fam] : k ? [k] : []; };
const fitsJob = (t, k) => jobFam(k).some(f => t.jobTypes.includes(f));
const STAGES = [
  { key: "student", label: "Student or recent graduate" },
  { key: "early", label: "Early career (1 to 5 years)" },
  { key: "experienced", label: "Experienced (5+ years)" },
  { key: "change", label: "Changing careers" },
  { key: "returning", label: "Returning to work" }
];
const WORK_RIGHTS = ["", "Australian citizen", "Permanent resident", "Full working rights", "Student visa (limited hours)", "Graduate visa (full working rights)", "Working holiday visa"];
const EXTRA_KEYS = [
  ["projects", "Projects"], ["volunteering", "Volunteering"], ["awards", "Awards and achievements"],
  ["publications", "Publications"], ["interests", "Interests"], ["availability", "Availability"], ["referees", "Referees"]
];
// hidden: kept in your profile but left off this resume. polished: the bullets as they were last polished.
const emptyExp = () => ({ title: "", org: "", location: "", start: "", end: "", current: false, answers: { duties: "", wins: "", tools: "", people: "" }, bullets: [], done: false, hidden: false, hideWhy: "", polished: "" });
const emptyEdu = () => ({ degree: "", level: "", subject: "", double: false, level2: "", subject2: "", inst: "", location: "", start: "", end: "", current: false, grade: "", gradeType: "", awards: "", coursework: "", project: "", done: false, hidden: false, hideWhy: "", polished: "" });
const emptyProj = () => ({ name: "", org: "", start: "", end: "", current: false, details: "", done: false, hidden: false, hideWhy: "", polished: "" });
const emptyRef = () => ({ name: "", role: "", org: "", phone: "", email: "", done: false, polished: "" });
const emptyProfile = () => ({
  v: 2,
  // ad and company: filled when the resume is for one particular job
  target: { title: "", jobType: "", stage: "", specific: false, ad: "", company: "" },
  contact: { name: "", first: "", last: "", phone: "", phoneCode: "+61", phoneIso: "AU", email: "", location: "", linkedin: "", website: "", workRights: "", licence: "" },
  summaryQ: { who: "", strengths: "", proof: "", next: "" },
  summary: "", summaryOk: false,
  experience: [],
  education: [],
  skills: { hard: [], software: [], soft: [], languages: [], certs: [] },
  projects: [], volunteering: [], awards: "", publications: "", interests: "", availability: "", startWhen: "",
  referees: { mode: "request", list: [] },
  extras: { projects: false, volunteering: false, awards: false, publications: false, interests: false, availability: false, referees: true },
  // the short text sections that have been finished (awards, publications, interests)
  extrasDone: { awards: false, publications: false, interests: false },
  // order: the sections in the order the person arranged them. hideSections / hideLines: left off this version of the resume (kept in the profile).
  // hideWhy: "key||reason" lines saying why Job Finder hid something to fit the page.
  cv: { template: "", accent: "", letterTemplate: "", letterAccent: "", jobType: "", formality: 0, order: [], hideSections: [], hideLines: [], hideWhy: [] },
  prefs: { dateStyle: "words", onePage: false, spacing: "normal", margins: "normal", lang: "en-AU", letterSpacing: "normal", letterMargins: "normal", letterMatch: true },
  updated: ""
});

/* --- Names: first and last, joined for the resume --- */
const SURNAME_PARTICLES = new Set(["van", "von", "de", "da", "di", "du", "la", "le", "der", "den", "bin", "binti", "al", "el", "dos", "del", "ten", "ter"]);
function splitName(full) {
  const w = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (w.length < 2) return [w[0] || "", ""];
  let k = w.length - 1;
  while (k > 1 && SURNAME_PARTICLES.has(w[k - 1].toLowerCase())) k--;
  return [w.slice(0, k).join(" "), w.slice(k).join(" ")];
}
const joinName = c => [val(c.first), val(c.last)].filter(Boolean).join(" ");
// The full name follows the first and last names; a full name saved on its own is split once
function syncName(c) {
  if (val(c.first) || val(c.last)) c.name = joinName(c);
  else if (val(c.name)) [c.first, c.last] = splitName(c.name);
}

/* --- Qualifications: a level ("Bachelor with Honours") and a subject ("Engineering (Mechanical)"), joined on the resume --- */
// Honours goes before any specialisation in brackets: Bachelor of Engineering (Honours) (Mechanical)
const honoursName = s => { const t = val(s); if (!t) return "Bachelor (Honours)"; const i = t.indexOf(" ("); return i > 0 ? `Bachelor of ${t.slice(0, i)} (Honours)${t.slice(i)}` : `Bachelor of ${t} (Honours)`; };
const QUAL_LEVELS = [
  { k: "y10", label: "Year 10", join: s => s ? `Year 10 (${s})` : "Year 10", re: /^Year\s*10\b\s*(?:\((.*)\))?\s*$/i, ph: "Optional, e.g. the school certificate's name", school: true },
  { k: "y12", label: "Year 12", join: s => s ? `Year 12 (${s})` : "Year 12", re: /^Year\s*12\b\s*(?:\((.*)\))?\s*$/i, ph: "e.g. HSC, VCE, QCE, WACE or SACE", school: true },
  { k: "c1", label: "Certificate I", join: s => `Certificate I in ${s}`, re: /^Certificate I\s+in\s+(.+)$/i, vet: true },
  { k: "c2", label: "Certificate II", join: s => `Certificate II in ${s}`, re: /^Certificate II\s+in\s+(.+)$/i, vet: true },
  { k: "c3", label: "Certificate III", join: s => `Certificate III in ${s}`, re: /^Certificate III\s+in\s+(.+)$/i, vet: true },
  { k: "c4", label: "Certificate IV", join: s => `Certificate IV in ${s}`, re: /^Certificate IV\s+in\s+(.+)$/i, vet: true },
  { k: "dip", label: "Diploma", join: s => `Diploma of ${s}`, re: /^Diploma\s+of\s+(.+)$/i, vet: true },
  { k: "adip", label: "Advanced Diploma", join: s => `Advanced Diploma of ${s}`, re: /^Advanced Diploma\s+of\s+(.+)$/i, vet: true },
  { k: "assoc", label: "Associate Degree", join: s => `Associate Degree in ${s}`, re: /^Associate Degree\s+(?:in|of)\s+(.+)$/i },
  { k: "hons", label: "Bachelor with Honours", join: honoursName, re: /^Bachelor\s+of\s+(.+?)\s*\((?:Hons|Honours)\)\s*(.*)$/i },
  { k: "bach", label: "Bachelor", join: s => `Bachelor of ${s}`, re: /^Bachelor\s+of\s+(.+)$/i },
  { k: "gcert", label: "Graduate Certificate", join: s => `Graduate Certificate in ${s}`, re: /^Graduate Certificate\s+(?:in|of)\s+(.+)$/i },
  { k: "gdip", label: "Graduate Diploma", join: s => `Graduate Diploma of ${s}`, re: /^Graduate Diploma\s+(?:in|of)\s+(.+)$/i },
  { k: "master", label: "Master", join: s => `Master of ${s}`, re: /^Master\s+of\s+(.+)$/i },
  { k: "phd", label: "Doctorate (PhD)", join: s => s ? `Doctor of Philosophy (${s})` : "Doctor of Philosophy", re: /^(?:Doctor of Philosophy|PhD)\b\s*(?:\((.+)\)|in\s+(.+))?\s*$/i },
  { k: "short", label: "Short course", join: s => s, re: null, ph: "e.g. Introduction to Python (Coursera)" },
  { k: "other", label: "Other", join: s => s, re: null, ph: "The full name of the qualification" }
];
const qualLevel = k => QUAL_LEVELS.find(q => q.k === k) || null;
const qualName = (level, subject) => { const q = qualLevel(level), s = val(subject); return q ? (s || q.school || q.k === "phd" ? q.join(s) : "") : s; };
// "Bachelor of Engineering (Honours) (Mechanical)" → ["hons", "Engineering (Mechanical)"]
const qualKey = s => String(s || "").toLowerCase().replace(/\bhons\b/g, "honours").replace(/[^a-z0-9]+/g, "");
function splitQual(d) {
  const t = val(d);
  if (!t) return ["", ""];
  for (const q of QUAL_LEVELS) {
    if (!q.re) continue;
    const m = t.match(q.re);
    if (!m) continue;
    const s = [m[1], m[2]].filter(x => val(x)).join(" ").trim();
    // only split it if joining the parts gives the same name back
    return qualKey(qualName(q.k, s)) === qualKey(t) ? [q.k, s] : ["other", t];
  }
  return ["other", t];
}
// Level and subject from the full name when only that is known; the full name from them otherwise
// A double degree is two qualifications studied together, written "Bachelor of Engineering (Honours) / Bachelor of Commerce"
const DOUBLE_SPLIT = /\s*\/\s*(?=(?:Bachelor|Master|Diploma|Advanced Diploma|Graduate|Associate|Doctor|Certificate)\b)/i;
function syncQual(e) {
  if (e.double && (val(e.level) || val(e.subject) || val(e.level2) || val(e.subject2))) {
    e.degree = [qualName(e.level, e.subject), qualName(e.level2, e.subject2)].filter(Boolean).join(" / ");
    return;
  }
  if (val(e.level) || val(e.subject)) e.degree = qualName(e.level, e.subject);
  else if (val(e.degree)) {
    const parts = val(e.degree).split(DOUBLE_SPLIT);
    if (parts.length === 2) { [e.level, e.subject] = splitQual(parts[0]); [e.level2, e.subject2] = splitQual(parts[1]); e.double = true; e.degree = [qualName(e.level, e.subject), qualName(e.level2, e.subject2)].join(" / "); }
    else [e.level, e.subject] = splitQual(e.degree);
  }
}
const syncProfile = p => { syncName(p.contact); p.education.forEach(syncQual); };
// Saved data may be from an older version or partly filled: lay it over a clean profile
function mergeProfile(raw) {
  const base = emptyProfile();
  if (!raw || typeof raw !== "object") return base;
  const str = v => typeof v === "string" ? v : "";
  // entries saved before "Finish" existed count as finished
  const arr = (v, mk) => Array.isArray(v) ? v.filter(x => x && typeof x === "object").slice(0, 20).map(x => { const m = mergeObj(mk(), x); if ("done" in m && !("done" in x)) m.done = true; return m; }) : [];
  const strs = v => Array.isArray(v) ? v.map(String).map(s => s.trim()).filter(Boolean).slice(0, 60) : [];
  function mergeObj(b, o) {
    for (const k of Object.keys(b)) {
      if (!(k in o)) continue;
      if (typeof b[k] === "string") b[k] = str(o[k]);
      else if (typeof b[k] === "boolean") b[k] = !!o[k];
      else if (typeof b[k] === "number") b[k] = Number(o[k]) || 0;
      else if (Array.isArray(b[k])) b[k] = strs(o[k]);
      else if (b[k] && typeof b[k] === "object" && o[k] && typeof o[k] === "object") mergeObj(b[k], o[k]);
    }
    return b;
  }
  mergeObj(base.target, raw.target || {});
  mergeObj(base.contact, raw.contact || {});
  mergeObj(base.summaryQ, raw.summaryQ || {});
  base.summary = str(raw.summary);
  base.experience = arr(raw.experience, emptyExp);
  base.education = arr(raw.education, emptyEdu);
  mergeObj(base.skills, raw.skills || {});
  base.projects = arr(raw.projects, emptyProj);
  base.volunteering = arr(raw.volunteering, emptyExp);
  for (const k of ["awards", "publications", "interests", "availability", "startWhen"]) base[k] = str(raw[k]);
  base.summaryOk = !!raw.summaryOk;
  if (raw.referees && typeof raw.referees === "object") { base.referees.mode = raw.referees.mode === "list" ? "list" : "request"; base.referees.list = arr(raw.referees.list, emptyRef).slice(0, 5); }
  mergeObj(base.extras, raw.extras || {});
  mergeObj(base.extrasDone, raw.extrasDone || {});
  mergeObj(base.cv, raw.cv || {});
  mergeObj(base.prefs, raw.prefs || {});
  if (!base.contact.phoneCode) base.contact.phoneCode = "+61";
  // version 1 showed volunteering and referees whether or not they were finished: keep them showing
  if ((+raw.v || 1) < 2) { base.volunteering.forEach(x => { if (x.title || x.org) x.done = true; }); base.referees.list.forEach(r => { if (r.name) r.done = true; }); }
  for (const o of [base.target, base.cv]) if (OLD_JOB_TYPES[o.jobType]) o.jobType = OLD_JOB_TYPES[o.jobType];
  syncProfile(base);
  base.updated = str(raw.updated);
  return base;
}
const profile = { data: emptyProfile(), where: "loading", doc: null, listeners: new Set() };
const profileReady = memoryReady.then(async () => {
  try {
    if (memory.db && memory.uid) {
      profile.doc = memory.db.doc("data/users/" + memory.uid + "/resumeProfile");
      const snap = await profile.doc.get();
      if (snap.exists) profile.data = mergeProfile((snap.data() || {}).profile);
      profile.where = "account";
      return;
    }
  } catch { profile.doc = null; }
  try {
    const raw = lsGet(PROFILE_KEY);
    if (raw) profile.data = mergeProfile((JSON.parse(raw) || {}).profile);
    profile.where = raw === null && !window.localStorage ? "none" : "browser";
  } catch { profile.where = "none"; }
}).finally(() => profileChanged("load"));

let profSaveTimer = null, profChain = Promise.resolve();
function saveProfileSoon() {
  clearTimeout(profSaveTimer);
  profSaveTimer = setTimeout(() => { profChain = profChain.then(saveProfileNow); }, 800);
}
async function saveProfileNow() {
  profile.data.updated = new Date().toISOString();
  const body = { version: 1, profile: profile.data, updated: profile.data.updated };
  if (profile.doc) {
    try { await profile.doc.set(body); profile.where = "account"; renderProfileWhere(); return; }
    catch { profile.doc = null; }
  }
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(body)); profile.where = "browser"; }
  catch { profile.where = "none"; }
  renderProfileWhere();
}
function renderProfileWhere() {
  const el = $("profileWhere");
  if (el) el.textContent = {
    account: `Your details are ${accountWords()}.`,
    browser: "Your details are saved in this browser only.",
    none: "Your details can't be saved here, so download your files before you leave.",
    loading: "Loading your saved details…"
  }[profile.where];
}
const onProfile = fn => profile.listeners.add(fn);
function profileChanged(source) {
  for (const fn of profile.listeners) { try { fn(source); } catch (e) { console.error(e); } }
  renderProfileWhere();
}
// After any edit: tell the other tabs, and save shortly after
function touchProfile(source) { syncProfile(profile.data); profileChanged(source || "edit"); saveProfileSoon(); }
function replaceProfile(p, source) { profile.data = mergeProfile(p); touchProfile(source || "replace"); }
const hasProfile = p => !!(p.contact.name.trim() || p.experience.some(e => e.title || e.org) || p.education.some(e => e.degree || e.inst) || p.summary.trim());

/* --- Small helpers --- */
const getPath = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, path, v) {
  const ks = path.split(".");
  let a = o;
  for (let i = 0; i < ks.length - 1; i++) {
    if (a[ks[i]] == null) a[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    a = a[ks[i]];
  }
  a[ks[ks.length - 1]] = v;
}
const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// "11/2022", "nov 2022", "November 2022" → "Nov 2022"; anything else is kept as typed
function fmtDate(s) {
  s = String(s || "").trim();
  if (!s) return "";
  let m;
  if (/^(present|current|now|today)$/i.test(s)) return "Present";
  if ((m = s.match(/^(\d{1,2})\s*[/.\-]\s*((?:19|20)\d{2})$/)) && +m[1] >= 1 && +m[1] <= 12) return `${MON3[+m[1] - 1]} ${m[2]}`;
  if ((m = s.match(/^((?:19|20)\d{2})\s*[/.\-]\s*(\d{1,2})$/)) && +m[2] >= 1 && +m[2] <= 12) return `${MON3[+m[2] - 1]} ${m[1]}`;
  if ((m = s.match(/^(\d{1,2})\s*[/.\-]\s*(\d{2})$/)) && +m[1] >= 1 && +m[1] <= 12) { const yy = +m[2], now = new Date().getFullYear() % 100; return `${MON3[+m[1] - 1]} ${yy <= now + 6 ? 2000 + yy : 1900 + yy}`; }
  if ((m = s.match(/^([A-Za-z]{3,})\.?,?\s+((?:19|20)\d{2})$/))) {
    const i = MON3.findIndex(n => n.toLowerCase() === m[1].slice(0, 3).toLowerCase());
    if (i >= 0) return `${MON3[i]} ${m[2]}`;
  }
  return s;
}
const DATE_OK = /^((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?(19|20)\d{2}$|^Present$/;
const dateOk = s => !String(s || "").trim() || DATE_OK.test(fmtDate(s));
// Dates are stored as "Nov 2012"; people can choose to see them as "November 2012" or "11/2012"
const DATE_STYLES = ["words", "long", "numeric"];
const dateStyle = () => { const s = ((profile && profile.data && profile.data.prefs) || {}).dateStyle; return DATE_STYLES.includes(s) ? s : "words"; };
function showDate(s, style) {
  const f = fmtDate(s), m = f.match(/^([A-Z][a-z]{2}) ((?:19|20)\d{2})$/), st = style || dateStyle();
  if (!m || st === "words") return f;
  const i = MON3.indexOf(m[1]);
  return st === "numeric" ? `${String(i + 1).padStart(2, "0")}/${m[2]}` : `${MONTHS[i]} ${m[2]}`;
}
// "Nov 2027" → a Date at the end of that month (a year alone counts as its end), or null
function dateEnd(s) {
  const f = fmtDate(s); let m;
  if ((m = f.match(/^([A-Z][a-z]{2}) ((?:19|20)\d{2})$/))) return new Date(+m[2], MON3.indexOf(m[1]) + 1, 0, 23, 59);
  if ((m = f.match(/^((?:19|20)\d{2})$/))) return new Date(+m[1], 11, 31, 23, 59);
  return null;
}
// "-", "n/a" and the like mean "nothing here"
const isBlank = s => /^\s*([-–—._/\\*]+|n\/?a|none|nil)?\s*$/i.test(String(s == null ? "" : s));
const val = s => isBlank(s) ? "" : String(s).trim();
// "https://www.linkedin.com/in/name/" → "linkedin.com/in/name"
const shortUrl = u => val(u).replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[/?#]+$/, "");
// "Feb 2023 – Present"; study that hasn't finished reads "Feb 2024 – Nov 2027 (expected)"
function rangeOf(e, study) {
  const a = showDate(e.start), b = showDate(e.end);
  if (e.current) return study ? (b ? `${a ? a + " – " : ""}${b} (expected)` : `${a ? a + " – " : ""}Present`) : `${a ? a + " – " : ""}Present`;
  return a && b ? `${a} – ${b}` : (a || b);
}
const linesOf = t => String(t || "").split("\n").map(l => l.replace(BULLET_RE, "").trim()).filter(Boolean);
const listOf = t => String(t || "").split(/\s*[,;\n]\s*/).map(s => s.trim()).filter(Boolean);
const stageOf = p => p.target.stage || (p.education.some(e => e.current) && p.experience.length <= 3 ? "student" : "early");
// Where someone is in a qualification, from its dates: "final-year", "penultimate-year", "second-year" student, or a graduate.
// Australian study years run Feb to Nov, so from December on, the next year's level applies.
const ORDINAL = ["", "first", "second", "third", "fourth", "fifth", "sixth"];
function studyStage(e, now = new Date()) {
  const end = dateEnd(e.end);
  if (!end) return e.current ? { current: true, label: "", ends: "" } : null;
  if (end < now && !e.current) return { current: false, label: (now - end) / 2.63e9 <= 24 ? "recent graduate" : "graduate", ends: showDate(e.end) };
  const acad = d => d.getMonth() >= 11 ? d.getFullYear() + 1 : d.getFullYear();
  const endAcad = end.getMonth() <= 1 ? end.getFullYear() - 1 : end.getFullYear();
  const left = endAcad - acad(now);
  let label = left <= 0 ? "final-year" : left === 1 ? "penultimate-year" : "";
  const st = dateEnd(e.start);
  if (!label && st) { const n = acad(now) - acad(st) + 1; if (n >= 1 && n < ORDINAL.length) label = ORDINAL[n] + "-year"; }
  return { current: true, label, ends: showDate(e.end), yearsLeft: left };
}
// One line for the AI about the main qualification, so a student is never called a graduate
function studyLine(p) {
  const e = finished(p.education).find(x => (x.degree || x.inst) && studyStage(x)) || null;
  if (!e) return "";
  const s = studyStage(e), name = `${e.degree || "a qualification"}${e.inst ? ` at ${e.inst}` : ""}`;
  const today = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
  if (s.current) return `Still studying ${name}${s.ends ? `, expected to finish ${s.ends}` : ""}. Today is ${today}, so they are ${s.label ? aOrAn(s.label) + " " + s.label + " student" : "a current student"}. Never call them a graduate or recent graduate.`;
  return `Finished ${name} in ${s.ends} (${s.label}).`;
}

/* --- The profile as plain resume text (what the scanner and ATS read) --- */
// o.jobText: the job ad it's for, so the closest subjects are picked
function profileToText(p, o = {}) {
  const out = [];
  const c = p.contact;
  out.push(c.name || "Your Name");
  if (p.target.title) out.push(p.target.title);
  out.push([c.location, c.phone, c.email, shortUrl(c.linkedin), shortUrl(c.website)].filter(Boolean).join(" | "));
  const extra = [c.workRights, c.licence].filter(Boolean).join(" | ");
  if (extra) out.push(extra);
  const sec = (title, lines) => { if (lines.length) out.push("", title.toUpperCase(), ...lines); };
  const entry = (e, study) => {
    const head = study ? [e.degree, e.inst, val(e.location)].filter(Boolean).join(" | ") : [e.title, e.org, val(e.location)].filter(Boolean).join(" | ");
    const r = rangeOf(e, study);
    return [head + (r ? " | " + r : "")];
  };
  const exp = () => sec("Experience", shown(p.experience).filter(e => e.title || e.org).flatMap((e, i) => [...(i ? [""] : []), ...entry(e), ...e.bullets.filter(Boolean).map(b => "- " + b)]));
  const edu = () => sec("Education", shown(p.education).filter(e => e.degree || e.inst).flatMap((e, i) => [...(i ? [""] : []), ...entry(e, true), ...eduLines(e, p, o.jobText).map(b => "- " + b)]));
  const skills = () => {
    const s = p.skills, lines = [];
    if (s.hard.length) lines.push("Technical: " + s.hard.join(", "));
    if (s.software.length) lines.push("Software: " + s.software.join(", "));
    if (s.languages.length) lines.push("Languages: " + s.languages.join(", "));
    if (s.soft.length) lines.push("Strengths: " + s.soft.join(", "));
    sec("Skills", lines);
    if (s.certs.length) sec("Licences & Certifications", s.certs.map(x => "- " + x));
  };
  sec("Profile", p.summary.trim() ? [p.summary.trim()] : []);
  const student = stageOf(p) === "student";
  if (student) { edu(); exp(); } else { exp(); edu(); }
  if (p.extras.projects) sec("Projects", shown(p.projects).filter(x => x.name).flatMap((x, i) => [...(i ? [""] : []), [x.name, x.org].filter(Boolean).join(" | ") + (rangeOf(x) ? " | " + rangeOf(x) : ""), ...linesOf(x.details).map(b => "- " + b)]));
  if (p.extras.volunteering) sec("Volunteering", shown(p.volunteering).filter(e => e.title || e.org).flatMap((e, i) => [...(i ? [""] : []), ...entry(e), ...e.bullets.filter(Boolean).map(b => "- " + b)]));
  skills();
  if (p.extras.awards) sec("Awards", linesOf(p.awards).map(b => "- " + b));
  if (p.extras.publications) sec("Publications", linesOf(p.publications).map(b => "- " + b));
  if (p.extras.availability && availabilityText(p)) sec("Availability", [availabilityText(p)]);
  if (p.extras.interests && p.interests.trim()) sec("Interests", [p.interests.trim()]);
  const refs = finished(p.referees.list).filter(r => r.name);
  if (p.extras.referees) sec("Referees", p.referees.mode === "list" && refs.length ? refs.map(r => [r.name, [r.role, r.org].filter(Boolean).join(", "), r.phone, r.email].filter(Boolean).join(" | ")) : ["Available on request"]);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
// all: every subject, for the AI; otherwise the ones closest to the job
function eduLines(e, p, jobText, all) {
  const out = [];
  const g = gradeText(e);
  if (g) out.push(g);
  if (val(e.awards)) out.push(val(e.awards));
  const cw = all ? listOf(val(e.coursework)).filter(x => !isBlank(x)) : pickSubjects(e, p, jobText);
  if (cw.length) out.push("Relevant coursework: " + cw.join(", "));
  if (val(e.project)) out.push(thesisLine(e.project));
  return out;
}
/* --- Grades: WAM, GPA (out of 7 or 4), ATAR, or words --- */
const GRADE_TYPES = [["WAM", "WAM (%)"], ["GPA7", "GPA out of 7"], ["GPA4", "GPA out of 4"], ["ATAR", "ATAR"], ["other", "Other"]];
function guessGradeType(v, cur) {
  const t = val(v);
  if (!/^\d{1,3}(\.\d+)?%?$/.test(t)) return t ? "other" : cur || "";
  const n = parseFloat(t);
  const fits = { WAM: n > 10 && n <= 100, GPA7: n <= 7, GPA4: n <= 4, ATAR: n >= 30 && n <= 99.95, other: false };
  if (cur && cur !== "other" && fits[cur]) return cur;
  return n > 7 ? "WAM" : n > 4 ? "GPA7" : "GPA4";
}
// A grade only goes on the resume when it helps: GPA above 3.5 out of 4 or 5.5 out of 7, WAM above 80%, ATAR above 90.
// Words ("Distinction average") are left to the person.
const GRADE_MIN = { GPA4: 3.5, GPA7: 5.5, WAM: 80, ATAR: 90 };
const GRADE_MIN_WORDS = "GPA above 3.5 out of 4 or 5.5 out of 7, WAM above 80% or ATAR above 90";
function gradeStrong(e) {
  const t = val(e.grade);
  if (!/^\d{1,3}(\.\d+)?%?$/.test(t)) return true;
  const min = GRADE_MIN[guessGradeType(t, e.gradeType)];
  return min == null || parseFloat(t) > min;
}
function gradeText(e) {
  const t = val(e.grade);
  if (!t || !gradeStrong(e)) return "";
  if (!/^\d{1,3}(\.\d+)?%?$/.test(t)) return t;
  const n = t.replace(/%$/, ""), type = guessGradeType(t, e.gradeType);
  return type === "WAM" ? `WAM: ${n}` : type === "GPA7" ? `GPA: ${n}/7` : type === "GPA4" ? `GPA: ${n}/4` : type === "ATAR" ? `ATAR: ${n}` : t;
}
/* --- When you can start --- */
function startText(p) {
  const w = String(p.startWhen || "");
  if (!w) return "";
  if (w === "now") return "Available to start immediately";
  const notice = { "1w": "one week's", "2w": "two weeks'", "4w": "four weeks'" }[w];
  if (notice) return `Available to start with ${notice} notice`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) { const d = new Date(w + "T00:00:00"); return isNaN(d) ? "" : `Available to start from ${d.getDate()} ${MON3[d.getMonth()]} ${d.getFullYear()}`; }
  return w;
}
const availabilityText = p => [startText(p), val(p.availability)].filter(Boolean).join(". ");
// Only entries the person has finished go on the resume
const finished = list => list.filter(e => e.done !== false);
// …and of those, the ones they haven't hidden from this resume
const shown = list => finished(list).filter(e => !e.hidden);
// Relevant subjects: everything is kept, and the ones closest to the job go on the resume
const SUBJECTS_SHOWN = 6;
function pickSubjects(e, p, jobText) {
  const all = listOf(val(e.coursework)).filter(x => !isBlank(x));
  if (all.length <= SUBJECTS_SHOWN) return all;
  const pr = p || profile.data;
  const want = contentWords([pr.target.title, pr.target.ad, jobText || "", ...(COMMON_SKILLS[pr.target.jobType] || { hard: [] }).hard].join(" "));
  const score = s => { let n = 0; for (const w of contentWords(s)) if (want.has(w)) n++; return n; };
  const keep = new Set(all.map((s, i) => [s, i, score(s)]).sort((a, b) => b[2] - a[2] || a[1] - b[1]).slice(0, SUBJECTS_SHOWN).map(x => x[1]));
  return all.filter((_, i) => keep.has(i));
}

/* --- An existing resume (uploaded or pasted) turned into a profile --- */
function splitEntryLabel(label) {
  let parts = label.split(/\s+[·|]\s+/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 1) parts = label.split(/\s+[–—-]\s+|\s+at\s+/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 1 && label.includes(", ")) { const i = label.indexOf(", "); parts = [label.slice(0, i), label.slice(i + 2)]; }
  let [a = "", b = "", c = ""] = parts;
  // "Org, Brisbane QLD" → org and location
  const loc = /,\s*([A-Z][A-Za-z .]+,?\s*(?:VIC|NSW|QLD|WA|SA|TAS|ACT|NT)|[A-Z][a-z]+(?: [A-Z][a-z]+)?)$/;
  if (!c && b && loc.test(b) && /(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/.test(b)) { const m = b.match(loc); c = m[1]; b = b.slice(0, m.index).trim(); }
  return [a, b, parts.slice(2).join(", ") || c];
}
function datesOfLine(line) {
  const m = String(line).match(RANGE_TEST);
  if (m) return { start: fmtDate(m[1]), end: /present|current|now|today|date/i.test(m[2]) ? "" : fmtDate(m[2]), current: /present|current|now|today|date|expected/i.test(m[2] + line) };
  const one = String(line).match(new RegExp(`${MY}|\\b(?:19|20)\\d{2}\\b`, "i"));
  return { start: "", end: one ? fmtDate(one[0]) : "", current: /expected|current/i.test(line) };
}
function profileFromText(text) {
  const p = emptyProfile();
  const c = candidateFrom(text);
  Object.assign(p.contact, { name: c.name, email: c.email, phone: c.phone, location: c.location, linkedin: c.linkedin });
  const head = text.split("\n").slice(0, 6).join(" ");
  const web = head.match(/\b(?:https?:\/\/)?(?:www\.)?(?:github\.com\/[\w-]+|behance\.net\/[\w-]+|[\w-]+\.(?:dev|io|me|design|portfolio\.com))\b\/?/i);
  if (web) p.contact.website = web[0];
  if (/australian citizen/i.test(text)) p.contact.workRights = "Australian citizen";
  else if (/permanent resident/i.test(text)) p.contact.workRights = "Permanent resident";
  else if (/full (working|work) rights/i.test(text)) p.contact.workRights = "Full working rights";
  const parsed = parseResume(text);
  const L = parsed.lines;
  const firstHead = parsed.sections[1] ? parsed.sections[1].headIdx : Math.min(L.length, 6);
  const top = L.slice(0, firstHead).map(l => l.trim()).filter(Boolean);
  if (top[1] && top[1].length < 70 && !/[@|]|\d{3}/.test(top[1]) && top[1] !== c.location) p.target.title = top[1];
  for (const s of parsed.sections) {
    if (s.type === "top") continue;
    const body = L.slice(s.start, s.end + 1).map(l => l.trim()).filter(Boolean);
    const plain = body.map(l => l.replace(BULLET_RE, "").trim());
    if (s.type === "summary") p.summary = plain.join(" ");
    else if (s.type === "skills") {
      for (const line of plain) {
        const m = line.match(/^([A-Za-z &/]{2,30})(\s*\(([^)]{2,30})\))?:\s*(.+)$/);
        const label = m ? m[1].toLowerCase() : "";
        const provider = m && m[3] ? ` (${m[3]})` : "";
        const items = listOf(m ? m[4] : line).filter(x => x.length < 60);
        if (/licen|certif|ticket/i.test(s.title) && !m) { p.skills.certs.push(...(items.length > 1 ? items : [line])); continue; }
        for (const it of items) {
          const known = SKILLS.find(k => k.name.toLowerCase() === it.toLowerCase());
          const canonical = known ? known.name : it;
          if (/language/.test(label) && !/programming/.test(label)) p.skills.languages.push(it);
          else if (/\b(strengths?|soft skills?|personal|interpersonal|attributes)\b/.test(label) || (known && known.kind === "soft")) p.skills.soft.push(it);
          else if (/licen|certif|ticket|course/.test(label) || /licen[cs]e|certificate|white card|first aid|\bRSA\b|\bRSG\b|working with children|police check|forklift|HLTAID/i.test(it)) p.skills.certs.push(it + provider);
          else if (SOFTWARE.has(canonical) || PROGRAMMING.has(canonical) || (/software|tools?|platforms?|systems/.test(label) && /^[A-Z0-9]/.test(it))) p.skills.software.push(canonical);
          else p.skills.hard.push(it);
        }
      }
    } else if (s.type === "referees") {
      if (/request/i.test(plain.join(" ")) || !plain.length) p.referees = { mode: "request", list: [] };
      else p.referees = { mode: "list", list: plain.slice(0, 3).map(l => {
        const email = (l.match(/[\w.+-]+@[\w.-]+\.\w+/) || [""])[0], phone = ((l.match(/(?:\+|\()?\d[\d\s().\-]{7,}\d/) || [""])[0]).trim();
        const rest = l.replace(email, " ").replace(phone, " ").split(/\s*(?:\||·|\t|,|\s[–—-]\s)\s*/).map(x => x.trim()).filter(x => x && !/^(e|m|p|ph|email|mobile|phone):?$/i.test(x));
        return { ...emptyRef(), name: rest[0] || "", role: rest[1] || "", org: rest.slice(2).join(", "), phone, email };
      }) };
      p.extras.referees = true;
    } else if (s.type === "other") {
      const t = s.title.toLowerCase();
      if (/award|achiev|honou?r|scholar/.test(t)) { p.awards = plain.join("\n"); p.extras.awards = true; }
      else if (/interest|hobb/.test(t)) { p.interests = plain.join(", "); p.extras.interests = true; }
      else if (/language/.test(t)) p.skills.languages.push(...plain.flatMap(listOf));
      else if (/publication/.test(t)) { p.publications = plain.join("\n"); p.extras.publications = true; }
      else if (/availab/.test(t)) { p.availability = plain.join(" "); p.extras.availability = true; }
    }
  }
  for (const z of parsed.zones) {
    const d = datesOfLine(L[z.headIdx] || L[z.start] || "");
    const bullets = (z.bullets || []).map(b => b.text).filter(Boolean);
    if (z.kind === "role") {
      const [title, org, location] = splitEntryLabel(z.label);
      const e = { ...emptyExp(), title, org, location, start: d.start, end: d.end, current: d.current, bullets };
      if (/volunteer|community/i.test(z.section)) { p.volunteering.push(e); p.extras.volunteering = true; }
      else if (/project/i.test(z.section)) { p.projects.push({ ...emptyProj(), name: title, org, start: d.start, end: d.end, details: bullets.join("\n") }); p.extras.projects = true; }
      else p.experience.push(e);
    } else if (z.kind === "education") {
      const [degree, inst, location] = splitEntryLabel(z.label);
      const e = { ...emptyEdu(), degree, inst, location, start: d.start, end: d.end, current: d.current || /expected/i.test(L[z.headIdx] || "") };
      const rest = [];
      for (const b of bullets) {
        if (/^(relevant )?coursework\s*:/i.test(b)) e.coursework = b.replace(/^(relevant )?coursework\s*:\s*/i, "");
        else if (/\b(WAM|GPA|ATAR|distinction|credit average|high distinction|first class)\b/i.test(b) && !e.grade) e.grade = b;
        else if (/scholar|award|dean|prize|medal/i.test(b) && !e.awards) e.awards = b;
        else if (/thesis|capstone|project|dissertation/i.test(b) && !e.project) e.project = b;
        else rest.push(b);
      }
      if (rest.length) e.project = [e.project, ...rest].filter(Boolean).join("; ");
      p.education.push(e);
    } else if (z.kind === "section" && /project/i.test(z.section)) {
      p.projects.push(...bullets.map(b => ({ ...emptyProj(), name: b.split(/[:–—-]\s/)[0].slice(0, 80), details: b.includes(": ") ? b.slice(b.indexOf(": ") + 2) : "" })));
      p.extras.projects = p.projects.length > 0;
    } else if (z.kind === "section" && /volunteer|community/i.test(z.section)) {
      // "Construction volunteer, regional Vietnam (Jan 2019): built a community toilet block…"
      for (const b of bullets) {
        const i = b.indexOf(": ");
        p.volunteering.push(i > 0 && i < 80 ? { ...emptyExp(), title: b.slice(0, i), bullets: [b.slice(i + 2).replace(/^./, c => c.toUpperCase())] } : { ...emptyExp(), title: b, bullets: [] });
      }
      p.extras.volunteering = p.volunteering.length > 0;
    }
  }
  for (const k of Object.keys(p.skills)) p.skills[k] = [...new Set(p.skills[k])].slice(0, 40);
  if (p.education.some(e => e.current)) p.target.stage = "student";
  return p;
}

/* --- Made-up details so the templates aren't empty before you've added yours --- */
const SAMPLE_PROFILE = mergeProfile({
  target: { title: "Marketing and Events Coordinator", jobType: "marketing", stage: "early" },
  contact: { name: "Sam Taylor", phone: "0400 123 456", email: "sam.taylor@example.com", location: "Brisbane, QLD", linkedin: "linkedin.com/in/sam-taylor-example", workRights: "Australian citizen" },
  summary: "Marketing coordinator with three years' experience running events and social campaigns for hospitality and not-for-profit brands. Grew a café group's Instagram following from 2,000 to 9,500 in a year and delivered 40+ events on budget. Looking to bring campaign and event skills to an in-house marketing team.",
  experience: [
    { title: "Marketing Coordinator", org: "Harbourside Hospitality Group", location: "Brisbane, QLD", start: "Mar 2023", current: true, bullets: ["Plan and run monthly social campaigns across 4 venues, growing Instagram followers from 2,000 to 9,500 in 12 months", "Coordinated 40+ functions and launch events, keeping each within budget and briefing staff on the day", "Built a Canva template kit that cut design time for weekly menus and posters by half"] },
    { title: "Events Assistant", org: "Bright Path Foundation", location: "Brisbane, QLD", start: "Feb 2021", end: "Feb 2023", bullets: ["Organised logistics for 3 annual fundraising galas of 300+ guests, raising $180,000 in total", "Managed volunteer rosters and supplier bookings using Excel and Eventbrite"] },
    { title: "Front of House", org: "The Corner Café", location: "Brisbane, QLD", start: "Jan 2019", end: "Dec 2020", bullets: ["Served 150+ customers a shift and trained 5 new staff on the POS system"] }
  ],
  education: [{ degree: "Bachelor of Business (Marketing)", inst: "Griffith University", location: "Brisbane, QLD", start: "Feb 2018", end: "Nov 2021", grade: "Distinction average", coursework: "Digital Marketing, Consumer Behaviour, Event Management" }],
  skills: { hard: ["Social media marketing", "Event management", "Copywriting", "Budgeting"], software: ["Canva", "Meta Business Suite", "Mailchimp", "Microsoft Excel", "Eventbrite"], soft: ["Communication", "Organisation"], languages: ["English (native)", "Italian (conversational)"], certs: ["RSA (Queensland)", "First Aid (HLTAID011)"] },
  awards: "Volunteer of the Year, Bright Path Foundation (2022)",
  interests: "Live music, community radio, long-distance running",
  availability: "Full time, available from two weeks' notice",
  referees: { mode: "request", list: [] },
  extras: { projects: false, volunteering: false, awards: true, publications: false, interests: true, availability: false, referees: true }
});

