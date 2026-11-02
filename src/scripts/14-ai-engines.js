/* ===================== Connect your own AI (v12) ===================== */
// The person chooses which AI does the writing. Every engine answers through the same
// sample.json() interface the tools already use, so every answer still goes through
// factCheck / honest() / the guards before anyone sees it.
//   chrome : Chrome's built-in model (Gemini Nano), then Claude if the page is in Claude
//   webllm : an open model downloaded into the browser with WebLLM (WebGPU)
//   tfjs   : a small open model downloaded into the browser with Transformers.js
//   key    : the person's own API key (Gemini, OpenRouter, Groq, Claude, OpenAI or other)
//   claude : Claude through the site (on claude.ai: the viewer's own account)
//   auto   : Chrome's model if it's ready, otherwise Claude through the site
// chrome, webllm and tfjs are small models, so they get the short one-job-at-a-time prompts
// (see withChromeAI and the *_NANO prompts). With no AI at all, built-in rules fill in.
let claudeSample = null;
const AI_CFG_KEY = "jobfinder.ai.v1", AI_SECRET_KEY = "jobfinder.aikey.v1";
const WEBLLM_URL = "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm";
const TFJS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm";
// bytes: the download; tps: a rough writing speed (tokens a second) on a typical laptop, until it's measured
const WEBLLM_MODELS = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen 2.5 1.5B", size: "about 1 GB", bytes: 1.0e9, tps: 22, gpu: "2 GB of graphics memory", note: "Quick to download and quickest to write. Fine for short wording jobs." },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", name: "Llama 3.2 3B", size: "about 1.8 GB", bytes: 1.8e9, tps: 12, gpu: "2.5 GB of graphics memory", note: "The best balance for most laptops.", pick: true },
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", name: "Qwen 2.5 7B", size: "about 4.5 GB", bytes: 4.5e9, tps: 5, gpu: "5 GB of graphics memory", note: "Clearly the best writer here, but slow without a gaming or recent Apple Silicon computer." }
];
const TFJS_MODELS = [
  { id: "onnx-community/Qwen3-0.6B-ONNX", name: "Qwen3 0.6B", size: "about 0.5 GB", bytes: 0.55e9, tps: 15, note: "Tiny and quick. Runs on most computers, even without a strong graphics card.", pick: true },
  { id: "onnx-community/Llama-3.2-1B-Instruct", name: "Llama 3.2 1B", size: "about 1 GB", bytes: 1.0e9, tps: 8, note: "A little better wording, a little slower." }
];
const browserModel = (kind, id) => (kind === "tfjs" ? TFJS_MODELS : WEBLLM_MODELS).find(m => m.id === id) || null;
const AI_PROVIDERS = {
  gemini: { name: "Google Gemini", short: "Gemini", kind: "openai", base: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.5-flash-lite", free: true, keyUrl: "https://aistudio.google.com/apikey", keyWhere: "Google AI Studio", note: "Free tier with no card. On the free tier Google may use what you send to improve its products, so it suits people happy with that." },
  openrouter: { name: "OpenRouter", short: "OpenRouter", kind: "openai", base: "https://openrouter.ai/api/v1", model: "", free: true, keyUrl: "https://openrouter.ai/keys", keyWhere: "openrouter.ai", note: "One key for many models. Models ending in :free cost nothing, with a limit of about 50 requests a day (1,000 a day once you've ever bought US$10 of credits)." },
  groq: { name: "Groq", short: "Groq", kind: "openai", base: "https://api.groq.com/openai/v1", model: "", free: true, keyUrl: "https://console.groq.com/keys", keyWhere: "console.groq.com", note: "Very fast open models with a free tier that has daily limits." },
  claude: { name: "Claude (Anthropic API)", short: "Claude", kind: "anthropic", base: "https://api.anthropic.com/v1", model: "claude-haiku-5-5", free: false, keyUrl: "https://console.anthropic.com/settings/keys", keyWhere: "the Claude Console", note: "Paid per use, separate from a Claude.ai subscription. The strongest writing here. Set a monthly spend limit in the Console." },
  openai: { name: "OpenAI", short: "OpenAI", kind: "openai", base: "https://api.openai.com/v1", model: "", free: false, keyUrl: "https://platform.openai.com/api-keys", keyWhere: "platform.openai.com", note: "Paid per use. Set a monthly budget in your OpenAI settings." },
  custom: { name: "Other (OpenAI-compatible)", short: "your AI", kind: "openai", base: "", model: "", free: false, note: "Any service with an OpenAI-style /chat/completions address, such as Mistral, Together or DeepSeek." }
};
const AI_ENGINES = ["auto", "chrome", "webllm", "tfjs", "key", "claude"];
const USER_ENGINES = new Set(["webllm", "tfjs", "key"]);
const BROWSER_ENGINES = new Set(["webllm", "tfjs"]);
const aiDefaultCfg = () => ({ engine: "auto", webllmModel: WEBLLM_MODELS.find(m => m.pick).id, tfjsModel: TFJS_MODELS.find(m => m.pick).id, key: { provider: "gemini", model: AI_PROVIDERS.gemini.model, base: "", remember: true, size: "auto" }, fallback: true, speed: {} });
function loadAiCfg() {
  const d = aiDefaultCfg();
  try {
    const s = JSON.parse(localStorage.getItem(AI_CFG_KEY) || "null");
    // older choices that are gone now ("rules", "local") go back to automatic
    if (s && typeof s === "object") { delete s.local; return { ...d, ...s, key: { ...d.key, ...(s.key || {}) }, speed: s.speed && typeof s.speed === "object" ? s.speed : {}, engine: AI_ENGINES.includes(s.engine) ? s.engine : "auto" }; }
  } catch { /* storage blocked */ }
  return d;
}
let aiCfg = loadAiCfg();
let aiSecretMem = "";
function aiSecret() {
  if (aiSecretMem) return aiSecretMem;
  try { aiSecretMem = localStorage.getItem(AI_SECRET_KEY) || sessionStorage.getItem(AI_SECRET_KEY) || ""; } catch { /* blocked */ }
  return aiSecretMem;
}
// The key stays in this browser only. It is never written to the shared database.
function setAiSecret(k, remember) {
  aiSecretMem = String(k || "").trim();
  const bn = document.getElementById("aiKeyBanner"); if (bn) bn.hidden = true;   // a new key clears the "key refused" notice
  try { localStorage.removeItem(AI_SECRET_KEY); } catch { /* blocked */ }
  try { sessionStorage.removeItem(AI_SECRET_KEY); } catch { /* blocked */ }
  if (!aiSecretMem) return;
  try { (remember ? localStorage : sessionStorage).setItem(AI_SECRET_KEY, aiSecretMem); } catch { /* kept for this visit only */ }
}
function saveAiCfg() { try { localStorage.setItem(AI_CFG_KEY, JSON.stringify(aiCfg)); } catch { /* storage blocked */ } }
const aiInClaude = () => !!(window.claude && window.claude.use);
const aiProvider = () => AI_PROVIDERS[aiCfg.key.provider] || AI_PROVIDERS.custom;
const aiKeyBase = () => (aiCfg.key.provider === "custom" ? aiCfg.key.base : aiProvider().base || aiCfg.key.base || "").replace(/\/+$/, "");
function aiUsable(e = aiCfg.engine) {
  if (e === "webllm" || e === "tfjs") return true;
  if (e === "key") return !!(aiSecret() && aiCfg.key.model && aiKeyBase());
  return false;
}
/* --- How big is the chosen model? Small ones get short prompts, one job at a time, and tight answers; large ones get fuller prompts. --- */
// Words and sizes in a model name that mean "small": nano, mini, lite, instant, or 14 billion parameters and under (not 70b, 405b)
const SMALL_MODEL_RE = /(^|[^a-z0-9])(nano|mini|micro|tiny|lite|small|instant|phi)([^a-z]|$)|(^|[^0-9.])([0-9]|1[0-4])(\.[0-9])?b([^a-z0-9]|$)/i;
function keyIsSmall() {
  const s = aiCfg.key.size;
  return s === "small" ? true : s === "large" ? false : SMALL_MODEL_RE.test(String(aiCfg.key.model || ""));
}
// "small" | "large" for the AI that will do the writing. Chrome's built-in AI is always small (it only runs the short prompts).
function aiTier() {
  const e = aiCfg.engine;
  if (BROWSER_ENGINES.has(e)) return "small";
  if (e === "key" && aiUsable("key")) return keyIsSmall() ? "small" : "large";
  if (e === "chrome") return "small";
  return "large";
}
const TOKEN_CHARS_EST = 3.8;
// A small model is told to stop sooner: about 1.8 times the length of the answer we expect, never more than 1,200 tokens
const tightMax = expectChars => Math.max(120, Math.min(1200, Math.round(expectChars / TOKEN_CHARS_EST * 1.8) + 60));
// Which name to show next to AI wording ("Written by …")
function AI_NAME(e = aiCfg.engine) {
  if (e === "webllm") return "WebLLM in your browser";
  if (e === "tfjs") return "Transformers.js in your browser";
  if (e === "key") return aiCfg.key.provider === "claude" ? "Claude (your key)" : aiProvider().short;
  return "Claude";
}
const aiChromeAllowed = () => aiCfg.engine === "auto" || aiCfg.engine === "chrome";

function aiError(code, message) { const e = new Error(message || code); e.code = code; return e; }
const AI_ERR_WORDS = {
  no_webgpu: "This browser can't run it: it needs WebGPU (Chrome or Edge on a computer, or Safari 26). Try Transformers.js, which can also run without a graphics card.",
  blocked: "Couldn't reach it. Inside Claude's preview this page can't contact other sites or download models, so this works once Job Finder is opened as its own website. Elsewhere, check your connection.",
  bad_key: "The key was refused. Check it was copied in full and is still active, then enter it again in Connect your AI.",
  bad_request: "The AI service refused the request (error 400). That usually means the API key is wrong, has expired or was pasted with a piece missing. Enter your key again in Connect your AI.",
  rate_limited: "The free limit has been reached for now. Try again later, or use a different option.",
  no_model: "Choose a model first.",
  invalid_json: "The AI answered in the wrong format. Try again, or pick a stronger model.",
  cancelled: "Stopped."
};
// A refused key (400, 401 or 403): a notice with a button that goes straight to the key box
function aiKeyAlert(status) {
  let b = document.getElementById("aiKeyBanner");
  if (!b) { b = document.createElement("div"); b.id = "aiKeyBanner"; b.className = "ai-banner"; b.setAttribute("role", "alert"); document.body.appendChild(b); }
  b.innerHTML = `<p><b>Your AI key was refused (error ${status}).</b> It may be wrong, expired or copied with a piece missing. Enter it again to keep using AI.</p><div class="b-actions"><button class="btn primary" type="button" data-ai-key="fix">Re-enter my key</button><button class="linkish" type="button" data-ai-key="close">Dismiss</button></div>`;
  b.hidden = false;
}
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("[data-ai-key]");
  if (!a) return;
  const b = document.getElementById("aiKeyBanner"); if (b) b.hidden = true;
  if (a.dataset.aiKey !== "fix") return;
  openView("connect");
  setTimeout(() => { const k = document.getElementById("aicKey"); if (k) { k.scrollIntoView({ block: "center" }); k.focus(); k.select(); } }, 150);
});
const aiErrWords = e => AI_ERR_WORDS[e && e.code] || (e && e.message) || "Something went wrong.";

// Pull JSON out of a chatty answer (code fences, <think> blocks, text before or after)
function extractJSON(text) {
  let t = String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* look for the object inside */ }
  const start = t.search(/[{[]/);
  if (start >= 0) {
    const open = t[start], close = open === "{" ? "}" : "]";
    for (let end = t.lastIndexOf(close); end > start; end = t.lastIndexOf(close, end - 1)) {
      try { return JSON.parse(t.slice(start, end + 1)); } catch { /* shorter */ }
    }
  }
  throw aiError("invalid_json");
}
const toMessages = input => typeof input === "string" ? [{ role: "user", content: input }] : (Array.isArray(input) ? input : [{ role: "user", content: String(input) }]).map(m => ({ role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user", content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }));
const JSON_SYSTEM = "You help job seekers with resumes, cover letters and interviews. Follow the user's rules exactly. When asked for JSON, reply with only valid JSON: no markdown, no code fences, no comments.";

async function aiFetch(url, init, signal) {
  let res;
  try { res = await fetch(url, { ...init, signal }); }
  catch (e) { if (e && e.name === "AbortError") throw aiError("cancelled"); throw aiError("blocked"); }
  if (res.status === 400) { aiKeyAlert(400); throw aiError("bad_request"); }
  if (res.status === 401 || res.status === 403) { aiKeyAlert(res.status); throw aiError("bad_key"); }
  if (res.status === 429) throw aiError("rate_limited");
  if (res.status === 402) throw aiError("rate_limited", "Your account has no credit left for this model.");
  if (!res.ok) {
    let msg = ""; try { const j = await res.json(); msg = (j.error && (j.error.message || j.error)) || j.message || ""; } catch { /* no body */ }
    throw aiError("http_" + res.status, `The AI service said: ${String(msg || res.statusText || res.status).slice(0, 200)}`);
  }
  return res.json();
}
// OpenAI-style chat (Gemini, OpenRouter, Groq, OpenAI, others)
async function chatOpenAI(base, key, model, messages, signal, max) {
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const d = await aiFetch(base + "/chat/completions", { method: "POST", headers, body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: max || 2000 }) }, signal);
  const c = d && d.choices && d.choices[0];
  return (c && c.message && c.message.content) || "";
}
// Claude's API, called straight from the browser with the person's own key
async function chatAnthropic(key, model, messages, signal, max) {
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const msgs = messages.filter(m => m.role !== "system");
  const d = await aiFetch(AI_PROVIDERS.claude.base + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model, max_tokens: max || 2000, system: system || undefined, messages: msgs })
  }, signal);
  return ((d && d.content) || []).filter(b => b.type === "text").map(b => b.text).join("");
}
async function aiListModels() {
  const p = aiProvider(), key = aiSecret();
  if (p.kind === "anthropic") {
    if (!key) throw aiError("bad_key");
    const d = await aiFetch(p.base + "/models?limit=50", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" } });
    return ((d && d.data) || []).map(m => m.id);
  }
  const headers = key ? { Authorization: "Bearer " + key } : {};
  const d = await aiFetch(aiKeyBase() + "/models", { headers });
  let ids = ((d && d.data) || (d && d.models) || []).map(m => String(m.id || m.name || "").replace(/^models\//, "")).filter(Boolean);
  if (aiCfg.key.provider === "openrouter") { const free = ids.filter(i => i.endsWith(":free")); if (free.length) ids = free; }
  if (aiCfg.key.provider === "gemini") ids = ids.filter(i => /gemini|gemma/i.test(i) && !/embed|image|tts|audio|veo|imagen|live/i.test(i));
  return ids.sort();
}

/* --- Models that run inside the browser --- */
// Why these are slower than a key: the first time, the whole model (0.5 to 4.5 GB) downloads;
// every visit it's loaded onto the graphics card and its shaders compiled (10 to 60 seconds);
// then every word is worked out on this computer. So waits are timed and shown as they happen.
const NBN_BYTES_PER_SEC = 50e6 / 8;   // a typical 50 Mbps NBN plan
// Reads after "about": "about 5 seconds", "about a minute", "about 12 minutes"
function fmtDur(sec) {
  if (!isFinite(sec) || sec <= 0) return "a moment";
  if (sec < 55) return `${Math.max(5, Math.round(sec / 5) * 5)} seconds`;
  if (sec < 90) return "a minute";
  if (sec < 3300) return `${Math.round(sec / 60)} minutes`;
  return `${(sec / 3600).toFixed(1).replace(/\.0$/, "")} hours`;
}
const dlTime = m => m && m.bytes ? fmtDur(m.bytes / NBN_BYTES_PER_SEC) : "";
// Measured speed on this computer, in tokens a second (prefill: reading the prompt; dec: writing)
function aiSpeed(kind, id) {
  const m = browserModel(kind, id), got = aiCfg.speed && aiCfg.speed[id];
  const dec = got && got.dec > 0 ? got.dec : (m ? m.tps : 10);
  return { dec, pre: got && got.pre > 0 ? got.pre : dec * 12, measured: !!(got && got.dec > 0) };
}
function aiSpeedSave(id, pre, dec) {
  if (!(dec > 0)) return;
  const old = aiCfg.speed[id];
  // a running average, so one slow answer doesn't swing it
  aiCfg.speed[id] = old && old.dec > 0 ? { dec: old.dec * 0.6 + dec * 0.4, pre: pre > 0 ? (old.pre ? old.pre * 0.6 + pre * 0.4 : pre) : old.pre } : { dec, pre: pre > 0 ? pre : 0 };
  saveAiCfg();
}
const TOKEN_CHARS = 3.8;
// Seconds to read the prompt and write about outChars characters
function aiEstimate(kind, id, promptChars, outChars) { const sp = aiSpeed(kind, id); return promptChars / TOKEN_CHARS / sp.pre + outChars / TOKEN_CHARS / sp.dec + 0.5; }

const aiLocal = { engine: null, kind: "", model: "", loading: null, progress: null };
const AI_PHASES = { download: "Downloading the AI (one time only)", load: "Loading the AI from this computer", gpu: "Setting up your graphics card", ready: "Your AI is ready" };
async function loadBrowserModel(kind, model, onProgress = () => {}) {
  if (aiLocal.engine && aiLocal.kind === kind && aiLocal.model === model) return aiLocal.engine;
  if (aiLocal.loading && aiLocal.kind === kind && aiLocal.model === model) return aiLocal.loading;
  aiLocal.kind = kind; aiLocal.model = model; aiLocal.engine = null;
  const info = browserModel(kind, model) || {};
  let phase = "", t0 = 0;
  // f: 0 to 1 for this phase. Works out the time left from how fast it has gone so far.
  const report = (f, text) => {
    const t = String(text || "");
    const ph = /ready|finish/i.test(t) && f >= 1 ? "ready" : kind === "webllm" ? (/loading model from cache/i.test(t) ? "load" : /shader|gpu/i.test(t) ? "gpu" : "download") : (f >= 1 ? "ready" : "download");
    if (ph !== phase) { phase = ph; t0 = performance.now(); }
    const secs = (performance.now() - t0) / 1000, left = f > 0.02 && secs > 1.5 ? secs / f * (1 - f) : null;
    const mb = t.match(/(\d+)\s*MB fetched/i), total = info.bytes ? Math.round(info.bytes / 1e6) : 0;
    const detail = phase === "download" ? [mb && total ? `${Number(mb[1]).toLocaleString()} of about ${total.toLocaleString()} MB` : "", left != null ? `about ${fmtDur(left)} left` : info.bytes && !secs ? `about ${dlTime(info)} on a typical connection` : "estimating time left…"].filter(Boolean).join(" · ")
      : phase === "ready" ? "" : left != null ? `about ${fmtDur(left)} left` : "usually 10 to 60 seconds";
    const st = { f, text: t, phase, title: AI_PHASES[phase] || "Getting your AI ready", detail, left };
    aiLocal.progress = st; onProgress(f, t, st);
    aiProgressListeners.forEach(fn => { try { fn(f, t, st); } catch { /* ignore */ } });
  };
  aiLocal.loading = (async () => {
    if (kind === "webllm") {
      if (!navigator.gpu) throw aiError("no_webgpu");
      let lib;
      try { lib = await import(WEBLLM_URL); } catch { throw aiError("blocked"); }
      const opts = { initProgressCallback: r => report(r.progress || 0, r.text || "") };
      try {
        const src = `import * as w from "${WEBLLM_URL}"; const h = new w.WebWorkerMLCEngineHandler(); self.onmessage = m => h.onmessage(m);`;
        const worker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })), { type: "module" });
        return { kind, lib, eng: await lib.CreateWebWorkerMLCEngine(worker, model, opts) };
      } catch (e) {
        if (e && /fetch|network|Failed/i.test(String(e.message || e))) throw aiError("blocked");
        try { return { kind, lib, eng: await lib.CreateMLCEngine(model, opts) }; }
        catch (e2) { throw /fetch|network|Failed|cache/i.test(String(e2 && e2.message || e2)) ? aiError("blocked") : aiError("model_failed", "The model couldn't start on this computer: " + String(e2 && e2.message || e2).slice(0, 160)); }
      }
    }
    let tf;
    try { tf = await import(TFJS_URL); } catch { throw aiError("blocked"); }
    const gpu = !!navigator.gpu;
    const files = {};
    try {
      const gen = await tf.pipeline("text-generation", model, {
        device: gpu ? "webgpu" : "wasm", dtype: gpu ? "q4f16" : "q4",
        progress_callback: p => {
          if (p.status === "progress_total" && p.progress != null) report(p.progress / 100, "Downloading the model…");
          else if (p.status === "progress" && p.file) { files[p.file] = [p.loaded || 0, p.total || 0]; const v = Object.values(files); const tot = v.reduce((a, x) => a + x[1], 0); report(tot ? v.reduce((a, x) => a + x[0], 0) / tot : 0, `${Math.round(v.reduce((a, x) => a + x[0], 0) / 1e6)} MB fetched`); }
          else if (p.status === "ready") report(1, "Ready");
        }
      });
      return { kind, gen, tf };
    } catch (e) { throw /fetch|network|Failed/i.test(String(e && e.message || e)) ? aiError("blocked") : aiError("model_failed", "The model couldn't start on this computer: " + String(e && e.message || e).slice(0, 160)); }
  })();
  try { aiLocal.engine = await aiLocal.loading; report(1, "Ready"); return aiLocal.engine; }
  catch (e) { aiLocal.kind = ""; aiLocal.model = ""; throw e; }
  finally { aiLocal.loading = null; }
}
const aiProgressListeners = new Set();
// Is the model already downloaded? (Then it can be got ready quietly when the page opens.)
async function browserModelCached(kind, model) {
  try {
    if (kind === "webllm") { const lib = await import(WEBLLM_URL); return typeof lib.hasModelInCache === "function" ? !!(await lib.hasModelInCache(model)) : false; }
    for (const n of await caches.keys()) { if (!/transformers/i.test(n)) continue; const keys = await (await caches.open(n)).keys(); if (keys.some(r => r.url.includes(model))) return true; }
  } catch { /* no cache access */ }
  return false;
}
// The writing itself, timed: the corner card says roughly how long is left
const aiWriting = { hide: null };
function aiWritingShow(est, t0, n) {
  if (est < 4 || typeof aiCorner !== "function") return;
  clearTimeout(aiWriting.hide);
  const secs = (performance.now() - t0) / 1000, left = est - secs;
  aiCorner({ title: `Writing with ${AI_NAME()}`, sub: left > 1.5 ? `About ${fmtDur(left)} left${n ? "" : " (reading your details first)"}` : "Almost done…", frac: Math.min(0.96, secs / est) });
}
function aiWritingDone() { clearTimeout(aiWriting.hide); aiWriting.hide = setTimeout(() => { if (typeof aiCorner === "function") aiCorner(null); }, 900); }
// o: { schema: a JSON schema to hold the answer to, expect: roughly how many characters to expect }
async function chatBrowser(kind, model, messages, signal, o = {}) {
  const m = await loadBrowserModel(kind, model);
  if (signal && signal.aborted) throw aiError("cancelled");
  const promptChars = messages.reduce((a, x) => a + String(x.content || "").length, 0), expect = o.expect || 700;
  const est = aiEstimate(kind, model, promptChars, expect), t0 = performance.now();
  aiWritingShow(est, t0, 0);
  const timer = setInterval(() => aiWritingShow(est, t0, 1), 1000);
  try {
    if (m.kind === "webllm") {
      const stop = () => { try { m.eng.interruptGenerate(); } catch { /* ignore */ } };
      if (signal) signal.addEventListener("abort", stop, { once: true });
      const req = { messages, temperature: 0.2, max_tokens: o.max || 1500, stream: true, stream_options: { include_usage: true } };
      // a schema makes the model write valid JSON in that shape, so no answers are wasted on retries
      if (o.schema) req.response_format = { type: "json_object", schema: JSON.stringify(o.schema) };
      let text = "", usage = null;
      const run = async r => { for await (const c of await m.eng.chat.completions.create(r)) { const d = c.choices && c.choices[0] && c.choices[0].delta; if (d && d.content) text += d.content; if (c.usage) usage = c.usage; } };
      try { await run(req); }
      catch (e) { if (signal && signal.aborted) throw aiError("cancelled"); if (!o.schema) throw e; text = ""; delete req.response_format; await run(req); }
      if (signal && signal.aborted) throw aiError("cancelled");
      const x = usage && usage.extra;
      if (x) aiSpeedSave(model, x.prefill_tokens_per_s, x.decode_tokens_per_s);
      return text;
    }
    const msgs = model.includes("Qwen3") ? messages.map((x, i) => i === 0 && x.role === "system" ? { ...x, content: x.content + " /no_think" } : x) : messages;
    let n = 0, first = 0;
    const streamer = m.tf && m.tf.TextStreamer && m.gen.tokenizer ? new m.tf.TextStreamer(m.gen.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: () => { if (!n) first = performance.now(); n++; } }) : undefined;
    const out = await m.gen(msgs, { max_new_tokens: o.max || 1200, do_sample: false, ...(streamer ? { streamer } : {}) });
    if (n > 3 && first) aiSpeedSave(model, promptChars / TOKEN_CHARS / Math.max(0.05, (first - t0) / 1000), n / Math.max(0.05, (performance.now() - first) / 1000));
    const g = out && out[0] && out[0].generated_text;
    return Array.isArray(g) ? ((g[g.length - 1] || {}).content || "") : String(g || "");
  } finally { clearInterval(timer); aiWritingDone(); }
}
// The in-browser models get the same short prompts as Chrome's: this makes them look like a Chrome AI session
function browserSession(kind, rules, examples = [], history) {
  const model = kind === "tfjs" ? aiCfg.tfjsModel : aiCfg.webllmModel;   // (kind "key" is a small model reached through the person's key: same short prompts, no download)
  const msgs = history ? history.slice() : [{ role: "system", content: rules }, ...fewShot(examples)];
  const lastEx = examples.length ? examples[examples.length - 1][1] : null;
  const expect = lastEx ? Math.max(200, (typeof lastEx === "string" ? lastEx : JSON.stringify(lastEx)).length) : 500;
  return {
    async prompt(text, o = {}) {
      msgs.push({ role: "user", content: text });
      let out = kind === "key" ? await aiChat("key", msgs, null, { expect, max: tightMax(expect) }) : await chatBrowser(kind, model, msgs, null, { schema: o.responseConstraint, expect, max: 1200 });
      // the small models sometimes wrap JSON in fences or thinking: keep just the JSON
      try { out = JSON.stringify(extractJSON(out)); } catch { /* left as it is; the caller retries */ }
      msgs.push({ role: "assistant", content: out });
      return out;
    },
    async clone() { return browserSession(kind, rules, examples, msgs); },
    destroy() {}
  };
}
// Get the chosen in-browser model ready in the background, but only if it's already downloaded
async function aiWarmUp() {
  const e = aiCfg.engine;
  if (!BROWSER_ENGINES.has(e) || aiInClaude() || aiLocal.engine || aiLocal.loading) return;
  const model = e === "webllm" ? aiCfg.webllmModel : aiCfg.tfjsModel;
  if (e === "webllm" && !navigator.gpu) return;
  if (!(await browserModelCached(e, model))) return;
  try { await loadBrowserModel(e, model); } catch { /* the first real use shows the problem */ }
}

// Send one conversation to the chosen engine and get text back
async function aiChat(engine, messages, signal, o = {}) {
  if (engine === "webllm") return chatBrowser("webllm", aiCfg.webllmModel, messages, signal, { expect: o.expect || 900 });
  if (engine === "tfjs") return chatBrowser("tfjs", aiCfg.tfjsModel, messages, signal, { expect: o.expect || 900 });
  if (engine === "key") {
    const key = aiSecret();
    if (!key) throw aiError("bad_key", "Add your API key first.");
    if (!aiCfg.key.model) throw aiError("no_model");
    return aiProvider().kind === "anthropic" ? chatAnthropic(key, aiCfg.key.model, messages, signal, o.max) : chatOpenAI(aiKeyBase(), key, aiCfg.key.model, messages, signal, o.max);
  }
  throw aiError("no_engine", "No AI is connected.");
}
// The same shape as Claude's sample.json(): a prompt or a conversation in, parsed JSON out
async function userJSON(engine, input, opts = {}) {
  const msgs = [{ role: "system", content: JSON_SYSTEM }, ...toMessages(input)];
  const text = await aiChat(engine, msgs, opts.signal, opts);
  try { return extractJSON(text); }
  catch {
    const again = await aiChat(engine, [...msgs, { role: "assistant", content: text }, { role: "user", content: "That wasn't valid JSON. Reply again with only the JSON." }], opts.signal, opts);
    return extractJSON(again);
  }
}
let aiLastProblem = null;
const userSample = {
  async json(input, opts = {}) {
    const e = aiCfg.engine;
    if (USER_ENGINES.has(e) && aiUsable(e)) {
      try { const d = await userJSON(e, input, opts); aiLastProblem = null; return d; }
      catch (err) {
        aiLastProblem = err;
        if (err.code === "cancelled" || !claudeSample || !aiCfg.fallback) throw err;
      }
    }
    if (!claudeSample) throw aiError("no_engine", "No AI is connected.");
    return claudeSample.json(input, opts);
  }
};
// Point every tool at the chosen engine
const aiChangeListeners = new Set();
function refreshSample() {
  const e = aiCfg.engine;
  if (USER_ENGINES.has(e) && aiUsable(e)) sample = userSample;
  else sample = claudeSample;
  aiChangeListeners.forEach(fn => { try { fn(); } catch (err) { console.error(err); } });
}
function setAiEngine(e) {
  aiCfg.engine = AI_ENGINES.includes(e) ? e : "auto";
  saveAiCfg();
  refreshSample();
}
// A short test: the AI must return a small JSON object
async function testAi(engine, signal) {
  const t0 = Date.now();
  const d = await userJSON(engine, `Reply with this JSON, filling in a short greeting for a job seeker named Sam: {"greeting": "..."}`, { signal, expect: 80 });
  if (!d || typeof d.greeting !== "string") throw aiError("invalid_json");
  return { text: d.greeting.slice(0, 120), ms: Date.now() - t0 };
}

const AI_LONG = () => AI_NAME() === "Claude" ? "Claude on your account" : AI_NAME();
// The small model doing the short-prompt work: the one in the browser if chosen, otherwise Chrome's
// ("key" counts when the person's own model is a small one: it gets the same short prompts, one job at a time)
const smallEngine = () => BROWSER_ENGINES.has(aiCfg.engine) ? aiCfg.engine : aiCfg.engine === "key" && aiUsable("key") && keyIsSmall() ? "key" : null;
const smallWhere = () => smallEngine() === "key" ? "through your key" : "on this computer";
const SMALL = () => smallEngine() ? AI_NAME() : "Chrome's built-in AI";
// After the small-model path: the next AI to try (an in-browser model isn't asked twice; Claude steps in if allowed)
const afterSmall = () => smallEngine() ? (aiCfg.fallback !== false && claudeSample ? claudeSample : null) : sample;
const BIG_NAME = () => smallEngine() ? "Claude" : AI_NAME();

