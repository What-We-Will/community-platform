"use client";

import { useRef, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Paperclip } from "lucide-react";
import { FileAttachmentPreview } from "./FileAttachmentPreview";

const ATTACHMENT_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,.doc,.docx,text/plain";
const ATTACHMENT_MAX_MB = 25;

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, file?: File) => void;
  disabled?: boolean;
  /** Optional controlled attachment (e.g. from drag-drop in parent) */
  attachment?: File | null;
  onAttachmentChange?: (file: File | null) => void;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  attachment: controlledAttachment,
  onAttachmentChange,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalAttachment, setInternalAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const attachment = controlledAttachment ?? internalAttachment;
  const setAttachment = onAttachmentChange ?? setInternalAttachment;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 104)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const canSend = (value.trim() || attachment) && !disabled;
      if (canSend) onSend(value.trim(), attachment ?? undefined);
    }
  }

  function handleSendClick() {
    if (!value.trim() && !attachment) return;
    if (disabled) return;
    onSend(value.trim(), attachment ?? undefined);
    setAttachment(null);
    setAttachmentError(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAttachmentError(null);
    if (file.size > ATTACHMENT_MAX_MB * 1024 * 1024) {
      setAttachmentError(`File must be under ${ATTACHMENT_MAX_MB} MB`);
      return;
    }
    setAttachment(file);
  }

  return (
    <div className="sticky bottom-0 z-30 border-t bg-background px-4 py-3">
      {attachment && (
        <div className="mb-2">
          <FileAttachmentPreview
            file={attachment}
            onRemove={() => {
              setAttachment(null);
              setAttachmentError(null);
            }}
          />
          {attachmentError && (
            <p className="mt-1 text-xs text-destructive">{attachmentError}</p>
          )}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
        >
          <Paperclip className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          className="sr-only"
          onChange={handleFileSelect}
        />
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          className="min-h-10 max-h-26 resize-none text-sm flex-1"
          rows={1}
          disabled={disabled}
        />
        <Button
          size="icon"
          onClick={handleSendClick}
          disabled={disabled || (!value.trim() && !attachment)}
          className="shrink-0"
          aria-label="Send message"
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
