/* ===================== Interviews › Get ready: which interview is it for, and the advice that fits it ===================== */
// Pick a job from your Application tracker, or type the job title, company and level yourself. The advice, the likely questions and
// the practice questions all follow it. Everything here is worked out on this device from lists in the app (no AI needed).
const IV_LEVELS = [["", "Not sure"], ["entry", "Casual or entry-level"], ["grad", "Graduate or junior"], ["mid", "Experienced"], ["senior", "Senior or team leader"], ["mgr", "Manager or executive"]];
const IV_HELD = [["", "Not sure yet"], ["phone", "Phone call"], ["video", "Video call (Teams, Zoom)"], ["oneway", "Recorded one-way video"], ["person", "In person"], ["panel", "Panel"], ["group", "Group or assessment day"]];
const levelLabel = k => (IV_LEVELS.find(x => x[0] === k) || [])[1] || "";
function inferLevel(title) {
  const t = String(title || "").toLowerCase();
  if (!t.trim()) return "";
  if (/\b(director|head of|general manager|chief|executive|ceo|cfo|coo)\b/.test(t)) return "mgr";
  if (/\b(graduate|junior|trainee|intern|apprentice|cadet|entry|vacation)\b/.test(t)) return "grad";
  if (/\b(senior|lead|principal|team leader|supervisor|manager|head)\b/.test(t)) return "senior";
  if (/\b(casual|assistant|attendant|operator|crew|team member|labourer|cleaner|kitchen hand|barista|waiter|cashier|retail|checkout|storeperson|porter|runner|picker|packer)\b/.test(t)) return "entry";
  return "mid";
}
const LEVEL_ADVICE = {
  entry: ["Employers hiring for casual and entry-level jobs mostly check reliability, attitude and availability. Know your availability as exact days and times.", "Expect simple questions: why this job, how you'd handle a rude customer, a time you were on time when it was hard. One real example from school, sport or family work is enough.", "Have your work rights ready (citizen, permanent resident or visa). Keep bank and tax file number details until you've been offered the job.", "If they offer a trial shift, ask how long it is and whether it's paid. Arrive 10 minutes early and dress one step smarter than the staff."],
  grad: ["Graduate employers score each answer against set criteria, so use STAR and say “I”, not “we”.", "Expect behavioural, motivation (“why us?”) and strengths questions, often after an online test or recorded video.", "University projects, part-time work, volunteering and clubs all work as examples. Each one needs a result.", "Know the program: the streams or rotations, and what graduates do in their first year."],
  mid: ["Lead with results: numbers on what you delivered. Expect “tell me about a time…” questions built from the ad's criteria.", "Have a positive, specific reason for wanting this role. Never criticise a past employer.", "Prepare two questions about the team's goals and what success looks like in the first 90 days.", "Know your salary range before they ask."],
  senior: ["Show how you lead through other people: coaching, decisions under pressure, influencing without authority.", "Expect scenario questions and “what would you do in your first 90 days?”.", "Put numbers on your scope: team size, budget, customers, risk.", "Ask how success is measured and how the team is structured."],
  mgr: ["At this level interviews test judgement and results. Have three stories about outcomes you owned: growth, cost, change, people.", "Prepare a first-90-days plan and a view on the organisation's biggest challenges, from their annual report and news.", "Expect a panel. Note each person's name and role, and speak to all of them.", "Know the market for the role and the whole package: super, bonus, flexibility."]
};
const HELD_ADVICE = {
  phone: ["Take it somewhere quiet with good reception. Charge your phone and use headphones.", "Stand or sit upright and smile. It changes how your voice sounds.", "Keep your resume, the job ad and your screening answers in front of you.", "Phone screens are short: have a 60-second introduction and your salary range ready."],
  video: ["Test Teams or Zoom 15 minutes early: link, camera, microphone. Close other apps.", "Put the camera at eye level, with light in front of you and a plain, tidy background.", "Look at the camera when you speak, not at their faces. There's a small delay, so pause before you answer.", "Keep notes beside the screen, not on it, and a glass of water within reach."],
  oneway: ["You usually see the question, get about 30 seconds to think, then have one recording of 1 to 3 minutes. There's often no retake.", "Start straight away, use STAR, and finish with the result.", "Look at the camera, and check your light, sound and internet before you begin.", "Practise it here with “One-way recorded video”."],
  person: ["Plan the trip, arrive about 10 minutes early and be polite to everyone you meet.", "Bring copies of your resume, a notepad, ID if asked, and your questions.", "Steady eye contact and a calm voice. Shake hands if one is offered.", "Dress one step above what people wear in the workplace."],
  panel: ["Note each person's name and role at the start. Answer to whoever asked, and look at the others too.", "Panel members often score different criteria, so every answer needs an example.", "Bring a copy of your resume for each member if they ask.", "It's fine to take a few seconds to think before you answer."],
  group: ["You're watched as much as listened to: include quieter people, build on other people's ideas and don't dominate.", "Listen, summarise and keep an eye on time.", "Stay positive about other people's ideas, even when you disagree."]
};
// What each kind of work tends to look for, and the questions that come up most
const ROLE_LOOKS = {
  health: "Patient care, safety, teamwork and staying calm under pressure.", community: "Empathy, boundaries, reliability and teamwork with clients and families.", education: "Care for learners, classroom or room management, and working with parents and colleagues.",
  hospitality: "Friendly service, speed, reliability and teamwork in busy periods.", retail: "Customer service, reliability, handling cash and working shifts.", callcentre: "Calm communication, listening, handling complaints and meeting targets.",
  tech: "Problem solving, clear explanations and real examples of what you built or fixed.", engineering: "Technical judgement, safety, working with others and clear reports.", science: "Accuracy, method and clear reporting of results.",
  trades: "Safety, reliability, quality of work and licences or tickets.", construction: "Safety, reliability, reading plans and teamwork on site.", logistics: "Safety, accuracy, reliability and working to deadlines.", mining: "Safety first, reliability, teamwork and shift readiness.",
  accounting: "Accuracy, deadlines, ethics and clear communication with non-accountants.", banking: "Customer care, compliance, accuracy and commercial awareness.", insurance: "Accuracy, fairness, customer care and regulation.", legal: "Analysis, writing, ethics and working under pressure.",
  consulting: "Structured thinking, communication and examples of influencing others.", government: "Public service values, responding to criteria, and fair, evidence-based decisions.", sales: "Results with numbers, resilience and understanding customers.", marketing: "Results with numbers, creativity and clear thinking about audiences.",
  admin: "Organisation, accuracy, communication and reliability.", hr: "Fairness, confidentiality, communication and judgement.", management: "Results, leading people and decisions under pressure.", graduate: "Potential, motivation and evidence from study, work and life.",
  property: "Customer care, negotiation and local knowledge.", sport: "Energy, safety, communication and motivating others.", agriculture: "Reliability, practical skill, safety and working outdoors.", design: "A portfolio, a clear process and taking feedback.", media: "Examples of your work, deadlines and collaboration.", academic: "Research record, teaching and fit with the group."
};
const ROLE_TYPES = {
  health: ["situational", "behavioural", "motivation"], community: ["situational", "behavioural", "motivation"], education: ["situational", "behavioural", "motivation"], hospitality: ["situational", "behavioural", "motivation"], retail: ["situational", "behavioural", "motivation"], callcentre: ["situational", "behavioural", "motivation"],
  tech: ["technical", "behavioural", "situational"], engineering: ["technical", "behavioural", "situational"], science: ["technical", "behavioural", "situational"], trades: ["technical", "situational", "behavioural"], construction: ["technical", "situational", "behavioural"], logistics: ["situational", "technical", "behavioural"], mining: ["situational", "technical", "behavioural"],
  accounting: ["behavioural", "competency", "motivation"], banking: ["behavioural", "competency", "motivation"], insurance: ["behavioural", "competency", "motivation"], legal: ["behavioural", "competency", "motivation"], consulting: ["behavioural", "curveball", "motivation"], government: ["competency", "behavioural", "motivation"],
  graduate: ["behavioural", "strengths", "motivation"]
};
const roleTypes = kind => ROLE_TYPES[kind] || ["behavioural", "motivation", "intro"];
const ivJobKey = () => { const j = ivPrep.data.job || {}; return val(j.title) || val(j.company) ? `${val(j.title)}|${val(j.company)}` : ""; };
const ivJobKeyLabel = k => { const [t, c] = String(k).split("|"); return [t, c].filter(Boolean).join(" at ") || "Job"; };

// The job in Get ready, as the practice questions want it (skills and duties come from the saved ad when there is one)
function ivJobContext() {
  const j = ivPrep.data.job;
  if (!j || !(val(j.title) || val(j.company))) return null;
  const it = j.id && typeof T === "function" && trk.where !== "loading" ? T().find(x => x.id === j.id) : null, jd = it && it.jd ? it.jd : "";
  let hard = [], soft = [], duties = [];
  if (jd) {
    const found = [...findSkills(norm(jd)).values()].sort((a, b) => b.count - a.count);
    hard = found.filter(x => x.skill.kind === "hard").map(x => x.skill.name); soft = found.filter(x => x.skill.kind === "soft").map(x => x.skill.name);
    duties = readJobAd(jd).filter(L => L.kind === "duty" && BULLET_RE.test(L.text)).map(L => tidy(L.text)).filter(d => wordCount(d) >= 4 && wordCount(d) <= 22);
  } else {
    const k = titleKind(j.title), common = commonFor(COMMON_SKILLS, k, COMMON_SKILLS.graduate);
    hard = (common.hard || []).slice(0, 4); soft = COMMON_SOFT.slice(0, 2);
  }
  return { from: "job", title: val(j.title), company: val(j.company), level: j.level, format: j.format, hard, soft, duties, jd: !!jd };
}
function setIvJobFromTracker(id) {
  const it = typeof T === "function" ? T().find(x => x.id === id) : null;
  if (!it) return;
  const j = ivPrep.data.job;
  if (j.id !== it.id) j.ticks = {};
  Object.assign(j, { id: it.id, title: it.title || "", company: it.company || "", level: j.id === it.id && j.level ? j.level : inferLevel(it.title) });
  if (j.id !== it.id || !j.format) j.format = "";
  ivPrep.save();
}
const ivDaysTo = iso => { if (!iso) return null; const d = new Date(String(iso).slice(0, 10) + "T00:00:00"); return isNaN(d) ? null : Math.round((d - new Date(todayISO() + "T00:00:00")) / 86400000); };

/* --- The picker: saved jobs as cards, then plain choices (no drop-downs) --- */
Object.assign(IV_ICON, {
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l6-4v17M9 21h12V11l-6-3"/><path d="M6 11h.01M6 15h.01M12 14h3M12 17h3"/></svg>',
  panel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="8" r="2.5"/><circle cx="12" cy="7" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M2 19c0-3 2-5 4-5s4 2 4 5M8 19c0-3 2-5 4-5s4 2 4 5M14 19c0-3 2-5 4-5s4 2 4 5"/></svg>',
  group: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><circle cx="5" cy="10" r="2"/><circle cx="19" cy="10" r="2"/><path d="M6 20c0-4 3-6 6-6s6 2 6 6"/></svg>'
});
const levelIcon = n => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<rect x="${3 + i * 4}" y="${20 - (i + 1) * 3.4}" width="3" height="${(i + 1) * 3.4}" rx="1" opacity="${i < n ? 1 : .25}"/>`).join("")}</svg>`;
IV_ICON.entry = levelIcon(1); IV_ICON.grad = levelIcon(2); IV_ICON.mid = levelIcon(3); IV_ICON.senior = levelIcon(4); IV_ICON.mgr = levelIcon(5);
const IV_LEVEL_HINT = { entry: "A first or casual job", grad: "Study finished or nearly", mid: "A few years in the field", senior: "Leads people or projects", mgr: "Runs a team or area" };
const jpTile = (attr, key, label, hint, on) => `<button type="button" class="iv-tile iv-tile--sm" role="radio" data-${attr}="${key}" aria-checked="${on}" aria-pressed="${on}"><span class="iv-tile-ico" aria-hidden="true">${IV_ICON[key] || ""}</span><span class="iv-tile-txt"><b>${esc(label)}</b>${hint ? `<span>${esc(hint)}</span>` : ""}</span><span class="iv-tile-check" aria-hidden="true"></span></button>`;
function renderJobPick(box = $("ivJobPick"), pfx = "") {
  if (!box) return;
  const j = ivPrep.data.job, items = typeof T === "function" ? T() : [];
  const order = { interview: 0, screening: 1, applied: 2, saved: 3, offer: 4, closed: 5 };
  const list = items.filter(i => (i.title || i.company) && i.stage !== "closed").sort((a, b) => (order[a.stage] ?? 9) - (order[b.stage] ?? 9));
  const shown = ivState.showAll ? list : list.slice(0, 6);
  const card = i => { const d = ivDaysTo(i.interviewAt); return `<button type="button" class="jp-card" data-jp="${i.id}" aria-pressed="${j.id === i.id}"><b>${esc(i.title || "Untitled job")}</b><span>${esc(i.company || "Company not set")}</span><span class="jp-meta"><span class="jp-stage">${esc((STAGES_T.find(s => s.key === i.stage) || {}).label || i.stage)}</span>${d != null && d >= 0 ? `<span>Interview ${d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`}</span>` : i.interviewAt ? `<span>Interview ${esc(fmtDay(i.interviewAt))}</span>` : ""}</span></button>`; };
  box.innerHTML = `${list.length ? `<h3 class="iv-h3">Pick a job you've saved or applied for</h3><div class="jp-list" role="group" aria-label="Jobs in your Application tracker">${shown.map(card).join("")}</div>${list.length > 6 ? `<button class="ig-linkbtn" type="button" data-jp-all>${ivState.showAll ? "Show fewer" : `Show all ${list.length} jobs`}</button>` : ""}<h3 class="iv-h3">Or tell us about it yourself</h3>` : `<div class="ig-prose"><p>No saved jobs yet. <a href="#jobs">Find jobs</a> and save the ones you like, and they'll show up here. Or fill in the details yourself:</p></div>`}
    <div class="jp-form">
      <label class="iv-field" for="${pfx}jp-title"><span>Job title</span><input type="text" id="${pfx}jp-title" data-jpf="title" value="${esc(j.title)}" placeholder="e.g. Customer Service Team Leader" autocomplete="off"></label>
      <label class="iv-field" for="${pfx}jp-company"><span>Company</span><input type="text" id="${pfx}jp-company" data-jpf="company" value="${esc(j.company)}" placeholder="e.g. Harbourside Grocers" autocomplete="off"></label>
    </div>
    <h3 class="iv-h3" id="${pfx}jpLevelL">How senior is the role?</h3>
    <div class="iv-tiles iv-tiles--5" role="radiogroup" aria-labelledby="${pfx}jpLevelL">${IV_LEVELS.filter(x => x[0]).map(([k, l]) => jpTile("jplevel", k, l, IV_LEVEL_HINT[k], j.level === k)).join("")}</div>
    <h3 class="iv-h3" id="${pfx}jpFormatL">How will it be held?</h3>
    <div class="iv-tiles iv-tiles--6" role="radiogroup" aria-labelledby="${pfx}jpFormatL">${IV_HELD.filter(x => x[0]).map(([k, l]) => jpTile("jpformat", k, l, "", j.format === k)).join("")}</div>
    <div class="b-actions jp-acts">${jpActsHtml()}</div>`;
}
function jpActsHtml() {
  const j = ivPrep.data.job, has = val(j.title) || val(j.company);
  return `<span class="small muted jp-note" role="status">${has ? "Saved as you type." : ""}</span><span class="foot-gap"></span>${has && !j.id ? `<button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-jp-add>Add it to my applications</button>` : ""}${has ? `<button class="ig-linkbtn" type="button" data-jp-clear>Start again</button>` : ""}`;
}
const ivState = { showAll: false, timer: null, open: null };

/* --- The company's profile, in a pop-out (the same profile as the Company guides page) --- */
const directoryEntry = name => { try { const s = empSlug(name); return s ? employers().find(e => e.kind === "dir" && empSlug(e.name) === s) || null : null; } catch { return null; } };
function coPopDialog() {
  let d = $("ivCoPop");
  if (d) return d;
  d = document.createElement("dialog");
  d.id = "ivCoPop"; d.className = "adv-pop iv-pop"; d.setAttribute("aria-labelledby", "ivCoPopT"); d.setAttribute("data-nohelp", "");
  d.innerHTML = `<div class="adv-pop-bar"><div><span class="adv-pop-kick">Company profile</span><h2 id="ivCoPopT"></h2></div><button type="button" class="adv-pop-x" aria-label="Close the profile" data-copop-close>×</button></div><div class="ig adv-pop-body" id="ivCoPopBody"></div><div class="adv-pop-foot"><span class="small muted">From the Company guides.</span><button type="button" class="btn primary" data-copop-close>Close</button></div>`;
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-copop-close]")) d.close(); });
  document.body.appendChild(d);
  return d;
}
function showCoPop(title, html) {
  const d = coPopDialog();
  d.querySelector("#ivCoPopT").textContent = title;
  d.querySelector("#ivCoPopBody").innerHTML = html;
  if (!d.open) d.showModal();
  const top = () => { d.querySelector("#ivCoPopBody").scrollTop = 0; d.scrollTop = 0; };
  top(); requestAnimationFrame(top);
}
function openCompanyPop(key) {
  const g = guideByKey(key); if (!g) return;
  const prof = COMPANY_PROFILES[g.key], staff = prof && prof.staff ? prof.staff : g.staff || "", soc = socialLinks(g);
  const sec = (title, body) => body ? `<section class="co-sec"><h4>${title}</h4>${body}</section>` : "";
  const process = g.process.length ? `<ol class="co-steps">${g.process.map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="small">${coSrc(g, g.processSrc)}</p>` : "";
  const stand = g.purpose || g.values.length || g.valuesNote ? `<div class="co-stand">${g.purpose ? `<p class="co-purpose"><span class="small muted">Purpose</span> ${quoteIt(g.purpose)}</p>` : ""}${g.values.length ? `<div class="co-vrow"><span class="small muted">Values</span>${coValues(g)}${coSrc(g, g.valuesSrc)}</div>` : ""}${g.valuesNote ? `<p class="small muted">${esc(g.valuesNote)}</p>` : ""}</div>` : "";
  const html = `<div class="co-about-pane"><dl class="co-facts">
      ${soc ? `<div class="wide"><dt>Find them online</dt><dd class="co-socials">${soc}</dd></div>` : ""}
      <div><dt>Industry</dt><dd>${esc(indName(g.industry))}</dd></div>
      <div><dt>Company size <span class="muted">(estimate)</span></dt><dd>${esc(GUIDE_SIZES[g.size])}${staff ? ` · ${esc(staff)}` : ""}</dd></div>
      ${prof && prof.spec.length ? `<div class="wide"><dt>Specialties</dt><dd><span class="chips co-specs">${prof.spec.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</span></dd></div>` : ""}</dl>
      ${prof ? `<p class="co-summary">${esc(prof.about)}</p>` : ""}</div>${stand}
    <div class="co-grid">${sec("What they look for", coTipsSplit(g, g.look))}${sec("Interview and assessments", coTipsSplit(g, g.interview))}${sec("The steps", process)}${sec("Where to apply", applyLinkList(g, null))}</div>`;
  showCoPop(g.name, html);
}
function openDirectoryPop(id) {
  const e = empById(id); if (!e) return;
  const link = (u, t) => u ? `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}<span aria-hidden="true"> ↗</span></a></li>` : "";
  showCoPop(e.name, `<dl class="co-facts"><div><dt>Industry</dt><dd>${esc(indName(e.industry))}</dd></div><div><dt>Company size <span class="muted">(estimate)</span></dt><dd>${esc(GUIDE_SIZES[e.size] || "")}</dd></div><div><dt>Where</dt><dd>${esc(statesText(e))}</dd></div></dl>
    <p class="small muted">We don't have a full guide for ${esc(e.name)} yet. Their own careers pages are the best place to start.</p><ul class="co-adv-list">${link(e.u, "Careers page")}${link(e.g, "Graduate program")}</ul>`);
}

/* --- Your plan: six steps, the first one still to do is open --- */
function planData() {
  const j = ivPrep.data.job, c = ivJobContext();
  if (!c) return null;
  const ticks = j.ticks || {};
  const sc = ivPrep.data.screen, screenN = Object.values(sc).filter(v => String(v || "").trim()).length;
  const storiesN = STORY_SLOTS.filter(([k]) => storyState(ivPrep.data.stories[k])[0] === "ok").length;
  const mine = iv.attempts.filter(a => a.jobKey === ivJobKey()), avg = mine.length ? Math.round(mine.reduce((s, a) => s + a.score, 0) / mine.length * 10) / 10 : 0;
  const steps = [
    { id: "company", title: "Know the company", done: !!ticks.company, tick: true },
    { id: "role", title: "Know the role", done: !!ticks.role, tick: true },
    { id: "format", title: "Prepare for the format", done: !!ticks.format, tick: true },
    { id: "stories", title: "Write your stories", done: storiesN >= 3, note: `${storiesN} of ${STORY_SLOTS.length} ready` },
    { id: "screen", title: "Write your screening answers", done: screenN >= 4, note: `${screenN} of ${SCREEN_FIELDS.length} written` },
    { id: "practise", title: "Practise out loud", done: mine.length >= 5, note: `${mine.length} practised${mine.length ? `, averaging ${avg}/10` : ""}` }
  ];
  return { c, j, steps, storiesN, screenN, mine, avg };
}
function renderJobAdvice() {
  const box = $("ivJobAdvice"); if (!box) return;
  const pd = planData();
  renderPrepFig(pd);
  if (!pd) { box.innerHTML = `<div class="iv-empty"><p>Choose or type in a job above and your plan appears here: the company, the role, the format, and what to do first.</p></div>`; return; }
  const { c, j, steps } = pd;
  const kind = titleKind(c.title), it = j.id && typeof T === "function" ? T().find(x => x.id === j.id) : null;
  const level = j.level || inferLevel(c.title), g = c.company ? guideForName(c.company) : null;
  const days = it ? ivDaysTo(it.interviewAt) : null, what = [c.title, c.company].filter(Boolean).join(" at ");
  const doneN = steps.filter(s => s.done).length, firstTodo = steps.find(s => !s.done);
  const body = {};
  // company
  if (g) {
    const tips = (g.interview || []).slice(0, 3).map(x => `<li>${esc(Array.isArray(x) ? x[0] : x)}</li>`).join(""), process = (g.process || []).slice(0, 6);
    body.company = `<p>We have a guide for ${esc(c.company)}.</p>${tips ? `<ul>${tips}</ul>` : ""}${process.length ? `<p class="iv-note"><b>How they hire:</b> ${esc(process.join(" → "))}</p>` : ""}<p><button class="ig-btn ig-btn--primary ig-btn--small" type="button" data-jp-pop="${esc(g.key)}">See the ${esc(c.company)} profile</button></p>`;
  } else if (c.company) {
    const de = directoryEntry(c.company);
    const q = s => `https://www.google.com/search?q=${encodeURIComponent(c.company + " " + s)}`;
    body.company = `<p>Spend 30 minutes on ${esc(c.company)}. Write down:</p><ul><li>What they do, who their customers are, and one recent thing in the news.</li><li>Their values or mission, and how they describe the people they hire.</li><li>One project, product or service you'd be glad to work on, and why.</li></ul><p class="iv-note">Search: <a href="${q("careers values")}" target="_blank" rel="noopener">careers and values</a> · <a href="${q("news")}" target="_blank" rel="noopener">recent news</a> · <a href="${q("interview questions")}" target="_blank" rel="noopener">interview experiences</a></p>${de ? `<p><button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-jp-dir="${esc(de.id)}">See what we know about ${esc(de.name)}</button></p>` : ""}`;
  } else body.company = `<p>Add the company name above, and this step will point you to its guide or give you research prompts.</p>`;
  // role
  const types = roleTypes(kind), skills = [...c.hard.slice(0, 5), ...c.soft.slice(0, 2)], qs = jobQuestions().slice(0, 4);
  body.role = `<p>${esc(ROLE_LOOKS[kind] || "Interviewers look for evidence you can do the job, will fit the team, and chose this role on purpose.")}</p>
    <h4>What you'll probably be asked</h4><ul class="iv-linklist">${types.map(t => `<li><button class="ig-linkbtn" type="button" data-jp-type="${t}">${esc(IV_TYPES[t].label)}</button> <span class="muted">${esc(IV_TYPES[t].framework.split(":")[0].split(".")[0])}</span></li>`).join("")}</ul>
    ${LEVEL_ADVICE[level] ? `<h4>For a ${esc(levelLabel(level).toLowerCase())} role</h4><ul>${LEVEL_ADVICE[level].map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="iv-note">Choose how senior the role is above for tips that fit it.</p>`}
    ${skills.length ? `<h4>${c.jd ? "Skills the ad asks for" : "Skills that usually matter"}</h4><p class="jp-chips">${skills.map(s => `<span class="chip found">${esc(s)}</span>`).join("")}</p><p class="iv-note">Have a short real example ready for each.</p>` : ""}
    ${qs.length ? `<h4>Questions written for this job</h4><ul class="iv-linklist">${qs.map((q, i) => `<li><span>${esc(q.text)}</span> <button class="ig-linkbtn" type="button" data-jp-q="${i}">Practise this</button></li>`).join("")}</ul>` : ""}`;
  // format
  body.format = HELD_ADVICE[j.format]
    ? `<ul>${HELD_ADVICE[j.format].map(x => `<li>${esc(x)}</li>`).join("")}</ul><p><button class="ig-btn ig-btn--primary ig-btn--small" type="button" data-jp-practise>Practise it this way</button></p>`
    : `<p>Choose phone, video, one-way video or in person above for tips on that format, and to practise it the same way.</p>`;
  body.stories = `<p>${pd.storiesN} of ${STORY_SLOTS.length} stories are ready. Aim for at least three: one about teamwork, one about solving a problem, and one about a mistake you fixed.</p><p><a class="ig-btn ig-btn--ghost ig-btn--small" href="#iv-stories" data-iv-scroll>Write my stories</a></p>`;
  body.screen = `<p>${pd.screenN} of ${SCREEN_FIELDS.length} answers written. At least your 60-second background, why this role, and your salary range.</p><p><a class="ig-btn ig-btn--ghost ig-btn--small" href="#iv-screen" data-iv-scroll>Write my answers</a></p>`;
  body.practise = `<p>${pd.mine.length} answer${pd.mine.length === 1 ? "" : "s"} practised for this job${pd.mine.length ? `, averaging ${pd.avg} out of 10` : ""}. Five or more, said out loud, makes a real difference.</p><p class="iv-actions"><button class="ig-btn ig-btn--primary ig-btn--small" type="button" data-jp-practise>Practise for this job</button><button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-jp-mock>Do a mock interview</button></p>`;
  const open = ivState.open || new Set(firstTodo ? [firstTodo.id] : []);
  ivState.open = open;
  const count = days != null && days >= 0 ? (() => { const plan = WEEK_PLAN[Math.max(0, Math.min(WEEK_PLAN.length - 1, 7 - days))]; return `<div class="iv-countdown"><b>${days === 0 ? "Your interview is today." : days === 1 ? "Your interview is tomorrow." : `Your interview is in ${days} days.`}</b> ${days > 7 ? "Plenty of time. Start with the research and your stories." : `${esc(plan[0])}: ${esc(plan[1])}`}</div>`; })() : "";
  box.innerHTML = `${count}<p class="iv-lead">Your plan for <b>${esc(what)}</b>: <b>${doneN} of ${steps.length}</b> steps done. Open a step to see what to do.</p>
    <ol class="iv-plan">${steps.map((s, i) => `<li class="iv-pstep${s.done ? " done" : ""}"><details data-step="${s.id}"${open.has(s.id) ? " open" : ""}><summary><span class="iv-pnum">${String(i + 1).padStart(2, "0")}</span><span class="iv-ptitle">${esc(s.title)}</span><span class="iv-pstate">${s.done ? "✓ Done" : s.note || "To do"}</span></summary><div class="iv-pbody">${body[s.id]}${i < steps.length - 1 ? `<div class="iv-pnext"><button class="ig-btn ig-btn--primary ig-btn--small" type="button" data-jp-next="${s.id}">Next <span aria-hidden="true">→</span></button></div>` : ""}</div></details></li>`).join("")}</ol>
    ${it && it.jd ? `<p class="iv-actions"><button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-jp-tailor>Tailor my resume to this job</button></p>` : ""}`;
}
// The paper on the right of the Get ready page: this job and how far along you are
function renderPrepFig(pd) {
  const fig = $("ivPrepFig"); if (!fig) return;
  const sample = !pd, j = ivPrep.data.job;
  const rows = sample ? [["Know the company", 1, "their values ✓"], ["Know the role", 1, ""], ["Prepare for the format", 0, ""], ["Write your stories", 0, "3 is enough"], ["Screening answers", 0, ""], ["Practise out loud", 0, ""]] : pd.steps.map((s, i) => [s.title.replace("Write your ", "").replace("Prepare for the format", "Prepare for the format"), s.done ? 1 : 0, i === 0 && s.done ? "their values ✓" : i === 3 && !s.done ? "3 is enough" : ""]);
  const done = rows.filter(r => r[1]).length, fmt = (IV_HELD.find(x => x[0] === j.format) || [])[1];
  fig.innerHTML = `<div class="ig-score__sheet"><div class="ig-score__head"><span class="ig-score__title">Interview prep</span><span class="ig-score__meta">${sample ? "an example" : `${done} of ${rows.length} done`}</span></div>
    <dl class="ig-score__fields"><div><dt>Role</dt><dd>${esc(sample ? "Customer Service Team Leader" : j.title || "Your job title")}</dd></div><div><dt>Company</dt><dd>${esc(sample ? "Harbourside Grocers" : j.company || "Their name")}</dd></div><div><dt>Format</dt><dd>${esc(sample ? "Video call" : fmt || "How it's held")}</dd></div></dl>
    <ol class="iv-figlist">${rows.map(([t, d, pen]) => `<li class="${d ? "done" : ""}"><span class="iv-figbox" aria-hidden="true">${d ? "✓" : ""}</span><span>${esc(t)}</span>${pen ? `<span class="ig-pen">${esc(pen)}</span>` : ""}</li>`).join("")}</ol>
    <p class="ig-pen iv-figpen">${sample ? "your plan builds as you go ✓" : done >= rows.length ? "you're ready ✓" : done ? "nicely on the way ✓" : "start with step one ✓"}</p></div>`;
}
function renderJobPanels() {
  renderJobPick($("ivJobPick"), "");
  renderJobPick($("ivJobPickP"), "p");   // the same choices on the Practise page
  renderJobAdvice();
  if (typeof renderSetup === "function" && $("ivPractice") && !$("ivPractice").hidden) renderSetup();
}

/* --- Picking the job: the same on Get ready and Practise --- */
function wireJobPick(root, afterChange) {
  const note = t => { const n = document.querySelectorAll(".jp-note"); n.forEach(x => { x.textContent = t; }); };
  const save = () => { ivPrep.save(); clearTimeout(ivState.timer); ivState.timer = setTimeout(() => { renderJobAdvice(); afterChange(); }, 250); };
  root.addEventListener("input", e => {
    const f = e.target.dataset && e.target.dataset.jpf; if (!f) return;
    const j = ivPrep.data.job; j[f] = e.target.value;
    if (f === "title" || f === "company") { j.id = ""; document.querySelectorAll(".jp-card").forEach(c => c.setAttribute("aria-pressed", "false")); document.querySelectorAll(".jp-acts").forEach(x => { x.innerHTML = jpActsHtml(); }); }   // typed over a saved job: it's your own entry now
    // the other page's boxes follow
    document.querySelectorAll(`[data-jpf="${f}"]`).forEach(x => { if (x !== e.target) x.value = e.target.value; });
    if (f === "title" && !j.level) { const guess = inferLevel(e.target.value); if (guess) { j.level = guess; document.querySelectorAll("[data-jplevel]").forEach(b => { const on = b.dataset.jplevel === guess; b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-checked", String(on)); }); } }
    save();
  });
  root.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const j = ivPrep.data.job;
    const pick = (attr, key) => { j[attr] = j[attr] === key ? "" : key; ivPrep.save(); renderJobPanels(); note("Saved."); };
    if (b.dataset.jp) { setIvJobFromTracker(b.dataset.jp); ivState.open = null; renderJobPanels(); }
    else if (b.dataset.jplevel) pick("level", b.dataset.jplevel);
    else if (b.dataset.jpformat) pick("format", b.dataset.jpformat);
    else if (b.hasAttribute("data-jp-all")) { ivState.showAll = !ivState.showAll; renderJobPanels(); }
    else if (b.hasAttribute("data-jp-clear")) { Object.assign(j, { id: "", title: "", company: "", level: "", format: "", ticks: {} }); ivState.open = null; ivPrep.save(); renderJobPanels(); }
    else if (b.hasAttribute("data-jp-add")) {
      const it = trackJob({ title: val(j.title), company: val(j.company), source: "Interviews" }, "interview");
      j.id = it.id; ivPrep.save(); renderJobPanels(); note("Added to your Application tracker.");
    }
  });
}
onInit(() => {
  const root = $("ivPrepare");
  wireJobPick(root, () => {});
  wireJobPick($("ivIntro"), () => {});
  root.addEventListener("toggle", e => {
    const d = e.target.closest && e.target.closest("details[data-step]"); if (!d) return;
    ivState.open = ivState.open || new Set();
    d.open ? ivState.open.add(d.dataset.step) : ivState.open.delete(d.dataset.step);
  }, true);
  root.addEventListener("click", e => {
    const b = e.target.closest("button, a"); if (!b) return;
    const j = ivPrep.data.job;
    if (b.dataset.jpPop) openCompanyPop(b.dataset.jpPop);
    else if (b.dataset.jpDir) openDirectoryPop(b.dataset.jpDir);
    else if (b.dataset.jpNext) {
      // Next marks this step done and opens the one after it
      const id = b.dataset.jpNext, steps = ["company", "role", "format", "stories", "screen", "practise"], at = steps.indexOf(id);
      if (at < 3) { j.ticks = j.ticks || {}; j.ticks[id] = true; ivPrep.save(); }
      ivState.open = new Set([steps[at + 1]]);
      renderJobAdvice();
      const d = root.querySelector(`details[data-step="${steps[at + 1]}"]`); if (d) d.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    }
    else if (b.dataset.jpType) { iv.mode = "single"; iv.modeChosen = true; iv.types = new Set([b.dataset.jpType]); setIvTab("practice"); }
    else if (b.hasAttribute("data-jp-practise")) { iv.mode = "single"; iv.modeChosen = true; iv.howSeen = ""; setIvTab("practice"); }
    else if (b.hasAttribute("data-jp-mock")) { iv.mode = "mock"; iv.modeChosen = true; iv.howSeen = ""; setIvTab("practice"); }
    else if (b.dataset.jpQ != null) { const q = jobQuestions()[+b.dataset.jpQ]; if (q) { iv.mode = "single"; iv.mock = null; setIvTab("practice"); showQuestion(q); } }
    else if (b.hasAttribute("data-jp-tailor")) { const it = T().find(x => x.id === j.id); if (it && it.jd) { els.jd.value = it.jd; els.title.value = it.title; updateCounts(); updateFlow(); openView("scanner"); } }
    else if (b.hasAttribute("data-iv-scroll")) { e.preventDefault(); const t = $(b.getAttribute("href").slice(1)); if (t) t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
  });
  // the contents column: links scroll inside the page (a changed address would leave Interviews), and the section you're in is marked
  root.addEventListener("click", e => {
    const a = e.target.closest('.ig-toc a[href^="#iv-"]'); if (!a) return;
    e.preventDefault(); const t = $(a.getAttribute("href").slice(1)); if (t) t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  });
  new MutationObserver(() => {
    const links = [...root.querySelectorAll(".ig-toc a")]; if (!links.length || !("IntersectionObserver" in window)) return;
    if (root._io) root._io.disconnect();
    const by = {}; links.forEach(a => { by[a.getAttribute("href").slice(1)] = a; });
    root._io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && by[en.target.id]) { links.forEach(a => a.removeAttribute("aria-current")); by[en.target.id].setAttribute("aria-current", "true"); } }), { rootMargin: "-35% 0px -60% 0px" });
    root.querySelectorAll(".ig-section[id]").forEach(s => root._io.observe(s));
  }).observe(root, { childList: true });
});
