"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Search, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { inviteMemberAction } from "@/app/(app)/groups/actions";
import type { Profile } from "@/lib/types";

interface InviteMemberDialogProps {
  groupId: string;
  currentMemberIds: string[];
  onInvited: () => void;
}

export function InviteMemberDialog({
  groupId,
  currentMemberIds,
  onInvited,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvited(new Set());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, headline, avatar_url, last_seen_at")
        .ilike("display_name", `%${query.trim()}%`)
        .eq("is_onboarded", true)
        .not("id", "in", `(${[...currentMemberIds, ...invited].join(",") || "00000000-0000-0000-0000-000000000000"})`)
        .limit(8);
      setResults((data as Profile[]) ?? []);
      setSearching(false);
    }, 300);
  }, [query, currentMemberIds, invited]);

  async function handleInvite(profile: Profile) {
    setInviting(profile.id);
    setError(null);
    const result = await inviteMemberAction(groupId, profile.id);
    setInviting(null);
    if (result.error) {
      setError(result.error);
    } else {
      setInvited((prev) => new Set(prev).add(profile.id));
      setResults((prev) => prev.filter((p) => p.id !== profile.id));
      onInvited();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="size-4" />
          Invite Members
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="max-h-72 overflow-y-auto divide-y rounded-lg border">
            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No members found
              </div>
            )}

            {!searching && !query.trim() && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type a name to search
              </div>
            )}

            {results.map((profile) => {
              const isInviting = inviting === profile.id;
              const wasInvited = invited.has(profile.id);
              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold",
                      getAvatarColor(profile.display_name)
                    )}
                  >
                    {getInitials(profile.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile.display_name}
                    </p>
                    {profile.headline && (
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.headline}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={wasInvited ? "ghost" : "default"}
                    disabled={isInviting || wasInvited}
                    onClick={() => handleInvite(profile)}
                    className="shrink-0"
                  >
                    {isInviting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : wasInvited ? (
                      <><Check className="mr-1 size-3.5" />Invited</>
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
