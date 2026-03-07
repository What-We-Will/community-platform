"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3 } from "lucide-react";
import { CreatePollDialog } from "./CreatePollDialog";
import type { PollWithDetails } from "@/lib/types";

interface PollsCardProps {
  userId: string;
  initialPoll: PollWithDetails | null;
}

export function PollsCard({ userId, initialPoll }: PollsCardProps) {
  const router = useRouter();
  const [poll, setPoll] = useState<PollWithDetails | null>(initialPoll);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    initialPoll?.userVotes ?? []
  );
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState((initialPoll?.userVotes?.length ?? 0) > 0);

  // Sync from server when initialPoll changes (e.g. after router.refresh())
  useEffect(() => {
    setPoll(initialPoll);
    setSelectedOptions(initialPoll?.userVotes ?? []);
    setVoted((initialPoll?.userVotes?.length ?? 0) > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally use primitives to avoid re-running when object reference changes
  }, [initialPoll?.id, initialPoll?.totalVotes, initialPoll?.userVotes?.length]);

  const hasSelection = selectedOptions.length > 0;
  const allowMultiple = poll?.allow_multiple ?? false;

  const handleVote = async () => {
    if (!poll || !hasSelection || voting) return;

    setVoting(true);

    const supabase = createClient();

    if (allowMultiple) {
      for (const optionId of selectedOptions) {
        await supabase.from("poll_votes").insert({
          poll_id: poll.id,
          option_id: optionId,
          user_id: userId,
        });
      }
    } else {
      await supabase.from("poll_votes").insert({
        poll_id: poll.id,
        option_id: selectedOptions[0],
        user_id: userId,
      });
    }

    const newVoteCounts = new Map(poll.options.map((o) => [o.id, o.voteCount]));
    for (const oid of selectedOptions) {
      newVoteCounts.set(oid, (newVoteCounts.get(oid) ?? 0) + 1);
    }
    const totalVotes = poll.totalVotes + selectedOptions.length;
    setPoll({
      ...poll,
      options: poll.options.map((o) => ({
        ...o,
        voteCount: newVoteCounts.get(o.id) ?? o.voteCount,
      })),
      totalVotes,
      userVotes: selectedOptions,
    });
    setVoted(true);
    setVoting(false);

    // Refresh server data so the page shows latest results
    router.refresh();
  };

  const toggleOption = (optionId: string) => {
    if (allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  if (!poll) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4" />
            Community Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active polls. Be the first to ask the community something!
          </p>
        </CardContent>
        <CardFooter>
          <CreatePollDialog />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4" />
          Community Polls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium text-sm">{poll.question}</p>

        {voted ? (
          <div className="space-y-2">
            {poll.options.map((opt) => {
              const pct =
                poll.totalVotes > 0
                  ? Math.round((opt.voteCount / poll.totalVotes) * 100)
                  : 0;
              const isUserChoice = poll.userVotes.includes(opt.id);
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isUserChoice ? "font-medium" : ""}>
                      {opt.label}
                      {isUserChoice && " (your vote)"}
                    </span>
                    <span className="text-muted-foreground">
                      {opt.voteCount} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isUserChoice ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        <p className="text-xs text-muted-foreground">
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""} total
        </p>
          </div>
        ) : (
          <>
            {allowMultiple ? (
              <div className="space-y-2">
                {poll.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={opt.id}
                      checked={selectedOptions.includes(opt.id)}
                      onCheckedChange={() => toggleOption(opt.id)}
                    />
                    <label
                      htmlFor={opt.id}
                      className="text-sm cursor-pointer"
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0] ?? ""}
                onValueChange={(v) => setSelectedOptions(v ? [v] : [])}
              >
                {poll.options.map((opt) => (
                  <RadioGroupItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            )}
            <p className="text-xs text-muted-foreground">
              {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""} so far
            </p>
            <Button
              size="sm"
              disabled={!hasSelection || voting}
              onClick={handleVote}
            >
              {voting ? "Voting…" : "Vote"}
            </Button>
          </>
        )}

        {poll.creator && (
          <p className="text-xs text-muted-foreground">
            Asked by {poll.creator.display_name}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <CreatePollDialog />
      </CardFooter>
    </Card>
  );
}
