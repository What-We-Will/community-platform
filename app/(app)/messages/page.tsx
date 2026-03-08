import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { findExistingDM, createDMConversation, getOrCreateSelfNotes } from "@/lib/messages";
import { MessageSquare } from "lucide-react";

interface MessagesPageProps {
  searchParams: Promise<{ new?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const { new: newUserId } = await searchParams;

  if (newUserId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Verify target user exists and is onboarded
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, is_onboarded")
      .eq("id", newUserId)
      .eq("is_onboarded", true)
      .maybeSingle();

    if (!targetProfile) {
      return (
        <EmptyState
          message="That member doesn't exist or hasn't finished onboarding."
          linkLabel="Back to Messages"
          linkHref="/messages"
        />
      );
    }

    // Self → open notes conversation
    if (targetProfile.id === user.id) {
      const notesId = await getOrCreateSelfNotes(user.id);
      redirect(`/messages/${notesId}`);
    }

    // Find or create DM
    let conversationId: string | null = null;
    try {
      conversationId = await findExistingDM(user.id, targetProfile.id);
      if (!conversationId) {
        conversationId = await createDMConversation(user.id, targetProfile.id);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[messages] find/create DM failed:", detail);
      return (
        <EmptyState
          message={`Could not open this conversation. ${detail}`}
          linkLabel="Back to Messages"
          linkHref="/messages"
        />
      );
    }

    redirect(`/messages/${conversationId}`);
  }

  // No conversation selected — show empty state in the right panel
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="size-7 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Your messages</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a conversation or start a new one.
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  message,
  linkLabel,
  linkHref,
}: {
  message: string;
  linkLabel: string;
  linkHref: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <a href={linkHref} className="text-sm text-primary hover:underline">
        {linkLabel}
      </a>
    </div>
  );
}
