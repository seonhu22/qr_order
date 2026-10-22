# Backend scope instructions

These instructions apply when Codex starts in `qrorder/`. Backend modification still requires the authorization described in the repository root `AGENTS.md`.

## Structure and contracts

- Java 17/Spring Boot 4 code is organized by domain under `src/main/java/htms/QROrder`.
- Keep the existing Controller/DTO/Service/Mapper interface/Mapper XML separation.
- Confirm request/response DTOs, status codes, session attributes, and error envelopes before changing a contract.
- Mapper interfaces and XML statements must change together. Check every read model affected by a persisted-state change, including order status, Consumer views, payment, history, and settlement where applicable.
- OpenAPI annotations are part of the frontend contract. Regenerate frontend types after API schema changes.

## Database safety

- Do not change schema without explicit authorization.
- For a schema change, provide migration, dry-run/preflight, rollback, DBeaver comments, and manual evidence requirements.
- Use a deterministic lock order shared with related transactions. Treat FK-bearing inserts as possible participants in the lock graph.
- Do not claim database concurrency or rollback behavior from mock/unit tests alone.
- Never commit `application-local.properties`, credentials, tokens, or private keys.

## Checks

- Focused test: `.\gradlew.bat test --tests <fully-qualified-test>` on Windows
- Full backend regression: `.\gradlew.bat test`
- On Unix CI: `./gradlew test`

Record any PostgreSQL/DBeaver verification that remains manual.
