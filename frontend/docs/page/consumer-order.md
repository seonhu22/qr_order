# Consumer 주문 화면 규약

> 경로: `/consumer/order`
> 화면: Consumer > 주문(메뉴 목록·장바구니)

QR 인증 후 도착하는 화면이다. 골격 단계라 메뉴·장바구니·주문 데이터는 전부 mock이고, 실제 API 연동 범위는 [`decisions.md` ADR-021](../decisions.md#adr-021--consumer-골격-단계의-mock-경계-원칙) 참고.

## 헤더와 페이지의 역할 분리

`ConsumerHeader`(`apps/consumer/features/header/components/ConsumerHeader.tsx`)는 `ConsumerLayout`이 마운트하는 고정 영역으로, 브랜드·매장정보·직원호출·주문내역·설정 버튼뿐 아니라 **검색창과 카테고리 탭도 여기서 렌더링한다**. 검색어·선택 카테고리 자체는 `apps/consumer/stores/consumerOrderFilterStore.ts`(zustand)에 있고, `useConsumerOrderPage`(order-shell)가 이 값을 읽어 실제 필터링을 수행한다.

- 처음에는 검색·탭을 order-shell(페이지) 쪽에 두었으나, 참고 UI는 로고·매장정보·검색·탭이 한 헤더 블록이라 그 사이에 불필요한 border·padding 이중 레이어가 생겼다. 헤더로 옮기고 상태만 스토어로 공유하도록 고쳤다.
- 카테고리 목록(`ORDER_SHELL_CATEGORIES`)은 지금 `ConsumerHeader`가 order-shell의 mock 상수를 직접 참조한다 — Consumer 페이지가 하나뿐인 지금 단계의 실용적 타협이며, 화면이 늘어나면 재검토 대상이다.

## 카테고리 탭은 필터가 아니라 스크롤이다

탭을 눌러도 목록에서 다른 카테고리가 사라지지 않는다. 전체 메뉴를 한 목록에 계속 보여주고, 탭 클릭은 해당 카테고리 섹션으로 `scrollIntoView`만 시킨다(`ConsumerOrderPage.tsx`의 `useEffect`가 `selectedCategory` 변화에 반응).

- 헤더(브랜드+검색+탭)가 스크롤 밖 고정 요소라 sticky 오프셋 계산이 필요 없다 — 대상 섹션에 `scroll-margin-top`도 두지 않는다.
- 첫 렌더에서는 스크롤하지 않는다(`isFirstCategoryRender` ref로 첫 실행을 건너뜀).
- `prefers-reduced-motion: reduce`면 `scrollIntoView`의 `behavior`를 `'auto'`로 전환한다.

### 빈 상태(검색 결과 없음·빈 카테고리)

`groupedMenu.length === 0`(검색 결과가 전 카테고리에서 0개)이거나, "전체"가 아닌 카테고리를 선택했는데 그 카테고리에 메뉴가 하나도 없으면(`isSelectedCategoryEmpty`) 목록 대신 참고 저장소와 동일한 빈 상태를 보여준다 — `ci-package` 아이콘(40px, 연한 회색) + 안내 문구(`"${searchQuery}"에 대한 메뉴가 없습니다` 또는 `메뉴가 없습니다`) + 검색어가 있을 때만 "검색 초기화" 링크 버튼(`clearSearch`, `useConsumerOrderPage`가 `consumerOrderFilterStore.setSearchQuery('')`를 래핑).

빈 카테고리는 위 "탭은 필터가 아니라 스크롤" 원칙의 예외다 — 탭을 눌러도 다른 카테고리는 그대로 남아있는 게 기본이지만, 선택한 카테고리에 스크롤할 섹션 자체가 없으면(빈 카테고리) 탭 클릭이 아무 반응 없는 죽은 인터랙션이 되므로 이때만 목록 전체를 빈 상태로 대체한다. mock 카테고리 중 "사이드"는 항상 메뉴가 0개라 이 상태를 확인하는 용도로 남겨뒀다(`orderShellMock.ts`).

## 배지 시스템

메뉴 카드 배지는 참고 UI(git 저장소)의 Tailwind 클래스 값을 이 프로젝트 토큰 스케일로 그대로 환산했다.

| 배지 | 아이콘 | 배경 | 테두리 | 텍스트 |
|---|---|---|---|---|
| 인기(`popular`) | `ci-flame` | `--red-10` | `--red-20` | `--red-50` |
| 추천(`recommended`) | `ci-star` | `--amber-10` | `--amber-20` | `--amber-50` |
| 한정수량(`limited`) | `ci-zap` | `--purple-10` | `--purple-20` | `--purple-50` |

`--purple-*`는 Consumer 배지 전용으로 `primitive-tokens.css`에 새로 추가했다(한정수량 배지 도입 전에는 없었다). 배지 타입은 `OrderShellMenuItem.badges: OrderShellMenuBadge[]`이고, 여러 개를 동시에 가질 수 있다(예: 비빔밥은 추천+한정수량).

라벨·아이콘 매핑(`MENU_BADGE_CONFIG`)은 `features/order-shell/badgeConfig.ts`에 공용으로 뽑아뒀다. `MenuItemCard`(메뉴 목록 카드)와 `MenuDetailSheet`(메뉴 상세 시트, 메뉴명 위)가 이 배지를 함께 쓴다 — 처음엔 `MenuItemCard.tsx`에 로컬 상수로만 있었는데, 상세 시트에도 같은 배지가 필요해지면서 공용 파일로 옮겼다. CSS 클래스(`menu-item-card__badge*`, `menu-detail-sheet__badge*`)는 화면마다 따로 두되(폴더별 전용 CSS 원칙), 색상 값은 위 표와 동일하게 맞춘다.

옵션 그룹의 `필수`/`선택`/`복수선택`은 이 배지와 다른 컴포넌트다 — [옵션 선택 규칙](#옵션-선택-규칙)의 `Badge` 참고. 옵션 항목의 품절은 별도 표시 없이 선택만 막는다(아래 참고).

## 아이콘

이 화면을 포함한 Consumer 전체는 `apps/consumer/shared/icons/ConsumerIcon`(+`consumerSprite.svg`)을 쓴다. Admin/Client의 `shared/assets/icons/Icon`과는 별도 체계다.

## 메뉴 카드의 "+" 버튼은 장식이다

카드 전체가 클릭 가능한 하나의 버튼이라 어디를 눌러도 메뉴 상세 시트가 열린다. 카드 오른쪽의 "+" 아이콘은 참고 UI와 모양을 맞추기 위한 시각 요소일 뿐 별도 클릭 핸들러가 없다(`aria-hidden`). 참고 UI 자체도 "+" 버튼의 `onClick`이 상세 시트를 여는 것과 동일한 함수라, 실제로는 빠른 담기 기능이 아니라 카드 전체와 같은 동작이다.

## 시트(바텀시트) 상태

`ConsumerSheetState`(`apps/consumer/stores/consumerSheetStore.ts`)는 한 번에 하나만 열리는 단일 union이다.

```ts
type ConsumerSheetState =
  | { type: 'menu-detail'; menuId: string }
  | { type: 'cart' }
  | { type: 'order-history' }
  | { type: 'staff-call' }
  | null;
```

| variant | 여는 곳 | 내용 |
|---|---|---|
| `menu-detail` | 메뉴 카드 클릭 | 이미지·메뉴 정보(배지)·옵션·수량·담기 버튼 (`MenuDetailSheet`) |
| `cart` | `CartBar` 클릭 | 헤더(아이콘+개수 배지) + 담은 항목 목록(비어 있으면 빈 상태) + 총 결제 금액 + 버튼("주문하기" 또는 빈 상태일 때 "메뉴 보러가기") |
| `order-history` | 헤더 "주문내역" 버튼 | "준비 중입니다" 플레이스홀더만 |
| `staff-call` | 헤더 "직원호출" 버튼 | "준비 중입니다" 플레이스홀더만 |

렌더러는 `ConsumerBottomSheet`(신규 primitive, `WrapperModal` 미재사용 — ADR-020) 하나이고, 내용만 `sheet.type`에 따라 `ConsumerOrderPage.tsx`가 조립한다.

## 메뉴 상세 시트 구성

`MenuDetailSheet`(`features/order-shell/components/MenuDetailSheet.tsx`)가 시트 본문을 조립한다. 위에서부터 다음 순서다.

| 조각 | 컴포넌트 | 비고 |
|---|---|---|
| 이미지 | `MenuDetailSheet` 내부 | 시트 본문의 좌우 패딩을 음수 마진으로 상쇄해 폭을 꽉 채운다. `imageUrl`이 없으면 `ci-utensils` 아이콘 |
| 메뉴 정보 | `MenuDetailSheet` 내부 | 배지(있으면, [배지 시스템](#배지-시스템) 참고) → 이름 → 기본가 → 설명 순. 배지·이름·설명은 없으면 그 줄 자체가 안 나온다 |
| 옵션 | `MenuOptionGroupList` | 옵션이 없으면 렌더링 자체를 건너뛴다. 자세한 동작은 [옵션 선택 규칙](#옵션-선택-규칙) |
| 수량 | `QuantityStepper` | 고정 라벨 "수량" + 증감 버튼. 1~99. 참고 디자인과 순서를 맞추려고 옵션 **아래**, 담기 버튼 바로 위에 둔다(원래는 옵션 위였다) |
| 담기 | `AddToCartButton` | 고정 문구 "장바구니에 담기" + 총액을 양끝 배치 |

수량·옵션 선택 상태는 `useMenuDetailSheet`(feature 훅)가 소유한다. 다른 메뉴를 열었을 때 이전 선택이 남지 않도록 `ConsumerOrderPage`가 `key={detailItem.id}`로 시트를 새로 마운트한다.

`QuantityStepper`의 증감 버튼은 `QuantityStepperButton`(`features/order-shell/components/`)을 쓴다. 이 버튼 하나를 메뉴 상세 전체 수량·옵션 항목별 수량([항목별 수량 조절](#항목별-수량-조절))·장바구니 줄 수량([장바구니](#장바구니)) 세 곳이 공유하고, 배경·크기 같은 컨테이너 스타일만 각 화면 CSS(`className`)로 다르게 입힌다. `/dev/button`에 세 스타일이 나란히 있다.

### 시트 제목을 쓰지 않는다

디자인상 이미지가 시트 맨 위에 오고 메뉴명은 그 아래에 있어, `ConsumerBottomSheet`의 `title`(시각적 제목)을 넘기지 않는다. 대신 primitive에 `ariaLabel` prop을 추가해 스크린리더용 이름만 따로 전달한다.

`cart`도 같은 이유로 공용 `title`을 쓰지 않는다 — 참고 저장소의 `CartSheet` 헤더(아이콘+제목+담은 개수 배지)를 그대로 가져오면서, `ConsumerOrderPage.tsx`가 직접 `order-shell-cart-header`를 렌더링하도록 바꿨다(`ci-shopping-cart` 아이콘 + "장바구니" + `totalCartQty` 배지). `ariaLabel`은 다이얼로그 접근성 이름으로 "장바구니"를 그대로 넘긴다. `order-history`/`staff-call`은 아직 플레이스홀더뿐이라 기존대로 공용 `title`을 쓴다.

### 옵션 선택 규칙

- 필수(`required`) + 단일 선택 그룹은 품절이 아닌 첫 항목이 미리 선택된 상태로 열린다 — 사용자가 옵션을 건드리지 않아도 담기가 가능해야 하기 때문이다.
- 단일 선택은 다른 항목을 고르면 교체될 뿐 해제되지 않는다 — `radio`가 재클릭 시 change를 발생시키지 않으므로 해제 동작 자체를 두지 않았다. 옵션 단일 그룹에 "선택 안 함"이 필요해지면 별도 choice 항목으로 넣는다.
- 복수 선택은 `maxSelectable`에 도달하면 **새 항목 추가만** 막고, 이미 고른 항목의 해제는 계속 허용한다.
- 필수 그룹 중 하나라도 비어 있으면 담기 버튼이 비활성화된다(`canAddToCart`).
- 단일 선택은 `radio`, 복수 선택은 `checkbox`로 렌더링해 키보드·스크린리더 동작을 브라우저에 맡긴다.

`MenuOptionGroupList`(`features/order-shell/components/`)가 이 규칙을 화면으로 옮긴다.

- 체크 표시(원/박스) 자체는 `/dev/radio`·`/dev/checkbox`의 `RadioInput`/`CheckboxInput`을 그대로 가져다 쓴다. 다만 그 컴포넌트의 `label`/`description`은 쓰지 않는다 — 이름·가격 표기는 이 화면 전용 카드형 레이아웃(`menu-option-choice`)이 따로 맡기 때문이다. 대신 컨트롤에 `id={groupId-choiceId}`를 직접 주고, 이름 텍스트를 그 `id`를 가리키는 별도 `<label htmlFor>`로 감싸 접근성 이름(스크린리더·`getByRole(..., { name })`)이 정상적으로 연결되게 한다. `CheckboxInput`은 이때 처음으로 `id` prop을 지원하도록 확장했다(`RadioInput`은 이미 있었다).
- 그룹 헤더(이름 옆)엔 `Badge`(`shared/components/badge`, `/dev/badge`)로 `필수`/`선택`(단일)과 `복수선택`+`필수`/`선택`(복수)을 오른쪽 끝에 붙인다 — 참고 저장소의 배지 순서·톤을 그대로 따랐다.
- 옵션 행(`menu-option-choice`)은 항목별 수량 스텝퍼가 나타나도 행 높이가 변하지 않도록 `min-height`를 고정해둔다.
- 품절 항목은 "품절" 같은 별도 표시 없이 `isChoiceDisabled`로 선택만 막는다 — 이름은 그대로 보여주고, `menu-option-choice--disabled`로 흐리게 표시한다.
- 옵션 행 라벨(`menu-option-choice__text`)은 부모가 `align-items: center`라 기본값으로는 자기 텍스트 높이만큼만 탭에 반응한다 — `align-self: stretch`로 행 전체 높이만큼 탭 영역을 늘려뒀다(형제 요소인 원/체크박스·가격은 영향 없음).

#### 항목별 수량 조절

복수 선택 항목은 선택되면 이름 옆에 `-`/`+` 미니 스텝퍼(`QuantityStepperButton`)가 나타나 개수를 늘릴 수 있다(참고 저장소 그대로, 하한 1·상한 없음). 상태는 `useMenuDetailSheet`의 `choiceQty`(key: `` `${groupId}__${choiceId}` ``)가 소유하고, 항목이 새로 선택될 때마다 1로 초기화한다 — 해제 전에 늘려둔 값이 재선택 시 남지 않게 하기 위함이다. 백엔드에 이 개수를 저장·전송할 필드가 아직 없어 **mock 전용**이다 — 배경과 백엔드 협의 항목은 [`decisions.md` ADR-023](../decisions.md#adr-023--복수-선택-옵션-항목별-수량은-mock-전용-qty로-둔다) 참고.

### 가격 계산

`features/order-shell/cartLine.ts`에 모아 뒀다.

```
옵션 추가 금액 합계 = Σ(옵션 가격 × 옵션 개수)   ← 개수 없으면(단일 선택) 1개로 취급
1개당 가격          = 메뉴 기본가 + 옵션 추가 금액 합계
총액                = 1개당 가격 × 수량
```

옵션 추가 금액은 음수도 허용한다(예: "밥 없이" −1,000원).

## 장바구니 줄 식별 — `cartKey`

같은 메뉴라도 옵션 조합이 다르면 다른 줄로 남아야 하므로, 병합 기준은 `menuId`가 아니라 `cartKey`다. `buildCartKey`(`cartLine.ts`)가 메뉴 id 뒤에 선택한 옵션 id를 **정렬해서** 이어붙인다 — 선택 순서가 달라도 같은 조합이면 같은 줄로 합쳐진다. 옵션이 없으면 메뉴 id만 쓰므로 옵션 도입 전과 키가 같다.

```
옵션 없음            menu-3
백미                 menu-1__menu-1-rice-white
백미 + 계란후라이     menu-1__menu-1-extra-egg+menu-1-rice-white
```

## 장바구니

`useConsumerOrderPage`가 소유하는 순수 React state다. 세션별 격리나 새로고침 유지가 없고, 페이지를 벗어나면(언마운트) 그냥 사라진다 — 3단계에서 실제 장바구니 store로 교체할 대상.

`addToCart` 외에 `updateCartLineQty(cartKey, delta)`(수량이 0 이하가 되면 그 줄을 배열에서 없앤다)와 `removeCartLine(cartKey)`가 있다.

### 장바구니 시트 헤더

`cart` 시트는 공용 `title` 대신 `ConsumerOrderPage.tsx`가 직접 헤더를 그린다(`order-shell-cart-header`) — `ci-shopping-cart` 아이콘 + "장바구니" 텍스트 + 담은 총 개수(`totalCartQty`) 배지, 참고 저장소 `CartSheet` 헤더 그대로. 자세한 배경은 [위 "시트 제목을 쓰지 않는다"](#시트-제목을-쓰지-않는다) 참고.

### 장바구니 줄 — `CartLineItem`

`CartLineItem`(`features/order-shell/components/`)이 참고 저장소 `CartSheet` 행 구조를 그대로 따라 세 블록으로 조립한다.

1. **이름 + 줄 합계**: 메뉴명과 그 줄의 총액(`calcCartLinePrice`)을 양끝 배치.
2. **옵션 라인**: 옵션마다 한 줄씩, `formatOptionLine`이 `치즈 토핑 (+1,500원) ×2`처럼 추가금·개수가 있을 때만 붙인다(`price > 0`, `qty > 1`일 때만 각각 표기).
3. **1개당 가격 + 수량 스텝퍼**: 왼쪽에 작은 회색 글씨로 단가(`calcUnitPrice`), 오른쪽에 `QuantityStepperButton` 두 개(28×28px, `radius-sm`, 참고 저장소 그대로) + 수량.

수량 스텝퍼는 다른 두 곳(메뉴 상세 전체 수량, 옵션 항목별 수량)과 틀·동작은 같지만(1 미만으로 안 내려감) 색상이 다르다 — 평소엔 `--color-bg-muted` 회색 채움이고, **수량이 1일 때는 감소 버튼이 삭제 버튼(x)으로 바뀌어 배경이 `--color-status-error-default`(빨강)로 채워진다.** 눌리면 `onRemove`가 호출돼 그 줄 자체가 장바구니에서 사라진다(비활성화가 아니라 삭제).

### 빈 장바구니 상태

`cart.length === 0`이면 목록 대신 참고 저장소 `CartSheet`와 동일한 빈 상태를 보여준다(`order-shell-cart-empty`) — 연한 회색 장바구니 아이콘(`--slate-30`) + "장바구니에 담긴 메뉴가 없습니다." 문구를 세로 가운데 정렬한다.

이때 하단 버튼도 바뀐다: 담긴 게 있으면 "주문하기"(`placeOrder` — [주문 제출 흐름](#주문-제출-흐름) 참고)지만, 비어 있으면 "메뉴 보러가기" 버튼이 `closeSheet`를 호출한다 — 별도 페이지 이동이 아니라 시트를 닫아서(닫힘 애니메이션과 함께) 뒤에 있던 메뉴 목록이 그대로 드러나는 방식이다.

### 총 결제 금액

주문하기/메뉴 보러가기 버튼 바로 위, 구분선 아래에 "총 결제 금액" 라벨과 `totalCartPrice`(`CartBar`가 쓰는 값과 동일)를 양끝 배치로 보여준다(`order-shell-cart-total`) — 참고 저장소 `CartSheet` 푸터 그대로이며, 장바구니가 비어 있어도(0원) 항상 표시된다.

## 주문 제출 흐름

장바구니 시트의 "주문하기"를 누르면 시트를 닫고 곧바로 `useConsumerOrderPage`의 `orderPhase` 상태 머신이 전체화면 오버레이를 보여준다. 이 흐름이 지금 뜻하는 바와 한계는 [`decisions.md` ADR-024](../decisions.md#adr-024--주문-실패-화면네트워크중복-주문은-먼저-완성하고-판별-로직은-qa-트리거로-미리본다)·[ADR-025](../decisions.md#adr-025--세션-만료시간초과마감통신-오류-화면도-같은-원칙으로-먼저-완성한다) 참고.

### 상태 머신

| `orderPhase` | 화면 | 진입 경로 |
|---|---|---|
| `idle` | 없음(기본) | — |
| `processing` | `OrderProcessingScreen` | "주문하기" 클릭 |
| `complete` | `OrderCompleteScreen` | `processing` 시작 1.8초 뒤 자동(참고 저장소 `doOrder` 딜레이와 동일) |
| `error-network` | `OrderFailureScreen type="network"` | QA 트리거만 |
| `error-duplicate` | `OrderFailureScreen type="duplicate"` | QA 트리거만 |
| `session-timeout` | `SessionExpiredScreen variant="timeout"` | QA 트리거만 |
| `session-closed` | `SessionExpiredScreen variant="closed"` | QA 트리거만 |
| `network-error` | `NetworkErrorScreen` | QA 트리거만 |

`processing`으로 들어가는 순간 장바구니(`cart`)를 곧바로 비운다 — 참고 저장소도 주문 접수 시점에 비운다. `complete`는 "메뉴로 돌아가기" 버튼 하나로 다시 `idle`로 되돌아간다.

실제 판별 로직(백엔드 응답, `navigator.onLine`)이 아직 없어 `placeOrder`는 항상 성공한다 — `error-*`/`session-*`/`network-error` 다섯 화면은 지금은 아래 QA 트리거로만 도달할 수 있다.

두 실패 화면(`OrderFailureScreen`)은 하나의 컴포넌트가 `type` prop으로 문구·버튼("메인화면으로 이동"+"다시 시도하기"/"주문내역 확인하기")을 나눠 그리고, 세션 만료 화면(`SessionExpiredScreen`)도 같은 방식으로 `variant` prop 하나가 아이콘(`ci-clock`/`ci-lock`)·문구를 가른다 — 참고 저장소의 컴포넌트 경계를 그대로 따랐다. `NetworkErrorScreen`은 앱 전체의 연결 상태 문제를 알리는 화면이라 다른 화면들의 브랜드(주황) 톤과 다르게 위험(`--color-status-error-*`, 빨강) 톤 아이콘·블롭을 쓴다(버튼만은 참고 저장소도 브랜드색을 유지해 그대로 따름).

### QA 미리보기 트리거

헤더의 설정(⚙, `consumer-header__icon-button`) 버튼은 평소엔 아무 동작이 없다가, dev 빌드(`import.meta.env.DEV`)에서만 클릭 시 드롭다운으로 7개 항목("주문 실패 (네트워크)"/"주문 실패 (중복)"/"주문 시간 초과"/"주문 마감 (결제 완료)"/"통신 오류"/"품절 초기화"/"주문내역 초기화")을 보여준다(참고 저장소의 dev-nav와 동일한 상호작용 — 바깥 클릭 시 닫힘). 앞 5개는 `orderPhase`를 강제로 바꾸고, "품절 초기화"는 [품절 데모](#품절-데모-qr-code-001)를, "주문내역 초기화"는 [주문내역](#주문내역)을 되돌린다. 앞 6개는 `consumerOrderQaStore`(`apps/consumer/stores/`, zustand)에 요청을 적어두고 `useConsumerOrderPage`가 이를 구독해 처리하지만, "주문내역 초기화"는 `consumerOrderHistoryStore`가 이미 헤더·order-shell 양쪽에서 접근 가능한 스토어라 그 스토어의 `clearOrders`를 헤더가 직접 호출한다(QA 스토어를 거칠 필요가 없다).

헤더(요청하는 쪽)와 order-shell(화면을 그리는 쪽)이 서로 다른 컴포넌트라 콜백을 직접 넘길 수 없어 스토어를 이벤트 버스처럼 쓴다. `useConsumerOrderPage`는 이 값을 `useState`로 구독해 `useEffect`에서 반응하지 않고 zustand의 vanilla `.subscribe()`로 구독한다 — `useState` 구독 방식은 `react-hooks/set-state-in-effect` 린트에 걸린다. 자세한 이유는 [`troubleshooting.md`](../troubleshooting.md#다른-컴포넌트의-zustand-스토어-변경에-반응해-setstate하면-set-state-in-effect-린트-에러) 참고.

production 빌드에서는 `import.meta.env.DEV`가 `false`로 굳어 드롭다운·QA 스토어 관련 코드가 tree-shake로 사라진다 — 실사용자에게는 노출되지 않는다.

> **실 배포 전 삭제 대상**: 이 드롭다운(`consumer-header__qa-menu`)과 `consumerOrderQaStore`, 그리고 여기서만 쓰는 각 트리거 함수(`triggerOrderFailure`/`triggerSessionExpiry`/`triggerNetworkError`/`resetSoldoutDemo`, `consumerOrderHistoryStore`의 `clearOrders`)는 전부 실제 판별 로직이 붙기 전까지만 쓰는 임시 스캐폴딩이다. `import.meta.env.DEV` 가드로 production 빌드 결과물에는 이미 안 들어가지만, 그 가드만 믿지 말고 실제 판별 로직(재고 API, 세션 만료 감지 등)이 전부 자리 잡으면 이 QA 트리거 코드 자체를 코드베이스에서 지운다 — 설정(⚙) 버튼도 그때 실제 설정 기능으로 채우거나 없앤다.

## 품절 데모 (`qr-code-001`)

QR코드 `qr-code-001`(창가 1번 테이블, `table-001`)로 들어오면 무엇을 담아 주문하든 항상 품절 확인 모달이 뜬다 — 실제 재고 판별 로직이 없어 QR 진입 경로 자체를 데모 트리거로 대신 썼다(`useConsumerOrderPage`의 `isSoldoutDemoTable`). 배경은 [`decisions.md` ADR-026](../decisions.md#adr-026--품절-확인-흐름은-qr코드-진입-경로를-데모-트리거로-써서-먼저-완성한다) 참고.

### 흐름

1. 장바구니 시트에서 "주문하기"를 누르면(`placeOrder`) 시트를 닫지 않고 곧바로 `SoldoutModal`을 띄운다 — 그 시점 장바구니 전체가 대상이다.
2. `SoldoutModal`은 다른 order-shell 화면과 달리 전체화면이 아니라 어두운 배경 위 중앙 카드형 다이얼로그다(z-index 80, 다른 오버레이보다 위). "확인" 외에는 닫히지 않는다(배경 클릭 무시) — admin/client `WrapperModal`과 같은 기법으로 자동 포커스·Tab 트랩·닫힐 때 포커스 복원을 구현했다(ADR-020에 따라 `WrapperModal` 재사용 대신 Consumer 전용으로 다시 구현).
3. "확인"을 누르면(`confirmSoldoutModal`) 그 줄들의 `cartKey`를 `soldoutCartKeys`에 기록한다 — 장바구니 시트는 열린 채로 남는다.

### 메뉴 vs 옵션 — 무엇이 품절 처리되는가

확인한 장바구니 줄을 담을 때 옵션을 골랐는지로 나눠 처리한다.

| 담을 때 | 품절 처리 대상 | 메인 목록 영향 |
|---|---|---|
| 옵션 없이 담음 | 메뉴 자체(`soldoutMenuIds`) | `MenuItemCard`가 회색조+"품절" 배지로 비활성화 — mock `item.soldOut`과 같은 렌더링을 그대로 재사용(`runtimeSoldout` prop으로 합침) |
| 옵션을 골라 담음 | 그 옵션 항목(`soldoutOptionChoiceIds`) | 메뉴 자체는 계속 주문 가능, 상세 시트에서 그 옵션만 선택 불가 — mock `choice.soldOut`과 같은 `isChoiceDisabled` 처리를 재사용 |

옵션 하나 때문에 메뉴 전체를 못 시키게 되는 대안도 검토했지만 실제 매장 운영과 맞지 않아, 위 조합(메뉴 단위/옵션 단위 분리)을 최종으로 삼았다.

### 지워야 풀린다 (장바구니) / 세션 내내 안 풀린다 (메뉴·옵션)

- `soldoutCartKeys`(장바구니 표기): 그 줄을 장바구니에서 삭제해야 풀린다. 시트를 닫았다 다시 열어도 유지된다 — 방금 품절이라고 안내받은 메뉴가 다시 열었을 때 아무 일 없었다는 듯 보이면 혼란스럽기 때문이다.
- `soldoutMenuIds`/`soldoutOptionChoiceIds`(메뉴·옵션 표기): 장바구니에서 지워도 풀리지 않는다 — 실제로 품절이라고 확인한 사실 자체는 변하지 않기 때문이다. 새로고침 없이 되돌리려면 [QA 미리보기 트리거](#qa-미리보기-트리거)의 "품절 초기화"를 쓴다.

### 장바구니 줄 표기

`CartLineItem`은 `soldout` prop이 켜지면(`soldoutCartKeys.has(line.cartKey)`) 세 곳이 바뀐다 — 이름 옆 수량/합계 자리가 삭제 전용 버튼(`QuantityStepperButton icon="remove"` + `qty-button--danger`, 이 줄의 다른 삭제 버튼과 같은 28×28px을 그대로 재사용)으로, 옵션 라인이 취소선으로, 1개당 가격+수량 스텝퍼 자리가 "현재 품절된 메뉴입니다"(빨강, `--typography-size-caption`+`--typography-weight-heading`) + 취소선 가격으로 바뀐다. "주문하기" 버튼은 `hasSoldoutInCart`(장바구니에 아직 품절 표기된 줄이 남아있는지)로 비활성화된다.

`SoldoutModal`의 확인 목록도 같은 메뉴를 옵션만 다르게 여러 줄 담았을 때 서로 구분되도록 옵션명을 이름 뒤에 붙인다(`formatSoldoutItemLabel`, 예: "불고기 정식 (백미, 계란후라이)"). 목록이 화면보다 길어질 수 있어(장바구니 전체가 한 번에 품절 처리되므로) `ConsumerBottomSheet`와 같은 방식으로 모달 카드에 `max-height`를 두고 목록만 내부 스크롤시켜 "확인" 버튼이 항상 화면 안에 남게 했다.

## 주문내역

"주문내역"은 완료된 주문만 담는다 — 결제 여부와 무관하게 "주문하기"가 성공(`startOrderProcessing`의 `setTimeout` 콜백)한 시점의 장바구니 스냅샷을 기록한다. 아직 담기만 하고 주문하지 않은 현재 장바구니는 포함되지 않는다. 배경은 [`decisions.md` ADR-027](../decisions.md#adr-027--주문내역은-주문-건별로-시간과-함께-묶어서-보여준다) 참고.

### 저장 위치

`consumerOrderHistoryStore`(zustand, `apps/consumer/stores/`) — 헤더(배지를 읽어야 함)와 order-shell(`useConsumerOrderPage`, 주문 완료 시 기록해야 함)이 서로 다른 컴포넌트라 페이지 로컬 state 대신 스토어에 둔다. 장바구니와 마찬가지로 새로고침하면 비워지는 mock이다.

### 주문 건별로 시간과 함께 묶어서 보여준다

참고 저장소는 모든 주문의 아이템과 현재 장바구니까지 시간 구분 없이 한 목록으로 합쳐 보여준다(`OrderRecord.time`/`orderId` 필드는 있지만 화면 어디에도 안 쓴다). 같은 메뉴를 다른 시각에 여러 번 주문하면 목록에 이유 설명 없이 같은 이름이 두 번 뜨는 문제가 있어, 이 프로젝트는 주문 건(`OrderShellOrderRecord`)마다 접수 시각과 함께 묶어서 보여주도록 바꿨다 — 배달 앱들의 "주문내역"이 건별로 나뉘어 보이는 것과 같은 기대에 맞춘 것이다.

### 화면 구성

`OrderHistorySheet`(`features/order-shell/components/`)는 장바구니 시트와 같은 톤을 쓴다 — 헤더(아이콘+제목+누적 수량 배지), 빈 상태(아이콘+"주문내역이 없습니다."), 하단 총 결제 금액 행은 `order-shell-cart-header`/`order-shell-cart-empty`/`order-shell-cart-total` 클래스를 그대로 재사용한다. 다만 과거 기록이라 수량 스텝퍼·삭제 버튼 같은 조작 UI는 없고, 하단에 "확인"(닫기) 버튼 하나만 있다 — 처음엔 버튼 없이 스와이프/핸들탭으로만 닫히게 했다가, 다른 시트들과 비교해 허전하고 첫 사용자가 닫는 법을 모를 수 있어 추가했다.

### 헤더 배지

`ConsumerHeader`의 "주문내역" 버튼에 누적 주문 수량 배지가 붙는다(9개 넘으면 "9+", 0개면 배지 자체를 숨김) — 참고 저장소의 `totalOrderedQty` 배지와 동일하게, 주문이 하나라도 생기면 버튼이 "활성화된" 느낌을 준다.

## CartBar는 `position: fixed`다 (sticky 아님)

`position: sticky`는 스크롤 콘텐츠가 뷰포트보다 짧으면(항목이 적은 카테고리만 보일 때 등) 바닥에 붙지 못하고 콘텐츠 바로 아래서 "뜬" 채로 멈추는 문제가 있었다. `position: fixed`로 바꾸고, 카트바가 보일 때(`order-shell--with-cart-bar` modifier)만 본문에 고정값 `padding-bottom`을 줘서 마지막 카드가 가려지지 않게 했다(`ConsumerOrderPage.css`).

## 반응형

717px부터 메뉴 목록이 `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`로 열 수를 자동으로 늘린다(717px≈2열, 1440px≈4열…). 셸 자체는 폭 제한 없이 화면을 꽉 채운다. 자세한 근거는 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드), 공통 규칙은 [`layout-policy.md` "Consumer 모바일 셸"](../operations/layout-policy.md#consumer-모바일-셸) 참고.

`auto-fit`이 아니라 `auto-fill`을 쓴다 — `.order-shell__items-grid`는 카테고리 섹션마다 따로 그려지는데, `auto-fit`은 그리드에 담긴 아이템 수가 계산된 열 수보다 적으면 빈 열을 없애고 카드를 늘려 채운다. 그러면 같은 화면 너비에서도 아이템이 적은 카테고리(예: 디저트 2개)만 카드가 넓어져 다른 카테고리와 열 수가 달라 보인다. `auto-fill`은 아이템 수와 무관하게 항상 같은 열 수를 고정해, 아이템이 모자란 줄엔 카드 대신 빈 공간이 남더라도 모든 카테고리의 열 수·카드 폭이 항상 같다.

## 터치 타겟

Consumer는 QR로 들어오는 모바일 전용 화면이라 모든 인터랙션이 터치다. 수량 스텝퍼(24~32px), 헤더 설정 버튼(32px), 검색 지우기(패딩 없이 아이콘 14px 그대로)처럼 반복 탭이 잦은 소형 버튼들이 iOS HIG(44px)·Material(48px) 권장 최소 터치 타겟보다 작았다.

시각적 크기(배경·아이콘)는 그대로 두고 `::before` 가상 요소로 실제 탭 판정 영역만 넓히는 **hit-slop**을 적용했다 — 클릭은 부모 버튼으로 버블링되므로 `onClick`은 그대로 동작한다. 목표는 **40px 통일**(44px는 자리마다 확보 가능한 여유가 달라 44/40이 뒤섞임), 확장폭은 옆 버튼과의 실제 간격을 계산해 서로 겹치지 않는 선에서 위치마다 다르게 잡았다. 자세한 계산과 위치별 표는 [`decisions.md` ADR-028](../decisions.md#adr-028--소형-버튼은-시각적-크기를-유지하고-hit-slop으로-탭-영역만-넓힌다) 참고.

새 소형 아이콘 버튼을 추가할 때도 같은 패턴(시각 크기 유지 + hit-slop, 옆 인터랙티브 요소와의 간격 계산)을 따른다. `apps/consumer`에 한정된 결정이다 — admin/client는 데스크톱 우선이라 대상이 아니다.
