"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { formatRelativeTime } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/app/(app)/groups/actions";
import type { GroupJoinRequestWithProfile } from "@/lib/types";

interface JoinRequestsPanelProps {
  requests: GroupJoinRequestWithProfile[];
  onRefresh: () => void;
}

export function JoinRequestsPanel({ requests, onRefresh }: JoinRequestsPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = requests.filter((r) => !dismissed.has(r.id));

  if (visible.length === 0) return null;

  async function handleApprove(req: GroupJoinRequestWithProfile) {
    setLoadingId(req.id);
    const result = await approveJoinRequestAction(req);
    setLoadingId(null);
    if (!result.error) {
      setDismissed((prev) => new Set(prev).add(req.id));
      onRefresh();
    }
  }

  async function handleReject(req: GroupJoinRequestWithProfile) {
    setLoadingId(req.id);
    const result = await rejectJoinRequestAction(req.id);
    setLoadingId(null);
    if (!result.error) {
      setDismissed((prev) => new Set(prev).add(req.id));
    }
  }

  return (
    <div className="mb-6 rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {visible.length} pending join request{visible.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="divide-y divide-amber-100 dark:divide-amber-900">
        {visible.map((req) => {
          const isLoading = loadingId === req.id;
          return (
            <div key={req.id} className="flex items-start gap-3 px-4 py-3">
              {/* Avatar */}
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold",
                  getAvatarColor(req.profile.display_name)
                )}
              >
                {getInitials(req.profile.display_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium">{req.profile.display_name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(req.created_at)}
                  </span>
                </div>
                {req.profile.headline && (
                  <p className="text-xs text-muted-foreground truncate">
                    {req.profile.headline}
                  </p>
                )}
                {req.message && (
                  <p className="text-sm mt-1 italic text-muted-foreground">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => handleApprove(req)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => handleReject(req)}
                  disabled={isLoading}
                >
                  <X className="size-3.5" />
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
