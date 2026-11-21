# ADR-0016 — Feature flag definitions change only through migrations

**Status:** Accepted 2026-11-21
**TL;DR:** Through the API, an admin can only turn a feature flag on or off. Creating, deleting or reconfiguring a flag (type, fail mode, expiry) happens only in a migration. Every on/off change is recorded in `feature_flag_changes`, with who made it and when.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

Feature flags live in `public.feature_flags`, and `lib/feature-flags.ts` is their only reader (ADR-0011 covers how they gate features). Until now, flags were flipped by running SQL directly, so you couldn't see or change flag state without database access, and nothing recorded who made a change. We're adding an admin page that flips flags through a server action using the admin's own Supabase session, behind RLS.

The original flag migration granted `authenticated` table-level insert, update and delete, with RLS limiting each to admins. That was more than the admin page needs. Any admin session could create or delete flags, or change `fail_mode`, `type` and `expires_at`, by calling PostgREST directly. Neither the app nor any review would see that. A new key does nothing unless the code also adds it to `FLAG_KEYS`, so creating flags at runtime has no use. Changing `fail_mode` silently changes how a feature behaves when the flag read fails.

The only trace of a change was the `updated_at` column, which records when but not who, and only the latest change.

## Decision

The API role (`authenticated`) gets `UPDATE (enabled)` on `feature_flags` and no other write privilege. The admin-only update policy stays. The insert and delete policies are dropped, not just left without a grant to use them, so a later grant can't quietly bring them back.

Everything else about a flag is decided in a reviewed migration: which flags exist, their type, fail mode, expiry, description and owner.

Every change to `enabled` adds a row to `public.feature_flag_changes` (`flag_key`, `old_enabled`, `new_enabled`, `changed_by`, `changed_at`). A `SECURITY DEFINER` trigger writes these rows. Over the API the table is read-only, and only admins can read it. `changed_by` comes from `auth.uid()` and is null for changes made outside an API session, such as migrations or a SQL console.

This sits alongside ADR-0011 and doesn't change it. Flags remain rollout gates, not an authorization boundary.

## Alternatives considered

**Keep the full write grants and restrict only the UI.** The admin page would only offer an on/off switch, but the database would still accept any change from an admin session. Rejected because the UI isn't a boundary. A leaked or misused admin token could reconfigure or delete flags without leaving a trace.

**Manage flag definitions in the admin UI too.** Create flags and edit their fail mode and expiry from the app. Rejected because a flag key only means something once code checks it, so a runtime-created flag would be inert. Changes to fail mode and expiry deserve the same review as the code they affect.

**Record only the last change (`updated_by` column).** Cheaper: one column and the same trigger. Rejected because it loses history. "Who turned this off last week, before it was turned back on?" is exactly the question support will ask.

**A shared, platform-wide audit table.** One generic table, rows stored as JSON, covering every audited table. Not chosen for now: the platform's role and capability model is still being decided, and that work is the right place to choose a shared audit design. A table for one domain is cheap to move into a shared one later.

## Consequences

- Adding, removing or reconfiguring a flag needs a migration and a PR. That was already the practice. It's now enforced.
- An admin session that tries to insert or delete a flag, or change any column other than `enabled`, gets a permission error instead of succeeding.
- Every flip made through the app is attributed. Flips made with a privileged database connection are still recorded, with `changed_by` null. Database owners can still get around the trigger. The append-only guarantee covers the API only.
- `feature_flag_changes` grows by one row per flip. At the expected volume of a few flips a month, it needs no retention policy.
- The admin check in the new policy is written out inline, like the existing flag policies. When a shared authorization helper exists, these policies should switch to it.

## Open questions

- Whether `feature_flag_changes` should move into a platform-wide audit table once the access-control model is decided.
