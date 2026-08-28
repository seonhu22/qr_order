# Consumer 세션 API 계약

> 상위 문서: [Consumer MVP API 명세](../consumer-mvp-api-spec.md)  
> 정책 근거: [Consumer MVP 정책 결정](./policy-decisions.md)  
> 구현 제약: DB 스키마를 변경하지 않는다.

## 역할

`GET /api/client/consumer/session`은 QR 진입 후 현재 브라우저의 Consumer 컨텍스트를 복구한다. 개인/기기를 식별하는 API가 아니며, 서버 세션과 DB 주문 상태로 매장/테이블/공유 방문 상태를 확인한다.

## 요청

```http
GET /api/client/consumer/session
Cookie: JSESSIONID=...
```

Path, Query, Body는 없다. `sysPlantCd`, `tableSysId`, `consumerSessionId`를 클라이언트에서 받지 않는다.

## 성공 모델

기존 설계 모델을 유지한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `consumerSessionId` | `string` | 같은 테이블 방문의 공유 식별자 |
| `status` | `'ACTIVE' \| 'CLOSED' \| 'EXPIRED'` | 방문 상태 |
| `sysPlantCd` | `string` | QR 세션 사업장 코드 |
| `storeName` | `string` | 매장명 |
| `tableSysId` | `string` | 테이블 식별자 |
| `tableName` | `string` | 테이블 이름 |
| `tableNum` | `integer` | 테이블 번호 |
| `tableQty` | `integer` | 수용 인원 |
| `startedAt` | `string` | `yyyy-MM-dd HH:mm:ss` |

```json
{
  "success": true,
  "data": {
    "consumerSessionId": "01K...",
    "status": "ACTIVE",
    "sysPlantCd": "PLANT001",
    "storeName": "맛나분식",
    "tableSysId": "01J...",
    "tableName": "내부 1번",
    "tableNum": 3,
    "tableQty": 4,
    "startedAt": "2026-08-27 10:20:30"
  }
}
```

## 상태와 HTTP

- 유효한 바인딩과 진행 중 방문: `200`, `status: ACTIVE`
- `payment_yn=Y` 반영 뒤 `order_master` 결제완료 상태가 확인된 방문: `200`, `status: CLOSED`
- 서버가 바인딩 기록은 확인했으나 5분 정책으로 만료: `200`, `status: EXPIRED`
- `JSESSIONID` 또는 유효한 QR 바인딩 자체가 없음: `401`
- 나머지 Consumer API는 `CLOSED` 또는 `EXPIRED`에서 `410`을 반환한다.

프런트는 API 상태를 화면 모델 `active | closed | expired | none`으로 변환한다. 백엔드 응답 필드와 값을 프런트 모델 때문에 변경하지 않는다.

## 5분 분리 정책

현재 전역 `server.servlet.session.timeout=1h`는 직원 로그인과 공유되므로 5분으로 변경하지 않는다.

- Consumer 바인딩에 `lastActivityAt`을 별도로 관리한다.
- 유효한 Consumer 조작에서 시간을 갱신한다.
- 주문이 없는 상태로 5분을 넘기면 `EXPIRED`다.
- 같은 공유 방문에 주문이 하나라도 있으면 5분 만료를 적용하지 않는다.
- HTTP 세션 자체가 끝나면 QR 재스캔을 요구한다.
- 재스캔 시 DB 결제 전 공유 방문이 있으면 같은 주문내역에 다시 연결한다.

## 공유 방문 식별

`order_master`는 한 테이블의 한 후결제 방문/정산 단위이며, `order_master.sys_id`를 `consumerSessionId`로 사용한다.

- QR 연결 또는 최초 `GET /session`에서 해당 테이블의 활성 master를 생성하거나 재사용한다.
- 결제 전 같은 테이블의 모든 `order_group`은 같은 master에 연결한다.
- 추가 주문은 활성 master를 재사용한다.
- 결제가 완료되면 master를 종료하고 이후 주문은 새 방문 master에 연결한다.
- `payment_yn=Y`는 결제 결과이며, 같은 처리에서 변경되는 master 결제완료 상태를 API 종료 판정 기준으로 삼는다.
- 같은 테이블에서 방문 시작이 동시에 처리돼도 트랜잭션과 잠금으로 master가 하나만 생기게 한다.
- 주문 없이 5분 만료된 빈 master는 활성 조회에서 제외하고 다음 방문에서 재사용하지 않는다.

빈 master의 만료 표시/정리는 기존 컬럼과 쿼리로 구현한다. 가능한 방법을 확인한 뒤에도 보장할 수 없을 때만 백엔드 담당자에게 스키마 변경을 요청한다.

기존 스키마로 이 생명주기를 안전하게 만들 수 없다면 DB를 직접 수정하지 않고 근거와 실패 시나리오를 정리해 백엔드 담당자에게 요청한다.

## QR API 연계

`GET /api/qr/{url}`의 기존 `QrConnectResponse` 모델은 변경하지 않는다. 성공 시 `qrTableInfo`를 만들고, 세션 API가 DB에서 공유 방문을 찾아 `ConsumerSessionResponse`로 조립한다.

## 보안

- 사업장/테이블은 `qrTableInfo`에서만 가져온다.
- DB에서 현재 사용 가능한 사업장/테이블인지 다시 확인한다.
- 다른 테이블의 방문 식별자를 요청으로 주입할 수 없게 한다.
- 외부 복사 QR 차단은 별도 정책이 확정되기 전까지 해결된 것으로 문서화하지 않는다.

## 테스트

- QR 성공 후 `ACTIVE` 응답
- 새로고침 후 같은 응답 복구
- 주문 전 5분 무활동 `EXPIRED`
- 주문 후 5분 경과에도 `ACTIVE`
- 결제완료 DB 상태에서 `CLOSED`
- 직원 로그인만 있는 세션은 `401`
- 다른 QR 재스캔과 무효 QR 실패 시 이전 Consumer 권한 제거
