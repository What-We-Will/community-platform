import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/utils/get-site-url";
import Link from "next/link";

export const metadata = {
  title: "Our Platform | What We Will",
  description:
    "A quick visual tour of the What We Will membership platform—directory, groups, events, and more.",
};

const FEATURES = [
  {
    title: "Community Job Board",
    description:
      "Browse and post job openings shared by members, with Community Notes to share insights and tips. Find referrals, connect for mock interviews, and surface opportunities that center worker power.",
    bullets: [
      "Member-powered job postings with real context",
      "Community Notes for interview tips and red flags",
      "Warm intros and mock interview matchmaking",
    ],
    image: "/images/platform/community-job-board.png",
  },
  {
    title: "Layoff Crisis Support",
    description:
      "A safe space to land when you lose access to company tools. Coordinate with peers, understand your rights, and navigate the chaos of layoffs together.",
    bullets: [
      "Private channels outside company Slack",
      "Know-your-rights trainings and benefits navigation",
      "Support for severance negotiations and collective action",
    ],
    image: "/images/platform/layoff-crisis-support.png",
  },
  {
    title: "Shared Learning Tools",
    description:
      "Organize skill-building with people who care about the same fights you do. Turn scattered links into accountable learning circles.",
    bullets: [
      "Study groups with curated resource paths",
      "Community-led workshops and skillshares",
      "Daily standups and accountability check-ins",
    ],
    image: "/images/platform/shared-learning-tools.png",
  },
  {
    title: "Job Application Tracker",
    description:
      "Track every application alongside other job seekers, compare notes, and get practical support to move through biased hiring systems.",
    bullets: [
      "Simple, shared tracking for applications and interviews",
      "Patterns and metrics across the community",
      "Strategies and tools to navigate AI screeners",
    ],
    image: "/images/platform/job-application-tracker.png",
  },
  {
    title: "Civic Tech Projects",
    description:
      "Collaborate on open-source tools that serve workers and communities, not investors. Learn by doing with mentorship from peers.",
    bullets: [
      "Real projects that support worker organizing",
      "Mentorship across disciplines and experience levels",
      "A path to building a public portfolio together",
    ],
    image: "/images/platform/civic-tech-projects.png",
  },
  {
    title: "Resource Library",
    description:
      "Keep the best templates, guides, and explainers in one place, maintained and vetted by the people who actually use them.",
    bullets: [
      "Shared library of contracts, guides, and toolkits",
      "Community curation for relevance and accuracy",
      "Saved searches for moments of urgency and crisis",
    ],
    image: "/images/platform/resource-library.png",
  },
];

export default async function OurPlatformPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const siteUrl = getSiteUrl();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        {/* Light intro, focused on what the platform does */}
        <section className="border-b border-border/40 bg-muted/30 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-4 font-bebas text-4xl sm:text-5xl md:text-6xl">
              Our Platform
            </h1>
            <div className="inline-flex items-center gap-2 mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />
              <span>Currently launched in beta</span>
            </div>
            <p className="mt-4 text-lg leading-relaxed sm:text-xl">
              We build community and infrastructure for those looking for work, navigating a crisis,
              learning new skills, and organizing with others.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                className="rounded-lg bg-primary-orange px-8 text-base font-semibold text-white shadow-md hover:bg-primary-orange-hover"
                asChild
              >
                <Link href={`${siteUrl}/login`}>Login to our platform</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Alternating feature sections */}
        <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">

          <div className="mt-10 space-y-16 md:space-y-20">
            {FEATURES.map((feature, index) => {
              const isEven = index % 2 === 0;
              const colorClass =
                index % 3 === 0
                  ? "bg-primary-orange"
                  : index % 3 === 1
                    ? "bg-accent-green"
                    : "bg-accent-gold";

              return (
                <article
                  key={feature.title}
                  className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm md:p-8"
                >
                  <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div
                      className={`flex-1 space-y-3 md:space-y-4 ${
                        isEven ? "md:order-1" : "md:order-2"
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-2 text-left text-white ${colorClass}`}
                      >
                        <h3 className="font-bebas text-2xl tracking-tight md:text-3xl">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                        {feature.description}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        {feature.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span className={`mt-1 h-1.5 w-1.5 rounded-full ${colorClass}`} />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className={`relative flex-1 ${
                        isEven ? "md:order-2" : "md:order-1"
                      }`}
                    >
                      <div className="relative mx-auto h-64 max-w-sm overflow-hidden rounded-xl bg-muted/40 shadow-inner md:h-72">
                        <Image
                          src={feature.image}
                          alt={`${feature.title} screenshot`}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 768px) 100vw, 40vw"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Coming soon / pilots */}
        <section className="border-t border-border/40 bg-muted/20 px-4 py-12 md:py-16">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                In pilot with members
              </p>
              <h2 className="mt-2 font-bebas text-3xl tracking-tight text-foreground md:text-4xl">
                New ways to move resources directly to workers
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                As we grow, we are testing tools like income pilots and mutual
                aid funds that sit on top of the core platform. These pilots are
                co-designed with members and partners.
              </p>
            </div>
            <ul className="grid gap-4 text-sm md:w-80">
              <li className="rounded-lg bg-background/80 p-4 shadow-sm ring-1 ring-border/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-orange">
                  Coming soon
                </p>
                <a
                  href="https://aicommonsproject.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-bebas text-xl tracking-tight text-foreground hover:text-primary-orange"
                >
                  Basic Income Pilot
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exploring ways to provide more stable income for workers
                  building and using the platform.
                </p>
              </li>
              <li className="rounded-lg bg-background/80 p-4 shadow-sm ring-1 ring-border/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-orange">
                  Coming soon
                </p>
                <p className="mt-1 font-bebas text-xl tracking-tight text-foreground">
                  Mutual Aid Fund
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shared funds for emergencies, organizing, and care work within
                  the community.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
