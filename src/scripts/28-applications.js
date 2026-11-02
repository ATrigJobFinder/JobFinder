/* ===================== Applications tracker ===================== */
const STAGES_T = [
  { key: "saved", label: "Saved", tip: "Jobs you want to apply for. Aim to apply within a few days of the ad going up." },
  { key: "applied", label: "Applied", tip: "Follow up after about a week if you haven't heard back." },
  { key: "screening", label: "Screening", tip: "A recruiter call or online test. Practise in Interviews and Aptitude tests." },
  { key: "interview", label: "Interview", tip: "Research the company and prepare three STAR stories." },
  { key: "offer", label: "Offer", tip: "Check the salary, super and start date before you accept." },
  { key: "closed", label: "Closed", tip: "Unsuccessful, withdrawn or no response. Ask for feedback where you can." }
];
const trk = privateDoc("applications", "jobfinder.applications.v1", () => ({ items: [] }));
const T = () => trk.data.items;
const stageIx = k => STAGES_T.findIndex(s => s.key === k);
const trkEmpty = () => ({ id: uid8(), title: "", company: "", location: "", url: "", source: "", stage: "saved", applied: "", followUp: "", interviewAt: "", salary: "", contact: "", notes: "", jd: "", score: null, closedWhy: "", history: [], created: new Date().toISOString() });
// Add (or update) an application; the same title at the same company counts as the same job
function trackJob(job, stage) {
  const key = (t, c) => norm(t + "|" + c).replace(/[^a-z0-9|]/g, "");
  const pj = DEDUP.prep({ title: job.title, company: job.company, location: job.location, url: job.url });
  let it = T().find(x => key(x.title, x.company) === key(job.title || "", job.company || "") || (job.title && job.company && DEDUP.same(DEDUP.prep({ title: x.title, company: x.company, location: x.location, url: x.url }), pj)));
  if (!it) { it = { ...trkEmpty(), ...job, stage: stage || job.stage || "saved" }; it.history = [{ stage: it.stage, date: todayISO() }]; T().unshift(it); }
  else { for (const [k, v] of Object.entries(job)) if (v != null && v !== "" && k !== "stage") it[k] = v; if (stage && stageIx(stage) > stageIx(it.stage)) setStage(it, stage); }
  if (it.stage === "applied" && !it.applied) it.applied = todayISO();
  if (it.stage === "applied" && !it.followUp) it.followUp = addDaysISO(it.applied, 7);
  it.jd = String(it.jd || "").slice(0, 2500);
  trimTracker();
  trk.save();
  if (currentView === "tracker") renderTracker();
  return it;
}
function setStage(it, stage) {
  if (it.stage === stage) return;
  it.stage = stage;
  it.history.push({ stage, date: todayISO() });
  if (stage === "applied") { if (!it.applied) it.applied = todayISO(); if (!it.followUp) it.followUp = addDaysISO(it.applied, 7); }
  if (stage === "closed" || stage === "offer") it.followUp = "";
}
// keep the document well under the store's size limit
function trimTracker() {
  if (T().length > 400) trk.data.items = T().slice(0, 400);
  let size = JSON.stringify(trk.data).length;
  for (let i = T().length - 1; size > 200000 && i >= 0; i--) { if (T()[i].jd) { size -= T()[i].jd.length; T()[i].jd = ""; } }
}
const dueState = it => !it.followUp || ["closed", "offer"].includes(it.stage) ? "" : it.followUp < todayISO() ? "overdue" : it.followUp === todayISO() ? "today" : "";
function trackerStats() {
  const items = T(), applied = items.filter(i => stageIx(i.stage) >= 1 && i.stage !== "saved");
  const heard = items.filter(i => ["screening", "interview", "offer"].includes(i.stage) || i.history.some(h => ["screening", "interview", "offer"].includes(h.stage)));
  return { total: items.length, applied: applied.length, heard: heard.length, interviews: items.filter(i => i.history.some(h => h.stage === "interview")).length, offers: items.filter(i => i.stage === "offer").length, rate: applied.length ? Math.round(heard.length / applied.length * 100) : 0, due: items.filter(i => dueState(i)).length };
}
let trkOpen = null;
function renderTracker() {
  const box = $("trkBoard");
  if (!box) return;
  const st = trackerStats();
  $("trkStats").innerHTML = `<div class="iv-stat"><b>${st.applied}</b><span>applied</span></div><div class="iv-stat"><b>${st.rate}%</b><span>heard back${st.applied ? ` (${st.heard} of ${st.applied})` : ""}</span></div><div class="iv-stat"><b>${st.interviews}</b><span>interviews</span></div><div class="iv-stat"><b>${st.offers}</b><span>offers</span></div><div class="iv-stat${st.due ? " warn" : ""}"><b>${st.due}</b><span>follow-ups due</span></div>`;
  $("trkWhere").textContent = `${T().length} job${T().length === 1 ? "" : "s"}, ${whereWords(trk.where)}.`;
  const q = ($("trkSearch").value || "").toLowerCase();
  const shown = T().filter(i => !q || (i.title + " " + i.company + " " + i.notes).toLowerCase().includes(q));
  box.innerHTML = STAGES_T.map(s => {
    const items = shown.filter(i => i.stage === s.key);
    return `<section class="trk-col" aria-labelledby="trk-h-${s.key}"><div class="trk-col-head"><h2 id="trk-h-${s.key}">${s.label}</h2><span class="count">${items.length}</span></div><p class="trk-tip">${esc(s.tip)}</p>
      ${items.map(i => {
        const due = dueState(i);
        return `<article class="trk-card${trkOpen === i.id ? " open" : ""}" data-id="${i.id}">
          <button type="button" class="trk-main" data-trk="open" aria-expanded="${trkOpen === i.id}"><b>${esc(i.title || "Untitled job")}</b><span>${esc(i.company || "Company not set")}${i.location ? ` · ${esc(i.location)}` : ""}</span></button>
          <div class="trk-meta">${i.score != null ? `<span class="chip found" title="Match from your last scan">${i.score}% match</span>` : ""}${i.applied && s.key !== "saved" ? `<span>Applied ${fmtDay(i.applied)}</span>` : ""}${i.interviewAt ? `<span>Interview ${fmtDay(i.interviewAt)}</span>` : ""}${due ? `<span class="due ${due}">Follow up ${due === "today" ? "today" : "overdue"}</span>` : i.followUp && !["closed", "offer"].includes(i.stage) ? `<span>Follow up ${fmtDay(i.followUp)}</span>` : ""}${s.key === "closed" && i.closedWhy ? `<span>${esc(i.closedWhy)}</span>` : ""}</div>
          <div class="trk-move"><label class="visually-hidden" for="stg-${i.id}">Stage</label><select id="stg-${i.id}" data-trk="stage">${STAGES_T.map(x => `<option value="${x.key}"${x.key === i.stage ? " selected" : ""}>${x.label}</option>`).join("")}</select>${stageIx(i.stage) < 4 ? `<button type="button" class="btn" data-trk="next">${STAGES_T[stageIx(i.stage) + 1].label} →</button>` : ""}</div>
          ${trkOpen === i.id ? trkDetail(i) : ""}
        </article>`;
      }).join("") || `<p class="trk-empty">Nothing here yet.</p>`}
    </section>`;
  }).join("");
}
function trkDetail(i) {
  const f = (k, label, type = "text", ph = "") => `<label class="field" for="trk-${k}-${i.id}">${label}<input type="${type}" id="trk-${k}-${i.id}" data-trkf="${k}" value="${esc(i[k] || "")}" placeholder="${esc(ph)}"></label>`;
  return `<div class="trk-detail">
    <div class="q-grid">${f("title", "Job title")}${f("company", "Company")}${f("location", "Location")}${f("url", "Link to the ad", "url", "https://")}${f("applied", "Applied on", "date")}${f("followUp", "Follow up on", "date")}${f("interviewAt", "Interview on", "date")}${f("salary", "Salary or range", "text", "e.g. $75k + super")}${f("contact", "Contact person", "text", "Name, email or phone")}${i.stage === "closed" ? `<label class="field" for="trk-cw-${i.id}">Why it closed<select id="trk-cw-${i.id}" data-trkf="closedWhy">${["", "Unsuccessful", "Withdrew", "No response", "Role filled", "Declined offer"].map(x => `<option${x === i.closedWhy ? " selected" : ""}>${x}</option>`).join("")}</select></label>` : ""}</div>
    <label class="field" for="trk-notes-${i.id}">Notes<textarea id="trk-notes-${i.id}" data-trkf="notes" rows="3" placeholder="Who you spoke to, questions they asked, what to do next">${esc(i.notes)}</textarea></label>
    ${i.jd ? `<details><summary class="small">The job ad you saved</summary><p class="trk-jd">${esc(i.jd)}</p></details>` : ""}
    <div class="trk-hist">${i.history.map(h => `<span>${esc((STAGES_T.find(s => s.key === h.stage) || {}).label || h.stage)} ${fmtDay(h.date)}</span>`).join(" → ")}</div>
    <div class="b-actions">${i.jd ? `<button type="button" class="btn" data-trk="tailor">Tailor my resume to it</button>` : ""}${i.url ? `<a class="btn" href="${esc(i.url)}" target="_blank" rel="noopener">Open the ad</a>` : ""}${["screening", "interview"].includes(i.stage) ? `<button type="button" class="btn" data-trk="prep">Practise for it</button>` : ""}${guideForName(i.company) ? `<button type="button" class="btn" data-guide-open="${guideForName(i.company).key}">${esc(guideForName(i.company).name.split(" (")[0])} guide</button>` : ""}<button type="button" class="btn ghost" data-trk="del">Remove</button></div>
  </div>`;
}
function trkCSV() {
  const cols = ["title", "company", "location", "stage", "applied", "followUp", "interviewAt", "salary", "contact", "url", "score", "notes"];
  const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  return [cols.join(","), ...T().map(i => cols.map(c => q(c === "stage" ? (STAGES_T.find(s => s.key === i.stage) || {}).label : i[c])).join(","))].join("\r\n");
}
onInit(() => {
  const box = $("trkBoard");
  box.addEventListener("click", e => {
    const b = e.target.closest("[data-trk]"); if (!b || b.tagName === "SELECT") return;
    const card = b.closest(".trk-card"), it = T().find(x => x.id === card.dataset.id);
    if (!it) return;
    const a = b.dataset.trk;
    if (a === "open") { trkOpen = trkOpen === it.id ? null : it.id; renderTracker(); const c = document.querySelector(`.trk-card[data-id="${it.id}"] .trk-main`); if (c) c.focus(); }
    else if (a === "next") { setStage(it, STAGES_T[stageIx(it.stage) + 1].key); trk.save(); renderTracker(); }
    else if (a === "del") { if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Remove it?"; return; } trk.data.items = T().filter(x => x !== it); trkOpen = null; trk.save(); renderTracker(); }
    else if (a === "tailor") { els.jd.value = it.jd; els.title.value = it.title; updateCounts(); updateFlow(); openView("scanner"); setTimeout(() => goTo(els.resume.value.trim() ? "scanRow" : "step-resume"), 80); }
    else if (a === "prep") openView("interview");
  });
  box.addEventListener("change", e => {
    const card = e.target.closest(".trk-card"); if (!card) return;
    const it = T().find(x => x.id === card.dataset.id); if (!it) return;
    if (e.target.dataset.trk === "stage") { setStage(it, e.target.value); trk.save(); renderTracker(); return; }
    const k = e.target.dataset.trkf; if (!k) return;
    it[k] = e.target.value; trk.save();
    if (["title", "company", "applied", "followUp", "interviewAt", "closedWhy"].includes(k)) renderTracker();
  });
  box.addEventListener("input", e => { const k = e.target.dataset.trkf; if (!k || !["notes", "salary", "contact", "url", "location"].includes(k)) return; const it = T().find(x => x.id === e.target.closest(".trk-card").dataset.id); if (it) { it[k] = e.target.value; trk.save(); } });
  $("trkAdd").addEventListener("click", () => { const it = trackJob({ title: "", company: "" }, "saved"); trkOpen = it.id; renderTracker(); const f = $(`trk-title-${it.id}`); if (f) f.focus(); });
  $("trkSearch").addEventListener("input", renderTracker);
  $("trkCsv").addEventListener("click", () => downloadMade("Job applications.csv", async () => new Blob(["﻿" + trkCSV()], { type: "text/csv" }), $("trkStatus"), $("trkCsv")));
  // from Tailor to a job: the scanned ad becomes an application
  const fromScan = btn => {
    if (!lastScan) return;
    trackJob({ title: detectTitle(lastScan.jd, lastScan.title) || "Job from the ad", company: companyFrom(lastScan.jd), jd: lastScan.jd, score: lastResult ? lastResult.overall : null, source: "Tailor to a job" }, "applied");
    btn.innerHTML = 'Added. <a href="#tracker">See Application tracker</a>';
  };
  $("trackApp").addEventListener("click", e => { if (e.target.tagName !== "A") fromScan($("trackApp")); });
  document.addEventListener("click", e => { const b = e.target.closest("#clTrack"); if (b && e.target.tagName !== "A") fromScan(b); });
  viewHooks.tracker = () => trk.ready.then(renderTracker);
  trk.on(() => { if (currentView === "tracker") renderTracker(); if (currentView === "home") renderHome(); });
});

