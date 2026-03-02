"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCallModal } from "./VideoCallModal";
import { startQuickCall } from "@/app/(app)/members/[userId]/actions";

interface QuickCallButtonProps {
  targetUserId: string;
  currentUserDisplayName: string;
}

export function QuickCallButton({
  targetUserId,
  currentUserDisplayName,
}: QuickCallButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startQuickCall(targetUserId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.roomName) {
      setRoomName(result.roomName);
      setModalOpen(true);
    }
  }

  function handleClose() {
    setModalOpen(false);
    setRoomName(null);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Video className="size-4" />
        )}
        Quick Video Call
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      {roomName && (
        <VideoCallModal
          roomName={roomName}
          displayName={currentUserDisplayName}
          title="Quick video call"
          isOpen={modalOpen}
          onClose={handleClose}
        />
      )}
    </>
  );
}
