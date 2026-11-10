/* ===================== Learning: courses and credentials that open more jobs ===================== */
const learnStore = privateDoc("learning", "jobfinder.learning.v1", () => ({ plan: [], goal: "faster" }));
// A fixed catalogue. The AI may only choose from it, so it can't invent courses or prices.
const LEARN_CATALOGUE = [
  { id: "ms-excel", title: "Microsoft Excel skills, then a Microsoft Office Specialist exam", skills: ["Microsoft Excel", "Microsoft Office"], cost: "Free to learn; exam is paid", time: "2 to 6 weeks", kind: "Short course", links: [["Microsoft Learn", "https://learn.microsoft.com/training/"], ["LinkedIn Learning", "https://www.linkedin.com/learning/search?keywords=excel"]] },
  { id: "pl300", title: "Power BI: Microsoft Power BI Data Analyst (PL-300)", skills: ["Power BI", "Data analysis", "Data visualisation", "Reporting"], cost: "Free to learn; exam is paid", time: "1 to 2 months", kind: "Industry certification", links: [["Microsoft Learn", "https://learn.microsoft.com/credentials/"]] },
  { id: "g-data", title: "Google Data Analytics Professional Certificate", skills: ["Data analysis", "SQL", "Tableau", "Data visualisation", "Microsoft Excel"], cost: "Paid subscription, with a free trial", time: "About 6 months part time", kind: "Professional certificate", links: [["Coursera", "https://www.coursera.org/search?query=google%20data%20analytics"]] },
  { id: "g-pm", title: "Google Project Management Professional Certificate", skills: ["Project management", "Agile", "Stakeholder management", "Project coordination"], cost: "Paid subscription, with a free trial", time: "About 6 months part time", kind: "Professional certificate", links: [["Coursera", "https://www.coursera.org/search?query=google%20project%20management"]] },
  { id: "cert4-pm", title: "Certificate IV in Project Management Practice (BSB40920)", skills: ["Project management", "Project coordination", "Budgeting", "Risk assessment"], cost: "Paid; state subsidies may apply", time: "6 to 12 months", kind: "Nationally recognised qualification", links: [["Your Career course search", "https://www.yourcareer.gov.au/"], ["TAFE NSW", "https://www.tafensw.edu.au/"]] },
  { id: "aws-ccp", title: "AWS Certified Cloud Practitioner", skills: ["AWS", "Cloud computing"], cost: "Free training; exam is paid", time: "4 to 8 weeks", kind: "Industry certification", links: [["AWS Skill Builder", "https://skillbuilder.aws/"]] },
  { id: "az900", title: "Microsoft Azure Fundamentals (AZ-900)", skills: ["Microsoft Azure", "Cloud computing"], cost: "Free to learn; exam is paid", time: "2 to 6 weeks", kind: "Industry certification", links: [["Microsoft Learn", "https://learn.microsoft.com/credentials/"]] },
  { id: "py", title: "Python programming (free university and community courses)", skills: ["Python", "Programming", "pandas", "NumPy"], cost: "Free options", time: "1 to 3 months", kind: "Short course", links: [["freeCodeCamp", "https://www.freecodecamp.org/learn/"], ["Coursera (audit free)", "https://www.coursera.org/search?query=python"]] },
  { id: "web", title: "Web development: JavaScript, HTML and CSS", skills: ["JavaScript", "HTML", "CSS", "React.js", "Node.js"], cost: "Free options", time: "3 to 6 months", kind: "Short course", links: [["freeCodeCamp", "https://www.freecodecamp.org/learn/"], ["The Odin Project", "https://www.theodinproject.com/"]] },
  { id: "sql", title: "SQL for data and reporting", skills: ["SQL", "Databases", "Data analysis"], cost: "Free options", time: "2 to 6 weeks", kind: "Short course", links: [["Khan Academy", "https://www.khanacademy.org/computing/computer-programming/sql"], ["Coursera", "https://www.coursera.org/search?query=sql"]] },
  { id: "cad", title: "CAD: AutoCAD, Revit, Civil 3D or Inventor, with Autodesk certification", skills: ["AutoCAD", "Revit", "Civil 3D", "Autodesk Inventor", "Fusion 360", "CAD", "Engineering drawings", "BIM"], cost: "Student licences are free; certification is paid", time: "1 to 3 months", kind: "Industry certification", links: [["Autodesk certification", "https://www.autodesk.com/certification"], ["LinkedIn Learning", "https://www.linkedin.com/learning/search?keywords=autocad"]] },
  { id: "solidworks", title: "SolidWorks, with the CSWA certification", skills: ["SolidWorks", "3D modelling", "CAD", "FEA"], cost: "Paid exam; student access through your uni", time: "1 to 2 months", kind: "Industry certification", links: [["SOLIDWORKS certification", "https://www.solidworks.com/solidworks-certification-program"]] },
  { id: "matlab", title: "MATLAB Onramp and self-paced courses", skills: ["MATLAB", "Simulink", "Data analysis", "Modelling"], cost: "Free (Onramp); others through your uni", time: "2 to 10 hours each", kind: "Short course", links: [["MathWorks Onramp", "https://matlabacademy.mathworks.com/"]] },
  { id: "whitecard", title: "White Card: Prepare to work safely in the construction industry (CPCWHS1001)", skills: ["White Card", "Workplace health and safety", "Construction"], cost: "Paid, usually under a day", time: "1 day", kind: "Licence", links: [["Find a provider on Your Career", "https://www.yourcareer.gov.au/"]] },
  { id: "firstaid", title: "Provide First Aid (HLTAID011), including CPR (HLTAID009)", skills: ["First Aid (HLTAID011)", "First aid", "CPR"], cost: "Paid, about a day", time: "1 day (some online study first)", kind: "Nationally recognised unit", links: [["Australian Red Cross", "https://www.redcross.org.au/first-aid/"], ["St John Ambulance", "https://www.stjohn.org.au/"]] },
  { id: "forklift", title: "Forklift licence (TLILIC0003)", skills: ["Forklift licence (LF)", "Forklift operation", "Warehousing"], cost: "Paid", time: "2 to 4 days", kind: "Licence", links: [["Find a provider on Your Career", "https://www.yourcareer.gov.au/"]] },
  { id: "heights", title: "Work safely at heights (RIIWHS204E)", skills: ["Working at Heights", "Workplace health and safety"], cost: "Paid", time: "1 day", kind: "Nationally recognised unit", links: [["Find a provider on Your Career", "https://www.yourcareer.gov.au/"]] },
  { id: "rsa", title: "Responsible Service of Alcohol (SITHFAB021) for your state", skills: ["RSA", "Hospitality", "Bar service"], cost: "Paid, low cost", time: "Half a day to a day, often online", kind: "Licence", links: [["Your state's liquor regulator lists approved providers", "https://www.yourcareer.gov.au/"]] },
  { id: "foodsafety", title: "Food Safety Supervisor (SITXFSA005 and SITXFSA006)", skills: ["Food safety", "Food Safety Supervisor", "Hospitality", "Kitchen operations"], cost: "Paid, low cost", time: "1 to 2 days, often online", kind: "Nationally recognised units", links: [["Find a provider on Your Career", "https://www.yourcareer.gov.au/"]] },
  { id: "cert3-is", title: "Certificate III in Individual Support (CHC33021)", skills: ["Aged care", "Disability support", "Patient care", "Care planning", "Manual handling"], cost: "Often fee-free or subsidised for eligible people", time: "6 to 12 months", kind: "Nationally recognised qualification", links: [["Fee-Free TAFE", "https://www.dewr.gov.au/skills-reform/fee-free-tafe"], ["Your Career", "https://www.yourcareer.gov.au/"]] },
  { id: "cert3-ece", title: "Certificate III in Early Childhood Education and Care (CHC30121)", skills: ["Early childhood education", "Childcare"], cost: "Often fee-free or subsidised for eligible people", time: "About 12 months", kind: "Nationally recognised qualification", links: [["Fee-Free TAFE", "https://www.dewr.gov.au/skills-reform/fee-free-tafe"]] },
  { id: "digital-mkt", title: "Google Digital Marketing and E-commerce Certificate", skills: ["Digital marketing", "Social media marketing", "Google Analytics", "SEO", "Content strategy"], cost: "Paid subscription, with a free trial", time: "About 6 months part time", kind: "Professional certificate", links: [["Coursera", "https://www.coursera.org/search?query=google%20digital%20marketing"]] },
  { id: "hubspot", title: "HubSpot Academy marketing and sales courses", skills: ["Content marketing", "Email marketing", "CRM", "Inbound marketing", "Sales"], cost: "Free", time: "A few hours each", kind: "Short course", links: [["HubSpot Academy", "https://academy.hubspot.com/"]] },
  { id: "design", title: "Design tools: Figma and Adobe (Photoshop, Illustrator)", skills: ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Graphic design", "UX design", "Canva"], cost: "Free tutorials; some paid courses", time: "2 to 8 weeks", kind: "Short course", links: [["Figma Learn", "https://help.figma.com/"], ["LinkedIn Learning", "https://www.linkedin.com/learning/search?keywords=figma"]] },
  { id: "micro", title: "University microcredentials (short, credit-bearing courses)", skills: [], cost: "Varies; some are subsidised", time: "Weeks to a few months", kind: "Microcredential", links: [["MicroCred Seeker (Australian Government)", "https://education.gov.au/node/14852"]] },
  { id: "oua", title: "A degree or graduate certificate online through Open Universities Australia", skills: [], cost: "Paid per subject; FEE-HELP loans for eligible students", time: "One subject at a time, from about 13 weeks", kind: "University study", links: [["Open Universities Australia", "https://www.open.edu.au/"]] },
  { id: "feefree", title: "Fee-Free TAFE courses in priority areas", skills: [], cost: "Free tuition for eligible people (for example 17 to 24 year olds, job seekers and carers)", time: "Varies", kind: "Government-funded training", links: [["Fee-Free TAFE (Australian Government)", "https://www.dewr.gov.au/skills-reform/fee-free-tafe"], ["Your Career", "https://www.yourcareer.gov.au/"]] },
  { id: "maths", title: "Brush up on maths for numerical and aptitude tests", skills: ["Numerical reasoning", "Percentages"], cost: "Free", time: "15 minutes a day for a few weeks", kind: "Self-study", links: [["Khan Academy", "https://www.khanacademy.org/math"]] },
  { id: "comm", title: "Communication, presentation and leadership short courses", skills: ["Communication", "Presentations", "Leadership", "Teamwork", "Stakeholder management"], cost: "Free to low cost", time: "A few hours each", kind: "Short course", links: [["LinkedIn Learning", "https://www.linkedin.com/learning/"], ["FutureLearn", "https://www.futurelearn.com/"]] }
];
const BROADEN = {
  graduate: ["micro", "ms-excel", "g-pm"], engineering: ["cad", "solidworks", "matlab", "whitecard"], corporate: ["ms-excel", "pl300", "g-pm"], government: ["cert4-pm", "ms-excel", "comm"],
  tech: ["aws-ccp", "py", "sql"], health: ["firstaid", "cert3-is", "feefree"], creative: ["digital-mkt", "design", "hubspot"], hospitality: ["rsa", "foodsafety", "firstaid"],
  trades: ["whitecard", "forklift", "heights"], academic: ["py", "oua", "micro"]
};
// Which skills to close: the scanned ad's missing ones first, then your target job's common ones
function learningGaps() {
  const p = P(), have = new Set([...p.skills.hard, ...p.skills.software, ...p.skills.certs].map(s => s.toLowerCase()));
  const resume = hasProfile(p) ? skillSet(profileToText(p)) : new Set();
  const gaps = [];
  if (lastResult) for (const x of [...lastResult.hard].filter(x => !x.found).sort((a, b) => ((b.priority === "Required") - (a.priority === "Required")) || b.rel - a.rel)) gaps.push({ skill: x.name, from: `${x.priority === "Required" ? "Required" : "Asked for"} in the job you scanned` });
  const jt = p.target.jobType;
  for (const s of [...((COMMON_SKILLS[jt] || {}).software || []), ...(COMMON_CERTS[jt] || [])]) if (!have.has(s.toLowerCase()) && !resume.has(s) && !gaps.some(g => g.skill === s)) gaps.push({ skill: s, from: `Common in ${((JOB_TYPES.find(j => j.key === jt) || {}).label || "your field").toLowerCase()} jobs` });
  const apt = aptStore.data.sessions.filter(s => s.type === "numerical" || s.type === "speed");
  if (apt.length && Math.max(...apt.map(s => s.pct)) < 60) gaps.push({ skill: "Numerical reasoning", from: "Your aptitude test practice" });
  for (const s of (linStore.data.last && scoreLinkedIn(linStore.data.input).missing) || []) if (!gaps.some(g => g.skill === s) && !have.has(s.toLowerCase())) gaps.push({ skill: s, from: "Missing from your LinkedIn" });
  return gaps.slice(0, 12);
}
function matchCourses(gaps) {
  const out = new Map();
  const lc = s => s.toLowerCase();
  for (const g of gaps) {
    const c = LEARN_CATALOGUE.find(c => c.skills.some(s => lc(s) === lc(g.skill))) || LEARN_CATALOGUE.find(c => c.skills.some(s => lc(g.skill).includes(lc(s)) || lc(s).includes(lc(g.skill))));
    if (c) { const r = out.get(c.id) || { c, why: [] }; r.why.push(`${g.skill}: ${g.from.toLowerCase()}`); out.set(c.id, r); }
  }
  return [...out.values()];
}
const LEARN_NANO = `You are an Australian careers adviser. Choose the most useful courses for this person from the catalogue.
Rules:
1. Only choose ids that appear in the catalogue. Never invent courses.
2. Choose 3 to 5, most useful first. Prefer free or short options when the goal is to get a job faster.
3. For each, write one short reason that names the skill gap or job it helps with.
Reply with JSON only: {"picks": [{"id": "...", "why": "..."}]}`;
async function aiLearningPlan(gaps, goal, progress) {
  const cat = LEARN_CATALOGUE.map(c => `${c.id}: ${c.title} (${c.kind}; ${c.cost}; ${c.time}; skills: ${c.skills.join(", ") || "general"})`).join("\n");
  const p = P();
  const prompt = `Goal: ${goal === "faster" ? "get a job faster" : "move up or change careers"}\nTarget job: ${p.target.title || (lastScan ? detectTitle(lastScan.jd, lastScan.title) : "") || "(not given)"}\nSkill gaps: ${gaps.map(g => `${g.skill} (${g.from})`).join("; ") || "(none found)"}\nCatalogue:\n${cat}`;
  return aiJSON({ nano: LEARN_NANO, prompt, label: "Choosing courses", progress,
    schema: { type: "object", properties: { picks: { type: "array", items: { type: "object", properties: { id: { type: "string" }, why: { type: "string" } }, required: ["id", "why"] } } }, required: ["picks"] },
    check: d => { const ok = (Array.isArray(d.picks) ? d.picks : []).filter(x => x && LEARN_CATALOGUE.some(c => c.id === x.id)).slice(0, 5).map(x => ({ id: x.id, why: stripMarkup(String(x.why || "")).slice(0, 200) })); return ok.length >= 2 ? { ok: true, value: ok } : { ok: false, why: "choose at least 2 ids from the catalogue" }; } });
}
function courseCard(c, why, inPlan) {
  return `<article class="course"><div class="course-head"><span class="iv-badge plain">${esc(c.kind)}</span><span class="small muted">${esc(c.time)}</span></div><h3>${esc(c.title)}</h3>${why ? `<p class="small">${esc(why)}</p>` : ""}<p class="small"><b>Cost:</b> ${esc(c.cost)}</p>
    <div class="course-links">${c.links.map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div>
    <button class="btn${inPlan ? "" : " primary"}" type="button" data-plan="${c.id}"${inPlan ? " disabled" : ""}>${inPlan ? "In your plan" : "Add to my plan"}</button></article>`;
}
function renderLearning() {
  const gaps = learningGaps(), goal = learnStore.data.goal;
  const inPlan = id => learnStore.data.plan.some(x => x.id === id);
  document.querySelectorAll("#lnGoal [data-goal]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.goal === goal)));
  $("lnGaps").innerHTML = gaps.length ? `<p class="small">Based on ${lastResult ? "the job you scanned, " : ""}your target job${aptStore.data.sessions.length ? ", your test practice" : ""}${linStore.data.last ? " and your LinkedIn" : ""}:</p><div class="chips">${gaps.map(g => `<span class="chip missing" title="${esc(g.from)}">${esc(g.skill)}</span>`).join("")}</div>` : `<p class="small muted">No gaps found yet. <a href="#scanner">Scan a job ad</a> or set your target job in <a href="#builder">the resume builder</a> for recommendations that fit.</p>`;
  const matched = matchCourses(gaps);
  const jt = P().target.jobType;
  const broaden = (BROADEN[jt] || ["micro", "oua", "feefree"]).filter(id => !matched.some(m => m.c.id === id)).map(id => LEARN_CATALOGUE.find(c => c.id === id));
  const order = goal === "faster" ? m => (/free/i.test(m.c.cost) ? 0 : 1) + (/day|hour|week/i.test(m.c.time) ? 0 : 1) : m => /qualification|university|certificate/i.test(m.c.kind) ? 0 : 1;
  matched.sort((a, b) => order(a) - order(b));
  $("lnRecs").innerHTML = (matched.length ? `<h2>For your skill gaps</h2><div class="course-grid">${matched.map(m => courseCard(m.c, "Covers " + m.why.join("; "), inPlan(m.c.id))).join("")}</div>` : "")
    + `<h2>To widen your options${jt ? ` in ${esc(((JOB_TYPES.find(j => j.key === jt) || {}).label || "").toLowerCase())}` : ""}</h2><div class="course-grid">${broaden.map(c => courseCard(c, "", inPlan(c.id))).join("")}</div>`
    + (() => { const ways = ["feefree", "micro", "oua"].filter(id => !broaden.some(c => c.id === id) && !matched.some(m => m.c.id === id)); return ways.length ? `<h2>Ways to study online in Australia</h2><div class="course-grid">${ways.map(id => courseCard(LEARN_CATALOGUE.find(c => c.id === id), "", inPlan(id))).join("")}</div>` : ""; })();
  renderPlan();
}
function renderPlan() {
  const plan = learnStore.data.plan;
  $("lnPlan").innerHTML = plan.length ? `<ul class="ln-plan">${plan.map((x, i) => { const c = LEARN_CATALOGUE.find(c => c.id === x.id) || { title: x.id, links: [] }; return `<li class="${x.done ? "done" : ""}"><label class="q-check"><input type="checkbox" data-plan-done="${i}"${x.done ? " checked" : ""}> <span>${esc(c.title)}</span></label>${x.why ? `<span class="small muted">${esc(x.why)}</span>` : ""}<span class="ln-plan-acts">${c.links[0] ? `<a href="${esc(c.links[0][1])}" target="_blank" rel="noopener">Open ↗</a>` : ""}<button class="linkish" type="button" data-plan-del="${i}">Remove</button></span></li>`; }).join("")}</ul><p class="small muted">${plan.filter(x => x.done).length} of ${plan.length} done. When you finish one, add it to your resume's Licences and certifications, and to LinkedIn.</p>` : `<p class="small muted">Add courses below to build your plan.</p>`;
}
onInit(() => {
  $("view-learning").addEventListener("click", async e => {
    const g = e.target.closest("[data-goal]");
    if (g) { learnStore.data.goal = g.dataset.goal; learnStore.save(); renderLearning(); return; }
    const a = e.target.closest("[data-plan]");
    if (a) { if (!learnStore.data.plan.some(x => x.id === a.dataset.plan)) learnStore.data.plan.push({ id: a.dataset.plan, done: false, added: todayISO() }); learnStore.save(); a.disabled = true; a.textContent = "In your plan"; a.classList.remove("primary"); renderPlan(); return; }
    const d = e.target.closest("[data-plan-del]");
    if (d) { learnStore.data.plan.splice(+d.dataset.planDel, 1); learnStore.save(); renderLearning(); return; }
    if (e.target.closest("#lnAi")) {
      const btn = $("lnAi"), st = $("lnAiStatus");
      btn.disabled = true;
      const r = await aiLearningPlan(learningGaps(), learnStore.data.goal, m => { st.textContent = m; });
      btn.disabled = false;
      if (!r.data) { st.textContent = sample || (await chromeAIState()) !== "absent" ? "The AI couldn't put together a plan this time. The recommendations below are matched to your gaps." : "AI isn't available on this page. The recommendations below are matched to your gaps."; return; }
      for (const x of r.data) if (!learnStore.data.plan.some(y => y.id === x.id)) learnStore.data.plan.push({ id: x.id, why: x.why, done: false, added: todayISO() });
      learnStore.save(); renderLearning();
      st.textContent = `${viaWords(r.via)} chose ${r.data.length} courses for your plan, only from the list below.`;
    }
  });
  $("view-learning").addEventListener("change", e => { const c = e.target.closest("[data-plan-done]"); if (c) { learnStore.data.plan[+c.dataset.planDone].done = c.checked; learnStore.save(); renderPlan(); } });
  viewHooks.learning = () => Promise.all([learnStore.ready, aptStore.ready, linStore.ready]).then(renderLearning);
});

