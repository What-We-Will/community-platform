"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updateAvatarUrl, updateResumePath, getResumeSignedUrl } from "./actions";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TimezoneCombobox } from "@/components/shared/TimezoneCombobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Profile } from "@/lib/types";

interface ProfileFormProps {
  profile: Profile;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [skillsInput, setSkillsInput] = useState(
    profile.skills?.join(", ") ?? ""
  );
  const [openToReferrals, setOpenToReferrals] = useState(
    profile.open_to_referrals ?? false
  );
  const [timezone, setTimezone] = useState(
    profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    profile.linkedin_url ?? ""
  );
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(
    profile.portfolio_url ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayName(profile.display_name);
    setHeadline(profile.headline ?? "");
    setLocation(profile.location ?? "");
    setBio(profile.bio ?? "");
    setSkillsInput(profile.skills?.join(", ") ?? "");
    setOpenToReferrals(profile.open_to_referrals ?? false);
    setTimezone(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    setLinkedinUrl(profile.linkedin_url ?? "");
    setGithubUrl(profile.github_url ?? "");
    setPortfolioUrl(profile.portfolio_url ?? "");
  }, [profile]);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const result = await updateProfile({
        display_name: displayName,
        headline: headline || null,
        location: location || null,
        bio: bio || null,
        skills,
        open_to_referrals: openToReferrals,
        timezone: timezone || null,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        portfolio_url: portfolioUrl || null,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>
            Update your information. Changes are visible to other members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              Profile updated successfully.
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <AvatarUpload
              userId={profile.id}
              currentAvatarUrl={profile.avatar_url ?? null}
              displayName={profile.display_name}
              onUploadComplete={async (url) => {
                const res = await updateAvatarUrl(url);
                if (res.error) setError(res.error);
                else {
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 3000);
                  router.refresh();
                }
              }}
            />
            <div className="flex-1 space-y-4 w-full">
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
            <Label>Timezone</Label>
            <TimezoneCombobox value={timezone} onChange={setTimezone} />
            <p className="text-xs text-muted-foreground">
              Used for displaying event times
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
            <Label htmlFor="portfolio_url">Portfolio URL</Label>
            <Input
              id="portfolio_url"
              type="url"
              placeholder="https://yourportfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <ResumeUpload
            userId={profile.id}
            resumePath={profile.resume_path ?? null}
            onUploadComplete={async (path) => {
              const res = await updateResumePath(path);
              if (res.error) setError(res.error);
              else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                router.refresh();
              }
            }}
            onViewClick={async () => {
              const url = await getResumeSignedUrl();
              if (url) window.open(url, "_blank");
            }}
          />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
