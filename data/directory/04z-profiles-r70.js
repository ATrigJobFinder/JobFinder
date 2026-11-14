/* ===================== Directory profiles, round 70: snow resorts, holiday parks, coach and tour operators, a station stay, an urban renewal agency =====================
   Uses islandResort and tourismAttraction (round 39). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const snowResort = (name, where) => ({
  about: [
    `${name} is a ski resort ${where}. It runs ski lifts, snow making and grooming, ski school and hire, accommodation, restaurants and shops in winter, and walking, mountain biking and events in other seasons.`,
    "It employs lift operators, snow makers and groomers, ski patrol and instructors, ski and bike hire staff, hospitality and kitchen staff, housekeeping and front desk staff, maintenance crews, and administration and management staff. Many roles are seasonal, with winter hiring peaking before the ski season, and staff accommodation is often part of the package."
  ],
  spec: ["Ski resort", "Lift operations", "Hospitality", "Seasonal work", "Snow operations"],
  roles: ["Lift operator", "Ski instructor", "Hospitality staff", "Housekeeper", "Groomer"]
});
const holidayParkOperator = (name, what) => ({
  about: [
    `${name} is ${what}. Its parks offer powered and unpowered campsites, cabins and amenities, usually near beaches, rivers or towns, and run reception, shops and activities for guests.`,
    "It employs reception and booking staff, park managers and assistant managers, housekeeping and cleaning staff, maintenance and grounds staff, activity and kiosk staff, and marketing, reservations and head office staff. Many roles are seasonal and peak in summer and school holidays, and some come with on-site accommodation."
  ],
  spec: ["Holiday parks", "Guest services", "Housekeeping and grounds", "Park management", "Seasonal work"],
  roles: ["Reception", "Park manager", "Housekeeper", "Grounds and maintenance", "Reservations"]
});
Object.assign(DIR_PROFILES, {
  "Mt Hotham Alpine Resort": snowResort("Mt Hotham Alpine Resort", "in the Victorian Alps, with a village at the top of the mountain"),
  "Mt Baw Baw": snowResort("Mt Baw Baw", "in the Victorian Alps in Gippsland, the closest snow resort to Melbourne"),
  "Charlotte Pass": snowResort("Charlotte Pass", "in the Snowy Mountains of New South Wales, in Kosciuszko National Park"),
  "Selwyn Snowfields": snowResort("Selwyn Snowfields", "in the Snowy Mountains of New South Wales, popular with families and beginners"),
  "Ingenia Holidays": holidayParkOperator("Ingenia Holidays", "an Australian holiday park operator with parks in several states"),
  "Reflections Holiday Parks": holidayParkOperator("Reflections Holiday Parks", "a New South Wales operator of holiday parks, many on public land by the coast and rivers"),
  "Murrays Coaches": { about: ["Murrays Coaches is a coach company based in Canberra. It runs scheduled coach services between Canberra, Sydney and other towns, as well as charter, tour and school bus services.", "It employs coach drivers, bus drivers and tour guides, mechanics and workshop staff, operations, rostering and customer service staff, sales and charter staff, and finance and administration staff. Many roles are driving roles with early starts and weekend shifts, and a heavy vehicle or bus licence is usually needed."], spec: ["Coach services", "Charter and tours", "Driving", "Workshop", "Customer service"], hq: "Canberra, ACT", roles: ["Coach driver", "Mechanic", "Tour guide", "Rostering", "Customer service"] },
  "AAT Kings": tourismAttraction("AAT Kings", "an Australian coach touring company that runs guided day tours and multi-day holidays around the country", ""),
  "Surf Camp Australia": tourismAttraction("Surf Camp Australia", "an Australian company that runs surf lessons, camps and tours for visitors and school groups", "on the east coast"),
  "Rawnsley Park Station": islandResort("Rawnsley Park Station", "a working sheep station and tourist stay in the Flinders Ranges", "in South Australia"),
  "Renewal SA": { about: ["Renewal SA is the South Australian Government's urban renewal agency. It plans and delivers new neighbourhoods, housing and public spaces, and revitalises sites and precincts, working with developers, councils and communities.", "It employs urban planners and designers, project and development managers, engineers and surveyors, property and land staff, community engagement and communications staff, and finance and corporate staff. Most roles are in Adelaide and suit people with planning, property, engineering or project management backgrounds."], spec: ["Urban renewal", "Land development", "Project management", "Planning and design", "Community engagement"], hq: "Adelaide, SA", roles: ["Project manager", "Planner", "Development manager", "Engineer", "Community engagement"] }
});
