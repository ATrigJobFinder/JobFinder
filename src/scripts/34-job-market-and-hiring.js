/* ===================== Job market: shared jobs, talent pool, invitations and applications ===================== */
// Shared documents (everyone who can open Job Finder reads them; each person writes only their own):
//   jobs/<id>    an employer's company profile and job ads
//   talent/<id>  a job seeker's opt-in profile for employers to find
//   outbox/<id>  an employer's invitations to apply (toIds lists who they're for)
//   apps/<id>    a job seeker's applications to jobs posted here (employerIds lists who they're for)
//   feed/<id>    imported job listings (from the collector), written by the owner or editors
const market = { started: false, db: null, uid: null, user: null, canWrite: null, canEdit: false, employers: [], talent: [], invites: [], incoming: [], myApps: null, feed: [], outbox: null, myJobs: null, error: "" };
const hiring = privateDoc("hiring", "jobfinder.hiring.v1", () => ({ status: {}, notes: {} }));
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
    try { market.user = window.claude && window.claude.use ? await window.claude.use("user") : null; } catch { market.user = null; }
    if (market.user) { try { market.canWrite = await market.user.can("data.write"); } catch { market.canWrite = null; } try { market.canEdit = await market.user.canEdit(); } catch { market.canEdit = false; } }
    if (!market.db || !market.uid) return;
    const db = market.db, uid = market.uid;
    const live = (ref, fn) => { try { ref.onSnapshot(fn, e => { market.error = e && e.code; }); } catch (e) { market.error = "unavailable"; } };
    live(db.collection("jobs"), snap => { market.employers = snap.docs.filter(d => d.exists).map(d => ({ uid: d.id, ...JSON.parse(JSON.stringify(d.data())) })); market.myJobs = market.employers.find(e => e.uid === uid) || null; marketChanged(); });
    live(db.collection("talent"), snap => { market.talent = snap.docs.filter(d => d.exists).map(d => ({ uid: d.id, ...JSON.parse(JSON.stringify(d.data())) })).filter(t => t.visible !== false); marketChanged(); });
    live(db.collection("outbox").where("toIds", "array-contains", uid), snap => { market.invites = snap.docs.flatMap(d => ((d.data() || {}).invites || []).filter(i => i.to === uid).map(i => ({ ...i, from: d.id }))); marketChanged(); });
    live(db.collection("apps").where("employerIds", "array-contains", uid), snap => { market.incoming = snap.docs.flatMap(d => ((d.data() || {}).items || []).filter(i => i.employerId === uid).map(i => ({ ...i, candidate: d.id, name: (d.data() || {}).name }))); marketChanged(); });
    live(db.doc("apps/" + uid), snap => { market.myApps = snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null; marketChanged(); });
    live(db.doc("outbox/" + uid), snap => { market.outbox = snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null; marketChanged(); });
    try {
      const feeders = await db.collection("feed").get();
      for (const f of feeders.docs) {
        const chunks = await db.collection("feed/" + f.id + "/chunks").get();
        for (const c of chunks.docs) market.feed.push(...(((c.data() || {}).jobs) || []));
      }
    } catch { /* no feed yet */ }
    marketChanged();
  })();
  return market.ready;
}
let mkTimer = null;
function marketChanged() { clearTimeout(mkTimer); mkTimer = setTimeout(() => { if (currentView === "jobs") renderJobs(); if (currentView === "employer") renderEmployer(); if (currentView === "home") renderHome(); }, 120); }
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
  const site = market.employers.flatMap(e => (e.jobs || []).filter(j => j.status !== "closed" && j.status !== "draft").map(j => ({ ...j, company: (e.employer || {}).name || "Employer", employerUid: e.uid, key: e.uid + ":" + j.id, source: "Job Finder", sourceType: "site", url: "" })));
  const feed = market.feed.map(j => ({ ...j, url: safeUrl(j.url), sourceType: j.sourceType || "aggregator", also: (j.also || []).map(a => ({ ...a, url: safeUrl(a.url) })) }));
  const mine = T().filter(i => i.title && (i.jd || i.url)).map(i => ({ id: "t" + i.id, trackerId: i.id, title: i.title, company: i.company, location: i.location, url: safeUrl(i.url), description: i.jd, source: "Saved by you", sourceType: "user", posted: (i.created || "").slice(0, 10) }));
  // imported listings come from the jobs database (see 34b); made-up examples only show when there's no database or nothing real yet
  const real = [...site, ...feed], fromDb = dbFeed();
  const list = real.length || fromDb.length || dbJobs.ready ? [...real, ...mine] : [...EXAMPLE_JOBS, ...mine];
  // the database already shows one listing per duplicate group, so only the other sources are merged here
  return [...DEDUP.cluster(list), ...fromDb];
}
function jobMatch(j) {
  const p = P();
  const mine = new Set([...skillSet(hasProfile(p) ? profileToText(p) : els.resume.value), ...[...p.skills.hard, ...p.skills.software].flatMap(s => [...skillSet(s)])]);
  const want = (j.skills && j.skills.length ? j.skills : [...skillSet([j.title, j.description].join("\n"))]).filter(s => (SKILLS.find(k => k.name === s) || {}).kind === "hard");
  if (!want.length || !mine.size) return null;
  const have = want.filter(s => mine.has(s));
  const titleBonus = p.target.title && similarity(zoneKey(p.target.title), zoneKey(j.title)) >= 0.4 ? 15 : 0;
  return { pct: Math.min(100, Math.round(have.length / want.length * 85) + titleBonus), have, missing: want.filter(s => !mine.has(s)) };
}
const jobsUI = { q: "", where: "", type: "", remote: "", source: "", sort: "match", open: null, applyFor: null, limit: 40 };
function jobFilters(list) {
  const q = jobsUI.q.toLowerCase(), w = jobsUI.where.toLowerCase();
  // listings from the database were already searched there (full-text, state and type), so only the other filters apply to them
  return list.filter(j => (j.fromDb || ((!q || [j.title, j.company, j.description].join(" ").toLowerCase().includes(q))
    && (!w || [j.location, j.remote].join(" ").toLowerCase().includes(w) || (w === "remote" && /remote/i.test(j.location + " " + j.remote)))
    && (!jobsUI.type || j.workType === jobsUI.type)
    && (!jobsUI.remote || (j.remote || "").toLowerCase() === jobsUI.remote.toLowerCase())))
    && (!jobsUI.source || (jobsUI.source === "site" ? j.sourceType === "site" : jobsUI.source === "user" ? (j.sourceType === "user" || j.also.some(a => a.sourceType === "user")) : j.sourceType !== "site" && j.sourceType !== "user")));
}
function renderJobs() {
  const box = $("jbList");
  if (!box) return;
  const merged = allJobs();
  for (const j of merged) j.m = jobMatch(j);
  const total = merged.reduce((a, j) => a + 1 + j.also.length, 0), dupes = total - merged.length;
  const list = jobFilters(merged).sort((a, b) => jobsUI.sort === "new" ? String(b.posted || "").localeCompare(String(a.posted || "")) : ((b.m ? b.m.pct : -1) - (a.m ? a.m.pct : -1)));
  const examples = merged.some(j => j.example);
  $("jbSummary").innerHTML = `${list.length} job${list.length === 1 ? "" : "s"}${dupes ? `. <b>${dupes} duplicate${dupes === 1 ? "" : "s"} merged</b> from ${total} listings` : ""}.${examples ? ' <span class="tag">Examples</span> These are made-up listings to show how it works, until employers post jobs or listings are imported.' : ""}`;
  $("jbNote").textContent = ""; $("jbNote").hidden = true;   // (the note about posting and applications is for the hiring pages)
  const myApplied = new Set(((market.myApps || {}).items || []).map(i => i.jobKey));
  const tracked = key => T().find(i => DEDUP.same(DEDUP.prep({ title: i.title, company: i.company, location: i.location }), DEDUP.prep(key)));
  // keep the open job on the page even if it's past the limit
  const openIx = list.findIndex(j => (j.key || j.id) === jobsUI.open);
  if (openIx >= jobsUI.limit) jobsUI.limit = openIx + 1;
  // on a wide screen an opened job shows beside the list, not inside it
  const wide = matchMedia("(min-width: 900px)").matches;
  const cardsHtml = list.slice(0, jobsUI.limit).map(j => {
    const tr = tracked(j), m = j.m, open = jobsUI.open === (j.key || j.id);
    return `<article class="job${open ? " open" : ""}" data-job="${esc(j.key || j.id)}">
      <button type="button" class="job-main" data-jb="open" aria-expanded="${open}"><span class="job-title">${esc(j.title)}</span><span class="job-co">${esc(j.company || "")}${j.location ? ` · ${esc(j.location)}` : ""}</span>
        <span class="job-meta">${[j.workType, j.remote, j.salary].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}${j.posted ? `<span>Posted ${fmtDay(j.posted)}</span>` : ""}</span></button>
      <div class="job-side">${m && m.pct > 0 ? `<span class="job-match ${m.pct >= 70 ? "hi" : m.pct >= 45 ? "mid" : "lo"}">${m.pct}% match</span>` : ""}<span class="job-src">${j.srcUrl ? `<a href="${esc(j.srcUrl)}" target="_blank" rel="noopener">${esc(j.source)}</a>` : esc(j.source)}${j.also.length ? ` + ${j.also.length} more` : ""}</span>${j.example ? '<span class="tag">Example</span>' : ""}${myApplied.has(j.key) ? '<span class="chip found">Applied</span>' : tr ? `<span class="chip found">${esc((STAGES_T.find(s => s.key === tr.stage) || {}).label)}</span>` : ""}</div>
      ${open && !wide ? jobDetail(j, tr, myApplied.has(j.key)) : ""}
    </article>`;
  }).join("") + (list.length > jobsUI.limit ? `<button class="btn" type="button" id="jbMore">Show more (${list.length - jobsUI.limit} left)</button>` : "");
  const openJ = wide ? list.find(j => (j.key || j.id) === jobsUI.open) : null;
  if (openJ) {
    const k = openJ.key || openJ.id;
    box.innerHTML = `<div class="jb-split"><div class="jb-split-list">${cardsHtml}</div><aside class="jb-split-detail" data-job="${esc(k)}" aria-label="Job details"><div class="jb-dh"><div><h2>${esc(openJ.title)}</h2><p>${esc(openJ.company || "")}${openJ.location ? ` · ${esc(openJ.location)}` : ""}</p><p class="job-meta">${[openJ.workType, openJ.remote, openJ.salary].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}${openJ.posted ? `<span>Posted ${fmtDay(openJ.posted)}</span>` : ""}</p></div><button class="linkish" type="button" data-jb="open">Close</button></div>${jobDetail(openJ, tracked(openJ), myApplied.has(openJ.key))}</aside></div>`;
  } else box.innerHTML = cardsHtml || `<p class="empty">No jobs match those filters.</p>`;
  renderTalentCard();
  renderInvites();
  renderDbExtras(list);
}
function jobDetail(j, tr, applied) {
  const m = j.m;
  return `<div class="job-detail">
    ${m ? `<div class="job-skills">${m.have.length ? `<span class="small">You have:</span>${m.have.map(s => `<span class="chip found">${esc(s)}</span>`).join("")}` : ""}${m.missing.length ? `<span class="small">You're missing:</span>${m.missing.map(s => `<span class="chip missing">${esc(s)}</span>`).join("")}` : ""}</div>` : ""}
    <p class="job-desc">${esc(j.description || "No description.")}</p>
    ${j.requirements && j.requirements.length ? `<ul class="small">${j.requirements.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
    ${j.also.length ? `<p class="small muted">Also listed on: ${j.also.map(a => a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.source)}</a>` : esc(a.source)).join(", ")}. Shown once here.</p>` : ""}
    ${j.example ? `<p class="small muted">This is a made-up example listing.</p>` : ""}
    <div class="b-actions">
      ${j.sourceType === "site" ? (applied ? `<span class="chip found">You've applied</span>` : `<button class="btn primary" type="button" data-jb="apply">Apply on Job Finder</button>`) : j.url && !j.example ? `<a class="btn primary" href="${esc(j.url)}" target="_blank" rel="noopener" data-jb="ext">Apply on ${esc(j.source)} ↗</a>` : ""}
      <button class="btn" type="button" data-jb="tailor">Tailor my resume to it</button>
      ${tr ? `<a class="btn" href="#tracker">In Application tracker: ${esc((STAGES_T.find(s => s.key === tr.stage) || {}).label)}</a>` : `<button class="btn" type="button" data-jb="save">Save to Application tracker</button>`}
      <button class="btn ghost" type="button" data-jb="prep">Practise interview questions</button>
    </div>
    ${jobsUI.applyFor === (j.key || j.id) ? applyForm(j) : ""}
  </div>`;
}
function talentFromProfile() {
  const p = P();
  return { name: p.contact.name, headline: p.target.title || (p.experience[0] || {}).title || "", location: p.contact.location, summary: p.summary.slice(0, 600), skills: [...new Set([...p.skills.hard, ...p.skills.software, ...p.skills.certs])].slice(0, 30), titles: p.experience.filter(e => e.title).slice(0, 4).map(e => `${e.title}${e.org ? ` at ${e.org}` : ""}`), education: p.education.filter(e => e.degree).slice(0, 2).map(e => `${e.degree}${e.inst ? `, ${e.inst}` : ""}${e.current ? " (studying)" : ""}`), workRights: p.contact.workRights, stage: p.target.stage, jobType: p.target.jobType };
}
function applyForm(j) {
  const t = market.talent.find(x => x.uid === market.uid);
  return `<form class="apply-form" data-apply="${esc(j.key)}"><h3>Apply for ${esc(j.title)}</h3>
    ${!t ? `<p class="small">Applying shares your Job Finder profile with ${esc(j.company)}: ${esc([talentFromProfile().name, talentFromProfile().headline].filter(Boolean).join(", ") || "add your details in the resume builder first")}.</p>` : ""}
    <label class="field" for="apNote">A short note to the employer <span class="muted">(optional)</span><textarea id="apNote" rows="3" placeholder="Why you're interested, in two or three sentences"></textarea></label>
    <label class="q-check"><input type="checkbox" id="apResume" checked> Include my resume from the resume builder</label>
    <p class="small muted">On this prototype, applications are stored where other people using this Job Finder could technically read them. Don't include anything you wouldn't put on a resume.</p>
    <div class="b-actions"><button class="btn primary" type="submit">Send my application</button><button class="btn ghost" type="button" data-jb="cancel">Cancel</button></div>${statusHTML("apStatus", "status-line", "p")}</form>`;
}
async function submitApplication(form, j) {
  if (!canPost()) { say("apStatus", shareNote(), true); return; }
  const p = P();
  if (!hasProfile(p)) { say("apStatus", "Add your details in the resume builder first, so the employer can see who you are.", true); return; }
  const doc = market.db.doc("apps/" + market.uid);
  const cur = market.myApps || { items: [], employerIds: [] };
  const item = { jobKey: j.key, employerId: j.employerUid, jobId: j.id, title: j.title, company: j.company, note: $("apNote").value.trim().slice(0, 1200), resume: $("apResume").checked ? profileToText(p).slice(0, 12000) : "", applied: new Date().toISOString() };
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
function renderTalentCard() {
  const box = $("jbTalent"); if (!box) return;
  const me = market.talent.find(x => x.uid === market.uid);
  const prof = talentFromProfile();
  box.innerHTML = `<h2>Let employers find you</h2>
    <p class="small">${me ? "You're in the talent pool. Employers using Job Finder can see:" : "Join the talent pool and employers using Job Finder can invite you to apply. They'll see:"}</p>
    <ul class="small talent-preview"><li><b>${esc(prof.name || "Your name")}</b>${prof.headline ? `, ${esc(prof.headline)}` : ""}${prof.location ? ` · ${esc(prof.location)}` : ""}</li>${prof.skills.length ? `<li>Skills: ${esc(prof.skills.slice(0, 10).join(", "))}${prof.skills.length > 10 ? "…" : ""}</li>` : ""}${prof.titles.length ? `<li>Experience: ${esc(prof.titles.join("; "))}</li>` : ""}${prof.education.length ? `<li>Education: ${esc(prof.education.join("; "))}</li>` : ""}</ul>
    <p class="small muted">Not your phone or email: employers contact you through invitations. You can hide your profile at any time.</p>
    <div class="b-actions">${!hasProfile(P()) ? `<a class="btn" href="#builder">Add my details first</a>` : me && me.visible !== false ? `<button class="btn" type="button" data-tp="update">Update my profile</button><button class="btn ghost" type="button" data-tp="hide">Hide me</button>` : `<button class="btn primary" type="button" data-tp="join"${canPost() ? "" : " disabled"}>Join the talent pool</button>`}</div>${statusHTML("tpStatus", "status-line", "p")}`;
}
function renderInvites() {
  const box = $("jbInvites"); if (!box) return;
  const inv = market.invites;
  box.hidden = !inv.length;
  box.innerHTML = inv.length ? `<h2>Invitations to apply</h2><ul class="inv-list">${inv.map(i => `<li><p><b>${esc(i.company || "An employer")}</b> invited you to apply for <b>${esc(i.title || "a job")}</b>.</p>${i.message ? `<p class="small">“${esc(i.message)}”</p>` : ""}<button class="btn" type="button" data-inv="${esc(i.from + ":" + i.jobId)}">View the job</button></li>`).join("")}</ul>` : "";
}

/* --- Employer: company profile, job ads, candidates, applicants --- */
const emUI = { tab: lsGet("jobfinder.emtab.v1") || "jobs", edit: null, forJob: "", q: "" };
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
function candidateMatch(c, job) {
  const want = adSkills(job);
  const have = new Set([...skillSet([c.headline, c.summary, (c.skills || []).join(", "), (c.titles || []).join("; ")].join("\n"))]);
  const hit = want.filter(s => have.has(s));
  const t = similarity(zoneKey(job.title), zoneKey([c.headline, ...(c.titles || [])].join(" "))) >= 0.3 ? 15 : 0;
  const loc = job.remote === "Remote" || !job.location || !c.location || DEDUP.place(job.location) === DEDUP.place(c.location) ? 10 : 0;
  return { pct: want.length ? Math.min(100, Math.round(hit.length / want.length * 75) + t + loc) : t + loc, hit, missing: want.filter(s => !have.has(s)) };
}
function myCompany() { return (market.myJobs && market.myJobs.employer) || { name: "", website: "", location: "", about: "" }; }
function myAds() { return (market.myJobs && market.myJobs.jobs) || []; }
async function saveEmployer(employer, jobs, st) {
  if (!canPost()) { say(st, shareNote(), true); return false; }
  const body = { employer, jobs: jobs.slice(0, 30).map(j => ({ ...j, summary: String(j.summary || "").slice(0, 3000) })), updated: new Date().toISOString() };
  const ok = await safeWrite(() => market.db.doc("jobs/" + market.uid).set(body), st);
  if (ok) { market.myJobs = { uid: market.uid, ...body }; const i = market.employers.findIndex(e => e.uid === market.uid); if (i >= 0) market.employers[i] = market.myJobs; else market.employers.push(market.myJobs); }
  return ok;
}
function renderEmployer() {
  const box = $("emBody"); if (!box) return;
  document.querySelectorAll("[data-emtab]").forEach(b => { const on = b.dataset.emtab === emUI.tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
  $("emNote").textContent = shareNote(); $("emNote").hidden = !shareNote();
  if (emUI.tab === "jobs") box.innerHTML = emJobsHTML();
  else if (emUI.tab === "people") box.innerHTML = emPeopleHTML();
  else box.innerHTML = emApplicantsHTML();
  if (emUI.tab === "jobs" && emUI.edit) renderAdChecks();
}
function emJobsHTML() {
  const co = myCompany(), ads = myAds();
  const edit = emUI.edit;
  const list = (k, label, hint) => `<label class="field" for="ad-${k}">${label}<textarea id="ad-${k}" data-ad="${k}" data-list="1" rows="3" placeholder="${esc(hint)}">${esc((edit[k] || []).join("\n"))}</textarea></label>`;
  const coForm = `<div class="q-grid"><label class="field" for="co-name">Company name<input type="text" id="co-name" data-co="name" value="${esc(co.name)}"></label><label class="field" for="co-website">Website<input type="url" id="co-website" data-co="website" value="${esc(co.website)}" placeholder="https://"></label><label class="field" for="co-location">Location<input type="text" id="co-location" data-co="location" value="${esc(co.location)}"></label><label class="field wide" for="co-about">About the company<textarea id="co-about" data-co="about" rows="3" placeholder="Two or three sentences candidates will read on every ad">${esc(co.about)}</textarea></label></div>
      <div class="b-actions"><button class="btn${co.name ? "" : " primary"}" type="button" data-em="save-co">Save company</button></div>`;
  return `${co.name ? `<details class="panel co-panel"><summary><span><span class="small muted">Your company</span><b>${esc(co.name)}</b>${co.location ? `<span class="small muted"> · ${esc(co.location)}</span>` : ""}</span><span class="linkish">Edit</span></summary>${coForm}</details>` : `<section class="panel" aria-labelledby="coH"><div class="panel-head"><h2 id="coH">Your company</h2><p>Start here. It's shown on every job you post.</p></div>${coForm}</section>`}
    ${statusHTML("coStatus", "status-line", "p")}
    <section class="panel" aria-labelledby="adsH"><div class="panel-head"><h2 id="adsH">Your jobs</h2><button class="btn primary" type="button" data-em="new">+ Post a job</button></div>
      ${ads.length ? `<ul class="em-ads">${ads.map(a => { const n = market.incoming.filter(i => i.jobId === a.id).length; const pool = market.talent.filter(c => c.uid !== market.uid && candidateMatch(c, a).pct >= 50).length; return `<li><div><b>${esc(a.title)}</b> <span class="small muted">${esc(a.location)} · ${esc(a.workType)} · ${a.status === "open" ? "Open" : a.status === "draft" ? "Draft" : "Closed"}</span><div class="small">${n} applicant${n === 1 ? "" : "s"} · ${pool} strong match${pool === 1 ? "" : "es"} in the talent pool</div></div><div class="b-actions"><button class="btn" type="button" data-em="edit" data-id="${a.id}">Edit</button><button class="btn" type="button" data-em="find" data-id="${a.id}">Find candidates</button>${n ? `<button class="btn" type="button" data-em="apps" data-id="${a.id}">Applicants</button>` : ""}</div></li>`; }).join("")}</ul>` : `<p class="small muted">No jobs posted yet.</p>`}
    </section>
    ${edit ? `<section class="panel em-edit" aria-labelledby="edH"><div class="panel-head"><h2 id="edH">${ads.some(a => a.id === edit.id) ? "Edit job" : "Post a job"}</h2><p>Write it yourself, or jot down notes and let AI draft it. Either way it's checked for clarity and inclusive language.</p></div>
      <div class="q-grid"><label class="field" for="ad-title">Job title<input type="text" id="ad-title" data-ad="title" value="${esc(edit.title)}"></label><label class="field" for="ad-location">Location<input type="text" id="ad-location" data-ad="location" value="${esc(edit.location)}" placeholder="e.g. Brisbane, QLD"></label>
        <label class="field" for="ad-workType">Work type<select id="ad-workType" data-ad="workType">${["Full time", "Part time", "Casual", "Contract", "Internship", "Graduate program"].map(x => `<option${x === edit.workType ? " selected" : ""}>${x}</option>`).join("")}</select></label><label class="field" for="ad-remote">Where<select id="ad-remote" data-ad="remote">${["On-site", "Hybrid", "Remote"].map(x => `<option${x === edit.remote ? " selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="field" for="ad-salary">Pay<input type="text" id="ad-salary" data-ad="salary" value="${esc(edit.salary)}" placeholder="e.g. $75,000 to $82,000 + super"></label><label class="field" for="ad-closes">Applications close<input type="date" id="ad-closes" data-ad="closes" value="${esc(edit.closes)}"></label></div>
      <label class="field" for="ad-notes">Notes for the ad <span class="q-hint">Optional. Jot down the duties, must-haves and what you offer, in any words, then draft it.</span><textarea id="ad-notes" data-ad="notes" rows="3">${esc(edit.notes || "")}</textarea></label>
      <div class="b-actions"><button class="btn" type="button" data-em="draft">Draft the ad from my notes</button>${statusHTML("adEngine", "engine-note")}</div>
      <label class="field" for="ad-summary">Summary<textarea id="ad-summary" data-ad="summary" rows="3">${esc(edit.summary)}</textarea></label>
      <div class="q-grid">${list("duties", "What they'll do", "One per line")}${list("musts", "What they'll need", "Essentials only, one per line")}${list("nices", "Nice to have", "One per line")}${list("offer", "What you offer", "Pay extras, flexibility, training… one per line")}</div>
      <div class="em-checks" id="adChecks" aria-live="polite"></div>
      <div class="b-actions"><button class="btn primary" type="button" data-em="publish">${edit.status === "draft" || !ads.some(a => a.id === edit.id) ? "Post the job" : "Save changes"}</button>${ads.some(a => a.id === edit.id) ? `<button class="btn" type="button" data-em="close-ad">${edit.status === "closed" ? "Reopen" : "Close the job"}</button>` : ""}<button class="btn ghost" type="button" data-em="cancel">Cancel</button>${statusHTML("adStatus")}</div>
    </section>` : ""}`;
}
function renderAdChecks() { const box = $("adChecks"); if (box && emUI.edit) box.innerHTML = `<h3>Ad check</h3><ul>${checkAd(emUI.edit).map(([k, m]) => `<li class="${k}">${esc(m)}</li>`).join("")}</ul>`; }
function emPeopleHTML() {
  const ads = myAds(), job = ads.find(a => a.id === emUI.forJob) || ads[0];
  const pool = market.talent.filter(c => c.uid !== market.uid);
  const q = emUI.q.toLowerCase();
  const scored = pool.map(c => ({ c, m: job ? candidateMatch(c, job) : { pct: 0, hit: [], missing: [] } })).filter(x => !q || JSON.stringify(x.c).toLowerCase().includes(q)).sort((a, b) => b.m.pct - a.m.pct);
  const strong = scored.filter(x => x.m.pct >= 60).length;
  const gaps = {};
  scored.slice(0, 10).forEach(x => x.m.missing.forEach(s => { gaps[s] = (gaps[s] || 0) + 1; }));
  const topGaps = Object.entries(gaps).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const invited = new Set(((market.outbox || {}).invites || []).map(i => i.to + ":" + i.jobId));
  return `<section class="panel" aria-labelledby="ppH"><div class="panel-head"><h2 id="ppH">Find candidates</h2><p>People who've joined the talent pool, including those who haven't applied to you.</p></div>
    <div class="q-grid"><label class="field" for="em-job">Match against<select id="em-job" data-emf="forJob">${ads.length ? ads.map(a => `<option value="${a.id}"${job && a.id === job.id ? " selected" : ""}>${esc(a.title)}</option>`).join("") : "<option value=''>Post a job first</option>"}</select></label><label class="field" for="em-q">Search<input type="text" id="em-q" data-emf="q" value="${esc(emUI.q)}" placeholder="Skill, title or location"></label></div>
    <div class="iv-stats"><div class="iv-stat"><b>${pool.length}</b><span>${pool.length === 1 ? "person" : "people"} in the talent pool</span></div><div class="iv-stat"><b>${strong}</b><span>strong matches (60%+)</span></div>${topGaps.length ? `<div class="iv-stat wide-stat"><b>${topGaps.map(([s]) => esc(s)).join(", ")}</b><span>skills most of your top matches are missing</span></div>` : ""}</div>
    ${scored.length ? `<ul class="cand-list">${scored.slice(0, 40).map(({ c, m }) => `<li class="cand"><div class="cand-main"><div><b>${esc(c.name || "Candidate")}</b>${c.headline ? ` · ${esc(c.headline)}` : ""}</div><div class="small muted">${esc([c.location, c.workRights].filter(Boolean).join(" · "))}</div>${c.titles && c.titles.length ? `<div class="small">${esc(c.titles.join("; "))}</div>` : ""}<div class="chips">${m.hit.slice(0, 8).map(s => `<span class="chip found">${esc(s)}</span>`).join("")}${m.missing.slice(0, 4).map(s => `<span class="chip missing">${esc(s)}</span>`).join("")}</div></div>
      <div class="cand-side">${job ? `<span class="job-match ${m.pct >= 70 ? "hi" : m.pct >= 45 ? "mid" : "lo"}">${m.pct}% match</span>` : ""}${job ? (invited.has(c.uid + ":" + job.id) ? `<span class="chip found">Invited</span>` : `<button class="btn" type="button" data-em="invite" data-to="${esc(c.uid)}">Invite to apply</button>`) : ""}</div></li>`).join("")}</ul>` : `<p class="small muted">${pool.length ? "Nobody matches that search." : "Nobody has joined the talent pool yet. When job seekers opt in from Find jobs, they'll appear here."}</p>`}
    ${statusHTML("invStatus", "status-line", "p")}</section>`;
}
function emApplicantsHTML() {
  const ads = myAds(), apps = market.incoming;
  const st = hiring.data.status;
  if (!apps.length) return `<section class="panel"><h2>Applicants</h2><p class="small muted">No applications yet. Invite people from Find candidates, or share your jobs.</p></section>`;
  return ads.filter(a => apps.some(x => x.jobId === a.id)).map(a => `<section class="panel" aria-label="Applicants for ${esc(a.title)}"><div class="panel-head"><h2>${esc(a.title)}</h2><p>${apps.filter(x => x.jobId === a.id).length} applicant(s)</p></div>
    <ul class="cand-list">${apps.filter(x => x.jobId === a.id).map(x => { const c = market.talent.find(t => t.uid === x.candidate) || { name: x.name }; const m = candidateMatch(c, a); const key = x.candidate + ":" + a.id; return `<li class="cand"><div class="cand-main"><div><b>${esc(c.name || x.name || "Candidate")}</b>${c.headline ? ` · ${esc(c.headline)}` : ""}</div><div class="small muted">Applied ${fmtDay((x.applied || "").slice(0, 10))}</div>${x.note ? `<p class="small">“${esc(x.note)}”</p>` : ""}${x.resume ? `<details><summary class="small">Resume</summary><pre class="li-pre">${esc(x.resume)}</pre></details>` : ""}</div>
      <div class="cand-side"><span class="job-match ${m.pct >= 70 ? "hi" : m.pct >= 45 ? "mid" : "lo"}">${m.pct}% match</span><label class="visually-hidden" for="hs-${esc(key)}">Status</label><select id="hs-${esc(key)}" data-hs="${esc(key)}">${["New", "Shortlisted", "Interview", "Offer", "Not progressing"].map(s => `<option${(st[key] || "New") === s ? " selected" : ""}>${s}</option>`).join("")}</select></div></li>`; }).join("")}</ul></section>`).join("");
}
async function draftAd() {
  const e = emUI.edit, btn = document.querySelector('[data-em="draft"]');
  if (!(e.notes || "").trim() && !e.title) { say("adEngine", "Add a job title and a few notes first.", true); return; }
  btn.disabled = true;
  const src = [e.title, e.notes, e.location, e.salary, myCompany().about].join("\n");
  const r = await aiJSON({ nano: JOBAD_NANO, prompt: `Company: ${myCompany().name || "(not given)"}\nAbout the company: ${myCompany().about || "(not given)"}\nJob title: ${e.title}\nLocation: ${e.location || "(not given)"}\nWork type: ${e.workType}, ${e.remote}\nPay: ${e.salary || "(not given: don't mention pay)"}\nEmployer's notes:\n${e.notes}`, schema: JOBAD_SCHEMA, label: "Drafting the ad", progress: m => say("adEngine", m),
    check: d => { const all = [d.summary, ...(d.duties || []), ...(d.musts || []), ...(d.nices || []), ...(d.offer || [])].join("\n"); const why = factCheck(all, src, { min: 40 }); return why ? { ok: false, why } : { ok: true, value: d }; } });
  btn.disabled = false;
  if (!r.data) {
    // no AI: sort the notes into sections by their wording
    const lines = listOf(String(e.notes || "").replace(/\n/g, ";"));
    const tidy = l => { const t = l.replace(/^(you )?(must have|must be|must|need(s)? to have|needs?|required|essential|nice to have|bonus|desirable|ideally|we offer|we provide|we'll provide|offer|benefits?)\b[:\s-]*/i, "").trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
    const isMust = l => /\b(must|need|require|essential)/i.test(l), isNice = l => /\b(nice to have|bonus|desirable|ideally)/i.test(l), isOffer = l => /\b(we offer|offer|benefit|we provide|flexib|training|leave|salary|super\b)/i.test(l);
    e.musts = lines.filter(l => isMust(l) && !isNice(l)).map(tidy);
    e.nices = lines.filter(isNice).map(tidy);
    e.offer = lines.filter(l => isOffer(l) && !isMust(l) && !isNice(l)).map(tidy);
    e.duties = lines.filter(l => !isMust(l) && !isNice(l) && !isOffer(l)).map(tidy);
    if (!e.summary) e.summary = `${myCompany().name || "We"} ${myCompany().name ? "is" : "are"} looking for ${aOrAn(e.title)} ${e.title}${e.location ? ` in ${e.location}` : ""}.`;
    say("adEngine", r.rejected ? "The AI's draft added things that weren't in your notes, so your notes were sorted into sections instead." : "No AI here, so your notes were sorted into sections. Edit them below.");
  } else { Object.assign(e, { summary: r.data.summary, duties: r.data.duties, musts: r.data.musts, nices: r.data.nices, offer: r.data.offer }); say("adEngine", `Drafted by ${viaWords(r.via)} from your notes. Check it before posting.`); }
  renderEmployer();
}
onInit(() => {
  $("view-jobs").addEventListener("input", e => { const f = e.target.dataset.jbf; if (f) { jobsUI[f] = e.target.value; jobsUI.limit = 40; clearTimeout(jobsUI.t); jobsUI.t = setTimeout(renderJobs, 150); } });
  $("view-jobs").addEventListener("change", e => { const f = e.target.dataset.jbf; if (f) { jobsUI[f] = e.target.value; renderJobs(); } });
  $("view-jobs").addEventListener("click", async e => {
    const tp = e.target.closest("[data-tp]");
    if (tp) {
      if (!canPost()) { say("tpStatus", shareNote(), true); return; }
      const body = { ...talentFromProfile(), visible: tp.dataset.tp !== "hide", updated: new Date().toISOString() };
      if (await safeWrite(() => market.db.doc("talent/" + market.uid).set(body), "tpStatus")) { const i = market.talent.findIndex(x => x.uid === market.uid); if (body.visible) { if (i >= 0) market.talent[i] = { uid: market.uid, ...body }; else market.talent.push({ uid: market.uid, ...body }); } else if (i >= 0) market.talent.splice(i, 1); say("tpStatus", body.visible ? "Done. Employers can now find you." : "Hidden. Employers can no longer see your profile."); renderTalentCard(); }
      return;
    }
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
    else if (a === "prep") { els.jd.value = els.jd.value || j.description; openView("interview"); }
  });
  $("view-jobs").addEventListener("submit", e => { const f = e.target.closest("[data-apply]"); if (!f) return; e.preventDefault(); const j = allJobs().find(x => x.key === f.dataset.apply); if (j) submitApplication(f, j); });
  $("jbFeedBtn").addEventListener("click", () => $("jbFeedFile").click());
  $("jbFeedFile").addEventListener("change", async () => { const f = $("jbFeedFile").files[0]; $("jbFeedFile").value = ""; if (f) await importFeed(f); });
  // employer
  document.querySelectorAll("[data-emtab]").forEach(b => b.addEventListener("click", () => { emUI.tab = b.dataset.emtab; lsSet("jobfinder.emtab.v1", emUI.tab); renderEmployer(); }));
  const em = $("view-employer");
  em.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.ad && emUI.edit) { emUI.edit[t.dataset.ad] = t.dataset.list ? t.value.split("\n").map(s => s.replace(BULLET_RE, "").trim()).filter(Boolean) : t.value; clearTimeout(emUI.t); emUI.t = setTimeout(renderAdChecks, 250); }
    if (t.dataset.emf === "q") { emUI.q = t.value; clearTimeout(emUI.t2); emUI.t2 = setTimeout(() => { const pos = t.selectionStart; renderEmployer(); const n = $("em-q"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 300); }
  });
  em.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.ad && emUI.edit && !t.dataset.list) { emUI.edit[t.dataset.ad] = t.value; renderAdChecks(); }
    if (t.dataset.emf === "forJob") { emUI.forJob = t.value; renderEmployer(); }
    if (t.dataset.hs) { hiring.data.status[t.dataset.hs] = t.value; hiring.save(); }
  });
  em.addEventListener("click", async e => {
    const b = e.target.closest("[data-em]"); if (!b) return;
    const a = b.dataset.em, ads = myAds().slice();
    if (a === "save-co") { const co = { ...myCompany() }; document.querySelectorAll("[data-co]").forEach(f => { co[f.dataset.co] = f.value.trim(); }); if (!co.name) { say("coStatus", "Add your company name.", true); return; } if (await saveEmployer(co, ads, "coStatus")) { say("coStatus", "Saved."); renderEmployer(); } }
    else if (a === "new") { emUI.edit = { ...emptyJobAd(), location: myCompany().location }; renderEmployer(); $("ad-title").focus(); }
    else if (a === "edit") { emUI.edit = JSON.parse(JSON.stringify(ads.find(x => x.id === b.dataset.id))); renderEmployer(); $("ad-title").focus(); }
    else if (a === "cancel") { emUI.edit = null; renderEmployer(); }
    else if (a === "draft") draftAd();
    else if (a === "publish" || a === "close-ad") {
      const ed = emUI.edit;
      if (!ed.title.trim()) { say("adStatus", "Add a job title.", true); $("ad-title").focus(); return; }
      if (!myCompany().name) { say("adStatus", "Add your company name above first, and save it.", true); $("co-name").focus(); return; }
      if (a === "close-ad") ed.status = ed.status === "closed" ? "open" : "closed"; else if (ed.status === "draft") ed.status = "open";
      ed.skills = adSkills(ed).slice(0, 20);
      ed.description = jobAdText(ed);
      const next = ads.filter(x => x.id !== ed.id); next.unshift(ed);
      if (await saveEmployer(myCompany(), next, "adStatus")) { emUI.edit = null; say("coStatus", a === "close-ad" ? (ed.status === "closed" ? `Closed “${ed.title}”.` : `Reopened “${ed.title}”.`) : `Posted “${ed.title}”. It's now in Find jobs.`); renderEmployer(); }
    }
    else if (a === "find") { emUI.tab = "people"; emUI.forJob = b.dataset.id; renderEmployer(); }
    else if (a === "apps") { emUI.tab = "applicants"; renderEmployer(); }
    else if (a === "invite") {
      const job = ads.find(x => x.id === ($("em-job") || {}).value) || ads[0];
      if (!job || !canPost()) { say("invStatus", shareNote() || "Post a job first.", true); return; }
      const cur = market.outbox || { invites: [], toIds: [] };
      const inv = { id: uid8(), to: b.dataset.to, jobId: job.id, title: job.title, company: myCompany().name, message: `We think you'd be a good fit for our ${job.title} role. Have a look and apply if you're interested.`, sent: new Date().toISOString() };
      const invites = [...cur.invites, inv].slice(-200);
      const body = { invites, toIds: [...new Set(invites.map(i => i.to))], updated: new Date().toISOString() };
      if (await safeWrite(() => market.db.doc("outbox/" + market.uid).set(body), "invStatus")) { market.outbox = body; say("invStatus", "Invitation sent. They'll see it in Find jobs and on their Home page."); renderEmployer(); }
    }
  });
  viewHooks.jobs = () => { renderJobs(); startMarket().then(() => { if (currentView === "jobs") renderJobs(); }); };
  viewHooks.employer = () => { hiring.ready.then(() => {}); renderEmployer(); startMarket().then(() => { if (currentView === "employer") renderEmployer(); }); };
  // invitations show on Home too
  memoryReady.then(() => setTimeout(startMarket, 1500));
});

/* --- Importing listings from the collector (owner and editors) --- */
async function importFeed(file) {
  if (!market.db || !market.canEdit) { say("jbFeedStatus", "Only the owner or an editor of this Job Finder can import listings.", true); return; }
  let data;
  try { data = JSON.parse(await file.text()); } catch { say("jbFeedStatus", "That isn't a valid JSON file from the collector.", true); return; }
  const jobs = (Array.isArray(data) ? data : data.jobs || []).filter(j => j && j.title && j.company).map(j => ({ id: String(j.id || uid8()).slice(0, 80), title: String(j.title).slice(0, 160), company: String(j.company).slice(0, 120), location: String(j.location || "").slice(0, 120), workType: String(j.workType || ""), remote: String(j.remote || ""), salary: String(j.salary || "").slice(0, 80), posted: String(j.posted || "").slice(0, 10), url: String(j.url || ""), source: String(j.source || "Imported").slice(0, 80), sourceType: ["company", "ats", "aggregator", "board"].includes(j.sourceType) ? j.sourceType : "aggregator", description: String(j.description || "").slice(0, 1500), ref: String(j.ref || "").slice(0, 40), closes: String(j.closes || "").slice(0, 10),
    also: Array.isArray(j.also) ? j.also.slice(0, 8).map(a => ({ source: String((a && a.source) || "").slice(0, 80), url: safeUrl(a && a.url), posted: String((a && a.posted) || "").slice(0, 10), sourceType: String((a && a.sourceType) || "").slice(0, 12) })) : [] })).filter(j => !j.closes || j.closes >= todayISO()).map(j => ({ ...j, url: safeUrl(j.url) }));
  const merged = DEDUP.cluster(jobs).map(j => ({ ...j, also: (j.also || []).slice(0, 8) }));
  const listings = merged.reduce((a, j) => a + 1 + j.also.length, 0), sources = new Set(merged.flatMap(j => [j.source, ...j.also.map(a => a.source)]));
  if (!merged.length) { say("jbFeedStatus", "No jobs found in that file.", true); return; }
  // split into documents well under the 256 KiB limit
  const chunks = [[]]; let size = 0;
  for (const j of merged) { const n = JSON.stringify(j).length; if (size + n > 180000 && chunks[chunks.length - 1].length) { chunks.push([]); size = 0; } chunks[chunks.length - 1].push(j); size += n; }
  say("jbFeedStatus", `Saving ${merged.length} jobs…`);
  const base = "feed/" + market.uid;
  const ok = await safeWrite(async () => {
    for (let i = 0; i < chunks.length; i++) await market.db.doc(`${base}/chunks/c${i}`).set({ jobs: chunks[i] });
    const old = await market.db.collection(base + "/chunks").get();
    for (const d of old.docs) if (+d.id.slice(1) >= chunks.length) await market.db.doc(base + "/chunks/" + d.id).delete();
    await market.db.doc(base).set({ count: merged.length, listings, imported: new Date().toISOString(), sources: [...sources].slice(0, 50) });
  }, "jbFeedStatus");
  if (ok) { market.feed = merged; say("jbFeedStatus", `Imported ${merged.length} jobs from ${sources.size} source${sources.size === 1 ? "" : "s"}: ${listings} listings, with ${listings - merged.length} duplicates merged. Everyone using Job Finder now sees them.`); renderJobs(); }
}

