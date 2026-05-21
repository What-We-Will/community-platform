"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const queryParam = searchParams.get("q") ?? "";
  const lastPushedQueryRef = useRef(queryParam);
  const [searchInput, setSearchInput] = useState(() => queryParam);

  // Sync local state only when the q param changes externally (e.g. browser back/forward).
  useEffect(() => {
    if (queryParam === lastPushedQueryRef.current) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(queryParam);
  }, [queryParam]);

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") ?? "";
      if (searchInput === currentQ) {
        return;
      }
      lastPushedQueryRef.current = searchInput;
      updateParams({ q: searchInput });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateParams]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          type="search"
          placeholder="Search by name, role, or location..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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
