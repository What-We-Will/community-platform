# ADR-0004 — router.push as default for filter and search URL updates

**Status:** Accepted 2026-05-31
**TL;DR:** Filter and search components default to `router.push(url, { scroll: false })`. Free-text search inputs use a hybrid: `router.replace` during the debounced typing window, `router.push` on the committed value (blur, Enter, form submit). Parallel `<Link>` UIs follow the same rule via the `replace` prop. The diagnostic test for reviewers: press Back from the resulting URL in your head and see whether the user lands where they expect.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

The project has three client-side filter components that update URL search params: `components/events/EventFilters.tsx`, `components/members/MemberFilters.tsx`, and `app/(app)/jobs/JobRoleFilter.tsx`. All three call `router.push` from `next/navigation` (Next.js 16, React 19). Only `JobRoleFilter` passes `{ scroll: false }`; the other two do not. The list pages themselves are Server Components that re-render on URL change.

Since 2026-04-24, three separate contributors have opened PRs proposing the same swap — `router.push` → `router.replace` on `MemberFilters` — each motivated by an open bug ticket about the search input:

- **#98** (`bug/member-search`, Apr 24): reviewed with changes requested. The review flagged that the PR also broke several local file-level patterns and that the divergence was producing additional bugs.
- **#141** (`fix/108-debounce-member-search`, May 21): argues for `router.replace` on UX grounds: "`router.push` records every change to the query params as a separate point in browser history."
- **#142** (`fix/member-search-url-sync`, May 21): touches the same component but does not swap to `replace`; adds a regression test instead.

The recurring proposal is itself the signal: the convention is not documented, and review alone has not been enough to settle it. Zero users in the project's backlog have reported back-button entrapment or history-pollution problems with the current `push`-based filters. The contributor pressure is the closest thing we have to a UX signal from the project's actual user base, and it points at a concern not yet validated by users.

Before drafting this ADR, we commissioned independent research across five sources against the same 15-scenario list: ChatGPT 5.5, two Gemini deep-research runs, Claude Code in-project, and Claude on the web. Effective independent voices: three (Gemini, ChatGPT, Claude), since two of the five are variants of the same underlying model. Nine of the fifteen scenarios reached actionable consensus (debounced free-text search, post-creation redirect, login/sign-out/onboarding-gate redirects, pagination, tabs, modal-as-URL-state, and the canonical hybrid for committed search). The **filter-chip default did not.** The split: two Gemini sources recommend `replace`; two Claude sources recommend `push`; ChatGPT recommends a per-click hybrid. All five sources cite the same Baymard study ([4 Design Patterns That Violate Back-Button UX Expectations](https://baymard.com/blog/back-button-expectations)) but read it two different ways — Gemini reads "Back should escape the filter context" (replace); Claude reads "Back should undo the last filter, not exit the page" (push). The ecosystem itself is split, and the project must pick a side.

Two production datapoints argue toward `push` for filters. First, [Vercel Commerce](https://github.com/vercel/commerce/blob/main/components/layout/search/filter/item.tsx) — the Vercel-owned reference implementation of a filter-driven list page in Next.js App Router — uses `<Link>` (push semantics) for filter items, not `<Link replace>`. Second, [vercel/next.js discussion #52012](https://github.com/vercel/next.js/discussions/52012) reports that `router.replace` with search-param-only changes can serve stale RSC data, requiring a `router.refresh()` workaround. No confirmed maintainer fix as of research date. `router.push` does not have this issue. Adopting `replace` for filters would either need a `router.refresh()` follow-up at every call site or a documented acceptance of occasionally-stale server data.

## Decision

We default to `router.push(url, { scroll: false })` for all filter and search URL updates. The user contract for a filter chip, dropdown, checkbox, sort control, or pagination link is *a refinement worth remembering* — when a user spends time narrowing a list, Back should undo the most recent refinement, not jump out of the filter context entirely. This matches the Baymard reading that all sources cite ("users perceive each filter as a distinct view"), it matches the Next.js ecosystem's most prominent reference implementation (Vercel Commerce), and it avoids the stale-RSC-data sharp edge documented in [vercel/next.js #52012](https://github.com/vercel/next.js/discussions/52012).

There is one carve-out. For free-text search inputs, the URL update during the debounced typing window uses `router.replace`; the **committed** value — when the user blurs the input, presses Enter, or submits the form — is promoted to `router.push`. The intermediate keystrokes are not navigation events the user would expect to find in their history; the final committed query is. This hybrid was unanimous across all five research sources. The committed `router.push` must call `clearTimeout(debounceTimer.current)` before invoking the router, or a late-firing debounced `replace` will clobber the committed `push`. This is the implementation hazard that surfaced during the #141 review and is named here so the implementer does not rediscover it.

`{ scroll: false }` is a required companion for all filter and search URL updates. Without it, every filter toggle would scroll the user to the top of the list — disruptive on the long list surfaces (`/members`, `/events`, `/jobs`).

Parallel `<Link>` UIs follow the same rule. A programmatic call site using `router.push` has a declarative equivalent of `<Link href="…">`; a programmatic call site using `router.replace` has `<Link replace href="…">`. Mixing `<Link href>` and `router.replace` in the same component for similar interactions is a code-review red flag — parallel APIs should follow parallel conventions.

For purely client-side state that does not require a Server Component re-fetch, prefer the native `window.history.pushState` / `replaceState` integration documented in Next.js's [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) page. None of the three current filter components qualify — all render server-side — but the option exists for future work.

The diagnostic test for contributors and reviewers, distilled across all five research sources:

> **Press Back from the resulting URL in your head. Does the user land where they expect?**
>
> - If yes — your choice is correct.
> - If they land somewhere broken (404), stale (form they already submitted), or somewhere they already passed (login screen they're logged in past), use `replace`.
> - If they land somewhere that "skips" a refinement they just made, use `push`.

The test works equally well for human reviewers and AI tools because it forces reasoning about user outcomes rather than method names.

## Alternatives considered

**Default `router.replace` for filter URL updates.** Backed by both Gemini research sources, the `nuqs` library default, and the Baymard reading that frames Back-button entrapment as filtering's documented failure mode. Rejected because: (a) the same Baymard study supports the opposite reading and is cited as such by both Claude sources; (b) Vercel Commerce — the Vercel-owned reference filter implementation — uses `push`; (c) `router.replace` with searchParams-only changes can serve stale RSC data per [vercel/next.js #52012](https://github.com/vercel/next.js/discussions/52012), requiring a `router.refresh()` workaround that `push` does not need; (d) the contributor pressure that prompted this ADR has not been backed by user reports — adopting `replace` to satisfy an unsourced UX concern, against a production reference and a real technical sharp edge, would invert the cost asymmetry.

**ChatGPT-style hybrid: `push` for deliberate user-click commits, `replace` for programmatic / auto-applied cleanup.** A more nuanced rule that distinguishes user-initiated URL changes from programmatic ones (default insertion, dependent-filter normalization, batched changes). Rejected because the "deliberate commit" vs "programmatic cleanup" boundary requires per-call human judgment, reintroducing exactly the per-PR debate this ADR exists to end. The simpler `push`-default + `replace`-on-debounced-search rule covers the same user-intent goal with one branch instead of many.

**Adopt `nuqs` for URL state.** `nuqs` (formerly `next-usequerystate`) is the de facto URL-state library in the Next.js ecosystem. Its defaults — `replace`, `shallow: true`, no scroll-to-top — only partially match our needs: `shallow: true` is wrong for server-rendered list pages and would need explicit `shallow: false` on every key. Deferred because (a) introducing a dependency to solve a three-component problem is overkill, (b) per ADR-0003 each new top-level dependency adds supply-chain audit cost, and (c) the defaults mismatch would require a project-level wrapper anyway. Revisit if URL state surface grows beyond filter components (shared list views, persisted table state, multi-step forms) or if a fourth filter pattern emerges.

**No convention; continue per-PR debate.** This is what we have done to date. Rejected because three independent contributors proposed the same `replace` swap in four weeks, and review alone did not prevent the second and third proposal. The ADR exists so the convention is discoverable by humans and AI tools before a PR is opened, not relitigated in review every time.

## Consequences

This convention was applied in PR #141 (`fix/108-debounce-member-search`, merged 2026-05-31), implemented largely by @GeorgeDover. An earlier revision of that PR proposed `router.replace` as the default for `MemberFilters`; it was brought into compliance before merge and shipped the hybrid instead — `router.replace` during the debounced typing window, `router.push` on the committed value via `onBlur`/`onKeyDown` commit handlers (commit `ec6aede`). @GeorgeDover's commits refactored the search input to an uncontrolled input plus ref to stop a re-render feedback loop (`5b598bb`), fixed the stale-`searchParams`-closure and missing-unmount-cleanup hazard named in the Decision (`383bb5b`), and brought over regression tests from the parallel #142 (`d52e7fe`). The committed-`push`-clobbered-by-late-`replace` hazard was closed by the `clearTimeout`-before-`router.push` discipline this ADR mandates.

`{ scroll: false }` compliance is partial. `MemberFilters` (since #141) and `JobRoleFilter` pass it; `EventFilters.tsx` still does not and needs the option added to its `router.push` call. This is a small follow-up PR, not part of the ADR.

If a future scenario forces `router.replace` with search params (the debounced-search-input intermediate is one such case today), be aware of [vercel/next.js #52012](https://github.com/vercel/next.js/discussions/52012). If server data is observed to be stale after a `router.replace`, the workaround is a follow-up `router.refresh()`. The debounced-search-input case has not exhibited stale-data symptoms in the current codebase, but the sharp edge is worth knowing about.

A pointer to this ADR should be added to `CLAUDE.md` so Claude-based contributors encounter the convention before opening a filter-related PR. Other AI tooling in the contributor toolchain (Cursor `.cursorrules`, Copilot `.github/copilot-instructions.md`, Aider `.aider.conf.yml`) needs parallel pointers — tracked in Open questions.

Broader navigation patterns in the codebase — auth redirects, sign-out, onboarding-gate, post-mutation redirects, real-time-driven client navigation — all currently use `router.push`. Research consensus on those scenarios is **unanimous `replace`**. They are out of scope for this ADR (filter and search only) but flagged as a follow-up ADR candidate.

The decision is mechanically reversible. The `push` ↔ `replace` swap is a one-line change at each call site. The asymmetric cost is on the UX side: re-teaching users habituated to one Back-button behavior is expensive. The asymmetry argues for getting it right now and not flipping again unless real user feedback forces it.

## Open questions

- Discoverability of this ADR for non-Claude AI tools in the contributor toolchain. `CLAUDE.md` covers Claude Code; Cursor, Copilot, and Aider each have their own conventions for project-level rules. A single canonical project rules file with pointers from the others may be cleaner than maintaining N parallel files.
- A lint rule or codemod to enforce `{ scroll: false }` on filter-context router calls. Two of the three current components drifted from passing it — manual discipline alone is not enough.
- Whether to formalize the broader navigation conventions (auth, sign-out, onboarding-gate, post-mutation, real-time, pagination, tabs, modal-as-URL-state) in one follow-up ADR or scenario-by-scenario as each becomes contentious. Research consensus is strong on most of these.
- Whether to revisit `nuqs` adoption when URL state grows beyond filter components, or if a fourth filter pattern emerges.
