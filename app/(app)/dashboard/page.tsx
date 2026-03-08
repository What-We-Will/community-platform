import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { NewMembersCard } from "@/components/dashboard/NewMembersCard";
import { ActiveChatsCard } from "@/components/dashboard/ActiveChatsCard";
import { PollsCardWrapper } from "@/components/dashboard/PollsCardWrapper";
import { UpcomingEventsCard } from "@/components/dashboard/UpcomingEventsCard";
import { JobTrackerCard } from "@/components/dashboard/JobTrackerCard";
import { MyGroupsCard } from "@/components/dashboard/MyGroupsCard";
import { LearningCard } from "@/components/dashboard/LearningCard";
import { LeetcodeCard } from "@/components/dashboard/LeetcodeCard";
import { RecordingsCard } from "@/components/dashboard/RecordingsCard";
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
    supabase.from("weekly_schedule").select("id, name, days, time, position").order("position", { ascending: true }),
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <WelcomeBanner profile={profile ?? null} />
      <AnnouncementsCard />
      <WeeklyScheduleCard rows={scheduleRows ?? []} isPlatformAdmin={isPlatformAdmin} />

      {/* First row: My Groups, Upcoming Events, Community Polls */}
      <Suspense fallback={<CardSkeleton />}>
        <MyGroupsCard userId={user.id} />
      </Suspense>
      <UpcomingEventsCard />
      <Suspense fallback={<CardSkeleton />}>
        <PollsCardWrapper userId={user.id} />
      </Suspense>

      {/* Second row: Job Tracker, LeetCode, Learning */}
      <JobTrackerCard />
      <LearningCard />
      <LeetcodeCard />
      <Suspense fallback={<CardSkeleton />}>
        <ActiveChatsCard userId={user.id} />
      </Suspense>

      {/* Bottom row: Recordings, New Members */}
      <RecordingsCard />
      <Suspense fallback={<CardSkeleton />}>
        <NewMembersCard />
      </Suspense>
    </div>
  );
}
