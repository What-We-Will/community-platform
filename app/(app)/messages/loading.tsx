import { Loader2 } from "lucide-react";

export default function MessagesLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Opening conversation…
    </div>
  );
}
