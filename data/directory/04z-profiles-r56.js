/* ===================== Directory profiles, round 56: banks and a credit union, a Tasmanian beef processor, a grain and oilseed company =====================
   Uses meatProcessor (round 23). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const retailBank = (name, what) => ({
  about: [
    `${name} is ${what}. It offers everyday accounts, savings, home loans, credit cards and business banking through branches, online banking and a mobile app.`,
    "It employs customer service and branch staff, personal and business bankers, mortgage and lending specialists, contact centre staff, credit, risk and compliance staff, technology and data staff, and finance and corporate staff. Many roles are in branches and contact centres and suit people with customer service or sales backgrounds, and graduate and traineeship programs are advertised on its careers page."
  ],
  spec: ["Retail banking", "Home lending", "Customer service", "Business banking", "Risk and compliance"],
  roles: ["Customer service officer", "Personal banker", "Lending specialist", "Contact centre", "Risk and compliance"]
});
Object.assign(DIR_PROFILES, {
  "Bank of Melbourne": retailBank("Bank of Melbourne", "a bank brand with branches mainly in Victoria"),
  "BankSA": retailBank("BankSA", "a bank brand with branches mainly in South Australia"),
  "St George Bank": retailBank("St George Bank", "a bank brand with branches mainly in New South Wales and the Australian Capital Territory"),
  "Bank of Us": retailBank("Bank of Us", "a Tasmanian customer-owned bank"),
  "Bank of Sydney": retailBank("Bank of Sydney", "a small bank based in Sydney"),
  "Summerland Credit Union": retailBank("Summerland Credit Union", "a customer-owned credit union based in the Northern Rivers region of New South Wales"),
  "Bank First": retailBank("Bank First", "a Victorian customer-owned bank"),
  "Greenham": meatProcessor("Greenham", "a family-owned Australian beef and lamb company, based in Tasmania, that processes and sells grass-fed meat", "with plants and operations in several states"),
  "Bunge Australia": { about: ["Bunge Australia is the Australian arm of a global agribusiness. It buys and handles grain and oilseeds, processes them into products such as oils and flour, and supplies food, feed and industrial customers.", "It employs plant and mill operators, maintenance trades and engineers, grain buyers and traders, logistics and port staff, quality and food safety staff, and finance and corporate staff. Many roles are at plants and depots in regional areas and suit people with food processing, agriculture or trade backgrounds."], spec: ["Grain handling", "Oilseed and flour processing", "Grain trading", "Logistics", "Food safety"], roles: ["Plant operator", "Maintenance trade", "Grain trader", "Logistics", "Quality assurance"] }
});
