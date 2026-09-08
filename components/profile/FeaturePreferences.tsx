"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/feature-keys";
import { FEATURE_DESCRIPTIONS } from "@/lib/feature-preferences";

interface FeaturePreferencesProps {
  value: FeatureKey[];
  onChange: (next: FeatureKey[]) => void;
  idPrefix?: string;
}

export function FeaturePreferences({
  value,
  onChange,
  idPrefix = "feature",
}: FeaturePreferencesProps) {
  const selected = new Set(value);

  // Derived from FEATURE_KEYS rather than from the previous value, so the
  // emitted array is always canonical order and never carries a duplicate.
  function toggle(key: FeatureKey, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);
    onChange(FEATURE_KEYS.filter((candidate) => next.has(candidate)));
  }

  return (
    <div className="space-y-3">
      {FEATURE_KEYS.map((key) => {
        const id = `${idPrefix}-${key}`;
        const { label, description } = FEATURE_DESCRIPTIONS[key];
        return (
          <div key={key} className="flex items-start gap-3">
            <Checkbox
              id={id}
              className="mt-1"
              checked={selected.has(key)}
              onCheckedChange={(checked) => toggle(key, checked === true)}
            />
            <div className="space-y-0.5">
              <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
