import type { ArticleSection } from "@/lib/news";

const PETITION =
  "https://www.change.org/p/support-oracle-workers-in-securing-fair-severance";

export const layoffsAccelerateOracleSeveranceBody: ArticleSection[] = [
  { type: "paragraph", text: "Hey friends," },
  {
    type: "paragraph",
    text: "We've been focused for the past three weeks on a severance negotiation campaign for Oracle workers. Among the 600+ workers we've connected included ones who were terminated on FMLA or disability leave, and cut off from healthcare while pregnant.",
  },
  {
    type: "paragraph",
    text: "The decision to trade employee livelihoods for AI data center investment, when the company has been profitable, is both ethically indefensible and strategically shortsighted. The mass layoffs maximized cost-cutting through targeting senior-level employees and people close to their vesting dates, as well as women and workers of color, in a messy process that exposed many FMLA violations and potential WARN Act violations.",
  },
  {
    type: "paragraph",
    text: "Laid-off workers are organizing in solidarity with one another, sharing their OWBPA disclosures, to find that a disproportionate number were over the age of 50. Severance compensation is materially below industry standard. For years, workers had been promised RSU's instead of promotions, and many newer workers were hired at below-market rates with the promise of RSU's that were cut off shortly before vesting. Oracle has used RSU grants as a retention mechanism while structuring vesting cliffs to maximize forfeitures upon separation, a bait-and-switch that many workers describe as misleading and deceptive.",
  },
  {
    type: "paragraph",
    text: 'Oracle also retroactively classified many employees as "remote", in several cases without notice, in what workers describe as an effort to avoid WARN Act notification obligations. These violations are now being investigated by Brendan Ballou and Jack Raisner, lawyers we were able to bring on board for legal support. They have also donated their time in leading informational sessions and answering worker questions. We especially appreciate Andrew Stettner (NELP), Jacob Fallman (Sugar Law), Clarissa Redwine (Kickstarter Union), and David Pham (Washington Post Tech Guild), for meeting multiple times with workers to provide support and inspiration for severance negotiation and unionizing.',
  },
  {
    type: "paragraph",
    parts: [
      "The 274 Oracle workers in this severance negotiation campaign have just put together a petition for broader public support on ",
      { link: "Change.org", href: PETITION },
      ". They are standing up because they believe that the way Oracle has laid off 30,000 workers sets a dangerous standard for the industry at large, and they believe it is important to stand up and fight back.",
    ],
  },
  {
    type: "paragraph",
    text: "Please take a moment to sign and give them your support.",
  },
  { type: "button", label: "Sign the Petition", href: PETITION },
  { type: "heading", text: "Take Back Tech" },
  {
    type: "image",
    src: "/images/news/2026-04-29_newsletter-take-back-tech.webp",
    alt: "What We Will organizers at the Take Back Tech conference in Atlanta",
    size: "small",
  },
  {
    type: "paragraph",
    parts: [
      "Last weekend, What We Will joined the Tech Workers Coalition in two panels at the ",
      { link: "Take Back Tech", href: "https://www.takebacktech.com/" },
      " conference, organized by ",
      { link: "Mijente", href: "https://www.mijente.org/" },
      " and ",
      { link: "Media Justice", href: "https://mediajustice.org/" },
      " in Atlanta, Georgia.",
    ],
  },
  {
    type: "list",
    items: [
      [
        "We joined organizers from ",
        { link: "Honor the Earth", href: "https://www.honorearth.org/stopdatacolonialism" },
        " and ",
        { link: "Make the Road", href: "https://www.maketheroadaction.org/" },
        ' in a panel about tech worker organizing against data centers, moderated by ',
        { link: "Kairos fellows", href: "https://www.kairosfellows.org/" },
        ' and Andrew Chow (Time: "',
        {
          link: "The People vs. AI",
          href: "https://time.com/7377579/ai-data-centers-people-movement-cover/",
        },
        '"). Tech workers are joining in coalition with community organizations fighting against data centers being built near their homes. As thousands of Oracle, Amazon, Meta, and Microsoft are being laid off in exchange for debt-leveraged data center construction, there is a broader labor cost of building data centers that may enable AI to replace more workers across other industries. We look forward to organizing with the ',
        { link: "Athena Coalition", href: "https://athenaforall.org/" },
        " to bring together a group of Oracle workers in a coalition campaign against the Oracle Jupiter data center in New Mexico.",
      ],
      "We led a workshop on Building Worker Power Against the Tech Oligarchy, and led a broader discussion with labor and community organizers across various industries, on the ways that we can build collective power against an increasingly oligarchic, right-wing, Trump and MAGA Inc.-supporting Big Tech companies.",
      [
        "One awesome highlight was visiting a community hackerspace in Atlanta where Calix from ",
        { link: "Coop.Cloud", href: "https://coopcloud.tech/" },
        " live-demo'ed how to quickly set up local cloud infrastructure, SSO, and ",
        {
          link: "open source alternatives",
          href: "https://recipes.coopcloud.tech/",
        },
        " to common software. The mission of Coop.Cloud is to help the formation of more local tech co-ops by providing public interest infrastructure as an alternative to corporate clouds, for data autonomy and secure movement-building. It was a treat to learn from the Atlanta coop and ",
        { link: "Movement Infrastructure Research", href: "https://mirnet.org/" },
        ", to see how they've set up their own secure, locally hosted servers for community organizers in Atlanta.",
      ],
    ],
  },
  {
    type: "paragraph",
    text: "We had such great conversations, and built so many new relationships at Take Back Tech. Grateful to be in community with organizations doing inspiring work across the country.",
  },
  {
    type: "paragraph",
    text: "We've been driving across the U.S. in a \"What We Wheel\" camper van, scheming ways to organize street protests with artists against A.I. as layoffs continue to accelerate. Looking forward to joining the Bay Area chapter of TWC for the May Day march this Friday, and excited to gather in person with several What We Will volunteers.",
  },
  {
    type: "image",
    src: "/images/news/2026-04-29_newsletter-may-day.webp",
    alt: "What We Wheel camper van and May Day march organizing",
    size: "small",
  },
  { type: "heading", text: "In the News" },
  { type: "heading", text: "SPOTLIGHT" },
  {
    type: "paragraph",
    parts: [
      {
        link: "The Q1 Reality Check: 80,000 Cuts and Counting",
        href: "https://www.tomshardware.com/tech-industry/tech-industry-lays-off-nearly-80-000-employees-in-the-first-quarter-of-2026-almost-50-percent-of-affected-positions-cut-due-to-ai",
      },
    ],
  },
  {
    type: "paragraph",
    parts: [
      "New data for the first quarter of 2026 reveals a stark reality that global tech layoffs reached nearly ",
      { bold: "80,000" },
      ", with a staggering ",
      { bold: "48%" },
      " of those roles officially attributed to AI and automation. The U.S. remains the epicenter, accounting for ",
      { bold: "76.7%" },
      " of the total displacement.",
    ],
  },
  { type: "paragraph", parts: [{ bold: "Takeaway" }, ":"] },
  {
    type: "list",
    items: [
      [
        { bold: "The AI Driver" },
        ": Nearly ",
        { bold: "38,000 layoffs" },
        " this quarter were linked directly to AI adoption.",
      ],
      [
        { bold: "AI Washing:" },
        " Leaders like Sam Altman suggest firms are using AI efficiency as a convenient narrative to right-size after years of over-hiring, often resulting in immediate stock price bumps. Other companies are following suit in a dangerous prisoner's dilemma of mass layoffs.",
      ],
      [
        { bold: "The Productivity Lag" },
        ": Experts argue that we aren't seeing massive productivity gains yet. Most companies are cutting staff now to free up the cash needed to buy the hardware required for AI implementation.",
      ],
      [
        { bold: "The Junior Crisis:" },
        " By silently eliminating early-career and mid-level positions, companies risk severing the development path for future industry leaders.",
      ],
    ],
  },
  { type: "heading", text: "INDUSTRY ALERTS" },
  {
    type: "paragraph",
    text: "While Oracle's 30,000-person cut led the headlines, several other firms pivoted aggressively in the past weeks. We are beginning to organize with workers in some of these companies:",
  },
  {
    type: "list",
    items: [
      [
        { link: "Meta", href: "https://www.forbes.com/sites/digital-assets/2026/04/18/8000-jobs-polymarket-sees-tech-layoff-surge-as-meta-ai-push-bites/" },
        ": Preparing for a ",
        { bold: "May 20" },
        " restructure involving over ",
        { bold: "8,000 roles" },
        ", aimed at freeing up capital for a massive ",
        { bold: "$135 billion" },
        " investment in AI hardware. Engineers are mandated to use AI as their keyboard movements are being ",
        {
          link: "tracked",
          href: "https://www.cnbc.com/2026/04/22/meta-tracks-employee-usage-on-google-linkedin-ai-training-project.html",
        },
        ". On April 16, Meta also ended its contract with Sama, its AI data labeling contractor in Nairobi, triggering layoff notices for ",
        { bold: "1,108 workers" },
        ". A group of 185 former moderators is currently suing Sama and Meta, alleging illegal dismissal and blacklisting from similar roles with other contractors, and seeking $1.6 billion in damages. Meta is also cutting roles in Ireland, its EU headquarters, where there has already been a 40% reduction in staff since 2022.",
      ],
      [
        {
          link: "Microsoft",
          href: "https://fortune.com/2026/04/23/meta-microsoft-layoffs-job-cuts-not-filling-open-roles-voluntary-buyouts/",
        },
        ": Announced on April 23 a voluntary retirement program, the first in the company's 51-year history, offering buyout packages to approximately 8,750 U.S. employees (7% of its domestic workforce) under a \"Rule of 70\" formula (years of service + age ≥ 70). The program targets middle management and senior workers considered most susceptible to AI automation, with package details going out May 7 and a 30-day decision window. The action comes as Microsoft is projected to invest $145 billion in capital expenditure this fiscal year, redirecting costs from senior headcount toward AI infrastructure build-out.",
      ],
      [
        {
          link: "Snap",
          href: "https://leaddev.com/ai/snap-slashes-1000-jobs-in-ai-driven-efficiency-push",
        },
        ": Traded ",
        { bold: "1,000 roles" },
        " (approx. ",
        { bold: "16%" },
        ") to shift toward an operation where ",
        { bold: "65% of code" },
        " is now machine-generated.",
      ],
      [
        {
          link: "Disney",
          href: "https://www.cnbc.com/2026/04/09/disney-layoffs-ceo-josh-damaro.html",
        },
        ": Cut ",
        { bold: "1,000 roles," },
        " primarily in marketing and corporate functions, as new CEO Josh D'Amaro consolidates operations.",
      ],
      [
        {
          link: "GoPro",
          href: "https://www.msn.com/en-us/money/other/action-camera-giant-gopro-to-lay-off-23-percent-of-staff/ar-AA20rdIn",
        },
        ": Slashed ",
        { bold: "23% of its workforce" },
        " (145 employees) to improve margins amid a challenging hardware market.",
      ],
      [
        {
          link: "Bolt",
          href: "https://www.bankingdive.com/news/bolt-layoffs-ai-30-percent-breslow-valuation-drop/816995/",
        },
        ": The fintech super-app cut ",
        { bold: "30% of its staff" },
        ' on April 6. CEO Ryan Breslow explicitly stated the firm must become "leaner and more AI-centric" to compete.',
      ],
      [
        {
          link: "Pendo",
          href: "https://www.newsobserver.com/news/business/article315329510.html",
        },
        ': The Raleigh-based "unicorn" reduced its headcount by ',
        { bold: "10%" },
        " (approx. 90 people) on April 7.7.",
      ],
    ],
  },
  { type: "heading", text: "LABOR NEWS" },
  {
    type: "list",
    items: [
      [
        {
          link: "Google Ordered to Bargain with YouTube Music Workers:",
          href: "https://www.nlrbedge.com/p/04092026-google-ordered-to-bargain",
        },
        " In a major victory for the joint-employer doctrine, the NLRB has officially ordered Google to sit down at the bargaining table with YouTube Music contractors. This ruling shatters Google's long-standing defense that these workers were solely employed by the staffing firm Cognizant. By confirming that Google exercises \"substantial control\" over working conditions, the NLRB has set a massive precedent for the \"shadow workforce\" throughout the tech industry.",
      ],
      [
        {
          link: "NGP VAN Workers Ratify Contract",
          href: "https://www.morningstar.com/news/pr-newswire/20260409ph30060/ngp-van-workers-ratify-union-contracts-advancing-standards-for-progressive-tech",
        },
        ": On April 9, 2026, employees at NGP VAN (represented by ActionKit, Mobilize, and EveryAction Workers Unions) ratified a contract that sets a new gold standard for tech labor:",
      ],
    ],
  },
  {
    type: "sublist",
    items: [
      [
        { bold: "AI Protections:" },
        " Includes specific safeguards and training commitments regarding how automation is implemented.",
      ],
      [
        { bold: "Economic Gains:" },
        " Workers secured a ",
        { bold: "3% annual raise" },
        ", improved severance packages, and expanded parental leave.",
      ],
      [
        { bold: "Voice at the Table:" },
        " The agreement creates ",
        { bold: "18 new union roles " },
        "in 2026, setting a new standard for labor in the progressive tech space.",
      ],
    ],
  },
  {
    type: "list",
    items: [
      [
        {
          link: "CBS News 24/7 Union Ratifies AI-Protected Contract",
          href: "https://letsdatascience.com/news/cbs-news-247-union-secures-ai-protections-b870794f",
        },
        ": The 60-member unit at CBS News 24/7 unanimously ratified a three-year contract negotiated by WGA East that requires advance notice before new generative AI systems are deployed, gives staffers the right to withhold their bylines from AI-produced work, creates a bargaining clause for AI's impact on job duties, and mandates procedures tied to layoffs. One of the cleanest, most replicable contract models in media right now.",
      ],
      [
        {
          link: "ProPublica Guild — 24-Hour ULP Strike Over AI",
          href: "https://www.wnylabortoday.com/news/2026/04/08/new-york-city-labor-news/propublica-union-launches-24-hour-ulp-walkout-after-ai-talks-stymie-contract-talks/",
        },
        ": On April 8, roughly 150 members of the ProPublica Guild staged what labor experts are calling the first major U.S. newsroom strike driven in significant part by AI concerns. The union — part of the NewsGuild of New York, representing 140 staffers across editorial and business — has been bargaining since late 2023. Workers are demanding contract language prohibiting AI-caused layoffs, contractually guaranteed AI guardrails, wages keeping pace with inflation, and seniority protections. Management has refused to agree to restrictions on replacing jobs with AI. At least 58 newsroom union contracts across the country now include AI-related provisions.",
      ],
      [
        {
          link: 'SAG-AFTRA Contract Talks Resume — "Tilly Tax" on AI Characters',
          href: "https://deadline.com/2026/04/sag-aftra-amptp-resume-negotiations-ahead-of-dga-1236871347/",
        },
        ": After pausing negotiations to make way for the WGA, SAG-AFTRA and the AMPTP resumed talks on April 28, aiming to close a deal before the Directors Guild steps up to bargain on May 11. AI protections are a cornerstone of SAG-AFTRA executive director Duncan Crabtree-Ireland's position. He has signaled he won't agree to a longer contract unless studios make deeper AI concessions. The \"Tilly Tax\" proposal would require studios to pay into a fund when using AI-generated characters in place of human performers.",
      ],
      [
        {
          link: "SAG-AFTRA Condemns ByteDance's Seedance 2.0",
          href: "https://variety.com/2026/film/news/sag-aftra-seedance-ai-infringement-tom-cruise-brad-pitt-fight-1236662695/",
        },
        ': SAG-AFTRA called out ByteDance\'s new AI video model for generating unauthorized deepfakes and voice clones of its members, calling the model "blatant infringement" that "disregards law, ethics, industry standards and basic principles of consent." The Human Artistry Campaign, a coalition of artists\' rights groups affiliated with the Hollywood unions, called it "an attack on every creator around the world."',
      ],
    ],
  },
  {
    type: "paragraph",
    parts: [
      "The newsroom and Hollywood fights show workers increasingly treat ",
      { bold: "AI notification rights, byline control, and training data consent" },
      " as the new floor of what any contract must include. What We Will is actively seeking to build relationships with creative and Hollywood workers and organizations in coalition for AI policy campaigns.",
    ],
  },
  {
    type: "paragraph",
    text: "Please reach out if you have contacts. We'd love to connect!",
  },
];
