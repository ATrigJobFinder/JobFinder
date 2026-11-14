/* ===================== Directory employers: advice for applying, by kind of employer =====================
   The full guides hold advice taken from each company's own hiring pages. The directory employers don't have that yet, so their Advice tab
   shows general advice for the kind of employer (hospital, council, law firm, airline…). It is labelled "Industry tip" on the page so nobody
   mistakes it for something the employer said. Each block: look (what they look for), resume, cover, interview. */
const DIR_ADVICE = {
  accounting: {
    look: ["A finished or nearly finished accounting, commerce or business degree, and a plan to complete the professional accounting qualification (CA ANZ or CPA).", "Accuracy, attention to detail and comfort with Excel and accounting software such as Xero or MYOB.", "Clear writing and the confidence to talk to clients, because staff in mid-sized firms often meet clients early."],
    resume: ["Put your degree, results and the units that matter (audit, tax, financial reporting) near the top.", "Include any part-time work with money, customers or data, and any bookkeeping or tax-help volunteering."],
    cover: ["Say why you want to work in a mid-sized or smaller practice, and name a service the firm offers.", "Give one example that shows accuracy and follow-through, such as a project where you checked numbers."],
    interview: ["Expect questions on teamwork, deadlines and handling a mistake you found in your own work.", "Be ready for a short numeracy or Excel test, and ask about study support and rotation across audit, tax and advisory."]
  },
  agriculture: {
    look: ["Willingness to work in regional areas and on shifts, and a practical, safety-first attitude.", "Relevant study or experience: food technology, agriculture, science, engineering, trades or supply chain.", "Reliability: licences (car, forklift, heavy vehicle where relevant) and the ability to pass a medical and drug and alcohol screen."],
    resume: ["List licences, tickets and certificates (forklift, HACCP, chemical handling) in their own section.", "Show practical experience on farms, in factories, in kitchens or in warehouses, with what you were responsible for."],
    cover: ["Say why you want to work with food or farming and name a product or part of the business you know.", "Be clear about where you can work and when you can start, because many roles are regional or seasonal."],
    interview: ["Expect questions on safety, working in a team and what you would do if you saw an unsafe practice.", "Ask about rosters, training, and how seasonal workers move into permanent roles."]
  },
  banking: {
    look: ["Customer focus, integrity and an understanding of regulation, because financial services are heavily regulated.", "A degree in finance, business, economics, law, IT or data for professional roles, or customer service experience for branch and contact centre roles.", "Careful, accurate work with numbers and documents."],
    resume: ["Lead with results: targets met, customer scores, accuracy rates and projects.", "Show any experience with money, customer service or data, even in retail or hospitality."],
    cover: ["Explain why this type of institution suits you (for example customer-owned, super fund, insurer, or fintech) and name something specific about it.", "Show you understand the role of trust in financial services with a real example of handling something sensitive well."],
    interview: ["Expect behavioural questions: a time you dealt with an upset customer, spotted a risk or met a deadline.", "Practise explaining a financial idea in plain English, and be ready for a police check and a credit check."]
  },
  community: {
    look: ["Genuine commitment to the mission and the people the organisation supports.", "Relevant qualifications (community services, social work, disability, youth work, nursing) and lived experience where valued.", "Resilience, boundaries and the ability to work as part of a team in demanding situations."],
    resume: ["Include volunteering, placements and lived experience alongside paid work, because it counts in this sector.", "List checks and certificates: Working With Children Check, NDIS Worker Screening, First Aid and a police check."],
    cover: ["Address the selection criteria if there are any, with a short example for each (situation, what you did, result).", "Say why this cause matters to you, in your own words."],
    interview: ["Expect scenario questions (a client in crisis, a conflict with a colleague, a safety concern) and questions about boundaries and self-care.", "Prepare examples that show respect, listening and reflection, and ask about supervision and training."]
  },
  construction: {
    look: ["Safety first: a current White Card (or equivalent) and a habit of speaking up about hazards.", "A degree or trade qualification in engineering, building, quantity surveying, planning or property for professional roles.", "Teamwork on site and the ability to handle pressure and deadlines."],
    resume: ["Show your tickets and licences (White Card, working at heights, driver's licence) and any site, trade or vacation work.", "Describe projects with size, your role and the result, such as value, area or program."],
    cover: ["Name a project the company has built or a development it manages, and say what interests you about it.", "Show practical experience, even from site visits, a trade or a student project."],
    interview: ["Expect safety questions (what would you do if you saw someone working unsafely) and questions on teamwork and problem solving.", "Ask about site rotations, mentoring and support for completing registration or a degree."]
  },
  consulting: {
    look: ["Structured problem solving, strong analytical skills and clear communication.", "Strong academic results and evidence you can learn quickly: projects, leadership, competitions.", "Comfort with spreadsheets, data and presenting to senior people."],
    resume: ["Keep it to one page and quantify results (numbers, percentages, time saved) wherever you can.", "Show leadership and teamwork: clubs, case competitions, group projects and part-time jobs."],
    cover: ["Say why consulting and why this firm, with a specific reason such as a type of project or industry focus.", "Give one example of solving a messy problem and what it taught you."],
    interview: ["Practise case interviews and market sizing out loud, and structure your answers before you speak.", "Prepare two or three stories showing leadership, teamwork and handling feedback."]
  },
  defence: {
    look: ["Australian citizenship (for most roles) and willingness to go through security vetting, which can take months.", "Engineering, IT, science or trade qualifications, and a clean background and finances.", "Reliability and discretion, because you may work with sensitive information."],
    resume: ["List your qualifications, clearances held (if any), systems or tools you know and projects with outcomes.", "Show stable work and study history, because gaps may be asked about during vetting."],
    cover: ["Say why you want to work on defence capability and name a platform or program the company works on.", "Be open about your citizenship and eligibility for a clearance."],
    interview: ["Expect technical questions in your field, plus questions on teamwork and working to strict processes.", "Be ready to talk about your history in detail, and ask how long the clearance process takes."]
  },
  education: {
    look: ["Commitment to students and the education sector, and the right qualifications and registration for the role.", "Teamwork, communication and the ability to work with a wide range of people.", "Relevant checks: Working With Children Check and a police check."],
    resume: ["Lead with qualifications and registration (teacher registration, degrees, trade certificates), then experience.", "Show student-facing work, tutoring, placements and volunteering."],
    cover: ["Address the selection criteria one by one, with a short example for each.", "Say what draws you to this institution and its students."],
    interview: ["Expect behavioural questions on managing difficult situations, working with different learners and teamwork.", "Prepare examples and a short answer on how you would support student wellbeing."]
  },
  energy: {
    look: ["Safety culture, practical or technical skills and a willingness to work shifts, in regional areas or on call.", "Engineering, trade, science or data qualifications for most technical roles.", "Interest in the energy transition and in reliability, because outages affect everyone."],
    resume: ["List tickets, licences and trade qualifications, such as electrical licence, high-voltage training and working at heights.", "Show projects, maintenance work and any site or plant experience, with results."],
    cover: ["Say why you want to work in energy or water and name a project or asset of the company.", "Give a real example that shows safe working and reliability."],
    interview: ["Expect safety scenarios, technical questions in your field and questions on teamwork and working under pressure.", "Ask about apprenticeships or graduate rotations, rosters, and training for licences."]
  },
  engineering: {
    look: ["An engineering degree (or in progress) and a plan for professional registration such as Chartered status.", "Technical skills, project experience and teamwork.", "Clear writing and the ability to explain technical ideas simply."],
    resume: ["Lead with your degree, grades and engineering projects, including your role and the result.", "Include software and tools you know (AutoCAD, Civil 3D, Revit, MATLAB) and any site or vacation experience."],
    cover: ["Name a project the firm has worked on and say what interests you about it.", "Show that you want to learn on site as well as in the office."],
    interview: ["Expect technical questions from your discipline and questions on teamwork, safety and communicating with non-engineers.", "Ask about mentoring, rotations and support for registration."]
  },
  government: {
    look: ["A clear match to the selection criteria, each answered with specific examples.", "Australian citizenship (for most federal roles) and willingness to complete a police check and sometimes a security clearance.", "Integrity, communication and the ability to work with the public or stakeholders."],
    resume: ["Match your resume to the duties and capabilities in the job pack, using the same language.", "List qualifications, work history with dates and your referees' details."],
    cover: ["Write a short statement addressing each selection criterion with the situation, your action and the result.", "Keep it to the page limit given, and show you understand the agency's role."],
    interview: ["Expect structured behavioural questions in panel interviews, so prepare examples using a method such as STAR.", "Know the agency's work and its values, and ask about training and career pathways."]
  },
  emergency: {
    look: ["Fitness, integrity, resilience and calm decision-making under pressure.", "Teamwork, communication and respect for the community you serve.", "Meeting the entry requirements: citizenship or residency, driver's licence, medical, fitness and character checks."],
    resume: ["List relevant qualifications, first aid, licences, volunteering (SES, surf lifesaving, rural fire service) and any customer-facing work.", "Show stable employment history and community involvement."],
    cover: ["Say honestly why you want to serve the community and what you have done to prepare.", "Give an example of staying calm and helping someone in a stressful situation."],
    interview: ["Expect scenario and values-based questions, a panel, and fitness and psychological assessments.", "Prepare for background checks and be open about your history. Start training for the fitness test early."]
  },
  council: {
    look: ["Interest in local communities and public service, and good communication with residents and colleagues.", "Qualifications for the job: planning, engineering, environmental health, community services, finance, customer service, parks or trades.", "Awareness of how local government works, including budgets, local laws and community consultation."],
    resume: ["Match your resume to the position description and list local government, community or customer service experience.", "Include your licences and tickets (driver's licence, White Card, chemical handling) if the role is outdoors."],
    cover: ["Address the selection criteria one by one, giving short examples.", "Say why you want to work for this council and name a service or project in the area."],
    interview: ["Expect a panel with scenario questions on difficult customers, working with the community and conflicting priorities.", "Read the council plan and recent news before the interview, and ask about team structure and development."]
  },
  university: {
    look: ["For professional (non-academic) roles: service focus, organisation and experience in student services, research support, IT, finance, marketing or administration.", "For academic roles: a PhD or equivalent, a research record and teaching experience.", "Commitment to students, equity and working in a large, changing organisation."],
    resume: ["Professional roles: match the position description and highlight service and systems experience. Academic roles: add publications, grants, teaching and supervision.", "Include any university or education sector experience, even as a student employee."],
    cover: ["Address the selection criteria one by one with a short example for each.", "Academic roles: explain your research plan and teaching approach in plain language."],
    interview: ["Expect a panel, behavioural questions and, for academics, a short presentation.", "Ask about workload, support for research or professional development, and how restructures are handled."]
  },
  school: {
    look: ["Teacher registration (or progress towards it), plus the right subject or sector qualifications.", "Commitment to student wellbeing and learning, and the ability to work with families and colleagues.", "Working With Children Check, a police check and a willingness to teach where the need is, including regional areas."],
    resume: ["Lead with registration, qualifications and placements, then paid work with young people.", "Show classroom skills: planning, differentiation, behaviour management, technology and extracurricular contributions."],
    cover: ["Address the selection criteria with short examples from placements or classrooms.", "Say why you want to teach in this system, and what you offer beyond the classroom."],
    interview: ["Expect questions on classroom management, supporting students with different needs and working with parents.", "Bring a sample lesson plan or portfolio if asked, and ask about mentoring for early-career teachers."]
  },
  tafe: {
    look: ["Current industry experience in the field you want to teach, and a Certificate IV in Training and Assessment (or willingness to complete it).", "A practical, patient teaching style and the ability to work with adult learners of all backgrounds.", "Working With Children Check and a police check, depending on the role."],
    resume: ["Lead with your industry qualifications and recent experience, then any training, mentoring or supervising.", "List the units, licences and tickets you can assess."],
    cover: ["Address the selection criteria and say how your industry experience helps students get jobs.", "Show that you can explain a skill step by step."],
    interview: ["Expect questions on how you would run a class, assess a student and handle disruption.", "You may be asked to present a short practical demonstration. Ask about support for completing your teaching qualification."]
  },
  health: {
    look: ["The right qualifications and current registration (AHPRA for nurses, doctors and allied health), or relevant experience for support roles.", "Compassion, communication and teamwork under pressure, and a commitment to patient safety.", "Immunisations, a police check and a Working With Children or vulnerable people check."],
    resume: ["Lead with registration, qualifications and clinical placements, then experience by area (ward, emergency, community).", "List certifications such as Basic Life Support, manual handling and any specialty training."],
    cover: ["Address the selection criteria with short examples from placements or work.", "Say why you want to work in this service or specialty, and show you understand its patients."],
    interview: ["Expect clinical scenarios, values questions and questions on handling an error or an upset family.", "For graduate programs, apply early and prepare for a panel interview, and ask about rotations and support."]
  },
  hospital: {
    look: ["Current registration (AHPRA) for clinical roles and a commitment to patient safety and teamwork.", "Graduate nurse and midwife programs have fixed application rounds, and a strong placement report helps.", "Immunisation records, a police check and a Working With Children Check."],
    resume: ["Lead with registration, qualifications and your clinical placements, with the wards or areas.", "List Basic Life Support, medication competency and specialty courses."],
    cover: ["Address the selection criteria or the graduate program questions with short examples (situation, action, result).", "Say why you want to work at this hospital or network and what you bring."],
    interview: ["Expect clinical scenarios (a deteriorating patient, a medication error) and values-based questions.", "Practise using the STAR method, and ask about rotations, mentoring and the transition-to-practice program."]
  },
  agedcare: {
    look: ["Patience, respect and compassion for older people, including those with dementia.", "A Certificate III in Individual Support (or willingness to complete it), or nursing registration for nursing roles.", "A police check, immunisations and the ability to work shifts, including weekends."],
    resume: ["List your care qualifications, First Aid and manual handling, plus any caring experience, paid or unpaid.", "Include references from supervisors or placements."],
    cover: ["Say why you want to work in aged care and describe a time you made someone feel respected or comfortable.", "Be clear about your availability and where you can work."],
    interview: ["Expect scenario questions on dementia, privacy, manual handling and what you would do if a resident was distressed.", "Ask about training, ratios, rosters and how the service supports staff wellbeing."]
  },
  hospitality: {
    look: ["Friendly, reliable people who can work quickly with customers on shifts, including nights and weekends.", "A Responsible Service of Alcohol certificate for bars and venues, and a Food Safety certificate for kitchens.", "Willingness to learn, and the ability to work as part of a team."],
    resume: ["List your RSA, food safety, barista and other certificates, and any customer-facing roles with what you did.", "Show reliability, such as long periods in the same job."],
    cover: ["Keep it short and say why you want to work for this brand and what you love about the work.", "State your availability clearly."],
    interview: ["Expect scenario questions on difficult customers, busy shifts and teamwork, and sometimes a trial shift.", "Dress neatly, be on time and ask about training and paths into supervision or management."]
  },
  law: {
    look: ["Strong academic results, and for graduates a clerkship or placement record.", "Clear writing, commercial awareness and teamwork.", "Resilience, integrity and the ability to manage a high workload."],
    resume: ["Lead with your degree, results and any clerkships, paralegal work or placements.", "Add leadership, volunteering (such as community legal centres), languages and moots."],
    cover: ["Say why this firm and practice area, and show you have researched its work and recent matters.", "Make it error-free: for lawyers, a single typo can end an application."],
    interview: ["Expect questions on why law, why the firm, teamwork and an example of managing competing deadlines.", "Be ready to discuss a recent legal or business news story, and a short written exercise may follow."]
  },
  manufacturing: {
    look: ["Safety, reliability and a practical attitude, with willingness to work shifts.", "Trade, engineering, science or supply chain qualifications for technical roles.", "Interest in continuous improvement and quality."],
    resume: ["List tickets, licences and trade certificates (forklift, working at heights, confined space) prominently.", "Show hands-on experience, such as plant, workshop or warehouse roles, with results like downtime or quality."],
    cover: ["Name a product or process of the company and say why it interests you.", "Show your commitment to safety with a real example."],
    interview: ["Expect safety scenarios, technical questions and questions on teamwork and shift work.", "Ask about apprenticeships, rosters and pathways from operator to technician or supervisor."]
  },
  resources: {
    look: ["A safety-first attitude, the ability to work long rosters and often in remote locations.", "Trade, operator, engineering or geoscience qualifications, with a medical and drug and alcohol screen.", "Reliability and teamwork, because sites run around the clock."],
    resume: ["List tickets, licences and induction cards (white card, heavy vehicle licence, working at heights) and recent site experience.", "Show a stable work history, equipment you can operate and any safety achievements."],
    cover: ["Say why you want to work in mining and be clear about roster preferences (FIFO, DIDO or residential).", "Give an example that shows safe working and reliability."],
    interview: ["Expect safety scenarios, questions about rosters and living away from home, and technical questions.", "Be ready for a medical and drug test, and ask about training pathways into operator and supervisor roles."]
  },
  retail: {
    look: ["Friendly, reliable team members who enjoy helping customers and can work shifts, including weekends.", "Willingness to learn product knowledge and meet sales or service targets.", "Honesty and good timekeeping."],
    resume: ["Show customer service and cash-handling experience with what you did and any sales or service results.", "State your availability clearly."],
    cover: ["Keep it short and say why you want to work for this brand, naming a product or store you like.", "Show enthusiasm and reliability with a real example."],
    interview: ["Expect questions on handling a difficult customer, working in a team and your availability.", "Visit a store beforehand, and ask about training and paths to team leader or store manager."]
  },
  services: {
    look: ["Reliability, a positive attitude and the ability to work with a wide range of people and clients.", "Relevant licences, tickets or qualifications for the role (security licence, driver's licence, first aid, recruitment experience).", "Flexible availability and good communication."],
    resume: ["List licences, tickets and certificates first and show reliability with long periods in jobs.", "For recruitment roles, show sales, customer service or relationship experience with targets."],
    cover: ["Say what type of work you want and your availability, and mention a skill that fits the client sector.", "Keep it brief and error-free."],
    interview: ["Expect scenario questions on dealing with difficult people, safety and teamwork, and for recruiters questions on targets and persuasion.", "Be ready for background checks and ask about training and advancement."]
  },
  sport: {
    look: ["Passion for the sport or media, plus professionalism, because jobs are scarce and popular.", "Relevant skills: events, marketing, media, partnerships, community programs, coaching, sport science, finance or technology.", "Flexibility to work evenings, weekends and busy periods."],
    resume: ["Show volunteering, internships and work experience in sport, events or media, with what you achieved.", "Include social media, video, writing, data or sales skills with examples."],
    cover: ["Show you know the organisation and say what you can add beyond being a fan.", "Give one example of delivering an event, campaign or project."],
    interview: ["Expect questions on handling pressure, working unusual hours and teamwork.", "Be ready for a task such as a social post or event plan. Apply early and consider volunteering or casual roles as a path in."]
  },
  club: {
    look: ["Passion for the club and the game, and professionalism, because jobs are scarce and popular.", "Skills in the area you apply for: membership, ticketing, marketing, social media, partnerships, community programs, coaching, sport science, football operations or finance.", "Flexibility to work match days, evenings and weekends."],
    resume: ["Show volunteering, internships or casual work with clubs, events, ticketing or media, with what you achieved.", "Include content, video, data analysis or sales skills with examples."],
    cover: ["Show you know the club's strategy, community work and recent season, and what you can add beyond being a fan.", "Give one example of delivering an event, campaign or project."],
    interview: ["Expect questions on pressure, unusual hours and teamwork, and sometimes a practical task.", "Consider match-day or casual roles and volunteering as a path in. Be ready for a Working With Children Check."]
  },
  tech: {
    look: ["Technical skills for the role (programming, cloud, data, security, design or support) shown with real projects.", "Problem solving, communication and the ability to learn quickly.", "Teamwork in agile teams and the ability to explain technical ideas to non-technical people."],
    resume: ["Link to your GitHub, portfolio or projects and describe what you built, the tools used and the result.", "Keep skills sections honest, listing what you can use today rather than every tool you have seen."],
    cover: ["Say why this product or company, and mention something specific you used or read.", "Show one example of solving a hard problem and learning from it."],
    interview: ["Expect a screening call, a coding or technical exercise, and behavioural questions.", "Practise explaining your thinking aloud, and prepare questions about the team, tools and how the company develops its people."]
  },
  trading: {
    look: ["Strong mathematics, probability and quick, accurate mental arithmetic.", "Programming skills (Python, C++) for quantitative and technology roles, and clear thinking under pressure.", "Competitiveness combined with discipline and honesty about risk."],
    resume: ["Lead with your degree, results and maths, computer science or engineering strengths, plus competitions and projects.", "Keep it to one page and include games or markets you have studied."],
    cover: ["Explain why trading, why this firm, and show you understand the kind of trading it does.", "Give one example showing probability thinking or a good decision under uncertainty."],
    interview: ["Expect mental maths, probability puzzles, market-making games and coding questions across several rounds.", "Practise timed problems and explain your reasoning aloud, including when you are unsure."]
  },
  transport: {
    look: ["Reliability, a strong safety record and the ability to work shifts, nights and weekends.", "The right licences and tickets for the role (heavy vehicle licence, forklift, ASIC, rail safeworking, pilot or cabin crew certificates).", "Customer focus and calm decision-making when things go wrong."],
    resume: ["List licences and tickets first, plus a clean driving or safety record, and any shift work experience.", "Show reliability with long service in jobs."],
    cover: ["Say why you want to work in transport or logistics, and mention a route, service or terminal the company runs.", "Be clear about your availability and where you can work."],
    interview: ["Expect safety scenarios, questions on fatigue, shift work and delays, and for customer roles a difficult-passenger question.", "Be ready for a medical, a drug and alcohol test, and background checks, and ask about training."]
  },
  airline: {
    look: ["For cabin crew: customer service, calm under pressure, teamwork and the ability to pass a swim test and medical.", "For other roles: aviation, engineering, airport operations, IT, finance or customer service experience.", "Current first aid, an RSA certificate for cabin crew, and the right to work (some airlines also require flexible location and shift work)."],
    resume: ["For cabin crew: show customer service, hospitality or retail experience and languages.", "Include a clear photo only if the airline asks for it, and list first aid, RSA and swimming ability."],
    cover: ["Show you know the airline's routes and brand, and why you want its culture.", "Give an example of staying calm and helpful when things went wrong."],
    interview: ["Expect group activities, role plays and questions on teamwork, customer care and safety.", "Dress professionally, practise with a friend and watch for open days, because recruitment rounds are short and competitive."]
  },
  default: {
    look: ["Evidence that you can do the job: relevant skills, qualifications and experience.", "Reliability, teamwork and communication.", "Interest in the organisation and its work."],
    resume: ["Match your resume to the advertisement, using its key words truthfully.", "Lead with your strongest, most relevant experience and quantify results."],
    cover: ["Say why you want this role at this organisation and name something specific.", "Give one example that proves your key strength."],
    interview: ["Prepare three or four examples using a method such as STAR, and research the organisation.", "Ask about training, the team and what success looks like in the first six months."]
  }
};
