/* ===================== App shell: sidebar and tabs ===================== */
const VIEWS = { home: "Home", connect: "Connect your AI", builder: "Create or edit resume", letter: "Create or edit cover letter", cv: "Resume and cover letter templates", linkedin: "Create or edit LinkedIn", profile: "Create or edit profile", jobs: "Find jobs", scanner: "Tailor to a job", companies: "Company guides", tracker: "Application tracker", interview: "Interviews", aptitude: "Aptitude tests", learning: "Learning", employer: "Hiring" };
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

function applyNav() {
  const mob = mobileNav();
  const drawer = appEl.dataset.drawer === "open";
  appEl.dataset.nav = mob ? "open" : navPref;
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
// Collapsed to icons: hovering (or tabbing into) the sidebar opens it over the page, and leaving closes it again
let peekTimer = null;
function setPeek(on) {
  clearTimeout(peekTimer);
  peekTimer = setTimeout(() => {
    if (on && (mobileNav() || appEl.dataset.nav !== "rail")) return;
    if (on) appEl.dataset.peek = "on"; else delete appEl.dataset.peek;
  }, on ? 120 : 220);
}
$("sidenav").addEventListener("mouseenter", () => setPeek(true));
$("sidenav").addEventListener("mouseleave", () => { if (!$("sidenav").contains(document.activeElement)) setPeek(false); });
$("sidenav").addEventListener("focusin", () => setPeek(true));
$("sidenav").addEventListener("focusout", e => { if (!$("sidenav").contains(e.relatedTarget) && !$("sidenav").matches(":hover")) setPeek(false); });
$("sidenav").addEventListener("click", e => { if (e.target.closest(".sn-item")) setPeek(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && appEl.dataset.drawer === "open") closeDrawer(true); });
matchMedia("(max-width: 899px)").addEventListener("change", applyNav);

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
document.querySelectorAll(".sn-item").forEach(a => a.addEventListener("click", e => {
  // the same tab again: just close the drawer
  if (a.dataset.view === currentView) { e.preventDefault(); closeDrawer(false); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }); }
}));

// Make a file and hand it to the viewer, with plain-English status messages
async function downloadMade(name, make, statusEl, btn) {
  const say = m => { if (statusEl) { statusEl.classList.remove("err"); statusEl.textContent = m; } };
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
/* renderAiChip lives with Connect your AI */

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
  if (!$("aiDl") && progress) progress("Getting Chrome's AI ready…");
  if (frac >= 1) { aiCorner({ title: "Chrome's AI is ready", frac: 1, done: true }); if (progress) progress("Writing…"); return; }
  aiCorner({ title: "Getting Chrome's AI ready", sub: "A one-time download. You can keep working.", frac });
}

