"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createApplication, updateApplication, type ApplicationStatus, type JobApplicationInput } from "./actions";
import { STATUSES } from "./constants";

interface Props {
  mode?: "create" | "edit";
  initialValues?: JobApplicationInput & { id: string };
  trigger?: React.ReactNode;
  defaultStatus?: ApplicationStatus;
}

export function ApplicationForm({ mode = "create", initialValues, trigger, defaultStatus = "applied" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState(initialValues?.company ?? "");
  const [position, setPosition] = useState(initialValues?.position ?? "");
  const [appliedDate, setAppliedDate] = useState(initialValues?.applied_date ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(initialValues?.status ?? defaultStatus);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [url, setUrl] = useState(initialValues?.url ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;
    setLoading(true); setError(null);
    const payload: JobApplicationInput = {
      company: company.trim(),
      position: position.trim(),
      applied_date: appliedDate || undefined,
      status,
      notes: notes.trim() || undefined,
      url: url.trim() || undefined,
    };
    const res = mode === "edit" && initialValues
      ? await updateApplication(initialValues.id, payload)
      : await createApplication(payload);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setOpen(false);
    if (mode === "create") {
      setCompany(""); setPosition(""); setAppliedDate(""); setNotes(""); setUrl("");
      setStatus(defaultStatus);
    }
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5">
            <Plus className="size-4" />
            Add Application
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Application" : "Add Application"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company <span className="text-destructive">*</span></Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Position <span className="text-destructive">*</span></Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Software Engineer" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="applied_date">Date Applied</Label>
              <Input id="applied_date" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">Job Posting URL</Label>
            <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Personal Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interview tips, contacts, key info…" className="min-h-[80px]" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              {mode === "edit" ? "Save Changes" : "Add Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
