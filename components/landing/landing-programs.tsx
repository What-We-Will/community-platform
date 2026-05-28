"use client";

import { useState, useEffect, type ComponentType } from "react";
import Link from "next/link";
import {
  Plus,
  Check,
  ArrowRight,
  HandFist,
  HandHelping,
  Handshake,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { corePrograms, type ProgramIconKey } from "@/lib/programs";

const programIcons = {
  heartHandshake: HeartHandshake,
  handshake: Handshake,
  handHelping: HandHelping,
  handFist: HandFist,
} satisfies Record<ProgramIconKey, ComponentType<{ className?: string }>>;

function indexFromHash(hash: string): number | null {
  const id = hash.replace(/^#/, "");
  if (!id.startsWith("program-")) return null;
  const idx = corePrograms.findIndex((p) => `program-${p.id}` === id);
  return idx >= 0 ? idx : null;
}

export function Programs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const syncFromHash = () => {
      const idx = indexFromHash(window.location.hash);
      if (idx !== null) setOpenIndex(idx);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return (
    <section id="programs" className="scroll-mt-20 border-t border-border px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary-orange">
          What We Do
        </p>
        <h2 className="text-center font-bebas text-5xl text-dark-blue md:text-6xl">
          Our Core Programs
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground md:text-lg">
          We organize workers displaced by AI through immediate crisis support,
          career transition resources, and collective action—building power from
          the ground up.
        </p>

        <div className="mt-12 flex flex-col">
          {corePrograms.map((program, index) => {
            const isOpen = openIndex === index;
            const panelId = `program-panel-${index}`;
            const Icon = programIcons[program.icon];

            return (
              <article
                key={program.id}
                id={`program-${program.id}`}
                className="scroll-mt-24 overflow-hidden rounded-lg border border-border/60 shadow-sm"
              >
                <button
                  type="button"
                  id={`program-trigger-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={cn(
                    "flex w-full items-start gap-5 px-6 py-6 text-left transition-opacity hover:opacity-95 md:gap-6 md:px-12 md:py-8",
                    program.barClass,
                    program.textClass,
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-1 size-7 shrink-0 md:mt-2 md:size-9",
                      program.iconClass,
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bebas text-2xl leading-none tracking-wide uppercase md:text-4xl">
                      {program.title}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 block text-sm font-normal normal-case opacity-90 md:mt-2 md:text-lg",
                        program.textClass,
                      )}
                    >
                      {program.tagline}
                    </span>
                  </span>
                  <Plus
                    className={cn(
                      "mt-1 size-7 shrink-0 transition-transform duration-200 md:mt-2 md:size-9",
                      program.iconClass,
                      isOpen && "rotate-45",
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`program-trigger-${index}`}
                    className="border-t border-border/40 bg-white"
                  >
                    <div
                      className={cn(
                        "border-b px-6 py-6 md:px-12 md:py-8",
                        program.panelAccentClass,
                      )}
                    >
                      <p className="text-base leading-relaxed text-foreground md:text-lg">
                        {program.summary}
                      </p>
                    </div>

                    <div className="space-y-8 px-6 py-8 md:px-12 md:py-10">
                      {program.highlights.length > 0 && (
                        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                          {program.highlights.map((item) => (
                            <li
                              key={item}
                              className="flex gap-3 text-sm leading-relaxed text-foreground md:text-base"
                            >
                              <Check
                                className="mt-0.5 size-4 shrink-0 text-primary-orange"
                                aria-hidden
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {program.campaigns && program.campaigns.length > 0 && (
                        <div>
                          <h3 className="font-bebas text-lg tracking-wide text-dark-blue uppercase md:text-xl">
                            Active Campaigns
                          </h3>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {program.campaigns.map((campaign) => {
                              const inner = (
                                <>
                                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-orange">
                                    {campaign.location}
                                  </span>
                                  <p className="mt-1 font-semibold text-dark-blue">
                                    {campaign.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {campaign.status}
                                  </p>
                                  {campaign.href && (
                                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-orange">
                                      Learn more
                                      <ArrowRight className="size-3" />
                                    </span>
                                  )}
                                </>
                              );

                              return campaign.href ? (
                                <Link
                                  key={campaign.title}
                                  href={campaign.href}
                                  className="block rounded-lg border border-border/60 bg-white p-4 transition-colors hover:border-primary-orange/40 hover:bg-primary-orange/5"
                                >
                                  {inner}
                                </Link>
                              ) : (
                                <div
                                  key={campaign.title}
                                  className="rounded-lg border border-border/60 bg-white p-4"
                                >
                                  {inner}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
