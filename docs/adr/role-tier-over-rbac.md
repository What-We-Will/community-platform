# Role tiers over fine-grained RBAC

**Status:** Draft 2026-07-17
**TL;DR:** Keep a single-valued role tier on `profiles` (member < moderator < admin) and activate the dormant `moderator` tier as a least-privilege staff role; fine-grained, multi-role RBAC is deferred until several combinable capabilities actually exist.
**Author:** @tonyrosario
**Sponsoring Lead:** @username

## Context

Access control today rests on a single `TEXT` column, `profiles.role`, constrained to `member`, `admin`, or `moderator`. It is a mutually-exclusive tier: a user holds exactly one value. In practice only `'admin'` has ever been checked — in RLS policies and in app-layer guards — while `'moderator'` has sat in the constraint unused. Normal member access does not depend on `role = 'member'`; it gates on authentication and `approval_status`, so a user given a non-member role still retains ordinary access.

A new surface forced the question: a durable bug-report intake view that some trusted people should read without being full admins. The `'admin'` tier bundles member approval/rejection, editing any group, posting announcements, and service-role mutations — far more authority than "can read reported bugs" warrants. Granting it to a bug triager violates least privilege.

Separately, the codebase has no shared role-checking helper; the same inline `select('role')` comparison is copy-pasted across several call sites, and there is in-flight work to consolidate these into a shared guard module. That consolidation is out of scope here but is the natural home for whatever tier logic this decision implies.

## Decision

We keep the single-valued `profiles.role` tier and activate `'moderator'` as the least-privilege staff tier below `admin`. The bug-report intake view is gated to `role IN ('admin','moderator')`, making bug-report visibility the first responsibility of the moderator tier. We do not introduce a fine-grained permission model (a `user_roles` junction or a `permissions[]` column) at this time. When we need broader staff access later, we prefer adding responsibilities to the existing broad tiers over minting new narrow roles.

## Alternatives considered

**Gate on the existing `admin` tier.** Simplest and consistent with every current check, but it hands a bug triager the full administrative surface — the least-privilege failure that motivated this decision. Rejected.

**Add a narrow, purpose-named role value per capability** (e.g. `bug_viewer`). Because the column is single-valued, narrow roles do not compose — a person could be a bug viewer *or* a group moderator, never both. Narrow roles only work under a multi-role model, so adding them to a single-valued column is a trap. Rejected.

**Introduce fine-grained RBAC now** (a `user_roles` join table, or a `permissions[]` array), so "can view bug reports" becomes a grantable permission independent of tier. This is the correct model once several orthogonal, combinable capabilities exist, but it is net-new architecture, the first of its kind in the repo, and over-scoped for a single feature. Deferred, not rejected — see Open questions.

## Consequences

- A least-privilege staff tier now exists with no new tables, migrations, or access concepts — activating `moderator` is a policy change, not a schema change. Extending any future staff surface to moderators is a one-line RLS edit.
- The model stays single-valued: a user holds exactly one tier, and combinable capabilities are not expressible until an RBAC model is introduced. This biases us toward a few broad tiers rather than many narrow roles.
- The `moderator` tier now carries concrete meaning (bug-report visibility). Its semantics will accrete as capabilities are added to it; adding is easy, walking back is harder, so additions should be deliberate.
- For this feature the role check is written inline at the page guard (mirroring existing call sites) with RLS as the real enforcement; folding it into the shared guard module belongs to that consolidation effort, not here.

## Open questions

- When a second capability appears that should *not* be bundled into the moderator tier (someone who needs one staff power but not the others), that is the trigger to revisit this decision with an RBAC ADR that supersedes it.
- Whether the shared role-guard consolidation should expose a general `requireRole(...)` helper, and whether tier ordering (member < moderator < admin) should be encoded once there rather than as ad-hoc equality checks.
