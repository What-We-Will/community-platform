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
import { RecordingsCard } from "@/components/dashboard/RecordingsCard";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <WelcomeBanner profile={profile ?? null} />

      <Suspense fallback={<CardSkeleton />}>
        <NewMembersCard />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <ActiveChatsCard userId={user.id} />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <PollsCardWrapper userId={user.id} />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <MyGroupsCard userId={user.id} />
      </Suspense>

      <UpcomingEventsCard />
      <JobTrackerCard />
      <LearningCard />
      <RecordingsCard />
    </div>
  );
}
