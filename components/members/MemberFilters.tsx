"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEARCH_DEBOUNCE_MS = 300;

interface MemberFiltersProps {
  allSkills: string[];
}

export default function MemberFilters({ allSkills }: MemberFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inputRef = useRef<HTMLInputElement>(null);
  // Last q we wrote to the URL via push OR replace — lets the external-nav
  // sync below distinguish back/forward from our own writes.
  const lastUrlQ = useRef(searchParams.get("q") ?? "");
  // Last q committed via push (Enter / blur / filter change). commitSearch
  // dedupes against this — not against lastUrlQ — so Enter after a
  // debounce-replace still creates a real history entry.
  const lastCommittedQ = useRef(searchParams.get("q") ?? "");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // External navigation sync (back / forward only)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q !== lastUrlQ.current) {
      if (inputRef.current) inputRef.current.value = q;
      lastUrlQ.current = q;
      lastCommittedQ.current = q;
    }
  }, [searchParams]);

  // Cancels any pending debounce timer when the component unmounts
  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  const skill = searchParams.get("skill") ?? "";
  const referrals = searchParams.get("referrals") === "true";

  const updateParams = useCallback(
    (
      updates: { q?: string; skill?: string; referrals?: string },
      navMethod: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.q !== undefined) {
        if (updates.q) params.set("q", updates.q);
        else params.delete("q");
      }
      if (updates.skill !== undefined) {
        if (updates.skill) params.set("skill", updates.skill);
        else params.delete("skill");
      }
      if (updates.referrals !== undefined) {
        if (updates.referrals === "true") params.set("referrals", "true");
        else params.delete("referrals");
      }
      const url = `/members${params.toString() ? `?${params.toString()}` : ""}`;
      router[navMethod](url, { scroll: false });
    },
    [router, searchParams]
  );

  // Ref always pointing at the latest updateParams so the debounce timer
  // callback never closes over a stale searchParams snapshot.
  const updateParamsRef = useRef(updateParams);
  useEffect(() => {
    updateParamsRef.current = updateParams;
  }, [updateParams]);

  // Debounced fire while typing: replace (no history entry per keystroke pause).
  // Updates only lastUrlQ; lastCommittedQ stays reserved for push.
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        lastUrlQ.current = value;
        updateParamsRef.current({ q: value }, "replace");
      }, SEARCH_DEBOUNCE_MS);
    },
    [] // stable — intentionally no deps; freshness comes from the ref
  );

  // Commit (blur / Enter): cancel pending debounce, then push to add history.
  const commitSearch = useCallback(() => {
    clearTimeout(debounceTimer.current);
    const value = inputRef.current?.value ?? "";
    if (value === lastCommittedQ.current) return;
    lastCommittedQ.current = value;
    lastUrlQ.current = value;
    updateParamsRef.current({ q: value }, "push");
  }, []);

  // Skill / referrals changes capture the live input value so any in-progress
  // typing isn't dropped by the stale searchParams snapshot.
  const updateFilter = useCallback(
    (updates: { skill?: string; referrals?: string }) => {
      clearTimeout(debounceTimer.current);
      const value = inputRef.current?.value ?? "";
      lastCommittedQ.current = value;
      lastUrlQ.current = value;
      updateParamsRef.current({ ...updates, q: value }, "push");
    },
    []
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitSearch();
      }
    },
    [commitSearch]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          ref={inputRef}
          id="search"
          type="search"
          placeholder="Search by name, role, or location..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={handleSearchChange}
          onBlur={commitSearch}
          onKeyDown={handleSearchKeyDown}
        />
      </div>
      <div className="space-y-2">
        <Label>Skill</Label>
        <Select
          value={skill || "all"}
          onValueChange={(v) => updateFilter({ skill: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            {allSkills.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="referrals"
          checked={referrals}
          onCheckedChange={(checked) =>
            updateFilter({ referrals: checked ? "true" : "" })
          }
        />
        <Label
          htmlFor="referrals"
          className="cursor-pointer text-sm font-normal"
        >
          Open to Mock Interviews only
        </Label>
      </div>
    </div>
  );
}
