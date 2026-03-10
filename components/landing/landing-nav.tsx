"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav({ user }: { user?: User | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white">
      <div className="mx-auto flex h-14 max-w-full items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary-orange"
        >
          <Image
            src="/images/logo-mark.svg"
            alt="What We Will logo"
            width={40}
            height={40}
            priority
          />
          <span className="font-bebas text-2xl md:text-3xl uppercase tracking-tight">
            What We Will
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop nav links */}
          <nav className="hidden items-center gap-8 md:flex md:order-1">
            <Link
              href="/about"
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
              <div className="invisible absolute left-0 top-full mt-1 w-44 rounded-md border border-border/60 bg-white py-1 shadow-md opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <a
                  href="https://kaizengrowth.github.io/masscall/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-orange/5 hover:text-primary-orange"
                >
                  Mass Call
                </a>
              </div>
            </div>

            <Link
              href="/#our-future"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
            >
              Our Future
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="order-1 inline-flex items-center justify-center rounded-md border border-border/40 p-2 text-foreground transition-colors hover:bg-primary-orange/5 hover:text-primary-orange md:hidden"
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

          {/* Auth button */}
          {user ? (
            <Button
              variant="outline"
              size="sm"
              className="order-2 rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange md:order-2"
              asChild
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="order-2 rounded-md border-primary-orange/50 bg-white text-primary-orange hover:bg-primary-orange/5 hover:text-primary-orange md:order-2"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border/40 bg-white px-4 md:hidden">
          <nav className="ml-auto flex w-44 flex-col gap-2 py-3 text-right">
            <Link
              href="/about"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
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
            )}

            <Link
              href="/#our-future"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary-orange"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Future
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
