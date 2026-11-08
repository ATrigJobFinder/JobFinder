/* ===================== Resume advice: the resume guide ===================== */
// How resumes are screened, what to include and leave off, achievement bullets, tailoring, ATS, AI and cover letters, with a bullet checker and a final checklist.
// The page itself is in index.html (#advice-resume-body). The menu calls it the Resume checker.
// Everything typed into the tools stays in the browser.
onInit(() => {
  var root = document.getElementById("rgRoot");
  if (!root) return;
      var $ = function(s, r){ return (r || root).querySelector(s); };
    var $$ = function(s, r){ return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
    var store = {
      get: function(k, d){ try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function(k, v){ try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    };
    function grow(el){ el.style.height = "auto"; el.style.height = (el.scrollHeight + 2) + "px"; }
  
    /* ---------- Bullet checker ---------- */
    var VERBS = ("achieved addressed administered advised analysed answered applied approved arranged assembled assessed assisted audited automated balanced boosted briefed budgeted built calculated cared checked cleaned closed coached collaborated completed configured consolidated constructed contributed controlled converted coordinated corrected counselled created cut decreased defined delegated delivered designed developed diagnosed directed doubled drafted drove edited educated eliminated enabled engineered ensured established estimated evaluated exceeded expanded facilitated filed finished fitted fixed forecast forecasted founded generated grew guided halved handled hired identified implemented improved increased influenced initiated inspected installed introduced investigated launched led lifted maintained managed mentored met migrated monitored motivated negotiated onboarded opened operated orchestrated organised organized oversaw packed partnered performed picked planned prepared presented prevented prioritised processed produced programmed promoted proposed protected provided published raised ran rebuilt received recommended reconciled recruited redesigned reduced refined renovated reorganised repaired replaced reported represented researched resolved restored restructured reviewed revised rostered saved scheduled secured served set settled shipped simplified sold solved sorted spearheaded standardised started streamlined strengthened supervised supported surveyed taught tested tracked trained transformed tripled troubleshot tutored updated upgraded upskilled used welcomed won wrote").split(" ");
    var WEAK = /^(responsible for|duties (included|include)|duties:?|helped( with| to)?|assisted (with|in)|worked (on|in|with|as)|tasked with|in charge of|involved in|participated in|was |i was |my role|role:)/i;
    var FILLER = ["hard-working","hardworking","hard working","team player","go-getter","detail-oriented","detail oriented","results-driven","results driven","dynamic","synergy","proven track record","think outside the box","self-starter","self starter","passionate","various","etc","spearheaded","leveraged","orchestrated","utilised","utilized"];
    var NUMWORDS = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|fifty|hundred|thousand|million|half|double|doubled|twice|tripled|halved|percent|dozens?)\b/i;
    var RESULT = /(\bso that\b|\bresult(ing|ed)? in\b|\bleading to\b|\bwhich\b|\bcut\b|\breduc|\bincreas|\bimprov|\bsav(ed|ing)\b|\bgrew\b|\braised?\b|\bboost|\blift|\bfrom\b.+\bto\b|\bwithout\b|\bzero\b|\bno (missed|errors|complaints|incidents|defects)|\bfirst time\b|\bahead of\b|\bunder budget\b|\bon time\b|\bachiev|\bexceed|\bwon\b|\baward|\bpromoted\b|\b\d+(\.\d+)?%)/i;
    function words(s){ var m = s.trim().match(/\S+/g); return m ? m : []; }
    function checkBullet(raw){
      var s = raw.replace(/^[\s•\-\*–·]+/, "").trim();
      var w = words(s);
      var first = (w[0] || "").toLowerCase().replace(/[^a-z\-]/g, "");
      var lower = s.toLowerCase();
      var fillers = FILLER.filter(function(f){ return new RegExp("(^|[^a-z])" + f.replace(/[-\s]/g, "[-\\s]?") + "([^a-z]|$)").test(lower); });
      var res = {
        verb: !!first && !WEAK.test(s) && (VERBS.indexOf(first) !== -1 || /ed$/.test(first)) && first !== "i",
        number: /\d|\$|%/.test(s) || NUMWORDS.test(s),
        result: RESULT.test(s),
        length: w.length >= 8 && w.length <= 35,
        clean: fillers.length === 0 && !/\b(i|my|me)\b/i.test(s)
      };
      var hints = [];
      if (!s) return { empty: true, res: res, hints: [["tip", "Type a bullet, or tap one of the examples."]], score: 0 };
      if (WEAK.test(s)) hints.push(["warn", "It starts with a duty. Start with what you did: Led, Cut, Trained, Served, Built."]);
      else if (!res.verb) hints.push(["warn", "Start with a past-tense action verb, such as Managed, Resolved or Installed."]);
      if (!res.number) hints.push(["tip", "Add a number: how many, how much, how often or how fast."]);
      if (!res.result) hints.push(["tip", "Add the result. What changed because of your work?"]);
      if (w.length < 8) hints.push(["warn", "Too short to show impact. Add what you did and what it achieved."]);
      if (w.length > 35) hints.push(["warn", "Long for a bullet. Aim for one or two lines, about 15 to 30 words."]);
      if (/\b(i|my|me)\b/i.test(s)) hints.push(["warn", "Drop \"I\" and \"my\". Resume bullets start with the verb."]);
      if (fillers.length) hints.push(["warn", "Cut filler or AI-sounding words: " + fillers.map(function(f){ return "\"" + f + "\""; }).join(", ") + ". Show it with evidence instead."]);
      var score = ["verb","number","result","length","clean"].filter(function(k){ return res[k]; }).length;
      if (!hints.length) hints.push(["good", "Strong bullet. Make sure you can explain the number in an interview."]);
      return { res: res, hints: hints, score: score };
    }
    var bcIn = $("#rg-bc-in");
    function renderBullet(){
      var out = checkBullet(bcIn.value);
      var labels = [["verb","Starts with an action verb"],["number","Includes a number or scale"],["result","Shows a result"],["length","One or two lines long"],["clean","No filler words or \"I\""]];
      $("#rg-bc-checks").innerHTML = "";
      labels.forEach(function(l){ var li = document.createElement("li"); li.textContent = l[1]; if (out.res[l[0]] && !out.empty) li.className = "is-ok"; $("#rg-bc-checks").appendChild(li); });
      var hl = $("#rg-bc-hints"); hl.innerHTML = "";
      out.hints.forEach(function(h){ var li = document.createElement("li"); li.className = "is-" + h[0]; li.textContent = h[1]; hl.appendChild(li); });
      var v = out.empty ? "Waiting for a bullet" : out.score >= 5 ? "Strong" : out.score >= 3 ? "Getting there" : "Weak";
      $("#rg-bc-verdict").textContent = v;
      $("#rg-bc-meter").setAttribute("data-score", String(out.empty ? 0 : out.score));
    }
    bcIn.addEventListener("input", function(){ grow(bcIn); renderBullet(); });
    $$("#rg-bc-examples .ig-chip").forEach(function(b){ b.addEventListener("click", function(){ bcIn.value = b.textContent; grow(bcIn); renderBullet(); }); });
    bcIn.value = "Cut month-end close from 8 days to 5 by automating three reconciliations in Excel";
    renderBullet();
  
    /* ---------- Final checklist ---------- */
    var boxes = $$(".ig-check input[type=checkbox]");
    var ticks = store.get("ig-resume-check-v1", {});
    function updateRc(){
      var done = boxes.filter(function(b){ return b.checked; }).length;
      $("#rg-rc-count").textContent = done + " of " + boxes.length + " done";
      $("#rg-rc-bar").style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
      $("#rg-rc-meter").setAttribute("aria-valuenow", String(done));
    }
    boxes.forEach(function(b){
      if (ticks[b.id]) b.checked = true;
      b.addEventListener("change", function(){ ticks[b.id] = b.checked; store.set("ig-resume-check-v1", ticks); updateRc(); });
    });
    $("#rg-rc-reset").addEventListener("click", function(){ boxes.forEach(function(b){ b.checked = false; }); ticks = {}; store.set("ig-resume-check-v1", ticks); updateRc(); });
    updateRc();
  
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
      var a = e.target.closest('a[href^="#rg-"]');
      if (!a) return;
      var t = root.querySelector("#" + CSS.escape(a.getAttribute("href").slice(1)));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
    });
});
