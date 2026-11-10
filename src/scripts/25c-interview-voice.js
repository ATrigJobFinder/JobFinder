/* ===================== Interview practice by voice: punctuation, delivery checks, speaking the question, camera and microphone ===================== */
// The first half is plain text and number work with no browser features, so it can be tested on its own.
// Everything about the camera and microphone stays on this device: nothing is uploaded.

/* --- Turning speech into punctuated text ---
   Speech recognition gives words with no punctuation, one phrase at a time (each phrase ends at a pause).
   So a phrase boundary is a sentence end unless the next phrase carries on the sentence ("and", "because", "to…"). */
const SP_STRONG = new Set(["but", "so", "because", "which", "although", "though", "whereas", "while", "whilst", "plus", "also", "however"]);
const SP_WEAK = new Set(["and", "or", "to", "with", "as", "that", "who", "where", "if", "until", "since", "then", "of", "for", "in", "on", "at", "by", "from"]);
const SP_PRONOUN = new Set(["i", "we", "they", "the", "it", "that", "my", "he", "she", "you", "there", "this", "our", "a", "an"]);
const SP_PREP = new Set(["in", "of", "on", "at", "to", "for", "by", "with", "from", "about", "into"]);
// [words, how many words must come before it in the sentence]
const SP_COMMA_BEFORE = [["but", 4], ["because", 5], ["although", 4], ["though", 5], ["whereas", 4], ["whilst", 4], ["which", 4], ["so", 6], ["and then", 6], ["for example", 4], ["for instance", 4], ["such as", 4]];
const SP_PERIOD_BEFORE = [["after that", 7], ["afterwards", 7], ["finally", 7], ["in the end", 7], ["as a result", 7], ["overall", 8], ["then", 10], ["next", 8], ["from there", 8], ["at the end", 8], ["looking back", 5], ["i learned", 10], ["i realised", 10], ["i realized", 10], ["the result was", 6], ["the outcome was", 6], ["my task was", 4], ["my job was", 4], ["my role was", 4], ["the problem was", 4], ["the goal was", 4], ["the challenge was", 4]];
const SP_INTRO = ["for example", "for instance", "in the end", "as a result", "after that", "at the time", "in my last job", "in my previous role", "in my current role", "in my last role", "at university", "at uni", "last year", "last semester", "in my second year", "in my final year", "in my first year", "first", "firstly", "secondly", "thirdly", "finally", "however", "therefore", "meanwhile", "overall", "honestly", "unfortunately", "fortunately", "luckily", "basically", "personally", "currently", "recently", "obviously", "afterwards", "ultimately", "initially", "normally", "usually"];
const SP_QUESTION = /^(what|why|how|when|where|who|which|do you|did you|does the|would you|could you|can you|is there|is it|are there|are you|have you|will there|what's|how's|where's)\b/i;
const SP_PROPER = { australia: "Australia", australian: "Australian", sydney: "Sydney", melbourne: "Melbourne", brisbane: "Brisbane", perth: "Perth", adelaide: "Adelaide", canberra: "Canberra", hobart: "Hobart", darwin: "Darwin", queensland: "Queensland", victoria: "Victoria", tasmania: "Tasmania", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday", january: "January", february: "February", april: "April", june: "June", july: "July", august: "August", september: "September", october: "October", november: "November", december: "December", linkedin: "LinkedIn", microsoft: "Microsoft", google: "Google", tafe: "TAFE", rmit: "RMIT", unsw: "UNSW", qut: "QUT", uts: "UTS", ndis: "NDIS", pos: "POS", crm: "CRM", cpr: "CPR", ohs: "OHS", whs: "WHS" };
const SP_COMMANDS = [[/\s*\bfull stop\b\s*/gi, ". "], [/\s*\bquestion mark\b\s*/gi, "? "], [/\s*\bexclamation (?:mark|point)\b\s*/gi, "! "], [/\s*\bnew (?:line|paragraph)\b\s*/gi, "\n"], [/\s*\bcomma\b\s*/gi, ", "]];
const spWords = s => String(s || "").trim().split(/\s+/).filter(Boolean);
function punctuateSpeech(parts, opts = {}) {
  const names = new Map(Object.entries(SP_PROPER));
  for (const n of opts.names || []) for (const w of spWords(n)) if (w.length > 2 && /[A-Za-z]/.test(w)) names.set(w.toLowerCase().replace(/[^a-z0-9']/g, ""), w);
  const gaps = opts.gaps || [];
  // 1. each phrase on its own: spoken punctuation ("full stop", "comma"), filler sounds
  const phrases = (parts || []).map(p => {
    let t = String(p || "").trim();
    for (const [re, to] of SP_COMMANDS) t = t.replace(re, to);
    if (opts.dropFillers !== false) t = t.replace(/\b(?:um+|uh+|erm|er|ah|hmm+)\b[,.]?\s*/gi, "");
    return t.replace(/[ \t]+/g, " ").trim();
  }).filter(Boolean);
  if (!phrases.length) return "";
  // 2. join them: a pause ends the sentence unless the next phrase carries it on
  let text = phrases[0], since = spWords(phrases[0].split(/[.!?\n]/).pop()).length;
  for (let k = 1; k < phrases.length; k++) {
    const ph = phrases[k], phWords = spWords(ph).length;
    const first = (spWords(ph)[0] || "").toLowerCase().replace(/[^a-z']/g, ""), prevWords = spWords(text.split(/[.!?\n]/).pop()).length;
    const gap = gaps[k];
    if (/[.!?,]$/.test(text)) { text += " " + ph; }
    else if (text.endsWith("\n")) { text += ph; }
    else {
      let sep;
      if (prevWords < 3) sep = ",";
      else if (SP_STRONG.has(first)) sep = ",";
      else if (SP_WEAK.has(first) && !(gap >= 2500)) sep = since >= 30 ? "." : since >= 18 ? "," : "";
      else sep = ".";
      if (sep !== "." && since + phWords > 45) sep = ".";
      text += sep + " " + ph;
      if (sep === ".") since = 0;
    }
    since = /[.!?]/.test(ph) ? spWords(ph.split(/[.!?]/).pop()).length : since + phWords;
  }
  // 3. inside the text: commas and sentence breaks at the usual places, then capitals
  let tokens = text.split(/(\s+)/);   // keeps the spaces and new lines
  const words = [];
  tokens.forEach((t, i) => { if (!/^\s+$/.test(t) && t) words.push(i); });
  const low = i => String(tokens[i] || "").toLowerCase().replace(/[^a-z0-9']/g, "");
  let count = 0;
  for (let n = 0; n < words.length; n++) {
    const i = words[n];
    const prevI = words[n - 1];
    const lastChar = prevI != null ? tokens[prevI].slice(-1) : "";
    if (n === 0 || /[.!?\n]/.test(lastChar) || /\n/.test(tokens[i - 1] || "")) { count = 0; }
    const one = low(i), two = one + " " + low(words[n + 1]), three = two + " " + low(words[n + 2]);
    const needsGap = prevI != null && !/[.!?,;:]$/.test(tokens[prevI]);
    // a long run of "and I… and I…" becomes separate sentences
    if (needsGap && one === "and" && (low(words[n + 1]) === "i" || low(words[n + 1]) === "we") && count >= 14) { tokens[prevI] += "."; tokens[i] = ""; count = 0; continue; }
    if (needsGap && count > 0) {
      const per = SP_PERIOD_BEFORE.find(([w, min]) => (w === one || w === two || w === three) && count >= min && !(w === "then" && low(prevI) === "and") && !(w === "next" && !SP_PRONOUN.has(low(words[n + 1]))));
      if (per) { tokens[prevI] += "."; count = 0; }
      else {
        const com = SP_COMMA_BEFORE.find(([w, min]) => (w === one || w === two || w === three) && count >= min && !(w === "which" && SP_PREP.has(low(prevI))) && !(w === "so" && !SP_PRONOUN.has(low(words[n + 1]))) && !(w === "because" && /^(of)$/.test(low(words[n + 1]))));
        if (com) tokens[prevI] += ",";
      }
    }
    count++;
  }
  text = tokens.join("");
  // sentences: capitals, introductory commas, questions
  const out = [];
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  const newlines = /\n/.test(text);
  for (let s of sentences) {
    s = s.replace(/\bi\b/g, "I");
    const lower = s.toLowerCase();
    const intro = SP_INTRO.filter(p => lower.startsWith(p + " ") && spWords(s).length >= spWords(p).length + 3).sort((a, b) => b.length - a.length)[0];
    if (intro && !new RegExp("^" + intro + "\\s*,", "i").test(s)) s = s.slice(0, intro.length) + "," + s.slice(intro.length);
    s = s.replace(/[A-Za-z0-9']+/g, w => names.has(w.toLowerCase()) ? names.get(w.toLowerCase()) : w);
    s = s[0].toUpperCase() + s.slice(1);
    if (!/[.!?]$/.test(s)) s += SP_QUESTION.test(s) && spWords(s).length <= 22 ? "?" : ".";
    else if (/\.$/.test(s) && SP_QUESTION.test(s) && spWords(s).length <= 22) s = s.slice(0, -1) + "?";
    out.push(s);
  }
  return out.join(newlines ? "\n" : " ").replace(/\s+([,.!?])/g, "$1").replace(/,{2,}/g, ",").replace(/([.!?]),/g, "$1");
}

/* --- Filler words, from the words we heard --- */
const FILLER_RE = /\b(um+|uh+|erm|er|hmm+|you know|basically|literally|sort of|kind of|i mean|i guess|and stuff|stuff like that|things like that)\b|\blike,|\b(?:was|is|it's|just|so|and|be) like\b/gi;
function fillerStats(rawText) {
  const found = {};
  for (const m of String(rawText || "").matchAll(FILLER_RE)) { const k = m[0].toLowerCase().replace(/^(was|is|it's|just|so|and|be) /, "").replace(/,$/, ""); found[k] = (found[k] || 0) + 1; }
  const count = Object.values(found).reduce((a, b) => a + b, 0);
  return { count, found, top: Object.entries(found).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, n]) => `“${w}” ×${n}`) };
}

/* --- What the microphone level tells us (frames are [milliseconds, loudness]) --- */
function levelStats(frames) {
  if (!frames || frames.length < 10) return null;
  const vals = frames.map(f => f[1]).sort((a, b) => a - b);
  const floor = Math.min(vals[Math.floor(vals.length * 0.1)] || 0, 0.02), thr = Math.max(0.012, floor * 2.5);
  const talk = frames.map(f => f[1] > thr);
  const first = talk.indexOf(true), last = talk.lastIndexOf(true);
  if (first < 0) return { silent: true, totalMs: frames[frames.length - 1][0] };
  const step = frames.length > 1 ? (frames[frames.length - 1][0] - frames[0][0]) / (frames.length - 1) : 100;
  // pauses: runs of quiet between the first and last word, ignoring blips shorter than 1.2 s
  const pauses = [];
  let run = 0;
  for (let i = first; i <= last; i++) {
    if (!talk[i]) run++;
    else { if (run * step >= 1200) pauses.push(Math.round(run * step)); run = 0; }
  }
  const speakFrames = talk.filter(Boolean).length;
  const avg = frames.filter((f, i) => talk[i]).reduce((a, f) => a + f[1], 0) / Math.max(1, speakFrames);
  return { silent: false, totalMs: frames[frames.length - 1][0], leadMs: Math.round(frames[first][0] - frames[0][0]), trailMs: Math.round(frames[frames.length - 1][0] - frames[last][0]), speakMs: Math.round((last - first + 1) * step), pauses, longest: pauses.length ? Math.max(...pauses) : 0, avg: Math.round(avg * 1000) / 1000, floor };
}
const fmtSecs = s => s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;
/* --- The delivery check: pace, pauses, filler words, length, volume and lighting, from this one answer. No AI. ---
   take: { secs, raw (what the browser heard), text (punctuated), levels, light } */
function deliveryChecks(take, ideal) {
  const rows = [], tips = [];
  const text = take.text || "", words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lv = take.levels && !take.levels.silent ? take.levels : null;
  const secs = take.secs || (lv ? lv.totalMs / 1000 : 0);
  const talkSecs = lv ? Math.max(1, lv.speakMs / 1000) : secs;
  const row = (label, value, status, note) => rows.push({ label, value, status, note });
  if (secs) {
    const [lo, hi] = ideal || [60, 150];
    const status = secs < lo * 0.7 ? "warn" : secs > hi * 1.3 ? "warn" : "ok";
    row("Length", fmtSecs(secs), status, `A good answer to this kind of question runs about ${fmtSecs(lo)} to ${fmtSecs(hi)}.`);
    if (secs < lo * 0.7) tips.push(`That was short (${fmtSecs(secs)}). Add the detail an interviewer would ask about next: what you did, and what came of it.`);
    else if (secs > hi * 1.3) tips.push(`That ran long (${fmtSecs(secs)}). Cut the background and keep your actions and the result.`);
  }
  if (words >= 15 && talkSecs >= 5) {
    const wpm = Math.round(words / (talkSecs / 60));
    const status = wpm < 105 || wpm > 175 ? "warn" : "ok";
    row("Speaking pace", `${wpm} words a minute`, status, wpm < 105 ? "A little slow. Aim for about 120 to 160." : wpm > 175 ? "Quite fast. Slow down so each point lands." : "A comfortable pace (about 120 to 160 is natural).");
    if (wpm > 175) tips.push("You spoke fast. Take a breath at the end of each sentence; it feels long to you and sounds calm to them.");
    else if (wpm < 105) tips.push("Your pace was slow. Rehearse the answer a few times so it comes out smoothly.");
  }
  if (lv) {
    const n = lv.pauses.length, longest = lv.longest / 1000;
    const status = longest > 4 || n >= 4 ? "warn" : "ok";
    row("Pauses", n ? `${n} over 1.2 s, longest ${longest.toFixed(1)} s` : "No long pauses", status, n ? "Short pauses help you think. Long ones can sound lost." : "You kept going smoothly.");
    if (longest > 4) tips.push(`There was a ${longest.toFixed(0)}-second gap. If you need to think, say “Let me think about that for a moment” instead of going silent.`);
    if (lv.leadMs > 4000) { row("Time to begin", `${(lv.leadMs / 1000).toFixed(1)} s`, "warn", "A few seconds to think is fine; much longer feels awkward."); tips.push("You took a while to start. Open with a sentence that buys you time, like “That's a good question. I'd say…”."); }
    row("Voice level", lv.avg < 0.02 ? "Quiet" : lv.avg > 0.35 ? "Very loud" : "Good", lv.avg < 0.02 || lv.avg > 0.35 ? "warn" : "ok", lv.avg < 0.02 ? "Your voice was quiet. Sit closer to the microphone or speak up a little." : lv.avg > 0.35 ? "Very loud. Move back a little or lower the volume." : "Easy to hear.");
    if (lv.avg < 0.02) tips.push("Speak up a little or move closer to the microphone. On a real call a quiet voice is hard to follow.");
  } else if (take.levels && take.levels.silent) {
    row("Voice level", "Nothing heard", "warn", "The microphone didn't pick up any speech. Check it's the right one and not muted.");
  }
  const f = fillerStats(take.raw || text);
  if (words >= 15) {
    const perMin = talkSecs ? f.count / (talkSecs / 60) : 0;
    const status = perMin > 4 ? "warn" : "ok";
    row("Filler words", f.count ? `${f.count} (${f.top.join(", ")})` : "None picked up", status, f.count ? "Words like these are normal, but too many hide your point." : "Clean and direct.");
    if (perMin > 4) tips.push(`You used filler words about ${Math.round(perMin)} times a minute (${f.top.join(", ")}). A short pause is better than “um”.`);
    if (f.count === 0) rows[rows.length - 1].note += " Speech recognition often leaves out “um” and “uh”, so this may be low.";
  }
  const sents = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (words >= 25 && sents.length) {
    const avg = words / sents.length;
    if (avg > 30) { row("Sentence length", `${Math.round(avg)} words on average`, "warn", "Long sentences are hard to follow when spoken."); tips.push("Your sentences were long. Aim for one idea per sentence."); }
  }
  if (take.light != null) {
    const dark = take.light < 70, bright = take.light > 215;
    row("Lighting", dark ? "A bit dark" : bright ? "Very bright" : "Good", dark || bright ? "warn" : "ok", dark ? "Face a window or lamp so your face is lit from the front." : bright ? "Too much light or a bright window behind you. Turn so the light is in front." : "Your face is well lit.");
    if (dark) tips.push("The picture was dark. Put a lamp or window in front of you, not behind.");
  }
  return { rows, tips };
}

// The numbers kept with a practice answer, for Your progress
function takeMetrics(take) {
  const lv = take.levels && !take.levels.silent ? take.levels : null, text = take.text || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0, secs = take.secs || 0, talk = lv ? Math.max(1, lv.speakMs / 1000) : secs;
  return { secs: Math.round(secs), wpm: words >= 15 && talk >= 5 ? Math.round(words / (talk / 60)) : 0, fillers: fillerStats(take.raw || text).count, longest: lv ? Math.round(lv.longest / 100) / 10 : 0 };
}

/* --- Browser parts: speaking the question, the microphone, the camera --- */
const voiceCan = () => ({
  speak: typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
  listen: typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  camera: typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  record: typeof MediaRecorder !== "undefined"
});
let spokeNow = null;
function pickVoice() {
  const list = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  return list.find(v => /en-AU/i.test(v.lang)) || list.find(v => /en-(GB|NZ)/i.test(v.lang)) || list.find(v => /^en/i.test(v.lang)) || null;
}
// Say the question out loud, then call done (also if speech isn't available, so practice never stalls)
function speakText(text, done) {
  stopSpeaking();
  let finished = false;
  const end = () => { if (finished) return; finished = true; clearTimeout(guard); if (spokeNow === token) spokeNow = null; done && done(); };
  const token = {};
  spokeNow = token;
  const guard = setTimeout(end, Math.max(4000, String(text).split(/\s+/).length * 600 + 2500));
  if (!voiceCan().speak) { clearTimeout(guard); finished = true; setTimeout(() => done && done(), 0); return false; }
  try {
    const u = new SpeechSynthesisUtterance(text), v = pickVoice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : "en-AU"; u.rate = 0.96; u.pitch = 1;
    u.onend = end; u.onerror = end;
    speechSynthesis.speak(u);
    return true;
  } catch { end(); return false; }
}
function stopSpeaking() { spokeNow = null; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch { /* nothing speaking */ } }

// Speech to punctuated text. onText(text, interim) is called as words arrive; the phrases are kept so punctuation can be worked out.
function createVoice({ onText, onError, onEnd, names = [], base = "" }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const v = { parts: [], raw: [], gaps: [], active: false, interim: "", t0: 0 };
  let rec = null, lastFinalAt = 0, segStart = 0;
  const text = () => {
    const done = punctuateSpeech(v.parts, { names, gaps: v.gaps });
    return (base ? base.trimEnd() + (done ? " " : "") : "") + done;
  };
  v.text = text;
  v.rawText = () => v.raw.join(" ");
  const make = () => {
    rec = new SR();
    rec.lang = "en-AU"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i], t = r[0].transcript.trim();
        if (!t) continue;
        if (r.isFinal) {
          const now = performance.now();
          v.gaps[v.parts.length] = segStart && lastFinalAt ? (segStart - lastFinalAt) / 1000 * 1000 : 0;
          v.parts.push(t); v.raw.push(t); lastFinalAt = now; segStart = 0;
        } else { interim += (interim ? " " : "") + t; if (!segStart) segStart = performance.now(); }
      }
      v.interim = interim;
      onText && onText(text(), interim);
    };
    rec.onerror = e => { if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) { v.active = false; onError && onError(e.error); } };
    rec.onend = () => { if (v.active) { try { make(); rec.start(); } catch { v.active = false; onEnd && onEnd(); } } else onEnd && onEnd(); };
  };
  v.start = () => { make(); v.active = true; v.t0 = performance.now(); rec.start(); };
  v.stop = () => {
    v.active = false;
    try { rec && rec.stop(); } catch { /* already stopped */ }
    // words still being worked out when you stopped count too
    if (v.interim) { v.parts.push(v.interim); v.raw.push(v.interim); v.interim = ""; }
    return text();
  };
  return v;
}

// Camera and microphone for the practice session: one stream, kept until practice ends
async function getPracticeMedia(wantVideo) {
  if (!voiceCan().camera) throw new Error("This browser can't use a camera or microphone here.");
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: wantVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false });
}
function stopStream(stream) { if (stream) stream.getTracks().forEach(t => { try { t.stop(); } catch { /* already stopped */ } }); }
// Level meter and the record of how loud you were, frame by frame
function startMeter(stream, onLevel) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !stream.getAudioTracks().length) return { frames: [], stop() {} };
  const ctx = new AC(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
  an.fftSize = 1024; src.connect(an);
  const buf = new Float32Array(an.fftSize), frames = [], t0 = performance.now();
  const id = setInterval(() => {
    an.getFloatTimeDomainData(buf);
    let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    const rms = Math.sqrt(s / buf.length);
    frames.push([performance.now() - t0, rms]);
    onLevel && onLevel(rms);
  }, 100);
  return { frames, stop() { clearInterval(id); try { ctx.close(); } catch { /* closed */ } } };
}
// Average brightness (0 to 255) of what the camera sees
function sampleLight(video) {
  try {
    if (!video || !video.videoWidth) return null;
    const c = sampleLight.c || (sampleLight.c = document.createElement("canvas"));
    c.width = 32; c.height = 24;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(video, 0, 0, 32, 24);
    const d = x.getImageData(0, 0, 32, 24).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4);
  } catch { return null; }
}
function startRecorder(stream, withVideo) {
  if (!voiceCan().record) return null;
  const types = withVideo ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"] : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const type = types.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } }) || "";
  let rec;
  try { rec = new MediaRecorder(withVideo ? stream : new MediaStream(stream.getAudioTracks()), type ? { mimeType: type } : undefined); } catch { return null; }
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise(res => { rec.onstop = () => res(chunks.length ? new Blob(chunks, { type: rec.mimeType || type || (withVideo ? "video/webm" : "audio/webm") }) : null); });
  rec.start(1000);
  return { stop() { try { if (rec.state !== "inactive") rec.stop(); } catch { /* stopped */ } return done; } };
}
