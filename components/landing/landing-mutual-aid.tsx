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
          We foster a culture of sharing and reciprocity between members.
          Whether it’s skills, networks, time, or financial support, mutual aid
          builds our collective capacity and a culture of care.
        </p>
        <p className="mt-4 leading-relaxed opacity-95">
          Contributions go directly to workers in need—layoff support, emergency
          funds, and skill-sharing programs—so we can hold each other up as the
          future of work changes.
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
