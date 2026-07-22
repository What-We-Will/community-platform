import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { NewMembersCard } from "@/components/dashboard/NewMembersCard";
import { PollsCardWrapper } from "@/components/dashboard/PollsCardWrapper";
import { RecentVideosCard } from "@/components/dashboard/RecentVideosCard";
import { WeeklyScheduleCard } from "@/components/dashboard/WeeklyScheduleCard";
import { AnnouncementsCard } from "@/components/dashboard/AnnouncementsCard";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: scheduleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("weekly_schedule")
      .select("id, name, days, time, zoom_url, position, category")
      .order("position", { ascending: true }),
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <WelcomeBanner profile={profile ?? null} />
      <AnnouncementsCard />
      <WeeklyScheduleCard rows={scheduleRows ?? []} isPlatformAdmin={isPlatformAdmin} />

      <RecentVideosCard />

      <Suspense fallback={<CardSkeleton />}>
        <PollsCardWrapper userId={user.id} />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <NewMembersCard />
      </Suspense>
    </div>
  );
}
