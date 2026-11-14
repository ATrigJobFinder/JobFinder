/* ===================== Directory profiles, round 26: appliances, furniture and beds, computer and electronics retailers, tyre and auto services, car, motorcycle and boat brands, a shipbuilder =====================
   Uses retailBrand (round 10), autoBrand (round 11) and makerArm (round 12). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const mattressMaker = (name, what) => ({
  about: [
    `${name} is ${what}. Its beds are sold through bedding and furniture retailers, online and in its own stores, and it supplies hotels and other businesses.`,
    "It employs factory and production staff, upholsterers and machine operators, product designers, warehouse and delivery staff, sales and account managers, retail and customer service staff, and marketing and corporate staff. Many roles are in factories and warehouses, and they suit people with manufacturing, trade or sales backgrounds."
  ],
  spec: ["Mattress and bed manufacturing", "Product design", "Retail and wholesale", "Distribution", "Customer service"],
  roles: ["Production worker", "Machine operator", "Delivery driver", "Sales", "Customer service"]
});
const electronicsRetailer = (name, what) => ({
  about: [
    `${name} is ${what}. It sells to hobbyists, businesses and schools through its stores and website, and its staff give advice on what to buy and how to use it.`,
    "It employs store and sales staff, technical advisers, warehouse and online order staff, buyers and category staff, customer service staff, and marketing and head office staff. Many roles suit people with technology, electronics or retail experience, and some roles need technical knowledge of computers or components."
  ],
  spec: ["Computers and electronics", "Retail sales", "Technical advice", "Online orders", "Customer service"],
  roles: ["Sales staff", "Technical adviser", "Warehouse", "Online orders", "Customer service"]
});
const boatBuilder = (name, what) => ({
  about: [
    `${name} is ${what}. It designs and builds boats in Australia and sells them through a network of boat dealers.`,
    "It employs boat builders and laminators, welders and fabricators, riggers and fitters, designers and engineers, quality staff, warehouse staff, sales and marketing staff, and finance and corporate staff. Many roles are in factories and suit people with trade or manufacturing backgrounds, and apprenticeships are a common way in."
  ],
  spec: ["Boat building", "Fabrication", "Design and engineering", "Dealer network", "Quality"],
  roles: ["Boat builder", "Welder", "Fitter", "Designer", "Quality"]
});
Object.assign(DIR_PROFILES, {
  "Dux Industries": makerArm("Dux Industries", "an Australian maker of hot water systems, including electric, gas and solar models", "sells through plumbers, merchants and builders and supports what it sells", ["Production worker", "Engineer", "Technical support", "Sales representative", "Warehouse"]),
  "Hisense Australia": makerArm("Hisense Australia", "the Australian arm of a global maker of televisions and home appliances", "sells through retailers and online and supports customers with service and warranty"),
  "Sleepmaker": mattressMaker("Sleepmaker", "an Australian maker of mattresses and beds"),
  "Sealy Australia": mattressMaker("Sealy Australia", "the Australian arm of a global mattress brand that makes and sells beds in Australia"),
  "Oz Design Furniture": retailBrand("Oz Design Furniture", "an Australian furniture retailer that sells lounges, dining, bedroom and other furniture"),
  "Coco Republic": retailBrand("Coco Republic", "an Australian furniture and interiors retailer that sells furniture, lighting, rugs and homewares, and offers interior design services"),
  "Centrecom": electronicsRetailer("Centrecom", "an Australian computer hardware retailer based in Melbourne that sells PC parts, laptops and accessories"),
  "PC Case Gear": electronicsRetailer("PC Case Gear", "an Australian computer parts retailer that sells PC components, peripherals and accessories"),
  "ACE Radio": electronicsRetailer("ACE Radio", "an Australian supplier of electronic components, tools and equipment"),
  "Radio Parts Group": electronicsRetailer("Radio Parts Group", "an Australian supplier of electronic components, tools and equipment"),
  "Bob Jane T-Marts": { about: ["Bob Jane T-Marts is an Australian tyre and car service chain. Its stores sell and fit tyres and wheels and carry out servicing, brakes, suspension and other mechanical work.", "It employs tyre fitters and mechanics, apprentices, service advisers and counter staff, store managers, sales and call centre staff, and warehouse, marketing and head office staff. Many roles are in stores and workshops, and apprenticeships are a common way in."], spec: ["Tyres and wheels", "Car servicing", "Apprenticeships", "Retail", "Customer service"], roles: ["Tyre fitter", "Mechanic", "Service adviser", "Store manager", "Sales"] },
  "Auto One": retailBrand("Auto One", "an Australian retailer of car parts, accessories and tools"),
  "Lube Mobile": { about: ["Lube Mobile is an Australian mobile car servicing business. Its vans travel to customers' homes and workplaces to do oil changes, servicing and some mechanical work, and the vans are run by franchise owners.", "It employs mobile mechanics and service technicians, franchise owners, customer service and booking staff, franchise support and field staff, and marketing and head office staff. Many people work in the field with a van, and trade qualifications and customer service skills are both useful."], spec: ["Mobile car servicing", "Franchising", "Customer service", "Fleet servicing", "Mechanical work"], roles: ["Mobile mechanic", "Franchise owner", "Customer service", "Franchise support", "Marketing"] },
  "Suzuki Australia": autoBrand("Suzuki Australia", "the Australian arm of Suzuki, selling small cars, SUVs, motorcycles and outboard motors"),
  "Yamaha Motor Australia": autoBrand("Yamaha Motor Australia", "the Australian arm of Yamaha, selling motorcycles, outboard motors, off-road vehicles and other products"),
  "MG Motor Australia": autoBrand("MG Motor Australia", "the Australian arm of the MG car brand, selling petrol, hybrid and electric cars and SUVs"),
  "Harley-Davidson Australia": autoBrand("Harley-Davidson Australia", "the Australian arm of the American motorcycle maker, selling motorcycles, parts and clothing through dealers"),
  "Quintrex": boatBuilder("Quintrex", "an Australian maker of aluminium boats"),
  "Stacer": boatBuilder("Stacer", "an Australian maker of aluminium fishing and leisure boats"),
  "Haines Hunter": boatBuilder("Haines Hunter", "an Australian maker of fibreglass boats"),
  "Incat Tasmania": { about: ["Incat Tasmania is a Hobart shipbuilder that designs and builds large, fast aluminium catamaran ferries and other vessels for passenger and vehicle ferry operators around the world.", "It employs naval architects and marine engineers, boilermakers, welders and fabricators, electricians, fitters and painters, project and production managers, procurement and quality staff, and finance and corporate staff. Many roles are at the shipyard on the Derwent River, and apprenticeships are a common way in."], spec: ["Shipbuilding", "Aluminium fabrication", "Naval architecture and engineering", "Marine fitting", "Project management"], hq: "Hobart, TAS", roles: ["Boilermaker", "Welder", "Marine engineer", "Electrician", "Project manager"] }
});
