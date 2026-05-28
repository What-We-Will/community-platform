import Image from "next/image";
import Link from "next/link";
import { BugReportDialog } from "@/components/shared/BugReportDialog";
import { cn } from "@/lib/utils";

type LandingFooterProps = {
  variant?: "default" | "dark";
  className?: string;
};

export function LandingFooter({
  variant = "default",
  className,
}: LandingFooterProps) {
  const isDark = variant === "dark";
  const year = new Date().getFullYear();

  const linkClass = cn(
    "transition-colors",
    isDark
      ? "text-white/80 hover:text-white"
      : "hover:text-foreground",
  );

  return (
    <footer
      className={cn(
        isDark ? "bg-transparent px-0 py-0" : "mt-auto border-t bg-background px-4 py-6 sm:px-6",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6",
          isDark ? "" : "",
        )}
      >
        {isDark ? (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/branding/WWW-logo-mark_white.svg"
              alt="What We Will logo"
              width={28}
              height={28}
              className="size-7"
            />
            <span className="font-bebas text-lg uppercase tracking-wide text-white">
              What We Will
            </span>
          </Link>
        ) : (
          <span className="text-center text-sm text-muted-foreground sm:text-left">
            © {year} What We Will
          </span>
        )}
        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6 sm:justify-end",
            isDark ? "text-white/80" : "text-muted-foreground",
          )}
        >
          <BugReportDialog
            triggerClassName={cn(
              linkClass,
              isDark ? "text-white/80 hover:text-white" : "",
            )}
          />
          <Link href="/about-us" className={linkClass}>
            About
          </Link>
          <Link href="/share-your-story" className={linkClass}>
            Share your story
          </Link>
          <Link href="/signup" className={linkClass}>
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
