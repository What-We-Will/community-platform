# Architecture Decision Records (ADRs)

This directory holds the project's Architecture Decision Records — short, durable notes capturing decisions that are load-bearing, hard to reverse, or already came out of substantive debate.

ADRs are based on [Michael Nygard's format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions): Title, Status, Context, Decision, and Consequences. This project adds three header fields (`TL;DR`, `Author`, and `Sponsoring Lead`), a required `Alternatives considered` body section, an optional `Open questions` body section, and two statuses (`Draft` and `Rejected`).

---

## When to write an ADR

Write one when a decision is:

- **Load-bearing** — other code, processes, or contributors will depend on it.
- **Hard to reverse** — undoing it later costs migrations, rewrites, or coordination.
- **Already debated** — substantive discussion happened in a PR, an issue, or a meeting and a conclusion was reached. Capture it before the context evaporates.

Don't write one for:

- Routine choices that fit existing patterns (use the established library, follow the established convention).
- Implementation details confined to a single file or function.
- Style preferences (those belong in `CONVENTIONS.md` files or lint configs).

When in doubt, ask any lead before drafting. Missing ADRs lose important context; unnecessary ADRs add noise to the index.

### Retroactive ADRs

Sometimes a decision ships before its ADR is written. When documenting a decision that is already in production, date the ADR by the decision's lifecycle, not by the ADR file's creation date.

- `Proposed YYYY-MM-DD` is when the proposal first surfaced, such as the GitHub issue, PR discussion, design discussion, or meeting where the decision was put on the table.
- `Accepted YYYY-MM-DD` is when the team committed to the decision, typically the implementing PR's merge date or a documented sign-off, whichever came first.

The PR follows the standard `Proposed → Accepted` transition: open the PR with `Status: Proposed YYYY-MM-DD` (the original-proposal date above) and flip to `Status: Accepted YYYY-MM-DD` (the original-decision date above) on merge. The PR that introduces the ADR record documents an already-made decision and does not reset these dates. Sponsorship still applies; second-lead review does not (see "Proposal and sponsorship" below).

Do not routinely backfill ADRs. Write retroactive ADRs only for load-bearing decisions where the decision context, tradeoffs, or rationale are at risk of being lost.

---

## Format

Every ADR uses [`template.md`](./template.md). The template has:

- A four-field header: `Status`, `TL;DR`, `Author`, `Sponsoring Lead`. `Status` is Nygard's; the other three are this project's additions.
- Body sections: `Context`, `Decision`, `Alternatives considered`, `Consequences`, and (optional) `Open questions`.
- HTML-comment guidance inside each section that disappears in rendered output.

Aim for **one page** where possible. Go longer when alternatives and consequences demand it, but if it runs past ~two pages it's probably a design doc — link to the design doc from the ADR's Context section and keep the ADR itself focused on the decision.

---

## File naming

Save ADRs as `docs/adr/NNNN-kebab-case-title.md`, where:

- `NNNN` is the next available 4-digit number, zero-padded (`0001`, `0002`, …, `0042`).
- `kebab-case-title` is a short, lowercase, hyphen-separated slug of the title. Aim for 3–6 words. Drop articles ("the", "a") and filler verbs ("use", "adopt", "we") where it doesn't change meaning.

Examples:

- `docs/adr/0001-supabase-vault-for-survey-keys.md`
- `docs/adr/0002-rls-fixtures-via-seed-id.md`
- `docs/adr/0003-jitsi-for-video.md`

Numbers are permanent. If an ADR is superseded, the old file keeps its number and gains a `Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)` status line; the new ADR takes the next unused number. **Numbers are never reused.**

---

## Status values

| Status | Meaning |
|---|---|
| `Draft YYYY-MM-DD` | Author is still scribbling. Not yet ready for sponsorship review. |
| `Proposed YYYY-MM-DD` | Open for lead review (in PR). |
| `Accepted YYYY-MM-DD` | Approved and merged. |
| `Rejected YYYY-MM-DD` | Reviewed and not adopted. Merge with this status when the debate is worth preserving as a record; otherwise close the PR without merging. |
| `Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)` | A later ADR replaces this one. |
| `Deprecated YYYY-MM-DD` | No longer applies and there is no replacement. (Rare.) |

After an ADR is merged as `Accepted`, the only allowed edits are status transitions, non-substantive corrections such as typos or broken links, or metadata corrections that do not change the decision record. For substantive changes, write a new ADR that supersedes this one. ADRs are an immutable record, not living documentation.

---

## Platform leads

Three leads share sponsorship duty. Route a draft ADR to the lead whose area it most clearly touches; if the area is unclear or cross-cutting, ping any of them and they'll route it.

| Lead | GitHub | Primary ownership area |
|---|---|---|
| Simon McGraw | @SirFuzzyWalls | infra, data model, RLS, migrations |
| Tim Chaffee | @timchaffee | frontend, CI/CD, accessibility |
| Tony Rosario | @tonyrosario | design system, observability |

Ownership areas are guidance for routing, not hard ownership. Any lead can sponsor any ADR. The table exists so a volunteer at 11pm on a Saturday knows who to @-mention without having to ask in chat first.

---

## Proposal and sponsorship

This is a two-track process: deliberately permissive on entry, rigorous on acceptance.

1. **Anyone can propose.** A volunteer or lead drafts an ADR using `template.md`. Status starts as `Draft YYYY-MM-DD` while the draft is in flight, then `Proposed YYYY-MM-DD` when it's open for lead review. `Draft` lives on a branch or fork — open the PR when flipping to `Proposed`. ADRs should not land on `main` as `Draft`.
2. **Author is whoever drafts it.** Volunteer or lead. Filling the `Author` field is a first-class acknowledgment of the proposer's work — it is not erased when a lead sponsors.
3. **One of the three platform leads must sponsor.** Sponsorship means attaching their name to the `Sponsoring Lead` field. A volunteer-authored ADR may leave the `@username` placeholder in place; a lead fills it during PR review (do not delete the line). The Sponsoring Lead is the permanent historical contact — the person a future contributor asks "why did we decide this?" years from now. The role does *not* expire when the lead rotates to a different part of the project. Reassignment should be rare and should only happen when the original sponsor is no longer an appropriate project contact.
4. **Major framework decisions require a second lead's review.** For ADRs touching cross-cutting concerns (testing strategy, RLS model, auth model, secrets handling, framework choices), at least one *other* lead approves the PR before merge. Routine ADRs (one-off decisions confined to a single area) need only the Sponsoring Lead's approval. Retroactive ADRs are exempt from the second-lead requirement — the decision already shipped through normal review, and the ADR is record-keeping. The Sponsoring Lead is still required.
5. **Status flips to `Accepted YYYY-MM-DD` at merge** (or, for retroactive ADRs, the date the underlying decision was committed to — see "Retroactive ADRs" above). Either the Sponsoring Lead or the Author makes the edit as part of merging.
6. **Rejection is also a documented outcome.** If review concludes against adoption, merge with `Rejected YYYY-MM-DD` when the debate is worth preserving as a record; otherwise close the PR without merging.

When a substantive design discussion concludes — in a PR, an issue, or a meeting — write an ADR. Don't wait for a formal RFC process to exist; the ADR is the record.

---

## Where else conventions live

ADRs capture **decisions**. Day-to-day conventions (file layout, naming, lint rules, schema patterns) live in:

- [`CLAUDE.md`](../../CLAUDE.md) — project-wide guidance for contributors and AI tools, with pointers into the conventions tree.
- [`plans/local/CONVENTIONS.md`](../../plans/local/CONVENTIONS.md) — milestone and planning-doc structure.

If a convention conflicts with an accepted ADR, the ADR wins until a new ADR supersedes it.

---

## Index

| # | Title | Status | Sponsoring Lead |
|---|---|---|---|
| [0001](./0001-playwright-for-e2e-testing.md) | Playwright for end-to-end browser testing | Accepted 2026-04-27 | @tonyrosario |

<!--
Keep the index sorted by number ascending. Superseded ADRs stay in the index
with their status visible — they're history, not noise.
-->

---

## Further reading

- [Michael Nygard, "Documenting Architecture Decisions" (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — the original format.
- [`adr.github.io`](https://adr.github.io) — a community catalog of ADR templates, tools, and examples.
- [ThoughtWorks Tech Radar on Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records) — the "adopt" entry that codified ADRs as industry practice.
