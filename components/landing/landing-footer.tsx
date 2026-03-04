import Link from "next/link";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 flex-row">
        <span className="text-sm text-muted-foreground">
          © {year} What We Will
        </span>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            href="/login"
            className="hover:text-foreground transition-colors"
          >
            Log in
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
