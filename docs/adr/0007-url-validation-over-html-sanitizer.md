# ADR-0007 — URL scheme validation instead of an HTML-sanitizer library for user-submitted links

**Status:** Proposed 2026-07-22
**TL;DR:** We use `validateHttpsUrl` at every write path and `isHttpsUrl` again before rendering links on the approvals page. React escapes JSX text, while Nodemailer HTML-body interpolations use narrow `escapeHtml` encoding; SMTP headers remain plain text. DOMPurify and sanitize-html are rejected because this feature accepts URLs, not user-authored HTML.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

PR-187 added user-submitted LinkedIn, GitHub, and personal-website URLs during
onboarding. Within the admin-review flow addressed by PR-187, they are rendered
in two distinct contexts: on the React approvals page
(`app/admin/approvals/page.tsx`) as `href` values and JSX text, and in a
Nodemailer HTML message assembled through string interpolation. The email path
uses a narrow hand-rolled HTML-escaping utility (`lib/utils/html.ts`) for HTML
text and quoted attribute values.

In PR-187 review, xdhmoore raised two concerns: (1) hand-rolled escaping is
risky for a security-sensitive path — escaping needs differ by context (text
vs. HTML attribute vs. CSS) and a single function can't cover all cases, so
the team should adopt an established library instead, naming DOMPurify or
sanitize-html as candidates; and (2) arbitrary user-submitted URLs (especially
free-form personal websites) probably shouldn't be shown to admins at all
without some form of domain restriction. GeorgeDover agreed with the direction
but didn't have time to implement it and left it open for any contributor to
pick up.

To evaluate concern (1) objectively, we ran research on both named libraries
via Context7 plus web sources for maintenance/CVE history, followed by two
independent cold-agent reviews — one adversarial (actively trying to refute
the resulting recommendation) and one focused on build-vs-buy/architecture
tradeoffs (TCO, bus factor, precedent) for a small, volunteer-cadence team.
Both independently reached the same verdict as the initial research. The full
research record, including each agent's complete output, is retained by the
author and available on request.

## Decision

We will not adopt DOMPurify or sanitize-html for this use case. The two output
paths use controls appropriate to their respective contexts, backed by
validation wherever these fields are stored:

- Both current write paths (`app/onboarding/actions.ts` and
  `app/(app)/profile/actions.ts`) call `validateHttpsUrl` before storing a
  submitted link. Future write paths for these fields must apply the same
  validation.
- The React approvals page filters stored links through `isHttpsUrl` again at
  render time. This is a defense-in-depth backstop for legacy data and future
  write-path mistakes on that admin surface because no database constraint
  enforces the scheme. It is not yet a universal render-time guard: the
  pre-existing member profile page (`app/(app)/members/[userId]/page.tsx`)
  renders the same stored fields without applying `isHttpsUrl`; see Open
  Questions.
- On the React approvals page, React's default JSX text escaping handles text
  rendering.
- In the Nodemailer HTML body, where React escaping does not apply,
  `escapeHtml` encodes user-controlled values for HTML text and quoted
  attribute contexts. URL scheme validation remains a separate, prior control;
  output encoding alone would leave a `javascript:` URL intact.
- SMTP headers such as `subject` and `replyTo` are plain text, not HTML.
  Apply header-specific injection protection such as stripping CR/LF, and do
  not entity-encode them because entities render literally in mail clients.

Both libraries are **markup sanitizers** — they parse a string as an HTML
fragment and strip/allowlist dangerous tags and attributes so the result is
safe to insert via `innerHTML`. That is a different problem from what this
code needs: framework-provided escaping for JSX text, narrow output encoding
for a server-constructed HTML email, and URL scheme validation before a value
is used as `href`. Neither library provides the context-aware escaping xdhmoore
described (different rules for text vs. attribute vs. CSS). Adopting either
would mean routing values through an HTML-fragment parser despite the feature
never accepting user-authored markup; it would not replace the explicit URL
scheme check or the need to use the right encoding at each output sink.

React auto-escapes JSX text-node interpolation by default, which closes the
raw-HTML-injection vector on the React-rendered approvals page (xdhmoore's own
comment noted surprise this might already be the case). The residual gap on
that page — React does not validate that a string used in `href` is a safe URL
scheme — is a URL-validation problem, not an HTML-escaping problem, and is
what `isHttpsUrl` addresses directly. The Nodemailer message is not rendered
by React, so it separately retains `escapeHtml`; the initial review correctly
identified raw HTML injection there as another issue that URL validation alone
would not fix.

## Alternatives considered

**DOMPurify.** HTML/XML/SVG sanitizer with 17k+ GitHub stars and ~45.7M
weekly downloads — actively maintained. Rejected because: (1) it requires
`jsdom` for SSR/Node use, which is heavy and has documented friction with
Next.js App Router/Server Components (`vercel/next.js#46893`); (2) it has had
three sanitizer-bypass CVEs in roughly two years (2024-45801, 2025-15599,
2026-41238), making adoption an ongoing patch-tracking commitment, not a
one-time fix; (3) its URL/URI validation is a side effect of sanitizing full
HTML fragments, not a standalone URL validator — we'd still need to write our
own scheme-allowlist logic on top of it, at which point DOMPurify adds jsdom
weight for a check a plain `new URL()` call already gives us for free.

**sanitize-html.** Allowlist-based HTML sanitizer via `htmlparser2`,
server-oriented (no jsdom needed, RSC-compatible) — actively maintained
(~9M weekly downloads, 16 maintainers, recent releases). Rejected because:
(1) it solves markup-allowlisting, not context-aware string escaping — the
same category mismatch as DOMPurify; (2) using it to validate a bare URL
would mean wrapping the string in synthetic `<a href="...">`, sanitizing, and
extracting `href` back out — an awkward round-trip through an HTML parser for
a string that never needed to be HTML; (3) it pulls in `htmlparser2` as a
real dependency and a config surface (allowlisted tags/attributes/schemes)
that has to be maintained correctly — misconfigured allowlists are exactly
how its past CVEs (iframe/style bypasses) happened.

**Domain allowlisting (xdhmoore's second point).** Restricting submitted URLs
to a fixed list of known-safe domains (github.com, linkedin.com, etc.)
instead of accepting arbitrary personal websites. Not rejected — treated as a
separate, still-open product/security tradeoff outside this ADR's scope, but
flagged during review as *not fully orthogonal* to the escaping question:
restricting `github_url`/`linkedin_url` to their real domains would collapse
those two fields' risk to near-zero, leaving the free-form "personal
website" field as the only meaningful remaining surface. Worth deciding
alongside this fix rather than deferring indefinitely.

## Consequences

- No new runtime dependency is introduced for URL validation or rendering
  across these paths.
- The team keeps small, fully auditable shared URL helpers
  (`lib/utils/url.ts`) as the source of truth across both current write paths
  and the approvals-page render guard, rather than depending on a library's
  internal allowlist semantics.
- `isHttpsUrl` validates **scheme only, not host**. It does not protect
  against SSRF if any current or future feature fetches these URLs
  server-side (e.g., link preview, OpenGraph or favicon fetching against
  `https://169.254.169.254/` or `https://localhost/` would both pass scheme
  validation). No such fetch exists today; see Open Questions.
- This decision is scoped to plain URL-string validation and rendering in the
  contexts described above. It does not preclude adopting DOMPurify,
  sanitize-html, or another established sanitizer for a future feature that
  accepts user-authored markup. Any such decision should be evaluated against
  that feature's rendering context, runtime, and threat model.
- Contributors reviewing future PRs that touch user-submitted link handling
  should reference this ADR rather than re-relitigating the library
  question from scratch.

## Open questions

- **Add render-time validation to the member profile page.**
  `app/(app)/members/[userId]/page.tsx` renders the same three stored URL
  fields without filtering them through `isHttpsUrl`. The current write paths
  validate new values, but legacy rows or a future write-path mistake could
  still reach that member-facing surface. Apply the same render-time guard in
  a focused follow-up with coverage for the links block.
- **Revisit if a server-side fetch of these URLs is added** (link preview,
  OpenGraph/favicon fetch, or similar). `isHttpsUrl` does not protect
  against SSRF via private-IP/localhost targets; a host-based check would
  need to be added independent of this decision.
- **Revisit if a free-form rich-text field is added** (e.g., a bio or
  description field that must render user-authored markup rather than a
  single URL). That is a different problem than this ADR covers. An
  established HTML sanitizer may be appropriate then; evaluate DOMPurify,
  sanitize-html, and other candidates against the actual rendering context,
  runtime, and threat model. This ADR does not decide that future choice.
- **Domain allowlisting for `github_url`/`linkedin_url`** (xdhmoore's second
  PR-187 point) remains unresolved and is not decided by this ADR.
