/* ===================== Directory profiles, round 63: disability services and faith-based aged care =====================
   Uses healthCharity (round 35) and agedCare (round 12). Two paragraphs each; anything that couldn't be confirmed is left out. */
const disabilityProvider = (name, where) => ({
  about: [
    `${name} is a not-for-profit disability service provider ${where}. It supports people with disability to live, work and take part in their communities, through supported accommodation, day programs, employment services and individual support.`,
    "It employs disability support workers, team leaders and house supervisors, allied health and behaviour support staff, coordinators and service managers, and administration and corporate staff. Many roles involve rostered shifts in homes and community settings, and a Certificate III in individual support or disability, a police check and a Working with Children Check are often needed."
  ],
  spec: ["Disability support", "Supported accommodation", "Day and community programs", "Employment support", "Allied health"],
  roles: ["Disability support worker", "Team leader", "Service coordinator", "Allied health", "Administration"]
});
Object.assign(DIR_PROFILES, {
  "Distinctive Options": disabilityProvider("Distinctive Options", "in New South Wales"),
  "Sunnyfield": disabilityProvider("Sunnyfield", "in New South Wales"),
  "Wallara": disabilityProvider("Wallara", "in Melbourne"),
  "St Vincent's Care Services": agedCare("St Vincent's Care Services", "Australia", "as part of the Sisters of Charity health and aged care ministry"),
  "Jewish Care Victoria": { about: ["Jewish Care Victoria is a community services organisation that provides aged care, disability, mental health, family and community services, mostly to the Jewish community in Melbourne.", "It employs personal care workers and nurses, social workers and counsellors, disability support workers, allied health staff, kitchen and hospitality staff, volunteer and fundraising staff, and finance and corporate staff. Many roles are direct care roles, and a Certificate III in individual support is often wanted."], spec: ["Aged care", "Disability support", "Mental health and counselling", "Family services", "Community programs"], hq: "Melbourne, VIC", roles: ["Personal care worker", "Registered nurse", "Social worker", "Disability support worker", "Kitchen staff"] },
  "St Basil's": agedCare("St Basil's", "Victoria and New South Wales", "with a Greek Orthodox background")
});
