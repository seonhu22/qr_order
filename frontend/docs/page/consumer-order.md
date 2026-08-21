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
| `menu-detail` | 메뉴 카드 클릭 | 설명·가격·담기 버튼. 옵션 그룹(필수/선택/복수)은 아직 없음 — 다음 단계 |
| `cart` | `CartBar` 클릭 | 담은 항목 목록 + "주문하기" 버튼(disabled, "준비 중입니다") |
| `order-history` | 헤더 "주문내역" 버튼 | "준비 중입니다" 플레이스홀더만 |
| `staff-call` | 헤더 "직원호출" 버튼 | "준비 중입니다" 플레이스홀더만 |

렌더러는 `ConsumerBottomSheet`(신규 primitive, `WrapperModal` 미재사용 — ADR-020) 하나이고, 내용만 `sheet.type`에 따라 `ConsumerOrderPage.tsx`가 조립한다.

## 장바구니

`useConsumerOrderPage`가 소유하는 순수 React state다. 세션별 격리나 새로고침 유지가 없고, 페이지를 벗어나면(언마운트) 그냥 사라진다 — 3단계에서 실제 장바구니 store로 교체할 대상.

## CartBar는 `position: fixed`다 (sticky 아님)

`position: sticky`는 스크롤 콘텐츠가 뷰포트보다 짧으면(항목이 적은 카테고리만 보일 때 등) 바닥에 붙지 못하고 콘텐츠 바로 아래서 "뜬" 채로 멈추는 문제가 있었다. `position: fixed`로 바꾸고, 카트바가 보일 때(`order-shell--with-cart-bar` modifier)만 본문에 고정값 `padding-bottom`을 줘서 마지막 카드가 가려지지 않게 했다(`ConsumerOrderPage.css`).

## 반응형

717px부터 메뉴 목록이 `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`로 열 수를 자동으로 늘린다(717px≈2열, 1440px≈4열…). 셸 자체는 폭 제한 없이 화면을 꽉 채운다. 자세한 근거는 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드), 공통 규칙은 [`layout-policy.md` "Consumer 모바일 셸"](../operations/layout-policy.md#consumer-모바일-셸) 참고.
