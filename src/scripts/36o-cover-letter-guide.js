/* ===================== Cover letter advice: the cover letter guide ===================== */
// When you need one, what AI changed, the paragraph-by-paragraph structure, three full example letters, a letter checker and a final checklist.
// The page itself is in index.html (#advice-letter-body). The menu calls it the Cover letter checker.
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
    function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function words(s){ var m = String(s).trim().match(/[A-Za-z0-9’'\-]+/g); return m ? m.length : 0; }
  
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
  
    /* ---------- Letter checker ---------- */
    var CLICHES = ["to whom it may concern","dear sir","i am writing to","i'm writing to","i believe i would be","perfect fit","perfect candidate","ideal candidate","team player","hard-working","hardworking","hard working","go-getter","self-starter","self starter","passionate","dynamic","results-driven","results driven","proven track record","think outside the box","detail-oriented","detail oriented","i am confident that","i am excited to apply","i'm excited to apply","thrilled","delve","tapestry","leverage","leveraged","spearheaded","seamlessly","unwavering","commitment to excellence","fast-paced environment","synergy","wealth of experience","at your earliest convenience","valuable asset","please find attached","please find enclosed","my name is"];
    var NUMWORDS = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|fifty|hundred|thousand|million|half|double|doubled|twice|tripled|halved|percent)\b/i;
    function analyseLetter(text, company, role){
      var t = text.replace(/\r/g, "");
      var lower = t.toLowerCase().replace(/[’]/g, "'");
      var n = words(t);
      var paras = t.split(/\n\s*\n/).map(function(p){ return p.trim(); }).filter(function(p){ return words(p) >= 12; }).length;
      var sentences = (t.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || []).map(function(s){ return s.trim(); }).filter(function(s){ return words(s) >= 3; });
      var iStarts = sentences.filter(function(s){ return /^(i|i'm|i’m|i've|i’ve|i'd|i’d|my)\b/i.test(s); }).length;
      var youCount = (lower.match(/\b(you|your|yours)\b/g) || []).length;
      var found = CLICHES.filter(function(c){ return lower.indexOf(c) !== -1; });
      var badGreeting = /(to whom it may concern|dear sir|dear madam|dear sir\/madam|dear sir or madam)/i.test(t);
      var res = [];
      function add(id, state, label, hint){ res.push({ id: id, state: state, label: label, hint: hint }); }
      if (!t.trim()) return { empty: true, res: [], n: 0 };
      add("length", n >= 250 && n <= 400 ? "ok" : (n >= 200 && n <= 450 ? "mid" : "bad"), "Length: " + n + " words (aim for 250 to 400)",
        n < 250 ? "Add another specific example, or more detail on your strongest one." : n > 400 ? "Trim it. Cut anything that repeats your resume or doesn't support a requirement." : "");
      add("greeting", badGreeting ? "bad" : (/^\s*(dear|hello|hi)\b/im.test(t) ? "ok" : "mid"), "Greeting is direct",
        badGreeting ? "Swap \"To whom it may concern\" or \"Dear Sir/Madam\" for the hiring manager's name or \"Dear Hiring Manager\"." : "Start with \"Dear [Name],\" or \"Dear Hiring Manager,\".");
      var co = company.trim().toLowerCase();
      add("company", co ? (lower.indexOf(co) !== -1 ? "ok" : "bad") : "mid", "Names the employer",
        co ? "The employer's name doesn't appear. Mention them in the opening and in your \"why them\" line, and check it's spelled right." : "Type the employer's name above to check it's in your letter.");
      var ro = role.trim().toLowerCase();
      add("role", ro ? (lower.indexOf(ro) !== -1 ? "ok" : "mid") : "mid", "Names the job",
        ro ? "Use the exact job title from the ad, ideally in the first sentence." : "Type the job title above to check it's in your letter.");
      add("numbers", /\d/.test(t) || NUMWORDS.test(t) ? "ok" : "bad", "Includes specific numbers",
        "Add at least one number: how many, how much, how often or how fast.");
      var iRatio = sentences.length ? iStarts / sentences.length : 0;
      add("focus", iRatio <= 0.5 && youCount >= 2 ? "ok" : (iRatio <= 0.6 ? "mid" : "bad"), "Talks about them, not just you",
        "Too many sentences start with \"I\" (" + iStarts + " of " + sentences.length + "). Refer to their needs: \"Your ad asks for…\", \"Your team…\".");
      add("cliches", found.length === 0 ? "ok" : (found.length <= 2 ? "mid" : "bad"), "Free of clichés and AI-sounding phrases",
        found.length ? "Replace with specifics: " + found.slice(0, 6).map(function(c){ return "\"" + c + "\""; }).join(", ") + (found.length > 6 ? " and more" : "") + "." : "");
      add("placeholders", /\[[^\]]*\]|\{|company name|job title here|insert /i.test(t) ? "bad" : "ok", "No leftover placeholders",
        "There's still a placeholder in square brackets or curly braces. Fill it in or delete it.");
      add("paras", paras >= 3 && paras <= 6 ? "ok" : "mid", "Three to six short paragraphs",
        paras < 3 ? "Break it into short paragraphs: opening, evidence, why them, close." : "Combine or cut paragraphs so it stays easy to scan.");
      return { res: res, n: n };
    }
    var WEAK = "To whom it may concern,\n\nI am writing to apply for the position advertised. I am a hard-working, passionate and results-driven team player with a proven track record of success in a fast-paced environment.\n\nI believe I would be the perfect fit for this role. I have strong communication skills and I am very detail-oriented. I am confident that I would be a valuable asset to your company.\n\nI look forward to hearing from you at your earliest convenience.\n\nYours faithfully,\nSam";
    var STRONG = $("#cg-ex-1 .ig-letter").textContent;
    function renderChecker(){
      var out = analyseLetter($("#cg-c-text").value, $("#cg-c-company").value, $("#cg-c-role").value);
      var cl = $("#cg-c-checks"), hl = $("#cg-c-hints"), meter = $("#cg-c-meter");
      cl.innerHTML = ""; hl.innerHTML = ""; meter.innerHTML = "";
      if (out.empty) { $("#cg-c-verdict").innerHTML = "Waiting for a letter<small>Paste your draft to check it.</small>"; meter.className = "ig-meter"; return; }
      var score = 0;
      out.res.forEach(function(r){
        var li = document.createElement("li"); li.textContent = r.label; li.className = r.state === "ok" ? "is-ok" : r.state === "mid" ? "is-mid" : "";
        cl.appendChild(li);
        score += r.state === "ok" ? 1 : r.state === "mid" ? 0.5 : 0;
        if (r.state !== "ok" && r.hint) { var h = document.createElement("li"); h.className = r.state === "bad" ? "is-warn" : "is-tip"; h.textContent = r.hint; hl.appendChild(h); }
      });
      var pct = score / out.res.length;
      out.res.forEach(function(r, i){ var s = document.createElement("span"); if (i < Math.round(pct * out.res.length)) s.className = "is-on"; meter.appendChild(s); });
      meter.className = "ig-meter" + (pct >= 0.8 ? "" : pct >= 0.55 ? " is-mid" : " is-low");
      var v = pct >= 0.8 ? "Strong" : pct >= 0.55 ? "Getting there" : "Too generic";
      $("#cg-c-verdict").innerHTML = esc(v) + "<small>" + Math.round(score * 2) / 2 + " of " + out.res.length + " checks passed</small>";
      if (!hl.children.length) { var g = document.createElement("li"); g.className = "is-good"; g.textContent = "Looks solid. Now read it aloud and ask someone else to proofread it."; hl.appendChild(g); }
    }
    ["#cg-c-text", "#cg-c-company", "#cg-c-role"].forEach(function(s){ $(s).addEventListener("input", renderChecker); });
    function setChecker(text, co, ro){ $("#cg-c-text").value = text; $("#cg-c-company").value = co; $("#cg-c-role").value = ro; renderChecker(); }
    $("#cg-c-weak").addEventListener("click", function(){ setChecker(WEAK, "Coastline Fresh", "Customer Service Team Leader"); });
    $("#cg-c-strong").addEventListener("click", function(){ setChecker(STRONG, "Coastline Fresh", "Customer Service Team Leader"); });
    $("#cg-c-clear").addEventListener("click", function(){ setChecker("", "", ""); $("#cg-c-text").focus(); });
    setChecker(WEAK, "Coastline Fresh", "Customer Service Team Leader");
  
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
