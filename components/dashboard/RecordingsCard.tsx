import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export function RecordingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="size-4" />
          Recordings
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Video className="size-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Watch past sessions
        </p>
        <p className="text-xs text-muted-foreground">
          Event recordings coming soon
        </p>
      </CardContent>
    </Card>
  );
}
