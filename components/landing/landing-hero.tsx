"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ROTATING_WORDS = [
  { word: "Prosperity", bg: "#e8b260" },
  { word: "Dignity",    bg: "#8B9B7E" },
  { word: "Equity",     bg: "#b85c3e" },
];

export function LandingHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative z-10 mx-auto flex max-w-6xl items-center px-4 pt-12 md:min-h-[520px] md:py-16 md:pr-[50%] lg:min-h-[620px] lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-4xl text-dark-blue font-bold uppercase tracking-tight text-center md:text-left sm:text-4xl md:text-5xl lg:text-6xl">
            <span
              className="font-bold text-white px-2 tracking-normal"
              style={{ backgroundColor: ROTATING_WORDS[index].bg }}
            >
              {ROTATING_WORDS[index].word}
            </span>{<br/>}
            <span className="block mb-2" />
            <span
              className="font-bold transition-colors duration-300"
              style={{ color: ROTATING_WORDS[index].bg }}
            >for All</span>{<br/>}
            <span>in the age of AI</span>{<br/>}
          </h1>
          <p className="mt-4 px-6 sm:px-0 md:max-w-[75%] text-base leading-relaxed text-dark-blue text-center md:text-left sm:text-lg">
            We organize workers across industries upended by
            rapid technological change to <strong>build collective power </strong>
            and win <strong>shared prosperity</strong>.
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
