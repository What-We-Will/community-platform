export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  author: string;
  featured?: boolean;
  body?: ArticleSection[];
};

export type ArticleSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "pullquote"; text: string; attribution?: string }
  | { type: "list"; items: string[] };

export const ARTICLES: Article[] = [
  {
    slug: "build-bicycles-not-rockets",
    title: "Build Bicycles, Not Rockets: How We Take Control of AI",
    excerpt:
      "Labor and capital are now openly fighting over who gets to write the rules on AI. We recap the AFL-CIO Workers First AI Summit, spotlight the hidden labor behind AI systems, and ask what it really means for workers to own the technology.",
    date: "March 31, 2026",
    category: "Policy & Advocacy",
    author: "WWW Editorial Team",
    featured: true,
    body: [
      {
        type: "paragraph",
        text: "On March 26, more than 400 labor leaders, union members, policymakers, and organizers gathered in Washington, D.C. for the AFL-CIO Tech Institute's inaugural Workers First AI Summit. The key theme: framing AI not as a technology question, but as a labor question. Who controls it? Who benefits? Who pays the price when jobs are restructured?",
      },
      {
        type: "paragraph",
        text: "State federation leaders from California, Massachusetts, Connecticut, Washington, and others outlined labor-backed AI bills moving through their legislatures — including the No Robo Bosses Act, which we are actively advocating for in California. Earlier in the same week, Silicon Valley executives and Trump administration officials gathered to celebrate AI's potential. Bloomberg described the split in Washington plainly: labor and capital are now openly fighting over who gets to write the rules. We're building people power to win that fight.",
      },
      {
        type: "pullquote",
        text: "What's needed isn't more reskilling platitudes that assume it is up to individuals to absorb the cost of labor disruption. It's collective power, enforceable guardrails, and a seat at the table in the governance of AI.",
        attribution: "— AFL-CIO Workers First AI Summit, March 2026",
      },
      {
        type: "paragraph",
        text: "There weren't as many technologists at the table as policy professionals. That gap matters. What does it mean, in terms of technical implementation, for workers to actually have control of the technology? That's a question we're trying to answer — not just in our advocacy work, but in our hands-on workshops.",
      },
      {
        type: "heading",
        text: "Bicycles, Not Rockets",
      },
      {
        type: "paragraph",
        text: "Our upcoming workshop series takes its name from author Karen Hao's framework: rockets are powerful and owned by a few. Bicycles are human-scale — you can fix one yourself, understand how it works, and ride without depending on anyone. Applied to AI: large foundation models trained at billion-dollar scale are rockets. A small language model fine-tuned on your own data, running on your own hardware, is a bicycle.",
      },
      {
        type: "paragraph",
        text: "This week's skillshare by Kaitlin Cort is an intro to a longer workshop series on how to build and fine-tune an open source small language model for particular use cases, using locally deployed models. We'll also discuss our Tech Worker Cooperative's technical roadmap for building secure, distributed, public infrastructure for hosting libre/free software alternatives — providing more safety for anti-authoritarian movement organizing off of Big Tech surveillance platforms. Our vision: laid-off tech workers can build the alternatives to Big Tech, by and for workers.",
      },
      {
        type: "heading",
        text: "The Entry-Level Hiring Crisis",
      },
      {
        type: "paragraph",
        text: "While there continues to be debate among economists about whether AI is actually causing layoffs, the stories we hear from members show that the job market has changed drastically in the past year — while unemployment indicators have yet to catch up. Entry-level workers are impacted the most.",
      },
      {
        type: "paragraph",
        text: "A Resume.org survey of nearly 1,000 U.S. businesses found that 21% of companies have already frozen entry-level hiring, citing AI as the primary reason. By end of 2026, 36% say they will have stopped. By 2027, nearly half expect entry-level hiring to be eliminated at their company entirely.",
      },
      {
        type: "paragraph",
        text: "This week's industry alerts underscore the trend. Epic Games announced layoffs of over 1,000 employees — roughly 20% of its staff. Meta is cutting several hundred more jobs across Reality Labs, Facebook, and recruiting, following a broader reallocation of capital toward AI infrastructure, with the company forecasting up to $169 billion in AI-driven spending for 2026.",
      },
      {
        type: "heading",
        text: "Solidarity Spotlight: Techworker Community Africa",
      },
      {
        type: "paragraph",
        text: "Last week we connected with Mophat Okinyi, Founder and CEO of Techworker Community Africa and a former content moderator for OpenAI's ChatGPT, based in Nairobi, Kenya. His job was to read and label thousands of pieces of toxic and psychologically harmful content — part of the hidden labor force behind AI automation that rarely makes headlines in the U.S.",
      },
      {
        type: "paragraph",
        text: "Mophat is an AI and human rights activist and union organizer dedicated to advocating for the fair treatment and rights of online content moderators, tech workers, and data training professionals. Techworker Community Africa filed a petition with the Kenyan government calling for an investigation into what they describe as exploitative conditions for contractors reviewing the content that powers what we call AI. He was featured in Time Magazine as one of the 100 most influential people in AI, and was honored with the RAISE 2023 Outstanding Individual award by the Responsible AI Institute.",
      },
      {
        type: "pullquote",
        text: "We've already seen in job reports that there is a restructuring of the economy happening right now.",
        attribution: "— Karen Hao",
      },
      {
        type: "paragraph",
        text: "We're excited to meet Mophat in person at Take Back Tech in Atlanta (April 17–19) and look forward to building international solidarity across our movements. The fight for worker control over AI is not a national story. It's a global one.",
      },
    ],
  },
  {
    slug: "ai-layoff-wave-workers-fighting-back",
    title: "The AI Layoff Wave Is Here. Here's How Workers Are Fighting Back.",
    excerpt:
      "Oracle, Meta, and Atlassian are explicitly citing AI rebalancing as they cut tens of thousands of jobs. We look at what's driving these cuts, what the CWA is doing about it, and why our name comes from an 1863 labor organizer.",
    date: "March 24, 2026",
    category: "Policy & Advocacy",
    author: "WWW Editorial Team",
    body: [
      {
        type: "paragraph",
        text: "This past week, we launched the first iteration of our pilot program with the AI Commons Project — paying participants $1,000/month fo up to 12 months, for workers who have lost their jobs due directly to AI disruption, while providing reskilling training and community support. The Fund for Guaranteed Income has distributed over $25 million fighting for a stronger safety net, and we're grateful to the AI Commons Project for their support in our early stages of growth.",
      },
      {
        type: "heading",
        text: "This Past Week in Layoffs",
      },
      {
        type: "paragraph",
        text: "We are looking at a massive shift across Big Tech, as firms like Oracle and Atlassian explicitly cite \"AI rebalancing\" for significant workforce reductions. While companies redirect capital toward infrastructure, the labor movement has to move faster than ever to ensure workers aren't left behind in the automation wave.",
      },
      {
        type: "list",
        items: [
          "Oracle is weighing cuts of 20,000 to 30,000 positions — roughly 12–18% of its global workforce. Analysts suggest the move is a \"cash-flow play\" to fund a massive $156 billion build-out of AI-focused cloud infrastructure.",
          "Atlassian CEO Mike Cannon-Brookes announced 1,600 layoffs, stating it would be \"disingenuous to pretend AI doesn't change the mix of skills we need or the number of roles required\" — one of the most explicit links between AI and job cuts this year.",
          "Meta is cutting 20% of its workforce (15,000 jobs) while doubling its AI spending to $135 billion.",
          "The $100,000 H-1B fee: in an Oakland courtroom, government attorneys revealed that only around 70 employers have paid the new fee since its inception — supporting the legal argument that the fee is an illegal regulatory hurdle designed to kill the program.",
        ],
      },
      {
        type: "paragraph",
        text: "We believe these layoffs are not due primarily to AI increasing productivity, but simply due to the fact that AI is expensive. Tech giants are making dangerous bets with our economy and our country.",
      },
      {
        type: "heading",
        text: "CWA's Blueprint for Worker-Centered AI",
      },
      {
        type: "paragraph",
        text: "While tech executives promise \"AI efficiency,\" workers on the ground are often the ones correcting AI errors while facing intensified surveillance and job insecurity. In a new strategy memo, CWA President Claude Cummings Jr. argues that union contracts are the only tools that move at the speed of technological change.",
      },
      {
        type: "list",
        items: [
          "The \"Seat at the Table\" Mandate: CWA rejects the idea that AI displacement is inevitable, prioritizing contract language that requires management to provide advance notice and allow workers guidance on how AI is implemented.",
          "Bargaining for Gains: The union is pushing to ensure that the economic wealth generated by AI productivity is shared with workers, not just funneled to investors.",
          "Progress, Not Exploitation: By treating AI as a tool to enhance human potential rather than deskill it, the CWA is building a cross-sector movement for dignity at work.",
        ],
      },
      {
        type: "heading",
        text: "Why \"What We Will\"?",
      },
      {
        type: "pullquote",
        text: "Eight hours for work, eight hours for rest, eight hours for what we will.",
        attribution: "— Ira Steward, Machinist and Blacksmiths Union, 1863",
      },
      {
        type: "paragraph",
        text: "Our name is a tribute to the vision of Ira Steward. The New Deal protections we now consider standard — the five-day work week, Social Security, the abolition of child labor — were not innovations handed down from the top. They were hard-won victories secured by organized workers who refused to accept the status quo of the first Industrial Revolution.",
      },
      {
        type: "paragraph",
        text: "Today, the rapid pace of AI development is forcing an economic shift of a similar scale. As Brian Merchant wrote in Blood In the Machine, there are parallels between our current age of automation and the last. The question is not whether technology is useful in itself, but who owns and controls the machines? For whose benefit?",
      },
      {
        type: "paragraph",
        text: "We advocate for quality jobs and worker control over technology adoption. We are fighting for a 32-hour work week so each worker gains from AI productivity, portable healthcare benefits not tied to employment, and expanded unemployment insurance with full labor rights for all gig and contract workers. Large language models have been trained on the intellectual and artistic work of everyone in society — and we all deserve a share in the wealth generated by AI. The future of AI dominance is not inevitable. We are fighting for shared prosperity, and organizing to ensure the next technological era serves the people who create it.",
      },
    ],
  },
  {
    slug: "no-robo-bosses-sb947",
    title: "No Robo Bosses: We're Joining the Week of Action for SB947",
    excerpt:
      "We're joining the California Labor Federation in their week of action for SB947, the No Robo Bosses Act of 2026 — legislation that would require human oversight of AI systems in hiring, management, and discipline. And one worker's story shows exactly why it matters.",
    date: "March 17, 2026",
    category: "Campaign Update",
    author: "Organizing Team",
    body: [
      {
        type: "paragraph",
        text: "Are you tired of AI screeners rejecting your job application before a human being has ever had a chance to view your resume? This week we're joining the California Labor Federation in their week of action for SB947 — the No Robo Bosses Act of 2026 — to fight against the indiscriminate use of Automated Decision Systems (ADS) in workplace surveillance, hiring, and management.",
      },
      {
        type: "heading",
        text: "What SB947 Would Do",
      },
      {
        type: "paragraph",
        text: "From productivity and behavior monitoring, to pay and compensation decisions, to hiring and HR, automated decision systems have spread across nearly every dimension of how employers manage workers. This landmark legislation, currently in the Labor Committee of the California State Senate, would prevent employers from relying solely on ADS to make disciplinary or termination decisions, conduct predictive behavior analysis, or take adverse action against workers for exercising their legal rights. Put simply: it would require a human being to be in the loop.",
      },
      {
        type: "list",
        items: [
          "Prohibits termination or discipline based solely on automated systems",
          "Bans predictive behavior analysis without human review",
          "Prevents adverse action against workers who exercise legal rights, when that action is algorithmically triggered",
          "Requires human oversight of AI systems used in hiring, compensation, and performance management",
        ],
      },
      {
        type: "heading",
        text: "One Worker's Story",
      },
      {
        type: "paragraph",
        text: "Dean Grey was laid off from his Associate Engineer role at InfoSys last year after complaining about the ways he was being asked to train AI to replace his own work.",
      },
      {
        type: "pullquote",
        text: "InfoSys used my employment and others from Revature to refine their AI programs that would ultimately make us unnecessary. My job search challenges are closely tied to the rapid shift in the industry toward AI-driven development.",
        attribution: "— Dean Grey, former Associate Engineer",
      },
      {
        type: "paragraph",
        text: "After completing his training at Revature, Dean accepted a subcontractor role where he expected to use his engineering skills. Instead, he was asked to annotate data and review tasks to help automate entry-level work at his new company. Dean is part of a growing cohort of early career workers in tech facing a broken career ladder due to AI automation. The skills people typically develop in the first years of a job are now being made redundant — so how can workers like Dean gain the experience needed to reach mid and senior level positions?",
      },
      {
        type: "heading",
        text: "Fighting Back Technically: Battle of the Machines",
      },
      {
        type: "paragraph",
        text: "Legislation is one front. Technical skills are another. This week, volunteer Simon McGraw is demoing how to run a local LLM on your own machine to build a resume-builder tool designed to navigate ADS filters and automated resume screeners. Simon leads our WWW Tech Worker Cooperative for freelancers and laid-off workers seeking benefits and legal protections while doing contract work.",
      },
      {
        type: "paragraph",
        text: "If you're a job seeker who has experienced the strange loop of AI-generated resumes battling against AI screeners, or if you've faced increased productivity demands due to algorithmic management, we want to hear from you. Your story makes a real difference in our collective ability to fight for change.",
      },
    ],
  },
  {
    slug: "community-platform-launch",
    title: "Our Community Platform Is Live",
    excerpt:
      "After weeks of building, our beta community platform is open. Secure messaging for laid-off workers, a community job board, skill-sharing groups, and more. We're also welcoming a key new organizer to our team.",
    date: "March 10, 2026",
    category: "Announcement",
    author: "WWW Editorial Team",
    body: [
      {
        type: "paragraph",
        text: "We've grown enormously in the past month, and we're excited to welcome our 28 new volunteers across our four programs and six teams. This week, we're launching our new Community Platform — a beta membership space with secure communication channels for laid-off workers, a community job board, group learning tools, and resources for workers navigating this moment.",
      },
      {
        type: "heading",
        text: "What's on the Platform",
      },
      {
        type: "paragraph",
        text: "As a tech worker cooperative in formation, we are building tools by and for the community of workers we serve. Here's what's live in our beta launch:",
      },
      {
        type: "list",
        items: [
          "Community Job Board — Browse and post job openings, with notes from members who've been through the process",
          "Secure Messaging Channels — Private communication outside of company Slack, for laid-off workers coordinating together",
          "Group Learning Tools — Organize study groups, workshops, and skill-sharing with accountability built in",
          "Resource Hub — A growing library of guides, templates, and know-your-rights materials",
          "Open Source Civic Tech Projects — A space for collaborating on tools that serve workers, not investors",
        ],
      },
      {
        type: "heading",
        text: "Welcome, Shannon Wait",
      },
      {
        type: "paragraph",
        text: "We're very excited to welcome Shannon Wait as our new Lead Organizer for the Policy and Advocacy team. As a data center worker, Shannon organized for five years with the Alphabet Workers Union-CWA. She took on Google and won — fighting for the labor rights of tech contract workers, pushing bold policy initiatives, building legislative relationships, and publishing participatory action research.",
      },
      {
        type: "paragraph",
        text: "Shannon co-authored \"Ghosts in the Machine\" with TechEquity Collaborative, where she sits on the Policy Advisory Board. We feel extremely fortunate to have this seasoned fighter guiding our advocacy strategy and our participatory action research project on the impact of AI in the workplace.",
      },
      {
        type: "heading",
        text: "Supporting Washington Post Tech Guild",
      },
      {
        type: "paragraph",
        text: "We're coordinating to support workers at the Washington Post Tech Guild with their upcoming layoff on April 10th. They're fighting to push this date further back and win better severance and effects bargaining for their union members. Please join us in supporting their collective bargaining process.",
      },
      {
        type: "heading",
        text: "Upcoming Skillshares",
      },
      {
        type: "paragraph",
        text: "Our members are already leading hands-on technical workshops. Here's what's coming up — all free and volunteer-led:",
      },
      {
        type: "list",
        items: [
          "March 18 — Deploying Local Models: Battling AI Resume Screeners & ATS (Simon M.)",
          "March 25 — Careful Coding Workflows with AI Tools (Tim C.)",
          "April 8 — System Design Interviews with AI Orchestration (Mary F.)",
          "April 15 — AI Governance: Comparing Policies in Europe and the U.S. (Simantha P.)",
        ],
      },
      {
        type: "paragraph",
        text: "We're also hosting Daily Standups every weekday at 8am PT / 11am ET for job seekers — quick check-ins, shared goals, and mutual support. No experience required, just the willingness to show up.",
      },
    ],
  },
  {
    slug: "mass-call-recap-february-2026",
    title: "500 Workers. One Call. Here's What Comes Next.",
    excerpt:
      "Over 500 people registered for our Mass Call on February 22nd — laid-off tech workers, allies, students, and organizers from across the country. Here's what they told us, and the four working groups we're launching in response.",
    date: "February 25, 2026",
    category: "Community",
    author: "WWW Editorial Team",
    body: [
      {
        type: "paragraph",
        text: "Over 500 people registered for our Mass Call on Sunday, February 22nd — including laid-off tech workers from 62 companies, as well as allies, entry-level workers, and students from 51 organizations, schools, and government offices. Of the 200+ people who showed up, 59% identified as currently laid off, 18% are still employed but worried about layoffs, 15% identified as an ally, and 8% were students.",
      },
      {
        type: "paragraph",
        text: "Workers shared powerful and inspiring stories about organizing amidst layoffs at Amazon, Washington Post Tech Guild, and Pinterest. Other speakers provided resources for laid-off workers, visions for organizing, and political context for understanding the way tech monopolies are increasing economic inequality — and lessons learned from fighting alongside gig workers for justice and economic democracy.",
      },
      {
        type: "pullquote",
        text: "There were 382 messages in the chat on our Zoom call, with 537 emojis. 44% of those who registered said they would be interested in volunteering — and 81% of those on the call said the same. Because we're ready to get to work.",
        attribution: "— What We Will organizing team",
      },
      {
        type: "heading",
        text: "What Workers Told Us",
      },
      {
        type: "paragraph",
        text: "In our breakout rooms, attendees shared resources, stories about the ways AI is impacting their workplaces, and insightful suggestions for organizing collective power. Five themes surfaced consistently:",
      },
      {
        type: "list",
        items: [
          "The job market is broken",
          "The unemployment system is not adequate",
          "Workers on this call want to build collective power together",
          "AI is both a threat and a tool",
          "Workers need basic rights education",
        ],
      },
      {
        type: "heading",
        text: "Four Working Groups, Now Meeting Weekly",
      },
      {
        type: "paragraph",
        text: "In response, we're officially launching four core working groups during the first week of March, meeting at 4pm PT / 7pm ET. Each working group is focused on a critical part of the fight:",
      },
      {
        type: "list",
        items: [
          "Layoff Crisis Support & Collective Bargaining — Mondays",
          "Job Search Community & Skill-Sharing / Civic Tech Projects — Tuesdays",
          "Participatory Action Research & Media — Wednesdays",
          "Policy & Advocacy — Thursdays",
        ],
      },
      {
        type: "heading",
        text: "Regular Programming, Starting March 15th",
      },
      {
        type: "paragraph",
        text: "Starting March 15th, we're launching a regular rhythm of virtual community spaces every weekday — all volunteer-led and free. Daily Standups run Monday through Friday at 8am PT / 11am ET: quick check-ins, shared goals and wins, and a place to ask for help. Job Search Community sessions run Monday and Wednesday at 11am PT / 2pm ET, with skillshares, mock interviews, resume reviews, and accountability. An Engineering & AI Learning Circle runs Tuesdays for hands-on sessions to learn tools and build skills together. Every other Sunday, we hold our Book Club — starting March 14th with \"The Future We Need: Organizing for a Better Democracy in the 21st Century\" by Erica Smiley and Sarita Gupta.",
      },
      {
        type: "heading",
        text: "Volunteer Roles We're Filling Now",
      },
      {
        type: "paragraph",
        text: "This movement runs on volunteers. Here are the roles we need right now:",
      },
      {
        type: "list",
        items: [
          "Working Group Leads & Co-Leads — Facilitate meetings and keep your group moving forward",
          "Platform Engineering & Design — Help us build our community platform and open source tools for layoff crisis support, solidarity job search, policy mapping, and study groups",
          "Peer Support & Mutual Aid Coordinators — Connect workers to resources, especially those facing urgent needs such as H-1B visa holders and healthcare gaps",
          "Research Volunteers — Help with data collection, policy analysis, and worker surveys",
          "Media & Design — Newsletter and video content, visual assets, social media, and strategic PR",
          "Event Coordinators — Help plan and run our future mass calls and community events",
        ],
      },
      {
        type: "paragraph",
        text: "No experience required — just the willingness to show up. If you're ready to be part of building something, reach out at info@wwwrise.org or join us on our platform.",
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
