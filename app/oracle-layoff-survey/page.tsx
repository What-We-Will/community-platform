import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { OracleLayoffSurveyForm } from "@/components/landing/oracle-layoff-survey-form";

export const metadata = {
  title: "Oracle layoff survey | What We Will",
  description:
    "Confidential survey for Oracle workers affected by recent layoffs. Share your experience to help inform advocacy and support.",
};

export default async function OracleLayoffSurveyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />

      <main className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <section aria-labelledby="oracle-survey-heading" className="space-y-4">
            <h1
              id="oracle-survey-heading"
              className="font-bebas text-4xl tracking-wide text-foreground sm:text-5xl"
            >
              Oracle layoff survey
            </h1>
            <div className="space-y-3 text-sm text-muted-foreground sm:text-base">
              <p className="text-foreground">
                If you were affected by recent layoffs at Oracle, this form is
                a place to document what happened and what still feels
                unresolved.
              </p>
              <p>
                Responses are stored securely. We collect the answers you
                submit, the time of submission, and your network address to
                help prevent abuse. We do not require your name or work email.
              </p>
            </div>
          </section>

          <section aria-label="Survey form">
            <OracleLayoffSurveyForm />
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
