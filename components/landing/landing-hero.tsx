import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative z-10 mx-auto flex max-w-6xl items-center px-4 py-12 md:min-h-[520px] md:py-16 md:pr-[50%] lg:min-h-[620px] lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#212529] sm:text-4xl md:text-5xl lg:text-6xl">
            What We Will
          </h1>
          <p className="mt-4 max-w-[85%] text-base leading-relaxed text-[#495057] sm:text-lg">
            We organize workers across multiple sectors affected by rapid
            technological change to <strong>build collective power </strong>
            and win <strong>shared prosperity</strong> in the age of AI.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="rounded-lg bg-[#BC5A3D] px-8 text-base font-semibold text-white shadow-md hover:bg-[#A34F32]"
              asChild
            >
              <Link href="/signup">Join the Community</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop image: sticks to bottom of hero, full image visible */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
        <div className="relative h-full">
          <Image
            src="/images/hero.webp"
            alt="Diverse workers united for just transitions"
            fill
            className="object-contain object-bottom"
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      </div>

      {/* Mobile image: full-width below content */}
      <div className="relative mt-8 h-72 w-full px-4 md:hidden">
        <Image
          src="/images/hero.webp"
          alt="Diverse workers united for just transitions"
          fill
          className="rounded-xl object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>
    </section>
  );
}
