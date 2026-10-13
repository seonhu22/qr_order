# Verification guide

The machine-readable contracts are in [contracts.json](./contracts.json). They separate the requested outcome from the evidence required to call work complete.

## How to use

1. Match changed paths to every applicable contract.
2. Read only each contract's `required_context`.
3. Preserve every listed invariant.
4. Run the smallest relevant checks, then broaden only when risk/failure justifies it.
5. Report `required_evidence`, including checks not run and why.

Multiple contracts may apply. For example, a Consumer API change can require frontend, backend, API-contract, and database contracts.

## Evidence levels

| Evidence | Meaning |
| --- | --- |
| `changed_files` | reviewed diff/path list |
| `test_results` | exact commands and results |
| `contract_diff` | OpenAPI/generated output review |
| `manual_qa` | reproducible browser/Network scenario |
| `database_evidence` | dry-run/migration/query/rollback result from PostgreSQL |
| `concurrency_evidence` | two-session or equivalent real DB result |

Mock/unit tests can prove application logic but cannot substitute for `database_evidence` or `concurrency_evidence` when those are required.

## Maintenance

Run `npm run harness:check` after editing the contract. The checker validates structure, referenced repository paths, instruction size, and the absence of project-enforced permission settings.
