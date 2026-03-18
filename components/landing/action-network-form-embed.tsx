"use client";

import { useState, FormEvent } from "react";

function isValidUsZip(zip: string) {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

export function ActionNetworkFormEmbed() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    const trimmedZip = zipCode.trim();
    if (trimmedZip && !isValidUsZip(trimmedZip)) {
      setError("Please enter a valid US ZIP code (e.g., 12345 or 12345-6789).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/action-network/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmed,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          zipCode: trimmedZip || undefined,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setError(
          data.error ??
            "Something went wrong while subscribing. Please try again.",
        );
        return;
      }

      setSuccess(true);
      setEmail("");
      setFirstName("");
      setLastName("");
      setZipCode("");
    } catch (_err) {
      setError(
        "We couldn't reach the server. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="newsletter-first-name" className="sr-only">
            First name (optional)
          </label>
          <input
            id="newsletter-first-name"
            type="text"
            autoComplete="given-name"
            placeholder="First name (optional)"
            className={inputClass}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="newsletter-last-name" className="sr-only">
            Last name (optional)
          </label>
          <input
            id="newsletter-last-name"
            type="text"
            autoComplete="family-name"
            placeholder="Last name (optional)"
            className={inputClass}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
          />
        </div>
        <div className="sm:w-1/2">
          <label htmlFor="newsletter-zip" className="sr-only">
            Zip code (optional)
          </label>
          <input
            id="newsletter-zip"
            type="text"
            autoComplete="postal-code"
            placeholder="Zip (optional)"
            className={inputClass}
            value={zipCode}
            onChange={(e) => {
              setZipCode(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isSubmitting ? "Subscribing…" : "Subscribe"}
        </button>
        <div className="w-full text-sm sm:flex-1">
          {error && <p className="text-destructive">{error}</p>}
          {success && !error && (
            <p className="text-muted-foreground">
              Thanks for signing up! Please check your email for confirmation.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
