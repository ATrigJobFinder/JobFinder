/* ===================== Company guides: the page, and finding the company in a job ad ===================== */
const GUIDE_KEY = "jobfinder.guides.v2";
const GUIDE_DEFAULTS = { q: "", industry: "all", size: "all", state: "all", kind: "all", sort: "rank", view: "group" };
const guideState = (() => { try { return { ...GUIDE_DEFAULTS, ...JSON.parse(lsGet(GUIDE_KEY) || "{}"), q: "" }; } catch { return { ...GUIDE_DEFAULTS }; } })();
const saveGuideState = () => lsSet(GUIDE_KEY, JSON.stringify({ industry: guideState.industry, size: guideState.size, state: guideState.state, kind: guideState.kind, sort: guideState.sort, view: guideState.view }));

/* --- Ranking --- */
// Top100 places first; companies not in the Top100 follow, biggest first, then A to Z. Numbered 1, 2, 3…
// Each company also gets its place within its industry.
let rankedCache = null;
function guidesRanked() {
  if (rankedCache && rankedCache.n === COMPANY_GUIDES.length) return rankedCache.list;
  const list = COMPANY_GUIDES.slice().sort((a, b) => (a.top100 || 999) - (b.top100 || 999) || SIZE_ORDER[b.size] - SIZE_ORDER[a.size] || a.name.localeCompare(b.name))
    .map((g, i) => ({ ...g, rank: i + 1 }));
  const seen = {};
  for (const g of list) { seen[g.industry] = (seen[g.industry] || 0) + 1; g.indRank = seen[g.industry]; g.indCount = 0; }
  for (const g of list) g.indCount = seen[g.industry];
  rankedCache = { n: COMPANY_GUIDES.length, list };
  return list;
}
const guideByKey = k => guidesRanked().find(g => g.key === k) || null;
const indName = k => (GUIDE_INDUSTRIES[k] || [k])[0];
const indShort = k => (GUIDE_INDUSTRIES[k] || [k, k])[1];
// Industries in order of their best-ranked company (guides only, or every employer)
const industryOrder = guidesOnly => { const seen = []; for (const e of guidesOnly ? guidesRanked() : employers()) if (!seen.includes(e.industry)) seen.push(e.industry); return seen; };

/* --- Every employer: the full guides, then the directory --- */
const empSlug = s => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// A guide's own careers page (and graduate page), always on the company's website
const guideLinks = g => GUIDE_CAREERS[g.key] || (k => k ? [g.links[k]] : [])(["careers", "grads", "jobs", "program", "apply", "about", "streams", "eoi"].find(k => g.links[k]));
let employersCache = null;
function employers() {
  const n = COMPANY_GUIDES.length + COMPANY_DIRECTORY.length;
  if (employersCache && employersCache.n === n) return employersCache.list;
  const guides = guidesRanked().map(g => { const [u, gr] = guideLinks(g); return { id: "g:" + g.key, kind: "guide", name: g.name, industry: g.industry, size: g.size, st: GUIDE_STATES[g.key] || "National", u: u || "", g: gr || "", guide: g }; });
  const taken = new Set(guides.flatMap(e => [empSlug(e.name), empSlug(shortName(e.guide))]));
  const dir = COMPANY_DIRECTORY.filter(d => !taken.has(empSlug(d.n))).map(d => ({ id: "d:" + empSlug(d.n), kind: "dir", name: d.n, industry: d.i, size: d.s, st: d.st, u: d.u, g: d.g || "", asx: d.a || "" }))
    .sort((a, b) => SIZE_ORDER[b.size] - SIZE_ORDER[a.size] || a.name.localeCompare(b.name));
  const list = [...guides, ...dir];
  employersCache = { n, list };
  return list;
}
const empById = id => employers().find(e => e.id === id) || null;
const empStates = e => e.st.split(",").map(x => x.trim());
const inState = (e, st) => st === "all" || empStates(e).some(x => x === st || x === "National");
const statesText = e => empStates(e).join(", ");
// A company named in the ad that's in the directory (not one with a full guide): matched on the company line only
function directoryFor(jd) {
  const named = empSlug(companyFrom(jd || ""));
  if (!named) return null;
  return employers().find(e => { const s = empSlug(e.name); return e.kind === "dir" && (s === named || named.startsWith(s + "-") || s.startsWith(named + "-")); }) || null;
}

/* --- Finding the company in a job ad --- */
// Names that are also ordinary words or surnames need more than one mention, unless they're in the company line
const WEAK_GUIDE = new Set(["jacobs", "hatch", "downer", "beca", "northrop", "bae"]);
const guideNeedsHits = g => g.minHits || (WEAK_GUIDE.has(g.key) ? 2 : 1);
const guideCount = (g, text) => (String(text || "").match(new RegExp(g.match.source, g.match.flags.includes("i") ? "gi" : "g")) || []).length;
function detectGuide(jd) {
  if (!jd) return "";
  const named = companyFrom(jd);
  if (named) for (const g of COMPANY_GUIDES) if (g.match.test(named)) return g.key;
  let best = "", bestN = 0;
  for (const g of COMPANY_GUIDES) {
    const n = guideCount(g, jd);
    if (n >= guideNeedsHits(g) && n > bestN) { best = g.key; bestN = n; }
  }
  return best;
}
const guideForName = name => { const s = String(name || "").trim(); return s ? (COMPANY_GUIDES.find(g => g.match.test(s)) || null) : null; };
// Which guide applies to the scanned ad: the one you picked for this ad, else the one named in it,
// else one you chose on the Company guides page before pasting the ad
function activeGuideKey(jd) {
  if (guidePick && guidePick.jd === jd) return guidePick.key;
  const found = detectGuide(jd);
  if (found) return found;
  return guidePick && guidePick.jd === null ? guidePick.key : "";
}
const activeGuide = () => (lastResult && lastResult.needs && lastResult.needs.guide ? guideByKey(lastResult.needs.guide) : null);

/* --- Small pieces of markup --- */
// Purposes that already quote the company keep their own quote marks
const quoteIt = t => /[“”]/.test(t) ? esc(t) : `“${esc(t)}”`;
const plainPurpose = t => String(t || "").replace(/[“”]/g, "");
const shortName = g => g.name.split(" (")[0];
// Sources: links only to the company's own pages; tips from review and job sites are named, not linked
const coSrc = (g, s) => s === "ours" ? `<span class="co-src ours" title="Our suggestion, based on what ${esc(g.name)} says it wants">Our tip</span>`
  : g.links[s] ? `<a class="co-src" href="${esc(g.links[s])}" target="_blank" rel="noopener">${esc(LINK_NAMES[s] || "Source")}</a>`
  : g.via && g.via[s] ? `<span class="co-src via" title="From ${esc(g.via[s])}. Only ${esc(shortName(g))}'s own pages are linked.">${esc(viaLabel(s, g.via[s]))}</span>` : "";
const viaLabel = (k, site) => ["reviews", "profile", "tips", "article", "story", "stories"].includes(k) ? "Graduate reviews" : k === "careers" || k === "jobs" || k === "ad" ? "Job listing" : (LINK_NAMES[k] || "Source");
const coTips = (g, items, empty) => items && items.length ? `<ul class="co-tips">${items.map(([t, s]) => `<li>${esc(t)} ${coSrc(g, s)}</li>`).join("")}</ul>` : `<p class="small muted">${esc(empty || "Not published.")}</p>`;
const coValues = g => g.values.length ? `<div class="chips co-values">${g.values.map(v => `<span class="chip">${esc(v)}</span>`).join("")}</div>` : "";
// The company menu in Tailor to a job, grouped by industry
const guideOptions = sel => `<option value="">${sel ? "None of these" : "Choose a company"}</option>` + industryOrder(true).map(ind => `<optgroup label="${esc(indName(ind))}">${guidesRanked().filter(g => g.industry === ind).sort((a, b) => a.name.localeCompare(b.name)).map(g => `<option value="${g.key}"${g.key === sel ? " selected" : ""}>${esc(g.name)}</option>`).join("")}</optgroup>`).join("");
const rankLine = g => `<span class="co-badge guide">Full guide</span>${g.top100 ? `<span class="co-badge top" title="Overall place in the 2026 SEEK Grad Top100, voted by students">Top100 #${g.top100}</span>` : ""}${g.eng ? `<span class="co-badge eng" title="Place among engineering employers in the 2026 SEEK Grad Top100">Engineering #${g.eng}</span>` : ""}<span class="co-badge ind" title="Place among the ${g.indCount} full guides in ${esc(indName(g.industry))}">#${g.indRank} of ${g.indCount} in ${esc(indShort(g.industry))}</span>`;
const coSel = new Set();
const pickBox = e => `<label class="co-pick"><input type="checkbox" data-pick="${esc(e.id)}"${coSel.has(e.id) ? " checked" : ""}${e.u ? "" : " disabled"}><span class="visually-hidden">Select ${esc(e.name)}</span></label>`;
const careersBtns = (e, cls) => `${e.u ? `<a class="${cls}" href="${esc(e.u)}" target="_blank" rel="noopener">Careers page ↗</a>` : ""}${e.g ? `<a class="${cls === "btn" ? "btn" : "linkish"}" href="${esc(e.g)}" target="_blank" rel="noopener">Graduates ↗</a>` : ""}`;
function dirRow(e) {
  return `<li class="co-row${coSel.has(e.id) ? " picked" : ""}">${pickBox(e)}
    <span class="co-title"><b>${esc(e.name)}</b><small>${esc(indShort(e.industry))} · ${esc(GUIDE_SIZES[e.size])} · ${esc(statesText(e))}${e.asx ? ` · ASX: ${esc(e.asx)}` : ""}</small></span>
    <span class="co-rlinks">${careersBtns(e, "btn small")}</span></li>`;
}

function empItem(e, openNow) { return e.kind === "guide" ? guideCard(e.guide, openNow.has(e.guide.key), e) : dirRow(e); }
function guideCard(g, open, e) {
  const sec = (title, body) => `<section class="co-sec"><h4>${title}</h4>${body}</section>`;
  const process = g.process.length ? `<ol class="co-steps">${g.process.map(s => `<li>${esc(s)}</li>`).join("")}</ol><p class="small">${coSrc(g, g.processSrc)}</p>` : `<p class="small muted">${esc(g.processNote || "Not published.")} ${coSrc(g, g.processSrc)}</p>`;
  const who = [...g.elig, ...(g.timing ? [g.timing] : [])];
  return `<li class="co-gli${e && coSel.has(e.id) ? " picked" : ""}">${e ? pickBox(e) : ""}<details class="co-card" data-co="${g.key}"${open ? " open" : ""}>
    <summary>
      <span class="co-rank" aria-label="Rank ${g.rank}">${g.rank}</span>
      <span class="co-title"><b>${esc(g.name)}</b><small>${esc(indName(g.industry))} · ${esc(GUIDE_SIZES[g.size])}${g.staff ? ` · ${esc(g.staff)}` : ""}</small></span>
      <span class="co-badges">${rankLine(g)}</span>
      <svg class="co-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </summary>
    <div class="co-body">
      <div class="co-top">
        <div>
          ${g.purpose ? `<p class="co-purpose"><span class="small muted">Purpose</span> ${quoteIt(g.purpose)}</p>` : ""}
          ${g.values.length ? `<div class="co-vrow">${coValues(g)}${coSrc(g, g.valuesSrc)}</div>` : ""}
          ${g.valuesNote ? `<p class="small muted">${esc(g.valuesNote)}${g.values.length ? "" : " " + coSrc(g, g.valuesSrc)}</p>` : ""}
          ${g.goals && g.goals.length ? `<p class="small"><b>Goals:</b> ${g.goals.map(esc).join(" · ")}</p>` : ""}
        </div>
        <div class="b-actions co-actions">
          <button class="btn primary" type="button" data-guide-tailor="${g.key}">Tailor my resume for ${esc(shortName(g))}</button>
          ${e ? careersBtns(e, "btn") : ""}
          ${g.values.length ? `<button class="btn" type="button" data-guide-copy="${g.key}">Copy their values</button>` : ""}
        </div>
      </div>
      <div class="co-grid">
        ${sec("What they look for", coTips(g, g.look))}
        ${sec("Resume", coTips(g, g.resume))}
        ${sec("Cover letter", coTips(g, g.cover))}
        ${sec("Interview and assessments", coTips(g, g.interview))}
        ${sec("How to apply", process)}
        ${sec("Who can apply, and when", coTips(g, who, "No rules beyond the ad itself. Check each ad's eligibility section."))}
      </div>
      <p class="small co-links">${Object.keys(g.links).length ? `<b>Sources on ${esc(shortName(g))}'s website:</b> ${Object.entries(g.links).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(LINK_NAMES[k] || "Source")}</a>`).join(" · ")}` : ""}${g.via ? `${Object.keys(g.links).length ? ". " : ""}<b>Also drawn from:</b> ${[...new Set(Object.values(g.via))].map(esc).join(", ")} (not linked)` : ""}</p>
    </div>
  </details></li>`;
}

function guidesShown() {
  const q = guideState.q.trim().toLowerCase();
  const list = employers().filter(e => (guideState.kind === "all" || e.kind === "guide") && (guideState.industry === "all" || e.industry === guideState.industry)
    && (guideState.size === "all" || e.size === guideState.size) && inState(e, guideState.state)
    && (!q || [e.name, indName(e.industry), e.asx || "", ...(e.guide ? [e.guide.purpose, ...e.guide.values] : [])].join(" ").toLowerCase().includes(q)));
  const r = e => e.kind === "guide" ? e.guide.rank : 9999;
  if (guideState.sort === "small") list.sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size] || r(a) - r(b) || a.name.localeCompare(b.name));
  else if (guideState.sort === "big") list.sort((a, b) => SIZE_ORDER[b.size] - SIZE_ORDER[a.size] || r(a) - r(b) || a.name.localeCompare(b.name));
  else if (guideState.sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}
function renderGuides(openKey) {
  const box = $("coList");
  if (!box) return;
  const openNow = new Set([...box.querySelectorAll(".co-card[open]")].map(d => d.dataset.co));
  const closedGroups = new Set([...box.querySelectorAll(".co-group:not([open])")].map(d => d.dataset.ind));
  if (openKey) { openNow.add(openKey); const g = guideByKey(openKey); if (g) closedGroups.delete(g.industry); }
  const list = guidesShown();
  const items = l => l.map(e => empItem(e, openNow)).join("");
  if (!list.length) box.innerHTML = `<p class="co-empty">No employers match. Try another industry, state or size.</p>`;
  else if (guideState.view === "group" && guideState.industry === "all") {
    box.innerHTML = industryOrder().map(ind => {
      const l = list.filter(e => e.industry === ind);
      if (!l.length) return "";
      const gs = l.filter(e => e.kind === "guide").length;
      return `<details class="co-group" data-ind="${ind}"${closedGroups.has(ind) ? "" : " open"}>
        <summary><h2>${esc(indName(ind))}</h2><span class="co-gmeta">${l.length} ${l.length === 1 ? "employer" : "employers"}${gs ? ` · ${gs} with a full guide` : ""}</span><svg class="co-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
        <ol class="co-list">${items(l)}</ol></details>`;
    }).join("");
  } else box.innerHTML = `<ol class="co-list">${items(list)}</ol>`;
  const inds = new Set(list.map(e => e.industry)).size, all = employers();
  $("coCount").textContent = `Showing ${list.length} of ${all.length} employers${inds > 1 ? ` in ${inds} industries` : ""} (${list.filter(e => e.kind === "guide").length} with a full guide)`;
  document.querySelectorAll("#coSize [data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === guideState.size)));
  document.querySelectorAll("#coView [data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === guideState.view)));
  document.querySelectorAll("#coKind [data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === guideState.kind)));
  $("coIndustry").value = guideState.industry;
  $("coState").value = guideState.state;
  $("coSort").value = guideState.sort;
  $("coView").hidden = guideState.industry !== "all";
  renderBulk();
  if (openKey) {
    const el = box.querySelector(`[data-co="${openKey}"]`);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }));
  }
}
/* --- Picking employers to apply to, and adding them to the Application tracker --- */
function renderBulk() {
  const n = coSel.size;
  $("coBulk").hidden = !n;
  $("coBulkN").textContent = `${n} employer${n === 1 ? "" : "s"} selected`;
  const shown = guidesShown().filter(e => e.u), allOn = shown.length && shown.every(e => coSel.has(e.id));
  $("coSelAll").textContent = allOn ? "Clear all shown" : `Select all shown (${shown.length})`;
}
function addPickedToTracker() {
  const picked = [...coSel].map(empById).filter(e => e && e.u);
  let added = 0;
  for (const e of picked) {
    const before = T().length;
    trackJob({ title: "General application", company: shortName(e), url: e.u, location: e.st === "National" ? "" : statesText(e), source: "Company guides", notes: `Send your resume through their careers page.${e.g ? ` Graduate page: ${e.g}` : ""}` }, "saved");
    if (T().length > before) added++;
  }
  coSel.clear();
  renderGuides();
  const st = $("coBulkStatus");
  st.innerHTML = `${added ? `Added ${added} employer${added === 1 ? "" : "s"} to your Application tracker as Saved.` : "Those employers are already in your Application tracker."}${picked.length - added > 0 && added ? ` ${picked.length - added} ${picked.length - added === 1 ? "was" : "were"} already there.` : ""} <a href="#tracker">Open the Application tracker</a>`;
}

/* --- In Tailor to a job: the guide for the company in the ad --- */
function guideNeedsHtml(key) {
  const g = key ? guideByKey(key) : null;
  if (!g) {
    const d = directoryFor(lastScan && lastScan.jd);
    // a guide is picked automatically when the company in the ad matches one; no manual picker
    return d ? `<div class="needs-block co-needs none"><p class="small"><b>${esc(d.name)}</b>: check the ad against their own careers page before you apply. ${careersBtns(d, "linkish")}</p></div>` : "";
  }
  const two = items => coTips(g, (items || []).slice(0, 2));
  return `<div class="needs-block co-needs">
    <h3>What ${esc(shortName(g))} asks for <span class="muted small">${esc(indName(g.industry))} · from its careers pages${g.via ? " and graduate reviews" : ""} · checked ${GUIDE_CHECKED}</span></h3>
    ${g.values.length ? `<p class="small"><b>Their values:</b></p>${coValues(g)}` : g.valuesNote ? `<p class="small muted">${esc(g.valuesNote)}</p>` : ""}
    <div class="co-needs-grid">
      <div><b>Resume</b>${two(g.resume)}</div>
      <div><b>Cover letter</b>${two(g.cover)}</div>
      <div><b>Interview</b>${two(g.interview)}</div>
    </div>
    <p class="small co-needs-foot"><button class="linkish" type="button" data-guide-open="${g.key}">See the full ${esc(shortName(g))} guide</button>
      <label for="needsGuidePick">Wrong company? <select id="needsGuidePick">${guideOptions(g.key)}</select></label></p>
    ${g.values.length || g.purpose ? `<p class="small muted">Their ${g.values.length ? "values" : "purpose"} and what they look for go into your cover letter below.</p>` : ""}
  </div>`;
}
// The hint under "Why this company?" in the cover letter
function renderGuideHint() {
  const el = $("clGuideHint");
  if (!el) return;
  const g = activeGuide();
  el.hidden = !g;
  if (!g) { el.innerHTML = ""; return; }
  const bits = [g.purpose ? quoteIt(g.purpose) : "", g.values.length ? `Values: ${g.values.slice(0, 5).map(esc).join(", ")}` : ""].filter(Boolean);
  el.innerHTML = `<b>${esc(shortName(g))}</b>${bits.length ? ": " + bits.join(". ") + "." : "."} ${g.values.length ? "Say which value you share, with an example." : "Say what draws you to them, with an example."} <button class="linkish" type="button" data-guide-open="${g.key}">Company guide</button>`;
}
// For the cover letter: the company's own words, merged with what the ad says
function guideForCover() {
  const g = activeGuide();
  return g ? { name: shortName(g), purpose: plainPurpose(g.purpose), values: g.values.slice(0, 6), look: g.look.map(x => x[0]).slice(0, 3) } : null;
}

/* --- Wiring --- */
async function copyText(text, btn) {
  const was = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; } catch { btn.textContent = "Couldn't copy"; }
  setTimeout(() => { btn.textContent = was; }, 1600);
}
document.addEventListener("click", e => {
  const op = e.target.closest("[data-guide-open]");
  if (op) { e.preventDefault(); openView("companies", { key: op.dataset.guideOpen }); return; }
  const ta = e.target.closest("[data-guide-tailor]");
  if (ta) {
    const k = ta.dataset.guideTailor, found = lastScan ? detectGuide(lastScan.jd) : "";
    // the ad already scanned is this company's (or names none): use it now; otherwise keep it for the next ad
    if (lastScan && (!found || found === k)) { guidePick = { key: k, jd: lastScan.jd }; rescore(); renderGuideHint(); }
    else guidePick = { key: k, jd: null };
    openView("scanner");
    // straight to the job ad box when there's a new ad to paste, or to the guide when this ad is theirs
    setTimeout(() => { if (guidePick.jd === null) goTo("step-jd"); else openDetails(); }, 60);
    return;
  }
  const cp = e.target.closest("[data-guide-copy]");
  if (cp) { const g = guideByKey(cp.dataset.guideCopy); if (g) copyText(g.values.join(", "), cp); }
});
document.addEventListener("change", e => {
  if (e.target.id !== "needsGuidePick" || !lastScan) return;
  guidePick = { key: e.target.value, jd: lastScan.jd };
  rescore();
  renderGuideHint();
});
onInit(() => {
  const inds = industryOrder().slice().sort((a, b) => indName(a).localeCompare(indName(b)));
  $("coIndustry").innerHTML = `<option value="all">All industries</option>` + inds.map(k => `<option value="${k}">${esc(indName(k))} (${employers().filter(e => e.industry === k).length})</option>`).join("");
  if (guideState.industry !== "all" && !GUIDE_INDUSTRIES[guideState.industry]) guideState.industry = "all";
  $("coTotal").textContent = `${employers().length} Australian employers across ${industryOrder().length} industries, ${COMPANY_GUIDES.length} with a full guide`;
  $("coState").addEventListener("change", () => { guideState.state = $("coState").value; saveGuideState(); renderGuides(); });
  $("coKind").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { guideState.kind = b.dataset.v; saveGuideState(); renderGuides(); } });
  $("coList").addEventListener("change", e => {
    const id = e.target.dataset && e.target.dataset.pick; if (!id) return;
    if (e.target.checked) coSel.add(id); else coSel.delete(id);
    const li = e.target.closest("li"); if (li) li.classList.toggle("picked", e.target.checked);
    $("coBulkStatus").textContent = ""; renderBulk();
  });
  $("coSelAll").addEventListener("click", () => {
    const shown = guidesShown().filter(e => e.u), allOn = shown.every(e => coSel.has(e.id));
    shown.forEach(e => { if (allOn) coSel.delete(e.id); else coSel.add(e.id); });
    renderGuides();
  });
  $("coBulkAdd").addEventListener("click", () => trk.ready.then(addPickedToTracker));
  $("coBulkClear").addEventListener("click", () => { coSel.clear(); renderGuides(); });
  $("coSearch").addEventListener("input", () => { guideState.q = $("coSearch").value; renderGuides(); });
  $("coIndustry").addEventListener("change", () => { guideState.industry = $("coIndustry").value; saveGuideState(); renderGuides(); });
  $("coSize").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { guideState.size = b.dataset.v; saveGuideState(); renderGuides(); } });
  $("coView").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { guideState.view = b.dataset.v; saveGuideState(); renderGuides(); } });
  $("coSort").addEventListener("change", () => { guideState.sort = $("coSort").value; saveGuideState(); renderGuides(); });
  $("coOpenAll").addEventListener("click", () => {
    if (!document.querySelector("#coList .co-card")) return;
    const all = [...document.querySelectorAll("#coList .co-card")], open = all.some(d => !d.open);
    all.forEach(d => { d.open = open; });
    if (open) document.querySelectorAll("#coList .co-group").forEach(d => { d.open = true; });
    $("coOpenAll").textContent = open ? "Close all" : "Open all";
  });
  viewHooks.companies = (opts = {}) => {
    if (opts.key) {
      guideState.q = ""; $("coSearch").value = "";
      const g = guideByKey(opts.key);
      if (g && ((guideState.industry !== "all" && guideState.industry !== g.industry) || (guideState.size !== "all" && guideState.size !== g.size) || !inState({ st: GUIDE_STATES[g.key] || "National" }, guideState.state))) { guideState.industry = "all"; guideState.size = "all"; guideState.state = "all"; }
    }
    renderGuides(opts.key);
  };
});
