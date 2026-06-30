# 테이블 배치 관리 페이지 규약

> 경로: `/client/store/table/layout`
> 화면: 매장 > 테이블 정보 관리 > 테이블 배치 관리

마우스/터치 드래그와 클릭으로 테이블·내부시설을 캔버스에 자유롭게 배치하는 화면이다. 배치 크기(작게/보통/크게) 토글, 되돌리기/전체 비우기/전체보기/저장 버튼을 헤더에 둔다.

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
  - `DragOverlay`는 children을 감싸는 래퍼를 항상 "원래 드래그한 노드"(사이드바 가로 전체 `<li>`) 크기로 고정한다(dnd-kit 내부에서 `rect.width`/`rect.height`를 그대로 강제 — `Modifier`의 `draggingNodeRect`/`overlayNodeRect`도 이 래퍼 크기를 가리키는 같은 값이라 둘의 차이로 보정하는 방식은 동작하지 않는다). 이 래퍼는 포인터 이동을 그대로 따라가므로, 드래그 시작 시점에 클릭/터치한 지점은 래퍼 안에서 항상 같은 좌표에 있다.
    - `TableLayoutPage.tsx`의 `getPointerOffsetInRect`가 그 좌표(`dragGrabOffset`)를 계산해 state로 들고 있다가, `DragOverlay` 안의 `.table-layout-drag-overlay__anchor`(`position: absolute; transform: translate(-50%, -50%)`)에 `left`/`top`으로 그대로 꽂는다. 그 결과 작은 미리보기 카드(`FacilityPlacedCard`)가 항상 실제로 클릭/터치한 지점에 중심이 맞춰진 채 커서를 따라다닌다(이전에는 래퍼 기본 정렬(좌상단)을 그대로 써서, 행 우측 드래그 핸들을 잡아도 미리보기가 행 왼쪽에 붙어 보였다).
    - 좌표 계산은 `event.active.rect.current.initial`이 아니라 클릭한 DOM 요소(`event.activatorEvent.target.closest('.facility-list-card__item')`)의 `getBoundingClientRect()`로 한다. `active.rect.current.initial`은 dnd-kit이 `useLayoutEffect`로 드래그 시작 *이후*에 채우는 값이라 `onDragStart` 콜백 시점에는 아직 `null`이다 — 이걸 모르고 처음 구현했을 때는 좌표 계산이 항상 실패해 다시 기본(좌상단) 위치로 보이는 회귀가 있었다.
- **테이블**: `TableListCard` 항목은 드래그가 아니라 **클릭**이다. 클릭하면 배치되고, 그 테이블은 목록에서 비활성화된다(같은 테이블 중복 배치 방지). 배치 위치는 캔버스 전체의 중앙이 아니라 **지금 스크롤해서 보고 있는 영역의 좌상단**(여백 24px, 캔버스 밖으로 나가지 않게 클램프)이다 — 캔버스가 고정 크기(1280×800)라 화면보다 클 수 있는데, 전체 중앙을 기준으로 하면 다른 곳을 스크롤해서 보고 있을 때 클릭해도 배치된 테이블이 화면 밖이라 안 보이는 문제가 있어서 보이는 영역 기준으로 바꿨다(`handlePlaceTable`, `useTableLayoutPage.ts`).

캔버스에 배치된 항목(테이블·내부시설 공통)은 다시 `useDraggable`(`{ origin: 'placed', id }`)로 자유 이동할 수 있다. 이동/배치 직후 좌표·크기는 `event.active.rect.current.translated`(드롭 시점의 실제 렌더 크기)에서 읽어 캔버스 경계 안으로 클램프한다.

### 가장자리 스냅

> 추가일: 2026-06-30

드롭한 위치 근처(`constants.ts`의 `SNAP_THRESHOLD_PX`, 20px 이내 — 터치 입력은 마우스보다 정밀도가 떨어져 태블릿 사용을 고려해 8px에서 넓혔다)에 다른 배치 아이템(테이블·내부시설 구분 없이 전부 대상)이 있으면 자동으로 정렬된다(`utils.ts`의 `snapPositionToNearbyItems`). 테이블을 줄지어 배치하거나 일정한 간격으로 나열하고 싶을 때 손으로 픽셀을 맞추지 않아도 되게 하기 위함이다. 두 종류의 후보를 같이 본다.

1. **가장자리 일치** — 다른 아이템의 좌/우(X축) 또는 상/하(Y축) 끝에 맞춘다.
2. **균등 간격 이어가기** — 같은 행(세로 범위가 겹치는 아이템들, X축 기준) 또는 같은 열(가로 범위가 겹치는 아이템들, Y축 기준)에 이미 일정한 간격으로 놓인 두 아이템이 있으면, 그 간격을 그대로 이어가는 위치도 후보에 넣는다(`spacingCandidatesX`/`spacingCandidatesY`). 테이블 3개를 같은 간격으로 나란히 놓고 싶을 때, 처음 두 개의 간격을 세 번째에도 그대로 적용해준다.

- x축/y축은 독립적으로 계산한다 — 가로만 줄을 맞추고 세로는 자유롭게 두는 것도 가능하다.
- 두 종류(가장자리/균등 간격)의 후보를 모두 모은 뒤, 각 축에서 임계값 이내 중 가장 가까운 후보 하나만 선택한다 — 어느 쪽이 더 가까운지에 따라 자동으로 결정되고, 우선순위를 따로 두지 않는다.
- 스냅은 **드롭 시점에만** 일어난다(드래그 중 실시간 스냅·가이드라인 표시는 하지 않는다) — `handleDragEnd`(`useTableLayoutPage.ts`)에서 클램프 직전에 적용하고, 스냅으로 캔버스 밖으로 나갈 수 있으니 스냅 이후 다시 한번 클램프한다.
- 캔버스에 새로 드롭하는 경우(`facility-catalog` origin)와 이미 배치된 아이템을 옮기는 경우(`placed` origin) 모두 적용된다. 옮기는 경우에는 자기 자신을 스냅 대상에서 제외한다.
- 스냅 자체는 좌표만 조용히 맞추고, 별도 강조 애니메이션은 없다 — 처음에 스냅 여부를 알려주려고 짧은 테두리 강조 애니메이션을 붙여봤지만, "정렬 기능 자체만 있으면 되고 모션은 필요 없다"는 피드백으로 제거했다.

### 드롭 애니메이션 비활성화

`DragOverlay`의 기본 `dropAnimation`은 드롭 시 미리보기를 최종 위치로 이동시키는 애니메이션을 재생하는데, `flushSync`로 새 아이템이 동기 반영되기 전에 애니메이션이 먼저 시작되면 미리보기가 (아직 캔버스에 없는) 최종 위치 대신 원래 출발지(사이드바 목록)로 되돌아가는 것처럼 보이는 경우가 있었다. `<DragOverlay dropAnimation={null}>`로 드롭 애니메이션 자체를 꺼서 없앴다.

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

배치 아이템(`PlacedItem` = `PlacedTableItem | PlacedFacilityItem`, `types.ts`)은 캔버스 컨테이너 기준 절대 px(`x`, `y`, `width`, `height`)로 저장한다. 백엔드 `table_gui`가 `x_coordinate`/`y_coordinate`/`height`/`width`를 정수 px로 그대로 저장하는 컬럼이라, 비율(%) 변환 없이 1:1로 맞춘 것이다.

> 추가일: 2026-06-30 — 캔버스는 화면 폭에 따라 늘어나거나 줄어들지 않는 **고정 크기**다(`constants.ts`의 `TABLE_LAYOUT_CANVAS_SIZE`, 1280×800). 화면이 좁으면 캔버스 전체가 작아지는 대신 카드(`TableLayoutCanvas.css`의 `.table-layout-canvas-card`) 안에서 스크롤된다(`.table-layout-canvas-scroll`, `overflow: auto`). 좌표가 항상 같은 고정 좌표 공간 기준이라, 어떤 화면 크기에서 열어도 배치된 그대로(상대 위치·간격·비율)가 똑같이 보인다 — 직전까지는 캔버스가 `flex: 1`로 화면 크기에 맞춰 늘어나는 구조라 화면마다 배치가 다르게 보일 수 있는 한계가 있었는데, 이 변경으로 해소됐다. 클램프(`handleDragEnd`/`handlePlaceTable`/`handleResizeFacility`, `useTableLayoutPage.ts`)도 캔버스의 실제 렌더 크기(`getBoundingClientRect()`) 대신 이 고정 크기 상수를 기준으로 계산한다. 캔버스 크기가 더 이상 안 바뀌므로, 창 크기 변경 시 좌표를 다시 클램프하던 `ResizeObserver` 로직은 제거했다.
>
> 백엔드 `table_gui` 스키마(`xcoordinate`/`ycoordinate`/`width`/`height`)는 그대로 절대 px 정수만 받기 때문에 이 변경에 백엔드 협의나 스키마 추가가 필요 없다 — 캔버스 크기는 프론트엔드에만 존재하는 상수이고 서버로 전달되지 않는다.

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
| 되돌리기 (아이콘만, `i-return`) | 확인 모달("초기 저장됐던 배치로 되돌리시겠습니까? / 저장하지 않은 변경 내용은 모두 사라집니다.") → draft를 서버에서 불러온 마지막 저장 상태(`baseItems`)로 되돌린다(`requestReset`/`confirmReset`). 내부시설은 저장 대상이 아니므로 되돌리면 전부 사라진다. |
| 전체 비우기 (아이콘만, `i-trash`) | 확인 모달("배치된 모든 테이블·내부시설을 화면에서 비우시겠습니까? / 저장 전까지는 실제로 반영되지 않습니다.") → 캔버스의 모든 아이템(테이블+내부시설)을 draft에서 비운다(`requestClearAll`/`confirmClearAll`). 저장을 눌러야 실제로 테이블 좌표가 삭제(`delItems`)된다. |
| 전체보기 | 캔버스(고정 1280×800)가 화면보다 클 때, 전체가 한 번에 보이도록 축소해서 보여준다(`toggleFitToScreen`/`canvasScale`, `useTableLayoutPage.ts`). 다시 누르면 원래 크기로 돌아온다. `leftIcon={<Icon id="i-expand" />}`(네 모서리 화살표, Figma 소스 없이 직접 그린 아이콘 — `components.md` "신규 아이콘 추가 방법" 예외 케이스에 추가)로 "저장" 바로 왼쪽에 둔다. 평소엔 `variant="tinted"`이고, 전체보기로 켜져 있는 동안은(드래그/배치를 못 하는 보기 전용 상태라는 걸 알리기 위해) `variant="primary"`로 바뀐다(`aria-pressed={isFitToScreen}`도 함께 전달). |
| 저장 | 테이블 변경사항이 있으면(`isDirty === true`) 확인 모달("저장하시겠습니까? / 배치한 테이블 좌표를 저장합니다.")을 띄우고, 확인 시 `useSaveTableGui` 호출 후 `queryKeys.tableLayout.lists`를 무효화하고 결과 안내("저장되었습니다." 또는 오류 메시지)를 띄운다. 테이블 변경 없이 내부시설만 배치된 상태면 "내부시설만 저장되지 않습니다. 테이블을 배치한 뒤 다시 저장해 주세요." 안내를 띄운다(둘 다 없으면 아무 동작도 하지 않는다). |

`isDirty`는 테이블(`draftTableItems`)만 기준으로 계산한다(`usePreventLeave(isDirty)`로 새로고침/탭 닫기 경고에도 연동) — 내부시설 변경은 저장 대상이 아니라서 dirty 판정에 포함하지 않는다.

### 되돌리기 / 전체 비우기 / 저장 — 확인 모달은 아이콘 없는 버전으로 통일

셋 다 처음에는 `window.confirm()`이나 `ConfirmModal`/`SaveConfirmModal`/`DeleteConfirmModal`(전부 `layout="notice"`라 가운데 정렬 아이콘이 항상 붙음)을 썼는데, 이 화면에서는 아이콘 없는 버전으로 통일했다 — 주문 상태 관리의 취소 확인 모달과 동일한 패턴을 그대로 가져왔다: `WrapperModal`(`layout` 기본값, `title="알림"`) + `.table-layout-confirm-modal__notice`(제목 줄 + 설명 줄, `order-cancel-modal__notice`와 동일 구조)로 좌측 정렬 본문을 직접 구성한다([`docs/page/order-status-management.md`](./order-status-management.md) "주문 취소 처리" 참고).

세 동작이 확인 이후 흐름은 서로 다르다.

- **되돌리기 / 전체 비우기**: 효과가 캔버스에 바로 보이는 순수 로컬 state 조작이다(테이블이 그 자리에서 사라지거나 원래 위치로 옮겨감) — API 호출이 없으니 [`docs/async-patterns.md` §1](../async-patterns.md#1-mutation-결과-안내-모달-패턴)의 mutation 대상이 아니고, 완료 안내 모달도 두지 않는다(확인 → 즉시 반영 2단계로 끝). 주문 취소처럼 "정말 실행됐는지" 별도로 알려줘야 하는 업무적 액션이 아니라, 다른 화면의 검색폼 "초기화" 버튼과 같은 성격의 화면 조작이라는 판단이다. `confirmReset`/`confirmClearAll`은 동기 함수다.
- **저장**: 실제 `useSaveTableGui` API를 호출하는 동작이라 성공해도 화면이 바뀌지 않는다 — async-patterns.md §1의 `noticeState` 패턴을 그대로 따라 확인 모달의 `primaryAction.loading`을 `isSaving`에 연결하고, 성공/실패 결과를 `saveNotice`(`{ title, description } | null`)로 통일해 `SimpleDefaultModal`로 안내한다(`confirmSave`의 `try`/`catch`). `requestSave`도 같은 `saveNotice`를 재사용한다 — 테이블 변경 없이 내부시설만 배치된 상태로 저장을 누르면(`isDirty === false`이지만 `placedItems`에 시설이 있으면) 조용히 무시하는 대신 "내부시설만 저장되지 않습니다. 테이블을 배치한 뒤 다시 저장해 주세요." 안내를 띄운다.

### 전체보기 — 보기 전용

전체보기로 캔버스가 축소된 상태에서 그대로 드래그/리사이즈/배치하면, 화면에 보이는 좌표(축소됨)와 실제 저장되는 좌표(고정 캔버스 1280×800 기준)가 축소 비율만큼 어긋나 데이터가 꼬일 수 있다. 그래서 전체보기 중에는 편집을 막는다.

- `TableLayoutCanvas.tsx`에서 `useDraggable`/`useDroppable`에 `disabled={isFitToScreen}`을 전달해 배치 아이템 드래그와 캔버스 드롭을 막는다.
- 내부시설 리사이즈 핸들은 `isFitToScreen`일 때 아예 렌더하지 않는다.
- 삭제(×) 버튼은 `onRemove`를 `undefined`로 넘겨 동작만 비활성화한다(버튼 자체는 그대로 보인다).
- `handlePlaceTable`(테이블 리스트 클릭 배치)도 `isFitToScreen`이면 즉시 반환해 배치를 막는다 — 스크롤 좌표(`scrollLeft`/`scrollTop`)가 축소된 레이아웃 공간 기준이라 그대로 쓰면 좌표가 어긋난다.
- 사이드바도 같이 비활성화한다 — `FacilityListCard`는 `disabled` prop으로 각 항목의 `useDraggable`을 `disabled` 처리하고(`.facility-list-card__item--disabled`로 흐리게 표시), `TableListCard`는 `disabled` prop을 배치 버튼의 `disabled`(기존 "이미 배치됨" 조건과 OR)에 더한다. 캔버스만 막고 사이드바를 그대로 두면 시설을 집어 들었는데 드롭이 막혀있어 어색하기 때문이다.
- 편집하려면 전체보기를 다시 눌러 원래 크기(scale 1)로 돌아온 뒤 한다.

축소 비율(`canvasScale`)은 `scrollNode.clientWidth`/`clientHeight`를 `TABLE_LAYOUT_CANVAS_SIZE`로 나눠 계산하고(`recomputeCanvasScale`), 1을 넘지 않게 제한한다(확대는 하지 않음). 전체보기 중에는 `ResizeObserver`로 스크롤 컨테이너 크기를 지켜보다가 창 크기가 바뀌면 다시 계산한다.

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
- ~~캔버스 좌표와 반응형의 상충~~ — 2026-06-30 고정 크기 캔버스(`TABLE_LAYOUT_CANVAS_SIZE`) + 스크롤 도입으로 해결. 위 "좌표 모델" 참고.
