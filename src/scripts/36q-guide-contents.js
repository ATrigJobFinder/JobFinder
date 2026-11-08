/* ===================== Checker pages: the contents column on small screens ===================== */
// Beside the guide the contents column is always on screen (CSS). On a phone there's no room for it, so a small see-through
// button takes its place; pressing it slides the same contents out, and choosing a section scrolls to it and tucks it away again.
// The button and drawer live on <body>, not inside the page: the page's main area is a CSS container, which would make a "fixed"
// button scroll away with the page.
onInit(() => {
  const roots = () => [...document.querySelectorAll(".ig")].filter(r => r.querySelector(".ig-toc"));
  const host = document.createElement("div");
  host.className = "ig ig-fab-host";
  host.setAttribute("data-nohelp", "");
  host.innerHTML = `<button type="button" class="ig-toc-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="igDrawer" aria-label="Contents: jump to a section" title="Contents">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg></button>
    <div class="ig-drawer-scrim" hidden></div>
    <div class="ig-drawer" id="igDrawer" role="dialog" aria-modal="true" aria-label="Contents">
      <div class="ig-drawer-head"><span>Jump to a section</span><button type="button" class="ig-drawer-x" aria-label="Close the contents">×</button></div>
      <nav class="ig-drawer-nav" aria-label="Guide contents"></nav>
    </div>`;
  document.body.appendChild(host);
  const fab = host.querySelector(".ig-toc-fab"), scrim = host.querySelector(".ig-drawer-scrim"), nav = host.querySelector(".ig-drawer-nav"), x = host.querySelector(".ig-drawer-x");
  let active = null;

  // the guide on screen right now, if any
  const visibleRoot = () => roots().find(r => r.offsetParent !== null) || null;
  const small = () => window.matchMedia("(max-width: 760px)").matches;
  function sync() {
    active = visibleRoot();
    host.classList.toggle("is-on", !!active);
    if (!active) close(false);
  }
  function fill() {
    const src = active && active.querySelector(".ig-toc nav");
    if (!src) return;
    nav.innerHTML = src.innerHTML;
    nav.querySelectorAll("a").forEach(a => a.removeAttribute("id"));
  }
  function open() {
    if (!active || !small()) return;
    fill();
    scrim.hidden = false;
    host.classList.add("is-open");
    fab.setAttribute("aria-expanded", "true");
    const cur = nav.querySelector('a[aria-current="true"]') || nav.querySelector("a");
    if (cur) { cur.scrollIntoView({ block: "center" }); cur.focus({ preventScroll: true }); }
  }
  function close(refocus = true) {
    if (!host.classList.contains("is-open")) return;
    host.classList.remove("is-open");
    scrim.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    if (refocus) fab.focus({ preventScroll: true });
  }
  fab.addEventListener("click", () => host.classList.contains("is-open") ? close() : open());
  scrim.addEventListener("click", () => close());
  x.addEventListener("click", () => close());
  document.addEventListener("keydown", e => { if (e.key === "Escape" && host.classList.contains("is-open")) close(); });
  nav.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();   // a changed page address would leave the page
    const t = document.getElementById(a.getAttribute("href").slice(1));
    close(false);
    if (t) t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  });

  // pages come and go as people move around; check again when they do
  window.addEventListener("hashchange", sync);
  document.addEventListener("jf:guides", () => requestAnimationFrame(sync));
  window.addEventListener("resize", () => { sync(); if (!small()) close(false); });
  new MutationObserver(() => { cancelAnimationFrame(sync.raf); sync.raf = requestAnimationFrame(sync); })
    .observe($("main") || document.body, { attributes: true, attributeFilter: ["hidden"], subtree: true });
  sync();
});
