/* ===================== Directory profiles, round 15: primary health networks, regional water businesses, catchment and natural resource bodies, rural research and forestry =====================
   Uses waterProfile (round 5). Two paragraphs each; anything that couldn't be confirmed is left out. */
const phnProfile = (name, region) => ({
  about: [
    `${name} is a primary health network, one of the independent not-for-profit organisations funded by the Australian Government to improve primary health care ${region}. It does not run clinics itself. It plans for local health needs, funds and commissions services such as mental health, alcohol and other drug, and chronic disease programs, and supports general practices and other providers.`,
    "It employs program and commissioning managers, mental health and primary care advisers, practice support and quality improvement staff, data and evaluation staff, engagement staff, and finance, communications and corporate staff. Many roles suit people with nursing, allied health, public health or health administration backgrounds."
  ],
  spec: ["Primary health care", "Commissioning of services", "Mental health programs", "General practice support", "Health planning"],
  roles: ["Program manager", "Practice support officer", "Mental health adviser", "Data analyst", "Engagement officer"]
});
const cmaProfile = (name, region, extra) => ({
  about: [
    `${name} is a regional body that looks after rivers, wetlands, land and native vegetation ${region}.${extra ? " " + extra : ""} It plans and funds on-ground projects, and works with landholders, farmers, councils, community groups and Traditional Owners.`,
    "It employs natural resource management and project officers, waterway and floodplain specialists, ecologists and scientists, community engagement and Landcare support staff, Aboriginal partnership staff, and finance and corporate staff. Many roles suit people with environmental science, agriculture or natural resource management backgrounds, and field work is common."
  ],
  spec: ["Waterways and floodplains", "Natural resource management", "Landholder programs", "Biodiversity", "Community engagement"],
  roles: ["Project officer", "Waterway specialist", "Ecologist", "Landcare coordinator", "Engagement officer"]
});
Object.assign(DIR_PROFILES, {
  "North Western Melbourne PHN": phnProfile("North Western Melbourne PHN", "in the north and west of Melbourne"),
  "South Eastern Melbourne PHN": phnProfile("South Eastern Melbourne PHN", "in the south-east of Melbourne"),
  "Gippsland PHN": phnProfile("Gippsland PHN", "across Gippsland in Victoria"),
  "South Western Sydney PHN": phnProfile("South Western Sydney PHN", "in the south-west of Sydney"),
  "Brisbane North PHN": phnProfile("Brisbane North PHN", "in the north of Brisbane and the Moreton Bay region"),
  "Northern Territory PHN": phnProfile("Northern Territory PHN", "across the Northern Territory"),
  "Capital Health Network": phnProfile("Capital Health Network", "in the Australian Capital Territory"),
  "Wannon Water": waterProfile("Wannon Water", "in south-west Victoria"),
  "Coliban Water": waterProfile("Coliban Water", "in central Victoria, including Bendigo"),
  "Lower Murray Water": waterProfile("Lower Murray Water", "in north-west Victoria, including Mildura and Swan Hill"),
  "Gippsland Water": waterProfile("Gippsland Water", "in Gippsland in Victoria"),
  "Westernport Water": waterProfile("Westernport Water", "on Phillip Island and the nearby Westernport coast in Victoria"),
  "East Gippsland Water": waterProfile("East Gippsland Water", "in East Gippsland in Victoria, including Bairnsdale"),
  "Riverina Water County Council": waterProfile("Riverina Water County Council", "in the Riverina region of New South Wales, including Wagga Wagga", "It is a county council, owned by the councils it serves."),
  "North Central Catchment Management Authority": cmaProfile("North Central Catchment Management Authority", "in north central Victoria, including the Loddon and Avoca river catchments"),
  "West Gippsland Catchment Management Authority": cmaProfile("West Gippsland Catchment Management Authority", "in West Gippsland in Victoria"),
  "North East Catchment Management Authority": cmaProfile("North East Catchment Management Authority", "in north-east Victoria, including the Ovens and Upper Murray catchments"),
  "East Gippsland Catchment Management Authority": cmaProfile("East Gippsland Catchment Management Authority", "in East Gippsland in Victoria"),
  "NRM South": { about: ["NRM South is the natural resource management body for southern Tasmania. It plans and funds projects that look after land, water, coasts and native plants and animals, and works with farmers, landholders, councils and community groups.", "It employs project and program officers, ecologists and scientists, agricultural and sustainable farming advisers, community engagement staff, Aboriginal partnership staff, and finance and corporate staff. Many roles suit people with environmental science, agriculture or natural resource management backgrounds, and some include field work."], spec: ["Natural resource management", "Biodiversity", "Sustainable agriculture", "Coastal and marine", "Community engagement"], hq: "Hobart, TAS", roles: ["Project officer", "Ecologist", "Agricultural adviser", "Engagement officer", "Program manager"] },
  "Local Land Services NSW": { about: ["Local Land Services is a New South Wales government agency that supports farmers and landholders. It delivers advice and services on livestock health and biosecurity, pest animals and weeds, natural resource management, agricultural production and emergency response, through regional offices across the state.", "It employs biosecurity and livestock officers, veterinarians, agricultural advisers, natural resource management and Aboriginal engagement staff, emergency response and administration staff, and corporate staff. Many roles are in regional and rural New South Wales and suit people with agriculture, veterinary, science or rural service backgrounds."], spec: ["Biosecurity", "Livestock health", "Agricultural advice", "Natural resource management", "Emergency response"], roles: ["Biosecurity officer", "District veterinarian", "Agricultural adviser", "Natural resource management", "Administration"] },
  "AgriFutures Australia": { about: ["AgriFutures Australia is a rural research and development body funded by levies and the Australian Government. It invests in research for emerging rural industries and new ideas to help rural industries and communities grow, and shares what it learns with farmers and industry.", "It employs research and program managers, scientists and analysts, grants and investment staff, communications and industry engagement staff, and finance and corporate staff. It suits people with agriculture, science, economics or policy backgrounds."], spec: ["Rural research", "Emerging industries", "Research funding", "Innovation", "Industry engagement"], roles: ["Program manager", "Research manager", "Analyst", "Communications", "Grants"] },
  "Sustainable Timbers Tasmania": { about: ["Sustainable Timbers Tasmania is the government business that manages Tasmania's public production forests. It plans harvesting and regrowth, runs roads and fire management, and sells timber and other forest products.", "It employs foresters and forest planners, harvest and operations staff, fire and conservation staff, mapping and technical staff, sales and marketing staff, and finance and corporate staff. Many roles are in regional Tasmania and suit people with forestry, science, trade or operations backgrounds."], spec: ["Forestry", "Forest planning", "Fire management", "Timber sales", "Operations"], hq: "Hobart, TAS", roles: ["Forester", "Operations staff", "Fire and conservation", "Mapping", "Sales"] }
});
