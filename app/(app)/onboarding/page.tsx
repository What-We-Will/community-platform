import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.is_onboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Complete your profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tell the community a bit about yourself
        </p>
      </div>
      <OnboardingForm
        initialData={{
          display_name: profile?.display_name ?? user.user_metadata?.full_name ?? user.email ?? "",
          headline: profile?.headline ?? "",
          location: profile?.location ?? "",
          bio: profile?.bio ?? "",
          skills: profile?.skills ?? [],
          open_to_referrals: profile?.open_to_referrals ?? false,
          linkedin_url: profile?.linkedin_url ?? "",
        }}
        userId={user.id}
      />
    </div>
  );
}
