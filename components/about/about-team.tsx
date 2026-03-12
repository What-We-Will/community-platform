import Image from "next/image";
import { User } from "lucide-react";

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
    role: "Co-Founder, Executive Director",
    bio: "Lead organizer shaping strategy, programs, partnerships, and platform. Software engineer and educator, with background in labor organizing, policy research, government leadership, and 20+ years in nonprofit management.",
  },
  {
    name: "Daniel Buk",
    role: "Co-Founder, Partnerships Research & Digital Outreach",
    bio: "Research specialist leading digital outreach and prospective partnerships. M.A. in Labor Studies from CUNY School of Labor and Urban Studies.",
  },
  {
    name: "Kyle Albasi",
    role: "Co-Founder, Creative Director & Media Strategy",
    bio: "Creative Director shaping our visual identity, narrative content, and creative media campaigns. Video producer, graphic designer, and writer.",
  },
  {
    name: "Jennifer Tovar",
    role: "Co-Founder, Curriculum Developer & Early Career Worker Support",
    bio: "Helping entry-level workers and youth in our community with relevant skill-building and career resources.",
  },
  {
    name: "Helen Yang",
    role: "Board Member, Tech Worker Organizing & Political Education",
    bio: "Championing worker-led organizing within workplaces, and broader tech industry activism at the Tech Workers Coalition.",
  },
  {
    name: "Charise Van Liew",
    role: "Fundraising & Development",
    bio: "Strategic resource development specialist, with 20+ years of nonprofit executive leadership. Passionate about youth empowerment and social justice.",
  },
  {
    name: "Sabrina Shuss",
    role: "Program Manager & Operations",
    bio: "Project manager and operations specialist, with financial management skills. Coordinating volunteer teams and ensuring our daily programs run smoothly.",
  },
];

const CORE_ORGANIZING_TEAM: TeamMember[] = [
  {
    name: "Shannon W.",
    role: "Lead Organizer - Policy & Advocacy Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Hope J.",
    role: "Lead Organizer - Digital Organizing & Social Media Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Abdulhadi Z.",
    role: "Lead Organizer - Community Job Support Program",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Simon M.",
    role: "Lead Organizer - WWW Tech Worker Cooperative",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "George D.",
    role: "Co-Lead Organizer - Layoff Crisis Response Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Sonia J.",
    role: "Co-Lead Organizer - Participatory Research Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Simantha P.",
    role: "Co-Lead Organizer - Participatory Research Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Margaret G.",
    role: "Co-Lead - Job Support & Participatory Research Teams",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
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
            Founding Team
          </h2>
          <TeamGrid members={FOUNDING_TEAM} />
        </div>

        <div>
          <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
            Core Team
          </h2>
          <TeamGrid members={CORE_ORGANIZING_TEAM} showBio={false} />
        </div>
      </div>
    </section>
  );
}
