# 프론트엔드 완료 기록

TODO에서 완료된 작업을 옮겨 놓는 인덱스다. 상세 원인과 검증 과정은 연결된 QA/해결 문서를 기준으로 확인한다.

## 2026-11-06

### 초기 JavaScript 번들 분할

- 결과: Client/Admin 페이지를 지연 로드하고 개발 가이드를 운영 번들에서 제외했다.
- 측정: 초기 JavaScript 청크 `1,072.54kB → 423.90kB`, 500kB 경고 제거
- 검증: typecheck, lint, build, 전체 142개 파일/612개 테스트와 `/dev/modal`, `/dev/table` 브라우저 QA 통과
- 커밋: `e97c243e`, `60d83fd6`
- 상세: [중첩 개발 라우트 직접 진입 시 빈 화면](../../docs/solutions/ui-bugs/nested-dev-route-empty-root-2026-11-06.md)

## 2026-11-05

### 주문 수정 통합 QA

- 결과: QA-1부터 QA-11까지 PostgreSQL 롤백, 동시 요청 충돌 방어, 핵심 회귀 검증 완료
- 상세: [주문 수정 통합 QA](../../docs/qa/2026-10-14-order-revision-integration-qa.md#진행-현황)

### Consumer 주문내역 배지

- 결과: 메뉴 수량이 아니라 접수/조리중/서빙완료 주문 건수를 표시하며 취소/종료 주문은 제외한다.
- 검증: 관련 2개 파일/5개 테스트, typecheck, lint, build와 `dev:real` 수동 QA 통과

### 주문 수정 오프라인 저장 UX

- 결과: 오프라인 저장을 즉시 안내하고 자동 재전송을 막으며 동일 `clientRequestId`로 사용자가 다시 저장하게 했다.
- 검증: 관련 2개 파일/8개 테스트, typecheck, lint, build와 `dev:real` 수동 QA 통과
- 상세: [오프라인 mutation 자동 재개 해결](../../docs/solutions/ui-bugs/order-revision-offline-mutation-auto-resume-2026-11-05.md)

### 결제/미결제 API 오류 표시

- 결과: 결제완료 영수증과 미결제 입력 모달에 API 오류 안내를 복원했다.
- 검증: 관련 3개 파일/18개 테스트, typecheck, lint, build와 `dev:real` 수동 QA 통과

### 옵션 항목 행 추가 빈 화면

- 결과: 렌더링 중 payload 숫자 변환을 제거하고 저장 시점에만 입력값을 검증한다.
- 검증: 관련 2개 파일/15개 테스트, typecheck, lint, build와 Consumer 반영 수동 QA 통과
- 상세: [옵션 관리 렌더링 검증 오류 해결](../../docs/solutions/runtime-errors/client-menu-option-render-dirty-validation-blank-screen-2026-10-22.md)
