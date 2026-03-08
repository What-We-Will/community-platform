import Image from "next/image";
import { User } from "lucide-react";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image?: string;
};

const FOUNDING_TEAM: TeamMember[] = [
  {
    name: "Kaitlin Cort",
    role: "Co-Founder, Executive Director",
    bio: "Leads strategy and partnerships. Former labor organizer with a focus on tech and gig workers.",
  },
  {
    name: "Daniel Buk",
    role: "Co-Founder, Partnerships Research & Digital Outreach",
    bio: "Runs mutual aid, skill-sharing, and job support initiatives. Background in community organizing.",
  },
  {
    name: "Kyle Albasi",
    role: "Creative Director & Media Strategy",
    bio: "Advances human-first AI and worker protections in policy. Previously worked on labor and tech policy.",
  },
  {
    name: "Charise Van Liew",
    role: "Fundraising & Development",
    bio: "Builds and supports our member community. Ensures members have the tools and connections they need.",
  },
  {
    name: "Jennifer Tovar",
    role: "Curriculum Developer & Entry-Level Worker Support",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Sabrina Shuss",
    role: "Program Manager & Operations",
    bio: "Keeps our platforms and operations running. Focus on accessible, member-centered technology.",
  },
];

const CORE_ORGANIZING_TEAM: TeamMember[] = [
  {
    name: "Shannon Wait",
    role: "Lead Organizer - Policy & Advocacy Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Abdhulladi Zaidan",
    role: "Lead Organizer - Community Job Support Program",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Hope Jidenma",
    role: "Lead Organizer - Marketing Team & Content Strategy",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Simon McGraw",
    role: "Lead Organizer - Tech Worker Cooperative & Platform Engineering",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "Simantha Pathak",
    role: "Lead Organizer - Participatory Action Research Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
  {
    name: "George Dover",
    role: "Lead Organizer - Layoff Crisis Response Team",
    bio: "Leads storytelling and outreach. Connects our work to the broader movement for worker power.",
  },
];

function TeamCard({
  name,
  role,
  bio,
  image,
}: {
  name: string;
  role: string;
  bio: string;
  image?: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full shrink-0 bg-muted flex items-center justify-center overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <User className="h-20 w-20 text-muted-foreground/60" aria-hidden />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-sm font-medium text-primary-orange">{role}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {bio}
        </p>
      </div>
    </article>
  );
}

function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <ul className="mt-4 grid grid-cols-3 gap-4 lg:grid-cols-4">
      {members.map((member) => (
        <li key={member.name} className="h-full">
          <TeamCard
            name={member.name}
            role={member.role}
            bio={member.bio}
            image={member.image}
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
            Core Organizing Team
          </h2>
          <TeamGrid members={CORE_ORGANIZING_TEAM} />
        </div>
      </div>
    </section>
  );
}
