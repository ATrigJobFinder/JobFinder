/* ===================== Directory profiles, round 33: architects, cost and project consultants, environmental and engineering consultants, property groups =====================
   Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const architectureFirm = (name, what) => ({
  about: [
    `${name} is ${what}. It designs buildings and places for developers, governments and other clients, from early concept through to documentation and construction support.`,
    "It employs architects and graduates of architecture, interior designers, urban designers and planners, visualisation and technology staff, project and practice managers, and marketing, finance and administration staff. Architects need a degree, a masters and registration, and many firms run graduate and work experience programs and hire architecture students part-time."
  ],
  spec: ["Architecture", "Interior design", "Urban design", "Documentation", "Design technology"],
  roles: ["Architect", "Graduate of architecture", "Interior designer", "Urban designer", "Practice manager"]
});
const costConsultancy = (name, what) => ({
  about: [
    `${name} is ${what}. It estimates, plans and tracks the cost of buildings and infrastructure projects for developers, owners and governments, and advises on project delivery and value.`,
    "It employs quantity surveyors and cost managers, project and programme managers, estimators, contract and procurement advisers, analysts, and finance and administration staff. Most roles suit people with a degree in quantity surveying, construction management, engineering or property, and graduate programs are advertised on its careers page."
  ],
  spec: ["Quantity surveying", "Cost management", "Project management", "Procurement and contracts", "Property advisory"],
  roles: ["Quantity surveyor", "Cost manager", "Project manager", "Graduate", "Estimator"]
});
const environmentalConsultancy = (name, what) => ({
  about: [
    `${name} is ${what}. It helps developers, mining and energy companies, governments and others to assess and manage the effects of their projects on the environment and communities, and to get approvals.`,
    "It employs ecologists and environmental scientists, planners and approvals specialists, heritage and cultural advisers, social impact and community engagement specialists, GIS and data staff, project managers, and finance and administration staff. Many roles combine office and field work and suit people with science, planning or environmental management backgrounds."
  ],
  spec: ["Environmental assessment", "Ecology", "Planning and approvals", "Community engagement", "Heritage"],
  roles: ["Environmental scientist", "Ecologist", "Planner", "GIS analyst", "Graduate"]
});
const engineeringConsultancy = (name, what) => ({
  about: [
    `${name} is ${what}. It designs and advises on buildings, roads, water and other infrastructure for developers, builders and governments.`,
    "It employs civil, structural, mechanical and electrical engineers, designers and drafters, project engineers and managers, technical specialists, and finance and administration staff. It suits graduates and experienced engineers, and many firms run graduate programs and hire engineering students part-time."
  ],
  spec: ["Engineering design", "Civil and structural engineering", "Project delivery", "Technical advice", "Infrastructure"],
  roles: ["Engineer", "Graduate engineer", "Designer", "Project engineer", "Drafter"]
});
const listedPropertyGroup = (name, what) => ({
  about: [
    `${name} is ${what}. It owns and manages properties and earns rent from tenants, and its investors are mostly people and funds that buy its securities.`,
    "It employs asset and property managers, leasing and investment staff, development and project staff, finance, investor relations and reporting staff, legal and risk staff, and administration staff. It suits people with property, finance, law or accounting backgrounds, and teams are usually small."
  ],
  spec: ["Property investment", "Asset and property management", "Leasing", "Finance and reporting", "Investor relations"],
  roles: ["Asset manager", "Property manager", "Leasing", "Analyst", "Finance"]
});
Object.assign(DIR_PROFILES, {
  "SJB Architects": architectureFirm("SJB Architects", "an Australian architecture, interior design and planning practice with studios in several cities"),
  "Hayball": architectureFirm("Hayball", "an Australian architecture and design practice, based in Melbourne"),
  "Grimshaw Australia": architectureFirm("Grimshaw Australia", "the Australian arm of an international architecture practice"),
  "Rider Levett Bucknall": costConsultancy("Rider Levett Bucknall", "an international property and construction consultancy with offices across Australia"),
  "Slattery Australia": costConsultancy("Slattery Australia", "an Australian cost management and project advisory consultancy"),
  "WT Partnership": costConsultancy("WT Partnership", "an international cost management and quantity surveying consultancy with offices in Australia"),
  "Altus Group Australia": costConsultancy("Altus Group Australia", "the Australian arm of a property and construction consultancy that offers cost management and project management"),
  "Napier and Blakeley": costConsultancy("Napier & Blakeley", "an Australian quantity surveying and cost management consultancy"),
  "MBM": costConsultancy("MBM", "an Australian cost consultancy and project management firm"),
  "Currie and Brown Australia": costConsultancy("Currie & Brown Australia", "the Australian arm of an international cost and project management consultancy"),
  "Umwelt": environmentalConsultancy("Umwelt", "an Australian environmental and social consultancy"),
  "EMM Consulting": environmentalConsultancy("EMM Consulting", "an Australian environmental and social consultancy"),
  "Biosis": environmentalConsultancy("Biosis", "an Australian ecological and environmental consultancy"),
  "Alluvium Consulting": { about: ["Alluvium Consulting is an Australian water and river consultancy based in Melbourne. It advises on rivers, wetlands, floodplains, stormwater and water supply for water businesses, councils and governments.", "It employs river scientists and hydrologists, water engineers, ecologists, planners and urban water specialists, GIS and data staff, project managers, and finance and administration staff. It suits people with water, environmental science or engineering backgrounds."], spec: ["Rivers and waterways", "Hydrology and flooding", "Urban water", "Environmental science", "Water planning"], hq: "Melbourne, VIC", roles: ["Hydrologist", "River scientist", "Water engineer", "Ecologist", "Graduate"] },
  "Pitt and Sherry": engineeringConsultancy("Pitt & Sherry", "an Australian engineering, planning and environmental consultancy"),
  "Fyfe": engineeringConsultancy("Fyfe", "an Australian engineering and consulting firm"),
  "Taylor Thomson Whitting": engineeringConsultancy("Taylor Thomson Whitting", "an engineering consultancy based in Sydney that provides civil and structural design"),
  "Meinhardt Australia": engineeringConsultancy("Meinhardt Australia", "the Australian arm of an international engineering and project management consultancy"),
  "Growthpoint Properties Australia": listedPropertyGroup("Growthpoint Properties Australia", "an Australian listed property group, based in Melbourne, that owns office and industrial properties"),
  "Arena REIT": listedPropertyGroup("Arena REIT", "an Australian listed property trust, based in Melbourne, that owns childcare centres and other social infrastructure properties"),
  "HomeCo": listedPropertyGroup("HomeCo", "an Australian property group, based in Sydney, that owns and manages neighbourhood shopping centres, large format retail and other properties")
});
