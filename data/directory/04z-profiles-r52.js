/* ===================== Directory profiles, round 52: dairy, flour, poultry, egg and sugar processors, plant breeders, organics recycling =====================
   Uses foodMaker (round 13). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const poultryOrEggProducer = (name, what) => ({
  about: [
    `${name} is ${what}. It runs farms and processing plants, and supplies supermarkets, food service customers and other buyers.`,
    "It employs farm and shed workers, processing and packing staff, hatchery and feed mill staff, maintenance trades and engineers, drivers and logistics staff, quality and food safety staff, and sales and corporate staff. Many roles are on farms and in plants in regional areas, with shift work, and suit people with farming, food processing or trade backgrounds."
  ],
  spec: ["Poultry and egg production", "Food processing", "Farm operations", "Food safety", "Logistics"],
  roles: ["Farm worker", "Processing worker", "Maintenance trade", "Driver", "Quality assurance"]
});
const plantBreeder = (name, what) => ({
  about: [
    `${name} is ${what}. It breeds new varieties, tests them in trials across regions, and sells seed to farmers, retailers and other customers.`,
    "It employs plant breeders and research scientists, field trial and technical staff, agronomists and seed production staff, warehouse and processing staff, sales and customer service staff, and finance and administration staff. Many roles suit people with agriculture, plant science or genetics backgrounds, and some involve field work."
  ],
  spec: ["Plant breeding", "Field trials", "Seed production", "Agronomy", "Sales"],
  roles: ["Plant breeder", "Field technician", "Agronomist", "Seed production", "Sales"]
});
Object.assign(DIR_PROFILES, {
  "Burra Foods": foodMaker("Burra Foods", "an Australian dairy processor based in South Gippsland, Victoria, that makes milk powders, butter, cream and other dairy ingredients", "sourcing milk from dairy farms in Gippsland"),
  "Tamar Valley Dairy": foodMaker("Tamar Valley Dairy", "a Tasmanian dairy maker, based in the Tamar Valley, that makes yoghurt and other dairy products", ""),
  "Manildra Group": foodMaker("Manildra Group", "an Australian processor of wheat that makes flour, starch, gluten and other food and industrial products, with its main operations in New South Wales", ""),
  "Hazeldene's Chicken": poultryOrEggProducer("Hazeldene's Chicken", "a family-owned Victorian chicken producer that runs farms, hatcheries and a processing plant"),
  "Pace Farm": poultryOrEggProducer("Pace Farm", "an Australian egg producer that runs egg farms and grading and packing facilities"),
  "MSF Sugar": { about: ["MSF Sugar is a Queensland sugar miller. It crushes sugar cane from local growers at its mills near Cairns, and makes raw sugar and other products for domestic and export customers.", "It employs mill operators and process staff, maintenance trades and engineers, cane supply and agricultural staff, laboratory and quality staff, logistics and port staff, and finance and corporate staff. Many roles are at mills in Far North Queensland and have extra seasonal work during the crushing season."], spec: ["Sugar milling", "Process operations", "Maintenance", "Cane supply", "Logistics"], hq: "Cairns, QLD", roles: ["Mill operator", "Maintenance trade", "Laboratory staff", "Cane supply officer", "Logistics"] },
  "Seednet": plantBreeder("Seednet", "an Australian seed company, based in Victoria, that supplies pasture, forage, vegetable and other seed"),
  "InterGrain": plantBreeder("InterGrain", "a Western Australian plant breeding company that develops new wheat and barley varieties for grain growers"),
  "Repurpose It": { about: ["Repurpose It is a Queensland organics recycling company. It turns green waste, food waste and other organic materials into compost, soil and mulch products and sells them to farmers, landscapers and home gardeners.", "It employs plant and machinery operators, drivers, yard and production staff, laboratory and quality staff, sales and customer service staff, and finance and administration staff. Many roles are at sites in Queensland and suit people with machinery, driving or horticulture backgrounds."], spec: ["Organics recycling", "Compost and soil products", "Plant operations", "Logistics", "Sales"], roles: ["Plant operator", "Driver", "Yard staff", "Sales", "Quality"] }
});
