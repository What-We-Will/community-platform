import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { approveUser, rejectUser } from "./actions";
import { isHttpsUrl } from "@/lib/utils/url";
import { ArrowLeft, Linkedin, Github, Globe } from "lucide-react";
import Link from "next/link";
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

  const { data: pendingProfiles } = await supabase
    .from("profiles")
    .select("id, display_name, linkedin_url, github_url, portfolio_url, created_at")
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pending Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review applicants&apos; LinkedIn, GitHub, or website links and approve tech workers to join the platform.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending applications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => {
            const links = [
              { url: profile.linkedin_url, label: "LinkedIn", icon: Linkedin },
              { url: profile.github_url, label: "GitHub", icon: Github },
              { url: profile.portfolio_url, label: "Website", icon: Globe },
            ].filter(
              // Read-time guard: stored rows predate write-path validation and
              // no DB constraint enforces the scheme.
              (link): link is typeof link & { url: string } =>
                Boolean(link.url) && isHttpsUrl(link.url)
            );

            return (
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
                {links.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <link.icon className="size-3.5" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No verification link provided</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Applied {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                  <form action={rejectUser.bind(null, profile.id)}>
                    <Button
                      type="submit"
                      size="sm"
                      style={{ backgroundColor: "#690212" }}
                      className="text-white hover:opacity-90"
                    >
                      Reject
                    </Button>
                  </form>
                  <form action={approveUser.bind(null, profile.id)}>
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                </div>
              </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
