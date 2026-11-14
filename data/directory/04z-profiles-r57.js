/* ===================== Directory profiles, round 57: managed IT services, government digital and cyber security =====================
   Uses techConsultancy (round 24). Two paragraphs each; anything that couldn't be confirmed (including who owns what) is left out. */
const managedItProvider = (name, what) => ({
  about: [
    `${name} is ${what}. It runs and supports computer systems, networks, cloud services and security for business and government customers, and advises them on technology.`,
    "It employs service desk and support technicians, systems, network and cloud engineers, security specialists, project and service delivery managers, sales and account managers, and finance and corporate staff. It suits people with IT, networking or technical support backgrounds, and the service desk is a common way in."
  ],
  spec: ["Managed IT services", "Service desk and support", "Cloud and infrastructure", "Cyber security", "Project delivery"],
  roles: ["Service desk analyst", "Systems engineer", "Network engineer", "Security analyst", "Account manager"]
});
Object.assign(DIR_PROFILES, {
  "Brennan IT": managedItProvider("Brennan IT", "an Australian managed IT services provider based in Sydney"),
  "Ionata Digital": techConsultancy("Ionata Digital", "a Canberra digital services company that builds websites and digital systems for government and other clients"),
  "Penten": { about: ["Penten is a Canberra cyber security company that makes secure communications and data products for government and defence, and provides cyber security services.", "It employs software and security engineers, cryptography and systems specialists, test and quality staff, product and project managers, sales and customer support staff, and finance and corporate staff. Many roles need Australian citizenship and a security clearance, and they suit people with computer science, engineering or cyber security backgrounds."], spec: ["Cyber security", "Secure communications", "Software engineering", "Government and defence", "Systems engineering"], hq: "Canberra, ACT", roles: ["Security engineer", "Software engineer", "Systems engineer", "Test engineer", "Project manager"] },
  "Interactive": managedItProvider("Interactive", "an Australian provider of managed IT, cloud, data centre and network services")
});
