"use client";

import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "profile_onboarded=; path=/; max-age=0; samesite=lax";
    document.cookie = "profile_approved=; path=/; max-age=0; samesite=lax";
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Clock className="size-8 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Membership pending approval
        </h1>
        <p className="mt-3 text-muted-foreground">
          Thanks for applying to What We Will! We&apos;ll review your LinkedIn
          profile to verify your background as a tech worker.
        </p>
        <p className="mt-2 text-muted-foreground">
          You&apos;ll receive an email within 24 hours once your membership is
          approved.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Questions? Reach out to{" "}
          <a
            href="mailto:info@wwwrise.org"
            className="underline underline-offset-4 hover:text-foreground"
          >
            info@wwwrise.org
          </a>
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-8 gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
