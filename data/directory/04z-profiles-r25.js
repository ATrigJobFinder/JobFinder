/* ===================== Directory profiles, round 25: Aboriginal community-controlled health services, co-operatives, local land councils and a shire council =====================
   Uses accho (round 10). Two paragraphs each; anything that couldn't be confirmed is left out. */
const aboriginalCommunityOrg = (name, where, what) => ({
  about: [
    `${name} is an Aboriginal community-controlled organisation ${where}. It ${what || "provides community, family, housing, employment and cultural services run by and for Aboriginal people"}.`,
    "It employs community and family support workers, case workers, youth and elder support staff, cultural and heritage staff, housing and employment staff, and administration, finance and management staff. Roles value cultural knowledge and community connection, and Aboriginal and Torres Strait Islander applicants are often encouraged to apply."
  ],
  spec: ["Community services", "Family and youth support", "Culture and heritage", "Housing and employment", "Administration"],
  roles: ["Community worker", "Family support worker", "Case worker", "Cultural officer", "Administration"]
});
const lalcProfile = (name, where, hq) => ({
  about: [
    `${name} is a Local Aboriginal Land Council, set up under the New South Wales Aboriginal Land Rights Act, ${where}. It looks after the land and interests of its Aboriginal members, manages land and property, and runs cultural, community and economic development programs.`,
    "It employs community and cultural heritage staff, land and property managers, project and business staff, housing and community services staff, rangers and field staff where it runs land programs, and administration, finance and management staff. Roles value cultural knowledge and community connection, and Aboriginal and Torres Strait Islander applicants are often encouraged to apply."
  ],
  spec: ["Land and property", "Cultural heritage", "Community development", "Economic development", "Administration"],
  hq, roles: ["Community officer", "Land and property officer", "Cultural heritage officer", "Project officer", "Administration"]
});
Object.assign(DIR_PROFILES, {
  "Armajun Aboriginal Health Service": accho("Armajun Aboriginal Health Service", "Aboriginal and Torres Strait Islander people in Inverell and the surrounding region of northern New South Wales", "", "Inverell, NSW"),
  "Katungul Aboriginal Corporation": accho("Katungul Aboriginal Corporation", "Aboriginal and Torres Strait Islander people on the far south coast of New South Wales", "", "Narooma, NSW"),
  "Mallee District Aboriginal Services": accho("Mallee District Aboriginal Services", "Aboriginal and Torres Strait Islander people in Mildura and the surrounding Mallee region of Victoria", "", "Mildura, VIC"),
  "Njernda Aboriginal Corporation": accho("Njernda Aboriginal Corporation", "Aboriginal and Torres Strait Islander people in Echuca and the surrounding region of northern Victoria", "", "Echuca, VIC"),
  "Wathaurong Aboriginal Co-operative": accho("Wathaurong Aboriginal Co-operative", "Aboriginal and Torres Strait Islander people in Geelong and the surrounding region of Victoria", "and also family, community and cultural programs", "Geelong, VIC"),
  "Moogji Aboriginal Council": accho("Moogji Aboriginal Council", "Aboriginal and Torres Strait Islander people in Orbost and the surrounding region of East Gippsland in Victoria", "", "Orbost, VIC"),
  "Rumbalara Aboriginal Co-operative": accho("Rumbalara Aboriginal Co-operative", "Aboriginal and Torres Strait Islander people in Shepparton and the surrounding region of northern Victoria", "and also family, housing and community programs", "Shepparton, VIC"),
  "Winda-Mara Aboriginal Corporation": aboriginalCommunityOrg("Winda-Mara Aboriginal Corporation", "in Heywood and the surrounding region of south-west Victoria"),
  "Gunditjmara Aboriginal Cooperative": aboriginalCommunityOrg("Gunditjmara Aboriginal Cooperative", "in Warrnambool and the surrounding region of south-west Victoria"),
  "Karadi Aboriginal Corporation": aboriginalCommunityOrg("Karadi Aboriginal Corporation", "in Tasmania"),
  "Gandangara Local Aboriginal Land Council": lalcProfile("Gandangara Local Aboriginal Land Council", "in south-western Sydney and surrounding areas", "Liverpool, NSW"),
  "La Perouse Local Aboriginal Land Council": lalcProfile("La Perouse Local Aboriginal Land Council", "in the La Perouse area of Sydney", "La Perouse, NSW"),
  "Darkinjung Local Aboriginal Land Council": lalcProfile("Darkinjung Local Aboriginal Land Council", "on the Central Coast of New South Wales", "Wyong, NSW"),
  "Yarrabah Aboriginal Shire Council": { about: ["Yarrabah Aboriginal Shire Council is the local government for the Yarrabah community near Cairns in Far North Queensland. It provides roads, water, waste, community services, housing and other services, and supports local jobs and training.", "It employs works and maintenance crews, water and sewerage operators, community services and housing staff, rangers, administration and finance staff, and management staff. Many roles are in the community and suit local people, and Aboriginal and Torres Strait Islander applicants are often encouraged to apply."], spec: ["Local government services", "Works and maintenance", "Community services", "Housing", "Administration"], hq: "Yarrabah, QLD", roles: ["Works crew", "Community services", "Housing officer", "Ranger", "Administration"] }
});
