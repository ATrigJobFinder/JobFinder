/* ===================== Directory profiles, round 68: fast-casual restaurant chains, bubble tea, coffee and bakery brands =====================
   Uses restaurantChain and franchiseCafe (round 27) and retailBrand (round 10). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
Object.assign(DIR_PROFILES, {
  "Schnitz": restaurantChain("Schnitz", "an Australian fast-food chain that sells schnitzel burgers, wraps and salads"),
  "Roll'd": restaurantChain("Roll'd", "an Australian chain that sells Vietnamese rice paper rolls, banh mi and noodle dishes"),
  "Zeus Street Greek": restaurantChain("Zeus Street Greek", "an Australian chain that sells Greek street food such as souvlaki and gyros"),
  "Taco Bill": restaurantChain("Taco Bill", "an Australian Mexican fast-food chain that sells tacos, burritos and nachos"),
  "Oliver's Real Food": restaurantChain("Oliver's Real Food", "an Australian chain of roadside restaurants that sell healthier fast food, mostly beside highways"),
  "Lone Star Rib House": restaurantChain("Lone Star Rib House", "an Australian chain of American-style restaurants that serve ribs, steaks and burgers"),
  "El Jannah": restaurantChain("El Jannah", "a Sydney chain that sells Lebanese charcoal chicken and related dishes"),
  "Chatime Australia": franchiseCafe("Chatime Australia", "the Australian arm of a bubble tea chain that sells tea drinks, smoothies and snacks in its stores"),
  "Sharetea Australia": franchiseCafe("Sharetea Australia", "the Australian arm of a bubble tea chain that sells tea drinks and snacks in its stores"),
  "Bean Hunter": franchiseCafe("Bean Hunter", "an Australian cafe franchise that serves coffee, breakfast and light meals"),
  "Tim Hortons Australia": franchiseCafe("Tim Hortons Australia", "the Australian arm of a Canadian coffee and doughnut chain"),
  "Koko Black": retailBrand("Koko Black", "a Melbourne chocolate maker and retailer that sells chocolates, gifts and desserts in its stores and cafes"),
  "Lune Croissanterie": { about: ["Lune Croissanterie is a Melbourne bakery known for its croissants and pastries. It runs bakeries and cafes where customers queue for freshly baked pastries and coffee, and also sells online and through wholesale.", "It employs bakers and pastry cooks, baristas and front of house staff, production and packing staff, store managers, wholesale and logistics staff, and marketing and head office staff. Many roles start early in the morning, and baking and hospitality apprenticeships are a common way in."], spec: ["Pastry and baking", "Bakery and cafe", "Production", "Wholesale", "Customer service"], hq: "Melbourne, VIC", roles: ["Pastry cook", "Baker", "Barista", "Front of house", "Store manager"] }
});
