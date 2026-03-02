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
      "We share in the work of providing crisis support to people facing layoffs, including benefits navigation, severance negotiation, immigration and legal referrals, and peer-led mental health support. By staying ahead of WARN filings, we proactively identify workers at risk and reach out before the layoff takes effect. We aim to connect them with workers who have recently navigated job loss for peer-to-peer support and job application pipelines, while helping to strategize for collective bargaining and media pressure campaigns.",
    icon: BookOpen,
  },
  {
    title: "Workforce Development",
    description:
      "Our community platform for project-based learning seeks to connect tech workers with hyperlocal community businesses and local government offices to practice forward-deployed AI engineering and advanced orchestration tools for building civic tech products—with a focus on data privacy, accessibility, algorithmic fairness, and clean code. We also gather evidence-based career transition resources for workers moving to healthcare, education, social services, and skilled trades.",
    icon: BookOpen,
  },
  {
    title: "Research & Media",
    description:
      "We equip members to look deeply into the challenges facing our industry and conduct participatory research on working conditions shaped by rapid technological change. We provide a forum for discussion and debate, evaluate policy tradeoffs, and prototype tactical ways to apply economic and political pressure. We will publish findings and diverse voices from our membership on platforms for broader public engagement.",
    icon: BookOpen,
  },
  {
    title: "Organizing & Advocacy",
    description:
      "We are building a power map to track policy proposals on state and federal levels. Current policy responses span: stronger layoff transparency under the WARN Act; income stabilization via expanded unemployment insurance or basic income pilots; and structural reforms including portable benefits, reskilling programs, a 32-hour work week, and worker representation in AI governance. We help members become informed organizers who advocate with elected officials, shape media narratives, and organize coalition campaigns to win transformative policy change.",
    icon: BookOpen,
  },
];

export function LandingContent() {
  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Our Programs
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          We are a new organization, seeking funding to scale our capacity for
          fostering mutual aid. The following programs are
          seeking volunteers.
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
