"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const programs = [
  {
    title: "Layoff Support",
    description: [
      "Crisis support for people facing layoffs: benefits and severance guidance, legal and immigration referrals, and peer support.",
      "We use WARN filings to reach workers early and connect them with job pipelines and collective action.",
    ],
    barClass: "bg-primary-orange",
    textClass: "text-white",
    iconClass: "text-white",
  },
  {
    title: "Workforce Development",
    description:
      "Project-based learning that connects workers with local businesses and government to build community technology while practicing forward-deployed AI skills. We also provide evidence-based resources and counseling for moves into healthcare, social servics, and skilled trades.",
    barClass: "bg-accent-gold",
    textClass: "text-dark-blue",
    iconClass: "text-dark-blue",
  },
  {
    title: "Research & Media",
    description: [
      "Participatory action research on changing work conditions and effective supports.",
      "We host discussion, evaluate policy proposals, and publish findings for broader public engagement.",
    ],
    barClass: "bg-accent-green",
    textClass: "text-dark-blue",
    iconClass: "text-dark-blue",
  },
  {
    title: "Organizing & Advocacy",
    description:
      "We track policy at state and federal levels and help members become informed organizers—advocating with officials, shaping media narratives, and organizing campaigns for stronger layoff protections, income stabilization, and worker voice in AI policy.",
    barClass: "bg-accent-blue",
    textClass: "text-white",
    iconClass: "text-white",
  },
] as const;

export function Programs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="programs" className="scroll-mt-20 border-t border-border px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-bebas text-5xl text-dark-blue">
          Our Core Programs
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          We are a new organization, seeking funding to scale our capacity for
          fostering mutual aid. The following programs are seeking additional
          volunteers.
        </p>

        <div className="mt-12 flex flex-col gap-1">
          {programs.map((program, index) => {
            const isOpen = openIndex === index;
            const panelId = `program-panel-${index}`;

            return (
              <div key={program.title} className="overflow-hidden">
                <button
                  type="button"
                  id={`program-trigger-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-opacity hover:opacity-95 md:px-8 md:py-5",
                    program.barClass,
                    program.textClass,
                  )}
                >
                  <span className="font-bebas text-xl tracking-wide uppercase md:text-3xl">
                    {program.title}
                  </span>
                  <Plus
                    className={cn(
                      "size-6 shrink-0 transition-transform duration-200 md:size-7",
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
                    className="border-t border-border/30 bg-white px-6 py-5 text-sm leading-relaxed text-foreground md:px-8 md:py-6 md:text-base"
                  >
                    {Array.isArray(program.description) ? (
                      program.description.map((para, i) => (
                        <p key={i} className={i > 0 ? "mt-3" : undefined}>
                          {para}
                        </p>
                      ))
                    ) : (
                      <p>{program.description}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
