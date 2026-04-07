import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { SurveyForm } from "@/components/survey/survey-form";
import config from "@/lib/survey/config";

export const metadata: Metadata = {
  title: `${config.title} | What We Will`,
  description: config.description,
  openGraph: {
    title: config.title,
    description: config.description,
    url: "/survey",
    type: "website",
  },
};

export default async function SurveyPage() {
  // Auth is optional — survey is public. User is passed to nav for logged-in state only.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          <SurveyForm />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
