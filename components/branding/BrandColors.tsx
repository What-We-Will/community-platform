'use client';

import { useState } from "react";

type BrandColor = {
  name: string;
  hex: string;
};

type TierProps = {
  label: string;
  description: string;
  colors: BrandColor[];
};

function ColorTier({ label, description, colors }: TierProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => {
        setCopiedHex((current) => (current === hex ? null : current));
      }, 1500);
    } catch {
      // Silent failure if clipboard is unavailable
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        {colors.map((color) => {
          const isCopied = copiedHex === color.hex;

          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => handleCopy(color.hex)}
              className="group flex flex-col items-center gap-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={`Copy ${label.toLowerCase()} color ${color.hex}`}
              title={`Click to copy ${color.hex}`}
            >
              <div
                className="shrink-0 transition-transform group-active:scale-95"
                style={{
                  width: 64,
                  height: 64,
                  minWidth: 64,
                  minHeight: 64,
                  backgroundColor: color.hex,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                }}
              />
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {color.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {color.hex}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isCopied ? "Copied!" : "Click to copy"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BrandColors() {
  return (
    <div className="space-y-6">
      <ColorTier
        label="Primary"
        description="The core brand color for key actions, highlights, and emphasis."
        colors={[
          {
            name: "Brand Orange",
            hex: "#B85C3D",
          },
        ]}
      />

      <ColorTier
        label="Secondary"
        description="Supporting tones that pair with the primary for depth and variety."
        colors={[
          {
            name: "Earthy Green",
            hex: "#8B9B7E",
          },
          {
            name: "Accent Gold",
            hex: "#E8B260",
          },
        ]}
      />

      <ColorTier
        label="Tertiary"
        description="Deeper accent color used for additional color variation."
        colors={[
          {
            name: "Deep Blue",
            hex: "#364958",
          },
        ]}
      />
    </div>
  );
}

