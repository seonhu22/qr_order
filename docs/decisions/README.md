# Decision and history index

This index routes agents to the reason behind current behavior. It does not replace the linked source of truth.

| Area | Current decision | Source | Status |
| --- | --- | --- | --- |
| Ownership | Frontend is the default editable scope; backend/schema work needs explicit authorization | [Root instructions](../../AGENTS.md) | active |
| Consumer session/order | `order_master` is the visit boundary; status/locking/API constraints are shared across order/payment flows | [Session/order hardening](../solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md) | active |
| Consumer product policy | table inactive, session status, QR participation and deferred PIN behavior | [Consumer policy decisions](../specs/consumer-mvp/policy-decisions.md) | active |
| Consumer menu rollout | backend/frontend branches and generated contract rollout remain separate reviewable units | [Branch separation](../solutions/workflow-issues/consumer-menu-backend-frontend-branch-separation-2026-08-24.md) | active |
| Frontend/API merge | preserve API contracts while accepting frontend design/refactoring changes | [Design merge contract](../solutions/integration-issues/preserve-api-contracts-during-frontend-design-merge-2026-10-07.md) | active |
| SSE | HTTP remains the source of truth; explicit reconnect/fallback behavior is verified separately | [Consumer SSE solution](../solutions/integration-issues/consumer-sse-explicit-eventsource-reconnect-2026-09-15.md) | active |
| Staff calls | master/child grouping defines one notification row and read state | [Staff-call master contract](../solutions/integration-issues/staff-call-master-grouped-notification-contract-2026-09-29.md) | active |
| Legacy order change | Existing `change_order` semantics must not be treated as a general menu revision contract | [Staff-call/read plan note](../plans/2026-10-07-001-feat-staff-call-individual-read-plan.md) | superseded for menu revision |

## Adding a decision

Record a decision only after user/team approval. Prefer updating an existing source when it already owns the policy. Add a focused ADR or solution when the decision introduces a durable tradeoff, rejected alternative, or migration consequence, then link it here.

Use these statuses consistently: `proposed`, `active`, `superseded`, `retired`. Proposed decisions must not be presented as implemented behavior.
