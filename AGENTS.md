# Apnea.si Agent Instructions

Last updated: August 12, 2026

This file is the Codex-facing entry point for the Apnea.si website repo.

Read `CLAUDE.md` too. `AGENTS.md` and `CLAUDE.md` are equal-authority companion entry
points for Codex and Claude Code.

## Agent Instruction Parity

- Keep every same-scope `AGENTS.md` and `CLAUDE.md` pair equivalent.
- When changing either file, inspect and update its counterpart in the same change.
- Never commit a one-sided instruction change that would make Codex and Claude Code
  receive different project rules.
- When adding a nested agent-instruction file, add the matching counterpart at the same
  scope unless the tool cannot read that filename.
- Put detailed shared workflows in linked guide files where possible, then link those
  guides from both entry points to reduce duplication and drift.
- Treat `agent-guides/` as part of the implementation. Whenever tools, permissions,
  schemas, routes, environment variables, business workflows, or safety boundaries
  change, update the affected guides in the same change.
- Before committing, check that documented setup status and commands still match the
  actual repository and connected tools.

## Samo Support Mode

Samo is the business owner, not a developer or systems specialist. When helping him:

- Lead the workflow instead of expecting him to know which tool, file, or command to use.
- Explain the current state and the next action in plain language.
- Perform safe, discoverable technical work directly when tools allow it.
- Teach enough for Samo to understand the result, without making him operate the
  underlying infrastructure manually.
- Ask focused questions about business facts only when the answer cannot be discovered.
- Do not send routine implementation choices, troubleshooting, or reversible edits back
  to Neža. Investigate and handle those directly.
- Ask Neža only for genuine owner/developer decisions: business policy, pricing strategy,
  legal/accounting treatment, permissions or secrets, architecture, irreversible
  production changes, or ambiguous changes with meaningful customer/SEO/payment impact.
- If blocked by a Neža decision, explain exactly what decision is needed, why it matters,
  and what the safe default is.
- For website copy, avoid inefficient word-by-word editing across many messages. Suggest
  reviewing one complete page, section, or topic at a time. Gather Samo's goals and
  corrections, inspect the existing copy, propose a coherent revised version, and apply
  the approved batch together.

If helping Samo or Katarina operate the site via Claude Code / Codex, also read:

- `agent-guides/README.md`
- `agent-guides/sanity-content-editing.md` for Sanity content updates
- `agent-guides/stripe-operations.md` for payments
- `agent-guides/brevo-operations.md` for contacts, lists, and email
- `agent-guides/website-code.md` for code changes
- `agent-guides/mcp-setup.md` for MCP connections

Important: Samo/Katarina may have Admin access in Sanity because the current plan lacks
granular roles. Treat that as content-editor-only access unless Neža explicitly says
otherwise.

Launch payment scope: public course and gift-voucher flows are manual signup /
povpraševanje plus manual invoicing. Stripe is public only for training memberships.
Dormant course/voucher payment code remains in the repo for possible later reuse, but
do not expose it unless Neža explicitly changes the launch scope.

## Production Push Safety

The `main` branch deploys this website directly to production.

- Never push commits directly to `main`. GitHub requires a pull request and a successful
  `Vercel` status check for every production change.
- Work on a separate branch. A local commit is allowed, but pushing the branch and
  opening the PR requires the release gate below.
- Before pushing the branch, verify the affected behavior on localhost and run the
  relevant checks from `agent-guides/website-code.md`. If localhost verification is
  unavailable, incomplete, or intentionally skipped, obtain the user's explicit
  confirmation that the branch may be pushed without that check.
- Show the user what changed and report the verification result before asking for or
  acting on push approval.
- A general request to edit, fix, or implement something is not permission to push it.
  A direct request such as `git push`, `push this`, or an explicit approval after the
  change summary is permission, subject to the verification rule above.
- Use the PR's Vercel preview for the final visual/flow review. Merge the PR only after
  the `Vercel` check passes and the user explicitly approves the production merge.
- After the PR is merged, update the submodule pointer in the parent Apnea.si hub. The
  hub push does not deploy the website, but still requires a direct request or approval.
