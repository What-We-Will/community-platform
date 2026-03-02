import { createClient } from "@/lib/supabase/server";
import type {
  Poll,
  PollOption,
  PollWithDetails,
  Profile,
} from "@/lib/types";

/**
 * Fetches the most recent active community-wide poll (group_id IS NULL)
 * that is still open (closes_at is null or in the future).
 * Joins options with vote counts and the current user's votes.
 */
export async function fetchActivePolls(
  userId: string
): Promise<PollWithDetails | null> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("*")
    .is("group_id", null)
    .or(`closes_at.is.null,closes_at.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (pollsError || !polls || polls.length === 0) {
    return null;
  }

  const poll = polls[0] as Poll;

  const { data: options } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", poll.id)
    .order("order_index", { ascending: true });

  if (!options || options.length === 0) {
    return {
      ...poll,
      options: [],
      totalVotes: 0,
      userVotes: [],
      creator: null,
    };
  }

  const optionIds = options.map((o) => o.id);

  const [votesResult, userVotesResult, creatorResult] = await Promise.all([
    supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", poll.id),
    supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", poll.id)
      .eq("user_id", userId),
    poll.created_by
      ? supabase
          .from("profiles")
          .select("*")
          .eq("id", poll.created_by)
          .single()
      : { data: null },
  ]);

  const votes = votesResult.data ?? [];
  const userVotes = (userVotesResult.data ?? []).map((v) => v.option_id);

  const countByOption = new Map<string, number>();
  for (const oid of optionIds) {
    countByOption.set(oid, 0);
  }
  for (const v of votes) {
    countByOption.set(
      v.option_id,
      (countByOption.get(v.option_id) ?? 0) + 1
    );
  }

  const totalVotes = votes.length;
  const optionsWithCounts = (options as PollOption[]).map((opt) => ({
    ...opt,
    voteCount: countByOption.get(opt.id) ?? 0,
  }));

  return {
    ...poll,
    options: optionsWithCounts,
    totalVotes,
    userVotes,
    creator: (creatorResult.data as Profile | null) ?? null,
  };
}
