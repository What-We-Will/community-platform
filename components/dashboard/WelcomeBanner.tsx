"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import type { Profile } from "@/lib/types";
import { featureFlags } from "@/lib/feature-flags";

const MOTIVATIONAL_LINES = [
  "Together, we can take steps forward.",
  "We will win together.",
  "Consistency beats perfection. Keep going.",
  "Stay curious. Stay connected.",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivationalLine(): string {
  const dayOfMonth = new Date().getDate();
  return MOTIVATIONAL_LINES[dayOfMonth % MOTIVATIONAL_LINES.length];
}

interface WelcomeBannerProps {
  profile: Profile | null;
}

export function WelcomeBanner({ profile }: WelcomeBannerProps) {
  const displayName = profile?.display_name ?? "there";
  const greeting = getGreeting();
  const subtitle = getMotivationalLine();

  return (
    <Card className="col-span-full overflow-hidden border-l-4 border-l-primary-orange bg-card rounded-lg md:col-span-2 lg:col-span-3">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              <span className="text-primary-orange">{greeting}</span>, {displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {featureFlags.ghostJobBoard && (
              <Button
                size="sm"
                asChild
                className="bg-primary-orange text-white hover:bg-primary-orange-hover"
              >
                <Link href="/jobs">Report a Ghost Job</Link>
              </Button>
            )}
            <Button
              size="sm"
              asChild
              className="bg-accent-green/10 text-accent-green hover:bg-accent-green/15 dark:bg-accent-green/15 dark:hover:bg-accent-green/25"
            >
              <Link href="/members">
                <Users className="size-4" />
                Connect with Members
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
