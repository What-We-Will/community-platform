import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { NewsHero } from "@/components/news/news-hero";
import { NewsGrid } from "@/components/news/news-grid";

export const metadata: Metadata = {
  title: "News & Updates | What We Will",
  description:
    "Stay up to date with the latest from What We Will — organizing wins, policy updates, resources, and stories from workers on the front lines.",
};

export default async function NewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />
      <main className="flex-1">
        <NewsHero />
        <NewsGrid />
      </main>
      <LandingFooter />
    </div>
  );
}
