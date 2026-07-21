# ADR-0006 — Profiles protected-column enforcement

**Status:** Proposed 2026-07-21
**TL;DR:** Privilege-bearing columns on `public.profiles` (`role`, `approval_status`) are protected by a `BEFORE UPDATE` trigger rather than a column `REVOKE`; the canonical way to write these columns is a `service_role` connection (`createServiceClient()`). The automated regression test is deferred until the project has database-layer test infrastructure.

**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

The `profiles` UPDATE RLS policy ("Users can update own profile", `supabase/migrations/001_profiles.sql`) is row-scoped — its only condition is `id = auth.uid()`. Postgres RLS UPDATE policies operate on whole rows unless explicitly restricted, so the policy says nothing about *which* columns a user may change. `role` and `approval_status` are ordinary columns on the same table as `display_name`/`bio`, so the same permissive check covers them.

Supabase auto-generates a PostgREST endpoint for every RLS-protected table, reachable directly with a user's own session token and the public anon key. Any authenticated user could therefore `PATCH /rest/v1/profiles?id=eq.<self>` with `{"role":"admin","approval_status":"approved"}` and escalate their own privilege without the app ever being involved. This is a live privilege-escalation gap that has existed since the table was created; it was surfaced during review of PR #183, whose original local-dev shortcut worked only because this hole existed.

Postgres `WITH CHECK` can validate the new row but cannot compare against the old row, so a policy alone cannot express "you may not change `role` from its current value." Enforcing a column-level rule that depends on the prior value requires a trigger. The codebase already uses `BEFORE UPDATE` triggers on `profiles` and `groups` (the `updated_at` triggers), so the pattern is established. This is, however, the first *security-critical* column-level protection in the schema, which is why the decision is recorded here.

## Decision

We protect `role` and `approval_status` on `public.profiles` with a `BEFORE UPDATE` trigger (`protect_profile_protected_columns`) backed by the function `public.guard_profile_protected_columns()`. The function raises an exception if a non-admin caller attempts to change either column, and lets an existing admin change them.

Privileged connections bypass the guard by checking `current_user IN ('service_role', 'supabase_admin', 'postgres')`. This covers the admin approval flow — which authenticates as `service_role` through `createServiceClient()` (`app/admin/approvals/actions.ts`) — as well as direct superuser/admin connections used by migrations and seeds. The function is `SECURITY INVOKER` (the default) so that `current_user` reflects the real caller rather than the function owner. We deliberately do **not** use `auth.role()`: it is no longer documented in the current Supabase RLS guide (superseded by `auth.jwt()`), and a JWT-claim check would wrongly block legitimate direct-DB admin writes that a role check permits.

The **canonical privileged-write path** for these columns going forward is a `service_role` connection via `createServiceClient()` in a server action guarded by an admin check. Application code holding a normal user session must never be relied on to write `role` or `approval_status`.

## Alternatives considered

**`REVOKE UPDATE (role, approval_status) ON public.profiles FROM authenticated`.** Column-level privilege revocation is simpler and needs no trigger. We rejected it because it is an invisible constraint that a later broad `GRANT UPDATE ON public.profiles TO authenticated` — easy to write without noticing — would silently supersede, reopening the hole. A trigger survives re-grants; a `REVOKE` does not self-heal. The trigger also expresses the actual intent ("non-admins cannot change privilege columns, admins can"), which a blanket revoke cannot.

**Environment guards (`VERCEL_ENV` / `NODE_ENV`).** Not applicable. This is a database-layer gap independent of any app-layer environment conditional; an env check in application code cannot constrain a direct PostgREST call.

**Automated pgTAP regression test in this change.** A faithful test of a database trigger must exercise the real `authenticated`-role identity boundary against a running Postgres, which our standards (`TESTING_STANDARDS.security-rls.md`) correctly require be done with pgTAP via `supabase test db`. The project currently has no database-layer test harness — no `supabase/tests/`, no `supabase_test_helpers`, and no CI job that stands up a database — and standing that infrastructure up (including the Docker/CI-gating decision) is a separate, load-bearing concern we are not ready to take on in this change. We deferred it rather than couple a live security fix to net-new test infrastructure. The fix is verified manually at merge time (see Consequences).

## Consequences

- The privilege-escalation hole is closed at the database layer: a non-admin cannot change `role` or `approval_status` on any row, through the app or through a direct PostgREST call.
- The admin approval flow is unaffected because it uses `service_role`, which bypasses the guard. Any future feature that must write these columns has one sanctioned path — a `service_role` connection behind an admin check — and this ADR is the record of that rule.
- Non-admin attempts fail loudly with `permission denied: role is a protected column` / `... approval_status ...`. Callers that write these columns on a normal user session (there are none today) would break visibly rather than silently.
- **This fix ships without an automated regression test**, a conscious, recorded deviation from the "every bug fix has a test" standard. The risk is that a future migration touching `profiles`, a refactor of the trigger, or a Postgres/Supabase upgrade could reopen the gap with no CI signal. That risk is tracked by a follow-up issue to add pgTAP RLS regression coverage once the database-test harness exists; this trigger is the first test that harness should carry.
- Interim verification is manual: against the PR's preview database, authenticate as a normal user and confirm the malicious `PATCH` is rejected, and confirm the admin approval flow still succeeds via `service_role`. The repro is documented in the PR.

## Open questions

- The bypass currently trusts `current_user`. If the project later introduces additional privileged database roles, the `IN (...)` list must be revisited — a reason the eventual pgTAP test should assert both the negative (authenticated blocked) and positive (`service_role` allowed) cases explicitly.
