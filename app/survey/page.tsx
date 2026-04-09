import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { SurveyForm } from "@/components/survey/survey-form";
import { SurveyFormSingle } from "@/components/survey/survey-form-single";
import { surveyConfigs, DEFAULT_SURVEY_ID } from "@/lib/survey/config";

function getSurveyConfig(id: string | undefined) {
  // No id param → use default survey
  if (!id) return surveyConfigs[DEFAULT_SURVEY_ID];
  // Explicit id → must match a known survey or 404
  return surveyConfigs[id] ?? null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  const config = getSurveyConfig(id);
  if (!config) return { title: "Survey Not Found | What We Will" };
  return {
    title: `${config.title} | What We Will`,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      url: "/survey",
      type: "website",
    },
  };
}

export default async function SurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const config = getSurveyConfig(id);
  if (!config) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          {config.layout === "single-page" ? (
            <SurveyFormSingle config={config} />
          ) : (
            <SurveyForm />
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
