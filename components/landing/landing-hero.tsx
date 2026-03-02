import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="bg-[#faf9f7] px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2 md:items-end md:gap-16">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#212529] sm:text-4xl md:text-5xl lg:text-6xl">
            What We Will
          </h1>
          <p className="mt-5 max-w-[85%] text-base leading-relaxed text-[#495057] sm:text-lg">
            We organize workers across multiple sectors affected by rapid
            technological change to <strong>build collective power</strong>
            and win <strong>shared prosperity</strong> in the age of AI.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="rounded-lg bg-[#BC5A3D] px-8 text-base font-semibold text-white shadow-md hover:bg-[#A34F32]"
              asChild
            >
              <Link href="/signup">Get Involved</Link>
            </Button>
          </div>
        </div>

        <div className="relative flex justify-end">
          <div className="relative h-[320px] w-full min-w-[280px] max-w-[520px] md:h-[420px] md:max-w-[680px] lg:h-[480px] lg:max-w-[760px]">
            <Image
              src="/images/hero.webp"
              alt="Diverse workers united for just transitions"
              fill
              className="object-cover object-right-bottom"
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
