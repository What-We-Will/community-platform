import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export function JobTrackerCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="size-4" />
          Job Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Briefcase className="size-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Track your job applications
        </p>
        <p className="text-xs text-muted-foreground">
          Job board and personal tracker coming soon
        </p>
      </CardContent>
    </Card>
  );
}
