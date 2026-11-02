/* ===================== Home: one plan, the next step always obvious ===================== */
function homeSteps() {
  const p = P(), own = hasProfile(p);
  const strength = own ? resumeHealth(p).score : null;
  const li = linStore.data.last;
  const st = trackerStats();
  const scan = lastResult ? lastResult.overall : (T().find(i => i.score != null) || {}).score;
  const ivN = iv.attempts.length, ivAvg = ivN ? Math.round(iv.attempts.slice(-10).reduce((a, x) => a + x.score, 0) / Math.min(10, ivN) * 10) / 10 : null;
  const apt = aptStore.data.sessions, aptBest = apt.length ? Math.max(...apt.map(x => x.pct)) : null;
  const plan = learnStore.data.plan.length;
  // the cover letter: how far the base letter has got (paragraphs written, long enough, no gaps left)
  const letter = (() => {
    try {
      const parts = baseLetter.data.parts, written = parts.filter(x => x.text.trim()), r = letterRange();
      if (!written.length) return { n: 0 };
      const text = written.map(x => x.text).join(" "), gaps = (text.match(TOKEN_RE) || []).length, thin = parts.filter(x => wordCount(x.text) < partMin(x.part, r)).length;
      return { n: written.length, words: wordCount(text), gaps, thin, done: written.length === parts.length && !gaps && !thin };
    } catch { return { n: 0 }; }
  })();
  const savedLetterCount = (() => { try { return savedLetters.data.list.length; } catch { return 0; } })();
  const state = (done, started) => done ? "done" : started ? "doing" : "todo";
  return [
    { n: 1, title: "Build a strong resume", why: "Recruiters skim a resume in seconds. One clear, results-first resume is the base for everything else.", status: own ? `Resume strength ${strength}/100` : "Not started", state: state(strength >= 80, own), go: [["builder", own ? "Improve my resume" : "Start my resume"], ["cv", "Choose a design"]] },
    { n: 2, title: "Build a strong cover letter", why: "Employers who read cover letters read the opening first and look for a specific reason you want this job. In one large experiment a tailored letter drew about 53% more callbacks than none; a generic one barely helped.",
      status: letter.n ? `${letter.words} words in ${letter.n} of 5 paragraphs${letter.gaps ? `, ${letter.gaps} gap${letter.gaps === 1 ? "" : "s"} highlighted to fill` : ""}${letter.thin ? `, ${letter.thin} too short` : ""}${savedLetterCount ? `, ${savedLetterCount} saved` : ""}` : "Not started", state: state(letter.done, letter.n > 0), go: [["letter", letter.n ? "Improve my cover letter" : "Write my cover letter"], ["cv", "Letter designs"]] },
    { n: 3, title: "Make LinkedIn work for you", why: "Most recruiters search LinkedIn before they advertise. A complete, keyword-rich profile gets found.", status: li ? `Profile score ${li.score}/100${linStore.data.completed ? ", reviewed" : ""}` : "Not reviewed", state: state(li && (li.score >= 80 || !!linStore.data.completed), !!li), go: [["linkedin", li ? "Review it again" : "Review my profile"]] },
    { n: 4, title: "Find jobs and track them", why: "Applying early and following up are two of the easiest wins. Keep every job in one place.", status: st.total ? `${st.total} tracked, ${st.applied} applied${st.due ? `, ${st.due} follow-up${st.due === 1 ? "" : "s"} due` : ""}` : "No jobs tracked yet", state: state(st.applied >= 5, st.total > 0), go: [["jobs", "Find jobs"], ["tracker", "My applications"]] },
    { n: 5, title: "Tailor every application", why: "A resume that uses the ad's own words gets past screening software far more often. Add a cover letter that fits.", status: scan != null ? `Last match ${scan}%` : "Not tried yet", state: state(scan >= 75, scan != null), go: [["scanner", "Tailor to a job"]] },
    { n: 6, title: "Prepare for screening and interviews", why: "Most people are screened by phone or an online test first. Practice is what turns nerves into clear answers.", status: [ivN ? `${ivN} answer${ivN === 1 ? "" : "s"} practised (avg ${ivAvg}/10)` : "", aptBest != null ? `best test ${aptBest}%` : ""].filter(Boolean).join(", ") || "Not started", state: state(ivN >= 10 && ivAvg >= 7, ivN > 0 || apt.length > 0), go: [["interview", "Practise interviews"], ["aptitude", "Aptitude tests"]] },
    { n: 7, title: "Keep building skills", why: "Short online courses and licences can open more jobs quickly, often for free.", status: plan ? `${plan} course${plan === 1 ? "" : "s"} in your plan` : "No plan yet", state: state(learnStore.data.plan.some(x => x.done), plan > 0), go: [["learning", "Find courses"]] }
  ];
}
function homeToday() {
  const out = [];
  for (const it of T()) {
    const due = dueState(it);
    if (due) out.push({ kind: "follow", text: `Follow up on ${it.title || "a job"}${it.company ? ` at ${it.company}` : ""}`, sub: due === "overdue" ? `Was due ${fmtDay(it.followUp)}` : "Due today", go: "tracker" });
    if (it.interviewAt && it.interviewAt >= todayISO() && it.interviewAt <= addDaysISO(todayISO(), 7)) out.push({ kind: "interview", text: `Interview for ${it.title || "a job"}${it.company ? ` at ${it.company}` : ""}`, sub: fmtDay(it.interviewAt), go: "interview" });
  }
  for (const inv of (market.invites || [])) out.push({ kind: "invite", text: `${inv.company || "An employer"} invited you to apply for ${inv.title || "a job"}`, sub: "Invitation", go: "jobs" });
  return out.slice(0, 6);
}
function renderHome() {
  const plan = $("homePlan");
  if (!plan) return;
  const name = (P().contact.name || "").split(" ")[0];
  $("homeTitle").textContent = name ? `Hi ${name}. Here's your plan.` : "Your job search, step by step";
  const steps = homeSteps();
  const next = steps.find(s => s.state !== "done") || steps[steps.length - 1];
  plan.innerHTML = steps.map(s => `<li class="plan-step ${s.state}${s === next ? " next" : ""}">
    <span class="plan-n" aria-hidden="true">${s.state === "done" ? "✓" : s.n}</span>
    <div class="plan-body"><h2>${esc(s.title)}${s === next ? ' <span class="tag">Next</span>' : ""}</h2><p>${esc(s.why)}</p><p class="plan-status"><span class="visually-hidden">Status: </span>${esc(s.status)}</p></div>
    <div class="plan-go">${s.go.map(([v, l], i) => `<a class="btn${i === 0 && s === next ? " primary" : ""}" href="#${v}">${esc(l)}</a>`).join("")}</div>
  </li>`).join("");
  const today = homeToday();
  $("homeToday").hidden = !today.length;
  $("homeToday").innerHTML = today.length ? `<h2>Today</h2><ul>${today.map(t => `<li class="today-${t.kind}"><span><b>${esc(t.text)}</b><small>${esc(t.sub)}</small></span><a class="btn" href="#${t.go}">Open</a></li>`).join("")}</ul>` : "";
  const done = steps.filter(s => s.state === "done").length;
  $("homeProgress").innerHTML = `<div class="bar" role="img" aria-label="${done} of ${steps.length} steps done"><i style="width:${Math.max(4, done / steps.length * 100)}%;background:var(--good)"></i></div><span class="small muted">${done} of ${steps.length} steps done. Your progress is ${whereWords(profile.where)}.</span>`;
}
onInit(() => {
  viewHooks.home = () => { renderHome(); Promise.all([trk.ready, linStore.ready, aptStore.ready, learnStore.ready, ivReady, baseLetter.ready, savedLetters.ready]).then(() => { if (currentView === "home") renderHome(); }); };
  onProfile(() => { if (currentView === "home") renderHome(); });
  baseLetter.on(() => { if (currentView === "home") renderHome(); });
});


