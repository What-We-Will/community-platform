# Working in this repo

Read [AI_POLICY.md](AI_POLICY.md) first — it's binding, not optional. The rules below operationalize it; if anything here seems to conflict, AI_POLICY.md wins.

## Hard rules (from AI_POLICY.md)

- Never run `git push --force`/`--force-with-lease`, rewrite history (rebase, amend a pushed commit, `filter-branch`), or resolve a merge conflict without the user explicitly reviewing and confirming the result first.
- Never run `gh` CLI commands or any GitHub API/MCP tool to read or act on issues, PR comments, or repo history. Use only the local git history/diff and whatever the user pastes directly into the conversation. (`gh` is blocked outright in `.claude/settings.json`.)
- Never read `.env*` files or anything else outside the local clone — no credentials, no production data, no other contributor's personal info.
- Only add a `Co-Authored-By: <AI>` commit trailer if the commit is genuinely unedited AI output — strip it for anything meaningfully edited or reviewed by a human.

## Testing

- This project uses **Vitest**, not Jest — see `vitest.config.ts`. Tests are colocated next to source (`*.test.ts(x)`), not in a separate root test directory.
- Follow [TESTING_STANDARDS.preamble.md](TESTING_STANDARDS.preamble.md) and its companion docs.
- `vi.mock()` factories are hoisted above top-level `const`s. If a test needs a typed mock reference rather than an untyped variadic wrapper, declare it with `vi.hoisted(() => vi.fn<...>())` — a bare `const x = vi.fn()` referenced directly inside `vi.mock()` throws a temporal-dead-zone error.

## Conventions

- Commits: `type(scope): concise summary`, single-line subject — most commits in this repo don't carry a body (check `git log` for examples before adding one).
- Branches: `type/<issue-number>-short-description`.
- Check `.github/dependabot.yml` before adding a dependency — its comments explain which packages are version-locked into groups (react, next, radix-ui, etc.).
