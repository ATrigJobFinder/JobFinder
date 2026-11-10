/* ===================== Employer side, part 5: Candidates =====================
   Everyone who applied, as a pipeline (New, Shortlisted, Interview, Offer, Accepted, Not suitable), with a profile panel
   that opens beside the list, ratings, team-style notes, screening answers and messages. */

const emCandUI = { job: "", stage: "all", q: "", sort: "fit", fit: "", must: "", rating: "", since: "", sel: {}, limit: 50, lastKeys: [] };
const EM_TEMPLATES = [
  ["thanks", "Thanks for applying", "Hi {first name},\n\nThanks for applying for the {job} role at {company}. We've received your application and we're reading through them now. If we'd like to take things further, we'll be in touch soon.\n\nKind regards,\n{recruiter}"],
  ["interview", "Invite to an interview", "Hi {first name},\n\nThanks for applying for the {job} role at {company}. We'd like to invite you to an interview. Could you reply with a few times over the next week that suit you?\n\nKind regards,\n{recruiter}"],
  ["invite", "Invite to apply", "Hi {first name},\n\nWe came across your profile and think you could be a good fit for our {job} role at {company}. Have a look and apply if you're interested.\n\nKind regards,\n{recruiter}"],
  ["offer", "Next steps after an interview", "Hi {first name},\n\nThank you for coming in to talk about the {job} role. We were impressed and would like to talk about next steps. When are you free for a quick call?\n\nKind regards,\n{recruiter}"],
  ["no", "Not this time", "Hi {first name},\n\nThank you for applying for the {job} role at {company}, and for the time you put into your application. We've decided to go ahead with other candidates this time. We'll keep your details in mind for future roles, and we wish you well with your search.\n\nKind regards,\n{recruiter}"],
  ["own", "Write my own", ""]
];
const emFirst = n => String(n || "").trim().split(/\s+/)[0] || "there";
const emFill = (t, o) => t.replace(/\{first name\}/g, emFirst(o.name)).replace(/\{job\}/g, o.job || "the").replace(/\{company\}/g, o.company || "our company").replace(/\{recruiter\}/g, o.recruiter || o.company || "The hiring team");
function emSetStage(pairs, stage) {
  const s = emStore(), at = new Date().toISOString();
  for (const [uid, adId] of pairs) { const k = emKey(uid, adId); if (emStage({ candidate: uid, jobId: adId }, emAd(adId)) === stage && s.status[k]) continue; s.status[k] = stage; s.seen[k] = true; (s.log[k] = s.log[k] || []).push({ at, t: "Moved to " + stage }); }
  emAfter();
}

/* ---------- The list ---------- */
function emCandData() {
  const q = emCandUI, groups = emParseQuery(q.q), terms = emQueryTerms(groups);
  const all = emPeople((a, ad) => emAdState(ad) !== "draft" && (!q.job || ad.id === q.job));
  const f = all.filter(p => emQueryMatch(groups, emHay(p.c) + " " + (p.app.note || "") + " " + (p.app.resume || ""))
    && (!q.fit || p.fit.pct >= (q.fit === "hi" ? EM_HIGH : EM_GOOD))
    && (!q.must || (q.must === "met" ? p.scr.failed.length === 0 && p.scr.musts > 0 : p.scr.failed.length > 0))
    && (!q.rating || p.rating >= +q.rating)
    && (!q.since || Date.now() - new Date(p.app.applied).getTime() <= +q.since * 864e5));
  return { all, f, terms };
}
function emCandSort(list) {
  const by = emCandUI.sort, ns = p => p.stage === "Not suitable" ? 1 : 0;
  return list.slice().sort((a, b) => ns(a) - ns(b) || (by === "new" ? String(b.app.applied).localeCompare(String(a.app.applied)) : by === "old" ? String(a.app.applied).localeCompare(String(b.app.applied)) : by === "name" ? String(a.c.name).localeCompare(String(b.c.name)) : by === "rating" ? b.rating - a.rating || b.fit.pct - a.fit.pct : b.fit.pct - a.fit.pct || String(b.app.applied).localeCompare(String(a.app.applied))));
}
function emCandRow(p, terms, showJob) {
  const sel = !!emCandUI.sel[p.key], must = p.scr.musts ? (p.scr.failed.length ? `<span class="emp-must bad" title="${esc(p.scr.failed.map(q => q.text).join(" | "))}">${p.scr.met} of ${p.scr.musts} must-haves</span>` : `<span class="emp-must ok">All ${p.scr.musts} must-haves met</span>`) : "";
  return `<li class="emp-cand${sel ? " sel" : ""}${p.unread && p.stage === "New" ? " unread" : ""}" data-key="${esc(p.key)}">
    <label class="emp-pick"><input type="checkbox" data-emc="cand-sel" data-key="${esc(p.key)}"${sel ? " checked" : ""} aria-label="Select ${esc(p.c.name || "candidate")}"></label>
    ${emAvatar(p.c.name)}
    <div class="emp-cand-main"><button type="button" class="emp-link" data-em="open-cand" data-uid="${esc(p.app.candidate)}" data-ad="${esc(p.ad.id)}">${emHL(p.c.name || "Candidate", terms)}</button>${p.c.headline ? `<span class="emp-cand-h">${emHL(p.c.headline, terms)}</span>` : ""}
      <span class="small muted">${showJob ? esc(p.ad.title) + " · " : ""}${esc([p.c.location, p.c.workRights].filter(Boolean).join(" · "))}${p.c.location || p.c.workRights ? " · " : ""}Applied ${emAgo(p.app.applied)}</span>
      ${terms.length ? `<span class="small emp-hit">${p.c.skills && p.c.skills.length ? emHL((p.c.skills || []).join(", "), terms) : ""}</span>` : ""}</div>
    <div class="emp-cand-meta"><span class="job-match ${emFitClass(p.fit.pct)}" title="${esc(p.fit.why)}">${emFitLabel(p.fit.pct)}</span>${must}</div>
    <div class="emp-cand-side">${emStars(p.rating, p.key, "Rating for " + (p.c.name || "candidate"))}<label class="visually-hidden" for="st-${esc(p.key)}">Stage</label><select id="st-${esc(p.key)}" class="emp-stagesel st-${emStageIx(p.stage)}" data-emc="cand-stage" data-uid="${esc(p.app.candidate)}" data-ad="${esc(p.ad.id)}">${EM_STAGES.map(s => `<option${s === p.stage ? " selected" : ""}>${s}</option>`).join("")}</select></div></li>`;
}
function emCandidatesPage() {
  const box = $("empCands"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  const ads = emAds().filter(a => emAdState(a) !== "draft"), U = emCandUI;
  if (U.job && !ads.some(a => a.id === U.job)) U.job = "";
  const { all, f, terms } = emCandData();
  const cnt = s => s === "all" ? f.length : f.filter(p => p.stage === s).length;
  const list = emCandSort(f.filter(p => U.stage === "all" || p.stage === U.stage));
  U.lastKeys = list.map(p => p.app.candidate + "|" + p.ad.id);
  const selKeys = list.filter(p => U.sel[p.key]).length, filtered = !!(U.q || U.fit || U.must || U.rating || U.since);
  const jobSel = `<label class="emp-sort">Job <select data-emc="cand-job"><option value="">All jobs</option>${ads.map(a => `<option value="${esc(a.id)}"${U.job === a.id ? " selected" : ""}>${esc(a.title)}${emAdState(a) !== "open" ? ` (${emAdState(a)})` : ""}</option>`).join("")}</select></label>`;
  const selected = U.job ? ads.find(a => a.id === U.job) : null;
  box.innerHTML = `${emHead("Candidates", selected ? `For <b>${esc(selected.title)}</b>. ${esc([selected.location, selected.workType].filter(Boolean).join(" · "))}` : "Everyone who has applied, in one place.", `<button class="btn" type="button" data-em="cand-export">Download list</button>`)}${emNoteBar()}${emStatusLine()}
    <section class="panel emp-list">
      <div class="emp-tabs" role="tablist" aria-label="Stage">${[["all", "All"], ...EM_STAGES.map(s => [s, s])].map(([k, l]) => `<button type="button" role="tab" aria-selected="${U.stage === k}" data-em="cand-tab" data-k="${esc(k)}" title="${k === "all" ? "Everyone" : EM_STAGE_HELP[k]}">${esc(l)} <span class="emp-count">${cnt(k)}</span></button>`).join("")}</div>
      <div class="emp-tools emp-tools-wrap">${jobSel}
        <label class="emp-search"><span class="visually-hidden">Search candidates</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="text" data-emi="cand-q" value="${esc(U.q)}" placeholder="Search names, skills, resumes: SQL OR Python, &quot;project manager&quot;" autocomplete="off"></label></div>
      <div class="emp-tools emp-filters"><label class="emp-sort">Sort <select data-emc="cand-sort">${[["fit", "Best fit"], ["new", "Newest"], ["old", "Oldest"], ["rating", "Highest rated"], ["name", "Name"]].map(([v, l]) => `<option value="${v}"${U.sort === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="emp-sort">Fit <select data-emc="cand-fit"><option value="">Any</option><option value="hi"${U.fit === "hi" ? " selected" : ""}>High fit</option><option value="mid"${U.fit === "mid" ? " selected" : ""}>Good fit or better</option></select></label>
        <label class="emp-sort">Must-haves <select data-emc="cand-must"><option value="">Any</option><option value="met"${U.must === "met" ? " selected" : ""}>All met</option><option value="not"${U.must === "not" ? " selected" : ""}>Not all met</option></select></label>
        <label class="emp-sort">Rating <select data-emc="cand-rating"><option value="">Any</option>${[5, 4, 3].map(n => `<option value="${n}"${U.rating == n ? " selected" : ""}>${n}+ stars</option>`).join("")}</select></label>
        <label class="emp-sort">Applied <select data-emc="cand-since"><option value="">Any time</option><option value="3"${U.since === "3" ? " selected" : ""}>Last 3 days</option><option value="7"${U.since === "7" ? " selected" : ""}>Last 7 days</option><option value="30"${U.since === "30" ? " selected" : ""}>Last 30 days</option></select></label>
        ${filtered ? `<button type="button" class="linkish" data-em="cand-clear">Clear filters</button>` : ""}</div>
      <div class="emp-bulk" ${selKeys ? "" : "hidden"} role="region" aria-label="Selected candidates"><b>${selKeys} selected</b><label class="emp-sort">Move to <select data-emc="bulk-stage"><option value="">Choose a stage…</option>${EM_STAGES.map(s => `<option>${s}</option>`).join("")}</select></label><button class="btn" type="button" data-em="bulk-msg">Send a message</button><button class="btn ghost" type="button" data-em="bulk-clear">Clear</button></div>
      ${list.length ? `<div class="emp-listhead"><label class="q-check"><input type="checkbox" data-emc="sel-all"${selKeys && selKeys === Math.min(list.length, U.limit) ? " checked" : ""}> Select all${list.length > U.limit ? " shown" : ""}</label><span class="small muted">${emPlural(list.length, "candidate")}${filtered ? " match" : ""}</span></div>
      <ul class="emp-cands">${list.slice(0, U.limit).map(p => emCandRow(p, terms, !U.job)).join("")}</ul>${list.length > U.limit ? `<button class="btn emp-more" type="button" data-em="cand-more">Show more (${list.length - U.limit} left)</button>` : ""}`
        : emEmpty(all.length ? "No candidates match" : "No candidates yet", all.length ? "Try clearing a filter or changing the search." : (ads.length ? "When job seekers apply to your jobs, they show up here. You can also find people in Talent Search and invite them to apply." : "Post a job and candidates will start applying."), all.length ? `<button class="btn" type="button" data-em="cand-clear">Clear filters</button>` : ads.length ? `<button class="btn primary" type="button" data-em="go-talent">Search talent</button>` : `<button class="btn primary" type="button" data-em="post">Post a job</button>`)}
    </section>`;
}
EM_PAGES["emp-candidates"] = emCandidatesPage;
emIn["cand-q"] = t => { emCandUI.q = t.value; emCandUI.limit = 50; clearTimeout(emCandUI.t); emCandUI.t = setTimeout(() => { const p = t.selectionStart; emCandidatesPage(); const n = document.querySelector('[data-emi="cand-q"]'); if (n) { n.focus(); n.setSelectionRange(p, p); } }, 250); };
for (const [k, f] of [["cand-sort", "sort"], ["cand-fit", "fit"], ["cand-must", "must"], ["cand-rating", "rating"], ["cand-since", "since"], ["cand-job", "job"]]) emCh[k] = t => { emCandUI[f] = t.value; emCandUI.limit = 50; emCandidatesPage(); };
emAct["cand-tab"] = b => { emCandUI.stage = b.dataset.k; emCandUI.limit = 50; emCandidatesPage(); };
emAct["cand-clear"] = () => { Object.assign(emCandUI, { q: "", fit: "", must: "", rating: "", since: "", stage: "all" }); emCandidatesPage(); };
emAct["cand-more"] = () => { emCandUI.limit += 50; emCandidatesPage(); };
emCh["cand-stage"] = t => { emSetStage([[t.dataset.uid, t.dataset.ad]], t.value); toast(`Moved to ${t.value}.`); emCandidatesPage(); emDrawRefresh(); emNavBadge(); };
emCh["cand-sel"] = t => { if (t.checked) emCandUI.sel[t.dataset.key] = true; else delete emCandUI.sel[t.dataset.key]; emCandidatesPage(); };
emCh["sel-all"] = t => { const keys = emCandSort(emCandData().f.filter(p => emCandUI.stage === "all" || p.stage === emCandUI.stage)).slice(0, emCandUI.limit).map(p => p.key); emCandUI.sel = t.checked ? Object.fromEntries(keys.map(k => [k, true])) : {}; emCandidatesPage(); };
emAct["bulk-clear"] = () => { emCandUI.sel = {}; emCandidatesPage(); };
const emSelPairs = () => emPeople().filter(p => emCandUI.sel[p.key]).map(p => [p.app.candidate, p.ad.id]);
emCh["bulk-stage"] = t => { if (!t.value) return; const pairs = emSelPairs(); emSetStage(pairs, t.value); emCandUI.sel = {}; toast(`${emPlural(pairs.length, "candidate")} moved to ${t.value}.`); emCandidatesPage(); emNavBadge(); };
emAct["bulk-msg"] = () => emCompose(emSelPairs().map(([uid, adId]) => ({ uid, adId })));
emAct.rate = b => { const s = emStore(), k = b.dataset.key, n = +b.dataset.n; s.ratings[k] = s.ratings[k] === n ? 0 : n; emAfter(); if (currentView === "emp-candidates") emCandidatesPage(); emDrawRefresh(); const nb = document.querySelector(`[data-em="rate"][data-key="${CSS.escape(k)}"][data-n="${n}"]`); if (nb) nb.focus(); };
emAct["cand-export"] = () => {
  const { f } = emCandData(), esq = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const rows = [["Name", "Headline", "Location", "Work rights", "Job", "Applied", "Stage", "Fit", "Rating", "Must-haves met"], ...emCandSort(f).map(p => [p.c.name, p.c.headline, p.c.location, p.c.workRights, p.ad.title, String(p.app.applied).slice(0, 10), p.stage, p.fit.pct + "%", p.rating || "", p.scr.musts ? `${p.scr.met} of ${p.scr.musts}` : ""])];
  const url = URL.createObjectURL(new Blob(["﻿" + rows.map(r => r.map(esq).join(",")).join("\r\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `Candidates ${todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/* ---------- Sending a message (also how invitations go out) ---------- */
async function emOutboxAdd(inv) {
  const m = emMode(), cur = emOutbox();
  const invites = [...(cur.invites || []), inv].slice(-200);
  const body = { invites, toIds: [...new Set(invites.map(i => i.to))], updated: new Date().toISOString() };
  if (m === "shared") { const ok = await safeWrite(() => market.db.doc("outbox/" + market.uid).set(body), "emStatus"); if (ok) market.outbox = body; return ok; }
  if (m === "demo") hiring.data.demo.outbox = body; else hiring.data.localOutbox = body;
  hiring.save(true); return true;
}
// to: [{ uid, adId }]  (adId is the job they applied for, or for someone from Talent Search, the job to invite them to)
function emCompose(to) {
  if (!to.length) return Promise.resolve();
  const co = emCompany(), ads = emAds().filter(a => emAdState(a) === "open"), one = to.length === 1;
  const applied = new Set(emApplicants().map(a => emKey(a.candidate, a.jobId)));
  const needJob = to.some(t => !applied.has(emKey(t.uid, t.adId || "-")));
  const first = one ? emCandidate(to[0].uid) : null, defAd = (to[0].adId && emAd(to[0].adId)) || ads[0];
  const tpl0 = needJob ? "invite" : "thanks";
  const recruiter = co.recruiter || co.name;
  const fillOne = (id, adId) => { const t = EM_TEMPLATES.find(x => x[0] === id); return t ? (one ? emFill(t[2], { name: first.name, job: (emAd(adId) || {}).title, company: co.name, recruiter }) : t[2]) : ""; };
  const body = `<p class="small muted">To: ${one ? `<b>${esc(first.name || "Candidate")}</b>` : `<b>${to.length} candidates</b>`}${one ? "" : `. {first name}, {job} and {company} are filled in for each person.`}</p>
    ${needJob ? `<label class="field">About which job<select name="job">${ads.length ? ads.map(a => `<option value="${esc(a.id)}"${defAd && defAd.id === a.id ? " selected" : ""}>${esc(a.title)}</option>`).join("") : `<option value="">Post a job first</option>`}</select></label>` : ""}
    <label class="field">Use a template<select name="tpl" data-tpl>${EM_TEMPLATES.map(t => `<option value="${t[0]}"${t[0] === tpl0 ? " selected" : ""}>${t[1]}</option>`).join("")}</select></label>
    <label class="field">Message<textarea name="msg" rows="9">${esc(fillOne(tpl0, defAd && defAd.id))}</textarea></label>
    ${needJob ? "" : `<label class="field">Also move them to<select name="move"><option value="">Leave their stage as it is</option>${EM_STAGES.map(s => `<option>${s}</option>`).join("")}</select></label>`}
    <p class="small muted">${emMode() === "shared" ? "They'll see it in Find jobs and on their Home page." : "This is a prototype: in Claude, the message is delivered inside Job Finder. Here it's saved in the candidate's activity."}</p>`;
  return emModal(to.length === 1 ? "Message a candidate" : `Message ${to.length} candidates`, body, [{ label: "Cancel", v: "", ghost: true }, { label: needJob ? "Send invitation" : "Send message", v: "send", primary: true }], {
    validate: (v, d) => !d.msg.trim() ? "Write a message first." : needJob && !d.job ? "Post a job first, so you can invite people to it." : "",
    onMount: dlg => {
      const sel = dlg.querySelector("[data-tpl]"), ta = dlg.querySelector("[name=msg]"), job = dlg.querySelector("[name=job]"), mv = dlg.querySelector("[name=move]");
      const refill = () => { ta.value = fillOne(sel.value, job ? job.value : (to[0].adId)); if (mv && sel.value === "no") mv.value = "Not suitable"; else if (mv && sel.value === "interview") mv.value = "Interview"; };
      sel.addEventListener("change", refill); if (job) job.addEventListener("change", () => { if (sel.value !== "own") refill(); });
    }
  }).then(async r => {
    if (!r) return;
    const at = new Date().toISOString(), s = emStore();
    let sent = 0;
    for (const t of to) {
      const adId = needJob ? r.data.job : t.adId, ad = emAd(adId), c = emCandidate(t.uid);
      const text = one ? r.data.msg : emFill(r.data.msg, { name: c.name, job: ad && ad.title, company: co.name, recruiter });
      const inv = { id: uid8(), to: t.uid, jobId: adId, title: ad ? ad.title : "", company: co.name, message: text.slice(0, 2000), sent: at, kind: needJob ? "invite" : "message" };
      if (await emOutboxAdd(inv)) { sent++; const k = emKey(t.uid, t.adId || "-"); (s.log[k] = s.log[k] || []).push({ at, t: (inv.kind === "invite" ? "Invited to apply for " + (ad ? ad.title : "a job") : "Messaged") + ": " + text.replace(/\s+/g, " ").slice(0, 70) + "…" }); }
      if (r.data.move && !needJob) emSetStage([[t.uid, t.adId]], r.data.move);
    }
    emAfter(); emCandUI.sel = {};
    toast(sent ? (needJob ? `Invitation sent to ${emPlural(sent, "person", "people")}.` : `Message sent to ${emPlural(sent, "candidate")}.`) : "Couldn't send. Try again in a moment.", sent ? "ok" : "warn");
    emRefresh(); emDrawRefresh();
  });
}

/* ---------- The candidate panel ---------- */
const emDraw = { open: false, uid: "", adId: "", tab: "overview", cmp: "", from: null };
function emOpenCandidate(uid, adId, tab) {
  emDraw.open = true; emDraw.uid = uid; emDraw.adId = adId || ""; emDraw.tab = tab || "overview"; emDraw.from = document.activeElement;
  if (adId) { const s = emStore(); const k = emKey(uid, adId); if (!s.seen[k]) { s.seen[k] = true; emAfter(); } }
  emDrawRender();
  $("emScrim").hidden = false; $("emDrawer").hidden = false;
  document.body.classList.add("emp-drawing");
  requestAnimationFrame(() => { $("emDrawer").classList.add("in"); $("emDrawer").focus(); });
  if (currentView === "emp-candidates") { const li = document.querySelector(`.emp-cand[data-key="${CSS.escape(emKey(uid, adId))}"]`); if (li) li.classList.remove("unread"); }
  emNavBadge();
}
function emDrawClose(silent) {
  if (!emDraw.open) return;
  emDraw.open = false; $("emDrawer").classList.remove("in"); document.body.classList.remove("emp-drawing");
  $("emScrim").hidden = true; $("emDrawer").hidden = true;
  if (currentView === "emp-candidates") emCandidatesPage();
  if (silent) return;
  // give focus back to the link that opened it (the list may have been redrawn, so find it again)
  const back = [...document.querySelectorAll('[data-em="open-cand"]')].find(x => x.dataset.uid === emDraw.uid && (x.dataset.ad || "") === emDraw.adId) || (emDraw.from && document.contains(emDraw.from) ? emDraw.from : null);
  if (back) { try { back.focus(); } catch { /* gone */ } }
}
function emDrawRefresh() { if (emDraw.open) { const y = $("emDrawBody") ? $("emDrawBody").scrollTop : 0; emDrawRender(); if ($("emDrawBody")) $("emDrawBody").scrollTop = y; } }
function emDrawHTML() {
  const d = emDraw, c = emCandidate(d.uid), ad = d.adId ? emAd(d.adId) : null, app = ad ? emApplicants().find(a => a.candidate === d.uid && a.jobId === d.adId) : null;
  const key = emKey(d.uid, d.adId || "-"), s = emStore();
  const cmp = ad || emAd(d.cmp) || emAds().find(a => emAdState(a) === "open") || null;
  const fit = cmp ? emFit(c, cmp) : null, scr = ad && app ? emScreen(ad, app) : null;
  const stage = ad && app ? emStage(app, ad) : null;
  const terms = emQueryTerms(emParseQuery(currentView === "emp-talent" ? emTalentUI.q : emCandUI.q));
  const keys = emCandUI.lastKeys || [], pos = keys.indexOf(d.uid + "|" + d.adId), navable = currentView === "emp-candidates" && pos >= 0;
  const notes = s.notes[key] || [], log = (s.log[key] || []).slice().reverse();
  const tabs = [["overview", "Overview"], ...(app ? [["resume", "Resume"], ["questions", `Questions${scr && scr.total ? ` (${scr.answered}/${scr.total})` : ""}`]] : []), ["notes", `Notes and activity${notes.length ? ` (${notes.length})` : ""}`]];
  if (!tabs.some(t => t[0] === d.tab)) d.tab = "overview";
  const skills = c.skills || [], hit = fit ? fit.hit : [], miss = fit ? fit.missing : [];
  let body = "";
  if (d.tab === "overview") {
    body = `${fit ? `<section class="emp-fitbox"><div class="emp-fitbox-h"><span class="job-match ${emFitClass(fit.pct)}">${emFitLabel(fit.pct)} · ${fit.pct}%</span>${!ad ? `<label class="emp-sort">Compared with <select data-emc="draw-cmp">${emAds().filter(a => emAdState(a) === "open").map(a => `<option value="${esc(a.id)}"${cmp && cmp.id === a.id ? " selected" : ""}>${esc(a.title)}</option>`).join("")}</select></label>` : `<span class="small muted">for ${esc(cmp.title)}</span>`}</div><p>${esc(fit.why)}</p>
        ${hit.length || miss.length ? `<div class="chips">${hit.map(x => `<span class="chip found" title="On their profile">${esc(x)}</span>`).join("")}${miss.slice(0, 6).map(x => `<span class="chip missing" title="The ad asks for it, their profile doesn't mention it">${esc(x)}</span>`).join("")}</div><p class="small muted">Green: on their profile and in your ad. Pink: in your ad, not on their profile.</p>` : ""}</section>` : `<p class="small muted">Post a job to see how well they fit it.</p>`}
      ${app && app.note ? `<section><h3>Note with the application</h3><blockquote class="emp-quote">${esc(app.note)}</blockquote></section>` : ""}
      ${c.summary ? `<section><h3>About</h3><p>${emHL(c.summary, terms)}</p></section>` : ""}
      ${(c.titles || []).length ? `<section><h3>Recent roles</h3><ul class="emp-ul">${c.titles.map(t => `<li>${emHL(t, terms)}</li>`).join("")}</ul></section>` : ""}
      ${(c.education || []).length ? `<section><h3>Education</h3><ul class="emp-ul">${c.education.map(t => `<li>${emHL(t, terms)}</li>`).join("")}</ul></section>` : ""}
      ${skills.length ? `<section><h3>Skills</h3><div class="chips">${skills.map(x => `<span class="chip${hit.some(h => h.toLowerCase() === String(x).toLowerCase()) ? " found" : ""}">${emHL(x, terms)}</span>`).join("")}</div></section>` : ""}
      <section><h3>Details</h3><dl class="emp-dl">${[["Location", c.location], ["Work rights", c.workRights], ["Career stage", c.stage], ["Looking for", c.jobType], ["Applied", app ? `${emAgo(app.applied)} (${fmtDay(String(app.applied).slice(0, 10))})` : ""], ["Profile updated", c.updated ? emAgo(c.updated) : ""]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>
      <p class="small muted">Job Finder shares the profile, skills and anything they chose to include. Phone numbers and email addresses are never shared: use Message to reach them.</p>`;
  } else if (d.tab === "resume") {
    body = app && app.resume ? `<pre class="li-pre emp-resume">${emHL(app.resume, terms)}</pre>` : `<p class="muted">They didn't include a resume with this application.</p>`;
  } else if (d.tab === "questions") {
    body = scr && scr.total ? `<ol class="emp-qa">${ad.questions.map(q => { const a = scr.ans[q.id], ok = q.must ? emAnsOk(q, a) : null; return `<li class="${ok === true ? "ok" : ok === false ? "bad" : ""}"><p class="emp-qa-q">${esc(q.text)}${q.must ? ` <span class="emp-musttag">Must have</span>` : ""}</p><p class="emp-qa-a">${a === undefined || a === "" ? `<span class="muted">No answer</span>` : esc(a)}${ok === true ? ` <span class="emp-qa-ok">✓ Meets it</span>` : ok === false ? ` <span class="emp-qa-no">✗ Doesn't meet it</span>` : ""}</p></li>`; }).join("")}</ol>` : `<p class="muted">This job has no candidate questions. You can add some by editing the job.</p>`;
  } else {
    body = `<form class="emp-noteform" data-emsub="note"><label class="field">Add a note<textarea name="n" rows="3" placeholder="Only you can see notes"></textarea></label><div class="b-actions"><button class="btn" type="submit">Save note</button></div></form>
      ${notes.length ? `<ul class="emp-notes">${notes.slice().reverse().map(n => `<li><p>${esc(n.t)}</p><span class="small muted">${esc(n.by || "You")} · ${emAgo(n.at)}</span></li>`).join("")}</ul>` : ""}
      <h3>Activity</h3>${log.length || app ? `<ol class="emp-log">${log.map(l => `<li><span>${esc(l.t)}</span><span class="small muted">${emAgo(l.at)}</span></li>`).join("")}${app ? `<li><span>Applied for ${esc(ad.title)}</span><span class="small muted">${emAgo(app.applied)}</span></li>` : ""}</ol>` : `<p class="small muted">Nothing yet.</p>`}`;
  }
  const pools = s.pools.filter(p => p.members.includes(d.uid));
  return `<header class="emp-dr-head"><div class="emp-dr-top">${navable ? `<button type="button" class="btn ghost" data-em="draw-prev" aria-label="Previous candidate"${pos <= 0 ? " disabled" : ""}>←</button><button type="button" class="btn ghost" data-em="draw-next" aria-label="Next candidate"${pos >= keys.length - 1 ? " disabled" : ""}>→</button><span class="small muted">${pos + 1} of ${keys.length}</span>` : ""}<button type="button" class="emp-x" data-em="draw-close" aria-label="Close">×</button></div>
    <div class="emp-dr-who">${emAvatar(c.name, "lg")}<div><h2 id="emDrawTitle">${esc(c.name || "Candidate")}</h2><p>${esc(c.headline || "")}</p><p class="small muted">${esc([c.location, c.workRights].filter(Boolean).join(" · "))}</p>${ad ? `<p class="small">Applied for <b>${esc(ad.title)}</b></p>` : `<p class="small muted">In the talent pool. Hasn't applied to you.</p>`}${pools.length ? `<p class="small muted">In pool: ${pools.map(p => esc(p.name)).join(", ")}</p>` : ""}</div></div>
    <div class="emp-dr-acts">${stage ? `<label class="emp-sort">Stage <select class="emp-stagesel st-${emStageIx(stage)}" data-emc="cand-stage" data-uid="${esc(d.uid)}" data-ad="${esc(d.adId)}">${EM_STAGES.map(x => `<option${x === stage ? " selected" : ""}>${x}</option>`).join("")}</select></label>` : ""}${emStars(s.ratings[key] || 0, key, "Rating")}<button class="btn primary" type="button" data-em="draw-msg">${app ? "Message" : "Invite to apply"}</button>${!app ? `<button class="btn" type="button" data-em="draw-pool">Save to a pool</button>` : ""}</div>
    <div class="emp-dr-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${d.tab === k}" data-em="draw-tab" data-k="${k}">${esc(l)}</button>`).join("")}</div></header>
    <div class="emp-dr-body" id="emDrawBody" role="tabpanel">${body}</div>`;
}
function emDrawRender() { const el = $("emDrawer"); if (!el) return; el.setAttribute("aria-labelledby", "emDrawTitle"); el.innerHTML = emDrawHTML(); }
emAct["open-cand"] = b => emOpenCandidate(b.dataset.uid, b.dataset.ad, b.dataset.tab);
emAct["draw-close"] = () => emDrawClose();
emAct["draw-tab"] = b => { emDraw.tab = b.dataset.k; emDrawRender(); };
emCh["draw-cmp"] = t => { emDraw.cmp = t.value; emDrawRender(); };
const emDrawStep = d => { const k = emCandUI.lastKeys, i = k.indexOf(emDraw.uid + "|" + emDraw.adId) + d; if (i < 0 || i >= k.length) return; const [uid, ad] = k[i].split("|"); const from = emDraw.from; emOpenCandidate(uid, ad, emDraw.tab); emDraw.from = from; const nb = document.querySelector(`[data-em="draw-${d > 0 ? "next" : "prev"}"]`); if (nb && !nb.disabled) nb.focus(); };
emAct["draw-prev"] = () => emDrawStep(-1);
emAct["draw-next"] = () => emDrawStep(1);
emAct["draw-msg"] = () => emCompose([{ uid: emDraw.uid, adId: emDraw.adId }]);
emAct["draw-pool"] = () => emPoolPicker([emDraw.uid]);
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-emsub=note]"); if (!f) return;
  e.preventDefault();
  const t = f.querySelector("[name=n]").value.trim(); if (!t) return;
  const s = emStore(), k = emKey(emDraw.uid, emDraw.adId || "-");
  (s.notes[k] = s.notes[k] || []).push({ t: t.slice(0, 1500), at: new Date().toISOString(), by: "You" });
  emAfter(); emDrawRender();
});
$("emScrim").addEventListener("click", () => emDrawClose());
document.addEventListener("keydown", e => {
  if (!emDraw.open || document.querySelector("dialog[open]")) return;
  if (e.key === "Escape") { emDrawClose(); return; }
  if (e.key !== "Tab") return;
  const f = [...$("emDrawer").querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")].filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1], a = document.activeElement;
  if (!$("emDrawer").contains(a)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && (a === first || a === $("emDrawer"))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
});
emWire($("emDrawer"));
