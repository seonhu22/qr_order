# Client 직원호출 관리 화면 규약

> 경로: `/client/menu/info/staff-call`
> 화면: Client(매장) > 메뉴 > 메뉴 정보 관리 > 직원호출 관리

매장이 consumer 쪽 직원호출 칩에 노출할 항목을 설정하는 화면이다. 배경과 설계 결정은 [`decisions.md` ADR-035](../decisions.md#adr-035--client-직원호출-관리-화면을-추가한다) 참고.

## 화면 구성

- 검색 카드(`SearchFilterCard`): 호출명으로 목록을 필터링한다. dirty guard는 아래 §조회/초기화 참고.
- 편집 테이블(`StaffCallManagementTable`, `EditableDetailTable` 재사용): 호출코드/호출명/설명/선택방식/사용여부 컬럼과 행추가·행삭제·저장 버튼.
- 안내문구(`table.guideText`)는 카드 헤더 바로 아래 한 곳에만 둔다(사용여부 노출 조건 + 선택방식[단건/다건] 의미를 한 문장으로 합침). 테이블 아래쪽 `footnote`는 쓰지 않는다.
- 검색 결과가 없을 때는 `조회 결과가 없습니다.`, 검색 전 상태에서 행이 모두 삭제되면 `등록된 직원호출 항목이 없습니다.`를 표시한다(`order-history`/`payment-status`의 `hasSearched ? ... : ...` 관례와 동일).

## 마스터 없는 상세 테이블

이 화면은 마스터를 선택해 상세 목록을 보는 구조가 아니라, 매장당 하나뿐인 평평한 목록이다. `EditableDetailTable`은 원래 `selectedMaster`가 있어야 빈 상태를 벗어나는 컴포넌트라, 고정된 가짜 마스터 상수(`STAFF_CALL_MASTER = { id: 'staff-call' }`)를 항상 넘겨서 쓴다 — 화면에는 마스터 선택 UI가 없다.

## 컬럼과 저장 경계

| 컬럼 | 필드 | 실제 DB 컬럼 |
|---|---|---|
| 호출코드 | `callCd` | O (`call_cd`) — 신규 등록 시 `STAFF_CALL_TYPE`의 사용 중인 상세 코드만 허용 |
| 호출명 | `callNm` | O (`call_nm`) |
| 설명 | `description` | O (`description`) |
| 선택방식(단건/다건) | `singleYn`('Y'\|'N') | O (`single_yn`) — 값은 향후 공통코드 연동 예정, 지금은 고정 셀렉트 |
| 사용여부 | `useYn`('Y'\|'N') | **X** — UI만 보류 상태로 유지하며 저장하지 않음 |
| 표시 순서 | `ordNo` | **X** — 순서 이동은 보류하며 최초 등록순으로 고정 |

## 조회 / 초기화

dirty일 때 조회·초기화는 `useFilterDirtyCheck` + `ConfirmModal`을 거친다(menu-option과 동일 패턴). 초기화는 검색어와 `rows`(편집 내용)를 모두 `baseRows` 기준으로 되돌린다.

## 저장

조회는 `GET /api/client/staff-call/settings`, 저장은 `POST /api/client/staff-call/settings/save`를 사용한다. 서버는 Client 로그인 세션의 `sysPlantCd`를 적용하므로 프론트가 매장 코드를 선택하거나 전송하지 않는다. 저장 요청은 신규/수정/삭제 목록만 담고 `useYn`/`ordNo`는 제외한다.

서버는 호출코드 공통코드 유효성, 같은 매장 내 코드 중복, 수정/삭제 대상의 매장 소유권을 검증한다. 조회는 `insert_datetime asc, sys_id asc`로 고정해 최초 등록 항목을 맨 위에 표시한다. 설정 행을 삭제해도 과거 실제 호출 기록은 삭제하지 않는다.

`호출명`은 필수값이면서 다른 행과 중복되면 안 된다(trim 후 비교). 실패 사유에 따라 안내 문구가 다르다 — 빈값만: `빈값을 채워주세요.` / 중복: `중복된 호출명이 있습니다.` / 둘 다: 두 문구를 합쳐서 표시. `useDetailTableSaveFlow`의 `invalidValueMessage`가 문자열뿐 아니라 함수도 받도록 확장해 구현했다.

검증 실패 모달의 "확인"을 눌러야 셀 에러가 반영된다(`hasConfirmAction`이 true일 때만 `primaryAction={{ onClick: actions.confirmNotice }}`를 넘겨야 함 — `MenuManagementPage`와 동일 패턴).

## 메뉴 등록 시 주의

Client 사이드바에 새 메뉴를 추가하려면 `shared/menu/clientNavigation.ts`의 `CLIENT_MENUS_BY_SECTION`(fallback)뿐 아니라 **`src/mocks/handlers.ts`의 메뉴 카탈로그 mock 데이터도 같이 추가해야 실제 화면에 나타난다** — 자세한 이유는 ADR-035 참고.

## Consumer 호출/Client 알림 연동

- Consumer 항목의 원본은 `consumer_staff_call_setting`이다. `use_yn`/`ord_no`가 없으므로 모든 행을 노출하고 `insert_datetime`, `sys_id` 순으로 정렬한다.
- Consumer는 설정의 `callCd`와 수량 배열을 POST 한 번으로 보낸다. 서버는 현재 QR 방문이 활성 상태인지와 각 코드가 해당 매장 설정인지 확인한 뒤 한 트랜잭션으로 저장한다.
- 저장 커밋 뒤 `STAFF_CALLED`를 한 번 발행한다. payload는 `tableSysId`, `tableName`, `items(callCd/callName/quantity)`, `calledAt`이다.
- Client는 로그인 세션의 `sysPlantCd`로 정한 `/api/sse/client/subscribe`만 구독한다. 브라우저가 매장 코드를 URL로 선택하지 못한다.
- 배지/최근 토스트는 메모리 상태라 새로고침하면 초기화된다. 재연결은 최선 노력 방식이며 현재 DDL에 이벤트 ID/호출 묶음 ID가 없어 끊긴 동안의 replay는 보장하지 않는다.

## dev:real 수동 QA

1. 같은 매장의 Client와 활성 QR Consumer를 각각 연다.
2. Client Network에서 `/api/sse/client/subscribe`를 선택하고 EventStream 탭을 연다. 상태 열이 `200`이어도 EventStream에 이벤트가 계속 추가되면 연결은 정상이다.
3. Consumer에서 호출한 뒤 POST `/api/client/consumer/orders/staffcall/new`가 `200`인지 확인한다.
4. EventStream의 `STAFF_CALLED` Data에서 `tableName`, `items[].callName`, `quantity`를 확인한다.
5. Client 헤더 배지가 1 증가하고 테이블명/호출 항목 토스트가 보이는지 확인한다.
6. 벨 버튼을 누른 뒤 `aria-label`이 `미확인 직원호출 0건`으로 바뀌고 배지가 사라지는지 확인한다.
7. DB의 `consumer_staff_call`에 선택 항목별 행과 `read_yn = 'N'`이 저장됐는지 확인한다.

EventStream과 `aria-label`은 정상인데 배지만 보이지 않으면 SSE 문제가 아니라 헤더 배지 CSS를 확인한다.
