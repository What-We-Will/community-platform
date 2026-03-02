import { Leaf } from "lucide-react";

export function LandingWhoWeAre() {
  return (
    <section className="bg-muted/30 px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center">
        <div className="md:w-1/2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Who We Are
          </h2>
          <p className="mt-4 text-muted-foreground">
            We are a worker center for workers across sectors impacted by rapid
            technology change. Formed in 2025–2026 as part of the TechWorkers
            Coalition, we believe in collective power and individual resilience
            to shape the future of work.
          </p>
          <p className="mt-4 text-muted-foreground">
            Our work is rooted in mutual aid, organizing, and advocacy. We bring
            together people who have been laid off, are considering a career
            change, or want to fight for a more equitable economy.
          </p>
          <p className="mt-4 text-muted-foreground">
            Together we are building the collective capacity and culture of care
            needed to navigate technological disruption and demand a future that
            works for everyone.
          </p>
        </div>
      </div>
    </section>
  );
}
