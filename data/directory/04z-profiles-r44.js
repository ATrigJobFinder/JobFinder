/* ===================== Directory profiles, round 44: hotels and reef resorts, a Whitsundays tour operator =====================
   Uses islandResort and tourismAttraction (round 39). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const hotelProfile = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. It offers rooms, restaurants and bars, meeting and function spaces, and guest services for holiday and business travellers.`,
    "It employs front office and concierge staff, housekeepers and room attendants, chefs and kitchen staff, restaurant and bar staff, events and functions staff, maintenance and security staff, sales and marketing staff, and management and finance staff. Many roles are rostered across days, nights and weekends, and traineeships and apprenticeships in hospitality are a common way in."
  ],
  spec: ["Hotel operations", "Front office and housekeeping", "Food and beverage", "Events and functions", "Guest service"],
  roles: ["Front office", "Housekeeper", "Chef", "Restaurant and bar staff", "Events"]
});
Object.assign(DIR_PROFILES, {
  "Stamford Plaza": hotelProfile("Stamford Plaza", "an Australian hotel group that runs upscale hotels in several cities", ""),
  "Emporium Hotel South Bank": hotelProfile("Emporium Hotel South Bank", "a boutique hotel", "in South Bank, Brisbane"),
  "Hotel Windsor": hotelProfile("The Hotel Windsor", "a historic grand hotel on Spring Street", "in central Melbourne, known for its afternoon tea"),
  "Hadley's Orient Hotel": hotelProfile("Hadley's Orient Hotel", "a historic hotel", "in the centre of Hobart"),
  "Lizard Island Resort": islandResort("Lizard Island Resort", "a luxury resort on Lizard Island", "on the northern Great Barrier Reef"),
  "Heron Island Resort": islandResort("Heron Island Resort", "a resort on a coral cay", "on the southern Great Barrier Reef, with snorkelling, diving and marine research nearby"),
  "Coral Sea Resort": hotelProfile("Coral Sea Resort", "a resort", "at Airlie Beach in the Whitsundays"),
  "Cruise Whitsundays": tourismAttraction("Cruise Whitsundays", "a Whitsundays tour and ferry operator that runs day cruises, reef trips and transfers between Airlie Beach, Hamilton Island and the islands", "in Queensland")
});
