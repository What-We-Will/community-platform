import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MassCallHero } from "@/components/mass-call/mass-call-hero";
import { MassCallPlaceholder } from "@/components/mass-call/mass-call-placeholder";

export const metadata = {
  title: "Mass Call | What We Will",
  description:
    "Community-wide mass calls where members shape the direction of What We Will. Upcoming sessions and past recordings.",
};

export default async function MassCallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        <MassCallHero />
        <MassCallPlaceholder />
      </main>
      <LandingFooter />
    </div>
  );
}
