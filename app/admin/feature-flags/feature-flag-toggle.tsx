"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const [success, setSuccess] = useState<string | null>(null);
  const returnFocusAfterSave = useRef(false);
  const switchRef = useRef<HTMLButtonElement>(null);
  const id = `feature-flag-${flagKey}`;

  // Disabling the switch while saving drops its focus, so hand it back once the save ends.
  useEffect(() => {
    if (!isPending && returnFocusAfterSave.current) {
      returnFocusAfterSave.current = false;
      switchRef.current?.focus();
    }
  }, [isPending]);

  function submit(next: boolean) {
    setSuccess(null);
    returnFocusAfterSave.current = true;
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
      setSuccess(result.ok ? `${label} turned ${next ? "on" : "off"}.` : null);
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
        <div className="flex items-center gap-2">
          {/* The switch already announces its state; this text is for sighted users. */}
          <span aria-hidden="true" className="text-sm text-muted-foreground">
            {isPending ? "Saving…" : enabled ? "On" : "Off"}
          </span>
          <Switch
            ref={switchRef}
            id={id}
            checked={enabled}
            disabled={isPending}
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {/* Screen readers only: sighted admins see the switch settle and the new history row.
          Always mounted, because only changes to an existing live region are announced. */}
      <p role="status" className="sr-only">
        {success}
      </p>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // The dialog has no trigger to return focus to. After a confirm the switch is
            // disabled, so this is a no-op and the save effect restores focus instead.
            event.preventDefault();
            switchRef.current?.focus();
          }}
        >
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
