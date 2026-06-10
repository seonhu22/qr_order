# 아키텍처 — 동작 구조 · 폴더 구조

> 프로젝트 동작 구조, 폴더 구조, 관리자 라우트 기준, 레이아웃 패턴을 다룬다.

## 목차

- [1. 동작 구조](#1-동작-구조)
- [2. 관리자 라우트 기준](#2-관리자-라우트-기준)
- [3. 폴더 구조 전체](#3-폴더-구조-전체)
- [4. 앱 계층 역할 요약](#4-앱-계층-역할-요약)
- [5. AdminMainLayout — filterSlot 패턴](#5-adminmainlayout--filterslot-패턴)
- [6. 상태 처리 라우팅 기준](#6-상태-처리-라우팅-기준)

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

| 경로                | 설명                      |
| ------------------- | ------------------------- |
| `/admin/login`      | 공개 경로                 |
| `/admin/*`          | 보호 경로 (로그인 필요)   |
| `/` 접근 (비로그인) | `/admin/login` 리다이렉트 |
| `/` 접근 (로그인)   | `/admin/main` 리다이렉트  |

`AdminLayout(Header + Sidebar + Container)`는 고정하고, URL에 따라 컨테이너 내부 페이지만 교체하는 child route 구조를 사용한다.

### 구현된 관리자 페이지 목록

> 추가일: 2026-04-21

| 경로 | 페이지명 | 섹션 | 상태 |
| --- | --- | --- | --- |
| `/admin/main` | 대시보드 | — | 구현 |
| `/admin/system/common-code` | 공통코드 관리 | 시스템 | 구현 |
| `/admin/system/plant` | 사업장 목록 | 시스템 | 구현 |
| `/admin/system/admin-user` | 관리자 관리 | 시스템 | 구현 |
| `/admin/system/menu` | 메뉴 관리 | 시스템 | 구현 |
| `/admin/system/message` | 메시지 관리 | 시스템 | 구현 |
| `/admin/system/rule` | 규칙 관리 | 시스템 | 구현 |
| `/admin/payment/rate` | 결제 요금 관리 | 시스템 | 구현 |
| `/admin/payment/plant-status` | 사업장 상태 조회 | 시스템 | 구현 |
| `/admin/payment/coupon` | 쿠폰 관리 | 시스템 | 구현 |
| `/admin/history/access-log` | 접속 정보 조회 | 시스템 | 구현 |
| `/admin/history/audit-log` | 변경 이력 조회 | 시스템 | 구현 |
| `/admin/notice/manage` | 공지사항 관리 | 게시판 | 구현 |
| `/admin/inquiry/manage` | 문의사항 관리 | 게시판 | 구현 |

### 사이드바 섹션 구조

> 추가일: 2026-04-22

관리자 화면은 **시스템(system)** 과 **게시판(board)** 두 섹션으로 분리된다.
헤더 상단 탭을 클릭해 섹션을 전환하면 사이드바 메뉴가 해당 섹션 메뉴로 교체된다.

```text
AdminHeader
  └ 탭: 시스템 | 게시판       ← activeSection 상태로 관리 (adminLayoutStore)

사이드바 메뉴 config
  ├ systemSidebarMenu.ts     ← 시스템·결제·이력 관련 메뉴
  └ boardSidebarMenu.ts      ← 공지사항·문의사항 메뉴
```

- `activeSection: 'system' | 'board' | null`은 `adminLayoutStore`에서 관리한다.
  - `null`은 대시보드 초기 진입 시(헤더 탭 클릭 전) 상태다.
- `AdminSidebar`는 `activeSection`에 따라 `SYSTEM_SIDEBAR_MENU` 또는 `BOARD_SIDEBAR_MENU`를 `SidebarNav`에 주입한다.
- `detectSectionFromPath(pathname)` 유틸로 현재 URL이 어느 섹션에 속하는지 자동 감지할 수 있다.

#### 헤더 네비게이션 동작 규칙

| 요소 | 동작 |
| --- | --- |
| 홈 버튼 (`i-home`) | `/admin/main` 이동 + `activeSection = null` + 사이드바 닫기 |
| 햄버거 버튼 | `currentSection !== null` 일 때만 노출 — 대시보드에서는 숨김 |
| 헤더 탭 `--current` 스타일 | 클릭 기준이 아닌 **현재 URL 기준** — `detectSectionFromPath(pathname)` 으로 판별 |
| 헤더 탭 클릭 | `setActiveSection` + `openSidebar` 호출 (페이지 이동 없이 사이드바 메뉴만 전환) |

#### 사이드바 펼침 상태 동작 규칙 (`useSidebarExpand`)

| 상황 | 동작 |
| --- | --- |
| URL 변경 (페이지 이동) | `ensureOpen` — 현재 페이지 그룹 추가, 기존 열린 그룹 유지 |
| 사이드바 재오픈 | `resetTo` — 현재 페이지 그룹만 남기고 나머지 닫기 |
| 섹션 전환 | `resetTo` — expand 상태 초기화 |
| 그룹 헤더 클릭 | `toggle` — 개별 토글 (다중 열기 허용) |

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
      hooks/              ← 여러 feature가 함께 쓰는 공용 UX/state 훅
      lib/                ← httpClient.ts, queryClient.ts
      pages/              ← 여러 앱이 공유하는 라우트 단위 페이지 (예: error)
      stores/             ← Zustand 전역 스토어
      styles/             ← 디자인 토큰, 전역 CSS
      utils/
    test/                 ← 테스트 설정 및 공통 유틸
```

> `shared/` 상세 구조·`public/`·`assets/` 설명은 [`components.md` §1 폴더 구조](./components.md#1-폴더-구조) 참고
> 주요 설정 파일 설명은 [`config.md`](./config.md) 참고
> TanStack Query 캐시 기준은 [`query-cache-policy.md`](./query-cache-policy.md) 참고

---

## 4. 앱 계층 역할 요약

| 폴더                | 역할                                              |
| ------------------- | ------------------------------------------------- |
| `apps/*/pages`      | 라우트 단위 화면 — 조립만 담당                    |
| `apps/*/features`   | 화면 내부 재사용 기능 단위 (hook, component, api) |
| `apps/*/routes`     | 앱별 라우터 정의                                  |
| `shared/components` | 공통 UI 컴포넌트                                  |
| `shared/hooks`      | 여러 feature가 재사용하는 공통 UX/state 훅        |
| `shared/lib`        | Query Client, fetch 래퍼 등 공용 인프라           |
| `shared/pages`      | 여러 앱이 공유하는 라우트 단위 페이지             |
| `shared/api`        | query key, 공용 API 계층                          |
| `apps/*/stores`     | 앱별 Zustand UI 상태                              |
| `shared/styles`     | 디자인 토큰 CSS 및 전역 스타일                    |
| `mocks`             | MSW 브라우저 mock 구성                            |
| `test`              | 테스트 설정 및 공통 테스트 유틸                   |

### 편집형 페이지 레이어 예시

> 추가일: 2026-04-14

편집형 목록 화면의 **권장(목표) 구조**는 아래와 같다.
현재 코드베이스에는 과도기 구조가 공존할 수 있으며, 리팩토링 시 이 구조를 기준으로 수렴한다.

```text
pages/<Feature>Page.tsx
  -> features/<feature>/hooks/use<Feature>Page.ts
      -> features/<feature>/hooks/use<Feature>ListState.ts (feature 전용)
      -> shared/hooks/useEditablePageFlow.ts (공통 저장/조회 flow)
      -> features/<feature>/hooks/use<Feature>Flow.ts (feature 고유 flow만)
      -> shared/hooks/useCodeMasterModalFlow.ts (마스터 CRUD 모달 공통)
      -> shared/hooks/useOrderedRowEditor.ts (상세 행 순서 공통)
      -> shared/hooks/useDetailTableSaveFlow.ts (상세 저장/에러 공통)
```

- page는 필터, 테이블, 모달을 조립만 담당한다.
- `useEditablePageFlow`는 조회/초기화 dirty guard와 저장 확인/완료 안내를 공통으로 처리한다.
- `useCodeMasterModalFlow`, `useOrderedRowEditor`, `useDetailTableSaveFlow`는 `CommonCode`, `RuleManagement` 같은 마스터-상세 CRUD 화면의 반복 규칙을 공통 처리한다.
- feature 훅은 API wrapper, 목록 상태, 공통 flow를 합쳐 `data / status / actions / uiProps` 형태로 page에 전달한다.
- 예시: `AdminUser`는 조회/저장 flow 공통화를 우선 적용했고, `CommonCode`/`RuleManagement`는 마스터 모달/상세 행 편집 규칙도 shared 훅으로 재사용한다.
- `RuleManagementPage`는 page-level orchestration 예시로, page가 모달을 조립하고 `useRuleManagementPage`가 마스터/상세 상태와 shared flow를 합쳐 전달한다.

### 관리자 공통 UI 위치

> 추가일: 2026-04-18

관리자 앱 여러 화면에서 함께 쓰는 공용 UI는 `apps/admin/common/*` 같은 별도 축보다
`apps/admin/features/common/*` 아래에 둔다.

- 예: `AdminMainNavigation`
- 이유:
  - `Header`, `Sidebar`, `Brand`처럼 feature 단위 공용 UI와 같은 축에 정렬된다.
  - 오래된 `common/` 디렉터리보다 현재 feature 중심 구조와 맞다.

### shared 테이블 본체 구조

> 추가일: 2026-04-18

마스터/상세 테이블의 shared 본체는 아래처럼 역할을 나눈다.

```text
shared/components/table/
  EditableMasterTable.tsx   ← 마스터 목록 공용 본체
  EditableDetailTable.tsx   ← 상세 편집 공용 본체
  TableBodyRenderer.tsx     ← columns + rows + cells 렌더링
  TableCardContentState.tsx ← loading / error / empty 분기 공통화
```

- `EditableMasterTable`은 공통코드 전용이 아니라 여러 화면이 함께 쓰는 공용 마스터 테이블 본체다.
- `EditableDetailTable`은 상세 편집 테이블의 공용 본체다.
- 각 feature wrapper는 제목, 문구, 도메인별 핸들러만 주입한다.
- 즉, shared 본체를 바꾸면 `CommonCode`, `RuleManagement` 같은 wrapper가 자동으로 같은 개선을 받는다.

---

## 5. AdminMainLayout — filterSlot 패턴

> 추가일: 2026-04-09

`AdminMainLayout`은 `filterSlot` prop을 지원한다.
브레드크럼과 같은 레벨에 필터 영역을 배치하기 위한 슬롯으로, 콘텐츠 div 바깥 섹션 직속 자식으로 렌더된다.

**렌더 순서:** 브레드크럼 → filterSlot → 콘텐츠

```tsx
<AdminMainLayout className="admin-main-layout-page--fixed" filterSlot={<SomeFilters />}>
  <테이블 />
</AdminMainLayout>
```

- `--fixed` 클래스 사용 시 filterSlot 영역은 `flex-shrink: 0` 적용 — 콘텐츠가 늘어나도 필터가 밀리지 않는다.
- 같은 용도의 필터 컴포넌트는 페이지마다 별도 클래스를 만들지 않고 기존 클래스를 재사용한다.
  스타일이 달라지는 경우에만 별도 클래스를 추가한다.

---

## 6. 상태 처리 라우팅 기준

> 추가일: 2026-04-27

HTTP 상태에 따른 화면·이동 처리는 **상태 처리(Status Handling)** 로 부른다.
이 중 화면으로 렌더링되는 403/404/500은 **에러 페이지(Error Page)**, 화면을 만들지 않고 로그인으로 보내는 401은 **인증 리다이렉트(Auth Redirect)** 로 구분한다.

403/404/500 에러 페이지는 여러 앱(admin, client, consumer)에서 같은 시각 요소를 공유하되,
앱별 이동 경로와 버튼 동작만 라우트 또는 페이지 props로 주입한다. 401은 `ErrorPageTemplate` 대상이 아니며 인증 라우팅에서 로그인 페이지로 redirect한다.

### 기본 배치

```text
shared/
  components/error/
    ErrorPageTemplate.tsx   ← 공통 이미지·레이아웃·버튼 영역
    ErrorPageTemplate.css
    index.ts
  pages/error/
    ForbiddenPage.tsx       ← 403
    NotFoundPage.tsx        ← 404
    ServerErrorPage.tsx     ← 500
    index.ts
```

- `shared/components/error`는 공통 에러 화면의 시각 요소와 레이아웃만 담당한다.
- `shared/pages/error`는 상태코드별 기본 문구와 기본 액션을 조립한다.
- `apps/*/routes` 또는 앱별 page wrapper는 `homePath`, `retryAction`, 인증 redirect 경로 같은 앱별 차이만 주입한다.

### 상태코드별 처리 기준

| 상태 | 이름 | 처리 기준 | 화면 처리 |
|---|---|---|---|
| 401 | 인증 리다이렉트(Auth Redirect) | 미로그인 또는 로그인 만료 | 에러 페이지를 렌더링하지 않고 만료 안내 모달 확인 후 앱별 로그인 페이지로 redirect한다. |
| 403 | 에러 페이지(Error Page) | 로그인은 했지만 메뉴·기능 접근 권한 없음 | `ForbiddenPage`를 렌더링한다. |
| 404 | 에러 페이지(Error Page) | 존재하지 않는 URL 또는 삭제된 라우트 | `NotFoundPage`를 렌더링한다. |
| 500 | 에러 페이지(Error Page) | 런타임 에러 또는 복구 불가능한 시스템 오류 | `ServerErrorPage`를 렌더링한다. |

### 401 인증 리다이렉트

401은 사용자에게 에러 화면을 보여주는 상태가 아니라, 인증이 필요한 화면에 접근할 수 없다는 신호다.
따라서 보호 라우트에서 인증 상태를 확인하고 앱별 로그인 경로로 이동시킨다.

```tsx
function RequireAuth({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // 비밀번호 초기화 상태이면 변경 전까지 메인 진입 차단
  if (typeof user?.init_yn === 'string' && user.init_yn.toLowerCase() === 'y') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
```

- API 호출 도중 401이 발생하면 "로그인 인증이 만료되었습니다." 안내 모달을 먼저 표시하고, 확인 클릭 시 로그인 화면으로 이동한다.
- 보호 라우트 직접 접근처럼 이미 비로그인 상태가 확정된 경우는 모달 없이 로그인 화면으로 이동한다.
- `init_yn === 'Y'`인 경우 인증은 됐지만 비밀번호 변경 전까지 모든 보호 라우트 접근이 차단된다. `LoginPage`에서 변경 폼이 표시되며, 흐름 상세는 [`config.md §11`](./config.md#11-인증-구조) 참고.
- 관리자 앱의 로그인 경로는 `/admin/login`이다.
- 추후 client, consumer 앱을 추가하면 각 앱의 보호 라우트에서 자기 앱의 로그인 경로를 주입한다.
- 로그인 만료 API 응답도 최종적으로는 동일한 인증 리다이렉트 흐름으로 수렴시킨다.
- 401 전용 `UnauthorizedPage`는 만들지 않는다. 사용자에게 필요한 다음 행동은 로그인 화면에서 처리한다.

### 앱별 라우팅 분기

각 앱은 자신의 layout 안에서 `*` child route를 두어 앱 내부 404를 처리한다.
앱 전체 fallback은 어느 앱에도 속하지 않는 URL을 처리한다.

```tsx
// admin route 예시
{
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { path: 'main', element: <MainPage /> },
    { path: '*', element: <NotFoundPage homePath="/admin/main" /> },
  ],
}
```

```tsx
// 향후 앱별 homePath 예시
<NotFoundPage homePath="/admin/main" />
<NotFoundPage homePath="/client/main" />
<NotFoundPage homePath="/" />
```

- 관리자 앱은 `/admin/main`을 기본 복귀 경로로 사용한다.
- 사용자 백오피스와 프론트오피스는 앱 라우트가 확정된 뒤 각자의 기본 복귀 경로를 주입한다.
- 500 화면의 재시도 버튼은 단순 경로 이동보다 `retryAction`을 우선한다. `retryAction`이 없을 때만 `homePath` 이동을 제공한다.
- 앱 layout 내부의 에러 페이지는 `layout="contained"`를 사용해 Header/Sidebar를 유지하고 콘텐츠 영역만 교체한다.
- 전역 ErrorBoundary fallback처럼 앱 layout 바깥에서 렌더링하는 에러 페이지는 `layout="fullscreen"`을 사용하고, 재시도 버튼은 새로고침 또는 boundary reset에 연결한다.

### layout 선택 기준

| 위치 | layout | 기준 |
|---|---|---|
| `apps/*/routes`의 layout child route | `contained` | Header/Sidebar 등 앱 shell은 유지하고 본문만 에러 화면으로 교체한다. |
| 메뉴 권한 검사 결과 403 | `contained` | 사용자는 앱 안에 남아 있고, 접근 불가 안내만 콘텐츠 영역에 표시한다. |
| 특정 페이지 ErrorBoundary fallback | `contained` | 해당 페이지 영역만 복구 대상으로 보고 `retryAction`은 boundary reset에 연결한다. |
| `App` 또는 Provider 레벨 ErrorBoundary fallback | `fullscreen` | 앱 shell 자체를 신뢰할 수 없으므로 전체 화면 에러로 대체한다. |
| 앱에 속하지 않는 최상위 fallback | `fullscreen` | 어느 앱 layout도 선택되지 않은 상태이므로 전체 화면으로 안내한다. |

```tsx
// 앱 layout 내부: 콘텐츠 영역만 404로 교체한다.
{ path: '*', element: <NotFoundPage homePath="/admin/main" /> }
```

```tsx
// 전역 fallback: 전체 화면을 500으로 대체하고 새로고침을 제공한다.
<ServerErrorPage
  homePath="/admin/main"
  layout="fullscreen"
  retryAction={() => window.location.reload()}
  retryLabel="새로고침"
/>
```
