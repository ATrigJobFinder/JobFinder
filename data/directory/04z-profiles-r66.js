/* ===================== Directory profiles, round 66: Aboriginal organisations and a health institute, Northern Territory and expedition tourism =====================
   Uses aboriginalCommunityOrg (round 25), landBody and instituteProfile (round 10) and tourismAttraction (round 39). Two paragraphs each; anything that couldn't be confirmed is left out. */
Object.assign(DIR_PROFILES, {
  "Tangentyere Council": aboriginalCommunityOrg("Tangentyere Council", "in Alice Springs in the Northern Territory", "provides housing, community services, employment, children and family programs and advocacy for Aboriginal people who live in the town camps and other communities in and around Alice Springs"),
  "Lowitja Institute": instituteProfile("The Lowitja Institute", "Australia's national institute for Aboriginal and Torres Strait Islander health research, led by Aboriginal and Torres Strait Islander people", "Melbourne, VIC", ["Aboriginal and Torres Strait Islander health", "Health policy", "Community-led research"]),
  "North Queensland Land Council": landBody("The North Queensland Land Council", "North Queensland", "a native title representative body", "including native title claims, agreements and land management", "Townsville, QLD"),
  "Kakadu Tourism": tourismAttraction("Kakadu Tourism", "a Northern Territory tourism operator that runs river cruises, tours and accommodation at Cooinda, in Kakadu National Park", "in the Northern Territory"),
  "Nitmiluk Tours": tourismAttraction("Nitmiluk Tours", "a Northern Territory tourism operator that runs gorge cruises, tours and accommodation at Nitmiluk National Park, near Katherine", "in the Northern Territory"),
  "Coral Expeditions": tourismAttraction("Coral Expeditions", "an Australian expedition cruise company, based in Cairns, that runs small-ship cruises along the Great Barrier Reef, the Kimberley and other places", ""),
  "True North Adventure Cruises": tourismAttraction("True North Adventure Cruises", "an Australian expedition cruise company that runs small-ship cruises on the Kimberley coast, with helicopters and fishing and exploring on shore", "in Western Australia")
});
