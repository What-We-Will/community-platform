const WORKING_GROUPS = [
  {
    name: "Mutual Aid & Support",
    volunteers: ["Alex K.", "Sam R.", "Jordan M.", "Taylor L.", "Riley C."],
  },
  {
    name: "Policy & Advocacy",
    volunteers: ["Casey W.", "Morgan H.", "Jamie P.", "Quinn D.", "Avery F."],
  },
  {
    name: "Community & Events",
    volunteers: ["Skyler B.", "Reese N.", "Drew T.", "Jordan S.", "Morgan V."],
  },
  {
    name: "Communications & Outreach",
    volunteers: ["Riley P.", "Alex J.", "Sam T.", "Casey L.", "Taylor M."],
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
        {volunteers.map((volunteer) => (
          <li
            key={`${name}-${volunteer}`}
            className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors"
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
          Our Volunteers
        </h2>
        <p className="mt-2 max-w-full text-muted-foreground">
          Volunteers are listed by first name and last initial, organized by working group.
        </p>
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
