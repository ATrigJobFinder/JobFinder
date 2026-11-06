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
const rankLine = g => `<span class="co-badge guide">Full guide</span>${g.top100 ? `<span class="co-badge top" title="Overall place in the SEEK Grad Top100, voted by students">Top100 #${g.top100}</span>` : ""}${g.eng ? `<span class="co-badge eng" title="Place among engineering employers in the SEEK Grad Top100">Engineering #${g.eng}</span>` : ""}<span class="co-badge ind" title="Place among the ${g.indCount} full guides in ${esc(indName(g.industry))}">#${g.indRank} of ${g.indCount} in ${esc(indShort(g.industry))}</span>`;
const coSel = new Set();
const pickBox = e => `<label class="co-pick"><input type="checkbox" data-pick="${esc(e.id)}"${coSel.has(e.id) ? " checked" : ""}${e.u ? "" : " disabled"}><span class="visually-hidden">Select ${esc(e.name)}</span></label>`;
const careersBtns = (e, cls) => `${e.u ? `<a class="${cls}" href="${esc(e.u)}" target="_blank" rel="noopener">Careers page ↗</a>` : ""}${e.g ? `<a class="${cls === "btn" ? "btn" : "linkish"}" href="${esc(e.g)}" target="_blank" rel="noopener">Graduates ↗</a>` : ""}`;
function dirRow(e) {
  return `<li class="co-row${coSel.has(e.id) ? " picked" : ""}">${pickBox(e)}
    <span class="co-title"><b>${esc(e.name)}</b><small>${esc(indShort(e.industry))} · ${esc(GUIDE_SIZES[e.size])} · ${esc(statesText(e))}${e.asx ? ` · ASX: ${esc(e.asx)}` : ""}</small></span>
    <span class="co-rlinks">${careersBtns(e, "btn small")}</span></li>`;
}

function empItem(e, openNow) { return e.kind === "guide" ? guideCard(e.guide, openNow.has(e.guide.key), e) : dirRow(e); }
/* --- A company guide: About, Advice, How to apply and Jobs --- */
// Advice is for anyone applying. A tip that only suits recent graduates is marked "For recent graduates" and kept in its own list.
const GRAD_WORDS = /\b(graduates?|grads?|graduate program(me)?s?|recent graduates?|university|uni|campus|transcripts?|academic|vacation(er)?s?|vacationers|interns?|internships?|penultimate|final[- ]year|cadets?|degrees?|undergraduate|student|students|early[- ]careers?|first job)\b/i;
const isGradTip = t => GRAD_WORDS.test(String(t || ""));
const guideTabs = {};   // the tab each guide was last on, kept when the list is redrawn
const SOCIAL_NAMES = { linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram", x: "X", youtube: "YouTube" };
const SOCIAL_ICONS = {
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-7.2 8.2L23.3 22h-6.6l-5.2-6.8L5.5 22H2.4l7.7-8.8L1.9 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>`
};
const socialLinks = g => { const p = COMPANY_PROFILES[g.key]; return p && p.social ? Object.entries(p.social).filter(([k, u]) => SOCIAL_NAMES[k] && safeUrl(u)).map(([k, u]) => `<a class="co-soc" href="${esc(u)}" target="_blank" rel="noopener" aria-label="${esc(shortName(g))} on ${SOCIAL_NAMES[k]}" title="${SOCIAL_NAMES[k]}">${SOCIAL_ICONS[k]}</a>`).join("") : ""; };
// tips in two lists: for anyone, and for recent graduates only
function coTipsSplit(g, items, empty) {
  if (!items || !items.length) return `<p class="small muted">${esc(empty || "Not published.")}</p>`;
  const all = items.filter(x => !isGradTip(x[0])), grad = items.filter(x => isGradTip(x[0]));
  const list = l => `<ul class="co-tips">${l.map(([t, src]) => `<li>${esc(t)} ${coSrc(g, src)}</li>`).join("")}</ul>`;
  return (all.length ? list(all) : "") + (grad.length ? `<p class="co-forgrad"><span class="co-badge grad">For recent graduates</span></p>${list(grad)}` : "");
}
// the pages to apply through: careers page, graduate page and any other page of theirs that helps an application
const APPLY_LINKS = ["careers", "grads", "jobs", "program", "programs", "streams", "apply", "eoi", "guide", "process", "who", "about", "faq", "story", "ai"];   // (resume, tips, article and interview pages are in the Advice tab)
function applyLinkList(g, e) {
  const seen = new Set(), out = [];
  const add = (label, u) => { u = safeUrl(u); if (u && !seen.has(u)) { seen.add(u); out.push(`<li><a class="co-apply-a" href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}<span aria-hidden="true"> ↗</span></a></li>`); } };
  if (e && e.u) add("Careers page", e.u);
  if (e && e.g) add("Graduate page", e.g);
  for (const k of APPLY_LINKS) if (g.links[k]) add(LINK_NAMES[k] || "Page", g.links[k]);
  return out.length ? `<ul class="co-apply-links">${out.join("")}</ul>` : `<p class="small muted">No application pages are listed. Search for ${esc(shortName(g))}'s careers page.</p>`;
}
// jobs on Job Finder for a company (from employers who posted here and jobs you saved), grouped by guide
function siteJobsFor(g) { try { return allJobs().filter(j => !j.example && g.match.test(String(j.company || ""))); } catch { return []; } }
function jobsPane(g) {
  const jobs = siteJobsFor(g);
  if (!jobs.length) return `<p class="small muted">No ${esc(shortName(g))} jobs are listed on Job Finder right now. Check the Careers page under How to apply, or add one you found in <a href="#jobs">Find jobs</a>.</p>`;
  return `<ul class="co-jobs">${jobs.map(j => `<li><button type="button" class="co-job" data-co-job="${esc(j.key || j.id)}" data-co-q="${esc(j.title)}"><b>${esc(j.title)}</b><span>${esc([j.location, j.workType, j.salary].filter(Boolean).join(" · "))}</span></button></li>`).join("")}</ul>`;
}
function refreshJobTabs() {
  document.querySelectorAll("#coList .co-card").forEach(d => {
    const g = guideByKey(d.dataset.co); if (!g) return;
    const n = siteJobsFor(g).length, tab = d.querySelector('[data-co-tab="jobs"] .co-tabn'), pane = d.querySelector('[data-pane="jobs"]');
    if (tab) tab.textContent = n ? " (" + n + ")" : "";
    if (pane) pane.innerHTML = jobsPane(g);
  });
}
function guideCard(g, open, e) {
  const prof = COMPANY_PROFILES[g.key], tab = guideTabs[g.key] || "about";
  const sec = (title, body, tag) => `<section class="co-sec"><h4>${title}${tag ? ` <span class="co-badge grad">${tag}</span>` : ""}</h4>${body}</section>`;
  const gradProcess = ["grads", "program", "programs", "streams", "eoi"].includes(g.processSrc) || g.process.some(isGradTip);
  const process = g.process.length ? `<ol class="co-steps">${g.process.map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="small">${coSrc(g, g.processSrc)}</p>` : `<p class="small muted">${esc(g.processNote || "Not published.")} ${coSrc(g, g.processSrc)}</p>`;
  const who = [...g.elig, ...(g.timing ? [g.timing] : [])];
  const staff = prof && prof.staff ? prof.staff : g.staff || "";
  const tabs = [["about", "About"], ["advice", "Advice"], ["apply", "How to apply"], ["jobs", "Jobs"]];
  const nJobs = siteJobsFor(g).length;
  const soc = socialLinks(g);
  // the company's own advice pages, as a blue link at the top of the section they belong to
  const advLink = keys => keys.filter(k => g.links[k]).map(k => `<p class="co-adv-link"><a href="${esc(g.links[k])}" target="_blank" rel="noopener">${esc(LINK_NAMES[k] || "Read more")}<span aria-hidden="true"> ↗</span></a></p>`).join("");
  const ADV_KEYS = ["resume", "tips", "article", "interview"];
  const about = `<div class="co-about-pane">
      <dl class="co-facts">
        ${soc ? `<div class="wide"><dt>Find them online</dt><dd class="co-socials">${soc}</dd></div>` : ""}
        <div><dt>Industry</dt><dd>${esc(indName(g.industry))}</dd></div>
        <div><dt>Company size <span class="muted">(estimate)</span></dt><dd>${esc(GUIDE_SIZES[g.size])}${staff ? ` · ${esc(staff)}` : ""}</dd></div>
        ${prof && prof.spec.length ? `<div class="wide"><dt>Specialties</dt><dd><span class="chips co-specs">${prof.spec.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</span></dd></div>` : ""}
      </dl>
      ${prof ? `<p class="co-summary">${esc(prof.about)}</p>` : ""}
    </div>`;
  const stand = g.purpose || g.values.length || g.valuesNote || (g.goals && g.goals.length) ? `<div class="co-stand">
      ${g.purpose ? `<p class="co-purpose"><span class="small muted">Purpose</span> ${quoteIt(g.purpose)}</p>` : ""}
      ${g.values.length ? `<div class="co-vrow"><span class="small muted">Values</span>${coValues(g)}${coSrc(g, g.valuesSrc)}</div>` : ""}
      ${g.valuesNote ? `<p class="small muted">${esc(g.valuesNote)}${g.values.length ? "" : " " + coSrc(g, g.valuesSrc)}</p>` : ""}
      ${g.goals && g.goals.length ? `<p class="small"><b>Goals:</b> ${g.goals.map(esc).join(" · ")}</p>` : ""}
    </div>` : "";
  const advice = `${stand}<p class="small muted">Advice for anyone applying. Tips that only suit recent graduates are marked.</p>
    <div class="co-grid">
      ${sec("What they look for", coTipsSplit(g, g.look))}
      ${sec("Resume", advLink(["resume", "tips", "article"]) + coTipsSplit(g, g.resume))}
      ${sec("Cover letter", advLink(["resume"]) + coTipsSplit(g, g.cover))}
      ${sec("Interview and assessments", advLink(["interview"]) + coTipsSplit(g, g.interview))}
    </div>
    <p class="small co-links">${Object.keys(g.links).filter(k => !ADV_KEYS.includes(k)).length ? `<b>Where this comes from on ${esc(shortName(g))}'s website:</b> ${Object.entries(g.links).filter(([k]) => !ADV_KEYS.includes(k)).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(LINK_NAMES[k] || "Source")}</a>`).join(" · ")}` : ""}${g.via ? `${Object.keys(g.links).length ? ". " : ""}<b>Also drawn from:</b> ${[...new Set(Object.values(g.via))].map(esc).join(", ")} (not linked)` : ""}</p>`;
  const apply = `<div class="co-grid">
      ${sec("Where to apply", applyLinkList(g, e))}
      ${sec("The steps", process, gradProcess ? "Graduate program" : "")}
      ${sec("Who can apply, and when", coTips(g, who, "No rules beyond the ad itself. Check each ad's eligibility section."), who.length ? "For recent graduates" : "")}
    </div>`;
  const panes = { about, advice, apply, jobs: jobsPane(g) };
  return `<li class="co-gli${e && coSel.has(e.id) ? " picked" : ""}">${e ? pickBox(e) : ""}<details class="co-card" data-co="${g.key}"${open ? " open" : ""}>
    <summary>
      <span class="co-rank" aria-label="Rank ${g.rank}">${g.rank}</span>
      <span class="co-title"><b>${esc(g.name)}</b><small>${esc(indName(g.industry))} · ${esc(GUIDE_SIZES[g.size])}${staff ? ` · ${esc(staff)}` : ""}</small></span>
      <span class="co-badges">${rankLine(g)}</span>
      <svg class="co-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </summary>
    <div class="co-body">
      <div class="co-tabs" role="tablist" aria-label="${esc(g.name)}">${tabs.map(([k, l]) => `<button type="button" role="tab" class="co-tab" id="cotab-${g.key}-${k}" aria-controls="copane-${g.key}-${k}" aria-selected="${k === tab}" tabindex="${k === tab ? 0 : -1}" data-co-tab="${k}">${l}${k === "jobs" ? `<span class="co-tabn">${nJobs ? " (" + nJobs + ")" : ""}</span>` : ""}</button>`).join("")}</div>
      ${tabs.map(([k]) => `<div class="co-pane" role="tabpanel" id="copane-${g.key}-${k}" aria-labelledby="cotab-${g.key}-${k}" data-pane="${k}"${k === tab ? "" : " hidden"}>${panes[k]}</div>`).join("")}
    </div>
  </details></li>`;
}

function guidesShown() {
  const q = guideState.q.trim().toLowerCase();
  const list = employers().filter(e => (guideState.kind === "all" || e.kind === "guide") && (guideState.industry === "all" || e.industry === guideState.industry)
    && (guideState.size === "all" || e.size === guideState.size) && inState(e, guideState.state)
    && (!q || [e.name, indName(e.industry), e.asx || "", ...(e.guide ? [e.guide.purpose, ...e.guide.values, ...(COMPANY_PROFILES[e.guide.key] ? [COMPANY_PROFILES[e.guide.key].about, ...COMPANY_PROFILES[e.guide.key].spec] : [])] : [])].join(" ").toLowerCase().includes(q)));
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
    <h3>What ${esc(shortName(g))} asks for <span class="muted small">${esc(indName(g.industry))} · from its careers pages${g.via ? " and graduate reviews" : ""}</span></h3>
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
  const showTab = (card, k, focus) => {
    const key = card.dataset.co; guideTabs[key] = k;
    card.querySelectorAll(".co-tab").forEach(t => { const on = t.dataset.coTab === k; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    card.querySelectorAll(".co-pane").forEach(p => { p.hidden = p.dataset.pane !== k; });
    if (k === "jobs") { const g = guideByKey(key), p = card.querySelector('[data-pane="jobs"]'); if (g && p) p.innerHTML = jobsPane(g); }
  };
  $("coList").addEventListener("click", e => {
    const t = e.target.closest("[data-co-tab]");
    if (t) { e.preventDefault(); showTab(t.closest(".co-card"), t.dataset.coTab); return; }
    const j = e.target.closest("[data-co-job]");
    if (j) { jobsUI.q = j.dataset.coQ || ""; jobsUI.where = ""; jobsUI.open = j.dataset.coJob; openView("jobs"); }
  });
  $("coList").addEventListener("keydown", e => {
    const t = e.target.closest("[data-co-tab]"); if (!t || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...t.closest(".co-tabs").querySelectorAll(".co-tab")], i = tabs.indexOf(t);
    const n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    showTab(t.closest(".co-card"), tabs[n].dataset.coTab, true);
  });
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
    // the jobs on Job Finder load a moment later: bring each Jobs tab up to date when they arrive
    if (typeof startMarket === "function") startMarket().then(() => { if (currentView === "companies") refreshJobTabs(); }, () => {});
  };
});
