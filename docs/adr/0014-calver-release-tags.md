# ADR-0014 — Calendar versioning for production release tags

**Status:** Accepted 2026-09-04
**TL;DR:** Tag each successful production deploy of a not-yet-tagged commit on `main` with a CalVer git tag (`vYYYY.MM.DD` in UTC, suffixed `.1`/`.2` for multiple same-day deploys) so the repo records what shipped and when. Instant rollbacks and out-of-band database changes are deliberately left untagged.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

Production deploys are manual (`workflow_dispatch` → `.github/workflows/production.yml`). The workflow checks out the ref it is dispatched from and pins nothing to `main`; in practice every deploy has been dispatched from `main`. Nothing in the repo marks *what shipped* or *when*. The only record of a release boundary is the merge history, which has to be reconstructed by hand to answer basic operational questions: "what's live right now?" and "what was live when this bug first appeared?"

The cost of having no boundary is concrete. Review and milestone tracking silently went stale because nothing pinned "this batch shipped" — a reconciliation pass on 2026-06-04 had to walk `git log` and remote-branch state to re-establish which work had actually reached production. The release live at the time of that pass (commit `24d16d3`, deployed 2026-06-03) bundled four PRs (#136, #137, #128, #141) — a fact knowable only by reading the log.

This is an internally-deployed Next.js application, not a published library or package. No downstream code imports it, there is no public API surface, and no tooling (registry, Dependabot, peer-dependency resolution) parses a version string. The only consumers of a version are the team, asking operational questions. That shapes which versioning scheme carries meaning here.

## Decision

We will adopt **Calendar Versioning (CalVer)** for production release tags. The format is `vYYYY.MM.DD`; a second or later deploy on the same day takes a `.N` suffix (`v2026.06.04.1`). Tags are **annotated**, created on the exact deployed commit, with a message listing the PRs included in the release and the identifier of the deploy run that shipped it.

**The date is the UTC date on which the deploy completed.** Contributors are spread across multiple time zones, so no contributor's local calendar can name the tag without privileging one person's evening over another's. UTC also gives a deterministic calendar boundary and matches the timestamps the Actions API and Vercel's deployment records return. The known cost: a deploy made in the evening from a time zone west of UTC carries the following day's UTC date, so the tag can read one day later than the person who clicked it remembers. The run identifier in the tag message resolves any such question.

A release is a production deploy that **reached a live production URL** — the workflow's deploy step succeeding. That is the boundary: a run failing before it produces no tag, a run failing after it (the deploy is live, a later reporting step errors) still earns one, and a rerun that redeploys an already-tagged commit adds no second tag. Only commits on `main` are tagged; a tag outside `main`'s ancestry would break the merge-log adjacency the scheme depends on, so a deploy dispatched from another ref is an incident to fix, not a release to name.

Two paths change production without running that workflow, and neither is tagged. A **Vercel instant rollback** re-points production at an earlier deployment from the dashboard; it mints no tag. A **database change** reaches production out-of-band — no workflow applies migrations to production — so it produces no deploy run to name. A tag therefore records the code a deploy put live, and nothing about the schema underneath it.

Keeping rollbacks untagged is deliberate. Tagging the restored commit would place a tag on an ancestor of the tag before it, and the merge log between those two is empty or backwards — the release-note premise breaks exactly when an incident makes it most needed.

The inaugural tag anchors commit `f8ab8cb` as `v2026.08.28` — the commit shipped by `Production Deploy` run #37, dispatched from `main`, whose deploy step completed successfully at 2026-08-28 03:12 UTC (run started 03:09 UTC, still the previous evening for the person who dispatched it). That straddle is why the timezone rule above is stated rather than assumed: the very first tag falls on a different day depending on the answer. Naming it after the fact is bookkeeping, not reconstruction — the run recorded the ref, the commit, and the result.

Earlier deploys are **not** tagged, including the handful whose SHA happens to be recoverable. The scheme's value comes from adjacency: release notes are the merge log between two *consecutive* tags. Backfilling isolated deploys would put tags on either side of an unknown number of untagged releases and present a months-wide span as a single release — confidently wrong, where an untagged gap is merely visibly absent. Tagging therefore begins at the current production state and is complete from there forward.

## Alternatives considered

**Semantic Versioning (`vMAJOR.MINOR.PATCH`).** The conventional default. SemVer earns its three numbers only when it communicates a compatibility contract to downstream code consumers — "will upgrading break me?" This project publishes nothing and nobody imports it, so there is no contract to encode. Each release would force an arbitrary major/minor/patch judgment with no real criteria behind it. Rejected as semantics without meaning.

**Sequential release number (`release-1`, `release-2`, …).** The simplest scheme, with a clean permanent ordering. Rejected because the number carries no information without a lookup: `release-7` tells you nothing about when it shipped, which is precisely the question the tag exists to answer. CalVer answers it at a glance.

**No tagging (status quo — rely on `git log` plus the plan index).** Rejected because the tracking drift that prompted this decision is the direct evidence that merge history alone does not produce a usable release boundary. The information is technically present but not at hand when it is needed.

## Consequences

- **Enables:** `git tag -l` answers "what did we ship, and when" — and, whenever no rollback is in effect, "what is live." Determining live state during a rollback window needs the Vercel deployment list or the incident record instead; the tags describe successful workflow deploys, not the serving state Vercel can be pointed at out of band. Release notes can be generated from the merge log between two consecutive tags; review and milestone tracking can pin work to a concrete "shipped in `<tag>`" marker instead of a merge date.
- **Constrains:** same-day deploys require the `.N` suffix discipline. After an instant rollback the newest tag is no longer what is live, and nothing in the repository says so — the incident record is the only source of truth until a roll-forward deploy restores the invariant. The scheme deliberately says nothing about the *content* or *severity* of a release — that is the job of release notes, not the version string.
- **New work:** create the inaugural tag on `f8ab8cb`; optionally automate tag creation and release-note generation inside the production deploy job so the convention survives a busy week. Manual tagging is easy to forget, and a forgotten tag reintroduces exactly the gap this decision closes.
- **Requires:** a deploy identifier (the Actions run, or the Vercel deployment) captured when the tag is created. The workflow history is the authoritative evidence that a commit reached production, but it is subject to retention limits and deletion, and is not queryable from the repository. Recording the run identifier in the annotated tag is what preserves that association once the run itself has aged out.
- **Contributor workflow:** a production deploy should be accompanied by its tag. If tagging is automated in the deploy job there is no manual step; until then, whoever triggers the deploy creates the tag.

## Open questions

- **Automation level** — whether tags are created by hand at deploy time or generated automatically by `production.yml` (which already knows the exact SHA it deploys) is deferred to a separate scoping effort. It does not block adopting the scheme.
