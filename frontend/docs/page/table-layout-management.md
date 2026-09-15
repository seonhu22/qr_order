# 테이블 배치 관리 페이지 규약

> 경로: `/client/store/table/layout`
> 화면: 매장 > 테이블 정보 관리 > 테이블 배치 관리

클릭과 드래그로 테이블·내부시설을 캔버스에 자유롭게 배치하는 화면이다. **최초 배치는 클릭**(사이드바 항목 클릭 = 캔버스에 새로 놓기), **이동은 드래그**(캔버스에 이미 놓인 아이템을 자유 이동) — 이 둘의 역할이 다르다. 배치 크기(작게/보통/크게) 토글, 되돌리기/전체 비우기/전체보기/저장 버튼을 헤더에 둔다.

## 화면 구성

| 영역 | 컴포넌트 | 위치 |
|---|---|---|
| 좌측 상단 | `FacilityListCard` (고정 8종 내부시설 목록, 클릭 배치) | `features/table-layout/components/FacilityListCard.tsx` |
| 좌측 하단 | `TableListCard` (테이블 목록, 클릭 배치) | `features/table-layout/components/TableListCard.tsx` |
| 우측 | `TableLayoutCanvas` (배치 캔버스, 헤더에 "커스텀 시설 추가" 버튼) | `features/table-layout/components/TableLayoutCanvas.tsx` |
| 캔버스 카드 | `TablePlacedCard`/`FacilityPlacedCard`(고정 8종)/`CustomFacilityPlacedCard`(커스텀) | `features/table-layout/components/*.tsx` |
| 커스텀 시설 모달 | `CustomFacilityAddModal` + `useCustomFacilityModal` | `features/table-layout/components/CustomFacilityAddModal.tsx`, `hooks/useCustomFacilityModal.ts` |
| 상태/이벤트 | `useTableLayoutPage` | `features/table-layout/hooks/useTableLayoutPage.ts` |
| API | `tableLayoutApi.ts` | `features/table-layout/api/tableLayoutApi.ts` |

## 배치/이동 이벤트

`@dnd-kit/core`(`PointerSensor`, `activationConstraint: { distance: 4 }`)를 캔버스 내 이동(재배치)에 쓴다. 좌표는 캔버스 컨테이너 기준 절대 px로 다룬다(아래 "좌표 모델" 참고).

세 종류(테이블/고정 8종 내부시설/커스텀 시설) 모두 **캔버스에 처음 놓는 것은 클릭**으로 통일돼 있다(과거에는 내부시설만 사이드바에서 캔버스로 드래그하는 방식이었으나, 테이블 리스트와 동작이 달라 혼란스러워 클릭으로 통일했다 — dnd-kit `useDraggable`/`DragOverlay`를 쓴 카탈로그 드래그 관련 코드는 전부 제거됨).

- **테이블**: `TableListCard` 항목 클릭 → 배치되고 목록에서 비활성화된다(같은 테이블 중복 배치 방지). `handlePlaceTable`(`useTableLayoutPage.ts`).
- **내부시설(고정 8종)**: `FacilityListCard` 항목 클릭 → 배치된다. 테이블과 달리 같은 종류를 여러 번 반복 배치할 수 있어 목록 항목은 비활성화되지 않는다. `handlePlaceFacility`.
- **커스텀 시설**: `TableLayoutCanvas` 헤더의 "커스텀 시설 추가" 버튼(`TableCard`의 `actions` prop, `SaveTableButton`과 같은 `variant="outline" size="sm"`) → `CustomFacilityAddModal`이 열리고 이름을 입력해 확인하면 배치된다. `handlePlaceCustomFacility`. 아래 "커스텀 시설" 절 참고.

셋 다 배치 위치는 캔버스 전체의 중앙이 아니라 **지금 스크롤해서 보고 있는 영역의 좌상단**(여백 24px, 캔버스 밖으로 나가지 않게 클램프)이다 — 캔버스가 고정 크기(1280×800)라 화면보다 클 수 있는데, 전체 중앙을 기준으로 하면 다른 곳을 스크롤해서 보고 있을 때 클릭해도 배치된 아이템이 화면 밖이라 안 보이는 문제가 있어서 보이는 영역 기준으로 뒀다.

캔버스에 배치된 항목(세 종류 공통)은 다시 `useDraggable`(`{ origin: 'placed', id }`)로 자유 이동할 수 있다. 이동/배치 직후 좌표·크기는 `event.active.rect.current.translated`(드롭 시점의 실제 렌더 크기)에서 읽어 캔버스 경계 안으로 클램프한다.

### 가장자리 스냅

> 추가일: 2026-06-30

드롭한 위치 근처(`constants.ts`의 `SNAP_THRESHOLD_PX`, 20px 이내 — 터치 입력은 마우스보다 정밀도가 떨어져 태블릿 사용을 고려해 8px에서 넓혔다)에 다른 배치 아이템(테이블·내부시설 구분 없이 전부 대상)이 있으면 자동으로 정렬된다(`utils.ts`의 `snapPositionToNearbyItems`). 테이블을 줄지어 배치하거나 일정한 간격으로 나열하고 싶을 때 손으로 픽셀을 맞추지 않아도 되게 하기 위함이다. 두 종류의 후보를 같이 본다.

1. **가장자리 일치** — 다른 아이템의 좌/우(X축) 또는 상/하(Y축) 끝에 맞춘다.
2. **균등 간격 이어가기** — 같은 행(세로 범위가 겹치는 아이템들, X축 기준) 또는 같은 열(가로 범위가 겹치는 아이템들, Y축 기준)에 이미 일정한 간격으로 놓인 두 아이템이 있으면, 그 간격을 그대로 이어가는 위치도 후보에 넣는다(`spacingCandidatesX`/`spacingCandidatesY`). 테이블 3개를 같은 간격으로 나란히 놓고 싶을 때, 처음 두 개의 간격을 세 번째에도 그대로 적용해준다.

- x축/y축은 독립적으로 계산한다 — 가로만 줄을 맞추고 세로는 자유롭게 두는 것도 가능하다.
- 두 종류(가장자리/균등 간격)의 후보를 모두 모은 뒤, 각 축에서 임계값 이내 중 가장 가까운 후보 하나만 선택한다 — 어느 쪽이 더 가까운지에 따라 자동으로 결정되고, 우선순위를 따로 두지 않는다.
- 스냅은 **드롭 시점에만** 일어난다(드래그 중 실시간 스냅·가이드라인 표시는 하지 않는다) — `handleDragEnd`(`useTableLayoutPage.ts`)에서 클램프 직전에 적용하고, 스냅으로 캔버스 밖으로 나갈 수 있으니 스냅 이후 다시 한번 클램프한다.
- 캔버스에 이미 배치된 아이템을 드래그로 옮기는 경우(`{ origin: 'placed' }`)에만 적용된다 — 옮기는 경우에는 자기 자신을 스냅 대상에서 제외한다. 최초 배치(클릭)는 스냅 대상이 아니다(스크롤 위치 기준 고정 좌표에 놓이고, 이후 드래그로 옮길 때부터 스냅이 걸린다).
- 스냅 자체는 좌표만 조용히 맞추고, 별도 강조 애니메이션은 없다 — 처음에 스냅 여부를 알려주려고 짧은 테두리 강조 애니메이션을 붙여봤지만, "정렬 기능 자체만 있으면 되고 모션은 필요 없다"는 피드백으로 제거했다.

### 드롭 시 깜빡임(flushSync)

dnd-kit은 드래그가 끝나면 라이브 드래그용 `transform`(`useDraggable`)을 먼저 지우고 나서야 `onDragEnd` 콜백을 호출한다. 그 사이에 `setPlacedItems`가 비동기로(다음 렌더에) 반영되면, 화면에는 "아이템이 원래 자리로 잠깐 복귀했다가 새 좌표로 점프"하는 한 프레임짜리 깜빡임이 보인다. `handleDragEnd`(`useTableLayoutPage.ts`)에서 `react-dom`의 `flushSync`로 `setPlacedItems` 호출을 감싸 같은 화면 갱신 안에서 동기적으로 끝나게 해 없앴다.

### 내부시설 자유 리사이즈

내부시설 카드 우하단에 커스텀 리사이즈 핸들(`ResizeHandle`, `TableLayoutCanvas.tsx`)을 둔다. dnd-kit의 드래그 리스너와 충돌하지 않도록 핸들의 `onPointerDown`에서 `stopPropagation`하고, Pointer Events(`setPointerCapture`)로 직접 처리한다(다른 라이브러리 없이 마우스·터치 통일). 크기 범위는 `constants.ts`의 `FACILITY_RESIZE_LIMITS`(72~280px / 40~160px)로 제한하고, 캔버스 경계도 함께 클램프한다. 테이블은 리사이즈 대상이 아니다(배치 크기 토글로만 크기가 바뀐다).

> 추가일: 2026-06-30 — 핸들의 시각적 표시(모서리 화살표, `::after`)는 작게 유지하되, 실제 포인터 이벤트가 반응하는 히트 영역(`.table-layout-canvas__resize-handle` 본체)은 `2.75rem`(44px, 터치 권장 최소 크기)로 띄워서 터치 탭 정밀도를 확보했다. 부모(`.table-layout-canvas__item`)에 `overflow: hidden`이 없어 카드 경계 밖으로 넘치는 히트 영역도 잘리지 않는다.
>
> 다만 작은 크기(`small`) 카드는 높이가 리사이즈 핸들 히트 영역(44px)보다 작아, 넓어진 히트 영역이 카드 우상단의 삭제(×) 버튼(`facility-placed-card__remove`)과 겹쳐 삭제 버튼이 안 눌리는 회귀가 있었다. 삭제 버튼에 `z-index: 2`, 리사이즈 핸들에 `z-index: 1`을 줘서 겹치는 영역에서는 항상 삭제 버튼이 클릭을 먼저 받도록 고쳤다.
>
> 이 z-index가 캔버스 전체 기준으로 비교되면, 서로 다른 두 배치 아이템(`.table-layout-canvas__item`)이 캔버스 위에서 겹칠 때 한쪽의 삭제 버튼(z-index: 2)이 다른 아이템의 카드 전체보다 위로 떠 보이는 문제가 있었다. `.table-layout-canvas__item`에 `isolation: isolate`를 줘서 z-index 비교가 그 아이템 내부로만 한정되게 했다 — 아이템 간 쌓임 순서는 기존처럼 DOM 순서(드래그 중인 아이템만 `zIndex: 10`)를 그대로 따른다.

## 좌표 모델

배치 아이템(`PlacedItem` = `PlacedTableItem | PlacedFacilityItem | PlacedCustomFacilityItem`, `types.ts` — 뒤 둘을 합쳐 `PlacedNonTableItem`으로도 부른다)은 캔버스 컨테이너 기준 절대 px(`x`, `y`, `width`, `height`)로 저장한다. 백엔드 `table_gui`가 `x_coordinate`/`y_coordinate`/`height`/`width`를 정수 px로 그대로 저장하는 컬럼이라, 비율(%) 변환 없이 1:1로 맞춘 것이다.

> 추가일: 2026-06-30 — 캔버스는 화면 폭에 따라 늘어나거나 줄어들지 않는 **고정 크기**다(`constants.ts`의 `TABLE_LAYOUT_CANVAS_SIZE`, 1280×800). 화면이 좁으면 캔버스 전체가 작아지는 대신 카드(`TableLayoutCanvas.css`의 `.table-layout-canvas-card`) 안에서 스크롤된다(`.table-layout-canvas-scroll`, `overflow: auto`). 좌표가 항상 같은 고정 좌표 공간 기준이라, 어떤 화면 크기에서 열어도 배치된 그대로(상대 위치·간격·비율)가 똑같이 보인다 — 직전까지는 캔버스가 `flex: 1`로 화면 크기에 맞춰 늘어나는 구조라 화면마다 배치가 다르게 보일 수 있는 한계가 있었는데, 이 변경으로 해소됐다. 클램프(`handleDragEnd`/`handlePlaceTable`/`handleResizeFacility`, `useTableLayoutPage.ts`)도 캔버스의 실제 렌더 크기(`getBoundingClientRect()`) 대신 이 고정 크기 상수를 기준으로 계산한다. 캔버스 크기가 더 이상 안 바뀌므로, 창 크기 변경 시 좌표를 다시 클램프하던 `ResizeObserver` 로직은 제거했다.
>
> 백엔드 `table_gui` 스키마(`xcoordinate`/`ycoordinate`/`width`/`height`)는 그대로 절대 px 정수만 받기 때문에 이 변경에 백엔드 협의나 스키마 추가가 필요 없다 — 캔버스 크기는 프론트엔드에만 존재하는 상수이고 서버로 전달되지 않는다.

배치 크기 토글(작게/보통/크게)을 바꾸면 `TablePlacedCard`/`FacilityPlacedCard`/`CustomFacilityPlacedCard`의 CSS 클래스가 바뀌어 화면에 보이는 박스 크기는 즉시 달라지지만, 이미 배치된 아이템의 `item.width`/`item.height`(저장·클램프 계산에 쓰는 값)는 다음 드래그 시점에 실제 렌더 크기로 다시 동기화될 때까지 이전 값을 유지한다. 토글 직후 클릭/드래그 없이 바로 저장하면 시각적 크기와 저장되는 크기가 잠깐 어긋날 수 있다 — 토글 후 한 번이라도 옮기면 자동으로 맞춰진다.

> 추가일: 2026-07-02 — 각 단계의 실제 px 값(`TABLE_SIZE_PX`, `constants.ts`)은 작게=기존 보통, 보통=기존 크게 값을 그대로 물려받고, 크게는 이전 단계 간격(16px)의 2배로 새로 키웠다(184×176px) — "전체보기로 봤을 때 크게가 생각보다 크지 않다"는 피드백에 따라 단계를 한 칸씩 밀고 최상단을 더 키운 것이다. 내부시설 카드(`FacilityPlacedCard`/`CustomFacilityPlacedCard`)의 min-height/아이콘 크기도 같은 흐름으로 맞춰뒀다.

## 저장/삭제 — object_type으로 테이블·내부시설 함께 저장

> 추가일: 2026-07-02, [`docs/decisions.md` ADR-017](../decisions.md#adr-017--테이블-배치-관리-내부시설-영속화object_type-mock-우선-구현) 참고. 이전에는(ADR-015) 내부시설이 저장 대상이 아니었다 — 그 절이 이 절로 대체됐다.

`table_gui` API(`GET/POST /api/client/store_manage/table_gui/search|save`)를 테이블뿐 아니라 내부시설(고정 8종 + 커스텀)까지 함께 쓰는 방향으로 설계했다. 생성된 `TableGuiItem`/`TableGuiResponse`(`src/generated/types/`)와 실제 응답 필드 표기가 어긋나는 구간은 프론트에서 로컬 wire 타입(`TableGuiObjectType`, `TableGuiItemWire`/`TableGuiResponseWire`, `tableLayoutApi.ts`)으로 격리해 다룬다.

| object_type | 의미 | 종류 매칭 필드 |
|---|---|---|
| `01` | 테이블 (기존과 동일) | — |
| `02` | 내부시설(고정 8종 카탈로그) | `tableName`(= 공통코드 이름 `common_nm`) — 8종 라벨과 텍스트 매칭. `tableType`도 같이 보내지만 매칭 기준(source of truth)은 `tableName`이다 |
| `03` | 기타(커스텀 시설 — 유저가 이름을 직접 입력) | `tableName`에 유저가 입력한 이름을 그대로 싣는다 |

- `useGetTableGui`는 `useYn='Y'` + QR코드 등록까지 끝난 테이블만 내려준다(헤더 안내문 "테이블 사용여부를 '활성'하고 'QR코드'를 등록해야 목록에 표시됩니다."와 일치). `TableListCard`는 이 목록 중 `isTableGuiRow`(objectType이 없거나 `01`)로 거른 것(`eligibleTables`)을 쓴다 — `store-table` feature의 `table_info/search`(전체 테이블)가 아니다.
- `isTableGuiPlaced`/`isFixedFacilityGuiPlaced`/`isCustomFacilityGuiPlaced`(`tableLayoutApi.ts`)는 각각 objectType이 맞고 `xcoordinate`/`ycoordinate`가 둘 다 있는 행만 "이미 배치됨"으로 본다.
- `mapToPlacedFacilityItem`은 `02` 행의 `tableName`을 `FACILITY_KIND_BY_LABEL`(`constants.ts`, `FACILITY_CATALOG` 라벨의 역매핑)로 찾아 `kind`/아이콘을 복원한다. 매칭 실패(알 수 없는 이름) 시 카운터로 대체한다.
- `buildTableGuiRequest`(`tableLayoutApi.ts`)가 draft/base를 비교해 테이블 + 내부시설(고정+커스텀)을 **한 번의 요청**으로 합쳐 `newItems`/`updateItems`/`delItems`를 만든다 — 별도의 "내부시설 저장" 액션은 없다.
  - **newItems**: 이번에 처음 캔버스에 배치된 것(테이블은 서버에 좌표 없음)
  - **updateItems**: 이미 배치돼 있던 것의 좌표/크기 변경
  - **delItems**: 캔버스에서 제거되어 draft에 더는 없는 것
  - 테이블 쪽은 기존과 동일하게 `table_info.sys_id` 매칭 UPDATE(신규 테이블 자체를 만드는 API 아님)이다.
  - `delItems`로 보내면 백엔드가 좌표/크기를 `NULL`로 되돌린다(행 자체는 삭제하지 않음).
- MSW mock(`src/mocks/handlers.ts`의 `tableGuiSaveOverrideHandler`)은 sysId가 없는 저장 요청이 들어오면 mock에서 sys_id를 생성해 새 행으로 추가한다(실제 백엔드의 INSERT 동작을 흉내낸 것) — `mock/tableLayoutMock.ts`의 `TABLE_GUI_MOCK_ROWS`에 `tableType` 없이 `tableName: '주방'`만 있는 `02` 행을 하나 둬서, 이름만으로 매칭되는지 확인할 수 있게 해뒀다.

### 백엔드 audit 주의사항

현재 백엔드 `table_gui/save`는 저장 전에 `sys_audit_trail` 데이터를 만든다. 이때 `newItems`도 각 row의 `sysId`를 audit `ref_key`로 사용하므로, `sysId`가 없는 내부시설을 그대로 보내면 `AT 에러. 관리자에게 문의 바랍니다.`가 발생할 수 있다.

또한 현재 `TableGuiMapper.newTableGui`는 이름과 달리 `insert`가 아니라 `table_info.sys_id` 기준 `update` 흐름이다. 따라서 “새 내부시설 생성”은 백엔드가 내부시설 row insert와 audit용 `sysId` 발급 순서를 명확히 지원하기 전까지 real 환경에서 확정 기능으로 보면 안 된다. 프론트의 mock은 이 흐름을 선개발하기 위해 sysId 없는 내부시설에 임시 sysId를 발급하지만, real 백엔드 계약과는 다를 수 있다.

### 내부시설 카탈로그(고정 8종)

`FACILITY_CATALOG`(`constants.ts`)에 카운터/정문/후문/주방/화장실/계단/엘리베이터/흡연실 8종이 `{ kind, label, icon }`로 고정돼 있다. 이 목록 자체는 프론트 전용이며(백엔드에서 받아오지 않음), `FacilityListCard`가 그대로 렌더링한다. `FACILITY_LABEL_BY_KIND`/`FACILITY_ICON_BY_KIND`가 kind→라벨/아이콘 정방향 매핑이고, 응답을 파싱할 때 쓰는 `FACILITY_KIND_BY_LABEL`이 라벨→kind 역방향 매핑이다.

### 커스텀 시설

> 추가일: 2026-07-02

고정 8종에 없는 시설을 유저가 이름을 직접 입력해서 만드는 기능이다(`kind: 'custom'`, `PlacedCustomFacilityItem`, object_type `03`).

- **진입**: `TableLayoutCanvas` 헤더("테이블 배치")의 "커스텀 시설 추가" 버튼(`TableCard`의 `actions` prop 자리, `SaveTableButton`과 같은 `variant="outline" size="sm"` 스타일) → 클릭하면 `CustomFacilityAddModal`이 열린다(모달 트리거 버튼이지 즉시 배치가 아니다 — 고정 8종과의 차이).
- **모달**: 이름 입력 필드 1개(`WrapperModal` + `InputWrapper`/`InputBase`, `MenuManagementPage`의 카테고리 등록 모달과 같은 패턴). 빈 값으로 확인하면 `errorText`로 검증 메시지를 보여준다(`useCustomFacilityModal.ts`). 사이드바 카탈로그(`FACILITY_CATALOG`)에는 추가되지 않는다 — 캔버스 배치 인스턴스로만 존재한다.
- **카드 스타일**: `CustomFacilityPlacedCard`가 고정 8종 카드(`FacilityPlacedCard`)와 같은 구조(아이콘+라벨+삭제 버튼, 같은 small/medium/large 크기 변형)를 쓰되 시각적으로 구분한다.
  - 아이콘은 종류가 없어 공용 아이콘 `i-more`(점 3개) 하나만 쓴다.
  - 저장 전까지 캔버스에서만 존재하는 휘발성 데이터임을 나타내려고, 배경/테두리는 반투명한 오렌지 톤(`rgba(255, 107, 43, ...)`, 점선 테두리)으로 옅게 표시한다 — 단, **아이콘·텍스트는 완전 불투명**으로 유지한다(element `opacity`를 카드 전체에 걸면 아이콘·텍스트까지 같이 흐려지므로, `opacity` 대신 배경/테두리 색 자체에 알파를 섞는 방식을 쓴다).
  - 아이콘·라벨은 `justify-content: space-between`으로 카드 양 끝에 배치한다 — 리사이즈로 카드가 넓어졌을 때도 아이콘과 텍스트가 붙어있지 않고 자연스럽게 벌어지게 하기 위함이다. 같은 규칙을 고정 8종 카드(`FacilityPlacedCard`)에도 동일하게 적용해 통일했다.
  - 전체보기(보기 전용, `viewOnly` prop) 상태에서는 편집 중임을 안내할 필요가 없어 고정 8종과 같은 스타일(실선 테두리, `--color-bg-muted`)로 바뀐다.
- **리사이즈**: 고정 8종과 동일한 `ResizeHandle`을 그대로 쓴다. `TableLayoutCanvas.css`의 `.table-layout-canvas__item--resizable .facility-placed-card, .table-layout-canvas__item--resizable .custom-facility-placed-card` 규칙이 리사이즈 시 카드를 아이템 크기(`width: 100%; height: 100%`)로 채운다 — 이 규칙이 클래스별로 따로 걸려 있어서, 처음 `CustomFacilityPlacedCard`를 추가했을 때는 이 규칙이 안 걸려 리사이즈해도 카드 크기(내용물 기준 `max-content`)가 안 바뀌는 회귀가 있었다.

## 태블릿 반응형

> 추가일: 2026-06-30

`@container client-main (max-width: 1200px)` 기준이다(컨테이너 쿼리 채택 배경은 [`docs/decisions.md` ADR-016](../decisions.md#adr-016--태블릿-반응형-기준-뷰포트-대신-메인-컨테이너client-layout-기준), 공용 규칙은 [`docs/operations/page-patterns.md`](../operations/page-patterns.md#태블릿-반응형-client-전용) 참고).

- `.table-layout-page`의 `gap`을 `--spacing-8` → `--spacing-4`로 줄인다.
- `.table-layout-page__subtitle`(헤더 안내문구)은 공간 확보를 위해 숨긴다(`display: none`).
- `.table-layout-page__header` 패딩을 `1.0625rem` → `--spacing-6`으로, `.table-layout-page__title` 글자 크기를 `--font-size-lg`(18px) → `--typography-size-h4`(16px)로 줄인다.

### 사이드바 카드 제목 세로 정렬 보정

`TableListCard`/`FacilityListCard`가 쓰는 공용 `TableCard`의 헤더(`.common-code-card__header`, `TableCard.css`)는 구조상 `align-items: center`로 가운데 정렬이지만, 한글 폰트 특성상 줄높이(line-height)의 위아래 여백이 비대칭이라 제목 텍스트가 살짝 치우쳐 보였다. `.table-layout-page__sidebar .common-code-card__title`에 `line-height: 1`을 스코프로 덮어써서 보정했다 — 공용 `TableCard.css` 자체는 건드리지 않아 다른 화면에는 영향이 없다.

## 헤더 버튼

버튼 순서는 되돌리기 → 전체 비우기 → 전체보기 → 저장이다.

"리셋"/"초기화"라는 이름은 이 코드베이스에서 "초기화"가 보통 검색폼을 비우는 동작(`resetKeywords` 패턴, [`page-patterns.md`](../operations/page-patterns.md))을 가리켜서 의미가 겹쳐 헷갈렸다 — "마지막 저장 상태로 되돌리기"와 "캔버스를 통째로 비우기"라는 서로 다른 동작이 드러나도록 이름을 바꿨다. "삭제"는 즉시·영구적으로 지워지는 느낌을 주는데 실제로는 draft만 비우고 저장해야 반영되는 동작이라 "비우기"로 다시 바꿨다.

헤더 버튼이 많아 복잡해 보여서, 되돌리기/전체 비우기 2개는 텍스트 라벨 없이 아이콘 버튼(`variant="icon"`)으로 둔다 — 되돌리기는 `i-return`(되돌림 화살표), 전체 비우기는 `i-trash`. 라벨은 `aria-label`로만 제공한다(전체보기/저장은 자주 쓰고 의미를 바로 알아야 해서 텍스트를 유지했다).

`variant="icon"`은 기본적으로 테두리가 없는 `.btn--icon` 스타일이라(`/dev/button` 가이드에도 테두리 있는 icon variant는 따로 없다), 주문 상태 관리 휴지통 버튼(`.order-status-card__dismiss`, [`docs/page/order-status-management.md`](./order-status-management.md))과 동일한 패턴으로 `.table-layout-page__icon-button` 클래스를 얹어 테두리(`border: var(--border-1) solid var(--color-border-default); border-radius: var(--radius-sm);`)를 직접 입혔다.

| 버튼 | 동작 |
|---|---|
| 되돌리기 (아이콘만, `i-return`) | 확인 모달("초기 저장됐던 배치로 되돌리시겠습니까? / 저장하지 않은 변경 내용은 모두 사라집니다.") → draft를 서버에서 불러온 마지막 저장 상태(테이블 `baseItems` + 내부시설 `baseFacilityItems`)로 되돌린다(`requestReset`/`confirmReset`). 내부시설도 이제 저장 대상이라 저장한 적이 있으면 그 상태로 돌아가고, 저장한 적이 없으면(처음부터 draft에만 있던 것) 사라진다. |
| 전체 비우기 (아이콘만, `i-trash`) | 확인 모달("배치된 모든 테이블·내부시설을 화면에서 비우시겠습니까? / 저장 전까지는 실제로 반영되지 않습니다.") → 캔버스의 모든 아이템(테이블+내부시설)을 draft에서 비운다(`requestClearAll`/`confirmClearAll`). 저장을 눌러야 실제로 삭제(`delItems`)가 반영된다. |
| 전체보기 | 캔버스(고정 1280×800)가 화면보다 클 때, 전체가 한 번에 보이도록 축소해서 보여준다(`toggleFitToScreen`/`canvasScale`, `useTableLayoutPage.ts`). 다시 누르면 원래 크기로 돌아온다. `leftIcon={<Icon id="i-expand" />}`(네 모서리 화살표, Figma 소스 없이 직접 그린 아이콘 — `components.md` "신규 아이콘 추가 방법" 예외 케이스에 추가)로 "저장" 바로 왼쪽에 둔다. 평소엔 `variant="tinted"`이고, 전체보기로 켜져 있는 동안은(드래그/배치를 못 하는 보기 전용 상태라는 걸 알리기 위해) `variant="primary"`로 바뀐다(`aria-pressed={isFitToScreen}`도 함께 전달). |
| 저장 | 변경사항이 있으면(`isDirty === true`, 테이블·내부시설 통합 판정) 확인 모달("저장하시겠습니까? / 배치한 테이블 좌표를 저장합니다.")을 띄우고, 확인 시 `useSaveTableGui` 호출 후 `queryKeys.tableLayout.lists`를 무효화하고 결과 안내("저장되었습니다." 또는 오류 메시지)를 띄운다. 테이블·내부시설 둘 다 변경이 없으면 아무 동작도 하지 않는다. |

`isDirty`는 테이블과 내부시설(고정+커스텀)을 합쳐서 계산한다(`usePreventLeave(isDirty)`로 새로고침/탭 닫기 경고에도 연동) — `buildTableGuiRequest`의 결과(`newItems`/`updateItems`/`delItems`)가 하나라도 있으면 dirty다. ADR-015 시점에는 내부시설이 저장 대상이 아니라 테이블만 기준으로 봤으나, ADR-017로 대체됐다.

### 되돌리기 / 전체 비우기 / 저장 — 확인 모달은 아이콘 없는 버전으로 통일

셋 다 처음에는 `window.confirm()`이나 `ConfirmModal`/`SaveConfirmModal`/`DeleteConfirmModal`(전부 `layout="notice"`라 가운데 정렬 아이콘이 항상 붙음)을 썼는데, 이 화면에서는 아이콘 없는 버전으로 통일했다 — 주문 상태 관리의 취소 확인 모달과 동일한 패턴을 그대로 가져왔다: `WrapperModal`(`layout` 기본값, `title="알림"`) + `.table-layout-confirm-modal__notice`(제목 줄 + 설명 줄, `order-cancel-modal__notice`와 동일 구조)로 좌측 정렬 본문을 직접 구성한다([`docs/page/order-status-management.md`](./order-status-management.md) "주문 취소 처리" 참고).

세 동작이 확인 이후 흐름은 서로 다르다.

- **되돌리기 / 전체 비우기**: 효과가 캔버스에 바로 보이는 순수 로컬 state 조작이다(테이블이 그 자리에서 사라지거나 원래 위치로 옮겨감) — API 호출이 없으니 [`docs/async-patterns.md` §1](../async-patterns.md#1-mutation-결과-안내-모달-패턴)의 mutation 대상이 아니고, 완료 안내 모달도 두지 않는다(확인 → 즉시 반영 2단계로 끝). 주문 취소처럼 "정말 실행됐는지" 별도로 알려줘야 하는 업무적 액션이 아니라, 다른 화면의 검색폼 "초기화" 버튼과 같은 성격의 화면 조작이라는 판단이다. `confirmReset`/`confirmClearAll`은 동기 함수다.
- **저장**: 실제 `useSaveTableGui` API를 호출하는 동작이라 성공해도 화면이 바뀌지 않는다 — async-patterns.md §1의 `noticeState` 패턴을 그대로 따라 확인 모달의 `primaryAction.loading`을 `isSaving`에 연결하고, 성공/실패 결과를 `saveNotice`(`{ title, description } | null`)로 통일해 `SimpleDefaultModal`로 안내한다(`confirmSave`의 `try`/`catch`). `requestSave`도 같은 `saveNotice`를 재사용한다. 테이블·내부시설을 한 요청으로 같이 보내므로(ADR-017), 내부시설만 바뀌었어도 `isDirty`가 true라 정상적으로 저장된다 — "내부시설만 저장되지 않습니다" 같은 별도 안내는 더 이상 없다.

### 전체보기 — 보기 전용

전체보기로 캔버스가 축소된 상태에서 그대로 드래그/리사이즈/배치하면, 화면에 보이는 좌표(축소됨)와 실제 저장되는 좌표(고정 캔버스 1280×800 기준)가 축소 비율만큼 어긋나 데이터가 꼬일 수 있다. 그래서 전체보기 중에는 편집을 막는다.

- `TableLayoutCanvas.tsx`에서 `useDraggable`/`useDroppable`에 `disabled={isFitToScreen}`을 전달해 배치 아이템 드래그와 캔버스 드롭을 막는다.
- 내부시설 리사이즈 핸들은 `isFitToScreen`일 때 아예 렌더하지 않는다.
- 삭제(×) 버튼은 `onRemove`가 `undefined`면 아예 렌더하지 않는다(`TablePlacedCard`/`FacilityPlacedCard`/`CustomFacilityPlacedCard` 공통) — 전체보기는 미리보기이고 삭제 이벤트 자체가 비활성화라, 버튼을 흐리게 두는 대신 완전히 없앴다(과거에는 버튼은 그대로 두고 클릭만 막았었다).
- `handlePlaceTable`(테이블 리스트 클릭 배치)도 `isFitToScreen`이면 즉시 반환해 배치를 막는다 — 스크롤 좌표(`scrollLeft`/`scrollTop`)가 축소된 레이아웃 공간 기준이라 그대로 쓰면 좌표가 어긋난다.
- 사이드바도 같이 비활성화한다 — `FacilityListCard`/`TableListCard`는 `disabled` prop을 각 배치 버튼의 `disabled`에 더한다(`FacilityListCard`는 `.facility-list-card__item--disabled`로 흐리게 표시, `TableListCard`는 기존 "이미 배치됨" 조건과 OR). `TableLayoutCanvas` 헤더의 "커스텀 시설 추가" 버튼도 `disabled={isFitToScreen}`이다. 캔버스만 막고 사이드바를 그대로 두면 시설을 고를 수 있는데 배치는 막혀있어 어색하기 때문이다.
- 커스텀 시설 카드는 전체보기 중 `viewOnly` 스타일(고정 8종과 같은 실선/`--color-bg-muted`)로 바뀐다 — 편집 중이 아니므로 "휘발성 데이터" 표시(점선/반투명)가 필요 없다.
- 편집하려면 전체보기를 다시 눌러 원래 크기(scale 1)로 돌아온 뒤 한다.

축소 비율(`canvasScale`)은 `scrollNode.clientWidth`/`clientHeight`를 `TABLE_LAYOUT_CANVAS_SIZE`로 나눠 계산하고(`recomputeCanvasScale`), 1을 넘지 않게 제한한다(확대는 하지 않음). 전체보기 중에는 `ResizeObserver`로 스크롤 컨테이너 크기를 지켜보다가 창 크기가 바뀌면 다시 계산한다.

## Mock 데이터

`src/mocks/handlers.ts`에 `tableGuiOverrideHandler`(GET)/`tableGuiSaveOverrideHandler`(POST)를 직접 등록했다(orval이 자동 생성한 faker 기반 mock 대신, 고정 데이터로 교체). 데이터는 `features/table-layout/mock/tableLayoutMock.ts`의 `TABLE_GUI_MOCK_ROWS`(타입은 `objectType`을 포함한 `TableGuiResponseWire[]`)이며, `store-table`의 `STORE_TABLE_MOCK_ROWS`·`qr-code`의 `QR_CODE_MOCK_ROWS`에서 `useYn='Y'` + QR 등록된 테이블(`table-001`~`003`, `table-004`는 `useYn='N'`이라 제외)만 반영했다. `tableType` 없이 `tableName: '주방'`만 있는 `02` 행(`facility-mock-1`)을 하나 더 둬서 이름 기반 매칭(위 "저장/삭제" 절)이 실제로 동작하는지 확인할 수 있게 했다.

저장 핸들러는 `newItems`/`updateItems`를 `sysId` 매칭으로 반영하되, **매칭되는 `sysId`가 없으면(내부시설처럼 sysId 없이 새로 배치된 경우) mock에서 임의 sysId(`mock-<timestamp>-<random>`)를 발급해 새 행으로 추가한다** — 실제 백엔드의 INSERT를 흉내낸 것이다(과거에는 매칭 실패 시 조용히 무시했다). `delItems`는 좌표/크기 필드를 `undefined`로 되돌린다.

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
- **내부시설도 이제 응답에 섞여 온다(objectType 구분 필요)**: ADR-017 이후 `useGetTableGui` 응답에 테이블(`01`)뿐 아니라 내부시설(`02`/`03`)도 함께 내려온다. 플로어플랜은 배경 정보로 내부시설까지 그리고 싶을 수도, 테이블만 그리고 싶을 수도 있다 — 후자라면 이 화면처럼 `isTableGuiRow`로 먼저 걸러야 한다(안 거르면 내부시설 행까지 테이블로 오인해서 그릴 수 있다).

### 그 외 TODO

- **백엔드 `object_type` 스키마 확정**: 현재 프론트가 가정하고 있는 필드명(`objectType`)·값(`'01'|'02'|'03'`)·내부시설 종류 매칭 방식(`tableName`)은 전부 mock 우선 구현이다 — 실제 스키마가 나오면 `tableLayoutApi.ts`의 로컬 wire 타입/매핑 함수만 맞춰 조정한다. 상세는 [ADR-017](../decisions.md#adr-017--테이블-배치-관리-내부시설-영속화object_type-mock-우선-구현) 참고.
- **내부시설 카탈로그의 출처**: 지금은 `FACILITY_CATALOG`(고정 8종)이 프론트에 하드코딩돼 있다. 공통코드 API(`useSearchCommon`/`useSearchCommonDetail`)에서 받아오는 방식으로 바꿀지는 미정.
- **`tableType` 필드 활용**: 테이블(objectType `01`) 쪽은 여전히 항상 비워서 보낸다 — 테이블 모양/종류 구분이 필요해지면 프론트 타입과 UI를 추가하고 이 필드를 채운다(내부시설 쪽 `tableType`은 이미 종류 저장용으로 쓰고 있다 — 위 "저장/삭제" 절 참고).
- ~~캔버스 좌표와 반응형의 상충~~ — 2026-06-30 고정 크기 캔버스(`TABLE_LAYOUT_CANVAS_SIZE`) + 스크롤 도입으로 해결. 위 "좌표 모델" 참고.
