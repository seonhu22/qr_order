# 주요 설정 파일 설명

> 주요 설정 파일(vite.config.js · tsconfig.json · ESLint · Prettier 등) 역할과 인증 구조를 다룬다.

## 목차

- [1. `vite.config.js`](#1-viteconfigjs)
- [2. `tsconfig.json`](#2-tsconfigjson)
- [3. `eslint.config.js`](#3-eslintconfigjs)
- [4. `.prettierrc.json`](#4-prettierrcjson)
- [5. `src/main.tsx`](#5-srcmaintsx)
- [6. `src/App.tsx`](#6-srcapptsx)
- [7. `src/shared/styles/*`](#7-srcsharedstyles)
- [8. `src/shared/components/*/index.ts`](#8-srcsharedcomponentsindexts)
- [9. `src/test/*`](#9-srctest)
- [10. `public/*`](#10-public)
- [11. 인증 구조](#11-인증-구조)

---

## 1. `vite.config.js`

- React 플러그인 활성화
- `@` 별칭을 `src` 루트에 연결
- 개발 서버 포트 `3000` 지정
- `/api` 요청을 `8080` 백엔드로 프록시
- Vitest 테스트 환경 설정
- 빌드 결과물 출력 위치 지정

---

## 2. `tsconfig.json`

- TypeScript 컴파일 기준 정의
- `@/* -> src/*` 경로 별칭 정의
- JSX를 React 기준으로 해석
- 현재 JS/JSX 코드도 점진적으로 수용
- 타입 검사만 수행하고 실제 파일 출력은 하지 않음

---

## 3. `eslint.config.js`

- 코드 품질 검사 규칙 정의
- React Hooks 규칙 검사
- React Fast Refresh 관련 규칙 검사
- TypeScript ESLint 규칙 적용
- Prettier와 충돌하는 포맷 규칙 제거

---

## 4. `.prettierrc.json`

- 세미콜론 사용
- 작은따옴표 사용
- trailing comma 유지
- 줄 길이 기준 설정

코드 포맷을 팀 기준으로 통일하기 위한 파일이다.

---

## 5. `src/main.tsx`

- React 앱 진입점
- `import.meta.env`를 기준으로 MSW 활성화 여부를 판단
- `@/shared/styles/global.css`를 먼저 로드하고 앱을 렌더링

---

## 6. `src/App.tsx`

- `BrowserRouter`, `QueryClientProvider`, `AuthProvider`를 앱 최상단에 연결
- 라우팅, 서버 상태 관리, 인증 컨텍스트의 시작점 역할
- `AuthProvider`는 `auth/me` Query 캐시를 기반으로 인증 상태를 계산한다

---

## 7. `src/shared/styles/*`

| 파일 | 역할 |
|---|---|
| `reset.css` | 브라우저 기본 스타일 초기화 |
| `fonts.css` | `public/static/fonts`의 Pretendard 폰트 선언 |
| `primitive-tokens.css` | 원시 디자인 토큰 |
| `semantic-tokens.css` | 의미 기반 토큰 |
| `global.css` | 위 파일들을 한 번에 로드하는 진입점 |

---

## 8. `src/shared/components/*/index.ts`

공용 컴포넌트 폴더의 외부 공개 API 진입점. 폴더 외부에서는 이 파일을 통해서만 import한다.

→ 상세 역할·export 패턴은 [`components.md` §4 타입 규칙](./components.md#4-타입-규칙) 참고

---

## 9. `src/test/*`

| 파일 | 역할 |
|---|---|
| `setup.js` | 테스트 시작 전 공통 초기화 |
| `server.js` | Node 테스트 환경에서 MSW 서버 설정 |
| `handlers.js` | 테스트용 API 응답 정의 |

---

## 10. `public/*`

| 파일 | 역할 |
|---|---|
| `mockServiceWorker.js` | 브라우저 MSW 동작에 필요한 worker 스크립트 |
| `static/fonts/*` | Pretendard 폰트 정적 파일 |

→ 상세 구조·사용 방식은 [`components.md` §1 폴더 구조](./components.md#1-폴더-구조) 참고

---

## 11. 인증 구조

로그인 흐름, 인증 상태 관리, 비밀번호 강제 변경 정책은 별도 문서로 관리한다.

→ [`docs/auth.md`](./auth.md)

---

## 12. 전체 문서 목록

| 문서 | 내용 |
|---|---|
| [`architecture.md`](./architecture.md) | 폴더 구조, 레이어 역할, 네이밍 규칙 |
| [`operations.md`](./operations.md) | 개발 원칙, 페이지 구조 표준, CRUD 화면 리팩토링 규칙 |
| [`async-patterns.md`](./async-patterns.md) | Mutation 결과 안내 모달, generated API 직접 호출, 단일 엔티티 폼 화면 패턴 |
| [`api-codegen.md`](./api-codegen.md) | OpenAPI 코드 생성, MSW 핸들러 오버라이드, mock 파일 양식 |
| [`components.md`](./components.md) | 공용 컴포넌트 사용 가이드 |
| [`design-tokens.md`](./design-tokens.md) | 디자인 토큰 목록 및 사용 규칙 |
| [`auth.md`](./auth.md) | 로그인 흐름, 인증 상태 관리, 비밀번호 정책 |
| [`query-cache-policy.md`](./query-cache-policy.md) | TanStack Query 캐시 정책 |
| [`client-zustand-policy.md`](./client-zustand-policy.md) | 클라이언트 앱 Zustand 전역 상태 관리 정책 |
| [`combo-api-policy.md`](./combo-api-policy.md) | 검색용·저장용 콤보 API 분리 기준 |
| [`decisions.md`](./decisions.md) | 주요 설계 결정 기록 (ADR) |
| [`libraries.md`](./libraries.md) | 주요 라이브러리 목록 및 선택 근거 |
| [`troubleshooting.md`](./troubleshooting.md) | 자주 발생하는 문제와 해결 방법 |
| [`admin-navigation.md`](./admin-navigation.md) | 어드민 메뉴·내비게이션 구조 |
| [`file-attachment-policy.md`](./file-attachment-policy.md) | 파일 첨부 정책 |
