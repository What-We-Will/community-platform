import Link from "next/link";
import { BugReportDialog } from "@/components/shared/BugReportDialog";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
        <span className="text-center text-sm text-muted-foreground sm:text-left">
          © {year} What We Will
        </span>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-6 sm:justify-end">
          <BugReportDialog />
          <Link
            href="/about"
            className="hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/signup"
            className="hover:text-foreground transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
