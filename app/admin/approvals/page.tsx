import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { approveUser } from "./actions";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ApprovalsPage() {
  const supabase = await createClient();

  // Guard: must be logged in and an admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") redirect("/dashboard");

  // Fetch all pending profiles
  const { data: pendingProfiles } = await supabase
    .from("profiles")
    .select("id, display_name, linkedin_url, created_at")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  // Enrich with emails via service role
  const serviceClient = createServiceClient();
  const profiles = await Promise.all(
    (pendingProfiles ?? []).map(async (profile) => {
      const {
        data: { user: authUser },
      } = await serviceClient.auth.admin.getUserById(profile.id);
      return { ...profile, email: authUser?.email ?? "—" };
    })
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Pending Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review LinkedIn profiles and approve tech workers to join the platform.
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending applications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{profile.display_name}</CardTitle>
                    <CardDescription className="mt-0.5">{profile.email}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 pt-0">
                {profile.linkedin_url ? (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    View LinkedIn
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">No LinkedIn provided</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Applied {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await approveUser(profile.id);
                    }}
                  >
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
