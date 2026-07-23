# GitHub App token for Dependabot PR writes

**Status:** Draft 2026-07-21
**TL;DR:** Dependabot-triggered workflow runs get a read-only `GITHUB_TOKEN` that the `permissions:` key cannot escalate, so an org-owned GitHub App mints the short-lived token used to post triage comments and swap labels on Dependabot PRs.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

`docs/runbooks/validating-dependency-updates.md` defines a decision matrix for Dependabot PRs — which bumps are safe to merge on a green check, and which need a human to read a changelog first. `scripts/ci/classify-dependabot-pr.sh` implements that matrix and has worked correctly since it landed. The only missing piece was surfacing its verdict on the PR itself, as a comment plus a `ready to merge` / `status: needs-review` label, rather than requiring a maintainer to open the Actions log.

Every attempt to perform that write failed with `403 Resource not accessible by integration`. GitHub treats workflow runs triggered by Dependabot as if they were opened from a repository fork. For fork-context runs the `permissions:` key can only adjust *read* scopes — declaring `issues: write` has no effect. Three configurations were tried and all failed identically: a direct `pull_request` write with workflow- and job-level `permissions`, the same with `pull-requests: write` added, and a two-stage split where a `workflow_run`-triggered second workflow performed the write. The `workflow_run` escape hatch is documented for fork PRs but does not lift the Dependabot restriction, because the restriction follows Dependabot provenance rather than the triggering event.

Two repository settings bear on this. `Workflow permissions` is set to "Read repository contents and packages permissions", and "Send write tokens to workflows from pull requests" is disabled. The latter is the only documented lever that lets `permissions:` grant write on a fork-context run, and enabling it would grant write tokens to *every* fork and Dependabot PR workflow in the repository — the precise exposure ADR-0003 exists to prevent.

Empirical findings from this investigation, recorded because they are expensive to rediscover: on a Dependabot-triggered run, Actions secrets resolve to empty while Dependabot secrets are readable; `github.actor` and `github.triggering_actor` are both `dependabot[bot]`; and `actions/create-github-app-token` mints successfully on such runs, meaning the "Integration not found" failure reported upstream in that action's issue #235 does not reproduce here.

## Decision

We will perform Dependabot triage writes using a short-lived installation token minted by an organization-owned GitHub App, rather than `GITHUB_TOKEN`.

The App is `wwc-dependabot-triage`, owned by the `What-We-Will` organization, installed on `community-platform` only, holding exactly two repository permissions: Issues (read and write) and Pull requests (read and write). Its App ID and private key are stored as **repository Dependabot secrets** — not Actions secrets, which are unreachable from these runs. `actions/create-github-app-token` exchanges them for an installation token scoped to that App's permissions and valid for approximately one hour.

The minting step additionally declares `permission-issues: write` and `permission-pull-requests: write`. These cap the token in the workflow file rather than letting it inherit whatever the installation holds, so the ceiling is visible in a diff and enforced in two places. Requesting a permission the installation lacks fails the mint outright, which is preferred over minting a token that 403s later.

`GITHUB_TOKEN` in the triage job stays at `contents: read`; it is used only to check out the classifier script. All writes go through the App token. The `dependabot-triage.yml` workflow keeps its `pull_request` trigger and its `github.actor == 'dependabot[bot]'` job gate. The `workflow_run` second stage and the artifact handoff that existed only to feed it are removed.

## Alternatives considered

**Enable "Send write tokens to workflows from pull requests".** The one setting that makes `permissions:` grant write on Dependabot runs. Rejected: it applies repository-wide to every fork and Dependabot PR workflow, present and future, to fix one labeling job. It re-opens the exposure ADR-0003 was written to close.

**Set `Workflow permissions` to "Read and write permissions".** Broader still — changes the default token for every workflow rather than the one that needs it. Rejected for the same reason, with less justification.

**`pull_request_target` trigger.** GitHub's own troubleshooting documentation names this as the remedy for Dependabot write access, and it would work. Rejected because ADR-0003 prohibits the trigger repository-wide, by name, in both its hardening baseline and its Alternatives section. Our workflow does mitigate the specific footgun — it references no secrets and never checks out PR head — but arguing a per-file exception is exactly the re-litigation a bright-line rule exists to prevent. Narrowing that prohibition would require a superseding ADR, which is disproportionate to the benefit.

**`workflow_run` two-stage split.** Implemented and merged before being found not to work. The documented promise that a `workflow_run` workflow "is able to access secrets and write tokens, even if the previous workflow was not" is written about fork PRs; no GitHub documentation addresses `workflow_run` combined with Dependabot. Rejected on evidence: writes 403 identically.

**Fine-grained personal access token.** Functionally equivalent and simpler to set up — the same Dependabot secret, minus creating and installing an App. Rejected because personal access tokens are owned by a user account and, per GitHub's documentation, "become inactive if the user loses access to the resource." That makes org CI depend on one person's credential, with a silent failure mode. GitHub's own guidance is to use a GitHub App for organization-owned or long-lived integrations.

**Scheduled sweep of open Dependabot PRs.** A `schedule`-triggered workflow is not Dependabot-triggered, so it receives a normal token with no restriction and needs no credential at all. Rejected as disproportionate: `dependabot/fetch-metadata` requires a pull-request event, so the classification would have to be re-derived from PR titles and branch names, and verdicts would arrive on a polling delay instead of on push.

**Do nothing.** The classifier already prints its verdict in the job log; only the surfacing is missing. Recorded as a genuine option that was considered and declined — the runbook's value depends on the verdict being visible where the merge decision is made.

## Consequences

**Enabled.** Dependabot PRs carry a machine-readable triage verdict as a comment and a label, so the runbook's decision matrix is applied consistently rather than from memory. The posting logic is unchanged from what was already written; only the identity performing the write is different.

**Constrained.** `GITHUB_TOKEN` is no longer the only principal that can mutate this repository from CI. Any future audit of "what can write to this repo" must account for the App as well as the workflow token. The App's permissions are the ceiling on what any workflow using it can do, so they should stay at Issues and Pull requests and be widened only deliberately.

**New manual work.**

- The App's private key is now the highest-value secret in the CI surface. Anyone holding it can act as the App on this repository. It is stored in KeePass; it never enters the repository or a chat log. Rotation is generating a new key and updating one secret — there is no expiry forcing a schedule, which means rotation will not happen unless someone decides to do it.
- The App, its installation, and its permissions are configured in organization settings and are not defined in any file in this repository. Like the `Protect main` ruleset described in ADR-0003, this is out-of-band state that can drift from what the workflows assume, with no diff to review. The `permission-*` inputs on the minting step contain the widening half of that drift — broadening the App does not silently widen this workflow, because the token is capped in-file. The narrowing half is not contained: removing the App, uninstalling it from this repository, or revoking a permission still happens with no diff, and surfaces as a failed mint at the next Dependabot PR.
- Extending triage to a second repository means adding that repository to the existing App installation and moving the credentials to organization-level Dependabot secrets with a repository-access list. Pasting the key into each repository individually is the failure mode to avoid.

**Risks introduced.** A failure to mint the token, or a revoked installation, produces the same failure shape that made the original problem hard to diagnose: posting errors are logged as warnings rather than failing the job, so the run stays green while nothing is posted. Anyone verifying this feature should judge it by the PR's comment and labels, not by the job's status.

**Contributor workflow change.** None for contributors. Triage comments now appear authored by `wwc-dependabot-triage[bot]` rather than `github-actions[bot]`.

## Open questions

- **Private key rotation cadence.** No expiry forces one. Whether this joins the quarterly review that already covers the `ignore` list in `.github/dependabot.yml` and the SHA pins described in ADR-0003 is undecided.
- **Whether the App becomes the org's general CI write identity.** It is named for its function rather than this repository, which leaves that option open. Adding permissions to serve a second use case would widen the blast radius of the same key; a second App may be the better answer. Deferred until a second use case exists.
