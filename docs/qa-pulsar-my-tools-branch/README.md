# QA plan: `feature/pulsar-my-tools-unified-pr37-pr38`

Combined **risk-based QA** and **practical steps without a dedicated staging environment** for the What We Will platform.

---

## 1. Goals and merge bar

**Goal:** Reduce uncertainty from a large PR by proving a small set of claims: builds, tests, DB safety, My Tools behavior, and reminders.

**Merge when ALL of the following are true:**

- Every **P0** item in §4 passes.
- **Migrations** are validated on a database that matches production shape (§3).
- The team agrees on **rollback** for app + database (§6).

---

## 2. Environments (use them on purpose)

| Layer | What to use | Purpose |
|--------|-------------|--------|
| **Build / CI** | GitHub Actions on the PR + local `pnpm test` / `pnpm run build` | Catch regressions before merge |
| **“Staging-like” app** | **Vercel Preview** for this branch | Real HTTP, cookies, server actions, cron routes — *when* preview is configured with safe backend credentials |
| **Data** | Prefer a **non-production Supabase** (or schema restore + anonymized data). If previews use **production** DB, treat every test action as **production impact** | Avoid harming real users during QA |

**Note:** Preview deployments are the practical substitute for “staging” until Preview env vars point at a non-prod database.

---

## 3. Database and migrations (highest leverage without staging)

Run **before** treating the PR as merge-ready:

1. Restore a recent backup or logical dump into a **disposable** database (or use a Supabase branch/project if available).
2. Apply this branch’s migrations only (e.g. `supabase/migrations/057_*`, `058_*`, `059_*` and related).
3. **Smoke checks:**
   - Migrations apply cleanly (no duplicate objects; no unexpected destructive changes).
   - New indexes/constraints (e.g. job application dedupe) behave correctly on existing rows.
4. **Document** whether each migration is **reversible** or **forward-fix only**.

If a DB copy is impossible, the team should explicitly accept higher DB risk or defer merge until a copy exists.

---

## 4. Test layers

### P0 — must pass before merge

- **Automated:** full test suite + production build (`pnpm run build`) on the branch.
- **Regression smoke:** login, core navigation, existing jobs/messages/profile flows — unchanged behavior expected.
- **My Tools happy path:** profile inputs → match/brief → save to tracker → reload → data still correct; duplicate saves respect dedupe / no duplicate rows.
- **Vercel:** Preview deploy succeeds; Git author / team has **Vercel project access** so deployments are not blocked.

### P1 — strong confidence (time-box)

- **Edge cases:** missing profile data, bad URLs, malformed payloads, rate limits / cooldowns on match and save.
- **Reminders / cron:** exercise the cron route in preview (or locally with secrets in a **safe** env): eligible users get **one** reminder; cooldown prevents duplicates across retries; no runaway loops.
- **Performance:** match + save latency acceptable; cron batching does not time out on realistic load.

### P2 — optional / post-merge

- Monitor logs and errors for My Tools and cron paths for **24–48 hours** after production deploy.

---

## 5. Parallelizing QA (by blast radius)

| Focus | What to verify |
|--------|----------------|
| **Database** | Migrations on copy; rollback notes |
| **My Tools UI + server actions** | Happy path + save/dedupe |
| **Pulsar client / payloads** | Request/response shapes, errors |
| **Email & cron** | Single send, cooldown, no duplicates |
| **Platform regression** | Existing flows untouched |

Track with a simple checklist (issue or sheet): **scenario → owner → pass/fail → preview URL / build**.

---

## 6. Release and rollback

- **App rollback:** revert promotion in Vercel to the previous production deployment.
- **Database:** may not be one-click — document forward migration vs manual fix.
- **Optional guardrail:** feature flag or allowlist so My Tools ships **dark** (test accounts only), then widen exposure.

---

## 7. What this plan does not require

- A full second “staging” CI/CD pipeline on day one — **Preview + non-prod DB (when possible) + migration validation on a copy** provides most of the safety margin.
- Line-by-line review of the entire diff — **risk-based slices** and **DB proof** matter more for “will it break the platform?”

---

## 8. Stakeholder summary (one paragraph)

We are not blocking merge on a staging environment. We gate with automated tests and build, a Vercel Preview exercised against non-production data where possible, mandatory migration validation on a database restored from backup (or explicit acceptance of risk), a focused P0 checklist on My Tools and cron, and documented rollback. An optional feature flag or allowlist further limits production blast radius if needed.

---

## Related docs

- [`docs/mytools-refresh.md`](../mytools-refresh.md) — My Tools refresh notes (if present on this branch).
