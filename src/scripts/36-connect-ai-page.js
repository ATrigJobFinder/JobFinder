/* ===================== Choose your AI: the page, and the landing page on Home ===================== */
// Two ways, from free and private to the strongest writing. With nothing connected, built-in rules still fill in.
const AIC_TIERS = [
  { id: "browser", engine: "webllm", title: "AI in your browser", short: "In your browser", q: 3, cost: "Free", privacy: "Stays on this computer", setup: "One-time download (0.5 to 4.5 GB), or none if your browser has AI built in", rec: "Best free and private", meta: "Free · private" },
  { id: "key", engine: "key", title: "Bring your own key", short: "Your own key", q: 4, cost: "Free (Gemini, Mistral, Groq and more) or pay per use", privacy: "Sent to the company you choose", setup: "About 2 minutes", rec: "Best results for most people", meta: "Free or pay per use" }
];
// For now Google Gemini is the only AI that can be connected. The others are greyed out, not removed:
// set AIC_ONLY to "" to open them all up again.
const AIC_ONLY = "gemini";
const aicAllowedProv = k => !AIC_ONLY || k === AIC_ONLY;
const aicAllowedTier = id => !AIC_ONLY || id === "key";
const AIC_OFF_WORDS = "Not available yet";
const aicTierOf = e => e === "webllm" || e === "tfjs" || e === "chrome" ? "browser" : e;
const aicMeter = (q, label) => `<span class="aic-meter" role="img" aria-label="${label || `Writing quality ${q} out of 5`}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= q ? "on" : ""}"></i>`).join("")}</span>`;
let aicRendered = false;
const aicBusy = { now: null };

function aicDescribe() {
  const e = aiCfg.engine;
  const name = e === "off" ? "Disconnected: built-in templates only (no AI)"
    : e === "auto" ? `Automatic: ${BROWSER_AI()} if it's ready, otherwise built-in templates (no AI)`
    : e === "chrome" ? BROWSER_AI()
    : e === "webllm" ? `${(WEBLLM_MODELS.find(m => m.id === aiCfg.webllmModel) || {}).name || "A model"} in your browser (WebLLM)`
    : e === "tfjs" ? `${(TFJS_MODELS.find(m => m.id === aiCfg.tfjsModel) || {}).name || "A model"} in your browser (Transformers.js)`
    : `${aiCfg.key.model || "A model"} with ${aiCfg.key.provider === "custom" ? "your AI" : "your " + aiProvider().short} key`;
  let why = "";
  if (USER_ENGINES.has(e) && !aiUsable(e)) why = "Not finished setting up, so Job Finder is using built-in templates for now.";
  else if (USER_ENGINES.has(e)) why = "If it fails, built-in templates take over.";
  return { name, why };
}
// Roughly how long things take with an in-browser model, from its measured (or typical) speed
const AIC_JOBS = [["summary", 2400, 420], ["bullets", 2800, 650], ["cover letter", 7000, 1500]];
function aicSpeedText(kind, m) {
  const sp = aiSpeed(kind, m.id), wps = Math.max(1, Math.round(sp.dec * 0.75));
  const t = AIC_JOBS.map(([, pc, oc]) => fmtDur(aiEstimate(kind, m.id, pc, oc)));
  return `${sp.measured ? "On this computer" : "On a typical laptop"} it writes about ${wps} words a second: a summary takes about ${t[0]}, bullet points about ${t[1]} and a cover letter about ${t[2]}.`;
}
const aicModelOpt = (kind, m) => `<label class="aic-opt"><input type="radio" name="${kind === "tfjs" ? "aicTfjs" : "aicWebllm"}" value="${esc(m.id)}"><span><b>${esc(m.name)}${m.pick ? ' <em class="aic-pick">Suggested</em>' : ""}</b><small>${esc(m.size)}, one-time download (about ${esc(dlTime(m))}). ${esc(m.note)}</small></span></label>`;

const aicProvOpt = ([k, p]) => { const off = !aicAllowedProv(k); return `<label class="aic-prov${off ? " aic-prov--off" : ""}"><input type="radio" name="aicProv" value="${k}"${off ? " disabled" : ""}><span><b>${esc(p.name)}</b><small>${off ? AIC_OFF_WORDS : k === "custom" ? "Any compatible service" : p.free ? "Free tier, no card" : "Pay per use"}</small></span></label>`; };
function aicSetupHtml(t) {
  if (t.id === "browser") return `<fieldset class="aic-libs"><legend>Choose how</legend>
      <label class="aic-opt"><input type="radio" name="aicLib" value="chrome" id="aicLibChrome"><span><b id="aicBuiltInName">${esc(BROWSER_AI())}</b><small>Nothing to download if your browser already has one. Quick, but weaker at long writing like cover letters.</small><small class="aic-env" id="aicChromeState">Checking your browser…</small></span></label>
      <label class="aic-opt"><input type="radio" name="aicLib" value="webllm" id="aicLibWebllm"><span><b>WebLLM <em class="aic-pick">Best writing</em></b><small>One-time download of a stronger model. Needs WebGPU (Chrome or Edge on a computer, or Safari 26).</small></span></label>
      <label class="aic-opt"><input type="radio" name="aicLib" value="tfjs" id="aicLibTfjs"><span><b>Transformers.js</b><small>One-time download of a small model. Also runs without a strong graphics card, just more slowly.</small></span></label>
    </fieldset>
    <div class="aic-way" id="aicWayChrome" hidden>
      <p class="aic-env" id="aicBuiltInNote"></p>
      <details class="aic-more"><summary>What it needs</summary><ul><li>A recent Chrome or Edge on Windows, macOS, Linux or a Chromebook Plus (not phones)</li><li>About 22 GB of free disk space, and a graphics card with more than 4 GB of memory or 16 GB of RAM</li><li>Job Finder opened as its own website</li></ul></details>
      <div class="aic-act"><button class="btn primary" type="button" id="aicChromeGo">Test and use ${esc(BROWSER_AI())}</button><p class="aic-msg small" id="aicChromeOut" role="status"></p></div>
    </div>
    <div class="aic-way" id="aicWayDownload">
      <p class="aic-env" id="aicGpu"></p>
      <fieldset class="aic-models" id="aicModelsWebllm"><legend>WebLLM model</legend>${WEBLLM_MODELS.map(m => aicModelOpt("webllm", m)).join("")}</fieldset>
      <fieldset class="aic-models" id="aicModelsTfjs" hidden><legend>Transformers.js model</legend>${TFJS_MODELS.map(m => aicModelOpt("tfjs", m)).join("")}</fieldset>
      <p class="aic-eta" id="aicEta"></p>
      <div class="aic-dl" id="aicDlBox" hidden><p class="aic-dl-k" id="aicDlPhase"></p><div class="bar"><i id="aicDlBar" style="width:0%"></i></div><p class="small muted" id="aicDlText"></p></div>
      <div class="aic-act"><button class="btn primary" type="button" id="aicBrowserGo">Download, test and use</button><p class="aic-msg small" id="aicBrowserOut" role="status"></p></div>
      <p class="small muted">One-time download: your browser keeps it, and you can keep using Job Finder while it downloads. The model only changes once the test passes.</p>
    </div>`;
  if (t.id === "key") return `${AIC_ONLY && AI_PROVIDERS[AIC_ONLY] ? `<p class="aic-note aic-onlynote">For now, ${esc(AI_PROVIDERS[AIC_ONLY].name)} is the only AI you can connect. The others are coming back soon.</p>` : ""}<div class="aic-provgroups">
    <fieldset class="aic-provs"><legend>Free</legend>${Object.entries(AI_PROVIDERS).filter(([, p]) => p.free).map(aicProvOpt).join("")}</fieldset>
    <fieldset class="aic-provs"><legend>Pay per use</legend>${Object.entries(AI_PROVIDERS).filter(([, p]) => !p.free).map(aicProvOpt).join("")}</fieldset></div>
    <p class="aic-note aic-provnote" id="aicProvNote"></p>
    <ol class="aic-steps" id="aicKeySteps"></ol>
    <div id="aicGeminiGuide" hidden></div>
    <div class="aic-grid">
      <label class="field" id="aicBaseWrap" hidden>Address (ends in /v1)<input type="text" id="aicKeyBase" spellcheck="false" autocomplete="off" placeholder="https://api.example.com/v1"></label>
      <label class="field">API key<span class="aic-inline"><input type="text" id="aicKey" class="secret-mask" name="ai-service-token" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" data-lpignore="true" data-1p-ignore data-bwignore="true" data-form-type="other" placeholder="Paste your key"><button class="btn" type="button" id="aicKeyShow" aria-pressed="false">Show</button></span></label>
      <label class="field" id="aicModelWrap">Model<span class="aic-inline"><input type="text" id="aicKeyModel" list="aicKeyList" spellcheck="false" autocomplete="off"><button class="btn" type="button" id="aicKeyLoad">Load models</button></span><datalist id="aicKeyList"></datalist></label>
      <p class="aic-note" id="aicTierNote" hidden>You don't pick a Gemini model: Job Finder chooses for each job. <b>Gemini 3.5 Flash-Lite</b> does the quick work (bullet points and fixing one sentence). A stronger Gemini model writes full letters and rewords whole paragraphs, and checks the whole letter. If a model is busy or over its limit, the next version down is tried automatically.</p>
    </div>
    <label class="aic-check"><input type="checkbox" id="aicRemember"> Remember my key on this device (otherwise it's forgotten when you close the tab)</label>
    <div class="aic-act"><button class="btn primary" type="button" id="aicKeyGo">Test and use</button><button class="btn ghost" type="button" id="aicKeyForget">Remove key</button><p class="aic-msg small" id="aicKeyOut" role="status"></p></div>
    <p class="small muted">Your key is kept in this browser only and sent straight to the company you chose. Job Finder never stores it. The model only changes once the test passes.</p>
    <details class="aic-priv" id="aicPriv"><summary><b>Privacy safeguard</b>: your contact details are never sent to the AI (always on)</summary>
      <p class="small">Before anything goes to the company you chose, Job Finder takes out your <b>email address, phone number, street address, LinkedIn and website links, name, ID numbers (TFN, Medicare, passport) and date of birth</b>, and swaps each for a label such as <code>[EMAIL_1]</code>. The labels are put back into the answer on this computer, so your letter still has your real details and the company never sees them.</p>
      <p class="small">A second, separate check then looks for the details saved in your profile in what is about to be sent. If one is still there, the request is stopped and nothing is sent.</p>
      <p class="small muted"><b>Still sent:</b> your work history, study and skills, the job ad, and what you type into the writing boxes, because the AI needs them to write. Details you type in those boxes are cleaned the same way, but only the kinds listed above. A name you haven't saved in your profile can't be spotted.</p>
      <p class="small muted">The AI in your browser (WebLLM, Transformers.js) and your browser's built-in AI run on this computer and send nothing at all.</p>
      <p class="small aic-priv-stats" id="aicPrivStats" role="status"></p>
      <div class="aic-act"><button class="btn" type="button" id="aicPrivShow">See exactly what would be sent</button></div>
      <div id="aicPrivOut" hidden></div>
    </details>`;
  return "";
}

function renderConnect() {
  const list = $("aicLadder");
  if (!list) return;
  if (!aicRendered) {
    list.innerHTML = AIC_TIERS.map((t, i) => `<li class="aic-tier${t.rec ? " rec" : ""}${aicAllowedTier(t.id) ? "" : " aic-tier--off"}" id="tier-${t.id}" data-tier="${t.id}">
      <div class="aic-rung" aria-hidden="true"><span class="aic-n">${i + 1}</span></div>
      <article class="aic-card" aria-labelledby="aicT-${t.id}">
        <header class="aic-th"><div class="aic-tt"><h2 id="aicT-${t.id}">${esc(t.title)}</h2>${t.rec ? `<span class="aic-rec">${esc(t.rec)}</span>` : ""}</div><span class="aic-state" data-state></span></header>
        <dl class="aic-facts">
          <div><dt>Writing</dt><dd>${aicMeter(t.q)}</dd></div>
          <div><dt>Cost</dt><dd>${esc(t.cost)}</dd></div>
          <div><dt>Privacy</dt><dd>${esc(t.privacy)}</dd></div>
          <div><dt>Setup</dt><dd>${esc(t.setup)}</dd></div>
        </dl>
        <div class="aic-setup" data-setup="${t.id}"${aicAllowedTier(t.id) ? "" : " inert"}>${aicSetupHtml(t)}</div>
      </article>
    </li>`).join("");
    aicRendered = true;
    aicWire();
  }
  aicFill();
  aicSync();
  aiPrivRefresh();
}
const aicLibNow = () => (document.querySelector('input[name="aicLib"]:checked') || {}).value || "webllm";
// What is picked in the form but not tested yet. None of it changes the saved choice until its test passes.
const aicModelNow = lib => (document.querySelector(`input[name="${lib === "tfjs" ? "aicTfjs" : "aicWebllm"}"]:checked`) || {}).value || (lib === "tfjs" ? aiCfg.tfjsModel : aiCfg.webllmModel);
const aicProvNow = () => { const k = (document.querySelector('input[name="aicProv"]:checked') || {}).value || aiCfg.key.provider; return aicAllowedProv(k) ? k : AIC_ONLY; };
const aicSecretStored = () => { try { return !!localStorage.getItem(AI_SECRET_KEY); } catch { return false; } };
// Show the part for the chosen way: the browser's own AI, or a model to download
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
  const m = browserModel(lib, aicModelNow(lib)), el = $("aicEta");
  if (!m || !el) return;
  const busy = aiLocal.loading && aiLocal.model === m.id, ready = aiLocal.engine && aiLocal.model === m.id;
  el.textContent = ready ? `${m.name} is ready on this computer.` : busy ? "" : `${m.name}: ${m.size}, a one-time download (about ${dlTime(m)} on a typical 50 Mbps connection).`;
  $("aicBrowserGo").textContent = ready ? "Test and use" : "Download, test and use";
}
// Put the saved choices into the form
function aicFill() {
  const lib = aiCfg.engine === "tfjs" ? "tfjs" : aiCfg.engine === "chrome" ? "chrome" : "webllm";
  const r = $("aicLib" + lib[0].toUpperCase() + lib.slice(1)); if (r) r.checked = true;
  document.querySelectorAll('input[name="aicWebllm"]').forEach(i => { i.checked = i.value === aiCfg.webllmModel; });
  document.querySelectorAll('input[name="aicTfjs"]').forEach(i => { i.checked = i.value === aiCfg.tfjsModel; });
  // (a key saved for an AI that is switched off isn't shown here: the form starts on the allowed one)
  const prov = aicAllowedProv(aiCfg.key.provider) ? aiCfg.key.provider : AIC_ONLY, same = prov === aiCfg.key.provider;
  document.querySelectorAll('input[name="aicProv"]').forEach(i => { i.checked = i.value === prov; });
  $("aicKey").value = same ? aiSecret() : ""; $("aicKeyModel").value = same ? aiCfg.key.model : (AI_PROVIDERS[prov].model || ""); $("aicKeyBase").value = same ? aiCfg.key.base || "" : "";
  $("aicRemember").checked = aiCfg.key.remember !== false;
  aicShowWay();
  aicProvInfo();
}
function aicProvInfo(k = aicProvNow()) {
  const p = AI_PROVIDERS[k] || AI_PROVIDERS.custom;
  $("aicBaseWrap").hidden = k !== "custom";
  // Gemini: the model is chosen by the job, not by the person (and the test always starts from the best one)
  const auto = k === "gemini";
  // Gemini: a picture guide to getting the key replaces the three short steps
  const gg = $("aicGeminiGuide"); if (gg) { if (auto && !gg.dataset.built) { gg.innerHTML = geminiGuideHtml(); gg.dataset.built = "1"; } gg.hidden = !auto; }
  $("aicKeySteps").hidden = auto;
  $("aicModelWrap").hidden = auto; $("aicTierNote").hidden = !auto;
  $("aicProvNote").textContent = p.note || "";
  $("aicKeySteps").innerHTML = k === "custom" ? `<li>Copy the service's API address and a key from its website.</li><li>Paste both below, then load or type a model name.</li><li>Select Test and use.</li>`
    : `<li>Get a key at <a href="${esc(p.keyUrl)}" target="_blank" rel="noopener">${esc(p.keyWhere)}</a>${p.free ? " (free, sign in with your account)" : ""}.</li><li>Paste it below.${p.model ? ` The model is filled in for you.` : ` Then select Load models and pick one${k === "openrouter" ? " ending in :free" : ""}.`}</li><li>Select Test and use.</li>`;
}
function aicMsg(id, text, kind) { const el = $(id); if (!el) return; el.textContent = text || ""; el.className = "aic-msg small" + (kind ? " " + kind : ""); }
// Several short lines in one message: the first is the main point, the rest are smaller
function aicMsgLines(id, lines, kind) {
  const el = $(id); if (!el) return;
  el.className = "aic-msg small" + (kind ? " " + kind : ""); el.textContent = "";
  for (const l of lines) { const sp = document.createElement("span"); sp.className = "aic-line" + (l.main ? " main" : ""); sp.textContent = l.text; el.appendChild(sp); }
}
async function aicSync() {
  if (!aicRendered) return;
  const cur = aicTierOf(aiCfg.engine);
  document.querySelectorAll(".aic-tier").forEach(li => {
    const on = li.dataset.tier === cur;
    li.classList.toggle("on", on);
    li.querySelector("[data-state]").textContent = on ? (USER_ENGINES.has(aiCfg.engine) && !aiUsable() ? "Chosen, not set up yet" : "In use") : aicAllowedTier(li.dataset.tier) ? "" : AIC_OFF_WORDS;
  });
  const d = aicDescribe();
  $("aicNowName").textContent = d.name; $("aicNowWhy").textContent = d.why;
  const gpu = $("aicGpu");
  if (gpu) { gpu.textContent = navigator.gpu ? "This browser supports WebGPU, so WebLLM and Transformers.js can both run here." : "This browser doesn't have WebGPU, so choose Transformers.js (it runs more slowly without a graphics card)."; gpu.className = "aic-env" + (navigator.gpu ? " ok" : " warn"); }
  aicEta();
  // the browser's own AI, under the browser's real name
  const bn = $("aicBuiltInName"); if (bn) bn.textContent = BROWSER_AI();
  const go = $("aicChromeGo"); if (go && !go.disabled) go.textContent = `Test and use ${BROWSER_AI()}`;
  const ch = $("aicChromeState");
  if (ch) {
    const st = await chromeAIRaw(), nm = BROWSER_INFO.name;
    ch.textContent = st === "available" ? "Ready on this computer."
      : st === "downloadable" || st === "downloading" ? `Supported here. ${nm} downloads its model once, the first time it's used.`
      : BROWSER_INFO.note ? `${BROWSER_INFO.note} Job Finder can only use a built-in AI that ${nm} offers to websites, and this one doesn't. Use WebLLM or Transformers.js instead.`
      : "Not available in this browser or on this page. Use WebLLM or Transformers.js instead.";
    ch.className = "aic-env" + (st === "available" ? " ok" : st === "absent" || st === "unavailable" ? " warn" : "");
    const note = $("aicBuiltInNote"); if (note) note.textContent = (BROWSER_INFO.id === "chrome" || BROWSER_INFO.id === "edge") && BROWSER_INFO.model ? `${nm}'s own model here is ${BROWSER_INFO.model}.` : "";
  }
}
/* A model, key or built-in AI only becomes the one in use after its test passes. If the test fails, what was saved before is put back. */
// Apply the key form to the settings for a test. Returns the function that puts the saved settings back.
function aicTrialKey() {
  const prev = { key: { ...aiCfg.key }, secret: aiSecret(), stored: aicSecretStored() }, k = aiCfg.key;
  k.provider = aicProvNow(); k.model = k.provider === "gemini" ? AI_PROVIDERS.gemini.model : $("aicKeyModel").value.trim(); k.base = $("aicKeyBase").value.trim(); k.remember = $("aicRemember").checked;
  setAiSecret($("aicKey").value, k.remember);
  return () => { aiCfg.key = prev.key; setAiSecret(prev.secret, prev.stored); };
}
async function aicTestKey() {
  if (!aicAllowedProv(aicProvNow())) { aicMsg("aicKeyOut", `${AIC_OFF_WORDS}. Choose ${AI_PROVIDERS[AIC_ONLY].name} for now.`, "err"); return; }
  const btn = $("aicKeyGo"), undo = aicTrialKey();
  if (!aiUsable("key")) { aicMsg("aicKeyOut", !aiSecret() ? "Paste your key first." : "Choose a model first.", "err"); undo(); return; }
  btn.disabled = true; aicMsg("aicKeyOut", "Testing…");
  try {
    // Gemini: the connection is tested with Gemini 3.5 Flash-Lite only (quick and cheap). The key is what is being checked: cover letters are written by the top model.
    if (aiCfg.key.provider === "gemini" && aiProvider().small) {
      const small = aiProvider().small;
      aicMsg("aicKeyOut", `Testing ${geminiName(small)}…`);
      const r = await testAiTimed("key", AI_TEST_SECONDS, "small");
      saveAiCfg(); setAiEngine("key"); $("aicKeyModel").value = aiCfg.key.model;
      aicMsgLines("aicKeyOut", [{ text: `Your Gemini key works: ${geminiName(small)} answered.`, main: true }, { text: `Test reply in ${(r.ms / 1000).toFixed(1)} s: “${r.text}”` }, { text: `Your writing is done by ${geminiName(aiCfg.key.model)}. It is not tested here, and a cover letter is never handed to a smaller model.` }], "ok");
      return;
    }
    const f = await testKeyWithFallback(m => aicMsg("aicKeyOut", `Testing ${m}…`)), r = f.r;
    saveAiCfg(); setAiEngine("key"); $("aicKeyModel").value = f.model;
    aicMsgLines("aicKeyOut", aiFallbackLines(f), "ok");
    // the small model that does the quick jobs is tested too (the first lines stay on screen while it is)
    aicMsg("aicKeyOut", `${f.model} is working. Now testing ${aiProvider().small || "the small model"}…`);
    const sm = await testSmallModel();
    aicMsgLines("aicKeyOut", aiFallbackLines(f, sm), "ok");
  } catch (e) {
    undo();
    if (e && Array.isArray(e.skipped) && e.skipped.length > 1) {
      // every model was tried, one after another: say which, why, and what to do
      aicMsgLines("aicKeyOut", [{ text: `None of the ${e.skipped.length} models answered, so nothing was changed.`, main: true }, { text: `Tried, newest first: ${e.skipped.map(x => `${x.model} (${aiSkipWord(x.code)})`).join(", ")}.` }, { text: aiErrWords(e.first || e) }], "err");
    } else aicMsg("aicKeyOut", `${aiErrWords(e)} Nothing was changed.`, "err");
  }
  finally { btn.disabled = false; aicSync(); }
}
// A short test of the browser's own AI (this also starts its one-time download if it hasn't happened)
async function aicTestBuiltIn() {
  if (!("LanguageModel" in self)) throw aiError("no_builtin", `${BROWSER_INFO.name} doesn't offer a built-in AI to websites. Use WebLLM or Transformers.js instead.`);
  const t0 = Date.now();
  const s = await self.LanguageModel.create({ ...LM_OPTS, monitor(m) { m.addEventListener("downloadprogress", ev => aiDownloadProgress(ev.loaded)); } });
  try { const r = await s.prompt("Reply with one short, friendly greeting for a job seeker named Sam."); return { text: String(r).trim().slice(0, 120), ms: Date.now() - t0 }; }
  finally { try { s.destroy(); } catch { /* already gone */ } }
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
  document.querySelectorAll(".aic-tip [data-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const el = $("tier-" + a.dataset.jump); if (el) { el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); const f = el.querySelector("input, button"); if (f) f.focus({ preventScroll: true }); } }));
  // In the browser
  document.querySelectorAll('input[name="aicLib"]').forEach(i => i.addEventListener("change", aicShowWay));
  document.querySelectorAll('input[name="aicWebllm"], input[name="aicTfjs"]').forEach(i => i.addEventListener("change", aicEta));
  $("aicChromeGo").addEventListener("click", async () => {
    if (!aicAllowedTier("browser")) { aicMsg("aicChromeOut", `${AIC_OFF_WORDS}.`, "err"); return; }
    const btn = $("aicChromeGo"); btn.disabled = true; aicMsg("aicChromeOut", "Testing…");
    try {
      const r = await aicTestBuiltIn();
      setAiEngine("chrome");
      aicMsg("aicChromeOut", `Working. It replied "${r.text}" in ${(r.ms / 1000).toFixed(1)} seconds, and is now doing your writing.`, "ok");
    } catch (e) { aicMsg("aicChromeOut", `${e && e.code === "no_builtin" ? e.message : aiErrWords(e)} Nothing was changed.`, "err"); }
    finally { btn.disabled = false; aicSync(); }
  });
  $("aicBrowserGo").addEventListener("click", async () => {
    if (!aicAllowedTier("browser")) { aicMsg("aicBrowserOut", `${AIC_OFF_WORDS}.`, "err"); return; }
    const lib = aicLibNow() === "tfjs" ? "tfjs" : "webllm", field = lib === "tfjs" ? "tfjsModel" : "webllmModel", model = aicModelNow(lib), prev = aiCfg[field];
    const btn = $("aicBrowserGo"); btn.disabled = true; aicBusy.now = lib;
    $("aicEta").textContent = "";
    aicMsg("aicBrowserOut", "Starting…");
    try {
      await loadBrowserModel(lib, model, aicShowLoad);
      aicMsg("aicBrowserOut", "Ready. Checking it works…");
      aiCfg[field] = model;   // only for the test; put back below if it fails
      const r = await testAi(lib);
      saveAiCfg(); setAiEngine(lib);
      const m = browserModel(lib, model);
      aicMsg("aicBrowserOut", `Ready, and now doing your writing. It replied "${r.text}". ${m ? aicSpeedText(lib, m) : ""}`, "ok");
    } catch (e) { aiCfg[field] = prev; aicMsg("aicBrowserOut", `${aiErrWords(e)} Nothing was changed.`, "err"); $("aicDlBox").hidden = true; }
    finally { btn.disabled = false; aicBusy.now = null; aicSync(); }
  });
  // Your own key: picking a company or typing a model changes the form only, not the saved choice
  document.querySelectorAll('input[name="aicProv"]').forEach(i => i.addEventListener("change", () => {
    $("aicKeyModel").value = AI_PROVIDERS[i.value].model || ""; $("aicKeyList").innerHTML = ""; aicProvInfo(i.value); aicMsg("aicKeyOut", "");
    if (i.value === "openrouter") $("aicKeyLoad").click();
  }));
  // The key is hidden with CSS rather than type="password", so the browser doesn't offer to save it as a password.
  // (A browser that can't hide text with CSS falls back to a password box that asks not to be saved.)
  const keyBox = $("aicKey"), cssHides = !!(window.CSS && CSS.supports && (CSS.supports("-webkit-text-security", "disc") || CSS.supports("text-security", "disc")));
  if (!cssHides) { keyBox.type = "password"; keyBox.classList.remove("secret-mask"); keyBox.autocomplete = "new-password"; }
  const keyShown = () => cssHides ? !keyBox.classList.contains("secret-mask") : keyBox.type === "text";
  $("aicKeyShow").addEventListener("click", e => { const show = !keyShown(); if (cssHides) keyBox.classList.toggle("secret-mask", !show); else keyBox.type = show ? "text" : "password"; e.target.textContent = show ? "Hide" : "Show"; e.target.setAttribute("aria-pressed", String(show)); });
  $("aicKeyLoad").addEventListener("click", async () => {
    const undo = aicTrialKey();
    aicMsg("aicKeyOut", "Loading models…");
    try {
      const ids = await aiListModels();
      $("aicKeyList").innerHTML = ids.map(i => `<option value="${esc(i)}">`).join("");
      if (ids.length && !ids.includes($("aicKeyModel").value.trim())) $("aicKeyModel").value = ids[0];
      aicMsg("aicKeyOut", ids.length ? `${ids.length} models found. Pick one from the Model box, or keep the one shown. Then select Test and use.` : "No models came back. Type a model name instead.", ids.length ? "ok" : "err");
    } catch (e) { aicMsg("aicKeyOut", aiErrWords(e), "err"); }
    finally { undo(); }
  });
  $("aicKeyGo").addEventListener("click", aicTestKey);
  // The safeguard, shown: your own resume text as the AI would receive it, with the details swapped for labels
  $("aicPrivShow").addEventListener("click", () => {
    const out = $("aicPrivOut"), r = aiPrivacyPreview();
    out.hidden = false;
    out.innerHTML = `<p class="small">${r.own ? "This is your resume text as it would be sent." : "You haven't filled in your profile yet, so this is a made-up example."} <b>${r.removed}</b> detail${r.removed === 1 ? " was" : "s were"} taken out${r.removed ? ` (${esc(privKindsText(r.kinds))})` : ""}. Your real details stay here.</p><pre class="aic-priv-pre">${esc(r.text)}</pre>`;
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
      if (e === "key" && aiUsable(e) && aiCfg.key.provider === "gemini" && aiProvider().small) {
        // Gemini is tested with Gemini 3.5 Flash-Lite only; the model that writes is left as it is
        const small = aiProvider().small, r = await testAiTimed("key", AI_TEST_SECONDS, "small");
        aicMsg("aicTestNowOut", `Working: ${geminiName(small)} answered "${r.text}" in ${(r.ms / 1000).toFixed(1)} s.`, "ok");
      }
      else if (e === "key" && aiUsable(e)) {
        const was = aiCfg.key.model;
        try { const f = await testKeyWithFallback(m => aicMsg("aicTestNowOut", `Testing ${m}…`)); if (f.model !== was) { saveAiCfg(); const el = $("aicKeyModel"); if (el) el.value = f.model; } aicMsgLines("aicTestNowOut", aiFallbackLines(f), "ok"); }
        catch (err) { aiCfg.key.model = was; throw err; }
      }
      else if (USER_ENGINES.has(e) && aiUsable(e)) { const r = await testAi(e); aicMsg("aicTestNowOut", `Working: "${r.text}" (${(r.ms / 1000).toFixed(1)} s).`, "ok"); }
      else if ((e === "auto" || e === "chrome") && (await chromeAIRaw()) === "available") { aicMsg("aicTestNowOut", `${BROWSER_AI()} is ready on this computer.`, "ok"); }
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
      <span class="lp-stair-text"><b>${esc(t.short)}</b><small>${esc(t.rec || "The strongest, nothing to set up")}</small><span class="lp-stair-meta">${esc(t.meta)}</span></span></a>
    </li>`).join("");
  }
  const d = aicDescribe();
  const now = $("lpNow");
  if (now) now.textContent = `Writing with: ${d.name}.`;
  const nm = $("lpAiName");
  if (nm) nm.textContent = aiCfg.engine === "auto" ? "your AI" : AI_NAME();
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

/* --- The sidebar chip says which AI is writing, and opens Choose your AI --- */
async function renderAiChip() {
  const chip = $("aiChip"), txt = $("aiChipText");
  if (!chip) return;
  const e = aiCfg.engine;
  let mode;
  if (USER_ENGINES.has(e) && aiUsable(e)) mode = "byo";
  else {
    const st = aiChromeAllowed() ? await chromeAIRaw() : "absent";
    mode = st === "available" ? "chrome" : (st === "downloadable" || st === "downloading") ? "chrome-dl" : "none";
  }
  chip.dataset.ai = mode;
  txt.textContent = mode === "byo" ? `AI: ${AI_NAME()}` : mode === "chrome" ? `AI: ${BROWSER_INFO.name}` : mode === "chrome-dl" ? `AI: ${BROWSER_INFO.name} (model downloads on first use)` : "AI: none yet. Choose one";
  chip.title = "Choose which AI does the writing";
  // the same words in the top bar
  const ab = $("abAi"), at = $("abAiText");
  if (ab && at) { ab.dataset.ai = mode; at.textContent = txt.textContent; }
  const x = $("abAiX"); if (x) x.hidden = mode === "none";   // the small red cross, only while an AI is connected
}
// The small red cross on the top bar's AI bubble: asks first, then disconnects (the key is removed from this browser)
function aiDisconnectAsk() {
  let d = $("aiOffDlg");
  if (!d) { d = document.createElement("dialog"); d.id = "aiOffDlg"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "aiOffH"); document.body.appendChild(d); }
  const e = aiCfg.engine, name = $("abAiText") ? $("abAiText").textContent.replace(/^AI:\s*/, "") : "your AI";
  const what = e === "key" ? `Your API key will be removed from this browser, and Job Finder will stop sending anything to ${aiProvider().short === "your AI" ? "that service" : aiProvider().short}.`
    : BROWSER_ENGINES.has(e) ? "Job Finder will stop using the AI model in your browser. The download stays in your browser's storage until you clear it in its settings."
    : "Job Finder will stop using the AI that's built into your browser.";
  d.innerHTML = `<form method="dialog" class="jf-dialog-card"><h2 id="aiOffH">Disconnect your AI?</h2><p><b>${esc(name)}</b></p><p class="small muted">${esc(what)} Resumes and letters will use the built-in templates until you connect one again in Choose your AI.</p><div class="b-actions"><button class="btn ghost" value="cancel" type="submit" formnovalidate>Keep it connected</button><button class="btn danger" value="ok">Disconnect</button></div></form>`;
  d.addEventListener("close", () => {
    if (d.returnValue !== "ok") return;
    aiStopAll(); setAiSecret("", false); setAiEngine("off"); renderAiChip(); if (currentView === "connect") aicSync();
    toast("AI disconnected. Choose one again any time in Choose your AI.");
  }, { once: true });
  d.returnValue = ""; d.showModal();
}
$("aiChip").removeAttribute("aria-haspopup");
$("aiChip").addEventListener("click", () => openView("connect"));
$("abAi").addEventListener("click", () => openView("connect"));
// "Connect an AI" from inside a page (the greyed-out AI sections, the "Connect an AI?" question): Choose your AI opens in a pop-up over the page
// you are on, so closing it brings you back to exactly where you were. Resolves to whether an AI is connected when it closes.
let connectDlg = null;
function openConnectPopup() {
  return new Promise(resolve => {
    const view = $("view-connect");
    if (!view || typeof HTMLDialogElement === "undefined" || currentView === "connect") { if (currentView !== "connect") openView("connect"); resolve(false); return; }
    if (connectDlg && connectDlg.open) { resolve(false); return; }
    const home = { parent: view.parentNode, next: view.nextSibling };
    const d = document.createElement("dialog");
    d.className = "jf-dialog aic-dialog"; d.setAttribute("aria-label", "Choose your AI");
    d.innerHTML = `<div class="aic-dlg"><div class="aic-dlg-bar"><span>You're still on your page. Close this when you're done.</span><button class="btn primary" type="button" data-aic-done>Done</button></div><div class="aic-dlg-body"></div></div>`;
    d.querySelector(".aic-dlg-body").appendChild(view);
    document.body.appendChild(d);
    view.hidden = false;
    try { renderConnect(); } catch (err) { console.error(err); }
    d.querySelector("[data-aic-done]").addEventListener("click", () => d.close());
    d.addEventListener("close", async () => {
      view.hidden = true; home.parent.insertBefore(view, home.next); d.remove(); connectDlg = null;
      if (typeof aiGateRefresh === "function") await aiGateRefresh();   // (the greyed-out sections follow what was chosen)
      resolve(await aiIsConnected());
    }, { once: true });
    connectDlg = d; d.showModal();
  });
}
$("abAiX").addEventListener("click", aiDisconnectAsk);
onInit(() => {
  aiChangeListeners.add(() => {
  });
});

