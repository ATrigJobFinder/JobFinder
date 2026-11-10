/* ===================== Choose your own AI (v12) ===================== */
// The person chooses which AI does the writing. Every engine answers through the same
// sample.json() interface the tools already use, so every answer still goes through
// factCheck / honest() / the guards before anyone sees it.
//   chrome : Chrome's built-in model (Gemini Nano)
//   webllm : an open model downloaded into the browser with WebLLM (WebGPU)
//   tfjs   : a small open model downloaded into the browser with Transformers.js
//   key    : the person's own API key (Gemini, OpenRouter, Groq, Claude, OpenAI or other)
//   auto   : Chrome's model if it's ready, otherwise built-in rules (no AI)
// chrome, webllm and tfjs are small models, so they get the short one-job-at-a-time prompts
// (see withChromeAI and the *_NANO prompts). With no AI at all, built-in rules fill in.
// The Stop button: every call to an AI counts as "working". A floating bar shows while any is running, and Stop cancels what's in flight
// and every step that would have come after it (anything that loops checks aiRun.gen against the value it started with).
const aiRun = { n: 0, gen: 0, ctl: new AbortController(), t: 0 };
function aiStopUI() {
  let el = document.getElementById("aiStopBar");
  if (aiRun.n <= 0) { if (el) el.hidden = true; return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "aiStopBar"; el.className = "ai-stopbar"; el.setAttribute("role", "status");
    el.innerHTML = `<span class="ai-spin" aria-hidden="true"></span><span>The AI is working…</span><button class="btn" type="button" id="aiStopBtn">Stop</button>`;
    document.body.appendChild(el);
    el.querySelector("button").addEventListener("click", aiStopAll);
  }
  el.hidden = false;
}
function aiBegin() { aiRun.n++; clearTimeout(aiRun.t); aiStopUI(); return aiRun.gen; }
function aiEnd(gen) { if (gen !== aiRun.gen) return; aiRun.n = Math.max(0, aiRun.n - 1); clearTimeout(aiRun.t); aiRun.t = setTimeout(aiStopUI, 800); }
function aiStopAll() {
  aiRun.gen++; aiRun.n = 0;
  try { aiRun.ctl.abort(); } catch { /* already stopped */ }
  aiRun.ctl = new AbortController();
  aiStopUI();
  if (typeof aiCorner === "function") aiCorner(null);
}
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
  gemini: { name: "Google Gemini", short: "Gemini", kind: "openai", base: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.8-flash", small: "gemini-3.5-flash-lite", free: true, keyUrl: "https://aistudio.google.com/apikey", keyWhere: "Google AI Studio", note: "Free tier with no card. On the free tier Google may use what you send to improve its products, so it suits people happy with that." },
  openrouter: { name: "OpenRouter", short: "OpenRouter", kind: "openai", base: "https://openrouter.ai/api/v1", model: "", free: true, keyUrl: "https://openrouter.ai/keys", keyWhere: "openrouter.ai", note: "One key for many models. Models ending in :free cost nothing, with a limit of about 50 requests a day (1,000 a day once you've ever bought US$10 of credits)." },
  groq: { name: "Groq", short: "Groq", kind: "openai", base: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b", free: true, keyUrl: "https://console.groq.com/keys", keyWhere: "console.groq.com", note: "Very fast open models. The free plan has per-minute and daily limits (about 8,000 tokens a minute on gpt-oss-120b, the strongest model with a free limit listed). Speech, voice and safety models in the list can't write, so they are left out." },
  mistral: { name: "Mistral", short: "Mistral", kind: "openai", base: "https://api.mistral.ai/v1", model: "mistral-large-latest", free: true, keyUrl: "https://console.mistral.ai/api-keys", keyWhere: "console.mistral.ai", note: "Free \"Experiment\" plan with no card, with rate limits. Mistral may use what you send to improve its models on that plan." },
  cerebras: { name: "Cerebras", short: "Cerebras", kind: "openai", base: "https://api.cerebras.ai/v1", model: "gpt-oss-120b", free: true, keyUrl: "https://cloud.cerebras.ai", keyWhere: "cloud.cerebras.ai", note: "Very fast open models. The free plan is now a trial: US$5 of credit (after adding a verified payment method) that expires after 30 days, with about 5 requests a minute." },
  huggingface: { name: "Hugging Face", short: "Hugging Face", kind: "openai", base: "https://router.huggingface.co/v1", model: "", free: false, keyUrl: "https://huggingface.co/settings/tokens", keyWhere: "huggingface.co/settings/tokens", note: "Free accounts no longer get a monthly allowance: you buy credits, or upgrade to Pro (about US$2 a month of credit). Make a token that is allowed to make inference calls." },
  claude: { name: "Claude (Anthropic API)", short: "Claude", kind: "anthropic", base: "https://api.anthropic.com/v1", model: "claude-haiku-5-5", free: false, keyUrl: "https://console.anthropic.com/settings/keys", keyWhere: "the Claude Console", note: "Paid per use, separate from a Claude.ai subscription. The strongest writing here. Set a monthly spend limit in the Console." },
  openai: { name: "OpenAI", short: "OpenAI", kind: "openai", base: "https://api.openai.com/v1", model: "", free: false, keyUrl: "https://platform.openai.com/api-keys", keyWhere: "platform.openai.com", note: "Paid per use. Set a monthly budget in your OpenAI settings." },
  custom: { name: "Other (OpenAI-compatible)", short: "your AI", kind: "openai", base: "", model: "", free: false, note: "Any service with an OpenAI-style /chat/completions address, such as Mistral, Together or DeepSeek." }
};
const AI_ENGINES = ["auto", "chrome", "webllm", "tfjs", "key", "off"];   // "off": the person disconnected the AI, so built-in templates only
const USER_ENGINES = new Set(["webllm", "tfjs", "key"]);
const BROWSER_ENGINES = new Set(["webllm", "tfjs"]);
// What writing prose (a cover letter) asks of every AI: warmer wording than extracting facts, and room for a whole letter.
// (Gemini's thinking models take no temperature: Google advises leaving it alone for them. Claude takes a temperature or a top_p, not both.)
const AI_WRITING = { temperature: 0.7, top_p: 0.95, max: 1500 };
const aiDefaultCfg = () => ({ engine: "auto", webllmModel: WEBLLM_MODELS.find(m => m.pick).id, tfjsModel: TFJS_MODELS.find(m => m.pick).id, key: { provider: "gemini", model: AI_PROVIDERS.gemini.model, base: "", remember: true, size: "auto", thinking: "high" }, speed: {} });
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
  return BROWSER_AI();
}
// Which browser this is, so "the browser's own AI" can be called by its real name. Chrome and Edge let a website use the on-device model;
// Opera's Aria and Brave's Leo are chat assistants inside those browsers that a website can't call.
const BROWSER_INFO = (() => {
  const ua = navigator.userAgent || "";
  const id = /Edg\//.test(ua) ? "edge" : /OPR\/|Opera/.test(ua) ? "opera" : navigator.brave ? "brave" : /Vivaldi/.test(ua) ? "vivaldi" : /Firefox\//.test(ua) ? "firefox" : /Chrome\/|CriOS/.test(ua) ? "chrome" : /Safari\//.test(ua) ? "safari" : "other";
  const t = { chrome: ["Chrome", "Gemini Nano", ""], edge: ["Edge", "Phi-4 mini", ""], opera: ["Opera", "Aria", "Aria is Opera's chat assistant, and websites can't use it."], brave: ["Brave", "Leo", "Leo is Brave's chat assistant, and websites can't use it."], vivaldi: ["Vivaldi", "", ""], firefox: ["Firefox", "", ""], safari: ["Safari", "", ""], other: ["Your browser", "", ""] }[id];
  return { id, name: t[0], model: t[1], note: t[2] };
})();
const BROWSER_AI = () => BROWSER_INFO.id === "other" ? "Your browser's built-in AI" : BROWSER_INFO.name + "'s built-in AI";
const aiChromeAllowed = () => aiCfg.engine === "auto" || aiCfg.engine === "chrome";

function aiError(code, message) { const e = new Error(message || code); e.code = code; return e; }
const AI_ERR_WORDS = {
  no_webgpu: "This browser can't run it: it needs WebGPU (Chrome or Edge on a computer, or Safari 26). Try Transformers.js, which can also run without a graphics card.",
  blocked: "Couldn't reach it. Check your connection, and that nothing (an ad blocker, a work network) is blocking the AI service.",
  bad_key: "The key was refused. Check it was copied in full and is still active, then enter it again in Choose your AI.",
  bad_request: "The AI service refused the request (error 400). That usually means the API key is wrong, has expired or was pasted with a piece missing. Enter your key again in Choose your AI.",
  rate_limited: "The free limit has been reached for now. Try again later, or use a different option.",
  no_model: "Choose a model first.",
  invalid_json: "The AI answered in the wrong format. Try again, or pick a stronger model.",
  timeout: "It didn't answer in time.",
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
// What went wrong, in plain words, and what to do about it. The service's own message is added when it says something useful.
const aiStatusWords = (n, said, who) => {
  const tail = said && !/^\d{3}$/.test(said.trim()) ? ` It said: “${said.trim().replace(/[.\s]+$/, "").slice(0, 160)}”.` : "";
  if (n >= 500) return `${who}'s servers had a problem on their side (error ${n}: busy, overloaded or down for a moment). Your key and your letter are fine, and nothing was lost. Job Finder tries an older model for you; if that fails too, wait a minute or two and try again.${tail}`;
  if (n === 404) return `That model isn't available to your key (error 404). It may have been renamed or retired, or your account can't use it yet.${tail}`;
  if (n === 408) return `The request took too long and was dropped (error 408). Try again in a moment.${tail}`;
  return `${who} sent back error ${n}.${tail}`;
};
const aiErrWords = e => {
  const who = typeof aiProvider === "function" && aiCfg.engine === "key" ? aiProvider().short || "The AI service" : "The AI service";
  const code = e && e.code || "";
  let base;
  const h = /^http_(\d{3})$/.exec(code);
  if (h) base = aiStatusWords(+h[1], ((/^The AI service said: ([\s\S]*)$/.exec(e.message || "") || [])[1]) || "", who);
  else if (code === "timeout") base = `${e.message || "It didn't answer in time."} That usually means the service is busy. Try again in a minute.`;
  else if (code === "rate_limited") base = `${AI_ERR_WORDS.rate_limited} ${aiCfg.engine === "key" && aiCfg.key.provider === "gemini" ? "Google's free tier limits requests per minute and per day for each model, so another model may still work." : ""}`.trim();
  else base = AI_ERR_WORDS[code] || (e && e.message) || "Something went wrong.";
  if (e && e.detail && !base.includes(e.detail)) base += ` (${e.detail})`;
  if (e && Array.isArray(e.tried) && e.tried.length > 1) base += ` Job Finder also tried ${listJoin(e.tried.slice(1))}.`;
  return base;
};

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
    // Mended: real line breaks inside a string (the usual slip of a weaker model writing a letter), or an answer cut off part-way
    try { const d = JSON.parse(jsonRepair(t.slice(start))); if (d && typeof d === "object") return d; } catch { /* not mendable */ }
    // One text field with quote marks inside it that were not escaped: {"letter": "She said "hi" to me"}
    const one = t.slice(start).match(/^\{\s*"([A-Za-z_]+)"\s*:\s*"([\s\S]*?)"?\s*\}?\s*$/);
    if (one && one[2].length > 20) return { [one[1]]: one[2].replace(/\\n/g, "\n").replace(/\\"/g, '"') };
  }
  throw aiError("invalid_json");
}
// Make almost-JSON parse: raw newlines and tabs inside strings become \n and \t, and an answer that stopped part-way is closed off
function jsonRepair(s) {
  let out = "", inStr = false, esc = false; const stack = [];
  for (const ch of s) {
    if (inStr) {
      if (esc) { out += ch; esc = false; }
      else if (ch === "\\") { out += ch; esc = true; }
      else if (ch === '"') { out += ch; inStr = false; }
      else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "";
      else if (ch === "\t") out += "\\t";
      else out += ch;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
      out += ch;
    }
  }
  if (inStr) out += '"';
  out = out.replace(/[,:]\s*$/, "");
  while (stack.length) out += stack.pop();
  return out;
}
const toMessages = input => typeof input === "string" ? [{ role: "user", content: input }] : (Array.isArray(input) ? input : [{ role: "user", content: String(input) }]).map(m => ({ role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user", content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }));
const JSON_SYSTEM = "You help job seekers with resumes, cover letters and interviews. Follow the user's rules exactly. When asked for JSON, reply with only valid JSON: no markdown, no code fences, no comments.";

async function aiFetch(url, init, signal) {
  let res;
  try { res = await fetch(url, { ...init, signal }); }
  catch (e) { if (e && e.name === "AbortError") throw aiError("cancelled"); throw aiError("blocked"); }
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    // A 400 or 403 that is about the model (a speech or safety model, or one this plan can't use) is not a bad key: say what the service said
    let msg = ""; try { const j = await res.json(); msg = String((j.error && (j.error.message || j.error)) || j.message || ""); } catch { /* no body */ }
    if (res.status !== 401 && /\bmodel\b/i.test(msg) && !/api[ _-]?key|invalid key|authenticat|unauthori[sz]ed|credential/i.test(msg)) throw aiError("bad_model", `This model can't be used for writing here. The AI service said: ${msg.slice(0, 200)}`);
    aiKeyAlert(res.status); throw aiError(res.status === 400 ? "bad_request" : "bad_key");
  }
  if (res.status === 413) throw aiError("too_large", "The request was bigger than this model's limit on your plan allows. Try a model with a higher limit.");
  if (res.status === 429) throw aiError("rate_limited");
  if (res.status === 402) throw aiError("rate_limited", "Your account has no credit left for this model.");
  if (!res.ok) {
    let msg = ""; try { const j = await res.json(); msg = (j.error && (j.error.message || j.error)) || j.message || ""; } catch { /* no body */ }
    throw aiError("http_" + res.status, `The AI service said: ${String(msg || res.statusText || res.status).slice(0, 200)}`);
  }
  return res.json();
}
// Gemini's thinking models (2.5 and later) take a thinking level through the OpenAI-style "reasoning_effort" field.
// Thinking tokens count against max_tokens, so the answer limit gets extra room, and Google advises leaving temperature alone for them.
const GEMINI_THINKS_RE = /gemini-(2\.5|[3-9])/i;
const THINKING_ROOM = 8000;
const geminiThinking = model => aiCfg.key.provider === "gemini" && GEMINI_THINKS_RE.test(model) ? aiCfg.key.thinking || "" : "";
// How hard Gemini thinks can be set for one page here. It is empty now, so every page uses the saved level (high). A call can also pass its own { effort }.
const AI_EFFORT_BY_VIEW = {};   // (empty: every page uses the saved level, high. Add { builder: "medium" } here to lower it for one page.)
const aiEffortNow = () => (typeof currentView === "string" && AI_EFFORT_BY_VIEW[currentView]) || "";
const OSS_THINKING_ROOM = 2000, OR_THINKING_ROOM = 3000;
// Models whose name says they think at length: they are ranked last, and are not picked as a stand-in
const AI_THINKERS_RE = /thinking|reasoning|(^|[\/:_-])r1([\/:_-]|$)|qwq|deepseek-r1|(^|[\/-])o[134]([\/:_-]|$)|-think\b|magistral/i;
const aiFastHost = () => aiCfg.key.provider === "groq" || aiCfg.key.provider === "cerebras";
const aiOssReasoning = model => aiFastHost() && /gpt-oss/i.test(model);
// OpenAI-style chat (Gemini, OpenRouter, Groq, OpenAI, others)
async function chatOpenAI(base, key, model, messages, signal, max, o = {}) {
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const think = geminiThinking(model) ? (o.effort || geminiThinking(model)) : "", oss = aiOssReasoning(model);
  // Groq and Cerebras take max_completion_tokens. Their gpt-oss models think first and the thinking uses up the same limit, so they get some room
  // (a little, not Gemini's 8,000: Groq's free plan allows about 8,000 tokens a minute, prompt included)
  const sampling = { temperature: o.temperature != null ? o.temperature : 0.2, ...(o.top_p != null ? { top_p: o.top_p } : {}) };
  const body = think ? { model, messages, reasoning_effort: think, max_tokens: (max || 2000) + THINKING_ROOM }
    : oss ? { model, messages, ...sampling, reasoning_effort: "medium", max_completion_tokens: (max || 2000) + OSS_THINKING_ROOM }
    : aiCfg.key.provider === "openrouter" ? { model, messages, ...sampling, reasoning: { effort: "low" }, max_tokens: (max || 2000) + OR_THINKING_ROOM }   // many free models think first and the thinking uses the same limit: ask for a short think, and leave room
    : { model, messages, ...sampling, ...(aiFastHost() ? { max_completion_tokens: max || 2000 } : { max_tokens: max || 2000 }) };
  const d = await aiFetch(base + "/chat/completions", { method: "POST", headers, body: JSON.stringify(body) }, signal);
  const c = d && d.choices && d.choices[0];
  // OpenRouter (and some others) report a problem from the model behind them inside a normal 200 reply: {"error": {"code": 429, "message": …}}
  const bad = (d && d.error) || (c && c.error);
  if (bad) {
    const code = Number(bad.code) || 0, msg = String(bad.message || bad.metadata && bad.metadata.raw || bad).slice(0, 240);
    const e = aiError(code === 429 ? "rate_limited" : "http_" + (code || 502), `The AI service said: ${msg}`); e.detail = msg; throw e;
  }
  const raw = c && c.message && c.message.content;
  const content = Array.isArray(raw) ? raw.map(x => (x && x.text) || "").join("") : raw || "";
  if (!String(content).trim()) {
    const cut = c && c.finish_reason === "length";
    throw aiError("empty_reply", cut ? "The model used up its whole answer limit thinking, and wrote nothing. Try again, or choose a model that doesn't think first." : `The model sent back an empty answer${c && c.finish_reason ? ` (${c.finish_reason})` : ""}. Try again, or choose another model.`);
  }
  return content;
}
// Claude's API, called straight from the browser with the person's own key
async function chatAnthropic(key, model, messages, signal, max, o = {}) {
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const msgs = messages.filter(m => m.role !== "system");
  const d = await aiFetch(AI_PROVIDERS.claude.base + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model, max_tokens: max || 2000, ...(o.temperature != null ? { temperature: o.temperature } : {}), system: system || undefined, messages: msgs })   // (Claude takes a temperature or a top_p, not both: the temperature is used)
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
  const chat = ids.filter(i => !AI_NOT_CHAT_RE.test(i));
  return aiRankModels(aiCfg.key.provider, chat.length ? chat : ids);
}
// Models that can't write text: speech to text, voice, safety classifiers, embeddings, images
const AI_NOT_CHAT_RE = /whisper|tts|orpheus|playai|guard|moderation|embed|rerank|transcri|speech|dall-e|imagen|image-|-image|veo|omni-moderation|audio|realtime/i;
// Best first, so the first model in the list is a good default (the list used to be alphabetical, which on Groq starts with a voice model).
// Only for companies where the order is known to help; the others stay alphabetical.
const AI_BEST = {
  groq: [/gpt-oss-120b/, /qwen.*3\.8.*27b/, /gpt-oss-20b/, /llama-3\.3-70b/, /llama-3\.1-8b/],   // the ones Groq lists with a free-plan limit, strongest first
  cerebras: [/gpt-oss-120b/, /qwen.*3\.8/, /llama.*70b/, /llama/],
  mistral: [/^mistral-large-latest/, /^mistral-large/, /^mistral-medium-latest/, /^mistral-medium/, /^mistral-small-latest/, /^mistral-small/]
};
function aiRankModels(provider, ids) {
  const list = [...new Set(ids)];
  if (provider === "gemini") {
    // flash before lite before pro (pro is rarely free), newest version first, Gemma last
    const tier = i => /gemma/i.test(i) ? 3 : /pro/i.test(i) ? 2 : /lite/i.test(i) ? 1 : 0;
    return list.sort((a, b) => tier(a) - tier(b) || aiVerCmp((aiVer(b) || { n: [0] }).n, (aiVer(a) || { n: [0] }).n) || a.localeCompare(b));
  }
  if (provider === "openrouter") {
    // bigger models first (the size is in the name, like "70b"); the rest after
    const size = i => { const m = String(i).match(/(\d+(?:\.\d+)?)b\b/i); return m ? Number(m[1]) : 0; };
    return list.sort((a, b) => AI_THINKERS_RE.test(a) - AI_THINKERS_RE.test(b) || size(b) - size(a) || a.localeCompare(b));
  }
  const prefs = AI_BEST[provider];
  if (!prefs) return list.sort();
  const rank = i => { const k = prefs.findIndex(re => re.test(i)); return k < 0 ? prefs.length : k; };
  return list.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
const AI_RANKED = new Set(["gemini", "groq", "cerebras", "mistral", "openrouter"]);

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
      const req = { messages, temperature: o.temperature != null ? o.temperature : 0.2, ...(o.top_p != null ? { top_p: o.top_p } : {}), max_tokens: o.max || 1500, stream: true, stream_options: { include_usage: true } };
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
    const out = await m.gen(msgs, { max_new_tokens: o.max || 1200, ...(o.temperature != null ? { do_sample: true, temperature: o.temperature, ...(o.top_p != null ? { top_p: o.top_p } : {}) } : { do_sample: false }), ...(streamer ? { streamer } : {}) });
    if (n > 3 && first) aiSpeedSave(model, promptChars / TOKEN_CHARS / Math.max(0.05, (first - t0) / 1000), n / Math.max(0.05, (performance.now() - first) / 1000));
    const g = out && out[0] && out[0].generated_text;
    return Array.isArray(g) ? ((g[g.length - 1] || {}).content || "") : String(g || "");
  } finally { clearInterval(timer); aiWritingDone(); }
}
// The in-browser models get the same short prompts as Chrome's: this makes them look like a Chrome AI session
// expectChars: how long the answer will be, when the caller knows (a reword of three paragraphs is far longer than its worked example)
function browserSession(kind, rules, examples = [], history, expectChars, mo = {}) {
  const samp = mo.writing ? { temperature: AI_WRITING.temperature, top_p: AI_WRITING.top_p } : {};
  const model = kind === "tfjs" ? aiCfg.tfjsModel : aiCfg.webllmModel;   // (kind "key" is a small model reached through the person's key: same short prompts, no download)
  const msgs = history ? history.slice() : [{ role: "system", content: rules }, ...fewShot(examples)];
  const lastEx = examples.length ? examples[examples.length - 1][1] : null;
  const expect = expectChars || (lastEx ? Math.max(200, (typeof lastEx === "string" ? lastEx : JSON.stringify(lastEx)).length) : 500);
  return {
    async prompt(text, o = {}) {
      msgs.push({ role: "user", content: text });
      let out = kind === "key" ? await aiChat("key", msgs, null, { expect, max: tightMax(expect), ...samp }) : await chatBrowser(kind, model, msgs, null, { schema: o.responseConstraint, expect, max: mo.writing ? AI_WRITING.max : 1200, ...samp });
      // the small models sometimes wrap JSON in fences or thinking: keep just the JSON
      try { out = JSON.stringify(extractJSON(out)); }
      catch {
        // through a key, a reply that won't parse was most likely cut off at the length limit: ask again with twice the room
        if (kind === "key") { try { out = JSON.stringify(extractJSON(await aiChat("key", msgs, null, { expect, max: Math.min(3000, tightMax(expect) * 2), ...samp }))); } catch { /* left as it is; the caller retries */ } }
      }
      msgs.push({ role: "assistant", content: out });
      return out;
    },
    async clone() { return browserSession(kind, rules, examples, msgs, expectChars, mo); },
    destroy() {}
  };
}
// Get the chosen in-browser model ready in the background, but only if it's already downloaded
async function aiWarmUp() {
  const e = aiCfg.engine;
  if (!BROWSER_ENGINES.has(e) || aiLocal.engine || aiLocal.loading) return;
  const model = e === "webllm" ? aiCfg.webllmModel : aiCfg.tfjsModel;
  if (e === "webllm" && !navigator.gpu) return;
  if (!(await browserModelCached(e, model))) return;
  try { await loadBrowserModel(e, model); } catch { /* the first real use shows the problem */ }
}

// Send one conversation to the chosen engine and get text back
async function aiChat(engine, messages, signal, o = {}) {
  const gen = aiBegin();
  try { return await aiChatInner(engine, messages, signal || aiRun.ctl.signal, o); }
  finally { aiEnd(gen); }
}
async function aiChatInner(engine, messages, signal, o = {}) {
  if (engine === "webllm") return chatBrowser("webllm", aiCfg.webllmModel, messages, signal, { expect: o.expect || 900 });
  if (engine === "tfjs") return chatBrowser("tfjs", aiCfg.tfjsModel, messages, signal, { expect: o.expect || 900 });
  if (engine === "key") {
    const key = aiSecret();
    if (!key) throw aiError("bad_key", "Add your API key first.");
    if (!aiCfg.key.model) throw aiError("no_model");
    // This is the only place a request leaves for a company's AI: contact details are taken out first and put back in the answer (14d-ai-privacy.js)
    const safe = aiScrubMessages(messages);
    const send = model => aiProvider().kind === "anthropic" ? chatAnthropic(key, model, safe.messages, signal, o.max, o) : chatOpenAI(aiKeyBase(), key, model, safe.messages, signal, o.max, o);
    let text;
    if (aiCfg.key.provider === "gemini") {
      // Quick jobs (bullet points, one sentence) use the small model; full letters and paragraphs use the main model.
      // A model that is busy, over its limit or too slow hands the job to the next one: the main model, then older versions of it.
      const small = o.tier === "small" && aiProvider().small ? aiProvider().small : "", first = small || aiCfg.key.model;
      try { text = await send(first); }
      catch (e) {
        if (o.exact || e.code === "cancelled" || !aiFallbackWorthy(e)) throw e;
        const rest = [...(small ? [aiCfg.key.model] : []), ...(await aiLowerCached(aiCfg.key.model))].filter((m, k, a2) => m !== first && a2.indexOf(m) === k);
        const tried = [first];
        for (const m of rest) {
          tried.push(m);
          try { text = await send(m); aiRun.fellBackTo = m; break; }
          catch (e2) { if (e2.code === "cancelled" || !aiFallbackWorthy(e2)) { e2.tried = tried; throw e2; } }
        }
        if (text == null) { e.tried = tried; throw e; }
      }
      return safe.restore(text);
    }
    try { text = await send(aiCfg.key.model); }
    catch (e) {
      // OpenRouter's free models are often busy, empty or broken from one minute to the next: for this one request, two other free models are tried
      // (the saved model is not changed). Not when the day's free allowance is used up, because every free model shares it.
      const other = !o.exact && aiCfg.key.provider === "openrouter" && (["empty_reply", "rate_limited", "bad_model", "too_large"].includes(e.code) || /^http_(5\d\d|404)$/.test(e.code)) && !/per-day|daily/i.test(`${e.detail || ""} ${e.message || ""}`);
      if (!other) throw e;
      let alt = []; try { alt = (await aiListModels()).filter(m => m !== aiCfg.key.model && !AI_THINKERS_RE.test(m)).slice(0, 2); } catch { /* no list */ }
      for (const m of alt) { try { text = await send(m); aiRun.fellBackTo = m; break; } catch (e2) { if (e2.code === "cancelled" || e2.code === "bad_key") throw e2; } }
      if (text == null) throw e;
    }
    return safe.restore(text);
  }
  throw aiError("no_engine", "No AI is connected.");
}
// The same shape the tools use, sample.json(): a prompt or a conversation in, parsed JSON out
async function userJSON(engine, input, opts = {}) {
  const msgs = [{ role: "system", content: JSON_SYSTEM }, ...toMessages(input)];
  const text = await aiChat(engine, msgs, opts.signal, opts);
  try { return extractJSON(text); }
  catch {
    // A model that ignored the JSON format and just wrote the letter: if that is what was asked for, use the paragraphs as they are
    const plain = opts.plainKey ? plainParagraphs(text) : "";
    if (plain) return { [opts.plainKey]: plain };
    const again = await aiChat(engine, [...msgs, { role: "assistant", content: text }, { role: "user", content: "That wasn't valid JSON. Reply again with only the JSON." }], opts.signal, opts);
    try { return extractJSON(again); }
    catch (e) { e.sample = String(again).replace(/\s+/g, " ").trim().slice(0, 140); throw e; }
  }
}
// Plain writing in three or more paragraphs, with no JSON in it: the paragraphs, or "" if it isn't that
function plainParagraphs(text) {
  const t = String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```[a-z]*\n?|```/gi, "").trim();
  if (/^\s*[{[]/.test(t) || t.length < 200) return "";
  return t.split(/\n\s*\n/).filter(p => p.trim()).length >= 3 ? t : "";
}
let aiLastProblem = null;
const userSample = {
  async json(input, opts = {}) {
    const e = aiCfg.engine;
    if (USER_ENGINES.has(e) && aiUsable(e)) {
      try { const d = await userJSON(e, input, opts); aiLastProblem = null; return d; }
      catch (err) { aiLastProblem = err; throw err; }
    }
    throw aiError("no_engine", "No AI is connected.");
  }
};
// Point every tool at the chosen engine
const aiChangeListeners = new Set();
function refreshSample() {
  const e = aiCfg.engine;
  if (USER_ENGINES.has(e) && aiUsable(e)) sample = userSample;
  else sample = null;
  aiChangeListeners.forEach(fn => { try { fn(); } catch (err) { console.error(err); } });
}
function setAiEngine(e) {
  aiCfg.engine = AI_ENGINES.includes(e) ? e : "auto";
  saveAiCfg();
  refreshSample();
}
// A short test: the AI must return a small JSON object
async function testAi(engine, signal, tier = "") {
  const t0 = Date.now();
  const d = await userJSON(engine, `Reply with this JSON, filling in a short greeting for a job seeker named Sam: {"greeting": "..."}`, { signal, expect: 80, exact: true, effort: "low", tier });   // (a greeting needs no deep thinking, so the test is quick)
  if (!d || typeof d.greeting !== "string") throw aiError("invalid_json");
  return { text: d.greeting.slice(0, 120), ms: Date.now() - t0 };
}

/* --- A test that fails (busy, over its limit, too slow) is tried again on the next model down (gemini-3.8-flash, 3.7, 3.6, 3.5 and so on) --- */
const AI_TEST_SECONDS = 15;
const aiVer = id => { const m = String(id).match(/(\d+(?:\.\d+)*)/); return m ? { n: m[1].split(".").map(Number), at: m.index, len: m[1].length } : null; };
const aiVerCmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
// The same model line with a lower version number, newest first: from "gemini-3.8-flash" → "gemini-3.6-flash", "gemini-3.5-flash".
// "-preview" and "-001" copies count as the same line; "-lite" and the like do not.
function aiLowerModels(current, ids, max = 3) {
  const cur = aiVer(current); if (!cur) return [];
  const head = current.slice(0, cur.at), tail = current.slice(cur.at + cur.len), best = new Map();
  for (const id of ids) {
    const v = aiVer(id); if (!v || id.slice(0, v.at) !== head || aiVerCmp(v.n, cur.n) >= 0) continue;
    const rest = id.slice(v.at + v.len); if (!(rest === tail || (rest.startsWith(tail) && /^(-preview[\w.-]*|-\d{3}|-latest)$/.test(rest.slice(tail.length))))) continue;
    const k = v.n.join("."), had = best.get(k);
    if (!had || id.length < had.id.length) best.set(k, { id, n: v.n });
  }
  return [...best.values()].sort((a, b) => aiVerCmp(b.n, a.n)).slice(0, max).map(x => x.id);
}
// The older versions of a model, from the company's own list, looked up once and kept
let aiLowerMemo = { key: "", list: [] };
async function aiLowerCached(model) {
  if (aiLowerMemo.key === model) return aiLowerMemo.list;
  try { const list = aiLowerModels(model, await aiListModels(), 4); aiLowerMemo = { key: model, list }; return list; }
  catch { return []; }
}
// One test, stopped after a time limit
async function testAiTimed(engine, seconds = AI_TEST_SECONDS, tier = "") {
  const ctl = new AbortController(); let late = false;
  const t = setTimeout(() => { late = true; ctl.abort(); }, seconds * 1000);
  try { return await testAi(engine, ctl.signal, tier); }
  catch (e) { if (late) throw aiError("timeout", `It didn't answer within ${seconds} seconds.`); throw e; }
  finally { clearTimeout(t); }
}
// Only what another model might get past: no answer in time, overloaded (5xx), rate limited, unreachable, or not found. Never a refused key.
const aiFallbackWorthy = e => !!e && (["timeout", "blocked", "rate_limited", "bad_model", "too_large", "empty_reply"].includes(e.code) || /^http_(5\d\d|404)$/.test(e.code));
// Tests the key's model; if it fails that way, the next models down are tried, each with the same time limit.
// → { r, model, skipped: [{ model, why }] }. Leaves aiCfg.key.model on the model that worked (the caller restores it if it throws).
async function testKeyWithFallback(onTry = () => {}) {
  const first = aiCfg.key.model, skipped = [];
  const run = async m => { aiCfg.key.model = m; onTry(m); return { r: await testAiTimed("key"), model: m, skipped }; };
  let firstErr;
  try { return await run(first); } catch (e) { if (!aiFallbackWorthy(e)) throw e; firstErr = e; skipped.push({ model: first, why: aiErrWords(e), code: e.code }); }
  // lower versions of the same model first; then, for companies whose models we can rank, the next best chat models (three in all)
  let lower = []; try {
    const ids = await aiListModels();
    const cap = aiCfg.key.provider === "gemini" ? 8 : 3;   // (Gemini: every older version, one after another, until one answers)
    lower = aiLowerModels(first, ids, cap);
    if (AI_RANKED.has(aiCfg.key.provider)) lower = [...lower, ...ids.filter(i => i !== first && !lower.includes(i))].slice(0, cap);
  } catch { /* no list: nothing lower to try */ }
  for (const m of lower) {
    try { return await run(m); } catch (e) { if (!aiFallbackWorthy(e)) throw e; skipped.push({ model: m, why: aiErrWords(e), code: e.code }); }
  }
  aiCfg.key.model = first;
  const err = aiError(firstErr.code, skipped.length > 1 ? `${skipped.map(s => `${s.model}: ${s.why}`).join(" ")}` : firstErr.message); err.skipped = skipped; err.first = firstErr; throw err;
}

// A few words for why a model was skipped, for the summary shown after a test
const aiSkipWord = code => code === "timeout" ? "too slow" : code === "rate_limited" ? "limit reached" : code === "bad_model" || code === "http_404" ? "not available" : code === "blocked" ? "unreachable" : /^http_5/.test(code || "") ? "busy" : "didn't work";
// The small model (Gemini 3.5 Flash-Lite) does the quick jobs, so Test and use tests it as well: → { model, r } when it answered, { model, error } when not, null when there isn't one
async function testSmallModel() {
  const small = aiCfg.key.provider === "gemini" ? aiProvider().small : "";
  if (!small) return null;
  try { return { model: small, r: await testAiTimed("key", AI_TEST_SECONDS, "small") }; }
  catch (e) { return { model: small, error: e }; }
}
// The result of testKeyWithFallback in three short lines: what is in use, why it stepped down (if it did), and the test reply
function aiFallbackLines(f, small) {
  const lines = [{ text: `${f.model} is connected and now doing your writing.`, main: true }];
  if (f.skipped.length) lines.push({ text: `Newer ${f.skipped.length === 1 ? "model was" : "models were"} skipped, so it stepped down automatically: ${f.skipped.map(s => `${s.model} (${aiSkipWord(s.code)})`).join(", ")}.` });
  lines.push({ text: `Test reply in ${(f.r.ms / 1000).toFixed(1)} s: “${f.r.text}”` });
  if (small) lines.push({ text: small.error ? `Quick jobs (bullet points, one sentence): ${small.model} didn't answer (${aiSkipWord(small.error.code)}), so ${f.model} will do them too.` : `Quick jobs (bullet points, one sentence): ${small.model} is working too (${(small.r.ms / 1000).toFixed(1)} s).` });
  return lines;
}

// The small model doing the short-prompt work: the one in the browser if chosen, otherwise Chrome's
// ("key" counts when the person's own model is a small one: it gets the same short prompts, one job at a time)
const smallEngine = () => BROWSER_ENGINES.has(aiCfg.engine) ? aiCfg.engine : aiCfg.engine === "key" && aiUsable("key") && keyIsSmall() ? "key" : null;
const smallWhere = () => smallEngine() === "key" ? "through your key" : "on this computer";
const SMALL = () => smallEngine() ? AI_NAME() : BROWSER_AI();
// After the small-model path: the bigger AI to try next. A small model isn't asked twice, so there is none.
const afterSmall = () => smallEngine() ? null : sample;
const BIG_NAME = () => AI_NAME();

