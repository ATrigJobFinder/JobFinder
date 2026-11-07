/* ===================== App shell: sidebar and tabs ===================== */
const VIEWS = { "advice-resume": "Resume advice", "advice-letter": "Cover letter advice", "advice-linkedin": "LinkedIn advice", support: "Contact or help", home: "Home", connect: "Choose your AI", builder: "Create or edit resume", letter: "Create or edit cover letter", cv: "Resume and cover letter templates", linkedin: "Create or edit LinkedIn", profile: "Create or edit profile", jobs: "Find jobs", scanner: "Tailor to a job", companies: "Company guides", tracker: "Application tracker", interview: "Interviews", aptitude: "Aptitude tests", learning: "Learning", employer: "Hiring" };
const NAV_KEY = "jobfinder.nav.v1", VIEW_KEY = "jobfinder.view.v1", MODE_KEY = "jobfinder.mode.v1";
const EMPLOYER_VIEWS = new Set(["employer", "jobs", "connect"]);
const appEl = $("app");
const initFns = [];
const onInit = fn => initFns.push(fn);
const viewHooks = {};
const mobileNav = () => matchMedia("(max-width: 899px)").matches;
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
let navPref = lsGet(NAV_KEY) === "rail" ? "rail" : "open";
let currentView = "";
let appMode = lsGet(MODE_KEY) === "employer" ? "employer" : "seeker";
// Job seeker or employer: each sees its own menu
function setMode(mode, go) {
  appMode = mode === "employer" ? "employer" : "seeker";
  lsSet(MODE_KEY, appMode);
  appEl.dataset.mode = appMode;
  document.querySelectorAll(".sn-mode [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === appMode)));
  document.querySelectorAll("#sidenav [data-for]").forEach(el => { el.hidden = el.dataset.for !== appMode; });
  if (go) openView(appMode === "employer" ? "employer" : "home");
}
document.querySelectorAll(".sn-mode [data-mode]").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode, true)));
// the Job Finder logo is the way home (an employer's home is Hiring)
$("snHome").addEventListener("click", e => {
  e.preventDefault();
  closeDrawer(false);
  if (appMode !== "employer") globeToGlobe();   // if the map was open, the logo takes you back out to the globe
  if (currentView === (appMode === "employer" ? "employer" : "home")) window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  else openView(appMode === "employer" ? "employer" : "home");
});

// On a wide screen there is one bar across the top: the AI chip and the account buttons sit at the right of it.
// On a phone they stay in the thin bar under the menu button.
function placeBar() {
  const to = mobileNav() ? $("appbar") : $("snRight");
  for (const el of [document.querySelector(".ab-ai-wrap"), document.querySelector(".ab-tools")]) if (el && to && el.parentElement !== to) to.appendChild(el);
}
function applyNav() {
  const mob = mobileNav();
  placeBar();
  const drawer = appEl.dataset.drawer === "open";
  appEl.dataset.nav = "open";   // wide screens have the menu as a bar across the top (27-header-nav.css); only phones use the drawer
  if (!mob) appEl.dataset.drawer = "";
  const sn = $("sidenav");
  sn.inert = mob && !drawer;
  $("scrim").hidden = !(mob && drawer);
  const expanded = mob ? drawer : navPref === "open";
  const t = $("navToggle");
  t.setAttribute("aria-expanded", String(expanded));
  t.setAttribute("aria-label", mob ? (drawer ? "Close the menu" : "Open the menu") : (expanded ? "Collapse the menu" : "Expand the menu"));
}
function closeDrawer(focusToggle) {
  if (appEl.dataset.drawer !== "open") return;
  appEl.dataset.drawer = "";
  applyNav();
  if (focusToggle) $("navToggle").focus();
}
$("navToggle").addEventListener("click", () => {
  if (mobileNav()) {
    appEl.dataset.drawer = appEl.dataset.drawer === "open" ? "" : "open";
    applyNav();
    if (appEl.dataset.drawer === "open") ($("sidenav").querySelector('[aria-current="page"]') || $("sidenav").querySelector(".sn-item")).focus();
  } else {
    navPref = navPref === "open" ? "rail" : "open";
    lsSet(NAV_KEY, navPref);
    applyNav();
  }
});
$("scrim").addEventListener("click", () => closeDrawer(true));
// The drop-down groups (Application documents, Find work, Get ready): hover or focus opens one; pressing the name opens it too (touch, keyboard)
document.querySelectorAll(".sn-menu").forEach(m => {
  const btn = m.querySelector(".sn-menu-btn");
  btn.addEventListener("click", () => { const open = !m.classList.contains("open"); document.querySelectorAll(".sn-menu.open").forEach(x => { x.classList.remove("open"); x.querySelector(".sn-menu-btn").setAttribute("aria-expanded", "false"); }); m.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); });
  m.addEventListener("mouseleave", () => m.classList.remove("shut"));
  m.addEventListener("click", e => { if (e.target.closest(".sn-item")) { m.classList.remove("open"); m.classList.add("shut"); btn.setAttribute("aria-expanded", "false"); if (document.activeElement && m.contains(document.activeElement)) document.activeElement.blur(); } });
});
document.addEventListener("click", e => { if (!e.target.closest(".sn-menu")) document.querySelectorAll(".sn-menu.open").forEach(x => { x.classList.remove("open"); x.querySelector(".sn-menu-btn").setAttribute("aria-expanded", "false"); }); });
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".sn-menu.open").forEach(x => { x.classList.remove("open"); x.querySelector(".sn-menu-btn").setAttribute("aria-expanded", "false"); }); });
// Collapsed to icons: hovering (or tabbing into) the sidebar opens it over the page, and leaving closes it again
let peekTimer = null;
function setPeek(on) {
  clearTimeout(peekTimer);
  const apply = () => {
    if (on && (mobileNav() || appEl.dataset.nav !== "rail")) return;
    if (on) appEl.dataset.peek = "on"; else delete appEl.dataset.peek;
  };
  if (on) apply(); else peekTimer = setTimeout(apply, 140);
}
$("sidenav").addEventListener("mouseenter", () => setPeek(true));
$("sidenav").addEventListener("mouseleave", () => { if (!$("sidenav").contains(document.activeElement)) setPeek(false); });
$("sidenav").addEventListener("focusin", () => setPeek(true));
$("sidenav").addEventListener("focusout", e => { if (!$("sidenav").contains(e.relatedTarget) && !$("sidenav").matches(":hover")) setPeek(false); });
$("sidenav").addEventListener("click", e => { if (e.target.closest(".sn-item")) setPeek(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && appEl.dataset.drawer === "open") closeDrawer(true); });
matchMedia("(max-width: 899px)").addEventListener("change", applyNav);

// A short message in the corner: kind "ok" is green, "warn" is yellow
function toast(msg, kind = "ok") {
  let t = document.getElementById("jfToast");
  if (!t) { t = document.createElement("div"); t.id = "jfToast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.className = "jf-toast " + kind; t.textContent = msg; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, 3400);
}
function showView(name, opts = {}) {
  if (!VIEWS[name]) name = appMode === "employer" ? "employer" : "home";
  if (appMode === "employer" && !EMPLOYER_VIEWS.has(name)) setMode("seeker");
  if (name === "employer" && appMode !== "employer") setMode("employer");
  const changed = name !== currentView;
  currentView = name;
  for (const k of Object.keys(VIEWS)) { const v = $("view-" + k); if (v) v.hidden = k !== name; }
  document.querySelectorAll(".sn-item").forEach(a => { if (a.dataset.view === name && !a.hidden) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  $("abView").textContent = name === "jobs" && appMode === "employer" ? "Job market" : VIEWS[name];
  lsSet(VIEW_KEY, name);
  closeDrawer(false);
  if (viewHooks[name]) { try { viewHooks[name](opts); } catch (e) { console.error(e); } }
  if (changed && !opts.keepScroll) window.scrollTo({ top: 0 });
}
// Go to a tab from code (keeps the address in step so Back works)
function openView(name, opts = {}) {
  if (location.hash.slice(1) === name) showView(name, opts);
  else { pendingViewOpts = opts; location.hash = name; }
}
let pendingViewOpts = null;
window.addEventListener("hashchange", () => { const o = pendingViewOpts || {}; pendingViewOpts = null; showView(location.hash.slice(1), o); });
// "Job map" in the Find work menu: the home page, then down into the map
document.querySelectorAll('[data-act="job-map"]').forEach(a => a.addEventListener("click", e => {
  e.preventDefault(); closeDrawer(false);
  if (currentView === "home") globeOpenMap(); else { openView("home"); setTimeout(() => globeOpenMap(), 400); }
}));
document.querySelectorAll(".sn-item").forEach(a => a.addEventListener("click", e => {
  // the same tab again: just close the drawer
  if (a.dataset.view === currentView) { e.preventDefault(); closeDrawer(false); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }); }
}));

// Make a file and hand it to the viewer, with plain-English status messages
async function downloadMade(name, make, statusEl, btn) {
  const say = m => { if (statusEl) { statusEl.classList.remove("err"); statusEl.textContent = m; } };
  // ask what to call the file (the ending stays as it is)
  const dot = name.lastIndexOf("."), stem = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : "";
  const chosen = typeof askName === "function" ? await askName({ title: "Name your file", text: ext ? `It will be saved as a ${ext.slice(1).toUpperCase()} file.` : "", label: "File name", value: stem, ok: "Download" }) : stem;
  if (!chosen) { if (statusEl) { statusEl.classList.remove("err"); statusEl.textContent = "Download cancelled."; } return false; }
  name = chosen.replace(/[\\/:*?"<>|]+/g, "").trim().replace(new RegExp(ext.replace(".", "\\.") + "$", "i"), "") + ext;
  if (btn) btn.disabled = true;
  say("Preparing your file…");
  try {
    const blob = await make();
    say("Confirm the download in the prompt…");
    const res = await saveFile(name, blob);
    say(res && res.status === "delivered" ? "Sent." : `Downloaded ${name}.`);
    return true;
  } catch (e) {
    const code = e && e.code;
    if (statusEl) statusEl.classList.add("err");
    if (statusEl) statusEl.textContent = code === "declined" ? "Download cancelled." : code === "rate_limited" ? "A download prompt is already open. Finish that one first."
      : ["unavailable", "not_granted", "capability_disabled", "capability_removed"].includes(code) ? "Downloads aren't available here." : "Couldn't create the file. Try again.";
    if (!code) console.error(e);
    return false;
  } finally { if (btn) btn.disabled = false; }
}

/* --- Which AI is doing the work, and how to turn on Chrome's --- */
/* renderAiChip lives with Choose your AI */

/* --- A small card in the corner for long AI waits: downloads, getting ready, and writing, with the time left --- */
// o: { title, sub, frac (0 to 1, or null when there's no measure), done }; null removes it
function aiCorner(o) {
  let el = $("aiDl");
  if (!o) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "aiDl"; el.className = "ai-dl";
    el.innerHTML = `<div class="ai-dl-text"><b aria-live="polite"></b><span></span></div><div class="ai-dl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>`;
    document.body.appendChild(el);
  }
  clearTimeout(el._t);
  el.classList.toggle("done", !!o.done);
  const b = el.querySelector("b");
  if (b.textContent !== (o.title || "")) b.textContent = o.title || "";
  el.querySelector(".ai-dl-text span").textContent = o.sub || "";
  const bar = el.querySelector(".ai-dl-bar"), i = bar.querySelector("i");
  bar.setAttribute("aria-label", o.title || "Progress");
  if (o.frac == null) { bar.classList.add("busy"); bar.removeAttribute("aria-valuenow"); i.style.width = ""; }
  else { bar.classList.remove("busy"); const pct = Math.max(0, Math.min(100, Math.round(o.frac * 100))); i.style.width = pct + "%"; bar.setAttribute("aria-valuenow", pct); }
  if (o.done) el._t = setTimeout(() => el.remove(), 1600);
}
/* Chrome's one-time model download */
function aiDownloadProgress(frac, progress) {
  if (!$("aiDl") && frac >= 1) return;   // already on this computer: nothing to show
  if (!$("aiDl") && progress) progress("Getting " + BROWSER_AI() + " ready…");
  if (frac >= 1) { aiCorner({ title: BROWSER_AI() + " is ready", frac: 1, done: true }); if (progress) progress("Writing…"); return; }
  aiCorner({ title: "Getting " + BROWSER_AI() + " ready", sub: "A one-time download. You can keep working.", frac });
}


// A short message at the bottom of the screen, like the AI's Stop bar. It goes after 3 seconds, and can carry an Undo.
function actToast(msg, undo) {
  let t = document.getElementById("jfAct");
  if (!t) { t = document.createElement("div"); t.id = "jfAct"; t.className = "act-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.innerHTML = `<span class="act-tick" aria-hidden="true">✓</span><span>${esc(msg)}</span>${undo ? `<button type="button" class="linkish act-undo">Undo</button>` : ""}`;
  const b = t.querySelector(".act-undo");
  if (b) b.addEventListener("click", () => { clearTimeout(t._t); t.hidden = true; undo(); }, { once: true });
  t.hidden = false; t.classList.remove("in"); void t.offsetWidth; t.classList.add("in");
  clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, 3000);
}
