import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingMutualAid() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl rounded-2xl bg-primary-orange px-6 py-10 text-white md:px-10">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Mutual Aid
        </h2>
        <p className="mt-4 leading-relaxed opacity-95">
          We are developing programming through a mutual aid model to foster a
          culture of sharing and reciprocity between members. The framework is
          solidarity, not charity. In a moment of crisis, white collar workers
          historically excluded from traditional union representation are
          recognizing our shared identity, vulnerability, and solidarity as
          workers. Our role as a grassroots organization is to build collective
          capacity and a culture of care.
        </p>
        <p className="mt-4 leading-relaxed opacity-95">
          The charity-based model assumes a one-directional flow of resources.
          But there are many laid-off workers with strong skills, networks, and
          time. We can also be powerful resources for one another. A true mutual
          aid system is not just one-sided transactions for temporary relief,
          but a practice of both giving and receiving that builds meaningful
          and lasting relationships. That&apos;s the culture and community we
          strive to build here. Your participation and unique contributions are
          what makes this project valuable for everyone. Our full-time team
          members help facilitate well-structured meeting spaces for technical
          skill-sharing, peer-led support, an open job pipeline, body doubling
          and interview prep, and collaborative projects that we help shape into
          cooperative work contracts. We highlight the skills of experienced
          workers while striving to provide mentorship to entry-level workers
          and those from diverse backgrounds. We hope you&apos;ll join in
          conversations about the impact of AI on knowledge work, and build your
          civic leadership capacity through the advocacy campaigns we decide to
          pursue together.
        </p>
        <p className="mt-4">
          <Link
            href="https://kaizengrowth.github.io/workerslab/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-90"
          >
            Read more about our implementation plan here
          </Link>
          .
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
