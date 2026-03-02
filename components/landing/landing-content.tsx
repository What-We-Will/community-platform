import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const programs = [
  {
    title: "Crisis Response",
    description:
      "Rapid support for workers facing layoffs or sudden job loss, including emergency funds, peer support, and connections to resources.",
    icon: BookOpen,
  },
  {
    title: "Workforce Development",
    description:
      "Skills sharing, reskilling workshops, and career navigation tools to help workers adapt to a changing labor market.",
    icon: BookOpen,
  },
  {
    title: "Research & Media",
    description:
      "Documenting the impact of technology on work and amplifying worker voices through research, storytelling, and advocacy campaigns.",
    icon: BookOpen,
  },
  {
    title: "Organizing & Advocacy",
    description:
      "Building collective power through workplace organizing and policy advocacy for human-first AI and labor protections.",
    icon: BookOpen,
  },
];

export function LandingContent() {
  return (
    <section className="bg-muted/30 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Our Core Programs
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          We are seeking funding to scale our capacity for fostering mutual aid.
          The following programs are in development.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program) => {
            const Icon = program.icon;
            return (
              <Card key={program.title} className="border bg-card">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg border border-primary-orange/30 bg-primary-orange/10 text-primary-orange">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg text-primary-orange">
                    {program.title}
                  </CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
