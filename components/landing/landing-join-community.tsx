import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const ACTION_NETWORK_SIGNUP_URL = "https://actionnetwork.org/forms/what-we-will";

export function LandingJoinCommunity() {
  return (
    <section id="impact" className="scroll-mt-20 bg-warm-beige px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="px-6 py-10 md:px-10 md:py-12">
          <h2 className="text-center text-4xl font-bebas">
            Join Our Community
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
            Whether you&apos;ve been laid off, you&apos;re anxious about your
            chosen profession, or you just want to fight for change—you can make
            a difference. Come be part of the solution. Join us in building the
            collective power we need to win.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2">
            <label htmlFor="landing-email" className="sr-only">
              Email address
            </label>
            <Input
              id="landing-email"
              type="email"
              placeholder="Enter your email"
              className="min-h-10 flex-1 bg-white"
              autoComplete="email"
            />
            <Button
              size="lg"
              className="bg-primary-orange px-6 font-semibold text-white hover:bg-primary-orange-hover sm:flex-shrink-0"
              asChild
            >
              <Link
                href={ACTION_NETWORK_SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
