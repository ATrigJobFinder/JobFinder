/* ===================== Version 34: resume builder, round 3 ===================== */
// - Which industry: a box you type in, with suggestions (not a wall of tiles)
// - Back to the opening page, from the top of the builder and from the first step
// - Roles at the same employer stacked under one company heading (the "stacked" or "nested" layout applicant tracking systems read well)
// - A font choice, in Page setup and in Templates, for the resume and (when they match) the cover letter

/* --- Which industry --- */
// Words people type for an industry that aren't in its name: [what they type, the industry it means]
const INDUSTRY_ALIASES = [
  ["Software developer", "tech"], ["Software engineer", "tech"], ["Web developer", "tech"], ["Data analyst", "tech"], ["Cyber security", "tech"], ["Information technology", "tech"], ["Computing", "tech"],
  ["Nursing", "health"], ["Doctor", "health"], ["Dental", "health"], ["Physiotherapy", "health"], ["Pharmacy", "health"], ["Allied health", "health"],
  ["Aged care", "community"], ["Disability support", "community"], ["Social work", "community"], ["Youth work", "community"],
  ["Teaching", "education"], ["Teacher", "education"], ["Childcare", "education"], ["Early childhood", "education"],
  ["Chef or cook", "hospitality"], ["Café or restaurant", "hospitality"], ["Bar and waiting", "hospitality"], ["Hotels", "hospitality"], ["Tourism", "hospitality"],
  ["Electrician", "trades"], ["Plumber", "trades"], ["Carpenter", "trades"], ["Mechanic", "trades"],
  ["Civil engineering", "engineering"], ["Mechanical engineering", "engineering"], ["Electrical engineering", "engineering"],
  ["Builder", "construction"], ["Site work", "construction"], ["Architecture", "design"], ["Graphic design", "design"],
  ["Bookkeeping", "accounting"], ["Audit and tax", "accounting"], ["Finance", "banking"], ["Investment", "banking"],
  ["Warehouse", "logistics"], ["Truck driving", "logistics"], ["Supply chain", "logistics"], ["Manufacturing", "logistics"],
  ["Shop assistant", "retail"], ["Store manager", "retail"], ["Customer service", "callcentre"], ["Receptionist", "admin"], ["Office work", "admin"],
  ["Journalism", "media"], ["Social media", "marketing"], ["Public relations", "marketing"], ["Lawyer", "legal"], ["Paralegal", "legal"],
  ["Farming", "agriculture"], ["Environment", "agriculture"], ["Mining", "mining"], ["Oil and gas", "mining"], ["Real estate agent", "property"],
  ["Personal trainer", "sport"], ["Public service", "government"], ["Defence", "government"], ["Research", "academic"], ["Laboratory", "science"]
];
const industryKey = s => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
// What was typed → the industry it means, or "" when it could be more than one (or none)
function industryResolve(text) {
  const q = industryKey(text);
  if (!q) return "";
  const labels = JOB_TYPES.map(j => [industryKey(j.label), j.key]), aliases = INDUSTRY_ALIASES.map(([a, k]) => [industryKey(a), k]);
  const exact = labels.find(([l]) => l === q) || aliases.find(([a]) => a === q);
  if (exact) return exact[1];
  for (const list of [labels, aliases]) {
    const hit = new Set(list.filter(([l]) => l.startsWith(q) || (" " + l).includes(" " + q)).map(x => x[1]));
    if (hit.size === 1) return [...hit][0];
  }
  return "";
}
function industryCommit(inp) {
  const p = P(), msg = $("b_target_industry-msg"), text = inp.value.trim();
  if (!text) { if (p.target.jobType) { p.target.jobType = ""; p.target.jobSub = ""; touchProfile("builder"); renderBuilder(false); } return; }
  const key = industryResolve(text);
  if (!key) { if (msg) { msg.className = "pick-msg err"; msg.textContent = "Pick the closest industry from the list as you type, so designs and skill ideas can be matched to it."; } return; }
  if (msg) { msg.className = "pick-msg"; msg.textContent = ""; }
  if (p.target.jobType === key) { inp.value = jobLabel(key); return; }
  p.target.jobType = key; p.target.jobSub = "";
  touchProfile("builder"); renderBuilder(false);
}
onInit(() => {
  SUGGEST_SRC.industry = () => [...JOB_TYPES.map(j => j.label), ...INDUSTRY_ALIASES.map(a => a[0])];
  SUGGEST_OPEN_EMPTY.add("industry");
  document.addEventListener("change", e => { const t = e.target; if (t.matches && t.matches("input[data-industry]")) industryCommit(t); });
  // Back to the opening page (the first thing you saw), from the top of the page or from the first step
  document.addEventListener("click", e => { if (e.target.closest("[data-back-start]")) showWelcome(); });
});

/* --- Roles at the same employer, stacked under one company heading --- */
// Entries that sit one after the other with the same employer (a promotion, a new title) are shown as
//   Company                                  Mar 2019 – Present
//     Senior Analyst                         Mar 2022 – Present
//       • …
//     Analyst                                Mar 2019 – Feb 2022
//       • …
// Newest first, as in the builder. A single job is shown as it always was.
const orgKey = s => String(s || "").toLowerCase().replace(/\b(pty|ltd|limited|inc|the)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
function stackRoles(list, make) {
  const out = [];
  let i = 0;
  while (i < list.length) {
    const k = orgKey(list[i].org);
    let j = i + 1;
    while (k && j < list.length && orgKey(list[j].org) === k) j++;
    if (j - i < 2) { out.push(make(list[i])); i++; continue; }
    const run = list.slice(i, j), newest = run[0], oldest = run[run.length - 1];
    out.push({ title: newest.org, org: "", loc: val(newest.location), dates: rangeOf({ start: oldest.start, end: newest.end, current: newest.current }), bullets: [], stack: "company" });
    for (const e of run) out.push({ ...make(e), title: e.title || "Role", org: "", loc: "", stack: "role" });
    i = j;
  }
  return out;
}

/* --- Font --- */
const fontPref = () => { const f = (P().prefs || {}).font; return FONTS[f] ? f : ""; };
const fontOptions = cur => Object.keys(FONTS).map(f => `<option value="${esc(f)}"${cur === f ? " selected" : ""}>${esc(f)}${SERIF_FONTS.has(f) ? " (serif)" : ""}</option>`).join("");
function fontQ() {
  const cur = fontPref(), t = builderTpl(), own = t.body === t.head ? t.body : `${t.head} and ${t.body}`;
  return `<div class="q"><label class="q-label" for="ps_font_sel">Font</label><select id="ps_font_sel" data-font="1"><option value="">The design's own (${esc(own)})</option>${fontOptions(cur)}</select><p class="q-hint">Used for the whole resume, and for your cover letter when it matches your resume. Every font here is read well by applicant tracking systems.</p></div>`;
}
// The Templates page has its own font box beside the colours
function cvFontFill() {
  const sel = $("cvFont");
  if (!sel) return;
  const t = selectedTpl();
  sel.innerHTML = `<option value="">The design's own (${esc(t.body === t.head ? t.body : t.head + " and " + t.body)})</option>${fontOptions(fontPref())}`;
}
onInit(() => {
  document.addEventListener("change", e => {
    const sel = e.target.closest && e.target.closest("select[data-font], #cvFont");
    if (!sel) return;
    P().prefs.font = sel.value;
    touchProfile("builder");
    if (currentView === "builder") renderBuilder(false);
    else if (currentView === "cv") renderCv();
    else if (currentView === "letter") { renderLetterDesigns(); renderLetterPreview(); }
  });
});
