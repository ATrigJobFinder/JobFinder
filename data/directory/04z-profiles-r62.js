/* ===================== Directory profiles, round 62: independent cinemas, games and play venues, a yacht club, golf and racing bodies =====================
   Uses sportBody (round 10). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const funVenue = (name, what, where) => ({
  about: [
    `${name} is ${what}${where ? ", " + where : ""}. It runs entertainment venues where customers play, celebrate and socialise, and sells tickets, food, drinks and party packages.`,
    "It employs venue team members and hosts, bar, kitchen and food staff, party and events coordinators, technicians and maintenance staff, venue and area managers, and marketing, finance and head office staff. Many roles are casual or part-time, with evening, weekend and school holiday shifts, and they suit students and people starting out in hospitality, customer service or events."
  ],
  spec: ["Entertainment venues", "Customer service", "Food and beverage", "Parties and events", "Venue operations"],
  roles: ["Venue team member", "Bar and food staff", "Party host", "Duty manager", "Technician"]
});
const cinemaOperator = (name, what) => ({
  about: [
    `${name} is ${what}. Its cinemas show new films, festival and special event screenings, and also sell food, drinks and gift cards.`,
    "It employs cinema crew who sell tickets and food and look after the screens, duty and cinema managers, projection and technical staff, marketing and programming staff, and finance and head office staff. Many people start in casual crew roles, with evening and weekend shifts, and the jobs suit film lovers and people starting out in hospitality or customer service."
  ],
  spec: ["Cinemas", "Film programming", "Customer service", "Food and drink", "Events"],
  roles: ["Cinema crew", "Duty manager", "Projectionist", "Programmer", "Marketing"]
});
Object.assign(DIR_PROFILES, {
  "Dendy Cinemas": cinemaOperator("Dendy Cinemas", "an independent Australian cinema group that shows arthouse, independent and mainstream films"),
  "Hayden Orpheum Picture Palace": cinemaOperator("The Hayden Orpheum Picture Palace", "a historic Art Deco cinema in Cremorne, Sydney, that shows new and classic films"),
  "Timezone": funVenue("Timezone", "an Australian chain of arcade and family entertainment centres", "found in shopping centres"),
  "Holey Moley Australia": funVenue("Holey Moley Australia", "an Australian chain of mini-golf and bar venues", ""),
  "Kingpin Bowling": funVenue("Kingpin", "an Australian chain of bowling and entertainment venues, with bowling, arcade games and bars", ""),
  "Bounce Australia": funVenue("Bounce", "an Australian operator of indoor trampoline and play centres", ""),
  "Archie Brothers": funVenue("Archie Brothers", "an Australian operator of arcade, bar and restaurant venues", ""),
  "Hijinx Hotel": funVenue("Hijinx Hotel", "an immersive and interactive entertainment venue in Melbourne, where visitors explore themed rooms, shows and experiences", ""),
  "Royal Prince Alfred Yacht Club": { about: ["The Royal Prince Alfred Yacht Club is a yacht club on Pittwater, in northern Sydney. It runs sailing racing, training and events, and operates a clubhouse with a restaurant, bar and function rooms for members and guests.", "It employs sailing and racing staff, junior sailing instructors, marina and boat yard staff, bar, restaurant and kitchen staff, function and events staff, and administration and management staff. Many roles are casual or part-time with weekend shifts, and they suit people with sailing, hospitality or events experience."], spec: ["Sailing and racing", "Junior sailing", "Marina and boat yard", "Hospitality", "Events"], hq: "Sydney, NSW", roles: ["Sailing instructor", "Marina and boat yard", "Bar and restaurant staff", "Events", "Administration"] },
  "Golf Tasmania": sportBody("Golf Tasmania", "golf", "Tasmania", "and runs state events and junior programs"),
  "Tasracing": { about: ["Tasracing is the controlling body for thoroughbred, harness and greyhound racing in Tasmania. It sets and enforces the rules, runs race meetings and tracks, invests in the industry and looks after animal welfare and integrity.", "It employs racing and track staff, stewards and integrity staff, animal welfare staff, handicappers and racing officials, marketing and wagering staff, and finance and corporate staff. Many roles are at racecourses and in offices in Tasmania, and suit people with racing, animal or sport administration backgrounds."], spec: ["Racing administration", "Race meetings", "Animal welfare", "Integrity and stewards", "Industry development"], roles: ["Racing official", "Steward", "Track staff", "Animal welfare", "Marketing"] },
  "Harness Racing NSW": { about: ["Harness Racing NSW is the controlling body for harness racing in New South Wales. It sets and enforces the rules, runs race meetings, licenses participants and works on integrity, animal welfare and the development of the industry.", "It employs racing and track staff, stewards and integrity staff, racing officials, animal welfare staff, marketing and wagering staff, and finance and corporate staff. Many roles suit people with racing, animal or sport administration backgrounds."], spec: ["Racing administration", "Race meetings", "Animal welfare", "Integrity and stewards", "Licensing"], hq: "Sydney, NSW", roles: ["Racing official", "Steward", "Racing operations", "Animal welfare", "Marketing"] }
});
