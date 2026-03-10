import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata = {
  title: "Our Platform | What We Will",
  description:
    "A quick visual tour of the What We Will membership platform—directory, groups, events, and more.",
};

/** Card outline colors (left to right from brand swatches) — cycle through for each card */
const CARD_OUTLINE_COLORS = ["#364F5B", "#B35D43", "#879C81", "#D9AC63"];

export default async function OurPlatformPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-muted/30 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-bebas text-5xl tracking-tight text-foreground md:text-6xl">
              Our Platform
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              We build infrastructure for mutual aid.
            </p>
          </div>
        </section>

        {/* Platform feature cards */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: "Community Job Board",
                description:
                  "Browse and post job openings shared by members with Community Notes feature to share insights and tips. Find referrals and connect for mock interviews.",
                image: "/images/platform/community-job-board.png",
              },
              {
                title: "Layoff Crisis Support",
                description:
                  "Secure communication channels when you leave your company Slack. Peer counseling during layoffs, with know-your-rights trainings, benefits navigation, and organizing support for severance negotiation and collective bargaining.",
                image: "/images/platform/layoff-crisis-support.png",
              },
              {
                title: "Shared Learning Tools",
                description:
                  "Create study groups for a curated lists of resources, organized by skill paths. Join workshops and skillshares by community members. Daily Standups.",
                image: "/images/platform/shared-learning-tools.png",
              },
              {
                title: "Job Application Tracker",
                description:
                  "Track your applications and interviews. Compare notes with other job seekers, and get metrics on your progress. Connect for mock interviews, DSA sessions, and shared tools to overcome AI screeners.",
                image: "/images/platform/job-application-tracker.png",
              },
              {
                title: "Civic Tech Projects",
                description:
                  "Collaborate on open source projects that serve workers and communities. Learn skills, get mentorship, and exchange stars.",
              },
              {
                title: "Resource Library",
                description:
                  "Share resources, templates, and links. Vetted by the community for quality and relevance.",
              },
            ].map(({ title, description, image }, index) => {
              const outlineColor =
                CARD_OUTLINE_COLORS[index % CARD_OUTLINE_COLORS.length];
              return (
              <div
                key={title}
                className="flex flex-col overflow-hidden rounded-lg border-2 bg-card"
                style={{ borderColor: outlineColor }}
              >
                <div className="relative aspect-[3/2] bg-muted/50">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${title} screenshot`}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Visual placeholder — {title}
                    </span>
                  )}
                </div>
                <div
                  className="p-4"
                  style={{ borderTop: `2px solid ${outlineColor}` }}
                >
                  <h2 className="font-semibold" style={{ color: outlineColor }}>
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* Coming soon */}
        <section className="border-t border-border/40 bg-muted/20 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Coming soon…
            </p>
            <ul className="mt-6 flex flex-col items-center gap-3 text-center md:flex-row md:justify-center md:gap-10">
              <li className="font-bebas text-2xl tracking-tight text-foreground md:text-3xl">
                Basic Income Pilot
              </li>
              <li className="hidden text-muted-foreground md:block" aria-hidden>
                ·
              </li>
              <li className="font-bebas text-2xl tracking-tight text-foreground md:text-3xl">
                Mutual Aid Fund
              </li>
            </ul>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
