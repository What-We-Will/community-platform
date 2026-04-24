"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileAttachmentPreviewProps {
  file: File;
  onRemove: () => void;
  uploadProgress?: number;
  className?: string;
}

export function FileAttachmentPreview({
  file,
  onRemove,
  uploadProgress,
  className,
}: FileAttachmentPreviewProps) {
  const isImage = file.type.startsWith("image/");

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2",
        className
      )}
    >
      {isImage ? (
        <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={URL.createObjectURL(file)}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded bg-muted">
          <FileText className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
        {uploadProgress != null && uploadProgress < 100 && (
          <Progress value={uploadProgress} className="mt-1 h-1.5" />
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={onRemove}
        aria-label="Remove attachment"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
