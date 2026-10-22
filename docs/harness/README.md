# Codex harness

This repository keeps durable agent context in Git so a trusted clone receives the same project guidance without copying a user's `~/.codex` directory.

## Shared files

| Layer | Files | Purpose |
| --- | --- | --- |
| Always on | `AGENTS.md` | ownership, routing, invariants |
| Scoped | `frontend/AGENTS.md`, `qrorder/AGENTS.md` | stack/path-specific conventions |
| Maps | `docs/architecture/README.md` | components and contract flow |
| History | `docs/decisions/README.md`, `docs/solutions/**` | decisions, tradeoffs, past fixes |
| Guardrails | `docs/verification/contracts.json` | applicable checks and evidence |
| Roles | `.codex/agents/*.toml` | reusable read-only explorer/reviewer |
| Validation | `scripts/validate-codex-harness.mjs` | missing/drift/unsafe config checks |

## Bootstrap after clone

1. Mark the repository as trusted in Codex. Project `.codex/` files are ignored for untrusted projects.
2. Install the root tooling with `npm ci` and frontend dependencies with `npm ci --prefix frontend`.
3. Run `npm run harness:check`.
4. Add local secrets only from committed example files. Never commit the populated files.

## Intentionally not shared

The following remain user/organization decisions and are not set by this repository:

- model and service tier
- approval policy/sandbox/permission profile
- network allowlists and organization requirements
- `.codex/rules/*.rules` command decisions
- authentication tokens, DB/SSH credentials, IDE state, conversation memory

This boundary matters: instructions explain expected work, while permissions and rules enforce authority. A Git repository should not silently grant itself broader authority.

If the team later approves command rules, add them under `.codex/rules/`, include `match`/`not_match` examples, and verify them with `codex execpolicy check`. Review those rules separately from this documentation harness.

## Update workflow

1. Update the source-of-truth map/decision/contract instead of copying text into several files.
2. Keep each documentation file below 200 lines.
3. Run `npm run harness:check`.
4. Start a fresh Codex session and ask it to list loaded instruction sources.
5. Review the diff and confirm no local secret or permission choice was added.

## Portability limit

The tracked files reproduce project context, roles, and verification routing. They cannot reproduce user authentication, organization policy, installed executables, secrets, or runtime DB state. Those differences must remain explicit rather than being hidden in the repository.
