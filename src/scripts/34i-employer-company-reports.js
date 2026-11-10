/* ===================== Employer side, part 7: Company profile, Reports, and starting it all up ===================== */

/* ---------- Company profile ---------- */
const emCo = { draft: null, dirty: false };
const abnValid = v => { const d = String(v || "").replace(/\s/g, ""); if (!/^\d{11}$/.test(d)) return false; const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]; const n = d.split("").map(Number); n[0] -= 1; return n.reduce((s, x, i) => s + x * w[i], 0) % 89 === 0; };
const emCoDraft = () => emCo.draft || (emCo.draft = JSON.parse(JSON.stringify(emCompany())));
function emCoStrength(c) {
  const items = [["Company name", !!c.name], ["What you do (about)", wordCount(c.about || "") >= 20], ["Logo or colour", !!(c.logo || c.colour)], ["Industry and size", !!(c.industry && c.size)], ["Website", !!c.website], ["Culture and values", wordCount(c.culture || "") >= 10], ["Three or more benefits", (c.benefits || []).length >= 3], ["Who's hiring", !!c.recruiter]];
  return { items, pct: Math.round(items.filter(i => i[1]).length / items.length * 100) };
}
function emCoPreview(c) {
  const colour = emColour(c.colour);
  return `<article class="emp-cop" style="--c:${colour}"><div class="emp-cop-band"></div><div class="emp-cop-in">${emLogo(c, "xl")}<h3>${esc(c.name || "Your company")}</h3>${c.tagline ? `<p class="emp-cop-tag">${esc(c.tagline)}</p>` : ""}<p class="small muted">${esc([c.industry, c.size, c.location].filter(Boolean).join(" · ")) || "Industry · size · location"}</p>
    ${c.about ? `<p>${esc(c.about)}</p>` : `<p class="muted">What you do shows here.</p>`}${c.culture ? `<h4>Culture and values</h4><p>${esc(c.culture)}</p>` : ""}${(c.benefits || []).length ? `<h4>Benefits</h4><div class="chips">${c.benefits.map(b => `<span class="chip">${esc(b)}</span>`).join("")}</div>` : ""}${c.website && safeUrl(c.website) ? `<p class="small"><a href="${esc(safeUrl(c.website))}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\//, ""))} ↗</a></p>` : ""}${c.recruiter ? `<p class="small muted">Hiring contact: ${esc(c.recruiter)}${c.recruiterRole ? `, ${esc(c.recruiterRole)}` : ""}</p>` : ""}</div></article>`;
}
function emCompanyPage() {
  const box = $("empCompany"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  const c = emCoDraft(), st = emCoStrength(c), benefits = [...new Set([...EM_BENEFITS, ...(c.benefits || [])])];
  const fld = (f, label, o = {}) => `<label class="field${o.cls ? " " + o.cls : ""}">${label}${o.hint ? `<span class="q-hint">${o.hint}</span>` : ""}<input type="${o.type || "text"}" data-emi="co" data-f="${f}" value="${esc(c[f] || "")}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ""}${o.list ? ` list="${o.list}"` : ""}${o.max ? ` maxlength="${o.max}"` : ""} autocomplete="off"></label>`;
  box.innerHTML = `${emHead("Company profile", "How job seekers see you. It's shown on your ads, so a complete profile gets more applications.", `<button class="btn primary" type="button" data-em="co-save">Save profile</button>`)}${emNoteBar()}${emStatusLine()}
    <div class="emp-co">
      <div class="stack">
        <section class="panel" aria-labelledby="emCoA"><div class="panel-head"><h2 id="emCoA">About your company</h2></div>
          <div class="q-grid">${fld("name", "Company name", { cls: "wide", ph: "e.g. Blue Gum Engineering", max: 80 })}${fld("tagline", "Tagline", { cls: "wide", hint: "One line on what you do or stand for.", max: 90 })}
            ${emF("Industry", `<select data-emc="co" data-f="industry"><option value="">Choose an industry</option>${JOB_TYPES.map(j => `<option${c.industry === j.label ? " selected" : ""}>${esc(j.label)}</option>`).join("")}</select>`)}${emF("Company size", `<select data-emc="co" data-f="size"><option value="">Choose a size</option>${EM_SIZES.map(s => `<option${c.size === s ? " selected" : ""}>${s}</option>`).join("")}</select>`)}
            ${fld("website", "Website", { type: "url", ph: "https://" })}${fld("location", "Head office", { ph: "Suburb, state", list: "emPlaces2" })}<datalist id="emPlaces2">${EM_PLACES.map(t => `<option value="${esc(t)}">`).join("")}</datalist>
            ${emF("About the company", `<textarea data-emi="co" data-f="about" rows="4" maxlength="900" placeholder="Two or three sentences on what you do and who you do it for">${esc(c.about || "")}</textarea>`, "Candidates read this on every ad.", "wide")}
            ${emF("Culture and values", `<textarea data-emi="co" data-f="culture" rows="3" maxlength="600" placeholder="What's it like to work with you?">${esc(c.culture || "")}</textarea>`, "", "wide")}
            ${fld("abn", "ABN", { hint: "Optional. Not shown to job seekers.", ph: "11 digits" })}<p class="small emp-abn" id="emAbn" role="status">${c.abn ? (abnValid(c.abn) ? "✓ That's a valid ABN." : "Check the ABN: that doesn't look right.") : ""}</p></div></section>
        <section class="panel" aria-labelledby="emCoB"><div class="panel-head"><h2 id="emCoB">Brand</h2></div>
          <div class="emp-brandrow"><div>${emLogo(c, "xl")}</div><div class="stack"><div><span class="small muted">Logo</span><div class="b-actions"><label class="btn emp-file">Upload a logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-emc="co-logo" class="visually-hidden"></label>${c.logo ? `<button class="btn ghost" type="button" data-em="co-logo-x">Remove</button>` : ""}</div><p class="small muted">Square works best. It's shrunk to fit. Without one, your initials show.</p></div>
            <div role="radiogroup" aria-label="Brand colour"><span class="small muted">Colour</span><div class="emp-swatches">${EM_LOGO_COLOURS.map(x => `<label class="emp-sw" style="--c:${x}"><input type="radio" name="emCol" data-emc="co-col" value="${x}"${(c.colour || EM_LOGO_COLOURS[0]) === x ? " checked" : ""}><span class="visually-hidden">${x}</span></label>`).join("")}</div></div></div></div></section>
        <section class="panel" aria-labelledby="emCoC"><div class="panel-head"><h2 id="emCoC">Benefits</h2><p>${(c.benefits || []).length} chosen</p></div>
          <div class="emp-benefits">${benefits.map(b => `<label class="emp-ben${(c.benefits || []).includes(b) ? " on" : ""}"><input type="checkbox" data-emc="co-ben" value="${esc(b)}"${(c.benefits || []).includes(b) ? " checked" : ""}> ${esc(b)}</label>`).join("")}</div>
          <div class="emp-qadd"><label class="field">Add your own<input type="text" id="emBenNew" maxlength="40" placeholder="e.g. Pet-friendly office" autocomplete="off"></label><button class="btn" type="button" data-em="co-ben-add">Add</button></div></section>
        <section class="panel" aria-labelledby="emCoD"><div class="panel-head"><h2 id="emCoD">Who's hiring</h2><p>Shown to candidates, and used to sign your messages.</p></div>
          <div class="q-grid">${fld("recruiter", "Your name", { ph: "e.g. Sam Taylor" })}${fld("recruiterRole", "Your role", { ph: "e.g. People and Culture Lead" })}</div></section>
        <div class="b-actions"><button class="btn primary" type="button" data-em="co-save">Save profile</button><button class="btn ghost" type="button" data-em="co-reset">Undo changes</button><span class="status-line" id="emCoStatus" role="status"></span></div>
      </div>
      <aside class="emp-co-side" aria-label="Preview"><h2>Preview</h2><div id="emCoPrev">${emCoPreview(c)}</div>
        <div class="emp-strength"><div class="emp-strength-h"><b>Profile strength</b><span>${st.pct}%</span></div><div class="emp-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}" aria-label="Profile strength"><i style="width:${st.pct}%"></i></div><ul class="emp-checks small">${st.items.map(([l, ok]) => `<li class="${ok ? "done" : ""}"><span class="emp-tick" aria-hidden="true">${ok ? "✓" : ""}</span>${esc(l)}</li>`).join("")}</ul></div></aside>
    </div>`;
}
EM_PAGES["emp-company"] = emCompanyPage;
function emCoLive() { const p = $("emCoPrev"); if (p) p.innerHTML = emCoPreview(emCoDraft()); }
emIn.co = t => { const c = emCoDraft(); c[t.dataset.f] = t.value; emCo.dirty = true; clearTimeout(emCo.t); emCo.t = setTimeout(emCoLive, 120); if (t.dataset.f === "abn") { const n = $("emAbn"); if (n) n.textContent = t.value ? (abnValid(t.value) ? "✓ That's a valid ABN." : "Check the ABN: that doesn't look right.") : ""; } };
emCh.co = t => { emCoDraft()[t.dataset.f] = t.value; emCo.dirty = true; emCoLive(); };
emCh["co-col"] = t => { emCoDraft().colour = t.value; emCo.dirty = true; emCompanyPage(); };
emCh["co-ben"] = t => { const c = emCoDraft(), s = new Set(c.benefits || []); if (t.checked) s.add(t.value); else s.delete(t.value); c.benefits = [...s]; emCo.dirty = true; emCompanyPage(); };
emAct["co-ben-add"] = () => { const i = $("emBenNew"), v = i.value.trim(); if (!v) return; const c = emCoDraft(); c.benefits = [...new Set([...(c.benefits || []), v.slice(0, 40)])]; emCo.dirty = true; emCompanyPage(); };
emCh["co-logo"] = t => {
  const f = t.files && t.files[0]; if (!f) return;
  if (f.size > 4e6) { toast("That image is over 4 MB. Choose a smaller one.", "warn"); return; }
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const s = 160, k = Math.min(1, s / Math.max(img.width, img.height)), cv = document.createElement("canvas"); cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k)); const g = cv.getContext("2d"); g.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); emCoDraft().logo = cv.toDataURL("image/png"); emCo.dirty = true; emCompanyPage(); };
  img.onerror = () => { URL.revokeObjectURL(url); toast("Couldn't read that image.", "warn"); };
  img.src = url;
};
emAct["co-logo-x"] = () => { delete emCoDraft().logo; emCo.dirty = true; emCompanyPage(); };
emAct["co-reset"] = () => { emCo.draft = null; emCo.dirty = false; emCompanyPage(); };
emAct["co-save"] = async () => {
  const c = emCoDraft();
  if (!String(c.name || "").trim()) { toast("Add your company name first.", "warn"); const n = document.querySelector('[data-f="name"]'); if (n) n.focus(); return; }
  if (c.abn && !abnValid(c.abn)) { toast("Check the ABN. It doesn't look right.", "warn"); return; }
  if (c.website && !safeUrl(c.website)) { toast("The website should start with http:// or https://", "warn"); return; }
  const clean = { ...c, name: c.name.trim() };
  if (await emPersist(emAds(), clean)) { emCo.draft = null; emCo.dirty = false; toast("Company profile saved."); emCompanyPage(); emNavBadge(); }
};

/* ---------- Reports ---------- */
const emRepUI = { days: 30, job: "" };
const emMedian = a => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
const emMid = pay => { const p = parsePay(pay); return p ? (p[0] + p[1]) / 2 : null; };
const emK = n => n >= 1000 ? "$" + Math.round(n / 1000) + "k" : "$" + Math.round(n);
function emBars(rows, total, cap) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="emp-hbars">${rows.map(([l, n, note]) => `<div class="emp-hbar"><span class="emp-hbar-l">${esc(l)}</span><span class="emp-hbar-t" aria-hidden="true"><i style="width:${n / max * 100}%"></i></span><span class="emp-hbar-v"><b>${n}</b>${total ? ` <span class="muted">${Math.round(n / total * 100)}%</span>` : ""}</span></div>`).join("")}</div>`;
}
function emReportsPage() {
  const box = $("empReports"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  const U = emRepUI, ads = emAds().filter(a => emAdState(a) !== "draft"), since = Date.now() - U.days * 864e5;
  const inRange = emPeople((a, ad) => emAdState(ad) !== "draft" && (!U.job || ad.id === U.job) && new Date(a.applied).getTime() >= since);
  const n = inRange.length, st = s => inRange.filter(p => p.stage === s).length, atLeast = ix => inRange.filter(p => p.stage !== "Not suitable" && emStageIx(p.stage) >= ix).length;
  const reached = [["Applied", n], ["Shortlisted or further", atLeast(1)], ["Interviewed or further", atLeast(2)], ["Offer made or further", atLeast(3)], ["Accepted", st("Accepted")]];
  // applications per day (or per week for 90 days)
  const weekly = U.days > 30, slots = weekly ? Math.ceil(U.days / 7) : U.days, slotMs = (weekly ? 7 : 1) * 864e5, today0 = new Date(todayISO() + "T00:00:00").getTime() + 864e5;
  const cols = Array.from({ length: slots }, (_, i) => { const end = today0 - (slots - 1 - i) * slotMs, start = end - slotMs; return { start, n: inRange.filter(p => { const t = new Date(p.app.applied).getTime(); return t >= start && t < end; }).length }; });
  const peak = Math.max(1, ...cols.map(c => c.n)), top = peak <= 4 ? 4 : Math.ceil(peak / 4) * 4;
  const fmtCol = c => weekly ? "Week of " + fmtDay(new Date(c.start).toISOString().slice(0, 10)) : fmtDay(new Date(c.start + 36e5).toISOString().slice(0, 10));
  // per job
  const rows = ads.filter(a => !U.job || a.id === U.job).map(a => { const ps = emPeople((x, ad) => ad.id === a.id); return { a, n: ps.length, nw: ps.filter(p => p.stage === "New").length, hi: ps.filter(p => p.fit.pct >= EM_HIGH).length, sl: ps.filter(p => p.stage !== "Not suitable" && emStageIx(p.stage) >= 1).length, avg: ps.length ? Math.round(ps.reduce((s, p) => s + p.fit.pct, 0) / ps.length) : null, days: a.posted ? Math.max(0, Math.round((Date.now() - new Date(a.posted + "T00:00:00")) / 864e5)) : null, counts: emCounts(a.id) }; }).sort((x, y) => y.n - x.n);
  // invitations and what came of them
  const inv = (emOutbox().invites || []).filter(i => i.kind !== "message" && (!U.job || i.jobId === U.job));
  const invApplied = inv.filter(i => emApplicants().some(a => a.candidate === i.to && a.jobId === i.jobId)).length;
  // the market, for each open job
  const market_ = allJobs();
  const mine = j => j.employerUid === (market.uid || EM_LOCAL_ID) || j.employerUid === EM_LOCAL_ID;
  const insights = ads.filter(a => emAdState(a) === "open" && (!U.job || a.id === U.job)).map(a => {
    const sim = market_.filter(j => !mine(j) && similarity(zoneKey(a.title), zoneKey(j.title)) >= 0.45);
    const pays = sim.map(j => emMid(j.salary)).filter(Boolean), me = emMid(a.salary), med = pays.length ? emMedian(pays) : null;
    return { a, sim: sim.length, med, me, ex: sim.some(j => j.example), pays: pays.length };
  });
  const T = (l, v, sub) => `<div class="emp-tile static"><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ""}</div>`;
  const fit = n ? Math.round(inRange.reduce((s, p) => s + p.fit.pct, 0) / n) : 0;
  box.innerHTML = `${emHead("Reports", "How your hiring is going, and what the market looks like.")}${emNoteBar()}${emStatusLine()}
    <section class="panel"><div class="emp-tools"><label class="emp-sort">Period <select data-emc="rep-days">${[[7, "Last 7 days"], [14, "Last 14 days"], [30, "Last 30 days"], [90, "Last 90 days"]].map(([v, l]) => `<option value="${v}"${U.days === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="emp-sort">Job <select data-emc="rep-job"><option value="">All jobs</option>${ads.map(a => `<option value="${esc(a.id)}"${U.job === a.id ? " selected" : ""}>${esc(a.title)}</option>`).join("")}</select></label></div>
      <div class="emp-tiles">${T("Candidates", n, `in the last ${U.days} days`)}${T("Shortlisted or further", n ? Math.round(atLeast(1) / n * 100) + "%" : "·", `${atLeast(1)} of ${n}`)}${T("Interviews", atLeast(2), "reached interview or further")}${T("Offers", atLeast(3), "made or accepted")}${T("Average fit", n ? fit + "%" : "·", "to the ads they applied for")}</div></section>
    <div class="emp-cols">
      <section class="panel" aria-labelledby="emRepA"><div class="panel-head"><h2 id="emRepA">Hiring funnel</h2><p>How far candidates got</p></div>${n ? emBars(reached, n) : `<p class="small muted">No candidates applied in this period.</p>`}
        <p class="small muted">${st("Not suitable")} moved to Not suitable. <details class="emp-tv"><summary>View as a table</summary><table class="emp-mini"><thead><tr><th scope="col">Stage reached</th><th scope="col">Candidates</th></tr></thead><tbody>${reached.map(r => `<tr><th scope="row">${esc(r[0])}</th><td>${r[1]}</td></tr>`).join("")}</tbody></table></details></p></section>
      <section class="panel" aria-labelledby="emRepB"><div class="panel-head"><h2 id="emRepB">Applications ${weekly ? "each week" : "each day"}</h2><p>Busiest ${weekly ? "week" : "day"}: ${peak === 1 && !cols.some(c => c.n) ? "none yet" : cols.find(c => c.n === peak) ? esc(fmtCol(cols.find(c => c.n === peak))) + ` (${peak})` : "·"}</p></div>
        <div class="emp-cols-chart" role="img" aria-label="Applications ${weekly ? "per week" : "per day"} over the last ${U.days} days. ${esc(cols.filter(c => c.n).map(c => fmtCol(c) + ": " + c.n).join(". ") || "None yet.")}"><div class="emp-yax" aria-hidden="true"><span>${top}</span><span>${top / 2}</span><span>0</span></div><div class="emp-plot">${cols.map(c => `<div class="emp-col" title="${esc(fmtCol(c))}: ${emPlural(c.n, "application")}"><i style="height:${c.n / top * 100}%"></i></div>`).join("")}</div></div>
        <div class="emp-xax small muted" aria-hidden="true"><span>${esc(fmtCol(cols[0]))}</span><span>${esc(fmtCol(cols[cols.length - 1]))}</span></div>
        <details class="emp-tv"><summary>View as a table</summary><table class="emp-mini"><thead><tr><th scope="col">${weekly ? "Week" : "Day"}</th><th scope="col">Applications</th></tr></thead><tbody>${cols.filter(c => c.n).map(c => `<tr><th scope="row">${esc(fmtCol(c))}</th><td>${c.n}</td></tr>`).join("") || `<tr><td colspan="2">None in this period.</td></tr>`}</tbody></table></details></section>
    </div>
    <section class="panel" aria-labelledby="emRepC"><div class="panel-head"><h2 id="emRepC">Jobs</h2><p>All time, per job</p></div>
      ${rows.length ? `<div class="emp-table-wrap"><table class="emp-table"><thead><tr><th scope="col">Job</th><th scope="col">Status</th><th scope="col">Candidates</th><th scope="col">New</th><th scope="col">High fit</th><th scope="col">Shortlisted or further</th><th scope="col">Average fit</th><th scope="col">Days since posted</th><th scope="col">Pipeline</th></tr></thead><tbody>${rows.map(r => `<tr><td data-label="Job"><button type="button" class="emp-link" data-em="job-cands" data-id="${esc(r.a.id)}">${esc(r.a.title)}</button></td><td data-label="Status" class="cap">${emAdState(r.a)}</td><td data-label="Candidates"><b>${r.n}</b></td><td data-label="New">${r.nw}</td><td data-label="High fit">${r.hi}</td><td data-label="Shortlisted or further">${r.sl}</td><td data-label="Average fit">${r.avg == null ? "·" : r.avg + "%"}</td><td data-label="Days since posted">${r.days == null ? "·" : r.days}</td><td data-label="Pipeline">${emPipeBar(r.counts)}</td></tr>`).join("")}</tbody></table></div>
      <div class="emp-legend small muted" aria-hidden="true">${EM_STAGES.map((s, i) => `<span><i class="st-${i}"></i>${s}</span>`).join("")}</div>` : `<p class="small muted">Post a job to see how it's going.</p>`}</section>
    <div class="emp-cols">
      <section class="panel" aria-labelledby="emRepD"><div class="panel-head"><h2 id="emRepD">Invitations</h2><p>People you invited from Talent Search</p></div>
        ${inv.length ? `<div class="emp-tiles two">${T("Invited", inv.length, "to apply")}${T("Applied", invApplied, `${Math.round(invApplied / inv.length * 100)}% of those invited`)}</div>` : `<p class="small muted">You haven't invited anyone yet. Search talent and invite people whose profile fits.</p><div class="b-actions"><button class="btn" type="button" data-em="go-talent">Search talent</button></div>`}</section>
      <section class="panel" aria-labelledby="emRepE"><div class="panel-head"><h2 id="emRepE">Market insights</h2><p>Similar ads in Find jobs</p></div>
        ${insights.length ? `<ul class="emp-rows">${insights.map(i => { const pos = i.med && i.me ? (i.me >= i.med * 1.05 ? ["above", "good"] : i.me <= i.med * 0.95 ? ["below", "warn"] : ["around", ""]) : null; return `<li><div class="emp-row-main"><b>${esc(i.a.title)}</b><span class="small muted">${i.sim ? `${emPlural(i.sim, "similar ad")} in Find jobs${i.ex ? " (including made-up examples)" : ""}` : "No similar ads in Find jobs right now"}</span></div><div class="emp-row-nums">${i.med ? `<span class="small">Typical pay <b>${emK(i.med)}</b> a year${i.pays < 3 ? " (few ads list pay)" : ""}</span>` : `<span class="small muted">No pay to compare</span>`}${pos ? `<span class="emp-pill ${pos[1]}">Yours is ${pos[0]} the market</span>` : i.me ? "" : `<span class="emp-pill warn">Add pay to your ad</span>`}</div></li>`; }).join("")}</ul>` : `<p class="small muted">Open a job to see how it compares.</p>`}</section>
    </div>`;
}
EM_PAGES["emp-reports"] = emReportsPage;
emCh["rep-days"] = t => { emRepUI.days = +t.value; emReportsPage(); };
emCh["rep-job"] = t => { emRepUI.job = t.value; emReportsPage(); };

/* ---------- Starting up ---------- */
function emHookOpen(k) {
  if (k === "emp-company") { emCo.draft = null; emCo.dirty = false; }
  EM_PAGES[k]();
  startMarket().then(() => { if (currentView === k && !(k === "emp-company" && emCo.dirty)) EM_PAGES[k](); emNavBadge(); });
}
onInit(() => {
  document.querySelectorAll('[id^="view-emp"]').forEach(emWire);
  for (const k of Object.keys(EM_PAGES)) if (k !== "emp-post") viewHooks[k] = () => emHookOpen(k);
  hiring.on(() => { if (appMode === "employer") emRefresh(); emNavBadge(); });
  setTimeout(emNavBadge, 2500);
});
