/* ===================== Directory profiles, round 27: restaurant, takeaway and dessert chains, coffee roasters, craft brewers and distillers =====================
   Uses franchiseCafe (round 13). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const restaurantChain = (name, what) => ({
  about: [
    `${name} is ${what}. Its outlets are run by company staff and franchise owners, and the head office supports them with menus, training, marketing and supply.`,
    "It employs crew members and cooks, shift supervisors and restaurant or store managers, delivery drivers, area and franchise support staff, supply chain and product staff, and marketing, technology and head office staff. Many roles are part-time or casual, with evening and weekend shifts, and they suit people starting out in hospitality or customer service."
  ],
  spec: ["Restaurants and takeaway", "Food and beverage", "Customer service", "Store operations", "Franchising"],
  roles: ["Crew member", "Cook", "Shift supervisor", "Store manager", "Delivery driver"]
});
const coffeeRoaster = (name, what) => ({
  about: [
    `${name} is ${what}. It roasts coffee beans, sells them to cafes, offices and home customers, and trains the people who make the coffee.`,
    "It employs roasters and production staff, baristas and cafe staff, trainers and technicians, sales and account managers, warehouse and delivery staff, and marketing, online and finance staff. Many people start as baristas or in cafe roles, and barista experience is valued across the business."
  ],
  spec: ["Coffee roasting", "Barista training", "Cafes", "Wholesale", "Online sales"],
  roles: ["Barista", "Roaster", "Trainer", "Account manager", "Warehouse"]
});
const craftProducer = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. It makes its products on site, sells them in bottle shops, bars and online, and runs a venue where visitors can taste and buy.`,
    "It employs brewers or distillers and production staff, packaging and warehouse staff, bar, kitchen and venue staff, sales and marketing staff, and finance and administration staff. Many roles are casual or part-time and suit people with hospitality, production or sales experience, and staff who serve alcohol need the responsible service qualifications for their state."
  ],
  spec: ["Craft brewing and distilling", "Production", "Venue and hospitality", "Sales and marketing", "Packaging"],
  roles: ["Brewer or distiller", "Production staff", "Bar staff", "Sales", "Venue staff"]
});
Object.assign(DIR_PROFILES, {
  "Chicken Treat": restaurantChain("Chicken Treat", "an Australian fried chicken takeaway chain with stores mainly in Queensland and northern New South Wales"),
  "Pizza Hut Australia": restaurantChain("Pizza Hut Australia", "the Australian arm of the global pizza chain, which sells pizzas and sides for delivery, takeaway and dine-in"),
  "Eagle Boys": restaurantChain("Eagle Boys", "an Australian pizza chain that sells pizzas and sides for delivery and takeaway"),
  "Sushi Sushi": restaurantChain("Sushi Sushi", "an Australian sushi takeaway chain"),
  "Mad Mex": restaurantChain("Mad Mex", "an Australian Mexican restaurant chain that sells burritos, tacos and other dishes"),
  "Hog's Breath Cafe": restaurantChain("Hog's Breath Cafe", "an Australian steakhouse restaurant chain that serves steaks, ribs and other meals"),
  "Chargrill Charlie's": restaurantChain("Chargrill Charlie's", "an Australian charcoal chicken restaurant chain"),
  "Betty's Burgers": restaurantChain("Betty's Burgers", "an Australian burger restaurant chain"),
  "Pancake Parlour": restaurantChain("Pancake Parlour", "an Australian restaurant chain that serves pancakes, breakfasts and desserts"),
  "Sumo Salad": restaurantChain("Sumo Salad", "an Australian chain that sells salads, wraps and other healthy fast food"),
  "Beefy's Pies": restaurantChain("Beefy's Pies", "an Australian pie takeaway chain"),
  "The Coffee Club": franchiseCafe("The Coffee Club", "an Australian cafe chain that serves coffee, breakfast and meals in cafes around the country"),
  "Dôme Coffees": franchiseCafe("Dôme Coffees", "an Australian cafe chain, started in Western Australia, that serves coffee, breakfast and light meals"),
  "Gelatissimo": franchiseCafe("Gelatissimo", "an Australian gelato chain that sells gelato, coffee and desserts in its stores"),
  "Krispy Kreme Australia": restaurantChain("Krispy Kreme Australia", "the Australian arm of the global doughnut brand, selling doughnuts and coffee from stores and through supermarkets and online"),
  "Max Brenner Australia": restaurantChain("Max Brenner Australia", "the Australian arm of a chocolate restaurant and cafe brand that sells chocolate desserts, hot chocolates and meals"),
  "San Churro": restaurantChain("San Churro", "an Australian chain of chocolate cafes that sells churros, hot chocolate and desserts"),
  "Cold Rock": franchiseCafe("Cold Rock", "an Australian ice cream chain that makes ice cream mixed with toppings in its stores"),
  "Baskin Robbins Australia": franchiseCafe("Baskin Robbins Australia", "the Australian arm of a global ice cream brand that sells ice cream, cakes and desserts in its stores"),
  "Rockpool Dining Group": { about: ["Rockpool Dining Group is an Australian restaurant group that runs restaurants and bars, and offers private dining and catering.", "It employs chefs and cooks, waiters and bar staff, restaurant and venue managers, sommeliers, events and functions staff, and marketing, finance and head office staff. Many roles are in kitchens and front of house, with evening and weekend shifts, and apprenticeships and traineeships are a common way in."], spec: ["Restaurants and bars", "Fine dining", "Functions and catering", "Cooking", "Front of house"], roles: ["Chef", "Cook", "Waiter", "Bar staff", "Restaurant manager"] },
  "Esquire Group": { about: ["Esquire Group is an Australian restaurant and hospitality group, based in Queensland, that runs restaurants and bars and offers private dining.", "It employs chefs and cooks, waiters and bar staff, restaurant managers, sommeliers, functions and events staff, and marketing and head office staff. Many roles are in kitchens and front of house, with evening and weekend shifts, and apprenticeships and traineeships are a common way in."], spec: ["Restaurants and bars", "Fine dining", "Functions and events", "Cooking", "Front of house"], hq: "Brisbane, QLD", roles: ["Chef", "Cook", "Waiter", "Bar staff", "Restaurant manager"] },
  "Proud Mary Coffee": coffeeRoaster("Proud Mary Coffee", "a Melbourne coffee roaster and cafe group"),
  "Seven Seeds": coffeeRoaster("Seven Seeds", "a Melbourne coffee roaster and cafe"),
  "Campos Coffee": coffeeRoaster("Campos Coffee", "an Australian coffee roaster, started in Sydney, that runs cafes and sells coffee to businesses and home customers"),
  "Veneziano Coffee": coffeeRoaster("Veneziano Coffee", "a Melbourne coffee roaster"),
  "Lark Distillery": craftProducer("Lark Distillery", "a Tasmanian whisky distillery", "based in Hobart"),
  "Starward Whisky": craftProducer("Starward Whisky", "a Melbourne whisky distillery"),
  "Balter Brewing": craftProducer("Balter Brewing", "an Australian craft brewery on the Gold Coast"),
  "Mountain Goat Beer": craftProducer("Mountain Goat Beer", "a Melbourne craft brewery"),
  "Gage Roads Brewing": craftProducer("Gage Roads Brewing", "a Western Australian craft brewery"),
  "Poachers Pantry": { about: ["Poachers Pantry is a smokehouse, cellar door and restaurant near Murrumbateman, in the Canberra region of New South Wales. It makes smoked meats, cheese and other foods, sells wine, and offers accommodation and functions.", "It employs smokehouse and production staff, chefs and kitchen staff, restaurant and cellar door staff, accommodation and housekeeping staff, events and functions staff, and marketing and administration staff. Many roles are casual or part-time and suit people with hospitality or food production experience."], spec: ["Smokehouse and food production", "Cellar door", "Restaurant", "Accommodation", "Functions"], roles: ["Chef", "Kitchen hand", "Cellar door staff", "Housekeeper", "Functions staff"] }
});
