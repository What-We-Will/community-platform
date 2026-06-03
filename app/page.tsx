import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";
import { canonicalPath, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Worker Organizing for Dignity in the Age of AI",
  description:
    "What We Will is a nonprofit worker center organizing tech workers displaced by AI—through mutual aid, policy advocacy, layoff support, and community power.",
  alternates: canonicalPath("/"),
  openGraph: {
    title: "What We Will — Worker Organizing in the Age of AI",
    description:
      "Build collective power with workers navigating AI-driven layoffs. Join our community for advocacy, mutual aid, and organizing.",
    images: [OG_IMAGE],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage user={user ?? undefined} />;
}
