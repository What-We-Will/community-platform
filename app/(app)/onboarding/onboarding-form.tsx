"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialData.display_name);
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

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          headline: headline || null,
          location: location || null,
          bio: bio || null,
          skills,
          open_to_referrals: openToReferrals,
          linkedin_url: linkedinUrl || null,
          is_onboarded: true,
        })
        .eq("id", userId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
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
              Open to referrals
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
