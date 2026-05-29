export type ProgramIconKey =
  | "heartHandshake"
  | "handshake"
  | "handHelping"
  | "handFist";

export type ProgramCampaign = {
  title: string;
  location: string;
  status: string;
  href?: string;
};

export type Program = {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  icon: ProgramIconKey;
  highlights: string[];
  campaigns?: ProgramCampaign[];
  barClass: string;
  textClass: string;
  iconClass: string;
  panelAccentClass: string;
};

export const corePrograms: Program[] = [
  {
    id: "crisis-support",
    title: "Crisis Layoff Support",
    tagline: "Rapid response in the first 48 hours after layoff",
    summary:
      "When workers are laid off, we provide immediate, worker-centered support so no one navigates the challenges alone.",
    icon: "heartHandshake",
    highlights: [
      "Secure, anonymous platform to reconnect with colleagues",
      "Referrals to legal, immigration, and healthcare resources",
      "Plain-language guidance on severance, benefits, and negotiation",
      "Peer support and mutual aid during the shock period",
      "Aggregate severance data to identify unfair or discriminatory practices",
      "Support strategic media storytelling and collective action",
    ],
    barClass: "bg-primary-orange",
    textClass: "text-white",
    iconClass: "text-white",
    panelAccentClass: "border-primary-orange/30 bg-primary-orange/5",
  },
  {
    id: "workforce-development",
    title: "Workforce Development",
    tagline: "Reimagining the tech ecosystem for displaced workers",
    summary:
      "Connecting laid-off workers and aspiring junior workers through project-based learning, mentorship, and pathways into civic tech, cooperatives, and new careers.",
    icon: "handshake",
    highlights: [
      "Peer support groups, unemployment resources, and job search support",
      "Project-based learning and mentorship connections",
      "First guaranteed income pilot supporting workers displaced by A.I. with $1000/month for 12 months",
      "Community job referrals and mutual aid network",
      "Training on local and open source AI development, small fine-tuned language models, for worker power",
      "Career transition guidance, workers' rights workshops",
      "Advocacy for increased public funding for AI-displaced workers",
    ],
    barClass: "bg-accent-gold",
    textClass: "text-dark-blue",
    iconClass: "text-dark-blue",
    panelAccentClass: "border-accent-gold/40 bg-accent-gold/10",
  },
  {
    id: "media-research",
    title: "Media & Research",
    tagline: "Political education, storytelling, and participatory research",
    summary:
      "We document the impact of AI on work through participatory action research, publish worker stories, and build political consciousness through curriculum and events.",
    icon: "handHelping",
    highlights: [
      "Participatory action research with TechEquity on the experiences and concerns of AI-displaced workers",
      "Weekly newsletter with layoff tracking and job market analysis",
      "Thought leadership: long-form interviews with organizers, academics, and policy experts",
      "Short-form media: layoff diaries, AI myths exposed, know-your-rights in 60 seconds",
      "Curriculum on labor law, tech labor history, civic tech, and organizing fundamentals",
    ],
    barClass: "bg-accent-blue",
    textClass: "text-white",
    iconClass: "text-white",
    panelAccentClass: "border-accent-blue/30 bg-accent-blue/5",
  },
  {
    id: "advocacy",
    title: "Policy Research & Organizing",
    tagline: "From participatory action research to coalition wins",
    summary:
      "Direct services build our organizing base. We spend a limited time on broad policy research while awaiting 501(c)4 status, and support coalitions in CA and NY to win stronger layoff protections, expanded unemployment insurance, portable benefits, and worker voice in AI governance.",
    icon: "handFist",
    highlights: [
      "We've launched the sovereign wealth fund / basic income pilot for A.I.-displaced workers (mydividend.ai)",
      "Exploring various policy models for redistributive income stabilization, AI legislation, strengthened WARN notification and unemployment insurance",
      "Coalition-building and worker storytelling",
      "Portable benefits and 32-hour work week: a worker-centered AI New Deal for shared prosperity",
      "Worker voice in technology governance, centering humans",
    ],
    campaigns: [
      {
        title: "No Robo Bosses Act",
        location: "California",
        status: "Revised bill expected April 2026",
        href: "/programs/no-robo-bosses",
      },
      {
        title: "Workforce Stabilization Act",
        location: "New York",
        status: "Pending — S1854A / A5429",
      },
      {
        title: "AI Workforce Impact Transparency Act",
        location: "New York",
        status: "Introduced Jan. 2026 — S8928",
      },
    ],
    barClass: "bg-accent-green",
    textClass: "text-dark-blue",
    iconClass: "text-dark-blue",
    panelAccentClass: "border-accent-green/40 bg-accent-green/10",
  },
];

export const navProgramLinks = [
  {
    label: "Mass Call",
    href: "https://movement.wwwrise.org",
    external: true as const,
  },
  {
    label: "No Robo Bosses",
    href: "/programs/no-robo-bosses",
    external: false as const,
  },
];
