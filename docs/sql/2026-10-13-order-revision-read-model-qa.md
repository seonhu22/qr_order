# 주문 수정 조회 정합성 PostgreSQL QA

실행 SQL: [2026-10-13-order-revision-read-model-qa.sql](./2026-10-13-order-revision-read-model-qa.sql)

## 목적

실제 PostgreSQL에서 제거된 메뉴가 주문현황/Consumer 주문/결제/정산/주문이력에서 제외되고,
원본 주문과 `payment_yn`은 유지되는지 확인한다.

## 사전 조건

- 주문 수정 migration 적용 완료
- 같은 매장에 접수/조리중 주문이 2건 이상 존재
- 그중 한 주문에는 메뉴가 2개 이상 존재
- 운영 DB가 아닌 로컬/QA DB 사용

## 실행

1. DBeaver에서 SQL 파일 전체를 한 번에 실행한다.
2. 중간 결과표를 확인한다.
3. 마지막 `ROLLBACK`이 성공했는지 확인한다.
4. 오류로 실행이 중단되었다면 같은 연결에서 즉시 `ROLLBACK;`을 실행한다.

## 기대 결과

- 부분 제거 주문: `removed_menu_count=1`, 살아있는 메뉴는 계속 표시
- 전체 제거 주문: `consumer_header_visible=false`
- 제거된 parent의 옵션은 표시 대상에서 제외되고 살아있는 parent 옵션은 유지
- 결제/주문이력 합계는 살아있는 메뉴만 포함
- `ORDER_REVISION` 취소 그룹: `cancel_count=1`, `cancel_amount=0`
- `payment_yn` 변경 없음
- 실행 후 QA용 revision/제거 이력/주문 상태 변경이 DB에 남지 않음

이 SQL은 Mapper 호출을 대신하는 데이터 계층 검증이다. 애플리케이션 통합 QA에서는 같은 시나리오로
Client 주문현황, Consumer 주문 상세, 결제내역, 정산, 주문이력 화면을 별도로 확인한다.
