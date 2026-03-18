import type { User } from "@supabase/supabase-js";
import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { OurMission } from "./landing-our-mission";
import { LandingWhoWeAre } from "./landing-who-we-are";
import { Programs } from "./landing-programs";
import { LandingMutualAid } from "./landing-mutual-aid";
import { LandingFutureWeDemand } from "./landing-future-we-demand";
import { LandingDonate } from "./landing-donate";
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
        <Programs />
        <LandingMutualAid />
        <LandingFutureWeDemand />
        <LandingDonate />
        <LandingJoinCommunity user={user} />
      </main>
      <LandingFooter />
    </div>
  );
}
