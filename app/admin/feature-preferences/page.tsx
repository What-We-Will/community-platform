import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/feature-keys";
import type { FeatureAdoptionRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  events: "Events",
  discussions: "Discussions",
  job_referrals: "Job referrals",
  resource_hub: "Resource hub",
};

export default async function FeaturePreferencesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_feature_adoption_counts");

  const rows = (data ?? []) as FeatureAdoptionRow[];
  const counts = new Map(rows.map((row) => [row.feature, row.enabled_count]));

  // The RPC hardcodes its own copy of the key list. If it stops covering
  // FEATURE_KEYS the two have drifted, and a missing key is indistinguishable
  // from genuine zero adoption — so fail the load rather than report a zero.
  const failed = error !== null || FEATURE_KEYS.some((key) => !counts.has(key));

  const memberTotal = rows[0]?.member_total ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Member feature preferences</h1>
          {!failed && (
            <p className="mt-1 text-sm text-muted-foreground">
              Counted cohort: approved members ({memberTotal}).
            </p>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {failed ? (
        <Card>
          <CardContent role="alert" className="py-12 text-center text-muted-foreground">
            Could not load feature preference counts. Try again shortly.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Feature</th>
                  <th scope="col" className="px-4 py-3 font-medium">Members</th>
                  <th scope="col" className="px-4 py-3 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_KEYS.map((key) => {
                  const count = counts.get(key) ?? 0;
                  const share =
                    memberTotal === 0 ? 0 : Math.round((count / memberTotal) * 100);

                  return (
                    <tr key={key} className="border-b last:border-b-0">
                      <th scope="row" className="px-4 py-3 text-left font-medium">
                        {FEATURE_LABELS[key]}
                      </th>
                      <td className="px-4 py-3 tabular-nums">{count}</td>
                      <td className="px-4 py-3 tabular-nums">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
