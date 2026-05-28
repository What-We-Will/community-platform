import type { User } from "@supabase/supabase-js";
import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { OurMission } from "./landing-our-mission";
import { LandingWhoWeAre } from "./landing-who-we-are";
import { Programs } from "./landing-programs";
import { LandingPress } from "./landing-press";
import { LandingMutualAid } from "./landing-mutual-aid";
import { LandingFutureWeDemand } from "./landing-future-we-demand";
import { LandingCtaBlock } from "./landing-cta-block";

export function LandingPage({ user }: { user?: User | null }) {
  return (
    <div className="bg-background">
      <LandingNav user={user} />
      <main>
        <LandingHero />
        <OurMission />
        <LandingWhoWeAre />
        <Programs />
        <LandingMutualAid />
        <LandingFutureWeDemand />
        <LandingPress />
        <LandingCtaBlock />
      </main>
    </div>
  );
}
