/* ===================== Connect your AI: the page, and the landing page on Home ===================== */
// Three ways, from free and private to the strongest writing. With nothing connected, built-in rules still fill in.
const AIC_TIERS = [
  { id: "browser", engine: "webllm", title: "AI in your browser", short: "In your browser", q: 3, cost: "Free", privacy: "Stays on this computer", setup: "Nothing, or one download (0.5 to 4.5 GB)", rec: "Best free and private", meta: "Free · private",
    body: "The AI runs on your own computer, so nothing you type leaves it and it keeps working offline. Chrome may already have a small one built in. If not, Job Finder downloads an open model once and your browser keeps it. Bigger models write better but take longer." },
  { id: "key", engine: "key", title: "Bring your own key", short: "Your own key", q: 4, cost: "Free (Gemini, OpenRouter, Groq) or pay per use", privacy: "Sent to the company you choose", setup: "About 2 minutes", rec: "Best results for most people", meta: "Free or pay per use",
    body: "Paste an API key from an AI company and Job Finder uses their models directly from your browser. Google's free Gemini key is the easiest start. A paid Claude key gives the strongest writing." },
  { id: "site", engine: "claude", title: "Job Finder AI", short: "Job Finder AI", q: 5, cost: "Paid plan (coming soon)", privacy: "Sent to Job Finder's AI provider", setup: "None", meta: "Paid, coming soon",
    body: "Job Finder provides the AI, so there's nothing to set up and you get the strongest model with no limits to manage." }
];
const aicTierOf = e => e === "webllm" || e === "tfjs" || e === "chrome" ? "browser" : e === "claude" ? "site" : e;
const aicMeter = (q, label) => `<span class="aic-meter" role="img" aria-label="${label || `Writing quality ${q} out of 5`}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= q ? "on" : ""}"></i>`).join("")}</span>`;
let aicRendered = false;
const aicBusy = { now: null };

function aicDescribe() {
  const e = aiCfg.engine;
  const name = e === "auto" ? (claudeSample ? "Automatic: Chrome's AI if it's ready, otherwise Claude" : "Automatic: Chrome's AI if it's ready, otherwise built-in templates (no AI)")
    : e === "chrome" ? "Chrome's built-in AI"
    : e === "claude" ? "Claude on your Claude account"
    : e === "webllm" ? `${(WEBLLM_MODELS.find(m => m.id === aiCfg.webllmModel) || {}).name || "A model"} in your browser (WebLLM)`
    : e === "tfjs" ? `${(TFJS_MODELS.find(m => m.id === aiCfg.tfjsModel) || {}).name || "A model"} in your browser (Transformers.js)`
    : `${aiCfg.key.model || "A model"} with your ${aiProvider().short} key`;
  let why = "";
  if (USER_ENGINES.has(e) && !aiUsable(e)) why = "Not finished setting up, so Job Finder is using " + (claudeSample ? "Claude" : "built-in templates") + " for now.";
  else if (e === "claude" && !claudeSample) why = "Claude is only available when Job Finder is opened in Claude, so built-in templates are used here.";
  else if (USER_ENGINES.has(e)) why = aiCfg.fallback && claudeSample ? "If it fails, Claude takes over." : "If it fails, built-in templates take over.";
  return { name, why };
}
// Roughly how long things take with an in-browser model, from its measured (or typical) speed
const AIC_JOBS = [["summary", 2400, 420], ["bullets", 2800, 650], ["cover letter", 7000, 1500]];
function aicSpeedText(kind, m) {
  const sp = aiSpeed(kind, m.id), wps = Math.max(1, Math.round(sp.dec * 0.75));
  const t = AIC_JOBS.map(([, pc, oc]) => fmtDur(aiEstimate(kind, m.id, pc, oc)));
  return `${sp.measured ? "On this computer" : "On a typical laptop"} it writes about ${wps} words a second: a summary takes about ${t[0]}, bullet points about ${t[1]} and a cover letter about ${t[2]}.`;
}
const aicModelOpt = (kind, m) => `<label class="aic-opt"><input type="radio" name="${kind === "tfjs" ? "aicTfjs" : "aicWebllm"}" value="${esc(m.id)}"><span><b>${esc(m.name)}${m.pick ? ' <em class="aic-pick">Suggested</em>' : ""}</b><small>${esc(m.size)} download: about ${esc(dlTime(m))} on a typical 50 Mbps NBN connection, once.${m.gpu ? ` Needs ${esc(m.gpu)}.` : ""} ${esc(m.note)}</small><small class="aic-speed" data-speed="${esc(m.id)}">${esc(aicSpeedText(kind, m))}</small></span></label>`;

function aicSetupHtml(t) {
  const inC = aiInClaude();
  const claudeNote = inC ? `<p class="aic-note">Inside Claude's preview this page can't download models, so WebLLM and Transformers.js work once Job Finder is opened as its own website. Claude is used meanwhile.</p>` : "";
  if (t.id === "browser") return `<fieldset class="aic-libs"><legend>Choose how</legend>
      <label class="aic-opt"><input type="radio" name="aicLib" value="chrome" id="aicLibChrome"><span><b>Chrome's built-in AI</b><small>Nothing to download if your Chrome already has it (Gemini Nano). Quick to start and fine for short edits, but weaker at longer writing like cover letters.</small><small class="aic-env" id="aicChromeState">Checking Chrome…</small></span></label>
      <label class="aic-opt"><input type="radio" name="aicLib" value="webllm" id="aicLibWebllm"><span><b>WebLLM <em class="aic-pick">Best writing</em></b><small>Download a stronger open model. Needs WebGPU: Chrome or Edge on a computer, or Safari 26.</small></span></label>
      <label class="aic-opt"><input type="radio" name="aicLib" value="tfjs" id="aicLibTfjs"><span><b>Transformers.js</b><small>Smaller models that also run on computers without a strong graphics card, just more slowly.</small></span></label>
    </fieldset>
    <div class="aic-way" id="aicWayChrome" hidden>
      <details class="aic-more"><summary>What Chrome needs</summary><ul><li>Chrome 148 or later on Windows 10/11, macOS 13+, Linux or a Chromebook Plus (not phones)</li><li>About 22 GB of free disk space, and a graphics card with more than 4 GB of memory or 16 GB of RAM</li><li>Job Finder opened as its own website (Chrome blocks it inside Claude's preview)</li></ul></details>
      <div class="aic-act"><button class="btn primary" type="button" data-use="chrome">Use Chrome's AI</button></div>
    </div>
    <div class="aic-way" id="aicWayDownload">
      ${claudeNote}<p class="aic-env" id="aicGpu"></p>
      <fieldset class="aic-models" id="aicModelsWebllm"><legend>WebLLM model</legend>${WEBLLM_MODELS.map(m => aicModelOpt("webllm", m)).join("")}</fieldset>
      <fieldset class="aic-models" id="aicModelsTfjs" hidden><legend>Transformers.js model</legend>${TFJS_MODELS.map(m => aicModelOpt("tfjs", m)).join("")}</fieldset>
      <p class="aic-eta" id="aicEta"></p>
      <div class="aic-dl" id="aicDlBox" hidden><p class="aic-dl-k" id="aicDlPhase"></p><div class="bar"><i id="aicDlBar" style="width:0%"></i></div><p class="small muted" id="aicDlText"></p></div>
      <div class="aic-act"><button class="btn primary" type="button" id="aicBrowserGo">Download and use</button><p class="aic-msg small" id="aicBrowserOut" role="status"></p></div>
      <p class="small muted">The download happens once and is kept by your browser. You can keep using Job Finder while it downloads; a card in the corner shows how long is left.</p>
    </div>
    <details class="aic-more aic-why"><summary>Why does an AI in the browser take a while?</summary><ul>
      <li><b>The first time,</b> your browser downloads the whole AI: 0.5 to 4.5 GB, depending on the model. On a typical 50 Mbps connection that's about 1 to 12 minutes. It's kept afterwards, so it only happens once.</li>
      <li><b>Each visit,</b> the AI is loaded onto your graphics card and set up, which takes about 10 to 60 seconds. Job Finder starts this in the background when you open it, so it's usually ready by the time you need it.</li>
      <li><b>Then every word is worked out on your own computer.</b> A laptop is much slower than an AI company's servers, so a 3B model writes roughly 8 to 20 words a second. Job Finder gives it short, one-job-at-a-time instructions to keep waits down, and shows the time left in the corner.</li>
      <li><b>Faster options:</b> a smaller model (Qwen 2.5 1.5B), or a free Gemini key (step 2), which answers in a few seconds.</li></ul></details>`;
  if (t.id === "key") return `${inC ? `<p class="aic-note">Inside Claude's preview this page can't reach other sites, so your own key works once Job Finder is opened as its own website. Claude is used meanwhile.</p>` : ""}<fieldset class="aic-provs"><legend>Company</legend>${Object.entries(AI_PROVIDERS).map(([k, p]) => `<label class="aic-prov"><input type="radio" name="aicProv" value="${k}"><span><b>${esc(p.name)}</b><small>${p.free ? "Free tier" : k === "custom" ? "Any compatible service" : "Pay per use"}</small></span></label>`).join("")}</fieldset>
    <p class="aic-note aic-provnote" id="aicProvNote"></p>
    <ol class="aic-steps" id="aicKeySteps"></ol>
    <div class="aic-grid">
      <label class="field" id="aicBaseWrap" hidden>Address (ends in /v1)<input type="text" id="aicKeyBase" spellcheck="false" autocomplete="off" placeholder="https://api.example.com/v1"></label>
      <label class="field">API key<span class="aic-inline"><input type="text" id="aicKey" class="secret-mask" name="ai-service-token" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" data-lpignore="true" data-1p-ignore data-bwignore="true" data-form-type="other" placeholder="Paste your key"><button class="btn" type="button" id="aicKeyShow" aria-pressed="false">Show</button></span></label>
      <label class="field">Model<span class="aic-inline"><input type="text" id="aicKeyModel" list="aicKeyList" spellcheck="false" autocomplete="off"><button class="btn" type="button" id="aicKeyLoad">Load models</button></span><datalist id="aicKeyList"></datalist></label>
    </div>
    <label class="aic-check"><input type="checkbox" id="aicRemember"> Remember my key on this device (otherwise it's forgotten when you close the tab)</label>
    <div class="aic-act"><button class="btn primary" type="button" id="aicKeyGo">Test and use</button><button class="btn ghost" type="button" id="aicKeyForget">Remove key</button><p class="aic-msg small" id="aicKeyOut" role="status"></p></div>
    <p class="small muted">Your key is kept in this browser only and sent straight to the company you chose. Job Finder never stores it.</p>`;
  if (t.id === "site") return claudeSample
    ? `<p class="aic-env ok">Ready now. Inside Claude, this is Claude on your own Claude account, with nothing to set up and no key.</p><div class="aic-act"><button class="btn" type="button" data-use="claude">Use Claude</button></div>`
    : `<p class="aic-env">Coming soon on the Job Finder website. Until then, a free key (step 2) gets you close.</p><div class="aic-act"><button class="btn" type="button" disabled>Coming soon</button></div>`;
  return "";
}

function renderConnect() {
  const list = $("aicLadder");
  if (!list) return;
  if (!aicRendered) {
    list.innerHTML = AIC_TIERS.map((t, i) => `<li class="aic-tier${t.rec ? " rec" : ""}" id="tier-${t.id}" data-tier="${t.id}">
      <div class="aic-rung" aria-hidden="true"><span class="aic-n">${i + 1}</span></div>
      <article class="aic-card" aria-labelledby="aicT-${t.id}">
        <header class="aic-th"><div class="aic-tt"><h2 id="aicT-${t.id}">${esc(t.title)}</h2>${t.rec ? `<span class="aic-rec">${esc(t.rec)}</span>` : ""}</div><span class="aic-state" data-state></span></header>
        <dl class="aic-facts">
          <div><dt>Writing</dt><dd>${aicMeter(t.q)}</dd></div>
          <div><dt>Cost</dt><dd>${esc(t.cost)}</dd></div>
          <div><dt>Privacy</dt><dd>${esc(t.privacy)}</dd></div>
          <div><dt>Setup</dt><dd>${esc(t.setup)}</dd></div>
        </dl>
        <p class="aic-body">${esc(t.body)}</p>
        <div class="aic-setup" data-setup="${t.id}">${aicSetupHtml(t)}</div>
      </article>
    </li>`).join("");
    aicRendered = true;
    aicWire();
  }
  aicFill();
  aicSync();
}
const aicLibNow = () => (document.querySelector('input[name="aicLib"]:checked') || {}).value || "webllm";
// Show the part for the chosen way: Chrome's AI, or a model to download
function aicShowWay() {
  const lib = aicLibNow();
  $("aicWayChrome").hidden = lib !== "chrome"; $("aicWayDownload").hidden = lib === "chrome";
  $("aicModelsWebllm").hidden = lib !== "webllm"; $("aicModelsTfjs").hidden = lib !== "tfjs";
  aicEta();
}
// Before downloading: how big it is and roughly how long it will take
function aicEta() {
  const lib = aicLibNow();
  if (lib === "chrome") return;
  const m = browserModel(lib, lib === "tfjs" ? aiCfg.tfjsModel : aiCfg.webllmModel), el = $("aicEta");
  if (!m || !el) return;
  const busy = aiLocal.loading && aiLocal.model === m.id, ready = aiLocal.engine && aiLocal.model === m.id;
  el.textContent = ready ? `${m.name} is ready on this computer.` : busy ? "" : `${m.name}: ${m.size} to download, about ${dlTime(m)} on a typical 50 Mbps NBN connection (once), then 10 to 60 seconds to set up on each visit.`;
  $("aicBrowserGo").textContent = ready ? "Use it" : "Download and use";
  document.querySelectorAll("[data-speed]").forEach(x => { const k = TFJS_MODELS.some(t => t.id === x.dataset.speed) ? "tfjs" : "webllm"; x.textContent = aicSpeedText(k, browserModel(k, x.dataset.speed)); });
}
// Put the saved choices into the form
function aicFill() {
  const lib = aiCfg.engine === "tfjs" ? "tfjs" : aiCfg.engine === "chrome" ? "chrome" : "webllm";
  const r = $("aicLib" + lib[0].toUpperCase() + lib.slice(1)); if (r) r.checked = true;
  document.querySelectorAll('input[name="aicWebllm"]').forEach(i => { i.checked = i.value === aiCfg.webllmModel; });
  document.querySelectorAll('input[name="aicTfjs"]').forEach(i => { i.checked = i.value === aiCfg.tfjsModel; });
  document.querySelectorAll('input[name="aicProv"]').forEach(i => { i.checked = i.value === aiCfg.key.provider; });
  $("aicKey").value = aiSecret(); $("aicKeyModel").value = aiCfg.key.model; $("aicKeyBase").value = aiCfg.key.base || "";
  $("aicRemember").checked = aiCfg.key.remember !== false;
  $("aicFallback").checked = aiCfg.fallback !== false;
  aicShowWay();
  aicProvInfo();
}
function aicProvInfo() {
  const k = aiCfg.key.provider, p = aiProvider();
  $("aicBaseWrap").hidden = k !== "custom";
  $("aicProvNote").textContent = p.note || "";
  $("aicKeySteps").innerHTML = k === "custom" ? `<li>Copy the service's API address and a key from its website.</li><li>Paste both below, then load or type a model name.</li><li>Select Test and use.</li>`
    : `<li>Get a key at <a href="${esc(p.keyUrl)}" target="_blank" rel="noopener">${esc(p.keyWhere)}</a>${p.free ? " (free, sign in with your account)" : ""}.</li><li>Paste it below.${p.model ? ` The model is filled in for you.` : ` Then select Load models and pick one${k === "openrouter" ? " ending in :free" : ""}.`}</li><li>Select Test and use.</li>`;
}
function aicMsg(id, text, kind) { const el = $(id); if (!el) return; el.textContent = text || ""; el.className = "aic-msg small" + (kind ? " " + kind : ""); }
async function aicSync() {
  if (!aicRendered) return;
  const cur = aicTierOf(aiCfg.engine);
  document.querySelectorAll(".aic-tier").forEach(li => {
    const on = li.dataset.tier === cur;
    li.classList.toggle("on", on);
    li.querySelector("[data-state]").textContent = on ? (USER_ENGINES.has(aiCfg.engine) && !aiUsable() ? "Chosen, not set up yet" : "In use") : "";
  });
  const site = document.querySelector('[data-setup="site"]');
  if (site) site.innerHTML = aicSetupHtml(AIC_TIERS.find(t => t.id === "site"));
  document.querySelectorAll("[data-use]").forEach(b => { const on = b.dataset.use === aiCfg.engine; b.textContent = on ? "In use" : b.dataset.label || (b.dataset.label = b.textContent); b.disabled = on; });
  const d = aicDescribe();
  $("aicNowName").textContent = d.name; $("aicNowWhy").textContent = d.why;
  const gpu = $("aicGpu");
  if (gpu) { gpu.textContent = navigator.gpu ? "This browser supports WebGPU, so WebLLM and Transformers.js can both run here." : "This browser doesn't have WebGPU, so choose Transformers.js (it runs more slowly without a graphics card)."; gpu.className = "aic-env" + (navigator.gpu ? " ok" : " warn"); }
  aicEta();
  const ch = $("aicChromeState");
  if (ch) { const st = await chromeAIRaw(); ch.textContent = st === "available" ? "Ready on this computer." : st === "downloadable" || st === "downloading" ? "Supported here. Chrome downloads its model the first time it's used." : "Not available in this browser or on this page."; ch.className = "aic-env" + (st === "available" ? " ok" : st === "absent" || st === "unavailable" ? " warn" : ""); }
}
async function aicUseAfterTest(engine, outId, btn) {
  if (!aiUsable(engine)) { aicMsg(outId, engine === "key" ? (!aiSecret() ? "Paste your key first." : "Choose a model first.") : "Choose a model first.", "err"); return; }
  btn.disabled = true;
  aicMsg(outId, "Testing…");
  try {
    const r = await testAi(engine);
    setAiEngine(engine);
    aicMsg(outId, `Working. It replied "${r.text}" in ${(r.ms / 1000).toFixed(1)} seconds, and is now doing your writing.`, "ok");
  } catch (e) { aicMsg(outId, aiErrWords(e), "err"); }
  finally { btn.disabled = false; aicSync(); }
}
// The Connect page's own progress bar while a model downloads and gets ready
function aicShowLoad(f, text, st) {
  const box = $("aicDlBox");
  if (!box) return;
  box.hidden = false;
  $("aicDlBar").style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + "%";
  $("aicDlPhase").textContent = st ? `${st.title}${st.phase !== "ready" ? `: ${Math.round(f * 100)}%` : ""}` : "";
  $("aicDlText").textContent = st ? st.detail : String(text || "").slice(0, 140);
}
function aicWire() {
  const root = $("aicLadder");
  root.addEventListener("click", e => { const b = e.target.closest("[data-use]"); if (b) { setAiEngine(b.dataset.use); aicSync(); } });
  $("aicFallback").addEventListener("change", e => { aiCfg.fallback = e.target.checked; saveAiCfg(); aicSync(); });
  document.querySelectorAll(".aic-tip [data-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const el = $("tier-" + a.dataset.jump); if (el) { el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); const f = el.querySelector("input, button"); if (f) f.focus({ preventScroll: true }); } }));
  // In the browser
  document.querySelectorAll('input[name="aicLib"]').forEach(i => i.addEventListener("change", aicShowWay));
  document.querySelectorAll('input[name="aicWebllm"]').forEach(i => i.addEventListener("change", () => { aiCfg.webllmModel = i.value; saveAiCfg(); aicEta(); }));
  document.querySelectorAll('input[name="aicTfjs"]').forEach(i => i.addEventListener("change", () => { aiCfg.tfjsModel = i.value; saveAiCfg(); aicEta(); }));
  $("aicBrowserGo").addEventListener("click", async () => {
    const lib = aicLibNow() === "tfjs" ? "tfjs" : "webllm";
    const model = lib === "tfjs" ? aiCfg.tfjsModel : aiCfg.webllmModel;
    const btn = $("aicBrowserGo"); btn.disabled = true; aicBusy.now = lib;
    $("aicEta").textContent = "";
    aicMsg("aicBrowserOut", "Starting…");
    try {
      await loadBrowserModel(lib, model, aicShowLoad);
      aicMsg("aicBrowserOut", "Ready. Checking it works…");
      const r = await testAi(lib);
      setAiEngine(lib);
      const m = browserModel(lib, model);
      aicMsg("aicBrowserOut", `Ready, and now doing your writing. It replied "${r.text}". ${m ? aicSpeedText(lib, m) : ""}`, "ok");
    } catch (e) { aicMsg("aicBrowserOut", aiErrWords(e), "err"); $("aicDlBox").hidden = true; }
    finally { btn.disabled = false; aicBusy.now = null; aicSync(); }
  });
  // Your own key
  document.querySelectorAll('input[name="aicProv"]').forEach(i => i.addEventListener("change", () => {
    aiCfg.key.provider = i.value; aiCfg.key.model = AI_PROVIDERS[i.value].model || ""; saveAiCfg();
    $("aicKeyModel").value = aiCfg.key.model; $("aicKeyList").innerHTML = ""; aicProvInfo(); aicMsg("aicKeyOut", "");
    if (i.value === "openrouter") $("aicKeyLoad").click();
  }));
  $("aicKey").addEventListener("change", e => { setAiSecret(e.target.value, $("aicRemember").checked); refreshSample(); aicSync(); });
  $("aicRemember").addEventListener("change", e => { aiCfg.key.remember = e.target.checked; saveAiCfg(); setAiSecret(aiSecret(), e.target.checked); });
  // The key is hidden with CSS rather than type="password", so the browser doesn't offer to save it as a password.
  // (A browser that can't hide text with CSS falls back to a password box that asks not to be saved.)
  const keyBox = $("aicKey"), cssHides = !!(window.CSS && CSS.supports && (CSS.supports("-webkit-text-security", "disc") || CSS.supports("text-security", "disc")));
  if (!cssHides) { keyBox.type = "password"; keyBox.classList.remove("secret-mask"); keyBox.autocomplete = "new-password"; }
  const keyShown = () => cssHides ? !keyBox.classList.contains("secret-mask") : keyBox.type === "text";
  $("aicKeyShow").addEventListener("click", e => { const show = !keyShown(); if (cssHides) keyBox.classList.toggle("secret-mask", !show); else keyBox.type = show ? "text" : "password"; e.target.textContent = show ? "Hide" : "Show"; e.target.setAttribute("aria-pressed", String(show)); });
  $("aicKeyModel").addEventListener("change", e => { aiCfg.key.model = e.target.value.trim(); saveAiCfg(); aicSync(); });
  $("aicKeyBase").addEventListener("change", e => { aiCfg.key.base = e.target.value.trim(); saveAiCfg(); });
  $("aicKeyLoad").addEventListener("click", async () => {
    setAiSecret($("aicKey").value, $("aicRemember").checked);
    aicMsg("aicKeyOut", "Loading models…");
    try {
      const ids = await aiListModels();
      $("aicKeyList").innerHTML = ids.map(i => `<option value="${esc(i)}">`).join("");
      if (ids.length && !ids.includes(aiCfg.key.model)) { aiCfg.key.model = ids[0]; $("aicKeyModel").value = ids[0]; saveAiCfg(); }
      aicMsg("aicKeyOut", ids.length ? `${ids.length} models found. Pick one from the Model box, or keep the one shown.` : "No models came back. Type a model name instead.", ids.length ? "ok" : "err");
    } catch (e) { aicMsg("aicKeyOut", aiErrWords(e), "err"); }
  });
  $("aicKeyGo").addEventListener("click", () => {
    setAiSecret($("aicKey").value, $("aicRemember").checked);
    aiCfg.key.model = $("aicKeyModel").value.trim(); aiCfg.key.base = $("aicKeyBase").value.trim(); saveAiCfg();
    aicUseAfterTest("key", "aicKeyOut", $("aicKeyGo"));
  });
  $("aicKeyForget").addEventListener("click", () => {
    setAiSecret("", false); $("aicKey").value = "";
    if (aiCfg.engine === "key") setAiEngine("auto"); else refreshSample();
    aicMsg("aicKeyOut", "Key removed from this browser.", "ok"); aicSync();
  });
  // Test whatever is in use now
  $("aicTestNow").addEventListener("click", async () => {
    const btn = $("aicTestNow"), e = aiCfg.engine;
    btn.disabled = true; aicMsg("aicTestNowOut", "Testing…");
    try {
      if (USER_ENGINES.has(e) && aiUsable(e)) { const r = await testAi(e); aicMsg("aicTestNowOut", `Working: "${r.text}" (${(r.ms / 1000).toFixed(1)} s).`, "ok"); }
      else if ((e === "auto" || e === "chrome") && (await chromeAIRaw()) === "available") { aicMsg("aicTestNowOut", "Chrome's AI is ready on this computer.", "ok"); }
      else if (claudeSample) { const d = await claudeSample.json(`Reply with only this JSON, with a short greeting for a job seeker named Sam: {"greeting": "..."}`, { cache: false }); aicMsg("aicTestNowOut", `Working: "${String(d && d.greeting || "").slice(0, 120)}" (Claude).`, "ok"); }
      else aicMsg("aicTestNowOut", "No AI is reachable here yet, so built-in templates fill in. Choose one below.", "err");
    } catch (err) { aicMsg("aicTestNowOut", aiErrWords(err), "err"); }
    finally { btn.disabled = false; }
  });
}

/* --- Home: the landing page --- */
function renderLanding() {
  const stairs = $("lpStairs");
  if (stairs) {
    const cur = aicTierOf(aiCfg.engine);
    // every bar sits on the same baseline, and the labels line up underneath, however long they are
    stairs.innerHTML = AIC_TIERS.map((t, i) => `<li class="lp-stair${t.rec ? " rec" : ""}${t.id === cur ? " on" : ""}" style="--h:${i + 1}">
      <a href="#connect" data-tier="${t.id}"><span class="lp-stair-col"><span class="lp-stair-bar"><span class="lp-stair-n">${i + 1}</span>${t.id === cur ? '<em class="lp-stair-now">In use</em>' : ""}</span></span>
      <span class="lp-stair-text"><b>${esc(t.short)}</b><small>${esc(t.rec || (t.id === "site" && claudeSample ? "Included in Claude" : "The strongest, nothing to set up"))}</small><span class="lp-stair-meta">${esc(t.id === "site" && claudeSample ? "Ready now" : t.meta)}</span></span></a>
    </li>`).join("");
  }
  const d = aicDescribe();
  const now = $("lpNow");
  if (now) now.textContent = `Writing with: ${d.name}.`;
  const nm = $("lpAiName");
  if (nm) nm.textContent = aiCfg.engine === "auto" ? (claudeSample ? "Claude" : "your AI") : AI_NAME();
}
onInit(() => {
  viewHooks.connect = () => renderConnect();
  const prevHome = viewHooks.home;
  viewHooks.home = o => { renderLanding(); if (prevHome) prevHome(o); };
  aiChangeListeners.add(() => { renderLanding(); renderAiChip(); if (currentView === "connect") aicSync(); });
  const st = $("lpStairs");
  if (st) st.addEventListener("click", e => { const a = e.target.closest("[data-tier]"); if (!a) return; e.preventDefault(); openView("connect"); requestAnimationFrame(() => { const el = $("tier-" + a.dataset.tier); if (el) el.scrollIntoView({ block: "start" }); }); });
  const emp = $("lpEmployer");
  if (emp) emp.addEventListener("click", () => setMode("employer", true));
  // a model getting ready anywhere else in the app: the corner card shows the step and the time left
  aiProgressListeners.add((f, t, st) => {
    if (currentView === "connect" && aicBusy.now) return;
    aiCorner(st.phase === "ready" ? { title: "Your AI is ready", sub: AI_NAME(), frac: 1, done: true } : { title: st.title, sub: st.detail, frac: st.f });
  });
  // already downloaded? get it ready while the person looks around
  setTimeout(() => { aiWarmUp(); }, 2500);
});

/* --- The sidebar chip says which AI is writing, and opens Connect your AI --- */
async function renderAiChip() {
  const chip = $("aiChip"), txt = $("aiChipText");
  if (!chip) return;
  const e = aiCfg.engine;
  let mode;
  if (USER_ENGINES.has(e) && aiUsable(e)) mode = "byo";
  else {
    const st = aiChromeAllowed() ? await chromeAIRaw() : "absent";
    mode = st === "available" ? "chrome" : (st === "downloadable" || st === "downloading") ? "chrome-dl" : sample ? "claude" : "none";
  }
  chip.dataset.ai = mode;
  txt.textContent = mode === "byo" ? `AI: ${AI_NAME()}` : mode === "chrome" ? "AI: Chrome, on this device" : mode === "chrome-dl" ? "AI: Chrome (model downloads on first use)" : mode === "claude" ? "AI: Claude on your account" : "AI: none yet. Connect one";
  chip.title = "Choose which AI does the writing";
}
$("aiChip").removeAttribute("aria-haspopup");
$("aiChip").addEventListener("click", () => openView("connect"));
onInit(() => {
  aiChangeListeners.add(() => {
    try { if (els.aiBtn) { if (sample) { els.aiBtn.disabled = false; resetAI(); } else { els.aiBtn.disabled = true; els.aiStatus.textContent = "AI suggestions need an AI. Choose one in Connect your AI. The keyword scan above works without it."; } } } catch { /* scanner not ready */ }
  });
});

