/* ===================== Interview prep ===================== */
const IV_KEY = "jobfinder.interview.v1", IV_TAB_KEY = "jobfinder.ivtab.v1";
const IV_MODES = [
  { key: "single", label: "One question", desc: "Pick the kinds of question you want and practise them one at a time.", meta: "As many as you like" },
  { key: "screen", label: "Phone screening", desc: "Six quick questions, like a recruiter's first call: your background, why you applied, pay, start date.", meta: "6 questions · about 10 minutes" },
  { key: "mock", label: "Mock interview", desc: "Five questions in a row, like the real thing, with a score at the end.", meta: "5 questions · about 20 minutes" }
];
// How the interview will be held decides how you practise: typing, or speaking with the question read aloud
const IV_HOWS = [
  { key: "type", label: "Type my answer", short: "typed", desc: "Write your answer the way you'd say it. Good for a first draft.", meta: "No camera or microphone" },
  { key: "phone", label: "Phone call", short: "phone call", desc: "You hear each question and answer out loud. No camera.", meta: "Microphone" },
  { key: "video", label: "Video call", short: "video call", desc: "Camera on, like Teams or Zoom. Hear the question, answer, then watch yourself back.", meta: "Camera and microphone" },
  { key: "oneway", label: "One-way video", short: "one-way video", desc: "Like HireVue: 30 seconds to think, up to 2 minutes to answer, no second go.", meta: "Camera and microphone · timed" }
];
const iv = { tab: lsGet(IV_TAB_KEY) || "formats", mode: "single", how: "type", hideText: false, noAI: false, types: new Set(["essential"]), useJob: true, asked: new Set(), q: null, mock: null, attempts: [], where: "loading", doc: null, timer: null, last: null, voiceT: null };

/* --- Saved practice history (private) --- */
const ivReady = memoryReady.then(async () => {
  try {
    if (memory.db && memory.uid) {
      iv.doc = memory.db.doc("data/users/" + memory.uid + "/interviewPractice");
      const snap = await iv.doc.get();
      if (snap.exists) iv.attempts = Array.isArray((snap.data() || {}).attempts) ? snap.data().attempts.slice(-60) : [];
      iv.where = "account"; return;
    }
  } catch { iv.doc = null; }
  try { const raw = lsGet(IV_KEY); if (raw) iv.attempts = (JSON.parse(raw) || {}).attempts || []; iv.where = "browser"; } catch { iv.where = "none"; }
});
let ivChain = Promise.resolve();
function saveIv() {
  ivChain = ivChain.then(async () => {
    const body = { version: 1, attempts: iv.attempts.slice(-60), updated: new Date().toISOString() };
    if (iv.doc) { try { await iv.doc.set(body); iv.where = "account"; return; } catch { iv.doc = null; } }
    try { localStorage.setItem(IV_KEY, JSON.stringify(body)); iv.where = "browser"; } catch { iv.where = "none"; }
  });
  return ivChain;
}

/* --- Formats: the "Interview guide" tab is plain page content now (25b-interview-guide.js). IV_FORMATS still drives the practice feedback. --- */

/* --- Questions for the job you scanned (or the one you're aiming for) --- */
const aOrAn = w => /^[aeiou]/i.test(w) ? "an" : "a";
function jobContext() {
  const chosen = typeof ivJobContext === "function" ? ivJobContext() : null;   // the job picked in Get ready comes first
  if (chosen) return chosen;
  if (lastResult && lastScan) {
    const title = detectTitle(lastScan.jd, lastScan.title) || "";
    const hard = [...lastResult.hard].sort((a, b) => ((b.priority === "Required") - (a.priority === "Required")) || (b.rel - a.rel)).map(x => x.name);
    const soft = [...lastResult.soft].sort((a, b) => (b.rel || 0) - (a.rel || 0)).map(x => x.name);
    const duties = readJobAd(lastScan.jd).filter(L => L.kind === "duty" && BULLET_RE.test(L.text)).map(L => tidy(L.text)).filter(d => wordCount(d) >= 4 && wordCount(d) <= 22);
    return { from: "scan", title, company: companyFrom(lastScan.jd), hard, soft, duties };
  }
  const p = P();
  if (p.target.title) return { from: "profile", title: p.target.title, company: "", hard: [...p.skills.hard, ...p.skills.software], soft: p.skills.soft, duties: [] };
  return null;
}
function jobQuestions() {
  const j = jobContext();
  if (!j) return [];
  const out = [];
  const role = j.title ? `${aOrAn(j.title)} ${j.title}` : "this role";
  if (j.title) out.push({ type: "motivation", text: `What interests you about working as ${role}${j.company ? ` at ${j.company}` : ""}?` });
  if (j.company) out.push({ type: "motivation", text: `What do you know about ${j.company}, and why do you want to work here?` });
  j.hard.slice(0, 4).forEach((s, i) => out.push(i % 2 ? { type: "technical", text: `How have you used ${inSentence(s)}? Walk me through a specific example.` } : { type: "behavioural", text: `Tell me about a time you used ${inSentence(s)} to solve a problem.` }));
  j.duties.slice(0, 3).forEach(d => out.push({ type: "situational", text: `This role involves work like “${lowerFirst(d)}”. How would you approach that in your first few weeks?` }));
  j.soft.slice(0, 2).forEach(s => out.push({ type: "behavioural", text: `The role calls for ${softPhrase(s)}. Tell me about a time you showed it.` }));
  return out.map((x, i) => ({ ...x, id: "j" + i + ":" + x.text.length, essential: true, job: true }));
}
function questionPool() {
  const types = iv.types;
  const essentialOnly = types.has("essential") && types.size === 1;
  const wantType = t => essentialOnly || types.has(t);
  let pool = IV_QUESTIONS.filter(x => wantType(x.type) && (!essentialOnly || x.essential));
  if (iv.useJob) pool = [...jobQuestions().filter(x => wantType(x.type)), ...pool];
  return pool;
}
// Random, but not the same question twice in a row, and fresh ones before repeats
function pickQuestion(pool) {
  if (!pool.length) return null;
  const practised = new Set(iv.attempts.map(a => a.q));
  let fresh = pool.filter(x => !iv.asked.has(x.text));
  if (!fresh.length) { iv.asked.clear(); fresh = pool.filter(x => !iv.q || x.text !== iv.q.text); }
  const unseen = fresh.filter(x => !practised.has(x.text));
  const from = unseen.length ? unseen : fresh.length ? fresh : pool;
  // lean towards questions for this job when there are some
  const job = from.filter(x => x.job);
  const list = job.length && Math.random() < 0.45 ? job : from;
  const q = list[Math.floor(Math.random() * list.length)];
  iv.asked.add(q.text);
  return q;
}
function mockSet() {
  const jq = iv.useJob ? jobQuestions() : [];
  const take = (type, preferJob) => {
    const opts = [...(preferJob ? jq.filter(x => x.type === type) : []), ...IV_QUESTIONS.filter(x => x.type === type && x.essential)].filter(x => !iv.asked.has(x.text));
    const q = opts.length ? opts[Math.floor(Math.random() * Math.min(opts.length, preferJob && jq.some(x => x.type === type) ? 2 : opts.length))] : IV_QUESTIONS.find(x => x.type === type);
    iv.asked.add(q.text);
    return q;
  };
  return [IV_QUESTIONS.find(x => x.text === "Tell me about yourself."), take("motivation", true), take("behavioural", true), Math.random() < 0.5 || !jq.some(x => x.type === "technical") ? take("situational", true) : take("technical", true), IV_QUESTIONS.find(x => x.text === "Do you have any questions for us?")];
}

/* --- Practice settings: three plain steps (how it's held, what to practise, start) --- */
const IV_ICON = {
  type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10 6-3.5v11l-6-3.5z"/></svg>',
  oneway: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>',
  single: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M9 10h6"/></svg>',
  screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></svg>',
  mock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/></svg>'
};
const ivTile = (attr, key, label, desc, meta, on, off, rec) => `<button type="button" class="iv-tile" role="radio" data-${attr}="${key}" aria-checked="${on}" aria-pressed="${on}"${off ? " disabled" : ""}><span class="iv-tile-ico" aria-hidden="true">${IV_ICON[key] || ""}</span><span class="iv-tile-txt">${rec ? `<span class="iv-rec-badge">${esc(typeof rec === "string" ? rec : "Recommended for you")}</span>` : ""}<b>${esc(label)}</b><span>${esc(desc)}</span><em>${esc(meta)}</em></span><span class="iv-tile-check" aria-hidden="true"></span></button>`;
const ivJobShort = j => { const t = [j.title, j.company].filter(Boolean).join(" at "); return t.length > 44 ? t.slice(0, 42) + "…" : t || "this job"; };
// Which kind of practice suits you now, and why (you can always pick another)
function recommendMode() {
  const j = ivPrep.data.job || {}, it = j.id && typeof T === "function" && trk.where !== "loading" ? T().find(x => x.id === j.id) : null;
  const days = it ? ivDaysTo(it.interviewAt) : null, done = iv.attempts.length;
  if ((it && it.stage === "screening") || j.format === "phone") return { key: "screen", why: "your interview starts with a phone call, so a phone screening is the closest match" };
  if (days != null && days >= 0 && days <= 7) return { key: "mock", why: `your interview is ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}, so a full mock interview is the best use of your time` };
  if (!done) return { key: "single", why: "it's your first practice, so start with one question and get a feel for it" };
  if (done >= 3) return { key: "mock", why: "you've practised a few answers already, so try them back to back in a mock interview" };
  return { key: "single", why: "a few more single questions will warm you up before a mock interview" };
}

/* --- The interview room: practice opens on a page of its own, with nothing else on it --- */
function openRoom() {
  const d = $("ivRoomDlg");
  if (!d.open) d.showModal();
  document.documentElement.classList.add("iv-in-room");
  iv.running = true;
  $("ivExitAsk").hidden = true;
  d.scrollTop = 0;
  const how = IV_HOWS.find(h => h.key === iv.how) || IV_HOWS[0], m = IV_MODES.find(x => x.key === (iv.mock ? iv.mock.kind : iv.mode)) || IV_MODES[0], j = iv.useJob ? jobContext() : null;
  $("ivRoomTitle").textContent = `${m.label} · ${how.label}${j ? " · " + ivJobShort(j) : ""}`;
}
function closeRoom(then) {
  stopTimer(); stopMic(); stopSpeaking(); endPractice();
  if (iv.sess) iv.sess.items.forEach(x => { if (x.url) URL.revokeObjectURL(x.url); });
  iv.sess = null; iv.mock = null; iv.running = false; iv.prechecked = false; iv.onSummary = false;
  const d = $("ivRoomDlg");
  if (d.open) d.close();
  document.documentElement.classList.remove("iv-in-room");
  $("ivStage").innerHTML = "";
  renderSetup();
  if (then === "progress") setIvTab("history");
  else if (then !== "quiet") $("ivPracticeRoot").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
}
// Leaving part-way: offer the summary of what's been answered
function askExit() {
  const s = iv.sess, answered = s ? s.items.filter(x => wordCount(x.answer || "") >= 3).length : 0;
  if (!answered || iv.onSummary) { closeRoom(); return; }
  $("ivExitP").textContent = `You've answered ${answered} question${answered === 1 ? "" : "s"}. Take a look at the summary before you go?`;
  $("ivExitAsk").hidden = false;
  const b = $("ivExitAsk").querySelector("button"); if (b) b.focus();
}
const sessItem = () => iv.sess ? iv.sess.items[iv.sess.idx] : null;
const ivIsLast = () => !!iv.mock && iv.mock.i >= iv.mock.list.length - 1;

function renderSetup() {
  // the job picked in Get ready sets how you practise, once
  const jb = ivPrep.data.job || {}, jkey = jb.format ? jb.format + "|" + jb.id + "|" + jb.title : "";
  if (jkey && iv.howSeen !== jkey) { iv.howSeen = jkey; const m = { phone: "phone", video: "video", oneway: "oneway", person: "video", panel: "video", group: "video" }[jb.format]; if (m && voiceCan().camera) { iv.how = m; iv.howFromJob = true; } }
  const can = voiceCan();
  const rec = recommendMode();
  if (!iv.modeChosen) iv.mode = rec.key;
  $("ivHows").innerHTML = IV_HOWS.map(h => ivTile("how", h.key, h.label, h.desc, h.meta, iv.how === h.key, h.key !== "type" && !can.camera)).join("");
  $("ivModes").innerHTML = IV_MODES.map(m => ivTile("mode", m.key, m.label, m.desc, m.meta, iv.mode === m.key, false, rec.key === m.key)).join("");
  $("ivRecNote").innerHTML = `<b>Recommended for you:</b> ${esc((IV_MODES.find(m => m.key === rec.key) || {}).label || "")}, because ${esc(rec.why)}.${iv.mode !== rec.key ? " You've picked something different, which is fine." : ""}`;
  const typeChips = [["essential", "Most common"], ...Object.entries(IV_TYPES).map(([k, v]) => [k, v.label])];
  $("ivTypes").innerHTML = typeChips.map(([k, l]) => `<button type="button" class="opt-chip" data-type="${k}" aria-pressed="${iv.types.has(k)}">${esc(l)}</button>`).join("");
  $("ivTypeBox").hidden = iv.mode !== "single";
  $("ivScreenSheet").hidden = iv.mode !== "screen";
  if (iv.mode === "screen") renderScreenSheet($("ivScreenSheet"), true);
  const how = IV_HOWS.find(h => h.key === iv.how) || IV_HOWS[0], notes = [];
  if (iv.howFromJob && iv.how !== "type") notes.push(`Your interview is a ${how.short}, so we picked this for you.`);
  if (iv.how !== "type") {
    if (!can.speak) notes.push("This browser can't read the question aloud, so you'll read it on screen.");
    if (!can.listen) notes.push("It also can't write down what you say (Chrome and Edge can), so you'll speak, watch or listen back, then type a few notes to get a rating.");
    notes.push("The camera and microphone only turn on when you start, and everything stays on this device.");
  }
  if (!can.camera) notes.push("Phone and video practice need a browser that allows the microphone and camera.");
  $("ivHowNote").textContent = notes.join(" ");
  $("ivVoiceOpts").hidden = iv.how === "type";
  $("ivHideQ").checked = iv.hideText; $("ivNoAI").checked = iv.noAI;
  const j = jobContext();
  $("ivJob").innerHTML = j
    ? `<div class="iv-jobline"><span class="iv-jobline-l">Questions</span><div class="seg" role="group" aria-label="Which questions"><button type="button" data-usejob="0" aria-pressed="${!iv.useJob}">General</button><button type="button" data-usejob="1" aria-pressed="${iv.useJob}">Written for ${esc(ivJobShort(j))}</button></div><button class="ig-linkbtn" type="button" data-ivtab="prepare">Change job</button></div>`
    : `<p class="iv-lead">Want questions written for a particular job? <button class="ig-linkbtn" type="button" data-ivtab="prepare">Choose one in Get ready</button>, or scan an ad in <a href="#scanner">Tailor to a job</a>.</p>`;
  const modeName = (IV_MODES.find(m => m.key === iv.mode) || IV_MODES[0]);
  $("ivSummary").innerHTML = `<b>${esc(how.label)}</b> · ${esc(modeName.label)} · ${esc(modeName.meta.split(" · ")[0])}${j && iv.useJob ? ` · questions for ${esc(ivJobShort(j))}` : ""}`;
  $("ivStart").textContent = iv.mode === "mock" ? "Start the mock interview" : iv.mode === "screen" ? "Start the phone screening" : "Start practising";
}
async function describeIvEngine() {
  if (iv.noAI) { $("ivEngine").textContent = "Answers are rated by the built-in checks only (structure, evidence and length), as you chose."; return; }
  const st = await chromeAIState();
  $("ivEngine").textContent = smallEngine() ? `Answers are rated by ${SMALL()}, ${smallWhere()}, in short steps.`
    : st === "available" ? `Answers are rated by ${BROWSER_AI()}, on this device.`
    : (st === "downloadable" || st === "downloading") ? "Answers are rated by " + BROWSER_AI() + " if it's ready, otherwise by " + (sample ? AI_NAME() : "the built-in checks") + "."
    : sample ? "Answers are rated by " + AI_LONG() + "."
    : "No AI on this page, so answers are rated with built-in checks for structure, evidence and length.";
}

/* --- Asking --- */
function startPractice() {
  stopTimer(); stopMic();
  let first;
  $("ivStartNote").textContent = "";
  if (iv.mode === "mock" || iv.mode === "screen") {
    iv.mock = { list: iv.mode === "screen" ? screenSet() : mockSet(), i: 0, results: [], kind: iv.mode };
    first = iv.mock.list[0];
  } else {
    iv.mock = null;
    first = pickQuestion(questionPool());
    if (!first) { $("ivStartNote").textContent = "Pick at least one kind of question above."; $("ivTypes").scrollIntoView({ block: "center" }); return; }
  }
  iv.sess = null;   // a new practice begins
  showQuestion(first);
}
// Which of Listen / Answer / Review you're on
function ivStepTo(n) { document.querySelectorAll("#ivStepper li").forEach((li, i) => { li.classList.toggle("on", i === n); li.classList.toggle("done", i < n); }); }
function showQuestion(q, opts = {}) {
  stopTimer(); stopMic();
  const voice = iv.how !== "type", dlg = $("ivRoomDlg");
  if (!iv.sess || !dlg.open) { iv.sess = { kind: iv.mock ? iv.mock.kind : "single", items: [], idx: -1, started: Date.now() }; iv.prechecked = false; }
  iv.onSummary = false;
  openRoom();
  // phone and video practice start with a check of the microphone and camera
  if (voice && !iv.prechecked) { resetTake(true); iv.sess.first = q; iv.sess.firstOpts = opts; return renderPrecheck(); }
  resetTake(true);   // a new question: any recording or speaking stops (the camera stays on until practice ends)
  iv.q = q; iv.last = opts.keepLast ? iv.last : null;
  // the list for the summary: a retry reuses its entry; asking for a different question before answering replaces it
  const s = iv.sess, cur = s.items[s.idx];
  if (opts.keepLast && cur) { cur.answer = ""; cur.take = null; cur.rating = null; cur.blob = null; if (cur.url) { URL.revokeObjectURL(cur.url); cur.url = ""; } }
  else if (cur && !cur.answer && !iv.mock) s.items[s.idx] = { q };
  else { s.items.push({ q }); s.idx = s.items.length - 1; }
  $("ivRoomProg").textContent = iv.mock ? `Question ${iv.mock.i + 1} of ${iv.mock.list.length}` : `Question ${s.idx + 1}`;
  const T = IV_TYPES[q.type];
  const fmt = IV_FORMATS.find(f => f.key === q.type) || IV_FORMATS.find(f => f.practise.includes(q.type));
  const isAsk = /questions for us/i.test(q.text);
  $("ivStage").innerHTML = `<section class="iv-room${voice && iv.hideText ? " q-hidden" : ""}" aria-labelledby="ivQText">
    <ol class="iv-stepper" id="ivStepper" aria-label="Where you are"><li class="on"><span>1</span>${voice ? "Listen" : "Read"}</li><li><span>2</span>Answer</li><li><span>3</span>Review</li></ol>
    <div class="iv-ask">
      <div class="iv-q-top"><span class="iv-badge">${esc(T.label)}</span>${q.job ? '<span class="iv-badge job">For this job</span>' : ""}${q.followUp ? '<span class="iv-badge plain">Follow-up</span>' : ""}<span class="iv-timer" id="ivTimer" hidden></span></div>
      <p class="iv-ask-who">${voice ? "The interviewer asks" : "The question"}</p>
      <h2 class="iv-qtext" id="ivQText" tabindex="-1">${esc(q.text)}</h2>${voice ? '<p class="iv-qhidden" aria-hidden="true">Listen to the question. <button class="ig-linkbtn" type="button" data-take="showq">Show it on screen</button></p>' : ""}
      <details class="iv-hint"><summary>How to approach this</summary><div><p>${esc(T.framework)}</p>${isAsk ? `<p>Questions that work well:</p><ul>${QUESTIONS_TO_ASK.slice(0, 4).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p class="muted">Aim for about ${Math.round(T.ideal[0] / 2.2 / 10) * 10 || 30} to ${Math.round(T.ideal[1] / 2.2 / 10) * 10} seconds when spoken.${fmt ? ` <button class="ig-linkbtn" type="button" data-showfmt="${fmt.key}">More on ${esc(fmt.name.toLowerCase())}</button>` : ""}</p></div></details>
    </div>
    <div class="iv-choice" id="ivChoice" hidden></div>
    ${voice ? voiceHtml() : ""}
    <div class="iv-answer">
      <label class="iv-ans-label" for="ivAnswer">${voice ? "What we heard" : "Your answer"}<span>${voice ? "It's punctuated for you. Fix anything it got wrong, or type your own notes." : "Type it the way you'd say it out loud. Press I'm finished when you're done."}</span></label>
      <textarea id="ivAnswer" rows="8" spellcheck="true" placeholder="${voice ? "Your answer appears here as you speak." : esc(q.type === "behavioural" || q.type === "competency" ? "Start with the situation: “In my second year at uni, I…”" : q.type === "intro" ? "Start with who you are now: “I'm a final-year…”" : "Start answering here")}"></textarea>
      <div class="iv-meta"><span id="ivCount">0 words</span><button class="ig-linkbtn iv-mic" id="ivMic" type="button" aria-pressed="false" hidden>Speak instead</button></div>
      <div class="iv-actions" id="ivAnsActs"><button class="ig-btn ig-btn--primary" id="ivDone" type="button"${voice ? " hidden" : ""}>I'm finished</button>${iv.mock ? "" : '<button class="ig-btn ig-btn--ghost" id="ivSkip" type="button">Different question</button>'}<span class="status-line" id="ivRateStatus" role="status"></span></div>
    </div>
    <div id="ivFeedback" aria-live="polite"></div>
  </section>`;
  const ta = $("ivAnswer");
  ta.addEventListener("input", () => { updateCount(); const it = sessItem(); if (it) it.answer = ta.value; if (!voice && ta.value.trim() && $("ivChoice").hidden) ivStepTo(1); });
  $("ivDone").onclick = finishAnswer;
  if ($("ivSkip")) $("ivSkip").onclick = () => { stopTimer(); stopMic(); const n = pickQuestion(questionPool().filter(x => x.text !== q.text)); if (n) showQuestion(n); };
  setupMic();
  $("ivStage").querySelector("[data-showfmt]") && ($("ivStage").querySelector("[data-showfmt]").onclick = e => { closeRoom("quiet"); openFormat(e.target.dataset.showfmt); });
  $("ivRoomDlg").scrollTop = 0;
  $("ivQText").focus({ preventScroll: true });
  if (voice) voiceBegin(q);
}
// "I'm finished": the answer is kept, then you choose to rate it or move on
function finishAnswer() {
  const q = iv.q, ta = $("ivAnswer"), ans = ta.value.trim(), st = $("ivRateStatus");
  if (wordCount(ans) < 3) { st.textContent = "Give your answer first, even a rough one, then press I'm finished."; ta.focus(); return; }
  st.textContent = "";
  stopTimer(); stopMic();
  const it = sessItem(), tk = takeResult(q);
  if (it) { it.answer = ans; if (tk) it.take = { ...tk }; }
  showChoice();
}
function showChoice() {
  const box = $("ivChoice"); if (!box) return;
  const last = ivIsLast(), voice = iv.how !== "type";
  box.hidden = false;
  box.innerHTML = `<h3 class="iv-choice-h">Answer finished. What next?</h3>
    <div class="iv-actions"><button class="ig-btn ig-btn--primary" id="ivRate" type="button" data-iv="rate">Rate my answer</button><button class="ig-btn ig-btn--ghost" type="button" data-iv="next-q">${last ? "See my summary" : "Next question"}</button></div>
    <p class="iv-choice-more">${voice ? '<button class="ig-linkbtn" type="button" data-take="retake">Record it again</button>' : '<button class="ig-linkbtn" type="button" data-iv="edit">Keep editing</button>'}<button class="ig-linkbtn" type="button" data-iv="again">Start this question again</button>${last ? "" : '<button class="ig-linkbtn" type="button" data-iv="summary-now">Finish and see my summary</button>'}</p>`;
  const done = $("ivDone"); if (done) done.hidden = true;
  const sk = $("ivSkip"); if (sk) sk.hidden = true;
  ivStepTo(2);
  box.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
}
function hideChoice() { const b = $("ivChoice"); if (b) { b.hidden = true; b.innerHTML = ""; } $("ivFeedback").innerHTML = ""; const d = $("ivDone"); if (d) d.hidden = false; }
// After the last answer in a voice practice, move on by itself to the choice
function ivAfterTake() {
  const ta = $("ivAnswer"); if (!ta) return;
  if (wordCount(ta.value) >= 3) finishAnswer(); else { const d = $("ivDone"); if (d) d.hidden = false; }
}
function ivNext() {
  if (iv.mock) { if (iv.mock.i < iv.mock.list.length - 1) { iv.mock.i++; showQuestion(iv.mock.list[iv.mock.i]); } else renderSessionSummary(); return; }
  const q = pickQuestion(questionPool());
  if (!q) { renderSessionSummary(); return; }
  showQuestion(q);
}
function updateCount() {
  const w = wordCount($("ivAnswer").value), s = Math.round(w / 2.2);
  $("ivCount").textContent = `${w} word${w === 1 ? "" : "s"}, about ${s < 60 ? s + " seconds" : Math.floor(s / 60) + " min " + String(s % 60).padStart(2, "0") + " s"} spoken`;
}
// One-way video practice: 30 seconds to think, 2 minutes to answer
function startTimer() {
  stopTimer();
  const el = $("ivTimer"), ta = $("ivAnswer");
  let phase = "prep", left = 30;
  el.hidden = false;
  const tick = () => {
    const m = Math.floor(left / 60), s = String(left % 60).padStart(2, "0");
    el.textContent = phase === "prep" ? `Thinking time ${m}:${s}` : `Answer ${m}:${s}`;
    el.className = "iv-timer" + (phase === "prep" ? " prep" : left <= 15 ? " low" : "");
    if (left <= 0) {
      if (phase === "prep") { phase = "answer"; left = 120; ta.focus(); }
      else { stopTimer(); el.textContent = "Time's up"; ta.readOnly = true; $("ivRateStatus").textContent = "Time's up. In a real video interview, recording stops here."; $("ivRate").focus(); return; }
    } else left--;
  };
  tick();
  iv.timer = setInterval(tick, 1000);
}
function stopTimer() { if (iv.timer) clearInterval(iv.timer); iv.timer = null; }
// Speaking your answer when you're typing (only where the browser allows speech recognition). Punctuation is added as you speak.
function setupMic() {
  const b = $("ivMic");
  if (!voiceCan().listen || !b || iv.micBlocked || iv.how !== "type") return;
  b.hidden = false;
  b.onclick = () => {
    if (iv.voiceT) { stopMic(); return; }
    const ta = $("ivAnswer");
    const v = createVoice({ base: ta.value.trim(), names: ivNames(),
      onText: (txt, interim) => { ta.value = txt + (interim ? (txt ? " " : "") + interim : ""); updateCount(); },
      onError: () => { iv.micBlocked = true; b.hidden = true; $("ivRateStatus").textContent = "Voice input isn't available on this page, so type your answer instead."; stopMic(); },
      onEnd: () => {} });
    try { v.start(); iv.voiceT = v; b.setAttribute("aria-pressed", "true"); b.textContent = "Stop listening"; } catch { b.hidden = true; }
  };
}
function stopMic() {
  if (iv.voiceT) { const v = iv.voiceT; iv.voiceT = null; const t = v.stop(), ta = $("ivAnswer"); if (ta && t) { ta.value = t; updateCount(); } }
  const b = $("ivMic");
  if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "Speak instead"; }
  if (typeof takeStopIfRunning === "function") takeStopIfRunning();
}

/* --- Rating: built-in checks (always) and AI coaching (when available) --- */
function ivFeatures(ans, q) {
  const text = ans.trim();
  const count = re => (text.match(re) || []).length;
  const w = wordCount(text);
  const sents = text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  const qWords = [...contentWords(q.text)].filter(x => !/^(tell|time|describe|give|example|would|walk|about|think|what|which|demonstrat|abilit|abilities|effective|range)/.test(x));
  const aWords = contentWords(text);
  const rel = qWords.length ? qWords.filter(x => aWords.has(x)).length / qWords.length : 0.5;
  const j = jobContext();
  const jobHits = j ? [...new Set([...j.hard, ...j.soft].filter(s => skillSet(text).has(s)))].length : 0;
  return {
    w, sents, avgSent: w / Math.max(1, sents.length), rel, jobHits,
    fillers: count(/\b(um+|uh+|erm|basically|you know|kind of|sort of|i guess|literally|and stuff|stuff like that|things like that)\b/gi) + count(/\blike,/gi),
    hedges: count(/\b(i think maybe|i'm not sure|i guess|hopefully|i suppose|probably just)\b/gi),
    iCount: count(/\bI\b/g), weCount: count(/\bwe\b/gi),
    quant: numsOf(text).length + count(/\b(two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|fifty|hundreds?|thousands?|dozens?|half|doubled?|tripled?)\b/gi),
    sit: /\b(when i was|while (i was )?(working|studying)|at my (last|previous|current|old)|in my (role|job|time|last|previous|second|third|final|first)|during (my|a|the|an)|last (year|semester|summer|month)|a few (weeks|months|years) ago|one (day|time|shift|night)|at [A-Z][A-Za-z]+)\b/.test(text) || /\bin (20\d\d|my \w+ year)\b/i.test(text),
    task: /\b(i (needed|had|was asked|was tasked|was responsible|was supposed) to|my (job|task|role|goal|responsibility) was|the (goal|task|problem|challenge|issue|aim) was|we needed to|i had to|tasked with|deadline|was due)\b/i.test(text),
    actions: count(/\bI (\w+ed|built|led|ran|wrote|made|set up|took|spoke|met|called|created|organised|decided|asked|started|chose|used|worked|developed|designed|analysed|reviewed|trained|coached|negotiated|presented|proposed|tested|fixed|checked|sat down|went|told|explained|listened|found|broke|gave|kept|brought|sent|prioritised|scheduled|escalated|apologised|offered|researched|stayed|thought|realised|split|drew|taught|sold|spent|got)\b/g),
    result: /\b(as a result|which (led|meant|resulted|helped|saved|cut|reduced|improved)|result(ed)? in|the outcome|in the end|ended up|(we|i) (finished|delivered|won|hit|met|passed|got)|saved|reduced|increased|improved|cut|grew|achieved|on time|ahead of|under budget|feedback|thanked|praised|recogni[sz]ed|promoted|went on to|learn(ed|t)|since then|now i)\b/i.test(text),
    steps: count(/\b(first(ly)?|second(ly)?|then|next|after that|finally|third(ly)?|to start|i'?d start|step)\b/gi),
    comm: /\b(tell|told|let .{1,25} know|inform|talk(ed)? (to|with)|speak|spoke|escalat\w*|update|email|call|check in|ask(ed)?|raise|flag|explain)\b/i.test(text),
    priority: /\b(safety|safe|priorit\w*|urgent|impact|risks?|customers?|clients?|patients?|deadlines?|ethic\w*|polic(y|ies)|procedures?|compliance|wellbeing|quality)\b/i.test(text),
    would: count(/\bI('d| would| will| 'd)\b/gi),
    future: /\b(learn|grow|develop|future|long[- ]term|next step|career|goal|aspire|want to|hope to|looking to|keen to|build (my|on))\b/i.test(text),
    money: /\b(money|salary|pay|perks|benefits|close to (home|where i live)|commute|bonus)\b/i.test(text),
    them: /\b(your|you've|you're|you have)\s+(\w+\s+)?(projects?|clients?|values?|mission|team|work|program|graduate|products?|services?|approach|culture|reputation|growth|focus|commitment|customers?|stores?|sites?)\b/i.test(text) || (!!(j && j.company) && text.toLowerCase().includes(j.company.toLowerCase())),
    weakness: /\b(weakness|struggle|working on|improv\w*|used to|tend to|find it hard|not (great|good|strong|confident) at|challenge for me)\b/i.test(text),
    fixing: /\b(so i|now i|i've (started|been|learned|learnt|got)|to (fix|improve|work on) (this|that|it)|i use|i set|course|practis\w*|practic\w*|ask(ing)? for feedback|i make sure|getting better|i've improved)\b/i.test(text),
    fakeWeak: /\b(perfectionis\w*|work too hard|care too much|too dedicated)\b/i.test(text),
    questions: count(/\?/g),
    reasoning: count(/\b(assum\w*|roughly|around|estimate|population|per (day|person|week|year|household)|each|times|multipl\w*|divid\w*|so that's|which gives|that gives|so about|sanity|check|ballpark)\b/gi),
    calm: /\b(let me (think|work|break)|good question|i'?d (start|break)|break (it|this) down)\b/i.test(text),
    enjoy: /\b(enjoy|love|energi[sz]\w*|excit\w*|satisf\w*|fun|favourite|buzz|lose track of time|motivat\w*)\b/i.test(text),
    tech: [...skillSet(text)].filter(s => (SKILLS.find(k => k.name === s) || {}).kind === "hard").length
  };
}
// What a good answer to each common question is likely to mention
const TOPICS = [
  [/team/i, /\b(team|group|together|colleagues?|classmates?|collaborat\w*|we)\b/i, "working in a team"],
  [/conflict|disagree/i, /\b(conflict|disagree\w*|argu\w*|tension|frustrat\w*|different views?|clash\w*)\b/i, "a disagreement and how you handled it"],
  [/mistake|didn't go to plan/i, /\b(mistake|error|wrong|fault|missed|forgot|fix(ed)?|own(ed)? up|didn't go)\b/i, "something going wrong and what you did about it"],
  [/deadline|pressure|stress/i, /\b(deadline|due|urgent|hours?|days?|weeks?|pressure|rush\w*|late|stress\w*)\b/i, "working under time pressure"],
  [/problem|complex/i, /\b(problem|issue|challenge|fix\w*|solv\w*|solution|root cause|figured? out|broke|fail\w*)\b/i, "solving a problem"],
  [/leader/i, /\b(led|lead\w*|took charge|organis\w*|delegat\w*|coordinat\w*|motivat\w*)\b/i, "leading others"],
  [/initiative|improve/i, /\b(initiative|improv\w*|idea|noticed|suggest\w*|proactive\w*|introduc\w*|set up|streamlin\w*)\b/i, "taking the initiative"],
  [/customer|client/i, /\b(customers?|clients?|complain\w*|upset|angry|guests?|patients?)\b/i, "dealing with a customer or client"],
  [/learn/i, /\b(learn\w*|new|quickly|picked up|taught myself|course|tutorial|practis\w*)\b/i, "learning something quickly"],
  [/priorit|juggle/i, /\b(priorit\w*|juggl\w*|multiple|list|urgent|important|schedul\w*|calendar)\b/i, "juggling priorities"],
  [/feedback/i, /\b(feedback|critic\w*|told me|pointed out)\b/i, "taking feedback"],
  [/explain/i, /\b(explain\w*|simple|simpler|analog\w*|diagram|understand\w*)\b/i, "explaining something clearly"],
  [/detail/i, /\b(detail|check\w*|accura\w*|error|spotted|noticed|double)\b/i, "attention to detail"],
  [/persuad|your way/i, /\b(persuad\w*|convinc\w*|agreed|agree\w*|won (them|him|her) over|changed (their|his|her) mind|buy-in)\b/i, "persuading someone"],
  [/decision/i, /\b(decid\w*|decision|chose|information|risk|options?)\b/i, "making a decision"],
  [/safety|ethic/i, /\b(safety|unsafe|ethic\w*|report\w*|hazard|risk|policy|right thing)\b/i, "a safety or ethical issue"],
  [/beyond|expected/i, /\b(extra|beyond|voluntar\w*|stayed|weekend|offered|wasn't asked)\b/i, "going beyond what was expected"],
  [/different from yours|style/i, /\b(different|style|adapt\w*|preferred|approach)\b/i, "working with someone different from you"]
];
const sc = (x, lo, hi) => Math.max(1, Math.min(10, Math.round(1 + 9 * (x - lo) / (hi - lo))));
function ruleRate(q, ans) {
  const f = ivFeatures(ans, q), T = IV_TYPES[q.type];
  const [lo, hi] = T.ideal;
  let delivery = f.w < lo * 0.5 ? 2 : f.w < lo * 0.75 ? 4 : f.w < lo ? 7 : f.w <= hi ? 9 : f.w <= hi * 1.4 ? 7 : 4;
  delivery -= Math.min(3, Math.round(f.fillers * 100 / Math.max(f.w, 1) * 0.8)) + (f.avgSent > 34 ? 2 : 0) + (f.hedges > 1 ? 1 : 0);
  delivery = Math.max(1, delivery);
  const topic = TOPICS.find(([qre]) => qre.test(q.text));
  const onTopic = topic ? topic[1].test(ans) : false;
  // a structured story is probably on topic even in different words, unless it plainly misses the question's subject
  let relevance = Math.min(10, Math.max(sc(f.rel, 0, 0.55) + (onTopic ? 4 : 0), onTopic ? 7 : 1, !topic && f.w >= 60 && (f.sit || f.actions >= 2) ? 6 : 1) + (f.jobHits ? 1 : 0));
  const offTopic = topic && !onTopic && f.w >= 25;
  if (offTopic) relevance = Math.min(relevance, 4);
  const S = {};
  const notes = {};
  switch (q.type) {
    case "behavioural": case "competency":
      S.Structure = Math.min(10, 2 + (f.sit ? 2 : 0) + (f.task ? 2 : 0) + (f.actions >= 2 ? 2 : f.actions ? 1 : 0) + (f.result ? 2 : 0));
      S.Relevance = relevance;
      S.Evidence = Math.min(10, 3 + (f.iCount > f.weCount ? 2 : 0) + Math.min(3, f.quant) + (f.tech ? 1 : 0) + (f.actions >= 3 ? 1 : 0));
      S.Result = f.result ? (f.quant ? 9 : 7) : f.quant ? 5 : 2;
      break;
    case "situational":
      S.Approach = Math.min(10, 2 + Math.min(4, Math.round(f.steps * 1.5)) + (f.would >= 2 ? 2 : f.would ? 1 : 0) + (f.sents.length >= 3 ? 2 : 0));
      S.Judgement = Math.min(10, 3 + (f.priority ? 4 : 0) + (f.comm ? 1 : 0) + (f.sit ? 2 : 0));
      S.Communication = f.comm ? 8 : 3;
      S.Relevance = relevance;
      break;
    case "intro": {
      const present = /\b(i'?m|i am)\s+(a|an|currently|now|in my|completing|studying|working|in the)\b/i.test(ans);
      const past = /\b(previously|before that|i'?ve (worked|spent|been)|i worked|my experience|i spent|during my|at [A-Z]\w+|last year)\b/.test(ans);
      const end = f.sents.slice(-2).join(" ");
      const close = /\b(this role|this position|why i'?m|that'?s why|which is why|next step|keen to|looking for|excited|apply|applying|here)\b/i.test(end);
      S.Structure = Math.min(10, 1 + (present ? 3 : 0) + (past ? 3 : 0) + (close ? 3 : 0));
      S.Relevance = relevance;
      S.Highlights = Math.min(10, 2 + Math.min(4, f.quant * 2) + Math.min(2, f.tech) + (f.actions ? 2 : 0));
      S.Close = close ? 8 : f.future ? 5 : 3;
      break;
    }
    case "motivation":
      S["Specific to them"] = f.them ? 8 : 3;
      S.Fit = Math.min(10, 3 + (/\b(i bring|my experience|my skills|i'?ve (worked|done|built|led)|i can|background in)\b/i.test(ans) ? 3 : 0) + Math.min(2, f.tech) + (f.quant ? 2 : 0));
      S.Ambition = f.future ? 8 : 4;
      S.Authenticity = Math.max(1, (f.money ? 3 : 8) - (/\b(great|good|amazing|reputable|leading) (company|organisation|reputation|brand)\b/i.test(ans) && !f.them ? 2 : 0));
      break;
    case "strengths":
      S.Honesty = Math.max(1, (f.w >= 30 && f.iCount ? 8 : 5) - f.hedges);
      S.Example = f.sit || f.actions ? 8 : 3;
      S.Energy = f.enjoy ? 8 : 4;
      S.Relevance = relevance;
      break;
    case "self": {
      const strengthQ = /strength|proud|achievement/i.test(q.text);
      S.Honesty = f.fakeWeak ? 2 : strengthQ ? (f.w >= 40 ? 7 : 5) : f.weakness ? 8 : 4;
      S.Example = f.sit || f.actions ? 8 : 3;
      S.Growth = strengthQ ? (f.result ? (f.quant ? 9 : 7) : 4) : f.fixing ? 8 : 3;
      S.Relevance = relevance;
      if (f.fakeWeak) notes.Honesty = "“Perfectionist” and “I work too hard” read as dodging the question.";
      break;
    }
    case "technical":
      S.Approach = Math.min(10, 3 + Math.min(4, f.steps * 2) + (f.would ? 1 : 0) + (/\b(check|verify|test|validate|confirm|review)\w*/i.test(ans) ? 2 : 0));
      S.Depth = Math.min(10, 3 + Math.min(4, f.tech * 2) + Math.min(3, f.quant));
      S.Example = f.sit || f.actions >= 2 ? 8 : 3;
      S.Clarity = f.avgSent > 32 ? 4 : f.avgSent < 6 ? 5 : 8;
      break;
    case "curveball":
      S.Reasoning = Math.min(10, 2 + Math.min(5, f.reasoning) + Math.min(3, f.quant));
      S.Structure = Math.min(10, 3 + Math.min(4, f.steps * 2) + (f.calm ? 2 : 0) + (f.reasoning >= 3 ? 2 : 0) + (f.sents.length >= 3 ? 1 : 0));
      S.Composure = Math.max(1, (f.calm ? 9 : 6) - f.hedges * 2);
      S.Clarity = f.avgSent > 32 ? 4 : 8;
      break;
    case "closing": {
      const ask = /questions for us/i.test(q.text), pay = /salary/i.test(q.text), start = /start|notice/i.test(q.text);
      const rights = /working rights|right to work|visa/i.test(q.text), elsewhere = /interviewing anywhere|elsewhere/i.test(q.text);
      S.Preparation = rights ? (/\b(citizen|permanent resident|full (working )?rights|visa|yes)\b/i.test(ans) ? 8 : 4) : elsewhere ? (/\b(yes|no|a few|one other|early stages?|priority|most interested|keen)\b/i.test(ans) ? 8 : 4) : ask ? (f.questions >= 2 ? 9 : f.questions === 1 ? 6 : 2) : pay ? (/\$\s?\d|\d+\s?k\b|range|package|super/i.test(ans) ? 8 : 3) : start ? (/\b(week|weeks|immediately|notice|monday|from|available|date|\d)\b/i.test(ans) ? 8 : 4) : (f.w >= 30 ? 7 : 4);
      S.Relevance = ask ? (/\b(role|team|success|training|challenge|first (three|3|90)|day|culture|learn|next steps)\b/i.test(ans) ? 8 : 4) : relevance;
      S.Specific = f.them || /\b(you mentioned|you said|earlier)\b/i.test(ans) ? 8 : 4;
      S.Tone = ask && f.money ? 4 : 8;
      break;
    }
  }
  S.Delivery = delivery;
  if (offTopic) notes.Relevance = `This question is about ${topic[2]}. Make that the centre of your example.`;
  const crits = T.criteria;
  const scores = crits.map(c => ({ criterion: c, score: S[c] ?? 5, note: notes[c] || critNote(c, S[c] ?? 5, q.type, f) }));
  let overall = Math.round(scores.reduce((a, x) => a + x.score * (x.criterion === "Delivery" ? 0.6 : 1), 0) / scores.reduce((a, x) => a + (x.criterion === "Delivery" ? 0.6 : 1), 0));
  // very short answers can't score well, however good the words; "short" depends on the kind of question
  const cap = f.w < Math.max(12, lo * 0.35) ? 3 : f.w < lo * 0.65 ? 5 : (q.type === "behavioural" || q.type === "competency") && !f.result ? 7 : 10;
  overall = Math.max(1, Math.min(cap, overall));
  return { overall, cap, scores, f, strengths: strengthsFor(scores, q.type, f), improvements: improvementsFor(scores, q.type, f), stronger: strongerOutline(q, ans, f), follow_up: (IV_FOLLOWUPS[q.type] || [])[Math.floor(Math.random() * (IV_FOLLOWUPS[q.type] || [""]).length)] || "" };
}
function critNote(c, s, type, f) {
  const good = s >= 7;
  const N = {
    Structure: good ? "Easy to follow." : type === "intro" ? "Try present, past, then future." : type === "curveball" ? "Lay it out: assumptions, then the calculation, then a sanity check." : "Missing parts of STAR: " + [!f.sit && "situation", !f.task && "task", f.actions < 2 && "your actions", !f.result && "result"].filter(Boolean).join(", ") + ".",
    Relevance: good ? "Answers the question asked." : "Drifts from the question. Tie it back to what they asked.",
    Evidence: good ? "Specific, with your own actions." : f.weCount > f.iCount ? "Lots of “we”. Say what you did." : "Add specifics: names, numbers, tools.",
    Result: good ? "Clear outcome." : "End with what changed, ideally with a number.",
    Delivery: f.w < 60 ? "Too short to show much." : good ? "A good length to say out loud." : f.fillers > 2 ? "Cut the filler words." : "Aim for the suggested length.",
    Approach: good ? "Clear steps." : "Lay out your steps: first, then, finally.",
    Judgement: good ? "Shows sound priorities." : "Say what matters most: safety, the customer, the deadline.",
    Communication: good ? "You'd keep the right people informed." : "Say who you'd tell and when.",
    Highlights: good ? "Memorable highlights." : "Add one achievement with a number.",
    Close: good ? "Ends on why this role." : "Finish with why this job is your next step.",
    "Specific to them": good ? "Shows you've researched them." : "Name something specific about them.",
    Fit: good ? "Links your background to the role." : "Connect your experience to what they need.",
    Ambition: good ? "Shows where you want to grow." : "Say what you want to learn or grow into.",
    Authenticity: good ? "Sounds genuine." : "Lead with the work, not pay or perks.",
    Honesty: good ? "Candid and believable." : "Be more direct about it.",
    Example: good ? "Backed by a real example." : "Add one short, real example.",
    Energy: good ? "Your enthusiasm comes through." : "Say why it energises you.",
    Growth: good ? "Shows what you're doing about it." : "Say what you're doing to improve, and how it's going.",
    Depth: good ? "Shows real knowledge." : "Use the technical terms and numbers you'd use at work.",
    Clarity: good ? "Clear and concise." : "Shorter sentences will be easier to follow.",
    Reasoning: good ? "Assumptions and numbers are clear." : "State assumptions and work through the numbers.",
    Composure: good ? "Calm and confident." : "Slow down and think aloud.",
    Preparation: good ? "Well prepared." : "Prepare two or three questions or a clear answer.",
    Specific: good ? "Specific to this employer." : "Refer to something they said or do.",
    Tone: good ? "Professional tone." : "Hold salary and leave questions for later rounds."
  };
  return N[c] || "";
}
function strengthsFor(scores, type, f) {
  const out = scores.filter(s => s.score >= 7).sort((a, b) => b.score - a.score).slice(0, 3).map(s => `${s.criterion}: ${critNote(s.criterion, s.score, type, f)}`);
  if (!out.length && f.w >= 30) out.push("You gave a full answer to work from. That's the hardest part.");
  return out;
}
function improvementsFor(scores, type, f) {
  const tips = [];
  // specific notes (an off-topic story, a fake weakness) come first
  const low = scores.filter(s => s.score <= 6).sort((a, b) => (b.note && b.note !== critNote(b.criterion, b.score, type, f)) - (a.note && a.note !== critNote(a.criterion, a.score, type, f)) || a.score - b.score);
  for (const s of low.slice(0, 3)) {
    if (s.criterion === "Structure" && (type === "behavioural" || type === "competency")) tips.push(`Use STAR. You're missing ${[!f.sit && "the situation (one sentence: where and when)", !f.task && "the task (what you had to achieve)", f.actions < 2 && "your actions (what you did, using “I”)", !f.result && "the result (what changed)"].filter(Boolean).join(", ") || "a clear order"}.`);
    else if (s.criterion === "Result") tips.push("Finish with the result: what changed because of you? A number (time saved, customers served, marks) or feedback makes it memorable.");
    else if (s.criterion === "Evidence") tips.push(f.weCount > f.iCount ? `You said “we” ${f.weCount} times and “I” ${f.iCount}. Interviewers score your actions, so say what you did.` : "Add concrete details: the tool, the number of people, the amount, the timeframe.");
    else if (s.criterion === "Delivery") tips.push(f.w < (IV_TYPES[type].ideal[0]) ? `At ${f.w} words (about ${Math.round(f.w / 2.2)} seconds) it's short. Aim for ${IV_TYPES[type].ideal[0]} to ${IV_TYPES[type].ideal[1]} words.` : f.w > IV_TYPES[type].ideal[1] ? `At ${f.w} words it'll run long. Trim the background and keep the actions and result.` : f.fillers > 2 ? `Cut the filler words (${f.fillers} found).` : "Use shorter sentences so it's easy to follow.");
    else tips.push(s.note || critNote(s.criterion, s.score, type, f));
  }
  return [...new Set(tips)];
}
function strongerOutline(q, ans, f) {
  const sents = f.sents;
  const pickS = (re, used) => sents.find(s => re.test(s) && !used.has(s));
  const used = new Set();
  const line = (label, s, prompt) => { if (s) used.add(s); return `${label}: ${s || `[${prompt}]`}`; };
  switch (q.type) {
    case "behavioural": case "competency": {
      // the result is usually near the end, the situation at the start, and the actions in between
      const RES = /\b(as a result|in the end|ended up|which (led|meant|saved|cut|helped)|result(ed)? in|saved|reduced|increased|improved|feedback|thanked|learn(ed|t)|on time|went into|was (approved|adopted|used))\b/i;
      let ri = -1;
      for (let k = sents.length - 1; k >= 1; k--) if (RES.test(sents[k])) { ri = k; break; }
      const si = sents.length > 1 || ri !== 0 ? 0 : -1;
      let ti = sents.findIndex((x, k) => k !== si && k !== ri && /\b(needed to|had to|asked to|my (job|task|role|goal)|goal was|problem was|deadline|was to)\b/i.test(x));
      if (ti < 0 && si === 0 && /\b(needed to|had to|asked to|goal|deadline)\b/i.test(sents[0] || "")) ti = -2;
      const acts = sents.filter((x, k) => k !== si && k !== ti && k !== ri && (ri < 0 || k < ri));
      return [`Situation: ${si >= 0 ? sents[si] : "[one sentence: where you were and when]"}`,
        `Task: ${ti >= 0 ? sents[ti] : ti === -2 ? "(in your first sentence; you could make it a sentence of its own)" : "[what you needed to achieve]"}`,
        `Action: ${acts.length ? acts.join(" ") : "[what you did, step by step, using “I”]"}`,
        `Result: ${ri >= 0 ? sents[ri] : "[what changed because of you; add a number or feedback]"}`].join("\n");
    }
    case "situational": return [line("Clarify", pickS(/\b(check|ask|find out|understand|clarify|confirm)/i, used), "what you'd check or find out first"), line("Prioritise", pickS(/\b(safety|priorit|urgent|customer|deadline|risk|policy)/i, used), "what matters most here, and why"), line("Act", pickS(/\b(I'd|I would|I will)\b/i, used), "two or three concrete steps"), line("Communicate", pickS(/\b(tell|let .* know|inform|update|escalate|talk|speak|email)/i, used), "who you'd tell and when"), line("Follow up", pickS(/\b(follow up|afterwards|next time|prevent|make sure|in future)/i, used), "how you'd stop it happening again"), "Bonus: [a real time you faced something similar]"].join("\n");
    case "intro": return [line("Present", pickS(/\b(i'?m|i am)\b/i, used), "who you are now, in one line"), line("Past", pickS(/\b(previously|worked|spent|experience|at [A-Z]|during|internship|project)/, used), "two experiences that led here, with one result"), line("Future", pickS(/\b(this role|next|looking|keen|excited|apply|why)/i, used), "why this role is your next step")].join("\n");
    case "motivation": return [line("Them", pickS(/\b(your|you're|you've)\b/i, used), "something specific about the organisation: a project, client or value"), line("You", pickS(/\b(I bring|my experience|my skills|I've|I have|background)/i, used), "what you bring that fits, with evidence"), line("Future", pickS(/\b(learn|grow|develop|future|career|goal|want)/i, used), "what you want to learn or grow into there")].join("\n");
    case "self": return [line("Name it", sents[0], "say it plainly"), line("Example", pickS(/\b(when|time|once|last|at [A-Z])/, used), "one real example"), line(/strength|proud|achievement/i.test(q.text) ? "Impact" : "What you're doing about it", pickS(/\b(now|so I|I've|started|use|practis|course|feedback|result|learn)/i, used), /strength|proud|achievement/i.test(q.text) ? "what it led to, with a number if you can" : "what you're doing to improve, and how it's going")].join("\n");
    case "strengths": return [line("Answer", sents[0], "say what you genuinely enjoy or do well"), line("Example", pickS(/\b(when|time|once|last|at [A-Z]|recently)/, used), "one short, real example"), line("Why it matters", pickS(/\b(enjoy|love|energ|satisf|because)/i, used), "why it energises you, and how it helps at work")].join("\n");
    case "technical": return [line("Approach", pickS(/\b(first|start|approach|would|I'd)/i, used) || sents[0], "how you'd approach it, step by step"), line("Example", pickS(/\b(when|at [A-Z]|project|internship|uni|I used|I built)/, used), "a real time you've done this"), line("Check", pickS(/\b(check|test|verify|validate|review)/i, used), "how you'd check the result")].join("\n");
    case "curveball": return [line("Assumptions", pickS(/\b(assum|roughly|about|around|population)/i, used), "the numbers you're assuming, rounded"), line("Break it down", pickS(/\b(per|each|times|divid|multipl|then)/i, used), "the parts you'd multiply or add"), line("Answer", pickS(/\d/, used), "your estimate"), line("Sanity-check", pickS(/\b(check|seems|reasonable|sense)/i, used), "does it sound about right? why?")].join("\n");
    case "closing": return /questions for us/i.test(q.text) ? `Ask two or three, such as:\n${QUESTIONS_TO_ASK.slice(0, 3).map(x => "• " + x).join("\n")}` : /salary/i.test(q.text) ? "Give a researched range for the role and location, mention the total package including super, and show some flexibility: [your range]." : [line("Answer", sents[0], "a clear, direct answer"), "Then: [one line on why you're keen]"].join("\n");
  }
  return "";
}
const IV_RULES = `You are an experienced Australian interview coach. Rate a candidate's practice answer to one interview question and coach them to improve.
Be candid but encouraging. Base every comment on what they actually wrote. Never invent experiences, employers, numbers or results for them.
Score each criterion from 1 to 10, where 5 is acceptable, 7 is good and 9 or 10 is outstanding and rare. A very short or off-topic answer scores low.
"stronger_answer" is a better version of THEIR answer, using only facts they gave, organised with the framework. Where a detail is missing, write a short prompt in square brackets, like [add the result: what changed?]. Keep it under 170 words.
"strengths" and "improvements" are 1 to 3 short, specific points each. "follow_up" is one question an interviewer would likely ask next.
Australian English. No markdown. Reply with only JSON.`;
function ivPrompt(q, ans) {
  const T = IV_TYPES[q.type], j = q.job ? jobContext() : null;
  return `<question type="${T.label}">${q.text}</question>
<framework>${T.framework}</framework>
<criteria>${T.criteria.join(", ")}</criteria>
${j ? `<job>${j.title || "the role"}${j.company ? ` at ${j.company}` : ""}. Key skills: ${j.hard.slice(0, 6).join(", ")}</job>\n` : ""}<answer words="${wordCount(ans)}">
${ans.slice(0, 4000)}
</answer>
Reply in this JSON shape: {"overall": 6, "scores": [${T.criteria.map(c => `{"criterion": "${c}", "score": 6, "note": "one short sentence"}`).join(", ")}], "strengths": ["..."], "improvements": ["..."], "stronger_answer": "...", "follow_up": "..."}`;
}
const ivSchema = T => ({ type: "object", properties: { overall: { type: "integer" }, scores: { type: "array", items: { type: "object", properties: { criterion: { type: "string", enum: T.criteria }, score: { type: "integer" }, note: { type: "string" } }, required: ["criterion", "score", "note"] } }, strengths: { type: "array", items: { type: "string" } }, improvements: { type: "array", items: { type: "string" } }, stronger_answer: { type: "string" }, follow_up: { type: "string" } }, required: ["overall", "scores", "strengths", "improvements", "stronger_answer", "follow_up"] });
// Keep the AI's coaching, but hold its scores to what the answer can support
function mergeAI(ai, rule, T) {
  if (!ai || typeof ai !== "object" || !Array.isArray(ai.scores)) return null;
  const clamp = n => Math.max(1, Math.min(10, Math.round(+n || 0)));
  const scores = T.criteria.map(c => {
    const a = ai.scores.find(s => s && s.criterion === c), r = rule.scores.find(s => s.criterion === c);
    return a && +a.score ? { criterion: c, score: Math.min(clamp(a.score), rule.cap + 1), note: String(a.note || r.note).slice(0, 180) } : r;
  });
  const avg = Math.round(scores.reduce((x, s) => x + s.score, 0) / scores.length);
  const overall = Math.min(rule.cap, clamp(+ai.overall || avg));
  const strs = (a, n) => (Array.isArray(a) ? a : []).map(s => stripMarkup(String(s)).trim()).filter(Boolean).slice(0, n);
  return { overall, cap: rule.cap, scores, f: rule.f, strengths: strs(ai.strengths, 3).length ? strs(ai.strengths, 3) : rule.strengths, improvements: strs(ai.improvements, 3).length ? strs(ai.improvements, 3) : rule.improvements, stronger: stripMarkup(String(ai.stronger_answer || "")).trim() || rule.stronger, follow_up: stripMarkup(String(ai.follow_up || "")).trim() || rule.follow_up };
}
// The rating itself (built-in checks always; AI coaching on top when it's available and allowed). Used in the room and in the summary.
async function computeRating(q, ans, tk, progress) {
  const T = IV_TYPES[q.type], rule = ruleRate(q, ans);
  let res = null, via = "Rated with built-in checks for structure, evidence and length (no AI on this page).";
  if (iv.noAI) via = "Rated with the built-in checks only (no AI), as you chose: structure, evidence and length.";
  const say = progress || (() => {});
  const chrome = iv.noAI ? null : await withChromeAI(say, async make => {
    say(`Rating with ${SMALL()}…`);
    // three short steps in one conversation (see 25a): scores, then coaching points from them, then a stronger answer using those
    return mergeAI(await ivRateInSteps(make, q, ans, T, say), rule, T);
  });
  if (chrome) { res = chrome; via = `Rated by ${SMALL()}, held to the built-in checks.`; }
  const big = iv.noAI ? null : afterSmall();
  if (!res && big) {
    say("Rating with " + BIG_NAME() + ". This takes about 20 seconds…");
    try { res = mergeAI(await big.json(IV_RULES + "\n\n" + ivPrompt(q, ans), { cache: false }), rule, T); if (res) via = "Rated by " + BIG_NAME() + ", held to the built-in checks."; } catch { /* use the built-in checks */ }
  }
  if (!res) res = rule;
  if (tk) res = { ...res, delivery: deliveryChecks(tk, [T.ideal[0] / 2.2, T.ideal[1] / 2.2]), take: takeMetrics(tk) };
  return { res, via };
}
// Every rated answer is kept for Your progress
function commitAttempt(q, ans, res) {
  iv.attempts.push({ q: q.text, type: q.type, job: !!q.job, score: res.overall, words: wordCount(ans), date: new Date().toISOString(), answer: ans.slice(0, 1500), how: iv.how, jobKey: typeof ivJobKey === "function" ? ivJobKey() : "", ...(res.take ? { secs: res.take.secs, wpm: res.take.wpm, fillers: res.take.fillers, pause: res.take.longest } : {}) });
  iv.attempts = iv.attempts.slice(-60);
  saveIv();
}
async function rateAnswer() {
  const q = iv.q, ans = $("ivAnswer").value.trim(), st = $("ivRateStatus"), btn = $("ivRate");
  if (wordCount(ans) < 3) { st.textContent = "Give your answer first. Even a rough one gets useful feedback."; $("ivAnswer").focus(); return; }
  stopTimer(); stopMic();
  const it = sessItem(), tk = (it && it.take) || takeResult(q);
  if (btn) btn.disabled = true;
  let out;
  try { out = await computeRating(q, ans, tk, m => { st.textContent = m; }); } finally { if (btn) btn.disabled = false; }
  const { res, via } = out;
  st.textContent = "";
  const prev = iv.last && iv.last.q === q.text ? iv.last.overall : null;
  iv.last = { q: q.text, overall: res.overall };
  commitAttempt(q, ans, res);
  if (it) { it.answer = ans; it.rating = res; it.via = via; }
  if (btn) btn.hidden = true;
  renderFeedback(res, via, prev);
}
function renderFeedback(r, via, prev, box = $("ivFeedback"), inline = false) {
  const verdict = r.overall >= 9 ? "Outstanding" : r.overall >= 7 ? "Strong answer" : r.overall >= 5 ? "Solid, with room to improve" : r.overall >= 3 ? "A start. Build it out" : "Too thin to judge yet";
  const ring = r.overall >= 7 ? "var(--good)" : r.overall >= 5 ? "var(--accent)" : "var(--warn)";
  const delta = prev != null ? (r.overall > prev ? `<span class="iv-delta up">Up from ${prev} last try</span>` : r.overall < prev ? `<span class="iv-delta down">Down from ${prev} last try</span>` : `<span class="iv-delta">Same as last try (${prev})</span>`) : "";
  const better = esc(r.stronger).replace(/\[([^\]]{2,140})\]/g, "<mark>[$1]</mark>").replace(/^([A-Z][A-Za-z' ]{2,28}):/gm, "<b>$1:</b>");
  const q = inline ? null : iv.q, T = q ? IV_TYPES[q.type] : null;
  const last = ivIsLast();
  box.innerHTML = `<div class="iv-fb${inline ? " inline" : ""}">
    <div class="iv-score"><div class="iv-ring" style="--v:${r.overall * 10};--ring:${ring}"><div><b>${r.overall}</b><span>out of 10</span></div></div><div><p class="iv-verdict">${verdict}</p>${delta}<p class="iv-via">${esc(via)} A practice guide, not how a real panel will mark you.</p></div></div>
    <div class="iv-paper"><div class="iv-paper-head"><span>Interview scorecard</span>${T ? `<small>${esc(T.label)}</small>` : ""}</div>
      <div class="iv-crit">${r.scores.map(s => `<div class="iv-crit-row"><span>${esc(s.criterion)}</span><div class="bar"><i style="width:${s.score * 10}%;background:${s.score >= 7 ? "var(--good)" : s.score >= 5 ? "var(--accent)" : "var(--warn)"}"></i></div><span class="val">${s.score}</span>${s.note ? `<span class="note">${esc(s.note)}</span>` : ""}</div>`).join("")}</div></div>
    ${r.delivery ? deliveryHtml(r.delivery) : ""}
    <div class="iv-lists"><div><h3>What worked</h3><ul>${(r.strengths.length ? r.strengths : ["Keep going: the next try will give more to work with."]).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h3>To make it stronger</h3><ul>${(r.improvements.length ? r.improvements : ["Try it out loud with a timer."]).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
    ${r.stronger ? `<div class="iv-betterwrap"><h3>A stronger answer would look like</h3><div class="iv-better">${better}</div></div>` : ""}
    ${!inline && r.follow_up && !iv.mock ? `<div class="iv-follow"><span><b>Likely follow-up:</b> “${esc(r.follow_up)}”</span><button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-iv="follow">Answer it</button></div>` : ""}
    ${inline ? "" : `<div class="iv-actions"><button class="ig-btn ig-btn--ghost" type="button" data-iv="again">Try this question again</button><button class="ig-btn ig-btn--primary" type="button" data-iv="next-q">${last ? "See my summary" : "Next question"}</button>${last ? "" : '<button class="ig-linkbtn" type="button" data-iv="summary-now">Finish and see my summary</button>'}</div>`}
  </div>`;
  if (inline) return;
  iv.followText = r.follow_up;
  ivStepTo(2);
  box.querySelector(".iv-fb").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
}
// "How you sounded": worked out from your voice recording on this device, with no AI
function deliveryHtml(d) {
  if (!d.rows.length) return "";
  return `<div class="iv-deliv"><h3>How you sounded <span class="iv-badge plain">Checked on this device, no AI</span></h3>
    <dl class="iv-dl">${d.rows.map(x => `<div class="${x.status}"><dt>${esc(x.label)}</dt><dd><b>${esc(x.value)}</b><span>${esc(x.note)}</span></dd></div>`).join("")}</dl>
    ${d.tips.length ? `<ul class="iv-dl-tips">${d.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="small">Nothing to fix in how you delivered it. Keep that up.</p>`}</div>`;
}
// The end of a practice: how you did overall, and each answer with its recording and rating
function renderSessionSummary() {
  const s = iv.sess; if (!s) { closeRoom(); return; }
  stopTimer(); stopMic(); endPractice();   // the camera and microphone are off from here
  iv.onSummary = true; iv.mock = null;
  $("ivExitAsk").hidden = true; $("ivRoomProg").textContent = "Summary";
  const all = s.items.map((x, k) => ({ ...x, k })), answered = all.filter(x => wordCount(x.answer || "") >= 3), rated = answered.filter(x => x.rating);
  const avg = rated.length ? ivRound(rated.reduce((a, x) => a + x.rating.overall, 0) / rated.length) : null;
  const byScore = rated.slice().sort((a, b) => b.rating.overall - a.rating.overall), best = byScore[0], worst = rated.length > 1 ? byScore[byScore.length - 1] : null;
  const spoken = answered.filter(x => x.take && x.take.secs);
  const mets = spoken.map(x => takeMetrics(x.take)), secs = mets.reduce((a, m) => a + m.secs, 0), paces = mets.filter(m => m.wpm).map(m => m.wpm), fillers = mets.reduce((a, m) => a + m.fillers, 0);
  const pace = paces.length ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : 0;
  const tips = [], add = t => { if (t && !tips.includes(t) && tips.length < 5) tips.push(t); };
  rated.forEach(x => add((x.rating.improvements || [])[0]));
  spoken.forEach(x => (deliveryChecks(x.take, [60, 150]).tips || []).slice(0, 1).forEach(add));
  const head = !answered.length ? "No answers <mark>this time.</mark>" : avg == null ? "Practice done. <mark>Rate your answers to see how you did.</mark>" : avg >= 7 ? "A strong round. <mark>Well done.</mark>" : avg >= 5 ? "A solid round. <mark>Here's what to polish.</mark>" : "A useful first round. <mark>Here's where to focus.</mark>";
  const mode = s.kind === "screen" ? "Phone screening" : s.kind === "mock" ? "Mock interview" : "Practice";
  const unrated = answered.filter(x => !x.rating);
  s.items.forEach(x => { if (x.blob && !x.url) x.url = URL.createObjectURL(x.blob); });
  $("ivStage").innerHTML = `<section class="iv-room iv-summary" aria-labelledby="ivSumTitle"><p class="ig-phase">${mode} · finished</p><h2 class="iv-sum-h" id="ivSumTitle" tabindex="-1">${head}</h2>
    <div class="ig-facts2"><div><h3>${answered.length}</h3><p>question${answered.length === 1 ? "" : "s"} answered</p></div>${avg != null ? `<div><h3>${avg}</h3><p>average score out of 10 (${rated.length} rated)</p></div>` : `<div><h3>–</h3><p>not rated yet</p></div>`}${best ? `<div><h3>${best.rating.overall}</h3><p>your best answer</p></div>` : ""}${secs ? `<div><h3>${fmtSecs(secs)}</h3><p>spent speaking${pace ? `, about ${pace} words a minute` : ""}</p></div>` : ""}${spoken.length ? `<div><h3>${fillers}</h3><p>filler words picked up</p></div>` : ""}</div>
    ${unrated.length ? `<div class="iv-next"><div><h3>${unrated.length} answer${unrated.length === 1 ? "" : "s"} not rated yet</h3><p>Rate them now to get a score and tips for each one.</p></div><div class="iv-next-btns"><button class="ig-btn ig-btn--primary" type="button" data-iv="rate-all">Rate ${unrated.length === 1 ? "it" : "them all"}</button></div></div><p class="status-line" id="ivSumStatus" role="status"></p>` : ""}
    ${tips.length ? `<div class="iv-focus"><h3>Where to focus next</h3><ul>${tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
    <div class="iv-sitems"><h3>Your answers</h3>${all.map(x => {
      const ans = wordCount(x.answer || "") >= 3, sc = x.rating ? x.rating.overall : null;
      const m = x.take ? takeMetrics(x.take) : null;
      return `<details class="iv-sitem${ans ? "" : " skipped"}"${x.k === (s.openK != null ? s.openK : 0) ? " open" : ""}><summary><span class="iv-sc ${sc != null ? scoreCls(sc) : ""}">${sc != null ? sc : "–"}</span><span class="iv-sq"><b>${esc(x.q.text)}</b><span class="muted">${esc((IV_TYPES[x.q.type] || {}).label || "")}${!ans ? " · skipped" : sc == null ? " · not rated" : ""}${m && m.secs ? ` · ${fmtSecs(m.secs)}${m.wpm ? `, ${m.wpm} wpm` : ""}` : ""}</span></span></summary>
        <div class="iv-sbody">${ans ? `<h4>Your answer</h4><blockquote class="iv-yours">${esc(x.answer)}</blockquote>` : `<p class="muted">You moved on from this one without answering.</p>`}
        ${x.url ? (x.blob && /video/.test(x.blob.type) ? `<video controls playsinline src="${x.url}"></video>` : `<audio controls src="${x.url}"></audio>`) : ""}
        ${m && x.take ? deliveryHtml(deliveryChecks(x.take, [(IV_TYPES[x.q.type] || IV_TYPES.behavioural).ideal[0] / 2.2, (IV_TYPES[x.q.type] || IV_TYPES.behavioural).ideal[1] / 2.2])) : ""}
        <div class="iv-sfb" data-k="${x.k}"></div>
        <div class="iv-actions">${ans && !x.rating ? `<button class="ig-btn ig-btn--primary ig-btn--small" type="button" data-iv="rate-item" data-k="${x.k}">Rate this answer</button>` : ""}<button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-iv="redo-item" data-k="${x.k}">Practise this question again</button></div></div></details>`;
    }).join("")}</div>
    <div class="iv-actions iv-sum-actions"><button class="ig-btn ig-btn--primary" type="button" data-iv="restart">Practise again</button>${worst ? `<button class="ig-btn ig-btn--ghost" type="button" data-iv="retry-worst" data-k="${worst.k}">Practise my weakest answer</button>` : ""}<button class="ig-btn ig-btn--ghost" type="button" data-iv="to-progress">See Your progress</button><button class="ig-linkbtn" type="button" data-iv="exit-now">Back to setup</button></div></section>`;
  rated.forEach(x => { const b = $("ivStage").querySelector(`.iv-sfb[data-k="${x.k}"]`); if (b) renderFeedback(x.rating, x.via || "", null, b, true); });
  $("ivRoomDlg").scrollTop = 0;
  $("ivSumTitle").focus({ preventScroll: true });
}
async function rateSessionItem(k, status) {
  const s = iv.sess, it = s && s.items[k]; if (!it || it.rating || wordCount(it.answer || "") < 3) return;
  const { res, via } = await computeRating(it.q, it.answer.trim(), it.take, m => { if (status) status.textContent = m; });
  commitAttempt(it.q, it.answer, res);
  it.rating = res; it.via = via;
}

/* --- Progress --- */
const ivAvg = l => l.length ? l.reduce((s, x) => s + x.score, 0) / l.length : 0;
const ivRound = n => Math.round(n * 10) / 10;
const scoreCls = s => s >= 7 ? "good" : s >= 5 ? "mid" : "low";
// Spoken practice: how your delivery is changing
function voiceStatsHtml(a) {
  const v = a.filter(x => x.how && x.how !== "type" && x.secs);
  if (!v.length) return "";
  const avg = k => { const l = v.filter(x => x[k]); return l.length ? Math.round(l.reduce((s, x) => s + x[k], 0) / l.length) : 0; };
  const last = v.slice(-5), prev = v.slice(-10, -5);
  const mean = (l, k) => { const z = l.filter(x => x[k] != null); return z.length ? z.reduce((s, x) => s + (x[k] || 0), 0) / z.length : null; };
  const trend = (k) => { const m1 = mean(last, k), m0 = mean(prev, k); if (m1 == null || m0 == null || !prev.length) return ""; const d = m1 - m0; return Math.abs(d) < 0.5 ? "steady lately" : d < 0 ? "improving lately" : "creeping up lately"; };
  const pace = avg("wpm"), fil = ivRound(v.reduce((s, x) => s + (x.fillers || 0), 0) / v.length), pause = ivRound(v.reduce((s, x) => s + (x.pause || 0), 0) / v.length);
  return `<section class="iv-stepsec"><p class="ig-phase">How you sound</p><h2>Your spoken answers</h2><p class="iv-lead">Worked out from your recordings, on this device.</p>
    <div class="ig-facts2"><div><h3>${v.length}</h3><p>spoken answers</p></div>${pace ? `<div><h3>${pace}</h3><p>words a minute on average. About 120 to 160 is easy to follow.</p></div>` : ""}<div><h3>${fil}</h3><p>filler words per answer ${trend("fillers") ? `(${trend("fillers")})` : ""}</p></div><div><h3>${pause} s</h3><p>longest pause on average ${trend("pause") ? `(${trend("pause")})` : ""}</p></div></div></section>`;
}
// Each job you've practised for
function byJobHtml(a) {
  const g = {};
  for (const x of a) if (x.jobKey) (g[x.jobKey] = g[x.jobKey] || []).push(x.score);
  const rows = Object.entries(g).sort((p, q) => q[1].length - p[1].length).slice(0, 5);
  if (!rows.length) return "";
  return `<section class="iv-stepsec"><p class="ig-phase">By job</p><h2>The jobs you've practised for</h2><ol class="iv-list">${rows.map(([k, s]) => `<li><span class="iv-sc ${scoreCls(ivAvg(s.map(x => ({ score: x }))))}">${ivRound(s.reduce((x, y) => x + y, 0) / s.length)}</span><span><b>${esc(ivJobKeyLabel(k))}</b><span class="muted">${s.length} answer${s.length === 1 ? "" : "s"} practised</span></span></li>`).join("")}</ol></section>`;
}
function renderHistory() {
  const a = iv.attempts, box = $("ivHistoryPanel");
  const where = iv.where === "account" ? accountWords().replace(/^saved /, "") : iv.where === "browser" ? "in this browser" : "for this visit only";
  const hero = (h1, lede, actions, fig) => `<header class="ig-hero iv-hero"><div><p class="ig-eyebrow">Your progress · saved ${esc(where)}</p><h2 class="ig-h1">${h1}</h2><p class="ig-lede">${lede}</p><div class="ig-actions">${actions}</div></div>${fig}</header>`;
  const fig = (list, pen, sample) => `<figure class="ig-score iv-progfig${sample ? " is-sample" : ""}" aria-hidden="true"><div class="ig-score__sheet"><div class="ig-score__head"><span class="ig-score__title">Your scores</span><span class="ig-score__meta">${sample ? "an example" : `last ${list.length}`}</span></div><div class="iv-pbars">${list.map(s => `<i class="${scoreCls(s)}" style="height:${s * 10}%"></i>`).join("")}</div><p class="ig-pen">${esc(pen)}</p></div></figure>`;
  const go = `<button type="button" class="ig-btn ig-btn--primary" data-iv-go="practice">Practise now</button><button type="button" class="ig-btn ig-btn--ghost" data-iv-go="prepare">Get ready for a job</button>`;
  if (!a.length) {
    box.innerHTML = hero(`Your first score <mark>starts here.</mark>`, "Practise an answer and it's scored on the spot. Every answer you practise is kept here, so you can see what's improving and what needs another go.", go, fig([4, 5, 5, 6, 7, 7, 8], "your first score goes here ✓", true))
      + `<div class="iv-flow"><section class="iv-stepsec"><p class="ig-phase">How it works</p><h2>Three steps to your first score</h2><ol class="ig-quick"><li><span><strong>Pick the job (optional).</strong> In Get ready, choose a saved job or type one in, and the questions follow it.</span></li><li><span><strong>Practise out loud or typed.</strong> Phone, video or one-way, with the question read aloud.</span></li><li><span><strong>Read your scorecard, then try again.</strong> Small fixes add up quickly.</span></li></ol></section></div>`;
    return;
  }
  const last10 = a.slice(-10), avg = ivRound(ivAvg(last10));
  const byType = {};
  for (const x of a) (byType[x.type] = byType[x.type] || []).push(x.score);
  const typeAvg = Object.entries(byType).map(([t, s]) => [t, s.reduce((p, c) => p + c, 0) / s.length, s.length]).filter(x => IV_TYPES[x[0]]).sort((x, y) => x[1] - y[1]);
  const weakest = typeAvg.length > 1 ? typeAvg[0] : null, strongest = typeAvg.length > 1 ? typeAvg[typeAvg.length - 1] : null;
  const l5 = a.slice(-5), p5 = a.slice(-10, -5), diff = p5.length ? ivAvg(l5) - ivAvg(p5) : 0;
  const week = a.filter(x => Date.now() - new Date(x.date).getTime() < 7 * 864e5).length;
  const best = Math.max(...a.map(x => x.score));
  const h1 = a.length < 3 ? `A good start. <mark>Keep practising.</mark>` : !p5.length ? `You're building a <mark>practice habit.</mark>` : diff >= 0.5 ? `Your answers are <mark>getting stronger.</mark>` : diff <= -0.5 ? `Every try <mark>teaches something.</mark>` : `Steady practice <mark>builds confidence.</mark>`;
  const lede = `You've practised ${a.length} answer${a.length === 1 ? "" : "s"}${typeAvg.length > 1 ? ` across ${typeAvg.length} kinds of question` : ""}. Your average over the last ${last10.length} is ${avg} out of 10${p5.length ? (diff >= 0.5 ? `, up ${ivRound(diff)} on the five before` : diff <= -0.5 ? `, down ${ivRound(-diff)} on the five before` : ", about the same as before") : ""}.`;
  const lowIdx = a.length - 1 - a.slice().reverse().slice(0, 30).reduce((m, x, i, arr) => x.score < arr[m].score ? i : m, 0);
  const next = weakest
    ? `<div class="iv-next"><div><h3>Practise ${esc(IV_TYPES[weakest[0]].label.toLowerCase())} next</h3><p>It's your lowest kind so far (${ivRound(weakest[1])} out of 10 over ${weakest[2]} answer${weakest[2] === 1 ? "" : "s"}). A few more tries here will lift your overall score the most.</p></div><div class="iv-next-btns"><button class="ig-btn ig-btn--primary" type="button" data-iv-type="${weakest[0]}">Practise ${esc(IV_TYPES[weakest[0]].short.toLowerCase())}</button>${a[lowIdx] ? `<button class="ig-btn ig-btn--ghost" type="button" data-iv-redo="${lowIdx}">Redo my lowest answer</button>` : ""}</div></div>`
    : `<div class="iv-next"><div><h3>Try a different kind of question</h3><p>You've only practised ${typeAvg[0] ? esc(IV_TYPES[typeAvg[0][0]].label.toLowerCase()) : "one kind"} so far. Interviews mix several, so a mock interview is a good next step.</p></div><div class="iv-next-btns"><button class="ig-btn ig-btn--primary" type="button" data-iv-mock>Do a mock interview</button></div></div>`;
  box.innerHTML = hero(h1, lede, go, fig(a.slice(-14).map(x => x.score), diff >= 0.5 ? `up ${ivRound(diff)} ✓` : a.length < 5 ? "keep going ✓" : `average ${avg} ✓`, false))
    + `<div class="iv-flow">
      <section class="iv-stepsec"><p class="ig-phase">At a glance</p><h2>Where you are</h2><div class="ig-facts2"><div><h3>${a.length}</h3><p>answers practised</p></div><div><h3>${avg}</h3><p>average of your last ${last10.length}</p></div><div><h3>${best}</h3><p>your best score</p></div><div><h3>${week}</h3><p>answer${week === 1 ? "" : "s"} in the last 7 days</p></div></div></section>
      <section class="iv-stepsec"><p class="ig-phase">Next step</p><h2>What to practise next</h2>${next}</section>
      ${typeAvg.length ? `<section class="iv-stepsec"><p class="ig-phase">By kind of question</p><h2>Strongest and weakest</h2><div class="iv-bars">${typeAvg.slice().reverse().map(([t, av, n]) => `<div class="iv-barrow"><span>${esc(IV_TYPES[t].short)}</span><div class="iv-bartrack"><i class="${scoreCls(av)}" style="width:${Math.round(av * 10)}%"></i></div><b>${ivRound(av)}</b><em>${n} answer${n === 1 ? "" : "s"}</em></div>`).join("")}</div>${strongest ? `<p class="iv-lead">Your strongest is ${esc(IV_TYPES[strongest[0]].label.toLowerCase())}, and ${esc(IV_TYPES[weakest[0]].label.toLowerCase())} needs the most work.</p>` : ""}</section>` : ""}
      ${voiceStatsHtml(a)}${byJobHtml(a)}
      <section class="iv-stepsec"><p class="ig-phase">History</p><h2>Your recent answers</h2><ol class="iv-list">${a.slice(-15).reverse().map((x, i) => `<li><span class="iv-sc ${scoreCls(x.score)}">${x.score}</span><span><b>${esc(x.q)}</b><span class="muted">${esc(IV_TYPES[x.type] ? IV_TYPES[x.type].label : x.type)} · ${new Date(x.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · ${x.words} words${x.how && x.how !== "type" ? ` · ${esc((IV_HOWS.find(h => h.key === x.how) || {}).short || x.how)}${x.wpm ? `, ${x.wpm} wpm` : ""}` : ""}</span></span><button class="ig-linkbtn" type="button" data-iv-redo="${a.length - 1 - i}">Practise again</button></li>`).join("")}</ol>
      <p class="iv-clear"><button class="ig-linkbtn" type="button" id="ivClear">Clear my history</button></p></section>
    </div>`;
  $("ivClear").onclick = () => { const b = $("ivClear"); if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Clear all practice history? Click again"; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Clear my history"; } }, 4000); return; } iv.attempts = []; saveIv(); renderHistory(); };
}

/* --- Tabs and wiring --- */
function setIvTab(tab, focus) {
  iv.tab = tab; lsSet(IV_TAB_KEY, tab);
  const map = { formats: "ivFormats", prepare: "ivPrepare", practice: "ivPractice", history: "ivHistory" };
  if (tab !== "practice" && typeof endPractice === "function") endPractice();   // the camera and microphone go off when you leave practice
  document.querySelectorAll("#view-interview [role=tablist] [data-ivtab]").forEach(b => { const on = b.dataset.ivtab === tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  for (const [k, id] of Object.entries(map)) $(id).hidden = k !== tab;
  if (tab === "history") ivReady.then(renderHistory);
  if (tab === "practice") { renderSetup(); trk.ready.then(renderJobPanels); }
  if (tab === "prepare") ivPrep.ready.then(renderPrepare);
}
function openFormat() { setIvTab("formats"); const g = $("ivFormats"); if (g) g.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
onInit(() => {
  document.querySelectorAll('[data-ivtab][role="tab"]').forEach(b => b.addEventListener("click", () => setIvTab(b.dataset.ivtab)));
  // links inside the page that go to another tab ("Get ready")
  $("view-interview").addEventListener("click", e => { const l = e.target.closest("[data-ivtab]"); if (l && l.getAttribute("role") !== "tab") { e.preventDefault(); setIvTab(l.dataset.ivtab); } });
  $("ivHows").addEventListener("click", e => { const b = e.target.closest("[data-how]"); if (!b || b.disabled) return; iv.how = b.dataset.how; iv.howFromJob = false; if (iv.how === "type") endPractice(); renderSetup(); });
  $("ivHideQ").addEventListener("change", e => { iv.hideText = e.target.checked; });
  $("ivNoAI").addEventListener("change", e => { iv.noAI = e.target.checked; describeIvEngine(); });
  $("view-interview").querySelector('[role="tablist"]').addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const tabs = ["formats", "prepare", "practice", "history"], i = tabs.indexOf(iv.tab);
    const n = e.key === "Home" ? 0 : e.key === "End" ? 3 : (i + (e.key === "ArrowRight" ? 1 : -1) + 4) % 4;
    e.preventDefault(); setIvTab(tabs[n], true);
  });
  $("ivModes").addEventListener("click", e => { const b = e.target.closest("[data-mode]"); if (!b) return; iv.mode = b.dataset.mode; iv.modeChosen = true; renderSetup(); });
  $("ivTypes").addEventListener("click", e => {
    const b = e.target.closest("[data-type]"); if (!b) return;
    const k = b.dataset.type;
    if (iv.types.has(k)) iv.types.delete(k); else iv.types.add(k);
    if (!iv.types.size) iv.types.add("essential");
    renderSetup();
  });
  $("ivStart").addEventListener("click", startPractice);
  // everything in the interview room: finishing, rating, moving on, the summary, leaving
  $("ivRoomDlg").addEventListener("click", async e => {
    const b = e.target.closest("[data-iv]"); if (!b) return;
    const a = b.dataset.iv;
    if (a === "exit") askExit();
    else if (a === "exit-cancel") $("ivExitAsk").hidden = true;
    else if (a === "exit-summary") renderSessionSummary();
    else if (a === "exit-now") closeRoom();
    else if (a === "to-progress") closeRoom("progress");
    else if (a === "rate") rateAnswer();
    else if (a === "edit") { hideChoice(); $("ivAnswer").focus(); }
    else if (a === "again") { hideChoice(); showQuestion(iv.q, { keepLast: true }); }
    else if (a === "next-q") ivNext();
    else if (a === "summary-now") renderSessionSummary();
    else if (a === "follow") showQuestion({ id: "f" + Date.now(), type: iv.q.type, text: iv.followText, followUp: true, job: iv.q.job });
    else if (a === "pre-go") { stopPrecheck(); iv.prechecked = true; showQuestion(iv.sess.first, iv.sess.firstOpts || {}); }
    else if (a === "pre-back") closeRoom();
    else if (a === "restart") { iv.sess = null; iv.prechecked = false; iv.mode === "mock" || iv.mode === "screen" ? startPractice() : startPractice(); }
    else if (a === "sheet") { closeRoom("quiet"); setIvTab("prepare"); }
    else if (a === "redo-item" || a === "retry-worst") { const it = iv.sess && iv.sess.items[+b.dataset.k]; if (it) { iv.mode = "single"; iv.mock = null; iv.sess = null; showQuestion(it.q); } }
    else if (a === "rate-item") { b.disabled = true; const st = $("ivSumStatus"); iv.sess.openK = +b.dataset.k; await rateSessionItem(+b.dataset.k, st); renderSessionSummary(); }
    else if (a === "rate-all") {
      b.disabled = true; const st = $("ivSumStatus"), todo = iv.sess.items.map((x, k) => k).filter(k => { const x = iv.sess.items[k]; return !x.rating && wordCount(x.answer || "") >= 3; });
      for (let n = 0; n < todo.length; n++) { if (st) st.textContent = `Rating answer ${n + 1} of ${todo.length}…`; await rateSessionItem(todo[n], st); }
      renderSessionSummary();
    }
  });
  // Esc asks before leaving, rather than throwing the practice away
  $("ivRoomDlg").addEventListener("cancel", e => { e.preventDefault(); if (!$("ivExitAsk").hidden) $("ivExitAsk").hidden = true; else askExit(); });
  $("ivJob").addEventListener("click", e => { const b = e.target.closest("[data-usejob]"); if (!b) return; iv.useJob = b.dataset.usejob === "1"; renderSetup(); });
  document.querySelectorAll("[data-iv-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const t = $(a.getAttribute("href").slice(1)); if (t) t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }));
  $("ivHistoryPanel").addEventListener("click", e => {
    const g = e.target.closest("[data-iv-go]"), t = e.target.closest("[data-iv-type]"), mk = e.target.closest("[data-iv-mock]");
    if (g) { setIvTab(g.dataset.ivGo); return; }
    if (t) { iv.mode = "single"; iv.modeChosen = true; iv.types = new Set([t.dataset.ivType]); setIvTab("practice"); return; }
    if (mk) { iv.mode = "mock"; iv.modeChosen = true; setIvTab("practice"); return; }
    const b = e.target.closest("[data-iv-redo]"); if (!b) return;
    const x = iv.attempts[+b.dataset.ivRedo]; if (!x) return;
    iv.mode = "single"; iv.mock = null; setIvTab("practice");
    showQuestion(IV_QUESTIONS.find(q => q.text === x.q) || { id: "h" + Date.now(), type: x.type, text: x.q, job: x.job });
  });
  viewHooks.interview = () => { setIvTab(iv.tab); describeIvEngine(); };
});

