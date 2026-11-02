/* ===================== Interview prep ===================== */
const IV_KEY = "jobfinder.interview.v1", IV_TAB_KEY = "jobfinder.ivtab.v1";
const IV_MODES = [
  { key: "single", label: "One question at a time" },
  { key: "screen", label: "Phone screening (6 quick questions)" },
  { key: "mock", label: "Mock interview (5 questions)" },
  { key: "video", label: "Timed, like a video interview" }
];
const iv = { tab: lsGet(IV_TAB_KEY) || "formats", mode: "single", types: new Set(["essential"]), useJob: true, asked: new Set(), q: null, mock: null, attempts: [], where: "loading", doc: null, timer: null, last: null, rec: null };

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

/* --- Formats --- */
function renderFormats() {
  $("ivFormatList").innerHTML = IV_FORMATS.map(f => `<details class="iv-fmt" data-fmt="${f.key}"><summary><span class="iv-fmt-name">${esc(f.name)}</span><span class="iv-fmt-where">${esc(f.where)}</span><span class="iv-sounds">${f.sounds.map(s => `“${esc(s)}”`).join(" ")}</span></summary>
    <div class="iv-fmt-body">
      <p>${esc(f.why)}</p>
      <div><div class="iv-k">How to answer</div><ol class="iv-steps">${f.how.map(([h, t]) => `<li><span><b>${esc(h)}</b>${esc(t)}</span></li>`).join("")}</ol></div>
      <p><span class="iv-k">Length</span><br>${esc(f.time)}</p>
      <div><div class="iv-k">Watch out for</div><ul class="iv-watch">${f.watch.map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>
      <div class="b-actions"><button class="btn primary" type="button" data-practise="${f.practise.join(",")}" data-video="${f.key === "video" ? 1 : 0}">Practise ${f.key === "video" ? "with a timer" : "these questions"}</button></div>
    </div></details>`).join("");
}

/* --- Questions for the job you scanned (or the one you're aiming for) --- */
const aOrAn = w => /^[aeiou]/i.test(w) ? "an" : "a";
function jobContext() {
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

/* --- Practice settings --- */
function renderSetup() {
  $("ivModes").innerHTML = IV_MODES.map(m => `<button type="button" class="opt-chip" role="radio" data-mode="${m.key}" aria-checked="${iv.mode === m.key}" aria-pressed="${iv.mode === m.key}">${esc(m.label)}</button>`).join("");
  const typeChips = [["essential", "Most common"], ...Object.entries(IV_TYPES).map(([k, v]) => [k, v.label])];
  $("ivTypes").innerHTML = typeChips.map(([k, l]) => `<button type="button" class="opt-chip" data-type="${k}" aria-pressed="${iv.types.has(k)}">${esc(l)}</button>`).join("");
  $("ivTypeBox").hidden = iv.mode === "mock" || iv.mode === "screen";
  $("ivScreenSheet").hidden = iv.mode !== "screen";
  if (iv.mode === "screen") renderScreenSheet($("ivScreenSheet"), true);
  const j = jobContext();
  $("ivJob").innerHTML = j
    ? `<label class="q-check"><input type="checkbox" id="ivUseJob"${iv.useJob ? " checked" : ""}> Include questions written for ${esc(j.title ? `${aOrAn(j.title)} ${j.title}` : "this job")}${j.company ? ` at ${esc(j.company)}` : ""} ${j.from === "scan" ? "(from the job ad you scanned)" : "(from the resume builder)"}</label>`
    : `Scan a job ad in <a href="#scanner">Tailor to a job</a> to get questions written for that role.`;
  const u = $("ivUseJob");
  if (u) u.onchange = () => { iv.useJob = u.checked; };
  $("ivStart").textContent = iv.mode === "mock" ? "Start the mock interview" : iv.mode === "screen" ? "Start the screening call" : iv.q ? "Ask me another question" : "Ask me a question";
}
async function describeIvEngine() {
  const st = await chromeAIState();
  $("ivEngine").textContent = smallEngine() ? `Answers are rated by ${SMALL()}, ${smallWhere()}, in short steps.`
    : st === "available" ? "Answers are rated by Chrome's built-in AI, on this device."
    : (st === "downloadable" || st === "downloading") ? "Answers are rated by Chrome's built-in AI if it's ready, otherwise by " + (sample ? AI_NAME() : "the built-in checks") + "."
    : sample ? "Answers are rated by " + AI_LONG() + "."
    : "No AI on this page, so answers are rated with built-in checks for structure, evidence and length.";
}

/* --- Asking --- */
function startPractice() {
  stopTimer(); stopMic();
  if (iv.mode === "mock" || iv.mode === "screen") {
    iv.mock = { list: iv.mode === "screen" ? screenSet() : mockSet(), i: 0, results: [], kind: iv.mode };
    showQuestion(iv.mock.list[0]);
  } else {
    iv.mock = null;
    const q = pickQuestion(questionPool());
    if (!q) { $("ivStage").innerHTML = `<p class="empty">Pick at least one kind of question above.</p>`; return; }
    showQuestion(q);
  }
  renderSetup();
}
function showQuestion(q, opts = {}) {
  iv.q = q; iv.last = opts.keepLast ? iv.last : null;
  const T = IV_TYPES[q.type];
  const fmt = IV_FORMATS.find(f => f.key === q.type) || IV_FORMATS.find(f => f.practise.includes(q.type));
  const isAsk = /questions for us/i.test(q.text);
  const progress = iv.mock ? `<span class="iv-badge plain">Question ${iv.mock.i + 1} of ${iv.mock.list.length}</span>` : "";
  $("ivStage").innerHTML = `<section class="panel iv-q" aria-labelledby="ivQText">
    <div class="iv-q-top"><span class="iv-badge">${esc(T.label)}</span>${q.job ? '<span class="iv-badge job">For this job</span>' : ""}${q.followUp ? '<span class="iv-badge plain">Follow-up</span>' : ""}${progress}<span class="iv-timer" id="ivTimer" hidden></span></div>
    <h2 class="iv-qtext" id="ivQText" tabindex="-1">${esc(q.text)}</h2>
    <details class="iv-hint"><summary>How to approach this</summary><div><p>${esc(T.framework)}</p>${isAsk ? `<p>Questions that work well:</p><ul>${QUESTIONS_TO_ASK.slice(0, 4).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p class="muted">Aim for about ${Math.round(T.ideal[0] / 2.2 / 10) * 10 || 30} to ${Math.round(T.ideal[1] / 2.2 / 10) * 10} seconds when spoken.${fmt ? ` <button class="linkish" type="button" data-showfmt="${fmt.key}">More on ${esc(fmt.name.toLowerCase())}</button>` : ""}</p></div></details>
    <label class="field" for="ivAnswer">Your answer. Type it the way you'd say it out loud.</label>
    <textarea id="ivAnswer" rows="8" spellcheck="true" placeholder="${esc(q.type === "behavioural" || q.type === "competency" ? "Start with the situation: “In my second year at uni, I…”" : q.type === "intro" ? "Start with who you are now: “I'm a final-year…”" : "Start answering here")}"></textarea>
    <div class="iv-meta"><span id="ivCount">0 words</span><button class="btn ghost iv-mic" id="ivMic" type="button" aria-pressed="false" hidden>Speak instead</button></div>
    <div class="b-actions"><button class="btn primary" id="ivRate" type="button">Rate my answer</button>${iv.mock ? "" : '<button class="btn" id="ivSkip" type="button">Different question</button>'}<span class="status-line" id="ivRateStatus" role="status"></span></div>
    <div id="ivFeedback" aria-live="polite"></div>
  </section>`;
  const ta = $("ivAnswer");
  ta.addEventListener("input", updateCount);
  $("ivRate").onclick = rateAnswer;
  if ($("ivSkip")) $("ivSkip").onclick = () => { stopTimer(); stopMic(); const n = pickQuestion(questionPool().filter(x => x.text !== q.text)); if (n) showQuestion(n); };
  setupMic();
  $("ivStage").querySelector("[data-showfmt]") && ($("ivStage").querySelector("[data-showfmt]").onclick = e => openFormat(e.target.dataset.showfmt));
  $("ivQText").focus({ preventScroll: true });
  $("ivStage").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  if (iv.mode === "video") startTimer();
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
// Speaking your answer (only where the browser allows speech recognition)
function setupMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const b = $("ivMic");
  if (!SR || !b || iv.micBlocked) return;
  b.hidden = false;
  b.onclick = () => {
    if (iv.rec) { stopMic(); return; }
    let rec;
    try { rec = new SR(); } catch { b.hidden = true; return; }
    rec.lang = "en-AU"; rec.continuous = true; rec.interimResults = true;
    const ta = $("ivAnswer"), base = ta.value.trim() ? ta.value.trim() + " " : "";
    rec.onresult = e => { let txt = ""; for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript; ta.value = base + txt.trim(); updateCount(); };
    rec.onerror = e => { if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) { iv.micBlocked = true; b.hidden = true; $("ivRateStatus").textContent = "Voice input isn't available on this page, so type your answer instead."; } stopMic(); };
    rec.onend = () => { if (iv.rec === rec) stopMic(); };
    try { rec.start(); iv.rec = rec; b.setAttribute("aria-pressed", "true"); b.textContent = "Stop listening"; } catch { b.hidden = true; }
  };
}
function stopMic() {
  if (iv.rec) { try { iv.rec.stop(); } catch { /* already stopped */ } }
  iv.rec = null;
  const b = $("ivMic");
  if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "Speak instead"; }
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
async function rateAnswer() {
  const q = iv.q, ans = $("ivAnswer").value.trim(), st = $("ivRateStatus"), btn = $("ivRate");
  if (wordCount(ans) < 3) { st.textContent = "Write your answer first. Even a rough one gets useful feedback."; $("ivAnswer").focus(); return; }
  stopTimer(); stopMic();
  const T = IV_TYPES[q.type];
  const rule = ruleRate(q, ans);
  btn.disabled = true;
  const progress = m => { st.textContent = m; };
  let res = null, via = "Rated with built-in checks for structure, evidence and length (no AI on this page).";
  try {
    const chrome = await withChromeAI(progress, async make => {
      progress(`Rating with ${SMALL()}…`);
      // three short steps in one conversation (see 25a): scores, then coaching points from them, then a stronger answer using those
      return mergeAI(await ivRateInSteps(make, q, ans, T, progress), rule, T);
    });
    if (chrome) { res = chrome; via = `Rated by ${SMALL()}, held to the built-in checks.`; }
    const big = afterSmall();
    if (!res && big) {
      progress("Rating with " + BIG_NAME() + ". This takes about 20 seconds…");
      try { res = mergeAI(await big.json(IV_RULES + "\n\n" + ivPrompt(q, ans), { cache: false }), rule, T); if (res) via = "Rated by " + BIG_NAME() + ", held to the built-in checks."; } catch { /* use the built-in checks */ }
    }
  } finally { btn.disabled = false; }
  if (!res) res = rule;
  st.textContent = "";
  const prev = iv.last && iv.last.q === q.text ? iv.last.overall : null;
  iv.last = { q: q.text, overall: res.overall };
  iv.attempts.push({ q: q.text, type: q.type, job: !!q.job, score: res.overall, words: wordCount(ans), date: new Date().toISOString(), answer: ans.slice(0, 1500) });
  iv.attempts = iv.attempts.slice(-60);
  saveIv();
  if (iv.mock) iv.mock.results[iv.mock.i] = { q, score: res.overall, top: res.improvements[0] || "" };
  renderFeedback(res, via, prev);
}
function renderFeedback(r, via, prev) {
  const verdict = r.overall >= 9 ? "Outstanding" : r.overall >= 7 ? "Strong answer" : r.overall >= 5 ? "Solid, with room to improve" : r.overall >= 3 ? "A start. Build it out" : "Too thin to judge yet";
  const ring = r.overall >= 7 ? "var(--good)" : r.overall >= 5 ? "var(--accent)" : "var(--warn)";
  const delta = prev != null ? (r.overall > prev ? `<span class="iv-delta up">Up from ${prev} last try</span>` : r.overall < prev ? `<span class="iv-delta down">Down from ${prev} last try</span>` : `<span class="iv-delta">Same as last try (${prev})</span>`) : "";
  const better = esc(r.stronger).replace(/\[([^\]]{2,140})\]/g, "<mark>[$1]</mark>").replace(/^([A-Z][A-Za-z' ]{2,28}):/gm, "<b>$1:</b>");
  const mockNext = iv.mock ? (iv.mock.i < iv.mock.list.length - 1 ? `<button class="btn primary" type="button" data-iv="mock-next">Next question (${iv.mock.i + 2} of ${iv.mock.list.length})</button>` : `<button class="btn primary" type="button" data-iv="mock-done">See your results</button>`) : `<button class="btn primary" type="button" data-iv="next">Next question</button>`;
  $("ivFeedback").innerHTML = `<div class="iv-fb">
    <div class="iv-score"><div class="iv-ring" style="--v:${r.overall * 10};--ring:${ring}"><div><b>${r.overall}</b><span>out of 10</span></div></div><div><p class="iv-verdict">${verdict}</p>${delta}<p class="small muted">${esc(via)} A practice guide, not how a real panel will mark you.</p></div></div>
    <div class="iv-crit">${r.scores.map(s => `<div class="iv-crit-row"><span>${esc(s.criterion)}</span><div class="bar"><i style="width:${s.score * 10}%;background:${s.score >= 7 ? "var(--good)" : s.score >= 5 ? "var(--accent)" : "var(--warn)"}"></i></div><span class="val">${s.score}</span>${s.note ? `<span class="note">${esc(s.note)}</span>` : ""}</div>`).join("")}</div>
    <div class="iv-lists"><div><h3>What worked</h3><ul>${(r.strengths.length ? r.strengths : ["Keep going: the next try will give more to work with."]).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h3>To make it stronger</h3><ul>${(r.improvements.length ? r.improvements : ["Try it out loud with a timer."]).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
    ${r.stronger ? `<div><h3>A stronger answer would look like</h3><div class="iv-better">${better}</div></div>` : ""}
    ${r.follow_up && !iv.mock ? `<div class="iv-follow"><span><b>Likely follow-up:</b> “${esc(r.follow_up)}”</span><button class="btn" type="button" data-iv="follow">Answer it</button></div>` : ""}
    <div class="b-actions"><button class="btn" type="button" data-iv="again">Try this question again</button>${mockNext}</div>
  </div>`;
  iv.followText = r.follow_up;
  $("ivFeedback").querySelector(".iv-fb").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
}
function renderMockSummary() {
  const m = iv.mock, done = m.results.filter(Boolean);
  const avg = done.length ? Math.round(done.reduce((a, x) => a + x.score, 0) / done.length * 10) / 10 : 0;
  const best = done.slice().sort((a, b) => b.score - a.score)[0], worst = done.slice().sort((a, b) => a.score - b.score)[0];
  iv.lastMockKind = m.kind;
  $("ivStage").innerHTML = `<section class="panel iv-q iv-summary" aria-labelledby="ivSumTitle"><h2 id="ivSumTitle" tabindex="-1">${m.kind === "screen" ? "Phone screening results" : "Mock interview results"}</h2>${m.kind === "screen" ? `<p class="small">Recruiters use screening calls to check the basics fast. Keep <button class="linkish" type="button" data-iv="sheet">your screening answers</button> in front of you on the real call.</p>` : ""}
    <div class="iv-stats"><div class="iv-stat"><b>${avg}</b><span>average out of 10</span></div><div class="iv-stat"><b>${done.length}/${m.list.length}</b><span>questions answered</span></div></div>
    <ol class="iv-sum-list">${m.list.map((q, i) => { const r = m.results[i]; return `<li><span class="sc">${r ? r.score : "–"}</span><span><b>${esc(q.text)}</b>${r && r.top ? `<br><span class="muted">${esc(r.top)}</span>` : ""}</span></li>`; }).join("")}</ol>
    ${best && worst && best !== worst ? `<p class="small">Your strongest answer was “${esc(best.q.text)}”. Practise “${esc(worst.q.text)}” again next.</p>` : ""}
    <div class="b-actions"><button class="btn primary" type="button" data-iv="mock-again">Do another mock interview</button>${worst ? `<button class="btn" type="button" data-iv="retry-worst">Practise my weakest answer</button>` : ""}</div></section>`;
  iv.mockWorst = worst ? worst.q : null;
  iv.mock = null;
  $("ivSumTitle").focus();
}

/* --- Progress --- */
function renderHistory() {
  const a = iv.attempts, box = $("ivHistoryPanel");
  if (!a.length) { box.innerHTML = `<div class="panel-head"><h2>Your progress</h2></div><p class="empty">No practice yet. Your scores will appear here, saved ${iv.where === "account" ? accountWords().replace(/^saved /, "") : iv.where === "browser" ? "in this browser" : "for this visit only"}.</p>`; return; }
  const last10 = a.slice(-10), avg = Math.round(last10.reduce((x, y) => x + y.score, 0) / last10.length * 10) / 10;
  const byType = {};
  for (const x of a) (byType[x.type] = byType[x.type] || []).push(x.score);
  const typeAvg = Object.entries(byType).map(([t, s]) => [t, s.reduce((p, c) => p + c, 0) / s.length, s.length]).sort((x, y) => y[1] - x[1]);
  const strongest = typeAvg[0], weakest = typeAvg.length > 1 ? typeAvg[typeAvg.length - 1] : null;
  box.innerHTML = `<div class="panel-head"><h2>Your progress</h2><p>Saved ${iv.where === "account" ? accountWords().replace(/^saved /, "") : iv.where === "browser" ? "in this browser" : "for this visit only"}.</p></div>
    <div class="iv-stats"><div class="iv-stat"><b>${a.length}</b><span>answers practised</span></div><div class="iv-stat"><b>${avg}</b><span>average of your last ${last10.length}</span></div>${strongest ? `<div class="iv-stat"><b>${esc(IV_TYPES[strongest[0]].short)}</b><span>your strongest kind (${strongest[1].toFixed(1)})</span></div>` : ""}${weakest ? `<div class="iv-stat"><b>${esc(IV_TYPES[weakest[0]].short)}</b><span>worth more practice (${weakest[1].toFixed(1)})</span></div>` : ""}</div>
    <div><h3>Last ${Math.min(30, a.length)} scores</h3><div class="iv-trend" role="img" aria-label="Scores over time: ${a.slice(-30).map(x => x.score).join(", ")}">${a.slice(-30).map(x => `<i style="height:${x.score * 10}%" title="${x.score}/10"></i>`).join("")}</div></div>
    <ol class="iv-sum-list">${a.slice(-15).reverse().map((x, i) => `<li><span class="sc">${x.score}</span><span><b>${esc(x.q)}</b><br><span class="muted">${esc(IV_TYPES[x.type] ? IV_TYPES[x.type].label : x.type)} · ${new Date(x.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · ${x.words} words</span> <button class="linkish" type="button" data-iv-redo="${a.length - 1 - i}">Practise again</button></span></li>`).join("")}</ol>
    <div class="b-actions"><button class="btn ghost" type="button" id="ivClear">Clear my history</button></div>`;
  $("ivClear").onclick = () => { const b = $("ivClear"); if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Clear all practice history?"; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Clear my history"; } }, 4000); return; } iv.attempts = []; saveIv(); renderHistory(); };
}

/* --- Tabs and wiring --- */
function setIvTab(tab, focus) {
  iv.tab = tab; lsSet(IV_TAB_KEY, tab);
  const map = { formats: "ivFormats", prepare: "ivPrepare", practice: "ivPractice", history: "ivHistory" };
  document.querySelectorAll("[data-ivtab]").forEach(b => { const on = b.dataset.ivtab === tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  for (const [k, id] of Object.entries(map)) $(id).hidden = k !== tab;
  if (tab === "history") ivReady.then(renderHistory);
  if (tab === "practice") renderSetup();
  if (tab === "prepare") ivPrep.ready.then(renderPrepare);
}
function openFormat(key) {
  setIvTab("formats");
  const d = document.querySelector(`#ivFormatList [data-fmt="${key}"]`);
  if (d) { d.open = true; d.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); d.querySelector("summary").focus({ preventScroll: true }); }
}
onInit(() => {
  renderFormats();
  document.querySelectorAll("[data-ivtab]").forEach(b => b.addEventListener("click", () => setIvTab(b.dataset.ivtab)));
  $("view-interview").querySelector('[role="tablist"]').addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const tabs = ["formats", "prepare", "practice", "history"], i = tabs.indexOf(iv.tab);
    const n = e.key === "Home" ? 0 : e.key === "End" ? 3 : (i + (e.key === "ArrowRight" ? 1 : -1) + 4) % 4;
    e.preventDefault(); setIvTab(tabs[n], true);
  });
  $("ivFormatList").addEventListener("click", e => {
    const b = e.target.closest("[data-practise]"); if (!b) return;
    iv.types = new Set(b.dataset.practise.split(","));
    iv.mode = b.dataset.video === "1" ? "video" : "single";
    setIvTab("practice");
    startPractice();
  });
  $("ivModes").addEventListener("click", e => { const b = e.target.closest("[data-mode]"); if (!b) return; iv.mode = b.dataset.mode; renderSetup(); });
  $("ivTypes").addEventListener("click", e => {
    const b = e.target.closest("[data-type]"); if (!b) return;
    const k = b.dataset.type;
    if (iv.types.has(k)) iv.types.delete(k); else iv.types.add(k);
    if (!iv.types.size) iv.types.add("essential");
    renderSetup();
  });
  $("ivStart").addEventListener("click", startPractice);
  $("ivStage").addEventListener("click", e => {
    const b = e.target.closest("[data-iv]"); if (!b) return;
    const a = b.dataset.iv;
    if (a === "again") { const q = iv.q; showQuestion(q, { keepLast: true }); }
    else if (a === "next") startPractice();
    else if (a === "follow") showQuestion({ id: "f" + Date.now(), type: iv.q.type, text: iv.followText, followUp: true, job: iv.q.job });
    else if (a === "mock-next") { iv.mock.i++; showQuestion(iv.mock.list[iv.mock.i]); }
    else if (a === "mock-done") renderMockSummary();
    else if (a === "mock-again") { iv.mode = iv.lastMockKind || "mock"; startPractice(); }
    else if (a === "sheet") setIvTab("prepare");
    else if (a === "retry-worst" && iv.mockWorst) { iv.mode = "single"; renderSetup(); showQuestion(iv.mockWorst); }
  });
  $("ivHistoryPanel").addEventListener("click", e => {
    const b = e.target.closest("[data-iv-redo]"); if (!b) return;
    const x = iv.attempts[+b.dataset.ivRedo]; if (!x) return;
    iv.mode = "single"; iv.mock = null; setIvTab("practice");
    showQuestion(IV_QUESTIONS.find(q => q.text === x.q) || { id: "h" + Date.now(), type: x.type, text: x.q, job: x.job });
  });
  viewHooks.interview = () => { setIvTab(iv.tab); describeIvEngine(); };
});

