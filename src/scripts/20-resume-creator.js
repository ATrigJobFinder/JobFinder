/* ===================== Resume creator ===================== */
// The cover letter page can write from a resume or LinkedIn that was brought in just for that letter (ltTemp): it is never added to the profile.
// While the letter page is showing, P() is that; everywhere else it is the profile. Its design settings (cv, prefs) are the profile's own.
let ltTemp = null;
const P = () => ltTemp && currentView === "letter" ? ltTemp : profile.data;
// Goal first (it decides which designs and tips come up); the summary near the end, so it can draw on everything else
const B_STEPS = [
  { key: "goal", label: "Goal" }, { key: "layout", label: "Layout" }, { key: "contact", label: "Contact" }, { key: "experience", label: "Experience" },
  { key: "education", label: "Education" }, { key: "skills", label: "Skills" }, { key: "extras", label: "Extras" }, { key: "summary", label: "Summary" }, { key: "review", label: "Review" }
];
const SN = k => B_STEPS.findIndex(s => s.key === k);
const kicker = k => `Step ${SN(k) + 1} of ${B_STEPS.length}`;
const openSets = () => ({ experience: new Set([0]), education: new Set([0]), projects: new Set([0]), volunteering: new Set([0]), referees: new Set([0]), extras: new Set() });
const builder = { openCo: new Set(), step: 0, open: openSets(), lastBullet: null, sugg: {}, undo: null, visited: new Set([0]), genned: new Set(), alts: {}, fixAsk: null, showSummary: false, sumPrefilled: false, pendingGoto: null, check: null, tplFilter: [], tplShow: 12, sumAlts: null, moreSugg: {}, foldOpen: {}, extraSec: {} };
const ACTION_VERBS = ["Led", "Managed", "Coordinated", "Organised", "Delivered", "Built", "Designed", "Developed", "Created", "Improved", "Reduced", "Increased", "Streamlined", "Analysed", "Researched", "Tested", "Trained", "Mentored", "Supervised", "Served", "Resolved", "Negotiated", "Presented", "Wrote", "Prepared", "Planned", "Launched", "Achieved", "Won", "Maintained", "Installed", "Inspected", "Operated", "Processed", "Handled"];
// Skill, licence and strength ideas for each kind of work are in 21a-suggestion-lists.js

/* --- Form helpers --- */
const fid = path => "b_" + path.replace(/[^a-z0-9]/gi, "_");
// A question: its label, then the box, then any hint. Hints sit under the box, so boxes side by side line up.
// o.suggest: a type-ahead list (see 21); o.cap: capitals to fix ("name", "title", "jobtitle"); o.date: a date box
function q(path, label, o = {}) {
  const raw = getPath(P(), path);
  let v = raw;
  if (o.date) v = showDate(v);
  const id = fid(path);
  const lab = `<label class="q-label" for="${id}">${label}${o.opt ? ' <span class="opt">(optional)</span>' : ""}</label>`;
  const hint = o.hint ? `<p class="q-hint" id="${id}_h">${o.hint}</p>` : "";
  const order = o.date && /\.end$/.test(path) ? endBeforeStart(getPath(P(), path.replace(/\.end$/, ""))) : "";
  const badDate = o.date && ((val(raw) && !dateOk(raw)) || !!order);
  const descIds = [o.hint ? id + "_h" : "", o.date ? id + "-msg" : ""].filter(Boolean).join(" ");
  const desc = descIds ? ` aria-describedby="${descIds}"` : "";
  const words = ["name", "surname", "title", "jobtitle"].includes(o.cap);
  const extra = `${o.cap ? ` data-cap="${o.cap}"` : ""}${o.date ? ' data-date="1"' : ""}${o.inputmode ? ` inputmode="${o.inputmode}"` : ""}${words ? ' autocapitalize="words"' : ""}${o.prose ? ' data-prose="1" spellcheck="true" autocapitalize="sentences"' : ""}${badDate ? ' class="bad" aria-invalid="true"' : ""}`;
  let input;
  if (o.area) input = `<textarea id="${id}" data-path="${path}"${o.lines ? ' data-lines="1"' : ""}${o.multi || o.lines ? ' data-multiline="1"' : ""} rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}"${desc}${o.spell === false ? ' spellcheck="false"' : ' spellcheck="true" data-prose="1" autocapitalize="sentences"'}>${esc(o.lines ? (v || []).join("\n") : v || "")}</textarea>`;
  else if (o.select) input = `<select id="${id}" data-path="${path}"${desc}${o.rerender ? ' data-rerender="1"' : ""}>${o.select.map(x => { const [k, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(k)}"${k === (v || "") ? " selected" : ""}>${esc(l || "Choose…")}</option>`; }).join("")}</select>`;
  else input = `<input type="${o.type || "text"}" id="${id}" data-path="${path}" value="${esc(v || "")}" placeholder="${esc(o.ph || "")}" autocomplete="${o.nofill ? "nope" : o.ac || "off"}"${o.nofill ? ` name="nofill-${Math.random().toString(36).slice(2, 8)}" data-nofill="1" data-lpignore="true" data-1p-ignore data-form-type="other" readonly` : ""}${extra}${desc}${o.suggest ? ` data-suggest="${o.suggest}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-sl"` : ""}>`;
  if (o.suggest) input = `<div class="pick sugg">${input}<ul class="pick-list" id="${id}-sl" role="listbox" aria-label="${esc(String(label).replace(/<[^>]+>/g, ""))} suggestions" hidden></ul></div>`;
  const msg = o.date ? `<p class="pick-msg${badDate ? " err" : ""}" id="${id}-msg" role="status">${badDate ? esc(order || DATE_HELP) : ""}</p>` : "";
  return `<div class="q${o.wide ? " wide" : ""}">${lab}<div class="q-body">${input}${msg}${o.after || ""}${hint}</div></div>`;
}
const DATE_HELP = "We can't read that date. Try a month and year like “Feb 2023”, “02/2023” or “February 2023”, or just the year.";
const check = (path, label) => `<label class="q-check"><input type="checkbox" data-path="${path}"${getPath(P(), path) ? " checked" : ""}> ${label}</label>`;
// The tick box beside a pair of dates, lined up with the date boxes
const endCheck = (path, label) => `<div class="q q-end"><span class="q-label" aria-hidden="true">&nbsp;</span><div class="q-body">${check(path, label)}</div></div>`;
const presentBox = () => `<div class="q"><span class="q-label">Finished</span><div class="q-body"><input type="text" value="Present" disabled aria-label="Finished: present"></div></div>`;
function chipQ(path, label, hint, items) {
  const cur = getPath(P(), path);
  return `<div class="q"><div class="q-label" id="${fid(path)}_l">${label}</div>${hint ? `<p class="q-hint">${hint}</p>` : ""}<div class="opt-chips" role="group" aria-labelledby="${fid(path)}_l">${items.map(x => `<button type="button" class="opt-chip" data-act="pick" data-path="${path}" data-val="${esc(x.key)}" aria-pressed="${cur === x.key}">${esc(x.label)}</button>`).join("")}</div></div>`;
}
// Sidebar designs have two colours: the headings (above) and the side column. Dark sidebars pick from deep colours, light ones from the design's own.
const SIDE_DARKS = ["#1F2430", "#14213D", "#0B3D3A", "#3B1E54", "#1F3D2B", "#4A1D1D", "#111111"];
function colour2Q(t) {
  if (t.layout !== "sidebar") return "";
  const list = t.tone === "dark" ? SIDE_DARKS : t.accents, cur = P().cv.template === t.key ? P().cv.accent2 : "";
  const first = t.tone === "dark" ? "#1F2430" : builderAccent(t);
  return `<div class="q-label" id="bCol2L" style="margin-top:10px">Side column colour</div><div class="swatches" role="group" aria-labelledby="bCol2L"><button type="button" class="swatch" data-v25="accent2" data-val="" style="background:${first}" aria-pressed="${!cur}" aria-label="Side column: the design's own colour"></button>${list.filter(a => a !== first).map(a => `<button type="button" class="swatch" data-v25="accent2" data-val="${a}" style="background:${a}" aria-pressed="${a === cur}" aria-label="Side column colour ${a}"></button>`).join("")}</div>`;
}
// The design's colours, in the Layout step and again in Review
function colourQ() {
  const t = builderTpl();
  return `<div class="q"><div class="q-label" id="bColL">Colour</div><div class="swatches" role="group" aria-labelledby="bColL">${t.accents.map(a => `<button type="button" class="swatch" data-act="accent" data-val="${a}" style="background:${a}" aria-pressed="${a === builderAccent(t)}" aria-label="Accent colour ${a}"></button>`).join("")}</div>
        ${colour2Q(t)}<p class="q-hint">${esc(t.name)}: ${esc(t.blurb)}${t.ats ? "" : " It has two columns, which some online application systems read out of order. For job portals, a single-column design like Professional is safer."}</p></div>`;
}
// Action words grouped by what the bullet is about, the same groups as on the Resume Advice page. Each is one word, so it can swap a bullet's first word.
const VERB_GROUPS = [
  ["Led", ["Led", "Supervised", "Coordinated", "Trained", "Mentored", "Rostered", "Delegated", "Managed", "Organised"]],
  ["Improved", ["Cut", "Reduced", "Increased", "Streamlined", "Fixed", "Upgraded", "Simplified", "Improved"]],
  ["Built", ["Built", "Designed", "Launched", "Wrote", "Created", "Introduced", "Developed", "Established"]],
  ["Served", ["Served", "Resolved", "Supported", "Advised", "Welcomed", "Handled", "Negotiated"]],
  ["Delivered", ["Completed", "Delivered", "Installed", "Processed", "Achieved", "Shipped", "Met", "Operated"]],
  ["Checked", ["Analysed", "Tracked", "Audited", "Reconciled", "Inspected", "Tested", "Forecast", "Researched"]]
];
const stepHead = (kicker, title, intro) => `<div class="b-step-head"><span class="kicker">${kicker}</span><h2 id="bStepTitle" tabindex="-1">${title}</h2>${intro ? `<p>${intro}</p>` : ""}</div>`;
/* --- The steps --- */
const STEP_RENDER = {
  layout() {
    return stepHead(kicker("layout"), "Choose your layout", "Designs that suit the goal you chose are shown first. Your resume takes shape in the design as you go, and you can change it at any time.")
      + `<div class="q"><div class="q-label" id="bTplL">Design</div><p class="q-hint">Choose as many filters as you like: a design has to match one choice from each row you use.</p>${tplFilterHtml(builder.tplFilter, "data-act=\"tpl-filter\" data-val")}<div class="b-tpls" role="group" aria-labelledby="bTplL">${layoutCards()}</div>${layoutMore()}</div>`
      + colourQ()
      + fontQ()
      + pageSetupQ();
  },
  goal() {
    const p = P(), st = p.target.stage;
    const tips = {
      none: "No experience is fine. Lead with education, school and uni projects, volunteering, clubs and any casual or family work. Employers hiring for entry-level roles expect this, and they look for reliability and willingness to learn.",
      student: "Part-time jobs, volunteering, clubs and uni projects all count. Graduate recruiters expect them, and they show reliability.",
      early: "Lead with your most recent role and show results, not duties. One page is ideal, two at most.",
      experienced: "Focus on the last 10 to 15 years and your biggest results. Two pages is normal.",
      change: "Lead with the skills that carry over to the new field, and use your summary to explain the move in one line.",
      returning: "List the gap simply (for example “Career break: caring for family”) and include any courses or volunteering since."
    };
    return stepHead(kicker("goal"), "What are you going for?", "A resume works best when it's written for one kind of job. Your answers here pick the designs, questions and tips that follow.")
      + chipQ("target.stage", "Where are you in your career?", "Students, recent graduates and people with no experience lead with education. Everyone else leads with experience.", STAGES)
      + (st ? `<p class="tip">${tips[st]}</p>` : "")
      + q("target.title", "Job title you are applying for", { hint: "Start typing and the list narrows to titles that match, or type your own if it isn't there. It becomes the headline under your name, and it decides which designs, skill ideas and tips come first.", ph: "e.g. Graduate Mechanical Engineer", suggest: "titles", cap: "jobtitle" });
  },
  contact() {
    return stepHead(kicker("contact"), "How can employers reach you?", "Recruiters call more often than they email, so check your number.")
      + `<div class="q-grid">${q("contact.first", "First name", { ph: "e.g. Alex", ac: "given-name", cap: "name" })}${q("contact.last", "Last name", { ph: "e.g. Nguyen", ac: "family-name", cap: "surname" })}${phoneQ()}${q("contact.email", "Email", { type: "email", ph: "e.g. alex.nguyen@email.com", ac: "email" })}${locQ("contact.location", "Location", { plain: true, ac: true, hint: "You can put your suburb or city, like Parramatta NSW. Enough to show you're local. Not your street address." })}${q("contact.linkedin", "LinkedIn", { opt: true, ph: "linkedin.com/in/your-name", ac: "url" })}${q("contact.website", "Portfolio, GitHub or website", { opt: true, ph: "e.g. github.com/your-name", ac: "url" })}${q("contact.workRights", "Work rights", { opt: true, select: WORK_RIGHTS, hint: "Worth stating if your name or study history might make employers wonder." })}${licenceQ()}</div>`
      + `<p class="tip">Leave out your date of birth, photo, marital status and full street address. Australian employers don't need them, and they can invite bias.</p>`
      + `<p class="b-check" id="bContactCheck"></p>`;
  },
  summary() {
    const p = P(), filled = prefillSummaryQ(p);
    return stepHead(kicker("summary"), "Your profile in three sentences", "The short paragraph at the top. It's written last, so it can draw on everything you've added. Recruiters often decide whether to keep reading from this alone. It's optional: if you leave it blank, your resume simply has no Profile section.")
      + (filled ? `<p class="tip">We've started these answers from your earlier steps. Change anything that doesn't sound like you, then write your summary.</p>` : "")
      + aiBoxOpen("sum", "write your summary", "Tell us about you", "AI: Info to create your summary", builder.foldOpen.sum === undefined ? !!p.summary.trim() : !builder.foldOpen.sum) + `<p class="q-hint">Answer in plain words. The AI uses these to write your summary below, and they never appear on the resume themselves.</p>`
      + q("summaryQ.who", "In one line, how would you describe yourself professionally?", { area: true, rows: 2, ph: "e.g. Final-year mechanical engineering student with internship experience in solar projects" })
      + q("summaryQ.strengths", "What are your two or three strongest skills for this kind of job?", { area: true, rows: 2, ph: "e.g. CAD design in SolidWorks, technical reports, working with site teams" })
      + q("summaryQ.proof", "What's one result you're proud of that backs that up?", { area: true, rows: 2, ph: "e.g. Cut a bracket's weight by 18% during my internship", hint: "A number makes it stick: how many, how much, how fast." })
      + q("summaryQ.next", "What are you looking for next?", { area: true, rows: 2, ph: "e.g. A graduate role in renewable energy design" })
      + `<div class="b-actions b-aiin-foot"><button class="btn primary" type="button" data-act="ai-summary">${p.summary.trim() ? "Write it again" : "Write my summary"}</button><span class="engine-note" id="bSumEngine"></span></div>` + aiBoxClose
      + q("summary", "Your summary", { opt: true, area: true, rows: 5, multi: true, after: `<div class="sum-meta"><p class="q-hint">Edit it until it sounds like you. Aim for 40 to 75 words, no “I”, no clichés.</p><span class="sum-words" id="bSumWords">${wordCount(p.summary)} ${wordCount(p.summary) === 1 ? "word" : "words"}</span></div><p class="b-check" id="bSumCheck"></p><div id="bSumActs">${summaryActions()}</div>` });
  },
  experience() {
    const p = P();
    builder.expSig = expGroupSig(p);
    return stepHead(kicker("experience"), "Your work experience", "Newest first. Paid work, internships and substantial unpaid roles all count. For each job, answer the questions, turn them into bullet points, then finish the job to add it to your resume.")
      + sortBar("experience")
      + expGroups(p).map(g => g.key ? expGroupHtml(g) : expCard(p.experience[g.ids[0]], g.ids[0])).join("")
      + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="experience">+ Add a job</button></div>`;
  },
  education() {
    const p = P();
    const tip = stageOf(p) === "student" ? "Your education goes first on your resume while you're studying or recently graduated." : "After a few years of work, education sits below experience. You can drop high school and ATAR.";
    return stepHead(kicker("education"), "Your education", "Degrees, diplomas, TAFE, school and certificates. Newest first. Finish each one to add it to your resume.")
      + `<p class="tip">${tip}</p>`
      + sortBar("education")
      + p.education.map((e, i) => eduCard(e, i)).join("")
      + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="education">+ Add a qualification</button></div>`;
  },
  skills() {
    return stepHead(kicker("skills"), "Your skills and licences", "Applicant tracking systems match these against the job ad, so use the same words employers use. Start typing to pick from the list, or press Enter to add your own. Only add what you can talk about in an interview.")
      + chipEditor("software", ...CHIP_LABELS.software)
      + chipEditor("certs", ...CHIP_LABELS.certs)
      + chipEditor("hard", ...CHIP_LABELS.hard)
      + langEditor()
      + chipEditor("soft", ...CHIP_LABELS.soft);
  },
  extras() {
    const p = P();
    // Each ticked section can be folded away with the small triangle in its top right corner (the answers stay where they are)
    const folded = key => !!(builder.extraFold || {})[key];
    const tog = (key, label) => p.extras[key] ? `<button type="button" class="b-extra-tog${folded(key) ? " is-folded" : ""}" data-act="extra-fold" data-key="${key}" aria-expanded="${!folded(key)}" aria-label="${folded(key) ? "Show" : "Hide"} ${esc(label)}" title="${folded(key) ? "Show" : "Hide"} this section"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4z" fill="currentColor"/></svg></button>` : "";
    // A finished awards, publications or interests section folds down to its lines, like a finished job above it; Edit opens it again
    const peek = key => {
      if (!p.extras[key] || !p.extrasDone[key] || !["awards", "publications", "interests"].includes(key)) return "";
      const lines = key === "interests" ? [val(p.interests)].filter(Boolean) : linesOf(p[key]), shownN = lines.slice(0, 3);
      return `<div class="b-extra-peek" data-peek="${key}"${folded(key) ? "" : " hidden"}><ul>${shownN.map(l => `<li>${esc(l)}</li>`).join("")}</ul>${lines.length > shownN.length ? `<span class="small muted">and ${lines.length - shownN.length} more</span>` : ""}<button class="linkish" type="button" data-act="extra-fold" data-key="${key}">Edit</button></div>`;
    };
    const box = (key, label, inner) => `<div class="b-card${p.extras[key] ? "" : " off"}${p.extrasDone[key] ? " done" : ""}"><div class="b-card-body"><div class="b-extra-head"><label class="q-check"><input type="checkbox" data-path="extras.${key}" data-rerender="1"${p.extras[key] ? " checked" : ""}> <b>${label}</b></label>${p.extras[key] && p.extrasDone[key] ? '<span class="card-tag done">On your resume</span>' : ""}${tog(key, label)}</div>${peek(key)}${p.extras[key] ? `<div class="b-extra-inner" data-extra="${key}"${folded(key) ? " hidden" : ""}>${inner}</div>` : ""}</div></div>`;
    return stepHead(kicker("extras"), "Anything else worth showing?", "Tick the sections you want. They're optional, but projects, volunteering and awards can make a short resume stand out. Finish adds each one to your resume.")
      + box("availability", "Availability", `${workTypeQ()}<div class="q-grid">${startQ()}${q("availDays", "Days you can work", { opt: true, hint: "Useful for casual, retail and hospitality roles.", ph: "e.g. Weekends and Thursday nights", prose: true })}${wantsHours(P()) ? q("availHours", "Hours per week", { opt: true, ph: "e.g. 20", inputmode: "numeric", hint: "A number, or a range like 15 to 25.", ac: "off" }) : ""}</div>`)
      + box("projects", "Projects", p.projects.map((x, i) => projCard(x, i)).join("") + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="projects">+ Add a project</button></div><p class="q-hint">University, personal or work projects. Say what you built and what came of it.</p>`)
      + box("volunteering", "Volunteering", p.volunteering.map((x, i) => volCard(x, i)).join("") + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="volunteering">+ Add a role</button></div>`)
      + box("awards", "Awards and achievements", lineListQ("awards", "Awards and achievements", "e.g. Dean's List, 2024", "+ Add an award") + textFoot("awards"))
      + box("publications", "Publications", lineListQ("publications", "Publications, in your field's citation style", "e.g. Nguyen, A. (2025). Title. Journal, 12(3), 45-60", "+ Add a publication") + textFoot("publications"))
      + box("interests", "Interests", q("interests", "A short line", { hint: "Only if they say something useful about you: a team sport, a club you run, a relevant hobby.", ph: "e.g. Club cricket, building mechanical keyboards", prose: true }) + textFoot("interests"))
      + box("referees", "Referees", refereesBlock());
  },
  review() {
    const h = resumeHealth(P());
    const col = h.score >= 80 ? "var(--good)" : h.score >= 60 ? "var(--accent)" : "var(--warn)";
    const icon = s => s === "pass" ? '<span class="ico pass">✓</span>' : s === "warn" ? '<span class="ico warn">!</span>' : '<span class="ico fail">!</span>';
    const sorted = [...h.items.filter(i => i.status === "fail"), ...h.items.filter(i => i.status === "warn"), ...h.items.filter(i => i.status === "pass")];
    const t = builderTpl();
    return stepHead(kicker("review"), "Check and download", "A quick check of what recruiters and applicant tracking systems look for, an AI read-through of the whole resume, then choose what goes on this version.")
      + `<div class="health"><div class="health-num" style="border-color:${col}"><div><b>${h.score}</b><span>out of 100</span></div></div><div><p><b>${h.score >= 80 ? "Strong. Ready to send." : h.score >= 60 ? "Good. A few fixes will make it stronger." : "Getting there. Fix the items marked below."}</b></p><p class="small muted">${h.items.filter(i => i.status !== "pass").length} thing${h.items.filter(i => i.status !== "pass").length === 1 ? "" : "s"} to improve.</p></div></div>`
      + `<ul class="health-list">${sorted.map(i => `<li>${icon(i.status)}<span>${esc(i.text)}</span>${i.status !== "pass" && i.step != null ? `<button class="linkish" type="button" data-act="goto" data-step="${i.step}">Fix</button>` : "<span></span>"}</li>`).join("")}</ul>`
      + chooseHtml()
      + colourQ()
      + fontQ()
      + `<div class="b-sub">Page setup</div>` + pageSetupQ()
      + designSuggestHtml()
      + `<div class="b-sub">Download</div><p class="q-hint">In your ${esc(t.name)} layout${t.ats ? ", which applicant tracking systems read reliably" : ". It has two columns, so for online job portals the Professional layout is read more reliably"}. <button class="linkish" type="button" data-act="goto" data-step="${SN("layout")}">Change layout</button></p>`
      + `<div class="b-actions b-dl-row"><button class="btn primary" type="button" id="bDlBtn" data-dlmenu aria-haspopup="menu" aria-expanded="false">Download as…</button><span class="foot-gap"></span><button class="btn primary" type="button" data-act="save-resume">Save to my profile…</button></div><p class="q-hint">Save to my profile keeps this version under a name, like the job it's for, so you can open or download it again later. It needs a free account.</p><p class="status-line" id="bDlStatus" role="status"></p><p class="status-line" id="bSaveStatus" role="status"></p>`
      + savedResumesHtml()
      + nextStepsHtml();
  }
};
// Goal: full-time, part-time or casual. It also decides whether Extras asks for hours per week.
function workTypeQ() {
  const cur = P().target.workTypes || [];
  return `<div class="q"><div class="q-label" id="bWorkL">What kind of work are you looking for? <span class="opt">(pick any that suit)</span></div><p class="q-hint">Part-time and casual roles ask for the hours you can work, so we add that question below. Full-time doesn't need it.</p>
    <div class="opt-chips" role="group" aria-labelledby="bWorkL">${WORK_TYPES.map(([k, l]) => `<button type="button" class="opt-chip" data-act="pick-work" data-val="${k}" aria-pressed="${cur.includes(k)}">${l}</button>`).join("")}</div></div>`;
}
const wantsHours = p => { const w = p.target.workTypes || []; return w.includes("part") || w.includes("casual") || !!val(p.availHours); };
function summaryActions() {
  const p = P(), a = builder.sumAlts;
  if (!val(p.summary)) return "";
  const alts = a ? `<div class="bl-alts">${a.busy ? `<p class="progress">${esc(a.busy)}</p>` : a.items.length ? `<span class="small muted">Pick a new wording${a.via ? ` (by ${viaWords(a.via)})` : ""}:</span>${a.items.map((t, k) => `<button type="button" class="bl-alt" data-act="sum-use" data-k="${k}">${esc(t)}</button>`).join("")}${a.msg ? `<span class="small muted">${esc(a.msg)}</span>` : ""}` : `<span class="small muted">${esc(a.msg || "No other wordings this time.")}</span>`}<button class="linkish" type="button" data-act="sum-close">Close</button></div>` : "";
  return `<div class="b-actions sum-acts"><button class="btn" type="button" data-act="sum-reword" aria-haspopup="dialog">Reword…</button></div>${alts}`;
}
const hasContent = e => !!(e.title || e.org || e.degree || e.inst || e.name || e.subject);
// Small badges on each card: finished (on the resume), a draft, or hidden from this resume
const cardState = e => `<span class="card-tags">${!hasContent(e) ? "" : `<span class="card-slot">${e.done ? '<span class="card-tag done">On your resume</span>' : '<span class="card-tag draft">Draft</span>'}</span><span class="card-slot">${e.hidden ? '<span class="card-tag off">Hidden</span>' : ""}</span>`}</span>`;
// Jobs at the same employer are shown together: one collapsible for the employer, with a full job card inside it for each title
// (the newest first). A job on its own is a card by itself, as before. Drafts count, so a new title joins its employer straight away.
function expGroups(p) {
  const byOrg = new Map();
  p.experience.forEach((e, i) => { const k = stackKey(e); if (k) byOrg.set(k, [...(byOrg.get(k) || []), i]); });
  const seen = new Set(), out = [];
  p.experience.forEach((e, i) => {
    if (seen.has(i)) return;
    const k = stackKey(e), ids = k && byOrg.get(k).length > 1 ? byOrg.get(k) : [i];
    ids.forEach(j => seen.add(j));
    out.push({ key: ids.length > 1 ? k : "", ids });
  });
  return out;
}
const expGroupSig = p => expGroups(p).map(g => g.ids.join(".")).join("|");
// The box of questions that are only for the AI. It folds down to its heading and a faded glimpse of what is inside.
// key: what remembers whether it is open (a job number, or "sum"); folded: how it starts
function aiBoxOpen(key, what, title, tag, folded) {
  if (typeof aiGateOn !== "undefined" && aiGateOn) folded = true;   // no AI connected: always folded
  return `<div class="b-aiin${folded ? " is-folded" : ""}" data-ai-field="1" data-ai-what="${what}" data-fold="${key}"><div class="b-aiin-head"><span class="b-sub">${title}</span><span class="card-tag ai">${tag}</span><button type="button" class="b-aiin-tog" data-act="ai-fold" aria-expanded="${!folded}"><span class="b-aiin-tog-t">${folded ? "Show" : "Hide"}</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div><div class="b-aiin-body"${folded ? " inert" : ""}>`;
}
const aiBoxClose = "</div></div>";
function aiFold(box, want) {
  const open = want === undefined ? box.classList.contains("is-folded") : !!want;
  box.classList.toggle("is-folded", !open);
  const body = box.querySelector(":scope > .b-aiin-body"); if (body) body.inert = !open || box.classList.contains("ai-none");
  const t = box.querySelector(".b-aiin-tog"); if (t) { t.setAttribute("aria-expanded", String(open)); const s = t.querySelector(".b-aiin-tog-t"); if (s) s.textContent = open ? "Hide" : "Show"; }
  builder.foldOpen[box.dataset.fold] = open;
  if (open) box.querySelectorAll("textarea").forEach(autoGrow);
}
// With the employer folded away, each job at it is still listed under its name; pressing one opens the employer and that job
function coPeek(g, roles) {
  return `<span class="co-peek" role="group" aria-label="Jobs at ${esc(roles[0].org)}">${g.ids.map((i, k) => { const e = roles[k]; return `<button type="button" class="co-peek-job" data-act="open-role" data-i="${i}"><span class="co-peek-t">${esc(e.title || "New job")}</span><span class="co-peek-d">${esc(rangeOf(e))}</span></button>`; }).join("")}</span>`;
}
function expGroupHtml(g) {
  const p = P(), roles = g.ids.map(i => p.experience[i]), first = roles[0], last = roles[roles.length - 1];
  const open = builder.openCo.has(g.key) || g.ids.some(i => builder.open.experience.has(i));
  const drafts = roles.filter(e => e.done === false || !e.done).length;
  return `<details class="b-card b-co" data-group="${esc(g.key)}" data-ids="${g.ids.join(".")}"${open ? " open" : ""}><summary><span>${esc(first.org)}</span><span class="card-tags"><span class="card-slot"><span class="card-tag ${drafts ? "draft" : "done"}">${roles.length} roles${drafts ? `, ${drafts} not finished` : ""}</span></span></span><span class="meta">${esc(rangeOf({ start: last.start, end: first.end, current: first.current }))}</span>${coPeek(g, roles)}</summary><div class="b-card-body">
    <div class="q-grid b-co-fields">${q(`experience.${g.ids[0]}.org`, "Employer", { ph: "e.g. Brightwater Solar", suggest: "employers", cap: "title" })}${locQ(`experience.${g.ids[0]}.location`, "Location", { opt: true, nofill: true })}</div>
    <p class="q-hint">One employer, ${roles.length} titles, newest first. Each is a job of its own below, with its own dates, answers and bullet points. On your resume they sit under one company heading.</p>
    <div class="b-co-roles">${g.ids.map(i => expCard(p.experience[i], i, true)).join("")}</div>
    <div class="b-actions b-role-add"><button class="btn ghost" type="button" data-act="add-role" data-i="${g.ids[0]}">+ Add a promotion or new title at ${esc(shortOrg(first.org))}</button></div>
  </div></details>`;
}
function expCard(e, i, nested) {
  const open = builder.open.experience.has(i);
  const title = [e.title, e.org].filter(Boolean).join(" at ") || "New job";
  const base = `experience.${i}`;
  const genned = builder.genned.has(i) || !!builder.sugg[i];
  // once there are bullet points, the questions fold away so the bullets are easy to read; click to open them again
  const hasBullets = e.bullets.some(b => b.trim()), foldOpen = !!builder.foldOpen[i];   // folded once there are bullet points, until you open it
  return `<details class="b-card${nested ? " b-role" : ""}${e.done ? " done" : ""}${e.hidden ? " is-hidden" : ""}" data-card="experience" data-i="${i}" data-flip="${flipId(e)}"${open ? " open" : ""}><summary>${dragH("experience", i)}<span>${esc(title)}</span>${cardState(e)}<span class="meta">${esc(rangeOf(e))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".title", "Job title", { ph: "e.g. Engineering Intern", suggest: "titles", cap: "jobtitle" })}${nested ? "" : q(base + ".org", "Employer", { ph: "e.g. Brightwater Solar", suggest: "employers", cap: "title" })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { ph: datePh("Feb 2023"), date: true })}${e.current ? presentBox() : q(base + ".end", "Finished", { ph: datePh("Nov 2024"), date: true })}${endCheck(base + ".current", "I work here now")}</div>
    ${nested ? "" : locQ(base + ".location", "Location", { opt: true, nofill: true })}
    ${aiBoxOpen(i, "turn your answers into bullet points", "Tell us about this job", "AI: Info to create bullet points", hasBullets && !foldOpen)}<p class="q-hint">Answer in plain words. The AI uses these to write your bullet points below, and they never appear on the resume themselves.</p>
    ${q(base + ".answers.duties", "What were your main responsibilities?", { area: true, rows: 2, ph: "e.g. Served customers, ran the register, opened and closed the store", after: `<p class="q-hint" data-vague="${i}">${esc(vagueNote(e))}</p>` })}
    ${q(base + ".answers.wins", "What did you achieve, improve or get recognised for?", { area: true, rows: 3, hint: "Numbers help a lot: how many customers, how much money, how much time saved, how many people trained.", ph: "e.g. Trained 5 new staff. Cut weekly stock-count time from 4 hours to 2 by reorganising the storeroom." })}
    <div class="q-grid">${q(base + ".answers.tools", "Which tools, software or equipment did you use?", { area: true, rows: 2, ph: "e.g. Excel, SolidWorks, POS system, forklift" })}${q(base + ".answers.people", "Who did you work with or for?", { area: true, rows: 2, ph: "e.g. A team of 6; senior engineers; up to 200 customers a day" })}</div>
    <div class="b-actions b-aiin-foot"><button class="btn primary" type="button" data-act="ai-bullets" data-i="${i}" data-mode="${genned ? "more" : "new"}">Turn into bullet points</button>${genned ? '<span class="small muted">Press it again to add more bullet points below.</span>' : ""}</div>
    ${aiBoxClose}
    <div class="b-sub">Bullet points <span class="card-tag done">This is what your resume shows, word for word</span>${hinfoHtml("One achievement or task per box: start with an action word and say what changed.", "Bullets are what recruiters actually read, and these are the exact words that appear on your resume.")}</div>
    <p class="q-hint">Three to six for recent jobs, most important first. Follow this formula: action verb + what you did + the result, with a number where possible.</p>
    <div class="bl-list">${e.bullets.map((b, j) => bulletRow(`${base}.bullets.${j}`, b, i, j, e.current)).join("")}</div>
    <div class="b-actions"><button class="btn" type="button" data-act="add-bullet" data-i="${i}" title="Writes one more bullet point from your answers that doesn't repeat the others">+ Add a bullet point</button>${genned ? `<button class="btn ghost" type="button" data-act="redo-ask" data-i="${i}" aria-expanded="${builder.redoAsk === i}">Try again…</button>` : ""}</div>
    ${verbsHelp(i)}
    <div class="b-sugg" id="bSugg${i}">${suggHtml(i)}</div>
    ${e.org && !nested ? `<div class="b-actions b-role-add"><button class="btn ghost" type="button" data-act="add-role" data-i="${i}">+ Add a promotion or new title at ${esc(shortOrg(e.org))}</button></div>` : ""}
    ${cardFoot("experience", i, e, nested)}
  </div></details>${finNoteHtml("experience", i)}`;
}
const NOUN = { experience: "job", education: "qualification", projects: "project", volunteering: "role", referees: "referee" };
const FIN_HINT = {
  projects: "Finish tidies your notes into clear resume lines (each a full sentence that starts with an action word, with no “I” or “my”) and adds the project to your resume.",
  volunteering: "Finish tidies the spelling of your lines, starts each with an action word and drops “I” and “my”, and adds the role to your resume.",
  referees: "Finish tidies the phone number and email and adds them to your resume."
};
// A button with a hover (and keyboard focus) explanation: the words sit in a small box above it, and are read out as its description
let tipSeq = 0;
function tipBtn(label, tip, attrs, cls = "btn ghost") {
  const id = "tip" + (++tipSeq);
  return `<span class="tip-wrap"><button class="${cls}" type="button" aria-describedby="${id}" ${attrs}>${label}</button><span class="tip-box" role="tooltip" id="${id}">${esc(tip)}</span></span>`;
}
// Each button under a card says what it does when you hover over it
function cardTips(list, e, nested) {
  const noun = NOUN[list], org = e.org ? shortOrg(e.org) : "";
  return {
    del: `Delete this ${noun} from your resume and profile for good. You will be asked to press it a second time to be sure.`,
    hide: e.hidden ? `Show this ${noun} on this resume again.` : `Hide this ${noun} from this resume. It stays saved in your profile, and Show brings it back.`,
    split: `Take this job out of the stack under ${org || "its employer"}. It then gets its own company heading on your resume, and the other jobs there stay stacked together.`,
    stack: `Put this job back in the stack under ${org || "its employer"}, with your other jobs there, under one company heading.`,
    finish: list === "experience" ? "Checks this job has a title, employer and start date, then adds it to your resume. Bullet points are a good idea but not required. Only finished jobs show in the preview and downloads."
      : list === "education" ? "Checks this qualification has a level or subject, a place of study and dates, then adds it to your resume. Only finished qualifications show in the preview and downloads."
      : list === "referees" ? "Tidies the phone number and email, then adds this referee to your resume."
      : `Tidies your notes and adds this ${noun} to your resume. Only finished ${noun}s show in the preview and downloads.`
  };
}
function cardFoot(list, i, e, nested) {
  const t = cardTips(list, e, nested), at = `data-list="${list}" data-i="${i}"`;
  // a job that was split away from its employer's stack can be stacked again if other jobs there are stacked
  const canStack = list === "experience" && !!e.grp && P().experience.some((x, k) => k !== i && orgKey(x.org) === orgKey(e.org) && !x.grp);
  return `${e.done || !FIN_HINT[list] ? "" : `<p class="q-hint fin-hint">${FIN_HINT[list]}</p>`}${list === "referees" || !e.hidden ? "" : `<p class="q-hint hide-why">Hidden: it stays saved in your profile but is left off this resume. Press Show to bring it back.</p>`}<p class="status-line" id="bFin-${list}-${i}" role="status"></p>
    <div class="b-card-foot">${tipBtn("Delete", t.del, `data-act="del" ${at}`)}${list === "referees" ? "" : tipBtn(e.hidden ? "Show" : "Hide", t.hide, `data-act="hide" ${at} aria-pressed="${!!e.hidden}"`)}${list === "experience" && nested ? tipBtn("Split", t.split, `data-act="split" ${at}`) : ""}${canStack ? tipBtn("Stack", t.stack, `data-act="unsplit" ${at}`) : ""}
    <span class="foot-gap"></span>${tipBtn(e.done ? "Finish" : `Finish this ${NOUN[list]}`, t.finish, `data-act="finish" ${at}`, "btn primary")}</div>`;
}
function bulletRow(path, text, i, j, current) {
  const alts = builder.alts[`${i}.${j}`], ask = builder.fixAsk === `${i}.${j}`;
  return `<div class="bl-item" data-i="${i}" data-j="${j}" data-flip="b${i}:${flipText(i, text)}"><span class="drag-h bl-grip" draggable="true" data-bdrag="1" data-i="${i}" data-j="${j}" title="Drag to move this bullet point" aria-label="Drag to move bullet point ${j + 1}">${GRIP_SVG}</span><textarea data-path="${path}" data-bullet="1" data-current="${current ? 1 : 0}" rows="2" spellcheck="true" data-prose="1" aria-label="Bullet point ${j + 1}">${esc(text)}</textarea><button type="button" class="chip-x" data-act="del-bullet" data-i="${i}" data-j="${j}" aria-label="Remove bullet point ${j + 1}">×</button>
    <div class="coach" data-coach="${path}">${coachHtml(text, current, i, j)}</div>
    ${ask ? `<div class="bl-ask"><div class="bl-ask-head"><label class="small" for="bAsk${i}_${j}">What's the number? For example how many, how much, or how often.</label><button class="linkish" type="button" data-act="close-ask" data-i="${i}" data-j="${j}">Close</button></div><div class="seg-in"><input type="text" id="bAsk${i}_${j}" data-ask="${i}.${j}" placeholder="e.g. about 120 customers a day"><button class="btn" type="button" data-act="fix-number" data-i="${i}" data-j="${j}">Add it</button></div></div>` : ""}
    ${alts ? `<div class="bl-alts">${alts.busy ? `<p class="progress">${esc(alts.busy)}</p>` : alts.items.length ? `<span class="small muted">${esc(alts.head || "Pick a new wording")}${alts.via ? ` (by ${viaWords(alts.via)})` : ""}:</span>${alts.items.map((t, k) => `<button type="button" class="bl-alt" data-act="use-alt" data-i="${i}" data-j="${j}" data-k="${k}">${esc(t)}</button>`).join("")}${alts.msg ? `<span class="small muted">${esc(alts.msg)}</span>` : ""}` : `<span class="small muted">${esc(alts.msg || "No other wordings this time.")}</span>`}<button class="linkish" type="button" data-act="close-alts" data-i="${i}" data-j="${j}">Close</button></div>` : ""}
  </div>`;
}
function eduCard(e, i) {
  const open = builder.open.education.has(i);
  const base = `education.${i}`, lv = qualLevel(e.level);
  const levels = [["", "Choose the level…"], ...QUAL_LEVELS.map(x => [x.k, x.label])];
  return `<details class="b-card${e.done ? " done" : ""}${e.hidden ? " is-hidden" : ""}" data-card="education" data-i="${i}" data-flip="${flipId(e)}"${open ? " open" : ""}><summary>${dragH("education", i)}<span>${esc([e.degree, e.inst].filter(Boolean).join(", ") || "New qualification")}</span>${cardState(e)}<span class="meta">${esc(rangeOf(e, true))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".level", "Level", { select: levels, rerender: true })}${q(base + ".subject", lv && lv.school ? "Certificate" : lv && (lv.k === "other" || lv.k === "short") ? "Name of the qualification" : "Subject or field", { ph: (lv && lv.ph) || "e.g. Engineering (Mechanical), Commerce or Hospitality", suggest: "subject", cap: "title", opt: !!(lv && lv.school) })}${detailQ(e, base, i)}
      ${e.double ? q(base + ".level2", "Second degree: level", { select: levels, rerender: true }) + q(base + ".subject2", qualLevel(e.level2) && qualLevel(e.level2).school ? "Certificate" : "Second degree: subject or field", { ph: (qualLevel(e.level2) && qualLevel(e.level2).ph) || "e.g. Commerce or Laws", suggest: "subject", cap: "title" }) : ""}
      <div class="q wide q-solo"><div class="q-body"><label class="q-check"><input type="checkbox" data-path="${base}.double" data-rerender="1"${e.double ? " checked" : ""}> This is a double degree (two qualifications studied together)</label></div></div>
      <div class="q wide q-merged"><label class="q-label" for="${fid(base)}_title">Education title <span class="card-tag done">This shows on your resume</span></label><div class="q-body"><input type="text" id="${fid(base)}_title" data-path="${base}.degree" data-degree-title="${i}" data-cap="title" value="${esc(e.degree || "")}" placeholder="Choose a level and type the subject, or write your own" autocomplete="off"><p class="q-hint">Filled in from the level and subject. Change the words if you like, for example to match how your certificate reads. ${e.degreeCustom ? `<button class="linkish" type="button" data-act="degree-auto" data-i="${i}">Fill it in from the level and subject again</button>` : ""}</p></div></div>
      ${q(base + ".inst", lv && lv.school ? "School" : "University, TAFE or school", { ph: lv && lv.school ? "Start typing your school's name" : "e.g. Queensland University of Technology", suggest: "inst", cap: "title", hint: lv && lv.school && !SCHOOLS_LOADED() ? "Type your school's full name." : "" })}${locQ(base + ".location", "Location", { opt: true, nofill: true })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { ph: datePh("Feb 2022"), date: true })}${q(base + ".end", e.current ? "Expected to finish" : "Finished", { ph: datePh("Nov 2025"), date: true })}${endCheck(base + ".current", "I'm still studying")}</div>
    ${builder.autoStudy === base + ".end" && e.current ? `<p class="b-check ok" role="status">That's after today, so “I'm still studying” is ticked${studyStage(e) && studyStage(e).label ? ` and you'll be described as ${aOrAn(studyStage(e).label)} ${studyStage(e).label} student` : ""}.</p>` : ""}
    <div class="q-grid">${gradeQ(e, base)}</div>
    <div class="b-sub b-edu-hl">Academic highlights</div>
    ${awardsQ(e, i)}
    ${subjectsQ(e, i)}
    ${projectQ(e, base)}
    ${cardFoot("education", i, e)}
  </div></details>${finNoteHtml("education", i)}`;
}
function projCard(x, i) {
  const base = `projects.${i}`;
  return `<details class="b-card${x.done ? " done" : ""}${x.hidden ? " is-hidden" : ""}" data-card="projects" data-i="${i}" data-flip="${flipId(x)}"${builder.open.projects.has(i) ? " open" : ""}><summary>${dragH("projects", i)}<span>${esc(x.name || "New project")}</span>${cardState(x)}<span class="meta">${esc(rangeOf(x))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".name", "Project name", { ph: "e.g. Solar-powered irrigation controller", cap: "title" })}${q(base + ".org", "For or with", { opt: true, ph: "e.g. RMIT capstone, team of 4" })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { opt: true, ph: datePh("Mar 2024"), date: true })}${x.current ? presentBox() : q(base + ".end", "Finished", { opt: true, ph: datePh("Jun 2024"), date: true })}${endCheck(base + ".current", "It's ongoing")}</div>
    ${q(base + ".details", "What did you do, and what came of it? One point per line.", { area: true, rows: 3, multi: true, after: `<div class="x-wrap" data-xr="projects.${i}">${extraRewordHtml("projects", i)}</div>` })}
    ${cardFoot("projects", i, x)}</div></details>${finNoteHtml("projects", i)}`;
}
function volCard(e, i) {
  const base = `volunteering.${i}`;
  return `<details class="b-card${e.done ? " done" : ""}${e.hidden ? " is-hidden" : ""}" data-card="volunteering" data-i="${i}" data-flip="${flipId(e)}"${builder.open.volunteering.has(i) ? " open" : ""}><summary>${dragH("volunteering", i)}<span>${esc([e.title, e.org].filter(Boolean).join(" at ") || "New role")}</span>${cardState(e)}<span class="meta">${esc(rangeOf(e))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".title", "Role", { ph: "e.g. Volunteer Coach", cap: "jobtitle", suggest: "titles" })}${q(base + ".org", "Organisation", { ph: "e.g. Northside Junior Football Club", cap: "title", suggest: "employers" })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { opt: true, ph: datePh("2022"), date: true })}${e.current ? presentBox() : q(base + ".end", "Finished", { opt: true, ph: datePh("2024"), date: true })}${endCheck(base + ".current", "I still do this")}</div>
    ${q(base + ".bullets", "What did you do? One point per line.", { area: true, rows: 3, lines: true, after: `<div class="x-wrap" data-xr="volunteering.${i}">${extraRewordHtml("volunteering", i)}</div>` })}
    ${cardFoot("volunteering", i, e)}</div></details>${finNoteHtml("volunteering", i)}`;
}
// Referees: one at a time
function refereesBlock() {
  const r = P().referees;
  const radio = (v, label) => `<label class="q-check"><input type="radio" name="refmode" data-path="referees.mode" value="${v}" data-rerender="1"${r.mode === v ? " checked" : ""}> ${label}</label>`;
  let html = `<div class="b-actions">${radio("request", "“Available on request”")}${radio("list", "List my referees")}</div>`;
  if (r.mode === "list") {
    if (!r.list.length) r.list.push(emptyRef());
    html += r.list.map((x, i) => refCard(x, i)).join("") + (r.list.length < 5 ? `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="referees">+ Add another referee</button></div>` : "");
  }
  return html + `<p class="q-hint">Always ask your referees first, and let them know which jobs you've applied for. Two is usual.</p>`;
}
function refCard(x, i) {
  const base = `referees.list.${i}`, open = builder.open.referees.has(i) || (!x.done && !x.name);
  return `<details class="b-card${x.done ? " done" : ""}" data-card="referees" data-i="${i}" data-flip="${flipId(x)}"${open ? " open" : ""}><summary>${dragH("referees", i)}<span>${esc(x.name ? [x.name, x.role].filter(Boolean).join(", ") : `Referee ${i + 1}`)}</span>${cardState(x)}</summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".name", "Name", { cap: "name", ph: "e.g. Priya Shah", nofill: true })}${q(base + ".role", "Their role", { cap: "jobtitle", suggest: "titles", ph: "e.g. Store Manager", nofill: true })}${q(base + ".org", "Organisation", { cap: "title", suggest: "employers", nofill: true })}${phoneQ({ path: base + ".phone", label: "Phone" })}${q(base + ".email", "Email", { inputmode: "email", wide: true, nofill: true })}</div>
    ${cardFoot("referees", i, x)}</div></details>${finNoteHtml("referees", i)}`;
}
// Awards, publications and interests: Polish and Finish under the box
function textFoot(key) {
  const done = P().extrasDone[key];
  return `<p class="status-line" id="bFin-text-${key}" role="status"></p><div class="b-card-foot"><span class="foot-gap"></span><button class="btn primary" type="button" data-act="finish-text" data-key="${key}">${done ? "Finish" : "Finish this section"}</button></div>`;
}
const CHIP_LABELS = {
  software: ["Software and tools", "Programs, systems and equipment, like Excel, Xero, AutoCAD or a forklift.", "Type a tool or program, then press Enter"],
  certs: ["Licences and certificates", "White Card, RSA, First Aid, Working with Children Check… Your driver's licence from the Contact step is added here for you.", "Type a licence or certificate, then press Enter"],
  hard: ["Technical and job skills", "Things you can do, like “Financial reporting”, “Food safety” or “Engineering drawings”.", "Type a skill, then press Enter"],
  languages: ["Languages", "Include your level, like “Mandarin (fluent)”.", "Type a language, e.g. Vietnamese (conversational)"],
  soft: ["Strengths", "Pick up to 12. Every one you pick shows on your resume, and your bullet points should back them up.", "Type a strength, e.g. Communication"]
};
function chipEditor(key, label, hint, ph) {
  const items = P().skills[key], id = "chin_" + key;
  return `<section class="q skill-card" data-chips="${key}"><header class="skill-head"><h3 class="q-label" id="chl_${key}">${label}</h3><span class="skill-count" data-skill-count="${key}">${items.length ? `${items.length} added` : "none yet"}</span></header>${hint ? `<p class="q-hint">${hint}</p>` : ""}
    <div class="chip-edit pick sugg">${items.map((s, i) => `<span class="echip">${esc(s)}<button type="button" class="chip-x" data-act="chip-del" data-key="${key}" data-i="${i}" aria-label="Remove ${esc(s)}">×</button></span>`).join("")}<input type="text" id="${id}" class="chip-in" data-chip-in="${key}" data-suggest="chip-${key}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-sl" placeholder="${esc(ph)}" aria-labelledby="chl_${key}" autocomplete="off"><ul class="pick-list" id="${id}-sl" role="listbox" aria-label="${esc(label)} suggestions" hidden></ul></div>
    <div class="sugg-row sugg-found" data-found="${key}">${skillSuggestions(key, "found")}</div>
    <details class="skill-ideas"><summary>Ideas to pick from</summary><div class="sugg-row" data-sugg="${key}">${skillSuggestions(key)}</div></details></section>`;
}
function skillSuggestions(key, part) {
  const p = P(), have = new Set(Object.values(p.skills).flat().map(s => s.toLowerCase()));
  const text = [...p.experience.flatMap(e => [e.title, ...Object.values(e.answers), ...e.bullets]), ...p.education.flatMap(e => [e.degree, e.coursework, e.project]), ...p.projects.flatMap(x => [x.name, x.details]), p.summary].join("\n");
  const found = [...findSkills(norm(text)).values()].map(x => x.skill);
  const isTool = n => SOFTWARE.has(n) || PROGRAMMING.has(n);
  const jt = p.target.jobType, common = commonFor(COMMON_SKILLS, jt, COMMON_SKILLS.graduate);
  let fromYou = [], ideas = [], fromAd = [];
  const inAd = p.target.specific && val(p.target.ad) ? [...findSkills(norm(p.target.ad)).values()].map(x => x.skill) : [];
  if (key === "hard") { fromYou = found.filter(s => s.kind === "hard" && !isTool(s.name)).map(s => s.name); ideas = common.hard; fromAd = inAd.filter(s => s.kind === "hard" && !isTool(s.name)).map(s => s.name); }
  if (key === "software") {
    const canon = t => { const f = [...findSkills(norm(t)).values()][0]; return f ? f.skill.name : t; };
    fromYou = [...found.filter(s => isTool(s.name)).map(s => s.name), ...p.experience.flatMap(e => listOf(e.answers.tools)).filter(t => t.length < 30).map(canon)];
    ideas = common.software; fromAd = inAd.filter(s => isTool(s.name)).map(s => s.name);
  }
  if (key === "soft") { fromYou = found.filter(s => s.kind === "soft").map(s => s.name); ideas = COMMON_SOFT; fromAd = inAd.filter(s => s.kind === "soft").map(s => s.name); }
  if (key === "certs") { ideas = commonFor(COMMON_CERTS, jt, COMMON_CERTS.graduate); fromAd = licenceList().filter(l => p.target.specific && new RegExp("\\b" + l.split(" (")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(p.target.ad || "")); }
  const pages = +builder.moreSugg[key] || 0;
  const pick = (arr, n) => [...new Set(arr)].filter(s => !have.has(s.toLowerCase())).slice(0, n);
  // "Suggest more" starts with this kind of job's own ideas, then widens to everything we know for this box
  const wide = pages || ideas.length < 12 ? [...ideas, ...((SUGGEST_SRC["chip-" + key] || (() => []))())] : ideas;
  const a = pick(fromYou, 10), ad = pick(fromAd, 10).filter(s => !a.includes(s));
  // tools and skills that usually go with the ones already picked (or found in the answers) come before the general ideas
  const rel = (key === "software" || key === "hard") ? relatedIdeas(key, [...p.skills[key], ...(key === "software" ? p.skills.hard : []), ...fromYou], have).filter(s => !a.includes(s) && !ad.includes(s)) : [];
  const b = pick(pages ? wide : ideas, 12 + pages * 12).filter(s => !a.includes(s) && !ad.includes(s) && !rel.includes(s));
  const all = [...new Set(key === "soft" || key === "hard" || key === "software" || key === "certs" ? [...ideas, ...((SUGGEST_SRC["chip-" + key] || (() => []))())] : ideas)].filter(s => !have.has(s.toLowerCase()) && !a.includes(s) && !ad.includes(s)).length;
  const chip = s => `<button type="button" class="opt-chip" data-act="chip-sugg" data-key="${key}" data-val="${esc(s)}">${esc(s)}</button>`;
  // a small button on every section: more skills that are common for this kind of job
  const hideBtn = pages ? ` <button type="button" class="linkish sugg-hide" data-act="sugg-hide" data-key="${key}">hide</button>` : "";
  const moreBtn = all > b.length ? `<button type="button" class="btn sugg-more" data-act="sugg-more" data-key="${key}">Suggest more</button>${hideBtn}` : pages && b.length ? `<span class="small muted">That's every idea we have for this kind of job.</span>${hideBtn}` : "";
  const foundHtml = a.length ? `<span>Found in your answers:</span>${a.map(chip).join("")}` : "";
  if (part === "found") return foundHtml;
  return (ad.length ? `<span>Asked for in the ad, if you have it:</span>${ad.map(chip).join("")}` : "")
    + (rel.length ? `<span>Goes well with what you've picked:</span>${rel.map(chip).join("")}` : "")
    + (b.length ? `<span>${a.length || ad.length ? "Also common" : `Common for ${esc(lowerFirst(jobLabel(jt) || "this kind of job"))}`}, if you have it:</span>${b.map(chip).join("")}` : "")
    + moreBtn;
}
const verbsHelp = i => `<details class="verbs" data-verbs="${i}"><summary>Need an action word?</summary><p class="q-hint verbs-nai" hidden>No AI is connected, so pick a starting word from this list. Or <a href="#connect">connect an AI</a> to have it fixed for you.</p><p class="q-hint">Drag a word onto a bullet point to swap its first word, or click into a bullet point and then click a word.</p><div class="verb-groups">${VERB_GROUPS.map(([head, words]) => `<div><h4>${head}</h4><div class="opt-chips">${words.map(v => `<button type="button" class="opt-chip" draggable="true" data-act="verb" data-val="${v}" data-verb-drag="${v}">${v}</button>`).join("")}</div></div>`).join("")}</div></details>`;

/* --- Bullet coach: quick checks as you type --- */
const VERB_WORDS = new Set([...ACTION_VERBS.map(v => v.toLowerCase()), ...VERB_GROUPS.flatMap(g => g[1].map(v => v.toLowerCase())), "cut", "won", "grew", "sold", "taught", "ran", "led", "built", "wrote", "drew", "kept", "made", "set", "met", "took", "gave", "found", "brought", "bought", "held", "dealt", "spoke", "sent", "spent", "oversaw", "did", "got", "showed", "chose", "fed", "lent"]);
// Present-tense action words too, for a current job ("Coordinate", "Process", "Provide"): worked out the first time they're needed
const MORE_VERBS = "provide provides process processes respond assess greet answer schedule book prepare clean stock restock count cook drive load unload pack pick sort record update track ensure maintain resolve advise assist support coach guide educate care administer deliver run oversee lead handle operate use apply identify collaborate contribute facilitate promote draft edit review audit reconcile calculate forecast design develop build code configure deploy troubleshoot repair fix install inspect test measure survey plan organise organize coordinate manage supervise train mentor recruit onboard negotiate sell secure win grow increase reduce cut save streamline improve launch create produce write present report monitor analyse analyze research serve welcome open close lift mix bake brew liaise communicate implement complete conduct perform execute lodge file issue verify check source purchase order invoice quote".split(" ");
let presentSet = null;
const presentVerbs = () => presentSet || (presentSet = new Set([...ACTION_VERBS.map(v => toPresentStart(v).toLowerCase()), ...MORE_VERBS]));
const isActionStart = t => { const w = (String(t).match(/^[A-Za-z]+/) || [""])[0].toLowerCase(); return ACTION_START.test(t) || /^[A-Z][a-z]+(ed|ised|ized)\b/.test(t) || VERB_WORDS.has(w) || !!IRREG[w] || Object.values(IRREG).includes(w) || BASE_VERBS.test(w) || presentVerbs().has(w) || presentVerbs().has(w.replace(/e?s$/, "")); };
const WEAK_START = /^(responsible for|duties (included|were)|tasks included|helped( to)?|assisted( with)?|worked on|in charge of)\b/i;
// Each note: [kind, message, issue key for the Fix button]
// A figure of any kind counts as a number: 5, 12%, $2m, 10k, 5x, 24/7, "three" or "a dozen". A year on its own does not.
const NUM_WORDS = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|dozens?|hundreds?|thousands?|millions?|billions?|half|quarter|double[ds]?|tripled?|twice|per ?cent|percent|daily|weekly|fortnightly|monthly|hourly)\b/i;
const hasFigure = t => /\d/.test(String(t).replace(/\b(19|20)\d{2}\b/g, " ")) || NUM_WORDS.test(t);
function coachNotes(text, current) {
  const t = String(text || "").trim();
  if (!t) return [];
  const w = wordCount(t), notes = [];
  const verb = isActionStart(t) && !WEAK_START.test(t);
  notes.push(verb ? ["ok", "Action word"] : ["warn", WEAK_START.test(t) ? "Say what you did, not what you were responsible for" : "Start with an action word", "verb"]);
  notes.push(hasFigure(t) ? ["ok", "Has a number"] : ["idea", "Add a number if you can", "number"]);
  if (w > 32) notes.push(["warn", `Shorten it (${w} words)`, "long"]);
  else if (w < 9) notes.push(["warn", "Add more detail: how, with what, and the result", "short"]);
  if (/\b(I|my|me)\b/.test(t)) notes.push(["warn", "Drop “I” and “my”", "first"]);
  if (current === false && /^(manage|lead|run|build|serve|train|handle|coordinate|plan|create|develop|achieve|solve|navigate|operate|support|process|assist|help|work|use|deliver|prepare|monitor|maintain|design|analyse|analyze|write|sell)s?\b/i.test(t)) notes.push(["warn", "Past job: use past tense", "tense"]);
  if (current === true && /^[A-Z][a-z]+ed\b/.test(t) && !/^(Led|Need|Speed|Feed|Seed)\b/.test(t)) notes.push(["idea", "Current job: present tense reads better", "present"]);
  if (FILLER.test(t) || CLICHES.some(c => new RegExp("\\b" + c + "\\b", "i").test(t) && c !== "responsible for")) notes.push(["warn", "Cut the buzzwords", "buzz"]);
  return notes;
}
const coachHtml = (text, current, i, j) => {
  const notes = coachNotes(text, current);
  const fixable = i != null && notes.some(n => n[2]);
  return notes.map(([k, m, key]) => `<span class="${k}">${esc(m)}${i != null && key ? ` <button type="button" class="fix" data-act="fix-bullet" data-i="${i}" data-j="${j}" data-issue="${key}">${key === "number" ? "Add one" : "Fix"}</button>` : ""}</span>`).join("")
    + (i != null && String(text || "").trim() ? `<button type="button" class="linkish bl-reword" data-act="reword" data-i="${i}" data-j="${j}">Reword</button>` : "")
    + (fixable ? "" : "");
};

/* --- Health check for the Review step --- */
function resumeHealth(p) {
  const items = [];
  const add = (status, text, step) => items.push({ status, text, step });
  const c = p.contact;
  const missing = [["name", "your name"], ["phone", "a phone number"], ["email", "an email address"], ["location", "your suburb and state"]].filter(([k]) => !c[k].trim()).map(([, l]) => l);
  if (missing.length) add("fail", `Add ${listJoin(missing)}.`, SN("contact")); else add("pass", "Contact details are complete.");
  if (c.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim())) add("warn", "Your email address doesn't look right.", SN("contact"));
  if (c.phone && (c.phone.replace(/\D/g, "").length < 8 || c.phone.replace(/\D/g, "").length > 13)) add("warn", "Check your phone number.", SN("contact"));
  if (["none", "student"].includes(stageOf(p))) { /* the job title is only asked from early career up */ }
  else if (!p.target.title.trim()) add("warn", "Add the job title you're aiming for. It becomes your headline.", SN("goal")); else add("pass", "Headline matches the job you want.");
  const sw = wordCount(p.summary);
  // (the profile is optional: with none written there is nothing to warn about, and the resume has no Profile section)
  if (!sw) { /* optional */ }
  else if (sw < 25) add("warn", "Your profile is short. Aim for 40 to 75 words.", SN("summary"));
  else if (sw > 95) add("warn", `Your profile is ${sw} words. Trim it to under 80.`, SN("summary"));
  else if (CLICHES.some(x => new RegExp("\\b" + x + "\\b", "i").test(p.summary)) || FILLER.test(p.summary)) add("warn", "Your profile uses clichés. Replace them with specifics.", SN("summary"));
  else add("pass", "Profile is a good length.");
  const student = stageOf(p) === "student";
  const exps = finished(p.experience).filter(e => e.title || e.org);
  if (!exps.length) add(student ? "warn" : "fail", student ? "Add any work experience, even casual jobs. They show reliability." : "Add your work experience.", SN("experience"));
  const bullets = exps.flatMap(e => e.bullets.map(b => b.trim()).filter(Boolean));
  for (const e of exps) {
    const n = e.bullets.filter(b => b.trim()).length;
    if (!e.start && !e.end && !e.current) add("warn", `Add dates for ${e.title || e.org}.`, SN("experience"));
    if (n < 2) add("warn", `Add at least two bullet points for ${e.title || e.org}.`, SN("experience"));
  }
  if (bullets.length) {
    const verbs = bullets.filter(b => coachNotes(b)[0][0] === "ok").length;
    const nums = bullets.filter(b => coachNotes(b)[1][0] === "ok").length;
    if (verbs / bullets.length < 0.75) add("warn", `${bullets.length - verbs} bullet point${bullets.length - verbs === 1 ? " doesn't" : "s don't"} start with an action word.`, SN("experience")); else add("pass", "Bullet points start with action words.");
    if (nums / bullets.length < 0.3) add("warn", `Only ${nums} of ${bullets.length} bullet points include a number. Add sizes, amounts or results where you can.`, SN("experience")); else add("pass", `${nums} of ${bullets.length} bullet points include a number.`);
    // the same opening word again and again reads flat (a check Resume Worded and Rezi both make)
    const firsts = {};
    for (const b of bullets) { const w = (b.match(/^[A-Za-z]+/) || [""])[0].toLowerCase(); if (w) firsts[w] = (firsts[w] || 0) + 1; }
    const same = Object.entries(firsts).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
    if (same) add("warn", `${same[1]} bullet points start with “${cap1(same[0])}”. Vary your action words so each one stands out.`, SN("experience"));
    const long = bullets.filter(b => wordCount(b) > 32).length;
    if (long) add("warn", `${long} bullet point${long === 1 ? " is" : "s are"} over 32 words. Shorter ones are easier to skim.`, SN("experience"));
    if (bullets.some(b => /\b(I|my)\b/.test(b))) add("warn", "Drop “I” and “my” from bullet points.", SN("experience"));
  }
  const edu = finished(p.education).filter(e => e.degree || e.inst);
  if (!edu.length) add("warn", "Add your education.", SN("education"));
  else if (edu.some(e => !e.end && !e.start)) add("warn", "Add dates to your education.", SN("education"));
  else add("pass", "Education is listed with dates.");
  const skillN = p.skills.hard.length + p.skills.software.length;
  if (skillN < 5) add("warn", `List at least 5 skills and tools (you have ${skillN}). They're what applicant tracking systems match.`, SN("skills")); else add("pass", `${skillN} skills and tools listed.`);
  const dates = [...exps, ...edu].flatMap(e => [e.start, e.end]).filter(Boolean);
  if (dates.some(d => !dateOk(d))) add("warn", "Use one date style, like “Feb 2023”, so dates line up.", exps.some(e => !dateOk(e.start) || !dateOk(e.end)) ? SN("experience") : SN("education"));
  const pages = +($("bPaper") && $("bPaper").dataset.pages) || 1;
  if (pages > 2) add("warn", `It runs to ${pages} pages. Two is the most most recruiters will read.`, SN("experience"));
  else if (pages === 2 && student) add("warn", "It's two pages. One page is usually enough while you're a student.", SN("experience"));
  const fails = items.filter(i => i.status === "fail").length, warns = items.filter(i => i.status === "warn").length;
  return { items, score: Math.max(5, Math.min(100, 100 - fails * 14 - warns * 6)) };
}
// "done": everything in the step is complete. "draft": something is in it, but it isn't complete (or has entries still to finish). "": nothing yet.
function stepState(k, p) {
  const has = x => !!String(x == null ? "" : x).trim();
  const entriesState = (arr, complete) => {
    const real = arr.filter(e => hasContent(e));
    if (!real.length) return "";
    return real.every(e => e.done !== false) && real.some(e => complete(e)) ? "done" : "draft";
  };
  switch (k) {
    case "goal": return p.target.stage || has(p.target.title) || p.target.jobType ? "done" : "";   // picking any of the starter buttons is enough for the green tick
    case "layout": return p.cv.template ? "done" : "";
    case "contact": {
      const c = p.contact, need = [has(c.name) || (has(c.first) && has(c.last)), has(c.email), has(c.phone), has(c.location)];
      return need.every(Boolean) ? "done" : need.some(Boolean) || has(c.linkedin) || has(c.website) ? "draft" : "";
    }
    case "summary": return wordCount(p.summary) >= 20 ? "done" : has(p.summary) || Object.values(p.summaryQ || {}).some(has) ? "draft" : "";
    case "experience": return entriesState(p.experience, e => e.title || e.org);
    case "education": return entriesState(p.education, e => e.degree || e.inst);
    case "skills": { const n = p.skills.hard.length + p.skills.software.length; return n >= 3 ? "done" : n || p.skills.certs.length || p.skills.soft.length ? "draft" : ""; }
    case "extras": return draftsIn(p, "extras").length ? "draft" : builder.visited.has(SN("extras")) ? "done" : "";
    default: return "";
  }
}

/* --- Rendering --- */
function renderSteps() {
  const p = P();
  // Step 0 is ticked green once the person has moved on from the opening page (uploaded, used their profile, or started from scratch)
  const upDone = !builder.welcome;
  const up = `<li class="${builder.welcome ? "current" : "done"}"><button type="button" data-act="goto-upload"${builder.welcome ? ' aria-current="step"' : ""} title="${upDone ? "Complete. " : ""}Bring in your resume or LinkedIn, or start from scratch"><span class="n">0</span><span class="t">Upload</span>${upDone ? '<span class="visually-hidden"> (complete)</span>' : ""}</button></li>`;
  $("bSteps").innerHTML = up + B_STEPS.map((s, i) => { const state = stepState(s.key, p); return `<li class="${state}${i === builder.step && !builder.welcome ? " current" : ""}"><button type="button" data-act="goto" data-step="${i}"${i === builder.step && !builder.welcome ? ' aria-current="step"' : ""}${state ? ` title="${state === "done" ? "Complete" : "Started, not finished yet"}"` : ""}><span class="n">${i + 1}</span><span class="t">${s.label}</span>${state ? `<span class="visually-hidden">${state === "done" ? " (complete)" : " (draft)"}</span>` : ""}</button></li>`; }).join("");
}
function renderBuilder(focus) {
  const f = $("bForm");
  if (!f) return;
  const wasWelcome = !!($("bWelcome") && !$("bWelcome").hidden);
  applyWelcome();
  if (builder.welcome) { renderSteps(); return; }
  { const st = $("bImportStatus"); if (st) st.jfBase = null; } bClearFileCards(FILE_SETS.builder);   // (on to the questions: the opening page starts clean next time)
  const k = B_STEPS[builder.step].key;
  builder.visited.add(builder.step);
  const y = window.scrollY;
  const pend = builder.pendingGoto;
  const flipFrom = builder.animate ? flipCapture() : null;
  builder.animate = false;
  f.innerHTML = STEP_RENDER[k]() + (pend && !pend.count ? `<div class="b-pending ok" role="status"><p>${esc(pend.msg)}</p><div class="b-actions"><button class="btn primary" type="button" data-act="goto" data-step="${pend.step}" data-force="1">Continue to ${B_STEPS[pend.step].label} →</button></div></div>` : pend ? `<div class="b-pending" role="alert"><p>${esc(pend.msg)}</p><div class="b-actions"><button class="btn primary" type="button" data-act="finish-all">Finish ${pend.count > 1 ? "them" : "it"} and continue</button><button class="btn" type="button" data-act="goto" data-step="${pend.step}" data-force="1">Continue without ${pend.count > 1 ? "them" : "it"}</button></div></div>` : "")
    + `<div class="b-nav">${builder.step > 0 ? `<button class="btn" type="button" data-act="goto" data-step="${builder.step - 1}">← ${B_STEPS[builder.step - 1].label}</button>` : `<button class="btn" type="button" data-back-start="1">← Back to start</button>`}${builder.step < B_STEPS.length - 1 ? `<button class="btn primary" type="button" data-act="goto" data-step="${builder.step + 1}">Next: ${B_STEPS[builder.step + 1].label} →</button>` : ""}</div>`;
  renderSteps();
  updateChecks();
  renderPreview();
  f.querySelectorAll("textarea").forEach(autoGrow);   // every text box grows to the size of its text
  if (k === "layout" || k === "review") fitThumbs();
  if (focus) { const h = $("bStepTitle"); if (h) h.focus({ preventScroll: true }); smoothTo(stepsBar() || f, 8); }   // a new step starts with the steps bar at the top
  else if (wasWelcome) window.scrollTo(0, 0);
  else if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);   // re-rendering never moves the page
  if (flipFrom) flipPlay(flipFrom);
}
const stepsBar = () => document.querySelector("#view-builder .b-steps");
// The notice under the cards after trying to move on with unfinished entries: what it says, and bringing it up to date as they are finished
function draftsMsg(drafts) {
  const d0 = drafts[0].e, nm = d0.title || d0.degree || d0.name || d0.org || d0.inst;
  return `${drafts.length === 1 ? `“${nm}” isn't` : `${drafts.length} entries aren't`} finished yet, so ${drafts.length === 1 ? "it's" : "they're"} not on your resume.`;
}
function syncPending() {
  const pend = builder.pendingGoto;
  if (!pend) return;
  const drafts = draftsIn(P(), B_STEPS[builder.step].key);
  pend.count = drafts.length;
  pend.msg = drafts.length ? draftsMsg(drafts) : "Everything on this step is finished now, so it's all on your resume.";
}
// Text boxes grow to fit what's in them, so nothing is hidden
function autoGrow(t) { if (!t || !t.isConnected) return; t.style.height = "auto"; t.style.height = Math.max(t.scrollHeight + 2, 44) + "px"; }
// Scroll so an element sits just under the top bar, gently
// How much of the top of the screen the page's own bar covers (the menu across the top on wide screens, the thin bar on a phone)
function topBarH() {
  const wide = window.matchMedia && window.matchMedia("(min-width: 900px)").matches, el = wide ? document.querySelector(".sidenav") : $("appbar");
  return el && getComputedStyle(el).display !== "none" ? el.offsetHeight : 0;
}
function smoothTo(el, extra = 12) {
  if (!el) return;
  const bar = topBarH();
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - bar - extra), behavior: reduceMotion() ? "auto" : "smooth" });
}
// Scroll so the bottom of a box sits at the bottom of the screen (its top stays in view if the box is taller than the screen)
function smoothToBottom(el, extra = 16) {
  if (!el) return;
  const bar = topBarH(), r = el.getBoundingClientRect();
  const toBottom = r.bottom + window.scrollY - window.innerHeight + extra, toTop = r.top + window.scrollY - bar - extra;
  window.scrollTo({ top: Math.max(0, Math.min(toBottom, toTop)), behavior: reduceMotion() ? "auto" : "smooth" });
}
let previewTimer = null;
function builderTpl() { const k = P().cv.template; return CV_TEMPLATES.some(t => t.key === k) ? tplByKey(k) : ((rankTemplates()[0] || {}).t || tplByKey("professional")); }
function builderAccent(t) { const c = P().cv; return c.template === t.key && t.accents.includes(c.accent) ? c.accent : t.accent; }
// The designs that match the filters, best first, a dozen at a time (the chosen one always shows)
function layoutMatches() { const sel = P().cv.template; return rankTemplates().filter(({ t }) => tplMatches(t, builder.tplFilter) || t.key === sel); }
function layoutCards() {
  const sel = P().cv.template, data = P(), ranked = rankTemplates();   // the person's own details, and grey guidance in each part they haven't done yet (never made-up details)
  const best = ranked.filter(r => r.rec).slice(0, 3).map(r => r.t.key);
  const list = layoutMatches();
  const showing = list.slice(0, builder.tplShow);
  if (sel && !showing.some(r => r.t.key === sel)) { const s = list.find(r => r.t.key === sel); if (s) showing.unshift(s); }
  return showing.map(({ t }) => `<button type="button" class="tpl-card" data-act="tpl" data-tpl="${t.key}" aria-pressed="${sel === t.key}" aria-label="${esc(t.name)}. ${esc(t.goodFor)}"><span class="tpl-thumb"><div>${cvHtml(cvModel(data, t, { guide: true }), t, { accent: sel === t.key ? builderAccent(t) : t.accent })}</div></span><span class="tpl-name">${esc(t.name)}</span>${best.includes(t.key) || t.ats ? `<span class="tpl-badges">${best.includes(t.key) ? '<span class="tpl-badge">Best match</span>' : ""}${t.ats ? '<span class="tpl-badge ats">ATS-friendly</span>' : ""}</span>` : ""}</button>`).join("") || `<p class="small muted">No design matches all of those. Untick one of the filters.</p>`;
}
function layoutMore() {
  const n = layoutMatches().length, left = n - builder.tplShow;
  return left > 0 ? `<div class="b-actions"><button class="btn" type="button" data-act="tpl-more">Show ${Math.min(12, left)} more designs</button><span class="small muted">${n} ${n === 1 ? "match" : "matches"}</span></div>` : "";
}
// keepPaper: update the counts and the score but leave the page as it is, because someone is typing on it (see 20h-builder-preview-edit.js)
function renderPreview(keepPaper) {
  const frame = $("bPaper");
  if (!frame || currentView !== "builder") return;
  const p = P(), base = builderTpl(), tpl = tplWithPrefs(base);
  // What you've done shows as it is. Every part you haven't finished yet shows grey guidance on what to put there (never made-up details),
  // and stays that way until that part is complete. The summary is optional: with none written, there is no Profile section.
  const model = cvModel(p, tpl, { guide: true });
  const guided = model.guided || [], example = guided.length > 0;
  let pages = builder.pages || 1;
  if (!keepPaper) {
    pages = mountPaper(frame, cvHtml(model, tpl, { accent: builderAccent(base) }));
    builder.pages = pages;
    paperHighlight();
    bpEditor.example = false;   // typing on the preview is for your own words: the grey guidance is locked (see bpEditor.locked)
    paperEditable(frame, bpEditor);
  } else if (+frame.dataset.pages) pages = builder.pages = +frame.dataset.pages;
  const drafts = draftsIn(p).length, hidden = ["experience", "education", "projects", "volunteering"].reduce((a, l) => a + p[l].filter(e => e.hidden && e.done !== false && hasContent(e)).length, 0);
  $("bPages").textContent = `${pages} page${pages === 1 ? "" : "s"} in the ${tpl.name} layout.${example ? " Grey text shows what goes in each part. It turns into your own words as you finish each part." : ""}${pages > 2 && !example ? " Aim for two at most." : ""}${drafts ? ` ${drafts} ${drafts === 1 ? "entry isn't" : "entries aren't"} finished yet, so ${drafts === 1 ? "it's" : "they're"} not shown.` : ""}${hidden ? ` ${hidden} hidden from this resume.` : ""}`;
  const h = resumeHealth(p);
  $("bScoreMini").innerHTML = `Resume strength: <span style="color:${h.score >= 80 ? "var(--good)" : h.score >= 60 ? "var(--accent)" : "var(--warn)"}">${h.score}/100</span>`;
}
// Entries with something in them that haven't been finished (so they're not on the resume)
function draftsIn(p, step) {
  const out = [];
  const add = (list, arr) => arr.forEach((e, i) => { if (e.done === false && hasContent(e)) out.push({ list, i, e }); });
  if (!step || step === "experience") add("experience", p.experience);
  if (!step || step === "education") add("education", p.education);
  if (!step || step === "extras") {
    if (p.extras.projects) add("projects", p.projects);
    if (p.extras.volunteering) add("volunteering", p.volunteering);
    if (p.extras.referees && p.referees.mode === "list") add("referees", p.referees.list);
  }
  return out;
}
const previewSoon = () => { clearTimeout(previewTimer); previewTimer = setTimeout(() => { renderPreview(); renderSteps(); }, 220); };
function updateChecks() {
  const p = P();
  const sc = $("bSumCheck");
  if (sc) {
    const w = wordCount(p.summary), cl = CLICHES.filter(x => new RegExp("\\b" + x + "\\b", "i").test(p.summary));
    const msgs = [];
    const wc = $("bSumWords"); if (wc) wc.textContent = `${w} ${w === 1 ? "word" : "words"}`;
    if (w && w < 30) msgs.push("A little short.");
    else if (w > 85) msgs.push("Trim it a little.");
    if (cl.length || FILLER.test(p.summary)) msgs.push(`Cut ${cl.length ? "“" + cl.join("”, “") + "”" : "the buzzwords"}: show it instead.`);
    if (/\b(I|my)\b/.test(p.summary)) msgs.push("Resumes usually leave out “I” and “my”.");
    sc.textContent = msgs.join(" ");
    sc.classList.toggle("warn", msgs.length > 0);
  }
  const cc = $("bContactCheck");
  if (cc) {
    const c = p.contact, m = [];
    if (c.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim())) m.push("Check your email address.");
    if (c.phone && (c.phone.replace(/\D/g, "").length < 8 || c.phone.replace(/\D/g, "").length > 13)) m.push("Check your phone number.");
    if (/\b\d+\s+[A-Z][a-z]+\s+(St|Street|Rd|Road|Ave|Avenue|Ct|Court|Pl|Place|Dr|Drive)\b/.test(c.location)) m.push("Just your suburb and state is enough.");
    cc.textContent = m.join(" ");
    cc.classList.toggle("warn", m.length > 0);
  }
}
// A date box: tidied when you leave it, red if it can't be read
function dateMark(t, bad, msg) {
  t.classList.toggle("bad", bad);
  t.setAttribute("aria-invalid", bad ? "true" : "false");
  const m = $(t.id + "-msg");
  if (m) { m.textContent = bad ? (msg || DATE_HELP) : ""; m.classList.toggle("err", bad); }
}
// After a start or finish date changes: is the finish before the start?
function dateOrderCheck(path) {
  const base = path.replace(/\.(start|end)$/, ""), entry = getPath(P(), base), endBox = $(fid(base + ".end"));
  if (!entry || !endBox) return;
  const msg = endBeforeStart(entry);
  dateMark(endBox, !!msg || (!!val(endBox.value) && !dateOk(endBox.value)), msg);
}

/* --- Editing --- */
function onBuilderInput(e) {
  const t = e.target, p = P(), change = e.type === "change";
  if (t.tagName === "TEXTAREA") autoGrow(t);
  if (t.dataset.chipIn || t.dataset.ask || t.dataset.subjIn != null) return;
  // edited suggestion before adding it
  if (t.dataset.suggEdit) { const sg = builder.sugg[+t.dataset.i]; if (sg) sg.items[+t.dataset.j] = t.value; return; }
  // places are saved only when picked from the list (see the place picker)
  if (t.dataset.place || t.closest(".cc-pop")) return;
  // Review: show or hide a job, qualification, project or role on this resume
  if (t.dataset.show) { const [list, i] = t.dataset.show.split("."); const x = p[list][+i]; if (x) { x.hidden = !t.checked; touchProfile("builder"); renderPreview(); } return; }
  // country + number
  if (t.dataset.phone) {
    const [c, nat] = splitPhone(t.value, t.dataset.code);
    // a number typed with its own code ("+44 …") switches the country
    if (change && c !== t.dataset.code) { const k = countryByCode(c); if (k) setPhoneCountry(t, k); }
    if (change) t.value = nat;
    // a referee's number is kept as written for the resume (Australian ones start with 0), with its country beside it
    if (t.dataset.phonePath) { setPath(p, t.dataset.phonePath, nat ? refPhone(`${t.dataset.code} ${nat}`) : ""); setPath(p, t.dataset.phonePath + "Iso", nat ? t.dataset.iso : ""); touchProfile("builder"); updateChecks(); previewSoon(); return; }
    p.contact.phoneCode = t.dataset.code; p.contact.phoneIso = t.dataset.iso;
    p.contact.phone = nat ? `${t.dataset.code} ${nat}` : "";
    touchProfile("builder"); updateChecks(); previewSoon(); return;
  }
  // languages: a language and its level, from two lists
  if (t.dataset.lang != null) { onLangInput(t, change); return; }
  // when you can start
  if (t.dataset.start != null) {
    p.startWhen = t.value === "date" ? (/^\d{4}-/.test(p.startWhen) ? p.startWhen : addDaysISO(todayISO(), 14)) : t.value;
    touchProfile("builder"); keepOpen(); renderBuilder(false); return;
  }
  const path = t.dataset.path;
  if (!path) return;
  let v = t.type === "checkbox" ? t.checked : t.type === "radio" ? t.value : t.value;
  if (t.type === "radio" && !t.checked) return;
  // a thesis or major project is written as "Thesis: Title" when you leave the box
  if (change && /^education\.\d+\.project$/.test(path || "") && typeof v === "string" && v.trim()) { const c = thesisLine(v); if (c !== v) { v = c; t.value = c; } }
  // capitals are left exactly as typed: many words are acronyms (AWS, NDIS, KPMG, SaaS), so nothing is "corrected"
  // spelling: common slips and American spellings are fixed when you leave the box (with Undo)
  if (change && t.dataset.prose && typeof v === "string" && v.trim()) { const r = autocorrect(v); if (r.fixed.length) { builder.acUndo = { path, was: v, id: t.id }; v = r.text; t.value = v; acNote(t, r.fixed); } }
  if (t.dataset.lines) v = t.value.split("\n").map(s => s.replace(BULLET_RE, "").trimEnd()).filter((s, i, a) => s.trim() || i < a.length - 1);
  if (change && /contact\.email$|\.email$/.test(path)) { v = v.trim().toLowerCase(); t.value = v; }
  if (change && /contact\.(linkedin|website)$/.test(path)) { v = shortUrl(v); t.value = v; }
  if (change && /referees\.list\.\d+\.phone$/.test(path) && v.trim()) { v = refPhone(v); t.value = v; }
  // typing "Present" where the finish date goes means the person is still there
  if (change && t.dataset.date && /\.end$/.test(path) && /^(present|current(ly)?|now|ongoing|to date|today|till now|until now)$/i.test(String(v).trim())) {
    const entry = getPath(p, path.replace(/\.end$/, ""));
    if (entry && typeof entry === "object" && "current" in entry) { entry.current = true; entry.end = ""; touchProfile("builder"); keepOpen(); renderBuilder(false); return; }
  }
  setPath(p, path, v);
  if (/^experience\.\d+\.org$/.test(path)) { const co = t.closest("details.b-co"); if (co && !t.closest(".b-co-roles")) {
    for (const k of (co.dataset.ids || "").split(".")) { const x = p.experience[+k]; if (x) x.org = v; }
    touchProfile("builder");
    if (change) { builder.openCo.add(stackKey(p.experience[+(co.dataset.ids || "").split(".")[0]])); keepOpen(); renderBuilder(false); } else previewSoon();
    return;
  } }
  if (path === "target.jobSub") document.querySelectorAll('#bForm [data-act="pick-sub"]').forEach(x => x.setAttribute("aria-pressed", String(x.dataset.val === v)));
  // tools and equipment named for a job also go into Skills › Software and tools
  if (change && /^experience\.\d+\.answers\.tools$/.test(path)) toolsToSkills(p.experience[+path.split(".")[1]], v);
  // ticking Projects or Volunteering gives a new, empty entry, and it starts open (not folded away)
  for (const [key, mk] of [["projects", emptyProj], ["volunteering", emptyExp]]) {
    if (path !== "extras." + key || !v) continue;
    if (!p[key].length) p[key].push(mk());
    p[key].forEach((x, k) => { if (!hasContent(x)) builder.open[key].add(k); });
  }
  if (path === "summary") { const sa = $("bSumActs"); if (sa && !!sa.children.length !== !!val(v)) sa.innerHTML = summaryActions(); }   // Reword appears once there is a summary
  // (the summary is on the resume as soon as it is written: there is nothing to accept. When you leave the box it gets tidy spacing and a full stop)
  if (path === "summary" && change && typeof v === "string") { let s = tidySpaces(v); if (s && !/[.!?]$/.test(s)) s += "."; if (s !== v) { v = s; t.value = s; setPath(p, path, v); } }
  if (/^(awards|publications|interests)$/.test(path)) p.extrasDone[path] = false;
  if (t.dataset.date) {
    if (change) { const f = fmtDate(v); setPath(p, path, f); t.value = showDate(f); dateMark(t, !!val(f) && !dateOk(f)); dateOrderCheck(path); }
    else if (t.classList.contains("bad") && (!val(v) || dateOk(v))) dateMark(t, false);
  }
  // a qualification that finishes after today is still being studied
  if (t.dataset.date && change && /^education\.\d+\.end$/.test(path)) {
    const ed = p.education[+path.split(".")[1]], end = dateEnd(ed.end);
    if (end && end > new Date() && !ed.current) { ed.current = true; builder.autoStudy = path; touchProfile("builder"); keepOpen(); renderBuilder(false); return; }
  }
  // the qualification's level and subject make its full name, unless the person has written their own title
  if (/^education\.\d+\.degree$/.test(path)) { const ed = p.education[+path.split(".")[1]]; ed.degreeCustom = !!val(ed.degree); }
  if (/^education\.\d+\.(level|subject|level2|subject2|double|detail)$/.test(path)) {
    const i = +path.split(".")[1], ed = p.education[i];
    ed.degreeCustom = false;
    // the follow-up belongs to the broad subject it was written for
    const vs = vagueSubject(ed.subject);
    if (/\.detail$/.test(path)) ed.detailFor = vs ? vs[0].source : "";
    else if (change && /\.subject$/.test(path) && (!vs || ed.detailFor !== vs[0].source)) { ed.detail = ""; ed.detailFor = ""; }
    syncQual(ed);
    const nm = $(fid(`education.${i}`) + "_title"); if (nm) nm.value = ed.degree || "";
    // a broad subject ("Professional Engineering") opens a follow-up box, and a specific one closes it
    if (change && /\.(level|subject)$/.test(path)) {
      const shown = !!document.querySelector(`#bForm [data-path="education.${i}.detail"]`);
      if (shown !== !!detailQ(ed, `education.${i}`, i)) { touchProfile("builder"); keepOpen(); renderBuilder(false); return; }
    }
  }
  if (/^education\.\d+\.coursework$/.test(path)) {
    const i = +path.split(".")[1], ed = p.education[i], all = listOf(val(ed.coursework)).filter(x => !isBlank(x)), pk = pickSubjects(ed, p), n = $q(`[data-subjects="${i}"]`);
    if (n) { n.textContent = all.length > subjN(ed) ? `Showing ${pk.length} of ${all.length} on this resume: ${pk.join(", ")}.` : ""; n.classList.toggle("ok", all.length > subjN(ed)); }
  }
  // a place of study picked from the list: fill in its city
  if (change && /^education\.\d+\.inst$/.test(path)) { const i = +path.split(".")[1], ed = p.education[i], city = instCity(v); if (city && !val(ed.location)) { ed.location = city; keepOpen(); touchProfile("builder"); renderBuilder(false); return; } }
  // WAM or GPA: work out the unit from the number
  if (/^education\.\d+\.grade$/.test(path)) {
    const i = +path.split(".")[1], ed = p.education[i], g = guessGradeType(v, ed.gradeType);
    if (g !== ed.gradeType) { ed.gradeType = g; const sel = t.closest(".seg-in") && t.closest(".seg-in").querySelector("select"); if (sel) sel.value = g || ""; }
    const gn = $q(`[data-gradenote="education.${i}"]`); if (gn) gn.hidden = !(val(v) && !gradeStrong({ ...ed, grade: v }));
  }
  if (/^education\.\d+\.gradeType$/.test(path)) {
    const i = +path.split(".")[1], ed = p.education[i], gn = $q(`[data-gradenote="education.${i}"]`);
    if (gn) gn.hidden = !(val(ed.grade) && !gradeStrong({ ...ed, gradeType: v }));
  }
  // an employer typed in a job that is already under another job at the same employer (or that no longer is): regroup them
  if (change && /^experience\.\d+\.org$/.test(path) && expGroupSig(p) !== builder.expSig) { builder.expSig = expGroupSig(p); touchProfile("builder"); keepOpen(); renderBuilder(false); return; }
  // a job title from the list tells us the kind of work, if it isn't set yet
  // (the title is the only question now: the kind of work is worked out from it, and follows it if the title changes)
  if (change && path === "target.title") { const jt = titleKind(v); if (jt && jt !== p.target.jobType) { p.target.jobType = jt; p.target.jobSub = ""; touchProfile("builder"); keepOpen(); renderBuilder(false); return; } }
  // a job ad pasted in Goal: take the title and company from it
  if (change && path === "target.ad") {
    const ad = String(v || "");
    if (!val(p.target.title)) { const ti = detectTitle(ad, ""); if (ti) p.target.title = jobTitleCase(ti); }
    if (!val(p.target.company)) { const co = companyFrom(ad); if (co) p.target.company = co; }
    touchProfile("builder"); keepOpen(); renderBuilder(false); return;
  }
  touchProfile("builder");
  // (only while typing: redrawing on "change" would swallow a click on a Fix button)
  if (t.dataset.bullet && !change) { const it = t.closest(".bl-item"), c = it.querySelector(".coach"); c.innerHTML = coachHtml(t.value, t.dataset.current === "1" ? true : false, +it.dataset.i, +it.dataset.j); }
  if (/^experience\.\d+\.answers\.duties$/.test(path)) { const n = document.querySelector(`[data-vague="${path.split(".")[1]}"]`); if (n) n.textContent = vagueNote(p.experience[+path.split(".")[1]]); }
  if (t.dataset.rerender || t.type === "checkbox") { keepOpen(); renderBuilder(false); return; }
  // keep the card titles in step
  const card = t.closest("details.b-card");
  if (card && /\.(title|org|degree|level|subject|inst|name|role|start|end)$/.test(path)) {
    const list = card.dataset.card, i = +card.dataset.i, x = list === "referees" ? p.referees.list[i] : p[list][i];
    const sp = card.querySelector(":scope > summary > span:not(.drag-h):not(.card-tags):not(.meta)");
    if (sp && x) sp.textContent = list === "education" ? [x.degree, x.inst].filter(Boolean).join(", ") || "New qualification" : list === "projects" ? x.name || "New project" : list === "referees" ? (x.name ? [x.name, x.role].filter(Boolean).join(", ") : `Referee ${i + 1}`) : [x.title, x.org].filter(Boolean).join(" at ") || (list === "volunteering" ? "New role" : "New job");
    const m = card.querySelector(":scope > summary > .meta");
    if (m && x) m.textContent = rangeOf(x, list === "education");
    const tg = card.querySelector(":scope > summary > .card-tags");
    if (tg && x && list !== "referees") { const n = document.createElement("div"); n.innerHTML = cardState(x); tg.replaceWith(n.firstElementChild); }
  }
  updateChecks();
  previewSoon();
}
const $q = sel => document.querySelector(sel);
// Referees' numbers: Australian ones start with 0, others keep their country code
function refPhone(v) { const intl = /^\s*\+/.test(v) && !/^\s*\+61/.test(v), [c, nat] = splitPhone(v, "+61"); return intl ? `${c} ${nat}` : /^1/.test(nat) ? nat : "0" + nat; }
// Where a place of study is, if we know
function instCity(name) {
  if (UNI_CITY[name]) return UNI_CITY[name];
  const s = typeof AU_SCHOOL_PLACES === "object" && AU_SCHOOL_PLACES ? AU_SCHOOL_PLACES[name] : "";
  return s || "";
}
function keepOpen() {
  document.querySelectorAll("#bForm details.b-card").forEach(d => { const set = builder.open[d.dataset.card]; if (set) { if (d.open) set.add(+d.dataset.i); else set.delete(+d.dataset.i); } });
}
// o.focus: put the cursor back in the box (typing and pressing Enter). o.menu: and open its list.
// Picking from the list or clicking a suggested chip does neither, so no list is left open.
function addChip(key, raw, o = {}) {
  const vals = listOf(raw).map(s => s.slice(0, 60));
  if (!vals.length) return;
  const arr = P().skills[key];
  for (const v of vals) if (!arr.some(x => x.toLowerCase() === v.toLowerCase())) arr.push(v);
  if (key === "soft" && arr.length > 12) { arr.splice(12); toast("Twelve strengths is the most. Remove one to add another.", "warn"); }
  touchProfile("builder");
  rerenderChips(key, o);
}
function rerenderChips(key, o = {}) {
  const box = document.querySelector(`#bForm [data-chips="${key}"]`);
  if (!box) return;
  const labels = CHIP_LABELS[key];
  const tmp = document.createElement("div");
  tmp.innerHTML = chipEditor(key, ...labels);
  box.replaceWith(tmp.firstElementChild);
  const inp = document.querySelector(`#bForm [data-chip-in="${key}"]`);
  if (inp && o.focus) { inp.focus(); if (o.menu) sugShow(inp, true); }
  previewSoon();
}
// The list an entry lives in (referees sit one level down)
const listArr = (p, list) => list === "referees" ? p.referees.list : p[list];
async function onBuilderClick(e) {
  if (e.jfHandled) return;   // one click is handled once, however many listeners it reaches
  e.jfHandled = true;
  const b = e.target.closest("[data-act]");
  if (!b || !$("bForm").contains(b) && !$("bSteps").contains(b)) return;
  const act = b.dataset.act, p = P();
  const i = +b.dataset.i, list = b.dataset.list;
  switch (act) {
    case "goto": {
      keepOpen();
      const to = +b.dataset.step, cur = B_STEPS[builder.step].key;
      // leaving a step with unfinished entries: offer to finish them first
      if (!b.dataset.force && !builder.welcome && to > builder.step && ["experience", "education", "extras"].includes(cur)) {
        const drafts = draftsIn(p, cur);
        if (drafts.length) {
          builder.pendingGoto = { step: to, count: drafts.length, msg: draftsMsg(drafts) };
          // open every draft and take you back to the first one (the notice with the buttons is under the cards)
          for (const d of drafts) if (builder.open[d.list]) builder.open[d.list].add(d.i);
          renderBuilder(false);
          const first = document.querySelector(`#bForm details[data-card="${drafts[0].list}"][data-i="${drafts[0].i}"]`), pe = document.querySelector(".b-pending");
          if (first) { smoothTo(first, 80); first.classList.remove("flash"); void first.offsetWidth; first.classList.add("flash"); } else if (pe) smoothTo(pe, 80);
          return;
        }
      }
      builder.pendingGoto = null; builder.step = to; builder.welcome = false; renderBuilder(true); return;
    }
    case "goto-upload": { keepOpen(); builder.pendingGoto = null; showWelcome(); return; }
    case "finish-all": {
      const pend = builder.pendingGoto, cur = B_STEPS[builder.step].key;
      b.disabled = true; b.textContent = "Finishing…";
      // an entry that can't be finished (a missing title, dates the wrong way round...) is skipped, then shown below with the reason
      const stuck = [];
      for (const d of draftsIn(p, cur)) { const why = entryProblem(d.list, d.e); if (why) stuck.push({ ...d, ...why }); else await finishEntry(d.list, d.i, null, true); }
      const left = draftsIn(p, cur).length;
      if (!left && pend) { builder.pendingGoto = null; builder.step = pend.step; renderBuilder(true); return; }
      keepOpen();
      for (const s of stuck) { builder.open[s.list].add(s.i); if (s.list === "experience") { const k = stackKey(s.e); if (k) builder.openCo.add(k); } }
      if (pend && stuck.length) { pend.count = left; pend.msg = `${left === 1 ? "One entry can't" : left + " entries can't"} be finished yet, so ${left === 1 ? "it's" : "they're"} not on your resume. The reason is under ${left === 1 ? "it" : "each one"} below.`; }
      touchProfile("builder");
      renderBuilder(false);
      for (const s of stuck) finSay(s.list, s.i)(s.msg, true);
      if (stuck.length) {
        const s0 = stuck[0], card = document.querySelector(`#bForm details[data-card="${s0.list}"][data-i="${s0.i}"]`);
        if (card) { smoothTo(card, 80); card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash"); }
        const base = s0.list === "referees" ? `referees.list.${s0.i}` : `${s0.list}.${s0.i}`, f = s0.field && $(fid(`${base}.${s0.field}`));
        if (f) f.focus({ preventScroll: true });
        const st = $(`bFin-${s0.list}-${s0.i}`); if (st) st.setAttribute("role", "alert");
      }
      return;
    }
    case "extra-fold": {
      const key = b.dataset.key, fold = !(builder.extraFold || {})[key];
      builder.extraFold = { ...(builder.extraFold || {}), [key]: fold };
      const inner = document.querySelector(`#bForm .b-extra-inner[data-extra="${key}"]`);
      if (inner) inner.hidden = fold;
      const pk = document.querySelector(`#bForm .b-extra-peek[data-peek="${key}"]`); if (pk) pk.hidden = !fold;
      const tg = document.querySelector(`#bForm .b-extra-tog[data-key="${key}"]`);   // (the small triangle: pressed from here or from a finished section's Edit button)
      if (tg) {
        tg.classList.toggle("is-folded", fold); tg.setAttribute("aria-expanded", String(!fold));
        const label = ((tg.closest(".b-extra-head") || document).querySelector("b") || {}).textContent || "this section";
        tg.setAttribute("aria-label", `${fold ? "Show" : "Hide"} ${label}`); tg.title = `${fold ? "Show" : "Hide"} this section`;
      }
      if (!fold && inner) { inner.querySelectorAll("textarea").forEach(autoGrow); const f1 = inner.querySelector("input:not([disabled]), textarea"); if (f1 && b.closest(".b-extra-peek")) f1.focus({ preventScroll: true }); }
      return;
    }
    case "ai-fold": { const box = b.closest(".b-aiin"); if (box) aiFold(box); return; }
    case "open-role": {
      e.preventDefault();   // the button sits in the employer's summary: don't just toggle it
      keepOpen();
      const g = b.closest("details.b-co"); if (g) builder.openCo.add(g.dataset.group);
      builder.open.experience.add(i);
      renderBuilder(false);
      const card = document.querySelector(`#bForm details[data-card="experience"][data-i="${i}"]`);
      if (card) { smoothTo(card, 80); const t = card.querySelector("input[type=text]"); if (t) t.focus({ preventScroll: true }); }
      return;
    }
    case "finish": return finishEntry(list, i, b);
    case "polish": return polishOnly(list, i, b);
    case "polish-text": case "finish-text": return polishText(b.dataset.key, b, act === "finish-text");
    case "hide": { keepOpen(); const x = p[list][i]; x.hidden = !x.hidden; touchProfile("builder"); renderBuilder(false); return; }
    case "tpl-filter": {
      const v = b.dataset.val;
      if (v === "all") builder.tplFilter = [];
      else builder.tplFilter = builder.tplFilter.includes(v) ? builder.tplFilter.filter(x => x !== v) : [...builder.tplFilter, v];
      builder.tplShow = 12; renderBuilder(false); return;
    }
    case "tpl-more": builder.tplShow += 12; renderBuilder(false); return;
    case "tpl": { p.cv.template = b.dataset.tpl; p.cv.accent = ""; p.cv.accent2 = ""; if (typeof cvState !== "undefined") cvState.selected = b.dataset.tpl; touchProfile("builder"); renderBuilder(false); return; }
    case "accent": { if (!p.cv.template) p.cv.template = builderTpl().key; p.cv.accent = b.dataset.val; touchProfile("builder"); renderBuilder(false); return; }
    case "pick-work": { keepOpen(); const w = p.target.workTypes || (p.target.workTypes = []), k = b.dataset.val; if (w.includes(k)) w.splice(w.indexOf(k), 1); else w.push(k); touchProfile("builder"); renderBuilder(false); return; }
    case "pick-sub": keepOpen(); p.target.jobSub = p.target.jobSub === b.dataset.val ? "" : b.dataset.val; touchProfile("builder"); renderBuilder(false); return;
    case "sum-reword": return rwOpen({
      title: "Reword this summary", text: val(p.summary), sentences: true, go: ({ modes, free, sel }) => {
        const ss = ltSentences(val(p.summary)), note = rwCombine(modes, free).note, only = sel >= 0 && ss[sel] ? ` Change only this sentence and keep every other sentence exactly as it is: "${ss[sel].trim()}".` : "";
        return rewordSummary(`${note}${only}`.trim(), only ? "sentence" : modes.includes("shorter") ? "shorter" : modes.length || free ? "custom" : "another");
      } });
    case "sum-use": { const a = builder.sumAlts; if (a && a.items[+b.dataset.k]) { if (p.summary.trim()) builder.prevSummary = p.summary; p.summary = a.items[+b.dataset.k]; builder.sumAlts = null; touchProfile("builder"); renderBuilder(false); } return; }
    case "sum-close": builder.sumAlts = null; builder.sumAsk = false; renderBuilder(false); return;
    case "fix-bullet": return fixBullet(i, +b.dataset.j, b.dataset.issue, b);
    case "fix-number": { const inp = document.querySelector(`[data-ask="${i}.${b.dataset.j}"]`); return fixBullet(i, +b.dataset.j, "number", b, inp ? inp.value.trim() : ""); }
    case "close-ask": keepOpen(); builder.fixAsk = null; renderBuilder(false); return;
    case "reword": return rwOpen({ title: "Reword this bullet point", sub: "Choose as many changes as you like, then press Reword. You will get up to three wordings to pick from.", text: (p.experience[i].bullets[+b.dataset.j] || ""), sentences: false, go: ({ modes, free }) => rewordBullet(i, +b.dataset.j, rwCombine(modes, free).note) });
    case "use-alt": { const a = builder.alts[`${i}.${b.dataset.j}`]; if (a) { keepOpen(); p.experience[i].bullets[+b.dataset.j] = a.items[+b.dataset.k]; if (a.via) aiMade(a.items[+b.dataset.k]); delete builder.alts[`${i}.${b.dataset.j}`]; touchProfile("builder"); renderBuilder(false); } return; }
    case "close-alts": keepOpen(); delete builder.alts[`${i}.${b.dataset.j}`]; renderBuilder(false); return;
    case "check-run": return runResumeCheck(b);
    case "check-yes": case "check-no": case "check-all": return applyCheck(act, +b.dataset.k);
    case "pick-lang": keepOpen(); p.prefs.lang = b.dataset.val; touchProfile("builder"); renderBuilder(false); applySpellLang(); return;
    case "jobtype-open": keepOpen(); builder.jobTypeOpen = true; renderBuilder(false); return;
    case "pick": keepOpen(); if (b.dataset.path === "target.jobType") { builder.jobTypeOpen = false; if (p.target.jobType !== b.dataset.val) p.target.jobSub = ""; } setPath(p, b.dataset.path, b.dataset.val); touchProfile("builder"); renderBuilder(false); return;
    case "pick-bool": keepOpen(); setPath(p, b.dataset.path, b.dataset.val === "1"); touchProfile("builder"); renderBuilder(false); if (b.dataset.val === "1") { const ad = $(fid("target.ad")); if (ad && !ad.value) ad.focus(); } return;
    case "add": {
      keepOpen();
      const mk = { experience: emptyExp, education: emptyEdu, projects: emptyProj, volunteering: emptyExp, referees: emptyRef }[list];
      const arr = listArr(p, list), nx = mk();
      if (list === "experience" || list === "education") nx.location = "";
      arr.push(nx);
      builder.open[list].add(arr.length - 1);   // others stay as they are, so nothing jumps
      touchProfile("builder"); renderBuilder(false);
      const cards = document.querySelectorAll(`#bForm details[data-card="${list}"]`);
      const last = cards[cards.length - 1];
      if (last) { const inp = last.querySelector("input:not([disabled]), select, textarea"); if (inp) inp.focus({ preventScroll: true }); smoothTo(last); }
      return;
    }
    case "del": {
      keepOpen();
      const arr = listArr(p, list), entry = arr[i];
      const name = entry.title || entry.degree || entry.name || "this entry";
      if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = `Delete “${name}”? Click again`; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Delete"; } }, 4000); return; }
      arr.splice(i, 1);
      builder.foldOpen = {};
      builder.extraAlts = {};
      builder.open[list] = new Set();
      touchProfile("builder"); renderBuilder(false);
      if (list === "experience" || list === "education") window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
      return;
    }
    case "split": case "unsplit": {
      // Split: this job leaves the stack under its employer and gets its own company heading. Stack: it goes back.
      keepOpen();
      const x = p.experience[i];
      if (!x) return;
      const was = x.grp || "", nm = x.title || "This job", co = shortOrg(x.org) || "its employer";
      x.grp = act === "split" ? "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) : "";
      builder.open.experience.add(i);
      touchProfile("builder"); renderBuilder(false);
      const card = document.querySelector(`#bForm details[data-card="experience"][data-i="${i}"]`);
      if (card) { smoothTo(card, 80); card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash"); }
      actToast(act === "split" ? `Split “${nm}” from the other jobs at ${co}. It has its own heading on your resume now.` : `“${nm}” is stacked with your other jobs at ${co} again.`, () => { keepOpen(); x.grp = was; builder.open.experience.add(i); touchProfile("builder"); renderBuilder(false); });
      return;
    }
    case "add-role": {
      keepOpen();
      const src = p.experience[i];
      if (!src) return;
      const nx = emptyExp(); nx.org = src.org; nx.location = src.location || ""; nx.grp = src.grp || "";   // (a title added to a job that was split away joins that job)
      // the newer title goes above the one it follows, and the entries below it move down one place
      p.experience.splice(i, 0, nx);
      const down = k => k >= i ? k + 1 : k;
      builder.genned = new Set([...builder.genned].map(down));
      builder.sugg = Object.fromEntries(Object.entries(builder.sugg).map(([k, v]) => [down(+k), v]));
      builder.alts = Object.fromEntries(Object.entries(builder.alts).map(([k, v]) => { const [a, b] = k.split("."); return [down(+a) + "." + b, v]; }));
      builder.foldOpen = {}; builder.extraAlts = {};
      builder.open.experience = new Set([i]);
      touchProfile("builder"); renderBuilder(false);
      const card = document.querySelector(`#bForm details[data-card="experience"][data-i="${i}"]`);
      if (card) { const t = card.querySelector("input:not([disabled])"); if (t) { t.focus({ preventScroll: true }); t.select(); } smoothTo(card); }
      return;
    }
    case "move": {
      keepOpen();
      const arr = listArr(p, list), j = i + +b.dataset.d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      builder.animate = true;
      builder.foldOpen = {};
      builder.extraAlts = {};
      builder.open[list] = new Set([j]);
      touchProfile("builder"); renderBuilder(false); return;
    }
    case "add-bullet": return addOneBullet(i, b);
    case "del-bullet": { keepOpen(); const dj = +b.dataset.j; p.experience[i].bullets.splice(dj, 1); const moved = {}; for (const [k, v] of Object.entries(builder.alts)) { const [ki, kj] = k.split(".").map(Number); if (ki !== i) moved[k] = v; else if (kj < dj) moved[k] = v; else if (kj > dj) moved[ki + "." + (kj - 1)] = v; } builder.alts = moved; if (builder.fixAsk && builder.fixAsk.startsWith(i + ".")) builder.fixAsk = null; } touchProfile("builder"); renderBuilder(false); return;
    case "chip-del": P().skills[b.dataset.key].splice(i, 1); touchProfile("builder"); rerenderChips(b.dataset.key); return;
    case "chip-sugg": addChip(b.dataset.key, b.dataset.val); return;
    case "sugg-hide": builder.moreSugg[b.dataset.key] = 0; rerenderChips(b.dataset.key); return;
    case "sugg-more": builder.moreSugg[b.dataset.key] = (+builder.moreSugg[b.dataset.key] || 0) + 1; rerenderChips(b.dataset.key); return;
    case "lang-add": case "lang-del": langClick(act, i); return;
    case "verb": {
      const t = builder.lastBullet && builder.lastBullet.isConnected ? builder.lastBullet : null;
      if (!t) { b.closest("details").querySelector("summary").textContent = "Click into a bullet point first, then pick a word"; return; }
      applyVerb(t, b.dataset.val); return;
    }
    case "ai-summary": return writeSummary(b);
    case "ai-bullets": return writeBullets(i, b, b.dataset.mode || "new");
    case "redo-ask": builder.redoAsk = builder.redoAsk === i ? null : i; { const bx = $("bSugg" + i); if (bx) bx.innerHTML = suggHtml(i); } { const inp = $("bRedo" + i); if (inp) inp.focus(); } return;
    case "redo-close": builder.redoAsk = null; { const bx = $("bSugg" + i); if (bx) bx.innerHTML = suggHtml(i); } return;
    case "redo-go": {
      const st = REDO_STYLES.find(x => x[0] === b.dataset.style), custom = ($("bRedo" + i) || {}).value || "";
      if (!st && !custom.trim()) { const inp = $("bRedo" + i); if (inp) inp.focus(); return; }
      return writeBullets(i, b, "redo", st ? st[2] : custom.trim());
    }
    case "sugg-add": case "sugg-all": {
      keepOpen();
      const s = builder.sugg[i];
      if (!s) return;
      const pick = (act === "sugg-all" ? s.items.slice() : [s.items[+b.dataset.j]]).map(x => tidy(String(x || "")).replace(/[.\s]+$/, "")).filter(Boolean);
      const e2 = p.experience[i];
      e2.bullets = e2.bullets.filter(x => x.trim());
      for (const x of pick) if (!e2.bullets.includes(x)) { e2.bullets.push(x); if (s.ai) aiMade(x); }
      // suggestions are written and polished in one go: if every bullet came that way, Finish needn't polish again
      if (e2.bullets.length && e2.bullets.every(x => builder.aiText.has(norm(x)))) e2.polished = polishSig("experience", e2);
      s.items = act === "sugg-all" ? [] : s.items.filter((_, k) => k !== +b.dataset.j);
      if (!s.items.length) delete builder.sugg[i];
      touchProfile("builder"); renderBuilder(false); return;
    }
    case "ch-up": case "ch-down": case "ch-fit": case "ch-fit2": case "ch-all": case "ch-restore": return chooseAct(act, b);
    case "alt-more": keepOpen(); builder.altSeed = (builder.altSeed || 0) + 1; renderBuilder(false); return;
    case "x-reword": return rwOpen({ title: "Reword these lines", text: extraBox(list, i).text().join(" "), sentences: false, go: ({ modes, free }) => rewordExtra(list, i, rwCombine(modes, free).note) });
    case "x-use": {
      const a = builder.extraAlts[`${list}.${i}`];
      if (a && a.items[+b.dataset.k]) { keepOpen(); extraBox(list, i).set(a.items[+b.dataset.k]); delete builder.extraAlts[`${list}.${i}`]; if (list !== "awards") p[list][i].polished = ""; touchProfile("builder"); renderBuilder(false); }
      return;
    }
    case "x-close": keepOpen(); delete builder.extraAlts[`${list}.${i}`]; renderBuilder(false); return;
    case "sugg-undo": {
      keepOpen();
      const s = builder.sugg[i];
      if (s && s.added) { const gone = new Set(s.added); p.experience[i].bullets = p.experience[i].bullets.filter(x => !gone.has(tidy(String(x)).replace(/[.\s]+$/, ""))); delete builder.sugg[i]; touchProfile("builder"); renderBuilder(false); }
      return;
    }
    case "sugg-dismiss": delete builder.sugg[i]; $("bSugg" + i).innerHTML = ""; return;
    case "save-resume": return saveResumeVersion(b);
    case "saved-open": return openSavedResume(+b.dataset.k);
    case "saved-del": {
      if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Delete it?"; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Delete"; } }, 4000); return; }
      savedResumes.data.list.splice(+b.dataset.k, 1); savedResumes.save(true); renderBuilder(false); return;
    }
    case "to-cv": openView("cv"); return;
    case "to-letter": openView("letter"); return;
    case "to-linkedin": openView("linkedin"); return;
    case "degree-auto": { keepOpen(); const ed = p.education[+b.dataset.i]; ed.degreeCustom = false; ed.degree = ""; syncQual(ed); touchProfile("builder"); renderBuilder(false); return; }
    case "sort-date": return sortByDate(list);
    case "sort-level": return sortByLevel();
    case "to-scanner": sendToScanner(); return;
    case "to-jobs": openView("jobs"); return;
    case "to-interview": openView("interview"); return;
  }
}
const tidySpaces = s => String(s || "").replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
// Bullet points that came from the AI already polished, so Finish knows it needn't polish them again
const aiMade = t => { if (t) builder.aiText.add(norm(t)); };
builder.aiText = new Set();
// Downloads use the layout, colour, spacing and margins chosen in the Resume creator
async function builderDownload(kind, btn) {
  const base = builderTpl(), tpl = tplWithPrefs(base), accent = builderAccent(base), model = cvModel(P(), tpl);
  if (kind === "txt") return downloadTextFile(cvFileName(model, kind, base.family === "academic" || base.key === "academic" ? "CV" : "Resume"), profileToText(P()), $("bDlStatus"), btn);
  await downloadMade(cvFileName(model, kind, base.family === "academic" || base.key === "academic" ? "CV" : "Resume"), async () => kind === "pdf" ? (await cvPdf(model, tpl, { accent })).blob : cvDocx(model, tpl, { accent }), $("bDlStatus"), btn);
}
function sendToScanner() {
  const p = P(), ad = p.target.specific ? val(p.target.ad) : "";
  if (ad && !els.jd.value.trim()) els.jd.value = ad;
  els.resume.value = profileToText(p, { jobText: els.jd.value || ad });
  fileInfo = null;
  setExample(false);
  updateCounts();
  tlFromProfile(p.contact.name ? `${p.contact.name}'s resume` : "My resume");
  els.fileStatus.classList.remove("err");
  els.fileStatus.textContent = "Loaded the resume you built in the resume builder." + (ad && els.jd.value === ad ? " The job ad from your Goal step is in step 2, ready to scan." : " Add a job ad and scan.");
  updateFlow();
  openView("scanner");
  setTimeout(() => goTo(els.jd.value.trim() ? "scanRow" : "step-jd"), 80);
}

/* --- Review: saving a version under a name (the list of what goes on it is in 20b) --- */
const savedResumes = privateDoc("savedResumes", "jobfinder.savedResumes.v1", () => ({ list: [] }));
const MAX_SAVED = 12;
const fmtSaved = iso => { try { return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
function savedResumesHtml() {
  const list = savedResumes.data.list || [];
  return `${list.length ? `<div class="b-sub">Saved versions</div><ul class="saved-list" aria-label="Your saved resumes">${list.map((x, k) => `<li><span class="saved-name"><b>${esc(x.name)}</b><span class="small muted">Saved ${esc(fmtSaved(x.saved))}${x.tplName ? ` · ${esc(x.tplName)} layout` : ""}</span></span><span class="b-actions"><button class="btn" type="button" data-act="saved-open" data-k="${k}">Open</button><button class="btn ghost" type="button" data-dlmenu="saved-resume" data-k="${k}" aria-haspopup="menu" aria-expanded="false">Download as…</button><button class="btn ghost" type="button" data-act="saved-del" data-k="${k}">Delete</button></span></li>`).join("")}</ul>` : ""}`;
}
// A small pop-up that asks for a name. Resolves to the name, or null if cancelled.
function askName({ title, text, label, value, ok = "Save" }) {
  return new Promise(resolve => {
    let d = $("jfAsk");
    if (!d) { d = document.createElement("dialog"); d.id = "jfAsk"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "jfAskH"); document.body.appendChild(d); }
    d.innerHTML = `<form method="dialog" class="jf-dialog-card"><h2 id="jfAskH">${esc(title)}</h2>${text ? `<p class="small muted">${esc(text)}</p>` : ""}<label class="field" for="jfAskIn">${esc(label)}<input type="text" id="jfAskIn" maxlength="80" autocomplete="off" value="${esc(value || "")}"></label><div class="b-actions"><button class="btn primary" value="ok">${esc(ok)}</button><button class="btn ghost" value="cancel" type="submit" formnovalidate>Cancel</button></div></form>`;
    const inp = d.querySelector("input");
    d.returnValue = "";
    d.onclose = () => { const v = d.returnValue === "ok" ? inp.value.trim().slice(0, 80) : ""; resolve(v || null); };
    if (typeof d.showModal === "function") { d.showModal(); inp.focus(); inp.select(); }
    else resolve(value || null);
  });
}
async function saveResumeVersion(btn) {
  // saving to your profile needs an account (inside Claude, or where accounts aren't switched on, it saves privately as before)
  if (typeof acctOn === "function" && acctOn() && !account.user && !(window.claude && window.claude.use)) {
    acctDialog("up");
    const m = document.querySelector("#acctDlg #acctMsg");
    if (m) { m.textContent = "Saving a resume to your profile needs a free account. Sign up or sign in, then press Save again."; m.className = "acct-msg"; }
    return;
  }
  const p = P(), t = builderTpl();
  const name = await askName({ title: "Save this resume to your profile", text: "Everything on this version is saved: what's shown and hidden, the layout and colour. Saving again with the same name replaces it.", label: "Name it", value: [p.target.title || "My resume", p.target.company].filter(Boolean).join(" – ") });
  if (!name) return;
  await savedResumes.ready;
  const list = savedResumes.data.list = (savedResumes.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), tpl: t.key, tplName: t.name, accent: builderAccent(t), profile: JSON.parse(JSON.stringify(p)) });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedResumes.save(true);
  builder.savedSig = resumeSig();   // (saved: leaving this page won't ask)
  renderBuilder(false);
  const s2 = $("bSaveStatus"); if (s2) s2.textContent = `“${name}” is ${whereWords(savedResumes.where === "loading" ? profile.where : savedResumes.where)}.`;
}
function openSavedResume(k) {
  const x = (savedResumes.data.list || [])[k];
  if (!x) return;
  builder.undo = JSON.parse(JSON.stringify(P()));
  replaceProfile(x.profile, "import");
  P().cv.template = x.tpl; P().cv.accent = x.accent || "";
  touchProfile("import");
  builder.savedSig = resumeSig();
  builder.open = openSets(); builder.sugg = {};
  renderBuilder(false);
  const st = $("bSaveStatus");
  if (st) { st.innerHTML = `Opened “${esc(x.name)}”. <button class="linkish" type="button" id="bUndoOpen">Undo</button>`; $("bUndoOpen").onclick = () => { replaceProfile(builder.undo, "import"); builder.undo = null; renderBuilder(false); }; }
}
dlMenu("bDlBtn", { docx: b => builderDownload("docx", b), pdf: b => builderDownload("pdf", b), txt: b => builderDownload("txt", b) });
dlMenu("saved-resume", { docx: b => downloadSavedResume(+b.dataset.k, "docx", b), pdf: b => downloadSavedResume(+b.dataset.k, "pdf", b), txt: b => downloadSavedResume(+b.dataset.k, "txt", b) });
async function downloadSavedResume(k, kind, btn) {
  const x = (savedResumes.data.list || [])[k];
  if (!x) return;
  const pr = mergeProfile(x.profile), base = tplByKey(x.tpl), tpl = tplWithPrefs(base, pr.prefs), model = cvModel(pr, tpl);
  if (kind === "txt") return downloadTextFile(cvFileName(model, kind, "Resume"), profileToText(pr), $("bSaveStatus"), btn);
  await downloadMade(cvFileName(model, kind, "Resume"), async () => kind === "pdf" ? (await cvPdf(model, tpl, { accent: x.accent || base.accent })).blob : cvDocx(model, tpl, { accent: x.accent || base.accent }), $("bSaveStatus"), btn);
}

/* --- AI help: the summary and bullet points, using only what you wrote --- */
const SUMMARY_RULES = `You write the profile paragraph at the top of an Australian resume.
Use ONLY facts the candidate gave. Never invent employers, numbers, skills, tools, qualifications or achievements.
Write 2 or 3 sentences, 40 to 75 words, in the implied first person (no "I", no "my"), Australian spelling.
Start with who they are professionally, then their strongest skills with one piece of evidence, then what they are looking for.
If they gave "A result they're proud of", that result is the piece of evidence: put it in, keeping its numbers exactly as given.
If <study> says they are still studying, describe them by their year of study (for example "penultimate-year" or "final-year" student, as <study> says) and never as a graduate or recent graduate.
No clichés ("hard-working", "team player", "passionate", "results-driven", "go-getter", "proven track record"), no buzzwords like "leverage" or "utilise", no markdown.
Reply with only JSON: {"summary": "..."}`;
const BULLET_RULES = `You are an experienced Australian resume writer. Turn a candidate's own answers about one job into polished bullet points that can go straight onto their resume.
Use ONLY what the candidate wrote. Never invent numbers, tools, results, team sizes, awards or responsibilities. Keep any number exactly as they gave it.
Write 3 to 5 bullet points, ordered from most to least important (the biggest results and responsibilities first). Every bullet follows this formula: action verb + what they did + the result, with a number where possible. It reads as a complete sentence without the "I", and "what they did" can include how they did it (the tools, systems or people they mentioned). If their answers give no result or number for a task, say what the work achieved in plain words and never invent a number. Combine short, related tasks into one fuller bullet (for example "opened the store", "counted the till" and "restocked shelves" become one) rather than giving each small task its own thin bullet.
Describe each task the way a capable person in this position would, so a recruiter sees the full scope of the job: you may add the purpose and the usual standard of the work for this kind of role (for example a barista "kept orders moving through the morning rush", an engineering intern "prepared drawings for review by senior engineers"). Never add a task, tool, number or result they didn't mention, and don't repeat a fact in two bullets.
Polish as you write: precise professional words instead of casual ones, shorthand spelled out, Australian spelling, the right capitals for tools and companies.
Each bullet: 16 to 30 words; past tense for a past job, present tense for their current job; no two start with the same verb; a result goes near the front when there is one.
No "I", no "my", no "responsible for", no "duties included", no clichés, no buzzwords like "leverage" or "utilise", no markdown, no full stop at the end.
${BULLET_STYLE}
Reply with only JSON: {"bullets": ["...", "..."]}`;
const SUMMARY_SCHEMA = { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] };
const BULLETS_SCHEMA = { type: "object", properties: { bullets: { type: "array", items: { type: "string" } } }, required: ["bullets"] };
// Text that may vouch for numbers and skills in AI wording
function sourceText(p) {
  return [p.target.title, ...Object.values(p.summaryQ), p.summary, ...p.experience.flatMap(e => [e.title, e.org, ...Object.values(e.answers), ...e.bullets]), ...p.education.flatMap(e => Object.values(e)), ...Object.values(p.skills).flat(), ...p.projects.flatMap(x => Object.values(x)), ...p.volunteering.flatMap(e => [e.title, e.org, ...e.bullets]), p.awards, p.interests].join("\n");
}
function honest(text, src, o = {}) {
  let t = stripMarkup(String(text || "")).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, o.keepStop ? "." : "");
  if (t) { t = dropFirstPerson(t); t = t[0].toUpperCase() + t.slice(1); }   // "I" and "my" never stay
  if (!t) return null;
  const okNums = new Set(numsOf(src));
  if (numsOf(t).some(n => !okNums.has(n))) return null;
  const srcSkills = skillSet(src);
  if ([...skillSet(t)].some(s => !srcSkills.has(s) && (SKILLS.find(k => k.name === s) || {}).kind === "hard")) return null;
  if (FILLER.test(t) || CLICHES.some(c => c !== "responsible for" && new RegExp("\\b" + c + "\\b", "i").test(t))) return null;
  if (/\b(I|my|me)\b/.test(t) || /responsible for|duties included/i.test(t)) return null;
  const w = wordCount(t);
  if (w < (o.min || 5) || w > (o.max || 34)) return null;
  return t;
}
function summaryPrompt(p) {
  return `<target_job>${p.target.title || "(not given)"}${p.target.jobType ? ` (${(JOB_TYPES.find(j => j.key === p.target.jobType) || {}).label})` : ""}</target_job>
<career_stage>${careerStageWords(p)}</career_stage>${studyLine(p) ? `\n<study>${studyLine(p)}</study>` : ""}
<their_answers>
How they describe themselves: ${p.summaryQ.who || "(not given)"}
Strongest skills: ${p.summaryQ.strengths || "(not given)"}
A result they're proud of: ${p.summaryQ.proof || "(not given)"}
What they want next: ${p.summaryQ.next || "(not given)"}
</their_answers>
<experience>
${shown(p.experience).filter(e => e.title || e.org).slice(0, 4).map(e => `- ${e.title}${e.org ? ` at ${e.org}` : ""} (${rangeOf(e)}): ${e.bullets.filter(Boolean).slice(0, 4).join("; ")}`).join("\n") || "(none)"}
</experience>
<education>
${shown(p.education).filter(e => e.degree || e.inst).slice(0, 2).map(e => `- ${e.degree}${e.inst ? `, ${e.inst}` : ""} (${rangeOf(e, true)})${eduLines(e, p, p.target.ad, true).length ? ": " + eduLines(e, p, p.target.ad, true).join("; ") : ""}`).join("\n") || "(none)"}
</education>
<skills>${[...p.skills.hard, ...p.skills.software, ...p.skills.certs].join(", ") || "(none listed)"}</skills>${p.extras.projects && p.projects.some(x => x.name) ? `\n<projects>${p.projects.filter(x => x.name).map(x => x.name).join("; ")}</projects>` : ""}${p.extras.awards && val(p.awards) ? `\n<awards>${linesOf(p.awards).join("; ")}</awards>` : ""}`;
}
// "Student or recent graduate" told the AI too little: say which one, from the study dates
function careerStageWords(p) {
  const st = (STAGES.find(s => s.key === p.target.stage) || {}).label || "(not given)";
  if (p.target.stage !== "student") return st;
  const s = finished(p.education).map(e => studyStage(e)).find(Boolean);
  return !s ? st : s.current ? `Current student${s.label ? ` (${s.label})` : ""}` : s.label === "recent graduate" ? "Recent graduate" : "Graduate";
}
// The summary is written last, so its answers can start from everything else
function prefillSummaryQ(p) {
  const qz = p.summaryQ;
  if (builder.sumPrefilled) return builder.sumPrefilledNow;
  builder.sumPrefilled = true;
  if (Object.values(qz).some(v => v.trim())) return (builder.sumPrefilledNow = false);
  const exps = finished(p.experience).filter(e => e.title), edu = finished(p.education).find(e => e.degree);
  const titles = [...new Set(exps.map(e => e.title))].slice(0, 2);
  const student = stageOf(p) === "student";
  const the = n => /^(university|australian national|queensland university|swinburne|victoria university)/i.test(n) && !/^the /i.test(n) ? "the " + n : n;
  const ss = edu && studyStage(edu), still = edu && (edu.current || (ss && ss.current));
  const yearWord = still && ss && ss.label ? ss.label[0].toUpperCase() + ss.label.slice(1) + " " : "";
  if (student && edu) qz.who = `${yearWord}${edu.degree} ${still ? "student at" : "graduate from"} ${edu.inst ? the(edu.inst) : "university"}`.replace(/ (at|from) university$/, "") + `${titles.length ? `, with experience as ${titles.map(t => aOrAn(t) + " " + t).join(" and ")}` : ""}`;
  else if (exps[0]) qz.who = `${exps[0].title}${exps[0].org ? ` with experience at ${[...new Set(exps.map(e => e.org).filter(Boolean))].slice(0, 2).join(" and ")}` : ""}${edu ? `, holding a ${edu.degree}` : ""}`;
  const sk = [...p.skills.hard.slice(0, 2), ...p.skills.software.slice(0, 2)];
  if (sk.length) qz.strengths = sk.join(", ");
  const win = exps.flatMap(e => e.bullets).find(b => numsOf(b).length);
  if (win) qz.proof = win;
  if (p.target.title) qz.next = `${aOrAn(p.target.title)} ${p.target.title} role`.replace(/^a/, "A");
  const any = Object.values(qz).some(v => v.trim());
  if (any) touchProfile("builder");
  return (builder.sumPrefilledNow = any);
}
// "Communication" → "communication", but "SolidWorks", "Excel" and "AutoCAD" keep their capitals
const lowerSoft = s => { if (!s || !/^[A-Z](?![A-Z])/.test(s)) return s; const w = s.split(/\s/)[0]; if (/[A-Z]/.test(w.slice(1)) || /\s[A-Z]/.test(s) || SOFTWARE.has(s) || PROGRAMMING.has(s) || SOFTWARE.has(w)) return s; const mine = [...P().skills.software, ...P().skills.certs].map(x => x.toLowerCase()), lo = s.toLowerCase(); return mine.some(x => x === lo || x.startsWith(lo + " ")) ? s : s[0].toLowerCase() + s.slice(1); };
function templateSummary(p) {
  const qz = p.summaryQ;
  const clean = s => tidy(String(s || "")).replace(/^(i am|i'm|i’m)\s+(an?\s+)?/i, "").replace(/^(an?)\s+/i, "");
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  let who = clean(qz.who);
  if (!who) {
    const e = p.experience.find(x => x.title), ed = p.education[0], ss = ed && studyStage(ed);
    who = stageOf(p) === "student" && ed ? (ed.current || (ss && ss.current) ? `${ss && ss.label ? ss.label[0].toUpperCase() + ss.label.slice(1) + " " : ""}${ed.degree} student${ed.inst ? ` at ${ed.inst}` : ""}` : `Graduate of the ${ed.degree}${ed.inst ? ` at ${ed.inst}` : ""}`) : e ? `${e.title}${e.org ? ` with experience at ${e.org}` : ""}` : p.target.title || "";
  }
  const parts = [];
  const noMy = t => t.replace(/\bmy\b/g, "the").replace(/\bMy\b/g, "The").replace(/\b(I|I've|I'm|I’ve|I’m)\s+/g, "");
  const strengths = tidy(String(qz.strengths || "")).replace(/^(my )?(strongest )?(skills|strengths) (are|include)\s*/i, "");
  if (who) parts.push(cap(noMy(who)) + ".");
  if (strengths) { const items = listOf(strengths); parts.push(`Skilled in ${items.length > 1 ? listJoin(items.map(lowerSoft)) : lowerSoft(strengths)}.`); }
  const proof = clean(qz.proof);
  if (proof) parts.push(cap(noMy(proof.replace(/^(i\s+)/i, ""))) + ".");
  else { const b = p.experience.flatMap(e => e.bullets).find(x => numsOf(x).length); if (b) parts.push(cap(tidy(b)) + "."); }
  const next = tidy(String(qz.next || "")).replace(/^(i'?m |i am )?(looking for|seeking|i want|want|hoping for|keen on|keen to find)\s+/i, "");
  if (next) parts.push(`Looking for ${lowerSoft(noMy(next))}.`);
  else if (p.target.title) parts.push(`Looking for a ${p.target.title} role.`);
  return parts.join(" ").replace(/\s+/g, " ").replace(/\.\./g, ".").trim();
}
// The result they're proud of has to be in the summary: its numbers, or most of its key words
function proofMissing(text, p) {
  const pr = val(p.summaryQ.proof);
  if (!pr) return "";
  const nums = numsOf(pr), have = numsOf(text);
  if (nums.length) return nums.every(n => have.includes(n)) ? "" : `it must include the result they're proud of, with its numbers: “${pr}”`;
  const words = [...contentWords(pr)], t = norm(text), hit = words.filter(w => t.includes(w)).length;
  return words.length && hit / words.length < 0.5 ? `it must include the result they're proud of: “${pr}”` : "";
}
async function writeSummary(btn) {
  const p = P(), note = $("bSumEngine");
  if (!Object.values(p.summaryQ).some(v => v.trim()) && !p.experience.length && !p.education.length) { note.textContent = "Answer at least one of the questions above first."; return; }
  btn.disabled = true;
  const progress = m => { note.textContent = m; note.classList.add("busy"); };
  progress("Writing your summary from the Resume Advice and your resume…");
  // what the AI may draw on: the whole resume and the answers above
  const src = sourceText(p);
  let text = null, via = "", res = null;
  // a current student must never come out as a "recent graduate"
  const ss = finished(p.education).map(e => studyStage(e)).find(Boolean), studying = !!(ss && ss.current);
  const GRAD = /\b(recent(ly)?|new(ly)?)[\s-]+graduat\w*|\bgraduated\b|\bgraduate (of|from)\b|^(an? )?graduate\b/i;
  const judge = t => { const h = honest(t, src, { min: 25, max: 95, keepStop: true }); if (!h) return [null, factCheck(t, src, { noFirstPerson: true, min: 25, max: 95 }) || "it used something that isn't in their resume or answers"]; const miss = proofMissing(h, p); if (miss) return [null, miss]; if (studying && GRAD.test(h)) return [null, `they're still studying${ss.label ? ` (a ${ss.label} student)` : ""}, so never call them a graduate`]; return [h, ""]; };
  try {
    // ONE prompt, like the cover letter: a summary of the Resume Advice page, the whole resume, the job ad and their answers (see 20k-summary-advice.js)
    res = await aiJSON({
      nano: SUMMARY_SYSTEM, full: SUMMARY_SYSTEM, prompt: summaryAdvicePrompt(p), schema: SUMMARY_SCHEMA, label: "Writing your summary", progress,
      writing: true, expect: 420,
      check: d => { const [ok, why] = judge(d && typeof d.summary === "string" ? d.summary : ""); return ok ? { ok: true, value: ok } : { ok: false, why: why || "write the summary again as two or three sentences of 40 to 75 words" }; }
    });
    if (res.data) { text = res.data; via = `Written by ${viaWords(res.via)} from the Resume Advice and your resume.`; }
  } finally { btn.disabled = false; note.classList.remove("busy"); }
  if (!text) { text = templateSummary(p); via = res && res.rejected ? "The AI's draft mentioned things that aren't in your resume or answers, so this version was put together from your answers instead. Edit it so it sounds like you." : `${aiMissWords(res)} Put together from your answers. Edit it so it sounds like you.`.trim(); }
  if (!text) { progress("Answer the questions above first."); return; }
  if (!/[.!?]$/.test(text)) text += ".";
  if (p.summary.trim() && p.summary.trim() !== text) builder.prevSummary = p.summary;
  p.summary = text;
  builder.showSummary = true;
  touchProfile("builder");
  renderBuilder(false);
  const ta = $(fid("summary")), n2 = $("bSumEngine");
  if (ta) { ta.focus({ preventScroll: true }); smoothTo(ta.closest(".q"), 80); }
  n2.innerHTML = esc(via) + (builder.prevSummary ? ' <button class="linkish" type="button" data-act="undo-summary">Undo</button>' : "");
  const u = n2.querySelector("[data-act=undo-summary]");
  if (u) u.onclick = () => { p.summary = builder.prevSummary; builder.prevSummary = null; touchProfile("builder"); const t2 = $(fid("summary")); if (t2) t2.value = p.summary; n2.textContent = "Restored your previous summary."; updateChecks(); previewSoon(); };
}
// Reword: three other ways to say the same summary, each checked against your answers
const SUM_REWORD_NANO = `You write different wordings of the profile paragraph at the top of an Australian resume.
Rules:
1. Write 3 versions. Each keeps every fact and adds nothing new: no new skills, numbers, employers, qualifications or results.
2. 40 to 75 words each, 2 or 3 sentences, no "I" or "my", Australian spelling. If <change> says to make it shorter or longer, follow that instead of the word count.
3. If <change> is given, every version does what it says. Otherwise vary them: one leads with who they are, one with their strongest skill, one with their result.
4. If they're still studying, keep their year of study and never call them a graduate.
5. No clichés ("hard-working", "team player", "passionate", "results-driven") and no buzzwords ("leverage", "utilise").
Reply with JSON only: {"options": ["...", "...", "..."]}`;
async function rewordSummary(change = "", kind = "another") {
  const p = P(), cur = val(p.summary);
  if (!cur) return;
  builder.sumAlts = { busy: "Finding other ways to say it…" };
  const box = $("bSumActs"); if (box) box.innerHTML = summaryActions();
  const src = sourceText(p) + "\n" + cur;
  const ss = finished(p.education).map(e => studyStage(e)).find(Boolean), studying = !!(ss && ss.current);
  const GRAD = /\b(recent(ly)?|new(ly)?)[\s-]+graduat\w*|\bgraduated\b|\bgraduate (of|from)\b|^(an? )?graduate\b/i;
  const r = await aiJSON({ nano: SUM_REWORD_NANO, prompt: `${studyLine(p) ? `<study>${studyLine(p)}</study>\n` : ""}<summary>${cur}</summary>\n<facts>\n${summaryPrompt(p)}\n</facts>`, schema: { type: "object", properties: { options: strArr }, required: ["options"] }, label: "Rewording", progress: m => { builder.sumAlts = { busy: m }; const b2 = $("bSumActs"); if (b2) b2.innerHTML = summaryActions(); },
    check: d => {
      const seen = new Set([norm(cur)]);
      const ok = (Array.isArray(d.options) ? d.options : []).map(x => honest(x, src, { min: 25, max: 95, keepStop: true })).filter(x => x && !(studying && GRAD.test(x)) && keepsFacts(cur, x) >= (kind === "shorter" ? 0.3 : kind === "sentence" ? 0.6 : 0.45) && changedWords(cur, x) >= (kind === "sentence" ? 2 : 4) && !seen.has(norm(x)) && seen.add(norm(x)));
      return ok.length >= (kind === "another" ? 2 : 1) ? { ok: true, value: ok.slice(0, 3).map(x => /[.!?]$/.test(x) ? x : x + ".") } : { ok: false, why: "write 3 different versions of 40 to 75 words that keep every fact and add nothing" };
    } });
  let items = r.data || [], msg = "";
  if (!items.length) {
    // without AI: the same sentences in a different order
    const sents = sentencesOf(cur).map(x => x.trim()).filter(Boolean);
    if (kind === "shorter") { if (sents.length >= 2) items = [sents.slice(0, -1).join(" "), sents.length > 2 ? [sents[0], sents[sents.length - 1]].join(" ") : ""].filter(x => x && wordCount(x) >= 20); }
    else if (kind !== "another") items = [];
    else if (sents.length >= 2) items = [[...sents.slice(1), sents[0]].join(" "), [sents[sents.length - 1], ...sents.slice(0, -1)].join(" ")].filter(x => norm(x) !== norm(cur));
    const t = kind === "another" ? templateSummary(p) : ""; if (t && norm(t) !== norm(cur) && !items.includes(t)) items.push(t);
    msg = aiMissWords(r) + (items.length ? (kind === "shorter" ? " These are your own sentences with one left out." : " These are reshuffles of your own sentences.") : " This kind of change needs AI.");
  }
  builder.sumAlts = { items: items.slice(0, 3), via: r.data ? r.via : null, msg };
  const b3 = $("bSumActs"); if (b3) b3.innerHTML = summaryActions();
}
const IRREG = { hit: "hit", lead: "led", run: "ran", write: "wrote", make: "made", build: "built", teach: "taught", sell: "sold", keep: "kept", set: "set", meet: "met", take: "took", give: "gave", find: "found", bring: "brought", buy: "bought", draw: "drew", hold: "held", deal: "dealt", speak: "spoke", put: "put", send: "sent", spend: "spent", win: "won", oversee: "oversaw", do: "did", get: "got", cut: "cut", show: "showed", grow: "grew", choose: "chose", lend: "lent", feed: "fed" };
function toPast(word) {
  const w = word.toLowerCase();
  if (IRREG[w]) return IRREG[w];
  if (/ed$/.test(w)) return w;
  if (/e$/.test(w)) return w + "d";
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ied";
  if (/^(plan|stop|ship|chat|drop|map|log|tag|scan|staff)$/.test(w)) return w + w.slice(-1) + "ed";
  return w + "ed";
}
const BASE_VERBS = /^(serve|train|manage|lead|run|handle|help|assist|organise|organize|coordinate|plan|prepare|create|build|design|develop|write|answer|process|clean|open|close|stock|restock|count|cook|deliver|drive|operate|maintain|install|inspect|repair|fix|check|test|analyse|analyze|research|support|supervise|mentor|teach|tutor|sell|greet|resolve|schedule|book|update|record|monitor|order|pack|load|unload|use|work|answer|liaise|communicate|present|report|review|audit|calculate|draft|model|survey|measure|launch|improve|reduce|increase|cut|grow|make|keep|set|meet|take|run|draw|win|oversee|do|provide|show|gather|conduct|perform|identify|ensure|collaborate|contribute|facilitate|implement|execute|generate|produce|attend|advise|assess|evaluate|compile)s?\b/i;
// "Hitting" → "Hit", "serving" → "Served" (or "Serve" for a current job)
function startVerb(s, current) {
  const m = s.match(/^([A-Za-z]+)(.*)$/s);
  if (!m) return s;
  let w = m[1].toLowerCase(), rest = m[2], base = null;
  if (/ing$/.test(w) && w.length > 5) {
    let stem = w.slice(0, -3);
    if (/([bdgklmnprt])\1$/.test(stem)) stem = stem.slice(0, -1);
    else if (BASE_VERBS.test(stem + "e") && !BASE_VERBS.test(stem)) stem += "e";
    base = stem;
  } else if (BASE_VERBS.test(w)) base = w.replace(/s$/, "");
  if (!base) return s[0].toUpperCase() + s.slice(1);
  const v = current ? base : toPast(base);
  return v[0].toUpperCase() + v.slice(1) + rest;
}
function isVague(t) { const d = val(t); return !!d && (wordCount(d) < 4 || /\b(stuff|things|etc|normal|general|usual|various|everything|whatever)\b/i.test(d)); }
function vagueNote(e) { return isVague(e.answers.duties) ? "Be specific: list the 3 or 4 things a normal day involved, like “served customers, processed sales on the POS, restocked shelves”. Specific tasks make much better bullet points." : ""; }
function answersToBullets(e) {
  const dash = t => t.replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
  const clean = s => dash(s.replace(BULLET_RE, "").trim().replace(/^(and|also|then)\s+/i, "").replace(/^(i|we)\s+(also\s+)?/i, "").replace(/^my (job|role|main job|duties) (was|were|included) (to\s+)?/i, "").replace(/^(i was|was)\s+(in charge of|responsible for)\s+/i, "Managed ").replace(/[.\s]+$/, "").replace(/^[\s\S]*$/, m => dropFirstPerson(m)));
  const sentences = t => String(t || "").split(/\n+|(?<=[.!?])\s+|;\s*/).map(clean).filter(x => wordCount(x) >= 2);
  const tools = listOf(val(e.answers.tools)).filter(t => t.length < 40);
  const people = dash(val(e.answers.people).replace(/[.\s]+$/, ""));
  const peoplePhrase = !people ? "" : /customer|client|patient|student|guest|visitor|member|user/i.test(people) ? ` for ${lowerFirst(people)}` : ` alongside ${lowerFirst(people)}`;
  const mentions = (b, x) => norm(b).includes(norm(x));
  const out = [];
  const add = b => { for (const [re, v] of WEAK_SWAP) if (re.test(b)) { b = b.replace(re, v); break; } b = startVerb(b, e.current); if (b && !out.includes(b) && !e.bullets.includes(b)) out.push(b); };
  // achievements first: they're the strongest material
  for (const w of sentences(e.answers.wins)) add(w + (out.length === 0 && peoplePhrase && !mentions(w, people) ? peoplePhrase : ""));
  // duties, two or three to a bullet, with the tools and people they mentioned
  const duties = isVague(e.answers.duties) ? [] : String(e.answers.duties || "").split(/\n+|(?<=[.!?])\s+|;\s*|,\s*(?=[a-z])/i).map(clean).filter(x => wordCount(x) >= 2);
  // short tasks are grouped two or three to a bullet; a longer one stands on its own
  const groups = [];
  for (const d of duties) { const g = groups[groups.length - 1]; if (wordCount(d) <= 6 && g && g.length < 3 && g.every(x => wordCount(x) <= 6)) g.push(d); else groups.push([d]); }
  for (let k = 0; k < groups.length; k++) {
    const grp = groups[k].map((d, n) => n ? lowerFirst(startVerb(d, e.current)) : d);
    let b = grp.length > 1 ? grp.slice(0, -1).join(", ") + " and " + grp[grp.length - 1] : grp[0];
    if (k === 0 && tools.length && !tools.some(t => mentions(b, t))) b += ` using ${listJoin(tools.slice(0, 3))}`;
    else if (peoplePhrase && !mentions(b, people) && !out.some(x => mentions(x, people))) b += peoplePhrase;
    add(b);
  }
  // nothing about tools yet: a short bullet for them
  if (tools.length && !out.some(b => tools.some(t => mentions(b, t)))) add(`${e.current ? "Use" : "Used"} ${listJoin(tools.slice(0, 4))}${peoplePhrase && !out.some(x => mentions(x, people)) ? peoplePhrase : ""}`);
  return out.map(b => withPurpose(b.replace(/\s+/g, " ").trim())).slice(0, 6);
}
// Without AI, a short bullet gets the usual purpose of that kind of task, so it reads as a full sentence
const PURPOSE = [
  [/\b(coffee|barista|orders?)\b/i, "to keep orders moving during busy periods"],
  [/\b(customers?|clients?|guests?|patrons?|shoppers?)\b/i, "to give every customer a friendly, efficient experience"],
  [/\b(stock|shelves|shelf|inventory|restock\w*|replenish\w*)\b/i, "to keep shelves full and the store well presented"],
  [/\b(till|register|cash|eftpos|pos)\b/i, "carefully and accurately"],
  [/\b(clean\w*|hygiene|saniti[sz]\w*)\b/i, "to keep the workplace clean and safe"],
  [/\b(opened|opening|closed|closing)\b/i, "so the business was ready on time"],
  [/\b(train\w*|induct\w*|mentor\w*)\b/i, "so new staff could work confidently"],
  [/\b(roster\w*|schedul\w*)\b/i, "to cover each shift with the right people"],
  [/\b(reports?|reporting)\b/i, "to keep the team informed"],
  [/\b(data|spreadsheets?|records?)\b/i, "to keep records accurate and up to date"],
  [/\b(emails?|phones?|calls?|enquiries|inquiries)\b/i, "so enquiries were answered promptly"],
  [/\b(safety|whs|ohs|hazards?)\b/i, "to keep the workplace safe"],
  [/\b(patients?|residents?|participants?|clients? with)\b/i, "with care and respect for their needs"],
  [/\b(students?|children|kids|learners?)\b/i, "in a safe, supportive environment"],
  [/\b(code|software|apps?|website|testing|bugs?)\b/i, "to deliver reliable, well-tested work"],
  [/\b(drawings?|designs?|models?|cad)\b/i, "to the standard the project required"],
  [/\b(deliver\w*|despatch\w*|dispatch\w*|picking|packing|pick|pack)\b/i, "so orders went out accurately and on time"]
];
function withPurpose(b) {
  if (wordCount(b) >= 13 || /\b(to|so|so that|ensuring|for)\b [a-z]+/i.test(b.split(" ").slice(3).join(" "))) return b;
  const hit = PURPOSE.find(([re]) => re.test(b));
  return hit ? `${b} ${hit[1]}` : b;
}
function bulletPrompt(e, avoid = [], style = "") {
  return `<job>${e.title || "(title not given)"}${e.org ? ` at ${e.org}` : ""}, ${rangeOf(e) || "dates not given"}${e.current ? " (their current job: use present tense)" : " (a past job: use past tense)"}</job>
<their_answers>
Main responsibilities: ${e.answers.duties || "(not given)"}
Achievements and results: ${e.answers.wins || "(not given)"}
Tools, software, equipment: ${e.answers.tools || "(not given)"}
Who they worked with or for: ${e.answers.people || "(not given)"}
</their_answers>
<bullets_they_already_have>
${e.bullets.filter(Boolean).map(b => "- " + b).join("\n") || "(none)"}
</bullets_they_already_have>
Write new bullet points that don't repeat the ones they already have${avoid.length ? ` or these suggestions:\n${avoid.map(b => "- " + b).join("\n")}` : ""}.${style ? `
How they want them this time: ${style}. Still use only their facts.` : ""}`;
}
async function writeBullets(i, btn, mode = "new", style = "") {
  const e = P().experience[i];
  const box = $("bSugg" + i);
  if (!Object.values(e.answers).some(v => v.trim())) { box.innerHTML = `<div class="s-head"><span>Answer the questions above first, especially what you achieved.</span></div>`; return; }
  const prev = builder.sugg[i];
  const avoid = mode === "more" && prev ? prev.items.slice() : [];
  btn.disabled = true;
  const progress = m => { box.innerHTML = `<p class="progress">${esc(m)}</p>`; };
  progress(mode === "more" ? "Writing more bullet points…" : "Writing bullet points…");
  const src = [Object.values(e.answers).join("\n"), e.bullets.join("\n"), e.title, e.org].join("\n");
  const seen = new Set([...e.bullets, ...avoid].map(b => norm(b)));
  const clean = arr => (Array.isArray(arr) ? arr : []).map(b => honest(b, src, { min: 12, max: 34 })).filter(Boolean).filter(b => !seen.has(norm(b))).slice(0, 6);
  let items = [], via = "";
  try {
    const r = await aiJSON({ tier: "small", nano: BULLET_NANO, full: BULLET_RULES, examples: BULLET_EXAMPLES, prompt: bulletPrompt(e, avoid, style), schema: BULLETS_SCHEMA, label: "Writing bullet points", progress,
      check: d => { const ok = clean(d.bullets); return ok.length >= 2 ? { ok: true, value: ok } : { ok: false, why: (Array.isArray(d.bullets) ? d.bullets : []).map(b => factCheck(b, src, { noFirstPerson: true, min: 12, max: 34 })).find(Boolean) || "write at least 3 new bullet points, each a full sentence of 16 to 30 words, using their details" }; } });
    if (r.data) { items = r.data; via = ""; }
    else if (r.tried) via = aiMissWords(r);
  } finally { btn.disabled = false; }
  const ai = !!items.length;
  if (!items.length) { items = answersToBullets(e).filter(b => !seen.has(norm(b))); via = (via ? via + " " : "") + "These were made from your answers without AI. Edit them so each one is true and sounds like you."; }
  items = rankBullets(items);
  builder.genned.add(i);
  delete builder.foldOpen[i];   // new bullet points: fold the questions away
  // Written bullet points go straight onto the job, ready to edit. "Try again" swaps in the new ones for the AI's last ones (if you haven't changed them)
  const e3 = P().experience[i], added = [], was = e3.bullets.slice();
  e3.bullets = e3.bullets.filter(x => x.trim());
  const redo = mode === "redo" && items.length && prev && Array.isArray(prev.added) && prev.added.length;
  if (redo) { const old = new Set(prev.added); e3.bullets = e3.bullets.filter(x => !old.has(tidy(String(x)).replace(/[.\s]+$/, ""))); }
  for (const t of items) { const x = tidy(String(t || "")).replace(/[.\s]+$/, ""); if (x && !e3.bullets.includes(x)) { e3.bullets.push(x); added.push(x); if (ai) aiMade(x); } }
  // bullet points that all came from us (nothing typed by hand) are kept in order of importance
  const ours = x => builder.aiText.has(norm(x)) || (prev && Array.isArray(prev.added) && prev.added.includes(tidy(String(x)).replace(/[.\s]+$/, ""))) || added.includes(tidy(String(x)).replace(/[.\s]+$/, ""));
  if (e3.bullets.length > 1 && e3.bullets.every(ours)) e3.bullets = rankBullets(e3.bullets);
  if (e3.bullets.length && e3.bullets.every(x => builder.aiText.has(norm(x)))) e3.polished = polishSig("experience", e3);
  builder.sugg[i] = { items: [], added, via: ai ? "" : via, ai: ai || (prev && prev.ai) };
  builder.redoAsk = null;
  touchProfile("builder");
  keepOpen(); renderBuilder(false);
  if (redo && added.length) actToast(`Swapped in ${added.length} new bullet point${added.length === 1 ? "" : "s"}.`, () => { keepOpen(); P().experience[i].bullets = was; touchProfile("builder"); renderBuilder(false); });
  const nb = $("bSugg" + i); if (nb && !added.length) nb.insertAdjacentHTML("afterbegin", `<p class="small">No new bullet points this time. Add more detail to your answers, then try again.</p>`);
}
// What "Try again…" can ask the AI for
const REDO_STYLES = [["formal", "More formal", "more formal and polished"], ["casual", "More casual", "more casual and conversational, still professional"], ["shorter", "Shorter", "shorter: 12 to 20 words each"], ["longer", "Longer", "fuller: 24 to 32 words each, with more detail from their answers"], ["results", "More about results", "leading with the result or number wherever their answers give one"], ["people", "More about teamwork", "focused on who they worked with or for, where their answers say"]];
function suggHtml(i) {
  const s = builder.sugg[i], ask = builder.redoAsk === i
    ? `<div class="bl-alts rw-ask" data-nohelp="1"><span class="small muted">What do you want from the AI this time? Your current bullet points stay until the new ones are ready.</span><div class="opt-chips">${REDO_STYLES.map(([k, l]) => `<button type="button" class="opt-chip" data-act="redo-go" data-i="${i}" data-style="${k}">${l}</button>`).join("")}</div><div class="seg-in"><input type="text" id="bRedo${i}" maxlength="120" placeholder="Or say it yourself, e.g. lead with the tools I used" aria-label="Tell the AI what you want"><button class="btn" type="button" data-act="redo-go" data-i="${i}" data-style="custom">Write again</button></div><button class="linkish" type="button" data-act="redo-close" data-i="${i}">Close</button></div>` : "";
  if (!s) return ask;
  if (s.added) return ask + (s.via && s.added.length ? `<p class="small muted">${esc(s.via)}</p>` : "");
  if (!s.items.length) return `<div class="s-head"><span>Couldn't make bullet points from those answers. Try adding a sentence or two about what you did and what came of it.</span><button class="linkish" type="button" data-act="sugg-dismiss" data-i="${i}">Close</button></div>`;
  return `<div class="s-head"><b>Suggested bullet points</b><span class="b-actions"><button class="btn primary" type="button" data-act="sugg-all" data-i="${i}">Add all</button><button class="linkish" type="button" data-act="sugg-dismiss" data-i="${i}">Close</button></span></div>${s.items.map((t, j) => `<div class="s-row"><textarea data-sugg-edit="1" data-i="${i}" data-j="${j}" rows="2" aria-label="Suggested bullet point ${j + 1}, editable">${esc(t)}</textarea><button class="btn" type="button" data-act="sugg-add" data-i="${i}" data-j="${j}">Add</button></div>`).join("")}<p class="small muted">${esc(s.via)} You can edit a suggestion before adding it.</p>`;
}

/* --- Starting from what you already have: an old resume and your LinkedIn profile --- */
// Fill the blanks in one profile from another, and add jobs, study and skills it doesn't have yet. Nothing already typed is replaced.
function mergeProfiles(into, got) {
  const p = mergeProfile(into), g = mergeProfile(got);
  const used = e => hasContent(e) || (e.answers && Object.values(e.answers).some(v => val(v))) || (e.bullets || []).some(v => val(v));
  for (const k of ["experience", "education", "projects", "volunteering"]) p[k] = p[k].filter(used);
  const fill = (a, b, keys) => { for (const k of keys) if (!val(a[k]) && val(b[k])) a[k] = b[k]; };
  if (!val(p.contact.first) && !val(p.contact.last)) { p.contact.first = g.contact.first; p.contact.last = g.contact.last; }
  if (!val(p.contact.phone) && val(g.contact.phone)) { p.contact.phone = g.contact.phone; p.contact.phoneCode = g.contact.phoneCode; p.contact.phoneIso = g.contact.phoneIso; }
  fill(p.contact, g.contact, ["email", "location", "linkedin", "website", "workRights", "licence"]);
  fill(p.target, g.target, ["title", "stage"]);
  if (!val(p.summary) && val(g.summary)) p.summary = g.summary;
  const like = (a, b) => !!val(a) && !!val(b) && (norm(a) === norm(b) || similarity(norm(a), norm(b)) >= 0.6 || norm(a).includes(norm(b)) || norm(b).includes(norm(a)));
  const same = (a, b, [k1, k2]) => (like(a[k1], b[k1]) && (like(a[k2], b[k2]) || !val(a[k2]) || !val(b[k2]))) || (!val(a[k1]) && like(a[k2], b[k2]));
  const mergeList = (list, keys, fields) => {
    for (const x of g[list]) {
      const m = p[list].find(y => same(y, x, keys));
      if (!m) { p[list].push(x); continue; }
      fill(m, x, fields);
      if (Array.isArray(x.bullets) && x.bullets.some(b => val(b)) && !m.bullets.some(b => val(b))) m.bullets = x.bullets;
      if (x.current && !val(m.end)) m.current = true;
    }
  };
  mergeList("experience", ["title", "org"], ["title", "org", "location", "start", "end"]);
  mergeList("education", ["degree", "inst"], ["degree", "level", "subject", "inst", "location", "start", "end", "grade", "gradeType", "awards", "coursework", "project"]);
  mergeList("volunteering", ["title", "org"], ["title", "org", "start", "end"]);
  mergeList("projects", ["name", "org"], ["name", "org", "start", "end", "details"]);
  for (const k of Object.keys(p.skills)) { const have = new Set(p.skills[k].map(s => s.toLowerCase())); for (const s of g.skills[k]) if (!have.has(s.toLowerCase())) { p.skills[k].push(s); have.add(s.toLowerCase()); } }
  for (const k of ["awards", "publications", "interests", "availability"]) if (!val(p[k]) && val(g[k])) { p[k] = g[k]; p.extras[k] = true; }
  // availability read from the old resume has already been sorted into its boxes (see migrateAvailability): the work type, when they can start, days and hours
  { let got = false;
    for (const k of ["startWhen", "availDays", "availHours"]) if (!val(p[k]) && val(g[k])) { p[k] = g[k]; got = true; }
    for (const w of g.target.workTypes || []) if (!(p.target.workTypes || []).includes(w)) { (p.target.workTypes || (p.target.workTypes = [])).push(w); got = true; }
    if (got && g.extras.availability) p.extras.availability = true; }
  for (const k of ["projects", "volunteering"]) if (p[k].length && g.extras[k]) p.extras[k] = true;
  if (g.referees.mode === "list" && p.referees.mode !== "list" && g.referees.list.length) { p.referees = g.referees; p.extras.referees = true; }
  return p;
}
// An imported job's bullet points also answer the "Tell us about this job" questions, so the AI has more to work with
function answersFromBullets(e) {
  if (Object.values(e.answers).some(v => val(v)) || !e.bullets.some(b => val(b))) return;
  const bl = e.bullets.map(b => val(b).replace(/[.\s]+$/, "")).filter(Boolean);
  const wins = bl.filter(b => numsOf(b).length || /\b(award\w*|recognis\w*|recogniz\w*|promoted|won|record|top|best|first|improv\w*|increas\w*|reduc\w*|cut|saved)\b/i.test(b));
  e.answers.duties = bl.filter(b => !wins.includes(b)).join("; ");
  e.answers.wins = wins.join(". ");
  e.answers.tools = [...new Set(bl.flatMap(b => [...findSkills(norm(b)).values()].map(x => x.skill.name).filter(n => SOFTWARE.has(n) || PROGRAMMING.has(n))))].join(", ");
  const ppl = bl.map(b => (b.match(/\b(?:team of|with|for|alongside)\s+([^,;]{3,40}?(?:team|staff|customers|clients|engineers|students|patients|residents|people|members|stakeholders))\b/i) || [])[1]).filter(Boolean);
  if (ppl.length) e.answers.people = [...new Set(ppl)].slice(0, 2).join("; ");
}
// LinkedIn: "Brisbane, Queensland, Australia" → "Brisbane, QLD"
const AU_STATE_WORDS = { "new south wales": "NSW", victoria: "VIC", queensland: "QLD", "western australia": "WA", "south australia": "SA", tasmania: "TAS", "australian capital territory": "ACT", "northern territory": "NT" };
function liPlace(loc) {
  const parts = String(loc || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!parts.length) return "";
  const st = parts.map(x => AU_STATE_WORDS[x.toLowerCase()] || (/^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/.test(x) ? x : "")).find(Boolean);
  const town = parts[0].replace(/\s+(region|area|metropolitan area)$/i, "").replace(/^Greater\s+/i, "");
  const x = st ? allPlaces().find(pl => pl.key === placeKey(town) && pl.s === st) : exactPlace(town);
  return x ? placeValue(x) : "";
}
// A LinkedIn PDF wraps long lines. Lines are joined into whole entries before they are read.
const LI_MON = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?";
const LI_DATE = `(?:${LI_MON}\\s+)?\\d{4}`;
const LI_RANGE = new RegExp(`\\(?\\s*(${LI_DATE})\\s*[-–—]\\s*(Present|${LI_DATE})\\s*\\)?`, "i");
const LI_ONE = new RegExp(`\\(\\s*(${LI_DATE})\\s*\\)`, "i");
const LI_LEVELS = [
  [/^(?:high school(?: diploma)?|secondary(?: school| college)?|senior secondary|year 12|hsc|vce|qce|wace|sace)\b/i, "y12"], [/^(?:year 10|junior secondary)\b/i, "y10"],
  [/^(?:doctor(?:ate)?|ph\.?d)\b/i, "phd"], [/^masters?(?:['’]s)?\b/i, "master"], [/^bachelors?(?:['’]s)?\b[^,]*\bhon/i, "hons"], [/^bachelors?(?:['’]s)?\b/i, "bach"],
  [/^associate degree\b/i, "assoc"], [/^graduate certificate\b/i, "gcert"], [/^graduate diploma\b/i, "gdip"], [/^advanced diploma\b/i, "adip"], [/^diploma\b/i, "dip"]
];
const LI_CERT = /^certificate\s+(iv|iii|ii|i|4|3|2|1)\b\s*(?:in|of)?\s*(.*)$/i;
function liEducation(text) {
  const raw = String(text || "").split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const lines = [];
  for (const l of raw) {
    const prev = lines[lines.length - 1];
    // cut off at the end of a line: a bracket still open, or a comma, or this line starts in lower case or with a year and a bracket
    if (prev && (/\([^)]*$/.test(prev) || /[,&–-]$/.test(prev) || /^[a-z]/.test(l) || /^\d{4}\)/.test(l))) lines[lines.length - 1] = prev + " " + l; else lines.push(l);
  }
  const out = [];
  let cur = null;
  const DEG = /\b(bachelor|master|diploma|certificate|doctor|ph\.?d|year 1[0-2]|associate degree|graduate (certificate|diploma)|honours|hons|bsc|beng|mba|high school|secondary|hsc|vce|qce|wace|sace|atar)\b/i;
  const setDates = e => {
    const r = e._r, o = e._o;
    if (r) { e.start = fmtDate(r[1]); if (/present/i.test(r[2])) e.current = true; else e.end = fmtDate(r[2]); }
    else if (o) e.end = fmtDate(o[1]);
    // a finish date still ahead means they are still studying (the date is when they expect to finish)
    const en = e.end && dateEnd(e.end);
    if (en && en > new Date()) e.current = true;
  };
  for (const l of lines) {
    const g = l.match(/^Grade:?\s*(.+)$/i);
    if (g) { if (cur) cur.grade = g[1].trim(); continue; }
    const isDeg = DEG.test(l);
    if (/^(activities|societies|skills|description)\b/i.test(l) || l.length > (isDeg ? 260 : 110) || /[.!]$/.test(l) && !isDeg) continue;
    const rng = l.match(LI_RANGE), one = !rng ? l.match(LI_ONE) : null;
    if (isDeg) {
      const d = l.replace(LI_RANGE, "").replace(LI_ONE, "").replace(/[·\s]+$/, "").replace(/\s+-\s+[A-Z][A-Za-z().]*(?=\s*,|\s*$)/, "").trim();
      if (!cur || cur.degree) { cur = { ...emptyEdu() }; out.push(cur); }
      const cm = d.match(LI_CERT), ci = cm ? ["i", "ii", "iii", "iv"].indexOf(cm[1].toLowerCase()) : -1;
      const comma = d.indexOf(","), head = (comma > 0 ? d.slice(0, comma) : d).trim(), field = (comma > 0 ? d.slice(comma + 1) : "").replace(/[,·\s]+$/, "").trim();
      const hit = cm ? null : LI_LEVELS.find(([re]) => re.test(head));
      if (cm) {
        cur.level = "c" + (ci >= 0 ? ci + 1 : cm[1]); cur.subject = (cm[2] || field).replace(/,.*$/, "").trim();
      } else if (hit && (hit[1] === "y12" || hit[1] === "y10")) {
        // school: the field of study is the list of subjects
        cur.level = hit[1];
        cur.coursework = field.split(/\s*,\s*|\s+and\s+/i).map(x => x.replace(/\s+ATAR\s*$/i, "").trim()).filter(x => x && !/^ATAR$/i.test(x)).join(", ");
      } else if (hit) {
        cur.level = hit[1];
        const bare = head.replace(/^(?:doctor(?:ate)?(?: of philosophy)?|ph\.?d|masters?(?:['’]s)?|bachelors?(?:['’]s)?|associate degree|graduate certificate|graduate diploma|advanced diploma|diploma)\b/i, "").replace(/^\s*(?:degree\b)?\s*(?:of|in)?\s*/i, "").replace(/\s*\((?:hons?|honours)\)\s*/i, " ").trim();
        cur.subject = bare && field ? `${bare} (${field})` : bare || field;
      } else { cur.degree = comma > 0 && !/\(/.test(head) ? `${head} (${field})` : d; }
      if (cur.level) { syncQual(cur); }
    } else if (!rng && !one) { cur = { ...emptyEdu(), inst: l.replace(/\s*·.*$/, "") }; out.push(cur); continue; }
    if (cur) { cur._r = rng; cur._o = one; setDates(cur); delete cur._r; delete cur._o; }
  }
  return out.filter(e => e.inst || e.degree);
}
// A role's description: PDF lines are joined into sentences first (a line that doesn't end a sentence carries on from the one above),
// then each sentence is a bullet point, with "I" and "my" dropped and an action word at the start.
const LI_SELF = /^(?:additionally,?\s+|also,?\s+|furthermore,?\s+)?(?:i am|i['’]m|i possess|i have (?:a |an |strong |excellent |extensive |proven ))/i;
function liBullets(desc, current, org) {
  const items = [];
  for (const raw of String(desc || "").split("\n")) {
    const l = raw.trim();
    if (!l || /^Skills?:/i.test(l)) continue;
    const marked = /^([•▪◦·●*]|[-–—]\s)/.test(l), text = l.replace(/^([•▪◦·●*]|[-–—])\s*/, "").trim();
    const last = items[items.length - 1];
    if (!marked && last && !/[.!?]["”')]*$/.test(last)) items[items.length - 1] = last + " " + text; else items.push(text);
  }
  const co = norm(String(org || "")).split(" ").slice(0, 2).join(" ");
  const out = [];
  for (const it of items) for (let s of it.split(/(?<=[.!?])\s+(?=[A-Z“"(])/)) {
    s = s.replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "").replace(/^(?:additionally|also|furthermore),?\s+/i, "");
    if (wordCount(s) < 3 || LI_SELF.test(s)) continue;
    if (co && norm(s).startsWith(co) && /\b(is|are) (an?|the) /i.test(s.slice(0, 120))) continue;   // a line about the company, not about the person's work
    s = s.replace(/^my (?:main |key |primary )?(?:role|job|duty|duties|responsibilit(?:y|ies))(?: in (?:the|this) (?:company|team|business|organi[sz]ation))?(?: at [^,]{1,30})? (?:is|are|was|were|includes?|included|involves?|involved)(?: to)?\s+/i, "");
    s = tidyLine(s, current);
    if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 8);
}
// The headline "RMIT Master's … Student | Data Analyst | Experience in Renewables": the part that is a job title
function liTitleFrom(headline) {
  const segs = String(headline || "").split(/\s+[|·•]\s+|\s+@\s+/).map(s => s.replace(/\s+at\s+.*$/i, "").trim()).filter(Boolean);
  const bad = /\b(student|graduat\w*|aspiring|seeking|looking|experience in|open to|passionate|enthusiast\w*|undergraduate)\b/i;
  const ok = segs.filter(s => wordCount(s) <= 7 && !bad.test(s));
  return ok.find(s => { try { return !!jobTypeForTitle(s); } catch { return false; } }) || ok[0] || "";
}
// What LinkedIn's PDF or a copied profile page gives us, as a profile
function profileFromLinkedIn(li) {
  const p = emptyProfile();
  [p.contact.first, p.contact.last] = splitName(li.name || "");
  p.contact.location = liPlace(li.location);
  if (li.url) p.contact.linkedin = shortUrl(li.url);
  if (li.email) p.contact.email = String(li.email).trim().toLowerCase();
  if (li.phone) { const [c, nat] = splitPhone(li.phone, "+61"), k = countryByCode(c); if (nat) { p.contact.phone = `${c} ${nat}`; p.contact.phoneCode = c; p.contact.phoneIso = k ? k[0] : "AU"; } }
  p.target.title = liTitleFrom(li.headline);
  // an About written as "I…" isn't a resume summary: it is left for the Summary step
  if (val(li.about) && wordCount(li.about) <= 110 && !/\b(I|I['’](?:m|ve|d)|my|me)\b/.test(li.about)) p.summary = li.about.replace(/\s+/g, " ").trim();
  for (const r of liRoles(li.experience)) {
    const [a, b = ""] = r.dates.split(/\s*[-–—]\s*/);
    const org = r.company.replace(LI_TYPES, "").trim();
    const e = { ...emptyExp(), title: r.title, org, location: liPlace(r.loc), start: fmtDate(a), end: /present/i.test(b) ? "" : fmtDate(b), current: /present/i.test(b) };
    e.bullets = liBullets(r.desc, e.current, org);
    if (e.title || e.org) p.experience.push(e);
  }
  p.education = liEducation(li.education);
  for (const s of listOf(String(li.skills || "").replace(/\n/g, ","))) {
    const known = SKILLS.find(k => k.name.toLowerCase() === s.toLowerCase()), n = known ? known.name : s;
    if (SOFTWARE.has(n) || PROGRAMMING.has(n)) p.skills.software.push(n); else if (known && known.kind === "soft") p.skills.soft.push(n); else p.skills.hard.push(n);
  }
  (li.certs || []).forEach(c => p.skills.certs.push(c));
  (li.languages || []).forEach(l => { const m = String(l).match(/^(.*?)\s*\((.*)\)\s*$/); p.skills.languages.push(m ? `${m[1]} (${levelKey(m[2])})` : l); });
  return p;
}
const liAsText = li => [li.name, li.headline, li.location, li.about && "About\n" + li.about, li.experience && "Experience\n" + li.experience, li.education && "Education\n" + li.education, li.skills && "Skills\n" + li.skills, (li.certs || []).length && "Licences and certifications\n" + li.certs.join("\n")].filter(Boolean).join("\n\n");

/* With AI: a closer read, copying each detail into the right box. Anything that isn't in the text is dropped. */
const strArr = { type: "array", items: { type: "string" } };   // (a list of strings, for the AI's answers elsewhere)
// Bring in a resume (kind "resume", text) or a LinkedIn profile (kind "linkedin", li), filling in as much as possible
async function importInto(kind, input, statusEl, sourceName) {
  const text = kind === "linkedin" ? liAsText(input) : String(input || "");
  if (kind === "resume" && (!text || wordCount(text) < 30)) { statusEl.textContent = "That doesn't look like enough resume text to read."; statusEl.classList.add("err"); return false; }
  if (kind === "linkedin" && !(input.experience || input.education || input.headline || input.name)) { statusEl.textContent = `Couldn't find your profile sections in ${sourceName}. Try LinkedIn's PDF instead.`; statusEl.classList.add("err"); return false; }
  statusEl.classList.remove("err");
  // The cover letter page: what is read is used for that letter only, and nothing is added to the profile
  const set0 = fileSetFor(statusEl);
  if (set0 && set0.temp) {
    const real = profile.data, got0 = kind === "linkedin" ? profileFromLinkedIn(input) : profileFromText(text), t = mergeProfile(mergeProfiles(emptyProfile(), got0));
    t.cv = real.cv; t.prefs = real.prefs;   // (the letter's design choices stay the profile's own)
    t.target.title = val(t.target.title) ? t.target.title : real.target.title;
    t.target.jobType = jobTypeForTitle(t.target.title) || real.target.jobType || "";
    ltTemp = t;
    const nj = t.experience.filter(hasContent).length, nq = t.education.filter(hasContent).length, ns = Object.values(t.skills).flat().length;
    const what = [nj ? `${nj} job${nj === 1 ? "" : "s"}` : "", nq ? `${nq} qualification${nq === 1 ? "" : "s"}` : "", ns ? `${ns} skill${ns === 1 ? "" : "s"}` : ""].filter(Boolean);
    statusEl.innerHTML = `<b>Read ${esc(sourceName)}</b><ul class="imp-list"><li>${what.length ? `Found ${esc(listJoin(what))}.` : "Nothing found to use."}</li><li>Used for this letter only. Nothing was added to your profile.</li></ul>`;
    return true;
  }
  const before = JSON.parse(JSON.stringify(P()));
  // An uploaded resume or LinkedIn profile is read by Job Finder's own rules only: the AI is never given it
  const got = kind === "linkedin" ? profileFromLinkedIn(input) : profileFromText(text);
  const merged = mergeProfiles(before, got);
  // keep what an old resume can't tell us
  merged.target.jobType = before.target.jobType || jobTypeForTitle(merged.target.title) || "";
  merged.cv = before.cv; merged.prefs = before.prefs;
  merged.experience.forEach(answersFromBullets);
  if (merged.education.some(e => e.current) && !merged.target.stage) merged.target.stage = "student";
  replaceProfile(merged, "import");
  if (kind === "linkedin") liFillFromImport(input);
  builder.undo = hasProfile(before) ? before : null;
  builder.open = openSets();
  for (const l of ["experience", "education", "projects", "volunteering"]) builder.open[l] = new Set(P()[l].map((_, i) => i));
  const p = P(), n = (a, b) => Math.max(0, a - b);
  const jobs = n(p.experience.filter(hasContent).length, before.experience.filter(hasContent).length), quals = n(p.education.filter(hasContent).length, before.education.filter(hasContent).length);
  const skills = n(Object.values(p.skills).flat().length, Object.values(before.skills).flat().length);
  const what = [jobs ? `${jobs} job${jobs === 1 ? "" : "s"}` : "", quals ? `${quals} qualification${quals === 1 ? "" : "s"}` : "", skills ? `${skills} skill${skills === 1 ? "" : "s"}` : ""].filter(Boolean);
  const inWelcome = statusEl === $("bImportStatus") && !!builder.welcome;
  if (fileSetFor(statusEl) && !statusEl.jfBase) statusEl.jfBase = before;   // brought in from the opening page: stay there until Next is pressed
  const aboutNote = kind === "linkedin" && val(input.about) && !val(P().summary);
  statusEl.innerHTML = `<b>Read ${esc(sourceName)}</b><ul class="imp-list">`
    + (what.length ? `<li>Added ${esc(listJoin(what))}.</li>` : `<li>Nothing new to add, but blanks were filled in.</li>`)
    + `<li>Jobs and qualifications are drafts. Check each step and answer the questions to strengthen them.</li>`
    + (aboutNote ? `<li>Your LinkedIn About is written as “I”, so it wasn't used as your summary. The Summary step writes one for you.</li>` : "")
    + `</ul>${builder.undo ? '<button class="linkish" type="button" id="bUndoImport">Undo</button>' : ""}`;
  const u = $("bUndoImport");
  if (u) u.onclick = () => { replaceProfile(builder.undo, "import"); builder.undo = null; statusEl.textContent = "Restored your previous answers."; statusEl.jfBase = null; bClearFileCards(fileSetFor(statusEl) || undefined); };
  // from the opening page, the person goes on by pressing Next (see 20i); from anywhere else this goes straight to the questions
  if (!inWelcome) {
    const box = $("bImport");
    if (box && !box.hidden && statusEl === $("bImportStatus")) { box.hidden = true; const ib = $("bImportBtn"); if (ib) ib.setAttribute("aria-expanded", "false"); }
    builder.welcome = false;
  }
  toast(kind === "linkedin" ? "LinkedIn profile successfully loaded" : "Resume successfully loaded", "ok");
  return true;
}
// Older callers: a resume's text
const importResumeText = (text, statusEl, sourceName) => importInto("resume", text, statusEl, sourceName);
// The LinkedIn page's boxes get the same details, so they're ready there too
function liFillFromImport(li) {
  try {
    const inp = linStore.data.input;
    for (const k of ["headline", "about", "experience", "skills", "education"]) if (!val(inp[k]) && val(li[k])) inp[k] = li[k];
    if (li.url && !inp.url) inp.url = shortUrl(li.url);
    Object.assign(inp.checks, li.checks || {});
    linStore.save();
  } catch { /* the LinkedIn page isn't ready */ }
}
// The file that was brought in, shown in place of its drop box: the type's icon, then the name
const FILE_KINDS = { pdf: ["PDF", "#d64545"], doc: ["DOC", "#2b6fd6"], docx: ["DOC", "#2b6fd6"], txt: ["TXT", "#6b7280"] };
function fileIconSvg(name) {
  const ext = ((String(name).match(/\.([a-z0-9]+)$/i) || [])[1] || "").toLowerCase(), [label, color] = FILE_KINDS[ext] || [ext.slice(0, 4).toUpperCase() || "FILE", "#6b7280"];
  return `<svg class="b-file-ico" viewBox="0 0 40 48" role="img" aria-label="${esc(label)} file"><path d="M6 2h20l10 10v32a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="var(--surface)" stroke="${color}" stroke-width="2"/><path d="M26 2v10h10" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><rect x="4" y="26" width="26" height="12" rx="2" fill="${color}"/><text x="17" y="35.5" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">${esc(label)}</text></svg>`;
}
// The opening pages that take a file: where the drop box, its card and the paste box are, and which message line they use.
// "base" is the profile from before the file was read (kept on the message line), so a different file can replace it.
// "next" is the box holding that page's blue Next button, which only shows once something has been uploaded to the profile.
const FILE_SETS = {
  builder: { name: "builder", status: "bImportStatus", drop: "bDrop", card: "bFileCard", paste: "bLiPasteBox", input: "bFile", next: "bImportNextBox", takesProfile: true, autoRead: true, howto: "bLiHowto" },   // (autoRead: a file chosen here is read straight away, with no button to press)
  letter: { name: "letter", status: "ltwStatus", drop: "ltwResDrop", card: "ltwFileCard", paste: "ltwPasteBox", input: "ltwResFile", next: "ltwNextBox", takesProfile: false, temp: true, autoRead: true, doneText: "Read. Used for this letter only" },
  linkedin: { name: "linkedin", status: "liwStatus", drop: "liwResDrop", card: "liwFileCard", paste: "liwPasteBox", input: "liwResFile", next: "liwNextBox", takesProfile: true },
  letterOld: { name: "letterOld", status: "ltwLetterStatus", drop: "ltwDrop", card: "ltwLetterCard", paste: "", input: "ltwFile", next: "ltwNextBox", takesProfile: false, autoRead: true, doneText: "Read. Your letter is in the paragraphs" }   // an old cover letter: no profile to take back
};
const fileSetFor = statusEl => statusEl ? [FILE_SETS.builder, FILE_SETS.letter, FILE_SETS.linkedin].find(f => $(f.status) === statusEl) || null : null;
// Next is there once a file (or pasted page) has been uploaded to the profile, and goes again when it is taken back out
function bSyncNext(set) {
  const box = set && set.next && $(set.next);
  if (box) box.hidden = !Object.values(FILE_SETS).some(f => f.next === set.next && f.done);
}
// Create or edit resume (autoRead): a file that is chosen is read at once and its details fill in the questions. There is no upload button.
// The other opening pages (cover letter, LinkedIn): a file that has been chosen is only a card until "Upload to profile" is pressed.
// (A file already read shows the same card with "Choose a different file", which takes it back out.)
// staged: true = chosen, not read yet; "reading" = being read now; "failed" = could not be read
function bShowFileCard(file, set = FILE_SETS.builder, staged = false) {
  const card = $(set.card), drop = $(set.drop); if (!card || !drop) return;
  const swap = `<button class="linkish" type="button" data-file-swap="${set.name}">Choose a different file</button>`;
  const action = staged === "reading" ? `<span class="tl-found busy" role="status">Reading it…</span>`
    : staged === "failed" ? swap
    : staged ? `<button class="btn primary" type="button" data-file-commit="${set.name}">Upload to profile</button>${swap}`
    : `<span class="tl-found">${set.autoRead ? (set.doneText || "Read. Your details are filled in") : "Uploaded to your profile"}</span>${swap}`;
  card.innerHTML = `${fileIconSvg(file.name)}<span class="b-file-name">${esc(file.name)}</span>${action}`;
  card.hidden = false; drop.hidden = true;
  const how = set.howto && $(set.howto); if (how) how.hidden = true;   // (the LinkedIn steps are only for before the file is in)
  const paste = set.paste && $(set.paste); if (paste) { paste.open = false; paste.hidden = true; }   // one file only: the paste box goes away until it is removed
  set.done = staged === false; bSyncNext(set);
}
const stagedFiles = {};
function bStageFile(file, set = FILE_SETS.builder) {
  if (!file) return;
  stagedFiles[set.name] = file;
  const st = $(set.status);
  if (set.autoRead) { if (st) { st.classList.remove("err"); st.textContent = ""; } bShowFileCard(file, set, "reading"); return bCommitFile(set); }
  if (st) { st.classList.remove("err"); st.textContent = "Press Upload to profile to read this file into your profile. Nothing is added until you do."; }
  bShowFileCard(file, set, true);
}
async function bCommitFile(set) {
  const file = set && stagedFiles[set.name]; if (!file) return;
  const st = $(set.status), btn = $(set.card) && $(set.card).querySelector("[data-file-commit]");
  if (btn) btn.disabled = true;
  let ok;
  if (set.name === "letterOld") ok = await ltImportFile(file);
  else { await builderImportFile(file, st); ok = !st.classList.contains("err"); }
  if (!ok) { if (set.autoRead) bShowFileCard(file, set, "failed"); else if (btn && btn.isConnected) btn.disabled = false; return; }   // the card stays, with the reason on the message line, so another try or another file is one press away
  delete stagedFiles[set.name];
  bShowFileCard(file, set);
  if (set.onDone) set.onDone(file);
}
function bClearFileCards(set) {
  for (const f of set ? [set] : Object.values(FILE_SETS)) {
    const card = $(f.card), drop = $(f.drop), paste = f.paste && $(f.paste), how = f.howto && $(f.howto);
    if (how) how.hidden = false;
    if (card) { card.hidden = true; card.textContent = ""; }
    if (drop) drop.hidden = false;
    if (paste) paste.hidden = false;
    f.done = false; delete stagedFiles[f.name]; bSyncNext(f);
  }
}
// "Choose a different file": a file already uploaded is taken back out first, so the new one replaces it rather than adding to it
function bSwapFile(set) {
  if (!set) return;
  if (set.temp) ltTemp = null;   // the file brought in for the letter is let go
  const st = $(set.status);
  if (set.takesProfile && st && st.jfBase) { replaceProfile(st.jfBase, "import"); st.jfBase = null; builder.undo = null; }
  bClearFileCards(set);
  if (st) { st.classList.remove("err"); st.textContent = ""; }
  $(set.input).click();
}
// Only one file at a time: a drop of several takes none of them
function bOneFile(files, statusEl) {
  if (files && files.length > 1) { statusEl.classList.add("err"); statusEl.textContent = "Add one file at a time: your resume or your LinkedIn PDF."; return null; }
  return files && files[0] || null;
}
// LinkedIn without a file: the profile page copied and pasted
async function importPastedLinkedIn(textId, st) {
  const t = $(textId).value;
  if (wordCount(t) < 20) { st.classList.add("err"); st.textContent = "Paste your whole LinkedIn profile page first: press Ctrl+A then Ctrl+C on it (Cmd on a Mac)."; return; }
  if (await importInto("linkedin", liFromPage(t), st, "your LinkedIn page")) {
    $(textId).value = ""; bAfterImport(st);
    const set = fileSetFor(st); if (set) bShowFileCard({ name: "Pasted LinkedIn page.txt" }, set);
  }
}
// After something is read in: the resume builder starts at the first step; the cover letter page just draws itself again with what it read
function bAfterImport(statusEl) {
  const s = fileSetFor(statusEl);
  if (s && s.temp) { if (typeof renderLetterPage === "function") renderLetterPage(); return; }
  builder.step = 0; renderBuilder(false);
}
async function builderImportFile(file, statusEl) {
  if (!file) return;
  statusEl.classList.remove("err");
  statusEl.textContent = `Reading ${file.name}…`;
  try {
    const { text } = await readFile(file);
    // a LinkedIn "Save to PDF" file dropped in the resume box is read as LinkedIn
    const li = /\.pdf$/i.test(file.name) && /\b(Top Skills|Contact)\b[\s\S]{0,400}\b(linkedin\.com\/in\/|Experience)\b/.test(text) ? await readLinkedInPdf(file).catch(() => null) : null;
    if (li && (li.experience || li.education)) { if (await importInto("linkedin", li, statusEl, file.name)) { bAfterImport(statusEl); { const set = fileSetFor(statusEl); if (set) bShowFileCard(file, set); } } return; }
    if (await importInto("resume", text, statusEl, file.name)) { bAfterImport(statusEl); { const set = fileSetFor(statusEl); if (set) bShowFileCard(file, set); } }
  } catch (e) { statusEl.classList.add("err"); statusEl.textContent = e && e.message ? e.message : "Couldn't read that file."; }
}
async function builderImportLinkedIn(file, statusEl) {
  if (!file) return;
  statusEl.classList.remove("err"); statusEl.textContent = `Reading ${file.name}…`;
  try {
    if (!/\.pdf$/i.test(file.name)) throw new Error("Use the PDF from LinkedIn's “Save to PDF”, or paste your profile page below.");
    if (await importInto("linkedin", await readLinkedInPdf(file), statusEl, file.name)) { bAfterImport(statusEl); const set = fileSetFor(statusEl); if (set) bShowFileCard(file, set); }
  } catch (e) { statusEl.classList.add("err"); statusEl.textContent = e && e.message ? e.message : "Couldn't read that file. Paste your profile page instead."; }
}

/* --- Wiring --- */
onInit(() => {
  const f = $("bForm");
  f.addEventListener("input", onBuilderInput);
  // "change" (leaving a box) is when names get capitals, dates get tidied and so on
  f.addEventListener("change", e => { if (e.target.type !== "checkbox") onBuilderInput(e); });
  f.addEventListener("click", onBuilderClick);
  $("bSteps").addEventListener("click", onBuilderClick);
  f.addEventListener("focusin", e => { if (e.target.dataset && e.target.dataset.bullet) builder.lastBullet = e.target; });
  f.addEventListener("keydown", e => {
    const t = e.target;
    if (t.dataset && t.dataset.chipIn && (e.key === "Enter" || e.key === ",")) { e.preventDefault(); const k = t.dataset.chipIn, v = t.value; t.value = ""; addChip(k, v, { focus: true }); }
    else if (t.dataset && t.dataset.chipIn && e.key === "Backspace" && !t.value) { const k = t.dataset.chipIn, arr = P().skills[k]; if (arr.length) { arr.pop(); touchProfile("builder"); rerenderChips(k); } }
  });
  f.addEventListener("focusout", e => { const t = e.target; if (t.isConnected && t.dataset && t.dataset.chipIn && t.value.trim()) { const v = t.value; t.value = ""; setTimeout(() => addChip(t.dataset.chipIn, v), 0); } });
  // (a closed card can't measure its text boxes, so they are sized when it opens)
  // A "toggle" also fires when a step is drawn with an employer already open, so only a press on the employer itself (not the jobs in it) may fold its jobs away
  f.addEventListener("click", e => { const s = e.target.closest && e.target.closest("details.b-co > summary"); if (s && !e.target.closest("[data-act]")) s.parentElement.dataset.pressed = "1"; }, true);
  f.addEventListener("toggle", e => {
    const g = e.target.matches && e.target.matches("details.b-co") ? e.target : null;
    if (g) {
      const k = g.dataset.group, pressed = g.dataset.pressed === "1"; delete g.dataset.pressed;
      if (g.open) builder.openCo.add(k);
      else { builder.openCo.delete(k); if (pressed) g.querySelectorAll("details.b-role[open]").forEach(r => { r.open = false; }); }   // closing the employer folds its jobs too
      keepOpen(); return;
    }
    if (e.target.matches && e.target.matches("details.b-card")) { keepOpen(); if (e.target.open) e.target.querySelectorAll("textarea").forEach(autoGrow); } }, true);
  $("bPick").addEventListener("click", () => $("bFile").click());
  $("bFile").addEventListener("change", async () => { const st = $("bImportStatus"), f = bOneFile($("bFile").files, st); $("bFile").value = ""; if (f) bStageFile(f, FILE_SETS.builder); });
  ["dragenter", "dragover"].forEach(t => $("bDrop").addEventListener(t, e => { e.preventDefault(); $("bDrop").classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => $("bDrop").addEventListener(t, e => { e.preventDefault(); $("bDrop").classList.remove("over"); }));
  $("bDrop").addEventListener("drop", e => { const st = $("bImportStatus"), f = e.dataTransfer && bOneFile(e.dataTransfer.files, st); if (f) bStageFile(f, FILE_SETS.builder); });
  $("bFromScanner").addEventListener("click", async () => { if (await importResumeText(finalText(), $("bImportStatus"), "the resume from Tailor to a job")) { builder.step = 0; renderBuilder(false); FILE_SETS.builder.done = true; bSyncNext(FILE_SETS.builder); } });
  $("bLiPasteGo").addEventListener("click", () => importPastedLinkedIn("bLiPaste", $("bImportStatus")));
  // (a whole page pasted in is read straight away, as a file is)
  $("bLiPaste").addEventListener("paste", () => setTimeout(() => { if (wordCount($("bLiPaste").value) >= 60) importPastedLinkedIn("bLiPaste", $("bImportStatus")); }, 60));
  // (the card that replaces a drop box once its file is in: "Choose a different file" opens the picker again)
  document.addEventListener("click", e => { const b = e.target.closest("[data-file-swap]"); if (b) bSwapFile(FILE_SETS[b.dataset.fileSwap]); const c = e.target.closest("[data-file-commit]"); if (c) bCommitFile(FILE_SETS[c.dataset.fileCommit]); });
  $("bReset").addEventListener("click", () => {
    const b = $("bReset");
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Clear all my answers?"; setTimeout(() => { b.dataset.sure = ""; b.textContent = "Start fresh"; }, 4000); return; }
    b.dataset.sure = ""; b.textContent = "Start fresh";
    builder.undo = JSON.parse(JSON.stringify(P()));
    replaceProfile(emptyProfile(), "reset"); $("bImportStatus").jfBase = null; bClearFileCards(FILE_SETS.builder);
    builder.step = 0; builder.sugg = {}; builder.open = openSets();
    renderBuilder(true);
    const st = $("bImportStatus"); showWelcome(); $("bImport").hidden = false; st.innerHTML = 'Cleared. <button class="linkish" type="button" id="bUndoReset">Undo</button>';
    $("bUndoReset").onclick = () => { replaceProfile(builder.undo, "import"); builder.undo = null; builder.welcome = false; renderBuilder(false); toast("Restored your answers.", "ok"); };
  });
  // (wait for the saved profile first: opening the page straight onto #builder must not mistake a saved resume for a blank one)
  viewHooks.builder = () => profileReady.then(() => {
    if (!P().experience.length) P().experience.push(emptyExp());
    if (!P().education.length) P().education.push(emptyEdu());
    // the first visit with nothing filled in opens on "how do you want to start?"
    if (builder.welcome === undefined) builder.welcome = isFreshProfile(P());
    renderBuilder(false);
  });
  onProfile(src => {
    if (currentView === "builder" && src !== "builder") renderBuilder(false);
  });
});

