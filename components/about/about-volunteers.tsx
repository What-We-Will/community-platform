const WORKING_GROUPS = [
  {
    name: "Policy & Advocacy",
    volunteers: ["Andrew M.", "Daniel B.", "Michael I.", "Dean G.",  "Anne H", "Dieu H.", "Cody S.", "Sabrina S.", "Kyle A.", "Kaitlin C."],
  },
  {
    name: "Community Job Support",
    volunteers: ["Sabrina S.", "Isaac L.", "Margaret G.", "Warren L.", "Charise V.", "Henry I.", "Mary F.", "Dieu H.", "Kaitlin C."],
  },
  {
    name: "Layoff Crisis Support",
    volunteers: ["Annette S.", "Sai M.", "Meredith M.", "David P.", "Dieu H.", "George D.", "Beth K.", "Marc T.", "Jennifer T.", "Kaitlin C."],
  },
  {
    name: "Participatory Action Research",
    volunteers: ["Sonia J.", "Margaret G.", "Josh S-R", "Lara G.", "Simanta P.", "Kaitlin C."],
  },
  {
    name: "Media & Digital Organizing",
    volunteers: ["Kyle A.", "Allen P.", "Hope J.", "Cody S.", "Jennifer T.", "Kaitlin C."],
  },
  {
    name: "Platform Engineering Team & WWW Tech Worker Cooperative",
    volunteers: [ "Tony R.", "Tim C.", "Daniel M.", "Kyle A.", "Dean G.", "George D.", "Sabrina S.", "Kaitlin C."],
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
          Working Group Members
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
