/* ===================== Directory profiles, round 49: craft brewers and distillers, wineries =====================
   Uses craftProducer (round 27) and winery (round 28). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
Object.assign(DIR_PROFILES, {
  "Brouhaha Brewery": craftProducer("Brouhaha Brewery", "a Queensland craft brewery", "in Maleny, on the Sunshine Coast hinterland"),
  "Grifter Brewing": craftProducer("Grifter Brewing", "a Sydney craft brewery", ""),
  "Wayward Brewing": craftProducer("Wayward Brewing", "a Sydney craft brewery", ""),
  "Stomping Ground Brewing": craftProducer("Stomping Ground Brewing", "a Melbourne craft brewery", "with beer halls in the city"),
  "Heaps Normal": { about: ["Heaps Normal is an Australian brewer of non-alcoholic craft beer, started in Melbourne. Its beer is sold in bottle shops, supermarkets, bars and online.", "It employs brewers and production staff, packaging and warehouse staff, sales and account staff, marketing and brand staff, e-commerce and customer service staff, and finance and administration staff. It suits people with brewing, drinks sales, marketing or e-commerce backgrounds."], spec: ["Non-alcoholic brewing", "Production", "Sales and distribution", "Brand marketing", "E-commerce"], hq: "Melbourne, VIC", roles: ["Brewer", "Production staff", "Sales", "Marketing", "Customer service"] },
  "Prancing Pony Brewery": craftProducer("Prancing Pony Brewery", "an Adelaide Hills craft brewery", "at Mount Barker"),
  "Manly Spirits": craftProducer("Manly Spirits", "a Sydney craft distillery that makes gin and other spirits", "on the northern beaches"),
  "Rochford Wines": winery("Rochford Wines", "the Yarra Valley, Victoria", "and runs a restaurant, cellar door and concerts at its estate"),
  "Mitchelton Wines": winery("Mitchelton Wines", "the Nagambie Lakes region, Victoria", "and runs a restaurant and cellar door at its estate"),
  "Bests Wines": winery("Bests Wines", "Great Western, Victoria", "and is a family-owned business"),
  "Montalto Vineyard": winery("Montalto Vineyard", "the Mornington Peninsula, Victoria", "and runs a restaurant, olive grove and sculpture park at its estate"),
  "Sandalford Wines": winery("Sandalford Wines", "Western Australia, with vineyards in the Swan Valley and Margaret River", "and runs a cellar door and restaurant")
});
