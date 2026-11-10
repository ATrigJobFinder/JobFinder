/* ===================== Choose your AI: the Gemini key guide (its pictures are in 36s-gemini-key-images.js) ===================== */
const GEMINI_GUIDE_STEPS = [
  { img: "welcome", alt: "Google AI Studio's welcome page, with the 18-or-over tick box and the Continue button circled in blue", title: "Sign in and accept the welcome page",
    text: `Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> and sign in with your Google account. The first time, a welcome page appears: <b>tick the box</b> that says you are 18 or over, then press <b>Continue</b>.` },
  { img: "skip", alt: "Google AI Studio's 'What brings you' page with the Skip button circled in blue", title: "Skip the questions",
    text: `On "What brings you to Google AI Studio?", press <b>Skip</b> (bottom left).` },
  { img: "create", alt: "The API Keys page with the Create API key button circled in blue at the top right", title: "Create your key",
    text: `On the API Keys page, press <b>Create API key</b> (top right). If it asks for a project, choose <b>Default Gemini Project</b>. It is free: you don't need to set up billing.` },
  { img: "copy", alt: "The API Keys list with the copy icon on the new key's row circled in blue", title: "Copy the key",
    text: `Your new key appears in the list. Press the <b>copy icon</b> on its row.`,
    more: { img: "details", alt: "The API key details box with the Copy key button circled in blue", text: `You can also select the key's name, then press <b>Copy key</b>.` } },
  { title: "Paste it here", text: `Come back to this page, paste the key into the <b>API key</b> box below, and press <b>Test and use</b>. Job Finder checks it works, and keeps it in this browser only.` }
];
// Optional last tip: where Google shows the free limits
const GEMINI_GUIDE_LIMITS = { img: "limits", alt: "Google AI Studio's Rate Limit page with Rate Limit in the left menu circled in blue", text: `Free keys have limits for each model. If Job Finder ever says the free limit has been reached, you can see yours in AI Studio: choose <b>Rate Limit</b> in the left menu. Job Finder tries an older model by itself when one is over its limit.` };
function geminiGuideHtml() {
  const fig = (img, alt) => `<figure class="aic-gfig"><img src="${GEMINI_GUIDE_IMGS[img]}" alt="${esc(alt)}" loading="lazy" decoding="async"></figure>`;
  // folded to a faded glimpse of the first step; "Show all steps" (or a click on the glimpse) opens it
  return `<div class="aic-guide is-folded">
    <div class="aic-guide-head"><span><b>How to get your free Gemini key</b> <span class="small muted">about 2 minutes, with pictures</span></span><button class="btn" type="button" data-aic-guide aria-expanded="false" aria-controls="aicGuideBody">Show all steps</button></div>
    <div class="aic-guide-body" id="aicGuideBody" inert>
      <ol class="aic-gsteps">${GEMINI_GUIDE_STEPS.map((s, i) => `<li><span class="aic-gn" aria-hidden="true">${i + 1}</span><div class="aic-gbody"><b>${esc(s.title)}</b><p>${s.text}</p>${s.img ? fig(s.img, s.alt) : ""}${s.more ? `<p class="aic-gmore">${s.more.text}</p>${fig(s.more.img, s.more.alt)}` : ""}</div></li>`).join("")}</ol>
      <details class="aic-gtip"><summary>Optional: see your free limits</summary><p>${GEMINI_GUIDE_LIMITS.text}</p>${fig(GEMINI_GUIDE_LIMITS.img, GEMINI_GUIDE_LIMITS.alt)}</details>
    </div>
  </div>`;
}
function aicGuideToggle(box, open) {
  const body = box.querySelector(".aic-guide-body"), b = box.querySelector("[data-aic-guide]");
  box.classList.toggle("is-folded", !open); body.inert = !open;
  b.setAttribute("aria-expanded", String(open)); b.textContent = open ? "Hide steps" : "Show all steps";
}
document.addEventListener("click", e => {
  const box = e.target.closest && e.target.closest(".aic-guide"); if (!box) return;
  if (e.target.closest("[data-aic-guide]")) aicGuideToggle(box, box.classList.contains("is-folded"));
  else if (box.classList.contains("is-folded")) aicGuideToggle(box, true);   // a click on the glimpse opens it
});
