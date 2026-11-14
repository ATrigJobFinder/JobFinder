/* ===================== Directory profiles, round 22: theatre, music and libraries, one independent school =====================
   Uses artsCompany (round 10) and schoolProfile (round 6). Two paragraphs each; anything that couldn't be confirmed is left out. */
const stateLibrary = (name, where, extra) => ({
  about: [
    `${name} is the state library for ${where}. It collects and preserves books, newspapers, maps, photographs and other records of the state's history, makes them available to the public in its buildings and online, and supports public libraries${extra ? ", " + extra : ""}.`,
    "It employs librarians and archivists, conservators and digitisation staff, collection and cataloguing staff, client and reference service staff, exhibition and program staff, technology and data staff, and finance, marketing and corporate staff. Many roles suit people with library, archives, history or information technology qualifications."
  ],
  spec: ["Library collections", "Archives and heritage", "Digitisation", "Reference and client services", "Public programs"],
  roles: ["Librarian", "Archivist", "Conservator", "Client services", "Digital collections"]
});
Object.assign(DIR_PROFILES, {
  "Bell Shakespeare": artsCompany("Bell Shakespeare", "a national theatre company that stages Shakespeare and other classic and new plays, and tours its productions as well as running education programs for students and teachers", "Sydney, NSW"),
  "West Australian Symphony Orchestra": artsCompany("The West Australian Symphony Orchestra", "the state's professional orchestra, which plays concerts at the Perth Concert Hall and other venues and runs education and community programs", "Perth, WA"),
  "Malthouse Theatre": artsCompany("Malthouse Theatre", "a Melbourne theatre company that presents new Australian work and contemporary productions at its Southbank theatres", "Melbourne, VIC"),
  "Musica Viva Australia": artsCompany("Musica Viva Australia", "a national presenter of chamber music, which brings Australian and international musicians to concerts across the country and runs music education programs in schools", "Sydney, NSW"),
  "State Library of South Australia": stateLibrary("The State Library of South Australia", "South Australia", "including with its collection of South Australian history"),
  "State Library of Western Australia": stateLibrary("The State Library of Western Australia", "Western Australia", "including with the state's heritage collection"),
  "Pulteney Grammar School": schoolProfile("Pulteney Grammar School", "an independent co-educational school", "Adelaide, South Australia")
});
