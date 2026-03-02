"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LandingJoinCommunity() {
  return (
    <section className="bg-muted/30 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border bg-card px-6 py-10 shadow-sm md:px-10 md:py-12">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Join Our Community
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
            Whether you&apos;ve been laid off, are considering a career change,
            or want to fight for a better future of work—join us in building the
            collective power we need to win.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2"
          >
            <label htmlFor="landing-email" className="sr-only">
              Email address
            </label>
            <Input
              id="landing-email"
              type="email"
              placeholder="Enter your email"
              className="min-h-10 flex-1"
              autoComplete="email"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-primary-orange px-6 font-semibold text-white hover:bg-primary-orange-hover sm:flex-shrink-0"
            >
              Sign Up
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
