import Image from "next/image";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image?: string;
  imagePosition?: string;
};

const FOUNDING_TEAM: TeamMember[] = [
  {
    name: "Kaitlin Cort",
    role: "Founder/Co-Director, Lead Organizer & Platform Engineer",
    bio: "Shaping vision, strategy, programs and partnerships. Software engineer with background in government executive leadership, policy research, and labor organizing.",
  },
  {
    name: "Charise Van Liew",
    role: "Co-Director, Fundraising & Development",
    bio: "Strategic resource development specialist, with 20+ years of nonprofit executive leadership. Passionate about youth empowerment and social justice.",
  },
  {
    name: "Kyle Albasi",
    role: "Creative Director & Media Strategy",
    bio: "Creative Director shaping our visual identity, narrative content, and creative media campaigns. Video producer, graphic designer, and writer.",
  },
  {
    name: "Sabrina Shuss",
    role: "Program Manager & Operations",
    bio: "Project manager and operations specialist, with financial management skills. Coordinating volunteer teams and ensuring our daily programs run smoothly.",
  },
  {
    name: "Daniel Buk",
    role: "Partnerships Research & Digital Outreach",
    bio: "Research specialist leading digital outreach and prospective partnerships. M.A. in Labor Studies from CUNY School of Labor and Urban Studies.",
  },
  {
    name: "Helen Yang",
    role: "Tech Worker Organizing & Political Education",
    bio: "Championing worker-led organizing within workplaces, and broader tech industry activism at the Tech Workers Coalition.",
  },
];

const CORE_TEAM: TeamMember[] = [
  {
    name: "Joshua S-R.",
    role: "Movement-Building, Policy & Research",
    bio: "",
  },
  {
    name: "Andrew M.",
    role: "Lead Organizer - Policy & Advocacy Working Group",
    bio: "",
  },
  {
    name: "Sonia J.",
    role: "Lead Organizer - Participatory Action Research Working Group",
    bio: "",
  },
  {
    name: "Margaret G.",
    role: "Researcher & Policy Analysis",
    bio: "",
  },
  {
    name: "Isaac L.",
    role: "Lead Organizer - Community Job Support Program",
    bio: "",
  },
  {
    name: "Tony R.",
    role: "Lead Platform Engineer, WWW Tech Worker Cooperative",
    bio: "",
  },
  {
    name: "Tim C.",
    role: "Lead Platform Engineer, WWW Tech Worker Cooperative",
    bio: "",
  },
  {
    name: "Annette S.",
    role: "Product Manager - Layoff Crisis Support",
    bio: "",
  },
  {
    name: "Allen P.",
    role: "Media & Newsletter",
    bio: "",
  },
  {
    name: "Warren L.",
    role: "Education & Curriculum-Development",
    bio: "",
  },
];

function TeamCard({
  name,
  role,
  bio,
  image,
  imagePosition,
}: {
  name: string;
  role: string;
  bio: string;
  image?: string;
  imagePosition?: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {image && (
        <div className="relative w-full shrink-0 overflow-hidden" style={{ height: "160px" }}>
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            style={{ objectPosition: imagePosition ?? "top" }}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-sm font-medium text-primary-orange">{role}</p>
        {bio && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {bio}
          </p>
        )}
      </div>
    </article>
  );
}

function TeamGrid({ members, showBio = true }: { members: TeamMember[]; showBio?: boolean }) {
  return (
    <ul className="mt-4 grid grid-cols-3 gap-4 lg:grid-cols-4">
      {members.map((member) => (
        <li key={member.name} className="h-full">
          <TeamCard
            name={member.name}
            role={member.role}
            bio={showBio ? member.bio : ""}
            image={member.image}
            imagePosition={member.imagePosition}
          />
        </li>
      ))}
    </ul>
  );
}

export function AboutTeam() {
  return (
    <section className="border-t bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl space-y-16">
        <div>
          <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
            Founding Members
          </h2>
          <TeamGrid members={FOUNDING_TEAM} />
        </div>

        <div>
          <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
            Core Organizers
          </h2>
          <TeamGrid members={CORE_TEAM} showBio={false} />
        </div>
      </div>
    </section>
  );
}
