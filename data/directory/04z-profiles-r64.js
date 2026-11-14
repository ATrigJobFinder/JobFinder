/* ===================== Directory profiles, round 64: community housing providers, community health services and small rural health services =====================
   Uses housingProvider (round 11). Two paragraphs each; anything that couldn't be confirmed is left out. */
const communityHealthService = (name, where) => ({
  about: [
    `${name} is a not-for-profit community health service ${where}. It offers GPs, nursing, dental, allied health, counselling, mental health and alcohol and drug support, and programs for older people, children and refugees.`,
    "It employs doctors and nurses, dentists and dental assistants, allied health professionals, counsellors and social workers, health promotion and program staff, reception and client services staff, and finance and corporate staff. Clinical roles need registration, and many roles suit people starting out in community health, nursing or allied health."
  ],
  spec: ["Community health", "General practice", "Allied health", "Dental", "Counselling and mental health"],
  roles: ["Nurse", "Allied health professional", "Counsellor", "General practitioner", "Client services"]
});
const smallRuralHealth = (name, where) => ({
  about: [
    `${name} is a public health service ${where}. It runs a small hospital, urgent care, aged care and community health services, and often one of the biggest employers in its town.`,
    "It employs registered and enrolled nurses, personal care workers, allied health staff, kitchen, cleaning and maintenance staff, administration staff, and managers. Clinical roles need registration, and nursing and graduate programs in rural Victoria are common ways in."
  ],
  spec: ["Rural hospital care", "Aged care", "Urgent care", "Community health", "Nursing"],
  roles: ["Registered nurse", "Enrolled nurse", "Personal care worker", "Allied health", "Administration"]
});
Object.assign(DIR_PROFILES, {
  "Argyle Housing": housingProvider("Argyle Housing", "New South Wales"),
  "Hume Community Housing": housingProvider("Hume Community Housing", "New South Wales"),
  "Unison Housing": housingProvider("Unison Housing", "Victoria"),
  "Unity Housing": housingProvider("Unity Housing", "South Australia"),
  "VincentCare Victoria": { about: ["VincentCare Victoria is the social services arm of the St Vincent de Paul Society in Victoria. It provides homelessness and housing services, family violence support, and other services for people in need.", "It employs case workers and support workers, housing and tenancy staff, family violence practitioners, program and service managers, volunteer and fundraising staff, and finance and corporate staff. Many roles suit people with community services, social work or housing backgrounds."], spec: ["Homelessness services", "Housing support", "Family violence support", "Case management", "Community programs"], hq: "Melbourne, VIC", roles: ["Case worker", "Support worker", "Housing officer", "Family violence practitioner", "Program manager"] },
  "cohealth": communityHealthService("cohealth", "in Melbourne's inner north and west"),
  "IPC Health": communityHealthService("IPC Health", "in Melbourne's west"),
  "DPV Health": communityHealthService("DPV Health", "in Melbourne's north"),
  "West Wimmera Health Service": smallRuralHealth("West Wimmera Health Service", "in the West Wimmera region of western Victoria"),
  "East Wimmera Health Service": smallRuralHealth("East Wimmera Health Service", "in the East Wimmera region of north-west Victoria")
});
