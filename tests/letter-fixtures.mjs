// The cover letter rules (src/scripts/14b-letter-rules.js) loaded the way the page has them, and the three fixtures from the spec
// (Alex: standard, Jordan: career change, Mia: first job), each with the letter the guide shows for them.
// Shared by the tests and by scripts/letter-golden.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(root, "src", "scripts", f), "utf8");
// The page's own cliché lists, so the tests use the same banned list the page does
const line = (file, start) => read(file).split("\n").find(l => l.startsWith(start));
// (run in this realm, so arrays and objects compare with the ones in the tests)
const LR = new Function(`${line("04-scanner-analysis.js", "const CLICHES")}\n${line("15-cover-letter.js", "const COVER_CLICHES")}\n${read("14b-letter-rules.js")}\nreturn LR;`)();
const NOW = new Date(2026, 10, 9);   // 9 November 2026

/* ---------------- the fixtures from the spec ---------------- */
const ALEX = {
  resume: `ALEX NGUYEN Parramatta NSW 0400 000 000 alex.nguyen@email.com
Weekend Team Leader, Harbourside Grocers, Mar 2024 – present
- Cut Saturday queue times by 30% by adding a floating cashier to the roster
- Trained six new starters on POS, cash handling and safety; all passed probation
- Run a five-minute pre-shift huddle each Saturday, since rolled out to weekdays by the store manager
- Handle most escalated customer complaints on shift; store feedback rating above 4.5 stars since I took on the role
Customer Service Assistant, Harbourside Grocers, Jan 2022 – Feb 2024
- Served 150+ customers per shift on registers and self-serve
Skills: POS, cash handling, rostering`,
  ad: `Customer Service Team Leader – Parramatta (Ref CS-2231)
Coastline Fresh
Coastline Fresh is a family-owned grocer. We support local growers, and our Parramatta store trades longer hours on weekends.
- Experience leading and coaching a team of six
- Calm and solution-focused with unhappy customers
- Weekend availability essential
- POS experience
Applications to Ms Rahman, Store Manager.`,
  answers: ["I shop at Coastline Fresh myself and like how your stores support local growers.", "every weekend, two weeks' notice"],
  employer: "Coastline Fresh", title: "Customer Service Team Leader",
  letter: [
    "I'm applying for the Customer Service Team Leader role at Coastline Fresh. As a weekend team leader at Harbourside Grocers, I cut Saturday queue times by 30% by adding a floating cashier to the roster, and I'd like to bring that same focus on busy-day service to your Parramatta store.",
    "Your ad asks for someone who can coach a team of six. Over the past year I've trained six new starters on POS, cash handling and safety, and all of them passed probation. I also run a five-minute huddle before each Saturday shift, which our store manager has since rolled out to weekdays.",
    "I shop at Coastline Fresh myself and like how your stores support local growers. Your Parramatta store's longer weekend trading hours are exactly the kind of busy, high-volume shifts I enjoy leading.",
    "I'm available every weekend and can start with two weeks' notice. Thank you for considering my application. I'd welcome the chance to talk about how I could help your Parramatta team."
  ]
};
const JORDAN = {
  resume: `JORDAN LEE Footscray VIC 0400 000 002
Certificate IV in Disability Support, completed 2026
- 120-hour placement at a supported independent living home: assisted four residents with personal care, meals and community outings
- Asked to pick up casual shifts after the placement
- Supervisor feedback noted patience with behaviours of concern and clear, accurate shift notes
Venue Supervisor, The Railway Hotel, Feb 2018 – Jan 2026
- Supervised teams of up to 12
- Managed incidents with intoxicated patrons using de-escalation and RSA procedures
Checks: NDIS Worker Screening Check (current), First Aid and CPR (current), manual driver's licence`,
  ad: `Disability Support Worker (Casual) – Western Suburbs
Riverbend Support Services
Riverbend helps people with disability live independently in their own community.
Essential: NDIS Worker Screening Check, First Aid and CPR, driver's licence`,
  answers: ["Their focus on independent living, and my placement colleagues say they support new workers well.", "weekdays and alternate weekends"],
  employer: "Riverbend Support Services", title: "Disability Support Worker",
  roles: [{ start: "Feb 2018", end: "Jan 2026", field: "hospitality", paid: true }],
  letter: [
    "After eight years in hospitality, I've completed a Certificate IV in Disability Support and I'm applying for the Disability Support Worker role at Riverbend Support Services. The skills that made me a good venue supervisor (staying calm under pressure, reading people quickly and keeping everyone safe) are the ones I now want to use in support work.",
    "During my 120-hour placement at a supported independent living home, I assisted four residents with personal care, meals and community outings, and I was asked to pick up casual shifts once it finished. My supervisor's feedback noted my patience with behaviours of concern and my clear, accurate shift notes.",
    "Riverbend's focus on helping people live independently in their own community is why I'm applying to you first, along with your reputation among my placement colleagues for supporting new workers well.",
    "I hold a current NDIS Worker Screening Check, First Aid and CPR, and a manual driver's licence, and I can work weekdays and alternate weekends. Thank you for considering my application. I'd welcome the chance to discuss the role."
  ]
};
const MIA = {
  resume: `MIA THOMPSON Townsville QLD 0400 000 003
Year 12 student, Kirwan State High School (2026)
Volunteering: School canteen, every Tuesday for two years. Serve up to 200 students in a 30-minute lunch break; handle cash.
Sport: Vice-captain, netball team; train and play every week.
Course: Barista basics, TAFE Queensland (2026)`,
  ad: `Casual All-rounder – Bean & Gone, Thuringowa Drive
Busy café looking for a casual all-rounder for our morning rush.
- Available after school and on weekends`,
  answers: ["I've been a regular at the Thuringowa Drive café for two years.", "after 3:30 pm on weekdays, all day on weekends, and full-time during school holidays"],
  employer: "Bean & Gone", title: "casual all-rounder",
  letter: [
    "I'm a Year 12 student at Kirwan State High School and I'd love to join the team at Bean & Gone as a casual all-rounder. I've been a regular at your Thuringowa Drive café for two years, and I'd like to help keep the morning rush running as smoothly as your team does now.",
    "I haven't worked in a café yet, but I'm used to busy, pressured situations. I've volunteered at our school canteen every Tuesday for two years, serving up to 200 students in a 30-minute lunch break and handling cash.",
    "I'm available after 3:30 pm on weekdays, all day on weekends, and full-time during school holidays. I'd be happy to do a paid trial shift whenever suits you. Thank you for considering my application."
  ]
};
const sourcesOf = f => [f.resume, f.ad, ...f.answers, f.employer, f.title, ...(f.roles ? [LR.yearsText(LR.monthsIn(f.roles, "hospitality", NOW), "hospitality")] : [])];


/* ---------------- a real bad letter the writer produced (from the fix brief), with a made-up header ---------------- */
// Used by tests/letter-brief.test.mjs. The contact line is invented: the real one is not kept in the repo.
const BAD_LETTER = `Sam Example
Melbourne, VIC | 0400 000 000 | sam.example@example.com | linkedin.com/in/sam-example

9 November 2026

[Hiring manager's name, e.g. Sam Lee]
[Company name, e.g. Sydney Water]

Re: Application for [Job title, e.g. Graduate Engineer]

Dear Hiring Manager,

I am applying for the role at [the company]. I hold a Master of Engineering (Mechanical) before graduating in November 2027. At Worley, I collaborated with a team of 2 to identify operational process improvements using Microsoft Excel and Microsoft Office suites. This resulted in a demonstrated ability to analyse data effectively. The job description requests analytical skills, aligning with my experience using Microsoft Excel and Office suites to improve processes.

I worked at [the company] as a Consulting Analyst. I was working on a solar energy project to improve a new production facility. My first task was to assess the sunlight conditions at the project site alongside a team of two other engineers. We used Python and Excel to evaluate solar intensity. We also used QGIS and Google Earth Pro to create site survey maps. This work led to informed solar layout and generation modelling, which was then used for the Tiwi H2 Project's pre-feasibility study. Understanding the solar intensity is crucial for successful solar projects and optimizing energy generation.

I am completing a Master of Engineering (Mechanical) at RMIT University, finishing in November 2027. During my studies, I focused on Sustainable Engineering Practices, Modelling & Simulation of Engineering Systems, and Innovation and Technology Management. I have developed proficiency in Python, Microsoft Excel, Power BI, and Microsoft Office. My major project involved Tesla CyberTruck Modal and Frequency Analysis using Python for data processing. This ability to analyse complex data is valuable for developing effective solutions within [the role].

I am drawn to [Company name, e.g. Sydney Water] because [one specific reason you want to work for this employer]. I want to do [the work you want to do and why it suits you]. My experience has also developed my problem solving, analytical skills and interpersonal skills, which I would use to [say in one line what you would do for this team].

I can contribute through effective problem solving to the successful outcomes of [the role]. My availability allows me to commence work with two weeks' notice; please feel free to discuss the specifics of [the role] with me. Thank you for considering my application.

Kind regards,

Sam Example
`;

export { LR, NOW, ALEX, JORDAN, MIA, BAD_LETTER, sourcesOf };
