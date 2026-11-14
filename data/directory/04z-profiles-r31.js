/* ===================== Directory profiles, round 31: couriers, truck and trailer makers and suppliers, industrial gas =====================
   Uses makerArm (round 12). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const courierCompany = (name, what) => ({
  about: [
    `${name} is ${what}. It collects parcels and freight from businesses and customers, moves them through depots and delivers them to homes and workplaces.`,
    "It employs drivers and couriers, depot and sorting staff, forklift operators, dispatchers and operations managers, customer service staff, sales and account managers, and finance, technology and corporate staff. Many roles are shift work in depots and on the road, and a driver's licence or forklift licence is often needed."
  ],
  spec: ["Parcel and freight delivery", "Depot operations", "Driving", "Customer service", "Logistics"],
  roles: ["Driver", "Depot operator", "Dispatcher", "Customer service", "Account manager"]
});
const trailerMaker = (name, what) => ({
  about: [
    `${name} is ${what}. It designs and builds trailers in Australia and sells them to transport operators, farmers, builders and other customers through dealers and direct.`,
    "It employs welders and fabricators, boilermakers, painters and assemblers, designers and engineers, parts and warehouse staff, sales and service staff, and finance and corporate staff. Many roles are in factories and suit people with trade or manufacturing backgrounds, and apprenticeships are a common way in."
  ],
  spec: ["Trailer manufacturing", "Fabrication", "Design and engineering", "Parts and service", "Sales"],
  roles: ["Welder", "Boilermaker", "Assembler", "Designer", "Sales"]
});
Object.assign(DIR_PROFILES, {
  "Sendle": courierCompany("Sendle", "a Sydney-based parcel delivery company that works with small businesses and online sellers"),
  "Couriers Please": courierCompany("Couriers Please", "an Australian courier and parcel delivery company"),
  "Allied Express": courierCompany("Allied Express", "an Australian courier and freight company"),
  "Truckline": { about: ["Truckline is an Australian supplier of truck and trailer parts, equipment and accessories. It sells to transport operators, mechanics and trailer builders through its branches and online.", "It employs parts and branch staff, trade counter and sales staff, warehouse and delivery staff, buyers and category staff, e-commerce and customer service staff, and finance and head office staff. Many roles are in branches and warehouses and suit people with trade, parts or transport backgrounds."], spec: ["Truck and trailer parts", "Branch network", "Trade sales", "Warehousing", "Customer service"], roles: ["Parts interpreter", "Branch staff", "Warehouse", "Driver", "Sales"] },
  "Isuzu Australia": makerArm("Isuzu Australia", "the Australian arm of Isuzu, selling trucks and related products", "sells and supports its trucks through a dealer network to transport operators and businesses", ["Parts and service", "Sales representative", "Technical support", "Warehouse", "Customer service"]),
  "Krueger Transport Equipment": trailerMaker("Krueger Transport Equipment", "an Australian maker of heavy trailers and transport equipment"),
  "Barker Trailers": trailerMaker("Barker Trailers", "an Australian maker of trailers"),
  "Haulmark": trailerMaker("Haulmark", "an Australian maker of trailers"),
  "Tuff Trailers": trailerMaker("Tuff Trailers", "an Australian maker of trailers"),
  "Supagas": { about: ["Supagas is an Australian supplier of industrial gases, gas cylinders and welding supplies. It fills and delivers gas cylinders and sells gases and equipment to workshops, hospitals, hospitality venues and industry through branches and distributors.", "It employs drivers and delivery staff, cylinder filling plant operators, branch and counter staff, technical and safety staff, sales and account managers, and finance and corporate staff. Many roles are in plants and branches around the country, and a driver's licence and dangerous goods training are often needed."], spec: ["Industrial gases", "Cylinder filling and delivery", "Welding supplies", "Branch network", "Safety"], roles: ["Delivery driver", "Plant operator", "Branch staff", "Sales", "Technical support"] }
});
