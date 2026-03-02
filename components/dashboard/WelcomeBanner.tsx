import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Briefcase, Users, UsersRound, MessageSquare } from "lucide-react";
import type { Profile } from "@/lib/types";

const MOTIVATIONAL_LINES = [
  "Every application is a step forward.",
  "Your next opportunity could be one connection away.",
  "Consistency beats perfection. Keep going.",
  "Small steps today lead to big wins tomorrow.",
  "Your network is your net worth. Keep building it.",
  "Stay curious. Stay connected.",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivationalLine(): string {
  const dayIndex = new Date().getDay();
  return MOTIVATIONAL_LINES[dayIndex % MOTIVATIONAL_LINES.length];
}

interface WelcomeBannerProps {
  profile: Profile | null;
}

export function WelcomeBanner({ profile }: WelcomeBannerProps) {
  const displayName = profile?.display_name ?? "there";
  const greeting = getGreeting();
  const subtitle = getMotivationalLine();

  return (
    <Card className="col-span-full overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background md:col-span-2 lg:col-span-3">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="secondary" size="sm" asChild disabled>
                      <Link href="/jobs" className="pointer-events-none">
                        <Briefcase className="size-4" />
                        Browse Jobs
                      </Link>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/members">
                  <Users className="size-4" />
                  Find Members
                </Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/groups">
                  <UsersRound className="size-4" />
                  My Groups
                </Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/messages">
                  <MessageSquare className="size-4" />
                  New Message
                </Link>
              </Button>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
