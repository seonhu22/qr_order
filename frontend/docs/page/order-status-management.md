# 주문 상태 관리 페이지 규약

> 경로: `/client/order/status/management`
> 화면: 매장 > 주문 > 주문 현황 > 주문 상태 관리

칸반형 보드 화면이다. 접수/조리중/서빙완료/취소 4개 컬럼으로 주문을 분류해 보여주고, 각 컬럼은 독립적으로 스크롤된다.

## 표기 규칙

- **결제완료 제외**: 조회 응답의 결제상태가 `PAID`(완료)인 주문은 어떤 컬럼에도 표시하지 않는다. 현재 결제완료 저장 API는 연동 전이므로 모달 조작만으로 카드를 제거하지 않는다.
- **취소는 당일만 표시**: 취소(`CANCELLED`) 컬럼은 취소 처리 시각(`cancelledAt`)이 오늘 날짜인 주문만 보여준다. 어제 이전에 취소된 주문은 보드에서 제외된다.
- 컬럼 헤더의 숫자는 위 두 규칙을 적용하고 남은(=화면에 실제로 보이는) 카드 수다.
- 최초 조회 카드는 각 컬럼 안에서 주문 접수 시각(`orderDatetime`) 오름차순으로 정렬한다.
- 상태를 변경해 다른 컬럼으로 이동한 카드는 대상 컬럼 맨 아래에 배치한다. 이동 카드끼리는 상태 변경 시각(`statusChangedAt`) 오름차순으로 정렬한다. 현재 Mock API가 이 시각을 기록하며, 실제 API 전환 시 같은 의미의 응답 필드가 필요하다.

## 컬럼별 버튼과 동작

| 컬럼 | 버튼 | 동작 |
|---|---|---|
| 접수 | 조리시작 | `orderStatus`를 `COOKING`으로 변경 |
| 접수 | 수정 | 주문 수정 모달 흐름을 연다 (아래 "주문 수정" 참고) |
| 접수 | 취소 | 취소 모달 흐름을 연다 (아래 "주문 취소 처리" 참고) |
| 조리중 | 서빙완료 | `orderStatus`를 `SERVED`로 변경 |
| 조리중 | 이전 | `orderStatus`를 `RECEIVED`로 되돌림 |
| 조리중 | 수정/취소 | 접수 컬럼과 동일 |
| 서빙완료 | 결제처리 | 결제 처리 모달 흐름을 연다 (아래 "결제 처리" 참고) |
| 서빙완료 | 이전 | `orderStatus`를 `COOKING`으로 되돌림 |
| 서빙완료 | 수정/취소 | 접수 컬럼과 동일 |
| 취소 | 취소사유 | 저장된 취소사유/상세사유를 읽기 전용으로 보여주는 모달을 연다 (아래 "취소사유 보기" 참고) |
| 취소 | 삭제(휴지통 아이콘) | 주문 id를 브라우저 메모리의 숨김 목록에 추가해 현재 화면에서만 감춘다. 서버 데이터는 삭제하지 않는다 |

상태 변경 버튼(조리시작/서빙완료/이전)은 모달 없이 API를 호출한다. 성공 응답을 받은 뒤 목록 쿼리를 무효화하고 다시 조회한 결과로 화면을 갱신한다. 낙관적 업데이트는 사용하지 않는다.

## 주문 취소 처리 (모달 흐름)

`useOrderCancelModalFlow` (위치: `features/order-status-management/hooks/useOrderCancelModalFlow.ts`)가 3단계를 관리한다.

1. **취소사유 입력** — `WrapperModal`. 안내문 2줄 + 취소사유 콤보(필수) + "기타" 선택 시에만 나타나는 상세입력 textarea(필수). "확인"을 누르면 유효성 검사를 통과해야 다음 단계로 넘어간다.
2. **취소 확인** — `WrapperModal`(layout="default", title="알림") + `.order-cancel-modal__notice` 본문("주문을 취소하시겠습니까?" + "취소된 주문은 되돌릴 수 없습니다."). `ConfirmModal`(layout="notice", 중앙 정렬 아이콘) 대신 1단계 모달과 같은 좌측 정렬 형태를 그대로 재사용했다. "확인"을 누르면 취소 API를 호출한다. 성공할 때만 모달을 닫고 완료 안내를 열며, 실패하면 입력값과 두 모달을 유지해 다시 시도할 수 있게 한다.
3. **취소 완료 안내** — `SimpleDefaultModal`(기본 모달, 버튼 1개). 닫으면 전체 흐름 상태가 초기화된다.

취소사유 옵션은 `constants.ts`의 `ORDER_CANCEL_REASON_OPTIONS`에서 관리하며, 백엔드에 사유를 선택지로 제공하는 API가 없어 임의로 정의했다(재고품절/고객 요청/주문 오류/영업 종료/기타). 확정된 취소 사유 목록이 정해지면 이 배열만 교체하면 된다.

선택한 사유와 상세입력은 취소 API 요청의 `cancelReason`/`cancelDescription`으로 전달한다. 처리 중에는 같은 주문의 중복 동작을 막는다.

## 취소사유 보기 (읽기 전용 모달)

취소(`CANCELLED`) 컬럼 카드의 "취소사유" 버튼을 누르면 `WrapperModal`이 열린다. 입력 없이 보기만 하는 모달이라 버튼은 "닫기" 1개뿐이다(`primaryAction`만 전달하고 `secondaryAction`은 전달하지 않음).

- 주문번호·취소일시는 `TextInput`, 취소사유는 길어질 수 있어 `TextareaInput`(3행)에 각각 `readOnly`만 주고 그대로 렌더한다. 별도 "상세사유" 필드는 두지 않고, `formatOrderCancelReasonDisplay`가 코드값을 한글 라벨로 바꾼 뒤 "기타"일 때만 상세사유를 괄호로 붙여 취소사유 한 줄에 함께 보여준다(예: "기타 (배송 지연)").
- "취소일시"는 카드의 "취소시간 HH:MM"(`OrderStatusCard.tsx`)과 달리 날짜까지 보여준다 — `formatOrderBoardDateTime`(`utils.ts`)이 `row.cancelledAt`(없으면 `orderDatetime`)을 "YYYY-MM-DD HH:MM"으로 바꾼다. 날짜+시간을 함께 보여줄 때는 이 코드베이스의 "시작일시"/"종료일시" 컨벤션을 따라 "~일시"로 라벨을 짓는다(시간만 보여주는 카드 쪽은 "주문시간"/"취소시간"으로 유지).
- 모달을 열 때 선택한 카드와 취소사유 응답을 깊은 복사한 스냅샷으로 보관한다. Polling 결과가 갱신돼도 열려 있는 모달의 내용은 자동으로 바뀌지 않는다.
- 취소사유는 Orval 생성 GET 함수를 필요할 때만 호출한다. 현재 생성 타입이 중첩된 `header.sysId`를 충분히 표현하지 못해 feature-local wrapper에서 호환 처리하며, OpenAPI 수정과 regenerate 후 제거한다.

### 취소 컬럼 카드 삭제(화면에서만)

"취소사유" 버튼 오른쪽에 정사각형 휴지통 아이콘 버튼(`.order-status-card__dismiss`, `variant="icon"` + `i-trash`)을 둔다. 누르면 바로 지우지 않고 `DeleteConfirmModal`을 먼저 띄운다 — 백엔드 데이터를 진짜로 지우는 게 아니라서 다른 화면의 "삭제하면 복구할 수 없습니다." 문구([`docs/components/Modal.md` #16](../components/Modal.md))를 그대로 쓰지 않고, `description`에 `\n`으로 줄바꿈한 두 줄("이 카드를 화면에서 삭제합니다." / "실제 주문 데이터는 삭제되지 않습니다.")과 `helperText`("정말 삭제하시겠습니까?")로 화면에서만 지워진다는 점을 명시했다(`\n` 줄바꿈은 [`docs/components/Modal.md` #17](../components/Modal.md) 패턴).

"확인"을 누르면 주문 id를 `dismissedOrderIds: Set<string>`에 추가한다. 조회 데이터와 React Query 캐시는 수정하지 않고 렌더링할 때 해당 id만 제외하므로 Polling과 수동 새로고침 후에도 같은 브라우저 화면에서는 계속 숨겨진다. `localStorage`를 사용하지 않으므로 페이지 새로고침·재진입 시 숨김 목록은 초기화된다.

확인 대상은 `dismissConfirm.targetId`(`useOrderStatusBoardPage.ts`) 하나만 들고 있는다 — 취소사유 보기(`cancelReasonView`)와 같은 단순 open/close 패턴이다.

이 버튼은 카드 액션 영역의 "4개가 한 줄에 맞는 1/4 폭 고정" 규칙(`.order-status-card__actions .btn`, 위 "상태별 버튼 그룹" 참고)을 따르지 않고 `.order-status-card__actions .order-status-card__dismiss`로 같은 명시도를 맞춰 덮어쓴다. 높이를 고정값으로 박아두지 않고, `.order-status-card__actions`의 기본 `align-items: stretch`로 옆의 "취소사유" 버튼(패딩 기반 auto-height)과 세로 크기를 자동으로 맞춘 뒤 `aspect-ratio: 1 / 1`로 가로를 그 높이에 맞춰 정사각형을 만든다 — 옆 버튼의 패딩/폰트 토큰이 바뀌어도 두 버튼의 세로 크기가 항상 같게 유지된다.

관련 백엔드 API와 필드 대응 관계는 아래 "Mock → 실제 API 전환 가이드"에 모아뒀다.

## 결제 처리 (모달 흐름)

> 현재 결제 대상 선택·영수증·미결제 사유 입력 UI까지만 유지한다. 최종 결제완료/미결제 저장은 백엔드 계약 연동 전까지 비활성화되어 있으며 보드 데이터를 변경하지 않는다.

`useOrderPaymentModalFlow` (위치: `features/order-status-management/hooks/useOrderPaymentModalFlow.ts`)가 모달 단계와 입력 draft를 관리한다.

1. **결제완료/미결제/닫기 선택** — `WrapperModal`(size="sm", Figma 360px와 동일). 버튼이 3개라 `WrapperModal`의 기본 footer(최대 2개)를 쓰지 않고, `children` 안에 버튼 3개(`결제완료`=primary, `미결제`=neutral, `닫기`=outline)를 직접 두고 `.order-payment-modal__actions`로 footer처럼 보이게 스타일링했다. 이 모달은 `primaryAction`/`secondaryAction`을 아예 전달하지 않는다. "미결제"는 처음엔 danger(빨강)였다가, 수정 모달의 메뉴 줄 "취소" 버튼과 색을 맞춰달라는 요청으로 `neutral`로 바꿨다.
   - **결제완료**: 선택 모달을 닫고 2-A단계(영수증 확인) 모달을 연다.
   - **미결제**: 선택 모달을 닫고 2-B단계(미결제사유 입력) 모달을 연다.
2-A. **결제완료 영수증 확인** — `WrapperModal`(size="md", Figma 480px와 동일). Figma 디자인은 **같은 테이블의 결제 대상 주문을 전부 합친 영수증**이다(주문 단위가 아니라 테이블 단위 결제). `getPayableOrdersForTable(rows, tableNum)`(위치: `utils.ts`)이 클릭한 카드와 같은 `tableNum`이면서 `orderStatus === 'SERVED'`이고 아직 `paymentStatus !== 'PAID'`인 주문을 전부 모아 영수증에 렌더한다(접수/조리중 주문은 아직 결제 대상이 아니라서 제외). 최종 "확인"은 API 계약 연동 전까지 안내만 표시하며 결제상태를 바꾸지 않는다.
   - 주문번호 옆에 그 주문의 칸반 상태를 배지로 보여준다(`.order-status-badge`, `getOrderBoardStatusLabel`/`ORDER_BOARD_STATUS_BADGE_CLASS` — `utils.ts`/`constants.ts`). 색상은 칸반 컬럼 숫자 라벨(`.order-status-column__count`)과 동일하게 접수=info/조리중=warning/서빙완료=success/취소=error를 그대로 맞췄다. 이 영수증은 `getPayableOrdersForTable`이 이미 `SERVED`만 모아서 항상 같은 배지가 찍히지만, 주문 수정 모달과 시각 언어를 통일하기 위해 동일하게 표시한다.
   - 각 메뉴/옵션 줄은 Figma와 동일하게 "메뉴명+수량 / 수량 / 단가 / 금액(수량×단가)" 4열로 보여준다(`.order-payment-receipt__line`, CSS grid). 이 때문에 `OrderBoardMenuItem`/`OrderBoardOptionItem`에 `unitPrice`(단가)가 필요해졌고, 주문 총액은 더 이상 저장값이 아니라 항상 `calculateOrderTotal`(`utils.ts`)로 메뉴/옵션 단가에서 계산한다 — 카드(`OrderStatusCard`)도 같은 함수를 쓴다. 저장된 `totalPrice` 필드는 단가와 어긋날 수 있어 타입에서 제거했다.
   - 주문이 많아 모달이 넘치면 "{테이블}번 테이블" 제목과 맨 아래 "총 주문건/총 주문메뉴/총합" 요약은 고정해서 항상 보이고, 그 사이의 주문 내역(`.order-payment-receipt__order-list`)만 내부 스크롤된다. `.order-payment-receipt`/`.order-payment-receipt__order-list`가 `flex: 1 1 auto; min-height: 0`으로 `.base-modal__content`의 flex 체인([`docs/components/Modal.md` #23](../components/Modal.md))을 이어받아 모달의 실제 남는 공간만 채우고, `max-height: min(45vh, 22rem)`은 항목이 적어 공간이 남을 때 지나치게 늘어나지 않게 막는 상한선으로만 둔다.
2-B. **미결제사유 입력** — `WrapperModal`(size="md"). 안내문 2줄 + 미결제사유 콤보(필수) + "기타" 선택 시에만 나타나는 상세입력 textarea(필수). 취소 처리의 1단계와 동일한 구조다. **결제완료와 달리 미결제는 클릭한 카드 1건에만 적용된다** — 같은 테이블의 다른 주문에 영향을 주지 않는다(Figma에 미결제의 테이블 묶음 처리가 명시돼 있지 않아 단일 주문 단위로 유지).
3. **확인** → 유효성 검사는 수행하지만, 최종 미결제 저장은 API 계약 연동 전까지 안내만 표시하고 `paymentStatus`를 바꾸지 않는다.

미결제사유 옵션은 `constants.ts`의 `ORDER_UNPAID_REASON_OPTIONS`에서 관리하며(카드 단말기 오류/고객 부재/결제 거절/추후 결제 예정/기타), 취소사유와 마찬가지로 백엔드에 확정된 목록이 없어 임의로 정의했다.

선택한 사유와 상세입력은 모달 draft로만 유지한다. 백엔드 계약 연동 후 미결제 요청의 `unpaidReason`/`unpaidDescription`으로 전달해야 한다.

mock에는 `getPayableOrdersForTable` 동작을 1건/2건/3건 묶음 모두 확인할 수 있도록 4번 테이블(1건, `order-005`) / 2번 테이블(2건, `order-003`,`order-023`) / 5번 테이블(3건, `order-004`,`order-021`,`order-022`)을 일부러 넣어뒀다.

### WrapperModal 공용 컴포넌트 수정 사항

이 결제 선택 모달이 처음으로 `primaryAction`/`secondaryAction`을 둘 다 전달하지 않는 케이스였다. 기존 `WrapperModal`은 액션이 없어도 `<footer>`를 항상 렌더해서 빈 테두리 박스가 본문 아래에 남는 문제가 있었다 — `WrapperModal.tsx`에서 `hasPrimaryAction || hasSecondaryAction`일 때만 `<footer>`를 렌더하도록 수정했다. 다른 화면은 전부 액션을 최소 1개 전달하고 있어 동작에 영향이 없다.

## 주문 수정 (모달 흐름)

> 현재 테이블별 주문 편집·메뉴/옵션 추가 draft UI까지만 유지한다. 최종 저장은 백엔드 계약 연동 전까지 비활성화되어 있으며 보드 데이터를 변경하지 않는다.

`useOrderEditModalFlow` (위치: `features/order-status-management/hooks/useOrderEditModalFlow.ts`)가 처리한다. 결제 처리와 마찬가지로 **테이블 단위**로 묶어서 보여주지만, 결제와 달리 상태 제한이 없다 — `getEditableOrdersForTable(rows, tableNum)`(`utils.ts`)이 같은 테이블에서 취소·결제완료되지 않은 주문(접수/조리중/서빙완료 전부)을 모은다.

1. **주문 수정** — `WrapperModal`(size="md", Figma 480px). 상단에 "{테이블}번 테이블" + "+ 메뉴 추가" 버튼, 그 아래 결제 영수증과 같은 4열(메뉴명+수량/수량/단가/금액) 줄에 **취소 버튼 칸이 추가된 5열** 레이아웃이다(`.order-edit-modal__line`). 줄마다 "취소" 텍스트 버튼을 두니 반복돼서 눈에 피로하다는 피드백으로, `variant="icon"` + `i-close` 아이콘만 있는 X 버튼(`aria-label="취소"`)으로 바꿨다 — "메뉴 추가" 모달의 "추가된 항목" 미리보기 줄도 같은 클래스(`.order-edit-modal__line-cancel`)를 재사용해 동일하게 X 버튼이다. 클릭하면 그 줄(과 옵션)을 draft/미리보기에서 제거한다. 옵션 줄은 카드(`OrderStatusCard`)의 옵션 스타일과 통일해, 좌측 라인 + 옅은 배경 박스(`.order-edit-modal__option-list`)로 메인 메뉴와 구분해 보여준다. 결제완료 영수증의 옵션 줄(`.order-payment-receipt__option-list`)도 같은 스타일로 맞췄다.
   - 이 X 버튼은 그리드 5번째 컬럼 폭(`1.875rem`, 30px)에 맞춘 `size="sm"` 아이콘 버튼이라, 그 폭을 그대로 키우면 그리드 레이아웃이 깨진다. 시각적 크기는 30px 그대로 두고, `::before` 가짜 요소로 보이지 않는 히트 영역만 44px(터치 권장 최소 크기)로 넓혔다 — 테이블 배치 관리의 리사이즈 핸들 터치 영역 확장([`docs/page/table-layout-management.md`](./table-layout-management.md))과 같은 기법이다.
   - `getEditableOrdersForTable`은 같은 테이블의 접수/조리중/서빙완료 주문을 상태 구분 없이 한 번에 모으기 때문에, 결제 영수증과 달리 이 모달에서는 주문마다 상태가 실제로 다를 수 있다. 그래서 주문번호 옆에 칸반 상태 배지(`.order-status-badge`, 결제 영수증과 동일 — 위 "결제 처리" 항목 참고)를 붙여 어떤 주문이 접수/조리중/서빙완료 단계인지 한눈에 구분할 수 있게 했다. "메뉴 추가"로 생긴 새 주문은 항상 `RECEIVED`라 상태 배지는 "접수"로 뜨고, 그 옆에 "새 주문" 배지가 추가로 붙는다.

"메뉴 추가"로 새로 생긴 주문(원래 수정 대상이 아니었던 주문)은 `editModal.originalOrderIds`에 없는 주문 id로 판별해서 `.order-edit-modal__order--new`(브랜드색 좌측 라인 + 옅은 브랜드 배경)와 주문번호 옆 "새 주문" 배지(`.order-edit-modal__new-badge`)로 구분해 보여준다. 이 새 주문 블록은 자체 박스 스타일을 이미 갖고 있어, 그 안의 옵션 줄에는 박스(좌측 라인+배경) 없이 들여쓰기만 하는 `.order-edit-modal__option-list--plain` 모디파이어를 추가로 붙인다 — 그대로 두면 옵션 박스가 새 주문 박스 안에 중첩되어 보이기 때문이다. 기존 주문(`draftOrders` 중 `originalOrderIds`에 있는 주문)의 옵션은 원래 박스 스타일(`.order-edit-modal__option-list`)을 그대로 쓴다.
   - **모든 변경은 draft다.** 모달을 열 때 대상 주문들을 깊은 복사해 `draftOrders`로 들고 있다가, "확인"을 누르면 2단계(수정 확인)로 넘어간다. "닫기"는 draft를 그대로 버린다(되돌릴 필요 없이 단순 폐기).
   - 주문 목록 아래에 `draftOrders` 전체를 합산한 "총 합계"(`.order-edit-modal__total`)를 결제 영수증 요약(`.order-payment-receipt__summary-row--total`)과 같은 스타일(상단 굵은 테두리 + 큰 글씨)로 보여준다. 결제 영수증과 동일하게 `.order-edit-modal`/`.order-edit-modal__order-list`가 `flex: 1 1 auto; min-height: 0`으로 `.base-modal__content`의 flex 체인([`docs/components/Modal.md` #23](../components/Modal.md))을 이어받아, 위 헤더("{테이블}번 테이블" + "메뉴 추가")와 이 "총 합계"는 고정되고 주문 목록만 모달의 남는 공간 안에서 스크롤된다.
2. **메뉴 추가** — 위에서 또 한 단계 쌓이는 `WrapperModal`(size="md", Figma 480px). 위쪽은 `MENU_CATALOG_MOCK`을 카테고리별로 묶어 보여주는 스크롤 목록(`groupMenuCatalogByCategory`, 각 줄에 이미지 박스 자리 + 메뉴명/가격 + "추가" 버튼=`tinted`), 아래쪽은 옅은 회색 박스(`.order-menu-picker__added`)로 지금까지 추가한 항목을 결제 영수증과 같은 4열+취소버튼 줄로 보여준다. 카테고리 제목 옆에는 그 카테고리에 속한 메뉴 개수를 알약형 라벨(`.order-menu-picker__category-count`)로 표시한다. 메뉴에 옵션이 있으면(`item.optionCategories.length > 0`) 메뉴명 옆에 "옵션" 라벨(`.order-menu-picker__catalog-option-count`)을 표시해, 옵션 추가 모달이 한 번 더 뜨는 메뉴를 미리 구분할 수 있게 한다. 개수가 아니라 유무만 표시한다. 이 라벨의 위아래 패딩이 있는 알약 모양(`padding: var(--spacing-1) var(--spacing-2)`, `font-weight: body`)을 기준으로 "새 주문" 배지(`.order-edit-modal__new-badge`)의 모양도 맞췄다 — 색은 각자(옵션=브랜드 옅은 배경, 새 주문=브랜드 진한 배경) 그대로 유지한다. 이 미리보기는 이미 `.order-menu-picker__added` 박스(테두리+배경)로 감싸져 있으므로, 옵션 줄은 `.order-edit-modal__option-list`(좌측 라인+배경 박스) 대신 박스 없는 `.order-menu-picker__added-option-list`(들여쓰기만)를 쓴다 — 그대로 두면 옵션 박스가 미리보기 박스 안에 중첩되어 보이기 때문이다.
   - 메뉴의 "추가"를 누르면: **옵션이 없는 메뉴**는 즉시 아래 미리보기에 들어간다(이미 옵션 없이 추가된 같은 메뉴면 수량만 +1). **옵션이 있는 메뉴**는 3단계(옵션 추가) 모달이 한 번 더 뜬다.
   - 미리보기(`.order-menu-picker__added`)에 새 줄이 추가되면 그 줄이 보이게 스크롤한다(`OrderStatusManagementPage.tsx`의 `addedItemsRef`). [`docs/components/TableCard.md`](../components/TableCard.md) "행추가 후 자동 스크롤 규칙"의 `lastElementChild` 변형을 그대로 따른다 — `selectedRowId` 같은 선택 상태 없이 항상 배열 맨 뒤에 붙는 목록이라 `scrollIntoView({ block: 'nearest' })`를 컨테이너의 `lastElementChild`에 직접 건다. 직전 길이와 비교해 **늘었을 때만** 스크롤하므로 "취소"로 줄이 줄어들 때는 스크롤 위치를 건드리지 않는다. 1단계 주문 목록(`.order-edit-modal__order-list`)도 "메뉴 추가" 확정으로 새 주문이 맨 뒤에 붙을 때 같은 방식(`draftOrdersListRef`)으로 스크롤한다.
   - 미리보기 줄의 "취소"는 그 줄을 미리보기에서 제거한다(아직 draft에 반영되지 않은 상태라 별도 확인 없이 즉시 삭제).
   - 이 모달의 "확인"을 누르면 **미리보기에 모인 항목을 전부 합쳐 그 테이블의 새 주문(새 티켓) 1건**으로 만들어 1단계 draft에 추가한다 — 기존 주문에 끼워 넣지 않는 이유는 이미 조리 중이거나 서빙된 주문의 내용을 건드리지 않기 위해서다. 새 주문은 `orderStatus: 'RECEIVED'`, `paymentStatus: 'PENDING'`이다. 미리보기가 비어 있으면 그냥 닫기만 한다. "닫기"는 미리보기를 전부 버리고 수정 모달로 돌아간다(수정 모달 자체는 열려 있는다).
3. **옵션 추가** — 메뉴 추가 위에 한 번 더 쌓이는 `WrapperModal`(size="md", Figma 480px, [node 912:12224](https://www.figma.com/design/JVKpnIzIJgV63SvxMdC4jO/QR_OREDER?node-id=912-12224)). 메뉴 추가 모달과 같은 카탈로그 줄 UI(`.order-menu-picker__catalog-row`: 이미지 박스 자리 + 이름/가격)를 옵션에도 그대로 적용했다. `MenuCatalogItem.optionCategories`(`types.ts`)는 옵션을 카테고리로 묶고, 카테고리마다 선택 방식이 다르다(`MenuCatalogOptionSelectionType`):
   - **`single`**(예: "맵기 조절") — 카테고리 내에서 정확히 1개를 **필수로** 선택한다. 체크박스 모양이지만 라디오처럼 동작하는 버튼(`.order-option-picker__radio`, `role="radio"`)을 두고, 같은 카테고리의 다른 옵션을 선택하면 이전 선택을 교체한다(`editModal.selectOptionPickerSingle`). 옵션 추가 모달을 열 때(`clickAddCatalogMenu`) 각 single 카테고리의 첫 옵션을 기본 선택해둔다 — 필수 선택이라 미선택 상태가 없다.
   - **`multi`**(예: "추가옵션") — 옵션별로 수량을 따로 선택한다. 처음엔 카탈로그처럼 "추가" 버튼(`tinted`)만 있고, 누르면 +/- 스테퍼(`.order-option-picker__stepper`)로 바뀌어 수량을 조절한다(`editModal.changeOptionPickerOptionQuantity`). 0개로 내려가면 다시 "추가" 버튼으로 돌아간다(미선택).
   - 맨 아래 "주문 수량" 박스(`.order-option-picker__quantity-box`)는 고른 메뉴 자체의 수량(`editModal.optionPicker.quantity`)을 +/- 스테퍼(`variant="primary"`, 카테고리 옵션의 `tinted` 스테퍼와 색으로 구분)로 조절한다 — "동일한 옵션으로 메뉴가 추가됩니다" 안내문처럼, 옵션별 수량과는 별개로 **이 옵션 조합을 가진 메뉴를 몇 개 추가할지**를 정하는 값이다.
   - "확인"을 누르면 (옵션 조합이 매번 달라질 수 있어) **항상 새 줄로** 메뉴 추가의 미리보기에 들어간다(옵션 없는 메뉴처럼 합치지 않음). 미리보기에 들어가는 옵션 목록은 single 카테고리에서 선택된 옵션(수량 1) + multi 카테고리에서 수량이 1개 이상인 옵션을 합친 것이다. "닫기"는 아무것도 추가하지 않고 메뉴 목록으로 돌아간다.
4. **수정 확인** — 취소 확인과 동일한 패턴의 확인 모달을 연다. 현재 "확인"은 API 계약 연동 전 안내만 표시하며 실제 보드 데이터에는 반영하지 않는다. "닫기"는 이 단계만 닫고 1단계 draft를 유지한다.
5. **연동 대기 안내** — 최종 저장 대신 API 연동 전임을 알리고 보드 데이터와 draft를 확정하지 않는다.

### 이탈방지 (주문 수정 / 메뉴 추가 / 옵션 추가)

`docs/components/Modal.md` #11 패턴과 동일하게, 1~3단계 모두 변경 내용이 있는 상태에서 닫으려 하면(닫기 버튼/ESC/배경 클릭) "페이지를 나가시겠습니까?" 경고(`SimpleDefaultModal`)를 먼저 띄운다. 단계별 dirty 판단 기준(`useOrderEditModalFlow.ts`)은 서로 다르다.

- **주문 수정**(`isEditorDirty`) — 모달을 열 때의 `draftOrders` 스냅샷(`initialDraftOrdersSnapshot`)과 현재 `draftOrders`를 `JSON.stringify`로 비교한다. 메뉴 줄 취소, 메뉴 추가로 생긴 새 주문 추가가 모두 여기 잡힌다.
- **메뉴 추가**(`isMenuPickerDirty`) — `addedItems.length > 0`이면 dirty다. 아직 1단계 draft에 반영되지 않은 미리보기 항목이 있다는 뜻이라 닫으면 그대로 사라진다.
- **옵션 추가**(`isOptionPickerDirty`) — 모달을 열 때 만든 기본값(`single` 카테고리 첫 옵션 선택 + `quantity: 1` + `multi` 카테고리 전부 0개) 스냅샷과 현재 `optionPicker`를 비교한다.

각 단계의 `close*`(닫기 버튼/ESC/배경 클릭에 연결)는 dirty면 경고만 띄우고 실제로 닫지 않는다 — 경고의 "확인"에 연결된 `forceClose*`를 눌러야 닫힌다. "확인"/"추가"로 정상 진행하는 경로(`confirmOptionPicker`, `confirmMenuPicker`, `confirmSave`)는 항상 `forceClose*`(또는 동등한 직접 초기화)를 호출해 경고 없이 다음 단계로 넘어간다.

주문 수정 → 메뉴 추가 → 옵션 추가는 최대 3겹까지 모달이 동시에 열려 있을 수 있는 화면이다. `WrapperModal`은 열린 인스턴스를 mount 순서대로 스택에 쌓아두고 ESC를 맨 위(가장 나중에 연) 모달에만 전달하도록 고쳤다(`docs/components/Modal.md` #22) — 이전에는 열려 있는 모든 `WrapperModal`이 각자 `window`에 ESC 리스너를 등록해서, 3단계가 한꺼번에 열려 있을 때 ESC 한 번에 전부 닫혀버렸다. 이제는 ESC를 누를 때마다 가장 위 단계부터 위 dirty 규칙을 거쳐 한 단계씩만 닫힌다(dirty면 경고 → 경고에서 한 번 더 ESC/확인 → 그다음에야 그 아래 단계가 ESC 대상이 된다).

세 단계 중 하나라도 dirty면 `useOrderStatusBoardPage.ts`가 `usePreventLeave(editModal.isEditorDirty || editModal.isMenuPickerDirty || editModal.isOptionPickerDirty)`를 호출해 브라우저 새로고침/탭·창 닫기도 함께 경고한다. [`docs/operations/dirty-guard.md`](../operations/dirty-guard.md)의 "페이지 안의 추가/수정 모달이 별도 dirty를 갖는다면 페이지 `isDirty`와 OR로 합친다" 규칙을 그대로 따른 것이며, 이 화면이 그 규칙의 worked example이다(모달이 1개가 아니라 3단계라 OR 항이 3개로 늘어났을 뿐 같은 패턴).

메뉴 카탈로그(`MENU_CATALOG_MOCK`)는 이 페이지 전용으로 새로 만들었다 — `menu-management`/`menu-option` feature의 mock은 다른 테마(제육볶음/아메리카노 등)라 이 페이지의 주문 보드 mock(쌀국수/분짜 등)과 섞으면 어색해서 분리했다. 실제 메뉴 카탈로그 API가 나오면 이 mock 파일을 교체한다.

새로 추가된 주문의 `id`/`orderNo`는 `useOrderEditModalFlow.ts`의 `createDraftOrderId`/`createDraftOrderNo`로 임시 생성한다(타임스탬프/난수 기반) — 실제 연동 시 백엔드가 발급하는 값으로 교체해야 한다.

### Button 공용 컴포넌트에 변형 2개 추가

이 모달을 만들면서 기존 10가지 변형으로 표현이 안 되는 스타일 2개가 필요해 `shared/components/button`에 변형을 추가했다(`/dev/button`에도 예시를 추가해뒀다).

- **`tinted`** — 옅은 브랜드 배경 + 브랜드 텍스트(`--color-brand-subtle`/`--color-brand-default`). "메뉴 추가" 버튼에 사용한다.
- **`neutral`** — 진한 슬레이트 솔리드 + 흰 텍스트(`--color-text-disabled`/`--color-text-inverse`). 결제 처리 1단계의 "미결제" 버튼에 사용한다(원래는 메뉴 줄 "취소" 버튼에도 같이 썼지만, 아래처럼 X 아이콘 버튼으로 바꾸면서 "미결제"에만 남았다).

## 카드 공통 필드

상단부터 순서대로: 주문번호 + 시간(우측 정렬) → 테이블번호 → 주문리스트(메뉴명 + 수량, 옵션은 `↳`로 들여쓰기해 메뉴 하위에 표시) → 구분선 → 총 가격 → 상태별 버튼 그룹.

시간 영역(`.order-status-card__time`, 시계 아이콘 + 텍스트)은 컬럼에 따라 기준 시각과 라벨이 다르다 — 접수/조리중/서빙완료는 "주문시간 HH:MM"(`row.orderDatetime`), 취소는 "취소시간 HH:MM"(`row.cancelledAt`, 없으면 `orderDatetime`으로 대체)을 보여준다(`OrderStatusCard.tsx`).

### 상태별 버튼 그룹 — 개수와 무관하게 같은 크기, 한 줄 고정

컬럼마다 버튼 개수가 다르다(접수/취소=1~3개, 조리중/서빙완료=4개). "버튼 크기가 다 다르면 별로"라는 피드백에 따라 `.order-status-card__actions .btn`은 아래 규칙으로 항상 같은 크기를 유지한다.

- `flex-wrap: nowrap` — 버튼이 몇 개든 한 줄에 다 들어간다(줄바꿈 없음).
- `width: calc((100% - 3 * var(--spacing-1)) / 4)` — 4개가 한 줄에 정확히 맞는 폭을 계산해서 고정폭으로 쓴다. `%`는 형제 개수가 아니라 부모(컨테이너) 폭 기준이라, 1개/3개짜리 줄도 똑같은 폭을 쓰고 남는 공간은 그냥 비워둔다(늘어나서 커지지 않는다).
- `justify-content: flex-end`(부모 `.order-status-card__actions`) — 버튼이 적게 들어찰 때 왼쪽이 아니라 오른쪽에 정렬된다.
- 세로 크기는 `height: auto; padding: var(--spacing-6) var(--spacing-1);`로만 키운다 — `Button`의 `sm` 사이즈가 고정 `height`를 갖고 있어서, 세로로 키우려면 `height`를 풀어주지 않으면 padding이 적용되지 않는다(`box-sizing: border-box` 때문).

> 추가일: 2026-06-30

### 태블릿 반응형 (1200px 이하)

뷰포트가 아니라 `client-layout__main`(사이드바 옆 콘텐츠 영역, `ClientLayout.css`) 컨테이너 폭 기준이다 — `@container client-main (max-width: 1200px)`(`OrderStatusBoard.css`, `OrderStatusCard.css`). 사이드바가 열려 있으면 줄어드는 실제 콘텐츠 폭을 그대로 따라가므로, 사이드바 열림/닫힘과 무관하게 항상 같은 기준으로 동작한다. 배경은 [`docs/decisions.md` ADR-016](./decisions.md#adr-016--태블릿-반응형-기준-뷰포트-대신-메인-컨테이너client-layout-기준) 참고.

- 4개 컬럼 사이 간격(`.order-status-board`)을 `--spacing-8` → `--spacing-4`로 줄여 카드 공간을 더 확보한다.
- 카드 패딩(`.order-status-card`)을 `--spacing-10` → `--spacing-6`으로 줄인다.
- 버튼 그룹(`.order-status-card__actions`)이 `flex-wrap: wrap`으로 바뀌어, 4등분 고정폭 대신 2개씩 줄바꿈한다(`width: calc((100% - var(--spacing-1)) / 2)`). `white-space: normal`로 줄바꿈을 허용해, 좁은 폭에서도 버튼 글자가 `...`로 잘리지 않는다.
- 주문번호+주문시간 줄(`.order-status-card__top-row`)도 `flex-wrap: wrap`으로 바꾸고 `.order-status-card__time`에 `flex-basis: 100%`를 줘서, 폭이 좁아지면 주문시간이 다음 줄로 내려간다.

### 휴지통(삭제) 버튼 — 정사각형 고정 크기

`.order-status-card__dismiss`는 `Button`의 `variant="icon"`이라 `btn--icon-square` 클래스가 함께 붙는데, `Button.css`의 `.btn--sm.btn--icon-square { width: var(--height-component-sm) }`와 카드 쪽 오버라이드가 클래스 2개로 명시도가 같아 CSS 주입 순서에 따라 폭이 고정 토큰으로 깨질 수 있었다 — 셀렉터에 `.btn`을 더해(`.order-status-card__actions .btn.order-status-card__dismiss`, 클래스 3개) 항상 카드 쪽 규칙이 이기게 했다.

또한 `aspect-ratio: 1/1` + `width: auto`를 flex의 `align-items: stretch`에 맡기는 방식은 신뢰할 수 없었다 — 아이콘 콘텐츠 자체가 작아 브라우저가 정사각형의 가로폭을 "늘어난 세로 높이"가 아니라 아이콘의 작은 hypothetical 크기로 먼저 계산해버려, 세로만 길게 늘어난 얇은 막대가 됐다. 그래서 옆 "취소사유"(`outline`, `sm`) 버튼의 자동 높이 공식을 그대로 `calc()`로 계산해 `width`/`height`에 고정값으로 박아 넣는다.

```css
width: calc(
  var(--spacing-6) * 2 + var(--typography-size-ui) * var(--typography-leading-ui) +
    var(--border-1) * 2
);
```

패딩(`--spacing-6`) 2번 + 줄높이(`font-size × line-height`) + 테두리(`--border-1`) 2번 — `outline` 버튼 1개가 실제로 차지하는 세로 크기를 그대로 재현한 값이다. stretch/aspect-ratio에 의존하지 않으므로 어떤 화면 폭에서도 항상 정확한 정사각형이 나온다.

## React Query Polling

SSE는 보류하고 React Query Polling을 사용한다. 주문 목록 쿼리의 운영 기준은 다음과 같다.

- 화면이 활성화된 동안 5초마다 조회한다.
- 백그라운드 탭에서는 Polling하지 않는다.
- 창에 다시 포커스하면 즉시 다시 조회한다.
- 헤더의 새로고침 버튼으로 수동 조회할 수 있다.
- 최초 조회 실패는 보드 대신 오류 화면을 보여준다. 이미 데이터가 있는 상태의 갱신 실패는 기존 카드를 유지하고 헤더에 실패 상태와 다시 시도 수단을 보여준다.
- 자동 재시도는 사용하지 않는다. 고정 Polling 주기와 중복 요청되는 상황을 피하기 위해서다.

헤더는 정상일 때 `실시간 동기화(5초)`, 요청 중에는 `동기화 중`, 최근 갱신에 실패하면 오류 상태를 표시한다. 이는 연결형 실시간 통신이 아니라 주기 조회 상태를 뜻한다.

## 서버 응답 기준 상태 변경

조리시작·서빙완료·이전·취소는 Orval 생성 mutation 함수를 사용한다.

1. 진행 중인 목록 조회를 취소한다.
2. 상태 변경 API를 호출한다.
3. 응답의 성공 여부를 확인한다.
4. 주문 목록 쿼리를 무효화한다.
5. 다시 조회한 서버 결과로 카드를 이동한다.

클라이언트가 먼저 카드를 옮기는 낙관적 업데이트는 사용하지 않는다. 처리 중인 주문 id를 별도로 관리해 해당 카드에 `aria-busy`를 표시하고 같은 주문의 중복 요청을 막는다. 실패하면 카드는 원래 컬럼에 남고 카드 단위 오류를 표시한다.

## 상태 수명 분리

- **서버 상태**: 주문 목록과 상태 변경 결과는 React Query가 관리한다.
- **모달 스냅샷**: 열린 모달의 주문·취소사유는 깊은 복사본으로 고정한다. Polling이 실행돼도 사용자가 읽거나 입력 중인 모달을 자동 변경하지 않는다.
- **화면 숨김 상태**: 취소 카드 id는 컴포넌트 메모리의 `Set`으로 관리한다. 서버·캐시·`localStorage`에는 저장하지 않는다.

## 데이터 소스와 Mock/Real 경계

- `npm run dev:mock`: MSW의 상태형 주문 API를 사용한다. GET과 상태 변경 POST가 하나의 메모리 저장소를 공유하므로 Polling으로 변경 결과를 다시 확인할 수 있다.
- `npm run dev:real`: MSW를 사용하지 않고 실제 백엔드를 호출한다.
- 주문 상태 전용 handler는 일반 생성 handler보다 먼저 등록하며, 지원하지 않는 요청을 임의 성공시키지 않는다.
- Mock 저장소는 테스트마다 초기 seed의 깊은 복사본으로 초기화한다.
- Mock은 상태 변경 때 `statusChangedAt`을 단조 증가하도록 기록해, 앞 단계나 뒤 단계 어느 방향으로 이동해도 대상 컬럼 맨 아래에 배치한다.

## API 계약 호환과 후속 작업

현재 OpenAPI 계약에 화면이 필요한 일부 필드가 없어 feature-local mapper와 wrapper에서 임시 호환한다.

- 메뉴 단가와 옵션 단가가 없으면 `0`으로 처리한다.
- 취소 시각이 없으면 `cancelledAt`을 비워 둔다.
- 상태 변경 시각은 Mock의 `statusChangedAt`을 사용한다. 실제 API에도 같은 의미의 시각 또는 정렬 가능한 순서값이 필요하다.
- 취소사유 조회의 생성 타입은 중첩 `header.sysId`를 충분히 표현하지 못해 wrapper에서 요청 형태를 맞춘다.
- 임시 처리는 실제 백엔드 응답과 OpenAPI가 반영되고 Orval을 regenerate한 뒤 제거한다.

결제완료·미결제·주문수정은 화면과 draft 흐름만 유지한다. 최종 API 계약이 확정되기 전에는 서버 요청이나 로컬 성공 처리를 하지 않는다. 주문 경과 타이머도 이번 범위에서 보류한다.

## QA 체크리스트

- `dev:mock`에서 최초 조회 후 5초 Polling, 포커스 복귀 조회, 수동 새로고침을 확인한다.
- 조리시작·서빙완료·이전을 양방향으로 실행해 이동 카드가 대상 컬럼 맨 아래에 추가되는지 확인한다.
- 상태 변경 실패 시 카드가 기존 컬럼에 남고 다시 시도할 수 있는지 확인한다.
- 모달을 연 상태에서 Polling되어도 모달 내용과 입력값이 바뀌지 않는지 확인한다.
- 취소 카드를 숨긴 뒤 Polling·수동 새로고침에는 계속 숨고, 브라우저 새로고침에는 다시 나타나는지 확인한다.
- Network 탭에서 조회가 카드 수만큼 반복되는 N+1이 아니라 Polling 주기당 주문 목록 요청 1건인지 확인한다.
- 백엔드 계약 반영 후 `dev:real`에서 같은 시나리오를 다시 검증한다.
