/* ===================== LinkedIn review ===================== */
const linStore = privateDoc("linkedin", "jobfinder.linkedin.v1", () => ({ input: { headline: "", about: "", experience: "", skills: "", education: "", target: "", url: "", checks: {} }, last: null, completed: "" }));
const LI_CHECKS = [
  ["photo", "A clear, recent profile photo", 4], ["banner", "A background banner (not the default)", 2], ["url", "A custom URL (linkedin.com/in/your-name)", 2],
  ["location", "Your location is set", 2], ["open", "Open to Work is on (visible to recruiters only is fine)", 3], ["recs", "At least 2 recommendations", 3],
  ["conn", "500 or more connections", 3], ["featured", "A Featured section (a project, article or portfolio)", 2], ["certs", "Licences and certifications listed", 2]
];
const LI_CATS = [["headline", "Headline", 15], ["about", "About", 20], ["experience", "Experience", 20], ["skills", "Skills and keywords", 15], ["basics", "Profile basics", 15], ["proof", "Credibility", 10], ["match", "Matches your resume", 5]];

/* --- Reading LinkedIn's "Save to PDF" export (two columns: a sidebar and the main column) --- */
async function readLinkedInPdf(file) {
  await loadScript(PDFJS);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const side = [], main = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const w = page.getViewport({ scale: 1 }).width;
    const tc = await page.getTextContent();
    const rows = new Map();
    for (const it of tc.items) {
      if (!it.str || !it.transform) continue;
      const x = it.transform[4], y = Math.round(it.transform[5]), size = Math.abs(it.transform[3]) || it.height || 10;
      const col = x < w * 0.3 ? "s" : "m";
      const key = col + ":" + y;
      if (!rows.has(key)) rows.set(key, { col, y, x, size, parts: [] });
      rows.get(key).parts.push({ x, s: it.str });
    }
    const sorted = [...rows.values()].sort((a, b) => b.y - a.y);
    for (const r of sorted) {
      const text = r.parts.sort((a, b) => a.x - b.x).map(p => p.s).join(" ").replace(/\s+/g, " ").trim();
      if (!text || /^Page \d+ of \d+$/i.test(text)) continue;
      (r.col === "s" ? side : main).push({ text, size: r.size });
    }
  }
  return parseLinkedInColumns(side, main);
}
function parseLinkedInColumns(side, main) {
  const out = { headline: "", about: "", experience: "", skills: "", education: "", name: "", location: "", checks: {} };
  const HEAD = /^(Summary|About|Experience|Education|Licen[cs]es & Certifications|Volunteer Experience|Projects|Honors-Awards|Publications)$/i;
  // main column: name (largest text), then headline and location, then sections
  const firstHead = main.findIndex(l => HEAD.test(l.text));
  const top = main.slice(0, firstHead < 0 ? Math.min(main.length, 4) : firstHead);
  const big = top.slice().sort((a, b) => b.size - a.size)[0];
  out.name = big ? big.text : "";
  const rest = top.filter(l => l !== big).map(l => l.text);
  if (rest.length >= 2 && /,|\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT|Australia)\b/.test(rest[rest.length - 1])) { out.location = rest.pop(); }
  out.headline = rest.join(" ").trim();
  let cur = null;
  const buckets = {};
  for (const l of main.slice(firstHead < 0 ? top.length : firstHead)) {
    if (HEAD.test(l.text)) { cur = l.text.toLowerCase(); buckets[cur] = []; continue; }
    if (cur) buckets[cur].push(l.text);
  }
  out.about = (buckets.summary || buckets.about || []).join(" ").replace(/\s+/g, " ").trim();
  out.experience = (buckets.experience || []).join("\n");
  out.education = (buckets.education || []).join("\n");
  // sidebar: contact, top skills, certifications
  let sc = null; const sb = {};
  for (const l of side) {
    if (/^(Contact|Top Skills|Skills|Languages|Certifications|Honors-Awards|Publications|Patents)$/i.test(l.text)) { sc = l.text.toLowerCase(); sb[sc] = []; continue; }
    if (sc) sb[sc].push(l.text);
  }
  out.skills = (sb["top skills"] || sb.skills || []).join("\n");
  const contact = (sb.contact || []).join(" ");
  if (/linkedin\.com\/in\/[a-z0-9-]+/i.test(contact)) out.checks.url = !/linkedin\.com\/in\/[a-z-]+-[a-z0-9]{6,}/i.test(contact.replace(/\s/g, ""));
  if (out.location) out.checks.location = true;
  if ((sb.certifications || []).length) out.checks.certs = true;
  // for the resume builder: the certificates and languages listed down the side
  // the email, mobile number and profile link in the Contact box (the link wraps over two lines, so spaces are ignored)
  const em = contact.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/); if (em) out.email = em[0];
  const ph = (sb.contact || []).map(l => l.match(/^(\+?[\d\s().-]{7,}?)\s*\((?:Mobile|Home|Work)\)/i)).find(Boolean); if (ph) out.phone = ph[1].trim();
  const um = contact.replace(/\s/g, "").match(/linkedin\.com\/in\/[A-Za-z0-9_%-]+/i); if (um) out.url = um[0];
  out.certs = (sb.certifications || []).filter(l => l.length <= 90);
  out.languages = (sb.languages || []).filter(l => l.length <= 60);
  return out;
}

/* --- A profile page copied from LinkedIn (Ctrl+A, Ctrl+C) and pasted in --- */
// LinkedIn doesn't let other sites read a profile from its link, so this is the next best thing to the link.
const LI_PAGE_HEADS = /^(About|Featured|Activity|Experience|Education|Licen[cs]es (&|and) certifications|Projects|Skills|Recommendations|Honou?rs (&|and) awards|Languages|Interests|Volunteering|Volunteer experience|Courses|Publications|Causes|Organi[sz]ations|Test scores|Services|People also viewed|People you may know|You might like|More profiles for you|Explore premium profiles)$/i;
const LI_NOISE = /^(Show all.*|Show more.*|Show less|…\s*see more|see more|Endorse|Endorsed|Message|Follow|Following|Connect|More|Open to|Add profile section|Enhance profile|Resources|Show credential|Edit|Show translation|Contact info|Visit my website|Like|Comment|Repost|Send|Skip to (main )?content|Home|My Network|Jobs|Messaging|Notifications|Me|For Business|Try Premium.*|Learning|Post|Posts|Comments|Images|Videos|Articles|Documents|Report this profile|\d[\d,]*\+? (followers?|connections?)|\d+ endorsements?|\d+ mutual connections?.*|.* logo|·|•)$/i;
const LI_TYPES = /\s*·\s*(Full-time|Part-time|Casual|Contract|Internship|Self-employed|Freelance|Apprenticeship|Seasonal|Permanent( Full-time| Part-time)?|Temporary)\b.*$/i;
function liFromPage(text) {
  const raw = String(text || "").split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  // the page repeats most lines for screen readers: drop the copies and the buttons
  const lines = raw.filter((l, i) => l !== raw[i - 1] && !LI_NOISE.test(l));
  const out = { headline: "", about: "", experience: "", skills: "", education: "", name: "", location: "", checks: {} };
  if (raw.some(l => /^500\+ connections$/i.test(l))) out.checks.conn = true;
  if (raw.some(l => /^Featured$/i.test(l))) out.checks.featured = true;
  const firstHead = lines.findIndex(l => LI_PAGE_HEADS.test(l));
  const top = lines.slice(0, firstHead < 0 ? Math.min(lines.length, 6) : firstHead).filter(l => !/^(he|she|they)\/(him|her|them)$/i.test(l) && !/^(\d+(st|nd|rd|th)|degree connection)/i.test(l));
  const locAt = top.findIndex(l => /,\s*(Victoria|New South Wales|Queensland|Western Australia|South Australia|Tasmania|Australian Capital Territory|Northern Territory|Australia)\b|\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)$/.test(l));
  if (locAt >= 0) { out.location = top[locAt]; out.checks.location = true; }
  const beforeLoc = locAt >= 0 ? top.slice(0, locAt) : top;
  out.name = beforeLoc.length > 1 ? beforeLoc[beforeLoc.length - 2] : "";
  out.headline = beforeLoc[beforeLoc.length - 1] || "";
  const sec = {};
  let cur = null;
  for (const l of lines.slice(firstHead < 0 ? lines.length : firstHead)) {
    if (LI_PAGE_HEADS.test(l)) { cur = l.toLowerCase().replace(/&/g, "and"); sec[cur] = sec[cur] || []; continue; }
    if (cur) sec[cur].push(l);
  }
  out.about = (sec.about || []).join(" ").trim();
  // Experience on the page is title, "Company · Full-time", dates · length, place, description: put it in the PDF's order
  const ex = sec.experience || [], roles = [];
  let groupCo = "";
  ex.forEach((l, i) => {
    if (/^(Full-time|Part-time|Casual|Contract|Internship)?\s*·?\s*\d+\s*(yrs?|years?|mos?|months?)\b/i.test(l) && !LI_DATES.test(l) && i > 0) { groupCo = ex[i - 1]; return; }
    if (!LI_DATES.test(l)) return;
    const prev = ex[i - 1] || "", prev2 = ex[i - 2] || "";
    const typed = LI_TYPES.test(prev) || / · /.test(prev);
    roles.push({ at: i, title: typed ? prev2 : prev, company: typed ? prev.replace(LI_TYPES, "").replace(/\s*·.*$/, "") : groupCo, dates: l.match(LI_DATES)[0], skip: typed ? 2 : 1 });
  });
  out.experience = roles.map((r, k) => {
    const end = k + 1 < roles.length ? roles[k + 1].at - roles[k + 1].skip : ex.length;
    let body = ex.slice(r.at + 1, end).filter(x => !/^Skills?:/i.test(x));
    if (body[0] && body[0].length < 70 && /,|remote|hybrid|on-site|australia/i.test(body[0])) body = body.slice(1);
    return [r.company, r.title, r.dates.replace(/\s*-\s*/, " - "), ...body].filter(Boolean).join("\n");
  }).join("\n\n");
  out.education = (sec.education || []).filter(l => !/^(Grade|Activities and societies):?$/i.test(l)).join("\n");
  out.skills = [...new Set((sec.skills || []).filter(l => l.length <= 60 && !/\d/.test(l) && !/ (at|and \d|experiences?) /i.test(l) && !/^(Passed LinkedIn|Endorsed by)/i.test(l)))].join("\n");
  const lc = sec["licenses and certifications"] || sec["licences and certifications"] || [];
  if (lc.length) out.checks.certs = true;
  // for the resume builder: each certificate's name sits two lines above its "Issued" date
  out.certs = lc.map((l, i) => /^Issued\b/i.test(l) && i >= 2 ? lc[i - 2] : "").filter(x => x && x.length <= 90 && !/^(Issued|Credential|Expires)/i.test(x));
  const lg = sec.languages || [];
  out.languages = lg.map((l, i) => /proficiency/i.test(l) ? "" : /proficiency/i.test(lg[i + 1] || "") ? `${l} (${lg[i + 1].replace(/\s*proficiency\s*/i, "")})` : l).filter(x => x && x.length <= 60);
  return out;
}

/* --- Splitting the pasted Experience section into roles --- */
const LI_DATES = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—]\s*(Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})/i;
function liRoles(text) {
  const lines = String(text || "").split("\n").map(l => l.trim()).filter(Boolean);
  const roles = [];
  lines.forEach((l, i) => {
    if (!LI_DATES.test(l)) return;
    const title = lines[i - 1] || "", company = lines[i - 2] && !LI_DATES.test(lines[i - 2]) && !/^\d+ (yrs?|years?|mos?|months?)/i.test(lines[i - 2]) ? lines[i - 2] : "";
    roles.push({ title, company, dates: l.match(LI_DATES)[0], start: i + 1, head: company ? i - 2 : i - 1, current: /present/i.test(l) });
  });
  roles.forEach((r, k) => {
    // a role's text runs up to the next role's company line (not into it)
    let body = lines.slice(r.start, k + 1 < roles.length ? Math.max(r.start, roles[k + 1].head) : lines.length);
    r.loc = "";
    if (body[0] && body[0].length < 50 && /,|remote|hybrid|on-site|australia/i.test(body[0])) { r.loc = body[0]; body = body.slice(1); }
    r.desc = body.join("\n");
  });
  return roles;
}

/* --- Scoring --- */
function liTargetSkills(inp) {
  if (lastResult) return [...lastResult.hard].sort((a, b) => b.rel - a.rel).slice(0, 15).map(x => x.name);
  const p = P();
  const own = [...p.skills.hard, ...p.skills.software];
  const common = (COMMON_SKILLS[p.target.jobType] || {});
  const fromTarget = [...findSkills(norm(inp.target || p.target.title)).values()].map(x => x.skill.name);
  return [...new Set([...fromTarget, ...own, ...(common.hard || []), ...(common.software || [])])].slice(0, 15);
}
function scoreLinkedIn(inp) {
  const cats = {}, fixes = [], notes = {};
  const add = (cat, pts, max, msg, gain) => { cats[cat] = (cats[cat] || 0) + pts; if (msg) (notes[cat] = notes[cat] || []).push(msg); if (gain > 0 && msg) fixes.push({ cat, gain, msg }); void max; };
  const all = [inp.headline, inp.about, inp.experience, inp.skills].join("\n");
  const targets = liTargetSkills(inp);
  const have = skillSet(all);
  const missing = targets.filter(s => !have.has(s));
  const target = inp.target || P().target.title || (lastScan ? detectTitle(lastScan.jd, lastScan.title) : "");
  // Headline (15)
  const h = inp.headline.trim(), hl = h.length;
  if (!h) add("headline", 0, 15, "Write a headline. It's the first thing recruiters see in search results.", 15);
  else {
    add("headline", hl >= 60 ? 4 : 2, 4, hl < 60 ? `Your headline is ${hl} characters. Use more of the 220 to add your specialty and key skills.` : "", 2);
    const tWords = target ? contentWords(target) : new Set();
    const hasRole = target && [...tWords].some(w => contentWords(h).has(w));
    add("headline", hasRole ? 5 : 1, 5, !hasRole && target ? `Put the job you want (“${target}”) in your headline: recruiters search by job title.` : "", 4);
    const hk = [...skillSet(h)].length;
    add("headline", hk >= 2 ? 4 : hk ? 2 : 0, 4, hk < 2 ? "Add two or three key skills to your headline, separated by | or ·." : "", 4 - (hk >= 2 ? 4 : hk ? 2 : 0));
    const weak = /^(student|unemployed|looking for (work|opportunities)|seeking|open to work)\b/i.test(h) || /^[^|·,]{0,25}\bat\b/i.test(h) && !/\|/.test(h);
    add("headline", weak ? 0 : 2, 2, weak ? "“Student at…” or “Looking for work” undersells you. Lead with what you do or are training to do." : "", 2);
  }
  // About (20)
  const a = inp.about.trim(), aw = wordCount(a);
  if (!a) add("about", 0, 20, "Add an About section. It's where you tell your story and use the keywords recruiters search for.", 20);
  else {
    add("about", aw >= 120 && aw <= 400 ? 5 : aw >= 60 ? 3 : 1, 5, aw < 120 ? `Your About is ${aw} words. Aim for 150 to 300.` : aw > 400 ? `Your About is ${aw} words. Trim to under 350 so people finish it.` : "", aw < 120 ? 3 : 1);
    const hook = a.slice(0, 260);
    const hookOk = (target && [...contentWords(target)].some(w => contentWords(hook).has(w))) || skillSet(hook).size >= 1;
    add("about", hookOk ? 4 : 1, 4, hookOk ? "" : "Only the first two lines show before “see more”. Open with who you are and what you do.", 3);
    const nums = numsOf(a).length;
    add("about", nums >= 2 ? 4 : nums ? 2 : 0, 4, nums < 2 ? "Add one or two results with numbers (customers served, money saved, marks)." : "", 4 - (nums ? 2 : 0));
    const kw = [...skillSet(a)].length;
    add("about", kw >= 5 ? 4 : kw >= 2 ? 2 : 0, 4, kw < 5 ? `Work in more of your key skills (${kw} found). Recruiters' searches read this section.` : "", kw >= 2 ? 2 : 4);
    const cta = /\b(contact|reach me|get in touch|message me|email|connect with me|open to|looking for)\b/i.test(a);
    add("about", cta ? 3 : 0, 3, cta ? "" : "End with what you're looking for and how to reach you.", 3);
  }
  // Experience (20)
  const roles = liRoles(inp.experience);
  if (!roles.length) add("experience", inp.experience.trim() ? 6 : 0, 20, inp.experience.trim() ? "We couldn't find dates in your Experience. Include each role's dates, like “Feb 2023 - Present”." : "Add your experience, with a short description of each role.", inp.experience.trim() ? 10 : 20);
  else {
    const recent = roles.slice(0, 3);
    const described = recent.filter(r => wordCount(r.desc) >= 20).length;
    add("experience", 4 + Math.round(described / recent.length * 8), 12, described < recent.length ? `${recent.length - described} of your recent role${recent.length - described === 1 ? " has" : "s have"} little or no description. Add 2 to 4 achievement points to each.` : "", Math.round((recent.length - described) / recent.length * 8));
    const withNums = recent.filter(r => numsOf(r.desc).length).length;
    add("experience", Math.round(withNums / recent.length * 5), 5, withNums < recent.length ? "Add numbers to your role descriptions: team size, volume, savings, results." : "", 5 - Math.round(withNums / recent.length * 5));
    add("experience", 3, 3);
  }
  // Skills (15)
  const skillList = listOf(inp.skills.replace(/\n/g, ","));
  const sCount = skillList.length;
  add("skills", sCount >= 15 ? 6 : sCount >= 5 ? 4 : sCount ? 2 : 0, 6, sCount < 15 ? `You list ${sCount} skill${sCount === 1 ? "" : "s"}. Add more, up to about 30 relevant ones: each one is a search term.` : "", sCount >= 5 ? 2 : 4);
  const covered = targets.length ? (targets.length - missing.length) / targets.length : 1;
  add("skills", Math.round(covered * 9), 9, missing.length ? `Missing keywords for ${target || "your target job"}: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}. Add the ones you genuinely have.` : "", Math.round((1 - covered) * 9));
  // Basics (15) and credibility (10)
  const c = inp.checks || {};
  for (const [k, label, pts] of LI_CHECKS) {
    const cat = ["recs", "conn", "featured", "certs"].includes(k) ? "proof" : "basics";
    add(cat, c[k] ? pts : 0, pts, c[k] ? "" : label + ".", pts);
  }
  // Matches your resume (5)
  const p = P();
  if (hasProfile(p) && roles.length) {
    const resumeTitles = p.experience.map(e => norm(e.title));
    const mismatched = roles.slice(0, 3).filter(r => r.title && !resumeTitles.some(t => similarity(zoneKey(t), zoneKey(r.title)) >= 0.5));
    add("match", mismatched.length ? 2 : 5, 5, mismatched.length ? `These titles don't match your resume: ${mismatched.map(r => r.title).join(", ")}. Recruiters notice when they differ.` : "", mismatched.length ? 3 : 0);
  } else add("match", 3, 5);
  for (const [k, , max] of LI_CATS) cats[k] = Math.max(0, Math.min(max, Math.round(cats[k] || 0)));
  const score = LI_CATS.reduce((s, [k]) => s + cats[k], 0);
  return { score, cats, notes, fixes: fixes.sort((x, y) => y.gain - x.gain), missing, targets, target, roles };
}
const liRank = s => s >= 85 ? "All-star" : s >= 70 ? "Strong" : s >= 50 ? "Getting there" : "Just starting";

/* --- Suggestions, written from your own details --- */
const HEADLINE_NANO = `You write LinkedIn headlines for an Australian job seeker.
Rules:
1. Use only the facts given. Never invent skills, employers, numbers or qualifications.
2. Each headline is under 200 characters and starts with the job they want or do.
3. Then 2 or 3 key skills, separated by " | ", then what they offer or are studying.
4. No emojis, no clichés ("passionate", "results-driven", "guru", "ninja").
Reply with JSON only: {"headlines": ["...", "...", "..."]}`;
const HEADLINE_EXAMPLES = [[
  `Target job: Graduate Civil Engineer
Facts: Bachelor of Engineering (Civil), UNSW, graduating 2026. Skills: AutoCAD, Civil 3D, stormwater design. Internship at Northline Consulting designing drainage for 3 subdivisions.`,
  { headlines: ["Graduate Civil Engineer | AutoCAD | Civil 3D | Stormwater design | UNSW Civil Engineering, graduating 2026", "Civil Engineering graduate | Drainage design for 3 subdivisions at Northline Consulting | AutoCAD | Civil 3D", "Aspiring Civil Engineer | Stormwater and drainage design | Civil 3D | Final-year UNSW student"] }
]];
const ABOUT_NANO = `You write the About section of a LinkedIn profile for an Australian job seeker.
Rules:
1. Use only the facts given. Never invent skills, employers, numbers or achievements.
2. First person, warm and professional, Australian spelling, 150 to 260 words.
3. Paragraph 1 (two sentences): who they are and what they do. This shows before "see more", so make it count.
4. Paragraph 2: two or three achievements with the numbers given.
5. Paragraph 3: what they're looking for, then "Skills:" and 5 to 8 of their skills separated by " · ".
6. No clichés ("passionate", "results-driven", "team player") and no emojis.
Reply with JSON only: {"about": "..."}`;
function liFacts(inp) {
  const p = P();
  const bullets = p.experience.flatMap(e => e.bullets.slice(0, 3).map(b => `${b} (${e.title}${e.org ? ` at ${e.org}` : ""})`)).slice(0, 8);
  const edu = p.education.map(e => `${e.degree}${e.inst ? `, ${e.inst}` : ""}${e.current ? ` (graduating ${fmtDate(e.end)})` : ""}`).join("; ");
  const skills = [...new Set([...p.skills.hard, ...p.skills.software, ...listOf(inp.skills.replace(/\n/g, ","))])].slice(0, 14);
  return { text: `Target job: ${inp.target || p.target.title || "(not given)"}
Facts:
Current headline: ${inp.headline || "(none)"}
Summary: ${p.summary || inp.about.slice(0, 600) || "(none)"}
Experience: ${p.experience.length ? p.experience.map(e => `${e.title}${e.org ? ` at ${e.org}` : ""}`).join("; ") : liRoles(inp.experience).map(r => `${r.title}${r.company ? ` at ${r.company}` : ""}`).join("; ") || "(none)"}
Achievements: ${bullets.join(" / ") || "(none)"}
Education: ${edu || inp.education.split("\n").slice(0, 2).join("; ") || "(none)"}
Skills: ${skills.join(", ") || "(none)"}${linStore.data.letter && linStore.data.letter.text ? `\nCover letter they chose (their own words and story, use only what it says): ${linStore.data.letter.text.slice(0, 900)}` : ""}`, skills };
}
function liTemplateHeadlines(inp) {
  const p = P(), f = liFacts(inp);
  const role = inp.target || p.target.title || (p.experience[0] || {}).title || "";
  const sk = f.skills.slice(0, 3);
  const ed = p.education[0];
  const out = [];
  if (role) out.push([role, ...sk].join(" | "));
  if (role && ed) out.push(`${role} | ${ed.degree}${ed.inst ? `, ${ed.inst}` : ""}${ed.current && ed.end ? ` (graduating ${fmtDate(ed.end).replace(/^[A-Z][a-z]{2} /, "")})` : ""}`);
  const ex = p.experience.find(e => e.title && e.org);
  if (role && ex) out.push(`${role} | ${ex.title} at ${ex.org} | ${sk.slice(0, 2).join(" | ")}`.replace(/ \| $/, ""));
  return out.filter(x => x.length <= 220);
}
function liTemplateAbout(inp) {
  const p = P();
  const f = liFacts(inp);
  const first = p.summary ? p.summary.split(/(?<=\.)\s+/).slice(0, 2).join(" ") : "";
  const wins = p.experience.flatMap(e => e.bullets.filter(b => numsOf(b).length).slice(0, 1).map(b => `At ${e.org || e.title}, I ${lowerFirst(tidy(b))}.`)).slice(0, 3);
  const next = p.summaryQ.next ? `I'm looking for ${lowerFirst(tidy(p.summaryQ.next))}.` : (inp.target || p.target.title) ? `I'm looking for ${aOrAn(inp.target || p.target.title)} ${inp.target || p.target.title} role.` : "";
  return [first, wins.join(" "), [next, f.skills.length ? `Skills: ${f.skills.slice(0, 8).join(" · ")}` : ""].filter(Boolean).join("\n\n")].filter(Boolean).join("\n\n");
}
async function liAboutText(inp, progress) {
  const f = liFacts(inp);
  const sources = f.text + "\n" + P().experience.flatMap(e => e.bullets).join("\n") + "\n" + inp.about + "\n" + inp.experience;
  const r = await aiJSON({ nano: ABOUT_NANO, prompt: f.text, label: "Writing your About section", progress,
    schema: { type: "object", properties: { about: { type: "string" } }, required: ["about"] },
    check: d => { const t = stripMarkup(String(d.about || "")).trim(); const why = factCheck(t, sources, { min: 90, max: 320 }); return why ? { ok: false, why } : { ok: true, value: t }; } });
  return r.data ? { text: r.data, via: r.via, rejected: r.rejected } : { text: liTemplateAbout(inp), via: null, rejected: r.rejected };
}
async function liSuggest(kind, btn) {
  const inp = linStore.data.input, box = $("liSugg-" + kind);
  btn.disabled = true;
  const progress = m => { box.innerHTML = `<p class="progress">${esc(m)}</p>`; };
  const f = liFacts(inp);
  const sources = f.text + "\n" + P().experience.flatMap(e => e.bullets).join("\n") + "\n" + inp.about + "\n" + inp.experience;
  let items = [], via = null, rejected = false;
  try {
    if (kind === "headline") {
      const r = await aiJSON({ nano: HEADLINE_NANO, examples: HEADLINE_EXAMPLES, prompt: f.text, label: "Writing headlines", progress,
        schema: { type: "object", properties: { headlines: { type: "array", items: { type: "string" } } }, required: ["headlines"] },
        check: d => { const ok = (Array.isArray(d.headlines) ? d.headlines : []).map(x => stripMarkup(String(x)).trim()).filter(x => x && x.length <= 220 && !factCheck(x, sources)); return ok.length ? { ok: true, value: ok.slice(0, 3) } : { ok: false, why: (d.headlines || []).map(x => factCheck(x, sources) || (String(x).length > 220 ? "it's over 220 characters" : "")).find(Boolean) || "no usable headlines" }; } });
      items = r.data || []; via = r.via; rejected = r.rejected;
      if (!items.length) items = liTemplateHeadlines(inp);
    } else {
      const r = await aiJSON({ nano: ABOUT_NANO, prompt: f.text, label: "Writing your About section", progress,
        schema: { type: "object", properties: { about: { type: "string" } }, required: ["about"] },
        check: d => { const t = stripMarkup(String(d.about || "")).trim(); const why = factCheck(t, sources, { min: 90, max: 320 }); return why ? { ok: false, why } : { ok: true, value: [t] }; } });
      items = r.data || []; via = r.via; rejected = r.rejected;
      if (!items.length) items = [liTemplateAbout(inp)].filter(x => wordCount(x) > 20);
    }
  } finally { btn.disabled = false; }
  if (!items.length) { box.innerHTML = `<p class="small muted">Add your details in the resume builder first, so suggestions have facts to work from.</p>`; return; }
  box.innerHTML = items.map((t, i) => `<div class="li-sug"><p>${esc(t).replace(/\n/g, "<br>")}</p><div class="li-sug-foot"><span class="small muted">${kind === "headline" ? `${t.length}/220 characters` : `${wordCount(t)} words`}</span><button class="btn" type="button" data-copy="${i}">Copy</button></div></div>`).join("")
    + `<p class="small muted">${via ? `Written by ${viaWords(via)} from your details.` : "Put together from your details, without AI."}${rejected && !via ? " The AI's draft included things that aren't in your details, so it wasn't used." : ""} Edit before you paste it into LinkedIn.</p>`;
  box.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(items[+b.dataset.copy]); b.textContent = "Copied"; } catch { b.textContent = "Select and copy it"; } setTimeout(() => { b.textContent = "Copy"; }, 2000); });
}

/* --- The page --- */
function liFromForm() {
  const inp = linStore.data.input;
  for (const k of ["headline", "about", "experience", "skills", "education", "target"]) inp[k] = $("li-" + k).value;
  inp.url = shortUrl($("li-url").value);
  inp.checks = {};
  document.querySelectorAll("#liChecks input[type=checkbox]").forEach(c => { inp.checks[c.dataset.k] = c.checked; });
}
function liToForm() {
  const inp = linStore.data.input;
  for (const k of ["headline", "about", "experience", "skills", "education", "target"]) $("li-" + k).value = inp[k] || "";
  if (!inp.url && P().contact.linkedin) inp.url = shortUrl(P().contact.linkedin);
  $("li-url").value = inp.url || "";
  liUrlCheck(true);
  if (!inp.target) $("li-target").placeholder = P().target.title || (lastScan ? detectTitle(lastScan.jd, lastScan.title) : "") || "e.g. Graduate Mechanical Engineer";
  $("liChecks").innerHTML = LI_CHECKS.map(([k, label]) => `<label class="q-check"><input type="checkbox" data-k="${k}"${inp.checks[k] ? " checked" : ""}> ${esc(label)}</label>`).join("");
  $("liHeadCount").textContent = `${(inp.headline || "").length}/220`;
}
/* --- The bottom of the page, the same as the resume and the cover letter: Download as…, Copy text, Save to my profile…, saved versions, what next --- */
const savedLinkedIns = privateDoc("savedLinkedIns", "jobfinder.savedLinkedIns.v1", () => ({ list: [] }));
const LI_SECTIONS = [["headline", "Headline"], ["about", "About"], ["experience", "Experience"], ["skills", "Skills"], ["education", "Education"]];
// What goes in the file: your name and link, then each section you have filled in
const liDocOf = inp => ({ name: String((P().contact || {}).name || "").trim(), url: inp.url || "", sections: LI_SECTIONS.map(([k, h]) => [h, String(inp[k] || "").trim()]).filter(x => x[1]) });
function liPlainText(d) {
  const out = [d.name, d.url].filter(Boolean);
  for (const [h, t] of d.sections) out.push("", h.toUpperCase(), t);
  return out.join("\n").trim();
}
async function liBuildDocx(d) {
  await loadScript(JSZIP);
  const x = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>${o.b ? "<w:b/>" : ""}<w:color w:val="${o.color || "222222"}"/><w:sz w:val="${o.sz || 22}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const para = (r, o = {}) => `<w:p><w:pPr>${o.keep ? "<w:keepNext/>" : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 120 : o.after}"/></w:pPr>${r}</w:p>`;
  const body = [];
  if (d.name) body.push(para(run(d.name, { b: true, sz: 36, color: "1F3A5F" }), { after: 40 }));
  if (d.url) body.push(para(run(d.url, { sz: 20, color: "555555" }), { after: 120 }));
  for (const [h, t] of d.sections) {
    body.push(para(run(h.toUpperCase(), { b: true, sz: 22, color: "1F3A5F" }), { before: 240, after: 80, keep: true }));
    t.split(/\n+/).filter(Boolean).forEach(l => body.push(para(run(l))));
  }
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const zip = new window.JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file("word/document.xml", docXml);
  return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
}
async function liBuildPdf(d) {
  await loadScript(JSPDF);
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
  // the built-in PDF fonts cover basic Latin; swap typographic marks they can't show
  const safe = t => String(t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x00-\xFF]/g, "");
  const M = 20, W = 210 - 2 * M, LH = 5.6;
  let y = M;
  const line = (t, size, bold, rgb, gap = 0) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...rgb);
    y += gap;
    for (const l of doc.splitTextToSize(safe(t), W)) { if (y + LH > 297 - M) { doc.addPage(); y = M; } doc.text(l, M, y); y += LH; }
  };
  if (d.name) line(d.name, 18, true, [31, 58, 95]);
  if (d.url) line(d.url, 10, false, [85, 85, 85]);
  for (const [h, t] of d.sections) { line(h.toUpperCase(), 11, true, [31, 58, 95], 6); line(t, 10.5, false, [30, 37, 51], 1); }
  return doc.output("blob");
}
// input: a saved version's answers; left out, it is what is on the page now
async function liDownload(kind, btn, input) {
  const inp = input || (liFromForm(), linStore.data.input), st = $("liDlStatus");
  const d = liDocOf(inp);
  if (!d.sections.length) { if (st) st.textContent = "Add your headline, About or experience first."; return; }
  const name = `${d.name || "My"} - LinkedIn profile`.replace(/[\\/:*?"<>|]+/g, "").slice(0, 150) + "." + kind;
  if (kind === "txt") return downloadTextFile(name, liPlainText(d), st, btn);
  await downloadMade(name, () => kind === "pdf" ? liBuildPdf(d) : liBuildDocx(d), st, btn);
  linStore.data.completed = todayISO(); linStore.save();
}
const liSavedInput = b => ((savedLinkedIns.data.list || [])[+b.dataset.k] || {}).input;
dlMenu("liDl", { docx: b => liDownload("docx", b), pdf: b => liDownload("pdf", b), txt: b => liDownload("txt", b) });
dlMenu("saved-linkedin", { docx: b => liDownload("docx", b, liSavedInput(b)), pdf: b => liDownload("pdf", b, liSavedInput(b)), txt: b => liDownload("txt", b, liSavedInput(b)) });
async function liSaveVersion() {
  const st = $("liSaveStatus");
  // saving to your profile needs an account (inside Claude, or where accounts aren't switched on, it saves privately as before)
  if (typeof acctOn === "function" && acctOn() && !account.user && !(window.claude && window.claude.use)) {
    acctDialog("up");
    const m = document.querySelector("#acctDlg #acctMsg");
    if (m) { m.textContent = "Saving a LinkedIn profile to your profile needs a free account. Sign up or sign in, then press Save again."; m.className = "acct-msg"; }
    return;
  }
  liFromForm();
  const inp = linStore.data.input;
  const name = await askName({ title: "Save this LinkedIn to your profile", text: "Your headline, About, experience, skills and education are saved as they are now. Saving again with the same name replaces it.", label: "Name it", value: inp.target || P().target.title || "My LinkedIn" });
  if (!name) return;
  await savedLinkedIns.ready;
  const list = savedLinkedIns.data.list = (savedLinkedIns.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), input: JSON.parse(JSON.stringify(inp)) });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedLinkedIns.save(true);
  linStore.data.completed = todayISO(); linStore.save();
  const box = $("liSaved"); if (box) box.innerHTML = liSavedHtml();
  if (st) st.textContent = `“${name}” is ${whereWords(savedLinkedIns.where === "loading" ? profile.where : savedLinkedIns.where)}.`;
}
function liSavedHtml() {
  const list = savedLinkedIns.data.list || [];
  return list.length ? `<div class="b-sub">Saved versions</div><ul class="saved-list" aria-label="Your saved LinkedIn profiles">${list.map((x, k) => `<li><span class="saved-name"><b>${esc(x.name)}</b><span class="small muted">Saved ${esc(fmtSaved(x.saved))}</span></span><span class="b-actions"><button class="btn" type="button" data-li-act="saved-open" data-k="${k}">Open</button><button class="btn ghost" type="button" data-dlmenu="saved-linkedin" data-k="${k}" aria-haspopup="menu" aria-expanded="false">Download as…</button><button class="btn ghost" type="button" data-li-act="saved-del" data-k="${k}">Delete</button></span></li>`).join("")}</ul>` : "";
}
function liNextHtml() {
  const card = (nx, tag, head, text, go) => `<button type="button" class="nx-card" data-nx="${nx}"><span class="nx-tag">${tag}</span><b>${head}</b><span class="nx-text">${text}</span><span class="nx-go">${go} <i aria-hidden="true">→</i></span></button>`;
  return `<div class="b-sub">What next?</div><p class="q-hint">Your LinkedIn is ready to paste in. These three make it work harder for you.</p><div class="b-next nx">`
    + card("letter", "Most useful", "Write a cover letter that sounds like you", "Five short paragraphs, drafted from your profile, telling the same strong story as your LinkedIn.", "Create a cover letter")
    + card("scanner", "Do this next", "Tailor your resume to a real job", "Paste a job ad and Job Finder reshapes your resume around what that job asks for.", "Tailor to a job")
    + card("interview", "Quick win", "Practise the interview", "Pick a question, type your answer and get feedback in a minute.", "Practise answers")
    + `</div>`;
}
function liBottomHtml() {
  return `<section class="panel li-bottom" aria-labelledby="liDlH">
    <div class="b-sub" id="liDlH">Download</div>
    <p class="q-hint">Your headline, About, experience, skills and education as one file, so you can keep a copy or paste each part into LinkedIn. Nothing is posted to LinkedIn.</p>
    <div class="b-actions b-dl-row"><button class="btn primary" type="button" id="liDl" data-dlmenu aria-haspopup="menu" aria-expanded="false">Download as…</button><button class="btn" type="button" data-li-act="copy">Copy text</button><span class="foot-gap"></span><button class="btn" type="button" data-li-act="save">Save to my profile…</button></div>
    <p class="q-hint">Save to my profile keeps this version under a name, like the job it's for, so you can open or download it again later. It needs a free account.</p>
    <p class="status-line" id="liDlStatus" role="status"></p><p class="status-line" id="liSaveStatus" role="status"></p>
    <div id="liSaved">${liSavedHtml()}</div>
    ${liNextHtml()}
  </section>`;
}
function liBottomClick(e) {
  const nx = e.target.closest("[data-nx]");
  if (nx) { openView(nx.dataset.nx); return; }
  const b = e.target.closest("[data-li-act]");
  if (!b) return;
  const act = b.dataset.liAct, k = +b.dataset.k;
  if (act === "save") liSaveVersion();
  else if (act === "copy") {
    liFromForm();
    const d = liDocOf(linStore.data.input), st = $("liDlStatus");
    if (!d.sections.length) { if (st) st.textContent = "Add your headline, About or experience first."; return; }
    navigator.clipboard.writeText(liPlainText(d)).then(() => { b.textContent = "Copied"; linStore.data.completed = todayISO(); linStore.save(); }, () => { b.textContent = "Couldn't copy"; });
    setTimeout(() => { b.textContent = "Copy text"; }, 1800);
  } else if (act === "saved-open") {
    const x = (savedLinkedIns.data.list || [])[k]; if (!x) return;
    linStore.data.input = { ...linStore.data.input, ...JSON.parse(JSON.stringify(x.input)) };
    linStore.save(true); liToForm(); renderLinkedIn();
    const st = $("liSaveStatus"); if (st) st.textContent = `Opened “${x.name}”.`;
  } else if (act === "saved-del") {
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Delete it?"; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ""; b.textContent = "Delete"; } }, 4000); return; }
    savedLinkedIns.data.list.splice(k, 1); savedLinkedIns.save(true);
    const box = $("liSaved"); if (box) box.innerHTML = liSavedHtml();
  }
}
function renderLinkedIn() {
  const out = $("liOut");
  const inp = linStore.data.input;
  if (!inp.headline && !inp.about && !inp.experience) { out.innerHTML = ""; return; }
  const r = scoreLinkedIn(inp);
  linStore.data.last = { score: r.score, date: todayISO(), cats: r.cats };
  linStore.save();
  const col = r.score >= 80 ? "var(--good)" : r.score >= 60 ? "var(--accent)" : "var(--warn)";
  out.innerHTML = `<section class="panel li-res" aria-labelledby="liScoreH">
    <div class="iv-score"><div class="iv-ring" style="--v:${r.score};--ring:${col}"><div><b>${r.score}</b><span>out of 100</span></div></div><div><h2 id="liScoreH" class="iv-verdict">${liRank(r.score)}</h2><p class="small muted">Scored against what recruiters search for${r.target ? ` when hiring ${aOrAn(r.target)} ${esc(r.target)}` : ""}. LinkedIn doesn't publish its ranking, so treat this as a guide.</p></div></div>
    <div class="iv-crit">${LI_CATS.map(([k, label, max]) => `<div class="iv-crit-row"><span>${label}</span><div class="bar"><i style="width:${Math.round(r.cats[k] / max * 100)}%;background:${r.cats[k] / max >= 0.75 ? "var(--good)" : r.cats[k] / max >= 0.5 ? "var(--accent)" : "var(--warn)"}"></i></div><span class="val">${r.cats[k]}/${max}</span></div>`).join("")}</div>
    ${r.fixes.length ? `<div><h3>Do these first</h3><ol class="li-fixes">${r.fixes.slice(0, 6).map(f => `<li><span>${esc(f.msg)}</span><span class="li-gain">+${f.gain}</span></li>`).join("")}</ol></div>` : `<p><b>Nothing major to fix.</b> Keep it current as your experience grows.</p>`}
  </section>
  <section class="panel" aria-labelledby="liHeadH"><div class="panel-head"><h2 id="liHeadH">Headline</h2><p>Up to 220 characters. It appears everywhere your name does.</p></div>
    ${inp.headline ? `<p class="li-current">“${esc(inp.headline)}”</p>` : ""}<div class="b-actions"><button class="btn primary" type="button" data-li-sug="headline">Suggest better headlines</button></div><div id="liSugg-headline" class="li-suggs"></div></section>
  <section class="panel" aria-labelledby="liAboutH"><div class="panel-head"><h2 id="liAboutH">About</h2><p>The first two lines show before “see more”.</p></div>
    ${(r.notes.about || []).length ? `<ul class="li-notes">${r.notes.about.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : inp.about ? `<p class="small">Your About section covers the basics well.</p>` : ""}
    <div class="b-actions"><button class="btn primary" type="button" data-li-sug="about">Draft an About section</button></div><div id="liSugg-about" class="li-suggs"></div></section>
  <section class="panel" aria-labelledby="liExpH"><div class="panel-head"><h2 id="liExpH">Experience</h2><p>Two to four achievement points per recent role. You can reuse your resume's bullet points.</p></div>
    ${r.roles.length ? `<ul class="li-roles">${r.roles.slice(0, 5).map(role => { const match = P().experience.find(e => similarity(zoneKey(e.title), zoneKey(role.title)) >= 0.5 || (e.org && role.company && similarity(zoneKey(e.org), zoneKey(role.company)) >= 0.5)); const w = wordCount(role.desc); return `<li><b>${esc(role.title || "Role")}</b>${role.company ? ` · ${esc(role.company)}` : ""} <span class="muted small">${esc(role.dates)}</span><div class="small ${w < 20 ? "warn-text" : "muted"}">${w < 20 ? "Needs a description." : `${w} words${numsOf(role.desc).length ? ", with numbers" : ", add a number or two"}.`}</div>${match && match.bullets.length ? `<details><summary class="small">Use the points from your resume</summary><pre class="li-pre">${esc(match.bullets.map(b => "• " + b).join("\n"))}</pre><button class="btn" type="button" data-copy-text="${esc(match.bullets.map(b => "• " + b).join("\n"))}">Copy</button></details>` : ""}</li>`; }).join("")}</ul>` : `<p class="small muted">${(r.notes.experience || [""])[0]}</p>`}
  </section>
  <section class="panel" aria-labelledby="liSkH"><div class="panel-head"><h2 id="liSkH">Skills and keywords</h2><p>Recruiters search LinkedIn by skill. Add the ones you genuinely have.</p></div>
    ${r.missing.length ? `<p class="small">Missing for ${esc(r.target || "your target job")}:</p><div class="chips">${r.missing.map(s => `<span class="chip missing">${esc(s)}</span>`).join("")}</div>` : `<p class="small">Your skills cover the keywords for ${esc(r.target || "your target job")}.</p>`}
    ${r.targets.length - r.missing.length ? `<p class="small">Already there:</p><div class="chips">${r.targets.filter(s => !r.missing.includes(s)).map(s => `<span class="chip found">${esc(s)}</span>`).join("")}</div>` : ""}
    <p class="small muted">Tip: choose up to five “top skills” in your About section, and ask colleagues to endorse them.</p>
  </section>
  ${liBottomHtml()}`;
  out.querySelectorAll("[data-li-sug]").forEach(b => b.onclick = () => liSuggest(b.dataset.liSug, b));
  out.querySelectorAll("[data-copy-text]").forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copyText); b.textContent = "Copied"; } catch { b.textContent = "Select and copy it"; } });
  out.onclick = liBottomClick;
}
// The profile link: open it, and check it's a custom one
function liUrlCheck(quiet) {
  const inp = linStore.data.input, u = inp.url || "", note = $("liUrlNote");
  const ok = /(^|\.)linkedin\.com\/in\/[A-Za-z0-9_%-]+$/i.test(u);
  $("liOpen").disabled = !ok;
  if (!u) return;
  if (!ok) { note.innerHTML = "That doesn't look like a LinkedIn profile link. It should look like <b>linkedin.com/in/your-name</b>."; return; }
  const custom = !/-[a-z0-9]{6,}$/i.test(u.split("/in/")[1] || "") || !/\d/.test((u.split("/in/")[1] || "").split("-").pop());
  inp.checks.url = custom;
  const box = document.querySelector('#liChecks [data-k="url"]'); if (box) box.checked = custom;
  note.innerHTML = custom ? "Nice: a custom link looks professional on your resume. Now bring your profile in below." : `Your link ends in random characters. Make it cleaner in LinkedIn under <b>Edit public profile &amp; URL</b>, for example linkedin.com/in/${esc((u.split("/in/")[1] || "").replace(/-[a-z0-9]{6,}$/i, ""))}.`;
  if (!quiet) linStore.save();
}
// Fill the boxes from what was read (a PDF or a pasted page), and say what came across
function liApply(got, from) {
  const inp = linStore.data.input, st = $("liFileStatus");
  for (const k of ["headline", "about", "experience", "skills", "education"]) if (got[k]) inp[k] = got[k];
  Object.assign(inp.checks, got.checks);
  liToForm(); linStore.save();
  const n = liRoles(got.experience).length, sk = listOf(String(got.skills || "").replace(/\n/g, ",")).length;
  const parts = [got.headline ? "your headline" : "", got.about ? "About" : "", n ? `${n} role${n === 1 ? "" : "s"}` : "", sk ? `${sk} skills` : "", got.education ? "education" : ""].filter(Boolean);
  st.classList.toggle("err", !parts.length);
  st.textContent = parts.length ? `Filled in ${listJoin(parts)} from ${from}${got.name ? ` for ${got.name}` : ""}. Check the boxes below, tick the checklist, then score it.` : `Couldn't find your profile sections in ${from}. Try the PDF instead, or paste each section into its box.`;
  const first = $("li-headline"); if (parts.length && first) first.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
}
async function liImportFile(f) {
  const st = $("liFileStatus");
  if (!f) return;
  st.classList.remove("err"); st.textContent = `Reading ${f.name}…`;
  try {
    if (!/\.pdf$/i.test(f.name)) throw new Error("Use the PDF from LinkedIn's “Save to PDF”.");
    liApply(await readLinkedInPdf(f), f.name);
  } catch (e) { st.classList.add("err"); st.textContent = e && e.message ? e.message : "Couldn't read that file. Paste the sections instead."; }
}
// Improve an existing profile, or build a new one from your Job Finder profile
const liMode = () => linStore.data.mode === "create" ? "create" : "improve";
function applyLiMode() {
  const m = liMode();
  $("view-linkedin").dataset.limode = m;
  document.querySelectorAll("#liMode [data-limode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.limode === m)));
  $("liCreate").hidden = m !== "create";
  $("liDrop").hidden = m === "create";
  $("liFormH").textContent = m === "create" ? "Build your profile" : "Bring in your profile";
  $("liScore").textContent = m === "create" ? "Check my new profile" : "Score my profile";
}
function liFillGaps(p, inp) {
  if (!inp.experience) inp.experience = p.experience.filter(e => e.title).map(e => [e.org || "", e.title, rangeOf(e).replace(" – ", " - "), ...e.bullets.map(b => "• " + b)].filter(Boolean).join("\n")).join("\n\n");
  if (!inp.skills) inp.skills = [...p.skills.hard, ...p.skills.software].join("\n");
  if (!inp.education) inp.education = p.education.map(e => `${e.inst}\n${e.degree}`).join("\n");
  if (!inp.target) inp.target = p.target.title;
}
onInit(() => {
  $("liMode").addEventListener("click", e => { const b = e.target.closest("[data-limode]"); if (!b) return; linStore.data.mode = b.dataset.limode; linStore.save(); applyLiMode(); });
  $("liFillAll").addEventListener("click", () => {
    const p = P(), inp = linStore.data.input, st = $("liFileStatus");
    liFromForm();
    if (!hasProfile(p)) { st.textContent = "Add your details in the resume builder first, so there's something to fill in from."; return; }
    liFillGaps(p, inp);
    if (!inp.headline) inp.headline = liTemplateHeadlines(inp)[0] || "";
    if (!inp.about) inp.about = liTemplateAbout(inp);
    if (!inp.url && p.contact.linkedin) inp.url = shortUrl(p.contact.linkedin);
    liToForm(); linStore.save();
    st.classList.remove("err");
    st.textContent = "Filled in your headline, About, Experience, Skills and Education from your profile. Make them sound like you, then copy each into LinkedIn. Write my About with AI gives you a stronger About.";
    $("li-headline").scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
  });
  $("liPick").addEventListener("click", () => $("liFile").click());
  $("liFile").addEventListener("change", async () => { await liImportFile($("liFile").files[0]); $("liFile").value = ""; });
  const drop = $("liDrop");
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) liImportFile(f); });
  $("liPasteOpen").addEventListener("click", () => { const box = $("liPasteBox"), open = box.hidden; box.hidden = !open; $("liPasteOpen").setAttribute("aria-expanded", String(open)); if (open) $("liPaste").focus(); });
  $("liPasteGo").addEventListener("click", () => {
    const t = $("liPaste").value;
    if (wordCount(t) < 15) { const st = $("liFileStatus"); st.classList.add("err"); st.textContent = "Paste the whole profile page first: press Ctrl+A then Ctrl+C on your LinkedIn profile."; return; }
    liApply(liFromPage(t), "the page you pasted");
    $("liPaste").value = ""; $("liPasteBox").hidden = true; $("liPasteOpen").setAttribute("aria-expanded", "false");
  });
  $("li-url").addEventListener("change", () => { $("li-url").value = shortUrl($("li-url").value); liFromForm(); liUrlCheck(); if (!P().contact.linkedin && linStore.data.input.url) { P().contact.linkedin = linStore.data.input.url; touchProfile("linkedin"); } });
  $("liOpen").addEventListener("click", () => { const u = linStore.data.input.url; if (u) window.open("https://www." + u.replace(/^www\./, ""), "_blank", "noopener"); });
  $("liAboutAi").addEventListener("click", async () => {
    const btn = $("liAboutAi"), note = $("liAboutNote"), box = $("liAboutDraft");
    liFromForm();
    if (!hasProfile(P()) && !linStore.data.input.experience.trim()) { note.textContent = "Add your experience first (from your resume or LinkedIn PDF), so there are facts to write from."; return; }
    btn.disabled = true; note.classList.add("busy");
    const r = await liAboutText(linStore.data.input, m => { note.textContent = m; });
    btn.disabled = false; note.classList.remove("busy");
    if (!r.text || wordCount(r.text) < 20) { note.textContent = "Not enough details to write from yet. Add your experience and skills first."; return; }
    note.textContent = r.via ? `Written by ${viaWords(r.via)} from your details. Check it, then use it.` : "Put together from your details without AI. Edit it to sound like you.";
    box.innerHTML = `<div class="li-sug"><p>${esc(r.text).replace(/\n/g, "<br>")}</p><div class="li-sug-foot"><span class="small muted">${wordCount(r.text)} words</span><button class="btn primary" type="button" id="liAboutUse">Use this</button><button class="btn" type="button" id="liAboutCopy">Copy</button></div></div>`;
    $("liAboutUse").onclick = () => { $("li-about").value = r.text; liFromForm(); linStore.save(); box.innerHTML = ""; note.textContent = "Added to your About box. Score your profile again to see the difference, then paste it into LinkedIn."; };
    $("liAboutCopy").onclick = async () => { try { await navigator.clipboard.writeText(r.text); $("liAboutCopy").textContent = "Copied"; } catch { $("liAboutCopy").textContent = "Select and copy it"; } };
  });
  $("liForm").addEventListener("input", e => { if (e.target.id === "li-headline") $("liHeadCount").textContent = `${e.target.value.length}/220`; liFromForm(); linStore.save(); });
  $("liForm").addEventListener("change", () => { liFromForm(); linStore.save(); });
  $("liScore").addEventListener("click", () => { liFromForm(); renderLinkedIn(); $("liOut").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); });
  $("liFromResume").addEventListener("click", () => {
    const p = P(), inp = linStore.data.input;
    if (!hasProfile(p)) { $("liFileStatus").textContent = "Add your details in the resume builder first."; return; }
    liFillGaps(p, inp);
    liToForm(); linStore.save();
    $("liFileStatus").textContent = "Filled in Experience, Skills and Education from your resume where they were empty. Paste your real headline and About to score them.";
  });
  viewHooks.linkedin = (opts = {}) => linStore.ready.then(() => { if (opts.mode) linStore.data.mode = opts.mode; applyLiMode(); liToForm(); if (linStore.data.last) renderLinkedIn(); });
});

