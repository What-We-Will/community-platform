import Image from "next/image";
import { User } from "lucide-react";

const TEAM = [
  {
    name: "Jordan Rivera",
    role: "Executive Director",
    bio: "Leads strategy and partnerships. Former labor organizer with a focus on tech and gig workers.",
  },
  {
    name: "Sam Chen",
    role: "Director of Programs",
    bio: "Runs mutual aid, skill-sharing, and job support initiatives. Background in community organizing.",
  },
  {
    name: "Alex Kim",
    role: "Policy & Advocacy Lead",
    bio: "Advances human-first AI and worker protections in policy. Previously worked on labor and tech policy.",
  },
  {
    name: "Morgan Hayes",
    role: "Community & Membership",
    bio: "Builds and supports our member community. Ensures members have the tools and connections they need.",
  },
  {
    name: "Riley Park",
    role: "Operations & Technology",
    bio: "Keeps our platforms and operations running. Focus on accessible, member-centered technology.",
  },
  {
    name: "Casey Wright",
    role: "Communications",
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

export function AboutTeam() {
  return (
    <section className="border-t bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
          Our Core Team
        </h2>
        <p className="mt-2 max-w-full text-muted-foreground">
          The people who drive our mission every day—organizers, advocates, and operators committed to building worker power.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TEAM.map((member) => (
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
      </div>
    </section>
  );
}
