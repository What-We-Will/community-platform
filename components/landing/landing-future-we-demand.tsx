"use client";

import Image from "next/image";
import { useState } from "react";

export function LandingFutureWeDemand() {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="bg-muted/30 px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center">
        <div className="md:w-1/2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            The Future We Demand
          </h2>
          <p className="mt-4 text-muted-foreground">
            The first industrial revolution brought immense wealth to a few and
            hardship to many. Today, AI and automation are again reshaping work
            at a dizzying pace—creating economic disruption, job loss, and
            uncertainty for millions of workers.
          </p>
          <p className="mt-4 text-muted-foreground">
            We believe this moment is also an opportunity. By building collective
            power and demanding a seat at the table, we can shape a future of
            work that prioritizes dignity, security, and shared prosperity. The
            future we demand is one where technology serves people—not the other
            way around.
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
