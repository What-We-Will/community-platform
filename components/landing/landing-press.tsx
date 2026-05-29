import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PRESS_ITEMS } from "@/lib/press";

export function LandingPress() {
  return (
    <section
      id="press"
      className="scroll-mt-20 border-t border-border bg-white px-4 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-bebas text-5xl text-dark-blue">
          In the Press
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Select media coverage of our layoff support and basic income programs for workers
          impacted by AI-driven layoffs.
        </p>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {PRESS_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 items-center">
                  <Image
                    src={item.logoSrc}
                    alt={item.logoAlt}
                    width={160}
                    height={40}
                    className="h-8 w-auto max-w-[10rem] object-contain object-left"
                  />
                </div>

                <h3 className="mt-5 flex-1 font-sans text-base font-semibold leading-snug text-dark-blue transition-colors group-hover:text-primary-orange md:text-lg">
                  {item.title}
                </h3>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary-orange">
                    Read article
                    <ArrowUpRight
                      className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
