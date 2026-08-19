"use client";

import { useEffect, useRef, useState } from "react";
import { completeOnboarding } from "./actions";
import { updateAvatarUrl } from "@/app/(app)/profile/actions";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { TimezoneCombobox } from "@/components/shared/TimezoneCombobox";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_TOO_LONG_ERROR,
  displayNameLength,
} from "@/lib/utils/display-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


interface OnboardingFormProps {
  initialData: {
    display_name: string;
    headline: string;
    location: string;
    bio: string;
    skills: string[];
    open_to_referrals: boolean;
    linkedin_url: string;
    github_url: string;
    portfolio_url: string;
  };
  userId: string;
}

export default function OnboardingForm({
  initialData,
  userId,
}: OnboardingFormProps) {
  const [displayName, setDisplayName] = useState(initialData.display_name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [headline, setHeadline] = useState(initialData.headline);
  const [location, setLocation] = useState(initialData.location);
  const [bio, setBio] = useState(initialData.bio);
  const [skillsInput, setSkillsInput] = useState(
    initialData.skills?.join(", ") ?? ""
  );
  const [openToReferrals, setOpenToReferrals] = useState(
    initialData.open_to_referrals
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    initialData.linkedin_url ?? ""
  );
  const [githubUrl, setGithubUrl] = useState(initialData.github_url ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(
    initialData.portfolio_url ?? ""
  );
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  // Bumped on every rejection so repeating one still re-runs the effect below:
  // React collapses a null-then-same-string update into no render at all.
  const [errorSeq, setErrorSeq] = useState(0);

  function reportError(message: string) {
    setError(message);
    setErrorSeq((seq) => seq + 1);
  }

  // The banner renders above a form tall enough that the submit button is
  // offscreen from it, so without moving the viewport and the focus ring a
  // rejected submit looks like the button did nothing at all.
  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ block: "center" });
    errorRef.current?.focus();
  }, [error, errorSeq]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Counted the way the server and the CHECK constraint count, so the form is
    // never stricter than they are. The native maxLength attribute cannot do
    // this: it measures UTF-16 code units, which would cap an astral-plane name
    // (emoji, CJK Extension B) at half the real limit.
    if (displayNameLength(displayName.trim()) > DISPLAY_NAME_MAX_LENGTH) {
      reportError(DISPLAY_NAME_TOO_LONG_ERROR);
      setLoading(false);
      return;
    }

    if (!linkedinUrl.trim() && !githubUrl.trim() && !portfolioUrl.trim()) {
      reportError("Provide at least one link so we can verify your background.");
      setLoading(false);
      return;
    }

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Safety: if the server never responds (e.g. prod timeout), unlock the button
    const timeoutId = setTimeout(() => {
      setLoading(false);
      reportError(
        "Request is taking longer than usual. If you already see yourself in Members, your profile was saved — try opening Dashboard."
      );
    }, 15000);

    try {
      const result = await completeOnboarding({
        display_name: displayName,
        avatar_url: avatarUrl || null,
        headline: headline || null,
        location: location || null,
        bio: bio || null,
        skills,
        open_to_referrals: openToReferrals,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        portfolio_url: portfolioUrl || null,
        timezone,
      });

      clearTimeout(timeoutId);

      if (result.error) {
        reportError(result.error);
        return;
      }

      // Full-page redirect so the next response sets the onboarded cookie and
      // session is consistent (avoids stuck state when the action response is lost in prod).
      window.location.href = "/pending-approval";
      return;
    } catch {
      clearTimeout(timeoutId);
      reportError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Profile setup</CardTitle>
          <CardDescription>
            This information will be visible to other community members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">Optional: add a profile photo</p>
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={avatarUrl}
              displayName={displayName || "You"}
              onUploadComplete={(url) => {
                setAvatarUrl(url);
                updateAvatarUrl(url);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="e.g. Senior Frontend Engineer"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Tulsa, OK"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <TimezoneCombobox value={timezone} onChange={setTimezone} />
            <p className="text-xs text-muted-foreground">
              Detected from your browser. Change if needed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell the community about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              placeholder="e.g. React, TypeScript, Node.js"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="open_to_referrals"
              checked={openToReferrals}
              onCheckedChange={(checked) =>
                setOpenToReferrals(checked === true)
              }
            />
            <Label
              htmlFor="open_to_referrals"
              className="cursor-pointer text-sm font-normal"
            >
              Open to Mock Interviews
            </Label>
          </div>
          <div className="space-y-3 rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Verification link</p>
              <p className="text-xs text-muted-foreground">
                Provide at least one so we can verify your background as a
                tech worker
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Website URL</Label>
              <Input
                id="portfolio_url"
                type="url"
                placeholder="https://yourportfolio.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Complete Profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
