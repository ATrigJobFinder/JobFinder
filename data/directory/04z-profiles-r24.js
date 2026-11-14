/* ===================== Directory profiles, round 24: lifts and pest control, workwear, software and payments companies, technology consultancies =====================
   Uses techVendor (round 11). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const liftCompany = (name, what) => ({
  about: [
    `${name} is ${what}. It installs, maintains, repairs and modernises lifts, escalators and moving walkways in office towers, apartment buildings, hospitals, shopping centres and transport hubs.`,
    "It employs lift mechanics and technicians, apprentices, installation supervisors, service and maintenance managers, engineers and designers, sales and account staff, customer service staff, and finance and corporate staff. Many roles are field based and on call, and apprenticeships in lift mechanics or electrical trades are a common way in."
  ],
  spec: ["Lifts and escalators", "Installation", "Maintenance and repair", "Modernisation", "Field service"],
  roles: ["Lift mechanic", "Apprentice", "Service technician", "Installation supervisor", "Sales"]
});
const softwareCompany = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. Its product is used by businesses, developers or clinics, and the team builds, sells and supports it.`,
    "It employs software engineers, product managers and designers, data and security staff, customer support and success staff, sales and marketing staff, and finance and people staff. It suits people with software, product or technology backgrounds, and many teams work in a hybrid or remote way."
  ],
  spec: ["Software engineering", "Product and design", "Customer support", "Sales and marketing", "Cloud and security"],
  roles: ["Software engineer", "Product manager", "Designer", "Customer support", "Account executive"]
});
const techConsultancy = (name, what) => ({
  about: [
    `${name} is ${what}. It works with businesses and governments to plan, design and build software, data and cloud systems, often in teams that sit with the client.`,
    "It employs software and cloud engineers, data engineers, designers and business analysts, delivery leads and agile coaches, sales and recruitment staff, and finance and operations staff. It suits graduates and experienced technologists, and many roles mix client work with training and community events."
  ],
  spec: ["Software engineering", "Cloud and data", "Digital product design", "Agile delivery", "Consulting"],
  roles: ["Software engineer", "Cloud engineer", "Business analyst", "Designer", "Delivery lead"]
});
Object.assign(DIR_PROFILES, {
  "Workwear Group": { about: ["Workwear Group is an Australian maker and supplier of workwear and safety clothing, with brands that include KingGee and Hard Yakka. It supplies stores, trade suppliers and businesses that outfit their staff.", "It employs product designers and developers, sourcing and quality staff, warehouse and distribution staff, sales and account managers, marketing and e-commerce staff, store staff, and finance and corporate staff. It suits people with apparel, retail, supply chain or sales backgrounds."], spec: ["Workwear and safety clothing", "Product design", "Wholesale", "Distribution", "Corporate uniforms"], roles: ["Product developer", "Sales representative", "Warehouse", "Marketing", "Account manager"] },
  "KONE Australia": liftCompany("KONE Australia", "the Australian arm of a global maker of lifts and escalators"),
  "Otis Australia": liftCompany("Otis Australia", "the Australian arm of a global maker of lifts and escalators"),
  "Flick Anticimex": { about: ["Flick Anticimex is an Australian pest control company. It inspects and treats homes and businesses for termites, rodents, cockroaches and other pests, and offers regular protection plans.", "It employs pest technicians and termite inspectors, apprentices and trainees, customer service and sales staff, branch and area managers, and finance, marketing and head office staff. Many roles are field based with vehicles and a licence, and technicians need a pest management qualification, which the company can help staff to get."], spec: ["Pest control", "Termite inspection", "Field service", "Customer service", "Residential and commercial"], roles: ["Pest technician", "Termite inspector", "Customer service", "Sales", "Branch manager"] },
  "Buildkite": softwareCompany("Buildkite", "an Australian software company that makes a platform for building, testing and releasing software", "founded in Melbourne"),
  "Octopus Deploy": softwareCompany("Octopus Deploy", "an Australian software company, founded in Brisbane, that makes software for releasing and operating software", ""),
  "Zeller": softwareCompany("Zeller", "an Australian financial technology company that offers business accounts, card payments and EFTPOS terminals to small businesses", "based in Sydney"),
  "Pin Payments": softwareCompany("Pin Payments", "an Australian payments company that provides online and in-person payment services to businesses", "based in Melbourne"),
  "Splose": softwareCompany("Splose", "an Australian software company that makes practice management software for allied health clinics, covering bookings, notes and billing", ""),
  "Canstar": { about: ["Canstar is an Australian research and ratings company that compares financial and other products, such as home loans, credit cards, insurance and energy plans, and publishes star ratings and awards for consumers.", "It employs researchers and analysts, content writers and editors, digital and search marketing staff, data and technology staff, sales and partnership staff, and finance and corporate staff. It suits people with finance, data, journalism or digital marketing backgrounds."], spec: ["Product research and ratings", "Financial comparison", "Content and editorial", "Digital marketing", "Data and analytics"], roles: ["Research analyst", "Content writer", "Digital marketing", "Data analyst", "Partnerships"] },
  "Elabor8": techConsultancy("Elabor8", "an Australian technology and agile consultancy"),
  "Kablamo": techConsultancy("Kablamo", "an Australian cloud and software engineering consultancy"),
  "DiUS": techConsultancy("DiUS", "an Australian technology consultancy that designs and builds digital products"),
  "Autodesk Australia": techVendor("Autodesk Australia", "the Australian arm of a global software company that makes design and engineering software for architecture, construction, manufacturing and media", "sells to and supports local design, engineering and construction firms"),
  "DocuSign Australia": techVendor("DocuSign Australia", "the Australian arm of a global company that makes electronic signature and agreement software", "sells to and supports local businesses and governments")
});
