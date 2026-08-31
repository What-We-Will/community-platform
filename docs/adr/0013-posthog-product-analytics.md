# ADR-0013 — PostHog for product analytics

**Status:** Proposed 2026-08-31
**TL;DR:** We adopt PostHog Cloud (US) for product analytics of the authenticated member app only, self-installed behind a first-party proxy, with a privacy posture codified here as acceptance criteria: pseudonymous UUIDs only, masked autocapture, session recording prohibited, every remote-configurable capture surface disabled in code, and a full URL scrub. Production capture stays off until the named approver signs off and a synthetic-project validation passes.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

We have no product analytics. Feature decisions — in particular whether to widen or sunset the feature-flag-gated products (job application tracker, learning tracker, ghost job board, group learning, projects) — are being made without data on what members actually use.

Our audience makes the privacy bar unusually high: members are job seekers, often employed and searching discreetly, plausibly on shared or library computers. The platform holds application notes, messages, and employer names. An analytics mistake here is not a branding problem; it is a harm to the people the platform exists to serve. The design below therefore treats privacy guarantees as first-class acceptance criteria, not defaults to revisit later.

The plan behind this decision went through multiple review rounds (external, adversarial, and two independent context-scrubbed audits) in late August 2026. This ADR is the canonical record of the outcome; where it conflicts with any earlier document, this ADR wins.

## Decision

We will use **PostHog Cloud, US region**, installed manually (`posthog-js` + `posthog-node` — no wizard, no snippet), served first-party through a same-origin `/ingest` route-handler proxy (`app/ingest/[...path]/route.ts`) to `us.i.posthog.com` / `us-assets.i.posthog.com` on Vercel. Vercel firewall rate limits on the ingest path are part of the design.

**The ingest proxy builds a fresh outbound request; cookies never reach PostHog.** Because the proxy is same-origin and every app cookie (including Supabase session tokens) is set with `path=/`, the browser attaches all of them to every `/ingest/*` request. A config-level Next.js rewrite — PostHog's documented setup — relays the full request, so a PostHog data breach, subpoena, or insider incident would expose live session credentials, not just pseudonymous analytics. The route handler therefore forwards an explicit header allowlist (`content-type`, `user-agent`) and nothing else: no `Cookie`, no `Authorization`, and no client IP header — PostHog sees only the Vercel egress IP, making the IP-discard posture below code-enforced rather than dashboard-dependent. Widening the forwarded-header list is a change to this ADR, not a code tweak.

**Consent posture.** We track logged-in members under legitimate interest, with no cookie banner and `person_profiles: 'identified_only'` (no profiles for anonymous visitors). The privacy policy names PostHog (US cloud), what is collected, and why, and ships before or with the install. **Named approver for the legitimate-interest/no-banner call: @tonyrosario (platform lead)** — sign-off is required before production capture is enabled.

**Capture scope is an allowlist, not a deny-list.** Only routes in the authenticated member app may emit events. Login, signup, onboarding, password recovery, pending-approval (except its logout reset), and the entire public marketing site emit nothing, enforced in code (`before_send` route gate, fail closed). A deny-list of named routes is rejected because it silently captures every route nobody thought to name. Known residual, accepted pending approver sign-off: the SDK itself initializes globally whenever the token is set, so excluded routes still get a persistent device identifier (localStorage+cookie) and remote-config/flags requests even though no events leave them; route-scoped initialization would close this but is deferred as a separate decision. Cost accepted: no signup-funnel or public-site analytics; either would require its own consent posture and a new ADR.

**Pseudonymous identifiers only.** `identify()` uses the Supabase UUID and nothing else. Event properties carry enums, never free text and no entity IDs unless a named analytics question requires them and the exception is recorded in an amendment to this ADR (the necessity test). UUIDs and dynamic URLs are pseudonymous personal data, not anonymous — retention, access, and deletion below apply to them. Admin approval/rejection events use the **acting admin** as the distinct ID and carry **no target-member ID**: the analytics question is throughput, which counts answer, and the target is not covered by the legitimate-interest posture.

**Autocapture on, fully masked.** `mask_all_text: true` and `mask_all_element_attributes: true` are mandatory config (attributes like `href`/`aria-label` are not covered by text masking). Masking is the no-regret direction: it can be relaxed later, but unmasked capture cannot be retracted. `data-ph-capture-attribute-*` values are an unmasking channel by design and must be **static string literals only**, never JSX-bound expressions — enforced by a CI check.

**Session recording is prohibited** (`disable_session_recording: true`). Revisiting this requires a new ADR.

**Every remote-configurable capture surface is disabled in code.** Several posthog-js surfaces default to "follow remote config", meaning a dashboard toggle could enable them with no code review. We therefore set explicit local disables for surveys (`disable_surveys: true` — a dashboard-launched free-text survey would bypass our typed allowlists), conversations and product tours (`disable_conversations: true`, `disable_product_tours: true` — dashboard-launched in-app messaging collects free-form member replies outside the scrubber's allowlists), web experiments (`disable_web_experiments: true` — disabled by SDK default, pinned locally per this rule), exception capture (`capture_exceptions: false` — error messages routinely embed member-typed strings), dead clicks, heatmaps, and performance capture. Config-in-code is only authoritative where a local disable flag exists **and is set**; removing one of these flags because "the dashboard has it off" defeats the control.

**IP and location are discarded at the project level.** The proxy already withholds the member's IP (above), so these dashboard controls are a second layer, not the only one. The PostHog "Discard client IP data" toggle is on and the GeoIP transformation is off (discard alone still lets GeoIP stamp city/coordinates before the IP is dropped — a member job-searching from their office must not produce events geolocated to their employer's district). These are dashboard-side, per-project settings, so they are verified against the synthetic validation project before enablement and re-verified against the production project, and then re-checked on the recurring review below.

**URL-surface scrub in `before_send`, covering every URL channel.** Entity paths are templated (`/members/<uuid>` → `/members/[memberId]`, etc.); query strings and hashes are stripped by default (filter UIs put free-text searches in `?q=` — a member searching a colleague's name must never reach PostHog); the scrub covers `$current_url`, `$pathname`, referrer properties, pageleave previous-page properties, and the `$set_once` initial person properties. Internal referrers are templated and stripped like URLs; **external referrers reduce to domain only**. Any later re-admission of a raw identifier or query param is an explicit, per-question exception recorded against this ADR.

**Identity reset covers every exit.** A shared sign-out helper used by all logout surfaces calls `posthog.reset(true)` — the `true` is load-bearing: bare `reset()` preserves `$device_id`, which would let successive accounts on one (possibly shared) browser be correlated. Because PostHog persistence outlives the Supabase session, the login page also resets lingering identified state on load, so an expired session on a shared computer cannot attribute the next person's activity to the previous member.

**Typed allowlists are the primary payload control.** A typed taxonomy wrapper defines a per-event property allowlist at the type level and strips unknown keys at runtime, with tests. A PR-review denylist grep (email, name, body, notes, company) remains as belt-and-suspenders.

**SDK `defaults` pin policy.** We pin `defaults: '2026-05-30'`, the snapshot we reviewed. Adopting a newer snapshot requires reviewing PostHog's behavior-change notes first; it is never a drive-by version bump.

**Data at rest is treated as membership-roster access.** Anyone with a PostHog seat plus Supabase access can re-identify every UUID instantly. Seat list: **platform lead only (@tonyrosario)** initially; 2FA required on all PostHog accounts; event retention **1 year**. A **quarterly review** covers both the seat list and the collection-affecting dashboard settings (IP discard, GeoIP, session recording, surveys, error tracking) — a point-in-time launch check cannot catch a post-launch dashboard flip. Two residual risks the approver accepts knowingly: event timestamps and `$timezone` inherently reveal work-hours activity to seat holders, and a person using an abandoned still-live session is indistinguishable from the member at every layer, analytics included.

**Event forgery is accepted as inherent to client analytics.** The project token is public and member UUIDs circulate in-app, so forged events and person-property poisoning are possible. Consequence: analytics is not an integrity-grade data source; decisions that matter (e.g. widening a flag) get a sanity check against server-side counts.

**Deletion and export requests.** The platform lead (initially @tonyrosario, as sole seat holder) executes member deletion/export requests against PostHog alongside the corresponding Supabase-side request: deletion via PostHog's person deletion with associated events, keyed on the member's Supabase UUID, within 30 days of the request; export via PostHog's person/event export for that distinct ID. Verification: after deletion completes, a search for the UUID as distinct ID must return no person and no events, recorded with the request.

**Enablement is a separate, explicit step.** The production token is the only switch: token set = capture on, token unset = off (client init guard and server no-op both key off env; a second `ANALYTICS_ENABLED` toggle is rejected as a misconfiguration mode without added control). Code merges with no token set. Capture is enabled only after: privacy policy published, approver sign-off, and an end-to-end validation against a throwaway synthetic-data PostHog project asserting every criterion above on real captured payloads. Rollback: unset the token in Vercel and redeploy — this stops capture but does not retract captured data, which is why validation happens against the synthetic project first.

## Alternatives considered

**No analytics (status quo).** Rejected: gated-feature widen-or-sunset decisions are currently guesses; the platform lead asked for usage data.

**Self-hosted PostHog.** Keeps data fully in-house, but adds an ops burden (upgrades, backups, scaling ClickHouse) a volunteer-run platform cannot staff. Rejected; the US-cloud + DPA + discard-controls posture is the compromise.

**PostHog EU cloud.** Region is locked at project creation; the lead confirmed US cloud. EU residency was not judged worth re-opening for a US-based membership. Recorded so future readers know it was a choice, not an oversight.

**Privacy-first pageview tools (Plausible, Umami).** Genuinely simpler consent story, but pageview-only — they cannot answer per-feature activation funnels or gated-feature exposure questions, which are the point of this work. Rejected as insufficient, not as bad tools.

**Google Analytics 4.** Rejected: its data-sharing posture and consent expectations conflict with the no-banner legitimate-interest stance, and sending job-seeker behavioral data to an ad-tech vendor fails the audience test outright.

**PostHog AI wizard / snippet install.** Rejected: the wizard writes config we have not reviewed, and this design depends on exact config (masking, disables, scrub, route gate) being code-reviewed line by line.

**Deny-list capture scope.** Rejected (see Decision): it silently captures every route nobody thought to name; the allowlist fails closed.

**Cookie-banner consent instead of legitimate interest.** Deferred rather than rejected: a banner would permit public-site and signup-funnel analytics, but adds consent-management machinery for data we do not currently need. If public-site analytics is ever wanted, that is a new ADR.

**Server-side-only events (no client SDK).** Best ad-blocker resilience and smallest privacy surface, but loses pageviews, autocapture, and client-side funnels entirely. Rejected; the first-party proxy recovers most ad-blocker loss, and client capture is bounded by the controls above.

## Consequences

- We can answer "which features are used" and, for gated features, exposure → visit → activation funnels, informing widen-or-sunset decisions with denominators instead of anecdotes.
- Contributor workflow changes: **all events go through the typed taxonomy wrapper** — call sites never invent event names or properties; new events and any new URL param or entity ID in a payload require the necessity test and a payload review in the PR; `data-ph-capture-attribute-*` values must be static literals (CI-enforced).
- The privacy criteria in this ADR are acceptance criteria: tests cover the scrub (per channel), the allowlist runtime strip, the route gate, `reset(true)` on every logout surface, proxy matcher tightness, and analytics-failure isolation (an analytics outage must never fail a product mutation).
- Recurring operational work is created: quarterly seat + dashboard-settings review; a +2-weeks post-enable event-volume review (autocapture runs 5–10× custom-event volume; dials are pageleave capture and autocapture allowlists); deletion/export handling per above.
- Analytics data is deliberately lossy: masked autocapture identifies elements only by DOM structure, heatmaps/toolbar degrade to `[masked]`, no public-site or signup-funnel visibility, and forged events are possible. We accept these as the price of the posture; none can be reversed by a dashboard toggle, only by amending this ADR.
- ~30–50 KB gzipped added to the client bundle; the proxy keeps it first-party.

## Open questions

- Preview environments: default is token-unset (nothing sent); a second PostHog project for previews remains an option if preview-time validation becomes routine. The synthetic-data project used for pre-enablement validation exists either way.
- Multi-tab reset propagation is unverified in PostHog docs; it is asserted empirically during pre-enablement validation.
