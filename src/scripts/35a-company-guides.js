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
// Industries in order of their best-ranked guide. With counts (directory employers by industry), the other industries that have employers follow, A to Z.
const industryOrder = counts => {
  const seen = [];
  for (const g of guidesRanked()) if (!seen.includes(g.industry)) seen.push(g.industry);
  return counts ? [...seen, ...Object.keys(GUIDE_INDUSTRIES).filter(k => !seen.includes(k) && counts[k]).sort((a, b) => indName(a).localeCompare(indName(b)))] : seen;
};

/* --- Every employer: the full guides (part of the page), then the directory (in the database) --- */
const empSlug = s => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// A guide's own careers page (and graduate page), always on the company's website
const guideLinks = g => GUIDE_CAREERS[g.key] || (k => k ? [g.links[k]] : [])(["careers", "grads", "jobs", "program", "apply", "about", "streams", "eoi"].find(k => g.links[k]));
let employersCache = null;
// The companies with a full guide, as employers. Everyone else is in the database (35b-directory-remote.js) and arrives 50 at a time.
function guideEmployers() {
  if (employersCache && employersCache.n === COMPANY_GUIDES.length) return employersCache.list;
  const list = guidesRanked().map(g => { const [u, gr] = guideLinks(g); return { id: "g:" + g.key, kind: "guide", name: g.name, sortKey: g.name.toLowerCase(), industry: g.industry, size: g.size, st: GUIDE_STATES[g.key] || "National", u: u || "", g: gr || "", guide: g }; });
  employersCache = { n: COMPANY_GUIDES.length, list };
  return list;
}
// an employer by its id: a guide, or a directory employer that has been loaded
const empById = id => guideEmployers().find(e => e.id === id) || dirKnown.get(id) || null;
const empStates = e => e.st.split(",").map(x => x.trim());
const inState = (e, st) => st === "all" || empStates(e).some(x => x === st || x === "National");
const statesText = e => empStates(e).join(", ");
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
const guideOptions = sel => `<option value="">${sel ? "None of these" : "Choose a company"}</option>` + industryOrder().map(ind => `<optgroup label="${esc(indName(ind))}">${guidesRanked().filter(g => g.industry === ind).sort((a, b) => a.name.localeCompare(b.name)).map(g => `<option value="${g.key}"${g.key === sel ? " selected" : ""}>${esc(g.name)}</option>`).join("")}</optgroup>`).join("");
const rankLine = g => `<span class="co-badge guide">Full guide</span>${g.top100 ? `<span class="co-badge top" title="Overall place in the SEEK Grad Top100, voted by students">Top100 #${g.top100}</span>` : ""}${g.eng ? `<span class="co-badge eng" title="Place among engineering employers in the SEEK Grad Top100">Engineering #${g.eng}</span>` : ""}<span class="co-badge ind" title="Place among the ${g.indCount} full guides in ${esc(indName(g.industry))}">#${g.indRank} of ${g.indCount} in ${esc(indShort(g.industry))}</span>`;
const coSel = new Set();
const pickBox = e => `<label class="co-pick"><input type="checkbox" data-pick="${esc(e.id)}"${coSel.has(e.id) ? " checked" : ""}${e.u ? "" : " disabled"}><span class="visually-hidden">Select ${esc(e.name)}</span></label>`;
const careersBtns = (e, cls) => `${e.u ? `<a class="${cls}" href="${esc(e.u)}" target="_blank" rel="noopener">Careers page ↗</a>` : ""}${e.g ? `<a class="${cls === "btn" ? "btn" : "linkish"}" href="${esc(e.g)}" target="_blank" rel="noopener">Graduates ↗</a>` : ""}`;
function empItem(e, openNow) { return e.kind === "guide" ? guideCard(e.guide, openNow.has(e.guide.key), e) : dirCard(e, openNow.has(e.id)); }
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
const socialFrom = (p, name) => p && p.social ? Object.entries(p.social).filter(([k, u]) => SOCIAL_NAMES[k] && safeUrl(u)).map(([k, u]) => `<a class="co-soc" href="${esc(u)}" target="_blank" rel="noopener" aria-label="${esc(name)} on ${SOCIAL_NAMES[k]}" title="${SOCIAL_NAMES[k]}">${SOCIAL_ICONS[k]}</a>`).join("") : "";
const socialLinks = g => socialFrom(COMPANY_PROFILES[g.key], shortName(g));
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
    const g = guideByKey(d.dataset.co), e = g ? null : empById(d.dataset.co); if (!g && !e) return;
    const n = (g ? siteJobsFor(g) : siteJobsForEmp(e)).length, tab = d.querySelector('[data-co-tab="jobs"] .co-tabn'), pane = d.querySelector('[data-pane="jobs"]');
    if (tab) tab.textContent = n ? " (" + n + ")" : "";
    if (pane) pane.innerHTML = g ? jobsPane(g) : jobsPaneEmp(e);
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

/* --- A directory employer: the same card as a full guide, with the tabs we have something for (About, How to apply, Jobs) --- */
// Each directory employer arrives from the database with its profile. about is one or two paragraphs; anything not found is left out.
const dirProfile = e => e.profile || null;
const dirParas = p => !p || !p.about ? [] : Array.isArray(p.about) ? p.about : [p.about];
// jobs on Job Finder whose company line is this employer (matched on the start of the company name, not a loose word match)
function siteJobsForEmp(e) {
  if (e.kind === "guide") return siteJobsFor(e.guide);
  const me = empSlug(e.name);
  try { return allJobs().filter(j => { if (j.example) return false; const c = empSlug(j.company); return c === me || c.startsWith(me + "-"); }); } catch { return []; }
}
function jobsPaneEmp(e) {
  const jobs = siteJobsForEmp(e);
  if (!jobs.length) return `<p class="small muted">No ${esc(e.name)} jobs are listed on Job Finder right now. Check the Careers page under How to apply, or add one you found in <a href="#jobs">Find jobs</a>.</p>`;
  return `<ul class="co-jobs">${jobs.map(j => `<li><button type="button" class="co-job" data-co-job="${esc(j.key || j.id)}" data-co-q="${esc(j.title)}"><b>${esc(j.title)}</b><span>${esc([j.location, j.workType, j.salary].filter(Boolean).join(" · "))}</span></button></li>`).join("")}</ul>`;
}
// Which block of general advice suits this employer (DIR_ADVICE is in 04o-directory-advice.js)
function dirAdviceKey(e) {
  const n = e.name, i = e.industry;
  if (/(Police|Ambulance|Fire)/i.test(n)) return "emergency";
  if (i === "government" && /Council|^City of|Shire/i.test(n)) return "council";
  if (/Airlines?|Jetstar|Emirates|Cathay|Virgin Australia|Qantas/i.test(n)) return "airline";
  if (i === "education") return /University|CSIRO/.test(n) ? "university" : /TAFE|Institute|Polytechnic|Holmesglen|Torrens/.test(n) ? "tafe" : /Department|Catholic|Schools|Directorate/.test(n) ? "school" : "education";
  if (i === "health") return /Aged|Estia|Opal|Regis|Bolton|Arcare|Allity|Japara|Benetas|Southern Cross Care|HammondCare|Catholic Healthcare|Churches of Christ|Silver Chain/.test(n) ? "agedcare" : /Hospital|Health Service|Local Health|Health Network|Alfred|Monash Health|Austin|Peter Mac|Western Health|Eastern Health|Northern Health|Barwon|Bendigo Health|Grampians|Queensland Health|NSW Health|SA Health|WA Health|NT Health|Canberra Health|Calvary|Mater|Epworth|Cabrini|Mercy|St Vincent|St John of God|Children|Women|Metro (North|South)|Gold Coast Health|Sunshine Coast Health/.test(n) ? "hospital" : "health";
  if (i === "sport" && /Football Club|Cats|Swans|Giants|Crows|Lions|Suns|Eagles|Bulldogs|Broncos|Raiders|Sharks|Dolphins|Titans|Sea Eagles|Storm|Knights|Cowboys|Eels|Panthers|Rabbitohs|Dragons|Roosters|Tigers|Saints/.test(n)) return "club";
  return DIR_ADVICE[i] ? i : "default";
}
// What the employer itself says about hiring (the advice in its profile, from its own pages), shown above the general tips
function dirOwnAdvice(e) {
  const p = dirProfile(e), c = p && p.advice;
  if (!c || !safeUrl(c.src)) return "";
  const badge = `<a class="co-src" href="${esc(c.src)}" target="_blank" rel="noopener" title="From ${esc(c.srcName || e.name)}">From their site</a>`;
  const list = items => items && items.length ? `<ul class="co-tips">${items.map(t => `<li>${esc(t)} ${badge}</li>`).join("")}</ul>` : "";
  const sec = (title, body) => body ? `<section class="co-sec"><h4>${title}</h4>${body}</section>` : "";
  return `<div class="co-stand"><p class="small"><b>What ${esc(e.name)} says about applying</b>, read from <a href="${esc(c.src)}" target="_blank" rel="noopener">${esc(c.srcName || "its careers pages")}<span aria-hidden="true"> ↗</span></a>. Steps change, so check the live page before you apply.</p></div>
    <div class="co-grid">${sec("How they hire", list(c.steps))}${sec("Their advice", list(c.tips))}${sec("Checks and eligibility", list(c.checks))}</div>`;
}
function dirAdvicePane(e) {
  const a = DIR_ADVICE[dirAdviceKey(e)] || DIR_ADVICE.default;
  const list = items => `<ul class="co-tips">${items.map(t => `<li>${esc(t)} <span class="co-src ours" title="General advice for this kind of employer, not taken from ${esc(e.name)}'s own pages">Industry tip</span></li>`).join("")}</ul>`;
  const sec = (title, body) => `<section class="co-sec"><h4>${title}</h4>${body}</section>`;
  return `${dirOwnAdvice(e)}<p class="small muted">General advice for this kind of employer. It isn't taken from ${esc(e.name)}'s own pages, so read their careers page for what they ask for.${safeUrl(e.u) ? ` <a href="${esc(e.u)}" target="_blank" rel="noopener">Careers page ↗</a>` : ""}</p>
    <div class="co-grid">
      ${sec("What they look for", list(a.look))}
      ${sec("Resume", list(a.resume))}
      ${sec("Cover letter", list(a.cover))}
      ${sec("Interview", list(a.interview))}
    </div>`;
}
function dirCard(e, open) {
  const p = dirProfile(e), tab = guideTabs[e.id] || "about", paras = dirParas(p);
  const staff = p && p.staff ? p.staff : "";
  const soc = socialFrom(p, e.name);
  const tabs = [["about", "About"], ["advice", "Advice"], ["apply", "How to apply"], ["jobs", "Jobs"]];
  const nJobs = siteJobsForEmp(e).length;
  const sec = (title, body) => `<section class="co-sec"><h4>${title}</h4>${body}</section>`;
  const fact = (k, v, wide) => v ? `<div${wide ? ' class="wide"' : ""}><dt>${k}</dt><dd>${v}</dd></div>` : "";
  const about = `<div class="co-about-pane">
      <dl class="co-facts">
        ${soc ? `<div class="wide"><dt>Find them online</dt><dd class="co-socials">${soc}</dd></div>` : ""}
        ${fact("Industry", esc(indName(e.industry)))}
        ${fact('Company size <span class="muted">(estimate)</span>', esc(GUIDE_SIZES[e.size]) + (staff ? ` · ${esc(staff)}` : ""))}
        ${fact("Based in", p && p.hq ? esc(p.hq) : "")}
        ${fact("Works in", esc(statesText(e)))}
        ${fact("Listed on the ASX", e.asx ? esc(e.asx) : "")}
        ${p && p.spec && p.spec.length ? `<div class="wide"><dt>Specialties</dt><dd><span class="chips co-specs">${p.spec.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</span></dd></div>` : ""}
      </dl>
      ${paras.map(t => `<p class="co-summary">${esc(t)}</p>`).join("") || `<p class="small muted">No summary has been written for ${esc(e.name)} yet. Use the Careers page under How to apply.</p>`}
    </div>`;
  const roles = p && p.roles && p.roles.length ? sec("Roles they hire for", `<ul class="co-tips">${p.roles.map(r => `<li>${esc(r)}</li>`).join("")}</ul>`) : "";
  const links = [["Careers page", e.u], ["Graduate page", e.g]].filter(x => safeUrl(x[1]));
  const apply = `<div class="co-grid">
      ${sec("Where to apply", links.length ? `<ul class="co-apply-links">${links.map(([l, u]) => `<li><a class="co-apply-a" href="${esc(u)}" target="_blank" rel="noopener">${l}<span aria-hidden="true"> ↗</span></a></li>`).join("")}</ul>` : `<p class="small muted">No careers page is listed. Search for ${esc(e.name)}'s careers page.</p>`)}
      ${roles}
    </div>`;
  const panes = { about, advice: dirAdvicePane(e), apply, jobs: jobsPaneEmp(e) };
  return `<li class="co-gli${coSel.has(e.id) ? " picked" : ""}">${pickBox(e)}<details class="co-card co-dir" data-co="${esc(e.id)}"${open ? " open" : ""}>
    <summary>
      <span class="co-title"><b>${esc(e.name)}</b><small>${esc(indShort(e.industry))} · ${esc(GUIDE_SIZES[e.size])}${staff ? ` · ${esc(staff)}` : ""} · ${esc(statesText(e))}${e.asx ? ` · ASX: ${esc(e.asx)}` : ""}</small></span>
      <svg class="co-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </summary>
    <div class="co-body">
      <div class="co-tabs" role="tablist" aria-label="${esc(e.name)}">${tabs.map(([k, l]) => `<button type="button" role="tab" class="co-tab" id="cotab-${esc(e.id)}-${k}" aria-controls="copane-${esc(e.id)}-${k}" aria-selected="${k === tab}" tabindex="${k === tab ? 0 : -1}" data-co-tab="${k}">${l}${k === "jobs" ? `<span class="co-tabn">${nJobs ? " (" + nJobs + ")" : ""}</span>` : ""}</button>`).join("")}</div>
      ${tabs.map(([k]) => `<div class="co-pane" role="tabpanel" id="copane-${esc(e.id)}-${k}" aria-labelledby="cotab-${esc(e.id)}-${k}" data-pane="${k}"${k === tab ? "" : " hidden"}>${panes[k]}</div>`).join("")}
    </div>
  </details></li>`;
}

/* --- The list: full guides from the page, directory employers from the database, 50 at a time --- */
const coWant = {};       // how many employers each list shows so far: "" is the single list, otherwise an industry's group
let coOnScreen = [];     // the employers drawn now (for Select all shown)
let coPinned = "";       // a guide opened from elsewhere in the app: shown first in its list, so it is there straight away
let coOpenKey = "";      // that guide's card, to scroll to once it is drawn
let guideRun = 0;        // the newest draw wins when answers arrive out of order
const coNum = n => Number(n).toLocaleString("en-AU");
// the filters as the database gets them
const coFilter = industry => ({ industry: industry || guideState.industry, size: guideState.size, state: guideState.state, q: dirQ(guideState.q), sort: guideState.sort });
const dirWanted = () => guideState.kind === "all" && dirOn();
// The order of a list. The database gives directory employers in the same order, so the two can be merged as rows arrive.
const empRank = e => e.kind === "guide" ? e.guide.rank : 9999;
const empName = (a, b) => a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0;
const EMP_ORDER = {
  rank: (a, b) => empRank(a) - empRank(b) || SIZE_ORDER[b.size] - SIZE_ORDER[a.size] || empName(a, b),
  big: (a, b) => SIZE_ORDER[b.size] - SIZE_ORDER[a.size] || empRank(a) - empRank(b) || empName(a, b),
  small: (a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size] || empRank(a) - empRank(b) || empName(a, b),
  az: empName
};
// the full guides that match the filters, in order
function guidesMatching(industry) {
  const q = dirQ(guideState.q);
  return guideEmployers().filter(e => (industry === "all" || e.industry === industry) && (guideState.size === "all" || e.size === guideState.size) && inState(e, guideState.state)
    && (!q || [e.name, indName(e.industry), e.guide.purpose, ...e.guide.values, ...(COMPANY_PROFILES[e.guide.key] ? [COMPANY_PROFILES[e.guide.key].about, ...COMPANY_PROFILES[e.guide.key].spec] : [])].join(" ").toLowerCase().includes(q)))
    .sort(EMP_ORDER[guideState.sort] || EMP_ORDER.rank);
}
// Guides and the directory rows loaded so far, in one order. A guide that sorts after the last row loaded waits for the rows
// in between, unless there are no more to come (by ranking, guides always come first).
function coMerged(guides, L, sort) {
  if (!L) return guides;
  const cmp = EMP_ORDER[sort] || EMP_ORDER.rank, out = [];
  let gi = 0;
  for (const r of L.rows) { while (gi < guides.length && cmp(guides[gi], r) <= 0) out.push(guides[gi++]); out.push(r); }
  if (L.done || L.failed || sort === "rank" || !sort) while (gi < guides.length) out.push(guides[gi++]);
  return out;
}
const CO_FAIL = `<p class="co-fail" role="status">The other employers couldn't be loaded, so only the companies with a full guide are shown. Check your connection. <button class="btn small" type="button" data-co-retry>Try again</button></p>`;
// One list (the single list, or one industry's group): its employers so far, then "Show 50 more". Anything still to fetch is added to loads.
function coSection(key, industry, dirTotal, openNow, loads) {
  const want = coWant[key] || DIR_PAGE, f = coFilter(industry);
  const guides = guidesMatching(f.industry), pin = coPinned ? guides.filter(e => e.guide.key === coPinned) : [];
  const L = dirWanted() && dirTotal > 0 ? dirList(f) : null;
  const all = [...pin, ...coMerged(pin.length ? guides.filter(e => e.guide.key !== coPinned) : guides, L, f.sort)];
  const shown = all.slice(0, want);
  const waiting = !!L && !L.done && !L.failed && all.length < want;
  if (waiting) loads.push(dirMore(L));
  coOnScreen.push(...shown);
  const everything = guides.length + (L ? Math.max(dirTotal, L.rows.length) : 0);
  const more = all.length > shown.length || (!!L && !L.done && !L.failed);
  return (shown.length ? `<ol class="co-list">${shown.map(e => empItem(e, openNow)).join("")}</ol>` : "")
    + (waiting ? `<p class="co-loading" role="status">Loading employers…</p>`
      : (more ? `<p class="co-more"><button class="btn" type="button" data-co-more="${esc(key)}">Show ${Math.min(DIR_PAGE, Math.max(1, everything - shown.length))} more</button><span class="small muted">${coNum(shown.length)} of ${coNum(everything)} shown</span></p>` : "")
        + (L && L.failed ? CO_FAIL : ""));
}
// The totals in the heading and the Industry menu, once the database has answered
function renderCoTotals() {
  const sel = $("coIndustry");
  if (!sel) return;
  const t = dirOn() ? dirCounts(DIR_ALL).counts : null;
  const n = k => guideEmployers().filter(e => e.industry === k).length + (t ? t[k] || 0 : 0);
  const inds = Object.keys(GUIDE_INDUSTRIES).filter(k => !t || n(k)).sort((a, b) => indName(a).localeCompare(indName(b)));
  const sig = (t ? "counts:" : "names:") + inds.map(n).join(",");
  if (sel.dataset.sig !== sig) {
    sel.dataset.sig = sig;
    sel.innerHTML = `<option value="all">All industries</option>` + inds.map(k => `<option value="${k}">${esc(indName(k))}${t ? ` (${coNum(n(k))})` : ""}</option>`).join("");
    if (t) $("coTotal").textContent = `${coNum(inds.reduce((a, k) => a + n(k), 0))} Australian employers across ${inds.length} industries, ${COMPANY_GUIDES.length} with a full guide`;
  }
  sel.value = guideState.industry;
}
function renderGuides(openKey) {
  const box = $("coList");
  if (!box) return;
  const run = ++guideRun;
  if (openKey) coOpenKey = openKey;
  const again = () => { if (run === guideRun && currentView === "companies") renderGuides(); };
  const f = coFilter(), c = dirWanted() ? dirCounts(f) : null, totals = dirOn() ? dirCounts(DIR_ALL) : null;
  if (totals && totals.loading && totals !== c) totals.loading.then(() => { if (currentView === "companies") renderCoTotals(); });
  renderCoTotals();
  document.querySelectorAll("#coSize [data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === guideState.size)));
  document.querySelectorAll("#coView [data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === guideState.view)));
  document.querySelectorAll("#coKind [data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === guideState.kind)));
  $("coState").value = guideState.state;
  $("coSort").value = guideState.sort;
  // a search always comes back as one list, so the matches are in front of you
  const grouped = guideState.view === "group" && guideState.industry === "all" && !f.q;
  $("coView").hidden = guideState.industry !== "all" || !!f.q;
  // the totals come first: until they arrive, what's on the page stays
  if (c && c.loading) {
    if (!box.firstElementChild) box.innerHTML = `<p class="co-loading" role="status">Loading employers…</p>`;
    c.loading.then(again);
    return;
  }
  const openNow = new Set([...box.querySelectorAll(".co-card[open]")].map(d => d.dataset.co));
  const openGroups = new Set([...box.querySelectorAll(".co-group[open]")].map(d => d.dataset.ind));
  if (coOpenKey) { openNow.add(coOpenKey); const g = guideByKey(coOpenKey); if (g) openGroups.add(g.industry); }
  const counts = (c && c.counts) || {}, loads = [];
  const dirN = ind => ind === "all" ? Object.values(counts).reduce((a, n) => a + n, 0) : counts[ind] || 0;
  const guides = guidesMatching(guideState.industry), matched = guides.length + dirN(guideState.industry);
  coOnScreen = [];
  let html = "", inds = [];
  if (!matched) html = c && c.failed ? "" : `<p class="co-empty">No employers match. Try another industry, state or size.</p>`;
  else if (grouped) {
    inds = industryOrder(counts).filter(ind => dirN(ind) || guides.some(e => e.industry === ind));
    html = inds.map(ind => {
      const gs = guides.filter(e => e.industry === ind).length, n = gs + dirN(ind), open = openGroups.has(ind);
      return `<details class="co-group" data-ind="${ind}"${open ? " open" : ""}>
        <summary><h2>${esc(indName(ind))}</h2><span class="co-gmeta">${coNum(n)} ${n === 1 ? "employer" : "employers"}${gs ? ` · ${gs} with a full guide` : ""}</span><svg class="co-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
        <div class="co-gbody">${open ? coSection(ind, ind, dirN(ind), openNow, loads) : ""}</div></details>`;
    }).join("");
  } else html = coSection("", guideState.industry, dirN(guideState.industry), openNow, loads);
  box.innerHTML = html + (c && c.failed ? CO_FAIL : "");
  $("coCount").textContent = !matched ? (c && c.failed ? "" : "No employers match")
    : grouped ? `${coNum(matched)} employers in ${inds.length} ${inds.length === 1 ? "industry" : "industries"} (${guides.length} with a full guide). Open an industry to see its employers, 50 at a time.`
    : `Showing ${coNum(coOnScreen.length)} of ${coNum(matched)} employers (${guides.length} with a full guide)`;
  $("coOpenAll").textContent = "Open all guides";
  renderBulk();
  if (coOpenKey) {
    const el = box.querySelector(`[data-co="${coOpenKey}"]`);
    coOpenKey = "";
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }));
  }
  if (loads.length) Promise.all(loads).then(again);
}
/* --- Picking employers to apply to, and adding them to the Application tracker --- */
function renderBulk() {
  const n = coSel.size;
  $("coBulk").hidden = !n;
  $("coBulkN").textContent = `${n} employer${n === 1 ? "" : "s"} selected`;
  const shown = coOnScreen.filter(e => e.u), allOn = shown.length && shown.every(e => coSel.has(e.id));
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
    // A guide is picked automatically when the company in the ad matches one; no manual picker.
    // Otherwise the ad's company line is looked up in the directory, and the note is filled in when the answer arrives.
    const named = companyFrom((lastScan && lastScan.jd) || ""), slot = empSlug(named);
    const note = d => d ? `<div class="needs-block co-needs none"><p class="small"><b>${esc(d.name)}</b>: check the ad against their own careers page before you apply. ${careersBtns(d, "linkish")}</p></div>` : "";
    const d = dirLookupNow(named, e => document.querySelectorAll(`[data-dir-needs="${slot}"]`).forEach(el => { el.outerHTML = note(e); }));
    return d === undefined ? `<div data-dir-needs="${slot}" hidden></div>` : note(d);
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
  if (guideState.industry !== "all" && !GUIDE_INDUSTRIES[guideState.industry]) guideState.industry = "all";
  // a filter changed: start each list again at its first 50
  const refilter = (save = true) => { for (const k of Object.keys(coWant)) delete coWant[k]; coPinned = ""; if (save) saveGuideState(); renderGuides(); };
  $("coState").addEventListener("change", () => { guideState.state = $("coState").value; refilter(); });
  $("coKind").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { guideState.kind = b.dataset.v; refilter(); } });
  const showTab = (card, k, focus) => {
    const key = card.dataset.co; guideTabs[key] = k;
    card.querySelectorAll(".co-tab").forEach(t => { const on = t.dataset.coTab === k; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    card.querySelectorAll(".co-pane").forEach(p => { p.hidden = p.dataset.pane !== k; });
    if (k === "jobs") { const g = guideByKey(key), e = g ? null : empById(key), p = card.querySelector('[data-pane="jobs"]'); if (p && (g || e)) p.innerHTML = g ? jobsPane(g) : jobsPaneEmp(e); }
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
    const shown = coOnScreen.filter(e => e.u), allOn = shown.every(e => coSel.has(e.id));
    shown.forEach(e => { if (allOn) coSel.delete(e.id); else coSel.add(e.id); });
    renderGuides();
  });
  $("coBulkAdd").addEventListener("click", () => trk.ready.then(addPickedToTracker));
  $("coBulkClear").addEventListener("click", () => { coSel.clear(); renderGuides(); });
  // searching asks the database, so wait until typing pauses
  let searchTimer = 0;
  $("coSearch").addEventListener("input", () => { guideState.q = $("coSearch").value; clearTimeout(searchTimer); searchTimer = setTimeout(() => refilter(false), 250); });
  $("coIndustry").addEventListener("change", () => { guideState.industry = $("coIndustry").value; refilter(); });
  $("coSize").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { guideState.size = b.dataset.v; refilter(); } });
  $("coView").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { guideState.view = b.dataset.v; refilter(); } });
  $("coSort").addEventListener("change", () => { guideState.sort = $("coSort").value; refilter(); });
  // opens the cards on the page now (a closed industry, or employers not shown yet, have none to open)
  $("coOpenAll").addEventListener("click", () => {
    const all = [...document.querySelectorAll("#coList .co-card")];
    if (!all.length) return;
    const open = all.some(d => !d.open);
    all.forEach(d => { d.open = open; });
    $("coOpenAll").textContent = open ? "Close all" : "Open all guides";
  });
  // "Show 50 more", "Try again", and opening an industry (which loads its first 50)
  $("coList").addEventListener("click", e => {
    const more = e.target.closest("[data-co-more]");
    if (more) { const k = more.dataset.coMore; coWant[k] = (coWant[k] || DIR_PAGE) + DIR_PAGE; renderGuides(); return; }
    if (e.target.closest("[data-co-retry]")) { dirRetry(); renderGuides(); }
  });
  $("coList").addEventListener("toggle", e => {
    const d = e.target;
    if (d.classList && d.classList.contains("co-group") && d.open && !d.querySelector(".co-gbody > *")) renderGuides();
  }, true);
  viewHooks.companies = (opts = {}) => {
    if (opts.key) {
      guideState.q = ""; $("coSearch").value = "";
      const g = guideByKey(opts.key);
      if (g && ((guideState.industry !== "all" && guideState.industry !== g.industry) || (guideState.size !== "all" && guideState.size !== g.size) || !inState({ st: GUIDE_STATES[g.key] || "National" }, guideState.state))) { guideState.industry = "all"; guideState.size = "all"; guideState.state = "all"; }
    }
    if (opts.key) { coPinned = opts.key; for (const k of Object.keys(coWant)) delete coWant[k]; }
    renderGuides(opts.key);
    // the jobs on Job Finder load a moment later: bring each Jobs tab up to date when they arrive
    if (typeof startMarket === "function") startMarket().then(() => { if (currentView === "companies") refreshJobTabs(); }, () => {});
  };
});
