/* ===================== Aptitude tests: the library, a test room of its own, and your results ===================== */
// Pick a test, pick test mode (timed, answers at the end) or learn mode (untimed, an explanation after every question), then play it
// on a page with nothing else on it. Questions come from the generators in 31 and 31a.
const aptType = k => APT_TYPES.find(t => t.key === k);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const aptUi = { area: null, key: "numerical", mode: "test", length: "full", level: "medium", areaSet: false };
const apt = { run: null, timer: null, flash: null, ask: "exit" };
const aSvg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
Object.assign(IV_ICON, {
  numerical: aSvg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  verbal: aSvg('<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>'),
  logical: aSvg('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3M12 4v6M12 14v6"/>'),
  abstract: aSvg('<circle cx="7" cy="7" r="3.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><path d="M7 14l3.5 6h-7z"/><path d="M14 17h6M17 14v6"/>'),
  spatial: aSvg('<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'),
  mechanical: aSvg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  errorcheck: aSvg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.5-4.5M8 10.5l2 2 3-3.5"/>'),
  memory: aSvg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  sjt: aSvg('<path d="M4 5h11v8H9l-5 4z"/><path d="M17 9h3v9l-4-3h-5v-2"/>'),
  speed: aSvg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M12 2.5v3"/>'),
  test: aSvg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M12 2.5v3"/>'),
  learn: aSvg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>')
});
const APT_MODES = [
  { key: "test", label: "Test mode", desc: "Timed like the real thing. You see your answers and explanations at the end.", meta: "Timed" },
  { key: "learn", label: "Learn mode", desc: "No clock. You see the explanation after every question, so you pick up the tricks as you go.", meta: "Untimed, with explanations" }
];
const aptCount = T => aptUi.length === "short" ? Math.max(4, Math.ceil(T.n / 2)) : T.n;
const aptTimeFactor = () => LV_TIME[aptUi.level] || 1;   // Easy has a little longer, Hard a little less
const aptSecs = T => aptUi.mode === "learn" || !T.secs ? 0 : Math.round(T.secs * aptCount(T) / T.n * aptTimeFactor());
function aptDefaultArea() {
  try {
    const j = typeof ivPrep !== "undefined" && ivPrep.data && ivPrep.data.job;
    const k = (j && j.title && typeof titleKind === "function" && titleKind(j.title)) || P().target.jobType;
    return APT_AREA_OF_JOB[OLD_JOB_TYPES[k] || k] || null;
  } catch { return null; }
}

/* --- The page --- */
function renderApt() {
  if (!aptUi.areaSet) { aptUi.area = aptDefaultArea(); aptUi.areaSet = true; }
  const S = aptStore.data.sessions, area = APT_AREAS.find(a => a.key === aptUi.area);
  $("aptAreas").innerHTML = `<span class="apt-areas-l">I'm applying for</span>${APT_AREAS.map(a => `<button type="button" class="opt-chip" data-apt-area="${a.key}" aria-pressed="${aptUi.area === a.key}">${esc(a.label)}</button>`).join("")}<button type="button" class="opt-chip" data-apt-area="" aria-pressed="${!aptUi.area}">Not sure</button>`;
  const order = area ? [...area.tests, ...APT_TYPES.map(t => t.key).filter(k => !area.tests.includes(k))] : APT_TYPES.map(t => t.key);
  $("aptTiles").innerHTML = order.map(k => {
    const t = aptType(k), mine = S.filter(s => s.type === k && (s.level || "medium") === aptUi.level), best = mine.length ? Math.max(...mine.map(s => s.pct)) : null;
    return ivTile("aptkey", k, t.name, t.style, `${t.n} questions · ${t.secs ? Math.round(t.secs * aptTimeFactor() / 60 * 10) / 10 + " min" : "untimed"}${best != null ? ` · best ${best}%` : ""}`, aptUi.key === k, false, area && area.tests.includes(k) ? `Common for ${area.label.toLowerCase()}` : "");
  }).join("");
  $("aptModes").innerHTML = APT_MODES.map(m => ivTile("aptmode", m.key, m.label, m.desc, m.meta, aptUi.mode === m.key, false, false)).join("");
  $("aptLength").innerHTML = [["full", "Full set"], ["short", "Short set (half the questions)"]].map(([k, l]) => `<button type="button" data-apt-len="${k}" aria-pressed="${aptUi.length === k}">${l}</button>`).join("");
  $("aptLevel").innerHTML = APT_LEVELS.map(l => `<button type="button" data-apt-level="${l.key}" aria-pressed="${aptUi.level === l.key}">${l.label}</button>`).join("");
  $("aptLevelNote").textContent = APT_LEVELS.find(l => l.key === aptUi.level).desc;
  const T = aptType(aptUi.key), n = aptCount(T), secs = aptSecs(T);
  $("aptSummary").innerHTML = `<b>${esc(T.name)}</b> · ${LV_LABEL[aptUi.level]} · ${aptUi.mode === "learn" ? "Learn mode" : "Test mode"} · ${n} questions · ${secs ? `${Math.round(secs / 60 * 10) / 10} minutes` : "no clock"}`;
  $("aptAbout").innerHTML = `<p class="ig-phase">About this test</p><h2>${esc(T.name)}</h2>
    <div class="ig-facts2"><div><h3>${esc(T.measures.split(".")[0])}</h3><p>What it measures</p></div><div><h3>${esc(T.who.split(".")[0])}</h3><p>Who uses it</p></div><div><h3>${esc(T.real)}</h3><p>What the real thing looks like</p></div></div>
    <h3 class="iv-h3">How to score well</h3><ol class="ig-quick">${T.tips.map(x => `<li><span>${esc(x)}</span></li>`).join("")}</ol>`;
  renderAptResultsPage();
}
function renderAptResultsPage() {
  const S = aptStore.data.sessions, box = $("aptResults");
  if (!S.length) { box.innerHTML = `<p class="ig-phase">Your results</p><h2>Your scores will appear here</h2><p class="iv-lead">Finish a test and it's kept here, so you can see what's improving.</p>`; return; }
  const types = APT_TYPES.map(t => { const m = S.filter(s => s.type === t.key); return m.length ? { t, best: Math.max(...m.map(s => s.pct)), last: m[m.length - 1].pct, n: m.length } : null; }).filter(Boolean);
  box.innerHTML = `<p class="ig-phase">Your results</p><h2>How you're doing</h2>
    <div class="iv-bars">${types.map(x => `<div class="iv-barrow"><span>${esc(x.t.name.replace(/ \(.*/, ""))}</span><div class="iv-bartrack"><i class="${x.best >= 70 ? "good" : x.best >= 50 ? "" : "low"}" style="width:${x.best}%"></i></div><b>${x.best}%</b><em>${x.n} attempt${x.n === 1 ? "" : "s"}, last ${x.last}%</em></div>`).join("")}</div>
    <h3 class="iv-h3">Recent tests</h3><ol class="iv-list">${S.slice(-6).reverse().map(s => `<li><span class="iv-sc ${s.pct >= 70 ? "good" : s.pct >= 50 ? "mid" : "low"}">${s.pct}</span><span><b>${esc((aptType(s.type) || { name: s.type }).name)}</b><span class="muted">${s.correct} of ${s.total} · ${new Date(s.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · ${LV_LABEL[s.level || "medium"].toLowerCase()}${s.mode === "learn" ? " · learn mode" : ""}</span></span></li>`).join("")}</ol>`;
}

/* --- The test room --- */
function openAptRoom() {
  const d = $("aptRoomDlg");
  if (!d.open) d.showModal();
  document.documentElement.classList.add("iv-in-room");
  $("aptAsk").hidden = true; d.scrollTop = 0;
}
function closeAptRoom() {
  clearInterval(apt.timer); clearTimeout(apt.flash);
  apt.run = null;
  const d = $("aptRoomDlg"); if (d.open) d.close();
  document.documentElement.classList.remove("iv-in-room");
  $("aptStage").innerHTML = ""; $("aptRoomTimer").textContent = "";
  renderApt();
}
function aptAskBox(mode, title, text, yes) {
  apt.ask = mode;
  $("aptAskH").textContent = title; $("aptAskP").textContent = text; $("aptAskYes").textContent = yes;
  $("aptAsk").hidden = false; $("aptAskYes").focus();
}
function startApt(key) {
  const T = aptType(key), n = aptCount(T), secs = aptSecs(T);
  clearInterval(apt.timer); clearTimeout(apt.flash);
  aptLevel = aptUi.level;   // the generators read this (31c)
  apt.run = { key, mode: aptUi.mode, level: aptUi.level, qs: APT_GEN[key](n), i: 0, answers: [], flags: new Set(), seen: new Set(), revealed: new Set(), times: [], qStart: Date.now(), started: Date.now(), left: secs, secs };
  $("aptRoomTitle").textContent = `${T.name} · ${LV_LABEL[aptUi.level]} · ${aptUi.mode === "learn" ? "Learn mode" : "Test mode"}`;
  const tm = $("aptRoomTimer");
  tm.textContent = secs ? mmss(secs) : ""; tm.classList.remove("low");
  if (secs) apt.timer = setInterval(() => { apt.run.left--; tm.textContent = mmss(apt.run.left); tm.classList.toggle("low", apt.run.left <= 30); if (apt.run.left <= 0) finishApt(true); }, 1000);
  openAptRoom();
  renderAptQ();
}
const aptTableHtml = t => `<div class="table-wrap apt-table"><table><caption>${esc(t.title)}</caption><thead><tr><th scope="col"></th>${t.cols.map(c => `<th scope="col" class="num">${esc(c)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r, k) => `<tr><th scope="row">${esc(r)}</th>${t.data[k].map(v => `<td class="num">${esc(String(v))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const aptStem = q => (q.passage ? `<blockquote class="apt-passage">${esc(q.passage)}</blockquote>` : "") + (q.table ? aptTableHtml(q.table) : "") + (q.frames ? `<div class="apt-frames">${q.frames.map((f, k) => frameSVG(f, `Box ${k + 1}`)).join("")}<span class="apt-q" aria-hidden="true">?</span></div>` : "") + (q.stem || "");
const aptOptInner = (q, k) => q.svgOptions ? frameSVG(q.svgOptions[k], `Option ${LETTERS[k]}`) : q.optHtml ? q.optHtml[k] : `<span>${esc(q.options[k])}</span>`;
const aptVisual = q => !!(q.svgOptions || q.optHtml);
function aptLeave() { const R = apt.run; if (R) R.times[R.i] = (R.times[R.i] || 0) + (Date.now() - R.qStart) / 1000; clearTimeout(apt.flash); }
function aptGo(k) { const R = apt.run; if (!R || k < 0 || k >= R.qs.length) return; aptLeave(); R.i = k; R.qStart = Date.now(); renderAptQ(); }
// Something flashes up first (the memory test), then it's gone
function renderAptFlash() {
  const R = apt.run, q = R.qs[R.i], f = q.flash;
  $("aptStage").innerHTML = `<section class="iv-room apt-flash" aria-live="polite"><p class="ig-phase">Memorise this</p><h2 class="iv-sum-h">${esc(f.note)}</h2><div class="apt-flash-box">${f.html}</div><div class="apt-flash-bar" aria-hidden="true"><i style="animation-duration:${f.secs}s"></i></div><p class="iv-lead">It disappears in ${f.secs} seconds. Then you'll be asked about it.</p><p><button class="ig-btn ig-btn--ghost" type="button" data-apt="hide-now">I've got it, hide it now</button></p></section>`;
  clearTimeout(apt.flash);
  apt.flash = setTimeout(() => { R.seen.add(R.i); R.qStart = Date.now(); renderAptQ(); }, f.secs * 1000);
}
function renderAptQ() {
  const R = apt.run, q = R.qs[R.i], learn = R.mode === "learn";
  if (q.flash && !R.seen.has(R.i)) { renderAptFlash(); return; }
  const chosen = R.answers[R.i], shown = learn && R.revealed.has(R.i), last = R.i === R.qs.length - 1;
  const state = k => (R.answers[k] != null ? "done" : "") + (R.flags.has(k) ? " flag" : "") + (k === R.i ? " now" : "");
  const seq = q.seq ? `<p class="apt-seq">${q.seq.join(", ")}, <span aria-label="what comes next">?</span></p>` : "";
  const fb = shown ? `<div class="apt-fb ${chosen === q.answer ? "ok" : "bad"}" role="status"><b>${chosen == null ? "Skipped." : chosen === q.answer ? "Correct." : "Not quite."}</b> ${chosen === q.answer ? "" : `The answer is ${aptVisual(q) ? LETTERS[q.answer] : `“${esc(q.options[q.answer])}”`}. `}${esc(q.why)}</div>` : "";
  $("aptRoomProg").textContent = `Question ${R.i + 1} of ${R.qs.length}`;
  $("aptStage").innerHTML = `<section class="iv-room apt-qroom" aria-labelledby="aptQ">
    <div class="apt-nav" role="group" aria-label="Jump to a question">${R.qs.map((_, k) => `<button type="button" class="apt-dot ${state(k)}" data-apt-go="${k}" aria-label="Question ${k + 1}${R.answers[k] != null ? ", answered" : ""}${R.flags.has(k) ? ", flagged" : ""}"${k === R.i ? ' aria-current="step"' : ""}>${k + 1}</button>`).join("")}</div>
    <div class="apt-progress" aria-hidden="true"><i style="width:${R.answers.filter(a => a != null).length / R.qs.length * 100}%"></i></div>
    <div class="apt-qcard">${aptStem(q)}<h2 class="apt-text" id="aptQ" tabindex="-1">${esc(q.text).replace(/\n/g, "<br>")}</h2>${seq}
      <div class="apt-opts${aptVisual(q) ? " svg" : ""}" role="radiogroup" aria-labelledby="aptQ">${q.options.map((o, k) => `<button type="button" role="radio" class="apt-opt${shown ? (k === q.answer ? " right" : k === chosen ? " wrong" : "") : ""}" data-k="${k}" aria-checked="${chosen === k}"${shown ? " disabled" : ""}><span class="l">${LETTERS[k]}</span>${aptOptInner(q, k)}</button>`).join("")}</div>${fb}</div>
    <div class="iv-actions">${R.i > 0 ? `<button class="ig-btn ig-btn--ghost" type="button" data-apt="prev">← Back</button>` : ""}
      ${learn && !shown ? `<button class="ig-btn ig-btn--primary" type="button" data-apt="check"${chosen == null ? " disabled" : ""}>Check my answer</button>` : `<button class="ig-btn ig-btn--primary" type="button" data-apt="${last ? "finish" : "next"}"${learn && shown ? "" : ""}>${last ? "Finish the test" : "Next →"}</button>`}
      ${learn ? "" : `<button class="ig-btn ig-btn--ghost" type="button" data-apt="flag" aria-pressed="${R.flags.has(R.i)}">${R.flags.has(R.i) ? "⚑ Flagged for later" : "⚑ Flag for later"}</button>`}
      ${!last ? '<button class="ig-linkbtn" type="button" data-apt="finish">Finish now</button>' : ""}</div>
  </section>`;
  $("aptQ").focus({ preventScroll: true });
  $("aptRoomDlg").scrollTop = 0;
}
function finishApt(timeUp) {
  clearInterval(apt.timer); clearTimeout(apt.flash);
  const R = apt.run; if (!R || R.done) return;
  aptLeave();
  R.done = true; R.timeUp = !!timeUp;
  const T = aptType(R.key);
  const correct = R.qs.filter((q, k) => R.answers[k] === q.answer).length, answered = R.answers.filter(a => a != null).length;
  const secs = Math.round((Date.now() - R.started) / 1000), pct = Math.round(correct / R.qs.length * 100);
  const skills = {};
  R.qs.forEach((q, k) => { const s = skills[q.skill] = skills[q.skill] || { right: 0, total: 0 }; s.total++; if (R.answers[k] === q.answer) s.right++; });
  aptStore.data.sessions.push({ type: R.key, level: R.level || "medium", date: new Date().toISOString(), correct, total: R.qs.length, answered, secs, pct, mode: R.mode, skills });
  aptStore.data.sessions = aptStore.data.sessions.slice(-100);
  aptStore.save();
  R.result = { T, correct, answered, secs, pct, skills, prev: aptStore.data.sessions.filter(s => s.type === R.key && (s.level || "medium") === (R.level || "medium")).slice(-2, -1)[0] };
  renderAptResults();
}
const APT_ADVICE = { "percentage change": "Percentage change trips most people up: always divide by the earlier figure.", "shares": "For a share, divide the part by the whole column total.", "growth": "For growth of p%, multiply by (1 + p/100).", "comparing growth": "Compare percentage increases, not raw increases.", "sequences": "For sequences, write the gaps between numbers, then the gaps between the gaps.", "logic statements": "For statements, sketch circles for each group, and pick “Cannot tell” when a conclusion only might be true.", "“cannot say” statements": "When the passage doesn't cover something, the answer is “Cannot say”, even if it seems likely.", "false statements": "A statement is only false if the passage contradicts it.", "shape patterns": "Check one feature at a time: count, shape, shading, rotation, position.", "judgement": "The best responses deal with the problem directly, involve the right people and stay honest.", "levers and balance": "Levers balance when force × distance matches on both sides.", "gears": "Meshed gears turn in opposite directions, and the smaller gear turns faster. An idler gear in between keeps the direction.", "pulleys": "Divide the load by the number of rope sections holding it.", "hydraulics": "Pressure is the same everywhere, so force scales with piston area.", "belt drives": "A bigger pulley on the same belt turns slower, in proportion to its diameter.", "circuits": "Parallel resistors give less than the smallest one; series resistors add.", "torque": "Torque is force times distance from the turning point.", "spotting differences": "Compare each pair in the same order every time, and watch for swapped digits and dropped characters.", "rotating shapes": "Follow one distinctive part of the shape through each option. A mirror image can never be turned to fit.", "number memory": "Group the digits in chunks of two or three instead of holding them one by one.", "word memory": "Link the words in a quick story or picture.", "pattern memory": "Notice the overall shape of the pattern first, then the odd squares." };
function renderAptResults() {
  const R = apt.run, { T, correct, answered, secs, pct, skills, prev } = R.result;
  $("aptRoomProg").textContent = "Results";
  const advice = [];
  if (answered < R.qs.length) advice.push(R.timeUp ? `You ran out of time with ${R.qs.length - answered} unanswered. Keep an eye on the clock: about ${Math.round((R.secs || T.secs) / R.qs.length)} seconds a question.` : `You left ${R.qs.length - answered} unanswered. In a real test, guess rather than leave a blank unless the instructions say wrong answers lose marks.`);
  Object.entries(skills).filter(([, s]) => s.right < s.total).sort((a, b) => (a[1].right / a[1].total) - (b[1].right / b[1].total)).slice(0, 2).forEach(([k]) => advice.push(APT_ADVICE[k] || `Review the ${k} questions below.`));
  if (pct >= 80) advice.push("A strong result. Try a different test, or go again to make it consistent.");
  const perQ = answered ? Math.round(secs / answered) : 0, target = R.secs ? Math.round(R.secs / R.qs.length) : 0;
  const head = pct >= 80 ? "Strong result. <mark>Well done.</mark>" : pct >= 60 ? "A solid score. <mark>Here's how to lift it.</mark>" : "A good start. <mark>Here's where to focus.</mark>";
  $("aptStage").innerHTML = `<section class="iv-room iv-summary" aria-labelledby="aptResH"><p class="ig-phase">${esc(T.name)} · ${LV_LABEL[R.level || "medium"].toLowerCase()} · ${R.mode === "learn" ? "learn mode" : "test mode"}${R.timeUp ? " · time's up" : ""}</p><h2 class="iv-sum-h" id="aptResH" tabindex="-1">${head}</h2>
    <div class="ig-facts2"><div><h3>${correct}/${R.qs.length}</h3><p>correct (${pct}%)${prev ? `. Last time: ${prev.pct}%` : ""}</p></div><div><h3>${mmss(secs)}</h3><p>time taken${perQ ? `, about ${perQ} s a question${target ? ` (aim for ${target})` : ""}` : ""}</p></div><div><h3>${answered}</h3><p>answered, ${R.qs.length - answered} left blank</p></div></div>
    <p class="iv-lead">A practice score, not a percentile or an IQ. Real tests compare you with other people who took the same one.</p>
    ${advice.length ? `<div class="iv-focus"><h3>What to work on</h3><ul>${advice.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>` : ""}
    <div><h3 class="iv-h3">By skill</h3><div class="iv-bars">${Object.entries(skills).map(([k, s]) => { const p = Math.round(s.right / s.total * 100); return `<div class="iv-barrow"><span>${esc(k)}</span><div class="iv-bartrack"><i class="${p >= 70 ? "good" : p >= 50 ? "" : "low"}" style="width:${p}%"></i></div><b>${s.right}/${s.total}</b><em>${p}%</em></div>`; }).join("")}</div></div>
    <div class="iv-sitems"><h3>Review every question</h3>${R.qs.map((q, k) => {
      const a = R.answers[k], ok = a === q.answer;
      return `<details class="iv-sitem"${a != null && !ok && k === R.qs.findIndex((x, j) => R.answers[j] != null && R.answers[j] !== x.answer) ? " open" : ""}><summary><span class="iv-sc ${a == null ? "" : ok ? "good" : "low"}">${a == null ? "–" : ok ? "✓" : "✗"}</span><span class="iv-sq"><b>Question ${k + 1}</b><span class="muted">${esc(q.text.split("\n").slice(-1)[0]).slice(0, 110)}${a == null ? " · skipped" : ""}</span></span></summary>
        <div class="iv-sbody apt-review-body">${aptStem(q)}<p class="apt-rtext">${esc(q.text).replace(/\n/g, "<br>")}</p>${q.seq ? `<p class="apt-seq">${q.seq.join(", ")}, ?</p>` : ""}
        <div class="apt-opts${aptVisual(q) ? " svg" : ""}">${q.options.map((o, j) => `<div class="apt-opt static${j === q.answer ? " right" : j === a ? " wrong" : ""}"><span class="l">${LETTERS[j]}</span>${aptOptInner(q, j)}</div>`).join("")}</div>
        <p class="apt-why"><b>${a == null ? "You skipped this one." : ok ? "You got it." : `You chose ${aptVisual(q) ? LETTERS[a] : `“${esc(q.options[a])}”`}.`}</b> ${esc(q.why)}</p></div></details>`;
    }).join("")}</div>
    <div class="iv-actions iv-sum-actions"><button class="ig-btn ig-btn--primary" type="button" data-apt="again">Try another set</button><button class="ig-btn ig-btn--ghost" type="button" data-apt="close">Choose a different test</button></div></section>`;
  $("aptRoomDlg").scrollTop = 0;
  $("aptResH").focus({ preventScroll: true });
}

onInit(() => {
  $("aptScoring").innerHTML = APT_SCORING.map(x => `<li><span>${esc(x)}</span></li>`).join("");
  const root = $("view-aptitude");
  root.addEventListener("click", e => {
    const a = e.target.closest("[data-apt-area]"), t = e.target.closest("[data-aptkey]"), m = e.target.closest("[data-aptmode]"), l = e.target.closest("[data-apt-len]"), lv = e.target.closest("[data-apt-level]");
    if (a) { aptUi.area = a.dataset.aptArea || null; aptUi.areaSet = true; renderApt(); }
    else if (t) { aptUi.key = t.dataset.aptkey; renderApt(); $("apt-how").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
    else if (m) { aptUi.mode = m.dataset.aptmode; renderApt(); }
    else if (l) { aptUi.length = l.dataset.aptLen; renderApt(); }
    else if (lv) { aptUi.level = lv.dataset.aptLevel; renderApt(); }
    else if (e.target.closest("#aptStart")) startApt(aptUi.key);
    else if (e.target.closest("[data-apt-jump]")) { e.preventDefault(); const j = $(e.target.closest("[data-apt-jump]").getAttribute("href").slice(1)); if (j) j.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
  });
  $("aptRoomDlg").addEventListener("click", e => {
    const R = apt.run;
    const go = e.target.closest("[data-apt-go]"); if (go) { aptGo(+go.dataset.aptGo); return; }
    const o = e.target.closest(".apt-opt:not(.static)");
    if (o && R && !o.disabled) { R.answers[R.i] = +o.dataset.k; document.querySelectorAll(".apt-opt").forEach(b => b.setAttribute("aria-checked", String(b === o))); const c = document.querySelector('[data-apt="check"]'); if (c) c.disabled = false; document.querySelectorAll(".apt-dot")[R.i].classList.add("done"); const bar = document.querySelector(".apt-progress i"); if (bar) bar.style.width = R.answers.filter(x => x != null).length / R.qs.length * 100 + "%"; return; }
    const b = e.target.closest("[data-apt]"); if (!b) return;
    const a = b.dataset.apt;
    if (a === "exit") { if (R && !R.done && R.answers.some(x => x != null)) aptAskBox("exit", "Leave this test?", "Your answers so far won't be scored or saved.", "Leave the test"); else closeAptRoom(); }
    else if (a === "ask-no") $("aptAsk").hidden = true;
    else if (a === "ask-yes") { $("aptAsk").hidden = true; if (apt.ask === "finish") finishApt(false); else closeAptRoom(); }
    else if (a === "next") aptGo(R.i + 1);
    else if (a === "prev") aptGo(R.i - 1);
    else if (a === "check") { R.revealed.add(R.i); renderAptQ(); }
    else if (a === "flag") { R.flags.has(R.i) ? R.flags.delete(R.i) : R.flags.add(R.i); renderAptQ(); }
    else if (a === "hide-now") { clearTimeout(apt.flash); R.seen.add(R.i); R.qStart = Date.now(); renderAptQ(); }
    else if (a === "finish") { const open = R.qs.length - R.answers.filter(x => x != null).length; if (open) aptAskBox("finish", "Finish the test?", `You haven't answered ${open} question${open === 1 ? "" : "s"}. They'll count as wrong.`, "Finish now"); else finishApt(false); }
    else if (a === "again") startApt(R.key);
    else if (a === "close") closeAptRoom();
  });
  $("aptRoomDlg").addEventListener("cancel", e => { e.preventDefault(); if (!$("aptAsk").hidden) $("aptAsk").hidden = true; else $("aptRoomDlg").querySelector('[data-apt="exit"]').click(); });
  $("aptRoomDlg").addEventListener("keydown", e => {
    const R = apt.run; if (!R || R.done || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = "abcde".indexOf(e.key.toLowerCase()), q = R.qs[R.i];
    if (k >= 0 && k < q.options.length && !(q.flash && !R.seen.has(R.i))) { const b = document.querySelector(`.apt-opt[data-k="${k}"]`); if (b && !b.disabled) { b.click(); b.focus(); } }
  });
  window.addEventListener("hashchange", () => setTimeout(() => { if (currentView !== "aptitude" && $("aptRoomDlg").open) closeAptRoom(); }, 0));
  viewHooks.aptitude = () => aptStore.ready.then(renderApt);
});
