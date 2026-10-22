# QR Order architecture map

Use this map to find the smallest relevant context. It describes current code boundaries, not proposed redesigns.

## Runtime map

```text
Browser
├── Admin app
├── Client app
└── Consumer app
        │ HTTP/SSE
        ▼
Spring Boot controllers
        ▼
Domain services/transactions
        ▼
MyBatis mapper interfaces/XML
        ▼
PostgreSQL
```

The frontend build is copied into Spring Boot static resources for production. Development uses Vite with either MSW (`dev:mock`) or the real backend (`dev:real`).

## Frontend

Root: `frontend/src`

| Area | Location | Responsibility |
| --- | --- | --- |
| Admin | `apps/admin` | system/tenant administration |
| Client | `apps/client` | store staff operations, orders, payment, staff calls |
| Consumer | `apps/consumer` | QR session, menu, cart, order, staff call |
| Shared | `shared` | cross-app API/auth/UI/menu utilities |
| Generated | `generated` | OpenAPI-derived transport client/types; do not hand-edit |
| Mock | `mocks` and feature `mock` folders | MSW-only scenarios |

Typical feature direction:

```text
page → feature hook/components → feature API mapper → generated HTTP client
                       └──────→ query/store state
```

Start at `frontend/AGENTS.md` for frontend conventions and checks.

## Backend

Root: `qrorder/src/main`

| Layer | Typical location | Responsibility |
| --- | --- | --- |
| Controller | `java/htms/QROrder/**/controller` | HTTP/session boundary and response contract |
| DTO/domain | `java/htms/QROrder/**/dto`, `domain` | transport/persistence shapes |
| Service | `java/htms/QROrder/**/service` | policy and transaction orchestration |
| Mapper interface | `java/htms/QROrder/**/repository` | persistence port |
| Mapper SQL | `resources/mapper/**` | PostgreSQL queries and row mapping |
| Migration assets | `resources/db/migration` | reviewed manual schema changes |

Start at `qrorder/AGENTS.md` before authorized backend work.

## Contract flow

```text
Backend DTO/OpenAPI annotations
→ GET /v3/api-docs
→ frontend/openapi.json
→ npm run generate
→ frontend/src/generated
→ feature-level mapping/UI
```

Generated code drift is checked in CI. A frontend feature should depend on generated transport types through a feature API boundary.

## Cross-cutting flows

- Consumer session/order policies: [Consumer API hub](../specs/consumer-mvp-api-spec.md)
- SSE behavior: [SSE guide](../guides/sse-guide.md)
- CI checks and secret handling: [CI policy](../../CI_POLICY.md)
- Past incidents and solutions: [`docs/solutions`](../solutions/)
- Approved decisions/superseded approaches: [decision index](../decisions/README.md)
- Required verification evidence: [verification guide](../verification/README.md)
