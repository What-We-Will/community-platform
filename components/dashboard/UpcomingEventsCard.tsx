import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export function UpcomingEventsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="size-4" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Calendar className="size-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          No upcoming events
        </p>
        <p className="text-xs text-muted-foreground">
          Events and scheduling coming soon
        </p>
      </CardContent>
    </Card>
  );
}
