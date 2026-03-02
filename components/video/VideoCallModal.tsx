"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";
import JitsiMeet from "./JitsiMeet";

interface VideoCallModalProps {
  roomName: string;
  displayName: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoCallModal({
  roomName,
  displayName,
  title,
  isOpen,
  onClose,
}: VideoCallModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-2 shrink-0 bg-background">
        <p className="text-sm font-medium truncate">{title}</p>
        <Button
          variant="destructive"
          size="sm"
          onClick={onClose}
          className="gap-1.5 shrink-0"
        >
          <PhoneOff className="size-4" />
          Leave Call
        </Button>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <JitsiMeet
          roomName={roomName}
          displayName={displayName}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
