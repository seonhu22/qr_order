# 아키텍처 — 동작 구조 · 폴더 구조

> 프로젝트 동작 구조, 폴더 구조, 관리자 라우트 기준, 레이아웃 패턴을 다룬다.

## 목차

- [1. 동작 구조](#1-동작-구조)
- [2. 관리자 라우트 기준](#2-관리자-라우트-기준)
- [3. 폴더 구조 전체](#3-폴더-구조-전체)
- [4. 앱 계층 역할 요약](#4-앱-계층-역할-요약)
- [5. AdminMainLayout — filterSlot 패턴](#5-adminmainlayout--filterslot-패턴)

---

## 1. 동작 구조

본 프로젝트는 프론트엔드와 백엔드가 분리된 상태로 개발된다.

- 프론트엔드 개발 서버: `http://localhost:3000`
- 백엔드(Spring Boot): `http://localhost:8080`
- 프록시: `/api → http://localhost:8080`

브라우저에서 `/api` 요청은 Vite proxy를 통해 백엔드로 전달되므로 CORS 설정 부담 없이 개발할 수 있다.

---

## 2. 관리자 라우트 기준

관리자 화면은 `/admin` prefix 기준으로 통일한다.

| 경로 | 설명 |
|---|---|
| `/admin/login` | 공개 경로 |
| `/admin/*` | 보호 경로 (로그인 필요) |
| `/` 접근 (비로그인) | `/admin/login` 리다이렉트 |
| `/` 접근 (로그인) | `/admin/main` 리다이렉트 |

`AdminLayout(Header + Sidebar + Container)`는 고정하고, URL에 따라 컨테이너 내부 페이지만 교체하는 child route 구조를 사용한다.

---

## 3. 폴더 구조 전체

```text
frontend/
  docs/                   ← 프로젝트 문서
  openapi.json            ← OpenAPI 명세 원본 (git 커밋)
  orval.config.ts         ← Orval 코드 생성 설정
  public/
    mockServiceWorker.js  ← MSW Service Worker
    static/fonts/         ← Pretendard 폰트
  src/
    generated/            ← Orval 자동 생성 (직접 수정 금지)
      types/schema.d.ts
      {컨트롤러}.ts / {컨트롤러}.msw.ts
    apps/
      admin/              ← 관리자 앱
        hooks/ layout/ pages/ routes/ features/
      client/             ← 추후 확장용 골격
      consumer/           ← 추후 확장용 골격
    mocks/
      browser.ts / handlers.ts
    shared/
      api/                ← queryKeys.ts 등 공용 API 계층
      assets/icons/       ← sprite.svg + Icon.tsx
      auth/               ← AuthProvider, 인증 훅
      components/         ← 공용 UI 컴포넌트
      dev/                ← 개발 전용 컴포넌트 가이드 (/dev/*)
      lib/                ← httpClient.ts, queryClient.ts
      stores/             ← Zustand 전역 스토어
      styles/             ← 디자인 토큰, 전역 CSS
      utils/
    test/                 ← 테스트 설정 및 공통 유틸
```

> `shared/` 상세 구조·`public/`·`assets/` 설명은 [`components.md` §1 폴더 구조](./components.md#1-폴더-구조) 참고
> 주요 설정 파일 설명은 [`config.md`](./config.md) 참고

---

## 4. 앱 계층 역할 요약

| 폴더 | 역할 |
|---|---|
| `apps/*/pages` | 라우트 단위 화면 — 조립만 담당 |
| `apps/*/features` | 화면 내부 재사용 기능 단위 (hook, component, api) |
| `apps/*/routes` | 앱별 라우터 정의 |
| `shared/components` | 공통 UI 컴포넌트 |
| `shared/lib` | Query Client, fetch 래퍼 등 공용 인프라 |
| `shared/api` | query key, 공용 API 계층 |
| `shared/stores` | Zustand 전역 UI 상태 |
| `shared/styles` | 디자인 토큰 CSS 및 전역 스타일 |
| `mocks` | MSW 브라우저 mock 구성 |
| `test` | 테스트 설정 및 공통 테스트 유틸 |

---

## 5. AdminMainLayout — filterSlot 패턴

> 추가일: 2026-04-09

`AdminMainLayout`은 `filterSlot` prop을 지원한다.
브레드크럼과 같은 레벨에 필터 영역을 배치하기 위한 슬롯으로, 콘텐츠 div 바깥 섹션 직속 자식으로 렌더된다.

**렌더 순서:** 브레드크럼 → filterSlot → 콘텐츠

```tsx
<AdminMainLayout
  className="admin-main-layout-page--fixed"
  filterSlot={<SomeFilters />}
>
  <테이블 />
</AdminMainLayout>
```

- `--fixed` 클래스 사용 시 filterSlot 영역은 `flex-shrink: 0` 적용 — 콘텐츠가 늘어나도 필터가 밀리지 않는다.
- 같은 용도의 필터 컴포넌트는 페이지마다 별도 클래스를 만들지 않고 기존 클래스를 재사용한다.
  스타일이 달라지는 경우에만 별도 클래스를 추가한다.
