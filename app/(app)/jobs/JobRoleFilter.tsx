"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { JOB_ROLES, type JobRole } from "./job-roles";
import { cn } from "@/lib/utils";

export function JobRoleFilter({ activeRole }: { activeRole: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setRole = useCallback(
    (role: JobRole | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (role) {
        params.set("role", role);
      } else {
        params.delete("role");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Filter:</span>
      {activeRole && (
        <button
          onClick={() => setRole(null)}
          className="flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-medium"
        >
          {JOB_ROLES.find((r) => r.value === activeRole)?.label ?? activeRole}
          <X className="size-3" />
        </button>
      )}
      {!activeRole && (
        <span className="text-xs text-muted-foreground italic">All roles</span>
      )}
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
