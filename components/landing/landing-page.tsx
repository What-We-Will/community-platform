import type { User } from "@supabase/supabase-js";
import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { OurMission } from "./landing-our-mission";
import { LandingWhoWeAre } from "./landing-who-we-are";
import { LandingContent } from "./landing-content";
import { LandingMutualAid } from "./landing-mutual-aid";
import { LandingFutureWeDemand } from "./landing-future-we-demand";
import { LandingJoinCommunity } from "./landing-join-community";
import { LandingFooter } from "./landing-footer";

export function LandingPage({ user }: { user?: User | null }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user} />
      <main className="flex-1">
        <LandingHero />
        <OurMission />
        <LandingWhoWeAre />
        <LandingContent />
        <LandingMutualAid />
        <LandingFutureWeDemand />
        <LandingJoinCommunity />
      </main>
      <LandingFooter />
    </div>
  );
}
