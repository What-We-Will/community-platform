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
  const lastPushedQ = useRef(searchParams.get("q") ?? "");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q !== lastPushedQ.current) {
      if (inputRef.current) inputRef.current.value = q;
      lastPushedQ.current = q;
    }
  }, [searchParams]);

  const skill = searchParams.get("skill") ?? "";
  const referrals = searchParams.get("referrals") === "true";

  const updateParams = useCallback(
    (updates: { q?: string; skill?: string; referrals?: string }) => {
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
      router.push(`/members${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router, searchParams]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        lastPushedQ.current = value;
        updateParams({ q: value });
      }, SEARCH_DEBOUNCE_MS);
    },
    [updateParams]
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
        />
      </div>
      <div className="space-y-2">
        <Label>Skill</Label>
        <Select
          value={skill || "all"}
          onValueChange={(v) => updateParams({ skill: v === "all" ? "" : v })}
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
            updateParams({ referrals: checked ? "true" : "" })
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
