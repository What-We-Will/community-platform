import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative z-10 mx-auto flex max-w-6xl items-center px-4 pt-12 md:min-h-[520px] md:py-16 md:pr-[50%] lg:min-h-[620px] lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-dark-blue text-center md:text-left sm:text-4xl md:text-5xl lg:text-6xl">
            What We Will
          </h1>
          <p className="mt-4 px-6 sm:px-0 md:max-w-[85%] text-base leading-relaxed text-dark-blue text-center md:text-left sm:text-lg">
            We organize workers across multiple sectors affected by rapid
            technological change to <strong>build collective power </strong>
            and win <strong>shared prosperity</strong> in the age of AI.
          </p>
          <div className="mt-6 flex justify-center md:justify-start">
            <Button
              size="lg"
              className="rounded-lg bg-primary-orange px-8 text-base font-semibold text-white shadow-md hover:bg-primary-orange-hover"
              asChild
            >
              <Link href="/signup">Join the Community</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop image */}
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

      {/* Mobile image */}
      <div className="relative mt-8 w-full px-4 md:hidden">
        <Image
          src="/images/hero.webp"
          alt="Diverse workers united for just transitions"
          width={1200}
          height={900}
          className="h-auto w-[80%] rounded-xl object-contain"
          priority
          sizes="100vw"
        />
      </div>
    </section>
  );
}
