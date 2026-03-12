const WORKING_GROUPS = [
  {
    name: "Policy & Advocacy Team",
    volunteers: ["Shannon W.", "George D.", "Simantha P.", "Hope J.", "Cody S.", "Roxie T.", "Michael I.", "Joseph S.", "Abdul Z."],
  },
  {
    name: "Community Job Support Team",
    volunteers: ["Sabrina S.", "Abdul Z.", "Margaret G.", "Simantha P.", "Warren L.", "Roxie T.", "Henry I.", "Mary F.", "Isaac L.", "Simon M."],
  },
  {
    name: "Layoff Crisis Support Team",
    volunteers: ["Kaitlin C.","George D.", "Marc T.", "Sai N.", "Simon M.", "Summer N.", "Liping H.", "Hope J.", "Abdul Z."],
  },
  {
    name: "Participatory Action Research Team",
    volunteers: ["Sonia J.", "Simantha J.", "Lara G.", "Shannon W.", "Michael I.", "Margaret G.", "Joseph S.", "Adbul Z."],
  },
  {
    name: "Media & Digital Organizing Team",
    volunteers: ["Kyle A.","Hope J.", "Cody S.", "Sonia J.", "Allen P."],
  },
  {
    name: "Platform Engineering Team & WWW Tech Worker Cooperative",
    volunteers: ["Kaitlin C.", "Simon M.", "Tim C.", "Andrew W.", "Roxie T."],
  },
];

function WorkingGroupCard({
  name,
  volunteers,
}: {
  name: string;
  volunteers: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold text-foreground">{name}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {volunteers.map((volunteer, i) => (
          <li
            key={`${name}-${volunteer}`}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              i < 2
                ? "bg-primary-orange/15 text-primary-orange font-medium"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {volunteer}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AboutVolunteers() {
  return (
    <section className="border-t bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
          Program Volunteers
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {WORKING_GROUPS.map((group) => (
            <WorkingGroupCard
              key={group.name}
              name={group.name}
              volunteers={group.volunteers}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
