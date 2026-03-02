import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LifeBuoy,
  GraduationCap,
  Newspaper,
  Megaphone,
} from "lucide-react";

const programs = [
  {
    title: "Layoff Support",
    description: [
      "Crisis support for people facing layoffs: benefits and severance guidance, legal and immigration referrals, and peer support.",
      "We use WARN filings to reach workers early and connect them with job pipelines and collective action.",
    ],
    icon: LifeBuoy,
    barClass: "bg-light-green",
  },
  {
    title: "Workforce Development",
    description:
      "Project-based learning that connects workers with local businesses and government to build community technology while practicing forward-deployed AI skills. We also provide evidence-based resources and counseling for moves into healthcare, social servics, and skilled trades.",
    icon: GraduationCap,
    barClass: "bg-accent-gold",
  },
  {
    title: "Research & Media",
    description: [
      "Participatory action research on changing work conditions and effective supports.",
      "We host discussion, evaluate policy proposals, and publish findings for broader public engagement.",
    ],
    icon: Newspaper,
    barClass: "bg-[var(--hero-dark)]",
  },
  {
    title: "Organizing & Advocacy",
    description:
      "We track policy at state and federal levels and help members become informed organizers—advocating with officials, shaping media narratives, and organizing campaigns for stronger layoff protections, income stabilization, and worker voice in AI policy.",
    icon: Megaphone,
    barClass: "bg-primary-orange",
  },
];

export function LandingContent() {
  return (
    <section id="programs" className="scroll-mt-20 bg-warm-beige px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Our Core Programs
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          We are a new organization, seeking funding to scale our capacity for
          fostering mutual aid. The following programs are seeking additional volunteers.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program) => {
            const Icon = program.icon;
            return (
              <Card
                key={program.title}
                className="overflow-hidden border bg-white shadow-sm rounded-xl p-0"
              >
                <div
                  className={`h-4 rounded-t-xl ${program.barClass}`}
                  aria-hidden
                />
                <CardHeader className="text-left pb-8">
                  <div className="flex size-10 items-center justify-center rounded border border-border bg-white text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {program.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {Array.isArray(program.description) ? (
                      program.description.map((para, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : undefined}>
                          {para}
                        </p>
                      ))
                    ) : (
                      program.description
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
