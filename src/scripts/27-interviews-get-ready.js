/* ===================== Interviews: get ready (how to practise, story bank, screening answers) ===================== */
const ivPrep = privateDoc("interviewPrep", "jobfinder.ivprep.v1", () => ({ screen: { pitch: "", why: "", salary: "", start: "", rights: "", elsewhere: "" }, stories: {}, job: { id: "", title: "", company: "", level: "", format: "" } }));
const SCREEN_QS = [
  { id: "s1", type: "intro", text: "Walk me through your background in about a minute." },
  { id: "s2", type: "motivation", text: "What made you apply for this role?" },
  { id: "s3", type: "closing", text: "What are your salary expectations?" },
  { id: "s4", type: "closing", text: "When could you start, and what's your notice period?" },
  { id: "s5", type: "closing", text: "Do you have full working rights in Australia?" },
  { id: "s6", type: "closing", text: "Are you interviewing anywhere else at the moment?" }
];
function screenSet() { return SCREEN_QS.map(q => ({ ...q })); }
const SCREEN_FIELDS = [
  ["pitch", "Your 60-second background", "Present, past, future: who you are now, two experiences that led here, why this role.", 3],
  ["why", "Why this role", "One specific thing about the job or company, and what you'd bring.", 2],
  ["salary", "Salary expectations", "A researched range for the role and city, e.g. “$75,000 to $82,000 plus super, depending on the full package”.", 1],
  ["start", "Start date and notice period", "e.g. “Two weeks' notice, so I could start on the 17th.”", 1],
  ["rights", "Work rights", "e.g. “Yes, I'm an Australian citizen.” or your visa and its conditions.", 1],
  ["elsewhere", "Interviewing elsewhere?", "Honest and positive: “A couple of early conversations, but this role is my first choice because…”", 1]
];
const STORY_SLOTS = [
  ["team", "Working in a team", "Tell me about a time you worked in a team to achieve a goal."],
  ["problem", "Solving a problem", "Give an example of a problem you solved. How did you approach it?"],
  ["conflict", "A disagreement", "Tell me about a time you had a conflict with a colleague. How did you handle it?"],
  ["pressure", "A tight deadline", "Tell me about a time you had to meet a tight deadline."],
  ["mistake", "A mistake you fixed", "Describe a time you made a mistake. What did you do?"],
  ["initiative", "Taking the initiative", "Tell me about a time you took the initiative to improve something."],
  ["customer", "A difficult customer", "Describe a time you dealt with a difficult customer or client."],
  ["learning", "Learning fast", "Tell me about a time you had to learn something new quickly."]
];
const PRACTISE_STEPS = [
  ["Research the job (30 minutes)", "Read the ad twice and highlight what they ask for. Look at the company's website, recent news and LinkedIn. Write down two things you genuinely like about them."],
  ["Build your story bank", "Write six to eight real STAR stories below. Most behavioural questions can be answered with one of them, so you don't need a different story for every question."],
  ["Say it out loud, with a timer", "Answers sound different spoken. Record yourself on your phone, aim for about 2 minutes, and listen back for “um” and “we”."],
  ["Do a mock interview", "Five questions in a row, under time pressure, with no notes. Use the mock interview here, or ask a friend to read the questions."],
  ["Fix your weakest answer", "Look at your lowest score in Your progress, rewrite that answer, and practise it again. Small improvements add up."]
];
const WEEK_PLAN = [["7 days out", "Research the company and role. Fill in your screening answers."], ["6 days out", "Write four stories in the story bank."], ["5 days out", "Write the rest. Practise three questions out loud."], ["4 days out", "Do a mock interview. Note your weakest answer."], ["3 days out", "Rewrite and re-practise your weakest two answers."], ["2 days out", "Prepare three questions to ask them. Plan your outfit and route, or test your video setup."], ["The day before", "One light run-through. Rest."]];
function storyText(st) { return st ? [st.s, st.t, st.a, st.r].filter(x => x && x.trim()).join(" ") : ""; }
function storyState(st) {
  if (!st || !storyText(st).trim()) return ["empty", "Not written"];
  if (!(st.r || "").trim()) return ["warn", "Needs a result"];
  if (wordCount(st.a || "") < 25) return ["warn", "Say more about what you did"];
  if (!/\bI\b/.test(st.a || "")) return ["warn", "Use “I” in the actions"];
  return ["ok", "Ready"];
}
function renderScreenSheet(box, compact) {
  const sc = ivPrep.data.screen;
  box.innerHTML = `<div class="iv-sheet-head"><h3>Your screening answers</h3><span class="small muted">Have these in front of you on the call. ${whereWords(ivPrep.where).replace(/^./, c => c.toUpperCase())}.</span></div>
    <div class="q-grid">${SCREEN_FIELDS.map(([k, label, hint, rows]) => `<div class="q${rows > 1 ? " wide" : ""}"><label class="q-label" for="scr-${k}${compact ? "-c" : ""}">${label}</label>${compact ? "" : `<p class="q-hint">${esc(hint)}</p>`}<textarea id="scr-${k}${compact ? "-c" : ""}" data-scr="${k}" rows="${rows}" placeholder="${esc(compact ? hint : "")}">${esc(sc[k] || "")}</textarea></div>`).join("")}</div>
    ${compact ? "" : `<div class="b-actions"><button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-scr-copy>Copy all</button><button class="ig-btn ig-btn--primary ig-btn--small" type="button" data-scr-practise>Practise a screening call</button></div>`}`;
  if (!sc.pitch && P().summary) box.querySelector('[data-scr="pitch"]').placeholder = "Start from your profile: " + P().summary.slice(0, 140) + "…";
}
function renderPrepare() {
  const box = $("ivPrepare");
  const stories = ivPrep.data.stories;
  const ready = STORY_SLOTS.filter(([k]) => storyState(stories[k])[0] === "ok").length;
  box.innerHTML = `<div class="ig iv-ig" id="ivPrepRoot" data-nohelp>
    <header class="ig-hero iv-hero">
      <div>
        <p class="ig-eyebrow">Get ready · build your plan</p>
        <h2 class="ig-h1">Tell us about the interview. <mark>We'll build your plan.</mark></h2>
        <p class="ig-lede">Choose a job you've saved, or type in the title and company. You'll get advice for that company, that role and that kind of interview, plus a place to write your stories and screening answers. No account or AI needed.</p>
        <div class="ig-actions"><a class="ig-btn ig-btn--primary" href="#iv-job" data-iv-scroll>Choose the interview</a><button class="ig-btn ig-btn--ghost" type="button" data-ivtab="practice">Skip to practice</button></div>
        <ul class="ig-facts"><li>Advice for the company, role and format</li><li>Questions written for your job</li><li>Saved as you type</li></ul>
      </div>
      <figure class="ig-score iv-prepfig" id="ivPrepFig" aria-hidden="true"></figure>
    </header>
    <div class="ig-shell">
      <aside class="ig-toc" aria-label="Contents"><nav aria-label="Get ready contents">
        <h2>Start</h2><ul><li><a href="#iv-job">Your interview</a></li><li><a href="#iv-plan">Your plan</a></li></ul>
        <h2>Prepare</h2><ul><li><a href="#iv-stories">Your stories</a></li><li><a href="#iv-screen">Screening answers</a></li><li><a href="#iv-week">A one-week plan</a></li></ul>
      </nav></aside>
      <div class="ig-content">
        <section class="ig-section" id="iv-job" aria-labelledby="ivJobH"><p class="ig-phase">Step 1</p><h2 id="ivJobH">Which interview is it?</h2><div id="ivJobPick"></div></section>
        <section class="ig-section" id="iv-plan" aria-labelledby="ivPlanH"><p class="ig-phase">Step 2</p><h2 id="ivPlanH">Your plan</h2><div id="ivJobAdvice" aria-live="polite"></div></section>
        <section class="ig-section" id="iv-stories" aria-labelledby="ivStoriesH"><p class="ig-phase">Step 3</p><h2 id="ivStoriesH">Your stories</h2>
          <div class="ig-prose"><p>Most behavioural questions can be answered with one of a handful of real stories. Write each one with STAR: a sentence of situation, what you had to do, what you did, and what came of it. <b id="ivStoryCount">${ready} of ${STORY_SLOTS.length} ready.</b></p></div>
          <div class="story-grid">${STORY_SLOTS.map(([k, label, q]) => { const st = stories[k] || {}, [cls, msg] = storyState(st); return `<details class="story" data-story="${k}"${st.open ? " open" : ""}><summary><span>${esc(label)}</span><span class="story-state ${cls}">${msg}</span></summary><div class="story-body"><p class="small muted">Answers questions like “${esc(q)}”</p>
            ${[["s", "Situation", "Where and when, in one sentence"], ["t", "Task", "What you needed to achieve"], ["a", "Action", "What you did, step by step, using “I”"], ["r", "Result", "What changed, with a number or feedback"]].map(([f, l, h]) => `<label class="field" for="st-${k}-${f}">${l}<textarea id="st-${k}-${f}" data-st="${k}" data-f="${f}" rows="${f === "a" ? 3 : 2}" placeholder="${h}">${esc(st[f] || "")}</textarea></label>`).join("")}
            <div class="b-actions"><button class="ig-btn ig-btn--ghost ig-btn--small" type="button" data-story-practise="${k}">Practise with this story</button></div></div></details>`; }).join("")}</div>
        </section>
        <section class="ig-section" id="iv-screen" aria-labelledby="ivScreenH"><p class="ig-phase">Step 4</p><h2 id="ivScreenH">Your screening answers</h2>
          <div class="ig-prose"><p>Recruiters often ring first to check the basics. Write these once and keep them in front of you on the call.</p></div>
          <div class="iv-sheet" id="ivSheetFull"></div></section>
        <section class="ig-section" id="iv-week" aria-labelledby="ivWeekH"><p class="ig-phase">Step 5</p><h2 id="ivWeekH">A one-week plan</h2>
          <ol class="ig-quick">${WEEK_PLAN.map(([d, t]) => `<li><span><strong>${esc(d)}</strong>${esc(t)}</span></li>`).join("")}</ol>
          <details class="iv-more"><summary>How to practise, in five steps</summary><ol class="iv-steps prac-steps">${PRACTISE_STEPS.map(([h, t]) => `<li><span><b>${esc(h)}</b>${esc(t)}</span></li>`).join("")}</ol></details>
        </section>
      </div>
    </div>
  </div>`;
  renderScreenSheet($("ivSheetFull"), false);
  trk.ready.then(() => { renderJobPanels(); document.dispatchEvent(new Event("jf:guides")); });
}
onInit(() => {
  const onEdit = e => {
    const t = e.target;
    if (t.dataset.scr) { ivPrep.data.screen[t.dataset.scr] = t.value; ivPrep.save(); return; }
    if (t.dataset.st) {
      const k = t.dataset.st, st = ivPrep.data.stories[k] = ivPrep.data.stories[k] || {};
      st[t.dataset.f] = t.value; ivPrep.save();
      const [cls, msg] = storyState(st), lab = t.closest(".story").querySelector(".story-state");
      lab.className = "story-state " + cls; lab.textContent = msg;
      const n = $("ivStoryCount"); if (n) n.textContent = `${STORY_SLOTS.filter(([kk]) => storyState(ivPrep.data.stories[kk])[0] === "ok").length} of ${STORY_SLOTS.length} ready.`;
      if (typeof renderJobAdvice === "function") { clearTimeout(ivState.timer); ivState.timer = setTimeout(renderJobAdvice, 400); }
    }
  };
  $("ivPrepare").addEventListener("input", onEdit);
  $("ivScreenSheet").addEventListener("input", onEdit);
  $("ivPrepare").addEventListener("toggle", e => { const d = e.target.closest && e.target.closest(".story"); if (d) { const st = ivPrep.data.stories[d.dataset.story] = ivPrep.data.stories[d.dataset.story] || {}; st.open = d.open; } }, true);
  $("ivPrepare").addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-scr-copy")) {
      const sc = ivPrep.data.screen;
      const text = SCREEN_FIELDS.map(([k, label]) => `${label}:\n${sc[k] || "-"}`).join("\n\n");
      try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; } catch { b.textContent = "Select and copy them"; }
    } else if (b.hasAttribute("data-scr-practise")) { iv.mode = "screen"; setIvTab("practice"); startPractice(); }
    else if (b.dataset.storyPractise) {
      const k = b.dataset.storyPractise, slot = STORY_SLOTS.find(s => s[0] === k), st = ivPrep.data.stories[k];
      iv.mode = "single"; iv.mock = null; setIvTab("practice");
      showQuestion(IV_QUESTIONS.find(q => q.text === slot[2]) || { id: "st" + k, type: "behavioural", text: slot[2] });
      const story = storyText(st);
      if (story) { $("ivAnswer").value = story; updateCount(); $("ivRateStatus").textContent = "Your story is filled in. Say it out loud, tidy it up, then rate it."; }
    }
  });
});

