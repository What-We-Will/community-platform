"use client";

import { useEffect, useState } from "react";
import { FeaturePreferences } from "@/components/profile/FeaturePreferences";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeatureKey } from "@/lib/feature-keys";
import { updateEnabledFeatures } from "./actions";

interface FeaturePreferencesFormProps {
  initialFeatures: FeatureKey[];
}

export default function FeaturePreferencesForm({
  initialFeatures,
}: FeaturePreferencesFormProps) {
  const [features, setFeatures] = useState<FeatureKey[]>(initialFeatures);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // A revalidation elsewhere re-renders this card with a fresh selection;
  // without resyncing, a Save with no edits would write the stale one back.
  useEffect(() => {
    setFeatures(initialFeatures);
  }, [initialFeatures]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await updateEnabledFeatures(features);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Platform features</CardTitle>
          <CardDescription>
            Choose what appears in your navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              Features updated successfully.
            </div>
          )}
          <FeaturePreferences value={features} onChange={setFeatures} />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save features"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
