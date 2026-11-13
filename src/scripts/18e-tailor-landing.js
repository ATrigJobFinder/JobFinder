/* ===================== Tailor to a job: step 0, the opening page =====================
   Like the opening pages of Create or edit resume and cover letter: "Use my profile" first (choose from the resumes and cover letters in your
   profile), then the upload boxes. A file that is read shows as a card with its icon and the main parts found in it. The resume text and the
   pasted-letter boxes are not shown: the text still lives in hidden boxes (resumeText, clPaste) because the scan reads it from there. */

var tl;   // (set below: updateFlow can run before this file does)
tl = { on: undefined, hold: false, src: null, sig: "", parts: new Map() };

const TL_PROFILE_ICON = `<svg class="b-file-ico" viewBox="0 0 40 48" role="img" aria-label="From your profile"><path d="M6 2h20l10 10v32a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/><path d="M26 2v10h10" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="25" r="5" fill="var(--accent)"/><path d="M10 40c1-6 5-8 10-8s9 2 10 8z" fill="var(--accent)"/></svg>`;
const tlIcon = name => /\.(pdf|docx?|txt)$/i.test(String(name)) ? fileIconSvg(name) : TL_PROFILE_ICON;

// What was found in a resume's text, by the same reader the resume builder uses: [name, "3 jobs", "2 qualifications", "14 skills"]
function tlResumeParts(text) {
  if (tl.parts.has(text)) return tl.parts.get(text);
  let out = [];
  try {
    const g = profileFromText(text), n = (k, one, many) => k ? `${k} ${k === 1 ? one : many}` : "";
    out = [String(g.contact.name || "").trim(), n(g.experience.filter(hasContent).length, "job", "jobs"), n(g.education.filter(hasContent).length, "qualification", "qualifications"), n(Object.values(g.skills).flat().length, "skill", "skills")].filter(Boolean);
  } catch { out = []; }
  if (tl.parts.size > 6) tl.parts.clear();
  tl.parts.set(text, out);
  return out;
}
// A cover letter: how many paragraphs and words, and who it was written to
function tlLetterParts(text) {
  const paras = String(text).split(/\n\s*\n/).map(t => t.trim()).filter(t => wordCount(t) >= 8 && !/^(dear|yours|kind regards|regards|sincerely)\b/i.test(t)).length;
  const to = (String(text).match(/^\s*dear\s+([^\n,]{2,40}),?/im) || [])[1];
  return [paras ? `${paras} paragraph${paras === 1 ? "" : "s"}` : "", `${wordCount(text)} words`, to && !/^hiring manager$/i.test(to.trim()) ? `to ${to.trim()}` : ""].filter(Boolean);
}
// Where the resume in the scanner came from: { name, kind: "file" | "profile" | "text" }
function tlResumeInfo() {
  const text = els.resume.value.trim();
  if (!text) return null;
  const s = tl && tl.src && tl.src.text === text ? tl.src : null;
  const name = s ? s.name : isExample ? "Example resume" : "Your resume";
  const kind = s ? s.kind : "text";
  return { name, kind, icon: kind === "file" ? fileIconSvg(name) : TL_PROFILE_ICON, parts: tlResumeParts(text) };
}
function tlFileLoaded(file) {
  tl.src = { name: file.name, kind: "file", text: els.resume.value.trim() };
  if (tl.on) tl.hold = true;
}
function tlFromProfile(name) {
  tl.src = { name, kind: "profile", text: els.resume.value.trim() };
  if (tl.on) tl.hold = true;
}

/* --- Showing the opening page, or the page behind it --- */
function tlApply() {
  const root = $("view-scanner");
  if (!root || !tl) return;
  if (tl.on === undefined) tl.on = !els.resume.value.trim() && !lastResult;
  if (tl.on && (lastResult || els.resume.value.trim()) && !tl.hold) tl.on = false;   // a resume turned up (from the resume builder, an example): go on to the job ad
  if (!tl.on) tl.hold = false;
  const on = !!tl.on;
  $("tlWelcome").hidden = !on;
  root.classList.toggle("is-welcome", on);
  // With something in the profile, "Use my profile" is the blue way in. Without it, it is greyed out.
  const has = tlProfileHas(), b = $("tlwProfile"), up = $("tlwUploadCard");
  if (b) {
    b.disabled = !has; b.classList.toggle("bw-card--go", has); b.classList.toggle("bw-card--off", !has);
    const t = $("tlwProfileText"); if (t) t.textContent = has ? "Choose a resume, and a cover letter if you like, from the ones already in your profile. Nothing needs uploading." : "There's no resume in your profile yet. Upload your resume or LinkedIn first, and this is ready to use.";
  }
  if (up) up.classList.toggle("bw-card--go", !has);
  $("tlwUpload").classList.toggle("is-ready", !!els.resume.value.trim());
}
function tlGoStart() { tl.on = true; tl.hold = true; tlApply(); tlRender(); tlPanel(els.resume.value.trim() || cover.letters.length ? "upload" : null); window.scrollTo({ top: 0 }); }
function tlLeave() { if (!tl) return; tl.on = false; tl.hold = false; }
const tlProfileHas = () => { try { return hasResume(P()) || (savedResumes.data.list || []).length > 0 || profileLetters().length > 0; } catch { return false; } };

/* --- The cards: the resume (in place of its drop box), and the summary on the job ad page --- */
function tlRender() {
  if (!tl) return;
  const info = tlResumeInfo(), letters = cover.letters || [];
  const sig = JSON.stringify([info && [info.name, info.kind, info.parts], letters.map(l => [l.name, wordCount(l.text)]), tailorMode]);
  if (sig === tl.sig) { tlApply(); return; }
  tl.sig = sig;
  const found = parts => parts.length ? `<span class="tl-found">Found: ${esc(parts.join(" · "))}</span>` : "";
  const card = $("tlResCard"), drop = $("drop");
  if (card && drop) {
    drop.hidden = !!info; card.hidden = !info;
    card.innerHTML = info ? `${info.icon}<span class="b-file-name">${esc(info.name)}</span>${found(info.parts)}<button class="linkish" type="button" data-tl-swap="resume">${info.kind === "file" ? "Choose a different file" : "Choose a different resume"}</button>` : "";
  }
  const sum = $("tlSummary");
  if (sum) {
    const row = (icon, name, parts) => `<div class="tl-row">${icon}<span class="tl-row-t"><b>${esc(name)}</b>${found(parts)}</span></div>`;
    sum.innerHTML = (info ? row(info.icon, info.name, info.parts) : `<p class="small muted">No resume yet. Add one to scan.</p>`)
      + (tailorMode === "resume" ? "" : letters.map(l => row(tlIcon(l.name), l.name, tlLetterParts(l.text))).join(""))
      + `<div class="b-actions"><button class="btn" type="button" data-tl-change>${info ? "Change my resume or cover letter" : "Add my resume"}</button></div>`;
  }
  tlApply();
}

/* --- Use my profile: the resumes (the one you're building now, and the ones you saved) and the cover letters --- */
async function tlProfileList() {
  const box = $("tlProfilePick");
  box.innerHTML = `<p class="progress">Looking in your profile…</p>`;
  await Promise.all([profileReady, savedResumes.ready, baseLetter.ready, savedLetters.ready]);
  const resumes = [];
  if (hasResume(P())) resumes.push({ name: P().contact.name ? `${P().contact.name}'s resume` : "My resume", sub: "The resume in your profile now", profile: P() });
  for (const x of savedResumes.data.list || []) resumes.push({ name: x.name, sub: `Saved ${fmtSaved(x.saved)}${x.tplName ? ` · ${x.tplName} layout` : ""}`, profile: x.profile });
  const letters = tailorMode === "resume" ? [] : profileLetters();
  box._resumes = resumes; box._letters = letters;
  const cur = els.resume.value.trim(), src = tl.src && tl.src.text === cur ? tl.src : null;
  const resumeRows = resumes.map((r, k) => `<li><span class="saved-name"><b>${esc(r.name)}</b><span class="small muted">${esc(r.sub)}${src && src.kind === "profile" && src.name === r.name ? " · in use" : ""}</span></span><span class="b-actions"><button class="btn" type="button" data-tl-res="${k}">Use it</button></span></li>`).join("");
  const letterRows = letters.map((x, k) => `<li><span class="saved-name"><b>${esc(x.name)}</b><span class="small muted">${x.saved ? `Saved ${esc(fmtSaved(x.saved))} · ` : ""}${wordCount(x.text)} words${cover.letters.some(l => l.name === x.name) ? " · added" : ""}</span></span><span class="b-actions"><button class="btn" type="button" data-tl-letter="${k}">Add it</button></span></li>`).join("");
  box.innerHTML = `<div class="b-sub">Resumes in your profile</div>`
    + (resumeRows ? `<ul class="saved-list">${resumeRows}</ul>` : `<p class="small muted">You haven't built or saved a resume yet. Build one in Create or edit resume, or upload one below.</p>`)
    + (tailorMode === "resume" ? "" : `<div class="b-sub">Cover letters in your profile <span class="opt">(optional, up to 3)</span></div>`
      + (letterRows ? `<ul class="saved-list">${letterRows}</ul>` : `<p class="small muted">You haven't saved a cover letter to your profile yet. Write one in Create or edit cover letter and press <b>Save to my profile…</b>, and it will be here next time.</p>`))
    + `<div class="lt-welcome-next"><button class="btn primary" type="button" data-tl-next>Next: the job ad <span aria-hidden="true">→</span></button></div>`;
}
function tlUseResume(r) {
  els.resume.value = profileToText(r.profile, { jobText: els.jd.value });
  fileInfo = null; setExample(false); updateCounts();
  els.fileStatus.classList.remove("err"); els.fileStatus.textContent = "";
  tlFromProfile(r.name);
  updateFlow(); tlRender();
  $("tlwNote").textContent = `Using “${r.name}”. Add a cover letter too if you like (it is optional), then press Next.`;
}

// one panel open at a time: the profile's resumes and letters, or the upload boxes
function tlPanel(which) {
  const map = { profile: ["tlProfilePick", "tlwProfile"], upload: ["tlwUpload", "tlwUploadCard"] };
  for (const [k, [panel, card]] of Object.entries(map)) { const p = $(panel); if (p) p.hidden = k !== which; $(card).setAttribute("aria-expanded", String(k === which)); }
}
onInit(() => {
  const w = $("tlWelcome");
  if (!w) return;
  const box = $("tlProfilePick");
  $("tlwProfile").addEventListener("click", async () => {
    $("tlwNote").textContent = "";
    if (!box.hidden) { tlPanel(null); return; }
    tlPanel("profile");
    await tlProfileList(); smoothTo(box, 16);
  });
  $("tlwUploadCard").addEventListener("click", () => {
    $("tlwNote").textContent = "";
    if (!$("tlwUpload").hidden) { tlPanel(null); return; }
    tlPanel("upload"); smoothTo($("tlwUpload"), 16);
    setTimeout(() => { const f = $("pickFile"); if (f && !f.closest("[hidden]")) f.focus({ preventScroll: true }); }, 120);
  });
  // no resume yet: straight on to the job ad, and the resume is added from step 2
  w.querySelector('[data-tl="job"]').addEventListener("click", () => tlNext());
  box.addEventListener("click", async e => {
    const r = e.target.closest("[data-tl-res]"), l = e.target.closest("[data-tl-letter]");
    if (r) { const x = (box._resumes || [])[+r.dataset.tlRes]; if (x) { tlUseResume(x); tlProfileList(); } return; }
    if (l) {
      const x = (box._letters || [])[+l.dataset.tlLetter]; if (!x) return;
      cover.letters = [{ name: x.name, text: x.text, added: new Date().toISOString() }, ...cover.letters.filter(c => c.name !== x.name)].slice(0, 3);
      if (tl.on) tl.hold = true;
      renderLetterFiles(); await saveCoverStore(); renderLetterFiles();
      tlProfileList();
    }
  });
  w.addEventListener("click", e => {
    const sw = e.target.closest("[data-tl-swap]");
    if (!sw) return;
    // take the resume back out, so a new one replaces it rather than adding to it
    const was = tl.src && tl.src.kind;
    els.resume.value = ""; fileInfo = null; tl.src = null;
    els.fileStatus.classList.remove("err"); els.fileStatus.textContent = "";
    setExample(false); updateCounts(); updateFlow(); tlRender();
    if (was === "file") els.fileInput.click();
  });
  // the page behind: "Change" brings the opening page back
  $("tlSummary").addEventListener("click", e => { if (e.target.closest("[data-tl-change]")) tlGoStart(); });
  $("tlwNext").addEventListener("click", tlNext);
  box.addEventListener("click", e => { if (e.target.closest("[data-tl-next]")) tlNext(); });
  tlRender();
});
// On to the job ad. A cover letter is never needed.
function tlNext() {
  $("tlwNote").textContent = "";
  tlLeave(); tlApply(); updateFlow();
  window.scrollTo({ top: 0 });
  setTimeout(() => els.jd.focus({ preventScroll: true }), 60);
}
