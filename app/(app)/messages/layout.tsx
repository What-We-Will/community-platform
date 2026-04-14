import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { fetchRecentConversations } from "@/lib/conversations";
import { selfNotesConversationId } from "@/lib/messages";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const conversations = await fetchRecentConversations(user.id, 500);
  const notesId = selfNotesConversationId(user.id);

  return (
    <div className="-m-4 lg:-m-6 flex h-[calc(100dvh-3.5rem)] overflow-auto lg:h-dvh">
      <div className="flex w-full shrink-0 flex-col border-r md:w-80">
        <ConversationList
          initialConversations={conversations}
          currentUserId={user.id}
          selfNotesId={notesId}
        />
      </div>
      <div className="hidden h-full min-h-0 flex-1 flex-col min-w-0 md:flex overflow-auto">{children}</div>
    </div>
  );
}
