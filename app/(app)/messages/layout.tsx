import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { fetchRecentConversations } from "@/lib/conversations";

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

  return (
    <div className="-m-4 lg:-m-6 flex h-[calc(100dvh-3.5rem)] overflow-hidden lg:h-dvh">
      <div className="flex w-full shrink-0 flex-col border-r md:w-80">
        <ConversationList
          initialConversations={conversations}
          currentUserId={user.id}
        />
      </div>
      <div className="hidden flex-1 flex-col min-w-0 md:flex">{children}</div>
    </div>
  );
}
