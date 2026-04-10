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
- [9. 자주 발생하는 문제](#9-자주-발생하는-문제)
- [10. 참고 문서](#10-참고-문서)

---

## 1. 문서 목적

본 문서는 `frontend` 프로젝트를 처음 전달받은 팀원이 개발 환경을 스스로 구성하고, 실행·점검·테스트까지 수행할 수 있도록 작성한 설정 가이드이다.

상세한 내용은 [`docs/`](./docs/) 하위 문서를 참고한다.

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

## 9. 자주 발생하는 문제

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

## 10. 참고 문서

| 문서 | 내용 |
|---|---|
| [`docs/architecture.md`](./docs/architecture.md) | 동작 구조, 폴더 구조, 라우트, 모달 계층 |
| [`docs/design-tokens.md`](./docs/design-tokens.md) | 디자인 토큰 시스템, 컬러·타이포그래피 참고표 |
| [`docs/components.md`](./docs/components.md) | 공용 컴포넌트 작성 규칙, FeedbackState |
| [`docs/operations.md`](./docs/operations.md) | 운영 원칙, 리팩토링 규칙, Filter 표준 |
| [`docs/libraries.md`](./docs/libraries.md) | 라이브러리 선정 이유, 테스트 도구 구성 |
| [`docs/config.md`](./docs/config.md) | 주요 설정 파일 설명, 인증 구조 |
| [`docs/api-codegen.md`](./docs/api-codegen.md) | API 코드 자동 생성 전체 가이드, 명령어, CI 검증 방식, 모드 전환 |
| [`docs/Tanstack-Query-Guide.md`](./docs/Tanstack-Query-Guide.md) | TanStack Query 학습 가이드 — 서버/UI 상태 분리, MSW 기초, useQuery·useMutation 단계별 실습 |
| [`docs/decisions.md`](./docs/decisions.md) | 기술 의사결정 기록 (ADR) |
