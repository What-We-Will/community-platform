# Migrations — Conventions

Durable rules for `supabase/migrations/`.

---

## Naming

New migrations are timestamp-named. Use:

```bash
supabase migration new <slug>
```

This produces `YYYYMMDDHHMMSS_<slug>.sql` (UTC, second-resolution). Never hand-pick a number. Slugs are lowercase snake_case describing intent (e.g. `add_event_capacity`, `backfill_user_locales`).

## Legacy sequential range

Migrations `001`–`057` are grandfathered and frozen. Do not renumber. New timestamp-named migrations sort after them lexicographically (`0` < `2`), preserving apply order on a fresh DB.

## `seed_id` column rule

Tables that the E2E seed manages — or that need RLS test fixtures — must include `seed_id text NULL` with a partial unique index:

```sql
ALTER TABLE <table> ADD COLUMN seed_id text;
CREATE UNIQUE INDEX <table>_seed_id_key ON <table>(seed_id) WHERE seed_id IS NOT NULL;
```

## In-flight PR guidance

This table covers PRs already open at the time of this writing (2026-05-19). For all new work, use `supabase migration new` from the start.

| In-flight PR shape | Collision gate behavior | Required action |
|---|---|---|
| Sequential filename `058_*.sql` (or any sequential number) with no name collision on `main` | passes | merge as-is; **no rename needed** |
| Sequential filename whose number already exists on `main` (two PRs raced on the same number) | fails | regenerate: `rm supabase/migrations/<old>.sql` → `supabase migration new <name>` → move the SQL body into the new timestamped file → commit |
| Edits or deletes to existing migrations on `main` | passes | no action |
| Already uses timestamp naming | passes | no action |

_Sunset trigger: delete this section once all PRs open at 2026-05-19 with sequential-numbered migrations have either merged or been rebased onto timestamps._

## If you hit migration pain

If you hit migration pain (collision, semantic conflict, contention on the shared preview DB, or slow apply cycles), file a GH issue with the `migration-pain-signal` label. See [ADR-0002](../../docs/adr/0002-migrations-timestamps-and-local-first.md) for context on the escalation ladder and revisit triggers.

## CI gate

Filename collisions against `origin/main` are enforced by [`scripts/ci/check-migration-collisions.sh`](../../scripts/ci/check-migration-collisions.sh), invoked from [`.github/workflows/preview.yml`](../../.github/workflows/preview.yml) on every PR.

## Shared preview DB & `db push --include-all`

The preview build applies each migration-touching PR's migrations to a **single shared preview Supabase project** (per-PR Branching is deferred — see [ADR-0002](../../docs/adr/0002-migrations-timestamps-and-local-first.md)). Two consequences:

- **CI runs `supabase db push --include-all`, and the flag is load-bearing.** Because the preview DB is shared, migrations arrive in *merge* order, not timestamp order — a PR authored earlier but previewed later sorts *behind* migrations already applied there. Plain `db push` refuses an out-of-order pending migration; `--include-all` forces it. Don't remove the flag without replacing the shared preview DB.
- **Don't rename or drop a migration that has already reached preview.** Its version stays recorded in the preview history table with no matching local file, and the next PR's `db push` fails with *"Remote migration versions not found in local migrations directory."* `--include-all` does **not** fix this — repair the preview project with `supabase migration repair --status reverted <version>` (preview only; production is unaffected — `production.yml` does not push migrations).
