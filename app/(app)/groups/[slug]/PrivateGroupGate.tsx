"use client";

import { useState } from "react";
import { Lock, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import {
  requestJoinGroupAction,
  withdrawJoinRequestAction,
} from "@/app/(app)/groups/actions";
import type { Group, GroupJoinRequest } from "@/lib/types";

interface PrivateGroupGateProps {
  group: Group;
  existingRequest: GroupJoinRequest | null;
}

export function PrivateGroupGate({ group, existingRequest }: PrivateGroupGateProps) {
  const [request, setRequest] = useState<GroupJoinRequest | null>(existingRequest);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setLoading(true);
    setError(null);
    const result = await requestJoinGroupAction(group.id, message || undefined);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      // Optimistically reflect the pending state
      setRequest({
        id: "pending",
        group_id: group.id,
        user_id: "",
        status: "pending",
        message: message || null,
        created_at: new Date().toISOString(),
      });
      setMessage("");
    }
  }

  async function handleWithdraw() {
    if (!request) return;
    setLoading(true);
    setError(null);
    const result = await withdrawJoinRequestAction(request.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setRequest(null);
    }
  }

  const isPending = request?.status === "pending";
  const isRejected = request?.status === "rejected";

  return (
    <div className="mx-auto max-w-md mt-16 px-4 space-y-6">
      {/* Group card */}
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-2xl text-white font-bold text-2xl",
            getAvatarColor(group.name)
          )}
        >
          {getInitials(group.name)}
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <Lock className="size-5 text-muted-foreground" />
          </div>
          {group.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {group.description}
            </p>
          )}
        </div>
      </div>

      {/* Status card */}
      {isPending && (
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
            <Clock className="size-5" />
            <p className="font-semibold">Request pending</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your request to join has been sent to the group admins. You&apos;ll be
            notified when they review it.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWithdraw}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Withdraw Request
          </Button>
        </div>
      )}

      {isRejected && (
        <div className="rounded-xl border bg-muted p-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <XCircle className="size-5" />
            <p className="font-semibold">Request declined</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your previous request was not approved. You may send a new request.
          </p>
        </div>
      )}

      {/* Request form — shown when no pending request */}
      {(!request || isRejected) && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="text-center space-y-1">
            <p className="font-semibold">This is a private group</p>
            <p className="text-sm text-muted-foreground">
              Send a request and an admin will review it.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="join-message">Message to admins (optional)</Label>
            <Textarea
              id="join-message"
              placeholder="Introduce yourself or explain why you'd like to join…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={3}
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleRequest}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Request to Join
          </Button>
        </div>
      )}
    </div>
  );
}
