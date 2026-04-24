import Link from "next/link";
import { fetchRecentConversations } from "@/lib/conversations";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/time";
import { MessageSquare, UsersRound } from "lucide-react";
import type { Message, ConversationWithDetails } from "@/lib/types";

interface ActiveChatsCardProps {
  userId: string;
}

function lastMessagePreview(lastMessage: Message | null, currentUserId: string): string {
  if (!lastMessage) return "No messages yet";
  if (lastMessage.message_type === "system") return lastMessage.content;
  if (lastMessage.message_type === "video_invite") {
    return lastMessage.sender_id === currentUserId
      ? "You started a video call"
      : "Video call started";
  }
  const prefix = lastMessage.sender_id === currentUserId ? "You: " : "";
  const text = lastMessage.content || "";
  return text.length > 35 ? `${prefix}${text.slice(0, 35)}…` : `${prefix}${text}`;
}

export async function ActiveChatsCard({ userId }: ActiveChatsCardProps) {
  let conversations: ConversationWithDetails[] = [];
  try {
    conversations = await fetchRecentConversations(userId, 5);
  } catch {
    // show empty state below
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          Recent Chats
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Start a conversation from the{" "}
            <Link href="/members" className="text-primary hover:underline">
              Members directory
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map(
              ({
                conversation,
                participants,
                lastMessage,
                unreadCount,
                groupName,
              }) => {
                const isGroup = conversation.type === "group";
                const name = isGroup ? groupName ?? "Group" : participants[0]?.display_name ?? "Unknown";
                const href = `/messages/${conversation.id}`;

                return (
                  <li key={conversation.id}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-accent/50 transition-colors"
                    >
                      {isGroup ? (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <UsersRound className="size-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <UserAvatar
                          avatarUrl={participants[0]?.avatar_url ?? null}
                          displayName={participants[0]?.display_name ?? ""}
                          size="sm"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {name}
                          </span>
                          {lastMessage && (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {formatRelativeTime(lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMessagePreview(lastMessage, userId)}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="shrink-0 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              }
            )}
          </ul>
        )}
      </CardContent>
      {conversations.length > 0 && (
        <CardFooter className="pt-0">
          <Link
            href="/messages"
            className="text-sm text-primary hover:underline"
          >
            View all messages →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
