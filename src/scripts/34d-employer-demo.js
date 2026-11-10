/* ===================== Employer side, part 2: sample data =====================
   "Try sample data" fills the employer pages with a made-up company, ads and candidates so every page can be seen
   with something in it. It lives in hiring.data.demo, apart from anything real, and is never posted or shared. */

const emCat = key => (JOB_TYPES.find(j => j.key === key) || { label: "" }).label;
function emMakeDemo() {
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const at = (n, h = 9) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, (n * 7 + 13) % 60, 0, 0); return d.toISOString(); };
  const Q = emNewQ;
  const rtw = Q({ text: EM_QLIB[0].text, type: "choice", options: EM_RTW, ideal: EM_RTW.slice(0, 5), must: true });
  const yrs = Q({ text: "How many years' experience do you have in a similar role?", type: "choice", options: EM_YEARS, ideal: EM_YEARS.slice(2), must: false });
  const lic = Q({ text: "Do you have a current Australian driver's licence?", type: "yes", ideal: ["Yes"], must: true });
  const sw = Q({ text: "Do you have experience using SolidWorks?", type: "yes", ideal: ["Yes"], must: false });
  const why = Q({ text: "In a few sentences, tell us why you're interested in this role.", type: "text" });
  const wk = Q({ text: "Are you able to work weekends?", type: "yes", ideal: ["Yes"], must: true });
  const cs = Q({ text: "Do you have experience working in a customer-facing role?", type: "yes", ideal: ["Yes"], must: false });
  const company = { name: "Blue Gum Engineering", website: "https://example.com/bluegum", location: "Brisbane, QLD", about: "We design and install solar, battery storage and HVAC systems for schools, hospitals and councils across Queensland. Our team of 60 is split between our Brisbane office and project sites.", tagline: "Practical engineering for a lower-carbon Queensland", industry: emCat("engineering"), size: EM_SIZES[2], colour: "#0F766E", culture: "We back people to take on real projects early, and we run a four-day project review so nobody works alone for long.", benefits: ["Flexible hours", "Professional development", "Paid parental leave", "Career progression"], recruiter: "Sam Taylor", recruiterRole: "People and Culture Lead", abn: "" };
  const ad = (o) => ({ ...emptyJobAd(), ...o });
  const jobs = [
    ad({ id: "dj1", title: "Graduate Mechanical Engineer", location: "Brisbane, QLD", workType: "Graduate program", remote: "Hybrid", category: emCat("engineering"), payType: "year", payMin: 75000, payMax: 82000, summary: "Join our design team delivering solar, battery storage and HVAC projects for commercial clients. You'll be mentored by a chartered engineer and work on live jobs from week one.", duties: ["Produce 3D models and drawings in SolidWorks or AutoCAD", "Carry out FEA and hand calculations", "Support HVAC and piping design", "Prepare clear technical reports for clients"], musts: ["Bachelor of Engineering (Mechanical) or finishing in 2026", "Some SolidWorks or AutoCAD experience", "Strong written communication", "Right to work in Australia"], nices: ["Experience with FEA", "A current driver's licence"], offer: ["A structured two-year graduate program", "Support towards chartership", "Hybrid work after your first three months"], tier: "premium", sellingPoints: ["Mentored by a chartered engineer", "Real client projects from week one", "Hybrid after three months"], questions: [rtw, sw, lic, why], status: "open", posted: day(-18), closes: day(12) }),
    ad({ id: "dj2", title: "Project Coordinator", location: "Brisbane, QLD", workType: "Full time", remote: "On-site", category: emCat("construction"), payType: "year", payMin: 82000, payMax: 95000, summary: "Keep our solar and HVAC installs on time and on budget. You'll coordinate subcontractors, order materials and be the client's first point of contact.", duties: ["Schedule trades and subcontractors", "Track budgets, variations and invoices", "Order materials and equipment", "Report project progress each week"], musts: ["2+ years in project coordination or administration", "Microsoft Office and Excel", "Clear communication with clients", "Right to work in Australia"], nices: ["MS Project or Primavera", "White Card"], offer: ["Four-day project review rhythm", "Company vehicle for site visits", "Birthday leave"], tier: "advanced", sellingPoints: ["Company vehicle for site visits", "Birthday leave"], questions: [rtw, yrs, lic, cs], status: "open", posted: day(-9), closes: day(21) }),
    ad({ id: "dj3", title: "Customer Service Officer", location: "Brisbane, QLD", workType: "Part time", remote: "On-site", category: emCat("callcentre"), payType: "hour", payMin: 32, payMax: 36, summary: "Answer calls and emails from homeowners about quotes, installs and warranties, and book service visits.", duties: ["Answer customer calls and emails", "Book installs and service visits", "Log cases in our CRM", "Resolve complaints or pass them on"], musts: ["Customer service experience", "Clear phone manner", "Available some weekends", "Right to work in Australia"], nices: ["CRM experience"], offer: ["Paid training", "Flexible hours around study"], tier: "basic", questions: [rtw, wk, cs], status: "open", posted: day(-5), closes: day(25) }),
    ad({ id: "dj4", title: "Senior Electrical Estimator", location: "Brisbane, QLD", workType: "Full time", remote: "Hybrid", category: emCat("engineering"), payType: "year", payMin: 120000, payMax: 140000, summary: "Draft: price our large solar and battery jobs.", duties: [], musts: ["Estimating experience"], tier: "basic", questions: [], status: "draft", posted: day(-1) }),
    ad({ id: "dj5", title: "Office Administrator", location: "Brisbane, QLD", workType: "Full time", remote: "On-site", category: emCat("admin"), payType: "year", payMin: 62000, payMax: 68000, summary: "Reception, bookings and accounts support for our head office.", duties: ["Reception and phones", "Accounts payable"], musts: ["Xero or MYOB", "Right to work in Australia"], tier: "basic", questions: [rtw], status: "closed", posted: day(-52), closes: day(-22) }),
    ad({ id: "dj6", title: "Site Supervisor", location: "Gold Coast, QLD", workType: "Contract", remote: "On-site", category: emCat("construction"), payType: "day", payMin: 520, payMax: 600, summary: "Run our install crews on a six-month school solar roll-out.", duties: ["Supervise install crews", "Safety inspections"], musts: ["White Card", "Driver's licence", "Experience supervising crews"], tier: "basic", questions: [lic], status: "open", posted: day(-45), closes: day(-8) })
  ].map(a => { a.skills = adSkills(a).slice(0, 20); a.description = jobAdText(a); return a; });
  // [name, headline, location, skills, titles, education, workRights, stage, jobType]
  const P = [
    ["Aisha Rahman", "Mechanical engineering graduate", "Brisbane, QLD", ["SolidWorks", "FEA", "AutoCAD", "MATLAB"], ["Engineering intern at Pacific Rail"], ["Bachelor of Engineering (Mechanical) (Honours), QUT"], "Australian citizen", "Graduate", "Graduate program"],
    ["Liam O'Connor", "Graduate engineer", "Brisbane, QLD", ["SolidWorks", "AutoCAD", "HVAC", "Engineering drawings"], ["Drafting cadet at Delta Mechanical"], ["Bachelor of Engineering (Mechanical), UQ"], "Australian citizen", "Graduate", "Full time"],
    ["Priya Nair", "Mechanical engineer", "Gold Coast, QLD", ["SolidWorks", "CFD", "FEA", "Python"], ["Junior Mechanical Engineer at Ridgeline Design"], ["Bachelor of Engineering (Mechanical), Griffith"], "Permanent resident", "Early career", "Full time"],
    ["Tom Nguyen", "Engineering student", "Brisbane, QLD", ["AutoCAD", "Microsoft Office", "Communication"], ["Engineering intern at City Council"], ["Bachelor of Engineering (Civil) (studying), QUT"], "Australian citizen", "Student", "Graduate program"],
    ["Hannah Fischer", "Mechanical engineering graduate", "Sydney, NSW", ["SolidWorks", "FEA", "3D modelling", "Thermodynamics"], ["Research assistant at UNSW"], ["Bachelor of Engineering (Mechanical), UNSW"], "Australian citizen", "Graduate", "Graduate program"],
    ["Mateo Silva", "Design drafter", "Brisbane, QLD", ["AutoCAD", "Revit", "Engineering drawings", "Civil 3D"], ["Drafter at Northline Consulting"], ["Diploma of Engineering Drafting, TAFE Queensland"], "Permanent resident", "Early career", "Full time"],
    ["Zoe Campbell", "Project coordinator", "Brisbane, QLD", ["Project management", "Microsoft Office", "Procurement", "Stakeholder management", "Excel"], ["Project Coordinator at Harbour Build", "Admin Officer at Coastline Homes"], ["Diploma of Project Management, TAFE"], "Australian citizen", "Established", "Full time"],
    ["Daniel Kim", "Project administrator", "Brisbane, QLD", ["Microsoft Office", "Excel", "Scheduling", "Customer service"], ["Project Administrator at Axis Electrical"], ["Bachelor of Business, QUT"], "Australian citizen", "Early career", "Full time"],
    ["Sophie Martin", "Senior project coordinator", "Ipswich, QLD", ["Project management", "MS Project", "Primavera P6", "Procurement", "Excel"], ["Senior Project Coordinator at Sunstate Construction", "Project Coordinator at Sunstate Construction"], ["Bachelor of Construction Management, QUT"], "Australian citizen", "Established", "Full time"],
    ["Omar Haddad", "Construction project coordinator", "Brisbane, QLD", ["Project management", "Microsoft Office", "Scheduling", "Cost control"], ["Coordinator at Haddad Builders"], ["Certificate IV in Building and Construction"], "Permanent resident", "Established", "Full time"],
    ["Grace Liu", "Operations coordinator", "Sunshine Coast, QLD", ["Microsoft Office", "Excel", "Customer service", "Scheduling"], ["Operations Coordinator at Coastal Logistics"], ["Bachelor of Business, USC"], "Australian citizen", "Early career", "Full time"],
    ["Ben Walker", "Customer service officer", "Brisbane, QLD", ["Customer service", "Salesforce", "Communication", "Microsoft Office"], ["Customer Service Officer at Energex Retail"], ["Certificate III in Business"], "Australian citizen", "Early career", "Part time"],
    ["Mia Rossi", "University student", "Brisbane, QLD", ["Customer service", "Communication", "Microsoft Office"], ["Retail Assistant at Kmart"], ["Bachelor of Arts (studying), UQ"], "Australian citizen", "Student", "Casual"],
    ["Ethan Brown", "Call centre team member", "Brisbane, QLD", ["Customer service", "Salesforce", "Data entry"], ["Customer Care Consultant at Telco One"], ["Year 12"], "Australian citizen", "Early career", "Part time"],
    ["Chloe Evans", "Customer support", "Logan, QLD", ["Customer service", "Communication", "Complaint handling"], ["Customer Support at HomeStay Insurance"], ["Certificate IV in Customer Contact"], "Australian citizen", "Early career", "Part time"],
    ["Raj Patel", "Student visa holder", "Brisbane, QLD", ["Customer service", "Excel", "Communication"], ["Barista at Corner Cafe"], ["Master of IT (studying), QUT"], "Student visa with work rights", "Student", "Part time"],
    ["Isla Thompson", "Graduate mechanical engineer", "Newcastle, NSW", ["SolidWorks", "FEA", "AutoCAD", "HVAC", "Python"], ["Cadet Engineer at Hunter Energy"], ["Bachelor of Engineering (Mechanical) (Honours), Newcastle"], "Australian citizen", "Graduate", "Graduate program"],
    ["Noah Anderson", "Mechanical design engineer", "Melbourne, VIC", ["SolidWorks", "GD&T", "FEA", "Product design"], ["Design Engineer at Altona Manufacturing"], ["Bachelor of Engineering (Mechanical), Monash"], "Australian citizen", "Early career", "Full time"],
    ["Fatima Khan", "Electrical estimator", "Brisbane, QLD", ["Estimating", "Electrical design", "Excel", "Cost control"], ["Estimator at Voltline Electrical"], ["Bachelor of Engineering (Electrical), UQ"], "Permanent resident", "Established", "Full time"],
    ["Jack Murphy", "Site supervisor", "Gold Coast, QLD", ["Site supervision", "Risk assessment", "Microsoft Office"], ["Site Supervisor at Gold Coast Solar"], ["Certificate IV in Building and Construction"], "Australian citizen", "Established", "Contract"],
    ["Emily Zhang", "Data analyst", "Brisbane, QLD", ["SQL", "Power BI", "Python", "Excel"], ["Data Analyst at Brisbane Water"], ["Bachelor of Information Technology, QUT"], "Australian citizen", "Early career", "Full time"],
    ["Callum Reid", "Apprentice electrician", "Toowoomba, QLD", ["Electrical wiring", "Test and tag"], ["Apprentice Electrician at Reid Electrical"], ["Certificate III in Electrotechnology"], "Australian citizen", "Early career", "Full time"],
    ["Sara Ahmed", "Mechanical engineering graduate", "Brisbane, QLD", ["SolidWorks", "AutoCAD", "FEA", "Thermodynamics", "Communication"], ["Engineering intern at Blue Water Pumps"], ["Bachelor of Engineering (Mechanical), UQ"], "Permanent resident", "Graduate", "Graduate program"],
    ["Oscar Lindgren", "Recent graduate", "Brisbane, QLD", ["AutoCAD", "Excel", "Report writing"], ["Vacation student at Arup"], ["Bachelor of Engineering (Civil), UQ"], "Australian citizen", "Graduate", "Graduate program"],
    ["Hana Sato", "Administration and project support", "Brisbane, QLD", ["Microsoft Office", "Xero", "Scheduling", "Customer service"], ["Office Administrator at Pacific Plumbing"], ["Diploma of Business, TAFE"], "Permanent resident", "Established", "Full time"]
  ];
  const talent = P.map((p, i) => ({ uid: "dt" + (i + 1), name: p[0], headline: p[1], location: p[2], summary: `${p[1]} based in ${p[2].split(",")[0]}. ${p[4][0]}.`, skills: p[3], titles: p[4], education: p[5], workRights: p[6], stage: p[7], jobType: p[8], visible: true, updated: at(-(i % 14) - 1) }));
  const N = name => { const t = talent.find(x => x.name === name); if (!t) throw new Error("sample candidate " + name); return t; };
  const T = name => N(name).uid;
  const ans = (ad, a) => ad.questions.map((q, i) => ({ qid: q.id, q: q.text, a: a[i] === undefined ? "" : a[i] }));
  const apps = [];
  const apply = (name, adId, days, a, note) => { const j = jobs.find(x => x.id === adId), c = N(name); apps.push({ candidate: c.uid, name: c.name, jobId: adId, title: j.title, company: company.name, note: note || "", resume: `${c.name}\n${c.headline}\n${c.location}\n\nExperience\n${c.titles.join("\n")}\n\nEducation\n${c.education.join("\n")}\n\nSkills\n${c.skills.join(", ")}`, applied: at(-days, 8 + (days * 3) % 9), answers: ans(j, a) }); };
  // Graduate Mechanical Engineer: [work rights, SolidWorks, licence, why]
  apply("Aisha Rahman", "dj1", 1, [EM_RTW[0], "Yes", "Yes", "I did my honours thesis on heat pump performance and want to work on real installations."], "Hi, I'd love to join the graduate program. I've used SolidWorks for three years.");
  apply("Liam O'Connor", "dj1", 2, [EM_RTW[0], "Yes", "Yes", "Your focus on commercial solar matches the projects I enjoyed most as a cadet."]);
  apply("Isla Thompson", "dj1", 3, [EM_RTW[0], "Yes", "Yes", "Hunter Energy gave me a taste of HVAC. I want to go deeper."]);
  apply("Priya Nair", "dj1", 4, [EM_RTW[1], "Yes", "Yes", "I'd like a role with more design responsibility."], "I'm looking for a role with strong mentoring.");
  apply("Tom Nguyen", "dj1", 6, [EM_RTW[0], "No", "Yes", "I'm interested in mechanical and building services work."]);
  apply("Hannah Fischer", "dj1", 8, [EM_RTW[0], "Yes", "No", "I'm relocating to Brisbane in January."]);
  apply("Sara Ahmed", "dj1", 11, [EM_RTW[1], "Yes", "Yes", "I did a pump design project that I'd love to build on."]);
  apply("Oscar Lindgren", "dj1", 13, [EM_RTW[0], "No", "Yes", "I'd like to move from civil into mechanical design."]);
  apply("Noah Anderson", "dj1", 14, [EM_RTW[4], "Yes", "Yes", ""]);
  // Project Coordinator: [work rights, years, licence, customer-facing]
  apply("Zoe Campbell", "dj2", 2, [EM_RTW[0], "3 years", "Yes", "Yes"], "I've coordinated solar and civil projects and enjoy the client side.");
  apply("Daniel Kim", "dj2", 3, [EM_RTW[0], "2 years", "Yes", "Yes"]);
  apply("Sophie Martin", "dj2", 5, [EM_RTW[0], "5+ years", "Yes", "Yes"], "Ten years in construction coordination, most recently on school projects.");
  apply("Omar Haddad", "dj2", 6, [EM_RTW[1], "5+ years", "Yes", "Yes"]);
  apply("Grace Liu", "dj2", 6, [EM_RTW[0], "1 year", "No", "Yes"]);
  apply("Hana Sato", "dj2", 1, [EM_RTW[1], "5+ years", "Yes", "Yes"]);
  // Customer Service Officer: [work rights, weekends, customer-facing]
  apply("Ben Walker", "dj3", 1, [EM_RTW[0], "Yes", "Yes"], "Available most weekends.");
  apply("Mia Rossi", "dj3", 2, [EM_RTW[0], "Yes", "Yes"]);
  apply("Ethan Brown", "dj3", 3, [EM_RTW[0], "Yes", "Yes"]);
  apply("Chloe Evans", "dj3", 3, [EM_RTW[0], "No", "Yes"]);
  apply("Raj Patel", "dj3", 4, [EM_RTW[4], "Yes", "Yes"]);
  // Office Administrator (closed) and Site Supervisor (expired)
  apply("Hana Sato", "dj5", 40, [EM_RTW[1]]); apply("Grace Liu", "dj5", 38, [EM_RTW[0]]);
  apply("Jack Murphy", "dj6", 30, ["Yes"]);
  const status = {
    [emKey(T("Aisha Rahman"), "dj1")]: "Interview", [emKey(T("Liam O'Connor"), "dj1")]: "Shortlisted", [emKey(T("Isla Thompson"), "dj1")]: "Shortlisted", [emKey(T("Priya Nair"), "dj1")]: "New",
    [emKey(T("Sophie Martin"), "dj2")]: "Offer", [emKey(T("Zoe Campbell"), "dj2")]: "Interview", [emKey(T("Daniel Kim"), "dj2")]: "Shortlisted", [emKey(T("Omar Haddad"), "dj2")]: "New",
    [emKey(T("Ben Walker"), "dj3")]: "Shortlisted", [emKey(T("Mia Rossi"), "dj3")]: "New",
    [emKey(T("Hana Sato"), "dj5")]: "Accepted", [emKey(T("Grace Liu"), "dj5")]: "Not suitable", [emKey(T("Jack Murphy"), "dj6")]: "Not suitable"
  };
  const seen = {}; Object.keys(status).forEach(k => { if (status[k] !== "New") seen[k] = true; });
  seen[emKey(T("Sara Ahmed"), "dj1")] = true; seen[emKey(T("Hana Sato"), "dj2")] = true;
  const ratings = { [emKey(T("Aisha Rahman"), "dj1")]: 5, [emKey(T("Liam O'Connor"), "dj1")]: 4, [emKey(T("Sophie Martin"), "dj2")]: 5, [emKey(T("Zoe Campbell"), "dj2")]: 4 };
  const notes = { [emKey(T("Aisha Rahman"), "dj1")]: [{ t: "Strong honours project and answered every question carefully. Phone screen went well.", at: at(-1, 15), by: "You" }], [emKey(T("Sophie Martin"), "dj2")]: [{ t: "References check out. Offer sent, waiting on her reply.", at: at(-1, 11), by: "You" }] };
  const log = { [emKey(T("Aisha Rahman"), "dj1")]: [{ at: at(-1, 10), t: "Moved to Shortlisted" }, { at: at(-1, 14), t: "Moved to Interview" }], [emKey(T("Sophie Martin"), "dj2")]: [{ at: at(-3, 9), t: "Moved to Shortlisted" }, { at: at(-2, 9), t: "Moved to Interview" }, { at: at(-1, 9), t: "Moved to Offer" }] };
  const pools = [{ id: "dp1", name: "Graduates to keep warm", members: [T("Hannah Fischer"), T("Noah Anderson"), T("Oscar Lindgren")] }, { id: "dp2", name: "Estimators", members: [T("Fatima Khan")] }];
  const searches = [{ id: "ds1", name: "Brisbane SolidWorks", q: "solidworks", where: "Brisbane", rights: "", jobType: "", stage: "" }];
  const outbox = { invites: [{ id: "di1", to: T("Mateo Silva"), jobId: "dj1", title: "Graduate Mechanical Engineer", company: company.name, message: "We think you'd be a good fit for our Graduate Mechanical Engineer role.", sent: at(-2, 12), kind: "invite" }], toIds: [T("Mateo Silva")] };
  return { employer: company, jobs, apps, talent, outbox, store: { status, seen, ratings, notes, log, pools, searches }, created: new Date().toISOString() };
}
emAct["demo-on"] = () => {
  hiring.data.demo = emMakeDemo(); hiring.save(true);
  toast("Sample data is on. Nothing here is posted or shared.");
  emRefresh("top"); emNavBadge();
};
emAct["demo-off"] = async () => {
  if (!await emConfirm("Leave sample data?", "The made-up company, ads and candidates are removed. Your real ads and candidates aren't touched.", "Leave sample data")) return;
  delete hiring.data.demo; hiring.save(true);
  emDrawClose && emDrawClose(true);
  toast("Sample data removed.");
  emRefresh("top"); emNavBadge();
};
