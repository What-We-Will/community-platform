import { ShieldCheck } from "lucide-react";

export function SurveyTrustSection() {
  return (
    <div className="rounded-lg border bg-muted/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="size-5 text-green-600 dark:text-green-400" />
        <h2 className="text-base font-semibold">How We Protect Your Data</h2>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-green-600">✓</span>
          <span>No account or login required.</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-green-600">✓</span>
          <span>
            Your survey answers are stored separately from your contact information. Anyone
            with access to our stored data cannot connect your answers to your identity. If
            you have a platform account, submit from a private window.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-green-600">✓</span>
          <span>
            Contact info is encrypted — unreadable even if our database were breached.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-green-600">✓</span>
          <span>
            Your willingness response and contact info are stored together so we can reach
            the right people. Your survey answers are stored in a separate table with no
            connection to your contact.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-green-600">✓</span>
          <span>No IP addresses, cookies, or browser fingerprints stored.</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-green-600">✓</span>
          <span>
            Hosted on our own infrastructure — no third-party form tools, no data shared with
            Google, Typeform, or anyone else.
          </span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted-foreground/80">
        <strong>Honesty note:</strong> Very specific details about your team or situation may
        be recognizable to someone with insider knowledge. Share only what you&apos;re
        comfortable with.
      </p>
    </div>
  );
}
