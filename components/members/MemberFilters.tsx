"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function MemberFilters({ allSkills }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // make sure there is only one local state 
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [skill, setSkill] = useState(() => searchParams.get("skill") ?? "");
  const [referrals, setReferrals] = useState(
    () => searchParams.get("referrals") === "true"
  );

  //debounce only ONE value (q)
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  //sync URL (single controlled effect)
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedQ) params.set("q", debouncedQ);
    if (skill) params.set("skill", skill);
    if (referrals) params.set("referrals", "true");

    const url = `/members${params.toString() ? `?${params}` : ""}`;

    router.replace(url);
  }, [debouncedQ, skill, referrals, router]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label>Search</Label>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, role, or location..."
        />
      </div>

      <div className="space-y-2">
        <Label>Skill</Label>
        <Select value={skill || "all"} onValueChange={setSkill}>
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
          checked={referrals}
          onCheckedChange={(v) => setReferrals(!!v)}
        />
        <Label>Open to Mock Interviews only</Label>
      </div>
    </div>
  );
}
