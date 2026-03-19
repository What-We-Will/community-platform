export function OurMission() {
  return (
    <section
      id="mission"
      className="scroll-mt-20 bg-dark-blue px-4 py-16 text-white md:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center mx-auto max-w-3xl text-3xl font-sans font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Our mission is to <span className="text-primary-orange">center humans</span>{" "}in the future of work
        </h2>
        <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-stretch md:gap-0">
          <div className="flex-1 md:pr-8">
            <h3 className="border-l-4 border-primary-orange pl-4 text-lg font-semibold text-primary-orange">
              Advocacy &amp; Policy
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/95 sm:text-base">
              We organize to advance &quot;Human-First&quot; AI practices
              to empower workers' voices in decision-making, strengthen our social safety net, and fight for bold policies that ensure equitable access to quality jobs, and a dignified future of
              shared prosperity.
            </p>
          </div>
          <div className="flex-1 md:pl-8">
            <h3 className="border-l-4 border-accent-green pl-4 text-lg font-semibold text-accent-green">
              Community Support
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/95 sm:text-base">
              As a tech cooperative, we are worker-owners who build this platform democratically, and provide resources to help laid off and early career workers navigate a changing job
              landscape with community job search tools, layoff crisis support, skill sharing, civic tech projects, and mutual aid.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
