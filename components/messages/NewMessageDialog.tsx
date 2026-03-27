"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PenSquare, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateDM } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import type { Profile } from "@/lib/types";

export function NewMessageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    setSearch(query);
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t0 = performance.now();
    const supabase = createClient();
    const { data, error: fetchError, status } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, headline, last_seen_at, skills, open_to_referrals, bio, location, linkedin_url, github_url, portfolio_url, timezone, is_onboarded, role, created_at, updated_at"
      )
      .eq("is_onboarded", true)
      .ilike("display_name", `%${query}%`)
      .limit(10);
    const ms = Math.round(performance.now() - t0);
    const profiles = (data as Profile[]) ?? [];
    console.log(
      `[NewMessageDialog] search query="${query}" status=${status} results=${profiles.length} time=${ms}ms`,
      profiles.map((p) => ({ id: p.id, name: p.display_name })),
    );
    if (fetchError) {
      console.error(`[NewMessageDialog] search error`, fetchError);
    }
    setResults(profiles);
    setLoading(false);
  }

  async function handleSelectUser(userId: string) {
    setOpening(true);
    setError(null);
    const conversationId = await getOrCreateDM(userId);
    if (!conversationId) {
      setError("Could not open conversation. Please try again.");
      setOpening(false);
      return;
    }
    setOpen(false);
    setSearch("");
    setResults([]);
    setOpening(false);
    router.push(`/messages/${conversationId}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1.5 px-2">
          <PenSquare className="size-4" />
          <span className="hidden sm:inline text-sm">New Message</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Search members by name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            disabled={opening}
          />

          {error && (
            <p className="text-sm text-destructive text-center py-2">{error}</p>
          )}

          {opening && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Opening conversation…
            </div>
          )}

          {!opening && loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching members…
            </div>
          )}

          {!opening && !loading && search.length > 0 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members found for &ldquo;{search}&rdquo;
            </p>
          )}

          {!opening && results.length > 0 && (
            <div className="space-y-0.5 max-h-72 overflow-y-auto -mx-1">
              {results.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectUser(profile.id)}
                  disabled={opening}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold",
                      getAvatarColor(profile.display_name)
                    )}
                  >
                    {getInitials(profile.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile.display_name}
                    </p>
                    {profile.headline && (
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.headline}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
