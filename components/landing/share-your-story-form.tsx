"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { submitShareYourStory } from "@/lib/actions/share-your-story";
import { cn } from "@/lib/utils";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function ShareYourStoryForm() {
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [story, setStory] = useState("");
  const [errors, setErrors] = useState<{
    anonymous?: boolean;
    email?: boolean;
    zip?: boolean;
    story?: boolean;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate() {
    const next: typeof errors = {};
    if (!anonymous) next.anonymous = true;
    const em = email.trim();
    if (!em || !emailOk(em)) next.email = true;
    if (!zip.trim()) next.zip = true;
    if (!story.trim()) next.story = true;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted || submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitShareYourStory({
        name,
        anonymous,
        email: email.trim(),
        zip: zip.trim(),
        story: story.trim(),
      });

      if (result.ok) {
        setSubmitted(true);
        return;
      }

      if (result.error === "rate_limited") {
        setSubmitError(
          "Too many submissions from this connection. Please try again later."
        );
        return;
      }

      if (result.error === "validation_failed") {
        setSubmitError("Please check your entries and try again.");
        return;
      }

      setSubmitError(
        "We could not submit your story. Please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-muted/40 px-4 py-4 text-sm text-foreground sm:px-5 sm:py-5"
      >
        Thank you — your story has been submitted!
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="story-name" className="text-muted-foreground">
          Your preferred name
        </Label>
        <Input
          id="story-name"
          name="preferredName"
          type="text"
          placeholder="Optional"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted-foreground">
          Keep story anonymous?{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </legend>
        <RadioGroup
          value={anonymous}
          onValueChange={setAnonymous}
          className="flex flex-row flex-wrap gap-6"
          aria-invalid={errors.anonymous ?? undefined}
          aria-describedby={errors.anonymous ? "err-anon" : undefined}
        >
          <RadioGroupItem value="Yes">Yes</RadioGroupItem>
          <RadioGroupItem value="No">No</RadioGroupItem>
        </RadioGroup>
        {errors.anonymous ? (
          <p id="err-anon" className="text-xs text-destructive" role="alert">
            Please select an option.
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="story-email" className="text-muted-foreground">
          Email address{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>{" "}
          <span className="font-normal text-muted-foreground">
            (for follow-up only, not published)
          </span>
        </Label>
        <Input
          id="story-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-invalid={errors.email ?? undefined}
          aria-describedby={errors.email ? "err-email" : undefined}
          className={cn(errors.email && "border-destructive")}
        />
        {errors.email ? (
          <p id="err-email" className="text-xs text-destructive" role="alert">
            Please enter a valid email.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-zip" className="text-muted-foreground">
          Zip code{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="story-zip"
          name="zip"
          type="text"
          placeholder="e.g. 94110"
          maxLength={10}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          autoComplete="postal-code"
          aria-invalid={errors.zip ?? undefined}
          aria-describedby={errors.zip ? "err-zip" : undefined}
          className={cn(errors.zip && "border-destructive")}
        />
        {errors.zip ? (
          <p id="err-zip" className="text-xs text-destructive" role="alert">
            Please enter your zip code.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-body" className="text-muted-foreground">
          Share your story{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Textarea
          id="story-body"
          name="story"
          placeholder="Monitoring, AI productivity pressure, or automated decisions about pay, promotion, or termination—share what feels relevant."
          rows={6}
          className={cn("min-h-[120px]", errors.story && "border-destructive")}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          aria-invalid={errors.story ?? undefined}
          aria-describedby={errors.story ? "err-story" : undefined}
        />
        {errors.story ? (
          <p id="err-story" className="text-xs text-destructive" role="alert">
            Please share your story.
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-primary-orange text-white hover:bg-primary-orange-hover"
      >
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
