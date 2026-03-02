import Link from "next/link";

export function LandingWhoWeAre() {
  return (
    <section className="bg-muted/30 px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center">
        <div className="md:w-1/2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Who We Are
          </h2>
          <p className="mt-4 text-muted-foreground">
            What We Will is a worker center for workers across sectors impacted
            by rapid technological change. We started in response to mass layoffs
            in 2025–2026, as part of the{" "}
            <Link
              href="https://techworkerscoalition.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-orange underline underline-offset-2 hover:opacity-90"
            >
              Tech Workers Coalition
            </Link>
            , a grassroots
            labor organization with local chapters all over the U.S. and Europe.
          </p>
          <p className="mt-4 text-muted-foreground">
            Through strategic coalition-building and mobilization, we fight for
            policies that provide a social safety net for workers during an
            unprecedented time of labor market disruption. Our initial focus is
            to build resourceful community infrastructure for tech workers
            through targeted skill-building and mutual aid, but we aim to expand
            our membership to include workers in other sectors and professions,
            including call center workers, journalists, creative workers, and
            other knowledge workers.
          </p>
          <p className="mt-4 text-muted-foreground">
            <strong>We believe collective power—not individual resilience alone—is
            necessary to navigate technological change.</strong> When workers organize
            together across sectors, we can build support systems, win policy
            protections, and shape the future of work.
          </p>
        </div>
      </div>
    </section>
  );
}
