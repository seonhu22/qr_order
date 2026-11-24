# QR Order agent instructions

This file is the always-on router for coding agents. Read only the linked context that applies to the current task.

## Context routing

- Repository architecture and dependency direction: `docs/architecture/README.md`
- Approved decisions and superseded approaches: `docs/decisions/README.md`
- Path-based checks and required evidence: `docs/verification/contracts.json`
- Harness maintenance and validation: `docs/harness/README.md`
- Past fixes and reusable lessons: search `docs/solutions/` by YAML frontmatter before debugging a documented area.
- Consumer API contract: start at `docs/specs/consumer-mvp-api-spec.md` only for Consumer API/session/order/SSE work.

When sources conflict, follow this order: current user-approved decision, applicable `AGENTS.md`, approved decision record, current code/API contract, latest verification evidence, older plans or notes.

## Change Boundary

- Frontend and backend (`qrorder/src/**`) code may both be fixed when the fix stays inside the existing architecture: layer split, package layout, shared infrastructure, and dependency direction in `docs/architecture/README.md`.
- Stop and ask before changing architecture: new layers or modules, shared/common infrastructure, security/session configuration, build tooling, or the database schema.
- Never read, edit, print, or commit secret or local-environment files: `application-local.properties`, `.env*` with real values, private keys, tokens, or DB/SSH credentials. Use the committed `*.example` files as the reference.
- Issue comments from backend maintainers are API contracts. When the contract says `/api/auth/me` returns `initPwdRequired`, use that field; do not rewire backend `init_yn` behavior without explicit permission.

## Utility and Helper Reuse

- Before adding a local utility or helper function, search existing shared utilities, component-local utilities, and nearby feature helpers first.
- Use existing utilities when they already cover the behavior.
- If the same helper logic is needed in two or more places, consider moving it to a shared utility or a feature-local shared helper.
- Keep helpers local when the logic is tightly coupled to one component, one render shape, or one feature-specific data structure.
- Do not create a shared abstraction only to satisfy naming consistency; extract only when it removes real duplication or reduces future mistakes.

## Context and File Scope

- Start by reading only the files directly related to the current request.
- Do not broadly explore directories or documents whose relevance has not been established.
- Exclude unrelated work, completed tasks, and abandoned plans from earlier conversation context when making decisions for the current request.
- Preserve prior user decisions, project rules, security constraints, and other context that may conflict with or constrain the current request.
- Expand the reading scope only when required to verify dependencies, shared configuration, authentication or authorization boundaries, or data contracts.
- When expanding the scope, briefly state what needs to be verified and why.
- Parallel work runs as separate top-level sessions managed outside the repository (herdr). Do not spawn sub-agents or run multi-agent review unless the user asks for it in the current request.

## Verification

- Select checks from `docs/verification/contracts.json` based on changed paths and risk. Do not run every check by habit.
- Report commands run, pass/fail results, unexecuted manual gates, and changed files.
- Database migration and concurrency work is incomplete until its manual evidence is recorded; unit or XML-string tests do not replace PostgreSQL execution.
- Run `npm run harness:check` after changing agent instructions, architecture/decision indexes, verification contracts, or harness files.

## Documentation Length and Navigation

- Limit each newly created or substantially rewritten documentation file to 200 lines unless the user explicitly requests a longer document.
- If the content would exceed 200 lines, split it into focused documents and keep a short overview or index page that links to them.
- Before creating or substantially revising a specification, present every recommendation and proposed contract change to the user and wait for explicit approval.
- Do not write proposed decisions into project documents or Notion while they are still awaiting approval.
- Use `/` instead of the middle dot character as a separator in prose, headings, and labels.
- Use direct, natural, professional language. Avoid assistant self-reference, canned introductions, filler, excessive praise, and other AI-style phrasing.
- Keep approved project documentation synchronized with its Notion documentation hub.
- Prefer links to the source of truth over repeating the same contract, decision, example, or procedure in multiple documents.
- When adding, moving, renaming, or splitting documentation, proactively update relevant index pages and inbound/outbound links.
- Read the overview or index first, then follow only the links needed for the current task. Do not load every linked document by default.

## Documented Solutions

`docs/solutions/` contains past bug fixes and engineering guidance organized by category with searchable YAML frontmatter (`module`, `tags`, `problem_type`). It is relevant when implementing or debugging in documented areas.
