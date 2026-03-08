"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, ChevronDown, Check, X, Handshake, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { createJobPosting, type JobType } from "./actions";
import { JOB_ROLES, type JobRole } from "./job-roles";

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full_time",   label: "Full-time" },
  { value: "part_time",   label: "Part-time" },
  { value: "contract",    label: "Contract" },
  { value: "internship",  label: "Internship" },
  { value: "volunteer",   label: "Volunteer" },
];

export function PostJobForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobType>("full_time");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<JobRole>>(new Set());
  const [offersReferral, setOffersReferral] = useState(false);
  const [isCommunityNetwork, setIsCommunityNetwork] = useState(false);

  const [rolesOpen, setRolesOpen] = useState(false);
  const rolesRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!rolesOpen) return;
    function handleClick(e: MouseEvent) {
      if (rolesRef.current && !rolesRef.current.contains(e.target as Node)) {
        setRolesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [rolesOpen]);

  function toggleRole(role: JobRole) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  }

  function reset() {
    setTitle(""); setCompany(""); setLocation(""); setDescription(""); setUrl("");
    setJobType("full_time"); setSelectedRoles(new Set()); setRolesOpen(false);
    setOffersReferral(false); setIsCommunityNetwork(false); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;
    setLoading(true);
    setError(null);
    const res = await createJobPosting({
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || undefined,
      job_type: jobType,
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      roles: Array.from(selectedRoles),
      offers_referral: offersReferral,
      is_community_network: isCommunityNetwork,
    });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" />
          Post a Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company <span className="text-destructive">*</span></Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, New York" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job_type">Job Type</Label>
              <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
                <SelectTrigger id="job_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role multi-select */}
          <div className="space-y-1.5" ref={rolesRef}>
            <Label>Role / Specialization</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRolesOpen((o) => !o)}
                className={cn(
                  "flex w-full min-h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  rolesOpen && "ring-2 ring-ring ring-offset-2"
                )}
              >
                <span className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {selectedRoles.size === 0 ? (
                    <span className="text-muted-foreground">Select roles…</span>
                  ) : (
                    Array.from(selectedRoles).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0 text-xs font-medium"
                      >
                        {JOB_ROLES.find((x) => x.value === r)?.label}
                        <button
                          type="button"
                          className="hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); toggleRole(r); }}
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </span>
                <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground ml-2 transition-transform", rolesOpen && "rotate-180")} />
              </button>

              {rolesOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <div className="max-h-52 overflow-y-auto p-1">
                    {JOB_ROLES.map((role) => {
                      const checked = selectedRoles.has(role.value);
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => toggleRole(role.value)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                            checked && "font-medium"
                          )}
                        >
                          <span className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                            checked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                          )}>
                            {checked && <Check className="size-3" />}
                          </span>
                          {role.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">Link to Job Posting</Label>
            <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the role…" className="min-h-[80px]" />
          </div>

          {/* Referral + network checkboxes */}
          <div className="space-y-2.5 rounded-lg border bg-muted/40 px-4 py-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5 accent-primary size-4 cursor-pointer"
                checked={offersReferral}
                onChange={(e) => setOffersReferral(e.target.checked)}
              />
              <span className="flex items-center gap-1.5 text-sm">
                <Handshake className="size-4 text-primary shrink-0" />
                I can give a referral for this job
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5 accent-primary size-4 cursor-pointer"
                checked={isCommunityNetwork}
                onChange={(e) => setIsCommunityNetwork(e.target.checked)}
              />
              <span className="flex items-center gap-1.5 text-sm">
                <Network className="size-4 text-primary shrink-0" />
                This is a job within the Tech Worker Coalition or other community network
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Post Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
