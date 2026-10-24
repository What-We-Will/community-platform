# AI Use Policy

Welcome! We are open to the use of AI tools so everyone can contribute effectively regardless of experience level. This policy exists in an effort to reduce technical risks for our contributors, and hopefully reduce downtime for our members, not to overly restrict or police the tools used.

**Mistakes happen:** If you make a mistake involving an AI tool such as: accidentally sharing sensitive data, pasting the wrong thing, or leaking PII, please report it immediately. Mistakes happen, reporting them makes us all more aware & mindful in the future. After a report, appropriate steps will be taken to rotate keys, alert affected individuals, and enhance AI use guidelines. We all make mistakes, acknowledging them and learning from them is what we care about!

**How to report a breach:** The best way is to DM a maintainer or mod via Slack. If you're not a member of our Slack, please open a Github issue titled `AI breach: <short description>` (e.g. `AI breach: pasted an API key into ChatGPT`) and request a mod or maintainer review.
 
---

## Pull request policy
Disclose AI use in the **PR description**; the most transparent place for reviewers to see it. Flag any part of the change that's fully AI-generated so reviewers know where to look closer.

Only add an AI co-author trailer (e.g. `Co-Authored-By: Claude ...`) to a commit if the AI wrote it with no significant edits from you. If your tool adds this trailer automatically, remove it unless the commit meets this bar. This is to prevent conflating the same level of risk between AI-assisted and AI-authored work - the latter should obviously be subject to more scrutiny.

---

## Pre-approved AI tools & agents

- **Cursor** (pre-configured via `.cursorignore` and `.cursor/rules/`)
- **Claude Code** (pre-configured via `.claude/settings.json` and `CLAUDE.md`)

Both tools are set up to automatically follow [CLAUDE.md](CLAUDE.md), which restates this policy's hard rules plus repo conventions.

We can't cover every AI tool that emerges, so please ask before using a tool not listed above. Different tools have different data retention and privacy policies, and we want to understand the policies of each tool in use. Please open an issue on Github or reach out via slack to a mod or maintainer for tool evaluation and sign off.

Note: Feel free to use whichever IDE or text editor you prefer! The above tools are merely a reference to which AI tool suites we recommend because we have setup rules in the repo for those tools. If you use another tool, please try to mirror the same guidance here and in `CLAUDE.md` for your preferred tool if possible.

---

## Tasks that AI tools are generally helpful for:
- Generating boilerplate, scaffolding, and repetitive code
- Writing and improving tests (follow the [testing standards](TESTING_STANDARDS.preamble.md))
- Documentation and code comments
- Refactoring non-sensitive code
- Debugging pesky logic errors
- UI/UX work unrelated to auth, though often a human touch is preferred. 
- Understanding unfamiliar parts of the codebase
- Getting unstuck after you've spun your wheels for a while

---

## Areas that need a human eye
- Auth-related code
- Database schema and migrations (especially RLS policies)
- API routes — check for input validation and access control
- Any code that touches user profile data

This isn't about distrust — it's because these areas have the highest impact if something goes wrong, and another pair of eyes can catch things AI tools may miss.

---

## Please don't
- Feed real user data into any AI tool, even to debug a problem. Use anonymized or synthetic data instead.
- Use AI tools connected to production credentials or the production Supabase project.
- Ask AI tools to design or implement new member verification logic independently — that feature will need a dedicated review process when we get there.
- Use AI-generated security audits as a substitute for human review. AI is a great assistant here, not a replacement.

---

## Keeping secrets safe

- When in doubt about what an AI tool should see, default to the minimum needed for the task — never expose contributors' or users' private or personal information beyond that.
- Never paste `.env` contents, API keys, or credentials into an AI chat.
- The `.cursorignore` and `.claude/settings.json` configs in this repo are there to help you — please don't remove or weaken them.

We will use separate Supabase projects for dev/staging/production. As a volunteer, you should only ever need the dev and staging credentials. If someone asks you to use production credentials, please check in with a maintainer or mod before proceeding. 

---

## AI Use across Git & GitHub

Everyday git commands to your personal branch (status, diff, add, commit, push, pull) are fine to run through an AI tool as long as you review and approve each action yourself.

**Never let an AI tool do these unsupervised and always review the result yourself first:**
- Any `--force` operation (`push --force`, `push --force-with-lease`, etc.)
- Rewriting history (rebase, amending already-pushed commits, `filter-branch`, etc.)
- Resolving merge conflicts

**Don't connect an AI tool directly to GitHub's API, MCP integrations, or web UI** to read or act on repo data on its own — issues, PR/review comments, history, merges, etc. AI tools should only see your local clone (files, `git log`/`diff`) and whatever you explicitly paste in (e.g. "here's the text of the issue I'm working on") — not the AI going and looking it up itself, which can pull in unrelated issues or other people's data along the way. Likewise, do GitHub-side actions (opening issues/PRs, commenting, merging) yourself rather than letting a tool automate them.

This is enforced, not just requested: `.claude/settings.json` blocks the `gh` CLI outright.

---

## Questions?

Ask via slack open a Github issue, no question is too basic, we're all learning this together!

*This policy is a living document. Suggestions welcome via PR.*
