/* ===================== AI suggestions (Claude) ===================== */
let sample = null, aiCtl = null;

function resetAI() {
  if (aiCtl) aiCtl.abort();
  els.aiOut.innerHTML = "";
  if (sample) { els.aiStatus.textContent = lastResult ? "Uses " + AI_LONG() + ". Takes about a minute." : "Scan a resume first."; els.aiStatus.classList.remove("err"); }
  els.aiBtn.disabled = !sample || !lastResult;
}
function aiPrompt() {
  const r = els.resume.value.trim().slice(0, 12000), j = els.jd.value.trim().slice(0, 12000);
  const missing = lastResult ? [...lastResult.hard, ...lastResult.soft].filter(x => !x.found).map(x => x.name) : [];
  return `You are an experienced Australian recruiter and resume coach. Compare the candidate's resume with the job ad.

Rules:
- Use only facts that appear in the resume. Never invent employers, tools, qualifications, results or numbers.
- Where a number would strengthen a bullet but the resume has none, put a placeholder in square brackets, such as [X%] or [number], for the candidate to fill in.
- Use Australian English spelling.
- Each improved bullet is under 30 words and starts with a strong past-tense verb.

A keyword scan found these job ad skills missing from the resume: ${missing.join(", ") || "none"}.
Check each one: if the resume shows the skill in other words, list it under hidden_matches with a short quote from the resume; if there is no evidence, list it under true_gaps.

Reply with only a JSON object in this shape:
{"fit": "two sentences on how well this resume fits the role and the biggest gap",
 "hidden_matches": [{"job_term": "skill from the ad", "resume_evidence": "short exact quote from the resume"}],
 "true_gaps": ["skill from the ad with no evidence in the resume"],
 "bullet_rewrites": [{"original": "exact bullet text from the resume", "improved": "rewritten bullet using the ad's wording", "why": "one short reason"}],
 "profile": "a three-sentence profile tailored to this job, without I or my"}
Give at most 5 hidden_matches, 8 true_gaps and 4 bullet_rewrites. Pick the bullets that would gain most from rewording.

<resume>
${r}
</resume>

<job_ad>
${j}
</job_ad>`;
}
function copyBtn(text) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "btn copy"; b.textContent = "Copy";
  b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; }
    catch { const sel = window.getSelection(), range = document.createRange(); range.selectNodeContents(b.closest(".copy-src") || b.parentElement); sel.removeAllRanges(); sel.addRange(range); b.textContent = "Selected. Press Ctrl+C"; }
    setTimeout(() => { b.textContent = "Copy"; }, 2200);
  });
  return b;
}
function renderAI(d) {
  const out = els.aiOut;
  out.innerHTML = "";
  const block = (title, sub) => { const s = document.createElement("div"); s.className = "ai-block"; s.innerHTML = `<h3>${esc(title)}</h3>${sub ? `<p class="small muted">${esc(sub)}</p>` : ""}`; out.appendChild(s); return s; };
  if (d && typeof d.fit === "string" && d.fit.trim()) { const b = block("Overall fit"); const p = document.createElement("p"); p.className = "ai-fit"; p.textContent = d.fit; b.appendChild(p); }
  const hm = Array.isArray(d && d.hidden_matches) ? d.hidden_matches.filter(x => x && x.job_term) : [];
  if (hm.length) {
    const b = block("Skills you have, in other words", "A keyword scan can miss these. Consider using the ad's exact wording.");
    const ul = document.createElement("ul"); ul.className = "evidence";
    for (const x of hm) { const li = document.createElement("li"); const t = document.createElement("b"); t.textContent = String(x.job_term); const q = document.createElement("q"); q.textContent = String(x.resume_evidence || ""); li.append(t, q); ul.appendChild(li); }
    b.appendChild(ul);
  }
  const gaps = Array.isArray(d && d.true_gaps) ? d.true_gaps.filter(Boolean) : [];
  if (gaps.length) {
    const b = block("Genuine gaps", "No evidence of these in your resume. Add them only if you have the experience.");
    const c = document.createElement("div"); c.className = "chips";
    for (const g of gaps) { const s = document.createElement("span"); s.className = "chip missing"; s.textContent = String(g); c.appendChild(s); }
    b.appendChild(c);
  }
  const rw = Array.isArray(d && d.bullet_rewrites) ? d.bullet_rewrites.filter(x => x && x.improved) : [];
  if (rw.length) {
    const b = block("Rewritten bullets", "Fill in any [placeholders] with your real figures, or delete them.");
    for (const x of rw) {
      const card = document.createElement("div"); card.className = "rewrite";
      if (x.original) { const o = document.createElement("div"); o.className = "orig"; o.textContent = String(x.original); card.appendChild(o); }
      const n = document.createElement("div"); n.className = "new copy-src"; n.textContent = String(x.improved); card.appendChild(n);
      const foot = document.createElement("div"); foot.className = "rewrite-foot";
      const why = document.createElement("span"); why.className = "why"; why.textContent = x.why ? String(x.why) : "";
      foot.append(why, copyBtn(String(x.improved))); card.appendChild(foot);
      b.appendChild(card);
    }
  }
  if (d && typeof d.profile === "string" && d.profile.trim()) {
    const b = block("Tailored profile");
    const box = document.createElement("div"); box.className = "profile-box copy-src"; box.textContent = d.profile;
    const foot = document.createElement("div"); foot.className = "rewrite-foot"; foot.append(document.createElement("span"), copyBtn(d.profile));
    b.append(box, foot);
  }
  if (!out.children.length) out.innerHTML = `<p class="empty">${esc(AI_NAME())} didn't return any suggestions. Try again.</p>`;
}
async function runAI() {
  if (!sample || !lastResult) return;
  aiCtl = new AbortController();
  els.aiBtn.disabled = true; els.aiStop.hidden = false;
  els.aiStatus.classList.remove("err");
  els.aiStatus.textContent = "Thinking… this usually takes 30–60 seconds.";
  els.aiOut.innerHTML = "";
  try {
    const data = await sample.json(aiPrompt(), { signal: aiCtl.signal, cache: false });
    renderAI(data);
    els.aiStatus.textContent = "Done. Check every suggestion before you use it.";
  } catch (e) {
    const code = e && e.code;
    if (code === "cancelled") els.aiStatus.textContent = "Stopped.";
    else if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      els.aiStatus.textContent = "AI suggestions aren't available here. The keyword scan above still works.";
      sample = null;
    } else if (code === "rate_limited") els.aiStatus.textContent = "You've reached a usage limit. Try again in a little while.";
    else if (code === "session_expired") els.aiStatus.textContent = "Your Claude session has expired. Sign in again, then retry.";
    else if (code === "invalid_json") els.aiStatus.textContent = "The AI's answer came back in the wrong format. Select Get AI suggestions to try again.";
    else if (code === "prompt_too_large") els.aiStatus.textContent = "The resume and job ad are too long together. Shorten the job ad and try again.";
    else els.aiStatus.textContent = USER_ENGINES.has(aiCfg.engine) ? aiErrWords(e) : "Something went wrong reaching Claude. Try again in a moment.";
    if (code !== "cancelled") els.aiStatus.classList.add("err");
  } finally {
    els.aiStop.hidden = true;
    els.aiBtn.disabled = !sample || !lastResult;
  }
}

