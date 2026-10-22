# QR Order agent instructions

This file is the always-on router for coding agents. Read only the linked context that applies to the current task.

## Context routing

- Repository architecture and dependency direction: `docs/architecture/README.md`
- Approved decisions and superseded approaches: `docs/decisions/README.md`
- Path-based checks and required evidence: `docs/verification/contracts.json`
- Harness maintenance and validation: `docs/harness/README.md`
- Past fixes and reusable lessons: search `docs/solutions/` by YAML frontmatter before debugging a documented area.
- Consumer API contract: start at `docs/specs/consumer-mvp-api-spec.md` only for Consumer API/session/order/SSE work.
- Multi-agent orchestration artifacts: use `.orchestra/README.md` only when the user requests orchestration or the work is high-risk enough to require independent review.

When sources conflict, follow this order: current user-approved decision, applicable `AGENTS.md`, approved decision record, current code/API contract, latest verification evidence, older plans or notes.

## QR Order Ownership Boundary

This project currently uses a frontend/backend ownership split.

- Default editable scope for agent work is frontend code, frontend docs, mocks, and tests.
- Do not edit backend files under `qrorder/src/**` unless the user explicitly asks for backend code changes in the current request.
- If a backend bug or suspicious backend contract is found during frontend work, report it as a backend handoff note instead of patching it.
- Backend files may be read for investigation, contract confirmation, and error explanation.
- Issue comments from backend maintainers should be treated as API contracts. Implement the frontend side of the contract first.
- If the contract says `/api/auth/me` returns `initPwdRequired`, frontend code should use `initPwdRequired`; do not rewire backend `init_yn` behavior without explicit permission.

When in doubt, ask: "Is backend modification allowed for this task?"

### Consumer Menu API Exception

- Backend changes are authorized only when the user explicitly requests implementation of the following three Consumer menu APIs:
  - `GET /api/consumer/menu/main`
  - `GET /api/consumer/menu/search`
  - `GET /api/consumer/menu/{menuSysId}`
- For those requests, add only the required Controller, DTO, Service, Mapper interface, Mapper XML, and test files.
- Do not modify existing shared/common code or the database schema while implementing these APIs.
- Do not extend this exception to Consumer cart, order, SSE, authentication, or other backend APIs without separate explicit permission from the user.

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
- Use sub-agents and multi-perspective review only when the user requests them or when they are necessary for high-risk work.

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
