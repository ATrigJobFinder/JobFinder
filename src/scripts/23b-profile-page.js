/* ===================== Create or edit profile: the details every page uses ===================== */
const PROFILE_FIELDS = [
  ["Your details", [
    ["contact.first", "First name", "text", "given-name"], ["contact.last", "Last name", "text", "family-name"], ["contact.email", "Email", "email", "email"], ["contact.phone", "Phone", "tel", "tel"],
    ["contact.location", "Suburb and state", "text", "address-level2", "e.g. Parramatta NSW"], ["contact.linkedin", "LinkedIn profile link", "url", "url", "linkedin.com/in/your-name"],
    ["contact.website", "Website or portfolio", "url", "url"]
  ]],
  ["Working in Australia", [
    ["contact.workRights", "Work rights", "select", WORK_RIGHTS], ["contact.licence", "Driver's licence", "text", "", "e.g. Full NSW car licence"],
    ["availability", "When you can start", "text", "", "e.g. from February 2027, full time"]
  ]],
  ["What you're looking for", [
    ["target.title", "Job you want", "text", "", "e.g. Graduate Civil Engineer"], ["target.jobType", "Kind of work", "select", ["", ...JOB_TYPES.map(j => [j.key, j.label])]],
    ["target.stage", "Career stage", "select", ["", ...STAGES.map(s => [s.key, s.label])]]
  ]],
  ["How dates look on your resume", [
    ["prefs.dateStyle", "Date style", "select", [["words", "Nov 2026"], ["long", "November 2026"], ["numeric", "11/2026"]]]
  ]]
];
function renderProfilePage() {
  const p = P();
  const box = $("pfForm");
  if (!box.dataset.built) {
    box.innerHTML = PROFILE_FIELDS.map(([title, fields]) => `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2></div><div class="q-grid">${fields.map(([path, label, type, extra, ph]) => {
      const id = "pf-" + path.replace(/\./g, "-");
      if (type === "select") return `<label class="field" for="${id}">${esc(label)}<select id="${id}" data-pf="${path}">${extra.map(o => Array.isArray(o) ? `<option value="${esc(o[0])}">${esc(o[1] || "Choose…")}</option>` : `<option value="${esc(o)}">${esc(o || "Choose…")}</option>`).join("")}</select></label>`;
      return `<label class="field" for="${id}">${esc(label)}<input type="${type}" id="${id}" data-pf="${path}"${extra ? ` autocomplete="${extra}"` : ' autocomplete="off"'}${ph ? ` placeholder="${esc(ph)}"` : ""}></label>`;
    }).join("")}</div></section>`).join("");
    box.dataset.built = "1";
  }
  box.querySelectorAll("[data-pf]").forEach(el => { if (document.activeElement !== el) el.value = getPath(p, el.dataset.pf) || ""; });
  const n = (arr, f) => arr.filter(f).length;
  const jobs = n(p.experience, e => e.title || e.org), quals = n(p.education, e => e.degree || e.inst);
  const skills = Object.values(p.skills).reduce((a, l) => a + l.length, 0);
  const letter = blText().length;
  const li = (linStore.data.input || {}).headline || (linStore.data.input || {}).about;
  const row = (label, value, ok, view, action, names) => `<li class="${ok ? "pf-ok" : ""}"><span class="pf-k">${esc(label)}</span><span class="pf-v">${esc(value)}</span><a class="btn" href="#${view}">${esc(action)}</a>${names && names.length ? `<ul class="pf-names" aria-label="Saved under ${esc(label)}">${names.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</li>`;
  const resumeNames = (savedResumes.data.list || []).map(x => x.name), letterNames = (savedLetters.data.list || []).map(x => x.name);
  $("pfSaved").innerHTML = `<ul class="pf-list">
    ${row("Resume", jobs || quals ? `${jobs} job${jobs === 1 ? "" : "s"}, ${quals} qualification${quals === 1 ? "" : "s"}, ${skills} skills${p.summary ? ", a summary" : ""}` : "Not started", jobs + quals > 0, "builder", jobs + quals ? "Edit resume" : "Create resume", resumeNames)}
    ${row("Cover letter", letter ? `${wordCount(blText().join(" "))} words` : "Not started", letter > 0, "letter", letter ? "Edit cover letter" : "Create cover letter", letterNames)}
    ${row("Design", p.cv.template ? (CV_TEMPLATES.find(t => t.key === p.cv.template) || {}).name || "Chosen" : "Best match for your job type", !!p.cv.template, "cv", "Change design")}
    ${row("LinkedIn", li ? "Headline and About saved" : "Not started", !!li, "linkedin", li ? "Edit LinkedIn" : "Create LinkedIn")}
  </ul>`;
  $("pfWhere").textContent = { account: `Your details are ${accountWords()}.`, browser: "Your details are saved in this browser only." + (acctOn() && !(window.claude && window.claude.use) ? " Sign up to keep them with an account, on any device." : ""), none: "Your details can't be saved here, so download them before you leave.", loading: "Loading your saved details…" }[profile.where];
  const acts = $("pfAcct");
  if (acts) acts.innerHTML = window.claude && window.claude.use ? "" : account.user ? `<button class="btn ghost" type="button" data-acct="out">Sign out</button><button class="btn ghost" type="button" id="pfDelAcct">Delete my account and all data</button>` : `<button class="btn primary" type="button" data-acct="open">Sign up to keep your data</button>`;
}
onInit(() => {
  $("pfForm").addEventListener("input", e => {
    const path = e.target.dataset.pf; if (!path) return;
    setPath(P(), path, e.target.value);
    if (path === "contact.linkedin" && linStore.data.input && !linStore.data.input.url) linStore.data.input.url = shortUrl(e.target.value);
    touchProfile("profile-page");
  });
  $("pfExport").addEventListener("click", async () => {
    await downloadMade(`Job Finder data ${todayISO()}.zip`, async () => buildDataZip(), $("pfStatus"), $("pfExport"));
  });
  $("pfData") && $("pfData").addEventListener("click", async e => {
    const b = e.target.closest("#pfDelAcct"); if (!b) return;
    deleteDialog(false);
  });
  $("pfClear").addEventListener("click", () => {
    const b = $("pfClear");
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Delete everything in my profile?"; setTimeout(() => { if (b.dataset.sure === "1") { b.dataset.sure = ""; b.textContent = "Delete my profile"; } }, 5000); return; }
    b.dataset.sure = ""; b.textContent = "Delete my profile";
    replaceProfile(emptyProfile(), "profile-page");
    $("pfStatus").textContent = "Your profile details were deleted. Your applications, cover letter and LinkedIn notes are kept.";
    renderProfilePage();
  });
  viewHooks.profile = () => Promise.all([profileReady, baseLetter.ready, linStore.ready, savedResumes.ready, savedLetters.ready]).then(renderProfilePage);
  onProfile(src => { if (currentView === "profile" && src !== "profile-page") renderProfilePage(); });
});
