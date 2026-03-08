import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { AboutHero } from "@/components/about/about-hero";
import { AboutOrganization } from "@/components/about/about-organization";
import { AboutTeam } from "@/components/about/about-team";
import { AboutAdvisoryBoard } from "@/components/about/about-advisory-board";
import { AboutVolunteers } from "@/components/about/about-volunteers";

export const metadata = {
  title: "About Us | What We Will",
  description:
    "Learn about What We Will—our mission, our organization, and the people building worker power in the age of AI.",
};

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        <AboutHero />
        <AboutOrganization />
        <AboutTeam />
        <AboutVolunteers />
        <AboutAdvisoryBoard />
      </main>
      <LandingFooter />
    </div>
  );
}
