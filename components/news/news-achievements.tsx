import {
  Users,
  DollarSign,
  Handshake,
  ShieldCheck,
  Laptop,
  BookOpen,
} from "lucide-react";

type Achievement = {
  icon: React.ElementType;
  stat: string;
  label: string;
  detail: string;
};

const ACHIEVEMENTS: Achievement[] = [
  {
    icon: Handshake,
    stat: "Policy Coalitions",
    label: "New York & California",
    detail:
      "Joined coalitions in both states and submitted worker stories to the California Labor Federation supporting the No Robo Bosses Act. Participating in biweekly meetings with the NY Unemployment Insurance Coalition.",
  },
  {
    icon: Laptop,
    stat: "Participatory Research",
    label: "Partnership with Tech Equity",
    detail:
      "In talks with Tech Equity to co-publish participatory action research on the impact of AI on workplace environments — covering productivity pressures, mass layoffs, and upskilling realities. Centering worker perspectives that are missing from most current research.",
  },
  {
    icon: DollarSign,
    stat: "Pilot Launch",
    label: "Basic income pilot launched",
    detail:
      "Enrolled our first cohort of workers displaced by AI into a program offering $1,000/month cash assistance and support for up to 12 months, in partnership with AI Commons Project (Fund for Guaranteed Income).",
  },
  {
    icon: ShieldCheck,
    stat: "Layoff Crisis Platform",
    label: "Co-designed with WaPo Tech Guild",
    detail:
      "Co-designing a secure layoff support platform with the Washington Post Tech Guild. CWA will train workers on collective bargaining, and Brooklyn Legal Defenders and Legal Aid Society will provide legal support for unemployment insurance navigation.",
  },

  {
    icon: BookOpen,
    stat: "Weekly Skillshares",
    label: "Technical & workers' rights training",
    detail:
      "Running a weekly skillshare series on locally deploying AI models, fighting AI résumé screeners, and workers' rights. Formalizing curriculum with 3 developers combining political education with hands-on technical training.",
  },
  {
    icon: Users,
    stat: "Team Building",
    label: "Across 6 working groups",
    detail:
      "Our core team has grown to 37 active volunteers from 550+ engaged workers organized across 6 working groups — from policy advocacy to tech cooperative development.",
  },
];

export function NewsAchievements() {
  return (
    <div className="py-2">
      <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary-orange">
        Recent Highlights
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map(({ icon: Icon, stat, label, detail }) => (
          <li
            key={stat}
            className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary-orange" />
              <div>
                <p className="font-bebas text-xl leading-tight text-dark-blue sm:text-2xl">
                  {stat}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {label}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/75">
              {detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
