import { User } from "lucide-react";

const ADVISORY_BOARD = [
  {
    name: "Andrew Stettner",
    affiliation: "Senior Director of Economic Security, National Employment Law Project (NELP)",
    barClass: "bg-accent-blue",
  },
  {
    name: "Helen Yang",
    affiliation: "Tech Worker Coalition (Steering Committee Member)",
    barClass: "bg-primary-orange",
  },
  {
    name: "Jerome Greco",
    affiliation: "Supervising Attorney, Legal Aid Society",
    barClass: "bg-accent-green",
  },
  {
    name: "Misha Hadar",
    affiliation: "Communications Workers of America (UCAW Board)",
    barClass: "bg-accent-gold",
  },
];

function AdvisorCard({
  name,
  affiliation,
  barClass,
}: {
  name: string;
  affiliation: string;
  barClass: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`h-2 shrink-0 rounded-t-xl ${barClass}`}
        aria-hidden
      />

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{affiliation}</p>
      </div>
    </article>
  );
}

export function AboutAdvisoryBoard() {
  return (
    <section className="border-t border-border bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
          Our Advisors
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADVISORY_BOARD.map((advisor) => (
            <li key={advisor.name} className="h-full">
              <AdvisorCard
                name={advisor.name}
                affiliation={advisor.affiliation}
                barClass={advisor.barClass}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
