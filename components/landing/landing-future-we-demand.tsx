"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function LandingFutureWeDemand() {

  return (
    <section id="our-future" className="scroll-mt-20 bg-[#f5f5f5] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center">
        <div className="md:w-1/2">
          <h2 className="text-5xl font-bebas text-dark-blue">
            Our Future
          </h2>
          <blockquote className="mt-4 border-l-4 border-primary-orange pl-4 italic text-muted-foreground">
            &ldquo;Eight hours for work, eight hours for rest, eight hours for
            <strong className="text-primary-orange"> what we will</strong>.&rdquo; — Ira Steward (1863)
          </blockquote>
          <p className="mt-2 text-xs text-muted-foreground">
            Machinists and Blacksmiths Union labor leader who fought for the
            eight-hour work day
          </p>
          <p className="mt-4 text-muted-foreground">
            The first industrial revolution gave birth to movements that secured
            the labor laws and protections we know today. A five-day work week,
            social security, abolition of child labor—these rights were not
            freely given. They were fought for and won by workers who organized,
            went on strike, marched, and refused to accept the way things were.
            <br/><br/>The AI revolution is compressing a similar scale of economic
            disruption into a fraction of time. With less time to adjust, the
            human toll of dislocation without a safety net could be worse. We
            can&apos;t afford to wait for disaster before we mobilize.
          </p>
          <p className="mt-4 text-muted-foreground">
            But every great disruption is also an opening for building better.
            The workers in the New Deal era didn&apos;t just survive
            industrialization; they reimagined work itself. <br/><br/><strong>What can we
            imagine<span className="text-primary-orange">—and build together—</span>for the future of work?</strong>
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted md:w-1/2">
            <Image
              src="/images/future-we-demand.webp"
              alt="Workers with signs in industrial revolution era illustration"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
        </div>
      </div>
    </section>
  );
}
