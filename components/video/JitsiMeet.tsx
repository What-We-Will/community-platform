"use client";

import { useEffect, useRef, useState } from "react";

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

interface JitsiApi {
  addEventListener: (event: string, cb: () => void) => void;
  dispose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;
        userInfo: { displayName: string };
        configOverwrite: Record<string, unknown>;
        interfaceConfigOverwrite: Record<string, unknown>;
      }
    ) => JitsiApi;
  }
}

export default function JitsiMeet({
  roomName,
  displayName,
  onClose,
}: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => {
      if (!containerRef.current || typeof window.JitsiMeetExternalAPI !== "function")
        return;

      const api = new window.JitsiMeetExternalAPI!("meet.jit.si", {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: true,
          toolbarButtons: [
            "microphone",
            "camera",
            "desktop",
            "chat",
            "raisehand",
            "tileview",
            "hangup",
            "fullscreen",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        },
      });

      api.addEventListener("videoConferenceLeft", () => {
        onClose();
      });

      api.addEventListener("videoConferenceJoined", () => {
        setLoading(false);
      });

      apiRef.current = api;
    };

    document.body.appendChild(script);

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading video call...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
