"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updateAvatarUrl, updateResumePath, getResumeSignedUrl, deleteResume } from "./actions";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TimezoneCombobox } from "@/components/shared/TimezoneCombobox";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_TOO_LONG_ERROR,
  displayNameLength,
} from "@/lib/utils/display-name";
import { HTTPS_URL_ERROR, validateHttpsUrl } from "@/lib/utils/url";
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
  const errorRef = useRef<HTMLDivElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const linkedinRef = useRef<HTMLInputElement>(null);
  const githubRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  // Bumped on every rejection so repeating one still re-runs the effect below:
  // React collapses a null-then-same-string update into no render at all.
  const [errorSeq, setErrorSeq] = useState(0);

  function reportError(message: string) {
    setError(message);
    setErrorSeq((seq) => seq + 1);
  }

  // Field-level rejections reuse the browser's own constraint validation, so an
  // app rule gets the identical treatment a malformed URL already gets: the
  // bubble anchored to the input, scrolled to and focused by the user agent.
  // The message still goes to the banner, which is what assistive tech reads —
  // validation bubbles are not reliably announced and dismiss on interaction.
  function reportFieldError(
    message: string,
    field: React.RefObject<HTMLInputElement | null>
  ) {
    setError(message);
    setLoading(false);
    field.current?.setCustomValidity(message);
    field.current?.reportValidity();
  }

  // A custom validity that outlives its cause would block every later submit
  // before our handler ever runs, so all of them are cleared on each attempt
  // and on any edit.
  function clearFieldValidity() {
    displayNameRef.current?.setCustomValidity("");
    linkedinRef.current?.setCustomValidity("");
    githubRef.current?.setCustomValidity("");
    portfolioRef.current?.setCustomValidity("");
  }

  // The banner renders above a form tall enough that the submit button is
  // offscreen from it, so without moving the viewport and the focus ring a
  // rejected submit looks like the button did nothing at all. Keyed on the
  // counter alone: a field-level rejection sets the banner text too, and must
  // keep the focus the browser just put on the offending input.
  useEffect(() => {
    if (!errorSeq) return;
    errorRef.current?.scrollIntoView({ block: "center" });
    errorRef.current?.focus();
  }, [errorSeq]);

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
    clearFieldValidity();
    setLoading(true);

    // Counted the way the server and the CHECK constraint count, so the form is
    // never stricter than they are. The native maxLength attribute cannot do
    // this: it measures UTF-16 code units, which would cap an astral-plane name
    // (emoji, CJK Extension B) at half the real limit.
    if (displayNameLength(displayName.trim()) > DISPLAY_NAME_MAX_LENGTH) {
      reportFieldError(DISPLAY_NAME_TOO_LONG_ERROR, displayNameRef);
      return;
    }

    // Checked here as well as on the server so the rejection can point at the
    // field that caused it. type="url" only rules out unparseable values, not
    // an http: or javascript: one, and the server reports only the first of the
    // three — leaving a second bad link to surface as an identical message.
    const schemeRejection = (
      [
        [linkedinUrl, linkedinRef],
        [githubUrl, githubRef],
        [portfolioUrl, portfolioRef],
      ] as const
    ).find(([value]) => validateHttpsUrl(value.trim() || null));
    if (schemeRejection) {
      reportFieldError(HTTPS_URL_ERROR, schemeRejection[1]);
      return;
    }

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
        reportError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      reportError("An unexpected error occurred. Please try again.");
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
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
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
                if (res.error) reportError(res.error);
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
              ref={displayNameRef}
              value={displayName}
              onChange={(e) => {
                clearFieldValidity();
                setDisplayName(e.target.value);
              }}
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
              ref={linkedinRef}
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => {
                clearFieldValidity();
                setLinkedinUrl(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              ref={githubRef}
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => {
                clearFieldValidity();
                setGithubUrl(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio URL</Label>
            <Input
              id="portfolio_url"
              ref={portfolioRef}
              type="url"
              placeholder="https://yourportfolio.com"
              value={portfolioUrl}
              onChange={(e) => {
                clearFieldValidity();
                setPortfolioUrl(e.target.value);
              }}
            />
          </div>
          <ResumeUpload
            userId={profile.id}
            resumePath={profile.resume_path ?? null}
            onUploadComplete={async (path) => {
              const res = await updateResumePath(path);
              if (res.error) reportError(res.error);
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
            onDeleteClick={async () => {
              const res = await deleteResume();
              if (!res.error) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                router.refresh();
              }
              return res;
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
