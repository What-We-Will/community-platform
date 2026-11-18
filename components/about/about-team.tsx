import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type TeamMember = {
  name: string;
  role: string;
  bio: ReactNode;
  image?: string;
  imagePosition?: string;
};

const WORKING_GROUPS: TeamMember[] = [
  {
    name: "Steering Committee",
    role: "Elected Worker Representatives",
    bio: (
      <>
        Shaping strategy, programs, partnerships, budgets, and the creation of new working groups.
        <br />
        <br />
        <span className="text-xs">
          Board members with fiduciary responsibility can take part, but do not make decisions for the collective.
        </span>
      </>
    ),
  },
  {
    name: "Organizing Working Group",
    role: "Layoff Crisis Support",
    bio: (
      <span className="text-xs">
        Join to learn organizing skills and movement strategy, support fellow workers facing layoffs, and fight alongside other organizations for worker power and dignity.
        <br />
        <br />
        <span className="text-[0.625rem]">
          <b>Past campaigns:</b> Collective severance negotiation with 600+{" "}
          <Link
            href="https://movement.wwwrise.org/oracle"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
          >
            Oracle workers
          </Link>
          , and fighting AI workplace surveillance at{" "}
          <Link
            href="https://www.techpolicy.press/tech-workers-are-fighting-against-silicon-valleys-ai-push"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
          >
            Meta
          </Link>
          .
        </span>
      </span>
    ),
  },
  {
    name: "Community Job Support",
    role: "Job Search Councils & Daily Programming",
    bio: (
      <>
        Community-building, job search support and workshops, mutual aid, remote co-working, games, movies, and fun activities.
        <br />
        <br />
        This is the heart of our community. If you&apos;re newly unemployed,{" "}
        <Link
          href="https://slack.wwwrise.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
        >
          join here
        </Link>
        .
      </>
    ),
  },
  {
    name: "Participatory Action Research Team",
    role: "Interviews & Publications",
    bio: (
      <>
        <span className="text-xs">
        Join the team to practice participatory research skills, and help gather stories, data, and insights from workers to inform our organizing and advocacy.
        <br />
        <br />
          In partnership with{" "}
          <Link
            href="https://techequity.us"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
          >
            Tech Equity
          </Link>
          , publication forthcoming Dec. 2026.
        </span>
      </>
    ),
  },
  {
    name: "Advocacy Working Group",
    role: "Public Education & Policy Research",
    bio: (
      <span className="text-xs">
        Join this team to better understand laws and policy proposals that impact workers. Help create public education programs, worker storytelling and media trainings, and virtual events.
        <br />
        <br />
        Be part of coalitions in CA, NY, and federally, advocating for worker rights and a stronger social safety net.
      </span>
    ),
  },
  {
    name: "Platform Engineering Team",
    role: "Worker-Owned Tech Cooperative",
    bio: (
      <>
        We build the tools and platforms that power our organization.
        <br />
        <br />
        <span className="text-xs">
          Join to help us build a membership platform and organizing tools that are secure, accessible, and open source. Part of a long-term goal to build a cooperative that can provide paid work to unemployed workers.
        </span>
      </>
    ),
  },
  {
    name: "Media & Digital Organizing",
    role: "Newsletter & Social Media",
    bio: (
      <>
        Inspire the Gen-Z, Millennial, and Gen-X workers facing layoffs and prolonged unemployment.
        <br />
        <br />
        <span className="text-xs">
          Join to help build creative campaigns, and empower a broader movement.
        </span>
      </>
    ),
  },
  {
    name: "Governance, Safety Committees",
    role: "How we work together",
    bio: (
      <>
        Staying in alignment with our values and principles.
        <br />
        <br />
        <span className="text-xs">
          Join to help us maintain a cooperative culture of care that ensures safety, accountability, and transparency.
        </span>
      </>
    ),
  },
];

const CORE_TEAM: TeamMember[] = [
  {
    name: "AM",
    role: "Lead Organizer - Advocacy & Policy Research",
    bio: "",
  },
  {
    name: "AS",
    role: "Product Manager / Layoff Crisis Support",
    bio: "",
  },
  {
    name: "AT",
    role: "Governance / Policy / Fundraising",
    bio: "",
  },
  {
    name: "BB",
    role: "Community Job Support / Engineering & Policy",
    bio: "",
  },
  {
    name: "CV",
    role: "Fundraising & Grants",
    bio: "",
  },
  {
    name: "DH",
    role: "Lead Organizer & Participatory Action Researcher",
    bio: "",
  },
  {
    name: "DM",
    role: "Engineer / Community Job Support",
    bio: "",
  },
  {
    name: "EO",
    role: "Lead Community Builder - Engineer / Job Search Council",
    bio: "",
  },
  {
    name: "HJ",
    role: "Lead Organizer - Media & Digital Organizing Team",
    bio: "",
  },
  {
    name: "KA",
    role: "Designer / Media",
    bio: "",
  },
  {
    name: "KC",
    role: "Lead Organizer - Layoff Crisis Support / Organizing & Policy",
    bio: "",
  },
  {
    name: "MG",
    role: "Researcher / Job Search Council facilitator",
    bio: "",
  },
  {
    name: "MM",
    role: "Lead Organizer & Technologist / Layoff Crisis Support",
    bio: "",
  },
  {
    name: "SJ",
    role: "Lead Organizer - Participatory Action Research",
    bio: "",
  },
  {
    name: "SS",
    role: "Lead Organizer - Community Job Support",
    bio: "",
  },
  {
    name: "TR",
    role: "Lead Organizer - Platform Engineering Team",
    bio: "",
  }
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
  bio: ReactNode;
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
            Workers Collective
          </h2>
          <p className="mx-auto mt-8 max-w-4xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            As a democratic and worker-led organization, we share in distributed decision-making across <b>Working Groups</b> and the <b>Steering Committee</b>, which is elected by the <b>Assembly</b> of all members.
          </p>
          <p className="mx-auto mt-8 max-w-4xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            All members have a vote in our weekly{" "}
            <Link
              href="https://tinyurl.com/calendarwww"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
            >
              All Hands
            </Link>{" "}
            meeting. We encourage you to join and take ownership in our{" "}
            <Link
              href="https://www.theselc.org/worker_selfdirected_nonprofits"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
            >
              cooperative organization
            </Link>
            . In the model of sociocracy, we value worker solidarity, mutual aid, and organize to empower leadership by directly impacted workers across diverse experiences and fields.
          </p>
          <br/>
          <TeamGrid members={WORKING_GROUPS} />
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
