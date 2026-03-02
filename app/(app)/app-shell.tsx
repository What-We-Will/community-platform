"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserSearch,
  UsersRound,
  MessageSquare,
  UserCircle,
  Menu,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/messages/UnreadBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { updateLastSeen } from "@/app/(app)/profile/actions";

const HEARTBEAT_INTERVAL_MS = 45_000; // 45s — keep last_seen_at fresh so others see you online

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: UserSearch },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "My Profile", icon: UserCircle },
];

interface AppShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    unreadCount: number;
  };
}

export default function AppShell({ children, user }: AppShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keep last_seen_at updated so other users see you as online while the app is open
  useEffect(() => {
    const interval = setInterval(() => {
      updateLastSeen();
    }, HEARTBEAT_INTERVAL_MS);
    updateLastSeen(); // run once on mount
    return () => clearInterval(interval);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear the onboarding cache cookie so the next user on this browser
    // gets a fresh check instead of inheriting the previous session's state.
    document.cookie =
      "profile_onboarded=; path=/; max-age=0; samesite=lax";
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4 lg:justify-center">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight"
              onClick={() => setSidebarOpen(false)}
            >
              What We Will
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="size-5 shrink-0" />
                {item.label}
                {item.href === "/messages" && (
                  <UnreadBadge
                    initialCount={user.unreadCount}
                    userId={user.id}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                displayName={user.displayName}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <Separator className="my-3" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="ml-2 font-semibold">What We Will</span>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
