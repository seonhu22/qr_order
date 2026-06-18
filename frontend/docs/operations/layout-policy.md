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
