# Feature flags are rollout gates, not an authorization boundary

**Status:** Draft 2026-07-19
**TL;DR:** Feature flags of type `release` and `experiment` are enforced at the Server Action layer through `canViewFeature` and `canMutateFeature`; the tables those features write to keep ownership-scoped RLS with no dependency on `feature_flags`. A user can therefore still mutate rows they already own via direct PostgREST while a flag is off, and that is accepted. A `permission`-type flag must have RLS backing before it can carry an authorization decision.

**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

Issue #191 asked for a durable feature-flag system to replace the hardcoded boolean constants shipped as a sketch in PR #194. The design that came out of that work makes a `feature_flags` table the sole source of truth and enforces it through exactly two named checks: `canViewFeature`, which is user-aware and lets an admin preview a disabled feature, and `canMutateFeature`, which is strict and has no admin carve-out (`lib/feature-flags.ts`). Nav entries derive from resolved flag state rather than being maintained by hand (`app/(app)/app-shell.tsx`).

The tables those gated features write to predate the flag system. Their RLS is keyed on row ownership — with an admin carve-out on some delete policies — and makes no reference to `feature_flags` (`supabase/migrations/021_job_tracker.sql:27-50`, `supabase/migrations/036_learning_tracker.sql:14-52`). Those policies grant the owner write access on their own rows, and the gated Server Actions exercise them through the user's own session (`app/(app)/tracker/actions.ts:3`), not a privileged connection. Supabase auto-generates a PostgREST endpoint for every such table, reachable with that same session token. A user can therefore call PostgREST directly and insert, update, or delete their own rows while the flag gating that feature is off. The Server Action guard is not in that path.

Whether to enforce flag state below the Server Action layer was raised explicitly during design and answered: the action layer. That answer was never written anywhere a reader of the code could find it. Successive code reviews of the flag work, reading the diff alone, have each identified the gap as a security hole, and the most recent fix proposal recommended mirroring flag state into RLS — reporting that it had checked `docs/adr/` and found nothing governing feature flags. This record exists because the decision was correct and unfindable, and its absence has repeatedly cost review cycles.

ADR-0006 treats exactly this attack shape — an authenticated user calling PostgREST directly, bypassing an app-layer check assumed to be sufficient — as a live threat requiring database-layer enforcement. That reasoning does not transfer here, and this ADR records why.

## Decision

Feature flags of type `release` and `experiment` are rollout gates. Enforcement lives at the Server Action layer through `canViewFeature` and `canMutateFeature`. The tables that gated features write to keep ownership-scoped RLS and gain no dependency on `feature_flags`.

The bypass is accepted because its impact is bounded to premature access to data the user already owns. There is no cross-user exposure, no role escalation, and no change to anyone's privileges. That is the distinction from ADR-0006, whose subject was privilege escalation — a non-admin promoting their own `role` gains authority over other users' data, which is categorically different from a user reaching their own rows a few weeks before a feature is announced.

The admin asymmetry stays centralized in the resolver. `canViewFeature` ORs in `attributes?.role === "admin"` so an admin can preview a disabled feature; `canMutateFeature` does not, so an admin cannot write through a disabled one. No call site may add its own role check — the asymmetry lives in one place by design, and duplicating it at a call site is how the two checks drift apart.

The `type` CHECK constraint already permits `'permission'` alongside `'release'`, `'experiment'`, and `'ops'` (`supabase/migrations/20260730033146_feature_flags.sql:12-13`). A `permission`-type flag carries an authorization decision rather than a rollout decision, and must not be introduced without RLS backing on every table it governs and pgTAP coverage for that boundary. Introducing the first one requires its own ADR.

## Alternatives considered

**Mirror flag state into RLS.** Add a `feature_flags` lookup to the INSERT, UPDATE, and DELETE policies on every gated table. This uses an idiom already present in the schema — cross-table subqueries against `profiles` appear in the admin-delete policies on `job_applications` (`supabase/migrations/021_job_tracker.sql:45-50`) and `learning_study_groups` (`supabase/migrations/036_learning_tracker.sql:34-37`) — and it closes the bypass at the layer that cannot be routed around. Rejected for three reasons. It puts a `feature_flags` subquery in the hot path of every row check on those tables. It inverts the failure mode: app-layer fail-closed means "this feature is unavailable," while RLS fail-closed means a user is locked out of rows they own, turning a flag-read failure into a data-access outage. And it couples write paths across flags — a surface gated by one flag that writes into a table gated by another can produce rows the writer cannot subsequently read. The churn is also real: for the tables today's two gated surfaces touch alone, eighteen write policies across five migrations, each requiring new pgTAP coverage under `TESTING_STANDARDS.security-rls.md`, which requires a pgTAP test for every migration that adds or modifies a policy.

**A guard trigger, following ADR-0006's mechanism.** A shared `BEFORE INSERT/UPDATE/DELETE` function parameterized by flag key, attached to each gated table. Rejected because ADR-0006 reached for a trigger only where a policy could not express the rule — `WITH CHECK` cannot compare the new row against the old one. A boolean flag check needs no such comparison, so the trigger adds a second authorization mechanism alongside RLS and buys nothing beyond a friendlier error message. It also carries every cost of the RLS option plus a function to maintain.

**Leave the decision unrecorded.** This was the status quo. Rejected because the cost is now measured: the same finding has been raised by successive independent reviews, and each round spends a context-holding pass re-deriving an answer that was settled during design. The problem was never that the decision was wrong; it was that nothing in the repository said it had been made.

## Consequences

- A user can mutate rows they already own through direct PostgREST while the flag gating that feature is off. This is accepted, bounded, and now on the record rather than latent.
- Flags are not a kill switch for owner-initiated data mutation. If a broken feature must be stopped at the data layer — not merely hidden — that is a `permission`-type flag with RLS backing, a new ADR, and pgTAP coverage. Anyone reaching for a flag as an incident-response tool should read this paragraph first.
- Reviewers reading the code without this context will keep identifying the gap. That is correct behavior on their part; this ADR is the answer to point them at, and `docs/adr/` is where automated review already looks.
- No call site may add its own admin check for a flagged feature. The `canViewFeature` / `canMutateFeature` split is the whole authorization surface.
- The `permission` gate is enforced by review, not by the schema. A row with `type = 'permission'` can be inserted today and nothing stops it. See Open questions.
- This record introduces no migration and no code change. It documents the boundary that already ships.
- The Job Board's `addToWishlist` and `removeFromWishlist` (`app/(app)/jobs/community-actions.ts`) write into `job_applications`, a table belonging to a different gated feature. That write is governed by the Job Board's own flag alone; the dependency on the other feature is expressed as a view-only condition on the wishlist control, not as a second mutation guard. The residual — a direct PostgREST write producing an invisible, user-owned row while the other feature is off — is exactly the bypass this ADR already accepts.

## Open questions

- Whether to add a pgTAP assertion that no `permission`-type row exists until an ADR authorizes the first one. That would convert the gate above from a review rule into a mechanical one, at the cost of a test that must be deliberately removed when the time comes.
