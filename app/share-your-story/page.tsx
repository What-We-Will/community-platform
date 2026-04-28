import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ShareYourStoryForm } from "@/components/landing/share-your-story-form";

export const metadata = {
  title: "Share Your Story | What We Will",
  description:
    "Share how AI tools, automation, workplace monitoring, and algorithmic decisions are affecting your job and community.",
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
                AI and automated systems are changing workplaces, from how
                people are hired to how work is tracked, evaluated, and assigned.
                We want to understand how these tools are affecting workers in
                their daily life.
              </p>
              <p>
                Have you experienced AI monitoring, pressure to use new tools,
                job loss, shifting expectations, or other major workplace
                changes tied to AI?
              </p>
              <p>
                Your story can help highlight what workers need as technology
                reshapes jobs, rights, and opportunities.
              </p>
              <p className="text-foreground">
                Please share your story so we can advocate for people-first AI
                policies, stronger protections, and fairer outcomes for workers
                and communities.
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
