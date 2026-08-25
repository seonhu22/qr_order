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

장바구니 시트의 "주문하기"를 누르면 시트를 닫고 곧바로 `useConsumerOrderPage`의 `orderPhase` 상태 머신이 전체화면 오버레이를 보여준다. 이 흐름이 지금 뜻하는 바와 한계는 [`decisions.md` ADR-024](../decisions.md#adr-024--주문-실패-화면네트워크중복-주문은-먼저-완성하고-판별-로직은-qa-트리거로-미리본다) 참고.

### 상태 머신

| `orderPhase` | 화면 | 진입 경로 |
|---|---|---|
| `idle` | 없음(기본) | — |
| `processing` | `OrderProcessingScreen` | "주문하기" 클릭 |
| `complete` | `OrderCompleteScreen` | `processing` 시작 1.8초 뒤 자동(참고 저장소 `doOrder` 딜레이와 동일) |
| `error-network` | `OrderFailureScreen type="network"` | QA 트리거만 |
| `error-duplicate` | `OrderFailureScreen type="duplicate"` | QA 트리거만 |

`processing`으로 들어가는 순간 장바구니(`cart`)를 곧바로 비운다 — 참고 저장소도 주문 접수 시점에 비운다. `complete`는 "메뉴로 돌아가기" 버튼 하나로 다시 `idle`로 되돌아간다.

실제 판별 로직(백엔드 응답)이 아직 없어 `placeOrder`는 항상 성공한다 — `error-network`/`error-duplicate` 두 화면은 지금은 아래 QA 트리거로만 도달할 수 있다.

두 실패 화면(`OrderFailureScreen`)은 하나의 컴포넌트가 `type` prop으로 문구·버튼("메인화면으로 이동"+"다시 시도하기"/"주문내역 확인하기")을 나눠 그린다 — 참고 저장소의 컴포넌트 경계를 그대로 따랐다.

> 세션 만료(시간초과·마감)·통신 오류 화면은 별도 브랜치([ADR-025](../decisions.md#adr-025--세션-만료시간초과마감통신-오류-화면도-같은-원칙으로-먼저-완성한다))에서 같은 방식으로 `orderPhase`와 QA 드롭다운을 확장한다.

### QA 미리보기 트리거

헤더의 설정(⚙, `consumer-header__icon-button`) 버튼은 평소엔 아무 동작이 없다가, dev 빌드(`import.meta.env.DEV`)에서만 클릭 시 드롭다운으로 2개 항목("주문 실패 (네트워크)"/"주문 실패 (중복)")을 보여준다(참고 저장소의 dev-nav와 동일한 상호작용 — 바깥 클릭 시 닫힘). 각 항목은 `consumerOrderQaStore`(`apps/consumer/stores/`, zustand)에 요청을 적어두고, `useConsumerOrderPage`가 이를 구독해 `orderPhase`를 강제로 바꾼 뒤 요청을 곧바로 비운다.

헤더(요청하는 쪽)와 order-shell(화면을 그리는 쪽)이 서로 다른 컴포넌트라 콜백을 직접 넘길 수 없어 스토어를 이벤트 버스처럼 쓴다. `useConsumerOrderPage`는 이 값을 `useState`로 구독해 `useEffect`에서 반응하지 않고 zustand의 vanilla `.subscribe()`로 구독한다 — `useState` 구독 방식은 `react-hooks/set-state-in-effect` 린트에 걸린다. 자세한 이유는 [`troubleshooting.md`](../troubleshooting.md#다른-컴포넌트의-zustand-스토어-변경에-반응해-setstate하면-set-state-in-effect-린트-에러) 참고.

production 빌드에서는 `import.meta.env.DEV`가 `false`로 굳어 드롭다운·QA 스토어 관련 코드가 tree-shake로 사라진다 — 실사용자에게는 노출되지 않는다.

## CartBar는 `position: fixed`다 (sticky 아님)

`position: sticky`는 스크롤 콘텐츠가 뷰포트보다 짧으면(항목이 적은 카테고리만 보일 때 등) 바닥에 붙지 못하고 콘텐츠 바로 아래서 "뜬" 채로 멈추는 문제가 있었다. `position: fixed`로 바꾸고, 카트바가 보일 때(`order-shell--with-cart-bar` modifier)만 본문에 고정값 `padding-bottom`을 줘서 마지막 카드가 가려지지 않게 했다(`ConsumerOrderPage.css`).

## 반응형

717px부터 메뉴 목록이 `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`로 열 수를 자동으로 늘린다(717px≈2열, 1440px≈4열…). 셸 자체는 폭 제한 없이 화면을 꽉 채운다. 자세한 근거는 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드), 공통 규칙은 [`layout-policy.md` "Consumer 모바일 셸"](../operations/layout-policy.md#consumer-모바일-셸) 참고.
