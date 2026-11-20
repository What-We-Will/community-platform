"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FeatureFlag } from "@/lib/feature-flags";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setFeatureFlagEnabled, type SetFeatureFlagResult } from "./actions";

const ERROR_MESSAGES = {
  conflict:
    "This flag changed since the page loaded. Showing the current state now.",
  unauthorized: "You don't have permission to change feature flags.",
  invalid: "Could not update this flag. Try again.",
  failed: "Could not update this flag. Try again.",
} as const;

export function FeatureFlagToggle({
  flagKey,
  label,
  enabled,
  updatedAt,
}: {
  flagKey: FeatureFlag;
  label: string;
  enabled: boolean;
  updatedAt: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<keyof typeof ERROR_MESSAGES | null>(null);
  const id = `feature-flag-${flagKey}`;

  function submit(next: boolean) {
    startTransition(async () => {
      let result: SetFeatureFlagResult;
      try {
        result = await setFeatureFlagEnabled({
          key: flagKey,
          enabled: next,
          expectedUpdatedAt: updatedAt,
        });
      } catch {
        result = { ok: false, error: "failed" };
      }
      setError(result.ok ? null : result.error);
      if (!result.ok && result.error === "conflict") router.refresh();
    });
  }

  function handleCheckedChange() {
    if (enabled) {
      setConfirmOpen(true);
    } else {
      submit(true);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <Switch
          id={id}
          checked={enabled}
          disabled={isPending}
          onCheckedChange={handleCheckedChange}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Members lose access to the feature, including anything they
              created in it, until it is turned back on.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit(false)}>
              Turn off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
