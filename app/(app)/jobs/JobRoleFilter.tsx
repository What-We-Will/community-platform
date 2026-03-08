"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Handshake, Network, MessageSquare, X } from "lucide-react";
import { JOB_ROLES, type JobRole } from "./job-roles";
import { cn } from "@/lib/utils";

interface Props {
  activeRole: string | null;
  activeReferral: boolean;
  activeCommunity: boolean;
  activeNotes: boolean;
}

export function JobRoleFilter({ activeRole, activeReferral, activeCommunity, activeNotes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(changes)) {
        if (val === null) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setRole = (role: JobRole | null) =>
    update({ role: role });

  const toggleReferral = () =>
    update({ referral: activeReferral ? null : "true" });

  const toggleCommunity = () =>
    update({ community: activeCommunity ? null : "true" });

  const toggleNotes = () =>
    update({ notes: activeNotes ? null : "true" });

  const hasAnyFilter = activeRole || activeReferral || activeCommunity || activeNotes;

  const clearAll = () => update({ role: null, referral: null, community: null, notes: null });

  return (
    <div className="flex flex-col gap-2">
      {/* Special filters row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={toggleReferral}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
            activeReferral
              ? "bg-emerald-600 text-white border-emerald-600"
              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          )}
        >
          <Handshake className="size-3" />
          Referral Available
          {activeReferral && <X className="size-3 ml-0.5" />}
        </button>

        <button
          onClick={toggleNotes}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
            activeNotes
              ? "bg-amber-600 text-white border-amber-600"
              : "border-amber-300 text-amber-700 hover:bg-amber-50"
          )}
        >
          <MessageSquare className="size-3" />
          Has Notes
          {activeNotes && <X className="size-3 ml-0.5" />}
        </button>

        <button
          onClick={toggleCommunity}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
            activeCommunity
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          )}
        >
          <Network className="size-3" />
          Community Network
          {activeCommunity && <X className="size-3 ml-0.5" />}
        </button>

        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" /> Clear all
          </button>
        )}
      </div>

      {/* Role filter row */}
      <div className="flex flex-wrap gap-1.5">
        {JOB_ROLES.map((role) => (
          <button
            key={role.value}
            onClick={() => setRole(activeRole === role.value ? null : role.value)}
            className={cn(
              "rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
              activeRole === role.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}
