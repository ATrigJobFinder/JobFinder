/* ===================== Directory profiles, round 50: Australian software and finance start-ups, workplace services, bike and camping retailers =====================
   Uses softwareCompany (round 24) and retailBrand (round 10). Two paragraphs each; anything that couldn't be confirmed is left out. */
const fintechLender = (name, what) => ({
  about: [
    `${name} is ${what}. Customers use its app or website, and the team builds the product, assesses risk and supports customers.`,
    "It employs software engineers, data scientists and product staff, credit and risk analysts, customer support and collections staff, marketing and growth staff, compliance and legal staff, and finance and corporate staff. It suits people with technology, credit, data or consumer finance backgrounds, and teams are usually small."
  ],
  spec: ["Financial technology", "Credit and risk", "Software engineering", "Customer support", "Compliance"],
  roles: ["Software engineer", "Credit analyst", "Data scientist", "Customer support", "Compliance"]
});
Object.assign(DIR_PROFILES, {
  "Spriggy": fintechLender("Spriggy", "an Australian financial technology company, based in Sydney, that makes a pocket money app and prepaid card for children and families"),
  "Harmoney Australia": fintechLender("Harmoney Australia", "the Australian arm of an online lender that makes personal loans through its website and app"),
  "Cin7": softwareCompany("Cin7", "a software company that makes inventory and order management software for businesses that sell products online, in stores and wholesale", ""),
  "Fresho": softwareCompany("Fresho", "an Australian software company that makes ordering and delivery software for fresh food wholesalers and their customers", "based in Sydney"),
  "Dovetail": softwareCompany("Dovetail", "a software company, started in Sydney, that makes a platform for analysing customer research and interviews", ""),
  "Lawpath": softwareCompany("Lawpath", "an Australian online legal platform, based in Sydney, that helps small businesses with documents, company registration and legal advice", ""),
  "Humanforce": softwareCompany("Humanforce", "an Australian software company, based in Melbourne, that makes workforce management software for rostering, time and attendance, and payroll", ""),
  "Shippit": softwareCompany("Shippit", "an Australian software company, based in Sydney, that makes shipping and delivery software for online retailers", ""),
  "Starshipit": softwareCompany("Starshipit", "a software company that makes shipping software for online retailers, connecting them with couriers and online stores", ""),
  "Employsure": { about: ["Employsure is an Australian provider of workplace relations and safety advice for small and medium businesses. Its advisers help employers with awards, contracts, performance and workplace health and safety, and it sells advice through subscriptions.", "It employs workplace relations advisers, work health and safety advisers, sales and customer service staff, legal and technical staff, marketing staff, and finance and corporate staff. Many roles are in contact centres and suit people with human resources, law, industrial relations or sales backgrounds."], spec: ["Workplace relations advice", "Work health and safety", "Small business support", "Sales", "Customer service"], roles: ["Workplace relations adviser", "Safety adviser", "Sales", "Customer service", "Legal and technical"] },
  "99 Bikes": retailBrand("99 Bikes", "an Australian bicycle retailer that sells road, mountain, electric and kids' bikes, parts, clothing and accessories, and services bikes in its stores"),
  "Bike Bug": retailBrand("Bike Bug", "an Australian bicycle retailer that sells bikes, parts and accessories online and in stores"),
  "Cell Bikes": retailBrand("Cell Bikes", "an Australian bicycle retailer that sells bikes, parts and accessories online and in stores"),
  "Adventure Kings": retailBrand("Adventure Kings", "an Australian retailer of camping, caravan and 4WD gear"),
  "Tentworld": retailBrand("Tentworld", "an Australian retailer of tents, camping and outdoor gear"),
  "Zempire": retailBrand("Zempire", "an Australian camping and outdoor brand that makes and sells tents, swags and camping gear")
});
