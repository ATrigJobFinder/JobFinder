/* ===================== Directory profiles, round 38: energy retailers, solar and internet providers =====================
   Uses solarCompany (round 12). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const energyRetailer = (name, what) => ({
  about: [
    `${name} is ${what}. It signs up homes and businesses, bills them for the energy they use, and supports them with customer service, hardship help and energy products.`,
    "It employs customer service and contact centre staff, sales and marketing staff, billing, credit and collections staff, energy market and pricing analysts, software and data staff, and finance, risk and corporate staff. Many roles suit people with customer service, finance or technology backgrounds, and some teams work in a hybrid or remote way."
  ],
  spec: ["Energy retail", "Customer service", "Billing", "Energy pricing", "Digital products"],
  roles: ["Customer service", "Billing officer", "Energy analyst", "Marketing", "Software engineer"]
});
const internetProvider = (name, what) => ({
  about: [
    `${name} is ${what}. It sells plans to homes and businesses, supports customers with set-up and faults, and buys network capacity from network owners.`,
    "It employs customer support and technical support staff, sales and marketing staff, network and systems engineers, billing and operations staff, software and data staff, and finance and corporate staff. Many roles are in contact centres and suit people with customer service or technology backgrounds."
  ],
  spec: ["Internet services", "Customer and technical support", "Networks", "Sales and marketing", "Operations"],
  roles: ["Customer support", "Technical support", "Network engineer", "Sales", "Operations"]
});
Object.assign(DIR_PROFILES, {
  "Amber Electric": energyRetailer("Amber Electric", "an Australian electricity retailer, started in Melbourne, that passes through wholesale electricity prices to customers and uses an app to help them use and sell energy at the right times"),
  "GloBird Energy": energyRetailer("GloBird Energy", "an Australian electricity and gas retailer that sells to homes and small businesses"),
  "Natural Solar": solarCompany("Natural Solar", "an Australian solar and battery installer that sells and installs solar panels, batteries and related equipment", "sells, installs and services solar and battery systems for homes and businesses"),
  "Tindo Solar": { about: ["Tindo Solar is an Australian maker of solar panels, based in Adelaide. It designs and makes panels in South Australia and sells them through installers and distributors.", "It employs production and factory staff, engineers and technicians, quality and testing staff, supply chain and warehouse staff, sales and technical support staff, and finance and administration staff. It suits people with manufacturing, electrical, engineering or renewable energy backgrounds."], spec: ["Solar panel manufacturing", "Engineering", "Quality and testing", "Distribution", "Renewable energy"], hq: "Adelaide, SA", roles: ["Production worker", "Engineer", "Technician", "Quality", "Sales"] },
  "Harbour ISP": internetProvider("Harbour ISP", "an Australian internet service provider that sells NBN and fibre internet plans to homes and businesses"),
  "Activ8me": internetProvider("Activ8me", "an Australian internet service provider that sells satellite and other broadband plans, including to people in rural and regional areas")
});
