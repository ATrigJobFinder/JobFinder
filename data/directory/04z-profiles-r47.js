/* ===================== Directory profiles, round 47: clinical research, biotech and medtech, fertility, radiology and private hospitals =====================
   Uses privateHospital (round 21). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const biotechCompany = (name, what, spec, hq) => ({
  about: [
    `${name} is ${what}. It develops its products in the laboratory and through clinical trials, works with regulators and partners, and raises money from investors to fund its research.`,
    "It employs research scientists and laboratory staff, clinical trial and regulatory affairs staff, manufacturing and quality staff, business development and investor relations staff, and finance and administration staff. Many roles need a science or medical degree, and some need a PhD, and teams are usually small."
  ],
  spec, hq,
  roles: ["Research scientist", "Clinical trial manager", "Regulatory affairs", "Quality", "Business development"]
});
const radiologyProvider = (name, where) => ({
  about: [
    `${name} is a provider of diagnostic imaging ${where}. Its clinics offer X-ray, ultrasound, CT, MRI and other scans, and radiologists report the results to referring doctors.`,
    "It employs radiologists, radiographers and sonographers, nuclear medicine technologists, patient services and reception staff, clinic managers, and administration and corporate staff. Clinical roles need a recognised degree and registration, and many people start in patient services or as graduate radiographers."
  ],
  spec: ["Diagnostic imaging", "Radiology", "Sonography", "MRI and CT", "Patient services"],
  roles: ["Radiographer", "Sonographer", "Radiologist", "Patient services", "Clinic manager"]
});
Object.assign(DIR_PROFILES, {
  "Novotech": { about: ["Novotech is a clinical research organisation, founded in Sydney, that runs clinical trials for biotech and pharmaceutical companies across Asia-Pacific and other regions. It manages trial sites, regulatory approvals, data and patient safety.", "It employs clinical research associates and project managers, medical and regulatory staff, data managers and biostatisticians, start-up and site contracts staff, business development staff, and finance and corporate staff. Many roles suit people with science, nursing or health backgrounds, and graduate and entry-level programs are advertised on its careers page."], spec: ["Clinical trials", "Clinical research associates", "Regulatory affairs", "Data and biostatistics", "Project management"], hq: "Sydney, NSW", roles: ["Clinical research associate", "Project manager", "Regulatory affairs", "Data manager", "Biostatistician"] },
  "Nucleus Network": { about: ["Nucleus Network is an Australian company that runs early-phase clinical trials, where new medicines and vaccines are first tested in people. It runs specialist clinical trial units where participants stay under medical supervision.", "It employs doctors and research nurses, clinical trial coordinators and operations staff, pharmacy and laboratory staff, recruitment and participant liaison staff, data and quality staff, and finance and administration staff. Clinical roles need registration, and many roles suit nurses and people with science or health degrees."], spec: ["Early-phase clinical trials", "Research nursing", "Participant recruitment", "Clinical operations", "Quality"], roles: ["Research nurse", "Clinical trial coordinator", "Doctor", "Recruitment", "Quality"] },
  "Avita Medical": biotechCompany("Avita Medical", "a regenerative medicine company that makes the RECELL system, which uses a patient's own skin cells to help treat burns and wounds", ["Regenerative medicine", "Medical devices", "Burns and wound care", "Clinical affairs", "Regulatory affairs"], ""),
  "Sirtex Medical": biotechCompany("Sirtex Medical", "an Australian medical technology company, based in Sydney, that makes a radiation therapy for liver cancer and sells it to hospitals in many countries", ["Cancer therapy", "Medical devices", "Manufacturing and quality", "Clinical affairs", "Sales and clinical support"], "Sydney, NSW"),
  "Immutep": biotechCompany("Immutep", "a Sydney biotech company that develops immunotherapy treatments for cancer and autoimmune disease", ["Immunotherapy", "Cancer treatment", "Clinical trials", "Drug development", "Regulatory affairs"], "Sydney, NSW"),
  "ImpediMed": biotechCompany("ImpediMed", "a Brisbane medical technology company that makes devices for measuring fluid in the body, used in cancer and heart care", ["Medical devices", "Bioimpedance technology", "Clinical affairs", "Regulatory affairs", "Sales and clinical support"], "Brisbane, QLD"),
  "City Fertility": { about: ["City Fertility is an Australian group of fertility clinics. Its doctors, scientists and nurses provide IVF and other fertility treatment, tests and counselling to people and couples who want to have a baby.", "It employs fertility specialists, embryologists and scientists, nurses and counsellors, clinic and patient services staff, marketing staff, and finance and corporate staff. Clinical roles need registration or a science degree, and many people start in clinic administration or nursing."], spec: ["Fertility treatment", "IVF and embryology", "Fertility nursing", "Counselling", "Patient services"], roles: ["Fertility nurse", "Embryologist", "Patient services", "Counsellor", "Clinic manager"] },
  "Lake Imaging": radiologyProvider("Lake Imaging", "in Victoria"),
  "Jones Radiology": radiologyProvider("Jones Radiology", "in South Australia"),
  "Envision Medical Imaging": radiologyProvider("Envision Medical Imaging", "in Melbourne"),
  "Pindara Private Hospital": privateHospital("Pindara Private Hospital", "on the Gold Coast, Queensland"),
  "John Flynn Private Hospital": privateHospital("John Flynn Private Hospital", "on the Gold Coast, Queensland")
});
