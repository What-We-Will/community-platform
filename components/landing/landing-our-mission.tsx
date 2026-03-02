export function OurMission() {
  return (
    <section
      id="mission"
      className="scroll-mt-20 bg-hero-dark px-4 py-16 text-white md:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Our mission is to bridge the
          <br />
          <span className="text-primary-orange">equity gap</span> in the age of A.I.
        </h2>
        <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-stretch md:gap-0">
          <div className="flex-1 md:border-r md:border-primary-orange/50 md:pr-8">
            <h3 className="border-l-4 border-primary-orange pl-4 text-lg font-semibold text-primary-orange">
              Advocacy &amp; Policy
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/95 sm:text-base">
              We work to advance &quot;Human-First&quot; AI practices in
              government and workplaces to empower workers' voices in decision-making, and fight for bold policies that ensure
              shared prosperity.
            </p>
          </div>
          <div className="flex-1 md:pl-8">
            <h3 className="border-l-4 border-light-green pl-4 text-lg font-semibold text-light-green">
              Worker Support
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/95 sm:text-base">
              We provide resources to help workers navigate a changing job
              landscape including layoff support, job search tools, skill sharing, project-based learning, and mutual aid.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
