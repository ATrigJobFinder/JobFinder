/* ===================== Employer side, part 4: Post a job (five steps) =====================
   1 Job details  2 Description  3 Candidate questions  4 Ad type and branding  5 Review and post
   The ad you're writing is on the right as job seekers will see it, with an "ad strength" meter and the ad check. */

const EM_STEPS = ["Job details", "Description", "Candidate questions", "Ad type and branding", "Review and post"];
const emPost = { ad: null, step: 1, isNew: true, dirty: false, coName: "", done: null, notes: "" };
let emTitleOpts = null;
const emTitleList = () => emTitleOpts || (emTitleOpts = [...new Set(Object.values(JOB_TITLES).flatMap(s => s.split(";")))].sort());

function emStartPost(id, step) {
  const co = emCompany(), existing = id ? emAd(id) : null;
  emPost.ad = existing ? JSON.parse(JSON.stringify(existing)) : emNormAd({ ...emptyJobAd(), location: co.location || "", category: co.industry || "", payType: "year", payMin: "", payMax: "", showPay: true, superOn: true, closes: addDaysISO(todayISO(), 30), status: "draft" });
  emPost.isNew = !existing || existing.status === "draft";
  emPost.step = step || 1; emPost.dirty = false; emPost.coName = ""; emPost.done = null;
  emGo("emp-post");
  if (currentView === "emp-post") emPostRender();   // (already on the page: the hash doesn't change, so draw it now)
}
// keep the pieces the page reads in step with the boxes
function emSyncAd() {
  const a = emPost.ad; if (!a) return;
  a.salary = a.showPay === false ? "" : emPayLine(a);
  a.skills = adSkills(a).slice(0, 20);
  a.description = jobAdText(a);
}
function emStrength(a) {
  const tips = []; let s = 0;
  const add = (ok, pts, tip) => { if (ok) s += pts; else tips.push(tip); };
  add(a.title && a.title.trim().length > 2, 10, "Add a job title");
  add(a.location, 8, "Add a location");
  add(a.showPay !== false && (a.payMin || a.payMax || a.salary), 15, "Show the pay");
  add(wordCount(a.summary || "") >= 25, 15, "Write a summary of at least 25 words");
  add((a.duties || []).length >= 3, 10, "List at least three things they'll do");
  add((a.musts || []).length >= 1 && (a.musts || []).length <= 7, 10, "List one to seven must-haves");
  add((a.offer || []).length >= 1, 10, "Say what you offer");
  add((a.questions || []).length >= 1, 10, "Add a candidate question");
  add(!checkAd(a).some(c => c[0] === "bad"), 12, "Fix the wording flagged in the ad check");
  return { pct: Math.min(100, s), label: s >= 85 ? "Great" : s >= 65 ? "Good" : s >= 40 ? "Fair" : "Getting started", tips };
}
function emStepIssues(a, co) {
  const out = [];
  if (!(co.name || emPost.coName).trim()) out.push([1, "Add your company name"]);
  if (!a.title.trim()) out.push([1, "Add a job title"]);
  if (!a.location.trim()) out.push([1, "Add a location, or say it's remote"]);
  if (wordCount(a.summary || "") < 10) out.push([2, "Write a short summary of the job (a couple of sentences)"]);
  const bad = checkAd(a).find(c => c[0] === "bad"); if (bad) out.push([2, bad[1]]);
  if (a.closes && a.closes < todayISO() && a.status !== "closed") out.push([1, "Pick a closing date that isn't in the past"]);
  (a.questions || []).forEach((q, i) => { if (!q.text.trim()) out.push([3, `Question ${i + 1} is empty`]); else if (q.type === "choice" && (q.options || []).length < 2) out.push([3, `Question ${i + 1} needs at least two answers to choose from`]); else if (q.must && q.type === "choice" && !(q.ideal || []).length) out.push([3, `Question ${i + 1}: pick which answers are acceptable`]); });
  return out;
}
const emF = (label, inner, hint, cls) => `<label class="field${cls ? " " + cls : ""}">${label}${hint ? `<span class="q-hint">${hint}</span>` : ""}${inner}</label>`;
const emInp = (f, v, o = {}) => `<input type="${o.type || "text"}" data-emi="ad" data-f="${f}" value="${esc(v == null ? "" : v)}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ""}${o.list ? ` list="${o.list}"` : ""}${o.attrs || ""} autocomplete="off">`;
const emSel = (f, v, opts) => `<select data-emc="ad" data-f="${f}">${opts.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${val === v ? " selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`;
const emLines = (f, a, label, hint, rows) => emF(label, `<textarea data-emi="ad" data-f="${f}" data-list="1" rows="${rows || 4}" placeholder="${esc(hint)}">${esc((a[f] || []).join("\n"))}</textarea>`);

/* --- The ad as job seekers will see it --- */
function emAdPreview(a, co) {
  const t = emTier(a), cc = { ...co, name: co.name || emPost.coName || "Your company" };
  const pay = a.showPay === false ? "" : emPayLine(a);
  const sec = (h, l) => l && l.length ? `<h4>${h}</h4><ul>${l.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  return `<article class="emp-prev${t.brand ? " branded" : ""}" style="--c:${emColour(co.colour)}">
    <header>${t.brand ? emLogo(co) : ""}<div><h3>${esc(a.title || "Job title")}</h3><p>${esc(cc.name)}${a.location ? ` · ${esc(a.location)}` : ""}</p></div>${t.promo ? `<span class="emp-promo-tag">Promoted</span>` : ""}</header>
    <p class="job-meta">${[a.workType, a.remote, pay].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}${a.category ? `<span>${esc(a.category)}</span>` : ""}</p>
    ${t.brand && (a.sellingPoints || []).filter(Boolean).length ? `<ul class="emp-sp">${a.sellingPoints.filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${a.summary ? `<p>${esc(a.summary)}</p>` : `<p class="muted">Your summary shows here.</p>`}${sec("What you'll do", a.duties)}${sec("What you'll need", a.musts)}${sec("Nice to have", a.nices)}${sec("What we offer", a.offer)}
    ${(a.questions || []).length ? `<p class="small muted">${emPlural(a.questions.length, "question")} to answer when applying.</p>` : ""}
  </article>`;
}
function emChecksHTML(a) {
  const st = emStrength(a);
  return `<div class="emp-strength"><div class="emp-strength-h"><b>Ad strength</b><span class="emp-str-${st.pct >= 85 ? "great" : st.pct >= 65 ? "good" : "low"}">${st.label}</span></div><div class="emp-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}" aria-label="Ad strength"><i style="width:${st.pct}%"></i></div>${st.tips.length ? `<ul class="small">${st.tips.slice(0, 4).map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="small muted">Nothing left to add.</p>`}</div>
    <div class="em-checks"><h3>Ad check</h3><ul>${checkAd(a).map(([k, m]) => `<li class="${k}">${esc(m)}</li>`).join("")}</ul></div>`;
}
let emLiveT = 0;
function emPostLive() {
  clearTimeout(emLiveT);
  emLiveT = setTimeout(() => {
    emSyncAd();
    const a = emPost.ad; if (!a || currentView !== "emp-post") return;
    const p = $("emPrev"), c = $("emChecks"), pay = $("emPayLine");
    if (p) p.innerHTML = emAdPreview(a, emCompany());
    if (c) c.innerHTML = emChecksHTML(a);
    if (pay) pay.textContent = a.showPay === false ? "Pay won't be shown on the ad." : (emPayLine(a) ? "Job seekers will see: " + emPayLine(a) : "Add a pay range so job seekers can see if it fits.");
  }, 140);
}

/* --- The five steps --- */
function emStep1(a, co) {
  return `${!co.name ? emF("Company name", `<input type="text" data-emi="coName" value="${esc(emPost.coName)}" placeholder="e.g. Blue Gum Engineering" autocomplete="organization">`, "Shown on the ad. You can add the rest on the Company profile page.") : ""}
    <div class="q-grid">
      ${emF("Job title", emInp("title", a.title, { list: "emTitles", ph: "e.g. Graduate Mechanical Engineer" }) + `<datalist id="emTitles">${emTitleList().map(t => `<option value="${esc(t)}">`).join("")}</datalist>`, "", "wide")}
      ${emF("Location", emInp("location", a.location, { list: "emPlaces", ph: "Suburb, state" }) + `<datalist id="emPlaces">${EM_PLACES.map(t => `<option value="${esc(t)}">`).join("")}</datalist>`)}
      ${emF("Where will they work?", emSel("remote", a.remote, ["On-site", "Hybrid", "Remote"]))}
      ${emF("Work type", emSel("workType", a.workType, EM_WORK_TYPES))}
      ${emF("Category", emSel("category", a.category || "", [["", "Choose a category"], ...JOB_TYPES.map(j => j.label)]), "Helps job seekers searching by industry find it.")}
    </div>
    <fieldset class="emp-fs"><legend>Pay</legend>
      <label class="q-check"><input type="checkbox" data-emc="ad" data-f="showPay"${a.showPay === false ? "" : " checked"}> Show the pay on the ad</label>
      <div class="q-grid emp-pay">${emF("Paid", emSel("payType", a.payType || "year", [["year", "Per year"], ["hour", "Per hour"], ["day", "Per day"]]))}${emF("From ($)", emInp("payMin", a.payMin, { type: "number", ph: a.payType === "hour" ? "e.g. 32" : "e.g. 75000", attrs: ' min="0" step="any" inputmode="decimal"' }))}${emF("To ($)", emInp("payMax", a.payMax, { type: "number", ph: a.payType === "hour" ? "e.g. 36" : "e.g. 82000", attrs: ' min="0" step="any" inputmode="decimal"' }))}${(a.payType || "year") === "year" ? `<label class="q-check emp-super"><input type="checkbox" data-emc="ad" data-f="superOn"${a.superOn === false ? "" : " checked"}> Plus superannuation</label>` : ""}</div>
      <p class="small muted" id="emPayLine" role="status">${a.showPay === false ? "Pay won't be shown on the ad." : emPayLine(a) ? "Job seekers will see: " + esc(emPayLine(a)) : "Add a pay range so job seekers can see if it fits."}</p>
    </fieldset>
    <div class="q-grid">${emF("Applications close", emInp("closes", a.closes, { type: "date", attrs: ` min="${todayISO()}" max="${addDaysISO(todayISO(), 90)}"` }).replace('data-emi="ad"', 'data-emc="ad"'), "Ads stay in Find jobs until then, up to 90 days.")}${emF("Job ID", `<input type="text" value="${esc(emAdRef(a))}" readonly>`, "Made for you, so you can find the ad later.")}</div>`;
}
function emStep2(a) {
  return `<div class="emp-draft"><label class="field">Rough notes <span class="q-hint">Optional. Jot down the duties, must-haves and what you offer in any words, and Job Finder will sort them into an ad. It only uses what you write.</span><textarea data-emi="ad" data-f="notes" rows="3" placeholder="e.g. 3D models in SolidWorks, must have a mechanical degree, mentoring, hybrid after 3 months">${esc(a.notes || "")}</textarea></label>
    <div class="b-actions"><button class="btn" type="button" data-em="post-draft">Write the ad from my notes</button>${statusHTML("adEngine", "engine-note")}</div></div>
    ${emF("Summary", `<textarea data-emi="ad" data-f="summary" rows="4" placeholder="Two or three sentences: what the job is, who it's for and why it's a good one">${esc(a.summary)}</textarea>`, "The first thing candidates read.")}
    <div class="q-grid">${emLines("duties", a, "What they'll do", "One per line")}${emLines("musts", a, "What they'll need", "The essentials only, one per line")}${emLines("nices", a, "Nice to have", "One per line", 3)}${emLines("offer", a, "What you offer", "Training, flexibility, extras… one per line", 3)}</div>`;
}
function emQCard(q, i, n) {
  const typeSel = `<select data-emc="q" data-qid="${q.id}" data-f="type" aria-label="Answer type">${[["yes", "Yes or no"], ["choice", "Choose one"], ["number", "A number"], ["text", "Written answer"]].map(([v, l]) => `<option value="${v}"${q.type === v ? " selected" : ""}>${l}</option>`).join("")}</select>`;
  let must = "";
  if (q.must && q.type === "yes") must = `<div class="emp-q-must">Candidates should answer ${`<select data-emc="q" data-qid="${q.id}" data-f="ideal-yes" aria-label="Wanted answer"><option${(q.ideal || [])[0] !== "No" ? " selected" : ""}>Yes</option><option${(q.ideal || [])[0] === "No" ? " selected" : ""}>No</option></select>`}</div>`;
  if (q.must && q.type === "choice") must = `<fieldset class="emp-q-must"><legend>Acceptable answers</legend>${(q.options || []).map(o => `<label class="q-check"><input type="checkbox" data-emc="q" data-qid="${q.id}" data-f="ideal-opt" value="${esc(o)}"${(q.ideal || []).includes(o) ? " checked" : ""}> ${esc(o)}</label>`).join("") || `<span class="small muted">Add the answers above first.</span>`}</fieldset>`;
  if (q.must && q.type === "number") must = `<div class="emp-q-must">Acceptable range: ${`<input type="number" data-emi="q" data-qid="${q.id}" data-f="min" value="${esc(q.min)}" placeholder="At least" aria-label="At least">`} to ${`<input type="number" data-emi="q" data-qid="${q.id}" data-f="max" value="${esc(q.max)}" placeholder="At most" aria-label="At most">`}</div>`;
  return `<li class="emp-q" data-qid="${q.id}"><div class="emp-q-top"><span class="emp-q-n">${i + 1}</span><textarea rows="2" data-emi="q" data-qid="${q.id}" data-f="text" aria-label="Question ${i + 1}" placeholder="Type your question">${esc(q.text)}</textarea></div>
    <div class="emp-q-opts">${typeSel}${q.type !== "text" ? `<label class="q-check"><input type="checkbox" data-emc="q" data-qid="${q.id}" data-f="must"${q.must ? " checked" : ""}> Must have</label>` : ""}<span class="emp-q-btns"><button type="button" class="btn ghost" data-em="q-up" data-qid="${q.id}" aria-label="Move question ${i + 1} up"${i === 0 ? " disabled" : ""}>↑</button><button type="button" class="btn ghost" data-em="q-down" data-qid="${q.id}" aria-label="Move question ${i + 1} down"${i === n - 1 ? " disabled" : ""}>↓</button><button type="button" class="btn ghost" data-em="q-del" data-qid="${q.id}" aria-label="Remove question ${i + 1}">Remove</button></span></div>
    ${q.type === "choice" ? `<label class="field emp-q-choices">Answers to choose from <textarea rows="${Math.min(7, Math.max(3, (q.options || []).length))}" data-emc="q" data-qid="${q.id}" data-f="options" placeholder="One per line">${esc((q.options || []).join("\n"))}</textarea></label>` : ""}${must}</li>`;
}
function emStep3(a) {
  const qs = a.questions || [], sugg = emSuggestQs(a), cats = [...new Set(EM_QLIB.map(l => l.cat))];
  return `<p class="emp-lede">Questions help you tell candidates apart before you read a single resume. Mark the ones that are essential as <b>must haves</b>, and anyone who doesn't meet them can be moved to <b>Not suitable</b> for you. Job seekers can't see which ones are must haves.</p>
    ${qs.length ? `<ol class="emp-qs">${qs.map((q, i) => emQCard(q, i, qs.length)).join("")}</ol>` : `<p class="emp-q-none">No questions yet. Add one from the suggestions, pick one from the library, or write your own.</p>`}
    ${qs.some(q => q.must) ? `<label class="q-check emp-auto"><input type="checkbox" data-emc="ad" data-f="autoNS"${a.autoNS === false ? "" : " checked"}> <span>Move candidates who don't meet a must have to <b>Not suitable</b> (you can move them back)</span></label>` : ""}
    ${sugg.length ? `<div class="emp-sugg"><h3>Suggested for this job</h3><div class="chips">${sugg.map((l, i) => `<button type="button" class="emp-sg" data-em="q-sugg" data-i="${i}"><span aria-hidden="true">+</span> ${esc(l.text)}</button>`).join("")}</div></div>` : ""}
    <div class="emp-qadd"><label class="field">Add from the library<select id="emLib"><option value="">Choose a question…</option>${cats.map(c => `<optgroup label="${esc(c)}">${EM_QLIB.map((l, i) => [l, i]).filter(([l]) => l.cat === c).map(([l, i]) => `<option value="${i}">${esc(l.text)}</option>`).join("")}</optgroup>`).join("")}</select></label><button type="button" class="btn" data-em="q-lib">Add</button><button type="button" class="btn" data-em="q-new">Write my own</button></div>
    ${qs.length >= 20 ? `<p class="small muted">That's the most you can add: 20 questions.</p>` : ""}`;
}
function emStep4(a, co) {
  const sp = [...(a.sellingPoints || []), "", "", ""].slice(0, 3), t = emTier(a);
  return `<p class="emp-lede">Choose how your ad shows in Find jobs. <b>All three are free</b> while Job Finder is new.</p>
    <div class="emp-tiers" role="radiogroup" aria-label="Ad type">${EM_TIERS.map(x => `<label class="emp-tierc${a.tier === x.key || (!a.tier && x.key === "basic") ? " on" : ""}"><input type="radio" name="emTier" data-emc="tier" value="${x.key}"${(a.tier || "basic") === x.key ? " checked" : ""}><span class="emp-tier ${x.key}">${x.name}</span><b>${x.line}</b><ul>${x.perks.map(p => `<li>${esc(p)}</li>`).join("")}</ul><span class="emp-price">Free</span></label>`).join("")}</div>
    ${t.brand ? `<section class="emp-brand"><h3>Your brand on this ad</h3>
      <div class="emp-brand-co">${emLogo(co, "lg")}<div><b>${esc(co.name || emPost.coName || "Your company")}</b><p class="small muted">Your logo and colour come from your Company profile. <button type="button" class="linkish" data-em="post-to-company">Change them</button></p></div></div>
      <div class="emp-sp-in"><span class="small muted">Selling points: up to three short lines shown with the ad</span>${sp.map((v, i) => `<label class="field"><span class="visually-hidden">Selling point ${i + 1}</span><input type="text" data-emi="sp" data-i="${i}" maxlength="80" value="${esc(v)}" placeholder="${["e.g. Mentored by a chartered engineer", "e.g. Hybrid after three months", "e.g. Four-day project reviews"][i]}" autocomplete="off"></label>`).join("")}</div></section>` : `<p class="small muted">Choose Advanced or Premium to show your logo and selling points.</p>`}`;
}
function emStep5(a, co) {
  const issues = emStepIssues(a, co), st = emStrength(a), bad = checkAd(a).filter(c => c[0] !== "ok");
  const qs = a.questions || [];
  return `${issues.length ? `<div class="emp-issues" role="alert"><b>Fix these before you post</b><ul>${issues.map(([n, m]) => `<li>${esc(m)} <button type="button" class="linkish" data-em="post-step" data-n="${n}">Go to step ${n}</button></li>`).join("")}</ul></div>` : `<p class="emp-ready">Everything needed is in. Have a look at the ad on the right, then post it.</p>`}
    <dl class="emp-sum">
      <div><dt>Job</dt><dd>${esc(a.title)} · ${esc(a.location)}</dd></div>
      <div><dt>Type</dt><dd>${esc([a.workType, a.remote, a.category].filter(Boolean).join(" · "))}</dd></div>
      <div><dt>Pay</dt><dd>${a.showPay === false ? "Not shown on the ad" : esc(emPayLine(a)) || "Not given"}</dd></div>
      <div><dt>Closes</dt><dd>${a.closes ? esc(fmtDay(a.closes)) + ` (${emDaysLeft(a.closes)} days)` : "No closing date"}</dd></div>
      <div><dt>Questions</dt><dd>${qs.length ? `${emPlural(qs.length, "question")}, ${qs.filter(q => q.must).length} must-have` : "None"}</dd></div>
      <div><dt>Ad type</dt><dd><span class="emp-tier ${emTier(a).key}">${esc(emTier(a).name)}</span></dd></div>
      <div><dt>Ad strength</dt><dd>${st.label} (${st.pct}%)</dd></div>
    </dl>
    ${bad.length ? `<div class="em-checks"><h3>Worth a look</h3><ul>${bad.map(([k, m]) => `<li class="${k}">${esc(m)}</li>`).join("")}</ul></div>` : ""}`;
}
function emPostRender() {
  const box = $("empPost"); if (!box) return;
  if (!market.settled && !hiring.data.demo) { box.innerHTML = emLoading(); return; }
  if (!emPost.ad && !emPost.done) emStartPostSilently();
  const a = emPost.ad, co = emCompany(), n = emPost.step;
  if (emPost.done) {
    const d = emPost.done;
    box.innerHTML = `<section class="panel emp-done"><div class="emp-done-ic" aria-hidden="true">✓</div><h1>${d.draft ? "Draft saved" : d.edit ? "Changes saved" : "Your job is live"}</h1><p>${d.draft ? `“${esc(d.title)}” is saved in your drafts. Finish it any time.` : `“${esc(d.title)}” ${d.edit ? "is updated" : "is now in Find jobs"}, and candidates can apply${d.closes ? ` until ${esc(fmtDay(d.closes))}` : ""}.`}</p>
      <div class="b-actions">${d.draft ? `<button class="btn primary" type="button" data-em="job-edit" data-id="${esc(d.id)}">Keep editing</button>` : `<button class="btn primary" type="button" data-em="job-cands" data-id="${esc(d.id)}">View candidates</button>`}<button class="btn" type="button" data-em="go-jobs">Go to Jobs</button>${d.draft || d.edit ? "" : `<button class="btn" type="button" data-em="post">Post another job</button>`}${!d.draft ? `<button class="btn" type="button" data-em="go-talent">Search talent for it</button>` : ""}</div></section>`;
    return;
  }
  emSyncAd();
  const body = [emStep1, emStep2, emStep3, emStep4, emStep5][n - 1](a, co);
  const issueSteps = new Set(emStepIssues(a, co).map(x => x[0]));
  box.innerHTML = `${emHead(emPost.isNew ? "Post a job" : "Edit job", "Five short steps. You can save as a draft and come back at any time.", `<button class="btn ghost" type="button" data-em="post-exit">Exit</button>`)}${emNoteBar()}${emStatusLine()}
    <div class="emp-post">
      <nav class="emp-steps" aria-label="Steps"><ol>${EM_STEPS.map((s, i) => `<li><button type="button" data-em="post-step" data-n="${i + 1}"${n === i + 1 ? ' aria-current="step"' : ""} class="${i + 1 < n && !issueSteps.has(i + 1) ? "done" : ""}"><span class="emp-step-n">${i + 1 < n && !issueSteps.has(i + 1) ? "✓" : i + 1}</span><span>${s}</span></button></li>`).join("")}</ol></nav>
      <section class="panel emp-post-main" aria-labelledby="emStepH"><div class="panel-head"><h2 id="emStepH">Step ${n}: ${EM_STEPS[n - 1]}</h2></div>
        <div class="emp-step-body">${body}</div>
        <div class="b-actions emp-foot">${n > 1 ? `<button class="btn" type="button" data-em="post-back">Back</button>` : ""}${n < 5 ? `<button class="btn primary" type="button" data-em="post-next">Next: ${EM_STEPS[n]}</button>` : `<button class="btn primary" type="button" data-em="post-publish">${emPost.isNew ? "Post the job" : "Save changes"}</button>`}${emPost.isNew && a.status === "draft" ? `<button class="btn" type="button" data-em="post-save-draft">Save as draft</button>` : ""}<span class="status-line" id="emPostStatus" role="status"></span></div>
      </section>
      <aside class="emp-post-side" aria-label="Your ad as job seekers see it"><h2>Your ad</h2><div id="emPrev">${emAdPreview(a, co)}</div><div id="emChecks">${emChecksHTML(a)}</div></aside>
    </div>`;
}
function emStartPostSilently() {
  const co = emCompany();
  emPost.ad = emNormAd({ ...emptyJobAd(), location: co.location || "", category: co.industry || "", payType: "year", payMin: "", payMax: "", showPay: true, superOn: true, closes: addDaysISO(todayISO(), 30), status: "draft" });
  emPost.isNew = true; emPost.step = 1; emPost.done = null; emPost.dirty = false;
}
EM_PAGES["emp-post"] = emPostRender;

/* --- Moving around --- */
const emPostSay = (t, err) => { const s = $("emPostStatus"); if (s) { s.textContent = t; s.classList.toggle("err", !!err); } };
function emPostGo(n) { emPost.step = Math.max(1, Math.min(5, n)); emPostRender(); window.scrollTo({ top: 0 }); }
emAct["post-step"] = b => { if (emPost.step === 1 && +b.dataset.n > 1 && !emPost.ad.title.trim()) { emPostSay("Add a job title first.", true); return; } emPostGo(+b.dataset.n); };
emAct["post-back"] = () => emPostGo(emPost.step - 1);
emAct["post-next"] = () => { if (emPost.step === 1 && !emPost.ad.title.trim()) { emPostSay("Add a job title first.", true); const t = document.querySelector('[data-f="title"]'); if (t) t.focus(); return; } emPostGo(emPost.step + 1); };
emAct["post-to-company"] = () => emGo("emp-company");
async function emPostSave(asDraft) {
  const a = emPost.ad, co = emCompany(), issues = emStepIssues(a, co);
  if (!asDraft && issues.length) { emPostGo(5); return; }
  if (asDraft && !a.title.trim()) { emPostSay("Add a job title first.", true); return; }
  emSyncAd();
  const company = { ...co, name: co.name || emPost.coName.trim() };
  if (!company.name) { emPostSay("Add your company name first.", true); emPostGo(1); return; }
  if (!asDraft && a.status === "draft") a.status = "open";
  if (asDraft) a.status = "draft";
  if (!a.posted) a.posted = todayISO();
  const ads = emAds().filter(x => x.id !== a.id); ads.unshift({ ...a, notes: a.notes || "" });
  emPostSay("Saving…");
  if (await emPersist(ads, company)) {
    emPost.done = { id: a.id, title: a.title, draft: asDraft, edit: !emPost.isNew && !asDraft, closes: a.closes };
    emPost.dirty = false; emPost.ad = null;
    emPostRender(); window.scrollTo({ top: 0 }); emNavBadge();
  } else emPostSay((flash.emStatus && flash.emStatus.text) || "Couldn't save just now.", true);
}
emAct["post-publish"] = () => emPostSave(false);
emAct["post-save-draft"] = () => emPostSave(true);
emAct["post-exit"] = async () => {
  const a = emPost.ad;
  if (a && emPost.dirty && a.title.trim()) {
    const r = await emModal("Leave without posting?", `<p>You've made changes to “${esc(a.title)}”.</p>`, [{ label: "Keep editing", v: "", ghost: true }, { label: "Discard changes", v: "discard" }, ...(emPost.isNew ? [{ label: "Save as draft", v: "draft", primary: true }] : [])]);
    if (!r) return;
    if (r.v === "draft") { await emPostSave(true); return; }
  }
  emPost.ad = null; emPost.dirty = false; emGo("emp-jobs");
};
/* --- Boxes --- */
emIn.ad = t => {
  const a = emPost.ad; if (!a) return;
  const f = t.dataset.f;
  a[f] = t.dataset.list ? t.value.split("\n").map(s => s.replace(BULLET_RE, "").trim()).filter(Boolean) : t.value;
  emPost.dirty = true; emPostLive();
};
emCh.ad = t => {
  const a = emPost.ad; if (!a) return;
  const f = t.dataset.f;
  a[f] = t.type === "checkbox" ? t.checked : t.value;
  emPost.dirty = true;
  if (f === "payType" || f === "autoNS") { emPostRender(); return; }
  emPostLive();
};
emIn.coName = t => { emPost.coName = t.value; emPost.dirty = true; emPostLive(); };
emIn.sp = t => { const a = emPost.ad; a.sellingPoints = a.sellingPoints || []; a.sellingPoints[+t.dataset.i] = t.value; a.sellingPoints = [0, 1, 2].map(i => a.sellingPoints[i] || "").filter(Boolean).length ? [0, 1, 2].map(i => a.sellingPoints[i] || "") : []; emPost.dirty = true; emPostLive(); };
emCh.tier = t => { emPost.ad.tier = t.value; emPost.dirty = true; emPostRender(); };
/* --- Questions --- */
const emQ = id => (emPost.ad.questions || []).find(q => q.id === id);
const emQRedraw = () => { const y = window.scrollY; emPostRender(); window.scrollTo({ top: y }); };
emIn.q = t => {
  const q = emQ(t.dataset.qid); if (!q) return;
  q[t.dataset.f] = t.value; emPost.dirty = true; emPostLive();
};
emCh.q = t => {
  const q = emQ(t.dataset.qid); if (!q) return;
  const f = t.dataset.f; emPost.dirty = true;
  if (f === "type") { q.type = t.value; if (q.type === "yes") { q.options = []; q.ideal = ["Yes"]; } else if (q.type === "choice") { q.options = q.options && q.options.length ? q.options : ["Yes", "No"]; q.ideal = []; } else { q.options = []; q.ideal = []; } if (q.type === "text") q.must = false; }
  else if (f === "must") { q.must = t.checked; if (q.must && q.type === "yes" && !(q.ideal || []).length) q.ideal = ["Yes"]; }
  else if (f === "ideal-yes") q.ideal = [t.value];
  else if (f === "ideal-opt") { const s = new Set(q.ideal || []); if (t.checked) s.add(t.value); else s.delete(t.value); q.ideal = [...s]; emPostLive(); return; }
  else if (f === "options") { q.options = t.value.split("\n").map(s => s.trim()).filter(Boolean); q.ideal = (q.ideal || []).filter(o => q.options.includes(o)); }
  emQRedraw();
};
const emAddQ = q => { const a = emPost.ad; if ((a.questions || []).length >= 20) { emPostSay("That's the most you can add: 20 questions.", true); return; } a.questions = [...(a.questions || []), q]; emPost.dirty = true; emQRedraw(); };
emAct["q-new"] = () => { emAddQ(emNewQ({ text: "" })); const l = [...document.querySelectorAll(".emp-q textarea[data-f=text]")].pop(); if (l) l.focus(); };
emAct["q-sugg"] = b => { const l = emSuggestQs(emPost.ad)[+b.dataset.i]; if (l) emAddQ(emQFromLib(l)); };
emAct["q-lib"] = () => { const s = $("emLib"); if (s && s.value !== "") emAddQ(emQFromLib(EM_QLIB[+s.value])); };
emAct["q-del"] = b => { emPost.ad.questions = emPost.ad.questions.filter(q => q.id !== b.dataset.qid); emPost.dirty = true; emQRedraw(); };
const emQMove = (id, d) => { const qs = emPost.ad.questions, i = qs.findIndex(q => q.id === id), j = i + d; if (i < 0 || j < 0 || j >= qs.length) return; [qs[i], qs[j]] = [qs[j], qs[i]]; emPost.dirty = true; emQRedraw(); const b = document.querySelector(`[data-qid="${id}"] [data-em="q-${d < 0 ? "up" : "down"}"]`); if (b) b.focus(); };
emAct["q-up"] = b => emQMove(b.dataset.qid, -1);
emAct["q-down"] = b => emQMove(b.dataset.qid, 1);

/* --- Write the ad from notes (AI, checked against the notes; or the notes sorted into sections) --- */
async function emDraftAd() {
  const e = emPost.ad, btn = document.querySelector('[data-em="post-draft"]'), co = emCompany();
  if (!(e.notes || "").trim() && !e.title) { say("adEngine", "Add a job title and a few notes first.", true); return; }
  btn.disabled = true;
  const cname = co.name || emPost.coName;
  const src = [e.title, e.notes, e.location, e.salary, co.about].join("\n");
  const r = await aiJSON({ nano: JOBAD_NANO, prompt: `Company: ${cname || "(not given)"}\nAbout the company: ${co.about || "(not given)"}\nJob title: ${e.title}\nLocation: ${e.location || "(not given)"}\nWork type: ${e.workType}, ${e.remote}\nPay: ${e.salary || "(not given: don't mention pay)"}\nEmployer's notes:\n${e.notes}`, schema: JOBAD_SCHEMA, label: "Writing the ad", progress: m => say("adEngine", m),
    check: d => { const all = [d.summary, ...(d.duties || []), ...(d.musts || []), ...(d.nices || []), ...(d.offer || [])].join("\n"); const why = factCheck(all, src, { min: 40 }); return why ? { ok: false, why } : { ok: true, value: d }; } });
  btn.disabled = false;
  let msg;
  if (!r.data) {
    const lines = listOf(String(e.notes || "").replace(/\n/g, ";"));
    const tidy = l => { const t = l.replace(/^(you )?(must have|must be|must|need(s)? to have|needs?|required|essential|nice to have|bonus|desirable|ideally|we offer|we provide|we'll provide|offer|benefits?)\b[:\s-]*/i, "").trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
    const isMust = l => /\b(must|need|require|essential)/i.test(l), isNice = l => /\b(nice to have|bonus|desirable|ideally)/i.test(l), isOffer = l => /\b(we offer|offer|benefit|we provide|flexib|training|leave|salary|super\b|mentor)/i.test(l);
    e.musts = lines.filter(l => isMust(l) && !isNice(l)).map(tidy);
    e.nices = lines.filter(isNice).map(tidy);
    e.offer = lines.filter(l => isOffer(l) && !isMust(l) && !isNice(l)).map(tidy);
    e.duties = lines.filter(l => !isMust(l) && !isNice(l) && !isOffer(l)).map(tidy);
    if (!e.summary) e.summary = `${cname || "We"} ${cname ? "is" : "are"} looking for ${aOrAn(e.title)} ${e.title}${e.location ? ` in ${e.location}` : ""}.`;
    msg = r.rejected ? "The AI's draft added things that weren't in your notes, so your notes were sorted into sections instead." : "No AI is connected, so your notes were sorted into sections. Edit them below.";
  } else { Object.assign(e, { summary: r.data.summary, duties: r.data.duties, musts: r.data.musts, nices: r.data.nices, offer: r.data.offer }); msg = `Written by ${viaWords(r.via)} from your notes. Check it before posting.`; }
  emPost.dirty = true; flash.adEngine = { text: msg, err: false, t: Date.now() };
  emPostRender();
}
emAct["post-draft"] = () => emDraftAd();
viewHooks["emp-post"] = () => {
  if (emPost.done && !emPost.justDone) { emPost.done = null; emPost.ad = null; }
  if (!emPost.ad && !emPost.done) emStartPostSilently();
  emPost.justDone = false;
  startMarket().then(() => { if (currentView === "emp-post" && !emPost.dirty) emPostRender(); });
  emPostRender();
};
