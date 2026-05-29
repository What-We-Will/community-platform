import Link from "next/link";
import { ActionNetworkFormEmbed } from "./action-network-form-embed";
import { LandingFooter } from "./landing-footer";

const DONATE_URL =
  "https://secure.givelively.org/donate/equity-tech-collective/what-we-will";

export function LandingCtaBlock() {
  return (
    <section
      id="newsletter"
      className="scroll-mt-20 bg-dark-blue text-white"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="h-16 md:h-20" aria-hidden="true" />
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
          <div>
            <h2 className="font-bebas text-4xl uppercase tracking-wide md:text-5xl">
              Support Our Work
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 md:text-base">
              Your donation helps us organize workers, grow mutual aid, and build
              a future where the gains of AI are shared by everyone.
            </p>
            <div className="mt-8">
              <Link
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-dark-blue shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-warm-beige hover:shadow-lg active:translate-y-0 active:shadow-md"
              >
                Donate Now
              </Link>
            </div>
          </div>

          <div>
            <h2 className="font-bebas text-4xl uppercase tracking-wide md:text-5xl">
              Join Our Mailing List
            </h2>
            <div className="mt-8">
              <ActionNetworkFormEmbed variant="dark" />
            </div>
          </div>
        </div>
        <LandingFooter
          variant="dark"
          className="mt-12 border-t border-white/15 pt-8 md:mt-16"
        />
        <div className="h-6 md:h-8" aria-hidden="true" />
      </div>
    </section>
  );
}
