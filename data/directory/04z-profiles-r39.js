/* ===================== Directory profiles, round 39: tourism attractions, island resorts, reef and ferry operators, a market, a museum and a stadium =====================
   Uses venueProfile (round 8). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const tourismAttraction = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. It welcomes visitors, runs tours, activities and events, and sells tickets, food and souvenirs.`,
    "It employs guest services and ticketing staff, guides and presenters, operations and maintenance staff, food and beverage and retail staff, events and sales staff, marketing and administration staff, and managers. Many roles are casual or seasonal, with weekend and school holiday shifts, and they suit people starting a career in tourism, hospitality or events."
  ],
  spec: ["Visitor attraction", "Guest services", "Tours and activities", "Events", "Food and retail"],
  roles: ["Guest services", "Guide", "Operations", "Food and beverage", "Events"]
});
const islandResort = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. It offers accommodation, restaurants and bars, tours and activities, and the staff who run it often live on site.`,
    "It employs front office and housekeeping staff, chefs and kitchen staff, restaurant and bar staff, activities and watersports staff, maintenance and grounds staff, boat and transfer crew, and management and administration staff. Many roles are seasonal or fixed-term, with staff accommodation often provided, and they suit people who want to live and work in a tourist destination."
  ],
  spec: ["Resort hospitality", "Accommodation", "Food and beverage", "Activities and tours", "Staff accommodation"],
  roles: ["Housekeeper", "Chef", "Bar and restaurant staff", "Activities staff", "Front office"]
});
Object.assign(DIR_PROFILES, {
  "Luna Park Melbourne": tourismAttraction("Luna Park Melbourne", "a historic amusement park in St Kilda that runs rides, games and events", "on the Melbourne bayside"),
  "Sovereign Hill": tourismAttraction("Sovereign Hill", "an outdoor museum in Ballarat that recreates the town's gold rush days, with costumed staff, a working gold mine, shops and workshops", "in regional Victoria"),
  "Phillip Island Nature Parks": tourismAttraction("Phillip Island Nature Parks", "the Victorian Government body that manages the nature parks and wildlife attractions on Phillip Island, including the Penguin Parade", "in Victoria"),
  "Queen Victoria Market": tourismAttraction("Queen Victoria Market", "a large open-air market in central Melbourne with fresh food, general goods, events and night markets", ""),
  "Heide Museum of Modern Art": { about: ["Heide Museum of Modern Art is an art museum in Bulleen, Melbourne, set in gardens and historic houses that were once the home of art patrons. It shows modern and contemporary art, holds a collection and runs education and public programs.", "It employs curators and collection staff, exhibition and installation staff, education and public programs staff, visitor services, retail and cafe staff, gardeners, marketing and development staff, and finance and administration staff. Jobs are few and popular, and visitor services is a common way in."], spec: ["Art collection", "Exhibitions", "Education and public programs", "Visitor services", "Gardens"], hq: "Melbourne, VIC", roles: ["Curator", "Visitor services", "Education officer", "Gardener", "Marketing"] },
  "Quicksilver Group": tourismAttraction("Quicksilver Group", "a Tropical North Queensland tourism operator that runs reef cruises, island trips and other tours from Port Douglas and Cairns", "in far north Queensland"),
  "Sunlover Reef Cruises": tourismAttraction("Sunlover Reef Cruises", "a Cairns operator of Great Barrier Reef day cruises, with snorkelling, diving and a pontoon at the reef", "in Tropical North Queensland"),
  "Fitzroy Island Resort": islandResort("Fitzroy Island Resort", "a resort on Fitzroy Island, off Cairns", "in Tropical North Queensland"),
  "Daydream Island": islandResort("Daydream Island", "a resort island in the Whitsundays", "off the Queensland coast"),
  "Hamilton Island": islandResort("Hamilton Island", "a large island resort in the Whitsundays, with hotels, restaurants, shops, a marina and an airport", "off the Queensland coast"),
  "Voyages Indigenous Tourism Australia": { about: ["Voyages Indigenous Tourism Australia runs Ayers Rock Resort at Yulara in the Northern Territory, next to Uluru-Kata Tjuta National Park. It operates hotels, campgrounds, restaurants, tours and experiences, and is owned by the Indigenous Land and Sea Corporation.", "It employs hotel, housekeeping and front office staff, chefs and kitchen staff, restaurant and bar staff, tour guides and cultural experience staff, maintenance and utilities staff, and management and administration staff. Many roles are live-in at Yulara with staff accommodation, and the company runs training and employment programs for Indigenous Australians."], spec: ["Resort hospitality", "Indigenous tourism", "Tours and experiences", "Training and employment", "Staff accommodation"], hq: "Yulara, NT", roles: ["Housekeeper", "Chef", "Tour guide", "Restaurant and bar staff", "Front office"] },
  "Rottnest Express": tourismAttraction("Rottnest Express", "a ferry operator that takes passengers from Perth, Fremantle and Hillarys to Rottnest Island and runs tours", "in Western Australia"),
  "Manly Fast Ferry": { about: ["Manly Fast Ferry is a ferry operator that runs fast passenger services between Circular Quay in Sydney and Manly.", "It employs vessel masters and deckhands, marine engineers, ticketing and customer service staff, operations and maintenance staff, and administration and management staff. Marine roles need maritime qualifications, and deckhand and customer service roles are common ways in."], spec: ["Passenger ferries", "Marine operations", "Customer service", "Maintenance", "Safety"], hq: "Sydney, NSW", roles: ["Deckhand", "Master", "Marine engineer", "Customer service", "Operations"] },
  "HBF Park": venueProfile("HBF Park", "a rectangular sports stadium", "Perth", "football and rugby matches, concerts and other events")
});
