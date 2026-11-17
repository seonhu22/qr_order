# 실제 주문 QA / 주문번호 표시와 안전한 재개

기준일: 2026-11-17. [실제 서버 QA 실행 방법](../../frontend/docs/testing/real-server-qa.md).

## 실제 실행 결과

- 메뉴 추가 후 실행에서 매장/테이블/메뉴/주문 허용 검증과 Consumer 주문 POST 201까지 성공했다.
- Consumer 응답 주문번호는 `1`, Client는 [매퍼](../../frontend/src/apps/client/features/order-status-management/api/orderStatusBoardMapper.ts)에서 `0001`로 표시한다.
- 자동화는 `#1`을 찾았기 때문에 Client 카드를 찾지 못했다. 조리/서빙/결제 요청은 실행하지 않았다.
- 추가 조회의 로그인 POST는 30초 타임아웃이었다. 프론트 경유 연결 검사와 백엔드 8080 직접 GET도 5초 안에 응답하지 않았다.
- 서버 프로세스 존재와 API 정상 응답은 별개다. 무응답 원인은 아직 확정하지 않았으며 추가 업무 요청을 중단했다.
- 신규 주문을 반복 생성하거나 기존 주문을 자동 취소/삭제하지 않았다.

## 수정 근거와 방식

- [실행기](../../frontend/e2e-real/order-payment.ts): Client의 네 자리 표시 형식과 일치하도록 카드 선택을 수정하고 숫자 경계를 검사한다.
- 짧은 주문번호를 가진 독립 mock 응답을 추가했다. 수정 전 같은 카드 탐색 실패를 재현했다.
- 주문 생성 직후와 종료 시 `order-payment-sanitized.json`을 실제 파일로 저장한다. 기존 메모리 첨부만으로 남기던 방식보다 실패 후 ID 추적이 확실하다.
- 파일에는 실행 ID/주문 ID/진행 단계/차단 종류만 저장한다. 비밀번호/쿠키/QR URL은 저장하지 않는다.
- 기본 재실행은 기존 진행 주문이 있으면 여전히 중단한다.

## 기존 주문 재개 조건

재개는 실행 프로세스의 `QA_RESUME_ORDER_ID`로 명시한다. `.env.qa.local`을 자동 수정하거나 미완료 주문을 추측해 선택하지 않는다.

- 주문/결제 옵션이 활성이고 지정 ID가 ULID 형식이어야 한다.
- 실제 QR 매장/테이블이 승인된 설정과 일치해야 한다.
- 지정 ID가 현재 Consumer 방문의 주문 목록에 있어야 한다.
- 해당 테이블의 진행 주문은 정확히 하나이며 지정 ID의 접수 상태여야 한다.
- 메뉴명/수량 1/옵션 없음이 테스트 설정과 일치해야 한다.
- 재개 시 신규 주문 POST는 실행하지 않는다. 조리/서빙/결제는 기존 생성 ID 범위만 허용한다.
- 다른 ID/다른 방문/이미 변경된 상태/여러 주문이면 쓰기 전에 중단한다.

## 검증과 남은 일

- 회귀 대상: [실행기](../../frontend/e2e/real-qa-harness.spec.ts), [Client 흐름](../../frontend/e2e/client-operations.spec.ts), [Consumer 흐름](../../frontend/e2e/consumer-order.spec.ts).
- 재개 테스트 초안은 Client fixture 수량 2/Consumer 생성 수량 1의 불일치로 차단됐다. fixture를 같은 주문 수량으로 맞췄으며 실제 범위 검사는 완화하지 않았다.
- 공유 fixture의 결제 데이터를 실행마다 복제해 테스트 간 변경 누출도 방지한다.
- `npx playwright test e2e/real-qa-harness.spec.ts e2e/client-operations.spec.ts e2e/consumer-order.spec.ts`: Chromium 12개 통과/2.1분.
- `npm run test:e2e:typecheck`와 `npm run lint` 통과. 제품 API/DB 스키마 변경은 없다.
- 실제 서버 조리/서빙/결제/Consumer CLOSED는 아직 검증하지 못했다.
- 서버 응답 복구 후 생성된 기존 주문 ID를 확인하고 재개해야 한다. 새 주문을 만들기 전에 기존 주문부터 확인한다.
