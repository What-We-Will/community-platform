import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function LearningCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" />
          Learning
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <BookOpen className="size-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Track your learning journey
        </p>
        <p className="text-xs text-muted-foreground">
          Shared learning paths coming soon
        </p>
      </CardContent>
    </Card>
  );
}
