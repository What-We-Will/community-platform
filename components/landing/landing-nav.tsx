import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight text-primary-orange"
        >
          <Image
            src="/images/logo-mark.webp"
            alt="What We Will logo"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          <span>What We Will</span>
        </Link>
        <nav className="flex items-center gap-8">
          <a
            href="#mission"
            className="text-sm font-medium text-foreground hover:text-primary-orange transition-colors"
          >
            Mission
          </a>
          <a
            href="#programs"
            className="text-sm font-medium text-foreground hover:text-primary-orange transition-colors"
          >
            Programs
          </a>
          <a
            href="#our-future"
            className="text-sm font-medium text-foreground hover:text-primary-orange transition-colors"
          >
            Our Future
          </a>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
