/* ===================== Directory profiles, round 23: food and meat processors, an electricity retailer, Aboriginal health services =====================
   Uses foodMaker (round 13) and accho (round 10). Two paragraphs each; anything that couldn't be confirmed is left out. */
const meatProcessor = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. It buys livestock from farmers, processes it at its plant and sells the meat to supermarkets, food service customers and export markets.`,
    "It employs butchers, boners and slicers, processing and packing staff, quality assurance and food safety staff, maintenance trades and engineers, livestock buyers, drivers, logistics and sales staff, and finance and corporate staff. Many roles are at plants in regional areas, with shift work, and apprenticeships and trade qualifications are a common way in."
  ],
  spec: ["Meat processing", "Livestock buying", "Food safety", "Export", "Maintenance"],
  roles: ["Butcher", "Production worker", "Quality assurance", "Maintenance trade", "Livestock buyer"]
});
Object.assign(DIR_PROFILES, {
  "Beerenberg Farm": { about: ["Beerenberg Farm is a family-owned South Australian food maker based at Hahndorf in the Adelaide Hills. It makes jams, sauces, chutneys and other products, grown partly on its own farm, and sells them through supermarkets, its farm shop and online.", "It employs production and kitchen staff, farm and seasonal pickers, packing and warehouse staff, farm shop and cafe staff, sales and marketing staff, and finance and administration staff. Many roles are in the Adelaide Hills, with extra seasonal work in summer."], spec: ["Food manufacturing", "Farming", "Retail and farm shop", "Sales and marketing", "Seasonal work"], hq: "Hahndorf, SA", roles: ["Production worker", "Farm worker", "Farm shop staff", "Packing", "Sales"] },
  "Thomas Foods International": meatProcessor("Thomas Foods International", "an Australian family-owned meat processor that processes lamb, beef and mutton at plants in South Australia and other states", "with exports to many countries"),
  "Kilcoy Global Foods": meatProcessor("Kilcoy Global Foods", "a beef processor based at Kilcoy in south-east Queensland", "with exports to many countries"),
  "Bulla Dairy Foods": foodMaker("Bulla Dairy Foods", "an Australian dairy foods maker, based at Colac in Victoria, that makes cream, ice cream, cheese and other dairy products", "sourcing milk from dairy farmers in south-west Victoria"),
  "Aurora Energy": { about: ["Aurora Energy is a Tasmanian electricity retailer that sells power to homes and businesses across the state. It handles billing, customer service, hardship support and energy products.", "It employs customer service and contact centre staff, retail and sales staff, billing and credit staff, energy and pricing analysts, technology and data staff, and finance, risk and corporate staff. Many roles are in Hobart and suit people with customer service, finance or technology backgrounds."], spec: ["Electricity retail", "Customer service", "Billing", "Energy products", "Hardship support"], hq: "Hobart, TAS", roles: ["Customer service", "Billing officer", "Analyst", "Sales", "Technology"] },
  "Nganampa Health Council": accho("Nganampa Health Council", "Anangu people in the Anangu Pitjantjatjara Yankunytjatjara (APY) Lands in the north-west of South Australia", "including public health and environmental health programs in remote communities", "Alice Springs, NT"),
  "Sunrise Health Service": accho("Sunrise Health Service", "Aboriginal people in remote communities of the Northern Territory", "", "Katherine, NT"),
  "Institute for Urban Indigenous Health": accho("The Institute for Urban Indigenous Health", "Aboriginal and Torres Strait Islander people in South East Queensland", "", "Brisbane, QLD"),
  "Charleville and Western Areas Aboriginal and Torres Strait Islander Community Health": accho("Charleville and Western Areas Aboriginal and Torres Strait Islander Community Health (CWAATSICH)", "Aboriginal and Torres Strait Islander people in Charleville and the surrounding region of south-west Queensland", "", "Charleville, QLD"),
  "Gurriny Yealamucka Health Service": accho("Gurriny Yealamucka Health Service", "the Yarrabah community near Cairns in Far North Queensland", "", "Yarrabah, QLD")
});
