"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createGroupAction } from "@/app/(app)/groups/actions";

export function CreateGroupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createGroupAction({
      name: name.trim(),
      description: description.trim() || null,
      isPrivate,
      isDiscoverable: isPrivate ? isDiscoverable : true,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.slug) {
      setOpen(false);
      setName("");
      setDescription("");
      setIsPrivate(false);
      setIsDiscoverable(true);
      router.push(`/groups/${result.slug}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Create Group
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">
              Group name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder="e.g. Frontend Engineers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {name.length}/50
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/300
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="group-private" className="text-sm font-medium cursor-pointer">
                Private group
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPrivate
                  ? "Members must be invited or approved to join"
                  : "Anyone in the community can find and join"}
              </p>
            </div>
            <Switch
              id="group-private"
              checked={isPrivate}
              onCheckedChange={(v) => {
                setIsPrivate(v);
                if (!v) setIsDiscoverable(true);
              }}
              disabled={loading}
            />
          </div>

          {isPrivate && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="group-discoverable" className="text-sm font-medium cursor-pointer">
                  Discoverable
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isDiscoverable
                    ? "Appears in the groups directory — people can request to join"
                    : "Hidden from the directory — invite-only access"}
                </p>
              </div>
              <Switch
                id="group-discoverable"
                checked={isDiscoverable}
                onCheckedChange={setIsDiscoverable}
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
