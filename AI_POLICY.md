# AI Use Policy

Welcome! We are open to the use of AI tools so everyone can contribute effectively regardless of experience level. This policy exists in an effort to reduce technical risks for our contributors, and hopefully refuce downtime for our members, not to overly restrict or police the tools used.

**Mistakes happen:** If you make a mistake involving an AI tool such as: accidentally sharing sensitive data, pasting the wrong thing, or leaking PII, please report it immediately. Mistakes happen, reporting them makes us all more aware & mindful in the future. After a report, appropriate steps will be taken to rotate keys, alert affected individuals, and enhance AI use guidelines. We all make mistakes, acknowledging them and learning from them is what we care about!

**How to report a breach:** The best way to is to DM a maintainer or mod via Slack. If you're not a member of our Slack, please open Github issue titled "AI breach" : "context" and request a mod or maintainer review.
 
---

## Pull request policy
Disclose the AI tools used, and to what degree. 

---

## Approved tools

- **Cursor** (with pre-configured `.cursorignore`)
- **Claude Code** (with pre-configured `.claude/settings.json`)

We can't cover every AI tool that emerges, so please request approval for use before using a tool not listed above.Different tools have different data retention and privacy policies, and we want to understand the policies of each tool in use. Please open an issue on Github or reach out via slack to a mod or maintainer for tool evaluation and sign off!

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

- Never paste `.env` contents, API keys, or credentials into an AI chat.
- The `.cursorignore` and `.claude/settings.json` configs in this repo are there to help you — please don't remove or weaken them.

We will use separate Supabase projects for dev/staging/production. As a volunteer, you should only ever need the dev and staging credentials. If someone asks you to use production credentials, please check in with a maintainer or mod before proceeding. 

---

## AI Use across Git & Github
- NEVER give an AI tool direct access to the Github repository. No AI agentes are allowed in Github or allowed to automate anything related to Github.

- Avoid letting AI tools run git commands. Using them to generate a commit message is a-ok, but allow-listing git commands can cause significant setbacks to the repo and platform as a whole. 

---

## Questions?

Ask via slack open a Github issue, no question is too basic, we're all learning this together!

*This policy is a living document. Suggestions welcome via PR.*
