import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingMutualAid() {
  return (
    <section className="bg-primary-orange px-4 py-10 text-white md:py-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">
          Mutual Aid
        </h2>
        <p className="mt-4 text-sm leading-relaxed opacity-95 md:text-base">
          We are building a
          culture of sharing and reciprocity between members. The framework is
          solidarity, not charity. In a moment of crisis, white collar workers
          historically excluded from traditional union representation are
          recognizing our shared vulnerability as
          workers.
        </p>
        <p className="mt-4 text-sm leading-relaxed opacity-95 md:text-base">
          The charity-based model assumes a one-directional flow of resources, but we are also powerful resources for one another. Mutual aid is a system of giving and receiving that builds meaningful
          relationships and democratic practice. <strong>Your participation and unique contributions are
          what makes this project valuable for everyone.</strong> We highlight the skills of experienced
          workers while striving to provide mentorship to entry-level workers, especially those from diverse backgrounds and nontraditional training paths.
        </p>
        {/* <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/contribute">Contribute to a fund</Link>
          </Button>
        </div> */}
      </div>
    </section>
  );
}
