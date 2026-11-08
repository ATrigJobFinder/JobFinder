/* ===================== Practice by phone or video: hear the question, answer out loud, watch yourself back ===================== */
// Used by the Practise tab when "How will the interview be held?" is anything but "Type my answer" (see 25-interviews.js).
// The question is read aloud, your answer is recorded and written down with punctuation, and a delivery check
// (pace, pauses, filler words, length, volume, lighting) is worked out on this device. Nothing is uploaded.
const take = { stream: null, cam: false, phase: "idle", q: null, voice: null, meter: null, meterT0: 0, rec: null, timer: null, think: null, lightT: null, light: [], url: "", kind: "", result: null, t0: 0, token: 0, note: "", blob: null };
const ivNames = () => { const j = jobContext(); return j && j.company ? [j.company] : []; };
const takeResult = q => take.result && q && take.result.q === q.text ? take.result : null;
function takeStopIfRunning() { if (take.phase === "rec") stopTake(); }

// Everything for the current question stops; the camera stays on between questions unless keepStream is false
function resetTake(keepStream) {
  stopSpeaking(); if (typeof stopPrecheck === "function") stopPrecheck();
  clearInterval(take.timer); clearInterval(take.think); clearInterval(take.lightT);
  take.timer = take.think = take.lightT = null;
  if (take.voice) { try { take.voice.stop(); } catch { /* stopped */ } take.voice = null; }
  if (take.meter) { take.meter.stop(); take.meter = null; }
  if (take.rec) { take.rec.stop(); take.rec = null; }
  if (take.url) { URL.revokeObjectURL(take.url); take.url = ""; }
  take.phase = "idle"; take.result = null; take.light = []; take.note = ""; take.blob = null; take.token++;
  if (!keepStream) { stopStream(take.stream); take.stream = null; take.cam = false; const v = $("ivCam"); if (v) v.srcObject = null; const b = $("ivCamBox"); if (b) b.hidden = true; }
}
// Leaving the practice, or choosing "Type my answer": the camera and microphone go off
function endPractice() { if (take.stream || take.phase !== "idle") { resetTake(false); renderVoiceControls(); } }

// The panel that goes above the answer box in a phone or video practice
function voiceHtml() {
  return `<div class="iv-voice" id="ivVoice">
    <div class="iv-cam" id="ivCamBox" hidden><video id="ivCam" muted playsinline autoplay aria-label="Your camera, only you can see it"></video><span class="iv-cam-tag">Only you can see this. Nothing is uploaded.</span></div>
    <div class="iv-voice-side">
      <div class="iv-meter" aria-hidden="true"><i id="ivMeter"></i></div>
      <p class="iv-voice-status" id="ivVoiceStatus" role="status"></p>
      <div class="b-actions" id="ivVoiceBtns"></div>
      <div id="ivPlay"></div>
    </div>
  </div>`;
}
function takeSay(msg) { const s = $("ivVoiceStatus"); if (s) s.textContent = msg; }
const clockText = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function renderVoiceControls() {
  const box = $("ivVoiceBtns"); if (!box) return;
  const b = (act, label, cls = "ig-btn ig-btn--ghost") => `<button type="button" class="${cls}" data-take="${act}">${label}</button>`;
  const ph = take.phase;
  box.innerHTML = ph === "speaking" ? b("skip", "Skip to my answer")
    : ph === "think" ? b("start", "I'm ready, start now", "ig-btn ig-btn--primary")
    : ph === "rec" ? b("stop", "I'm finished", "ig-btn ig-btn--primary")
    : ph === "done" ? b("replay", "Hear the question again")
    : take.note ? b("retry", "Try the microphone again", "ig-btn ig-btn--primary") : "";
  const end = $("ivEnd"); if (end) end.hidden = !take.stream;
}
function renderPlayback() {
  const box = $("ivPlay"); if (!box) return;
  if (!take.url) { box.innerHTML = ""; return; }
  const video = take.kind === "video";
  box.innerHTML = `<div class="iv-play"><h3>${video ? "Watch yourself back" : "Listen back"}</h3>${video ? `<video controls playsinline src="${take.url}"></video>` : `<audio controls src="${take.url}"></audio>`}
    <p class="small muted">${video ? "Watch it once with the sound off: do you look relaxed and engaged? Then listen once without looking: do you sound clear and easy to follow?" : "Listen once as if you were the interviewer: is it clear, and does it have a result at the end?"}</p>
    ${video ? `<fieldset class="iv-selfcheck"><legend>Your own check (nobody sees this)</legend>${["I looked at the camera, not at my own picture", "I sat upright and my hands were still", "My face was well lit and the background was tidy", "I started within a few seconds and finished with a result", "I sounded like myself, not like I was reading"].map((t, i) => `<label class="q-check"><input type="checkbox"> ${t}</label>`).join("")}</fieldset>` : ""}
    <p class="b-actions"><a class="ig-btn ig-btn--ghost ig-btn--small" href="${take.url}" download="interview-practice.${(take.blob && /mp4/.test(take.blob.type)) ? "mp4" : "webm"}">Save this recording</a></p></div>`;
}

// Start of a question in a phone or video practice: get the microphone (and camera), say the question, then it's your turn
async function voiceBegin(q) {
  const my = take.token, can = voiceCan(), needCam = iv.how !== "phone";
  take.q = q; take.note = "";
  renderVoiceControls();
  if (!take.stream || (needCam && !take.cam)) {
    takeSay(`Asking your browser for the microphone${needCam ? " and camera" : ""}…`);
    try { if (take.stream) stopStream(take.stream); take.stream = await getPracticeMedia(needCam); take.cam = needCam; }
    catch {
      take.stream = null;
      if (needCam) { try { take.stream = await getPracticeMedia(false); take.cam = false; } catch { /* no microphone either */ } }
    }
    if (take.token !== my) { return; }
    if (!take.stream) { return voiceFallback(q, "Your browser didn't let this page use the microphone, so type your answer instead (or allow the microphone in the address bar and try again)."); }
    if (needCam && !take.cam) take.note = "";
  }
  if (take.token !== my) return;
  const cam = $("ivCam"), camBox = $("ivCamBox");
  if (take.cam && cam) { cam.srcObject = take.stream; camBox.hidden = false; cam.play().catch(() => {}); } else if (camBox) camBox.hidden = true;
  const bar = $("ivMeter");
  take.meter = startMeter(take.stream, lvl => { if (bar) bar.style.width = Math.min(100, Math.round(lvl * 320)) + "%"; });
  take.meterT0 = performance.now();
  if (!can.listen) take.note = "";
  take.phase = "speaking";
  takeSay(needCam && !take.cam ? "The camera isn't available, so this is voice only. Listen to the question…" : "Listen to the question…");
  renderVoiceControls();
  const spoke = speakText(q.text, () => { if (take.token === my && take.phase === "speaking") afterAsk(q, my); });
  if (!spoke) takeSay("Read the question on screen, then answer out loud.");
}
function voiceFallback(q, msg) {
  take.phase = "idle"; take.note = msg;
  takeSay(msg); renderVoiceControls();
  if (iv.how === "oneway") startTimer();
}
function afterAsk(q, my) {
  if (take.token !== my) return;
  if (iv.how === "oneway") {
    take.phase = "think"; let left = 30; renderVoiceControls();
    const tick = () => { if (take.token !== my) return clearInterval(take.think); takeSay(`Thinking time ${clockText(left)}. Recording starts by itself.`); if (left <= 0) { clearInterval(take.think); startTake(q, my); } left--; };
    tick(); take.think = setInterval(tick, 1000);
  } else startTake(q, my);
}
function startTake(q, my) {
  if (take.token !== my || take.phase === "rec") return;
  clearInterval(take.think);
  take.phase = "rec"; take.t0 = performance.now(); take.light = [];
  ivStepTo(1);
  const ta = $("ivAnswer"), can = voiceCan();
  ta.value = ""; ta.readOnly = true; updateCount();
  if (can.listen) {
    take.voice = createVoice({ names: ivNames(),
      onText: (t, interim) => { ta.value = t + (interim ? (t ? " " : "") + interim : ""); updateCount(); },
      onError: () => { take.note = "The browser blocked speech-to-text, so what you say can't be written down. You can still record, then type a few notes."; takeSay(take.note); },
      onEnd: () => {} });
    try { take.voice.start(); } catch { take.voice = null; }
  }
  take.rec = startRecorder(take.stream, take.cam);
  const cam = $("ivCam");
  take.lightT = setInterval(() => { const l = sampleLight(cam); if (l != null) take.light.push(l); }, 2000);
  const T = IV_TYPES[q.type], hi = T.ideal[1] / 2.2;
  const oneway = iv.how === "oneway";
  take.timer = setInterval(() => {
    const secs = (performance.now() - take.t0) / 1000;
    if (oneway && secs >= 120) { stopTake(); return; }
    takeSay(`● Recording ${clockText(secs)}${oneway ? ` of 2:00` : secs > hi ? ". Time to wrap up with the result." : ""}${can.listen ? "" : ". Speak, then type a few notes below afterwards."}`);
  }, 250);
  renderVoiceControls();
}
async function stopTake() {
  if (take.phase !== "rec") return;
  const my = take.token, q = take.q, item = sessItem();
  take.phase = "done";
  clearInterval(take.timer); clearInterval(take.lightT);
  const secs = (performance.now() - take.t0) / 1000;
  let text = "", raw = "";
  if (take.voice) { text = take.voice.stop(); raw = take.voice.rawText(); take.voice = null; }
  const off = take.t0 - take.meterT0;
  const frames = take.meter ? take.meter.frames.filter(f => f[0] >= off).map(f => [f[0] - off, f[1]]) : [];
  const light = take.light.length ? take.light.reduce((a, b) => a + b, 0) / take.light.length : null;
  take.result = { q: q.text, secs, raw, text, levels: levelStats(frames), light, how: iv.how };
  const ta = $("ivAnswer");
  if (ta) { ta.readOnly = false; if (text) ta.value = text; updateCount(); }
  takeSay(text ? "Recorded. Check the words below if you like, and fix anything it heard wrongly." : voiceCan().listen ? "Done, but no words were picked up. Check your microphone, or type your answer below." : "Done. This browser can't write down what you said, so type a few notes below to get a rating.");
  const rec = take.rec; take.rec = null;
  renderVoiceControls();
  ivAfterTake();
  if (rec) { const blob = await rec.stop(); if (blob) { if (item) item.blob = blob; if (take.token === my) { take.blob = blob; take.url = URL.createObjectURL(blob); take.kind = take.cam ? "video" : "audio"; renderPlayback(); } } }
}
/* --- Before you start: a check of the camera, microphone and speaker, with a short list of your own --- */
const pre = { meter: null, timer: null, mic: false, max: 0 };
function stopPrecheck() { clearInterval(pre.timer); pre.timer = null; if (pre.meter) { pre.meter.stop(); pre.meter = null; } }
function preSet(id, cls, text) {
  const li = document.querySelector(`#ivChecks [data-chk="${id}"]`); if (!li) return;
  li.className = "iv-chk-row " + cls; li.querySelector(".iv-chk-s").textContent = text;
}
async function renderPrecheck() {
  stopPrecheck();
  const needCam = iv.how !== "phone", my = ++take.token;
  $("ivRoomProg").textContent = "Before you start";
  const own = [...(needCam ? ["My camera is at eye level", "The light is in front of me, not behind", "My background is tidy"] : ["My phone or headphones are charged and working", "I have my resume, the job ad and my screening answers in front of me"]), "I'm somewhere quiet, with notifications off", ...(needCam ? ["My notes are beside the screen, not on it"] : []), "I've closed other apps, and I have water within reach"];
  $("ivStage").innerHTML = `<section class="iv-room iv-pre" aria-labelledby="ivPreH"><p class="ig-phase">Before you start</p><h2 class="iv-sum-h" id="ivPreH" tabindex="-1">A quick check of your <mark>${needCam ? "camera and microphone." : "microphone."}</mark></h2>
    <p class="iv-lead">Nothing is recorded or uploaded yet. If something's off, fix it now, so the interview itself goes smoothly.</p>
    <div class="iv-pre-grid">${needCam ? `<div class="iv-cam" id="ivPCamBox"><video id="ivPCam" muted playsinline autoplay aria-label="Your camera, only you can see it"></video><span class="iv-cam-tag">Only you can see this. Nothing is uploaded.</span></div>` : ""}
      <ul class="iv-chk" id="ivChecks">
        ${needCam ? `<li class="iv-chk-row pending" data-chk="cam"><span class="iv-chk-ico" aria-hidden="true"></span><span><b>Camera</b><em class="iv-chk-s">Asking your browser…</em></span></li><li class="iv-chk-row pending" data-chk="light"><span class="iv-chk-ico" aria-hidden="true"></span><span><b>Lighting</b><em class="iv-chk-s">Waiting for the camera…</em></span></li>` : ""}
        <li class="iv-chk-row pending" data-chk="mic"><span class="iv-chk-ico" aria-hidden="true"></span><span><b>Microphone</b><em class="iv-chk-s">${needCam ? "Waiting…" : "Asking your browser…"}</em><span class="iv-meter" aria-hidden="true"><i id="ivPMeter"></i></span></span></li>
        <li class="iv-chk-row pending" data-chk="spk"><span class="iv-chk-ico" aria-hidden="true"></span><span><b>Speaker</b><em class="iv-chk-s">Press the button to hear the interviewer.</em></span><button type="button" class="ig-btn ig-btn--ghost ig-btn--small" data-pre="hear">Hear the interviewer</button></li>
      </ul></div>
    <fieldset class="iv-selfcheck"><legend>Your own check (nobody sees this)</legend>${own.map(t => `<label class="q-check"><input type="checkbox"> ${esc(t)}</label>`).join("")}</fieldset>
    <div class="iv-actions"><button class="ig-btn ig-btn--primary" type="button" data-iv="pre-go" id="ivPreGo">Start the interview</button><button class="ig-btn ig-btn--ghost" type="button" data-iv="pre-back">Back</button></div></section>`;
  $("ivPreH").focus({ preventScroll: true });
  try { if (take.stream) { stopStream(take.stream); take.stream = null; } take.stream = await getPracticeMedia(needCam); take.cam = needCam; }
  catch { take.stream = null; if (needCam) { try { take.stream = await getPracticeMedia(false); take.cam = false; } catch { /* nothing allowed */ } } }
  if (take.token !== my || !$("ivChecks")) return;
  if (!take.stream) { if (needCam) { preSet("cam", "bad", "Not allowed. Use the camera icon in the address bar to allow it, then press Back and try again."); preSet("light", "pending", "Needs the camera."); } preSet("mic", "bad", "Not allowed. Use the icon in the address bar to allow the microphone, or go back and type your answers instead."); return; }
  if (needCam) {
    if (take.cam) { const v = $("ivPCam"); v.srcObject = take.stream; v.play().catch(() => {}); preSet("cam", "ok", "Working. That's you."); }
    else { preSet("cam", "warn", "No camera available, so this will be voice only."); preSet("light", "pending", "Not needed for voice only."); const cb = $("ivPCamBox"); if (cb) cb.hidden = true; }
  }
  preSet("mic", "pending", "Say something, like “Hello, my name is…”");
  pre.mic = false; pre.max = 0;
  const bar = $("ivPMeter");
  pre.meter = startMeter(take.stream, lvl => { pre.max = Math.max(pre.max, lvl); if (bar) bar.style.width = Math.min(100, Math.round(lvl * 320)) + "%"; });
  pre.timer = setInterval(() => {
    if (!$("ivChecks")) return stopPrecheck();
    if (pre.max > 0.04 && !pre.mic) { pre.mic = true; preSet("mic", "ok", "Picking up your voice."); }
    if (take.cam) {
      const l = sampleLight($("ivPCam"));
      if (l != null) preSet("light", l < 70 ? "warn" : l > 215 ? "warn" : "ok", l < 70 ? "A bit dark. Face a window or lamp so the light is in front of you." : l > 215 ? "Very bright. Turn so a window isn't behind you." : "Your face is well lit.");
    }
  }, 700);
}
onInit(() => {
  $("ivStage").addEventListener("click", e => {
    const b = e.target.closest("[data-pre]"); if (!b) return;
    if (b.dataset.pre === "hear") { speakText("Hello, thanks for joining us today. Can you hear me clearly?", null); preSet("spk", "pending", "Played. If you didn't hear it, turn your volume up and press the button again."); }
  });
  $("ivStage").addEventListener("click", e => {
    const b = e.target.closest("[data-take]"); if (!b) return;
    const a = b.dataset.take, q = iv.q, my = take.token;
    if (a === "stop") stopTake();
    else if (a === "skip") { stopSpeaking(); if (take.phase === "speaking") afterAsk(q, my); }
    else if (a === "start") startTake(q, my);
    else if (a === "retake") { const keep = take.stream; resetTake(true); take.q = q; take.phase = "idle"; const ta = $("ivAnswer"); if (ta) { ta.value = ""; updateCount(); } hideChoice(); const dn = $("ivDone"); if (dn) dn.hidden = true; ivStepTo(1); const bar = $("ivMeter"); take.meter = startMeter(take.stream, lvl => { if (bar) bar.style.width = Math.min(100, Math.round(lvl * 320)) + "%"; }); take.meterT0 = performance.now(); renderPlayback(); startTake(q, take.token); }
    else if (a === "replay") { stopSpeaking(); speakText(q.text, null); }
    else if (a === "retry") { resetTake(false); voiceBegin(q); }
    else if (a === "end") { endPractice(); takeSay("Practice ended. The camera and microphone are off."); }
    else if (a === "showq") { const p = $("ivStage").querySelector(".iv-q"); if (p) p.classList.remove("q-hidden"); }
  });
  // leaving the page turns the camera and microphone off
  window.addEventListener("hashchange", () => setTimeout(() => { if (currentView !== "interview") { if ($("ivRoomDlg").open) closeRoom("quiet"); else endPractice(); } }, 0));
  window.addEventListener("pagehide", () => endPractice());
});
