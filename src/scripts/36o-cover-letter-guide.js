/* ===================== Cover letter advice: the cover letter guide ===================== */
// When you need one, what AI changed, the paragraph-by-paragraph structure, three full example letters and a final checklist.
// The page itself is in index.html (#advice-letter-body). The menu calls it Cover Letter Advice.
// Everything typed into the tools stays in the browser.
onInit(() => {
  var root = document.getElementById("cgRoot");
  if (!root) return;
      var $ = function(s, r){ return (r || root).querySelector(s); };
    var $$ = function(s, r){ return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
    var store = {
      get: function(k, d){ try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function(k, v){ try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    };
  
    /* ---------- Example tabs ---------- */
    var tabs = $$("#cg-ex-tabs .ig-tab");
    function selectTab(t){
      tabs.forEach(function(x){
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        $("#" + x.getAttribute("aria-controls")).hidden = !on;
      });
    }
    tabs.forEach(function(t, i){
      t.addEventListener("click", function(){ selectTab(t); });
      t.addEventListener("keydown", function(e){
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
          selectTab(n); n.focus(); e.preventDefault();
        }
      });
    });
    selectTab(tabs[0]);
  
    /* ---------- Checklist ---------- */
    var boxes = $$(".ig-check input[type=checkbox]");
    var ticks = store.get("ig-cl-check-v1", {});
    function updateCl(){
      var done = boxes.filter(function(b){ return b.checked; }).length;
      $("#cg-cl-count").textContent = done + " of " + boxes.length + " done";
      $("#cg-cl-bar").style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
      $("#cg-cl-meter").setAttribute("aria-valuenow", String(done));
    }
    boxes.forEach(function(b){
      if (ticks[b.id]) b.checked = true;
      b.addEventListener("change", function(){ ticks[b.id] = b.checked; store.set("ig-cl-check-v1", ticks); updateCl(); });
    });
    $("#cg-cl-reset").addEventListener("click", function(){ boxes.forEach(function(b){ b.checked = false; }); ticks = {}; store.set("ig-cl-check-v1", ticks); updateCl(); });
    updateCl();
  
    /* ---------- Contents highlighting ---------- */
    var tocLinks = $$(".ig-toc a");
    if ("IntersectionObserver" in window && tocLinks.length) {
      var byId = {};
      tocLinks.forEach(function(a){ byId[a.getAttribute("href").slice(1)] = a; });
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting && byId[e.target.id]) {
            tocLinks.forEach(function(a){ a.removeAttribute("aria-current"); });
            byId[e.target.id].setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-35% 0px -60% 0px" });
      $$(".ig-section[id]").forEach(function(s){ io.observe(s); });
    }
  
    /* ---------- Links inside the guide scroll, they don't change the page address (that would leave the page) ---------- */
    root.addEventListener("click", function(e){
      var a = e.target.closest('a[href^="#cg-"]');
      if (!a) return;
      var t = root.querySelector("#" + CSS.escape(a.getAttribute("href").slice(1)));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
    });
});
