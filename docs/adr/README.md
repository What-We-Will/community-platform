# Architecture Decision Records (ADRs)

This directory holds the project's Architecture Decision Records — short, durable notes capturing decisions that are load-bearing, hard to reverse, or already came out of substantive debate.

ADRs are written in [Michael Nygard's format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), with three project-specific additions (`TL;DR`, `Author`, and `Sponsoring Lead`) and one drafting state (`Draft`) added on top of the standard status enum.

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

When in doubt, ask any lead before drafting. The cost of a missing ADR is high; the cost of an unnecessary one is also high (noise in the index).

---

## Format

Every ADR uses [`template.md`](./template.md). The template has:

- A four-field header: `Status`, `TL;DR`, `Author`, `Sponsoring Lead`.
- Body sections: `Context`, `Decision`, `Alternatives considered`, `Consequences`, and (optional) `Open questions`.
- HTML-comment guidance inside each section that disappears in rendered output.

Keep ADRs to **one page** where possible, **two pages maximum**. If it's longer, it's a design doc — link to the design doc from the ADR's Context section and keep the ADR itself focused on the decision.

---

## File naming

Save ADRs as `docs/adr/NNNN-kebab-case-title.md`, where:

- `NNNN` is the next available 4-digit number, zero-padded (`0001`, `0002`, …, `0042`).
- `kebab-case-title` is a short, lowercase, hyphen-separated slug of the title. Aim for 3–6 words. Drop articles ("the", "a") and filler verbs ("use", "adopt", "we") where it doesn't change meaning.

Examples:

- `docs/adr/0001-supabase-vault-for-survey-keys.md`
- `docs/adr/0002-rls-fixtures-via-seed-id.md`
- `docs/adr/0003-jitsi-for-video.md`

Numbers are permanent. If an ADR is superseded, the old file keeps its number and gains a `Superseded by ADR-NNNN` status line; the new ADR takes the next unused number. **Numbers are never reused.**

---

## Status values

| Status | Meaning |
|---|---|
| `Draft YYYY-MM-DD` | Author is still scribbling. Not yet ready for sponsorship review. |
| `Proposed YYYY-MM-DD` | Open for lead review (in PR). |
| `Accepted YYYY-MM-DD` | Approved and merged. The Sponsoring Lead — not the Author — makes this edit. |
| `Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)` | A later ADR replaces this one. |
| `Deprecated YYYY-MM-DD` | No longer applies and there is no replacement. (Rare.) |

Once an ADR is `Accepted`, the **only** edits allowed are status transitions (`Accepted → Superseded`, `Accepted → Deprecated`). For everything else, write a new ADR that supersedes the old one. ADRs are an immutable record, not living documentation.

---

## Platform leads

Three leads share sponsorship duty. Route a draft ADR to the lead whose area it most clearly touches; if the area is unclear or cross-cutting, ping any of them and they'll route it.

| Lead | GitHub | Primary ownership area |
|---|---|---|
| Simon McGraw | @SirFuzzyWalls | infra, data model, RLS, migrations |
| Tim Chaffee | @timchaffee | frontend, CI/CD, accessibility |
| Tony Rosario | @tonyrosario | design system, observability |

Ownership areas are guidance for routing, not hard ownership. Any lead can sponsor any ADR. The table exists so a volunteer at 11pm on a Saturday knows who to @-mention without having to ask in chat first.

> [!IMPORTANT]
> **Provisional rule — resolve before merge (2026-05-06).** The 5-business-day window below has not been confirmed by all three leads. @SirFuzzyWalls @timchaffee — please confirm or propose a different value in this PR. Remove this callout once consensus lands.

If no lead has self-assigned within **5 business days** of an ADR moving to `Proposed`, the author may ping all three in the PR thread to surface the routing question.

---

## Proposal and sponsorship

This is a two-track process: deliberately permissive on entry, rigorous on acceptance.

1. **Anyone can propose.** A volunteer or lead drafts an ADR using `template.md`. Status starts as `Draft YYYY-MM-DD` while the draft is in flight, then `Proposed YYYY-MM-DD` when it's open for lead review.
2. **Author is whoever drafts it.** Volunteer or lead. Filling the `Author` field is a first-class acknowledgment of the proposer's work — it is not erased when a lead sponsors.
3. **One of the three platform leads must sponsor.** Sponsorship means attaching their name to the `Sponsoring Lead` field. A volunteer-authored ADR may leave that field blank; a lead fills it during PR review. The Sponsoring Lead is the permanent historical contact — the person a future contributor asks "why did we decide this?" years from now. The role does *not* expire when the lead rotates to a different part of the project. Reassignment only happens if the lead leaves the project entirely.
4. **Major framework decisions require a second lead's review.** For ADRs touching cross-cutting concerns (testing strategy, RLS model, auth model, secrets handling, framework choices), at least one *other* lead approves the PR before merge. Routine ADRs (one-off decisions confined to a single area) need only the Sponsoring Lead's approval.
5. **Status flips to `Accepted YYYY-MM-DD` at merge.** The Sponsoring Lead makes the edit as part of merging.

When a substantive design discussion concludes — in a PR, an issue, or a meeting — write an ADR. Don't wait for a formal RFC process to exist; the ADR is the record.

---

## Where else conventions live

ADRs capture **decisions**. Day-to-day conventions (file layout, naming, lint rules, schema patterns) live in:

- [`CLAUDE.md`](../../CLAUDE.md) — project-wide guidance for contributors and AI tools, with pointers into the conventions tree.
- [`plans/local/CONVENTIONS.md`](../../plans/local/CONVENTIONS.md) — milestone and planning-doc structure.

If a convention conflicts with an accepted ADR, the ADR wins until a new ADR supersedes it.

---

## Index

*No ADRs yet — see [`template.md`](./template.md) to write the first one.*

<!--
When ADR-0001 lands, replace the line above with a table:

| # | Title | Status | Sponsoring Lead |
|---|---|---|---|
| [0001](./0001-supabase-vault-for-survey-keys.md) | Supabase Vault for survey keys | Accepted 2026-MM-DD | @lead |

Keep the index sorted by number ascending. Superseded ADRs stay in the index
with their status visible — they're history, not noise.
-->

---

## Further reading

- [Michael Nygard, "Documenting Architecture Decisions" (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — the original format.
- [`adr.github.io`](https://adr.github.io) — a community catalog of ADR templates, tools, and examples.
- [ThoughtWorks Tech Radar on Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records) — the "adopt" entry that codified ADRs as industry practice.
