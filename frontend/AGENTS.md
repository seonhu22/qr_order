# Frontend scope instructions

These instructions apply when Codex starts in `frontend/`. The repository root `AGENTS.md` still supplies ownership and documentation rules.

## Structure

- React 19/Vite code lives under `src/apps/{admin,client,consumer}` and shared code under `src/shared`.
- Keep pages thin. Put domain UI, hooks, API mapping, types, constants, mocks, and utilities in the nearest feature.
- `frontend/src/apps/client/` follows the same feature split as `apps/admin/`; use `apps/admin/features/access-log/` as a nearby example when relevant.
- Place tests next to the target as `.test.ts` or `.test.tsx`.
- Reuse existing shared/feature helpers before adding a new helper. Extract only real duplication.

## API and generated code

- Treat backend endpoints/OpenAPI as the contract. Map generated DTOs at the feature API boundary rather than leaking transport shapes into UI state.
- Do not hand-edit `src/generated/**`. Update `openapi.json`, run `npm run generate`, and review generated drift.
- Use `npm run dev:mock` for MSW behavior and `npm run dev:real` for real backend integration. A mock pass does not prove real API integration.
- Preserve server identifiers and local draft identifiers as separate fields when both exist.

## Checks

- Focused behavior: `npm test -- --run <related-test-files>`
- Types: `npm run typecheck`
- Lint: `npm run lint`
- Production integration: `npm run build`
- Generated contract: `npm run generate` followed by a clean diff review of `src/generated/**`

Choose the smallest relevant set first, then broaden when the change or a failure justifies it.
