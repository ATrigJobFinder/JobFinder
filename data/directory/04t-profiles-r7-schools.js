/* ===================== Directory profiles, round 7: independent schools and Catholic education offices =====================
   Uses schoolProfile from the round 6 file for schools that run from the early years to Year 12. Schools that start later, or senior-only colleges, get their own wording. */
const schoolLite = (name, kind, where, stage) => ({
  about: [
    `${name} is ${kind} in ${where}. It teaches ${stage}, and runs sport, music, drama, outdoor education and community programs alongside the classroom.`,
    "It employs teachers and heads of department, teaching assistants, counsellors and wellbeing staff, sport and music coaches, boarding and house staff where it has boarders, librarians, IT and facilities staff, finance, admissions, marketing and administration staff. Teachers need registration, and many roles include coaching and co-curricular duties. Jobs are listed on the school's careers or employment page."
  ],
  spec: ["Teaching and learning", "Student wellbeing", "Sport and co-curricular", "Boarding and house", "Administration"],
  hq: where, roles: ["Teacher", "Teaching assistant", "Sport and music coach", "Counsellor", "Administration"]
});
Object.assign(DIR_PROFILES, Object.fromEntries([
  ["Radford College", "a co-educational Anglican school", "Bruce, ACT"],
  ["Burgmann Anglican School", "a co-educational Anglican school", "Bonner, ACT"],
  ["Canberra Grammar School", "an Anglican boys' school", "Red Hill, ACT"],
  ["Canberra Girls Grammar School", "an Anglican girls' school", "Deakin, ACT"],
  ["The Hutchins School", "an Anglican boys' school", "Hobart, TAS"],
  ["Brisbane Boys' College", "a boys' school with day and boarding students", "Toowong, QLD"],
  ["Ascham School", "a girls' school", "Edgecliff, NSW"],
  ["Somerville House", "a girls' school", "South Brisbane, QLD"],
  ["Abbotsleigh", "an Anglican girls' school with day and boarding students", "Wahroonga, NSW"],
  ["SCEGGS Darlinghurst", "an Anglican girls' school", "Sydney, NSW"],
  ["Trinity Grammar School Sydney", "an Anglican boys' school", "Summer Hill, NSW"],
  ["Caulfield Grammar School", "a co-educational school with campuses across Melbourne", "Melbourne, VIC"],
  ["Knox Grammar School", "a boys' school with day and boarding students", "Wahroonga, NSW"],
  ["Strathcona Girls Grammar School", "an Anglican girls' school", "Canterbury, VIC"],
  ["Essington School Darwin", "a co-educational independent school", "Darwin, NT"],
  ["Presbyterian Ladies' College Melbourne", "a girls' school", "Burwood, VIC"],
  ["Trinity Grammar School Kew", "an Anglican boys' school", "Kew, VIC"],
  ["The Southport School", "an Anglican boys' school with day and boarding students", "Southport, QLD"],
  ["Genazzano FCJ College", "a Catholic girls' school", "Kew, VIC"],
  ["Launceston Church Grammar School", "an Anglican school", "Launceston, TAS"],
  ["Pymble Ladies' College", "a girls' school with day and boarding students", "Pymble, NSW"]
].map(([n, kind, where]) => [n, schoolProfile(n, kind, where)])));
Object.assign(DIR_PROFILES, {
  "Toowoomba Grammar School": schoolLite("Toowoomba Grammar School", "a boys' school with day and boarding students", "Toowoomba, QLD", "boys through the upper primary and secondary years"),
  "Daramalan College": schoolLite("Daramalan College", "a co-educational Catholic secondary school", "Dickson, ACT", "students from Year 7 to Year 12"),
  "St Kevin's College Melbourne": schoolLite("St Kevin's College Melbourne", "a Catholic boys' school", "Toorak, VIC", "boys from the primary years to the end of secondary school"),
  "Guilford Young College": {
    about: [
      "Guilford Young College is a Catholic senior secondary college in Tasmania that teaches Year 11 and Year 12, with campuses in several parts of the state. It offers the Tasmanian Certificate of Education along with vocational courses, and prepares students for university, TAFE and work.",
      "It employs teachers, teaching assistants, student wellbeing and pathways staff, library and IT staff, administration and campus support staff. Teachers need registration and a Working With Children check, and jobs are listed on the college's employment page, often alongside the state's Catholic schools."
    ],
    spec: ["Senior secondary teaching", "Vocational education", "Student wellbeing", "Pathways", "Administration"],
    hq: "Tasmania", roles: ["Teacher", "Teaching assistant", "Wellbeing staff", "Administration"]
  },
  "Catholic Education Diocese of Wollongong": {
    about: [
      "Catholic Education Diocese of Wollongong is the body that runs the Catholic schools of the Wollongong diocese in New South Wales, from the Illawarra through to the Southern Highlands and the Shoalhaven. It supports its schools with leadership, curriculum, wellbeing, finance, property and IT services, and publishes the jobs open across the diocese.",
      "It employs teachers and school leaders, teaching assistants, learning support and wellbeing staff, administration, finance, property and IT staff in its central office and schools. Teachers need accreditation and a Working With Children Check, and jobs are listed on its careers page, with many advertised school by school."
    ],
    spec: ["Catholic schooling", "Teaching and learning", "Student wellbeing", "School leadership", "Corporate services"],
    hq: "Wollongong, NSW", roles: ["Teacher", "Teaching assistant", "Learning support", "School administration", "Principal"]
  },
  "Catholic Education Tasmania": {
    about: [
      "Catholic Education Tasmania runs and supports the Catholic schools across Tasmania, including primary schools, secondary schools and senior secondary colleges. Its central office provides leadership, curriculum, wellbeing, finance, property and IT services to the schools.",
      "It employs teachers and school leaders, teaching assistants, learning support and wellbeing staff, and administration, finance and IT staff. Teachers need registration and a Working With Children check, and jobs are listed on its careers page, with schools advertising their own vacancies too."
    ],
    spec: ["Catholic schooling", "Teaching and learning", "Student wellbeing", "School leadership", "Corporate services"],
    hq: "Hobart, TAS", roles: ["Teacher", "Teaching assistant", "Learning support", "School administration", "Principal"]
  }
});
