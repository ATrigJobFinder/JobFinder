/* ===================== Resume creator ===================== */
const P = () => profile.data;
// Layout first (so the preview looks right from the start); the summary near the end, so it can draw on everything else
const B_STEPS = [
  { key: "layout", label: "Layout" }, { key: "goal", label: "Goal" }, { key: "contact", label: "Contact" }, { key: "experience", label: "Experience" },
  { key: "education", label: "Education" }, { key: "skills", label: "Skills" }, { key: "extras", label: "Extras" }, { key: "summary", label: "Summary" }, { key: "review", label: "Review" }
];
const SN = k => B_STEPS.findIndex(s => s.key === k);
const kicker = k => `Step ${SN(k) + 1} of ${B_STEPS.length}`;
const openSets = () => ({ experience: new Set([0]), education: new Set([0]), projects: new Set([0]), volunteering: new Set([0]), referees: new Set([0]), extras: new Set() });
const builder = { step: 0, open: openSets(), lastBullet: null, sugg: {}, undo: null, visited: new Set([0]), genned: new Set(), alts: {}, fixAsk: null, showSummary: false, sumPrefilled: false, pendingGoto: null, check: null, tplFilter: [], tplShow: 12, sumAlts: null, moreSugg: {}, foldOpen: {}, extraSec: {} };
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
  const badDate = o.date && val(raw) && !dateOk(raw);
  const descIds = [o.hint ? id + "_h" : "", o.date ? id + "-msg" : ""].filter(Boolean).join(" ");
  const desc = descIds ? ` aria-describedby="${descIds}"` : "";
  const words = ["name", "surname", "title", "jobtitle"].includes(o.cap);
  const extra = `${o.cap ? ` data-cap="${o.cap}"` : ""}${o.date ? ' data-date="1"' : ""}${o.inputmode ? ` inputmode="${o.inputmode}"` : ""}${words ? ' autocapitalize="words"' : ""}${o.prose ? ' data-prose="1" spellcheck="true" autocapitalize="sentences"' : ""}${badDate ? ' class="bad" aria-invalid="true"' : ""}`;
  let input;
  if (o.area) input = `<textarea id="${id}" data-path="${path}"${o.lines ? ' data-lines="1"' : ""}${o.multi || o.lines ? ' data-multiline="1"' : ""} rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}"${desc}${o.spell === false ? ' spellcheck="false"' : ' spellcheck="true" data-prose="1" autocapitalize="sentences"'}>${esc(o.lines ? (v || []).join("\n") : v || "")}</textarea>`;
  else if (o.select) input = `<select id="${id}" data-path="${path}"${desc}${o.rerender ? ' data-rerender="1"' : ""}>${o.select.map(x => { const [k, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(k)}"${k === (v || "") ? " selected" : ""}>${esc(l || "Choose…")}</option>`; }).join("")}</select>`;
  else input = `<input type="${o.type || "text"}" id="${id}" data-path="${path}" value="${esc(v || "")}" placeholder="${esc(o.ph || "")}" autocomplete="${o.ac || "off"}"${extra}${desc}${o.suggest ? ` data-suggest="${o.suggest}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-sl"` : ""}>`;
  if (o.suggest) input = `<div class="pick sugg">${input}<ul class="pick-list" id="${id}-sl" role="listbox" aria-label="${esc(String(label).replace(/<[^>]+>/g, ""))} suggestions" hidden></ul></div>`;
  const msg = o.date ? `<p class="pick-msg${badDate ? " err" : ""}" id="${id}-msg" role="status">${badDate ? esc(DATE_HELP) : ""}</p>` : "";
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
// Every industry as a grid of equal tiles, so choosing one never moves the others.
// Once one is picked the grid folds away to that choice, with a Change button.
function jobTypeQ(label, hint) {
  const cur = P().target.jobType, folded = !!cur && !builder.jobTypeOpen;
  const grid = folded
    ? `<div class="job-picked"><button type="button" class="opt-tile" aria-pressed="true" data-act="jobtype-open" aria-label="${esc(jobLabel(cur))} is chosen. Change it">${esc(jobLabel(cur))}</button><button class="linkish" type="button" data-act="jobtype-open">Change</button></div>`
    : `<div class="opt-grid" role="group" aria-labelledby="bJobTypeL">${JOB_TYPES.map(x => `<button type="button" class="opt-tile" data-act="pick" data-path="target.jobType" data-val="${esc(x.key)}" aria-pressed="${cur === x.key}">${esc(x.label)}</button>`).join("")}</div>`;
  return `<div class="q"><div class="q-label" id="bJobTypeL">${label}</div>${hint && !folded ? `<p class="q-hint">${hint}</p>` : ""}${grid}</div>`;
}
// The design's colours, in the Layout step and again in Review
function colourQ() {
  const t = builderTpl();
  return `<div class="q"><div class="q-label" id="bColL">Colour</div><div class="swatches" role="group" aria-labelledby="bColL">${t.accents.map(a => `<button type="button" class="swatch" data-act="accent" data-val="${a}" style="background:${a}" aria-pressed="${a === builderAccent(t)}" aria-label="Accent colour ${a}"></button>`).join("")}</div>
        <p class="q-hint">${esc(t.name)}: ${esc(t.blurb)}${t.ats ? "" : " It has two columns, which some online application systems read out of order. For job portals, a single-column design like Professional is safer."}</p></div>`;
}
const stepHead = (kicker, title, intro) => `<div class="b-step-head"><span class="kicker">${kicker}</span><h2 id="bStepTitle" tabindex="-1">${title}</h2>${intro ? `<p>${intro}</p>` : ""}</div>`;
// Skills the job ad names, for "Asked for in the ad"
const skillsInAd = ad => [...findSkills(norm(String(ad || ""))).values()].sort((a, b) => b.count - a.count).map(x => x.skill.name);

/* --- The steps --- */
const STEP_RENDER = {
  layout() {
    const t = builderTpl();
    return stepHead(kicker("layout"), "Choose your layout", "Pick a design before you start. Your resume takes shape in it as you go, and you can change it at any time.")
      + jobTypeQ("What kind of work is it for?", "Pick the closest one. Designs that suit it are shown first.")
      + `<div class="q"><div class="q-label" id="bTplL">Design</div><p class="q-hint">Choose as many filters as you like: a design has to match one choice from each row you use.</p>${tplFilterHtml(builder.tplFilter, "data-act=\"tpl-filter\" data-val")}<div class="b-tpls" role="group" aria-labelledby="bTplL">${layoutCards()}</div>${layoutMore()}</div>`
      + colourQ()
      + pageSetupQ();
  },
  goal() {
    const p = P(), st = p.target.stage;
    const tips = {
      student: "Part-time jobs, volunteering, clubs and uni projects all count. Graduate recruiters expect them, and they show reliability.",
      early: "Lead with your most recent role and show results, not duties. One page is ideal, two at most.",
      experienced: "Focus on the last 10 to 15 years and your biggest results. Two pages is normal.",
      change: "Lead with the skills that carry over to the new field, and use your summary to explain the move in one line.",
      returning: "List the gap simply (for example “Career break: caring for family”) and include any courses or volunteering since."
    };
    return stepHead(kicker("goal"), "What job are you going for?", "A resume works best when it's written for one kind of job. Your answers here shape the questions and tips that follow.")
      + q("target.title", "What job title are you aiming for?", { hint: "Start typing and pick from the list, or type your own if it isn't there. It becomes the headline under your name, and recruiters search on it.", ph: "e.g. Graduate Mechanical Engineer", suggest: "titles", cap: "jobtitle" })
      + (p.target.jobType ? `<p class="q-hint">Kind of work: <b>${esc(jobLabel(p.target.jobType))}</b>. <button class="linkish" type="button" data-act="pick" data-path="target.jobType" data-val="">Change</button></p>` : jobTypeQ("What kind of work is it?", "This shapes the skill suggestions that follow."))
      + chipQ("target.stage", "Where are you in your career?", "Students and recent graduates lead with education. Everyone else leads with experience.", STAGES)
      + (st ? `<p class="tip">${tips[st]}</p>` : "");
  },
  contact() {
    return stepHead(kicker("contact"), "How can employers reach you?", "Recruiters call more often than they email, so check your number.")
      + `<div class="q-grid">${q("contact.first", "First name", { ph: "e.g. Alex", ac: "given-name", cap: "name" })}${q("contact.last", "Last name", { ph: "e.g. Nguyen", ac: "family-name", cap: "surname" })}${phoneQ()}${q("contact.email", "Email", { type: "email", ph: "e.g. alex.nguyen@email.com", ac: "email", hint: "Use a plain, professional address." })}${locQ("contact.location", "Suburb and state", { ac: true, hint: "Enough to show you're local. Not your street address." })}${q("contact.linkedin", "LinkedIn", { opt: true, ph: "linkedin.com/in/your-name", ac: "url" })}${q("contact.website", "Portfolio, GitHub or website", { opt: true, ph: "e.g. github.com/your-name", ac: "url" })}${q("contact.workRights", "Work rights", { opt: true, select: WORK_RIGHTS, hint: "Worth stating if your name or study history might make employers wonder." })}${q("contact.licence", "Driver's licence", { opt: true, ph: "e.g. Full C class licence, own car", hint: "Include it for field, trade, sales or travel roles.", suggest: "licence" })}</div>`
      + `<p class="tip">Leave out your date of birth, photo, marital status and full street address. Australian employers don't need them, and they can invite bias.</p>`
      + `<p class="b-check" id="bContactCheck"></p>`;
  },
  summary() {
    const p = P(), filled = prefillSummaryQ(p);
    const show = !!p.summary.trim() || builder.showSummary;
    return stepHead(kicker("summary"), "Your profile in three sentences", "The short paragraph at the top. It's written last, so it can draw on everything you've added. Recruiters often decide whether to keep reading from this alone.")
      + (filled ? `<p class="tip">We've started these answers from your earlier steps. Change anything that doesn't sound like you, then write your summary.</p>` : "")
      + q("summaryQ.who", "In one line, how would you describe yourself professionally?", { area: true, rows: 2, ph: "e.g. Final-year mechanical engineering student with internship experience in solar projects" })
      + q("summaryQ.strengths", "What are your two or three strongest skills for this kind of job?", { area: true, rows: 2, ph: "e.g. CAD design in SolidWorks, technical reports, working with site teams" })
      + q("summaryQ.proof", "What's one result you're proud of that backs that up?", { area: true, rows: 2, ph: "e.g. Cut a bracket's weight by 18% during my internship", hint: "A number makes it stick: how many, how much, how fast." })
      + q("summaryQ.next", "What are you looking for next?", { area: true, rows: 2, ph: "e.g. A graduate role in renewable energy design" })
      + `<div class="b-actions"><button class="btn primary" type="button" data-act="ai-summary">${p.summary.trim() ? "Write it again" : "Write my summary"}</button>${show ? "" : '<button class="linkish" type="button" data-act="sum-self">or write it myself</button>'}<span class="engine-note" id="bSumEngine"></span></div>`
      + (show ? q("summary", "Your summary", { area: true, rows: 5, multi: true, hint: "Edit it until it sounds like you. Aim for 40 to 75 words, no “I”, no clichés.", after: `<p class="b-check" id="bSumCheck"></p><div id="bSumActs">${summaryActions()}</div>` }) : "");
  },
  experience() {
    const p = P();
    return stepHead(kicker("experience"), "Your work experience", "Newest first. Paid work, internships and substantial unpaid roles all count. For each job, answer the questions, turn them into bullet points, then finish the job to add it to your resume.")
      + p.experience.map((e, i) => expCard(e, i)).join("")
      + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="experience">+ Add a job</button>${sortBtn("experience")}</div>`
      + verbsHelp();
  },
  education() {
    const p = P();
    const tip = stageOf(p) === "student" ? "Your education goes first on your resume while you're studying or recently graduated." : "After a few years of work, education sits below experience. You can drop high school and ATAR.";
    return stepHead(kicker("education"), "Your education", "Degrees, diplomas, TAFE, school and certificates. Newest first. Finish each one to add it to your resume.")
      + `<p class="tip">${tip}</p>`
      + p.education.map((e, i) => eduCard(e, i)).join("")
      + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="education">+ Add a qualification</button>${sortBtn("education")}</div>`;
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
    const box = (key, label, inner) => `<div class="b-card${p.extras[key] ? "" : " off"}${p.extrasDone[key] ? " done" : ""}"><div class="b-card-body"><div class="b-extra-head"><label class="q-check"><input type="checkbox" data-path="extras.${key}" data-rerender="1"${p.extras[key] ? " checked" : ""}> <b>${label}</b></label>${p.extras[key] && p.extrasDone[key] ? '<span class="card-tag done">On your resume</span>' : ""}</div>${p.extras[key] ? inner : ""}</div></div>`;
    return stepHead(kicker("extras"), "Anything else worth showing?", "Tick the sections you want. They're optional, but projects, volunteering and awards can make a short resume stand out. Finish adds each one to your resume.")
      + box("availability", "Availability", `<div class="q-grid">${startQ()}${q("availability", "Days and hours you can work", { opt: true, hint: "Useful for casual, retail and hospitality roles.", ph: "e.g. Weekends and Thursday nights; full time over summer", prose: true })}</div>`)
      + box("projects", "Projects", p.projects.map((x, i) => projCard(x, i)).join("") + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="projects">+ Add a project</button></div><p class="q-hint">University, personal or work projects. Say what you built and what came of it.</p>`)
      + box("volunteering", "Volunteering", p.volunteering.map((x, i) => volCard(x, i)).join("") + `<div class="b-actions"><button class="btn" type="button" data-act="add" data-list="volunteering">+ Add a role</button></div>`)
      + box("awards", "Awards and achievements", q("awards", "One per line", { area: true, multi: true, rows: 3, ph: "e.g. Dean's List, 2024\nEmployee of the Month, Kmart Chadstone, March 2023", after: `<div class="x-wrap" data-xr="awards.0">${extraRewordHtml("awards", 0)}</div>` }) + textFoot("awards"))
      + box("publications", "Publications", q("publications", "One per line, in your field's citation style", { area: true, multi: true, rows: 3 }) + textFoot("publications"))
      + box("interests", "Interests", q("interests", "A short line", { hint: "Only if they say something useful about you: a team sport, a club you run, a relevant hobby.", ph: "e.g. Club cricket, building mechanical keyboards", prose: true }) + textFoot("interests"))
      + box("referees", "Referees", refereesBlock());
  },
  review() {
    const h = resumeHealth(P());
    const col = h.score >= 80 ? "var(--good)" : h.score >= 60 ? "var(--accent)" : "var(--warn)";
    const icon = s => s === "pass" ? '<span class="ico pass">✓</span>' : s === "warn" ? '<span class="ico warn">!</span>' : '<span class="ico fail">!</span>';
    const sorted = [...h.items.filter(i => i.status === "fail"), ...h.items.filter(i => i.status === "warn"), ...h.items.filter(i => i.status === "pass")];
    const t = builderTpl(), p = P();
    return stepHead(kicker("review"), "Check and download", "A quick check of what recruiters and applicant tracking systems look for, an AI read-through of the whole resume, then choose what goes on this version.")
      + `<div class="health"><div class="health-num" style="border-color:${col}"><div><b>${h.score}</b><span>out of 100</span></div></div><div><p><b>${h.score >= 80 ? "Strong. Ready to send." : h.score >= 60 ? "Good. A few fixes will make it stronger." : "Getting there. Fix the items marked below."}</b></p><p class="small muted">${h.items.filter(i => i.status !== "pass").length} thing${h.items.filter(i => i.status !== "pass").length === 1 ? "" : "s"} to improve.</p></div></div>`
      + `<ul class="health-list">${sorted.map(i => `<li>${icon(i.status)}<span>${esc(i.text)}</span>${i.status !== "pass" && i.step != null ? `<button class="linkish" type="button" data-act="goto" data-step="${i.step}">Fix</button>` : "<span></span>"}</li>`).join("")}</ul>`
      + reviewCheckHtml()
      + chooseHtml()
      + colourQ()
      + `<div class="b-sub">Page setup</div>` + pageSetupQ()
      + designSuggestHtml()
      + `<div class="b-sub">Download</div><p class="q-hint">In your ${esc(t.name)} layout${t.ats ? ", which applicant tracking systems read reliably" : ". It has two columns, so for online job portals the Professional layout is read more reliably"}. <button class="linkish" type="button" data-act="goto" data-step="${SN("layout")}">Change layout</button></p>`
      + `<div class="b-actions"><button class="btn primary" type="button" data-act="dl" data-kind="docx">Download as Word</button><button class="btn primary" type="button" data-act="dl" data-kind="pdf">Download as PDF</button><button class="btn" type="button" data-act="copy">Copy as text</button></div><p class="status-line" id="bDlStatus" role="status"></p>`
      + savedResumesHtml()
      + nextStepsHtml();
  }
};
// Goal: a general resume, or one for a particular job ad
function specificJobQ() {
  const t = P().target;
  const b = (v, l) => `<button type="button" data-act="pick-bool" data-path="target.specific" data-val="${v}" aria-pressed="${!!t.specific === !!v}">${l}</button>`;
  let body = "";
  if (t.specific) {
    const found = skillsInAd(t.ad);
    body = q("target.ad", "Paste the job ad", { area: true, rows: 6, multi: true, spell: false, ph: "Copy the whole ad, including what they're looking for", hint: "We take the job title and company from it, suggest the skills it asks for, and pick your most relevant subjects. It's kept with your profile, so you can come back to this version." })
      + `<div class="q-grid">${q("target.company", "Company", { opt: true, suggest: "employers", cap: "title", ph: "e.g. Sydney Water" })}</div>`
      + (found.length ? `<p class="b-check ok">The ad names ${found.length} skill${found.length === 1 ? "" : "s"}, like ${esc(listJoin(found.slice(0, 4)))}. You'll see them in the Skills step, to add the ones you genuinely have.</p>` : "");
  }
  return `<div class="q"><div class="q-label" id="bSpecL">Is this resume for one particular job?</div><div class="seg" role="group" aria-labelledby="bSpecL">${b(0, "No, a general resume")}${b(1, "Yes, a particular job")}</div></div>${body}`;
}
function summaryActions() {
  const p = P(), a = builder.sumAlts;
  if (!val(p.summary)) return "";
  const alts = a ? `<div class="bl-alts">${a.busy ? `<p class="progress">${esc(a.busy)}</p>` : a.items.length ? `<span class="small muted">Pick a new wording${a.via ? ` (by ${viaWords(a.via)})` : ""}:</span>${a.items.map((t, k) => `<button type="button" class="bl-alt" data-act="sum-use" data-k="${k}">${esc(t)}</button>`).join("")}${a.msg ? `<span class="small muted">${esc(a.msg)}</span>` : ""}` : `<span class="small muted">${esc(a.msg || "No other wordings this time.")}</span>`}<button class="linkish" type="button" data-act="sum-close">Close</button></div>` : "";
  return `<div class="b-actions"><button class="btn" type="button" data-act="sum-reword">Reword</button><button class="btn${p.summaryOk ? "" : " primary"}" type="button" data-act="sum-accept"${p.summaryOk ? " disabled" : ""}>${p.summaryOk ? "✓ Accepted" : "Accept"}</button><span class="small muted" id="bSumOk">${p.summaryOk ? "It's on your resume. Edit it any time." : ""}</span></div>${alts}`;
}
const hasContent = e => !!(e.title || e.org || e.degree || e.inst || e.name || e.subject);
// Small badges on each card: finished (on the resume), a draft, or hidden from this resume
const cardState = e => !hasContent(e) ? "" : (e.hidden ? '<span class="card-tag off">Hidden</span>' : "") + (e.done ? '<span class="card-tag done">On your resume</span>' : '<span class="card-tag">Draft</span>');
function expCard(e, i) {
  const open = builder.open.experience.has(i);
  const title = [e.title, e.org].filter(Boolean).join(" at ") || "New job";
  const base = `experience.${i}`;
  const genned = builder.genned.has(i) || !!builder.sugg[i];
  // once there are bullet points, the questions fold away so the bullets are easy to read; click to open them again
  const hasBullets = e.bullets.some(b => b.trim()), foldOpen = builder.foldOpen[i] === undefined ? !hasBullets : builder.foldOpen[i];
  return `<details class="b-card${e.done ? " done" : ""}${e.hidden ? " is-hidden" : ""}" data-card="experience" data-i="${i}"${open ? " open" : ""}><summary><span>${esc(title)}</span>${cardState(e)}<span class="meta">${esc(rangeOf(e))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".title", "Job title", { ph: "e.g. Engineering Intern", suggest: "titles", cap: "jobtitle" })}${q(base + ".org", "Employer", { ph: "e.g. Brightwater Solar", suggest: "employers", cap: "title" })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { ph: datePh("Feb 2023"), date: true })}${e.current ? presentBox() : q(base + ".end", "Finished", { ph: datePh("Nov 2024"), date: true })}${endCheck(base + ".current", "I work here now")}</div>
    ${locQ(base + ".location", "Location", { opt: true })}
    <details class="b-fold" data-fold="${i}"${foldOpen ? " open" : ""}><summary><span class="b-sub">Tell us about this job</span><span class="small muted">${foldOpen ? "" : "Your answers are saved. Click to see or change them."}</span></summary>
    ${q(base + ".answers.duties", "What were your main responsibilities?", { area: true, rows: 2, ph: "e.g. Served customers, ran the register, opened and closed the store", after: `<p class="b-check warn" data-vague="${i}">${esc(vagueNote(e))}</p>` })}
    ${q(base + ".answers.wins", "What did you achieve, improve or get recognised for?", { area: true, rows: 3, hint: "Numbers help a lot: how many customers, how much money, how much time saved, how many people trained.", ph: "e.g. Trained 5 new staff. Cut weekly stock-count time from 4 hours to 2 by reorganising the storeroom." })}
    <div class="q-grid">${q(base + ".answers.tools", "Which tools, software or equipment did you use?", { area: true, rows: 2, ph: "e.g. Excel, SolidWorks, POS system, forklift" })}${q(base + ".answers.people", "Who did you work with or for?", { area: true, rows: 2, ph: "e.g. A team of 6; senior engineers; up to 200 customers a day" })}</div>
    </details>
    <div class="b-sub">Bullet points</div>
    <p class="q-hint">Three to six for recent jobs. Each one a full sentence: an action word, what you did, how, and what came of it. Suggestions are written and polished in one go.</p>
    <div class="bl-list">${e.bullets.map((b, j) => bulletRow(`${base}.bullets.${j}`, b, i, j, e.current)).join("")}</div>
    <div class="b-actions"><button class="btn" type="button" data-act="add-bullet" data-i="${i}" title="Writes one more bullet point from your answers that doesn't repeat the others">+ Add a bullet point</button><button class="btn${genned ? "" : " primary"}" type="button" data-act="ai-bullets" data-i="${i}" data-mode="${genned ? "more" : "new"}">${genned ? "Suggest more" : "Turn my answers into bullet points"}</button>${genned ? `<button class="btn ghost" type="button" data-act="ai-bullets" data-i="${i}" data-mode="redo">Try again</button>` : ""}</div>
    <div class="b-sugg" id="bSugg${i}">${suggHtml(i)}</div>
    ${cardFoot("experience", i, e)}
  </div></details>${finNoteHtml("experience", i)}`;
}
const NOUN = { experience: "job", education: "qualification", projects: "project", volunteering: "role", referees: "referee" };
const FIN_HINT = {
  experience: "Finish checks this job has a title, employer, start date and a bullet point, tidies the wording of anything you've changed, and adds it to your resume. Only finished jobs show in the preview and downloads.",
  education: "Polish tidies the subjects, project and awards. Finish checks this has a name, place and dates, tidies capitals and spelling, and adds it to your resume. Only finished entries show in the preview and downloads.",
  projects: "Finish tidies your notes into clear resume lines and adds the project to your resume.",
  volunteering: "Finish tidies your notes into clear resume lines and adds the role to your resume.",
  referees: "Finish tidies the capitals, phone number and email and adds them to your resume."
};
function cardFoot(list, i, e) {
  const n = P()[list === "referees" ? "referees" : list];
  const len = list === "referees" ? P().referees.list.length : n.length;
  const polished = e.polished && e.polished === polishSig(list, e);
  return `${e.done ? "" : `<p class="q-hint fin-hint">${FIN_HINT[list]}</p>`}<p class="status-line" id="bFin-${list}-${i}" role="status"></p>
    <div class="b-card-foot">${i > 0 ? `<button class="btn ghost" type="button" data-act="move" data-list="${list}" data-i="${i}" data-d="-1">Move up</button>` : ""}${i < len - 1 ? `<button class="btn ghost" type="button" data-act="move" data-list="${list}" data-i="${i}" data-d="1">Move down</button>` : ""}<button class="btn ghost" type="button" data-act="del" data-list="${list}" data-i="${i}">Remove</button>${list === "referees" ? "" : `<button class="btn ghost" type="button" data-act="hide" data-list="${list}" data-i="${i}" aria-pressed="${!!e.hidden}">${e.hidden ? "Show on resume" : "Hide from resume"}</button>`}
    <span class="foot-gap"></span>${list === "education" ? `<button class="btn" type="button" data-act="polish" data-list="${list}" data-i="${i}">${polished || e.done ? "Polish again" : "Polish"}</button>` : ""}<button class="btn primary" type="button" data-act="finish" data-list="${list}" data-i="${i}">${e.done ? "Finish" : `Finish this ${NOUN[list]}`}</button></div>`;
}
function bulletRow(path, text, i, j, current) {
  const alts = builder.alts[`${i}.${j}`], ask = builder.fixAsk === `${i}.${j}`;
  return `<div class="bl-item" data-i="${i}" data-j="${j}"><textarea data-path="${path}" data-bullet="1" data-current="${current ? 1 : 0}" rows="2" spellcheck="true" data-prose="1" aria-label="Bullet point ${j + 1}">${esc(text)}</textarea><button type="button" class="chip-x" data-act="del-bullet" data-i="${i}" data-j="${j}" aria-label="Remove bullet point ${j + 1}">×</button>
    <div class="coach" data-coach="${path}">${coachHtml(text, current, i, j)}</div>
    ${ask ? `<div class="bl-ask"><div class="bl-ask-head"><label class="small" for="bAsk${i}_${j}">What's the number? For example how many, how much, or how often.</label><button class="linkish" type="button" data-act="close-ask" data-i="${i}" data-j="${j}">Close</button></div><div class="seg-in"><input type="text" id="bAsk${i}_${j}" data-ask="${i}.${j}" placeholder="e.g. about 120 customers a day"><button class="btn" type="button" data-act="fix-number" data-i="${i}" data-j="${j}">Add it</button></div></div>` : ""}
    ${alts ? `<div class="bl-alts">${alts.busy ? `<p class="progress">${esc(alts.busy)}</p>` : alts.items.length ? `<span class="small muted">${esc(alts.head || "Pick a new wording")}${alts.via ? ` (by ${viaWords(alts.via)})` : ""}:</span>${alts.items.map((t, k) => `<button type="button" class="bl-alt" data-act="use-alt" data-i="${i}" data-j="${j}" data-k="${k}">${esc(t)}</button>`).join("")}${alts.msg ? `<span class="small muted">${esc(alts.msg)}</span>` : ""}` : `<span class="small muted">${esc(alts.msg || "No other wordings this time.")}</span>`}<button class="linkish" type="button" data-act="close-alts" data-i="${i}" data-j="${j}">Close</button></div>` : ""}
  </div>`;
}
function eduCard(e, i) {
  const open = builder.open.education.has(i);
  const base = `education.${i}`, lv = qualLevel(e.level);
  const subjects = listOf(val(e.coursework)).filter(x => !isBlank(x)), picked = pickSubjects(e, P());
  const levels = [["", "Choose the level…"], ...QUAL_LEVELS.map(x => [x.k, x.label])];
  return `<details class="b-card${e.done ? " done" : ""}${e.hidden ? " is-hidden" : ""}" data-card="education" data-i="${i}"${open ? " open" : ""}><summary><span>${esc([e.degree, e.inst].filter(Boolean).join(", ") || "New qualification")}</span>${cardState(e)}<span class="meta">${esc(rangeOf(e, true))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".level", "Level", { select: levels, rerender: true })}${q(base + ".subject", lv && lv.school ? "Certificate" : lv && (lv.k === "other" || lv.k === "short") ? "Name of the qualification" : "Subject or field", { ph: (lv && lv.ph) || "e.g. Engineering (Mechanical), Commerce or Hospitality", suggest: "subject", cap: "title", opt: !!(lv && lv.school) })}
      <div class="q wide q-solo"><div class="q-body"><label class="q-check"><input type="checkbox" data-path="${base}.double" data-rerender="1"${e.double ? " checked" : ""}> This is a double degree (two qualifications studied together)</label></div></div>
      ${e.double ? q(base + ".level2", "Second degree: level", { select: levels, rerender: true }) + q(base + ".subject2", qualLevel(e.level2) && qualLevel(e.level2).school ? "Certificate" : "Second degree: subject or field", { ph: (qualLevel(e.level2) && qualLevel(e.level2).ph) || "e.g. Commerce or Laws", suggest: "subject", cap: "title" }) : ""}
      <div class="q wide q-merged"><span class="q-label">On your resume</span><div class="q-body"><p class="q-merge" id="${fid(base)}_name">${e.degree ? esc(e.degree) : '<span class="muted">Choose a level and type the subject</span>'}</p></div></div>
      ${q(base + ".inst", lv && lv.school ? "School" : "University, TAFE or school", { ph: lv && lv.school ? "Start typing your school's name" : "e.g. Queensland University of Technology", suggest: "inst", cap: "title", hint: lv && lv.school && !SCHOOLS_LOADED() ? "Type your school's full name." : "" })}${locQ(base + ".location", "Location", { opt: true })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { ph: datePh("Feb 2022"), date: true })}${q(base + ".end", e.current ? "Expected to finish" : "Finished", { ph: datePh("Nov 2025"), date: true })}${endCheck(base + ".current", "I'm still studying")}</div>
    ${builder.autoStudy === base + ".end" && e.current ? `<p class="b-check ok" role="status">That's after today, so “I'm still studying” is ticked${studyStage(e) && studyStage(e).label ? ` and you'll be described as ${aOrAn(studyStage(e).label)} ${studyStage(e).label} student` : ""}.</p>` : ""}
    <div class="q-grid">${gradeQ(e, base)}${q(base + ".awards", "Scholarships or awards", { opt: true, ph: "e.g. Dean's List 2024", prose: true })}</div>
    ${q(base + ".coursework", "Relevant subjects", { opt: true, area: true, rows: 2, ph: "e.g. Thermodynamics, Fluid Mechanics, Engineering Design, Statics, Materials Science", hint: `List all your subjects, separated by commas. Your profile keeps every one, and each resume shows the ${SUBJECTS_SHOWN} closest to the job you're going for${P().target.specific && val(P().target.ad) ? " (picked from the job ad in Goal)" : ""}.`, after: subjects.length > SUBJECTS_SHOWN ? `<p class="b-check ok" data-subjects="${i}">Showing ${picked.length} of ${subjects.length} on this resume: ${esc(picked.join(", "))}.</p>` : `<p class="b-check" data-subjects="${i}"></p>` })}
    ${q(base + ".project", "Thesis or major project", { opt: true, ph: "e.g. Thesis: Passive cooling for rooftop solar panels", prose: true })}
    ${cardFoot("education", i, e)}
  </div></details>${finNoteHtml("education", i)}`;
}
function projCard(x, i) {
  const base = `projects.${i}`;
  return `<details class="b-card${x.done ? " done" : ""}${x.hidden ? " is-hidden" : ""}" data-card="projects" data-i="${i}"${builder.open.projects.has(i) ? " open" : ""}><summary><span>${esc(x.name || "New project")}</span>${cardState(x)}<span class="meta">${esc(rangeOf(x))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".name", "Project name", { ph: "e.g. Solar-powered irrigation controller", cap: "title" })}${q(base + ".org", "For or with", { opt: true, ph: "e.g. RMIT capstone, team of 4" })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { opt: true, ph: datePh("Mar 2024"), date: true })}${x.current ? presentBox() : q(base + ".end", "Finished", { opt: true, ph: datePh("Jun 2024"), date: true })}${endCheck(base + ".current", "It's ongoing")}</div>
    ${q(base + ".details", "What did you do, and what came of it? One point per line.", { area: true, rows: 3, multi: true, after: `<div class="x-wrap" data-xr="projects.${i}">${extraRewordHtml("projects", i)}</div>` })}
    ${cardFoot("projects", i, x)}</div></details>${finNoteHtml("projects", i)}`;
}
function volCard(e, i) {
  const base = `volunteering.${i}`;
  return `<details class="b-card${e.done ? " done" : ""}${e.hidden ? " is-hidden" : ""}" data-card="volunteering" data-i="${i}"${builder.open.volunteering.has(i) ? " open" : ""}><summary><span>${esc([e.title, e.org].filter(Boolean).join(" at ") || "New role")}</span>${cardState(e)}<span class="meta">${esc(rangeOf(e))}</span></summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".title", "Role", { ph: "e.g. Volunteer Coach", cap: "jobtitle", suggest: "titles" })}${q(base + ".org", "Organisation", { ph: "e.g. Northside Junior Football Club", cap: "title", suggest: "employers" })}</div>
    <div class="q-dates">${q(base + ".start", "Started", { ph: datePh("2022"), date: true })}${e.current ? presentBox() : q(base + ".end", "Finished", { ph: datePh("2024"), date: true })}${endCheck(base + ".current", "I still do this")}</div>
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
  return `<details class="b-card${x.done ? " done" : ""}" data-card="referees" data-i="${i}"${open ? " open" : ""}><summary><span>${esc(x.name ? [x.name, x.role].filter(Boolean).join(", ") : `Referee ${i + 1}`)}</span>${cardState(x)}</summary><div class="b-card-body">
    <div class="q-grid">${q(base + ".name", "Name", { cap: "name", ph: "e.g. Priya Shah" })}${q(base + ".role", "Their role", { cap: "jobtitle", suggest: "titles", ph: "e.g. Store Manager" })}${q(base + ".org", "Organisation", { cap: "title", suggest: "employers" })}${q(base + ".phone", "Phone", { type: "tel", inputmode: "tel" })}${q(base + ".email", "Email", { type: "email", wide: true })}</div>
    ${cardFoot("referees", i, x)}</div></details>${finNoteHtml("referees", i)}`;
}
// Awards, publications and interests: Polish and Finish under the box
function textFoot(key) {
  const done = P().extrasDone[key];
  return `<p class="status-line" id="bFin-text-${key}" role="status"></p><div class="b-card-foot"><span class="foot-gap"></span><button class="btn primary" type="button" data-act="finish-text" data-key="${key}">${done ? "Finish" : "Finish this section"}</button></div>`;
}
const CHIP_LABELS = {
  software: ["Software and tools", "Programs, systems and equipment, like Excel, Xero, AutoCAD or a forklift.", "Start typing a tool, or press Enter to add your own"],
  certs: ["Licences and certificates", "White Card, RSA, First Aid, Working with Children Check, driver's licence…", "Start typing a licence or certificate"],
  hard: ["Technical and job skills", "Things you can do, like “Financial reporting”, “Food safety” or “Engineering drawings”.", "Start typing a skill, or press Enter to add your own"],
  languages: ["Languages", "Include your level, like “Mandarin (fluent)”.", "e.g. Vietnamese (conversational)"],
  soft: ["Strengths", "Pick up to six. Your bullet points should back them up.", "e.g. Communication"]
};
function chipEditor(key, label, hint, ph) {
  const items = P().skills[key], id = "chin_" + key;
  return `<div class="q" data-chips="${key}"><div class="q-label" id="chl_${key}">${label}</div>${hint ? `<p class="q-hint">${hint}</p>` : ""}
    <div class="chip-edit pick sugg">${items.map((s, i) => `<span class="echip">${esc(s)}<button type="button" class="chip-x" data-act="chip-del" data-key="${key}" data-i="${i}" aria-label="Remove ${esc(s)}">×</button></span>`).join("")}<input type="text" id="${id}" class="chip-in" data-chip-in="${key}" data-suggest="chip-${key}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-sl" placeholder="${esc(ph)}" aria-labelledby="chl_${key}" autocomplete="off"><ul class="pick-list" id="${id}-sl" role="listbox" aria-label="${esc(label)} suggestions" hidden></ul></div>
    <div class="sugg-row" data-sugg="${key}">${skillSuggestions(key)}</div></div>`;
}
function skillSuggestions(key) {
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
  const a = pick(fromYou, 10), ad = pick(fromAd, 10).filter(s => !a.includes(s)), b = pick(pages ? wide : ideas, 12 + pages * 12).filter(s => !a.includes(s) && !ad.includes(s));
  const all = [...new Set(key === "soft" || key === "hard" || key === "software" || key === "certs" ? [...ideas, ...((SUGGEST_SRC["chip-" + key] || (() => []))())] : ideas)].filter(s => !have.has(s.toLowerCase()) && !a.includes(s) && !ad.includes(s)).length;
  const chip = s => `<button type="button" class="opt-chip" data-act="chip-sugg" data-key="${key}" data-val="${esc(s)}">${esc(s)}</button>`;
  // a small button on every section: more skills that are common for this kind of job
  const moreBtn = all > b.length ? `<button type="button" class="btn sugg-more" data-act="sugg-more" data-key="${key}">Suggest more</button>` : pages && b.length ? `<span class="small muted">That's every idea we have for this kind of job.</span>` : "";
  return (ad.length ? `<span>Asked for in the ad, if you have it:</span>${ad.map(chip).join("")}` : "")
    + (a.length ? `<span>Found in your answers:</span>${a.map(chip).join("")}` : "")
    + (b.length ? `<span>${a.length || ad.length ? "Also common" : `Common for ${esc(lowerFirst(jobLabel(jt) || "this kind of job"))}`}, if you have it:</span>${b.map(chip).join("")}` : "")
    + moreBtn;
}
const verbsHelp = () => `<details class="verbs"><summary>Need a word to start a bullet point?</summary><div class="opt-chips">${ACTION_VERBS.map(v => `<button type="button" class="opt-chip" data-act="verb" data-val="${v}">${v}</button>`).join("")}</div></details>`;

/* --- Bullet coach: quick checks as you type --- */
const VERB_WORDS = new Set([...ACTION_VERBS.map(v => v.toLowerCase()), "cut", "won", "grew", "sold", "taught", "ran", "led", "built", "wrote", "drew", "kept", "made", "set", "met", "took", "gave", "found", "brought", "bought", "held", "dealt", "spoke", "sent", "spent", "oversaw", "did", "got", "showed", "chose", "fed", "lent"]);
// Present-tense action words too, for a current job ("Coordinate", "Process", "Provide"): worked out the first time they're needed
const MORE_VERBS = "provide provides process processes respond assess greet answer schedule book prepare clean stock restock count cook drive load unload pack pick sort record update track ensure maintain resolve advise assist support coach guide educate care administer deliver run oversee lead handle operate use apply identify collaborate contribute facilitate promote draft edit review audit reconcile calculate forecast design develop build code configure deploy troubleshoot repair fix install inspect test measure survey plan organise organize coordinate manage supervise train mentor recruit onboard negotiate sell secure win grow increase reduce cut save streamline improve launch create produce write present report monitor analyse analyze research serve welcome open close lift mix bake brew liaise communicate implement complete conduct perform execute lodge file issue verify check source purchase order invoice quote".split(" ");
let presentSet = null;
const presentVerbs = () => presentSet || (presentSet = new Set([...ACTION_VERBS.map(v => toPresentStart(v).toLowerCase()), ...MORE_VERBS]));
const isActionStart = t => { const w = (String(t).match(/^[A-Za-z]+/) || [""])[0].toLowerCase(); return ACTION_START.test(t) || /^[A-Z][a-z]+(ed|ised|ized)\b/.test(t) || VERB_WORDS.has(w) || !!IRREG[w] || Object.values(IRREG).includes(w) || BASE_VERBS.test(w) || presentVerbs().has(w) || presentVerbs().has(w.replace(/e?s$/, "")); };
const WEAK_START = /^(responsible for|duties (included|were)|tasks included|helped( to)?|assisted( with)?|worked on|in charge of)\b/i;
// Each note: [kind, message, issue key for the Fix button]
function coachNotes(text, current) {
  const t = String(text || "").trim();
  if (!t) return [];
  const w = wordCount(t), notes = [];
  const verb = isActionStart(t) && !WEAK_START.test(t);
  notes.push(verb ? ["ok", "Action word"] : ["warn", WEAK_START.test(t) ? "Say what you did, not what you were responsible for" : "Start with an action word", "verb"]);
  notes.push(numsOf(t).length || /\b(two|three|four|five|six|seven|eight|nine|ten|twelve|dozens?|hundreds?|thousands?|half|double[ds]?|tripled?)\b/i.test(t) ? ["ok", "Has a number"] : ["idea", "Add a number if you can", "number"]);
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
  if (!p.target.title.trim()) add("warn", "Add the job title you're aiming for. It becomes your headline.", SN("goal")); else add("pass", "Headline matches the job you want.");
  const sw = wordCount(p.summary);
  if (!sw) add("warn", "Write a short profile for the top.", SN("summary"));
  else if (sw < 25) add("warn", "Your profile is short. Aim for 40 to 75 words.", SN("summary"));
  else if (sw > 95) add("warn", `Your profile is ${sw} words. Trim it to under 80.`, SN("summary"));
  else if (CLICHES.some(x => new RegExp("\\b" + x + "\\b", "i").test(p.summary)) || FILLER.test(p.summary)) add("warn", "Your profile uses clichés. Replace them with specifics.", SN("summary"));
  else add("pass", "Profile is a good length.");
  const student = stageOf(p) === "student";
  const exps = p.experience.filter(e => e.title || e.org);
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
  const edu = p.education.filter(e => e.degree || e.inst);
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
function stepDone(k, p) {
  switch (k) {
    case "layout": return !!p.cv.template;
    case "goal": return !!(p.target.title && p.target.stage);
    case "contact": return !!(p.contact.name && p.contact.email && p.contact.phone);
    case "summary": return wordCount(p.summary) >= 20;
    case "experience": return p.experience.some(e => e.done && (e.title || e.org) && e.bullets.filter(b => b.trim()).length >= 2);
    case "education": return p.education.some(e => e.done && (e.degree || e.inst));
    case "skills": return p.skills.hard.length + p.skills.software.length >= 3;
    case "extras": return builder.visited.has(SN("extras"));
    default: return false;
  }
}

/* --- Rendering --- */
function renderSteps() {
  const p = P();
  $("bSteps").innerHTML = B_STEPS.map((s, i) => `<li class="${stepDone(s.key, p) ? "done" : ""}${i === builder.step ? " current" : ""}"><button type="button" data-act="goto" data-step="${i}"${i === builder.step ? ' aria-current="step"' : ""}><span class="n">${i + 1}</span><span class="t">${s.label}</span></button></li>`).join("");
}
function renderBuilder(focus) {
  const f = $("bForm");
  if (!f) return;
  const k = B_STEPS[builder.step].key;
  builder.visited.add(builder.step);
  const y = window.scrollY;
  const pend = builder.pendingGoto;
  f.innerHTML = STEP_RENDER[k]() + (pend ? `<div class="b-pending" role="alert"><p>${esc(pend.msg)}</p><div class="b-actions"><button class="btn primary" type="button" data-act="finish-all">Finish ${pend.count > 1 ? "them" : "it"} and continue</button><button class="btn" type="button" data-act="goto" data-step="${pend.step}" data-force="1">Continue without ${pend.count > 1 ? "them" : "it"}</button></div></div>` : "")
    + `<div class="b-nav">${builder.step > 0 ? `<button class="btn" type="button" data-act="goto" data-step="${builder.step - 1}">← ${B_STEPS[builder.step - 1].label}</button>` : "<span></span>"}${builder.step < B_STEPS.length - 1 ? `<button class="btn primary" type="button" data-act="goto" data-step="${builder.step + 1}">Next: ${B_STEPS[builder.step + 1].label} →</button>` : ""}</div>`;
  renderSteps();
  updateChecks();
  renderPreview();
  f.querySelectorAll("textarea[data-bullet], textarea[data-sugg-edit], textarea[data-path$='.answers.wins'], textarea[data-path$='.answers.duties'], textarea[data-path='target.ad']").forEach(autoGrow);
  if (k === "layout" || k === "review") fitThumbs();
  if (focus) { const h = $("bStepTitle"); if (h) h.focus({ preventScroll: true }); smoothTo(f); }
  else if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);   // re-rendering never moves the page
}
// Text boxes grow to fit what's in them, so nothing is hidden
function autoGrow(t) { if (!t || !t.isConnected) return; t.style.height = "auto"; t.style.height = Math.max(t.scrollHeight + 2, 44) + "px"; }
// Scroll so an element sits just under the top bar, gently
function smoothTo(el, extra = 12) {
  if (!el) return;
  const bar = ($("appbar") || document.querySelector(".appbar") || { offsetHeight: 0 }).offsetHeight || 0;
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - bar - extra), behavior: reduceMotion() ? "auto" : "smooth" });
}
let previewTimer = null;
function builderTpl() { const k = P().cv.template; return CV_TEMPLATES.some(t => t.key === k) ? tplByKey(k) : ((rankTemplates()[0] || {}).t || tplByKey("professional")); }
function builderAccent(t) { const c = P().cv; return c.template === t.key && t.accents.includes(c.accent) ? c.accent : t.accent; }
// The designs that match the filters, best first, a dozen at a time (the chosen one always shows)
function layoutMatches() { const sel = P().cv.template; return rankTemplates().filter(({ t }) => tplMatches(t, builder.tplFilter) || t.key === sel); }
function layoutCards() {
  const sel = P().cv.template, data = cvData(), ranked = rankTemplates();
  const best = ranked.filter(r => r.rec).slice(0, 3).map(r => r.t.key);
  const list = layoutMatches();
  const showing = list.slice(0, builder.tplShow);
  if (sel && !showing.some(r => r.t.key === sel)) { const s = list.find(r => r.t.key === sel); if (s) showing.unshift(s); }
  return showing.map(({ t }) => `<button type="button" class="tpl-card" data-act="tpl" data-tpl="${t.key}" aria-pressed="${sel === t.key}" aria-label="${esc(t.name)}. ${esc(t.goodFor)}"><span class="tpl-thumb"><div>${cvHtml(cvModel(data, t), t, { accent: sel === t.key ? builderAccent(t) : t.accent })}</div></span><span class="tpl-name">${esc(t.name)}</span>${best.includes(t.key) || t.ats ? `<span class="tpl-badges">${best.includes(t.key) ? '<span class="tpl-badge">Best match</span>' : ""}${t.ats ? '<span class="tpl-badge ats">ATS-friendly</span>' : ""}</span>` : ""}</button>`).join("") || `<p class="small muted">No design matches all of those. Untick one of the filters.</p>`;
}
function layoutMore() {
  const n = layoutMatches().length, left = n - builder.tplShow;
  return left > 0 ? `<div class="b-actions"><button class="btn" type="button" data-act="tpl-more">Show ${Math.min(12, left)} more designs</button><span class="small muted">${n} ${n === 1 ? "match" : "matches"}</span></div>` : "";
}
function renderPreview() {
  const frame = $("bPaper");
  if (!frame || currentView !== "builder") return;
  const p = P(), base = builderTpl(), tpl = tplWithPrefs(base);
  // with nothing finished yet, show a made-up resume so the design can be judged
  const example = !hasProfile(p) && !finished(p.experience).length && !finished(p.education).length;
  const pages = mountPaper(frame, cvHtml(cvModel(example ? SAMPLE_PROFILE : p, tpl), tpl, { accent: builderAccent(base) }));
  builder.pages = pages;
  const drafts = draftsIn(p).length, hidden = ["experience", "education", "projects", "volunteering"].reduce((a, l) => a + p[l].filter(e => e.hidden && e.done !== false && hasContent(e)).length, 0);
  $("bPages").textContent = `${pages} page${pages === 1 ? "" : "s"} in the ${tpl.name} layout.${example ? " This is an example with made-up details. Yours replace it as you finish each part." : ""}${pages > 2 && !example ? " Aim for two at most." : ""}${drafts ? ` ${drafts} ${drafts === 1 ? "entry isn't" : "entries aren't"} finished yet, so ${drafts === 1 ? "it's" : "they're"} not shown.` : ""}${hidden ? ` ${hidden} hidden from this resume.` : ""}`;
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
    if (w) msgs.push(`${w} words${w < 30 ? ", a little short" : w > 85 ? ", trim it a little" : ""}.`);
    if (cl.length || FILLER.test(p.summary)) msgs.push(`Cut ${cl.length ? "“" + cl.join("”, “") + "”" : "the buzzwords"}: show it instead.`);
    if (/\b(I|my)\b/.test(p.summary)) msgs.push("Resumes usually leave out “I” and “my”.");
    sc.textContent = msgs.join(" ");
    sc.classList.toggle("warn", msgs.length > 1 || w > 85 || (w > 0 && w < 30));
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
function dateMark(t, bad) {
  t.classList.toggle("bad", bad);
  t.setAttribute("aria-invalid", bad ? "true" : "false");
  const m = $(t.id + "-msg");
  if (m) { m.textContent = bad ? DATE_HELP : ""; m.classList.toggle("err", bad); }
}

/* --- Editing --- */
function onBuilderInput(e) {
  const t = e.target, p = P(), change = e.type === "change";
  if (t.tagName === "TEXTAREA" && (t.dataset.bullet || t.dataset.suggEdit || /\.answers\.|^target\.ad$/.test(t.dataset.path || ""))) autoGrow(t);
  if (t.dataset.chipIn || t.dataset.ask) return;
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
  // job titles always read as titles: words get their capitals as you finish them
  if (t.dataset.cap === "jobtitle" && typeof v === "string") { const c = jobTitleCase(v, !change); if (c !== v) { const a = t.selectionStart, b = t.selectionEnd; t.value = c; v = c; if (!change && a != null) t.setSelectionRange(a, b); } }
  else if (change && t.dataset.cap && typeof v === "string") { const c = smartCase(v.trim(), t.dataset.cap); if (c !== v) { v = c; t.value = c; } }
  // spelling: common slips and American spellings are fixed when you leave the box (with Undo)
  if (change && t.dataset.prose && typeof v === "string" && v.trim()) { const r = autocorrect(v); if (r.fixed.length) { builder.acUndo = { path, was: v, id: t.id }; v = r.text; t.value = v; acNote(t, r.fixed); } }
  if (t.dataset.lines) v = t.value.split("\n").map(s => s.replace(BULLET_RE, "").trimEnd()).filter((s, i, a) => s.trim() || i < a.length - 1);
  if (change && /contact\.email$|\.email$/.test(path)) { v = v.trim().toLowerCase(); t.value = v; }
  if (change && /contact\.(linkedin|website)$/.test(path)) { v = shortUrl(v); t.value = v; }
  if (change && /referees\.list\.\d+\.phone$/.test(path) && v.trim()) { v = refPhone(v); t.value = v; }
  setPath(p, path, v);
  if (path === "extras.projects" && v && !p.projects.length) p.projects.push(emptyProj());
  if (path === "extras.volunteering" && v && !p.volunteering.length) p.volunteering.push(emptyExp());
  if (path === "summary") { if (p.summaryOk) { p.summaryOk = false; const a = document.querySelector('[data-act="sum-accept"]'); if (a) { a.disabled = false; a.textContent = "Accept"; a.classList.add("primary"); } const ok = $("bSumOk"); if (ok) ok.textContent = ""; } }
  if (/^(awards|publications|interests)$/.test(path)) p.extrasDone[path] = false;
  if (t.dataset.date) {
    if (change) { const f = fmtDate(v); setPath(p, path, f); t.value = showDate(f); dateMark(t, !!val(f) && !dateOk(f)); }
    else if (t.classList.contains("bad") && (!val(v) || dateOk(v))) dateMark(t, false);
  }
  // a qualification that finishes after today is still being studied
  if (t.dataset.date && change && /^education\.\d+\.end$/.test(path)) {
    const ed = p.education[+path.split(".")[1]], end = dateEnd(ed.end);
    if (end && end > new Date() && !ed.current) { ed.current = true; builder.autoStudy = path; touchProfile("builder"); keepOpen(); renderBuilder(false); return; }
  }
  // the qualification's level and subject make its full name
  if (/^education\.\d+\.(level|subject|level2|subject2|double)$/.test(path)) {
    const i = +path.split(".")[1], ed = p.education[i];
    syncQual(ed);
    const nm = $(fid(`education.${i}`) + "_name"); if (nm) nm.innerHTML = ed.degree ? esc(ed.degree) : '<span class="muted">Choose a level and type the subject</span>';
  }
  if (/^education\.\d+\.coursework$/.test(path)) {
    const i = +path.split(".")[1], ed = p.education[i], all = listOf(val(ed.coursework)).filter(x => !isBlank(x)), pk = pickSubjects(ed, p), n = $q(`[data-subjects="${i}"]`);
    if (n) { n.textContent = all.length > SUBJECTS_SHOWN ? `Showing ${pk.length} of ${all.length} on this resume: ${pk.join(", ")}.` : ""; n.classList.toggle("ok", all.length > SUBJECTS_SHOWN); }
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
  // a job title from the list tells us the kind of work, if it isn't set yet
  if (change && path === "target.title" && !p.target.jobType) { const jt = jobTypeForTitle(v); if (jt) { p.target.jobType = jt; touchProfile("builder"); keepOpen(); renderBuilder(false); return; } }
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
    const sp = card.querySelector(":scope > summary > span");
    if (sp && x) sp.textContent = list === "education" ? [x.degree, x.inst].filter(Boolean).join(", ") || "New qualification" : list === "projects" ? x.name || "New project" : list === "referees" ? (x.name ? [x.name, x.role].filter(Boolean).join(", ") : `Referee ${i + 1}`) : [x.title, x.org].filter(Boolean).join(" at ") || (list === "volunteering" ? "New role" : "New job");
    const m = card.querySelector(":scope > summary > .meta");
    if (m && x) m.textContent = rangeOf(x, list === "education");
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
  if (key === "soft" && arr.length > 6) arr.splice(6);
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
  const b = e.target.closest("[data-act]");
  if (!b || !$("bForm").contains(b) && !$("bSteps").contains(b)) return;
  const act = b.dataset.act, p = P();
  const i = +b.dataset.i, list = b.dataset.list;
  switch (act) {
    case "goto": {
      keepOpen();
      const to = +b.dataset.step, cur = B_STEPS[builder.step].key;
      // leaving a step with unfinished entries: offer to finish them first
      if (!b.dataset.force && to > builder.step && ["experience", "education", "extras"].includes(cur)) {
        const drafts = draftsIn(p, cur);
        if (drafts.length) {
          const d0 = drafts[0].e, nm = d0.title || d0.degree || d0.name || d0.org || d0.inst;
          builder.pendingGoto = { step: to, count: drafts.length, msg: `${drafts.length === 1 ? `“${nm}” isn't` : `${drafts.length} entries aren't`} finished yet, so ${drafts.length === 1 ? "it's" : "they're"} not on your resume.` };
          renderBuilder(false); const pe = document.querySelector(".b-pending"); if (pe) smoothTo(pe, 80); return;
        }
      }
      builder.pendingGoto = null; builder.step = to; renderBuilder(true); return;
    }
    case "finish-all": {
      const pend = builder.pendingGoto, cur = B_STEPS[builder.step].key;
      b.disabled = true; b.textContent = "Finishing…";
      for (const d of draftsIn(p, cur)) await finishEntry(d.list, d.i, null, true);
      const left = draftsIn(p, cur).length;
      builder.pendingGoto = null;
      if (!left && pend) { builder.step = pend.step; renderBuilder(true); } else renderBuilder(false);
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
    case "tpl": { p.cv.template = b.dataset.tpl; p.cv.accent = ""; if (typeof cvState !== "undefined") cvState.selected = b.dataset.tpl; touchProfile("builder"); renderBuilder(false); return; }
    case "accent": { if (!p.cv.template) p.cv.template = builderTpl().key; p.cv.accent = b.dataset.val; touchProfile("builder"); renderBuilder(false); return; }
    case "sum-self": builder.showSummary = true; renderBuilder(false); { const ta = $(fid("summary")); if (ta) ta.focus(); } return;
    case "sum-reword": return rewordSummary();
    case "sum-use": { const a = builder.sumAlts; if (a && a.items[+b.dataset.k]) { if (p.summary.trim()) builder.prevSummary = p.summary; p.summary = a.items[+b.dataset.k]; p.summaryOk = false; builder.sumAlts = null; touchProfile("builder"); renderBuilder(false); } return; }
    case "sum-close": builder.sumAlts = null; renderBuilder(false); return;
    case "sum-accept": {
      let s = tidySpaces(p.summary);
      const r = autocorrect(s); s = r.text;
      if (s && !/[.!?]$/.test(s)) s += ".";
      p.summary = s; p.summaryOk = true; builder.sumAlts = null; touchProfile("builder"); renderBuilder(false);
      const nx = document.querySelector(".b-nav .btn.primary"); if (nx) { nx.classList.remove("flash"); void nx.offsetWidth; nx.classList.add("flash"); }
      return;
    }
    case "fix-bullet": return fixBullet(i, +b.dataset.j, b.dataset.issue, b);
    case "fix-number": { const inp = document.querySelector(`[data-ask="${i}.${b.dataset.j}"]`); return fixBullet(i, +b.dataset.j, "number", b, inp ? inp.value.trim() : ""); }
    case "close-ask": keepOpen(); builder.fixAsk = null; renderBuilder(false); return;
    case "reword": return rewordBullet(i, +b.dataset.j);
    case "use-alt": { const a = builder.alts[`${i}.${b.dataset.j}`]; if (a) { keepOpen(); p.experience[i].bullets[+b.dataset.j] = a.items[+b.dataset.k]; if (a.via) aiMade(a.items[+b.dataset.k]); delete builder.alts[`${i}.${b.dataset.j}`]; touchProfile("builder"); renderBuilder(false); } return; }
    case "close-alts": keepOpen(); delete builder.alts[`${i}.${b.dataset.j}`]; renderBuilder(false); return;
    case "check-run": return runResumeCheck(b);
    case "check-yes": case "check-no": case "check-all": return applyCheck(act, +b.dataset.k);
    case "pick-lang": keepOpen(); p.prefs.lang = b.dataset.val; touchProfile("builder"); renderBuilder(false); applySpellLang(); return;
    case "jobtype-open": keepOpen(); builder.jobTypeOpen = true; renderBuilder(false); return;
    case "pick": keepOpen(); if (b.dataset.path === "target.jobType") builder.jobTypeOpen = false; setPath(p, b.dataset.path, b.dataset.val); touchProfile("builder"); renderBuilder(false); return;
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
      if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = `Remove “${name}”? Click again`; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Remove"; } }, 4000); return; }
      arr.splice(i, 1);
      builder.foldOpen = {};
      builder.extraAlts = {};
      builder.open[list] = new Set();
      touchProfile("builder"); renderBuilder(false); return;
    }
    case "move": {
      keepOpen();
      const arr = listArr(p, list), j = i + +b.dataset.d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      builder.foldOpen = {};
      builder.extraAlts = {};
      builder.open[list] = new Set([j]);
      touchProfile("builder"); renderBuilder(false); return;
    }
    case "add-bullet": return addOneBullet(i, b);
    case "del-bullet": keepOpen(); p.experience[i].bullets.splice(+b.dataset.j, 1); touchProfile("builder"); renderBuilder(false); return;
    case "chip-del": P().skills[b.dataset.key].splice(i, 1); touchProfile("builder"); rerenderChips(b.dataset.key); return;
    case "chip-sugg": addChip(b.dataset.key, b.dataset.val); return;
    case "sugg-more": builder.moreSugg[b.dataset.key] = (+builder.moreSugg[b.dataset.key] || 0) + 1; rerenderChips(b.dataset.key); return;
    case "lang-add": case "lang-del": langClick(act, i); return;
    case "verb": {
      const t = builder.lastBullet && builder.lastBullet.isConnected ? builder.lastBullet : null;
      if (!t) { b.closest("details").querySelector("summary").textContent = "Click into a bullet point first, then pick a word"; return; }
      const v = t.value.trim();
      t.value = v ? b.dataset.val + " " + v[0].toLowerCase() + v.slice(1) : b.dataset.val + " ";
      t.dispatchEvent(new Event("input", { bubbles: true }));
      t.focus(); return;
    }
    case "ai-summary": return writeSummary(b);
    case "ai-bullets": return writeBullets(i, b, b.dataset.mode || "new");
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
    case "ch-up": case "ch-down": case "ch-fit": case "ch-all": case "ch-restore": return chooseAct(act, b);
    case "alt-more": keepOpen(); builder.altSeed = (builder.altSeed || 0) + 1; renderBuilder(false); return;
    case "x-reword": return rewordExtra(list, i);
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
    case "dl": return builderDownload(b.dataset.kind, b);
    case "copy": {
      try { await navigator.clipboard.writeText(profileToText(p)); b.textContent = "Copied"; } catch { b.textContent = "Couldn't copy here"; }
      setTimeout(() => { b.textContent = "Copy as text"; }, 2200); return;
    }
    case "save-resume": return saveResumeVersion(b);
    case "saved-open": return openSavedResume(+b.dataset.k);
    case "saved-dl": return downloadSavedResume(+b.dataset.k, b.dataset.kind, b);
    case "saved-del": {
      if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Delete it?"; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Delete"; } }, 4000); return; }
      savedResumes.data.list.splice(+b.dataset.k, 1); savedResumes.save(true); renderBuilder(false); return;
    }
    case "to-cv": openView("cv"); return;
    case "to-letter": openView("letter"); return;
    case "to-linkedin": openView("linkedin"); return;
    case "sort-date": return sortByDate(list);
    case "to-scanner": sendToScanner(); return;
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
  await downloadMade(cvFileName(model, kind, base.family === "academic" || base.key === "academic" ? "CV" : "Resume"), async () => kind === "pdf" ? (await cvPdf(model, tpl, { accent })).blob : cvDocx(model, tpl, { accent }), $("bDlStatus"), btn);
}
function sendToScanner() {
  const p = P(), ad = p.target.specific ? val(p.target.ad) : "";
  if (ad && !els.jd.value.trim()) els.jd.value = ad;
  els.resume.value = profileToText(p, { jobText: els.jd.value || ad });
  fileInfo = null;
  setExample(false);
  updateCounts();
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
  return `<div class="b-sub">Save this version to your profile</div><p class="q-hint">Give it a name, like the job it's for, so you can open or download it again later.</p>
    <div class="b-actions"><button class="btn primary" type="button" data-act="save-resume">Save to my profile…</button><span class="status-line" id="bSaveStatus" role="status"></span></div>
    ${list.length ? `<ul class="saved-list" aria-label="Your saved resumes">${list.map((x, k) => `<li><span class="saved-name"><b>${esc(x.name)}</b><span class="small muted">Saved ${esc(fmtSaved(x.saved))}${x.tplName ? ` · ${esc(x.tplName)} layout` : ""}</span></span><span class="b-actions"><button class="btn" type="button" data-act="saved-open" data-k="${k}">Open</button><button class="btn ghost" type="button" data-act="saved-dl" data-k="${k}" data-kind="docx">Word</button><button class="btn ghost" type="button" data-act="saved-dl" data-k="${k}" data-kind="pdf">PDF</button><button class="btn ghost" type="button" data-act="saved-del" data-k="${k}">Delete</button></span></li>`).join("")}</ul>` : ""}`;
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
  const p = P(), t = builderTpl();
  const name = await askName({ title: "Save this resume to your profile", text: "Everything on this version is saved: what's shown and hidden, the layout and colour. Saving again with the same name replaces it.", label: "Name it", value: [p.target.title || "My resume", p.target.company].filter(Boolean).join(" – ") });
  if (!name) return;
  await savedResumes.ready;
  const list = savedResumes.data.list = (savedResumes.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), tpl: t.key, tplName: t.name, accent: builderAccent(t), profile: JSON.parse(JSON.stringify(p)) });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedResumes.save(true);
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
  builder.open = openSets(); builder.sugg = {};
  renderBuilder(false);
  const st = $("bSaveStatus");
  if (st) { st.innerHTML = `Opened “${esc(x.name)}”. <button class="linkish" type="button" id="bUndoOpen">Undo</button>`; $("bUndoOpen").onclick = () => { replaceProfile(builder.undo, "import"); builder.undo = null; renderBuilder(false); }; }
}
async function downloadSavedResume(k, kind, btn) {
  const x = (savedResumes.data.list || [])[k];
  if (!x) return;
  const pr = mergeProfile(x.profile), base = tplByKey(x.tpl), tpl = tplWithPrefs(base, pr.prefs), model = cvModel(pr, tpl);
  await downloadMade(cvFileName(model, kind, "Resume"), async () => kind === "pdf" ? (await cvPdf(model, tpl, { accent: x.accent || base.accent })).blob : cvDocx(model, tpl, { accent: x.accent || base.accent }), $("bSaveStatus"), btn);
}

/* --- AI help: the summary and bullet points, using only what you wrote --- */
const SUMMARY_RULES = `You write the profile paragraph at the top of an Australian resume.
Use ONLY facts the candidate gave. Never invent employers, numbers, skills, tools, qualifications or achievements.
Write 2 or 3 sentences, 40 to 75 words, in the implied first person (no "I", no "my"), Australian spelling.
Start with who they are professionally, then their strongest skills with one piece of evidence, then what they are looking for.
If <study> says they are still studying, describe them by their year of study (for example "penultimate-year" or "final-year" student, as <study> says) and never as a graduate or recent graduate.
No clichés ("hard-working", "team player", "passionate", "results-driven", "go-getter", "proven track record"), no buzzwords like "leverage" or "utilise", no markdown.
Reply with only JSON: {"summary": "..."}`;
const BULLET_RULES = `You are an experienced Australian resume writer. Turn a candidate's own answers about one job into polished bullet points that can go straight onto their resume.
Use ONLY what the candidate wrote. Never invent numbers, tools, results, team sizes, awards or responsibilities. Keep any number exactly as they gave it.
Write 3 to 5 bullet points. Each one reads as a complete sentence without the "I": a strong action verb, then what they did, how they did it (the tools, systems or people they mentioned), and why it mattered or what came of it. Combine short, related tasks into one fuller bullet (for example "opened the store", "counted the till" and "restocked shelves" become one) rather than giving each small task its own thin bullet.
Describe each task the way a capable person in this position would, so a recruiter sees the full scope of the job: you may add the purpose and the usual standard of the work for this kind of role (for example a barista "kept orders moving through the morning rush", an engineering intern "prepared drawings for review by senior engineers"). Never add a task, tool, number or result they didn't mention, and don't repeat a fact in two bullets.
Polish as you write: precise professional words instead of casual ones, shorthand spelled out, Australian spelling, the right capitals for tools and companies.
Each bullet: 16 to 30 words; past tense for a past job, present tense for their current job; no two start with the same verb; a result goes near the front when there is one.
No "I", no "my", no "responsible for", no "duties included", no clichés, no buzzwords like "leverage" or "utilise", no markdown, no full stop at the end.
Reply with only JSON: {"bullets": ["...", "..."]}`;
const SUMMARY_SCHEMA = { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] };
const BULLETS_SCHEMA = { type: "object", properties: { bullets: { type: "array", items: { type: "string" } } }, required: ["bullets"] };
// Text that may vouch for numbers and skills in AI wording
function sourceText(p) {
  return [p.target.title, ...Object.values(p.summaryQ), p.summary, ...p.experience.flatMap(e => [e.title, e.org, ...Object.values(e.answers), ...e.bullets]), ...p.education.flatMap(e => Object.values(e)), ...Object.values(p.skills).flat(), ...p.projects.flatMap(x => Object.values(x)), ...p.volunteering.flatMap(e => [e.title, e.org, ...e.bullets]), p.awards, p.interests].join("\n");
}
function honest(text, src, o = {}) {
  const t = stripMarkup(String(text || "")).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, o.keepStop ? "." : "");
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
const lowerSoft = s => { if (!s || !/^[A-Z](?![A-Z])/.test(s)) return s; const w = s.split(/\s/)[0]; return /[A-Z]/.test(w.slice(1)) || SOFTWARE.has(s) || PROGRAMMING.has(s) || SOFTWARE.has(w) ? s : s[0].toLowerCase() + s.slice(1); };
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
async function writeSummary(btn) {
  const p = P(), note = $("bSumEngine");
  if (!Object.values(p.summaryQ).some(v => v.trim()) && !p.experience.length) { note.textContent = "Answer at least one of the questions above first."; return; }
  btn.disabled = true;
  const progress = m => { note.textContent = m; note.classList.add("busy"); };
  progress("Writing…");
  const src = sourceText(p);
  let text = null, via = "", rejected = false;
  // a current student must never come out as a "recent graduate"
  const ss = finished(p.education).map(e => studyStage(e)).find(Boolean), studying = !!(ss && ss.current);
  const GRAD = /\b(recent(ly)?|new(ly)?)[\s-]+graduat\w*|\bgraduated\b|\bgraduate (of|from)\b|^(an? )?graduate\b/i;
  const judge = t => { const h = honest(t, src, { min: 25, max: 95, keepStop: true }); if (!h) return [null, factCheck(t, src, { noFirstPerson: true, min: 25, max: 95 }) || "it used something that isn't in their answers"]; if (studying && GRAD.test(h)) return [null, `they're still studying${ss.label ? ` (a ${ss.label} student)` : ""}, so never call them a graduate`]; return [h, ""]; };
  try {
    const small = await withChromeAI(progress, async make => {
      progress(`Writing with ${SMALL()}…`);
      const s = await make(SUMMARY_NANO, SUMMARY_EXAMPLES);
      let d = await nanoJSON(s, summaryPrompt(p), SUMMARY_SCHEMA), [ok, why] = judge(d.summary);
      if (!ok && d.summary) { d = await nanoJSON(s, `Your answer broke a rule: ${why}. Write it again and reply with only the JSON.`, SUMMARY_SCHEMA); [ok] = judge(d.summary); }
      if (!ok && d.summary) rejected = true;
      return ok;
    });
    if (small) { text = small; via = `Written by ${SMALL()} from your answers.`; }
    const big = afterSmall();
    if (!text && big) {
      progress("Writing with " + AI_NAME() + "…");
      try {
        const first = SUMMARY_RULES + "\n\n" + summaryPrompt(p);
        let d = await big.json(first, { cache: false }), [ok, why] = judge(d && d.summary);
        if (!ok && d && d.summary) { d = await big.json([{ role: "user", content: first }, { role: "assistant", content: JSON.stringify(d) }, { role: "user", content: `Your answer broke a rule: ${why}. Fix it and reply again with only the JSON.` }], { cache: false }); [ok] = judge(d && d.summary); }
        if (ok) { text = ok; via = "Written by " + AI_NAME() + " from your answers."; } else if (d && d.summary) rejected = true;
      } catch { /* fall back */ }
    }
  } finally { btn.disabled = false; note.classList.remove("busy"); }
  if (!text) { text = templateSummary(p); via = rejected ? "The AI's draft mentioned things that aren't in your answers, so this version was put together from your answers instead. Edit it so it sounds like you." : "Put together from your answers. Edit it so it sounds like you."; }
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
2. 40 to 75 words each, 2 or 3 sentences, no "I" or "my", Australian spelling.
3. Vary them: one leads with who they are, one with their strongest skill, one with their result.
4. If they're still studying, keep their year of study and never call them a graduate.
5. No clichés ("hard-working", "team player", "passionate", "results-driven") and no buzzwords ("leverage", "utilise").
Reply with JSON only: {"options": ["...", "...", "..."]}`;
async function rewordSummary() {
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
      const ok = (Array.isArray(d.options) ? d.options : []).map(x => honest(x, src, { min: 25, max: 95, keepStop: true })).filter(x => x && !(studying && GRAD.test(x)) && keepsFacts(cur, x) >= 0.45 && !seen.has(norm(x)) && seen.add(norm(x)));
      return ok.length >= 2 ? { ok: true, value: ok.slice(0, 3).map(x => /[.!?]$/.test(x) ? x : x + ".") } : { ok: false, why: "write 3 different versions of 40 to 75 words that keep every fact and add nothing" };
    } });
  let items = r.data || [], msg = "";
  if (!items.length) {
    // without AI: the same sentences in a different order
    const sents = sentencesOf(cur).map(x => x.trim()).filter(Boolean);
    if (sents.length >= 2) items = [[...sents.slice(1), sents[0]].join(" "), [sents[sents.length - 1], ...sents.slice(0, -1)].join(" ")].filter(x => norm(x) !== norm(cur));
    const t = templateSummary(p); if (t && norm(t) !== norm(cur) && !items.includes(t)) items.push(t);
    msg = aiMissWords(r) + (items.length ? " These are reshuffles of your own sentences." : "");
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
const BASE_VERBS = /^(serve|train|manage|lead|run|handle|help|assist|organise|organize|coordinate|plan|prepare|create|build|design|develop|write|answer|process|clean|open|close|stock|restock|count|cook|deliver|drive|operate|maintain|install|inspect|repair|fix|check|test|analyse|analyze|research|support|supervise|mentor|teach|tutor|sell|greet|resolve|schedule|book|update|record|monitor|order|pack|load|unload|use|work|answer|liaise|communicate|present|report|review|audit|calculate|draft|model|survey|measure|launch|improve|reduce|increase|cut|grow|make|keep|set|meet|take|run|draw|win|oversee|do)s?\b/i;
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
  const clean = s => dash(s.replace(BULLET_RE, "").trim().replace(/^(and|also|then)\s+/i, "").replace(/^(i|we)\s+(also\s+)?/i, "").replace(/^my (job|role|main job|duties) (was|were|included) (to\s+)?/i, "").replace(/^(i was|was)\s+(in charge of|responsible for)\s+/i, "Managed ").replace(/[.\s]+$/, ""));
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
function bulletPrompt(e, avoid = []) {
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
Write new bullet points that don't repeat the ones they already have${avoid.length ? ` or these suggestions:\n${avoid.map(b => "- " + b).join("\n")}` : ""}.`;
}
async function writeBullets(i, btn, mode = "new") {
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
    const r = await aiJSON({ nano: BULLET_NANO, full: BULLET_RULES, examples: BULLET_EXAMPLES, prompt: bulletPrompt(e, avoid), schema: BULLETS_SCHEMA, label: "Writing bullet points", progress,
      check: d => { const ok = clean(d.bullets); return ok.length >= 2 ? { ok: true, value: ok } : { ok: false, why: (Array.isArray(d.bullets) ? d.bullets : []).map(b => factCheck(b, src, { noFirstPerson: true, min: 12, max: 34 })).find(Boolean) || "write at least 3 new bullet points, each a full sentence of 16 to 30 words, using their details" }; } });
    if (r.data) { items = r.data; via = `Written and polished by ${viaWords(r.via)} from your answers. Edit any of them, and remove any that aren't true.`; }
    else if (r.tried) via = aiMissWords(r);
  } finally { btn.disabled = false; }
  const ai = !!items.length;
  if (!items.length) { items = answersToBullets(e).filter(b => !seen.has(norm(b))); via = (via ? via + " " : "") + "These were made from your answers without AI. Edit them so each one is true and sounds like you."; }
  builder.genned.add(i);
  delete builder.foldOpen[i];   // new bullet points: fold the questions away
  // Written bullet points go straight onto the job, ready to edit, with an Undo
  const e3 = P().experience[i], added = [];
  e3.bullets = e3.bullets.filter(x => x.trim());
  for (const t of items) { const x = tidy(String(t || "")).replace(/[.\s]+$/, ""); if (x && !e3.bullets.includes(x)) { e3.bullets.push(x); added.push(x); if (ai) aiMade(x); } }
  if (e3.bullets.length && e3.bullets.every(x => builder.aiText.has(norm(x)))) e3.polished = polishSig("experience", e3);
  builder.sugg[i] = { items: [], added, via, ai: ai || (prev && prev.ai) };
  touchProfile("builder");
  keepOpen(); renderBuilder(false);
  const nb = $("bSugg" + i); if (nb && !added.length) nb.insertAdjacentHTML("afterbegin", `<p class="small">No new bullet points this time. Add more detail to your answers, then try again.</p>`);
}
function suggHtml(i) {
  const s = builder.sugg[i];
  if (!s) return "";
  if (s.added) {
    if (!s.added.length) return "";
    return `<div class="s-head"><b>Added ${s.added.length} bullet point${s.added.length === 1 ? "" : "s"} above</b><span class="b-actions"><button class="btn" type="button" data-act="sugg-undo" data-i="${i}">Undo</button><button class="linkish" type="button" data-act="sugg-dismiss" data-i="${i}">Close</button></span></div><p class="small muted">${esc(s.via)}</p>`;
  }
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
function liEducation(text) {
  const lines = String(text || "").split("\n").map(l => l.trim()).filter(Boolean);
  const out = [];
  let cur = null;
  const DEG = /\b(bachelor|master|diploma|certificate|doctor|ph\.?d|year 1[0-2]|associate degree|graduate (certificate|diploma)|honours|hons|bsc|beng|mba|high school|secondary|hsc|vce|qce|wace|sace|atar)\b/i;
  const YRS = /\(?\b((?:19|20)\d{2})\b\s*[-–—]\s*\b((?:19|20)\d{2}|present)\b\)?/i;
  for (const l of lines) {
    const g = l.match(/^Grade:?\s*(.+)$/i);
    if (g) { if (cur) cur.grade = g[1].trim(); continue; }
    if (/^(activities|societies|skills|description)\b/i.test(l) || l.length > 110 || /[.!]$/.test(l) && !DEG.test(l)) continue;
    const yrs = l.match(YRS);
    if (DEG.test(l)) {
      let d = l.replace(YRS, "").replace(/[·\s]+$/, "").replace(/\s+-\s+[A-Z][A-Za-z().]*(?=\s*,|\s*$)/, "").trim();
      const m = d.match(/^(.*?),\s*(.+)$/);
      if (m && !/\(/.test(m[1])) d = `${m[1]} (${m[2]})`;
      if (!cur || cur.degree) { cur = { ...emptyEdu() }; out.push(cur); }
      cur.degree = d.replace(/[,·\s]+$/, "");
    } else if (!yrs) { cur = { ...emptyEdu(), inst: l }; out.push(cur); continue; }
    if (yrs && cur) { cur.start = fmtDate(yrs[1]); if (/present/i.test(yrs[2])) cur.current = true; else cur.end = fmtDate(yrs[2]); }
  }
  return out.filter(e => e.inst || e.degree);
}
// What LinkedIn's PDF or a copied profile page gives us, as a profile
function profileFromLinkedIn(li) {
  const p = emptyProfile();
  [p.contact.first, p.contact.last] = splitName(li.name || "");
  p.contact.location = liPlace(li.location);
  if (li.url) p.contact.linkedin = shortUrl(li.url);
  const head = String(li.headline || "").split(/\s+[|·•]\s+|\s+at\s+|\s+@\s+/)[0].trim();
  if (head && wordCount(head) <= 7 && !/\bstudent\b/i.test(head)) p.target.title = jobTitleCase(head);
  if (val(li.about) && wordCount(li.about) <= 110) p.summary = li.about.replace(/\s+/g, " ").trim();
  for (const r of liRoles(li.experience)) {
    const [a, b = ""] = r.dates.split(/\s*[-–—]\s*/);
    const e = { ...emptyExp(), title: jobTitleCase(r.title), org: r.company.replace(LI_TYPES, "").trim(), start: fmtDate(a), end: /present/i.test(b) ? "" : fmtDate(b), current: /present/i.test(b) };
    e.bullets = String(r.desc || "").split("\n").map(l => l.replace(BULLET_RE, "").replace(/^[•▪◦·*]\s*/, "").trim()).filter(l => wordCount(l) >= 3 && !/^Skills?:/i.test(l)).slice(0, 8);
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
const READ_NANO = `You copy the details from a resume or LinkedIn profile into JSON, exactly as they are written.
Rules:
1. Copy only what is there. Never add, guess, reword or improve anything. Leave a field empty if it isn't given.
2. Keep every job and every qualification, newest first, with dates as written (like "Feb 2023" or "2021").
3. bullets: each duty or achievement line under that job, word for word.
4. Split skills into hard skills, software and tools, soft skills, languages, and licences or certificates.
Reply with JSON only.`;
const strArr = { type: "array", items: { type: "string" } };
const READ_SCHEMA = { type: "object", properties: {
  first: { type: "string" }, last: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, location: { type: "string" }, headline: { type: "string" }, summary: { type: "string" },
  jobs: { type: "array", items: { type: "object", properties: { title: { type: "string" }, employer: { type: "string" }, location: { type: "string" }, start: { type: "string" }, end: { type: "string" }, current: { type: "boolean" }, bullets: strArr }, required: ["title", "employer", "start", "end", "bullets"] } },
  study: { type: "array", items: { type: "object", properties: { qualification: { type: "string" }, institution: { type: "string" }, start: { type: "string" }, end: { type: "string" }, grade: { type: "string" }, subjects: { type: "string" }, awards: { type: "string" } }, required: ["qualification", "institution"] } },
  hard: strArr, software: strArr, soft: strArr, languages: strArr, certs: strArr,
  volunteering: { type: "array", items: { type: "object", properties: { role: { type: "string" }, organisation: { type: "string" }, start: { type: "string" }, end: { type: "string" }, bullets: strArr }, required: ["role", "organisation"] } },
  awards: strArr, interests: { type: "string" }
}, required: ["jobs", "study"] };
async function aiReadProfile(text, progress) {
  const src = String(text || "").slice(0, 12000), flat = " " + norm(src).replace(/[^a-z0-9@.+]+/g, " ") + " ";
  // a detail counts only if it's in the text (allowing for spacing and punctuation)
  const inText = s => { const t = val(s); if (!t) return ""; const k = norm(t).replace(/[^a-z0-9@.+]+/g, " ").trim(); return k && (flat.includes(" " + k + " ") || flat.includes(k)) ? t : keepsFacts(t, src) >= 0.85 && !factCheck(t, src) ? t : ""; };
  const okLine = s => { const t = val(s).replace(/^[•▪◦·*-]\s*/, ""); return t && keepsFacts(t, src) >= 0.8 && !numsOf(t).some(n => !numsOf(src).includes(n)) ? t : ""; };
  const okDate = s => { const f = fmtDate(val(s)); return f && dateOk(f) ? f : ""; };
  const r = await aiJSON({ nano: READ_NANO, prompt: `<text>\n${src}\n</text>`, schema: READ_SCHEMA, label: "Reading it closely", progress,
    check: d => {
      const p = emptyProfile();
      p.contact.first = inText(d.first); p.contact.last = inText(d.last); p.contact.email = inText(d.email).toLowerCase(); p.contact.phone = inText(d.phone);
      const loc = inText(d.location); if (loc) { const x = exactPlace(loc) || exactPlace(loc.split(",")[0]); p.contact.location = x ? placeValue(x) : ""; }
      const hl = inText(d.headline); if (hl && wordCount(hl) <= 7) p.target.title = jobTitleCase(hl);
      const sm = inText(d.summary); if (sm && wordCount(sm) <= 110) p.summary = sm;
      for (const j of Array.isArray(d.jobs) ? d.jobs : []) {
        const e = { ...emptyExp(), title: inText(j.title), org: inText(j.employer), location: "", start: okDate(j.start), end: /present|current|now/i.test(j.end || "") ? "" : okDate(j.end), current: !!j.current || /present|current|now/i.test(j.end || "") };
        e.bullets = (Array.isArray(j.bullets) ? j.bullets : []).map(okLine).filter(Boolean).slice(0, 8);
        if (e.title || e.org) p.experience.push(e);
      }
      for (const s of Array.isArray(d.study) ? d.study : []) {
        const e = { ...emptyEdu(), degree: inText(s.qualification), inst: inText(s.institution), start: okDate(s.start), end: okDate(s.end), grade: inText(s.grade), coursework: inText(s.subjects), awards: inText(s.awards) };
        if (e.degree || e.inst) p.education.push(e);
      }
      for (const k of ["hard", "software", "soft", "languages", "certs"]) p.skills[k] = (Array.isArray(d[k]) ? d[k] : []).map(inText).filter(Boolean).slice(0, 40);
      for (const v of Array.isArray(d.volunteering) ? d.volunteering : []) { const e = { ...emptyExp(), title: inText(v.role), org: inText(v.organisation), start: okDate(v.start), end: okDate(v.end), bullets: (Array.isArray(v.bullets) ? v.bullets : []).map(okLine).filter(Boolean) }; if (e.title || e.org) { p.volunteering.push(e); p.extras.volunteering = true; } }
      const aw = (Array.isArray(d.awards) ? d.awards : []).map(inText).filter(Boolean); if (aw.length) { p.awards = aw.join("\n"); p.extras.awards = true; }
      const it = inText(d.interests); if (it) { p.interests = it; p.extras.interests = true; }
      return p.experience.length || p.education.length ? { ok: true, value: p } : { ok: false, why: "copy every job and qualification in the text into jobs and study" };
    } });
  return r.data ? { profile: r.data, via: r.via } : null;
}
// Bring in a resume (kind "resume", text) or a LinkedIn profile (kind "linkedin", li), filling in as much as possible
async function importInto(kind, input, statusEl, sourceName) {
  const text = kind === "linkedin" ? liAsText(input) : String(input || "");
  if (kind === "resume" && (!text || wordCount(text) < 30)) { statusEl.textContent = "That doesn't look like enough resume text to read."; statusEl.classList.add("err"); return false; }
  if (kind === "linkedin" && !(input.experience || input.education || input.headline || input.name)) { statusEl.textContent = `Couldn't find your profile sections in ${sourceName}. Try LinkedIn's PDF instead.`; statusEl.classList.add("err"); return false; }
  statusEl.classList.remove("err");
  const before = JSON.parse(JSON.stringify(P()));
  let got = kind === "linkedin" ? profileFromLinkedIn(input) : profileFromText(text), via = "";
  if ($("bImportAi") && $("bImportAi").checked) {
    statusEl.classList.add("busy");
    try { const r = await aiReadProfile(text, m => { statusEl.textContent = m; }); if (r) { got = mergeProfiles(got, r.profile); via = viaWords(r.via); } }
    catch { /* the plain read is still there */ }
    finally { statusEl.classList.remove("busy"); }
  }
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
  const p = P(), n = (a, b) => Math.max(0, a - b);
  const jobs = n(p.experience.filter(hasContent).length, before.experience.filter(hasContent).length), quals = n(p.education.filter(hasContent).length, before.education.filter(hasContent).length);
  const skills = n(Object.values(p.skills).flat().length, Object.values(before.skills).flat().length);
  const what = [jobs ? `${jobs} job${jobs === 1 ? "" : "s"}` : "", quals ? `${quals} qualification${quals === 1 ? "" : "s"}` : "", skills ? `${skills} skill${skills === 1 ? "" : "s"}` : ""].filter(Boolean);
  statusEl.innerHTML = `${esc(`Read ${sourceName}${via ? ` (checked by ${via})` : ""}: ${what.length ? "added " + listJoin(what) : "nothing new to add, but blanks were filled in"}. Each job and qualification is a draft until you finish it, so check each step and answer the questions to strengthen it.`)}${builder.undo ? ' <button class="linkish" type="button" id="bUndoImport">Undo</button>' : ""}`;
  const u = $("bUndoImport");
  if (u) u.onclick = () => { replaceProfile(builder.undo, "import"); builder.undo = null; statusEl.textContent = "Restored your previous answers."; };
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
async function builderImportFile(file, statusEl) {
  if (!file) return;
  statusEl.classList.remove("err");
  statusEl.textContent = `Reading ${file.name}…`;
  try {
    const { text } = await readFile(file);
    // a LinkedIn "Save to PDF" file dropped in the resume box is read as LinkedIn
    const li = /\.pdf$/i.test(file.name) && /\b(Top Skills|Contact)\b[\s\S]{0,400}\b(linkedin\.com\/in\/|Experience)\b/.test(text) ? await readLinkedInPdf(file).catch(() => null) : null;
    if (li && (li.experience || li.education)) { if (await importInto("linkedin", li, statusEl, file.name)) { builder.step = 0; renderBuilder(false); } return; }
    if (await importInto("resume", text, statusEl, file.name)) { builder.step = 0; renderBuilder(false); }
  } catch (e) { statusEl.classList.add("err"); statusEl.textContent = e && e.message ? e.message : "Couldn't read that file."; }
}
async function builderImportLinkedIn(file, statusEl) {
  if (!file) return;
  statusEl.classList.remove("err"); statusEl.textContent = `Reading ${file.name}…`;
  try {
    if (!/\.pdf$/i.test(file.name)) throw new Error("Use the PDF from LinkedIn's “Save to PDF”, or paste your profile page below.");
    if (await importInto("linkedin", await readLinkedInPdf(file), statusEl, file.name)) { builder.step = 0; renderBuilder(false); }
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
  f.addEventListener("toggle", e => { if (e.target.matches && e.target.matches("details.b-card")) keepOpen(); }, true);
  $("bImportBtn").addEventListener("click", () => {
    const box = $("bImport"), open = box.hidden;
    box.hidden = !open;
    $("bImportBtn").setAttribute("aria-expanded", String(open));
    $("bFromScanner").hidden = !(els.resume.value.trim() && wordCount(els.resume.value) > 40);
    if (open) { $("bPick").focus(); if (!$("bLiUrl").value && P().contact.linkedin) $("bLiUrl").value = P().contact.linkedin; }
  });
  $("bPick").addEventListener("click", () => $("bFile").click());
  $("bFile").addEventListener("change", async () => { await builderImportFile($("bFile").files[0], $("bImportStatus")); $("bFile").value = ""; });
  ["dragenter", "dragover"].forEach(t => $("bDrop").addEventListener(t, e => { e.preventDefault(); $("bDrop").classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => $("bDrop").addEventListener(t, e => { e.preventDefault(); $("bDrop").classList.remove("over"); }));
  $("bDrop").addEventListener("drop", e => e.dataTransfer && builderImportFile(e.dataTransfer.files[0], $("bImportStatus")));
  $("bFromScanner").addEventListener("click", async () => { if (await importResumeText(finalText(), $("bImportStatus"), "the resume from Tailor to a job")) { builder.step = 0; renderBuilder(false); } });
  // LinkedIn: its PDF, or the profile page copied and pasted
  $("bLiPick").addEventListener("click", () => $("bLiFile").click());
  $("bLiFile").addEventListener("change", async () => { await builderImportLinkedIn($("bLiFile").files[0], $("bImportStatus")); $("bLiFile").value = ""; });
  ["dragenter", "dragover"].forEach(t => $("bLiDrop").addEventListener(t, e => { e.preventDefault(); $("bLiDrop").classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => $("bLiDrop").addEventListener(t, e => { e.preventDefault(); $("bLiDrop").classList.remove("over"); }));
  $("bLiDrop").addEventListener("drop", e => e.dataTransfer && builderImportLinkedIn(e.dataTransfer.files[0], $("bImportStatus")));
  $("bLiPasteGo").addEventListener("click", async () => {
    const t = $("bLiPaste").value, st = $("bImportStatus");
    if (wordCount(t) < 20) { st.classList.add("err"); st.textContent = "Paste your whole LinkedIn profile page first: press Ctrl+A then Ctrl+C on it (Cmd on a Mac)."; return; }
    if (await importInto("linkedin", { ...liFromPage(t), url: $("bLiUrl").value.trim() }, st, "your LinkedIn page")) { $("bLiPaste").value = ""; builder.step = 0; renderBuilder(false); }
  });
  $("bLiUrl").addEventListener("change", () => { const u = shortUrl($("bLiUrl").value); $("bLiUrl").value = u; if (u && /linkedin\.com\/in\//i.test(u) && !P().contact.linkedin) { P().contact.linkedin = u; touchProfile("import"); } });
  $("bLiOpen").addEventListener("click", () => { const u = shortUrl($("bLiUrl").value) || shortUrl(P().contact.linkedin); if (u) window.open("https://www." + u.replace(/^www\./, ""), "_blank", "noopener"); else $("bLiUrl").focus(); });
  $("bReset").addEventListener("click", () => {
    const b = $("bReset");
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Clear all my answers?"; setTimeout(() => { b.dataset.sure = ""; b.textContent = "Start fresh"; }, 4000); return; }
    b.dataset.sure = ""; b.textContent = "Start fresh";
    builder.undo = JSON.parse(JSON.stringify(P()));
    replaceProfile(emptyProfile(), "reset");
    builder.step = 0; builder.sugg = {}; builder.open = openSets();
    renderBuilder(true);
    const st = $("bImportStatus"); $("bImport").hidden = false; st.innerHTML = 'Cleared. <button class="linkish" type="button" id="bUndoReset">Undo</button>';
    $("bUndoReset").onclick = () => { replaceProfile(builder.undo, "import"); builder.undo = null; st.textContent = "Restored your answers."; };
  });
  $("useBuilt").addEventListener("click", () => { sendToScanner(); });
  viewHooks.builder = () => {
    if (!P().experience.length) P().experience.push(emptyExp());
    if (!P().education.length) P().education.push(emptyEdu());
    renderBuilder(false);
  };
  onProfile(src => {
    $("useBuilt").hidden = !hasProfile(P());
    if (currentView === "builder" && src !== "builder") renderBuilder(false);
  });
});

