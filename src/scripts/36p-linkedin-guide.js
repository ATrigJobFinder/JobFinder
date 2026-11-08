/* ===================== LinkedIn advice: the LinkedIn guide ===================== */
// How recruiters find you now, every profile section, a headline builder, an About checker, Open to Work, privacy and scam safety,
// a profile checklist and copyable messages. The page itself is in index.html (#advice-linkedin-body).
// Everything typed into the tools stays in the browser.
onInit(() => {
  var root = document.getElementById("lgRoot");
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
    function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function words(s){ var m = String(s).trim().match(/[A-Za-z0-9’'\-]+/g); return m ? m.length : 0; }
  
    /* ---------- Headline builder ---------- */
    var HB = ["role","s1","s2","s3","cred","proof","loc"];
    var HB_EX = { role: "Disability Support Worker", s1: "Behaviour support", s2: "personal care", s3: "community access", cred: "NDIS Worker Screening Check", proof: "Helping NDIS participants live independently", loc: "Geelong" };
    var HB_PH = { role: "job title", s1: "specialty", s2: "specialty" };
    var FLAGS = /\b(unemployed|jobless|desperate|seeking (new )?(opportunities|employment|work|a job)|looking for (work|a job|opportunities)|aspiring|guru|ninja|rockstar|wizard|passionate|hard[- ]working|go[- ]getter)\b/i;
    var CUT = 60, LIMIT = 220;
    function hbVals(){ var v = {}; HB.forEach(function(k){ v[k] = $("#lg-hb-" + k).value.trim(); }); return v; }
    function skillsList(v){
      var s = [v.s1, v.s2, v.s3].filter(Boolean);
      if (!s.length) return "";
      if (s.length === 1) return s[0];
      return s.slice(0, -1).join(", ") + " & " + s[s.length - 1];
    }
    function variants(v){
      var role = v.role || "[" + HB_PH.role + "]";
      var skills = skillsList(v) || "[specialty], [specialty]";
      var out = [];
      out.push([role, skills, v.cred || v.loc].filter(Boolean).join(" | "));
      out.push([role, v.proof || skills, v.loc || v.cred].filter(Boolean).join(" | "));
      out.push([role + (v.loc ? " (" + v.loc + ")" : ""), [v.s1, v.s2].filter(Boolean).join(" & ") || skills, v.cred, v.proof].filter(Boolean).join(" | "));
      var seen = {};
      return out.filter(function(h){ if (seen[h]) return false; seen[h] = 1; return true; });
    }
    function renderHb(){
      var v = hbVals();
      var list = $("#lg-hb-out"); list.innerHTML = "";
      var vs = variants(v);
      vs.forEach(function(h, i){
        var n = h.length;
        var li = document.createElement("li"); li.className = "ig-variant";
        var html = esc(h).replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');
        var cut = h.length > CUT ? h.slice(0, CUT).replace(/\s+\S*$/, "") + "…" : h;
        li.innerHTML = '<div class="ig-variant__text">' + html + '</div>' +
          '<div class="ig-variant__meta"><span><b class="' + (n <= LIMIT ? "" : "is-over") + '">' + n + "</b> / " + LIMIT + " characters</span>" +
          '<button type="button" class="ig-linkbtn" data-i="' + i + '">Copy</button><span class="ig-status" role="status"></span></div>' +
          '<div class="ig-variant__cut">In search results, people may only see: <span>' + esc(cut) + "</span></div>";
        list.appendChild(li);
      });
      $$("#lg-hb-out [data-i]").forEach(function(b){ b.addEventListener("click", function(){ copyText(vs[+b.getAttribute("data-i")], b.nextElementSibling); }); });
      var hints = $("#lg-hb-hints"); hints.innerHTML = "";
      function hint(type, t){ var li = document.createElement("li"); li.className = "is-" + type; li.textContent = t; hints.appendChild(li); }
      var all = HB.map(function(k){ return v[k]; }).join(" ");
      if (!v.role) hint("tip", "Start with the job title you want recruiters to search for, using the same words job ads use.");
      if (v.role && !v.s1 && !v.s2) hint("tip", "Add two or three specialties: the skills or areas recruiters search for alongside your job title.");
      if (FLAGS.test(all)) hint("warn", "Swap words like \"seeking opportunities\", \"aspiring\" or \"passionate\" for what you do. Use Open to Work to signal that you're looking.");
      if (v.role && v.role.length > 45) hint("warn", "Your job title is long. Keep it under about 45 characters so it isn't cut off in search results.");
      if (vs.some(function(h){ return h.length > LIMIT; })) hint("warn", "One version is over 220 characters. Shorten your specialties or result.");
      if (v.role && !hints.children.length) hint("good", "Pick the version that sounds most like you, and check it reads well when cut short.");
      store.set("ig-li-hb-v1", v);
    }
    HB.forEach(function(k){ $("#lg-hb-" + k).addEventListener("input", renderHb); });
    function setHb(v){ HB.forEach(function(k){ $("#lg-hb-" + k).value = v[k] || ""; }); renderHb(); }
    $("#lg-hb-example").addEventListener("click", function(){ setHb(HB_EX); });
    $("#lg-hb-clear").addEventListener("click", function(){ setHb({}); $("#lg-hb-role").focus(); });
    setHb(store.get("ig-li-hb-v1", null) || HB_EX);
  
    /* ---------- About checker ---------- */
    var CLICHES = ["highly motivated","results-driven","results driven","passionate","proven track record","team player","hard-working","hardworking","hard working","detail-oriented","detail oriented","think outside the box","go-getter","self-starter","dynamic","synergy","guru","ninja","rockstar","seasoned professional","wealth of experience","thrilled","leverage","spearheaded","delve","seamlessly","fast-paced environment","looking for new opportunities","feel free to connect"];
    var NUMWORDS = /\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|fifty|hundred|thousand|million|half|double|twice|percent)\b/i;
    var FOLD = 275;
    function analyseAbout(text, kwRaw){
      var t = text.replace(/\r/g, "");
      var lower = t.toLowerCase().replace(/[’]/g, "'");
      var n = t.length, w = words(t);
      if (!t.trim()) return { empty: true };
      var paras = t.split(/\n\s*\n|\n(?=[•\-\*])/).filter(function(p){ return p.trim(); }).length;
      var firstPerson = /\b(i|i'm|i've|i'd|my|me)\b/i.test(t);
      var opener = t.trim().split(/[.!?\n]/)[0].toLowerCase();
      var weakOpen = /^(i am a |i'm a |highly|results|passionate|motivated|experienced professional|seasoned|dynamic)/.test(opener) || CLICHES.some(function(c){ return opener.indexOf(c) !== -1; });
      var found = CLICHES.filter(function(c){ return lower.indexOf(c) !== -1; });
      var kws = kwRaw.split(",").map(function(k){ return k.trim(); }).filter(Boolean);
      var kwHit = kws.filter(function(k){ return lower.indexOf(k.toLowerCase()) !== -1; });
      var kwMiss = kws.filter(function(k){ return lower.indexOf(k.toLowerCase()) === -1; });
      var cta = /(message me|get in touch|reach me|contact me|email me|connect with me|send me a message|happy to chat|let's talk|let's chat|best way to reach|drop me a|open to (casual|part-time|full-time|new|roles|work|opportunities|contract))/i.test(t);
      var res = [];
      function add(state, label, hint){ res.push({ state: state, label: label, hint: hint }); }
      add(n <= 2600 ? (w >= 120 ? "ok" : (w >= 60 ? "mid" : "bad")) : "bad", n + " / 2,600 characters · " + w + " words",
        n > 2600 ? "Over the 2,600-character limit. Cut the least relevant paragraph." : w < 120 ? "Short. Aim for about 150 to 300 words: what you do, proof, credentials and what you're open to." : "");
      add(weakOpen ? "bad" : "ok", "Opens with something specific",
        "Your first line is generic. Start with what you do and who for, since only the first few lines show.");
      add(firstPerson ? "ok" : "mid", "Written in the first person",
        "Write as \"I\", not in the third person. It reads more naturally on LinkedIn.");
      add(/\d/.test(t) || NUMWORDS.test(t) ? "ok" : "bad", "Includes specific numbers",
        "Add proof with a number: years of experience, people supported, results achieved.");
      add(found.length === 0 ? "ok" : (found.length <= 2 ? "mid" : "bad"), "Free of buzzwords",
        found.length ? "Replace with specifics: " + found.slice(0, 6).map(function(c){ return "\"" + c + "\""; }).join(", ") + "." : "");
      add(paras >= 3 ? "ok" : "mid", "Broken into short paragraphs",
        "Break it into three to five short paragraphs or a short list. Long blocks are hard to read on a phone.");
      add(cta ? "ok" : "mid", "Says what you're open to and how to reach you",
        "End with what you're open to and how to get in touch, such as \"Message me here.\"");
      if (kws.length) add(kwHit.length === kws.length ? "ok" : (kwHit.length ? "mid" : "bad"), "Mentions your key skills (" + kwHit.length + " of " + kws.length + ")",
        kwMiss.length ? "Work these in naturally if they're true for you: " + kwMiss.join(", ") + "." : "");
      return { res: res, fold: t.slice(0, FOLD) };
    }
    var AB_WEAK = "I am a highly motivated, results-driven and passionate professional with a proven track record of success. I am a team player who thinks outside the box and is very detail-oriented, with a wealth of experience across many industries. Looking for new opportunities. Feel free to connect!";
    var AB_STRONG = "I help people with disability live the lives they choose, at home and out in their community.\n\nFor the past four years I've worked as a support worker in Geelong, first in supported independent living and now in community access. My work covers personal care, medication assistance, meal preparation, and getting clients to work, sport and appointments. I'm known for calm, consistent behaviour support and for clear, accurate shift notes that make handovers easy.\n\nA few things I'm proud of:\n• Supporting a client to travel independently by bus after six months of practice together\n• Introducing a handover checklist that cut missed medication alerts across our house\n• Zero missed shifts in 2025\n\nI hold a Certificate IV in Disability Support, a current NDIS Worker Screening Check, First Aid and CPR, and a manual driver's licence.\n\nI'm open to part-time community access roles in Geelong and the Surf Coast. The best way to reach me is to message me here.";
    var AB_KW = "personal care, behaviour support, community access, medication assistance";
    function renderAbout(){
      var out = analyseAbout($("#lg-ab-text").value, $("#lg-ab-kw").value);
      var cl = $("#lg-ab-checks"), hl = $("#lg-ab-hints"), meter = $("#lg-ab-meter");
      cl.innerHTML = ""; hl.innerHTML = ""; meter.innerHTML = "";
      if (out.empty) { $("#lg-ab-verdict").innerHTML = "Waiting for text<small>Paste your About section to check it.</small>"; $("#lg-ab-fold").innerHTML = "<em>Your opening lines will appear here.</em>"; meter.className = "ig-meter"; return; }
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
      $("#lg-ab-verdict").innerHTML = esc(pct >= 0.8 ? "Strong" : pct >= 0.55 ? "Getting there" : "Too generic") + "<small>" + Math.round(score * 2) / 2 + " of " + out.res.length + " checks passed</small>";
      $("#lg-ab-fold").innerHTML = esc(out.fold) + ($("#lg-ab-text").value.length > FOLD ? "<em>…see more</em>" : "");
      if (!hl.children.length) { var g = document.createElement("li"); g.className = "is-good"; g.textContent = "Looks solid. Read the preview: would those first lines make you click \"see more\"?"; hl.appendChild(g); }
    }
    ["#lg-ab-text", "#lg-ab-kw"].forEach(function(s){ $(s).addEventListener("input", renderAbout); });
    function setAbout(t, k){ $("#lg-ab-text").value = t; $("#lg-ab-kw").value = k; renderAbout(); }
    $("#lg-ab-weak").addEventListener("click", function(){ setAbout(AB_WEAK, AB_KW); });
    $("#lg-ab-strong").addEventListener("click", function(){ setAbout(AB_STRONG, AB_KW); });
    $("#lg-ab-clear").addEventListener("click", function(){ setAbout("", ""); $("#lg-ab-text").focus(); });
    setAbout(AB_WEAK, AB_KW);
  
    /* ---------- Checklist ---------- */
    var boxes = $$(".ig-check input[type=checkbox]");
    var ticks = store.get("ig-li-check-v1", {});
    function updateLi(){
      var done = boxes.filter(function(b){ return b.checked; }).length;
      $("#lg-li-count").textContent = done + " of " + boxes.length + " done";
      $("#lg-li-bar").style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
      $("#lg-li-meter").setAttribute("aria-valuenow", String(done));
    }
    boxes.forEach(function(b){
      if (ticks[b.id]) b.checked = true;
      b.addEventListener("change", function(){ ticks[b.id] = b.checked; store.set("ig-li-check-v1", ticks); updateLi(); });
    });
    $("#lg-li-reset").addEventListener("click", function(){ boxes.forEach(function(b){ b.checked = false; }); ticks = {}; store.set("ig-li-check-v1", ticks); updateLi(); });
    updateLi();
  
    /* ---------- Template copy ---------- */
    $$("[data-copy]").forEach(function(btn){
      btn.addEventListener("click", function(){ copyText($("#" + btn.getAttribute("data-copy")).textContent, btn.nextElementSibling); });
    });
  
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
      var a = e.target.closest('a[href^="#lg-"]');
      if (!a) return;
      var t = root.querySelector("#" + CSS.escape(a.getAttribute("href").slice(1)));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
    });
});
