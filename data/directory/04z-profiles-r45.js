/* ===================== Directory profiles, round 45: recruiters, home care providers, health software, a peak body =====================
   Uses recruiter (round 12). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const homeCareProvider = (name, what) => ({
  about: [
    `${name} is ${what}. Its support workers and carers visit people at home to help with personal care, meals, household tasks, transport and community activities, and the business matches workers to clients and handles rosters and funding.`,
    "It employs support workers and carers, care coordinators and rostering staff, nurses and allied health staff, client intake and customer service staff, recruitment and training staff, and finance and head office staff. Many roles are part-time or casual and suit people studying or starting out in aged care and disability, and a Certificate III in individual support, a police check and a Working with Children Check are often needed."
  ],
  spec: ["In-home care", "Aged care and disability support", "Care coordination", "Rostering", "Client services"],
  roles: ["Support worker", "Care coordinator", "Rostering", "Client services", "Registered nurse"]
});
const healthSoftwareCompany = (name, what) => ({
  about: [
    `${name} is ${what}. Its software is used in clinics and practices, and the team builds, sells, supports and trains users of it.`,
    "It employs software engineers, product managers and designers, clinical and implementation specialists, customer support and training staff, sales and marketing staff, and finance and corporate staff. It suits people with software, health information or clinical practice backgrounds."
  ],
  spec: ["Health software", "Software engineering", "Clinical implementation", "Customer support", "Training"],
  roles: ["Software engineer", "Product manager", "Implementation specialist", "Customer support", "Sales"]
});
Object.assign(DIR_PROFILES, {
  "Julia Ross Recruitment": recruiter("Julia Ross Recruitment", "an Australian recruitment company that places people in professional, support and temporary roles"),
  "Clicks IT Recruitment": recruiter("Clicks IT Recruitment", "an Australian recruitment company that places technology professionals in permanent and contract roles"),
  "Paxus": recruiter("Paxus", "an Australian recruitment company that places technology and digital professionals, mostly in contract roles"),
  "Charterhouse Recruitment": recruiter("Charterhouse Recruitment", "an Australian recruitment company that places people in professional and support roles"),
  "Hudson Australia": recruiter("Hudson Australia", "the Australian arm of an international recruitment and talent solutions company"),
  "Jobs Australia": { about: ["Jobs Australia is a national peak body for not-for-profit organisations that deliver employment, training and community services. It represents members to governments, shares information and runs training and events.", "It employs policy and advocacy staff, member services and events staff, training and research staff, communications staff, and finance and administration staff. Teams are small, and roles suit people with community services, employment services or policy backgrounds."], spec: ["Peak body advocacy", "Employment services", "Member services", "Policy", "Training and events"], roles: ["Policy officer", "Member services", "Events", "Communications", "Administration"] },
  "Hireup": { about: ["Hireup is an Australian online platform that connects people with disability to independent support workers. Customers choose their workers and manage their supports through the app, and workers pick up shifts and are paid through the platform.", "It employs software engineers, product and design staff, customer support and support worker success staff, quality and safeguards staff, sales and marketing staff, and finance and corporate staff. It suits people with technology, disability services or customer service backgrounds."], spec: ["Disability support platform", "Software engineering", "Customer support", "Quality and safeguards", "Marketing"], roles: ["Software engineer", "Customer support", "Product manager", "Quality and safeguards", "Marketing"] },
  "Careseekers": homeCareProvider("Careseekers", "an Australian provider of in-home care and support for older people and people with disability"),
  "Just Better Care": homeCareProvider("Just Better Care", "an Australian provider of in-home aged care and disability support, run as a network of franchised and company offices"),
  "Right at Home Australia": homeCareProvider("Right at Home Australia", "the Australian arm of an international provider of in-home aged care and disability support, run as a franchise network"),
  "Homecare Assistance": homeCareProvider("Homecare Assistance", "an Australian provider of in-home care for older people and people with disability"),
  "Pen CS": healthSoftwareCompany("Pen CS", "an Australian health software company that makes tools to help general practices analyse patient data and improve care"),
  "Medical Director": healthSoftwareCompany("Medical Director", "an Australian maker of clinical software that general practices use for patient records, prescribing and billing")
});
