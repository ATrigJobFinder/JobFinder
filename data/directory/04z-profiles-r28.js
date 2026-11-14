/* ===================== Directory profiles, round 28: wineries and fresh produce growers =====================
   Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const winery = (name, where, extra) => ({
  about: [
    `${name} is an Australian winery in ${where}. It grows grapes and makes wine${extra ? ", " + extra : ""}, and sells it through its cellar door, bottle shops, restaurants and online, in Australia and overseas.`,
    "It employs winemakers and cellar hands, viticulturists and vineyard workers, cellar door and hospitality staff, sales and marketing staff, packaging and logistics staff, and finance and administration staff. Many roles are in regional areas, with extra seasonal work at vintage, and staff who serve alcohol need the responsible service qualifications for their state."
  ],
  spec: ["Winemaking", "Viticulture", "Cellar door", "Sales and export", "Vintage work"],
  roles: ["Winemaker", "Cellar hand", "Vineyard worker", "Cellar door staff", "Sales"]
});
Object.assign(DIR_PROFILES, {
  "Tyrrell's Wines": winery("Tyrrell's Wines", "the Hunter Valley, New South Wales", "and is a family-owned business"),
  "Vasse Felix": winery("Vasse Felix", "Margaret River, Western Australia", "and runs a restaurant and gallery at its estate"),
  "Seppeltsfield": winery("Seppeltsfield", "the Barossa Valley, South Australia", "and is known for its fortified wines"),
  "Pikes Wines": winery("Pikes Wines", "the Clare Valley, South Australia", "and is a family-owned business"),
  "Bleasdale Vineyards": winery("Bleasdale Vineyards", "Langhorne Creek, South Australia", "and is a family-owned business"),
  "Bird in Hand": winery("Bird in Hand", "the Adelaide Hills, South Australia", "and runs a restaurant and cellar door"),
  "Coriole Vineyards": winery("Coriole Vineyards", "McLaren Vale, South Australia", "and is a family-owned business"),
  "Domaine Chandon Australia": winery("Domaine Chandon Australia", "the Yarra Valley, Victoria", "and specialises in sparkling wine"),
  "Perfection Fresh": { about: ["Perfection Fresh is an Australian fresh produce company that grows, packs and markets fruit and vegetables, and supplies supermarkets, food service and export customers.", "It employs farm and packhouse workers, growers and agronomists, quality and food safety staff, drivers and logistics staff, sales and account managers, and finance, marketing and corporate staff. Many roles are on farms and in packhouses, with extra seasonal work at harvest."], spec: ["Fresh produce", "Growing and packing", "Food safety", "Logistics", "Sales and marketing"], roles: ["Farm worker", "Packhouse worker", "Agronomist", "Driver", "Account manager"] },
  "Mulgowie Farming": { about: ["Mulgowie Farming is a Queensland fresh produce grower that farms vegetables, mainly in the Lockyer Valley in south-east Queensland, and supplies supermarkets and other customers.", "It employs farm workers and machinery operators, harvest crews, agronomists and farm supervisors, packhouse and quality staff, drivers and logistics staff, and finance and administration staff. Many roles are on farms in regional Queensland, with extra seasonal work at harvest."], spec: ["Vegetable growing", "Farming operations", "Packing and quality", "Logistics", "Harvest work"], hq: "Lockyer Valley, QLD", roles: ["Farm worker", "Machinery operator", "Harvest crew", "Agronomist", "Driver"] }
});
