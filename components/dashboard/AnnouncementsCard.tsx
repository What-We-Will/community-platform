import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnnouncementsAdmin } from "./AnnouncementsAdmin";

export async function AnnouncementsCard({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, content")
    .order("created_at", { ascending: true });
  const items = announcements ?? [];

  if (items.length === 0 && !isPlatformAdmin) return null;

  return (
    <div className="col-span-full rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Gray header bar */}
      <div className="flex items-center gap-2 bg-muted px-4 py-2.5 border-b">
        <Megaphone className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Announcements
        </span>
      </div>

      {/* Announcement items */}
      {items.length > 0 ? (
        <ul className="divide-y bg-card">
          {items.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm text-foreground leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1.5">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                  ),
                  h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                  hr: () => <hr className="my-2 border-border" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-muted-foreground/40 pl-3 italic text-muted-foreground">{children}</blockquote>
                  ),
                }}
              >
                {a.content}
              </ReactMarkdown>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground italic">No announcements yet.</p>
      )}

      {/* Admin controls */}
      {isPlatformAdmin && <AnnouncementsAdmin announcements={items} />}
    </div>
  );
}
