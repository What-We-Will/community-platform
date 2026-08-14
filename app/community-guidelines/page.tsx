import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { GuidelinesContent } from "@/components/community-guidelines/guidelines-content";

export const metadata = {
  title: "Community Guidelines | What We Will",
  description:
    "The shared expectations for everyone in the What We Will community.",
};

export default async function CommunityGuidelinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        <GuidelinesContent />
      </main>
      <LandingFooter />
    </div>
  );
}
