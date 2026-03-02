export function OurMission() {
    return (
      <section className="bg-hero-dark px-4 py-16 text-white md:py-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Our mission is to bridge the{" "}{<br />}
            <span className="text-primary-orange">equity gap</span> in the age of
            A.I.
          </h1>
          <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-stretch md:gap-0">
            <div className="flex-1 md:pr-8 md:border-r md:border-white/30">
              <h2 className="text-lg font-semibold text-primary-orange">
                Advocacy & Policy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/95 sm:text-base">
                We advance &quot;Human-First&quot; policies in government and
                workplaces that protect labor rights and ensure shared prosperity
                among workers.
              </p>
            </div>
            <div className="flex-1 md:pl-8">
              <h2 className="text-lg font-semibold text-light-green">
                Worker Support
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/95 sm:text-base">
                We provide resources to help workers navigate a changing jobs
                landscape including layoff support, skill sharing, and mutual aid.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  