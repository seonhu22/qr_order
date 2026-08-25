# Consumer 주문 화면 규약

> 경로: `/consumer/order`
> 화면: Consumer > 주문(메뉴 목록·장바구니)

QR 인증 후 도착하는 화면이다. 메뉴 목록, 검색, 상세는 Consumer 메뉴 API를 사용한다. 장바구니와 주문은 아직 화면 로컬 상태다.

## 헤더와 페이지의 역할 분리

`ConsumerHeader`(`apps/consumer/features/header/components/ConsumerHeader.tsx`)는 `ConsumerLayout`이 마운트하는 고정 영역으로, 브랜드·매장정보·직원호출·주문내역·설정 버튼뿐 아니라 **검색창과 카테고리 탭도 여기서 렌더링한다**. 검색어·선택 카테고리 자체는 `apps/consumer/stores/consumerOrderFilterStore.ts`(zustand)에 있고, `useConsumerOrderPage`(order-shell)가 이 값을 읽어 실제 필터링을 수행한다.

- 처음에는 검색·탭을 order-shell(페이지) 쪽에 두었으나, 참고 UI는 로고·매장정보·검색·탭이 한 헤더 블록이라 그 사이에 불필요한 border·padding 이중 레이어가 생겼다. 헤더로 옮기고 상태만 스토어로 공유하도록 고쳤다.
- 카테고리와 매장명, 테이블 번호는 메인 API 응답을 사용한다. 헤더와 페이지가 같은 React Query 키를 사용해 요청은 중복되지 않는다.

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
| `menu-detail` | 메뉴 카드 클릭 | 이미지·메뉴 정보·수량·옵션·담기 버튼 (`MenuDetailSheet`) |
| `cart` | `CartBar` 클릭 | 담은 항목 목록 + "주문하기" 버튼(disabled, "준비 중입니다") |
| `order-history` | 헤더 "주문내역" 버튼 | "준비 중입니다" 플레이스홀더만 |
| `staff-call` | 헤더 "직원호출" 버튼 | "준비 중입니다" 플레이스홀더만 |

렌더러는 `ConsumerBottomSheet`(신규 primitive, `WrapperModal` 미재사용 — ADR-020) 하나이고, 내용만 `sheet.type`에 따라 `ConsumerOrderPage.tsx`가 조립한다.

## 메뉴 상세 시트 구성

`MenuDetailSheet`(`features/order-shell/components/MenuDetailSheet.tsx`)가 시트 본문을 조립한다. 위에서부터 다음 순서다.

| 조각 | 컴포넌트 | 비고 |
|---|---|---|
| 이미지 | `MenuDetailSheet` 내부 | 시트 본문의 좌우 패딩을 음수 마진으로 상쇄해 폭을 꽉 채운다. `imageUrl`이 없으면 `ci-utensils` 아이콘 |
| 메뉴 정보 | `MenuDetailSheet` 내부 | 이름·기본가·설명. 전부 메뉴 데이터에서 온다 |
| 수량 | `QuantityStepper` | 고정 라벨 "수량" + 증감 버튼. 1~99 |
| 옵션 | `MenuOptionGroupList` | 옵션이 없으면 렌더링 자체를 건너뛴다 |
| 담기 | `AddToCartButton` | 고정 문구 "장바구니에 담기" + 총액을 양끝 배치 |

수량·옵션 선택 상태는 `useMenuDetailSheet`(feature 훅)가 소유한다. 다른 메뉴를 열었을 때 이전 선택이 남지 않도록 `ConsumerOrderPage`가 `key={detailItem.id}`로 시트를 새로 마운트한다.

### 시트 제목을 쓰지 않는다

디자인상 이미지가 시트 맨 위에 오고 메뉴명은 그 아래에 있어, `ConsumerBottomSheet`의 `title`(시각적 제목)을 넘기지 않는다. 대신 primitive에 `ariaLabel` prop을 추가해 스크린리더용 이름만 따로 전달한다. `cart`/`order-history`/`staff-call`은 기존대로 `title`을 쓴다.

### 옵션 선택 규칙

- 필수(`required`) + 단일 선택 그룹은 품절이 아닌 첫 항목이 미리 선택된 상태로 열린다 — 사용자가 옵션을 건드리지 않아도 담기가 가능해야 하기 때문이다.
- 단일 선택은 다른 항목을 고르면 교체될 뿐 해제되지 않는다 — `radio`가 재클릭 시 change를 발생시키지 않으므로 해제 동작 자체를 두지 않았다. 옵션 단일 그룹에 "선택 안 함"이 필요해지면 별도 choice 항목으로 넣는다.
- 복수 선택은 API가 제공한 항목을 제한 없이 조합한다. 현재 계약에는 그룹 단위 최대 선택 개수가 없다.
- 수량 선택은 항목별 `maximumNum`까지 증감할 수 있고, `defaultYn`이 기본 선택 수량 1로 반영된다.
- 필수 그룹 중 하나라도 비어 있으면 담기 버튼이 비활성화된다(`canAddToCart`).
- 단일 선택은 `radio`, 복수 선택은 `checkbox`로 렌더링해 키보드·스크린리더 동작을 브라우저에 맡긴다.

### 가격 계산

`features/order-shell/cartLine.ts`에 모아 뒀다.

```
1개당 가격 = 메뉴 기본가 + 옵션 추가 금액 합계
총액       = 1개당 가격 × 수량
```

옵션 추가 금액은 음수도 허용하며 수량 선택 옵션은 `옵션 가격 × 선택 수량`으로 계산한다.

## 장바구니 줄 식별 — `cartKey`

같은 메뉴라도 옵션 조합이나 옵션 수량이 다르면 다른 줄로 남아야 하므로, 병합 기준은 `menuId`가 아니라 `cartKey`다. `buildCartKey`(`cartLine.ts`)가 메뉴 id 뒤에 `옵션 id:수량`을 정렬해서 이어붙인다. 선택 순서가 달라도 같은 조합이면 같은 줄로 합쳐진다.

```
옵션 없음            menu-3
백미                 menu-1__menu-1-rice-white
백미 + 계란후라이     menu-1__menu-1-extra-egg+menu-1-rice-white
```

## 장바구니

`useConsumerOrderPage`가 소유하는 순수 React state다. 세션별 격리나 새로고침 유지가 없고, 페이지를 벗어나면(언마운트) 그냥 사라진다 — 3단계에서 실제 장바구니 store로 교체할 대상.

## CartBar는 `position: fixed`다 (sticky 아님)

`position: sticky`는 스크롤 콘텐츠가 뷰포트보다 짧으면(항목이 적은 카테고리만 보일 때 등) 바닥에 붙지 못하고 콘텐츠 바로 아래서 "뜬" 채로 멈추는 문제가 있었다. `position: fixed`로 바꾸고, 카트바가 보일 때(`order-shell--with-cart-bar` modifier)만 본문에 고정값 `padding-bottom`을 줘서 마지막 카드가 가려지지 않게 했다(`ConsumerOrderPage.css`).

## 반응형

717px부터 메뉴 목록이 `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`로 열 수를 자동으로 늘린다(717px≈2열, 1440px≈4열…). 셸 자체는 폭 제한 없이 화면을 꽉 채운다. 자세한 근거는 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드), 공통 규칙은 [`layout-policy.md` "Consumer 모바일 셸"](../operations/layout-policy.md#consumer-모바일-셸) 참고.
