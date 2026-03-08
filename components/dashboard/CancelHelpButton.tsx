"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelHelp } from "@/app/(app)/tracker/actions";
import { Loader2, X } from "lucide-react";

export function CancelHelpButton({ helpId }: { helpId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await cancelHelp(helpId);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
      {loading ? "Canceling…" : "Cancel request"}
    </button>
  );
}
