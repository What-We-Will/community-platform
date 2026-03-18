import { Button } from "@/components/ui/button";

const DONATE_URL =
  "https://secure.givelively.org/donate/equity-tech-collective/what-we-will";

export function LandingDonate() {
  return (
    <section className="bg-white px-4 py-16 md:py-20">
      <div className="mx-auto max-w-4xl rounded-2xl bg-primary-orange px-6 py-10 text-white shadow-sm md:px-10 md:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-3 text-4xl font-bebas md:text-5xl">
            Support Our Work
          </h2>
          <p className="mt-4 text-sm mx-auto max-w-xl leading-relaxed text-white/90 md:text-base">
            Your donation helps us organize workers, grow mutual aid, and build a
            future where the gains of AI are shared by everyone.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="rounded-lg bg-white px-8 text-base font-semibold text-primary-orange shadow-md hover:bg-white/90"
              asChild
            >
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate Now
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
