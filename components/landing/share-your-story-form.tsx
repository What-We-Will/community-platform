"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitShareYourStory } from "@/lib/actions/share-your-story";
import { cn } from "@/lib/utils";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const WHAT_HAPPENED_OPTIONS = [
  "Layoffs",
  "AI monitoring",
  "Can't find a job",
  "Pushed to use AI",
  "Worried about future automation",
  "Other concerns",
] as const;

export function ShareYourStoryForm() {
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [whatHappened, setWhatHappened] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState("");
  const [interviewWillingness, setInterviewWillingness] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [story, setStory] = useState("");
  const [errors, setErrors] = useState<{
    occupation?: boolean;
    whatHappened?: boolean;
    anonymous?: boolean;
    interviewWillingness?: boolean;
    email?: boolean;
    zip?: boolean;
    story?: boolean;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate() {
    const next: typeof errors = {};
    if (!occupation.trim()) next.occupation = true;
    if (whatHappened.length < 1) next.whatHappened = true;
    if (!anonymous) next.anonymous = true;
    if (!interviewWillingness) next.interviewWillingness = true;
    const em = email.trim();
    if (interviewWillingness === "Yes" && (!em || !emailOk(em))) {
      next.email = true;
    }
    if (!zip.trim()) next.zip = true;
    if (!story.trim()) next.story = true;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function toggleWhatHappened(option: string) {
    setWhatHappened((current) =>
      current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option]
    );
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
        occupation: occupation.trim(),
        whatHappened,
        anonymous,
        interviewWillingness,
        email: interviewWillingness === "Yes" ? email.trim() : "",
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
          Your preferred name{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="story-name"
          name="preferredName"
          type="text"
          placeholder=""
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-occupation" className="text-muted-foreground">
          Occupation{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="story-occupation"
          name="occupation"
          type="text"
          placeholder=""
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          aria-invalid={errors.occupation ?? undefined}
          aria-describedby={errors.occupation ? "err-occupation" : undefined}
          className={cn(errors.occupation && "border-destructive")}
        />
        {errors.occupation ? (
          <p
            id="err-occupation"
            className="text-xs text-destructive"
            role="alert"
          >
            Please enter your occupation.
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted-foreground">
          What happened?{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </legend>
        <div
          className="space-y-2"
          role="group"
          aria-invalid={errors.whatHappened ?? undefined}
          aria-describedby={errors.whatHappened ? "err-what-happened" : undefined}
        >
          {WHAT_HAPPENED_OPTIONS.map((option) => {
            const checked = whatHappened.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleWhatHappened(option)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-foreground">{option}</span>
              </label>
            );
          })}
        </div>
        {errors.whatHappened ? (
          <p
            id="err-what-happened"
            className="text-xs text-destructive"
            role="alert"
          >
            Please select at least one option.
          </p>
        ) : null}
      </fieldset>

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
          placeholder=""
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
          Please share your story! Your voice and experiences matter in our fight
          for change.{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Textarea
          id="story-body"
          name="story"
          placeholder="Tell us what happened, how AI or automation was involved, and how it affected your work, pay, schedule, opportunities, or well-being."
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted-foreground">
          Can we share your story anonymously?{" "}
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted-foreground">
          Would you be willing to share your story in a short recorded interview?{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </legend>
        <RadioGroup
          value={interviewWillingness}
          onValueChange={setInterviewWillingness}
          className="flex flex-row flex-wrap gap-6"
          aria-invalid={errors.interviewWillingness ?? undefined}
          aria-describedby={
            errors.interviewWillingness ? "err-interview-willingness" : undefined
          }
        >
          <RadioGroupItem value="Yes">Yes</RadioGroupItem>
          <RadioGroupItem value="No">No</RadioGroupItem>
        </RadioGroup>
        {errors.interviewWillingness ? (
          <p
            id="err-interview-willingness"
            className="text-xs text-destructive"
            role="alert"
          >
            Please select an option.
          </p>
        ) : null}
      </fieldset>

      {interviewWillingness === "Yes" ? (
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
            placeholder="name@example.com"
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
      ) : null}

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

      <div className="pt-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="link" className="h-auto p-0 text-xs">
              Data and privacy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Data and privacy</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                We use the information you share to understand how AI and
                automation are impacting workers and communities, and to support
                advocacy, organizing, and policy efforts.
              </p>
              <p>
                Your response is submitted through a secure Google Form. If you
                choose to provide contact information, we may use it for follow-up
                about your story.
              </p>
              <p>
                We do not publish personal contact details publicly. If you ask to
                remain anonymous, we will not publicly connect your name to your
                story.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
