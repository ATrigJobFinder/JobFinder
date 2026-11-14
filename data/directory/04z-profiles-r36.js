/* ===================== Directory profiles, round 36: hair and beauty salons, health and beauty retailers, health regulator and a workplace agency =====================
   Uses retailBrand (round 10). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const salonChain = (name, what) => ({
  about: [
    `${name} is ${what}. Its salons offer services to walk-in and booked customers, and some are run by franchise owners with support from the head office.`,
    "It employs hairdressers, beauty therapists and apprentices, salon managers and receptionists, trainers, area and franchise support staff, and marketing and head office staff. Trade qualifications such as a Certificate III in hairdressing or beauty are needed for most service roles, and apprenticeships are a common way in. Many roles are part-time or casual and include weekends."
  ],
  spec: ["Hair and beauty services", "Apprenticeships and training", "Customer service", "Salon management", "Franchising"],
  roles: ["Hairdresser", "Apprentice", "Beauty therapist", "Salon manager", "Receptionist"]
});
Object.assign(DIR_PROFILES, {
  "Toni and Guy Australia": salonChain("Toni&Guy Australia", "the Australian arm of an international hairdressing brand, with salons and training academies"),
  "Just Cuts": salonChain("Just Cuts", "an Australian hairdressing salon chain that offers cuts, colour and styling"),
  "Wax in the City": salonChain("Wax in the City", "an Australian waxing salon chain that offers waxing, brow and other beauty services"),
  "Hairhouse": retailBrand("Hairhouse", "an Australian hair and beauty retailer that sells hair care, styling tools and beauty products"),
  "Nutrition Warehouse": retailBrand("Nutrition Warehouse", "an Australian retailer of sports nutrition, vitamins and supplements"),
  "Vitamin Warehouse": retailBrand("Vitamin Warehouse", "an Australian retailer of vitamins, supplements and health products"),
  "Ahpra": { about: ["Ahpra, the Australian Health Practitioner Regulation Agency, works with the national boards to regulate health practitioners in Australia, such as doctors, nurses, dentists, pharmacists and psychologists. It registers practitioners, sets and checks standards, and handles notifications about their conduct.", "It employs registration and customer service staff, investigators and case managers, lawyers and policy staff, data and technology staff, communications and engagement staff, and finance and corporate staff. It has offices in each capital city, and many roles suit people with health, law, regulation or public sector backgrounds."], spec: ["Health practitioner registration", "Regulation", "Investigations and notifications", "Policy and standards", "Customer service"], hq: "Melbourne, VIC", roles: ["Registration officer", "Investigator", "Case manager", "Policy officer", "Customer service"] },
  "Workplace Gender Equality Agency": { about: ["The Workplace Gender Equality Agency is the Australian Government agency that promotes and improves gender equality in workplaces. It collects and publishes gender equality data from employers, runs an employer of choice citation program, and provides tools and guidance.", "It employs data and research analysts, employer engagement and advisory staff, policy and communications staff, technology and reporting staff, and finance and corporate staff. It suits people with data, policy, human resources or public sector backgrounds, and most roles are in Sydney."], spec: ["Gender equality", "Workplace data and reporting", "Employer advice", "Research and policy", "Communications"], hq: "Sydney, NSW", roles: ["Data analyst", "Employer engagement", "Policy officer", "Communications", "Administration"] }
});
