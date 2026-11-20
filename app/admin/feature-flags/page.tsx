import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FLAG_KEYS } from "@/lib/feature-flag-keys";
import type { FeatureFlagRow } from "@/lib/feature-flags";
import type { FeatureFlagChangeRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/time";
import { formatInTimeZone } from "@/lib/utils/timezone";
import { FeatureFlagToggle } from "./feature-flag-toggle";
import { FEATURE_FLAG_LABELS } from "./labels";


type FlagState = Pick<FeatureFlagRow, "key" | "enabled" | "updated_at">;

const FLAG_KEY_SET = new Set<string>(FLAG_KEYS);

function labelFor(key: string): string {
  return FLAG_KEY_SET.has(key)
    ? FEATURE_FLAG_LABELS[key as (typeof FLAG_KEYS)[number]]
    : key;
}

function stateLabel(enabled: boolean): string {
  return enabled ? "On" : "Off";
}

export default async function FeatureFlagsPage() {
  const supabase = await createClient();

  const [flagsResult, changesResult] = await Promise.all([
    supabase.from("feature_flags").select("key, enabled, updated_at"),
    supabase
      .from("feature_flag_changes")
      .select("id, flag_key, old_enabled, new_enabled, changed_by, changed_at")
      .order("changed_at", { ascending: false })
      .limit(20),
  ]);

  const flagsFailed = flagsResult.error !== null;
  const rows = new Map<string, FlagState>();
  for (const row of (flagsResult.data ?? []) as FlagState[]) {
    rows.set(row.key, row);
  }

  const changesFailed = changesResult.error !== null;
  const changes = (changesResult.data ?? []) as FeatureFlagChangeRow[];

  const actorIds = [
    ...new Set(
      changes.map((c) => c.changed_by).filter((id): id is string => id !== null)
    ),
  ];
  const actorNames = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    for (const profile of profiles ?? []) {
      actorNames.set(profile.id, profile.display_name);
    }
  }

  function actorFor(changedBy: string | null): string {
    if (changedBy === null) return "Outside the app";
    return actorNames.get(changedBy) ?? "Unknown member";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Feature flags</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes reach all members within about 30 seconds.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Admins always see every feature. Check the effect with a member
            account.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {flagsFailed ? (
        <Card>
          <CardContent role="alert" className="py-12 text-center text-muted-foreground">
            Could not load feature flags. Try again shortly.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {FLAG_KEYS.map((key) => {
                const row = rows.get(key);
                return (
                  <li key={key} className="space-y-1 px-4 py-3">
                    {row ? (
                      <FeatureFlagToggle
                        flagKey={key}
                        label={FEATURE_FLAG_LABELS[key]}
                        enabled={row.enabled}
                        updatedAt={row.updated_at}
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium">{FEATURE_FLAG_LABELS[key]}</p>
                        <p className="text-sm text-destructive">
                          Not defined in the database. Resolves to off.
                        </p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="recent-changes-heading" className="space-y-3">
        <h2 id="recent-changes-heading" className="text-lg font-semibold">
          Recent changes
        </h2>
        {changesFailed ? (
          <Card>
            <CardContent role="alert" className="py-8 text-center text-muted-foreground">
              Could not load recent changes.
            </CardContent>
          </Card>
        ) : changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y text-sm">
                {changes.map((change) => (
                  <li
                    key={change.id}
                    className="grid grid-cols-2 items-baseline gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)_5.5rem]"
                  >
                    <span className="font-medium">{labelFor(change.flag_key)}</span>
                    <span className="text-right sm:text-left">
                      {stateLabel(change.old_enabled)} → {stateLabel(change.new_enabled)}
                    </span>
                    <span className="text-muted-foreground">
                      {actorFor(change.changed_by)}
                    </span>
                    <time
                      dateTime={change.changed_at}
                      title={formatInTimeZone(change.changed_at, "UTC", "d MMM yyyy, HH:mm 'UTC'")}
                      className="text-right text-muted-foreground"
                    >
                      {formatRelativeTime(change.changed_at)}
                    </time>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
