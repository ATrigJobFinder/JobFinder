/* ===================== Employer side, part 3: Dashboard and Jobs ===================== */

async function emPersist(ads, company) {
  const ok = await emSave(company || emCompany(), ads, "emStatus");
  if (!ok) toast((flash.emStatus && flash.emStatus.text) || "Couldn't save just now. Try again in a moment.", "warn");
  return ok;
}
const emStatusLine = () => statusHTML("emStatus", "status-line emp-status", "p");

/* ---------- Dashboard ---------- */
function emAttention(ads, people) {
  const out = [];
  const open = ads.filter(a => emAdState(a) === "open");
  for (const a of open) {
    const n = people.filter(p => p.ad.id === a.id && p.stage === "New").length;
    if (n) out.push({ kind: "info", html: `<b>${emPlural(n, "new candidate")}</b> to review for <b>${esc(a.title)}</b>`, act: ["Review", "cands-new", a.id] });
  }
  for (const a of open) { const d = emDaysLeft(a.closes); if (d !== null && d <= 5) out.push({ kind: "warn", html: `<b>${esc(a.title)}</b> closes ${d <= 0 ? "today" : d === 1 ? "tomorrow" : "in " + d + " days"}`, act: ["Extend 30 days", "job-extend", a.id] }); }
  for (const a of open) if (!(a.questions || []).length) out.push({ kind: "tip", html: `<b>${esc(a.title)}</b> has no candidate questions. Questions with must-haves save you reading every application.`, act: ["Add questions", "job-edit-q", a.id] });
  for (const a of open) { const bad = checkAd(a).filter(c => c[0] === "bad"); if (bad.length) out.push({ kind: "bad", html: `<b>${esc(a.title)}</b>: ${esc(bad[0][1])}`, act: ["Fix the ad", "job-edit", a.id] }); }
  for (const a of ads.filter(x => emAdState(x) === "draft")) out.push({ kind: "tip", html: `Your draft <b>${esc(a.title || "Untitled job")}</b> isn't posted yet`, act: ["Finish it", "job-edit", a.id] });
  return out.slice(0, 6);
}
function emChecklist(co, ads, people) {
  const open = ads.filter(a => emAdState(a) !== "draft");
  return [
    ["Add your company name and what you do", !!(co.name && co.about), "Company profile", "go-company"],
    ["Add your logo and a few benefits", !!((co.logo || co.colour) && (co.benefits || []).length), "Make it yours", "go-company"],
    ["Post your first job", open.length > 0, "Post a job", "post"],
    ["Add candidate questions to a job", ads.some(a => (a.questions || []).length), "Edit a job", "go-jobs"],
    ["Review your first candidate", people.some(p => !p.unread || p.stage !== "New"), "Open candidates", "go-cands"]
  ];
}
function emDashboard() {
  const box = $("empDash"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  const co = emCompany(), ads = emAds(), people = emPeople();
  const open = ads.filter(a => emAdState(a) === "open"), live = people.filter(p => emAdState(p.ad) !== "draft");
  const by = s => live.filter(p => p.stage === s).length;
  const checks = emChecklist(co, ads, people), done = checks.filter(c => c[1]).length;
  const att = emAttention(ads, people);
  const tiles = [["Open jobs", open.length, "go-jobs"], ["New candidates", by("New"), "go-cands-new"], ["Shortlisted", by("Shortlisted"), "go-cands-short"], ["Interviewing", by("Interview"), "go-cands-int"], ["Offers made", by("Offer"), "go-cands-offer"]];
  const strong = open.reduce((n, a) => n + emTalent().filter(c => candidateMatch(c, a).pct >= EM_HIGH).length, 0);
  const recent = live.slice().sort((a, b) => String(b.app.applied).localeCompare(String(a.app.applied))).slice(0, 6);
  box.innerHTML = `
    <section class="emp-hero" aria-label="Welcome">
      <div class="emp-hero-who">${emLogo(co, "lg")}<div><p class="emp-eyebrow">Employer dashboard</p><h1>${co.name ? `Welcome back, ${esc(co.name)}` : "Welcome to Job Finder for employers"}</h1><p>${co.name ? "Here's where your hiring is up to." : "Set up your company, post a job and start hearing from candidates. It's free."}</p></div></div>
      <div class="emp-hero-acts"><button class="btn emp-cta" type="button" data-em="post">Post a job</button><button class="btn emp-ghost-w" type="button" data-em="go-cands">View candidates</button></div>
    </section>
    ${emNoteBar()}${emStatusLine()}
    ${done < checks.length ? `<section class="panel emp-setup" aria-labelledby="emSetupH"><div class="panel-head"><h2 id="emSetupH">Get set up</h2><p>${done} of ${checks.length} done</p></div><div class="emp-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${checks.length}" aria-valuenow="${done}" aria-label="Set-up progress"><i style="width:${done / checks.length * 100}%"></i></div>
      <ul class="emp-checks">${checks.map(c => `<li class="${c[1] ? "done" : ""}"><span class="emp-tick" aria-hidden="true">${c[1] ? "✓" : ""}</span><span>${esc(c[0])}</span>${c[1] ? `<span class="visually-hidden">Done</span>` : `<button type="button" class="linkish" data-em="${c[3]}">${esc(c[2])}</button>`}</li>`).join("")}</ul></section>` : ""}
    <div class="emp-tiles">${tiles.map(([l, n, a]) => `<button type="button" class="emp-tile" data-em="${a}"><b>${n}</b><span>${l}</span></button>`).join("")}</div>
    <div class="emp-cols">
      <div class="stack">
        <section class="panel" aria-labelledby="emJobsH"><div class="panel-head"><h2 id="emJobsH">Your open jobs</h2><button type="button" class="linkish" data-em="go-jobs">See all jobs</button></div>
          ${open.length ? `<ul class="emp-rows">${open.slice(0, 5).map(a => { const c = emCounts(a.id), n = emApplicants().filter(x => x.jobId === a.id).length, nw = people.filter(p => p.ad.id === a.id && p.stage === "New").length, d = emDaysLeft(a.closes);
            return `<li><div class="emp-row-main"><button type="button" class="emp-link" data-em="job-cands" data-id="${esc(a.id)}">${esc(a.title)}</button><span class="small muted">${esc([a.location, a.workType].filter(Boolean).join(" · "))}${d !== null ? ` · ${d < 0 ? "Closed" : d === 0 ? "Closes today" : "Closes in " + emPlural(d, "day")}` : ""}</span></div><div class="emp-row-nums"><span><b>${n}</b> candidate${n === 1 ? "" : "s"}${nw ? ` <span class="emp-badge">${nw} new</span>` : ""}</span>${emPipeBar(c)}</div></li>`; }).join("")}</ul>` : emEmpty("No open jobs", "Post a job and candidates will start applying.", `<button class="btn primary" type="button" data-em="post">Post a job</button>`)}
        </section>
        <section class="panel" aria-labelledby="emRecH"><div class="panel-head"><h2 id="emRecH">Latest candidates</h2><button type="button" class="linkish" data-em="go-cands">See all candidates</button></div>
          ${recent.length ? `<ul class="emp-rows">${recent.map(p => `<li><div class="emp-row-who">${emAvatar(p.c.name)}<div class="emp-row-main"><button type="button" class="emp-link${p.unread && p.stage === "New" ? " unread" : ""}" data-em="open-cand" data-uid="${esc(p.app.candidate)}" data-ad="${esc(p.ad.id)}">${esc(p.c.name || "Candidate")}</button><span class="small muted">${esc(p.ad.title)} · applied ${emAgo(p.app.applied)}</span></div></div><div class="emp-row-nums"><span class="job-match ${emFitClass(p.fit.pct)}">${emFitLabel(p.fit.pct)}</span><span class="emp-stage st-${emStageIx(p.stage)}">${esc(p.stage)}</span></div></li>`).join("")}</ul>` : `<p class="small muted">Candidates who apply to your jobs show up here.</p>`}
        </section>
      </div>
      <div class="stack">
        <section class="panel" aria-labelledby="emAttH"><div class="panel-head"><h2 id="emAttH">Needs your attention</h2></div>
          ${att.length ? `<ul class="emp-att">${att.map(x => `<li class="a-${x.kind}"><span>${x.html}</span><button type="button" class="btn" data-em="${x.act[1]}" data-id="${esc(x.act[2])}">${esc(x.act[0])}</button></li>`).join("")}</ul>` : `<p class="small muted">Nothing needs doing. Nice.</p>`}
        </section>
        <section class="panel emp-promo" aria-labelledby="emTsH"><div class="panel-head"><h2 id="emTsH">Talent Search</h2></div>
          <p>${emTalent().length ? `<b>${emTalent().length}</b> ${emTalent().length === 1 ? "person has" : "people have"} joined the talent pool${strong ? `, and <b>${strong}</b> ${strong === 1 ? "is a strong match" : "are strong matches"} for your open jobs` : ""}.` : "People who join the talent pool from Find jobs show up here, even if they haven't applied to you."}</p>
          <div class="b-actions"><button class="btn" type="button" data-em="go-talent">Search talent</button></div></section>
        <section class="panel" aria-labelledby="emTipH"><div class="panel-head"><h2 id="emTipH">Hiring tips</h2></div>
          <ul class="emp-tips"><li><b>Show the pay.</b> Ads with a pay range get more applications, and the right people can tell straight away if it fits.</li><li><b>Keep must-haves to the essentials.</b> Many good candidates only apply when they meet every one.</li><li><b>Reply to everyone.</b> A short “not this time” keeps your name good with the people you'll want next time.</li></ul></section>
      </div>
    </div>`;
  emNavBadge();
}
EM_PAGES.employer = emDashboard;

/* ---------- Jobs ---------- */
const emJobsUI = { tab: "open", q: "", sort: "new" };
function emJobsPage() {
  const box = $("empJobs"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  const ads = emAds(), people = emPeople();
  const tabs = [["open", "Open"], ["draft", "Drafts"], ["closed", "Closed"], ["expired", "Expired"]];
  const cnt = k => ads.filter(a => emAdState(a) === k).length;
  if (!cnt(emJobsUI.tab) && ads.length) { const first = tabs.find(t => cnt(t[0])); if (first && !emJobsUI._set) emJobsUI.tab = first[0]; }
  const q = emJobsUI.q.trim().toLowerCase();
  const rows = ads.filter(a => emAdState(a) === emJobsUI.tab && (!q || [a.title, a.location, emAdRef(a)].join(" ").toLowerCase().includes(q)));
  const n = a => emApplicants().filter(x => x.jobId === a.id).length;
  rows.sort((a, b) => emJobsUI.sort === "title" ? a.title.localeCompare(b.title) : emJobsUI.sort === "closing" ? String(a.closes || "9").localeCompare(String(b.closes || "9")) : emJobsUI.sort === "cands" ? n(b) - n(a) : String(b.posted || "").localeCompare(String(a.posted || "")));
  box.innerHTML = `${emHead("Jobs", "Manage your ads and see how each one is going.", `<button class="btn primary" type="button" data-em="post">Post a job</button>`)}${emNoteBar()}${emStatusLine()}
    <section class="panel emp-list">
      <div class="emp-tabs" role="tablist" aria-label="Jobs by status">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${emJobsUI.tab === k}" data-em="jobs-tab" data-k="${k}">${l} <span class="emp-count">${cnt(k)}</span></button>`).join("")}</div>
      <div class="emp-tools"><label class="emp-search"><span class="visually-hidden">Search your jobs</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="text" data-emi="jobs-q" value="${esc(emJobsUI.q)}" placeholder="Search by job title, location or ID" autocomplete="off"></label>
        <label class="emp-sort">Sort by <select data-emc="jobs-sort"><option value="new"${emJobsUI.sort === "new" ? " selected" : ""}>Newest first</option><option value="closing"${emJobsUI.sort === "closing" ? " selected" : ""}>Closing soonest</option><option value="cands"${emJobsUI.sort === "cands" ? " selected" : ""}>Most candidates</option><option value="title"${emJobsUI.sort === "title" ? " selected" : ""}>Job title</option></select></label></div>
      ${rows.length ? `<div class="emp-table-wrap"><table class="emp-table"><thead><tr><th scope="col">Job</th><th scope="col">Ad</th><th scope="col">Candidates</th><th scope="col">Pipeline</th><th scope="col">${emJobsUI.tab === "open" ? "Closes" : "Posted"}</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>
      ${rows.map(a => { const c = emCounts(a.id), total = n(a), nw = people.filter(p => p.ad.id === a.id && p.stage === "New").length, d = emDaysLeft(a.closes), st = emAdState(a), t = emTier(a);
        return `<tr><td data-label="Job"><button type="button" class="emp-link" data-em="job-${st === "draft" ? "edit" : "cands"}" data-id="${esc(a.id)}">${esc(a.title || "Untitled job")}</button><span class="small muted">${esc([a.location, a.workType].filter(Boolean).join(" · "))} · ${esc(emAdRef(a))}</span></td>
          <td data-label="Ad"><span class="emp-tier ${t.key}">${esc(t.name)}</span></td>
          <td data-label="Candidates">${st === "draft" ? `<span class="muted">·</span>` : `<b>${total}</b>${nw ? ` <span class="emp-badge">${nw} new</span>` : ""}`}</td>
          <td data-label="Pipeline">${st === "draft" ? `<span class="muted small">Not posted</span>` : emPipeBar(c)}</td>
          <td data-label="${emJobsUI.tab === "open" ? "Closes" : "Posted"}">${emJobsUI.tab === "open" ? (a.closes ? `${fmtDay(a.closes)}<span class="small muted"> · ${d <= 0 ? "today" : emPlural(d, "day") + " left"}</span>` : "·") : fmtDay(a.posted)}</td>
          <td class="emp-act-cell"><div class="b-actions">${st === "draft" ? `<button class="btn" type="button" data-em="job-edit" data-id="${esc(a.id)}">Finish</button>` : `<button class="btn" type="button" data-em="job-cands" data-id="${esc(a.id)}">Candidates</button>`}
            <details class="emp-menu"><summary aria-label="More actions for ${esc(a.title)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></summary><div class="emp-menu-pop">
              ${st !== "draft" ? `<button type="button" data-em="job-edit" data-id="${esc(a.id)}">Edit the ad</button>` : ""}
              <button type="button" data-em="job-dup" data-id="${esc(a.id)}">Copy as a new draft</button>
              ${st === "open" ? `<button type="button" data-em="job-extend" data-id="${esc(a.id)}">Extend by 30 days</button><button type="button" data-em="job-close" data-id="${esc(a.id)}">Close the job</button>` : ""}
              ${st === "closed" || st === "expired" ? `<button type="button" data-em="job-reopen" data-id="${esc(a.id)}">Reopen for 30 days</button>` : ""}
              ${st === "draft" || !total ? `<button type="button" class="danger" data-em="job-del" data-id="${esc(a.id)}">Delete</button>` : ""}
            </div></details></div></td></tr>`; }).join("")}
      </tbody></table></div>` : emEmpty(ads.length ? (q ? "No jobs match that search" : `No ${emJobsUI.tab === "draft" ? "draft" : emJobsUI.tab} jobs`) : "You haven't posted a job yet", ads.length ? "" : "It takes a few minutes. You can save it as a draft at any step.", ads.length ? "" : `<button class="btn primary" type="button" data-em="post">Post a job</button>`)}
    </section>`;
}
EM_PAGES["emp-jobs"] = emJobsPage;
emIn["jobs-q"] = t => { emJobsUI.q = t.value; clearTimeout(emJobsUI.t); emJobsUI.t = setTimeout(() => { const p = t.selectionStart; emJobsPage(); const n = document.querySelector('[data-emi="jobs-q"]'); if (n) { n.focus(); n.setSelectionRange(p, p); } }, 200); };
emCh["jobs-sort"] = t => { emJobsUI.sort = t.value; emJobsPage(); };
emAct["jobs-tab"] = b => { emJobsUI.tab = b.dataset.k; emJobsUI._set = true; emJobsPage(); };
// opening other pages
emAct.post = () => emStartPost();
emAct["go-jobs"] = () => emGo("emp-jobs");
emAct["go-company"] = () => emGo("emp-company");
emAct["go-talent"] = () => emGo("emp-talent");
emAct["go-cands"] = () => { emCandUI.job = ""; emCandUI.stage = "all"; emGo("emp-candidates"); };
const emCandsTo = (stage, job) => { emCandUI.job = job || ""; emCandUI.stage = stage; emCandUI.sel = {}; emGo("emp-candidates"); };
emAct["go-cands-new"] = () => emCandsTo("New"); emAct["go-cands-short"] = () => emCandsTo("Shortlisted"); emAct["go-cands-int"] = () => emCandsTo("Interview"); emAct["go-cands-offer"] = () => emCandsTo("Offer");
emAct["cands-new"] = b => emCandsTo("New", b.dataset.id);
emAct["job-cands"] = b => emCandsTo("all", b.dataset.id);
emAct["job-edit"] = b => emStartPost(b.dataset.id);
emAct["job-edit-q"] = b => emStartPost(b.dataset.id, 3);
emAct["job-dup"] = async b => {
  const a = emAd(b.dataset.id); if (!a) return;
  const copy = { ...JSON.parse(JSON.stringify(a)), id: uid8(), status: "draft", posted: todayISO(), closes: "", title: a.title + " (copy)", questions: (a.questions || []).map(q => ({ ...q, id: emNewQ().id })) };
  if (await emPersist([copy, ...emAds()])) { toast("Copied as a draft."); emJobsUI.tab = "draft"; emJobsUI._set = true; emRefresh(); }
};
const emSetStatus = async (id, fn, msg) => {
  const ads = emAds().map(a => a.id === id ? fn(a) : a);
  if (await emPersist(ads)) { toast(msg); emRefresh(); }
};
emAct["job-close"] = async b => { const a = emAd(b.dataset.id); if (a && await emConfirm("Close this job?", `“${esc(a.title)}” will leave Find jobs. Candidates who've applied stay in your pipeline.`, "Close the job")) emSetStatus(a.id, x => ({ ...x, status: "closed" }), "Job closed."); };
emAct["job-reopen"] = b => emSetStatus(b.dataset.id, x => ({ ...x, status: "open", closes: addDaysISO(todayISO(), 30) }), "Job reopened for 30 days.");
emAct["job-extend"] = b => emSetStatus(b.dataset.id, x => ({ ...x, closes: addDaysISO(x.closes && x.closes > todayISO() ? x.closes : todayISO(), 30) }), "Extended by 30 days.");
emAct["job-del"] = async b => {
  const a = emAd(b.dataset.id); if (!a) return;
  if (!await emConfirm("Delete this job?", `“${esc(a.title || "Untitled job")}” will be deleted for good.`, "Delete", true)) return;
  if (await emPersist(emAds().filter(x => x.id !== a.id))) { toast("Deleted."); emRefresh(); }
};
document.addEventListener("click", e => { document.querySelectorAll(".emp-menu[open]").forEach(m => { if (!m.contains(e.target) || e.target.closest("[data-em]")) m.open = false; }); });
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".emp-menu[open]").forEach(m => { m.open = false; }); });
