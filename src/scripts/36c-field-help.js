/* ===================== An (i) beside every input box: hover or focus it to see what to add and why ===================== */
// One watcher looks for boxes without an (i) and adds one, so boxes drawn later (the resume steps, cards, dialogs) get theirs too.
// The words come from HELP below, matched on the box's label, id, placeholder and data- names; a box nothing matches gets a plain
// answer for its kind (a text box, a long box, a menu, a date, a link). Hover or focus shows it; click or tap keeps it open; Esc closes it.
// Each row: [pattern, what to add, why it matters]
const HELP = [
  // account and AI
  [/acctemail/, "The email you'll sign in with.", "It's how we recognise you on any device. It isn't used for marketing."],
  [/acctpass/, "A password of at least 8 characters that you don't use anywhere else.", "It protects the resume and details saved to your account."],
  [/aickeysize|model size/, "Leave it on automatic unless Job Finder has guessed wrong.", "Small models get short, one-job-at-a-time prompts and tight answers. Large ones get fuller instructions."],
  [/aickeybase|ends in \/v1/, "The web address of the service, ending in /v1.", "Only needed for the “Other” option, so Job Finder knows where to send your requests."],
  [/aickeymodel|^model$|model\b.*load/, "The model's name, or press Load models and pick one.", "The model sets the quality, speed and cost of the writing. Small ones are quick and cheap; large ones write better."],
  [/aickey\b|api key/, "Paste the key you copied from your AI company's website.", "A key lets Job Finder use your own AI account. It stays in this browser and goes only to that company."],
  // the job
  [/aiming for|job you want|role you're applying|clrole|lt-role|li-target|target\.title/, "The exact job title you're after. Copy it from the ad if you have one.", "Recruiters and tracking software search on job titles, and the AI chooses which skills to lead with from it."],
  [/paste the job ad|jobtext|target\.ad|jbaddtext|the job ad|copy and paste the whole/, "The whole ad: title, duties and requirements. Copy it from Seek, LinkedIn or the company's site.", "Job Finder compares your resume with what the ad asks for, word for word, because tracking software does the same."],
  [/jbaddurl|link to the ad|\bad-?url\b|trkf:url/, "The web address of the ad, starting with https://.", "It lets you get back to the ad later and check what it asked for."],
  [/clcompany|lt-company|target\.company|^company$|co-name|trkf:company/, "The organisation's name as it appears in the ad.", "It personalises the letter and lets Job Finder look up what the company says it values."],
  [/clrecipient|lt-recipient|addressed to|hiring manager's name/, "The hiring manager's name from the ad or LinkedIn. Leave it blank if you can't find one.", "A letter to a named person shows effort. A wrong name is worse than “Dear Hiring Manager”."],
  [/claddress|company address/, "The employer's street address if the ad gives it.", "It goes in the letter's header, as in a formal Australian business letter. Skip it if you're unsure."],
  [/clsource|where you saw the ad/, "Where you found the job: Seek, LinkedIn, a careers site or a person.", "Saying how you found the role makes the opening feel natural, and a referral is worth naming."],
  [/clwhy|why this company|fitwhy/, "One or two real reasons the company draws you: a project, a product or a value.", "Employers say generic letters are the biggest turn-off. This keeps the letter specific and honest."],
  [/clavail|fitavail|availability|days and hours|when can you start|start date|startwhen/, "When you can start, and the days and hours you can work.", "For part-time, casual and graduate roles it's often the first thing employers ask."],
  [/clname\b|clemail|clphone|cllocation/, "The same contact details as your resume.", "Matching details look careful, and the employer needs a way to reach you."],
  [/lt-sal|greeting/, "How to open the letter, like “Dear Ms Nguyen,”.", "A greeting that uses a real name reads warmer. “Dear Hiring Manager,” is the safe fallback."],
  [/lt-sign|sign-off/, "“Yours sincerely,” if you used a name, “Yours faithfully,” if you didn't.", "It's the Australian convention, and a mismatch is something careful readers notice."],
  [/clpaste|a cover letter you've sent|clfile/, "A letter you've sent before, if you have one.", "The AI picks up your voice and real examples from it. It never copies another company's name."],
  [/ltp-\d|data-ltp|write this paragraph/, "This paragraph of the letter, in full sentences.", "Each paragraph has one job. Starting with context makes it read as part of a letter, not a list."],
  [/clgap\d/, "The missing detail the letter asked for, in a few words.", "The letter is left with a gap if it isn't given, and an invented detail would be worse."],
  // you
  [/first name|contact\.first|\bfirst\b/, "Your first name as you'd like it on the page.", "Use the name on your documents so references and checks match."],
  [/last name|surname|contact\.last/, "Your family name.", "It's what recruiters sort and search by."],
  [/\bemail\b|contact\.email|co-email|data-pf:.*email/, "An address you check daily that sounds professional, like first.last@...", "It's how employers will reach you first. Joke addresses cost interviews."],
  [/mobile number|b_phone|\bphone\b|\btel\b/, "Your mobile number. Add the country code if it's not an Australian number.", "Many recruiters ring first. Leave out lines you can't answer."],
  [/suburb and state|contact\.location|clocation|^location$|ad-location|co-location|trkf:location|data-place/, "The suburb or city and state where the work is, or where you live. No street address.", "Employers filter by area, and a full address is a privacy risk with no benefit."],
  [/jbwhere|^where$/, "A city, a state or the word remote.", "It narrows the list to jobs you could actually get to."],
  [/linkedin|bliurl|li-url/, "Your public LinkedIn address, like linkedin.com/in/your-name.", "Recruiters look you up. Job Finder can also read what you paste from your profile to fill in your details."],
  [/portfolio|github|website|contact\.website|co-website/, "A link to work you're proud of, or the company's website.", "It shows evidence, not just claims. Only add something you'd be happy for an employer to open."],
  [/work rights|workrights/, "Your Australian work rights: citizen, permanent resident or the visa you hold.", "Employers must check you can work here. Saying so up front avoids being filtered out."],
  [/driver|licence/, "Your licence class (for example C for a car), if the job could use it.", "Site, field and sales roles often require it. Leave it blank if it doesn't matter."],
  [/summaryq\.who|describe yourself professionally/, "One plain line about who you are professionally, like “final-year civil engineering student who enjoys site work”.", "The AI builds your summary from your own words, so it should sound like you."],
  [/summaryq\.strengths|strongest skills/, "Two or three skills you can prove, like tools or methods.", "They lead your summary, and the job ad is likely looking for them."],
  [/summaryq\.proof|result you're proud of/, "One real result, with a number if you know it.", "Proof makes a summary believable. Job Finder never adds numbers you didn't give."],
  [/summaryq\.next|looking for next/, "The kind of role, placement or industry you want next.", "It tells the reader what you're a fit for, and ends the summary on a goal."],
  [/your summary|data-path:summary$|summary$/, "Two to four sentences: who you are, your strongest skills with proof, what you want next.", "It's read first. Recruiters decide in seconds whether to keep reading."],
  [/awards|scholarships/, "Awards, scholarships and prizes, one per line, with the year.", "Recognition from others builds trust that your own claims can't."],
  [/publications/, "Papers or articles, one per line, in your field's citation style.", "Only relevant for research roles. Consistent citations show care."],
  [/interests/, "A short line of real interests.", "It adds some personality and culture fit. Keep it brief and true."],
  // work and study entries
  [/job title|data-path:.*\.title|ad-title|trkf:title/, "The job title you held or are advertising, exactly as it was.", "Titles are checked in reference calls, and tracking software matches on them."],
  [/employer|organisation|\.org\b/, "The organisation you worked for.", "Recruiters may verify it, so use the real name."],
  [/started|finished|\.starts|\.ends|date\b|applied|follow ?up|interview on|ad-closes|closes/, "A month and year, like Feb 2023. Tick “present” for something you still do.", "Dates show a clear timeline. Gaps and overlaps get noticed by people and tracking software."],
  [/main responsibilities/, "What you did day to day, in plain words. Don't worry about the wording.", "The AI turns your plain answers into strong bullet points using only what you say."],
  [/achieve, improve|recognised for|achievements and results/, "Results: something faster, cheaper, bigger or praised, with numbers if you know them.", "Results set you apart from everyone else who had the same duties."],
  [/tools, software|equipment/, "Software, machinery and methods you used.", "Skills shown in real work are more convincing than a list, and tracking software searches for them."],
  [/who did you work with|work with or for/, "Team size, customers, clients, or who you reported to.", "It shows the scale and kind of work you were trusted with."],
  [/second degree|^level$|\.level\b/, "The level of the qualification: Bachelor, Master, Diploma, Certificate.", "It sets the layout and how the qualification is described."],
  [/relevant subjects|coursework/, "Subjects that match the kind of job you want.", "With little work history, they show you've already learned what the job needs."],
  [/thesis|major project/, "The title of your thesis or main project, with one line on what you found or built.", "It shows depth. Job Finder tidies it into “Thesis: Title”."],
  [/\bgrade\b|\bwam\b|\bgpa\b|gradetype/, "Your average mark. Type the number and the type is picked for you.", "Include it only if it helps; many graduate employers ask for it."],
  [/project name|for or with/, "What the project was called, and who it was for.", "A named project with a client or purpose reads as real work."],
  [/one point per line|what did you do, and what came of it|what did you do\?/, "One short point per line: what you did, how, and what changed.", "Short lines with a result are easy to skim, and the AI can polish them."],
  [/their role|referees|data-path:referees|refmode/, "Someone who has agreed to speak about your work: a supervisor or lecturer, not a friend.", "Employers call referees late in hiring. Ask first, and tell them about the job."],
  [/^name$|\bname\b/, "The name as it should appear.", "Accurate names avoid mix-ups in references and applications."],
  [/language/, "A language you speak besides English, and how well.", "Languages can set you apart, especially in client-facing or community roles."],
  [/subject or field|field of study|\bmajor\b/, "Your main subject, like “Mechanical Engineering”. Pick from the list as you type.", "Employers match your study to the discipline a job asks for."],
  [/university, tafe|school|institution|\buniversity\b/, "Where you studied. Start typing and pick from the list.", "A recognised name is easy for employers to check and looks consistent on the page."],
  [/software and tools/, "Programs and equipment you can use, like AutoCAD, Excel, SAP or a forklift licence.", "Tracking software matches tools word for word, and they back up your experience."],
  [/\bstrengths\b|chl_strengths/, "Two or three things you do well, like problem solving or clear writing.", "They give your summary and cover letter true points to build on."],
  [/chip-in|chl_|skills\b|li-skills/,"Skills, one at a time or one per line. Use the names employers use, like “AutoCAD” or “stakeholder engagement”.", "Tracking software matches skills word for word, and recruiters scan for them."],
  [/data-bullet|bullet point|data-sugg-edit|bask/, "One achievement or task: start with an action verb and say what changed.", "Bullets are what recruiters actually read. Specific ones beat vague duties."],
  // resume text and other pages
  [/fileinput|bfile/, "Your resume as a PDF or Word file.", "Job Finder reads the text from it to fill in your details, so you don't retype them."],
  [/ltfile|clfile/, "A cover letter as a PDF or Word file.", "The AI picks up your voice and real examples from it."],
  [/blifile|lifile/, "Your LinkedIn profile saved as a PDF (on your profile, choose More, then Save to PDF).", "It gives Job Finder your real jobs and study so you don't retype them."],
  [/jobtype|kind of work/, "The kind of work you're after, like engineering, trades or healthcare.", "It shapes the suggested wording, skills and questions."],
  [/pf-target-stage|career stage|where are you in your career/, "Where you are in your career: student, early career, experienced, changing careers or returning to work.", "It decides whether study or experience leads your resume, and the tone of your letters."],
  [/resumetext|resume text|upload a file above|paste your resume/, "Your resume as plain text, or upload a file above.", "This is what tracking software reads. Tables and columns can hide text from it, so check it's all here."],
  [/rsedit|change anything, add the detail/, "Edit the wording and add any detail only you know.", "The AI works from what's written, so your corrections make the result truer."],
  [/blipaste|lipaste|your linkedin profile page, pasted|ctrl\+a/, "Everything you copied from your LinkedIn profile page (Ctrl+A, then Ctrl+C).", "It saves retyping: Job Finder reads it to fill in your jobs and study."],
  [/li-headline|headline/, "The line under your name: your role plus what you offer, like “Mechanical engineering student | CAD and FEA”.", "It shows in search results and beside every comment, so it's your first impression."],
  [/li-about|^about$|co-about/, "A short story of who you are, what you do well and what you want next, in your own voice.", "Most people read only the first lines. Lead with what matters to your reader."],
  [/li-experience|li-education/, "Paste or write your jobs or study, each with title, organisation, dates and a few results.", "Recruiters search these. A clear history makes you easier to find and to trust."],
  // finding and tracking jobs
  [/jbq|^keywords$|job title, skill or company/, "A job title, skill or company name.", "A few precise words find better matches than a long phrase."],
  [/jbtype|work type/, "Full time, part time, casual or contract.", "It filters out jobs that don't fit your hours."],
  [/jbsource|^from$/, "Where jobs come from: direct from employers or job boards.", "Jobs from the employer's own site have the full description and apply button."],
  [/jbsort|^sort$|cosort|^order$/, "How to order the list.", "Newest first helps you apply while a job is fresh. Best match puts closer fits first."],
  [/cosearch|jbcompanyq|find a company|company, value or industry/, "A company name, value or industry.", "It narrows the list so you can read about employers you'd actually consider."],
  [/coindustry|^industry$/, "The industry you're interested in.", "It narrows the company list to your field."],
  [/costate|^state$/, "The state or territory.", "It narrows the list to employers near you."],
  [/trksearch|^search$/, "A job title, company or part of a note.", "It finds an application among many."],
  [/trkf:salary|ad-salary|salary or range|salary expectations/, "A range, like $75,000 to $82,000 plus super, based on research for the role and city.", "A range is easier to negotiate than a single number, and employers compare packages including super."],
  [/trkf:contact|contact person/, "The recruiter or hiring manager's name, email or phone.", "You'll need it when you follow up or thank them after an interview."],
  [/trk-notes|^notes$|ad-notes/, "What you spoke about, questions they asked, and what to do next.", "Notes help you prepare for the next call and follow up accurately."],
  [/trkf:closedwhy|\bstg-|data-trk:stage/,"Where this application is up to.", "It keeps your list honest and shows which jobs need a follow-up."],
  [/apnote/, "Two or three sentences on why you're interested in this role.", "Employers read this before your resume. A genuine reason stands out."],
  // interviews
  [/ivanswer/, "Your answer in your own words. For stories use situation, task, action, result.", "Typing it out first makes the real answer calmer and clearer. Feedback is based only on what you write."],
  [/scr-pitch|60-second background/, "Present, past, future: who you are now, two experiences that led here, why this role.", "It's the usual first screening question, so a tight answer sets the tone."],
  [/\bscr-|\bst-/,"Your answer in a few lines, using real details.", "Prepared answers are easier to deliver under pressure, and stay accurate."],
  // hiring (employer side)
  [/ad-worktype|ad-remote|data-ad:worktype|data-ad:remote/, "How the job is worked: hours and where.", "Candidates filter on this. Clear answers bring the right applicants."],
  [/\bad-|data-ad:/, "The detail for this part of the job ad.", "Specific ads attract fewer but better applicants."],
  [/needsguidepick/, "Pick a company guide to see what that employer values.", "It helps you tailor your application to the company's own words."],
  // fallbacks by kind come from helpKind()
];
const HELP_KIND = {
  textarea: ["Write it in your own words. Specific details such as names, numbers and tools are what make it convincing.", "Job Finder and the AI only use what you tell them, and never add facts you didn't give."],
  select: ["Pick the closest option.", "Your choice changes how Job Finder tailors the next steps. You can change it later."],
  date: ["Pick or type the date.", "Dates keep your timeline and follow-ups accurate."],
  url: ["Paste the full web address, starting with https://.", "A full link takes people to the right page."],
  search: ["Type a few words to narrow the list.", "Fewer, more specific words usually find better matches."],
  file: ["Choose the file from your computer.", "Job Finder reads the text in it on your device to fill in your details."],
  text: ["Type your answer. Leave it blank if it doesn't apply.", "What you enter fills your resume, letters and applications, so accurate beats impressive."]
};
const helpSkipType = new Set(["hidden", "checkbox", "radio", "button", "submit", "reset", "range", "color", "image"]);
const helpState = { pop: null, btn: null, pinned: false, timer: 0, n: 0 };
const helpKeyOf = (el, label) => [label, el.id, el.name, el.getAttribute("placeholder"), el.getAttribute("aria-label"), ...Object.entries(el.dataset).map(([k, v]) => `data-${k}:${v}`)].filter(Boolean).join(" ").toLowerCase();
// The words for one box: [what to add, why]
function helpFor(el, label = "") {
  const key = helpKeyOf(el, label);
  const hit = HELP.find(([re]) => re.test(key));
  if (hit) return [hit[1], hit[2]];
  const t = el.tagName === "TEXTAREA" ? "textarea" : el.tagName === "SELECT" ? "select" : (el.type || "text");
  return HELP_KIND[t] || HELP_KIND.text;
}
// The label's own words: without the box, the menu's choices, "(optional)" or an earlier (i)
function helpLabelText(lab, el) {
  if (!lab) return (el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim();
  const c = lab.cloneNode(true);
  c.querySelectorAll("input,select,textarea,datalist,.hinfo,.opt,.q-hint,ul").forEach(n => n.remove());
  return c.textContent.replace(/\s+/g, " ").trim();
}
function helpLabelOf(el) {
  const by = el.getAttribute("aria-labelledby");
  if (by) { const n = document.getElementById(by.split(/\s+/)[0]); if (n) return n; }
  if (el.id) { const l = document.querySelector(`label[for="${(window.CSS && CSS.escape) ? CSS.escape(el.id) : el.id}"]`); if (l) return l; }
  const w = el.closest("label");
  if (w && !w.classList.contains("q-check")) return w;
  const q = el.closest(".q, .lt-part");
  return q ? q.querySelector(".q-label") : null;
}
function helpEnhance(root = document) {
  for (const el of root.querySelectorAll("input,textarea,select")) {
    if (el.dataset.hi || helpSkipType.has(el.type) || el.disabled || el.closest("#chatPanel,.hinfo-pop,[data-nohelp]")) continue;
    if (el.type === "file" && el.hidden) continue;
    el.dataset.hi = "1";
    const group = el.closest(".q, .lt-part, label.field");
    if (group && group.querySelector(".hinfo")) continue;   // one (i) per question, even when it has several boxes (phone code and number)
    const lab0 = helpLabelOf(el), hiddenLab = !!(lab0 && /visually-hidden|sr-only/.test(lab0.className)), lab = hiddenLab ? null : lab0;
    const text = helpLabelText(lab0, el) || el.getAttribute("aria-label") || el.getAttribute("placeholder") || (el.type === "file" ? "the file" : "this box");
    const [what, why] = helpFor(el, text);
    const b = document.createElement("button");
    b.type = "button"; b.className = "hinfo"; b.textContent = "i"; b.dataset.what = what; b.dataset.why = why;
    b.setAttribute("aria-label", `What to add: ${text.replace(/\s*\(optional\)\s*/i, "")}`); b.setAttribute("aria-expanded", "false");
    if (lab && lab.contains(el)) {
      // a label that wraps the box: put the (i) with the label's words, so the box keeps its place
      const lead = [...lab.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (lead) { const s = document.createElement("span"); s.className = "hinfo-line"; lead.replaceWith(s); s.append(lead, " ", b); }
      else { const e1 = [...lab.children].find(c => c !== el && !c.contains(el) && !c.matches("input,select,textarea,datalist,.hinfo") && c.textContent.trim()); if (e1) e1.append(" ", b); else lab.insertBefore(b, el); }
    } else if (lab) lab.append(" ", b);
    else { b.classList.add("solo"); el.after(b); }
  }
}
function helpPopFor(b) {
  let p = helpState.pop;
  if (!p) {
    p = helpState.pop = document.createElement("div");
    p.id = "hinfoPop"; p.className = "hinfo-pop"; p.setAttribute("role", "tooltip"); p.hidden = true;
    p.addEventListener("mouseenter", () => clearTimeout(helpState.timer));
    p.addEventListener("mouseleave", () => helpHideSoon());
    document.body.appendChild(p);
  }
  p.innerHTML = `<p><b>What to add</b> ${esc(b.dataset.what)}</p><p><b>Why</b> ${esc(b.dataset.why)}</p>`;
  const host = b.closest("dialog[open]") || document.body;   // inside a dialog it has to live in the dialog, or the dialog would cover it
  if (p.parentNode !== host) host.appendChild(p);
  return p;
}
function helpShow(b) {
  clearTimeout(helpState.timer);
  if (helpState.btn && helpState.btn !== b) helpState.btn.setAttribute("aria-expanded", "false");
  const p = helpPopFor(b);
  helpState.btn = b; b.setAttribute("aria-expanded", "true"); b.setAttribute("aria-describedby", "hinfoPop");
  p.hidden = false;
  const r = b.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
  let left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
  let top = r.bottom + 8; if (top + h > vh - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
  p.style.left = left + "px"; p.style.top = Math.max(8, top) + "px";
}
function helpHide() { clearTimeout(helpState.timer); helpState.pinned = false; if (helpState.pop) helpState.pop.hidden = true; if (helpState.btn) { helpState.btn.setAttribute("aria-expanded", "false"); helpState.btn.removeAttribute("aria-describedby"); } }
function helpHideSoon() { clearTimeout(helpState.timer); if (!helpState.pinned) helpState.timer = setTimeout(helpHide, 160); }
function helpInit() {
  helpEnhance();
  let queued = 0;
  new MutationObserver(() => { if (queued) return; queued = setTimeout(() => { queued = 0; helpEnhance(); }, 80); }).observe(document.body, { childList: true, subtree: true });
  const hinfo = e => e.target.closest && e.target.closest(".hinfo");
  document.addEventListener("mouseover", e => { const b = hinfo(e); if (b && !helpState.pinned) helpShow(b); });
  document.addEventListener("mouseout", e => { if (hinfo(e) && !helpState.pinned) helpHideSoon(); });
  document.addEventListener("focusin", e => { const b = hinfo(e); if (b) helpShow(b); else if (!helpState.pinned) helpHide(); });
  document.addEventListener("focusout", e => { if (hinfo(e) && !helpState.pinned) helpHideSoon(); });
  document.addEventListener("click", e => {
    const b = hinfo(e);
    if (b) { e.preventDefault(); e.stopPropagation(); if (helpState.pinned && helpState.btn === b) helpHide(); else { helpShow(b); helpState.pinned = true; } return; }
    if (helpState.pinned && !e.target.closest(".hinfo-pop")) helpHide();
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && helpState.pop && !helpState.pop.hidden) helpHide(); });
  window.addEventListener("scroll", () => { if (helpState.pop && !helpState.pop.hidden && helpState.btn) helpShow(helpState.btn); }, { passive: true, capture: true });
}
onInit(helpInit);
