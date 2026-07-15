import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LayoffGuideContent } from "@/components/resources/layoff-guide-content";

export const metadata = {
  title: "Layoff Resource Guide | What We Will",
  description:
    "Practical guidance for workers navigating layoffs — severance, insurance, immigration, job search, and collective action.",
};

export default async function LayoffGuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        <LayoffGuideContent />
      </main>
      <LandingFooter />
    </div>
  );
}
