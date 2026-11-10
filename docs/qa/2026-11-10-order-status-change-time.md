# 주문 상태 변경 시각 연결

## 원인과 변경 이유

- 기존 조회 SQL은 `modify_datetime as update_datetime`을 조회했으나 `StatusItem.Header`에 대응 필드가 없어 응답에서 누락됐다.
- 프론트는 `statusChangedAt`을 기다리고 있어 실제 API에서는 상태 이동 순서를 사용할 수 없었다.
- 기존 DB 시각을 사용해 새 컬럼과 브라우저별 로컬 시각 저장을 피했다.
- 상태 변경/되돌리기/취소 SQL은 이미 `modify_datetime = now()`를 저장한다.
- API에 `statusChangedAt`을 노출하고 소수점 6자리까지 보존한다. 같은 시각의 카드는 ID로 정렬해 응답 순서에 따른 차이를 없앤다.
- 이 시각은 표시/정렬 기준이며 동시 수정 충돌 방어는 기존 서버 상태 검사와 잠금이 담당한다.

## 계약 경로

| 경계 | 상태와 근거 |
|---|---|
| DB 제약 | 컬럼 추가 없음. 기존 modify_datetime 사용. 실제 DB 값 검증은 미수행 |
| Mapper | 조회 alias를 status_changed_at으로 연결, 기존 쓰기 시각 저장 확인 |
| DTO/JSON | LocalDateTime과 JSON 소수점 6자리 직렬화 테스트 |
| OpenAPI | DTO ModelConverters의 date-time 확인, 저장 명세 수동 동기화. 실행 서버 /v3/api-docs 비교는 미수행 |
| 생성 타입 | npm run generate로 생성, 직접 편집 없음 |
| 프론트 모델/응답 매퍼 | 공백을 T로 정규화, 누락 시각은 undefined 유지 |
| 요청 매퍼/serializer | 읽기 필드 추가이므로 변경 없음 |
| 계약 테스트 | SQL alias/DTO JSON/schema/프론트 매핑/동일 시각 정렬 검증 |
| dev:real | 미수행. 아래 시나리오 통과 전 실서버 통합 완료로 간주하지 않음 |

## 재현과 검증

- 수정 전: 백엔드 alias 테스트 1건 실패, 프론트 시각 정규화 테스트 1건 실패로 누락을 확인했다.
- 프론트 관련 3개 파일/29개 테스트 통과.
- 백엔드 StatusMapperXmlTest/StatusServiceTest/OrderManageControllerTest 통과. typecheck/lint 및 diff 검사 통과.
- 코드 생성 시 테이블 좌표 x/y 선언 순서도 재생성됐다. 타입 의미는 동일하다.

## 남은 수동 QA

1. 최신 백엔드를 실행하고 Client 두 창에서 같은 매장 주문현황을 연다.
2. A창에서 접수 → 조리 → 서빙 및 되돌리기를 실행한다.
3. search 응답 header.statusChangedAt과 DB modify_datetime을 비교한다.
4. B창 갱신/새로고침 후 같은 카드 순서로 수렴하는지 확인한다.
5. 생성 직후 변경 시각이 없는 주문을 임의 현재 시각으로 정렬하지 않는지 확인한다.

관련 소스: [DTO](../../qrorder/src/main/java/htms/QROrder/client/dto/StatusItem.java), [SQL](../../qrorder/src/main/resources/mapper/client/StatusMapper.xml), [응답 매퍼](../../frontend/src/apps/client/features/order-status-management/api/orderStatusBoardMapper.ts).
