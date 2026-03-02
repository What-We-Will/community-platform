"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LandingJoinCommunity() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      setEmail("");
      setMessage("Thanks! Check your inbox for a confirmation.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <section id="impact" className="scroll-mt-20 bg-warm-beige px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="px-6 py-10 md:px-10 md:py-12">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Join Our Community
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
            Whether you&apos;ve been laid off, you&apos;re anxious about your
            chosen profession, or you just want to fight for change—you can make
            a difference. Come be part of the solution. Join us in building the
            collective power we need to win.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2"
          >
            <label htmlFor="landing-email" className="sr-only">
              Email address
            </label>
            <Input
              id="landing-email"
              type="email"
              placeholder="Enter your email"
              className="min-h-10 flex-1 bg-white"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              aria-invalid={status === "error"}
              aria-describedby={message ? "landing-email-message" : undefined}
            />
            <Button
              type="submit"
              size="lg"
              className="bg-primary-orange px-6 font-semibold text-white hover:bg-primary-orange-hover sm:flex-shrink-0"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Signing up…" : "Sign Up"}
            </Button>
          </form>
          {message && (
            <p
              id="landing-email-message"
              role="alert"
              className={`mt-3 text-center text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
