"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";
import { uploadPublicFile, validateFile } from "@/lib/storage";

const AVATAR_LIMIT_MB = 10;
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;
      const maxSize = 1024;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
            const compressedFile = new File([blob], newFileName, { type: "image/jpeg" });
            resolve(compressedFile);
          } else {
            reject(new Error("Compression failed"));
          }
        },
        "image/jpeg",
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string;
  onUploadComplete: (url: string) => void;
  className?: string;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  displayName,
  onUploadComplete,
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = getInitials(displayName);
  const colorClass = getAvatarColor(displayName);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const err = validateFile(file, { maxSizeMB: AVATAR_LIMIT_MB, allowedTypes: AVATAR_TYPES });
    if (err) {
      setError(err);
      return;
    }

    setUploading(true);
    let uploadFile = file;
    let ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    try {
      const compressed = await compressImage(file);
      uploadFile = compressed;
      ext = "jpg";
    } catch {
      // Fall back to original file
    }
    const path = `${userId}/avatar.${ext}`;

    const result = await uploadPublicFile("avatars", path, uploadFile);

    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.publicUrl) {
      onUploadComplete(result.publicUrl);
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative inline-block rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div
          className={cn(
            "flex size-24 items-center justify-center rounded-full overflow-hidden text-white font-semibold",
            colorClass
          )}
        >
          {currentAvatarUrl && !uploading ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentAvatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-2xl">{initials}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <span className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted-foreground/80 text-background">
          <Camera className="size-4" />
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={handleFile}
        />
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
