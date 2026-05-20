# ADR-NNNN — [Short title in sentence case]

**Status:** Draft YYYY-MM-DD
**TL;DR:** [One sentence by default; up to three when the decision has multiple parallel parts. State the decision, in plain language. A volunteer reading on a Saturday should know in 10 seconds whether this affects their PR.]
**Author:** @username
**Sponsoring Lead:** @username

<!--
FILE NAME

Save this file as `docs/adr/NNNN-kebab-case-title.md`, where:
  - NNNN is the next available 4-digit number, zero-padded (0001, 0002, …, 0042).
  - kebab-case-title is a short, lowercase, hyphen-separated slug of the title.
    Aim for 3–6 words. Drop articles ("the", "a"), drop "use" / "adopt" / "we"
    where it doesn't change meaning.

Examples:
  docs/adr/0001-supabase-vault-for-survey-keys.md
  docs/adr/0002-rls-fixtures-via-seed-id.md
  docs/adr/0003-jitsi-for-video.md

Numbers are permanent. If an ADR is superseded, the old file keeps its number
and gains a "Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)" status line;
the new ADR takes the next unused number. Numbers are never reused.

HEADER FIELDS

Status:
  - "Draft YYYY-MM-DD" while the author is still scribbling and not yet ready
    for sponsorship review. Draft lives on a branch or fork — do not land
    Draft on main. Open the PR when flipping to Proposed.
  - "Proposed YYYY-MM-DD" once the ADR is open for lead review (in PR).
  - "Accepted YYYY-MM-DD" when the decision is accepted. For new ADRs, this is
    usually the merge date. For retroactive ADRs, this is the implementing PR's
    merge date or a documented sign-off, whichever came first.
  - "Rejected YYYY-MM-DD" when the proposal is reviewed and not adopted. Merge
    with this status when the debate is worth preserving as a record; otherwise
    close the PR without merging.
  - "Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)" when a later ADR replaces
    this one.
  - "Deprecated YYYY-MM-DD" when no longer applies and there is no replacement.
    (Rare; usually decisions get superseded, not deprecated.)

TL;DR: One sentence by default; up to three when the decision has multiple
  parallel parts (e.g., several adoptions plus a deferral). Plain language.
  Lead with what's adopted; state the decision, not the reasoning. Defer
  rationale to Context and Decision.

Author: Whoever drafted the ADR. Can be a volunteer or a lead. Authorship is
  not erased when a Sponsoring Lead attaches their name.

Sponsoring Lead: A platform lead who has attached their name to this ADR.
  This is the permanent record contact — the person a future contributor or
  lead asks "why did we decide this?" years from now. The role stays with the
  same lead when they rotate between project areas. Reassign only when the
  original sponsor is no longer an appropriate project contact.

  A volunteer proposing an ADR may leave this field with the @username
  placeholder; one of the three platform leads will fill in their name
  during PR review. Do not delete the line.

Before merging, strip ALL HTML comments from this file — including this top
block and the comments inside each body section. They are authoring
scaffolding, not part of the decision record. The merged ADR should be
prose only.

After an ADR is merged as `Accepted`, the only allowed edits are status
transitions, non-substantive corrections such as typos or broken links, or
metadata corrections that do not change the decision record. For substantive
changes, write a new ADR that supersedes this one.
-->

## Context

<!--
What's the situation that requires a decision? What forces are at play —
technical constraints, organizational constraints, contributor reality?
Be specific. Future readers will not have the context you have today.

Aim for 2–4 paragraphs. Don't editorialize; describe the situation.
-->

## Decision

<!--
What did we decide? State it in one or two sentences at the top, then
elaborate as needed.

Use active voice: "We will use X" not "It was decided that X might be used."

Free-form prose. This is not a prescribed action list — implementation
steps belong in Consequences or a separate runbook.
-->

## Alternatives considered

<!--
What other options were on the table, and why were they rejected?

Be honest — "we didn't have time to evaluate Y" is a valid rejection reason
and worth recording. Future readers may have time to revisit.

For each alternative: 1–3 sentences describing it, then 1–2 sentences on
why it wasn't chosen.

This is the highest-value section for future readers. Don't skimp.
-->

## Consequences

<!--
What does this decision make true? Both the good (what we gain) and the
bad (what we now have to live with).

Include:
- What this enables.
- What this constrains.
- New work this creates (e.g. "we now need a migration to backfill X").
- Risks introduced.

If the decision changes contributor workflow (e.g. "from now on, run X
before pushing"), say so explicitly here so volunteers don't miss it.

Be honest about the tradeoffs. This is the section future leads will
read most carefully.
-->

## Open questions

<!--
Optional. Things we deliberately deferred, or aspects of the decision we're
not yet sure about. If there are none, delete this section.
-->
