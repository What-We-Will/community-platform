import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage user={user ?? undefined} />;
}
