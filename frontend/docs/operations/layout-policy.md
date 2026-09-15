# 레이아웃 정책

> Flex 스크롤 버블링 방지, SPA 뷰포트 고정, 셸 공통 간격 기준을 정리한다.

## Flex 스크롤 버블링 방지

Flex 자식 요소는 기본적으로 `min-height: auto`를 가진다.
내부 콘텐츠가 늘어나면 할당된 높이를 무시하고 부모를 밀어내며, 스크롤이 의도치 않게 바깥 요소까지 전파될 수 있다.

스크롤을 내부에서 끊어야 하는 flex 자식에는 `min-height: 0`을 명시한다.

```css
.admin-layout__main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

전체 flex 높이 체인의 모든 중간 노드에 `min-height: 0`이 필요하다.

```text
html/body/root
  -> admin-layout
      -> admin-layout__main
          -> section
              -> content-div
                  -> article
                      -> table-wrap  실제 스크롤
```

## SPA 뷰포트 고정

SPA에서는 `body` 자체가 늘어나 뷰포트 레벨 스크롤이 생기는 경우가 있다.
아래 설정을 `global.css`에 둔다.

```css
html,
body {
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100%;
}
```

`overflow: hidden`만으로는 높이를 줄이지 못하므로 `height: 100%`가 함께 있어야 한다.

## 셸 gap 기준

브레드크럼과 첫 번째 콘텐츠(검색 카드·테이블) 간격은 `--spacing-8`(16px)로 통일한다.

| 앱 | 위치 | 값 |
|---|---|---|
| Admin | `admin-main-layout-page`의 `gap` | `var(--spacing-8)` |
| Client | `client-layout__main`의 `gap` | `var(--spacing-8)` |

## 공통 셸 컴포넌트

- 브레드크럼은 `src/shared/components/navigation/PageNavigation`을 사용한다.
- 사이드바 헤더는 `src/shared/components/sidebar/SidebarHeader`를 사용한다.
- 앱별 wrapper는 스토어·이벤트 연결만 담당하고 UI 마크업은 shared 컴포넌트에 위임한다.

## Consumer 모바일 셸

> 추가일: 2026-08-20

`apps/consumer/layout/ConsumerLayout`은 사이드바가 없는 전체화면 모바일 셸이다. Admin/Client의 Sidebar·Breadcrumb·`ClientLayout` 컨테이너 쿼리를 그대로 가져오지 않는다 — 반응형 기준은 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드) 참고.

필수 기준:

- 최상위 셸은 `height: 100dvh`를 우선 사용하고, 구형 엔진 대비 `height: 100vh`를 그 앞에 fallback으로 둔다.
- 셸은 `display: flex; flex-direction: column; overflow: hidden`으로 둔다.
- 본문(스크롤 노드)은 `flex: 1; min-height: 0; overflow-y: auto`를 갖는다 — `html/body`가 이미 `overflow: hidden`으로 고정돼 있어(`global.css`) 이 본문이 유일한 스크롤 기준점이다.
- 헤더는 고정 높이로 두고 `padding-top: env(safe-area-inset-top)`을 적용한다. 높이를 `ResizeObserver`로 계속 측정해 본문 `padding`으로 복제하는 구조는 쓰지 않는다.
- 하단 고정 CTA(`CartBar` 등)는 스크롤 본문의 자연스러운 마지막 요소로 `position: sticky; bottom: 0`을 사용한다 — `position: fixed` 오버레이로 띄우고 본문 `padding-bottom`을 계산해 맞추는 방식보다 마지막 콘텐츠가 가려지는 문제가 구조적으로 생기지 않는다. `padding-bottom: env(safe-area-inset-bottom)`으로 홈 인디케이터와의 겹침을 막는다.
- 카테고리 등 섹션 이동은 `window.scrollTo`가 아니라 본문 스크롤 노드 기준 `scrollIntoView`를 사용한다. sticky 헤더가 대상 섹션을 가리지 않도록 각 섹션에 `scroll-margin-top`(sticky 헤더 높이만큼의 고정값)을 준다.
- 모바일 주요 터치 영역은 최소 44px를 기준으로 한다.
- 수량 -/+ 버튼처럼 빠르게 연타하는 게 정상 사용 패턴인 컨트롤에는 `touch-action: manipulation`을 준다. 없으면 모바일 브라우저가 연속 탭을 더블탭 확대 제스처로 오인해 화면이 갑자기 확대될 수 있다(`QuantityStepperButton` 참고).
- 애니메이션은 `@media (prefers-reduced-motion: no-preference)`로 감싸고, JS로 스크롤 애니메이션을 트리거할 때도 `window.matchMedia('(prefers-reduced-motion: reduce)')`를 확인해 `behavior: 'auto'`로 전환한다.
- 오버레이(모달/시트)에 닫힘 애니메이션을 넣을 땐 `open` prop으로 바로 언마운트하지 않는다 — `shouldRender`/`isClosing` 상태로 애니메이션이 끝날 때까지 렌더링을 유지한 뒤 `onAnimationEnd`에서 언마운트한다(`ConsumerBottomSheet` 참고, 자세한 패턴은 [`troubleshooting.md`](../troubleshooting.md#모달시트가-열릴-때만-애니메이션되고-닫힐-때는-즉시-사라짐)).
- 반응형은 뷰포트 폭 `@media`가 1차 기준이다. 폴더블 여부를 먼저 판별하려 하지 않고, 넓은 뷰포트에서도 중요한 UI가 중앙에 애매하게 걸리지 않는 레이아웃을 먼저 만든다.
  - `~480px` 미만: 헤더는 아이콘+액션 한 줄 / 매장 정보 다음 줄(`flex-wrap` + `order`로 반전).
  - `~717px` 이상(폴드 펼침·태블릿·웹): 셸의 `max-width` 제한을 없애 화면을 꽉 채운다. 메뉴 목록은 `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`로 열 수를 고정하지 않고 카드 폭에 맞춰 자동으로 늘어난다(717px≈2열, 1440px≈4열…). 태블릿/데스크톱을 가르는 별도 브레이크포인트 없이 auto-fit이 알아서 처리한다.
- 2차 보정으로 `@media (horizontal-viewport-segments: 2)`를 progressive enhancement로 얹는다 — 실제 힌지 정보를 주는 기기에서만 `env(viewport-segment-*)`로 힌지 폭을 읽어 2열 그리드의 `column-gap`에 반영하고 셸의 `max-width` 제한을 푼다. 미지원 브라우저는 이 블록이 매치되지 않아 1차 레이아웃 그대로 동작하므로 폴백이 필요 없다. 근거는 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드) 참고.
