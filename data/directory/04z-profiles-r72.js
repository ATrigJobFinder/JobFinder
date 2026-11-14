/* ===================== Directory profiles, round 72: car dealer groups, funeral and memorial services, pet care and animal welfare =====================
   Uses retailBrand (round 10). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const dealerGroup = (name, where) => ({
  about: [
    `${name} is an Australian car dealership group ${where}. Its dealerships sell new and used cars, service and repair them, and sell parts and finance.`,
    "It employs sales consultants and managers, service advisers and workshop technicians, parts staff, finance and insurance staff, detailers and customer service staff, and head office staff. Many roles are in dealerships, and apprenticeships and sales roles are common ways in."
  ],
  spec: ["Car dealerships", "New and used vehicle sales", "Service and repairs", "Parts", "Finance and insurance"],
  roles: ["Sales consultant", "Service adviser", "Technician", "Parts", "Finance and insurance"]
});
const funeralProvider = (name, what) => ({
  about: [
    `${name} is ${what}. It arranges funerals and cremations, cares for the person who has died, supports families through the process and runs services and memorials.`,
    "It employs funeral arrangers and directors, mortuary and embalming staff, funeral assistants and drivers, celebrants and chapel staff, administration and customer service staff, and head office staff. The work calls for care and sensitivity, includes on-call and weekend hours, and training is usually given on the job."
  ],
  spec: ["Funeral services", "Cremation", "Family support", "Mortuary care", "Memorials"],
  roles: ["Funeral arranger", "Funeral director", "Funeral assistant", "Mortuary staff", "Administration"]
});
const rspcaState = (name, where) => ({
  about: [
    `${name} is the RSPCA in ${where}, a charity that cares for animals. It runs shelters and adoption programs, inspectors who respond to animal cruelty, vet clinics and education programs, and relies on donations and volunteers.`,
    "It employs animal carers and shelter attendants, veterinarians and veterinary nurses, inspectors, adoption and customer service staff, volunteer coordinators, and fundraising and administration staff. Many roles are hands-on animal care roles, and volunteers are a large part of the work."
  ],
  spec: ["Animal welfare", "Shelter and adoption", "Inspectorate", "Veterinary care", "Volunteers"],
  roles: ["Animal carer", "Veterinary nurse", "Inspector", "Adoption officer", "Fundraising"]
});
Object.assign(DIR_PROFILES, {
  "Barry Bourke Group": dealerGroup("Barry Bourke Group", "in Melbourne"),
  "John Hughes Group": dealerGroup("John Hughes Group", "in Melbourne"),
  "Zagame Automotive": dealerGroup("Zagame Automotive", "in Melbourne"),
  "Ateco Automotive": dealerGroup("Ateco Automotive", "in Sydney"),
  "White Lady Funerals": funeralProvider("White Lady Funerals", "a Sydney funeral provider with funeral homes and chapels across New South Wales"),
  "Simplicity Funerals": funeralProvider("Simplicity Funerals", "an Australian funeral provider that offers simple, lower-cost funerals and cremations"),
  "Tobin Brothers Funerals": funeralProvider("Tobin Brothers Funerals", "a Melbourne funeral provider with funeral homes across Victoria"),
  "Bare Cremation": funeralProvider("Bare Cremation", "an Australian funeral provider that offers direct cremation and simple farewells"),
  "Pinegrove Memorial Park": { about: ["Pinegrove Memorial Park is a cemetery and memorial park in Sydney's west. It offers burial and cremation services, memorials and gardens, and chapels for services, and helps families to plan and remember.", "It employs family service and memorial consultants, grounds and gardening staff, groundsmen and burial staff, chapel and administration staff, and management staff. The work calls for care and sensitivity, and many roles are outdoors or involve helping families at difficult times."], spec: ["Cemetery and memorial services", "Burial and cremation", "Grounds and gardens", "Family service", "Memorials"], hq: "Minchinbury, NSW", roles: ["Family service consultant", "Groundsman", "Gardener", "Chapel staff", "Administration"] },
  "Pet Pals": { about: ["Pet Pals is an Australian pet care service. Its local franchise owners and carers visit homes for pet sitting, dog walking and other care, and help owners who are at work or away.", "It employs pet sitters and dog walkers, franchise owners, franchise support and field staff, customer service and booking staff, and marketing and head office staff. Many roles are part-time and flexible and suit animal lovers, students and people who want to run a small business."], spec: ["Pet care", "Dog walking and pet sitting", "Franchising", "Customer service", "Small business"], roles: ["Pet sitter", "Dog walker", "Franchise owner", "Franchise support", "Customer service"] },
  "Mad Paws": { about: ["Mad Paws is an Australian online pet care marketplace, based in Sydney. Pet owners use its website and app to find and book sitters, walkers, boarding and other care, and the company vets and supports the carers.", "It employs software engineers, product and design staff, customer support and trust and safety staff, marketing and community staff, partnerships and finance staff. It suits people with technology, marketplace, customer service or pet industry backgrounds."], spec: ["Pet care marketplace", "Software engineering", "Customer support", "Trust and safety", "Marketing"], hq: "Sydney, NSW", roles: ["Software engineer", "Customer support", "Trust and safety", "Marketing", "Product manager"] },
  "Pet Supermarket": retailBrand("Pet Supermarket", "an Australian pet supplies retailer that sells pet food, toys, accessories and health products"),
  "RSPCA Tasmania": rspcaState("RSPCA Tasmania", "Tasmania"),
  "RSPCA NT": rspcaState("RSPCA NT", "the Northern Territory"),
  "WIRES": { about: ["WIRES is a wildlife rescue charity in New South Wales. Its trained volunteers rescue, treat and release sick, injured and orphaned native animals, and it runs a rescue hotline and education programs.", "It employs rescue and operations staff, hotline and customer service staff, training and education staff, volunteer coordinators, fundraising and communications staff, and finance and administration staff. Most of its work is done by volunteers, and paid roles suit people with animal care, community or fundraising backgrounds."], spec: ["Wildlife rescue", "Animal care", "Volunteer training", "Education", "Fundraising"], hq: "Sydney, NSW", roles: ["Rescue coordinator", "Hotline officer", "Trainer", "Volunteer coordinator", "Fundraising"] }
});
