"use client";

import { useState } from "react";
import { completeOnboarding } from "./actions";
import { updateAvatarUrl } from "@/app/(app)/profile/actions";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { TimezoneCombobox } from "@/components/shared/TimezoneCombobox";
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
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Safety: if the server never responds (e.g. prod timeout), unlock the button
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError(
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
        timezone,
      });

      clearTimeout(timeoutId);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Full-page redirect so the next response sets the onboarded cookie and
      // session is consistent (avoids stuck state when the action response is lost in prod).
      window.location.href = "/pending-approval";
      return;
    } catch {
      clearTimeout(timeoutId);
      setError("An unexpected error occurred. Please try again.");
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
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">
              LinkedIn URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Required to verify your background as a tech worker
            </p>
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
