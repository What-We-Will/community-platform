type GroupColor = {
  border: string;
  leaderBg: string;
  leaderText: string;
  memberBg: string;
  memberText: string;
};

const GROUP_COLORS: GroupColor[] = [
  {
    border:     "border-blue-300",
    leaderBg:   "bg-blue-100",
    leaderText: "text-blue-700 font-medium",
    memberBg:   "bg-muted",
    memberText: "text-muted-foreground",
  },
  {
    border:     "border-green-300",
    leaderBg:   "bg-green-100",
    leaderText: "text-green-700 font-medium",
    memberBg:   "bg-muted",
    memberText: "text-muted-foreground",
  },
  {
    border:     "border-violet-300",
    leaderBg:   "bg-violet-100",
    leaderText: "text-violet-700 font-medium",
    memberBg:   "bg-muted",
    memberText: "text-muted-foreground",
  },
  {
    border:     "border-orange-300",
    leaderBg:   "bg-orange-100",
    leaderText: "text-orange-700 font-medium",
    memberBg:   "bg-muted",
    memberText: "text-muted-foreground",
  },
];

const WORKING_GROUPS = [
  {
    name: "Layoff Crisis Support Team",
    volunteers: ["George D.", "Marc T.", "Sai N.", "Simon M.", "Summer N.", "Hope J.", "Abdul Z."],
  },
  {
    name: "Community Job Support Team",
    volunteers: ["Abdul Z.", "Margaret G.", "Simantha P.", "Roxie T.", "Henry I.", "Mary F.", "Isaac L.", "Simon M."],
  },
  {
    name: "Participatory Action Research Team",
    volunteers: ["Sonia J.", "Simantha J.", "Shannon W.", "Lara G.", "Michael I.", "Margaret G.", "Adbul Z."],
  },
  {
    name: "Policy & Advocacy Team",
    volunteers: ["Shannon W.", "Hope J.", "Cody S.", "George D.", "Simantha P.", "Roxie T.", "Michael I.", "Abdul Z."],
  },
];

function WorkingGroupCard({
  name,
  volunteers,
  color,
}: {
  name: string;
  volunteers: string[];
  color: GroupColor;
}) {
  return (
    <div className={`rounded-xl border-2 bg-card p-5 shadow-sm ${color.border}`}>
      <h3 className="font-semibold text-foreground">{name}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {volunteers.map((volunteer, i) => {
          const isLead = i < 2;
          return (
            <li
              key={`${name}-${volunteer}`}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                isLead
                  ? `${color.leaderBg} ${color.leaderText}`
                  : `${color.memberBg} ${color.memberText}`
              }`}
            >
              {volunteer}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AboutVolunteers() {
  return (
    <section className="border-t bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bebas text-3xl text-dark-blue sm:text-4xl md:text-5xl">
          Volunteer Teams
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {WORKING_GROUPS.map((group, i) => (
            <WorkingGroupCard
              key={group.name}
              name={group.name}
              volunteers={group.volunteers}
              color={GROUP_COLORS[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
