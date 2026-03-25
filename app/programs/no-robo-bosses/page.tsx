import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  Bell,
  Users,
  ArrowRight,
  ExternalLink,
  Gavel,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "No Robo Bosses Act | What We Will",
  description:
    "California's No Robo Bosses Act (SB 947) demands human oversight of AI decisions affecting workers' jobs. Learn about the bill, why it matters, and how to get involved.",
};

export default async function NoRoboBossesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="bg-dark-blue px-4 py-20 text-white md:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80">
              <Gavel className="size-3.5" />
              California SB 947 &amp; SB 951 · 2026 Legislative Session
            </div>
            <h1 className="font-bebas text-5xl uppercase tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              No Robo Bosses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Right now, there are{" "}
              <strong className="text-white">
                no restrictions on how employers use AI to fire, discipline,
                or lay off workers
              </strong>{" "}
              in California. The No Robo Bosses Act changes that, and we're
              fighting to make it law.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="rounded-lg bg-primary-orange px-8 text-base font-semibold text-white shadow-md hover:bg-primary-orange-hover"
                asChild
              >
                <Link href="/share-your-story">
                  Share Your Story
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-lg border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="#take-action">
                  Take Action
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Why this fight matters ─── */}
        <section className="bg-white px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-orange">
              The Crisis
            </p>
            <h2 className="font-bebas text-4xl text-dark-blue sm:text-5xl">
              Machines don't get to end your livelihood.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-foreground/80 sm:text-lg">
              Every month, more employers are using AI to automate, erode, and
              eliminate jobs without oversight, accountability, or the
              requirement to tell workers or the public what's happening.
              Companies like Amazon, Salesforce, and Dow Chemical have
              announced mass layoffs and hiring freezes driven by AI investment,
              while workers bear all the costs and share none of the gains.
            </p>
            <blockquote className="mt-8 border-l-4 border-primary-orange pl-5">
              <p className="text-lg font-medium italic leading-relaxed text-dark-blue">
                "Employers are devastating workers&apos; livelihoods and taking
                no responsibility for the callous decisions of this unchecked
                technology. This is unacceptable."
              </p>
              <cite className="mt-3 block text-sm font-semibold text-muted-foreground not-italic">
                — Lorena Gonzalez, President, California Federation of Labor
                Unions, AFL-CIO
              </cite>
            </blockquote>
          </div>
        </section>

        {/* ─── The Bills ─── */}
        <section className="bg-white px-4 py-16 md:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-orange">
              The Legislation
            </p>
            <h2 className="font-bebas text-4xl text-dark-blue sm:text-5xl">
              Two bills. One fight for worker power.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              In February 2026, the California Federation of Labor Unions, AFL-CIO unveiled two
              landmark bills to protect workers in the age of AI.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {/* SB 947 */}
              <div className="flex flex-col gap-4 rounded-2xl border border-primary-orange/20 bg-primary-orange/5 p-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-orange/15">
                  <ShieldCheck className="size-6 text-primary-orange" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-orange">
                    SB 947
                  </span>
                  <h3 className="mt-1 font-bebas text-2xl text-dark-blue sm:text-3xl">
                    No Robo Bosses Act
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Authored by Sen. Jerry McNerney (D-Pleasanton)
                  </p>
                </div>
                <p className="text-base leading-relaxed text-foreground/80">
                  Prohibits employers from using AI to{" "}
                  <strong>discipline or terminate workers</strong> without
                  meaningful human oversight. No algorithm should be able to
                  end your job or cut your pay without a human being held
                  accountable for that decision.
                </p>
                <ul className="mt-2 space-y-2">
                  {[
                    "Requires human review of any AI-driven discipline or termination",
                    "Creates accountability for employers who automate punitive decisions",
                    "A reintroduction of SB 7 — which passed both chambers but was vetoed",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-orange" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SB 951 */}
              <div className="flex flex-col gap-4 rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent-blue/15">
                  <Bell className="size-6 text-accent-blue" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-accent-blue">
                    SB 951
                  </span>
                  <h3 className="mt-1 font-bebas text-2xl text-dark-blue sm:text-3xl">
                    AI Job Killer Notice Act
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Authored by Sen. Eloise Gómez Reyes (D-Colton)
                  </p>
                </div>
                <p className="text-base leading-relaxed text-foreground/80">
                  Requires employers to give{" "}
                  <strong>advance notice to workers, local government, and
                  the EDD</strong> before AI-driven layoffs or hiring
                  reductions. Updates the California WARN Act to cover
                  technological displacement, not just industrial.
                </p>
                <ul className="mt-2 space-y-2">
                  {[
                    "Advance notice required before AI-driven layoffs or hiring freezes",
                    "EDD collects and publishes data on AI's real impact on jobs",
                    "Gives policymakers and the public a clear picture of displacement",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-blue" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── The fight so far ─── */}
        <section className="bg-muted px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-orange">
              The History
            </p>


            <div className="mt-10 space-y-0">
              {[
                {
                  year: "2025",
                  label: "SB 7 passes both chambers",
                  body: "The original No Robo Bosses Act passed the full California State Assembly and Senate, a victory demonstrating broad support for AI worker protections.",
                  color: "border-accent-green",
                  dotColor: "bg-accent-green",
                },
                {
                  year: "Sept 2025",
                  label: "Newsom vetoes SB 7",
                  body: "Despite bipartisan legislative support, Gov. Newsom veoted the bill. Workers were sent back to square one to fight for its passage with no guardrails on algorithmic discipline or AI-driven layoffs.",
                  color: "border-primary-orange",
                  dotColor: "bg-primary-orange",
                  alert: true,
                },
                {
                  year: "Feb 3, 2026",
                  label: "SB 947 & SB 951 introduced",
                  body: "The No Robo Bosses Act was reintroduced as SB 947, alongside the new AI Job Killer Notice Act (SB 951).",
                  color: "border-accent-gold",
                  dotColor: "bg-accent-gold",
                },
                {
                  year: "Now",
                  label: "The fight is on to get them passed",
                  body: "These bills are moving through the 2026 California legislative session. Every contact with a legislator, every worker who shares their story, and every organizer who shows up moves this forward.",
                  color: "border-dark-blue",
                  dotColor: "bg-dark-blue",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div
                      className={`mt-1 size-3 shrink-0 rounded-full ${item.dotColor}`}
                    />
                    {i < 3 && (
                      <div className="w-0.5 flex-1 bg-border/60" />
                    )}
                  </div>
                  <div className={`border-l-2 pl-5 pb-8 ${item.color}`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {item.year}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold text-dark-blue">
                      {item.alert && (
                        <AlertTriangle className="mr-1.5 inline size-4 text-primary-orange" />
                      )}
                      {item.label}
                    </h3>
                    <p className="mt-1 text-base leading-relaxed text-foreground/75">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why WWW is in this fight ─── */}
        <section className="bg-white px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-orange">
              Our Position
            </p>
            <h2 className="font-bebas text-4xl text-dark-blue sm:text-5xl">
              Workers need protection from AI layoffs.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              As companies work to rapidly deploy AI agents across the economy, we need
              legislation to ensure these systems remain transparent and that workers
              don't bear the burden.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Human oversight is non-negotiable",
                  body: "No worker should lose their job, their pay, or their livelihood because an algorithm made a decision no human is accountable for. We demand human review in every AI-driven workplace decision.",
                },
                {
                  icon: Bell,
                  title: "Transparency is a worker right",
                  body: "If a company is using AI to cut jobs, workers, local governments, and the public have a right to know before it happens. The AI Job Killer Notice Act extends WARN Act protections to tech-driven displacement.",
                },
                {
                  icon: Users,
                  title: "Collective power wins these fights",
                  body: "SB 7 passed because workers organized. It was vetoed because corporations lobbied harder. The answer is more organizing, more pressure, and more solidarity. What We Will is building that power.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex flex-col gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary-orange/10">
                    <Icon className="size-5 text-primary-orange" />
                  </div>
                  <h3 className="font-semibold text-dark-blue">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Take Action ─── */}
        <section
          id="take-action"
          className="bg-dark-blue px-4 py-16 text-white md:py-20"
        >
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-gold">
              Take Action
            </p>
            <h2 className="font-bebas text-4xl sm:text-5xl">
              Workers cannot go another year unprotected.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
              Passing these bills will require workers to organize, contact their legislators, and share their stories. Here's where to start.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href="https://openstates.org/ca/bills/20252026/SB947/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 rounded-xl border border-white/15 bg-white/5 p-5 transition-colors hover:border-accent-gold/40 hover:bg-white/10"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-gold/20">
                  <Gavel className="size-5 text-accent-gold" />
                </div>
                <h3 className="font-semibold text-white">
                  Track the bill
                </h3>
                <p className="text-sm leading-relaxed text-white/65">
                  Follow SB 947 through the California Legislature. Know when
                  committee votes are scheduled and when your voice is most
                  needed.
                </p>
                <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-accent-gold group-hover:underline">
                  Open States <ExternalLink className="size-3.5" />
                </span>
              </a>

              <Link
                href="/share-your-story"
                className="group flex flex-col gap-3 rounded-xl border border-white/15 bg-white/5 p-5 transition-colors hover:border-primary-orange/40 hover:bg-white/10"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-orange/20">
                  <Users className="size-5 text-primary-orange" />
                </div>
                <h3 className="font-semibold text-white">
                  Share your story
                </h3>
                <p className="text-sm leading-relaxed text-white/65">
                  Have you been laid off, disciplined, or managed by an
                  algorithm? Your story matters. Worker testimonies build the
                  public record and strengthen the case for these bills.
                </p>
                <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary-orange group-hover:underline">
                  Share your story <ArrowRight className="size-3.5" />
                </span>
              </Link>

              <Link
                href="/#newsletter"
                className="group flex flex-col gap-3 rounded-xl border border-white/15 bg-white/5 p-5 transition-colors hover:border-accent-green/40 hover:bg-white/10"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-green/20">
                  <ShieldCheck className="size-5 text-accent-green" />
                </div>
                <h3 className="font-semibold text-white">
                  Join the organizing
                </h3>
                <p className="text-sm leading-relaxed text-white/65">
                  What We Will is building collective power across every sector
                  upended by AI. Join our community, attend events, and plug
                  into the political action working group.
                </p>
                <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-accent-green group-hover:underline">
                  Join What We Will <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── About the sponsors ─── */}
        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Coalition Partners
            </p>
            <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
              The No Robo Bosses Act was introduced by the{" "}
              <a
                href="https://calaborfed.org"
                className="font-medium text-primary-orange underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                California Federation of Labor Unions, AFL-CIO
              </a>
              , representing over 1,300 affiliated unions and 2.3 million
              union members across California. What We Will stands in
              solidarity with the California labor movement in demanding
              these protections become law.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
