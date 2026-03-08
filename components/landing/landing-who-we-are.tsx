import Image from "next/image";
import Link from "next/link";

export function LandingWhoWeAre() {
  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 md:flex-row md:items-center">
      <div className="relative mt-4 w-full overflow-hidden md:mt-0 md:w-1/2">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src="/images/who-we-are.webp"
              alt="Members of What We Will organizing together"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 100vw"
              priority
            />
          </div>
        </div>
        <div className="md:w-1/2">
          <h2 className="font-bebas text-dark-blue text-5xl">
            Who We Are
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
            We believe collective power — not individual resilience alone — is
            necessary to navigate technological change. When workers organize
            together across sectors, we can build support systems, win policy
            protections, and shape the future of work.
          </p>
        </div>
      </div>
    </section>
  );
}
