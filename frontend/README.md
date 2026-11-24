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

## 1. 문서 목적

Admin/Client/Consumer 앱의 로컬 실행과 검증 순서를 안내한다. 기능별 문서는 [문서 지도](./docs/README.md)에서 찾는다.

## 2. 팀원 작업 시작 순서

1. 아래 [설치 및 실행](#6-설치-및-실행)에서 의존성을 설치하고 개발 서버를 띄운다.
2. 브라우저에서 기본 화면을 열고 담당 화면을 확인한다.
3. API 계약을 변경했으면 [API 코드 생성](./docs/api-codegen.md)에 따라 생성 파일을 갱신한다.

## 3. 프로젝트 개요

본 프론트엔드는 QR Order 프로젝트의 사용자 화면 및 관리자 화면 개발을 위한 작업 공간이다.

| 항목 | 내용 |
|---|---|
| 개발 서버 | Vite |
| UI 라이브러리 | React 19 |
| 상태 관리 | TanStack Query + Zustand |
| 언어 | TypeScript (JS/JSX 점진적 전환 중) |
| 스타일 | CSS 커스텀 프로퍼티 (2단계 토큰 구조) |
| 테스트 | Vitest + Testing Library + MSW / Playwright |

- 프론트엔드 개발 서버: `http://localhost:3000`
- 백엔드(Spring Boot): `http://localhost:8080`
- 프록시: `/api → http://localhost:8080`

## 4. 권장 개발 사이클

전체 검증을 한 번에 실행하고 실패 요약만 확인하려면 [검증 실행 안내](./docs/testing/verification.md)에 따라 `npm run verify`를 사용한다. 아래 개별 명령은 작업 중 필요한 검사만 실행할 때 사용한다.

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

## 5. 사전 준비 사항

### 필수 설치 도구

- `Node.js` 24 (`package.json` engines 기준)
- `npm`
- `Java 17` 이상 (백엔드 실행용)

Spring Boot 로그에 `Tomcat started on port 8080 (http) with context path '/'`와 `Started QROrderApplication`이 보이면 정상이다. 포트 확인: `netstat -ano | findstr :8080` (PowerShell).

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

## 7. 사용 가능한 스크립트

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | Vite 개발 서버 실행 (포트 3000, MSW 기본 활성) |
| `npm run dev:mock` | MSW 활성화 개발 서버 |
| `npm run dev:real` | MSW 비활성화 개발 서버 (실제 백엔드 연동) |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| [`npm run verify`](./docs/testing/verification.md) | 프론트 전체 검사와 시간별 실패 요약 저장 |
| `npm test` | Vitest 1회 실행 |
| [`npm run test:log`](./docs/testing/test-result-log.md) | 간결한 Vitest 결과를 터미널과 시간별 로그 파일에 기록 |
| [`npm run test:log:verbose`](./docs/testing/test-result-log.md#상세-로그-실행) | 개별 테스트 이름을 포함한 상세 로그 기록 |
| `npm run test:watch` | 테스트 감시 모드 |
| `npm run test:coverage` | 커버리지 보고서 생성 (`coverage/` 디렉터리) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run generate:schema` | 백엔드에서 OpenAPI 명세 저장 (백엔드 필요) |
| `npm run generate` | `openapi.json` 기반 코드 재생성 |

Spring Boot Swagger → `openapi.json` → `src/generated/` 순으로 생성한다. [코드 생성 안내](./docs/api-codegen.md)

## 8. MSW 모드 전환

| 모드 | 명령 | 설명 |
|---|---|---|
| MSW 활성 (기본) | `npm run dev` | 브라우저에서 MSW가 요청을 가로챔 |
| MSW 활성 | `npm run dev:mock` | 위와 동일, 명시적 |
| 실제 백엔드 | `npm run dev:real` | MSW 비활성, Vite proxy → 8080 |
| 프리뷰 | `npm run build && npm run preview` | 프로덕션 빌드 확인 |

[모의 API 브라우저 회귀](./docs/testing/browser-e2e.md) / [실제 서버 자동 QA](./docs/testing/real-server-qa.md). 11월 24일 통과 기록은 로컬 PostgreSQL 사본과 로컬 서버 범위다. [QA 결과와 남은 확인](./docs/todo.md#로컬-사본-db-qa-결과와-남은-확인)

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

- 인증 mock은 `src/test/handlers.js`의 커스텀 핸들러를 사용한다.

### 공용 규칙을 먼저 확인한다

- 테이블/카드 UI는 [`docs/components/TableCard.md`](./docs/components/TableCard.md)를 우선 따른다.
- 상태 처리, 401 리다이렉트, 403/404/500 에러 페이지 기준은 [`docs/components/StatusHandling.md`](./docs/components/StatusHandling.md)를 따른다.
- 검색폼(필터카드)을 새로 만들 때는 `/dev/filter` 가이드와 [`docs/operations/page-patterns.md`](./docs/operations/page-patterns.md)의 날짜range·기간 프리셋·`SelectInput` 규약을 먼저 확인한다.
- 개발 전용 가이드 라우트는 인증 없이 등록되어 있으므로, 운영 화면 코드와 섞이지 않도록 주의한다.
- 직원호출 개별 확인은 실제 API에 저장된다. 공지의 모두 읽음은 직원호출의 미확인 상태에 영향을 주지 않는다. [로컬 운영 재검증](../docs/qa/2026-11-24-local-real-qa-ops.md#재검증-2026-11-24)

## 10. 자주 발생하는 문제

- API 실패 시 백엔드 8080 포트, `vite.config.js`의 proxy와 브라우저 Network 탭을 확인한다. [문제 해결](./docs/troubleshooting.md)
- 테스트 실패 시 `src/test/setup.js`와 MSW 경로를 확인한다. 출력이 잘리면 [테스트 로그](./docs/testing/test-result-log.md)를 파일로 저장한다.

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
| [`docs/auth.md`](./docs/auth.md) | 인증 구조, 쿼리 키 분리, initPwdRequired 비밀번호 강제 변경 흐름 |
| [`docs/api-codegen.md`](./docs/api-codegen.md) | API 코드 자동 생성 전체 가이드, 명령어, CI 검증 방식, 모드 전환 |
| [`docs/admin-navigation.md`](./docs/admin-navigation.md) | `sys_menu` 기반 header/sidebar/breadcrumb/access-log 규칙 |
| [`docs/menu-access-log.md`](./docs/menu-access-log.md) | 관리자 메뉴 접근 로그 정책, 신규 메뉴 추가 시 체크리스트 |
| [`docs/troubleshooting.md`](./docs/troubleshooting.md) | 자주 나온 오류 메시지 해석과 우선 확인 포인트 |
| [`docs/testing.md`](./docs/testing.md) | 테스트 실행과 결과 확인 문서의 입구 |
| [`docs/decisions.md`](./docs/decisions.md) | 기술 의사결정 기록 (ADR) |

[프론트 TODO와 QA 체크리스트](./docs/todo.md) / [프로젝트 마감 TODO](../docs/plans/2026-11-10-project-closeout-backlog.md)

학습용 [Tanstack-Query-Guide](./docs/training/Tanstack-Query-Guide.md)는 사람 학습용이며 구현 기준이나 AI 코드 생성 지침으로 사용하지 않는다.

## 12. 문서 작성 원칙

`docs/` 문서를 추가하거나 수정할 때 아래 원칙을 지킨다.

- 문서 위치와 주제별 부모 문서는 [문서 지도](./docs/README.md)에서 확인한다.
- 화면의 표기/모달/동작은 `docs/page/` 아래 화면 문서에 기록한다.
- 같은 계약을 여러 문서에 반복하는 대신 원본으로 연결한다.
- 새 패턴이나 정책은 코드에 반영된 뒤 문서에 기록한다.
- CSS 예시는 토큰명을 사용하고 코드 예시는 필요한 경우에만 포함한다.
