"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/utils/get-site-url";

const DONATE_URL =
  "https://secure.givelively.org/donate/equity-tech-collective/what-we-will";

// Server-safe initial value — must match what getSiteUrl() returns on the server
// so the first client render is identical to the SSR HTML (avoids hydration mismatch).
const SERVER_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://members.wwwrise.org";

export function LandingNav({ user }: { user?: User | null }) {
  const [siteUrl, setSiteUrl] = useState(SERVER_SITE_URL);

  // After hydration, update to the actual client origin (handles dev + preview URLs)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSiteUrl(getSiteUrl());
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex items-center text-primary-orange"
        >
          <Image
            src="/images/branding/WWW-logo-horizontal.svg"
            alt="What We Will logo"
            width={180}
            height={36}
            className="h-8 w-auto md:h-9"
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/about-us"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
            >
              About Us
            </Link>

            {/* Our Programs dropdown */}
            <div className="group relative">
              <Link
                href="/#programs"
                className="flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              >
                Our Programs
                <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180" />
              </Link>
              {/* Dropdown panel */}
              <div className="invisible absolute left-0 top-full mt-1 w-56 rounded-md border border-border/60 bg-white py-1 shadow-md opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <a
                  href="https://kaizengrowth.github.io/masscall/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-orange/5 hover:text-primary-orange"
                >
                  Mass Call
                </a>
                <Link
                  href="/programs/no-robo-bosses"
                  className="block px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-orange/5 hover:text-primary-orange"
                >
                  No Robo Bosses
                </Link>
              </div>
            </div>

            <Link
              href="/our-platform"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
            >
              Our Platform
            </Link>

            <Link
              href="/news"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
            >
              News
            </Link>

          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Button
              size="sm"
              className="rounded-md bg-primary-orange text-white hover:bg-primary-orange-hover"
              asChild
            >
              <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
                Donate
              </a>
            </Button>

            {/* Auth button */}
            {user ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange"
                asChild
              >
                <Link href={`${siteUrl}/dashboard`}>Dashboard</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange"
                asChild
              >
                <Link href={`${siteUrl}/login`}>Login</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              size="sm"
              className="rounded-md bg-primary-orange text-white hover:bg-primary-orange-hover"
              asChild
            >
              <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
                Donate
              </a>
            </Button>

            {user ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange"
                asChild
              >
                <Link href={`${siteUrl}/dashboard`}>Dashboard</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange"
                asChild
              >
                <Link href={`${siteUrl}/login`}>Login</Link>
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border/40 p-2 text-foreground transition-colors hover:bg-primary-orange/5 hover:text-primary-orange"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="flex h-5 w-5 flex-col justify-between">
                <span className="h-0.5 w-full bg-current" />
                <span className="h-0.5 w-full bg-current" />
                <span className="h-0.5 w-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border/40 bg-white px-4 md:hidden">
          <nav className="ml-auto flex w-44 flex-col gap-2 py-3 text-right">
            <Link
              href="/about-us"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </Link>

            {/* Our Programs with collapsible submenu */}
            <button
              type="button"
              className="flex items-center justify-end gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              onClick={() => setIsProgramsOpen((o) => !o)}
            >
              Our Programs
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${isProgramsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isProgramsOpen && (
              <>
                <a
                  href="https://kaizengrowth.github.io/masscall/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-orange/80 transition-colors hover:text-primary-orange"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProgramsOpen(false);
                  }}
                >
                  └ Mass Call
                </a>
                <Link
                  href="/programs/no-robo-bosses"
                  className="text-sm font-medium text-primary-orange/80 transition-colors hover:text-primary-orange"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProgramsOpen(false);
                  }}
                >
                  └ No Robo Bosses
                </Link>
              </>
            )}

            <Link
              href="/our-platform"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Platform
            </Link>

            <Link
              href="/news"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              News
            </Link>

          </nav>
        </div>
      )}
    </header>
  );
}
