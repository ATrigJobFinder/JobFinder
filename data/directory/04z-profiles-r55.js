/* ===================== Directory profiles, round 55: homewares, surf, gaming and electrical retailers, car hire, caravan and camper makers =====================
   Uses retailBrand (round 10). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const caravanMaker = (name, what) => ({
  about: [
    `${name} is ${what}. It designs and builds vehicles in Australia and sells them through dealers and direct to customers, with after-sales service and warranty support.`,
    "It employs production staff such as assemblers, carpenters, electricians, fitters and welders, designers and engineers, quality and warranty staff, sales and customer service staff, parts and warehouse staff, and finance and corporate staff. Many roles are in factories and suit people with trade or manufacturing backgrounds, and apprenticeships are a common way in."
  ],
  spec: ["Caravan and camper manufacturing", "Production", "Design and engineering", "Warranty and service", "Sales"],
  roles: ["Production worker", "Tradesperson", "Designer", "Warranty and service", "Sales"]
});
Object.assign(DIR_PROFILES, {
  "Dusk": retailBrand("Dusk", "an Australian retailer of candles, fragrance, diffusers and homewares"),
  "City Beach": retailBrand("City Beach", "an Australian surf, skate and street fashion retailer, which started in Western Australia"),
  "Gametraders": retailBrand("Gametraders", "an Australian video game retailer, run through a network of franchise stores, that buys, sells and trades games and consoles"),
  "Betta Electrical": retailBrand("Betta Electrical", "an Australian home appliance and electrical retailer, run through a network of independently owned stores"),
  "Cash Converters": { about: ["Cash Converters is a retailer of second-hand goods in Australia. Its stores, many run by franchise owners, buy and sell used electronics, jewellery, tools and other items, and also offer personal loans.", "It employs store team members and managers, buyers and valuers, franchise support and field staff, finance and credit staff, e-commerce and customer service staff, and head office staff. Many roles are in stores, and valuing second-hand goods is learned on the job."], spec: ["Second-hand retail", "Buying and valuing goods", "Franchising", "Personal finance", "Customer service"], roles: ["Store team member", "Buyer", "Store manager", "Franchise support", "Customer service"] },
  "East Coast Car Rentals": { about: ["East Coast Car Rentals is an Australian car hire company that rents cars, vans and four-wheel drives from branches around the country, mostly near airports.", "It employs rental agents and branch managers, vehicle preparation and fleet staff, drivers, reservations and customer service staff, and sales, marketing and head office staff. Many roles are at airport branches with shifts across the week, and they suit people with customer service or sales experience."], spec: ["Car rental", "Customer service", "Fleet management", "Airport operations", "Reservations"], roles: ["Rental agent", "Branch manager", "Fleet and vehicle preparation", "Reservations", "Driver"] },
  "Kokoda Caravans": caravanMaker("Kokoda Caravans", "an Australian maker of off-road caravans"),
  "Patriot Campers": caravanMaker("Patriot Campers", "an Australian maker of off-road campers and camper trailers"),
  "Evernew Caravans": caravanMaker("Evernew Caravans", "an Australian caravan maker")
});
