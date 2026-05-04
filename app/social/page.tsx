import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Hand, Handshake, HandFist, Pointer, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BlueSkyIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  TikTokIcon,
  GlobeIcon,
} from "@/components/social/social-icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What We Will | Links",
  description:
    "Find all of our resources, events, and community links in one place.",
};

// ─── Configuration ──────────────────────────────────────────────────────────
// Edit these arrays to add, remove, or reorder links and social profiles.

const LINKS = [
  {
    label: "Share Your Story",
    description: "Tell us how AI is impacting your work",
    href: "/share-your-story",
    icon: Hand,
    primary: true,
  },
  {
    label: "Volunteer With Us",
    description: "Tell us how you'd like to give back",
    href: "https://form.jotform.com/261138031349048",
    icon: Handshake,
    primary: false,
    external: true,
  },
  {
    label: "No Robo Bosses",
    description: "Learn about the bill and get involved",
    href: "/programs/no-robo-bosses",
    icon: HandFist,
    primary: false,
  },
  {
    label: "Join Our Mailing List",
    description: "Stay informed with our latest updates",
    href: "/#newsletter",
    icon: Pointer,
    primary: false,
  },
  {
    label: "About Us",
    description: "Learn about our mission and vision",
    href: "/about-us",
    icon: HandHeart,
    primary: false,
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/www_rise/", icon: InstagramIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@www_rise", icon: TikTokIcon },
  { label: "Bluesky", href: "https://bsky.app/profile/wwwrise.bsky.social", icon: BlueSkyIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/wwwrise/", icon: LinkedInIcon },
  { label: "YouTube", href: "https://www.youtube.com/@whatwewill_rise", icon: YouTubeIcon },
  { label: "Website", href: "https://whatwewill.org", icon: GlobeIcon },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SocialLinksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted">
      {/* Main */}
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">

          {/* ── Profile ── */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-white">
              <Image
                src="/images/logo-mark.svg"
                alt="What We Will"
                width={48}
                height={48}
                className="size-14 object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="font-bebas text-4xl text-dark-blue tracking-tight">
                What We Will
              </h1>
              <p className="text-sm text-muted-foreground">
                Building worker power in the age of AI
              </p>
            </div>
          </div>

          {/* ── Links ── */}
          <div className="w-full flex flex-col gap-3">
            {LINKS.map(({ label, description, href, icon: Icon, primary, external }) =>
              primary ? (
                <Button
                  key={href}
                  size="lg"
                  className="w-full rounded-xl bg-primary-orange text-white shadow-md hover:bg-primary-orange-hover h-auto py-4"
                  asChild
                >
                  <Link
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3"
                  >
                    <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-black/15">
                      <Icon className="size-5" />
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block font-semibold text-sm leading-tight">{label}</span>
                      {description && (
                        <span className="block text-xs text-white/75 mt-0.5">{description}</span>
                      )}
                    </span>
                    <ArrowRight className="size-4 flex-shrink-0 opacity-70" />
                  </Link>
                </Button>
              ) : (
                <Link
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm transition-all hover:border-primary-orange/40 hover:shadow-md"
                >
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-orange/10">
                    <Icon className="size-5 text-primary-orange" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground leading-tight">
                      {label}
                    </span>
                    {description && (
                      <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                        {description}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="size-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary-orange" />
                </Link>
              )
            )}
          </div>

          {/* ── Socials ── */}
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Follow us
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="social-icon-link flex size-11 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-all hover:border-primary-orange/50 hover:text-primary-orange hover:shadow-md"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
