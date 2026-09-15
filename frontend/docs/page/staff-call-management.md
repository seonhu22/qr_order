# Client 직원호출 관리 화면 규약

> 경로: `/client/menu/info/staff-call`
> 화면: Client(매장) > 메뉴 > 메뉴 정보 관리 > 직원호출 관리

매장이 consumer 쪽 직원호출 칩에 노출할 항목을 설정하는 화면이다. 배경과 설계 결정은 [`decisions.md` ADR-035](../decisions.md#adr-035--client-직원호출-관리-화면을-추가한다) 참고.

## 화면 구성

- 검색 카드(`SearchFilterCard`): 호출명으로 목록을 필터링한다. dirty guard는 아래 §조회/초기화 참고.
- 편집 테이블(`StaffCallManagementTable`, `EditableDetailTable` 재사용): 호출명(필수)/설명/선택방식(단건·다건)/사용여부 4개 컬럼과 행추가·행삭제·순서 이동(위/아래)·저장 버튼.
- 안내문구(`table.guideText`)는 카드 헤더 바로 아래 한 곳에만 둔다(사용여부 노출 조건 + 순서 규칙을 한 문장으로 합침). 테이블 아래쪽 `footnote`는 쓰지 않는다 — 안내는 위쪽 한 곳으로 통일.
- 검색 결과가 없을 때는 `조회 결과가 없습니다.`, 검색 전 상태에서 행이 모두 삭제되면 `등록된 직원호출 항목이 없습니다.`를 표시한다(`order-history`/`payment-status`의 `hasSearched ? ... : ...` 관례와 동일).

## 마스터 없는 상세 테이블

이 화면은 마스터를 선택해 상세 목록을 보는 구조가 아니라, 매장당 하나뿐인 평평한 목록이다. `EditableDetailTable`은 원래 `selectedMaster`가 있어야 빈 상태를 벗어나는 컴포넌트라, 고정된 가짜 마스터 상수(`STAFF_CALL_MASTER = { id: 'staff-call' }`)를 항상 넘겨서 쓴다 — 화면에는 마스터 선택 UI가 없다.

## 컬럼과 mock 경계

| 컬럼 | 필드 | 실제 DB 컬럼 |
|---|---|---|
| 호출명 | `callNm` | O (`call_nm`) |
| 설명 | `description` | O (`description`) |
| 선택방식(단건/다건) | `singleYn`('Y'\|'N') | O (`single_yn`) — 값은 향후 공통코드 연동 예정, 지금은 고정 셀렉트 |
| 사용여부 | `useYn`('Y'\|'N') | **X** — mock 전용, DB에 컬럼 추가되면 연결 |
| 표시 순서 | `ordNo` | **X** — mock 전용, 배열 순서가 곧 순서. consumer 화면 칩 노출 순서와 대응 예정 |

## 조회 / 초기화

dirty일 때 조회·초기화는 `useFilterDirtyCheck` + `ConfirmModal`을 거친다(menu-option과 동일 패턴). 초기화는 검색어와 `rows`(편집 내용)를 모두 `baseRows` 기준으로 되돌린다.

## 저장

백엔드 컨트롤러가 아직 없어(DB 테이블만 존재) `api/staffCallManagementApi.ts`의 `saveStaffCallItemsStub`은 항상 성공 처리한다. 저장 확인 모달·"변경된 내용이 없습니다" 안내는 공용 `useDetailTableSaveFlow`를 그대로 쓴다.

`호출명`은 필수값이면서 다른 행과 중복되면 안 된다(trim 후 비교). 실패 사유에 따라 안내 문구가 다르다 — 빈값만: `빈값을 채워주세요.` / 중복: `중복된 호출명이 있습니다.` / 둘 다: 두 문구를 합쳐서 표시. `useDetailTableSaveFlow`의 `invalidValueMessage`가 문자열뿐 아니라 함수도 받도록 확장해 구현했다.

검증 실패 모달의 "확인"을 눌러야 셀 에러가 반영된다(`hasConfirmAction`이 true일 때만 `primaryAction={{ onClick: actions.confirmNotice }}`를 넘겨야 함 — `MenuManagementPage`와 동일 패턴).

## 메뉴 등록 시 주의

Client 사이드바에 새 메뉴를 추가하려면 `shared/menu/clientNavigation.ts`의 `CLIENT_MENUS_BY_SECTION`(fallback)뿐 아니라 **`src/mocks/handlers.ts`의 메뉴 카탈로그 mock 데이터도 같이 추가해야 실제 화면에 나타난다** — 자세한 이유는 ADR-035 참고.
