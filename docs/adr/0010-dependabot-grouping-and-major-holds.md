# ADR-0010 — Dependabot grouping conventions and major-version holds

**Status:** Proposed 2026-08-03
**TL;DR:** Dependabot ranks groups by pattern specificity, and a group declaring no `patterns` outranks every wildcard, so our `dependency-type` catch-alls were silently stealing dependencies from named groups; the catch-alls now declare `patterns: ["*"]` and scoped dependencies are additionally listed by literal name. Family major-version holds stay expressed as `ignore` entries scoped to `version-update:semver-major`, never as a bare `dependency-name`, because only the scoped form leaves security updates flowing.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

Dependabot version updates were switched on in June 2026 with a grouped configuration (PR #169). The design has two layers: version-locked *family* groups (react, next, vitest, tailwind, the Supabase client SDKs, and others) that move a related set atomically, and *category* groups (testing, eslint, types) that batch minor and patch bumps while letting majors surface as individual reviewable PRs. Two `dependency-type` catch-alls sat last to sweep the long tail. In July the family majors were additionally held back via `ignore` so that framework upgrades are taken as scheduled migrations rather than arriving unannounced as bot PRs, on the January and July review cadence [ADR-0009](./0009-time-boxed-waivers-for-unfixable-advisories.md) established for the held ESLint major.

On 2026-08-03, PR #265 grouped `@playwright/test` and `@tailwindcss/postcss` into the `dev-minor-patch` catch-all, even though both match patterns in groups written to own them. Four groups — `dnd-kit`, `supabase`, `testing`, and `types` — had in fact never captured a single dependency since being written, and `tailwind` was capturing only its unscoped members. Twelve dependencies were being routed somewhere other than where the configuration said. Most pointedly, the `supabase` group exists specifically so `@supabase/ssr` and `@supabase/supabase-js` move together for SSR auth; in practice they had been drifting independently through the production catch-all.

The cause is in `dependabot-core`. `Updater::PatternSpecificityCalculator` scores every group that contains a dependency and drops the dependency from all but the highest scorer. An exact literal match scores 1000; a group declaring **no `patterns` at all** scores `NO_PATTERNS_SCORE`, which is 500; a wildcard pattern scores `100 − (10 × wildcards) + max(length − 5, 0)`, which lands between 93 and 103 for the globs in this file; and the universal `"*"` scores 1. Our catch-alls declared only `dependency-type`, so they scored 500 and outranked every wildcard while losing to every literal.

That model predicts each observation exactly: `tailwindcss` grouped correctly under `tailwind` via a literal (1000) in PR #210, while `@tailwindcss/postcss` — the identical 4.1.18 → 4.3.3 bump in the same intended group — matched only `@tailwindcss/*` (99) and lost to the catch-all's 500 in PR #265. It also explains the case that first looked contradictory: the `github-actions` ecosystem groups fine on a bare `"*"` pattern scoring 1, because it is the only group in that ecosystem and so has no competitor.

The behavior is not documented. GitHub's options reference says only that groups are matched in file order and that `*` is "a wild card to define matches with dependency names," with no mention of specificity ranking. It is also not specific to scoped packages, which is what the symptom first suggested: any wildcard pattern loses to a no-`patterns` catch-all.

## Decision

The catch-all groups declare `patterns: ["*"]` in addition to `dependency-type`. This does not change which dependencies they contain — `"*"` matches everything and `dependency-type` still does the real filtering — but it drops their specificity from 500 to 1, which is where a catch-all belongs. Named groups now win on any match, including wildcards, so a future glob cannot be silently stolen.

Scoped dependencies are additionally listed by literal name in their group. This is redundant with the fix above and is kept deliberately: an exact match scores 1000, the highest score short of explicit membership, so the routing survives even if the specificity constants change. The globs remain alongside the literals and are load-bearing again — with the catch-alls demoted, a glob correctly claims anything the literals have not enumerated.

Family major-version holds remain expressed as `ignore` entries carrying `update-types: [version-update:semver-major]`. The scoping is not stylistic. GitHub's options reference states that "`update-types` only affects *version* updates, not *security updates*," so the scoped form suppresses routine major bumps while leaving Dependabot free to open a security PR for the same dependency. A bare `dependency-name` entry with no `update-types` would suppress both. Holds are reviewed each January and July.

Wildcards in `ignore` need no equivalent treatment. `Config::UpdateConfig.wildcard_match?` is byte-identical to the group matcher and `ignore` conditions are selected with a plain filter, with no specificity ranking involved, so `@dnd-kit/*` and `@tailwindcss/*` match there as written.

## Alternatives considered

**Fix only the catch-alls, without literals.** Two lines instead of eighteen names, general to every group, and no ongoing obligation to keep literal lists in step with `package.json`. Rejected as the sole measure because it rests entirely on undocumented scoring constants: if `UNIVERSAL_WILDCARD_SCORE` or `NO_PATTERNS_SCORE` changed, every glob-only group would silently break again with no failing signal. The literals give an exact-match floor that is far less sensitive to that.

**Fix only with literals, leaving the catch-alls at 500.** This was the first fix attempted and it does work for every dependency currently in the manifest. Rejected as the sole measure because it leaves the trap armed: any future group that relies on a glob, and any scoped dependency added without remembering the literal, is silently captured by a catch-all. It also made "add a literal every time" a permanent workflow rule for a problem that is fixable at the source.

**Abandon the major holds and rely on category-group filters instead.** Setting `update-types: [minor, patch]` on the family groups would let majors surface as individual PRs rather than being suppressed, which is the pattern GitHub's own documentation recommends. Rejected because it defeats the purpose the holds were introduced for: framework majors are meant to be scheduled migrations with a review window, not items in a weekly triage queue.

**Hold majors with a blanket `ignore` on `dependency-name`.** Simpler to write and read. Rejected because it would suppress security updates for every held dependency — which includes react, next, react-dom, and both Supabase client SDKs — converting a noise-reduction measure into a silent gap in the security-update pipeline.

## Consequences

Four groups begin functioning for the first time, and `tailwind` starts capturing its scoped members. Expect a one-time burst of regrouped Dependabot PRs on the next run as dependencies move out of the catch-alls into their intended groups; PR #265 should be closed manually so it is rebuilt along the corrected boundaries. `@supabase/ssr` and `@supabase/supabase-js` will move together from this point, and `@playwright/test` and the four `@testing-library/*` packages will batch under `testing` rather than scattering through `dev-minor-patch`.

Giving the catch-alls a `patterns` key also makes them eligible for specificity filtering in the other direction. A group with no `patterns` is skipped by `dependency_belongs_to_more_specific_group?`, so before this change a catch-all never yielded a dependency to a more specific group at PR-build time; now it does.

Adding a scoped dependency should still come with its literal name in the appropriate group, but forgetting is no longer silent breakage — the glob will catch it. The literal is belt to the glob's braces, not the only thing holding routing together.

Holding majors via `ignore` remains an indefinite suppression rather than a delay. Security updates are unaffected, but a held major that is never reviewed is invisible; the January and July review cadence is the only thing that surfaces it.

This configuration now depends on undocumented behavior in `dependabot-core`. The dependency is deliberate and the reasoning is recorded here, but it is the kind of thing that can change without a changelog entry, and the symptom if it does is silent misrouting rather than an error.

## Open questions

Whether the specificity model is stable across Dependabot releases is unknown; it appears in neither the options reference nor the changelog. If a group that should be populated starts producing no PRs, re-read `updater/lib/dependabot/updater/pattern_specificity_calculator.rb` before assuming the patterns are wrong.
