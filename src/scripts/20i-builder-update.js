/* ===================== Create or edit resume: the opening page, kinds of work, employers by job title, bullet order, and the score pop ===================== */
// The steps themselves are in 20-resume-creator.js. This file holds the lists and helpers they use.

/* --- Kinds of work, in more detail: "Hospitality and tourism" → cafés, restaurants, bars, hotels… ---
   Each line is: industry key: Label=word|word; Label=word|word. The words are job-title words, used to put the matching job titles first. */
const JOB_SUBS_SRC = `
graduate: Engineering=engineer|surveyor|planner|architect; Finance and accounting=account|financ|audit|tax|actuar|analyst; Technology and data=software|data|cyber; Law and policy=lawyer|policy|legal; Health and teaching=nurse|teacher|pharmac|physio; Business and consulting=consult|business|project|recruit|marketing|hr
accounting: Bookkeeping and payables=bookkeep|payable|receivable|accounts|payroll|credit; Tax and compliance=tax; Audit and assurance=audit; Management and finance=management|financial|finance|controller|commercial|cost; Insolvency and forensic=insolv|forensic
admin: Reception and front desk=reception|front desk|concierge; Executive and personal assistant=executive|personal assistant|virtual; Data entry and records=data entry|records|document|transcri; Office management=office|coordinator|team assistant|clerk; Project and contract support=project|contract|purchasing|facilities
media: Journalism and writing=journalist|reporter|writer|editor|copywriter; Video, photo and sound=video|photograph|camera|sound|lighting|animator|motion; Radio and broadcast=radio|broadcast|presenter|producer; Advertising=advertising|media buyer|media planner|art director; Arts and events=gallery|arts|event|actor|musician|stage
banking: Branch and retail banking=teller|personal banker|home loan|customer service|branch; Lending and credit=lending|credit|mortgage|loan|collections; Financial planning=planner|adviser|wealth|paraplanner; Investment and markets=investment|trader|portfolio|equity|quant|fund; Risk and compliance=risk|compliance|fraud|anti-money|settlements|operations
callcentre: Customer service=customer service|customer support|complaints|customer experience|inbound; Sales and retention=sales|retention|telemarket|outbound; Bookings and reservations=booking|reservation; Technical support=help desk|service desk|technical; Team leading=team leader|success
community: Aged care=aged|home care|personal care|lifestyle; Disability support=disability|ndis|support worker|support coordinator; Youth and family=youth|family|child protection|caseworker|case manager; Housing and homelessness=housing|homeless; Mental health and counselling=mental health|counsell|peer|alcohol|social worker; Coordination and fundraising=coordinator|fundraising|community development|engagement
construction: Labouring and site work=labourer|civil|road|traffic|pipelayer; Trades on site=carpenter|concreter|bricklayer|tiler|painter|plaster|render|formwork|steel|scaffold|rigger|builder; Machinery and cranes=plant|excavator|crane|dogman; Supervision and management=supervisor|foreman|leading hand|manager|site; Estimating, drafting and surveying=estimator|quantity|surveyor|drafter|inspector
consulting: Management and strategy=management consultant|strategy|principal|associate|engagement; Business analysis=business analyst|analyst|process; Technology consulting=technology|data and analytics; Change and transformation=change|transformation|program; Risk and sustainability=risk|sustainab|advisory
design: Graphic and brand=graphic|brand|packaging|creative director; Digital, UX and UI=ux|ui designer|web|product designer; Architecture and drafting=architect|drafter|technician|cad|3d; Interior and spaces=interior|visual merch|exhibition|landscape|urban; Product, fashion and jewellery=industrial|fashion|jewellery
education: Primary school=primary|teacher's aide|learning support; Secondary school=secondary|careers|school counsellor; Early childhood and childcare=childcare|early childhood|room leader|centre director|family day|oshc|nanny|au pair; Tutoring and training=tutor|trainer|tafe|assessor|learning designer|instructional; Special needs support=special|support officer|eal; School leadership and admin=principal|deputy|administration|student services
engineering: Civil and structural=civil|structural|geotech|hydraulic|water|transport|traffic; Mechanical and manufacturing=mechanical|manufacturing|maintenance|reliability|design engineer|quality; Electrical and electronic=electrical|controls|instrumentation|automation|telecom|building services; Chemical and process=chemical|process|environmental; Energy and resources=renewable|asset|mining|petroleum; Biomedical, aerospace and mechatronics=biomedical|aerospace|mechatronic; Technicians and drafting=technician|drafter
agriculture: Crops and horticulture=crop|harvest|picker|horticultur|nursery|agronom|arborist|viticult|winemaker|cellar; Livestock and dairy=livestock|dairy|shear|wool|station|farm|jackaroo|jillaroo; Animal care and vets=vet|animal|kennel|groomer|zoo; Conservation and environment=ranger|conservation|environment|natural resource|regenerat|fisheries|aquaculture
government: Policy and research=policy|research|intelligence; Service delivery and admin=client service|administrative|case officer|program|grants|records; Local council=council|planning|building surveyor|parking|local laws|environmental health; Police, fire and emergency=police|firefighter|emergency|corrections|border|protective; Defence=army|navy|air force|defence; Communications and management=communications|media|director|executive|ministerial|procurement|contract
health: Nursing and midwifery=nurse|midwife|assistant in nursing; Doctors and surgeons=general practitioner|medical officer|surgeon; Allied health=physio|occupational|speech|psycholog|dietit|podiatr|exercise|chiropract|massage; Pharmacy, dental and optical=pharmac|dental|optom|optical; Imaging and pathology=radiograph|sonograph|laborator|pathology|theatre|steril; Patient services and admin=paramedic|patient services|ward|receptionist|practice manager|coder
hospitality: Cafés and coffee=barista|caf; Restaurants and kitchens=chef|cook|kitchen|sous|pastry|baker|waiter|restaurant|sommelier|food and beverage|front of house; Bars, pubs and clubs=bar|gaming|sommelier; Hotels and accommodation=hotel|night auditor|concierge|housekeep|room attendant|porter; Events and catering=event|function|catering; Tourism and travel=tour|travel|flight|cabin; Venue management=manager
hr: Recruitment=recruit|talent|onboarding; HR generalist=human resources|hr |people and culture; Learning and development=learning|training|organisational; Workplace relations=employee relations|industrial|investigation; Payroll and remuneration=payroll|remuneration; Safety and wellbeing=whs|return to work|diversity
tech: Software development=developer|software|full stack|front end|back end|web|mobile|ios|android|game; Data and AI=data|machine learning|ai |business intelligence; Cloud and infrastructure=cloud|devops|reliability|systems admin|network|database; IT support=support|help desk|service desk|desktop; Cyber security=cyber|security|penetration; Product, project and testing=product|scrum|project|ux|technical writer|tester|test|qa|automation tester; Enterprise systems=salesforce|erp|architect|systems analyst
insurance: Claims=claims|loss adjuster|injury|workers comp; Underwriting and broking=underwrit|broker|account executive|insurance consultant; Actuarial and pricing=actuar|pricing; Superannuation=super|member services; Policy administration=policy admin|life insurance
legal: Lawyers and solicitors=lawyer|solicitor|associate|counsel|attorney; Barristers and courts=barrister|judge|court|law clerk; Paralegal and support=paralegal|legal assistant|secretary|litigation|researcher; Conveyancing and property=conveyanc; Compliance and contracts=compliance|contracts|migration; Practice management=practice manager
management: Operations=operations|general manager|department|coordinator; Executive=chief|managing director|ceo|head of; Project management=project; Team leading=team leader|supervisor; Small business=business owner|business manager|franchise; Regional and area=regional|area
logistics: Warehouse and storage=warehouse|storeperson|pick|packer|inventory|stock|forklift|reach truck; Driving and delivery=driver|courier|delivery|rideshare|taxi|bus|train; Freight and supply chain=freight|customs|import|supply chain|procurement|logistics|dispatch|transport planner|fleet; Factory and production=production|process worker|factory|machine operator|cnc|assembler|quality|food process|meat; Waste and recycling=waste|garbage|recycl|rubbish; Maintenance=maintenance
marketing: Digital and social=digital|social|seo|sem|email|growth|content|community|influencer; Brand and communications=brand|communications|public relations|media relations; Events and sponsorship=event|sponsorship|partnerships; Research and insights=research|insights|analyst; Marketing management=manager|executive|coordinator|assistant|officer|campaign
mining: Mine operations=mining operator|haul|dump|drill|underground|shotfirer|process plant|utility|miner; Geology and exploration=geolog|exploration|metallurg|surveyor|planner; Maintenance and trades=fitter|mechanic|electrician|instrument|maintenance|technician; Energy and power=wind|power|powerline|gas|energy|petroleum|offshore; Safety, environment and site support=hse|environmental|site admin|camp
property: Sales agents=agent|sales|auctioneer|buyer; Property management and leasing=property manager|leasing|property officer; Strata and building management=strata|body corporate|facilities|building manager; Valuation and analysis=valuer|analyst|asset|development
retail: Sales floor and checkout=sales assistant|retail|cashier|checkout|customer service assistant|team member|store team|keyholder; Supermarkets and fresh food=deli|bakery|butcher|florist|replenish|night fill|personal shopper; Store management=store manager|team leader|assistant store; Beauty and hair=beauty|cosmetic|barber|hair|nail; Buying and online=buyer|merchandise|e-commerce|loss prevention|optical
sales: Business-to-business sales=account|business development|key account|territory|solutions|pre-sales|technical sales; Inside and phone sales=inside|telesales|sales development|telemarket; Field and retail sales=field|car salesperson|representative; Medical and pharmaceutical sales=medical sales|pharmaceutical; Sales support and management=sales manager|coordinator|support|administrator
science: Laboratory work=laboratory|technician|pathology|quality control|analyst; Research science=research scientist|scientist|chemist|biolog|physicist|biochem|biotech|microbiolog; Environment and ecology=environmental|ecolog|marine|hydrolog|meteorolog; Food and agricultural science=food|agricultural; Clinical research and regulatory=clinical|regulatory|statistic|forensic
sport: Fitness and gyms=personal trainer|fitness|gym|yoga|pilates|strength|exercise; Aquatics=swim|lifeguard|pool; Coaching and development=coach|development|instructor; Outdoor and recreation=outdoor|camp|ski|surf|recreation|leisure; Sports administration=administrator|club manager|umpire|referee|golf; Dance and martial arts=dance|martial
trades: Electrical=electrician|data cabler|solar|auto electrician|lift; Plumbing and gas=plumber|gasfitter|irrigation|pool technician; Building trades=carpenter|joiner|cabinet|painter|roofer|glazier|upholsterer|signwriter; Automotive and mechanical=mechanic|automotive|panel|spray|diesel|boilermaker|welder|fitter|sheet metal|fabricat|refrigeration|air conditioning|appliance; Gardening and landscaping=landscaper|gardener|arborist; Cleaning and maintenance=cleaner|pest|handyperson|maintenance|window; Security and removals=security|guard|locksmith|removalist
academic: Research=research assistant|research associate|research fellow|postdoc|phd|research engineer|data|research coordinator; Teaching and lecturing=lecturer|professor|teaching|demonstrator|sessional; University support=student advisor|learning advisor|grants|research manager; Libraries, archives and museums=librar|archiv|curator|museum
`;
let jobSubsMap = null;
function jobSubs(type) {
  if (!jobSubsMap) {
    jobSubsMap = {};
    for (const line of JOB_SUBS_SRC.split("\n")) {
      const m = line.match(/^([a-z]+):\s*(.+)$/);
      if (m) jobSubsMap[m[1]] = m[2].split(";").map(x => { const [label, words] = x.trim().split("="); return [label.trim(), (words || "").split("|").filter(Boolean)]; });
    }
  }
  return jobSubsMap[OLD_JOB_TYPES[type] || type] || [];
}
// Job titles for the Goal step: this kind of work first, and within it the ones that fit the more specific choice
function titlesFor(type, sub) {
  const all = allJobTitles();
  if (!type) return all;
  const own = (JOB_TITLES[OLD_JOB_TYPES[type] || type] || "").split(";").filter(Boolean);
  const words = ((jobSubs(type).find(([l]) => l === sub) || [])[1]) || [];
  const hit = words.length ? own.filter(t => words.some(w => t.toLowerCase().includes(w))) : [];
  return [...new Set([...hit, ...own, ...all])];
}

/* --- Employers that fit the job title --- */
// Industries in the Company guides that each kind of work could plausibly work for
const EMP_IND = {
  graduate: ["accounting", "banking", "consulting", "tech", "government", "engineering", "construction", "resources", "energy", "defence", "health", "law", "trading"],
  accounting: ["accounting", "consulting", "banking", "government"], admin: ["government", "health", "education", "community", "services", "law", "construction", "banking", "tech", "energy", "retail", "transport", "manufacturing", "sport"],
  media: ["sport", "services", "tech"], banking: ["banking", "trading", "accounting", "consulting"], callcentre: ["banking", "tech", "retail", "services", "government", "health", "energy"],
  community: ["community", "health", "government", "education"], construction: ["construction", "engineering", "resources", "energy", "services"], consulting: ["consulting", "accounting", "engineering", "tech", "government"],
  design: ["engineering", "construction", "services"], education: ["education", "government", "community"], engineering: ["engineering", "construction", "resources", "energy", "defence", "manufacturing", "transport", "government"],
  agriculture: ["agriculture", "government", "manufacturing"], government: ["government", "defence"], health: ["health", "community"], hospitality: ["hospitality", "sport"], hr: ["services", "consulting", "banking", "government", "tech", "retail"],
  tech: ["tech", "consulting", "banking", "government", "defence"], insurance: ["banking", "accounting"], legal: ["law", "government"], management: ["services", "retail", "construction", "transport", "manufacturing", "health", "banking", "tech"],
  logistics: ["transport", "manufacturing", "retail", "resources"], marketing: ["retail", "tech", "sport", "services", "consulting", "banking"], mining: ["resources", "energy", "engineering", "transport", "construction"],
  property: ["construction", "services", "banking"], retail: ["retail", "hospitality"], sales: ["retail", "tech", "services", "manufacturing", "banking", "transport"],
  science: ["health", "education", "agriculture", "resources", "energy", "government", "manufacturing"], sport: ["sport", "education", "community", "hospitality", "services"],
  trades: ["construction", "energy", "manufacturing", "transport", "resources", "services", "defence"], academic: ["education", "government", "health"]
};
// Employers that the directory doesn't cover well, by kind of work
const EMP_TYPE_SRC = {
  media: "ABC;SBS;Nine;Seven West Media;Network Ten;News Corp Australia;Foxtel;Stan;Southern Cross Austereo;ARN;Nova Entertainment;The Guardian Australia;Domain;Ogilvy;Clemenger BBDO;Mediacom;Mindshare;OMD;Local newspaper;Freelance",
  banking: "Commonwealth Bank;Westpac;ANZ;NAB;Macquarie Group;Bendigo and Adelaide Bank;Bank of Queensland;ING Australia;Suncorp Bank;HSBC;Citi;St.George Bank;Bank of Melbourne;BankSA;Teachers Mutual Bank;Heritage Bank;Great Southern Bank;AMP;Challenger;Insignia Financial;Perpetual;Local mortgage broker",
  callcentre: "Telstra;Optus;Vodafone (TPG Telecom);Origin Energy;AGL;EnergyAustralia;Medibank;Bupa;NIB;HCF;Commonwealth Bank;Westpac;NAB;ANZ;Services Australia;Concentrix;Teleperformance;Foundever;Qantas;Virgin Australia;Telstra Health",
  community: "Anglicare;Uniting;Mission Australia;The Salvation Army;Red Cross;Life Without Barriers;Brotherhood of St Laurence;Wesley Mission;St Vincent de Paul Society;Berry Street;CatholicCare;Centacare;Baptcare;Bethanie;The Benevolent Society;Sacred Heart Mission;Hireup;Mable;Scope;Aruma;Endeavour Foundation;Cerebral Palsy Alliance;Carers Australia;headspace;Lifeline;Relationships Australia;Local council;NDIS provider",
  construction: "Lendlease;Multiplex;Probuild;Hutchinson Builders;Built;Buildcorp;FDC Construction;CPB Contractors;John Holland;Fulton Hogan;Downer;Boral;Hanson;Holcim;Brickworks;Metricon;Simonds Homes;McDonald Jones Homes;Porter Davis;Stockland;Mirvac;Bunnings Trade;Local builder;Subcontractor;Self-employed",
  design: "Woods Bagot;Hassell;Cox Architecture;Fender Katsalidis;BVN;Bates Smart;Scott Carver;Populous;Architectus;Arup;Canva;IKEA;Local architecture studio;Local design studio;Freelance",
  education: "Department of Education;Catholic Education;Independent school;Local public school;Local primary school;Local high school;Goodstart Early Learning;G8 Education;Guardian Early Learning;Camp Australia;OSHClub;Kumon;Navitas;TAFE;Private tutoring;University",
  agriculture: "Elders;Landmark;Nutrien Ag Solutions;Costa Group;Ruralco;Australian Agricultural Company;Teys Australia;JBS Australia;Saputo Dairy Australia;Fonterra;Bega Cheese;Local farm;Family farm;Zoos Victoria;Taronga Zoo;RSPCA;Greencross Vets;Petbarn;Local vet clinic;Parks and Wildlife Service;Landcare",
  government: "Services Australia;Australian Taxation Office;Department of Home Affairs;Department of Defence;Local council;State government department;Victoria Police;NSW Police Force;Queensland Police Service;WA Police Force;SA Police;Fire and Rescue NSW;Country Fire Authority;Ambulance Victoria",
  health: "Ramsay Health Care;Healthscope;St Vincent's Health Australia;Mater;Monash Health;Sydney Local Health District;Queensland Health;WA Health;SA Health;Royal Melbourne Hospital;Sonic Healthcare;Healius;Australian Clinical Labs;Dorevitch;Chemist Warehouse;Priceline Pharmacy;TerryWhite Chemmart;Blooms The Chemist;Local medical centre;Local pharmacy;Bupa Dental;Pacific Smiles;Specsavers;OPSM;Opal HealthCare;Regis Aged Care;Estia Health;Bupa Aged Care;Private practice",
  hospitality: "McDonald's;KFC;Hungry Jack's;Domino's;Pizza Hut;Subway;Red Rooster;Grill'd;Guzman y Gomez;Nando's;Oporto;Zambrero;Boost Juice;Starbucks;Gloria Jean's;Muffin Break;The Coffee Club;Hudsons Coffee;Merivale;Australian Venue Co;Solotel;ALH Group;Crown Resorts;The Star Entertainment Group;Accor;Hilton;Marriott;Hyatt;IHG;QT Hotels;Compass Group;Sodexo;Delaware North;Aramark;Spotless;Local café;Local restaurant;Local pub;RSL club;Event Cinemas;Hoyts;Village Cinemas",
  hr: "Hays;Randstad;Adecco;Chandler Macleod;Robert Half;Michael Page;Programmed;Skilled;Workpac;Max Employment;APM Employment Services;Frontline Recruitment;Local recruitment agency;Labour hire company",
  tech: "Atlassian;Canva;Telstra;Optus;Xero;REA Group;SEEK;Block (Afterpay);Tyro;WiseTech Global;Infosys;Accenture;TCS;Capgemini;Microsoft;Google;Amazon Web Services;IBM;Startup;Freelance",
  insurance: "IAG;Suncorp;QBE;Allianz Australia;AIA;TAL;Zurich;AMP;Hostplus;AustralianSuper;UniSuper;Aware Super;RACV;NRMA;RAC WA;Youi;Auto & General;Bupa;Medibank;NIB;HCF;icare;Local insurance broker",
  legal: "Allens;Ashurst;Clayton Utz;Herbert Smith Freehills;King & Wood Mallesons;MinterEllison;Gilbert + Tobin;Corrs Chambers Westgarth;Local law firm;Legal Aid;Community legal centre;Courts;Department of Justice",
  logistics: "Australia Post;StarTrack;Toll Group;Linfox;DHL;Team Global Express;Qube;CEVA Logistics;Kuehne+Nagel;Followmont;Woolworths Distribution Centre;Coles Distribution Centre;Amazon;Bunnings;Visy;Orora;Amcor;Bega Cheese;Arnott's;Lion;Coca-Cola Europacific Partners;SunRice;Simplot;Goodman Fielder;Mars;Nestlé;Cleanaway;Veolia;Hastings Deering;Labour hire company;Owner driver",
  marketing: "Ogilvy;Clemenger BBDO;Mediacom;Mindshare;OMD;Leo Burnett;The Monkeys;Havas;DDB;Publicis;Local agency;In-house marketing team;Canva;Telstra;Woolworths;Coles;Freelance",
  mining: "BHP;Rio Tinto;Fortescue;South32;Newmont;Glencore;Anglo American;Peabody;Whitehaven Coal;Yancoal;Roy Hill;Mineral Resources;Northern Star;Evolution Mining;Programmed;Downer;Thiess;Ventia;Sodexo;Cater Care;Boart Longyear;Orica;Hastings Deering;WesTrac;Komatsu;Contractor",
  property: "Ray White;LJ Hooker;Raine & Horne;Barry Plant;McGrath;Belle Property;Century 21;Harcourts;PRDnationwide;First National Real Estate;Mirvac;Stockland;Lendlease;CBRE;JLL;Colliers;Savills;Knight Frank;Cushman & Wakefield;Local real estate agency;Strata management company",
  retail: "Woolworths;Coles;Aldi;IGA;Kmart;Target;Big W;Myer;David Jones;Bunnings Warehouse;Officeworks;JB Hi-Fi;Harvey Norman;The Good Guys;Dan Murphy's;BWS;Liquorland;Chemist Warehouse;Priceline Pharmacy;Rebel;Best & Less;Cotton On;Uniqlo;Zara;H&M;Country Road;Sephora;Mecca;Lush;Spotlight;Supercheap Auto;Repco;Autobarn;BCF;Anaconda;Specsavers;OPSM;IKEA;Adairs;Bed Bath N' Table;Freedom;Nick Scali;EB Games;Apple;Lorna Jane;Local boutique;Local shop",
  sales: "Telstra;Optus;Toyota;Ford;Hyundai;Mazda;Local car dealership;Harvey Norman;Bunnings;Salesforce;Oracle;Microsoft;Xero;Local real estate agency;Wholesale supplier;Self-employed",
  science: "CSIRO;Geoscience Australia;Sonic Healthcare;Healius;Australian Clinical Labs;Dorevitch;Agilent;Thermo Fisher Scientific;Bureau of Meteorology;ANSTO;Cochlear;CSL;Nufarm;Orica;Ansell;Bega Cheese;Nestlé;Mars;Garvan Institute;Walter and Eliza Hall Institute;QIMR Berghofer;Murdoch Children's Research Institute;Baker Heart and Diabetes Institute;Doherty Institute;University lab",
  sport: "YMCA;Fitness First;Anytime Fitness;Plus Fitness;Jetts;F45 Training;Snap Fitness;Goodlife Health Clubs;Belgravia Leisure;Royal Life Saving Society;Surf Life Saving Australia;AFL;NRL;Cricket Australia;Netball Australia;Local council pool;Local sporting club;Local gym;Self-employed",
  trades: "Programmed;Ventia;Downer;Spotless;Jim's Group;Local council;Bunnings Trade;Repco;Autobarn;Kmart Tyre & Auto;Bridgestone;Beaurepaires;Ultra Tune;Toyota Australia;Hastings Deering;Local dealership;Local workshop;Subcontractor;Apprenticeship provider;Self-employed",
  academic: "CSIRO;Garvan Institute;Walter and Eliza Hall Institute;QIMR Berghofer;Murdoch Children's Research Institute;Baker Heart and Diabetes Institute;Doherty Institute;State Library;National Library of Australia;Museums Victoria;Australian Museum"
};
// Work that a job title points to more closely than its industry does. exclusive: don't add the industry's wider list.
const EMP_KEYWORDS = [
  [/rubbish|garbage|waste|recycl|\bbin\b|street sweep/i, "Cleanaway;Veolia;JJ Richards & Sons;Remondis Australia;Bingo Industries;Visy;Re.Group;Toxfree;Solo Resource Recovery;Instant Waste Management;Sims Limited;Local council;City of Sydney;Brisbane City Council;City of Melbourne;City of Perth;City of Adelaide;Contractor", true],
  [/clean|janitor|housekeep/i, "Spotless;ISS Facility Services;Ventia;Programmed;Sodexo;Compass Group;Broadlex Services;Ensign Services;Jim's Cleaning;Local cleaning company;Hotel;Hospital;School;Self-employed", true],
  [/security|guard|crowd control/i, "Wilson Security;Securitas;Prosegur;MSS Security;Certis;Armaguard;Chubb Fire & Security;Local security company;Event security;Self-employed", true],
  [/aged care|home care|personal care|residential care|care worker/i, "Opal HealthCare;Regis Aged Care;Estia Health;Bupa Aged Care;Anglicare;Uniting;Arcare;Japara Healthcare;Allity;BlueCross;Lifecare;Baptist Care;HammondCare;Helping Hand;Southern Cross Care;Respect Aged Care;Catholic Healthcare;Silver Chain;Home care provider"],
  [/disability|ndis|support worker|support coordinator/i, "Hireup;Mable;Life Without Barriers;Uniting;Anglicare;Scope;Aruma;Cerebral Palsy Alliance;Endeavour Foundation;Vivida;Disability Services Australia;Local disability provider"],
  [/childcare|child care|educator|nanny|room leader|oshc|kinder|early (?:childhood|learning)/i, "Goodstart Early Learning;G8 Education;Guardian Early Learning;Affinity Education;Only About Children;KU Children's Services;Camp Australia;OSHClub;Busy Bees;Sparrow Early Learning;Local childcare centre;Family day care;Self-employed"],
  [/checkout|supermarket|grocer|deli\b|bakery|produce|night fill|replenish|butcher/i, "Woolworths;Coles;Aldi;IGA;Foodland;Costco;Harris Farm Markets;Drakes Supermarkets;Spudshed;Local supermarket;Local butcher;Local bakery"],
  [/barista|café|cafe|coffee/i, "Starbucks;Gloria Jean's;Muffin Break;The Coffee Club;Hudsons Coffee;Boost Juice;Michel's Patisserie;Local café;Coffee van"],
  [/bartender|bar attendant|gaming|publican|\bbar\b/i, "Merivale;Australian Venue Co;Solotel;ALH Group;Endeavour Group;Crown Resorts;The Star Entertainment Group;Local pub;RSL club;Local bar;Event bar"],
  [/courier|delivery|rideshare|taxi/i, "Australia Post;StarTrack;Toll Group;DHL;Team Global Express;Amazon;Uber;DoorDash;Menulog;Uber Eats;Local courier company;Self-employed"],
  [/lifeguard|swim/i, "Royal Life Saving Society;Surf Life Saving Australia;Belgravia Leisure;YMCA;Local council pool;Local swim school;Hydro Swim"]
];
// Past a job title's last word, which kind of work it belongs to ("Senior Accountant" → accounting)
const TITLE_HINTS = [
  [/chef|cook|kitchen|waiter|waitress|barista|bartender|restaurant|hotel|front of house/i, "hospitality"],
  [/nurse|midwife|dental|physio|therapist|paramedic|doctor|pharmac|medical|patient|clinic/i, "health"],
  [/teacher|tutor|lecturer|educator|school|childcare/i, "education"],
  [/driver|warehouse|forklift|courier|freight|logistics|storeperson|factory|production|waste|rubbish|garbage|recycl/i, "logistics"],
  [/electrician|plumber|carpenter|mechanic|welder|fitter|painter|landscap|gardener|cleaner|security|tradie/i, "trades"],
  [/labourer|builder|site|concret|bricklay|tiler|scaffold|construction/i, "construction"],
  [/retail|sales assistant|cashier|checkout|shop|store/i, "retail"],
  [/developer|software|programmer|it support|network|cyber|data analyst|devops/i, "tech"],
  [/account|bookkeep|payroll|auditor|tax/i, "accounting"],
  [/lawyer|solicitor|paralegal|legal/i, "legal"],
  [/engineer|drafter|technician/i, "engineering"],
  [/marketing|social media|content|seo|brand/i, "marketing"],
  [/customer service|call cent|contact cent|help desk/i, "callcentre"],
  [/claims|underwrit|actuar|insurance/i, "insurance"],
  [/bank|teller|lending|mortgage|broker|financial plan/i, "banking"],
  [/receptionist|administrat|\boffice\b|clerk|secretary|data entry/i, "admin"],
  [/support worker|carer|care worker|aged care|disability|youth worker|social worker|community/i, "community"],
  [/farm|harvest|shearer|station hand|livestock|vet\b|animal/i, "agriculture"],
  [/real estate|property|leasing|strata/i, "property"],
  [/recruit|human resources|\bhr\b|people and culture/i, "hr"],
  [/trainer|coach|fitness|gym|instructor/i, "sport"],
  [/miner|mining|drill|geolog|process operator/i, "mining"],
  [/sales|account manager|business development/i, "sales"],
  [/journalist|editor|producer|photograph|video|writer/i, "media"],
  [/designer|architect/i, "design"],
  [/laborator|scientist|chemist|biolog|research assistant/i, "science"],
  [/policy|council|public servant|government|officer/i, "government"]
];
// Last words that fit every kind of work, so they say nothing about the industry
const GENERIC_TITLE_WORDS = new Set(["manager", "officer", "assistant", "coordinator", "worker", "operator", "technician", "specialist", "consultant", "analyst", "advisor", "adviser", "administrator", "representative", "supervisor", "leader", "attendant", "handler", "hand", "associate", "executive", "director", "trainee", "apprentice", "intern", "clerk", "agent", "planner", "controller", "inspector", "driver"]);
let titleLastWord = null;
// The kind of work a job title belongs to: an exact match in our list, then a title with the same last word, then keywords
function titleKind(title) {
  const t = String(title || "").trim();
  if (!t) return "";
  const exact = jobTypeForTitle(t);
  if (exact) return exact;
  const last = t.toLowerCase().split(/\s+/).pop();
  if (last.length > 3 && !GENERIC_TITLE_WORDS.has(last)) {
    if (!titleLastWord) { titleLastWord = new Map(); for (const [name, k] of jobTitleIndex()) { const w = name.toLowerCase().split(/\s+/).pop(); if (!titleLastWord.has(w)) titleLastWord.set(w, k); } }
    const k = titleLastWord.get(last);
    if (k) return k;
  }
  const hint = TITLE_HINTS.find(([re]) => re.test(t));
  return hint ? hint[1] : "";
}
const VOLUNTEER_ORGS = "Red Cross;St John Ambulance;Surf Life Saving Australia;RSPCA;Rotary Club;Lions Club;Local sporting club;School parents' association;Foodbank;OzHarvest;The Salvation Army;St Vincent de Paul Society;Clean Up Australia;Landcare;Meals on Wheels;Lifeline;headspace;Scouts Australia;Girl Guides;State Emergency Service (SES);Rural Fire Service;Country Fire Authority;Local church;Local library;Local council";
let empDirCache = {};
function directoryNames(industries) {
  const key = industries.join(",");
  if (empDirCache[key] && empDirCache[key].n === employers().length) return empDirCache[key].list;
  const list = employers().filter(e => industries.includes(e.industry)).map(e => e.name.replace(/\s*\((?:[^)]*)\)\s*$/, ""));
  empDirCache[key] = { n: employers().length, list };
  return list;
}
// What the Employer box offers: businesses that someone with this job title could really have worked for
function employersFor(inp) {
  const p = P(), path = (inp && inp.dataset.path) || "", parts = path.split(".");
  let title = "";
  if (parts[0] === "experience" || parts[0] === "volunteering") title = (p[parts[0]][+parts[1]] || {}).title;
  else if (parts[0] === "target") title = p.target.title;
  else if (parts[0] === "referees") title = (p.referees.list[+parts[2]] || {}).role;
  title = val(title);
  const mine = [val(p.target.company), ...p.experience.map(e => val(e.org)), ...p.volunteering.map(e => val(e.org))];
  if (parts[0] === "volunteering") return [...mine, ...VOLUNTEER_ORGS.split(";")];
  const kw = EMP_KEYWORDS.filter(([re]) => re.test(title));
  const exclusive = kw.some(k => k[2]);
  const kind = titleKind(title);
  const out = [...mine, ...kw.flatMap(k => k[1].split(";"))];
  if (!exclusive && kind) out.push(...(EMP_TYPE_SRC[kind] || "").split(";"), ...directoryNames(EMP_IND[kind] || []));
  // a title we can't place: the big employers that hire for casual and entry-level work, not the specialist firms
  if (!kw.length && !kind) out.push(...MORE_EMPLOYERS.split(";"));
  if (!out.includes("Self-employed")) out.push("Self-employed");
  if (!out.includes("Family business")) out.push("Family business");
  return out.filter(Boolean);
}

/* --- A broad subject needs a follow-up: "Professional Engineering" → which kind? Added to the qualification's name --- */
// (VAGUE_SUBJECTS and vagueSubject are in 19-profile.js, because the profile reads them when it loads)
// The follow-up box, shown for the first subject of a university-level qualification
function detailQ(e, base, i) {
  const lv = qualLevel(e.level), v = lv && (lv.school || lv.vet || lv.k === "short" || lv.k === "other") ? null : vagueSubject(e.subject);
  if (!v) return "";
  return q(base + ".detail", v[1], { ph: "e.g. " + v[2].split(";")[0], suggest: "detail", cap: "title", opt: true, hint: `“${esc(val(e.subject))}” on its own is broad. Adding this puts it in the name of your qualification.` });
}

/* --- Tools and equipment from a job's answers go straight into Skills › Software and tools --- */
function toolsFromAnswer(text) {
  const canon = t => { const f = [...findSkills(norm(t)).values()][0]; return f ? f.skill.name : t; };
  return listOf(val(text)).map(t => t.replace(/^(and|or|also)\s+/i, "").replace(/[.\s]+$/, "").trim()).filter(t => t && t.length < 32 && wordCount(t) <= 4).map(canon).map(t => t.length > 2 && t === t.toLowerCase() ? t[0].toUpperCase() + t.slice(1) : t);
}
function toolsToSkills(entry, now) {
  const p = P(), all = toolsFromAnswer(now), had = new Set(String(entry.toolsSeen || "").split("|").filter(Boolean));
  entry.toolsSeen = all.map(t => t.toLowerCase()).join("|");
  const have = new Set(Object.values(p.skills).flat().map(s => s.toLowerCase()));
  const add = [];
  for (const t of all) { const k = t.toLowerCase(); if (!had.has(k) && !have.has(k) && !add.some(x => x.toLowerCase() === k)) add.push(t); }
  if (!add.length) return;
  const room = Math.max(0, 40 - p.skills.software.length);
  const keep = add.slice(0, room);
  if (!keep.length) return;
  p.skills.software.push(...keep);
  touchProfile("builder");
  actToast(`Added ${listJoin(keep.slice(0, 3))}${keep.length > 3 ? ` and ${keep.length - 3} more` : ""} to Skills › Software and tools.`, () => { p.skills.software = p.skills.software.filter(s => !keep.includes(s)); touchProfile("builder"); if (B_STEPS[builder.step].key === "skills") renderBuilder(false); });
}

/* --- Bullet points, most important first: results and numbers, then ownership and scope, then routine tasks --- */
function bulletScore(t) {
  const s = String(t || ""), w = wordCount(s);
  let n = 0;
  const nums = numsOf(s);
  if (nums.length) n += 3 + Math.min(1.5, (nums.length - 1) * 0.5);
  if (/[%$]|\b\d+(?:,\d{3})+\b|\b\d+\s?(?:k|m|x)\b/i.test(s)) n += 1.5;
  if (/\b(increas|reduc|cut|sav|grew|grow|improv|boost|rais|doubl|tripl|halv|exceed|won|achiev|surpass|generat|launch|lifted|lowered|shortened)\w*/i.test(s)) n += 2;
  if (/^(led|lead|manag|supervis|launch|built|build|design|develop|establish|negotiat|train|mentor|coordinat|direct|oversaw|spearhead|implement|introduc|creat|streamlin)/i.test(s)) n += 1.5;
  if (/\b(team of|staff|people|customers?|clients?|budget|stakeholders?|team)\b/i.test(s)) n += 1;
  if (/^(clean|stack|tidy|restock|answer|greet|file|sweep|wash|carr|pack|open|clos)/i.test(s)) n -= 1;
  if (w >= 14 && w <= 30) n += 0.5;
  return n;
}
const rankBullets = arr => arr.map((b, i) => [b, i, bulletScore(b)]).sort((a, b) => b[2] - a[2] || a[1] - b[1]).map(x => x[0]);

/* --- Finishing a job: the resume strength goes up, and "+5" floats up from it --- */
function scorePop(before, after) {
  const d = after - before;
  if (d <= 0) return;
  const el = document.createElement("span");
  el.className = "score-pop"; el.setAttribute("role", "status");
  el.textContent = `+${d}`;
  const label = document.createElement("span"); label.className = "visually-hidden"; label.textContent = ` Resume strength is up ${d} points.`; el.append(label);
  const host = $("bScoreMini"), r = host ? host.getBoundingClientRect() : null;
  const seen = r && r.width && r.bottom > 0 && r.top < innerHeight;
  el.style.left = (seen ? r.right - 36 : innerWidth - 80) + "px";
  el.style.top = (seen ? r.top - 4 : 96) + "px";
  document.body.appendChild(el);
  if (host) { host.classList.remove("bump"); void host.offsetWidth; host.classList.add("bump"); }
  setTimeout(() => el.remove(), 2200);
}

/* --- The opening page: bring in a resume or LinkedIn, or start fresh --- */
const isFreshProfile = p => !hasProfile(p) && !p.target.stage && !p.target.jobType && !val(p.target.title) && !p.experience.some(hasContent) && !p.education.some(hasContent);
function applyWelcome() {
  const on = !!builder.welcome, root = $("view-builder");
  if (!root) return;
  const w = $("bWelcome"); if (w) w.hidden = !on;
  for (const sel of [".b-layout", ".view-head .top-actions", ".b-steps"]) { const el = root.querySelector(sel); if (el) el.hidden = on; }
  root.classList.toggle("is-welcome", on);
  // With a resume in the profile, "from profile" is the blue way in; without one it is greyed out and uploading is blue.
  // (A name on its own, from a profile that was only just created, is not a resume.)
  const has = hasResume(P()), pr = $("bwProfile"), up = $("bwUpload");
  if (pr) {
    pr.disabled = !has; pr.classList.toggle("bw-card--go", has); pr.classList.toggle("bw-card--off", !has);
    const t = $("bwProfileText"); if (t) t.textContent = has ? "Use the resume already saved in your profile. We fill in your jobs, study and skills." : "There's no resume in your profile yet. Upload one, or your LinkedIn, and it will be here next time.";
  }
  if (up) up.classList.toggle("bw-card--go", !has);
}
function openImportPanel(focusId) {
  const box = $("bImport"); if (!box) return;
  box.hidden = false;
  const ub = $("bwUpload"); if (ub) ub.setAttribute("aria-expanded", "true");
  const ib = $("bImportBtn"); if (ib) ib.setAttribute("aria-expanded", "true");
  const fs = $("bFromScanner"); if (fs) fs.hidden = !(els.resume.value.trim() && wordCount(els.resume.value) > 40);
  smoothToBottom(box, 16);
  const f = $(focusId); if (f) setTimeout(() => f.focus({ preventScroll: true }), 120);
}
function showWelcome(focusId) {
  builder.welcome = true;
  renderBuilder(false);
  window.scrollTo({ top: 0 });
  if (focusId) openImportPanel(focusId);
}
onInit(() => {
  const w = $("bWelcome");
  if (!w) return;
  w.addEventListener("click", e => {
    const b = e.target.closest("[data-bw]");
    if (!b) return;
    if (b.dataset.bw === "upload") openImportPanel("bPick");
    else if (b.dataset.bw === "profile") { if (!hasResume(P())) return; builder.welcome = false; builder.step = 0; renderBuilder(true); }
    else { builder.welcome = false; builder.step = 0; renderBuilder(true); }
  });
  // Bringing something in doesn't move on by itself: Next does. If no AI is connected, ask first.
  const next = $("bImportNext");
  if (next) {
    next.innerHTML = `Next: ${esc(B_STEPS[0].label)} <span aria-hidden="true">→</span>`;
    next.addEventListener("click", async () => {
      if (!(await aiIsConnected())) {
        const choice = await askConnectAi();
        if (choice === "connect") { await openConnectPopup(); if (!(await aiIsConnected())) return; }   // (a pop-up: back here when it closes, and on if an AI is connected now)
        else if (choice !== "skip") return;   // (closed with Esc: stay here)
      }
      builder.welcome = false; builder.step = 0; renderBuilder(true);
      window.scrollTo({ top: 0 });
    });
  }
});
// Is an AI ready to write right now? A connected key or model, or a browser AI that is already on this computer
// (one that still has to download its model doesn't count: nothing has been connected yet)
async function aiIsConnected() {
  if (USER_ENGINES.has(aiCfg.engine) && aiUsable(aiCfg.engine)) return true;
  return aiChromeAllowed() && (await chromeAIRaw()) === "available";
}
// "No AI connected" pop-up → "connect", "skip" or "" (closed)
function askConnectAi(what = "your bullet points and summary") {
  return new Promise(resolve => {
    let d = $("aiAskDlg");
    if (!d) { d = document.createElement("dialog"); d.id = "aiAskDlg"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "aiAskH"); document.body.appendChild(d); }
    d.innerHTML = `<form method="dialog" class="jf-dialog-card"><h2 id="aiAskH">Connect an AI?</h2><p>No AI is connected yet. An AI writes ${esc(what)} in your own words.</p><p class="small muted">You can carry on without one. Job Finder will use its built-in templates instead, and you can connect an AI any time.</p><div class="b-actions"><button class="btn ghost" value="skip" type="submit" formnovalidate>Continue without AI</button><button class="btn primary" value="connect" type="submit" formnovalidate>Connect an AI</button></div></form>`;
    // answered by a button (the form's submit) or closed another way (Esc): whichever comes first
    let done = false;
    const fin = v => { if (done) return; done = true; resolve(v === "connect" || v === "skip" ? v : ""); };
    d.querySelector("form").addEventListener("submit", e => fin(e.submitter ? e.submitter.value : ""));
    d.addEventListener("close", () => fin(d.returnValue), { once: true });
    d.returnValue = ""; d.showModal();
  });
}
