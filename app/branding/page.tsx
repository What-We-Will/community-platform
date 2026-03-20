import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { BrandColors } from "@/components/branding/BrandColors";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Branding | What We Will",
  description:
    "Mission, voice, talking points, logos, colors, typography, and iconography for the What We Will brand.",
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
          <section aria-labelledby="heading" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h1
                id="heading"
                className="font-bebas text-4xl tracking-wide text-foreground sm:text-5xl"
              >
                Brand and Messaging Guidelines
              </h1>
            </div>
            <div className="space-y-2">
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Our brand is grounded, diverse, and rooted in worker power. 
                What We Will bridges past labor movements with the
                present struggle and future prosperity. Our colors, type, and
                symbols draw a line from picket signs and union halls to the
                digital spaces where workers now organize, learn, and build
                power together.
              </p>
            </div>
          </section>

          {/* Our story */}
          <section
            aria-labelledby="our-story-heading"
            className="mt-4 space-y-6 border-t border-border pt-12"
          >
            <div className="space-y-2">
              <h2
                id="our-story-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Our Story
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                We started in response to mass layoffs in 2025–2026, as part of
                the{" "}
                <a
                  href="https://techworkerscoalition.org"
                  className="text-primary underline-offset-4 hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Tech Workers Coalition
                </a>
                , a grassroots labor organization with local chapters across the
                U.S. and Europe.
              </p>
            </div>
            <h2 id="mission-heading" className="sr-only">
              Mission statement
            </h2>
            <div className="rounded-xl border bg-card p-6 sm:p-8">
              <p className="font-bebas text-2xl tracking-wide text-foreground sm:text-3xl">
                Our mission is to center humans in the future of work.
              </p>
              <p className="mt-4 text-sm text-muted-foreground sm:text-base">
                What We Will is a worker center organizing people across sectors affected by rapid
                technological change — building collective power through layoff
                crisis support, community building, career upskilling, and
                political action — to win shared prosperity in the age of AI.
              </p>
            </div>
            <div className="space-y-4 rounded-xl border bg-card p-6 text-sm text-muted-foreground sm:p-8 sm:text-base">
              <p>
                What We Will is{" "}
                <span className="font-medium text-foreground">
                  incubating within the Tech Workers Coalition
                </span>
                . We share a broad alignment on solidarity — toward social
                justice, workers&apos; rights, and economic inclusion — while
                our project is{" "}
                <span className="font-medium text-foreground">
                  targeted specifically
                </span>{" "}
                to the impacts of AI, particularly for laid-off and displaced
                workers.
              </p>
              <p>
                We{" "}
                <span className="font-medium text-foreground">
                  operate independently
                </span>{" "}
                of the Tech Workers Coalition steering committee. What we publish
                or organize may not reflect the specific views of every Tech
                Workers Coalition member or chapter.
              </p>
              <p className="border-t border-border pt-4 text-foreground">
                In communications and partnerships, What We Will should{" "}
                <span className="font-medium">not</span> imply endorsement of
                particular positions beyond that shared foundation of
                workers&apos; solidarity. We should speak to what What We
                Will stands for rather than attributing stances to the coalition as a whole.
              </p>
            </div>
            <figure className="rounded-xl border border-l-4 border-l-primary bg-muted/40 p-6">
              <blockquote className="text-base italic text-foreground sm:text-lg">
                &ldquo;Eight hours for work, eight hours for rest, eight hours
                for what we will.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                — Ira Steward, 1863. Our name comes from this labor demand; it
                ties today&apos;s organizing to the full arc of the labor
                movement.
              </figcaption>
            </figure>
          </section>

          {/* Voice */}
          <section aria-labelledby="voice-heading" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h2
                id="voice-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Voice
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Voice stays constant across channels. We sound urgent and
                welcoming at once — movement energy with mutual-aid warmth. We
                name structural crisis without catastrophizing; we reject charity
                framing in favor of solidarity: workers build this together, not
                as clients receiving services.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-semibold text-foreground">
                      We are
                    </th>
                    <th className="p-3 text-left font-semibold text-foreground">
                      We are not
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    {
                      are: "Collective — shared identity and stakes",
                      not: "Top-down — directives from leadership to followers",
                    },
                    {
                      are: "Urgent & energized — momentum of a movement",
                      not: "Alarmist — crisis named clearly, not catastrophized",
                    },
                    {
                      are: "Accessible & welcoming — no experience required",
                      not: "Exclusive or credentialist",
                    },
                    {
                      are: "Pragmatic & action-oriented — concrete next steps",
                      not: "Ideologically abstract without follow-through",
                    },
                    {
                      are: "Transparent & human — honest about what we know",
                      not: "Polished & corporate",
                    },
                    {
                      are: "Empowering — solidarity, not charity",
                      not: "Charitable or service-provider framing",
                    },
                    {
                      are: "Historically grounded — labor movement continuity",
                      not: "Ahistorical or tech-exceptionalist",
                    },
                    {
                      are: "Democratic & participatory — we build together",
                      not: "Representative or hierarchical voice only",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0 align-top"
                    >
                      <td className="p-3">{row.are}</td>
                      <td className="p-3">{row.not}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Talking points */}
          <section
            aria-labelledby="talking-points-heading"
            className="mt-4 space-y-6"
          >
            <div className="space-y-2">
              <h2
                id="talking-points-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Talking Points
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Use these pillars for recruitment, policy, partners, and public
                messaging. Pair vision with specific asks, programs, or next
                steps.
              </p>
            </div>
            <ol className="list-decimal space-y-5 pl-5 text-sm text-muted-foreground sm:pl-6 sm:text-base">
              <li className="pl-2">
                <span className="font-medium text-foreground">
                  Collective power over individual resilience.
                </span>{" "}
                The layoff crisis is structural, not a personal failure. While we offer mutual aid
                that aims to help workers with immediate career support, we believe that structural
                reforms are needed over simply adapting to economic disruption.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">
                  Solidarity, not charity.
                </span>{" "}
                Mutual aid is reciprocal; we build lasting relationships, not
                one-way service delivery. We support and offer resources to impacted workers,
                but we also rely on their insight, participation, and solidarity to strengthen 
                the whole community.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">
                  Shared prosperity in the age of AI.
                </span>{" "}
                Workers should share in the abundance of technological progress, not only bear
                displacement costs. Campaigns and policy goals will be guided by our members
                and participatory action research but our ultimate goal is for people to benefit
                broadly in the wealth of the economy and not be left behind by economic change.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">
                  Historically grounded, future-facing.
                </span>{" "}
                Workers have reimagined work before, we can do it again. What We Will harkens back
                to the transformation of the Industrial Revolution and how workers displaced from agrarian
                and artisan crafts used their collective power to fight for laws like the 40-hour work week,
                Social Security, and minimum wage.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">
                  Multi-sector solidarity.
                </span>{" "}
                Tech struggles connect to gig workers, call centers, journalism,
                and the broader labor movement. What We Will was founded by tech workers
                on the front lines of these technological changes but we welcome anyone aligned with
                us to join our cause and seek to have an impact that benefits workers writ large.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">
                  Pragmatic about technology.
                </span>{" "}
                While we highlight and address the disparate impacts of technological change,
                whether that is economic, humanitarian, or environmental, we do not shame workers for 
                using AI. We recognize that, for many, these tools are essential to staying employed 
                in their fields.
              </li>
            </ol>
          </section>

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

          {/* Iconography */}
          <section
            aria-labelledby="iconography-heading"
            className="mt-4 space-y-6"
          >
            <div className="space-y-2">
              <h2
                id="iconography-heading"
                className="font-bebas text-3xl tracking-wide text-foreground"
              >
                Iconography
              </h2>
              <p className="max-w-full text-sm text-muted-foreground sm:text-base">
                Illustration and campaign art should feel made by people in
                motion—not produced for a pitch deck. Lean into hands,
                multiplicity of color, and the visual language of organizing.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Central motif
                </p>
                <p className="text-sm font-medium text-foreground">Hands</p>
                <p className="text-sm text-muted-foreground">
                  Hands are our central symbol: solidarity, presence, and human
                  stakes in the future of work.{" "}
                  <span className="font-medium text-foreground">
                    Multicolor
                  </span>{" "}
                  treatments signal diversity within unity—many voices, one
                  movement—not a single muted brand wash.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Handmade & movement graphics
                </p>
                <p className="text-sm font-medium text-foreground">
                  Poster, collage & print texture
                </p>
                <p className="text-sm text-muted-foreground">
                  Favor poster-like compositions, collage layering, and
                  screenprint or risograph-style texture and registration.
                  Imagery should carry{" "}
                  <span className="font-medium text-foreground">
                    picket-sign and flyer energy
                  </span>
                  —direct, tactile, a little raw—rather than glossy stock
                  illustration or corporate vector polish.
                </p>
              </div>
            </div>

            <figure className="space-y-3 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 sm:p-6">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border/80 bg-background shadow-sm ring-1 ring-foreground/5">
                <Image
                  src="/images/hero.webp"
                  alt="Campaign-style hero art: multicolor layered hands and movement graphic textures in a poster-like composition"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 1024px"
                />
              </div>
              <figcaption className="text-xs text-muted-foreground sm:text-sm">
                Reference style: use hero and campaign art with similar weight,
                texture, and handmade cadence when commissioning or selecting
                illustrations.
              </figcaption>
            </figure>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

