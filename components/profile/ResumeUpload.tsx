"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadPrivateFile, validateFile } from "@/lib/storage";
import { cn } from "@/lib/utils";

const RESUME_LIMIT_MB = 10;
const RESUME_TYPES = ["application/pdf"];

interface ResumeUploadProps {
  userId: string;
  resumePath: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  onUploadComplete: (path: string) => void;
  onViewClick: () => void;
  className?: string;
}

export function ResumeUpload({
  userId,
  resumePath,
  fileName,
  fileSize,
  onUploadComplete,
  onViewClick,
  className,
}: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const err = validateFile(file, { maxSizeMB: RESUME_LIMIT_MB, allowedTypes: RESUME_TYPES });
    if (err) {
      setError(err);
      return;
    }

    setUploading(true);
    setProgress(10);
    const path = `${userId}/resume.pdf`;

    const result = await uploadPrivateFile("resumes", path, file);
    setProgress(100);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onUploadComplete(result.path);
  }

  const hasResume = Boolean(resumePath);

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium flex items-center gap-2">
        <FileText className="size-4" />
        Resume
      </h3>
      {!hasResume && !uploading && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 text-center hover:border-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Upload your resume (PDF, max {RESUME_LIMIT_MB} MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={handleFile}
          />
        </div>
      )}
      {uploading && (
        <div className="space-y-2 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">Uploading…</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      {hasResume && !uploading && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-sm truncate">{fileName ?? "resume.pdf"}</span>
            {fileSize != null && (
              <span className="text-xs text-muted-foreground shrink-0">
                ({(fileSize / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onViewClick}>
              View
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={handleFile}
          />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
