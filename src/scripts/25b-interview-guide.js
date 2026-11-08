/* ===================== Interviews: the interview guide (the "Interview guide" tab) ===================== */
// Strategies, a preparation checklist, the STAR method and builder, 40 likely questions, pay and super, AI interviews and your rights.
// The page itself is in index.html (#ivFormats); this file makes its tools work. Everything is looked up inside that panel.
onInit(() => {
  var root = document.getElementById("ivFormats");
  if (!root) return;
      var $ = function(s, r){ return (r || root).querySelector(s); };
    var $$ = function(s, r){ return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
    var store = {
      get: function(k, d){ try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function(k, v){ try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    };
    function copyText(text, statusEl){
      function fail(){ statusEl.textContent = "Couldn't copy here. Select the text and press Ctrl+C (or ⌘C)."; }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function(){ statusEl.textContent = "Copied to your clipboard."; }, fail);
        } else { fail(); }
      } catch (e) { fail(); }
    }
  
    /* ---------- Preparation checklist ---------- */
    var boxes = $$(".ig-check input[type=checkbox]");
    var ticks = store.get("ig-prep-v1", {});
    function updatePrep(){
      var done = boxes.filter(function(b){ return b.checked; }).length;
      $("#ig-prep-count").textContent = done + " of " + boxes.length + " done";
      $("#ig-prep-bar").style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
      $("#ig-prep-meter").setAttribute("aria-valuenow", String(done));
    }
    boxes.forEach(function(b){
      if (ticks[b.id]) b.checked = true;
      b.addEventListener("change", function(){ ticks[b.id] = b.checked; store.set("ig-prep-v1", ticks); updatePrep(); });
    });
    $("#ig-prep-reset").addEventListener("click", function(){
      boxes.forEach(function(b){ b.checked = false; }); ticks = {}; store.set("ig-prep-v1", ticks); updatePrep();
    });
    updatePrep();
  
    /* ---------- STAR builder ---------- */
    var EXAMPLE = {
      q: "Tell me about a time you dealt with an unhappy customer.",
      s: "On a busy Saturday at the café, a customer's order came out wrong for the second time and he was getting loud at the counter.",
      t: "I was on the register, so it was my job to sort it out without holding up the queue.",
      a: "I apologised without making excuses and asked exactly what he wanted. I walked the docket to the barista myself so his order went straight to the front, and offered him a voucher for his next visit, which our manager allows for repeat errors. Once he had his coffee, I told the kitchen what had gone wrong so it wouldn't happen a third time.",
      r: "He left calm and came back the next week to use the voucher. My manager started using the 'walk the docket' approach for every remake, and complaints about remakes dropped from about five a week to one."
    };
    var keys = ["q", "s", "t", "a", "r"];
    var fields = {};
    keys.forEach(function(k){ fields[k] = $("#ig-star-" + k); });
    var WPM = 140;
    function countWords(s){ var m = String(s).trim().match(/\S+/g); return m ? m.length : 0; }
    function fmtTime(secs){
      if (secs < 60) return secs + " sec";
      var m = Math.floor(secs / 60), s = secs % 60;
      return m + " min " + (s < 10 ? "0" : "") + s + " sec";
    }
    function analyse(v){
      var w = { s: countWords(v.s), t: countWords(v.t), a: countWords(v.a), r: countWords(v.r) };
      var total = w.s + w.t + w.a + w.r;
      var secs = Math.round(total / WPM * 60);
      var share = function(k){ return total ? w[k] / total : 0; };
      var hints = [];
      if (total === 0) {
        hints.push(["tip", "Start typing your story to see timing and balance."]);
      } else {
        if (w.r === 0) hints.push(["warn", "Add a result. What changed because of what you did?"]);
        if (total < 90) hints.push(["warn", "Quite short. Add detail about the steps you took."]);
        if (secs > 150) hints.push(["warn", "Over 2½ minutes. Trim the situation and task first."]);
        if (total >= 40 && share("a") < 0.4) hints.push(["warn", "Action is under 40% of your answer. Say more about what you did."]);
        if (total >= 40 && share("s") + share("t") > 0.4) hints.push(["warn", "The set-up is long. Cut the background to one or two sentences."]);
        if (w.r > 0 && !/\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|fifty|hundred|thousand|half|double|twice|triple|percent)\b/i.test(v.r)) hints.push(["tip", "No number in your result. Add one if you can, such as time saved, customers served, dollars or a rating."]);
        var we = (v.a.match(/\b(we|we're|we've|our|us)\b/gi) || []).length;
        var me = (v.a.match(/\b(i|i'm|i've|i'd|my|me)\b/gi) || []).length;
        if (we > me) hints.push(["warn", "Your action says \"we\" more than \"I\". Make your own part clear."]);
        if (!hints.length) hints.push(["good", "Well balanced. Now practise saying it out loud without reading it."]);
      }
      return { w: w, total: total, secs: secs, share: share, hints: hints };
    }
    function renderStar(){
      var v = {}; keys.forEach(function(k){ v[k] = fields[k].value; });
      var res = analyse(v);
      $("#ig-star-time").firstChild.nodeValue = res.total ? "About " + fmtTime(res.secs) : "0 sec";
      var names = { s: "Situation", t: "Task", a: "Action", r: "Result" };
      ["s", "t", "a", "r"].forEach(function(k){
        var seg = $('#ig-star-mix [data-k="' + k + '"]');
        var pct = res.total ? res.share(k) * 100 : 25;
        seg.style.width = pct + "%";
        seg.textContent = pct >= 7 ? k.toUpperCase() : "";
      });
      $("#ig-star-legend").innerHTML = ["s", "t", "a", "r"].map(function(k){
        var pct = res.total ? Math.round(res.share(k) * 100) : 0;
        return "<span><b>" + names[k] + "</b>" + pct + "% · " + res.w[k] + " words</span>";
      }).join("");
      var hl = $("#ig-star-hints"); hl.innerHTML = "";
      res.hints.forEach(function(h){ var li = document.createElement("li"); li.className = "is-" + h[0]; li.textContent = h[1]; hl.appendChild(li); });
    }
    function grow(el){ if (el.tagName !== "TEXTAREA") return; el.style.height = "auto"; el.style.height = (el.scrollHeight + 2) + "px"; }
    function setStar(obj){ keys.forEach(function(k){ fields[k].value = obj[k] || ""; grow(fields[k]); }); renderStar(); }
    var draft = store.get("ig-star-v1", null);
    if (draft) { setStar(draft); $("#ig-star-note").textContent = "Your saved draft is loaded. It's stored only in this browser."; }
    else { setStar(EXAMPLE); }
    keys.forEach(function(k){
      fields[k].addEventListener("input", function(){
        grow(fields[k]);
        var v = {}; keys.forEach(function(x){ v[x] = fields[x].value; }); store.set("ig-star-v1", v);
        $("#ig-star-note").textContent = "Your draft saves automatically in this browser.";
        renderStar();
      });
    });
    $("#ig-star-example").addEventListener("click", function(){ setStar(EXAMPLE); store.set("ig-star-v1", null); $("#ig-star-note").textContent = "An example is loaded. Replace it with your own story; your draft saves in this browser."; });
    $("#ig-star-clear").addEventListener("click", function(){ setStar({}); store.set("ig-star-v1", { q: "", s: "", t: "", a: "", r: "" }); $("#ig-star-note").textContent = "Cleared. Type your own story; your draft saves in this browser."; fields.q.focus(); });
    $("#ig-star-copy").addEventListener("click", function(){
      var t = (fields.q.value ? fields.q.value + "\n\n" : "") +
        "Situation: " + fields.s.value + "\nTask: " + fields.t.value + "\nAction: " + fields.a.value + "\nResult: " + fields.r.value;
      copyText(t, $("#ig-star-status"));
    });
  
    /* ---------- Question bank ---------- */
    var chips = $$("#ig-q-chips .ig-chip");
    var cards = $$("#ig-q-grid .ig-q");
    var search = $("#ig-q-search");
    var activeCat = "all";
    function filterQs(){
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function(c){
        var okCat = activeCat === "all" || c.getAttribute("data-cat") === activeCat;
        var okText = !q || c.textContent.toLowerCase().indexOf(q) !== -1;
        c.hidden = !(okCat && okText);
        if (!c.hidden) shown++;
      });
      $("#ig-q-empty").hidden = shown !== 0;
      $("#ig-q-status").textContent = shown === cards.length ? "Showing all " + cards.length + " questions" : "Showing " + shown + " of " + cards.length + " questions";
    }
    chips.forEach(function(ch){
      ch.addEventListener("click", function(){
        activeCat = ch.getAttribute("data-filter");
        chips.forEach(function(x){ x.setAttribute("aria-pressed", x === ch ? "true" : "false"); });
        filterQs();
      });
    });
    search.addEventListener("input", filterQs);
  
    /* ---------- Salary calculator ---------- */
    var cur0 = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
    var cur2 = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function calcPay(amount, basis, ratePct){
      var r = Math.max(0, ratePct) / 100, base, sup;
      if (basis === "package") { base = amount / (1 + r); sup = amount - base; }
      else { base = amount; sup = amount * r; }
      return { base: base, sup: sup, pkg: base + sup, fortnight: base / 26, hourly: base / (52 * 38) };
    }
    function renderCalc(){
      var amt = parseFloat($("#ig-calc-amt").value); if (!isFinite(amt) || amt < 0) amt = 0;
      var rate = parseFloat($("#ig-calc-rate").value); if (!isFinite(rate)) rate = 12;
      var basis = $("#ig-calc-pkg").checked ? "package" : "base";
      var o = calcPay(amt, basis, rate);
      $("#ig-calc-o-base").textContent = cur0.format(o.base);
      $("#ig-calc-o-super").textContent = cur0.format(o.sup);
      $("#ig-calc-o-pkg").textContent = cur0.format(o.pkg);
      $("#ig-calc-o-fn").textContent = cur0.format(o.fortnight);
      $("#ig-calc-o-hr").textContent = cur2.format(o.hourly);
    }
    ["#ig-calc-amt", "#ig-calc-rate", "#ig-calc-pkg", "#ig-calc-base"].forEach(function(s){ $(s).addEventListener("input", renderCalc); $(s).addEventListener("change", renderCalc); });
    renderCalc();
  
    /* ---------- Thank-you email ---------- */
    var tyIds = ["name", "you", "role", "company", "topic", "strength"];
    var tyPh = { name: "interviewer's name", you: "your name", role: "job title", company: "employer", topic: "something you discussed", strength: "a strength you'd bring" };
    function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function tyVals(){ var v = {}; tyIds.forEach(function(k){ v[k] = $("#ig-ty-" + k).value.trim(); }); return v; }
    function tyTemplate(v, html){
      var f = function(k){ return v[k] ? (html ? esc(v[k]) : v[k]) : (html ? '<span class="ph">[' + tyPh[k] + ']</span>' : "[" + tyPh[k] + "]"); };
      return "Subject: Thank you for today's " + f("role") + " interview\n\n" +
        "Hi " + f("name") + ",\n\n" +
        "Thank you for taking the time to meet with me today about the " + f("role") + " role at " + f("company") + ". I enjoyed hearing about " + f("topic") + ", and it made me even keener on the position.\n\n" +
        "Our conversation confirmed that my " + f("strength") + " would suit what the team needs. If you'd like anything else from me, such as referee details or examples of my work, I'm happy to send it through.\n\n" +
        "Kind regards,\n" + f("you");
    }
    function renderTy(){ $("#ig-ty-out").innerHTML = tyTemplate(tyVals(), true); }
    tyIds.forEach(function(k){ $("#ig-ty-" + k).addEventListener("input", renderTy); });
    $("#ig-ty-copy").addEventListener("click", function(){ copyText(tyTemplate(tyVals(), false), $("#ig-ty-status")); });
    renderTy();
  
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
  
    /* ---------- Links inside the guide scroll, they don't change the page address (that would leave the Interviews page) ---------- */
    root.addEventListener("click", function(e){
      var a = e.target.closest('a[href^="#ig-"]');
      if (a) {
        var t = root.querySelector("#" + CSS.escape(a.getAttribute("href").slice(1)));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
        return;
      }
      if (e.target.closest("[data-ig-practice]")) setIvTab("practice");
    });
});
