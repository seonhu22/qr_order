# 아키텍처 — 동작 구조 · 폴더 구조

## 목차

- [1. 동작 구조](#1-동작-구조)
- [2. 관리자 라우트 기준](#2-관리자-라우트-기준)
- [3. 폴더 구조 전체](#3-폴더-구조-전체)
- [4. 앱 계층](#4-앱-계층)
- [5. shared 계층](#5-shared-계층)
- [6. 모달 폴더 구조 원칙](#6-모달-폴더-구조-원칙)
- [7. 모달 계층별 역할](#7-모달-계층별-역할)
- [8. `index.ts` 배럴 파일의 의미](#8-indexts-배럴-파일의-의미)
- [9. public 디렉터리](#9-public-디렉터리)
- [10. assets 디렉터리](#10-assets-디렉터리)

---

## 1. 동작 구조

본 프로젝트는 프론트엔드와 백엔드가 분리된 상태로 개발된다.

- 프론트엔드 개발 서버 포트: `3000`
- 백엔드(Spring Boot) 포트: `8080`
- 프록시 경로: `/api → http://localhost:8080`

브라우저는 `http://localhost:3000`으로 접속하지만, 실제 API 요청은 Vite proxy를 통해 백엔드 `8080`으로 전달된다.

이 구조를 사용하는 이유:

- 프론트와 백엔드를 동시에 개발할 수 있다.
- 로컬 개발 중 CORS 설정 부담을 줄일 수 있다.
- 실제 운영 경로와 유사하게 `/api` 기준으로 코드를 유지할 수 있다.

---

## 2. 관리자 라우트 기준

관리자 화면은 `/admin` prefix를 기준으로 통일한다.

- 공개 경로: `/admin/login`
- 보호 경로: `/admin/*`
- 기본 진입:
  - 비로그인 상태에서 `/` 접근 시 `/admin/login`
  - 로그인 상태에서 `/` 접근 시 `/admin/main`
  - `/admin` 접근 시 `/admin/main`

관리자 화면은 child route 구조를 사용한다.
`AdminLayout(Header + Sidebar + Container)`는 고정하고, URL에 따라 컨테이너 내부 페이지만 교체한다.

예시:

- `/admin/main`
- `/admin/system/plant`

---

## 3. 폴더 구조 전체

```text
frontend/
  docs/
    decisions.md        ← 기술 의사결정 기록 (ADR)
    api-codegen.md      ← API 코드 생성 가이드
    architecture.md     ← 동작 구조 · 폴더 구조 (이 문서)
    design-tokens.md    ← 디자인 토큰 시스템
    components.md       ← 공용 컴포넌트 작성 규칙
    operations.md       ← 운영 원칙
    libraries.md        ← 라이브러리 선정 이유
    config.md           ← 주요 설정 파일 설명
  openapi.json          ← OpenAPI 명세 원본 (git 커밋, generate:schema로 갱신)
  orval.config.ts       ← Orval 코드 생성 설정
  public/
    mockServiceWorker.js
    static/
      fonts/
  src/
    generated/          ← Orval 자동 생성 영역 (직접 수정 금지)
      types/
        schema.d.ts
      {컨트롤러}/
        {컨트롤러}.ts         ← API fetch 함수 + TanStack Query 훅
        {컨트롤러}.msw.ts     ← MSW 핸들러
    apps/
      admin/
        hooks/
        layout/
        pages/
        routes/
        features/
      client/
        features/
        pages/
        routes/
      consumer/
        features/
        pages/
        routes/
    mocks/
      browser.ts        ← MSW 브라우저 worker
      handlers.ts       ← 생성된 핸들러 통합 등록
    shared/
      api/
      assets/
        icons/          ← sprite.svg + Icon.tsx
      auth/
      components/
        input/          ← InputBase / InputWrapper / TextInput / SelectInput
        button/         ← Button / LinkButton (10가지 변형 × 3가지 크기)
        checkbox/       ← CheckboxInput / CheckboxGroup
        radio/          ← RadioInput / RadioGroup
        toggle/         ← ToggleInput
        form-alert/     ← FormAlert / DismissibleFormAlert
        modal/
        table/
        feedback/       ← FeedbackState (loading · error · empty · unauthorized)
      dev/              ← 개발 전용 컴포넌트 가이드 페이지 (/dev/*)
      lib/              ← httpClient.ts, queryClient.ts 등 공용 인프라
      stores/
      styles/           ← 디자인 토큰 및 전역 CSS
      utils/
    test/
```

---

## 4. 앱 계층

| 폴더 | 역할 |
|---|---|
| `apps/*/pages` | 라우트 단위 화면 |
| `apps/*/features` | 화면 내부 재사용 기능 단위 |
| `apps/*/routes` | 앱별 라우터 정의 |
| `shared/components` | 공통 UI 컴포넌트 |
| `shared/dev` | 개발 전용 가이드 페이지 |
| `shared/hooks` | 공통 훅 |
| `shared/lib` | Query Client, fetch 래퍼 등 공용 인프라 |
| `shared/api` | API 함수 또는 API 클라이언트 계층 |
| `shared/stores` | Zustand 전역 스토어 |
| `shared/styles` | 디자인 토큰 CSS 및 전역 스타일 |
| `shared/utils` | 날짜, 문자열, 정렬 등 공용 유틸리티 |
| `mocks` | MSW 브라우저 mock 구성 |
| `test` | 테스트 설정 및 공통 테스트 유틸 |

현재 구현된 예시:

- `src/apps/admin/pages/LoginPage.tsx`: 관리자 로그인 화면
- `src/apps/admin/pages/MainPage.tsx`: 관리자 메인 페이지
- `src/apps/admin/routes/AdminRoutes.jsx`: 관리자 라우트 목록
- `src/apps/admin/layout/adminSidebarMenu.ts`: 관리자 메뉴 메타데이터
- `src/apps/admin/hooks/useDashboardInfo.ts`: 대시보드 Query wrapper
- `src/shared/auth/hooks/useCurrentUser.ts`: auth/me Query wrapper
- `src/shared/auth/hooks/useAuthLoginMutation.ts`: 로그인 mutation wrapper
- `src/shared/auth/hooks/useAuthLogoutMutation.ts`: 로그아웃 mutation wrapper

---

## 5. shared 계층

- `src/shared/api`: 공용 API 함수 및 query key (`queryKeys.ts`)
- `src/shared/auth`: 인증 컨텍스트와 Provider (`AuthContext.tsx`, `AuthProvider.jsx`)
- `src/shared/lib`: Query Client 등 공용 인프라
- `src/shared/routes`: 앱 공통 라우트 엔트리
- `src/shared/styles`: reset, fonts, design token, global style
- `src/shared/assets/icons/sprite.svg`: SVG 스프라이트 (`<symbol>` 기반 전체 아이콘)
- `src/shared/assets/icons/Icon.tsx`: `<svg><use>` 기반 아이콘 컴포넌트
- `src/shared/components`: 공용 UI 컴포넌트 계층

---

## 6. 모달 폴더 구조 원칙

```text
src/shared/components/modal/
  wrapper/
    ModalWrapper.tsx      ← 최하위 공통 껍데기 (Portal, Dimmed, Overlay)
  base/
    BaseModal.tsx         ← Header, Body, Footer 공통 골격
    BaseFormModal.tsx     ← 폼 전용 베이스 (유효성 검사, 전송 로직)
  template/
    SaveModal.tsx         ← 저장용 완성형
    UpdateModal.tsx       ← 수정용 완성형
    DetailModal.tsx       ← 상세 보기 완성형
```

신규 모달을 설계할 때는 `wrapper → base → template` 책임 분리를 공통 원칙으로 적용한다.

---

## 7. 모달 계층별 역할

| 계층 | 역할 |
|---|---|
| `wrapper` | React `createPortal`, overlay, dimmed, 배경 클릭 닫기 같은 기계적 동작 |
| `base` | Title, close button, footer button 배치 같은 공통 시각 골격 |
| `template` | DTO 연결, 저장/수정/상세/삭제 같은 비즈니스 목적의 완성형 모달 |

저장/수정 시 Audit Trail을 위한 변경 전/후 데이터 비교는 `template` 계층에서 처리한다.

---

## 8. `index.ts` 배럴 파일의 의미

`src/shared/components/input/index.ts` 같은 파일은 **배럴 파일(barrel file)** — 즉 공용 export 진입점이다.

```text
src/shared/components/input/
  BaseInput.tsx
  SearchInput.tsx
  index.ts          ← 여기서 export를 모음
```

```ts
// index.ts
export { BaseInput } from './BaseInput';
export { SearchInput } from './SearchInput';
```

```ts
// 사용처 — import가 단순해진다
import { BaseInput } from '@/shared/components/input';
```

`index.ts`는 "해당 폴더의 public API 입구" 역할을 한다.
폴더 외부에서는 `index.ts`를 통해서만 import한다. 내부 파일 직접 참조는 금지한다.

---

## 9. public 디렉터리

`public` 디렉터리는 Vite가 정적 파일로 그대로 제공하는 경로이다.

| 파일 | 역할 |
|---|---|
| `public/mockServiceWorker.js` | MSW 브라우저 모킹에 필요한 Service Worker |
| `public/static/fonts/*` | Pretendard 폰트 파일 |

import 없이도 고정 경로로 접근할 수 있다 (`/mockServiceWorker.js`, `/static/fonts/...`).

---

## 10. assets 디렉터리

`src/shared/assets`는 React 코드 안에서 import하거나 조합해서 사용할 공용 리소스를 두는 위치이다.

| 구분 | 위치 | 특징 |
|---|---|---|
| `public` | `public/` | 그대로 제공되는 정적 파일 |
| `assets` | `src/shared/assets/` | 코드와 함께 관리되는 에셋 |
