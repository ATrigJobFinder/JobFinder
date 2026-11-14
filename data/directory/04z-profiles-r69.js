/* ===================== Directory profiles, round 69: fashion labels, footwear and sportswear retailers, a pearl farm =====================
   Uses retailBrand (round 10) and tourismAttraction (round 39). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
Object.assign(DIR_PROFILES, {
  "Scanlan Theodore": retailBrand("Scanlan Theodore", "an Australian women's fashion label that sells clothing and accessories"),
  "Carla Zampatti": retailBrand("Carla Zampatti", "an Australian women's fashion label that sells tailored clothing, eveningwear and accessories"),
  "Sir The Label": retailBrand("Sir The Label", "an Australian women's fashion label, started in Sydney, that sells clothing"),
  "Camilla and Marc": retailBrand("Camilla and Marc", "an Australian designer fashion label that sells clothing and accessories"),
  "Gorman": retailBrand("Gorman", "an Australian fashion and homewares label, based in Melbourne, known for its colourful prints"),
  "Kloke": retailBrand("Kloke", "a Melbourne fashion label that sells clothing and accessories"),
  "Just Group": { about: ["Just Group is an Australian fashion retail group whose brands include Just Jeans, Jay Jays, Portmans, Dotti and Jacqui E. Its stores and online shops sell clothing and accessories for women, men and teenagers.", "It employs store team members and managers, area managers, buyers, designers and merchandise planners, distribution and online fulfilment staff, and marketing, technology and head office staff. Most roles are in stores, and many people start in casual or part-time sales roles."], spec: ["Fashion retail", "Store operations", "Buying and merchandise", "Online and distribution", "Customer service"], roles: ["Store team member", "Store manager", "Area manager", "Buyer", "Distribution"] },
  "Rockwear": retailBrand("Rockwear", "an Australian activewear retailer that sells women's activewear and fitness clothing"),
  "Betts Shoes": retailBrand("Betts Shoes", "an Australian footwear retailer that sells shoes and accessories for women, men and children"),
  "Zomp Shoes": retailBrand("Zomp Shoes", "an Australian footwear retailer that sells shoes, boots and accessories"),
  "The Athlete's Foot Australia": retailBrand("The Athlete's Foot Australia", "the Australian arm of an international athletic footwear retailer, with stores run by franchise owners"),
  "Willie Creek Pearls": tourismAttraction("Willie Creek Pearls", "a pearl farm near Broome that runs tours, grows South Sea pearls and sells pearl jewellery", "in the Kimberley region of Western Australia")
});
