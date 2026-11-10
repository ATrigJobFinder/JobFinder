/* ===================== Employer side, part 6: Talent Search =====================
   People who joined the talent pool in Find jobs, whether or not they've applied to you. Search with words,
   "quoted phrases", OR and NOT; filter; save searches; keep people in named talent pools; invite them to apply. */

const emTalentUI = { tab: "search", q: "", where: "", rights: "", jobType: "", stage: "", job: "", sort: "rel", limit: 30 };
const EM_RIGHTS = ["Australian citizen", "Permanent resident", "Work visa", "Student visa with work rights"];
const emRightsMatch = (c, r) => !r || String(c.workRights || "").toLowerCase().includes(r.toLowerCase().replace("work visa", "visa").replace(" with work rights", ""));
function emTalentFilter() {
  const U = emTalentUI, groups = emParseQuery(U.q), terms = emQueryTerms(groups), where = U.where.trim().toLowerCase();
  const job = emAd(U.job);
  const rows = emTalent().filter(c => emQueryMatch(groups, emHay(c))
    && (!where || String(c.location || "").toLowerCase().includes(where))
    && emRightsMatch(c, U.rights)
    && (!U.jobType || String(c.jobType || "") === U.jobType)
    && (!U.stage || String(c.stage || "") === U.stage)).map(c => {
    const fit = job ? emFit(c, job) : null;
    const rel = terms.reduce((n, t) => n + 3 * (String(c.headline || "").toLowerCase().includes(t) ? 1 : 0) + 2 * ((c.skills || []).join(" ").toLowerCase().includes(t) ? 1 : 0) + 2 * ((c.titles || []).join(" ").toLowerCase().includes(t) ? 1 : 0) + (String(c.summary || "").toLowerCase().includes(t) ? 1 : 0), 0);
    return { c, fit, rel };
  });
  rows.sort((a, b) => U.sort === "fit" && job ? b.fit.pct - a.fit.pct : U.sort === "new" ? String(b.c.updated || "").localeCompare(String(a.c.updated || "")) : (b.rel + (b.fit ? b.fit.pct / 20 : 0)) - (a.rel + (a.fit ? a.fit.pct / 20 : 0)) || String(b.c.updated || "").localeCompare(String(a.c.updated || "")));
  return { rows, terms, job };
}
function emTalentCard(r, terms, invited, applied) {
  const { c, fit } = r, pools = emStore().pools.filter(p => p.members.includes(c.uid));
  return `<li class="emp-cand emp-talent"><div class="emp-cand-main">
    <div class="emp-tc-top">${emAvatar(c.name)}<div><button type="button" class="emp-link" data-em="open-cand" data-uid="${esc(c.uid)}" data-ad="">${emHL(c.name || "Candidate", terms)}</button><span class="emp-cand-h">${emHL(c.headline || "", terms)}</span><span class="small muted">${esc([c.location, c.workRights].filter(Boolean).join(" · "))}${c.updated ? ` · Updated ${emAgo(c.updated)}` : ""}</span></div></div>
    ${(c.titles || []).length ? `<p class="small">${emHL((c.titles || []).slice(0, 2).join("; "), terms)}</p>` : ""}
    <div class="chips">${(c.skills || []).slice(0, 10).map(s => `<span class="chip${fit && fit.hit.some(h => h.toLowerCase() === String(s).toLowerCase()) ? " found" : ""}">${emHL(s, terms)}</span>`).join("")}</div>
    ${pools.length ? `<p class="small muted">In pool: ${pools.map(p => esc(p.name)).join(", ")}</p>` : ""}</div>
    <div class="emp-cand-side">${fit ? `<span class="job-match ${emFitClass(fit.pct)}" title="${esc(fit.why)}">${fit.pct}% fit</span>` : ""}${applied ? `<span class="chip found">Applied to you</span>` : invited ? `<span class="chip found">Invited</span>` : `<button class="btn" type="button" data-em="tal-invite" data-uid="${esc(c.uid)}">Invite to apply</button>`}<button class="btn ghost" type="button" data-em="tal-pool" data-uid="${esc(c.uid)}">Save to pool</button></div></li>`;
}
function emTalentPage() {
  const box = $("empTalent"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  const U = emTalentUI, s = emStore(), ads = emAds().filter(a => emAdState(a) !== "draft");
  const pool = emTalent(), tabs = [["search", "Search"], ["pools", `Talent pools (${s.pools.length})`], ["saved", `Saved searches (${s.searches.length})`]];
  let main = "";
  if (U.tab === "search") {
    const { rows, terms, job } = emTalentFilter();
    const invited = new Set((emOutbox().invites || []).filter(i => i.kind !== "message").map(i => i.to + ":" + i.jobId)), applied = new Set(emApplicants().map(a => a.candidate + ":" + a.jobId));
    const stages = [...new Set(pool.map(c => c.stage).filter(Boolean))], types = [...new Set(pool.map(c => c.jobType).filter(Boolean))];
    const filtered = !!(U.q || U.where || U.rights || U.jobType || U.stage);
    main = `<div class="emp-tools emp-tools-wrap"><label class="emp-search emp-search-lg"><span class="visually-hidden">Search talent</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="text" data-emi="tal-q" value="${esc(U.q)}" placeholder="Skills, job titles, qualifications: e.g. SolidWorks OR AutoCAD, &quot;project manager&quot; NOT intern" autocomplete="off"></label>
        <label class="emp-search"><span class="visually-hidden">Location</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg><input type="text" data-emi="tal-where" value="${esc(U.where)}" placeholder="Suburb or city" autocomplete="off"></label></div>
      <div class="emp-tools emp-filters"><label class="emp-sort">Work rights <select data-emc="tal-rights"><option value="">Any</option>${EM_RIGHTS.map(r => `<option${U.rights === r ? " selected" : ""}>${r}</option>`).join("")}</select></label>
        ${types.length ? `<label class="emp-sort">Looking for <select data-emc="tal-jobType"><option value="">Any</option>${types.map(r => `<option${U.jobType === r ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></label>` : ""}
        ${stages.length ? `<label class="emp-sort">Career stage <select data-emc="tal-stage"><option value="">Any</option>${stages.map(r => `<option${U.stage === r ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></label>` : ""}
        <label class="emp-sort">Match against <select data-emc="tal-job"><option value="">No job</option>${ads.map(a => `<option value="${esc(a.id)}"${U.job === a.id ? " selected" : ""}>${esc(a.title)}</option>`).join("")}</select></label>
        <label class="emp-sort">Sort <select data-emc="tal-sort"><option value="rel"${U.sort === "rel" ? " selected" : ""}>Most relevant</option>${job ? `<option value="fit"${U.sort === "fit" ? " selected" : ""}>Best fit for the job</option>` : ""}<option value="new"${U.sort === "new" ? " selected" : ""}>Recently updated</option></select></label>
        ${filtered ? `<button type="button" class="linkish" data-em="tal-clear">Clear</button><button type="button" class="btn" data-em="tal-save">Save this search</button>` : ""}</div>
      <p class="small muted emp-tip"><b>Search tips:</b> words are joined with AND. Use <code>OR</code> between alternatives, <code>NOT</code> or a minus sign to leave something out, and quotes for a phrase.</p>
      <div class="emp-listhead"><span class="small muted"><b>${rows.length}</b> of ${emPlural(pool.length, "person", "people")} in the talent pool${filtered ? " match" : ""}</span></div>
      ${rows.length ? `<ul class="emp-cands emp-talents">${rows.slice(0, U.limit).map(r => emTalentCard(r, terms, invited.has(r.c.uid + ":" + (job ? job.id : "")), job && applied.has(r.c.uid + ":" + job.id))).join("")}</ul>${rows.length > U.limit ? `<button class="btn emp-more" type="button" data-em="tal-more">Show more (${rows.length - U.limit} left)</button>` : ""}`
        : emEmpty(pool.length ? "Nobody matches that" : "The talent pool is empty", pool.length ? "Try fewer words, or clear a filter." : emMode() === "local" ? "People who opt in to the talent pool from Find jobs are shared when Job Finder is opened in Claude. You can try it with sample data." : "When job seekers join the talent pool from Find jobs, they appear here, even if they haven't applied to you.", pool.length ? `<button class="btn" type="button" data-em="tal-clear">Clear the search</button>` : emMode() === "local" ? `<button class="btn primary" type="button" data-em="demo-on">Try sample data</button>` : "")}`;
  } else if (U.tab === "pools") {
    main = `<div class="emp-tools"><button class="btn primary" type="button" data-em="pool-new">New talent pool</button><span class="small muted">Keep people you want to come back to. A pool isn't tied to a job.</span></div>
      ${s.pools.length ? `<div class="emp-pools">${s.pools.map(p => { const mem = p.members.map(u => pool.find(c => c.uid === u)).filter(Boolean); return `<section class="emp-pool"><header><div><h3>${esc(p.name)}</h3><p class="small muted">${emPlural(mem.length, "person", "people")}</p></div><div class="b-actions"><button class="btn" type="button" data-em="pool-msg" data-id="${esc(p.id)}"${mem.length ? "" : " disabled"}>Invite to apply</button><button class="btn ghost" type="button" data-em="pool-rename" data-id="${esc(p.id)}">Rename</button><button class="btn ghost" type="button" data-em="pool-del" data-id="${esc(p.id)}">Delete</button></div></header>
        ${mem.length ? `<ul class="emp-rows">${mem.map(c => `<li><div class="emp-row-who">${emAvatar(c.name)}<div class="emp-row-main"><button type="button" class="emp-link" data-em="open-cand" data-uid="${esc(c.uid)}" data-ad="">${esc(c.name)}</button><span class="small muted">${esc(c.headline || "")}${c.location ? " · " + esc(c.location) : ""}</span></div></div><button type="button" class="linkish" data-em="pool-remove" data-id="${esc(p.id)}" data-uid="${esc(c.uid)}">Remove</button></li>`).join("")}</ul>` : `<p class="small muted">Nobody here yet. Use <b>Save to pool</b> on a search result.</p>`}</section>`; }).join("")}</div>` : emEmpty("No talent pools yet", "Make a pool for people you'd like to hear from again, such as “Graduates to keep warm”.", `<button class="btn primary" type="button" data-em="pool-new">New talent pool</button>`)}`;
  } else {
    main = s.searches.length ? `<ul class="emp-rows emp-saved">${s.searches.map(x => { const n = (() => { const old = { ...U }; Object.assign(U, { q: x.q, where: x.where, rights: x.rights, jobType: x.jobType, stage: x.stage || "", job: "" }); const c = emTalentFilter().rows.length; Object.assign(U, old); return c; })(); return `<li><div class="emp-row-main"><b>${esc(x.name)}</b><span class="small muted">${esc([x.q && `“${x.q}”`, x.where, x.rights, x.jobType, x.stage].filter(Boolean).join(" · ") || "Everyone")} · ${emPlural(n, "person", "people")} now</span></div><div class="b-actions"><button class="btn primary" type="button" data-em="saved-run" data-id="${esc(x.id)}">Run search</button><button class="btn ghost" type="button" data-em="saved-del" data-id="${esc(x.id)}">Delete</button></div></li>`; }).join("")}</ul>` : emEmpty("No saved searches", "Run a search, then choose Save this search to come back to it.", `<button class="btn primary" type="button" data-em="saved-go">Search talent</button>`);
  }
  box.innerHTML = `${emHead("Talent Search", "Find people who've joined the talent pool, including those who haven't applied to you yet.")}${emNoteBar()}${emStatusLine()}
    <section class="panel emp-list"><div class="emp-tabs" role="tablist" aria-label="Talent Search">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${U.tab === k}" data-em="tal-tab" data-k="${k}">${esc(l)}</button>`).join("")}</div>${main}</section>`;
}
EM_PAGES["emp-talent"] = emTalentPage;
const emTalRedraw = (el, sel) => { const p = el.selectionStart; emTalentPage(); const n = document.querySelector(sel); if (n) { n.focus(); n.setSelectionRange(p, p); } };
emIn["tal-q"] = t => { emTalentUI.q = t.value; emTalentUI.limit = 30; clearTimeout(emTalentUI.t); emTalentUI.t = setTimeout(() => emTalRedraw(t, '[data-emi="tal-q"]'), 250); };
emIn["tal-where"] = t => { emTalentUI.where = t.value; emTalentUI.limit = 30; clearTimeout(emTalentUI.t2); emTalentUI.t2 = setTimeout(() => emTalRedraw(t, '[data-emi="tal-where"]'), 250); };
for (const [k, f] of [["tal-rights", "rights"], ["tal-jobType", "jobType"], ["tal-stage", "stage"], ["tal-job", "job"], ["tal-sort", "sort"]]) emCh[k] = t => { emTalentUI[f] = t.value; if (f === "job" && t.value) emTalentUI.sort = "fit"; if (f === "job" && !t.value && emTalentUI.sort === "fit") emTalentUI.sort = "rel"; emTalentUI.limit = 30; emTalentPage(); };
emAct["tal-tab"] = b => { emTalentUI.tab = b.dataset.k; emTalentPage(); };
emAct["tal-clear"] = () => { Object.assign(emTalentUI, { q: "", where: "", rights: "", jobType: "", stage: "" }); emTalentPage(); };
emAct["tal-more"] = () => { emTalentUI.limit += 30; emTalentPage(); };
emAct["saved-go"] = () => { emTalentUI.tab = "search"; emTalentPage(); };
emAct["tal-invite"] = b => {
  return emCompose([{ uid: b.dataset.uid, adId: emTalentUI.job || "" }]);
};
emAct["tal-pool"] = b => emPoolPicker([b.dataset.uid]);
emAct["tal-save"] = async () => {
  const U = emTalentUI, r = await emModal("Save this search", `<label class="field">Name<input type="text" name="n" autofocus value="${esc(U.q || U.where || "My search")}" maxlength="60"></label>`, [{ label: "Cancel", v: "", ghost: true }, { label: "Save", v: "save", primary: true }], { validate: (v, d) => d.n.trim() ? "" : "Give it a name." });
  if (!r) return;
  emStore().searches.push({ id: uid8(), name: r.data.n.trim(), q: U.q, where: U.where, rights: U.rights, jobType: U.jobType, stage: U.stage });
  emAfter(); toast("Search saved."); emTalentPage();
};
emAct["saved-run"] = b => { const x = emStore().searches.find(s => s.id === b.dataset.id); if (!x) return; Object.assign(emTalentUI, { tab: "search", q: x.q, where: x.where, rights: x.rights, jobType: x.jobType, stage: x.stage || "", limit: 30 }); emTalentPage(); };
emAct["saved-del"] = async b => { if (!await emConfirm("Delete this saved search?", "This only removes the saved search. It doesn't affect any candidates.", "Delete")) return; const s = emStore(); s.searches = s.searches.filter(x => x.id !== b.dataset.id); emAfter(); emTalentPage(); };

/* --- Talent pools --- */
async function emPoolPicker(uids) {
  const s = emStore();
  const r = await emModal(uids.length === 1 ? "Save to a talent pool" : `Save ${uids.length} people to a talent pool`, `${s.pools.length ? `<fieldset class="emp-fs"><legend>Pools</legend>${s.pools.map(p => `<label class="q-check"><input type="checkbox" name="pool" value="${esc(p.id)}"${uids.every(u => p.members.includes(u)) ? " checked" : ""}> ${esc(p.name)} <span class="muted small">(${p.members.length})</span></label>`).join("")}</fieldset>` : `<p class="small muted">You don't have a pool yet. Make one below.</p>`}
    <label class="field">Or start a new pool<input type="text" name="new" maxlength="60" placeholder="e.g. Graduates to keep warm"></label>`, [{ label: "Cancel", v: "", ghost: true }, { label: "Save", v: "save", primary: true }]);
  if (!r) return;
  const want = new Set(r.data.pool || []);
  for (const p of s.pools) { if (want.has(p.id)) uids.forEach(u => { if (!p.members.includes(u)) p.members.push(u); }); else if (uids.every(u => p.members.includes(u))) p.members = p.members.filter(u => !uids.includes(u)); }
  const nn = (r.data.new || "").trim(); if (nn) s.pools.push({ id: uid8(), name: nn, members: [...uids] });
  emAfter(); toast("Talent pools updated."); if (currentView === "emp-talent") emTalentPage(); emDrawRefresh();
}
emAct["pool-new"] = async () => {
  const r = await emModal("New talent pool", `<label class="field">Name<input type="text" name="n" autofocus maxlength="60" placeholder="e.g. Estimators"></label>`, [{ label: "Cancel", v: "", ghost: true }, { label: "Create", v: "ok", primary: true }], { validate: (v, d) => d.n.trim() ? "" : "Give it a name." });
  if (r) { emStore().pools.push({ id: uid8(), name: r.data.n.trim(), members: [] }); emAfter(); emTalentPage(); }
};
emAct["pool-rename"] = async b => {
  const p = emStore().pools.find(x => x.id === b.dataset.id); if (!p) return;
  const r = await emModal("Rename talent pool", `<label class="field">Name<input type="text" name="n" autofocus maxlength="60" value="${esc(p.name)}"></label>`, [{ label: "Cancel", v: "", ghost: true }, { label: "Save", v: "ok", primary: true }], { validate: (v, d) => d.n.trim() ? "" : "Give it a name." });
  if (r) { p.name = r.data.n.trim(); emAfter(); emTalentPage(); }
};
emAct["pool-del"] = async b => { if (!await emConfirm("Delete this talent pool?", "The pool is removed. The people in it aren't affected.", "Delete")) return; const s = emStore(); s.pools = s.pools.filter(x => x.id !== b.dataset.id); emAfter(); emTalentPage(); };
emAct["pool-remove"] = b => { const p = emStore().pools.find(x => x.id === b.dataset.id); if (p) { p.members = p.members.filter(u => u !== b.dataset.uid); emAfter(); emTalentPage(); } };
emAct["pool-msg"] = b => { const p = emStore().pools.find(x => x.id === b.dataset.id); if (p) return emCompose(p.members.filter(u => emTalent().some(c => c.uid === u)).map(uid => ({ uid, adId: "" }))); };
