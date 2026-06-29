# 테이블 배치 관리 페이지 규약

> 경로: `/client/store/table/layout`
> 화면: 매장 > 테이블 정보 관리 > 테이블 배치 관리

마우스/터치 드래그와 클릭으로 테이블·내부시설을 캔버스에 자유롭게 배치하는 화면이다. 배치 크기(작게/보통/크게) 토글, 리셋/초기화/저장 버튼을 헤더에 둔다.

## 화면 구성

| 영역 | 컴포넌트 | 위치 |
|---|---|---|
| 좌측 상단 | `FacilityListCard` (내부시설 목록) | `features/table-layout/components/FacilityListCard.tsx` |
| 좌측 하단 | `TableListCard` (테이블 목록) | `features/table-layout/components/TableListCard.tsx` |
| 우측 | `TableLayoutCanvas` (배치 캔버스) | `features/table-layout/components/TableLayoutCanvas.tsx` |
| 상태/이벤트 | `useTableLayoutPage` | `features/table-layout/hooks/useTableLayoutPage.ts` |
| API | `tableLayoutApi.ts` | `features/table-layout/api/tableLayoutApi.ts` |

## 드래그/배치 이벤트

`@dnd-kit/core`(`PointerSensor`, `activationConstraint: { distance: 4 }`)를 도입했다. 네이티브 HTML5 Drag & Drop은 터치를 지원하지 않아 마우스·터치를 동시에 처리할 수 없다. 좌표는 캔버스 컨테이너 기준 절대 px로 다룬다(아래 "좌표 모델" 참고).

테이블과 내부시설은 캔버스에 들어가는 방식이 서로 다르다.

- **내부시설**: `FacilityListCard`의 각 항목이 `useDraggable`(`DraggedItemData = { origin: 'facility-catalog', kind }`)이다. 캔버스(`useDroppable`)로 드래그하면 드롭 위치에 새 `PlacedFacilityItem`이 생성된다. 사이드바 원본 항목은 사라지지 않고(여러 개 반복 배치 가능), 드래그 중에는 `DragOverlay`로 미리보기만 따라다닌다.
- **테이블**: `TableListCard` 항목은 드래그가 아니라 **클릭**이다. 클릭하면 캔버스 정중앙(겹치면 캔버스 안쪽으로 클램프)에 배치되고, 그 테이블은 목록에서 비활성화된다(같은 테이블 중복 배치 방지).

캔버스에 배치된 항목(테이블·내부시설 공통)은 다시 `useDraggable`(`{ origin: 'placed', id }`)로 자유 이동할 수 있다. 이동/배치 직후 좌표·크기는 `event.active.rect.current.translated`(드롭 시점의 실제 렌더 크기)에서 읽어 캔버스 경계 안으로 클램프한다.

### 내부시설 자유 리사이즈

내부시설 카드 우하단에 커스텀 리사이즈 핸들(`ResizeHandle`, `TableLayoutCanvas.tsx`)을 둔다. dnd-kit의 드래그 리스너와 충돌하지 않도록 핸들의 `onPointerDown`에서 `stopPropagation`하고, Pointer Events(`setPointerCapture`)로 직접 처리한다(다른 라이브러리 없이 마우스·터치 통일). 크기 범위는 `constants.ts`의 `FACILITY_RESIZE_LIMITS`(72~280px / 40~160px)로 제한하고, 캔버스 경계도 함께 클램프한다. 테이블은 리사이즈 대상이 아니다(배치 크기 토글로만 크기가 바뀐다).

## 좌표 모델

배치 아이템(`PlacedItem` = `PlacedTableItem | PlacedFacilityItem`, `types.ts`)은 캔버스 컨테이너 기준 절대 px(`x`, `y`, `width`, `height`)로 저장한다. 백엔드 `table_gui`가 `x_coordinate`/`y_coordinate`/`height`/`width`를 정수 px로 그대로 저장하는 컬럼이라, 비율(%) 변환 없이 1:1로 맞춘 것이다.

캔버스 크기가 바뀌면(창 크기 변경 등) `useTableLayoutPage`의 `ResizeObserver`가 모든 배치 아이템의 `x`/`y`를 새 캔버스 크기 안으로 다시 클램프한다.

배치 크기 토글(작게/보통/크게)을 바꾸면 `TablePlacedCard`/`FacilityPlacedCard`의 CSS 클래스가 바뀌어 화면에 보이는 박스 크기는 즉시 달라지지만, 이미 배치된 아이템의 `item.width`/`item.height`(저장·클램프 계산에 쓰는 값)는 다음 드래그 시점에 실제 렌더 크기로 다시 동기화될 때까지 이전 값을 유지한다. 토글 직후 클릭/드래그 없이 바로 저장하면 시각적 크기와 저장되는 크기가 잠깐 어긋날 수 있다 — 토글 후 한 번이라도 옮기면 자동으로 맞춰진다.

## 저장/삭제 — 테이블만 영속화

`table_gui` API(`GET/POST /api/client/store_manage/table_gui/search|save`)는 이미 백엔드에 구현돼 있고, 생성된 훅 `useGetTableGui`/`useSaveTableGui`(`generated/store-manage-controller`)를 그대로 쓴다. **이 API는 `table_info`(실제 테이블) 행만 다룬다** — 내부시설(카운터/문/주방/화장실/계단/엘리베이터/흡연실)은 대응하는 테이블 행이 없어 저장 대상이 아니다. 내부시설은 새로고침하면 사라지는 프론트 전용 상태다(이번 단계에서 의도적으로 결정한 범위).

- `useGetTableGui`는 `useYn='Y'` + QR코드 등록까지 끝난 테이블만 내려준다(헤더 안내문 "테이블 사용여부를 '활성'하고 'QR코드'를 등록해야 목록에 표시됩니다."와 일치). `TableListCard`는 이 목록(`eligibleTables`)을 그대로 쓴다 — `store-table` feature의 `table_info/search`(전체 테이블)가 아니다.
- `isTableGuiPlaced`(`tableLayoutApi.ts`)는 응답의 `xcoordinate`/`ycoordinate`가 둘 다 있는 행만 "이미 배치됨"으로 본다(QR은 등록됐지만 한 번도 배치하지 않은 테이블은 좌표가 `null`로 내려온다).
- `buildTableGuiRequest`(`tableLayoutApi.ts`)가 draft/base를 비교해 `newItems`/`updateItems`/`delItems`를 만든다.
  - **newItems**: 이번에 처음 캔버스에 배치된 테이블(서버에 좌표 없음)
  - **updateItems**: 이미 배치돼 있던 테이블의 좌표/크기 변경
  - **delItems**: 캔버스에서 제거되어 draft에 더는 없는 테이블
  - 백엔드 SQL상 `newTableGui`/`updateTableGui`는 동일한 UPDATE 문이고(`table_info.sys_id`로 매칭), 차이는 감사로그(`insertNewAuditTrailData` vs `insertUpdateAuditTrailData`)뿐이다. 즉 모든 항목은 이미 `table_info`에 존재하는 테이블이어야 하며, 신규 테이블 자체를 만드는 API가 아니다.
  - `delItems`로 보내면 백엔드가 좌표/크기를 `NULL`로 되돌린다(테이블 자체는 삭제하지 않음).
- 요청 바디의 `tableType` 필드는 현재 항상 비워서 보낸다 — 프론트에 "테이블 타입"(예: 원형/사각 테이블) 개념이 아직 없다. 필요해지면 `PlacedTableItem`에 필드를 추가하고 `mapToTableGuiItem`에서 채운다.

## 헤더 버튼

| 버튼 | 동작 |
|---|---|
| 리셋 | draft를 서버에서 불러온 마지막 저장 상태(`baseItems`)로 되돌린다. 내부시설은 저장 대상이 아니므로 리셋 시 전부 사라진다. |
| 초기화 | `window.confirm()` 확인 후 캔버스의 모든 아이템(테이블+내부시설)을 draft에서 비운다. 저장을 눌러야 실제로 테이블 좌표가 삭제(`delItems`)된다. |
| 저장 | 변경사항이 없으면(`isDirty === false`) 아무 동작도 하지 않는다. 있으면 `SaveConfirmModal`("저장하시겠습니까? / 배치한 테이블 좌표를 저장합니다.")을 띄우고, 확인 시 `useSaveTableGui` 호출 후 `queryKeys.tableLayout.lists`를 무효화한다. |

`isDirty`는 테이블(`draftTableItems`)만 기준으로 계산한다(`usePreventLeave(isDirty)`로 새로고침/탭 닫기 경고에도 연동) — 내부시설 변경은 저장 대상이 아니라서 dirty 판정에 포함하지 않는다.

## Mock 데이터

`src/mocks/handlers.ts`에 `tableGuiOverrideHandler`(GET)/`tableGuiSaveOverrideHandler`(POST)를 직접 등록했다(orval이 자동 생성한 faker 기반 mock 대신, 고정 데이터로 교체). 데이터는 `features/table-layout/mock/tableLayoutMock.ts`의 `TABLE_GUI_MOCK_ROWS`이며, `store-table`의 `STORE_TABLE_MOCK_ROWS`·`qr-code`의 `QR_CODE_MOCK_ROWS`에서 `useYn='Y'` + QR 등록된 테이블(`table-001`~`003`, `table-004`는 `useYn='N'`이라 제외)만 반영했다. 저장 핸들러는 `newItems`/`updateItems`를 `sysId` 매칭으로 반영하고, `delItems`는 좌표/크기 필드를 `undefined`로 되돌린다.

## 플로어플랜 재사용 시 데이터 처리 가이드 (향후 작업)

테이블 좌표는 이미 `table_gui`에 영속화되므로, 추후 주문 상태 관리(또는 별도 화면)에서 같은 데이터를 **읽기 전용**으로 그려 테이블 카드 클릭 시 주문이력 조회·결제상태 변경 이벤트를 여는 "플로어플랜" 뷰를 추가할 수 있다. 이 화면의 드래그/리사이즈/저장 로직은 그대로 두고, 새 화면은 좌표만 읽는 별도 컴포넌트로 만드는 걸 전제로 한다(좌표 저장소를 두 군데로 나누지 않기 위함).

### 가져올 데이터와 처리 순서

1. **조회**: `useGetTableGui()`(`generated/store-manage-controller`)를 새 화면에서도 그대로 호출한다. 이 화면의 `useTableGuiQuery`(`tableLayoutApi.ts`, `queryKeys.tableLayout.lists`)를 그대로 import해서 재사용해도 된다 — React Query가 같은 쿼리 키로 캐시를 공유하므로 두 화면을 오가도 다시 fetch하지 않는다.
2. **필터링**: 응답(`TableGuiResponse[]`)에서 실제로 배치된 테이블만 그린다 — `isTableGuiPlaced(item)`(`xcoordinate`/`ycoordinate`가 둘 다 있는 행)으로 거른다. 좌표가 없는 행(QR은 등록했지만 배치 안 한 테이블)은 플로어플랜에 그릴 위치가 없으므로 제외한다.
3. **렌더링**: 각 항목의 `xcoordinate`/`ycoordinate`/`width`/`height`를 그대로 캔버스 컨테이너 기준 절대 px로 써서 위치를 잡는다(이 화면의 `mapToPlacedTableItem`을 그대로 가져다 써도 된다). `useDraggable`/리사이즈 핸들은 붙이지 않는다 — 읽기 전용이라 위치만 표시한다.
4. **클릭 이벤트 연결**: 테이블 카드 클릭 시 주문이력/결제상태를 열려면, 이 화면의 `TableGuiResponse.tableNum`(number)과 주문 상태 관리의 `OrderBoardRow.tableNum`(string, `order-status-management/types.ts`)을 매칭 키로 쓴다 — 두 화면이 이미 같은 `tableNum` 개념을 쓰고 있어 별도 변환 테이블 없이 `String(table.tableNum) === row.tableNum`으로 묶을 수 있다. 결제상태 변경/주문이력 조회는 `order-status-management`의 기존 흐름(`useOrderPaymentModalFlow` 등, [`docs/page/order-status-management.md`](./order-status-management.md) "결제 처리" 참고)을 그대로 재사용하고, 플로어플랜의 클릭 핸들러는 "어떤 테이블이 클릭됐는지"만 새 화면에 전달하는 역할로 한정한다.
5. **저장 금지**: 새 화면에서는 `useSaveTableGui`를 호출하지 않는다(좌표 수정은 이 페이지(`/client/store/table/layout`)에서만 한다). 새 화면이 좌표를 바꿀 수 있게 만들면 두 화면이 서로 다른 시점에 같은 데이터를 쓰게 되어 정합성 문제가 생긴다.

### 새 화면에서 주의할 것

- **좌표 모델 의존성**: 배치 크기(작게/보통/크게) 토글과 절대 px 좌표 모델이 두 화면의 공통 의존성이 된다. 이 페이지에서 좌표 단위나 클램프 로직을 바꾸면 플로어플랜도 같이 깨질 수 있다.
- **빈 캔버스 처리**: 한 번도 배치를 안 했거나 전부 삭제된 매장은 `useGetTableGui` 응답에 배치된 테이블이 0건일 수 있다 — 플로어플랜 화면은 "배치 정보가 없습니다. 테이블 배치 관리에서 먼저 배치해주세요." 같은 빈 상태 안내와, 해당 화면으로 이동하는 링크를 같이 두는 걸 권장한다.
- **내부시설은 안 보인다**: 카운터/문/주방 등은 `table_gui`에 없어 플로어플랜에 표시할 수 없다. 매장 구조 파악용 배경 정보가 필요하면 별도 협의가 필요하다(아래 "내부시설 영속화" 참고).

### 그 외 TODO

- **내부시설 영속화**: 백엔드에 시설 좌표를 저장할 필드가 없다. 필요해지면 `table_gui`에 시설용 행을 추가하는 방식(예: `table_type` 활용 또는 별도 테이블)을 백엔드와 협의해야 한다.
- **`tableType` 필드 활용**: 테이블 모양/종류 구분이 필요해지면 프론트 타입과 UI를 추가하고 이 필드를 채운다.
