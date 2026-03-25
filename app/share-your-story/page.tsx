import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ShareYourStoryForm } from "@/components/landing/share-your-story-form";

export const metadata = {
  title: "Share Your Story | What We Will",
  description:
    "Share how workplace monitoring, AI tools, or automated decision systems affect you. Help advocate for California's No Robo Bosses bill and protections from ADS in hiring, surveillance, and terminations.",
};

export default async function ShareYourStoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />

      <main className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <section aria-labelledby="heading" className="space-y-4">
            <h1
              id="heading"
              className="font-bebas text-4xl tracking-wide text-foreground sm:text-5xl"
            >
              Share Your Story
            </h1>
            <div className="space-y-4 text-sm text-muted-foreground sm:text-base">
              <p>
                California&apos;s{" "}
                <span className="font-medium text-foreground">
                  No Robo Bosses
                </span>{" "}
                bill would limit harmful uses of automated decision systems (ADS)
                at work—including surveillance that tracks every move, pressure
                to hit AI-driven productivity targets, and algorithms involved in
                hiring, pay, promotions, and terminations. Lawmakers need to hear
                from real workers to get this policy right.
              </p>
              <p>
                Are you wary of the way you&apos;re being monitored at work, or
                pressured to be more productive with AI tools?
              </p>
              <p>
                Have you been impacted by automated decision systems that make
                pay, promotion, or termination decisions at your workplace?
              </p>
              <p className="text-foreground">
                Please share your story to help us advocate for policy changes in
                California to protect all workers from ADS systems used in hiring,
                surveillance, and terminations.
              </p>
            </div>
          </section>

          <section aria-label="Story submission form">
            <ShareYourStoryForm />
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
