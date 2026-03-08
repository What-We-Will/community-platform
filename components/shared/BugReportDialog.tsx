"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bug } from "lucide-react";

interface BugReportDialogProps {
  /** Pre-fill the reporter email (e.g. for logged-in users) */
  reporterEmail?: string;
}

export function BugReportDialog({ reporterEmail }: BugReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(reporterEmail ?? "");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function resetForm() {
    setDescription("");
    setSteps("");
    setErrorMsg("");
    setStatus("idle");
    if (!reporterEmail) setEmail("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, description, steps }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Bug className="size-3.5" />
          Report a bug
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report a bug</DialogTitle>
          <DialogDescription>
            Describe what went wrong and we&apos;ll look into it.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-6 text-center">
            <p className="font-medium">Thanks for the report!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll review your feedback and follow up if needed.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              {errorMsg && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMsg}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="bug-email">
                  Your email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bug-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!reporterEmail}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bug-description">
                  What happened? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bug-description"
                  placeholder="Describe the bug..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bug-steps">Steps to reproduce (optional)</Label>
                <Textarea
                  id="bug-steps"
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                  rows={3}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={status === "loading" || !description.trim()}>
                {status === "loading" ? "Sending…" : "Send report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
