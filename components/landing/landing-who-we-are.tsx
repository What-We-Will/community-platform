import Link from "next/link";

export function LandingWhoWeAre() {
  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          <span className="text-foreground">Who</span>{" "}
          <span className="text-primary-orange">We Are</span>
        </h2>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          <strong className="text-primary-orange font-semibold">What We Will</strong>{" "}
          is a worker center for workers across sectors impacted by rapid
          technological change. We started in response to mass layoffs in
          2025–2026, as part of the{" "}
          <Link
            href="https://techworkerscoalition.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
          >
            Tech Workers Coalition
          </Link>
          , a grassroots labor organization with local chapters all over the
          U.S. and Europe.
        </p>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          We believe collective power—not individual resilience alone—is
          necessary to navigate technological change. When workers organize
          together across sectors, we can build support systems, win policy
          protections, and shape the future of work.
        </p>
      </div>
    </section>
  );
}
