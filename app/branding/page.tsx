import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { BrandColors } from "@/components/branding/BrandColors";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Branding | What We Will",
  description: "Logos, colors, and typography for the What We Will brand.",
};

export default async function BrandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav user={user ?? undefined} />

      <main className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {/* Page header */}
          <header className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Brand Guidelines
              </p>
              <h1 className="font-bebas text-4xl tracking-wide text-foreground sm:text-5xl">
                Branding Assets
              </h1>
            </div>
            <div className="space-y-2">
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Our brand is grounded, diverse, and rooted in worker power. It
                honors the people who make technology possible and insists that
                dignity, safety, and collective agency are non‑negotiable.
              </p>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Visually, What We Will bridges past labor movements with the
                present struggle and future prosperity. Our colors, type, and
                symbols draw a line from picket signs and union halls to the
                digital spaces where workers now organize, learn, and build
                power together.
              </p>
            </div>
          </header>

          {/* Our Logo */}
          <section aria-labelledby="our-logo-heading" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h2
                id="our-logo-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Our Logo
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                The primary What We Will logo is available in full-color and
                white versions for use on light and dark backgrounds.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Full logo on white */}
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Full Logo
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      On light background
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Preferred
                  </span>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-white px-6 py-8">
                  <Image
                    src="/images/branding/WWW-logo-full.svg"
                    alt="What We Will full logo"
                    width={320}
                    height={96}
                    className="h-16 w-auto sm:h-20"
                    priority
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-full.svg"
                      download="WWW-logo-full.svg"
                    >
                      Download SVG
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-full.png"
                      download="WWW-logo-full.png"
                    >
                      Download PNG
                    </a>
                  </Button>
                </div>
              </div>

              {/* Full logo on primary orange */}
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Full Logo
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      On primary orange
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Dark usage
                  </span>
                </div>
                <div
                  className="flex items-center justify-center rounded-lg border px-6 py-8 text-white"
                  style={{ backgroundColor: "var(--primary-orange)" }}
                >
                  <Image
                    src="/images/branding/WWW-logo-full_white.svg"
                    alt="What We Will full logo, white"
                    width={320}
                    height={96}
                    className="h-16 w-auto sm:h-20"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-full_white.svg"
                      download="WWW-logo-full_white.svg"
                    >
                      Download SVG
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-full_white.png"
                      download="WWW-logo-full_white.png"
                    >
                      Download PNG
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Logo Mark */}
          <section aria-labelledby="logo-mark-heading" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h2
                id="logo-mark-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Logo Mark
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                The logo mark is ideal for avatars, social icons, and small
                placements where the full wordmark would be hard to read.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Mark on white */}
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Logo Mark
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    On light background
                  </p>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-white px-6 py-8">
                  <Image
                    src="/images/branding/WWW-logo-mark.svg"
                    alt="What We Will logo mark"
                    width={160}
                    height={160}
                    className="h-20 w-auto sm:h-24"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-mark.svg"
                      download="WWW-logo-mark.svg"
                    >
                      Download SVG
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-mark.png"
                      download="WWW-logo-mark.png"
                    >
                      Download PNG
                    </a>
                  </Button>
                </div>
              </div>

              {/* Mark on primary orange */}
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Logo Mark
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    On primary orange
                  </p>
                </div>
                <div
                  className="flex items-center justify-center rounded-lg border px-6 py-8 text-white"
                  style={{ backgroundColor: "var(--primary-orange)" }}
                >
                  <Image
                    src="/images/branding/WWW-logo-mark_white.svg"
                    alt="What We Will logo mark, white"
                    width={160}
                    height={160}
                    className="h-20 w-auto sm:h-24"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-mark_white.svg"
                      download="WWW-logo-mark_white.svg"
                    >
                      Download SVG
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-mark_white.png"
                      download="WWW-logo-mark_white.png"
                    >
                      Download PNG
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Horizontal Logo */}
          <section
            aria-labelledby="horizontal-logo-heading"
            className="space-y-6 mt-4"
          >
            <div className="space-y-2">
              <h2
                id="horizontal-logo-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Horizontal Logo
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Use the horizontal logo in tight horizontal spaces like
                navigation bars, banners, and footers.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Horizontal on white */}
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Horizontal Logo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    On light background
                  </p>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-white px-6 py-8">
                  <Image
                    src="/images/branding/WWW-logo-horizontal.svg"
                    alt="What We Will horizontal logo"
                    width={320}
                    height={96}
                    className="h-12 w-auto sm:h-14"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-horizontal.svg"
                      download="WWW-logo-horizontal.svg"
                    >
                      Download SVG
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-horizontal.png"
                      download="WWW-logo-horizontal.png"
                    >
                      Download PNG
                    </a>
                  </Button>
                </div>
              </div>

              {/* Horizontal on primary orange */}
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Horizontal Logo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    On primary orange
                  </p>
                </div>
                <div
                  className="flex items-center justify-center rounded-lg border px-6 py-8 text-white"
                  style={{ backgroundColor: "var(--primary-orange)" }}
                >
                  <Image
                    src="/images/branding/WWW-logo-horizontal_white.svg"
                    alt="What We Will horizontal logo, white"
                    width={320}
                    height={96}
                    className="h-12 w-auto sm:h-14"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-horizontal_white.svg"
                      download="WWW-logo-horizontal_white.svg"
                    >
                      Download SVG
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="/images/branding/WWW-logo-horizontal_white.png"
                      download="WWW-logo-horizontal_white.png"
                    >
                      Download PNG
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Colors */}
          <section aria-labelledby="colors-heading" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h2
                id="colors-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Colors
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Our palette is organized into primary, secondary, and tertiary
                tiers. Click any swatch to copy its hex value.
              </p>
            </div>

            <BrandColors />
          </section>

          {/* Typography */}
          <section aria-labelledby="typography-heading" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h2
                id="typography-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Typography
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                We pair a bold display typeface with a clean, legible sans-serif
                for body copy.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              {/* Primary typeface */}
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Primary Typeface
                </p>
                <p className="text-sm font-medium text-foreground">
                  Bebas Neue
                </p>
                <p className="text-xs text-muted-foreground">
                  Use for headlines, section titles, and bold display moments.
                </p>
                <div className="mt-2 rounded-lg bg-muted px-4 py-6">
                  <p className="font-bebas text-3xl tracking-[0.08em] text-foreground sm:text-4xl">
                    WHAT WE WILL
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Uppercase, tight tracking, strong presence.
                  </p>
                </div>
              </div>

              {/* Secondary typeface */}
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Secondary Typeface
                </p>
                <p className="text-sm font-medium text-foreground">
                  Montserrat
                </p>
                <p className="text-xs text-muted-foreground">
                  Use for paragraphs, UI labels, and longer-form content.
                  Available weights: Regular (400), Medium (500), Semibold
                  (600), Bold (700).
                </p>
                <div className="mt-2 space-y-4 rounded-lg bg-muted px-4 py-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Regular (400)
                    </p>
                    <p className="text-base font-normal text-foreground">
                      Building worker power in the age of AI.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Medium (500)
                    </p>
                    <p className="text-base font-medium text-foreground">
                      Building worker power in the age of AI.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Semibold (600)
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      Building worker power in the age of AI.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Bold (700)
                    </p>
                    <p className="text-base font-bold text-foreground">
                      Building worker power in the age of AI.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

