const ADVISORY_BOARD = [
  {
    name: "Helen Y.",
    affiliation: "Tech Worker Coalition (Steering Committee Member), former Amazon worker",
    barClass: "bg-primary-orange",
  },
  {
    name: "Michelle B.",
    affiliation: "Co-Founder/Organizer, Oracle Workers Collective",
    barClass: "bg-accent-blue",
  },
  {
    name: "Clarissa Redwine",
    affiliation: "Labor Organizer and Author of Against Tech Oligarchy",
    barClass: "bg-accent-green",
  },
  {
    name: "Jerome Greco",
    affiliation: "Public Defender, Legal Aid Society, Digital Surveillance & Tech Policy",
    barClass: "bg-accent-gold",
  },
  {
    name: "Misha Hadar",
    affiliation: "Communications Workers of America (UCAW Board)",
    barClass: "bg-accent-gold",
  },
  {
    name: "David A. Lee",
    affiliation: "Senior Policy Advisor for Data & Technology, NY State Executive Chamber",
    barClass: "bg-accent-green",
  },
  {
    name: "Samia Lemfadli",
    affiliation: "Founder/CEO, Change Food for Good, NY workforce development expert",
    barClass: "bg-accent-blue",
  },{
    name: "Andrew Stettner",
    affiliation: "Former (founding) advisor, while Senior Director of Economic Security at National Employment Law Project",
    barClass: "bg-primary-orange",
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
          Advisors
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
