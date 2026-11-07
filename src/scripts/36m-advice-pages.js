/* ===================== Advice pages: Resume advice, Cover letter advice and LinkedIn advice ===================== */
// Plain written guidance for Australian job seekers, with examples. Each page has "Everything you need to know" (cards) and "Examples"
// (weak and stronger side by side, or a sample to copy the shape of). The examples are made up. Each page ends by pointing at the tool that does the job.
// `know`: [heading, [lines]]   `pairs`: [what it is, weak, stronger]   `samples`: [heading, text]
const ADVICE_PAGES = {
  "advice-resume": {
    title: "Resume advice",
    lede: "What to put in, what to leave out, and how it should read, with examples you can copy the shape of.",
    know: [
      ["How long, and how it looks", ["One page for school leavers, graduates and short work histories. Two pages once you have several roles. Three is almost never right.", "Newest role first. One column, a plain font, standard headings (Profile, Experience, Education, Skills).", "Skip photos, tables, text boxes and graphics. Many employers' systems read the file as plain text and scramble them."]],
      ["Contact details", ["Name, mobile, email and your suburb and state. A full street address isn't needed.", "In Australia, leave out your date of birth, marital status, photo and tax file number.", "Use a sensible email address. firstname.lastname beats nickname2004."]],
      ["Start with a short profile", ["Two or three lines at the top: who you are, what you're good at, and the kind of role you want.", "Write it for each job. It's the first thing read, so make it match the ad."]],
      ["Write achievements, not duties", ["Start each bullet with a strong verb, say what you did, then what came of it. Numbers help: people, dollars, time, percentages.", "Three to five bullets for recent roles, fewer for older ones.", "No numbers? Say how often, how many or how big: “served around 150 customers a shift”."]],
      ["Match every ad", ["Read the ad and pick out the skills and words it repeats. Where it's true, use those same words in your resume.", "Only claim what you can back up in an interview. The Tailor to a job page shows what an ad asks for that your resume is missing."]],
      ["Gaps and no experience", ["Gaps happen: study, caring, travel, illness. Put one honest line in (“Career break, caring for family, 2022”) and move on.", "No paid experience? Use volunteering, school and uni projects, sport, community roles and part-time jobs."]],
      ["Referees", ["Two is plenty, ideally a recent manager and one other. Ask them first and tell them about the job.", "“Referees available on request” is fine if space is tight."]],
      ["Before you send it", ["Read it aloud and have someone else read it. Typos are the most common reason for a quick no.", "Use the same date style throughout (Mar 2022 – Jan 2024).", "Send a PDF unless the ad asks for Word. Name the file Firstname-Lastname-Resume."]]
    ],
    pairs: [
      ["A work bullet", "Responsible for serving customers and handling cash.", "Served 150+ customers a shift, balanced a $2,000 till daily and trained four new team members."],
      ["A work bullet", "Helped with social media.", "Grew the cafe's Instagram from 400 to 1,900 followers in six months by posting three times a week."],
      ["A work bullet", "Worked in a team to complete projects.", "Delivered a 5-person uni project on time, splitting the work by strengths and running the weekly check-in."],
      ["A skills line", "Good communication skills, hard working, team player.", "Customer service, POS and cash handling, stock counts, rostering for a team of six."]
    ],
    samples: [
      ["Profile: school leaver, hospitality", "Reliable Year 12 graduate with 18 months of weekend cafe experience. Fast on the espresso machine and the till, calm in a rush, and keen to start a hospitality traineeship."],
      ["Profile: graduate", "Recent Bachelor of Commerce graduate (Accounting) with an internship in a mid-sized firm. Confident in Excel and Xero, and looking for a graduate accountant role where I can work towards CPA."],
      ["Profile: career change", "Retail supervisor of six years moving into customer support. Experienced in resolving complaints, training staff and hitting service targets, with strong written communication."],
      ["Skills section", "Xero and MYOB · Advanced Excel (pivot tables, lookups) · Accounts payable and receivable · BAS preparation · Full Australian drivers licence"]
    ],
    cta: ["builder", "Create or edit resume"]
  },
  "advice-letter": {
    title: "Cover letter advice",
    lede: "A cover letter says why you want this job and why you'd be good at it. Keep it short, specific and about them.",
    know: [
      ["What it's for", ["Your resume shows what you've done. The letter connects it to this job and this employer.", "Many employers read the letter first when a resume is close, so it can decide between two similar people."]],
      ["Length and shape", ["One page, three or four short paragraphs, around 250 to 350 words.", "Opening: the role and one line on why you. Middle: two or three proof points. Close: availability and a clear next step."]],
      ["Who to write to", ["Find a name on the ad, the company website or LinkedIn. “Dear Ms Nguyen” is better than “To whom it may concern”.", "If you can't find one, “Dear Hiring Manager” or “Dear [Company] team” is fine."]],
      ["Pick the proof points from the ad", ["Choose the two or three things the ad stresses most and give one short example of each.", "Use the same words the ad uses, and add a number or result if you can. Don't just repeat your resume."]],
      ["Why this employer", ["One or two sentences that could only be about them: a project, a value, a product, how they treat customers.", "Check their website and recent news. Generic praise is easy to spot."]],
      ["Tone", ["Write the way you'd speak to a manager you respect: friendly, direct, no slang.", "Be confident without overselling. Skip “I am a hard worker with a passion for excellence”."]],
      ["Selection criteria", ["Government and some public roles ask you to address selection criteria in a separate document, in addition to or instead of a letter.", "Answer each criterion on its own with a real example: the situation, what you did, and the result."]],
      ["Before you send it", ["Check the company and role names, and the spelling of the person's name.", "Save as a PDF named Firstname-Lastname-Cover-Letter, and match the look of your resume."]]
    ],
    pairs: [
      ["An opening line", "I am writing to apply for the position advertised on Seek.", "I'd love to join Harbour Street Dental as your next receptionist. I've spent two years greeting patients and running a busy front desk, and I'd like to bring that to your team."],
      ["A proof point", "I have good customer service skills.", "At Laneway Goods I handled around 150 customers a shift and was named Team Member of the Month three times for resolving complaints on the spot."],
      ["A reason for the employer", "Your company is a leader in the industry.", "I've followed your move to carbon-neutral packaging, and I'd like to work somewhere that backs its values with action."],
      ["A closing line", "I look forward to hearing from you.", "I'm available to start in two weeks and would welcome a chat about the role. I'll call on Thursday to check you received this."]
    ],
    samples: [
      ["A short letter, entry level", "Dear Ms Nguyen,\n\nI'm excited to apply for the Retail Assistant role at Fold & Thread. I've worked weekends at a local homewares store for a year, and I enjoy helping people find something they love.\n\nThe ad mentions busy weekend trading and visual merchandising. At my current job I open the store on Saturdays, serve around 100 customers, and I re-styled our front window display, which my manager credited with a rise in foot traffic. I'm also quick with a POS system and careful with stock counts.\n\nI've always admired how Fold & Thread mixes local makers with everyday pieces, and I'd be proud to represent that on the floor.\n\nI'm available any weekend and most weeknights, and I'd welcome the chance to meet. Thank you for your time.\n\nKind regards,\nAlex Taylor\n0400 000 000"]
    ],
    cta: ["letter", "Create or edit cover letter"]
  },
  "advice-linkedin": {
    title: "LinkedIn advice",
    lede: "Recruiters search LinkedIn before they write to anyone. A clear profile helps them find you and trust what they find.",
    know: [
      ["Photo and banner", ["A clear, friendly head and shoulders photo in good light. Your face should fill about half the frame.", "The banner is optional. A plain colour or a simple image related to your field is enough."]],
      ["Headline", ["It's the line under your name and it shows in every search. Don't leave it as just a job title.", "Try: what you do · who you help or what you're good at · what you're looking for."]],
      ["About", ["The first two or three lines show before “see more”, so put the most useful thing first.", "Write in the first person, keep it short, and finish with how to reach you or what you're open to."]],
      ["Experience", ["Match your resume (same roles, same dates), but you can be a little more conversational.", "Use two to four bullets per role, with results. Add links or media to work you're proud of."]],
      ["Skills", ["List the skills that jobs you want ask for. Pin your top three.", "Ask colleagues to endorse the ones that matter most, and give a few endorsements yourself."]],
      ["Open to work", ["You can show a green banner to everyone, or tell recruiters only. Recruiters-only is the safer choice if your boss might see it.", "Set the job titles, locations and work types you'd consider (full time, casual, remote, hybrid)."]],
      ["Make it easy to find you", ["Set your location to your city, and customise your profile URL (linkedin.com/in/firstname-lastname).", "Use the same job titles and keywords that appear in ads you want."]],
      ["Connect and be seen", ["Connect with classmates, colleagues, managers and people at employers you like, with a short note.", "Comment on a post or share something useful once a week. You don't have to write long posts."]],
      ["Stay safe", ["Never share your tax file number, bank details or passwords with a “recruiter”.", "Be wary of offers that ask for money, or that move you to a private chat app straight away."]]
    ],
    pairs: [
      ["A headline", "Student", "Accounting student at RMIT · Xero and Excel · Looking for a graduate accountant role in Melbourne"],
      ["A headline", "Retail Team Leader at Laneway Goods", "Retail team leader · Customer service, rostering and stock · Open to store manager roles"],
      ["An experience bullet", "Worked at the front desk.", "Greeted 60+ patients a day, managed bookings across five practitioners and cut no-shows by sending reminder texts."],
      ["A connection request", "Hi, please accept my request.", "Hi Priya, I saw your post on graduate hiring at Northgate. I'm finishing a Commerce degree and would love to follow your team's work."]
    ],
    samples: [
      ["About section", "I help small businesses keep their books tidy and their tax on time. I'm a recent Commerce graduate with an internship in a mid-sized firm, comfortable in Xero, MYOB and Excel, and I like turning a pile of receipts into something clear.\n\nI'm looking for a graduate accountant role in Melbourne. Message me here or email alex@example.com."],
      ["A message to a recruiter", "Hi Jordan, I saw you're hiring for a customer support role at Platform 9 Travel. I've spent three years in a busy retail role handling complaints and exchanges, and I'd love to move into support. Could I send you my resume? Thanks, Alex"]
    ],
    cta: ["linkedin", "Create or edit LinkedIn"]
  }
};
onInit(() => {
  for (const [key, p] of Object.entries(ADVICE_PAGES)) {
    const box = $(key + "-body");
    if (!box) continue;
    box.innerHTML = `<header class="view-head"><div><h1 id="${key}-title">${esc(p.title)}</h1><p>${esc(p.lede)}</p></div><a class="btn primary" href="#${p.cta[0]}">${esc(p.cta[1])}</a></header>
      <section class="adv-sec" aria-labelledby="${key}-know"><h2 id="${key}-know">Everything you need to know</h2>
        <div class="adv-grid">${p.know.map(([h, lines]) => `<article class="panel adv-card"><h3>${esc(h)}</h3><ul>${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul></article>`).join("")}</div></section>
      <section class="adv-sec" aria-labelledby="${key}-ex"><h2 id="${key}-ex">Examples</h2>
        <div class="adv-pairs">${p.pairs.map(([what, weak, strong]) => `<article class="panel adv-pair"><h3>${esc(what)}</h3><p class="adv-weak"><b>Weak</b>${esc(weak)}</p><p class="adv-strong"><b>Stronger</b>${esc(strong)}</p></article>`).join("")}</div>
        <div class="adv-grid">${p.samples.map(([h, t]) => `<article class="panel adv-card"><h3>${esc(h)}</h3><p class="adv-sample">${esc(t)}</p></article>`).join("")}</div>
        <p class="small muted">These examples are made up to show the shape. Write yours with your own real details.</p></section>
      <div class="b-actions adv-end"><a class="btn primary" href="#${p.cta[0]}">${esc(p.cta[1])}</a><a class="btn" href="#scanner">Tailor to a job</a></div>`;
  }
});
