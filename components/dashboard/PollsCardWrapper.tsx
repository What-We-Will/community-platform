import { fetchActivePolls } from "@/lib/polls";
import { PollsCard } from "./PollsCard";

interface PollsCardWrapperProps {
  userId: string;
}

export async function PollsCardWrapper({ userId }: PollsCardWrapperProps) {
  const poll = await fetchActivePolls(userId);
  return <PollsCard userId={userId} initialPoll={poll} />;
}
