# StatusHandling

> 추가일: 2026-04-27

HTTP 상태에 따른 화면·이동 처리 기준을 다룬다.
401은 인증 리다이렉트(Auth Redirect)로 처리하고, 403/404/500은 `ErrorPageTemplate` 기반 에러 페이지로 처리한다.

## 1. 역할 분리

`shared/components/error/ErrorPageTemplate`은 공통 시각 요소와 레이아웃만 담당한다.
상태코드별 기본 문구는 `shared/pages/error`에서 조립하고, 앱별 이동 경로는 라우트 또는 page wrapper에서 props로 주입한다.

| 위치 | 역할 |
|---|---|
| `shared/components/error/ErrorPageTemplate.tsx` | 공통 이미지, 상태코드, 제목, 설명, 버튼 영역 렌더링 |
| `shared/components/error/types.ts` | `ErrorPageAction`, `ErrorPageLayout`, `ErrorPageTemplateProps` 타입 |
| `shared/pages/error/ForbiddenPage.tsx` | 403 기본 문구와 액션 조립 |
| `shared/pages/error/NotFoundPage.tsx` | 404 기본 문구와 액션 조립 |
| `shared/pages/error/ServerErrorPage.tsx` | 500 기본 문구와 재시도/복귀 액션 조립 |
| `apps/*/routes` | 앱별 `homePath`, `retryAction`, 인증 리다이렉트 경로 주입 |

## 2. Props 기준

`ErrorPageTemplate`은 상태별 로직을 내부에 하드코딩하지 않고 아래 값을 props로 받는다.

| prop | 설명 |
|---|---|
| `statusCode` | 화면에 표시할 상태 코드 (`403`, `404`, `500` 등) |
| `title` | 주 제목 |
| `description` | 보조 설명 |
| `imageVariant` | 공통 이미지/일러스트 분기 키 (`forbidden`, `not-found`, `server-error`) |
| `layout` | 배치 범위. 앱 layout 내부는 `contained`, 전역 fallback은 `fullscreen` |
| `primaryAction` | 주요 버튼. `to` 또는 `onClick` 중 하나를 사용 |
| `secondaryAction` | 보조 버튼. 필요할 때만 사용 |

```tsx
<ErrorPageTemplate
  statusCode="404"
  title="페이지를 찾을 수 없습니다."
  description="주소가 변경되었거나 삭제된 페이지입니다."
  imageVariant="not-found"
  primaryAction={{ label: '메인으로 이동', to: homePath }}
/>
```

## 3. layout 옵션

`layout`은 에러 화면이 들어가는 부모 영역에 맞춰 선택한다.

| 값 | 사용 위치 | 동작 |
|---|---|---|
| `contained` | 앱 layout의 `<Outlet />`, 페이지 단위 fallback | 부모 콘텐츠 영역을 채운다. 기본값이다. |
| `fullscreen` | 전역 ErrorBoundary fallback, 앱 layout 바깥 fallback | viewport 전체를 채운다. |

```tsx
// 앱 layout 안에서 사용하는 기본 형태
<NotFoundPage homePath="/admin/main" />
```

```tsx
// 앱 shell 바깥에서 전체 화면을 대체하는 형태
<ServerErrorPage
  homePath="/admin/main"
  layout="fullscreen"
  retryAction={() => window.location.reload()}
  retryLabel="새로고침"
/>
```

## 4. 이미지와 색상 기준

현재 에러 페이지는 별도 이미지 파일을 두지 않고 `shared/assets/icons/sprite.svg`의 `i-qr` 아이콘을 사용한다.
기준 디자인은 `Gomgom331/Qrorder`의 `src/app/pages/NotFound.tsx`에 있는 404 화면이다.

| 상태 | imageVariant | 이미지 기준 |
|---|---|---|
| 403 | `forbidden` | `i-qr` 아이콘 |
| 404 | `not-found` | `i-qr` 아이콘 |
| 500 | `server-error` | `i-qr` 아이콘 |

- 상태 코드 색상은 `--color-border-default`를 사용한다.
- 아이콘도 상태 코드와 같은 `--color-border-default`를 사용한다.
- 제목은 `--color-text-secondary`, 설명은 `--color-text-disabled`를 사용한다.
- 버튼은 `shared/components/button`의 공용 버튼 스타일을 재사용한다.
- 직접 hex 값을 쓰지 않고 `semantic-tokens.css`의 semantic token만 참조한다.
- 에러 페이지 전용 실제 이미지 파일이 필요해지면 `src/shared/assets/images/error/` 아래에 둔다.
- 실제 이미지 파일을 추가하더라도 `ErrorPageTemplate` 호출부의 `imageVariant` 계약은 유지한다.

## 5. 상태별 페이지 사용

상태별 페이지는 기본 문구를 제공하고, 앱별로 필요한 값만 덮어쓴다.

```tsx
<ForbiddenPage homePath="/admin/main" />
```

```tsx
<NotFoundPage
  homePath="/client/main"
  homeLabel="클라이언트 홈으로 이동"
/>
```

```tsx
<ServerErrorPage
  homePath="/"
  title="일시적인 오류가 발생했습니다."
  description="잠시 후 다시 시도해주세요."
  retryAction={resetPageError}
/>
```

## 6. 인증 리다이렉트와 에러 페이지 구분

상태 처리 전체를 부를 때는 `상태 처리(Status Handling)`라고 부른다.
그 안에서 화면으로 렌더링하는 403/404/500만 `에러 페이지(Error Page)`라고 부르고, 401은 `인증 리다이렉트(Auth Redirect)`로 분리한다.

| 상태 | 이름 | 처리 위치 | 기준 |
|---|---|---|---|
| 401 | 인증 리다이렉트 | `RequireAuth`, API 인증 실패 처리 | 만료 안내 모달 확인 후 로그인 화면으로 이동 |
| 403 | 에러 페이지 | 앱 layout 내부 route 또는 권한 검사 fallback | 접근 권한 없음 안내 |
| 404 | 에러 페이지 | 앱별 `*` child route, 잘못된 query 처리 | 존재하지 않는 화면 안내 |
| 500 | 에러 페이지 | ErrorBoundary, 복구 불가능한 서버/런타임 오류 | 재시도 또는 복귀 안내 |

- 401 전용 `UnauthorizedPage`는 만들지 않는다.
- 로그인 만료는 "로그인 인증이 만료되었습니다." 안내 모달을 띄우고, 사용자가 `확인`을 누르면 앱별 로그인 경로로 redirect한다.
- 비로그인 상태에서 보호 라우트에 직접 접근한 경우는 모달 없이 `RequireAuth`가 로그인 화면으로 redirect한다.
- 로그인 경로는 admin은 `/admin/login`, 추후 client/consumer는 각 앱 라우트에서 따로 주입한다.

```tsx
// 업무 API 호출 도중 401 발생
notifyUnauthorized();

// AuthRedirectHandler
<NoticeModal
  open={isExpiredModalOpen}
  title="로그인 인증이 만료되었습니다."
  description="확인을 누르면 로그인 화면으로 이동합니다."
  primaryAction={{ label: '확인', onClick: redirectToLogin }}
/>
```

## 7. 사용 기준

- 403/404/500의 이미지와 레이아웃은 `ErrorPageTemplate`에서 공통 관리한다.
- 앱별 버튼 경로만 다르면 `homePath`, `supportPath`, `retryAction` 같은 props로 분기한다.
- `AdminLayout`/`ClientLayout`/`ConsumerLayout` 내부 라우트에서는 기본값인 `layout="contained"`를 사용한다.
- `App` 전역 ErrorBoundary fallback처럼 헤더와 사이드바 없이 전체 화면을 대체할 때만 `layout="fullscreen"`을 사용한다.
- 401은 에러 페이지를 렌더링하지 않고 인증 흐름에서 로그인 페이지로 redirect한다.
- 라우팅 기준은 [architecture.md §6 상태 처리 라우팅 기준](../architecture.md#6-상태-처리-라우팅-기준)을 따른다.
