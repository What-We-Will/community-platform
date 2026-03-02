import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Profile } from "@/lib/types";

interface Attendee {
  user_id: string;
  status: string;
  profile: Profile | null;
}

interface AttendeesListProps {
  attendees: Attendee[];
  statusFilter: "going" | "maybe";
  title: string;
}

export function AttendeesList({
  attendees,
  statusFilter,
  title,
}: AttendeesListProps) {
  const filtered = attendees.filter((a) => a.status === statusFilter);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title} ({filtered.length})</h3>
      <div className="flex flex-wrap gap-3">
        {filtered.map((a) => (
          <Link
            key={a.user_id}
            href={`/members/${a.user_id}`}
            className="flex items-center gap-2 rounded-lg p-1.5 -m-1.5 hover:bg-accent/50 transition-colors"
          >
            <UserAvatar
              avatarUrl={a.profile?.avatar_url ?? null}
              displayName={a.profile?.display_name ?? "Unknown"}
              size="sm"
            />
            <span className="text-sm">{a.profile?.display_name ?? "Unknown"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
