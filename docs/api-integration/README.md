# API 통합 문서

기능별 계약, 적용 순서와 QA 자료를 필요한 범위만 선택해서 읽는다.

## Client 주문 수정

| 목적 | 문서 |
| --- | --- |
| 확정 계약과 구현 순서 | [주문 수정 저장 구현 계획](../plans/2026-10-12-001-feat-client-order-revision-plan.md) |
| dev:real 통합 QA 순서와 진행 현황 | [주문 수정 통합 QA](../qa/2026-10-14-order-revision-integration-qa.md) |
| 조회/금액 정합성 검증 방법 | [PostgreSQL QA 안내](../sql/2026-10-13-order-revision-read-model-qa.md) |
| 롤백 전용 검증 SQL | [PostgreSQL QA SQL](../sql/2026-10-13-order-revision-read-model-qa.sql) |

### 적용 순서

1. 로컬/QA DB에서 dry-run SQL로 타입, 고아 데이터와 기존 객체 충돌을 확인한다.
2. DB를 백업한 뒤 주문 수정 migration을 적용한다.
3. 백엔드/프론트엔드를 같은 커밋 기준으로 실행한다.
4. QA SQL과 `dev:real` 수동 QA로 remove-only/add/mixed/replay/결제 경합을 확인한다.

### 관련 파일

- 적용: `qrorder/src/main/resources/db/migration/2026-10-12-client-order-revision.sql`
- 사전 검사: `qrorder/src/main/resources/db/migration/2026-10-12-client-order-revision-dry-run.sql`
- 복구: `qrorder/src/main/resources/db/migration/2026-10-12-client-order-revision-rollback.sql`

운영 DB에는 직접 적용하지 않는다. 실제 적용 전 백업/트랜잭션/복구 리허설 결과를 검토한다.
