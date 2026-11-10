/* ===================== Employer side, part 1: the pieces every employer page shares =====================
   The employer pages follow the layout of SEEK's employer site: a Dashboard, Jobs (manage your ads), a step-by-step
   "Post a job", Candidates (a pipeline with a profile panel), Talent Search, Reports and a Company profile.

   Where the employer's data lives (emMode):
     shared  opened in Claude: ads are posted to the shared database, so job seekers see them and apply
     local   run anywhere else: ads and applications stay in this browser (job seekers using this browser see them too)
     demo    "sample data": a made-up company, ads and candidates, kept apart from everything real
   Everything private to the employer (stages, ratings, notes, pools, saved searches) is in the `hiring` document. */

const EM_STAGES = ["New", "Shortlisted", "Interview", "Offer", "Accepted", "Not suitable"];
const EM_STAGE_HELP = { New: "Not reviewed yet", Shortlisted: "Worth a closer look", Interview: "Being interviewed", Offer: "Offer made", Accepted: "Offer accepted", "Not suitable": "Not going ahead" };
const emStageOf = s => s === "Not progressing" ? "Not suitable" : EM_STAGES.includes(s) ? s : "New";
const emStageIx = s => EM_STAGES.indexOf(emStageOf(s));
const EM_SIZES = ["1 to 10 people", "11 to 50 people", "51 to 200 people", "201 to 500 people", "501 to 1,000 people", "More than 1,000 people"];
const EM_BENEFITS = ["Flexible hours", "Work from home", "Paid parental leave", "Extra annual leave", "Birthday leave", "Professional development", "Study support", "Free parking", "Gym or wellbeing allowance", "Employee discounts", "Company laptop and phone", "Career progression", "Social events", "Health insurance", "Mentoring", "Salary packaging"];
const EM_LOGO_COLOURS = ["#2440B8", "#0F766E", "#B3232F", "#9A5806", "#6D28D9", "#0E7490", "#BE185D", "#374151"];
const EM_WORK_TYPES = ["Full time", "Part time", "Casual", "Contract", "Internship", "Graduate program"];
const EM_PLACES = ["Sydney, NSW", "Melbourne, VIC", "Brisbane, QLD", "Perth, WA", "Adelaide, SA", "Canberra, ACT", "Hobart, TAS", "Darwin, NT", "Gold Coast, QLD", "Newcastle, NSW", "Geelong, VIC", "Sunshine Coast, QLD", "Wollongong, NSW", "Townsville, QLD", "Remote (Australia)"];
// SEEK sells three kinds of ad. Here they cost nothing: they change how much of the ad job seekers see.
const EM_TIERS = [
  { key: "basic", name: "Basic", line: "A standard listing", perks: ["Listed in Find jobs for 30 days", "Applications and screening questions", "Candidate pipeline and notes"], brand: false, promo: false },
  { key: "advanced", name: "Advanced", line: "Your brand and selling points", perks: ["Everything in Basic", "Your logo and colour on the ad", "Up to three selling points shown with the ad"], brand: true, promo: false },
  { key: "premium", name: "Premium", line: "Shown first", perks: ["Everything in Advanced", "Listed above other ads that match as well", "A “Promoted” tag on the ad"], brand: true, promo: true }
];
const emTier = a => EM_TIERS.find(t => t.key === (a && a.tier)) || EM_TIERS[0];
const EM_LOCAL_ID = "local";
const EM_BUILDING = `<svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21"/><path d="M14 10h4.5a1.5 1.5 0 0 1 1.5 1.5V21M2.5 21h19M7.5 8h3M7.5 11.5h3M7.5 15h3"/></svg>`;

/* --- Where the data is --- */
const emMode = () => hiring.data.demo ? "demo" : canPost() ? "shared" : "local";
function emDoc() {
  const m = emMode();
  if (m === "demo") return hiring.data.demo;
  if (m === "local") return hiring.data.local || { employer: {}, jobs: [] };
  return market.myJobs || { employer: {}, jobs: [] };
}
const emCompany = () => ({ name: "", website: "", location: "", about: "", ...(emDoc().employer || {}) });
const emNormAd = a => { const o = { ...emptyJobAd(), questions: [], tier: "basic", sellingPoints: [], autoNS: true, ...a }; if (!o.salary && o.showPay !== false && (o.payMin || o.payMax)) o.salary = emPayLine(o); return o; };
const emAds = () => (emDoc().jobs || []).map(emNormAd);
const emAd = id => emAds().find(a => a.id === id) || null;
// open, draft, closed (by the employer) or expired (past its closing date)
function emAdState(a) {
  if (a.status === "draft") return "draft";
  if (a.status === "closed") return "closed";
  return a.closes && a.closes < todayISO() ? "expired" : "open";
}
const emAdRef = a => "JF-" + (parseInt(String(a.id).replace(/[^0-9a-z]/gi, "").slice(0, 6), 36) % 90000 + 10000);
function emApplicants() {
  const m = emMode();
  return m === "demo" ? (hiring.data.demo.apps || []) : m === "local" ? (hiring.data.localApps || []) : market.incoming;
}
function emTalent() {
  const m = emMode();
  return m === "demo" ? (hiring.data.demo.talent || []) : m === "local" ? [] : market.talent.filter(c => c.uid !== market.uid);
}
const emOutbox = () => {
  const m = emMode();
  return (m === "demo" ? hiring.data.demo.outbox : m === "local" ? hiring.data.localOutbox : market.outbox) || { invites: [] };
};
function emCandidate(uid) {
  const t = emTalent().find(c => c.uid === uid);
  if (t) return t;
  const a = emApplicants().find(x => x.candidate === uid);
  if (a && a.profile) return { uid, name: a.name, ...a.profile };   // (applications made on this browser carry the profile with them)
  return { uid, name: (a && a.name) || "Candidate", headline: "", skills: [], titles: [], education: [] };
}
function emStore() {
  const s = hiring.data.demo ? (hiring.data.demo.store || (hiring.data.demo.store = {})) : hiring.data;
  for (const k of ["status", "notes", "ratings", "log", "seen"]) if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k])) s[k] = {};
  for (const k of ["pools", "searches"]) if (!Array.isArray(s[k])) s[k] = [];
  return s;
}
const emKey = (uid, adId) => uid + ":" + adId;
const emAfter = () => { hiring.save(); };
async function emSave(company, ads, statusId) {
  const m = emMode();
  if (m === "shared") return saveEmployer(company, ads, statusId);
  const body = { employer: company, jobs: ads.slice(0, 30), updated: new Date().toISOString() };
  if (m === "demo") hiring.data.demo = { ...hiring.data.demo, employer: body.employer, jobs: body.jobs };
  else hiring.data.local = body;
  hiring.save(true);
  return true;
}
function emModeNote() {
  const m = emMode();
  if (m === "demo") return { kind: "demo", html: `<b>Sample data.</b> This is a made-up company with made-up ads and candidates, so you can try every page. Nothing here is posted or shared.` , act: ["Leave sample data", "demo-off"] };
  if (!market.db) return { kind: "local", html: `<b>Saved in this browser.</b> Your ads show in <i>Find jobs</i> here, and applications made here come back to you. Opened in Claude, your ads are shared with every job seeker who opens Job Finder.`, act: ["Try sample data", "demo-on"] };
  if (market.canWrite === false) return { kind: "local", html: `<b>View only.</b> Your access to this page is view-only, so what you do here stays in this browser. Ask the owner for Contributor or Editor access to post ads that others can see.`, act: ["Try sample data", "demo-on"] };
  return null;
}

/* --- Small things --- */
const emInitials = n => String(n || "?").split(/[\s,.-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
const emHue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const emAvatar = (name, size) => `<span class="emp-av${size ? " " + size : ""}" style="--h:${emHue(name)}" aria-hidden="true">${esc(emInitials(name))}</span>`;
// logos and colours can come from other people's shared documents: only draw what is plainly an image or a hex colour
const emColour = v => /^#[0-9a-f]{6}$/i.test(String(v || "")) ? v : EM_LOGO_COLOURS[0];
const emLogoSrc = v => /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(String(v || "")) && String(v).length < 90000 ? v : "";
const emLogo = (co, size) => co && emLogoSrc(co.logo) ? `<img class="emp-logo${size ? " " + size : ""}" src="${esc(emLogoSrc(co.logo))}" alt="">` : `<span class="emp-logo ph${size ? " " + size : ""}" style="--c:${emColour(co && co.colour)}" aria-hidden="true">${co && co.name ? esc(emInitials(co.name)) : EM_BUILDING}</span>`;
function emAgo(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 30 ? d + " days ago" : fmtDay(String(iso).slice(0, 10));
}
const emDaysLeft = iso => iso ? Math.round((new Date(iso + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 864e5) : null;
const emPlural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
const EM_HIGH = 60, EM_GOOD = 40;   // (60 is the same line Find jobs calls a strong match)
const emFitClass = p => p >= EM_HIGH ? "hi" : p >= EM_GOOD ? "mid" : "lo";
const emFitLabel = p => p >= EM_HIGH ? "High fit" : p >= EM_GOOD ? "Good fit" : "Possible fit";
function emFit(c, ad) {
  const m = candidateMatch(c, ad);
  const parts = [];
  const want = adSkills(ad).length;
  if (want) parts.push(`${m.hit.length} of ${want} skills the ad asks for${m.hit.length ? ` (${m.hit.slice(0, 4).join(", ")})` : ""}`);
  const at = emTitleStems(ad.title), ct = emTitleStems([c.headline, ...(c.titles || [])].join(" "));
  if (at.size && [...at].filter(w => ct.has(w)).length / at.size >= 0.5) parts.push("a similar job title");
  if (ad.location && c.location && DEDUP.place(ad.location) === DEDUP.place(c.location)) parts.push(`lives in ${c.location}`);
  return { ...m, why: parts.length ? "Has " + parts.join(", ").replace(/, ([^,]*)$/, " and $1").replace(/ and lives/, " and lives") + "." : "Not enough in their profile to compare yet." };
}
function emStars(n, key, label) {
  return `<span class="emp-stars" role="radiogroup" aria-label="${esc(label || "Rating")}">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="emp-star${i <= n ? " on" : ""}" role="radio" aria-checked="${i === n}" aria-label="${i} star${i > 1 ? "s" : ""}" data-em="rate" data-key="${esc(key)}" data-n="${i}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z"/></svg></button>`).join("")}</span>`;
}
function emHL(text, terms) {
  text = String(text || "");
  if (!terms || !terms.length) return esc(text);
  const re = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
  return text.split(re).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join("");
}
// The search language for Talent Search: words, "quoted phrases", OR, NOT or a minus sign
function emParseQuery(q) {
  const groups = [{ all: [], not: [] }];
  let neg = false;
  const re = /(-)?"([^"]+)"|(\S+)/g; let m;
  while ((m = re.exec(String(q || "")))) {
    if (m[2]) { groups[groups.length - 1][m[1] || neg ? "not" : "all"].push(m[2].toLowerCase()); neg = false; continue; }
    const w = m[3];
    if (/^or$/i.test(w)) { groups.push({ all: [], not: [] }); neg = false; }
    else if (/^not$/i.test(w)) neg = true;
    else if (/^and$/i.test(w)) { /* words are joined by AND anyway */ }
    else { const bare = w.replace(/^-/, "").replace(/[()]/g, "").toLowerCase(); if (bare) groups[groups.length - 1][w[0] === "-" || neg ? "not" : "all"].push(bare); neg = false; }
  }
  return groups.filter(g => g.all.length || g.not.length);
}
const emQueryMatch = (groups, hay) => { if (!groups.length) return true; hay = String(hay).toLowerCase(); return groups.some(g => g.all.every(t => hay.includes(t)) && !g.not.some(t => hay.includes(t))); };
const emQueryTerms = groups => [...new Set(groups.flatMap(g => g.all))];
const emHay = c => [c.name, c.headline, c.summary, c.location, c.workRights, (c.skills || []).join(" "), (c.titles || []).join(" "), (c.education || []).join(" ")].join(" \n ");

/* --- Pay: turn the pay boxes into the line job seekers read, and back --- */
const emMoney = n => { n = +n; return isFinite(n) && n > 0 ? "$" + (n % 1 ? n.toFixed(2) : n.toLocaleString("en-AU")) : ""; };
function emPayLine(ad) {
  const lo = emMoney(ad.payMin), hi = emMoney(ad.payMax);
  if (!lo && !hi) return ad.salary || "";
  const per = ad.payType === "hour" ? " an hour" : ad.payType === "day" ? " a day" : " a year";
  const range = lo && hi && lo !== hi ? `${lo} to ${hi}` : lo || hi;
  return range + per + (ad.payType === "hour" || ad.payType === "day" ? "" : ad.superOn === false ? "" : " + super") + (ad.payNote ? " " + ad.payNote : "");
}

/* --- Screening questions (SEEK calls them "Candidate questions") --- */
const EM_RTW = ["I'm an Australian citizen", "I'm a permanent resident of Australia", "I'm a citizen of New Zealand", "I hold a valid Australian working visa", "I'm a student with work rights", "I don't have the right to work in Australia"];
const EM_YEARS = ["Less than 1 year", "1 year", "2 years", "3 years", "4 years", "5+ years"];
const EM_QLIB = [
  { cat: "Work rights", text: "Which of the following statements best describes your right to work in Australia?", type: "choice", options: EM_RTW, ideal: EM_RTW.slice(0, 5) },
  { cat: "Work rights", text: "Do you have the right to work in Australia?", type: "yes" },
  { cat: "Experience", text: "How many years' experience do you have in a similar role?", type: "choice", options: EM_YEARS, ideal: EM_YEARS.slice(2) },
  { cat: "Experience", text: "Do you have experience working in a customer-facing role?", type: "yes" },
  { cat: "Experience", text: "Have you led or supervised a team before?", type: "yes" },
  { cat: "Licences and checks", text: "Do you have a current Australian driver's licence?", type: "yes" },
  { cat: "Licences and checks", text: "Do you have a current Working With Children Check?", type: "yes" },
  { cat: "Licences and checks", text: "Do you have a current National Police Check?", type: "yes" },
  { cat: "Licences and checks", text: "Do you hold a current White Card (General Construction Induction)?", type: "yes" },
  { cat: "Licences and checks", text: "Do you have a current First Aid certificate?", type: "yes" },
  { cat: "Licences and checks", text: "Do you have a current forklift licence?", type: "yes" },
  { cat: "Education", text: "Which of the following qualifications do you have?", type: "choice", options: ["Certificate III or IV", "Diploma or advanced diploma", "Bachelor degree", "Postgraduate degree", "None of these"], ideal: ["Bachelor degree", "Postgraduate degree"] },
  { cat: "Availability", text: "Are you able to work weekends?", type: "yes" },
  { cat: "Availability", text: "Are you comfortable working a rotating roster?", type: "yes" },
  { cat: "Availability", text: "Are you willing to relocate for this role?", type: "yes" },
  { cat: "Availability", text: "How much notice do you need to give your current employer?", type: "choice", options: ["None, I'm available now", "1 week", "2 weeks", "4 weeks", "More than 4 weeks"], ideal: ["None, I'm available now", "1 week", "2 weeks", "4 weeks"] },
  { cat: "Pay", text: "What's your expected annual base salary (before tax, not including super)?", type: "number" },
  { cat: "In your words", text: "In a few sentences, tell us why you're interested in this role.", type: "text" },
  { cat: "In your words", text: "Tell us about a project or result you're proud of.", type: "text" }
];
let emQid = 0;
const emNewQ = (o = {}) => ({ id: "q" + Date.now().toString(36) + (emQid++), text: "", type: "yes", options: [], ideal: [], min: "", max: "", must: false, ...JSON.parse(JSON.stringify(o)) });
const emQFromLib = l => emNewQ({ text: l.text, type: l.type, options: l.options || [], ideal: l.ideal || (l.type === "yes" ? ["Yes"] : []) });
// Suggest questions that fit this ad: the ones every ad needs, then ones its wording points to
function emSuggestQs(ad) {
  const text = [ad.title, ad.summary, ...(ad.duties || []), ...(ad.musts || [])].join(" ").toLowerCase();
  const out = [EM_QLIB[0], EM_QLIB[2]];
  const add = t => { const l = EM_QLIB.find(x => x.text === t); if (l && !out.includes(l)) out.push(l); };
  if (/\b(driver|driving|licence|license|delivery|courier|truck|fleet|site visits?)\b/.test(text)) add("Do you have a current Australian driver's licence?");
  if (/\b(child|school|teacher|educator|aged care|disability|youth|community|nurse|support worker|carer)\b/.test(text)) { add("Do you have a current Working With Children Check?"); add("Do you have a current National Police Check?"); }
  if (/\b(construction|site|civil|builder|scaffold|trade|labourer|electrician|plumber)\b/.test(text)) add("Do you hold a current White Card (General Construction Induction)?");
  if (/\b(warehouse|forklift|logistics|stock)\b/.test(text)) add("Do you have a current forklift licence?");
  if (/\b(first aid|safety|health|care|hospitality|fitness)\b/.test(text)) add("Do you have a current First Aid certificate?");
  if (/\b(casual|shift|roster|weekend|retail|hospitality|kitchen|bar)\b/.test(text) || ad.workType === "Casual") { add("Are you able to work weekends?"); add("Are you comfortable working a rotating roster?"); }
  if (/\b(customer|client|service|sales|reception)\b/.test(text)) add("Do you have experience working in a customer-facing role?");
  if (/\b(lead|manager|supervisor|team leader|senior)\b/.test(text)) add("Have you led or supervised a team before?");
  if (/\b(graduate|degree|bachelor|engineer|analyst|qualified)\b/.test(text)) add("Which of the following qualifications do you have?");
  const skills = adSkills(ad).filter(s => (SKILLS.find(k => k.name === s) || {}).kind === "hard").slice(0, 3).map(s => ({ cat: "Skills in your ad", text: `Do you have experience using ${s}?`, type: "yes" }));
  return [...out, ...skills].filter(l => !(ad.questions || []).some(q => q.text === l.text)).slice(0, 8);
}
function emAnsOk(q, a) {
  if (a === undefined || a === null || a === "") return false;
  if (q.type === "yes") return String(a) === ((q.ideal && q.ideal[0]) || "Yes");
  if (q.type === "choice") return (q.ideal || []).includes(a);
  if (q.type === "number") {
    const n = parseFloat(String(a).replace(/[^0-9.]/g, "")); if (isNaN(n)) return false;
    if (q.min !== "" && q.min != null && n < +q.min) return false;
    if (q.max !== "" && q.max != null && n > +q.max) return false;
    return true;
  }
  return true;
}
function emScreen(ad, app) {
  const qs = (ad && ad.questions) || [], ans = {};
  ((app && app.answers) || []).forEach(a => { ans[a.qid] = a.a; });
  const musts = qs.filter(q => q.must), failed = musts.filter(q => !emAnsOk(q, ans[q.id]));
  return { musts: musts.length, met: musts.length - failed.length, failed, total: qs.length, answered: qs.filter(q => ans[q.id] !== undefined && ans[q.id] !== "").length, ans };
}
function emStage(app, ad) {
  const st = emStore().status[emKey(app.candidate, app.jobId)];
  if (st) return emStageOf(st);
  return ad && ad.autoNS && emScreen(ad, app).failed.length ? "Not suitable" : "New";
}
// Everyone who applied, with the ad, their profile, fit, screening and stage worked out
function emPeople(filter) {
  const ads = emAds(), byId = Object.fromEntries(ads.map(a => [a.id, a]));
  return emApplicants().filter(a => byId[a.jobId] && (!filter || filter(a, byId[a.jobId]))).map(a => {
    const ad = byId[a.jobId], c = emCandidate(a.candidate), key = emKey(a.candidate, a.jobId);
    return { app: a, ad, c, key, fit: emFit(c, ad), scr: emScreen(ad, a), stage: emStage(a, ad), rating: emStore().ratings[key] || 0, unread: !emStore().seen[key] };
  });
}
const emNewCount = () => emPeople((a, ad) => emAdState(ad) !== "draft").filter(p => p.stage === "New" && p.unread).length;

/* --- Dialogs and a "how it went" line --- */
// emModal(title, bodyHTML, [{label, v, primary}], { validate(v, data, root) -> message | "" }) -> { v, data } or null
function emModal(title, body, buttons, opts = {}) {
  return new Promise(resolve => {
    const d = document.createElement("dialog");
    d.className = "emp-modal"; d.setAttribute("aria-label", title); d.setAttribute("data-nohelp", "");
    d.innerHTML = `<div class="emp-modal-in"><header><h2>${esc(title)}</h2><button type="button" class="emp-x" data-v="" aria-label="Close">×</button></header><div class="emp-modal-body">${body}<p class="status-line err" data-err role="alert"></p></div><footer>${buttons.map(b => `<button type="button" class="btn${b.primary ? " primary" : ""}${b.ghost ? " ghost" : ""}" data-v="${esc(b.v)}">${esc(b.label)}</button>`).join("")}</footer></div>`;
    document.body.appendChild(d);
    const data = () => { const o = {}; d.querySelectorAll("[name]").forEach(el => { if (el.type === "radio") { if (el.checked) o[el.name] = el.value; } else if (el.type === "checkbox") { (o[el.name] = o[el.name] || []); if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.value; }); return o; };
    let closed = false;
    const close = v => { if (closed) return; closed = true; const out = v ? { v, data: data() } : null; d.close(); d.remove(); resolve(out); };
    d.addEventListener("click", e => {
      const b = e.target.closest("[data-v]"); if (!b) return;
      const v = b.dataset.v;
      if (v && opts.validate) { const why = opts.validate(v, data(), d); if (why) { d.querySelector("[data-err]").textContent = why; return; } }
      close(v);
    });
    d.addEventListener("cancel", e => { e.preventDefault(); close(""); });
    d.showModal();
    if (opts.onMount) opts.onMount(d);
    const f = d.querySelector("[autofocus], input:not([type=hidden]), textarea, select"); if (f) f.focus();
  });
}
const emConfirm = (title, text, yes, danger) => emModal(title, `<p>${text}</p>`, [{ label: "Cancel", v: "", ghost: true }, { label: yes, v: "yes", primary: true }]).then(r => !!r);

/* --- Handlers: every page puts its buttons in data-em, inputs in data-emi and drop-downs in data-emc --- */
const emAct = {}, emIn = {}, emCh = {};
function emWire(root) {
  root.addEventListener("click", e => { const b = e.target.closest("[data-em]"); if (!b || !root.contains(b) || b.disabled) return; const f = emAct[b.dataset.em]; if (f) { if (b.tagName === "A" && !b.getAttribute("href")) e.preventDefault(); const r = f(b, e); if (r && r.catch) r.catch(err => console.error(err)); } });
  root.addEventListener("input", e => { const t = e.target.closest("[data-emi]"); if (t && emIn[t.dataset.emi]) emIn[t.dataset.emi](t, e); });
  root.addEventListener("change", e => { const t = e.target.closest("[data-emc]"); if (t && emCh[t.dataset.emc]) emCh[t.dataset.emc](t, e); });
}

/* --- Page furniture --- */
function emHead(title, sub, actions) {
  return `<header class="emp-head"><div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${actions ? `<div class="emp-head-acts">${actions}</div>` : ""}</header>`;
}
function emNoteBar() {
  const n = emModeNote(); if (!n) return "";
  return `<div class="emp-mode ${n.kind}" role="note"><span>${n.html}</span><button type="button" class="btn${n.kind === "demo" ? " primary" : ""}" data-em="${n.act[1]}">${esc(n.act[0])}</button></div>`;
}
const emLoading = () => `<p class="emp-loading" role="status">Loading your hiring account…</p>`;
const emEmpty = (title, text, btn) => `<div class="emp-empty"><svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="14" width="36" height="26" rx="4"/><path d="M17 14v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M6 25h36"/></svg><h2>${esc(title)}</h2>${text ? `<p>${text}</p>` : ""}${btn || ""}</div>`;
// A thin bar split into the stages (lightest = New, darkest = Accepted, grey = Not suitable)
function emPipeBar(counts) {
  const total = EM_STAGES.reduce((n, s) => n + (counts[s] || 0), 0);
  if (!total) return `<span class="emp-pipe none" aria-label="No candidates yet"></span>`;
  return `<span class="emp-pipe" role="img" aria-label="${esc(EM_STAGES.filter(s => counts[s]).map(s => `${counts[s]} ${s}`).join(", "))}">${EM_STAGES.map((s, i) => counts[s] ? `<i class="st-${i}" style="flex:${counts[s]}"></i>` : "").join("")}</span>`;
}
function emCounts(adId) {
  const c = {}; EM_STAGES.forEach(s => { c[s] = 0; });
  const ad = emAd(adId);
  emApplicants().filter(a => a.jobId === adId).forEach(a => { c[emStage(a, ad)]++; });
  return c;
}
function emNavBadge() {
  const n = $("emNavNew"); if (!n) return;
  const c = appMode === "employer" ? emNewCount() : 0;
  n.hidden = !c; n.textContent = c > 99 ? "99+" : String(c);
}

/* --- Showing the right page again when something changes --- */
const EM_PAGES = {};   // view name -> render function, filled in by each page's file
function emRefresh(force) {
  if (appMode !== "employer" || !EM_PAGES[currentView]) { emNavBadge(); return; }
  const a = document.activeElement, v = $("view-" + currentView);
  // don't redraw under someone who is typing, and never redraw the post-a-job form by itself
  if (!force && (currentView === "emp-post" || (a && v && v.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))) { emNavBadge(); return; }
  const y = window.scrollY;
  EM_PAGES[currentView]();
  if (force !== "top") window.scrollTo({ top: y });
  emNavBadge();
  if (typeof emDrawRefresh === "function") emDrawRefresh();
}
function emGo(view, opts) { openView(view, opts); }
