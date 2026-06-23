# QR Order Frontend

## 목차

- [1. 문서 목적](#1-문서-목적)
- [2. 팀원 작업 시작 순서](#2-팀원-작업-시작-순서)
- [3. 프로젝트 개요](#3-프로젝트-개요)
- [4. 권장 개발 사이클](#4-권장-개발-사이클)
- [5. 사전 준비 사항](#5-사전-준비-사항)
- [6. 설치 및 실행](#6-설치-및-실행)
- [7. 사용 가능한 스크립트](#7-사용-가능한-스크립트)
- [8. MSW 모드 전환](#8-msw-모드-전환)
- [9. 작업 시 주의할 점](#9-작업-시-주의할-점)
- [10. 자주 발생하는 문제](#10-자주-발생하는-문제)
- [11. 참고 문서](#11-참고-문서)
- [12. 문서 작성 원칙](#12-문서-작성-원칙)
- [13. 진행 중 작업 — 테이블 배치 관리 다음 단계](#13-진행-중-작업--테이블-배치-관리-다음-단계)

---

## 1. 문서 목적

본 문서는 `frontend` 프로젝트를 처음 전달받은 팀원이 개발 환경을 스스로 구성하고, 실행·점검·테스트까지 수행할 수 있도록 작성한 설정 가이드이다.

상세한 내용은 [`docs/README.md`](./docs/README.md)를 문서 지도로 삼아 필요한 부모 문서와 상세 문서를 찾아본다.

---

## 2. 팀원 작업 시작 순서

신규 팀원은 아래 순서대로 시작하는 것을 권장한다.

1. `frontend/README.md` 전체 읽기
2. `npm install`
3. 백엔드 기동 확인
4. `npm run generate` (API 타입 + 훅 + MSW 핸들러 전체 생성)
5. `npm run lint`
6. `npm run typecheck`
7. `npm test`
8. `npm run dev`
9. 브라우저에서 기본 화면 확인 (`http://localhost:3000`)
10. 이후 담당 화면 개발 시작

---

## 3. 프로젝트 개요

본 프론트엔드는 QR Order 프로젝트의 사용자 화면 및 관리자 화면 개발을 위한 작업 공간이다.

| 항목 | 내용 |
|---|---|
| 개발 서버 | Vite |
| UI 라이브러리 | React 19 |
| 상태 관리 | TanStack Query + Zustand |
| 언어 | TypeScript (JS/JSX 점진적 전환 중) |
| 스타일 | CSS 커스텀 프로퍼티 (2단계 토큰 구조) |
| 테스트 | Vitest + Testing Library + MSW |

- 프론트엔드 개발 서버: `http://localhost:3000`
- 백엔드(Spring Boot): `http://localhost:8080`
- 프록시: `/api → http://localhost:8080`

---

## 4. 권장 개발 사이클

```powershell
# 기능 구현 또는 수정
npm run lint
npm run typecheck
npm test

# 백엔드 API가 변경된 경우
npm run generate:schema   # 백엔드 켜야 함
npm run generate

# 감시 모드 (테스트 작성 중)
npm run test:watch
```

---

## 5. 사전 준비 사항

### 필수 설치 도구

- `Node.js` 20 이상
- `npm`
- `Java 17` 이상 (백엔드 실행용)

### 백엔드 기동 확인 방법

Spring Boot 실행 로그에 아래 문구가 보이면 정상이다.

```text
Tomcat started on port 8080 (http) with context path '/'
Started QROrderApplication
```

PowerShell에서 포트 확인:

```powershell
netstat -ano | findstr :8080
```

---

## 6. 설치 및 실행

```powershell
# 의존성 설치
npm install

# 설치 후 확인
npm run lint
npm run typecheck
npm test

# 개발 서버 실행
npm run dev
```

빌드 결과는 백엔드 정적 리소스 경로로 출력된다.

```powershell
npm run build
# → ../qrorder/src/main/resources/static
```

---

## 7. 사용 가능한 스크립트

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | Vite 개발 서버 실행 (포트 3000, MSW 기본 활성) |
| `npm run dev:mock` | MSW 활성화 개발 서버 |
| `npm run dev:real` | MSW 비활성화 개발 서버 (실제 백엔드 연동) |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm test` | Vitest 1회 실행 |
| `npm run test:watch` | 테스트 감시 모드 |
| `npm run test:coverage` | 커버리지 보고서 생성 (`coverage/` 디렉터리) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run generate:schema` | 백엔드에서 OpenAPI 명세 저장 (백엔드 필요) |
| `npm run generate` | `openapi.json` 기반 코드 재생성 |

### API 코드 생성 흐름

```text
Spring Boot Swagger → openapi.json → src/generated/ (API 함수·훅·MSW 핸들러)
```

- `src/generated/` 하위 파일은 직접 수정하지 않는다.
- `openapi.json`은 git에 커밋한다.
- 상세 내용: [`docs/api-codegen.md`](./docs/api-codegen.md)

---

## 8. MSW 모드 전환

| 모드 | 명령 | 설명 |
|---|---|---|
| MSW 활성 (기본) | `npm run dev` | 브라우저에서 MSW가 요청을 가로챔 |
| MSW 활성 | `npm run dev:mock` | 위와 동일, 명시적 |
| 실제 백엔드 | `npm run dev:real` | MSW 비활성, Vite proxy → 8080 |
| 실제 백엔드 | `npm run build && npm run preview` | 프로덕션 빌드 확인 |

**브라우저 콘솔에 MSW 활성 로그가 보이면 mock 모드로 동작 중이다.**

---

## 9. 작업 시 주의할 점

### 생성 파일은 직접 수정하지 않는다

- `src/generated/` 하위 파일은 Orval과 `openapi-typescript` 결과물이므로 직접 수정하지 않는다.
- 백엔드 API가 변경되면 `npm run generate:schema`로 `openapi.json`을 갱신한 뒤 `npm run generate` 결과까지 함께 커밋한다.
- 생성 API를 화면에서 바로 호출하기보다, 필요한 경우 `features/<feature>/api/*` 또는 `shared/auth/hooks/*`처럼 프로젝트 wrapper를 통해 사용한다.

### 인증과 로그아웃은 Query 캐시 기준으로 처리한다

- 현재 인증 상태는 `queryKeys.auth.me` 캐시를 `AuthProvider`가 읽어서 계산한다.
- 로그인/로그아웃 응답을 받은 뒤 localStorage나 sessionStorage를 직접 만지지 않는다. 요청은 `credentials: 'include'` 기반 쿠키 세션 흐름을 따른다.
- 로그인은 `useAuthLoginMutation`을 사용한다. 성공 시 로그인 응답으로 `auth/me` 캐시를 즉시 채우고, `/api/auth/me`는 백그라운드에서 다시 동기화한다.
- 로그아웃은 `useAuthLogoutMutation`을 사용한다. 이 훅은 `/api/auth/logout` 성공/실패와 관계없이 `auth/me` 캐시를 비우고, 호출부에서 로그인 화면으로 이동시킨다.
- 일반 API 401은 `httpClient`가 인증 만료 이벤트로 알리고, auth API의 401은 로그인·초기 인증 확인 흐름에서 직접 처리한다.

### MSW 모드와 실제 백엔드 모드를 구분한다

- `npm run dev`와 `npm run dev:mock`은 MSW가 API를 가로챈다.
- 실제 백엔드 연동을 확인할 때는 `npm run dev:real`을 사용하고, Network 탭에서 요청이 `localhost:8080`으로 전달되는지 확인한다.
- 인증 관련 mock은 생성 핸들러보다 `src/test/handlers.js`의 커스텀 핸들러를 우선 사용한다.

### 공용 규칙을 먼저 확인한다

- 테이블/카드 UI는 [`docs/components/TableCard.md`](./docs/components/TableCard.md)를 우선 따른다.
- 상태 처리, 401 리다이렉트, 403/404/500 에러 페이지 기준은 [`docs/components/StatusHandling.md`](./docs/components/StatusHandling.md)를 따른다.
- 검색폼(필터카드)을 새로 만들 때는 `/dev/filter` 가이드와 [`docs/operations/page-patterns.md`](./docs/operations/page-patterns.md)의 날짜range·기간 프리셋·`SelectInput` 규약을 먼저 확인한다.
- 개발 전용 가이드 라우트는 인증 없이 등록되어 있으므로, 운영 화면 코드와 섞이지 않도록 주의한다.

---

## 10. 자주 발생하는 문제

### `npm install` 중 의존성 충돌

- `package.json`을 임의로 수정했다면 peer dependency 범위를 먼저 확인한다.

### 화면은 열리는데 API가 실패하는 경우

1. 백엔드가 `8080`에서 실행 중인지 확인
2. `vite.config.js`의 proxy 설정 확인
3. 백엔드 인증 설정 확인
4. 브라우저 개발자 도구 Network 탭 확인

### 테스트가 실패하는 경우

1. `src/test/setup.js`가 정상 로드되는지 확인
2. MSW 핸들러가 현재 API 경로와 일치하는지 확인
3. 테스트가 실제 화면 기준으로 작성되었는지 확인

---

## 11. 참고 문서

| 문서 | 내용 |
|---|---|
| [`docs/README.md`](./docs/README.md) | 프론트엔드 문서 지도, 작업 주제별 부모 문서 진입점 |
| [`docs/architecture.md`](./docs/architecture.md) | 동작 구조, 폴더 구조, 라우트, 레이아웃 패턴 |
| [`docs/design-tokens.md`](./docs/design-tokens.md) | 디자인 토큰 시스템, 컬러·타이포그래피 참고표 |
| [`docs/components.md`](./docs/components.md) | 공용 컴포넌트 작성 규칙, 타입/배럴 파일 규칙 |
| [`docs/operations.md`](./docs/operations.md) | 운영 원칙과 상태/API/리팩토링/페이지 패턴 상세 문서 입구 |
| [`docs/libraries.md`](./docs/libraries.md) | 라이브러리 선정 이유, 테스트 도구 구성 |
| [`docs/config.md`](./docs/config.md) | 주요 설정 파일 설명 |
| [`docs/auth.md`](./docs/auth.md) | 인증 구조, 쿼리 키 분리, init_yn 비밀번호 강제 변경 흐름 |
| [`docs/api-codegen.md`](./docs/api-codegen.md) | API 코드 자동 생성 전체 가이드, 명령어, CI 검증 방식, 모드 전환 |
| [`docs/admin-navigation.md`](./docs/admin-navigation.md) | `sys_menu` 기반 header/sidebar/breadcrumb/access-log 규칙 |
| [`docs/menu-access-log.md`](./docs/menu-access-log.md) | 관리자 메뉴 접근 로그 정책, 신규 메뉴 추가 시 체크리스트 |
| [`docs/troubleshooting.md`](./docs/troubleshooting.md) | 자주 나온 오류 메시지 해석과 우선 확인 포인트 |
| [`docs/decisions.md`](./docs/decisions.md) | 기술 의사결정 기록 (ADR) |

공용 컴포넌트 사용 패턴(테이블·카드·첨부파일·입력)은 [`docs/components.md`](./docs/components.md)를 부모 문서로 보고, 컴포넌트별 상세 문서는 그 문서의 `상세 문서` 섹션에서 찾는다.

상태 처리 작성 기준:
- 401 로그인 리다이렉트와 403/404/500 에러 페이지 라우팅 분기 기준은 [`docs/architecture.md §6`](./docs/architecture.md#6-상태-처리-라우팅-기준)을 참고한다.
- 공통 상태 처리와 에러 화면 템플릿 작성 기준은 [`docs/components/StatusHandling.md`](./docs/components/StatusHandling.md)을 참고한다.

학습용 참고 문서:
- [`docs/training/Tanstack-Query-Guide.md`](./docs/training/Tanstack-Query-Guide.md)
  사람 학습용 문서이며, 현재 프로젝트의 구현 기준이나 AI 코드 생성 지침으로 사용하지 않는다.

---

## 12. 문서 작성 원칙

`docs/` 문서를 추가하거나 수정할 때 아래 원칙을 지킨다.

### 파일별 역할 분리

각 파일은 단일 주제만 다룬다. 내용을 추가하기 전에 **어느 파일에 속하는지** 먼저 판단한다.

| 추가할 내용 | 작성 위치 |
|---|---|
| 문서 위치를 찾기 위한 최상위 지도 | `docs/README.md` |
| 폴더 구조, 라우트, 레이아웃 패턴 변경 | `architecture.md` |
| 디자인 토큰 추가·변경, 스타일 원칙 | `design-tokens.md` |
| 공용 컴포넌트 작성 규칙, 새 컴포넌트 사용법 | `components.md` |
| 개발·설계 원칙, 리팩토링 규칙, 페이지 표준 | `operations.md`와 `operations/*` |
| 라이브러리 추가·교체 이유 | `libraries.md` |
| 설정 파일 변경 | `config.md` |
| 인증 흐름, 쿼리 키, 비밀번호 변경 정책 변경 | `auth.md` |
| API 코드 생성 흐름·명령어 변경 | `api-codegen.md` |
| 관리자 메뉴 접근 로그 정책, 신규 메뉴 추가 시 체크리스트 | `menu-access-log.md` |
| 기술 선택의 배경과 근거 | `decisions.md` |

### 중복 방지

- 같은 내용을 두 파일에 나눠 쓰지 않는다.
- 다른 파일 내용이 필요하면 링크로 참조한다.
  - 예: `→ [상태 관리 정책](./operations/state-policy.md) 참고`
- 중복이 발견되면 한쪽을 삭제하고 링크로 대체한다.

### 추가 시기

새로운 패턴·원칙·설정이 **코드에 반영됐을 때** 함께 문서화한다. 계획 단계 내용은 `decisions.md`에 배경과 근거로 남긴다.

### 형식 규칙

- 날짜가 있는 항목은 `> 추가일: YYYY-MM-DD` 형식으로 표기한다.
- CSS 값은 px 대신 토큰 이름을 명시한다 (`--spacing-2` 등).
- 코드 예시는 꼭 필요한 경우에만 작성하고, 토큰·규칙 목록은 글머리 기호로 표현한다.

---

## 13. 진행 중 작업 — 테이블 배치 관리 다음 단계

> 추가일: 2026-06-18

`/client/store/table/layout`(`features/table-layout`, `pages/table-layout`)는 레이아웃·카드·사이즈별(작게/보통/크게) 배치 아이템 디자인까지 완료됐다. 실제 드래그앤드롭·클릭배치 이벤트를 연결하기 전에 정리하거나 추가해야 할 항목은 다음과 같다. 작업이 끝나면 이 섹션은 제거한다.

- `@dnd-kit/core` 설치 — 터치/마우스/펜을 `PointerSensor`로 통일 처리(네이티브 HTML5 DnD는 터치 미지원)
- `features/table-layout/types.ts`에 `PlacedItem` 타입 추가 (현재 `FacilityKind`/`LayoutSize`만 정의됨)
- `useTableLayoutPage` 훅 신설 — 배치 상태(`placedItems`), 드래그 종료/클릭배치/삭제 처리
- 내부시설 드래그(`useDraggable`) · 테이블 리스트 클릭 배치 · 캔버스 `useDroppable` 연결
- 배치된 테이블은 좌측 "테이블 리스트"에서 비활성화 처리, 캔버스에서 삭제 시 다시 활성화
- 캔버스 안 재배치 시 좌표 clamp 로직 + `ResizeObserver`로 캔버스 크기 변화(창 크기/회전) 대응
- 드래그 가능한 요소·캔버스에 `touch-action: none; user-select: none;` 적용
- `usePreventLeave(isDirty)` 재사용해 이탈 방지 (새로 구현하지 않음)
- 헤더의 리셋/초기화/저장 버튼에 동작 연결 (현재 `onClick` 없음)
- mock GET/POST 핸들러 추가(`mocks/handlers.ts`) + `queryKeys.ts`에 `tableLayout` 쿼리 키 추가, 배치 데이터 영속화
