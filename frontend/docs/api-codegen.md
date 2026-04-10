# API 코드 생성 가이드

> OpenAPI 기반 코드 자동 생성 전체 흐름, 명령어, CI 검증 방식, mock/real 모드 전환을 다룬다.

본 프로젝트는 OpenAPI 명세를 기반으로 API 함수, TanStack Query 훅, MSW 핸들러를 자동 생성한다.
도구 선택 근거는 [decisions.md](./decisions.md)를 참고한다.

---

## 전체 흐름

```text
Spring Boot Swagger (/v3/api-docs)
         ↓ npm run generate:schema   (백엔드 켜야 함)
openapi.json                         ← OpenAPI 명세 원본 (git 커밋)
         ↓ npm run generate          (백엔드 불필요)
src/generated/types/schema.d.ts      ← DTO 타입 (openapi-typescript)
         ↓ Orval
┌─────────────────────────────────────────┐
│ src/generated/  (자동 생성 — 직접 수정 금지) │
│  types/              — DTO 타입          │
│  plant.ts / auth.ts  — API fetch 함수    │
│  plant.msw.ts        — MSW 핸들러        │
│  hooks/                                    │
│    usePlant.ts       — TanStack Query 훅  │
│    useAuth.ts                              │
└─────────────────────────────────────────┘
         ↓
LoginPage.tsx / MainPage.tsx
wrapper 훅만 호출 — 경로·타입·캐시 세부 구현을 직접 다루지 않음
```

---

## 명령어

| 명령어 | 용도 | 백엔드 필요 여부 |
|--------|------|-----------------|
| `npm run generate:schema` | `openapi.json` 갱신 | 필요 |
| `npm run generate` | `openapi.json` → 전체 코드 재생성 | 불필요 |

### CI에서 어떻게 검증하는가

- CI는 `npm run generate:schema`를 실행하지 않는다.
- 대신 저장소에 이미 커밋된 `openapi.json`을 기준으로 `npm run generate`만 다시 실행한다.
- 재생성 후 `src/generated/`에 diff가 생기면 codegen drift로 판단하고 실패시킨다.
- 실패 메시지는 "`npm run generate` 후 `frontend/src/generated`를 커밋하라"는 안내를 출력한다.

즉 CI의 역할은 **명세 최신화**가 아니라 **생성 누락 검증**이다.

**DTO 변경 대응 순서:**

```bash
# 1. 백엔드 기동 후 명세 갱신
npm run generate:schema

# 2. 코드 전체 재생성 (백엔드 불필요)
npm run generate

# 3. 생성 결과 커밋
git add openapi.json src/generated/
```

---

## 파일 구조

### 자동 생성 영역 — 직접 수정하지 않는다

```text
openapi.json                     ← OpenAPI 명세 원본
src/generated/
  types/                         ← DTO 타입 (openapi-typescript + Orval 생성)
  {도메인}.ts                    ← API fetch 함수
  {도메인}.msw.ts                ← MSW 핸들러
  hooks/
    use{도메인}.ts               ← TanStack Query 훅
```

### 수동 작성 영역

```text
orval.config.ts                  ← Orval 설정 파일
src/shared/lib/queryClient.ts    ← QueryClient 설정
src/mocks/browser.ts             ← MSW 브라우저 worker
src/mocks/handlers.ts            ← 생성된 핸들러 통합 등록
```

### 현재 운영 원칙

- generated API 함수/훅은 기반 계층으로 유지한다.
- 화면에서는 가능하면 wrapper 훅을 통해 사용한다.
- 인증 관련 요청은 generated handler 대신 커스텀 MSW 핸들러를 우선 사용한다.
- 현재 wrapper 적용 범위는 `auth/me`, `login`, `logout`, `dashboard/info`까지다.
- 특정 기능 화면 실구현이 확정되기 전에는 generated 훅을 억지로 wrapper로 늘리지 않는다.

---

## 개발 모드 전환

| 명령어 | 동작 |
|--------|------|
| `npm run dev:mock` | MSW 활성 — 백엔드 없이 화면 개발 |
| `npm run dev:real` | MSW 비활성 — 실제 백엔드 연동 |

### mock 모드 확인 방법

브라우저 콘솔에 아래 로그가 보이면 MSW가 활성 상태다.

```
[MSW] POST /api/auth/login (200 OK)
```

인증 관련 요청은 generated handler 대신 `src/test/handlers.js`의 커스텀 핸들러를 우선 사용한다.

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`

그 외 다수 API는 `src/generated/*.msw.ts`에서 생성된 핸들러를 `src/mocks/handlers.ts`가 묶어서 사용한다.

### real 모드 확인 방법

```bash
npm run dev:real
```

- 콘솔에 `[MSW]` 로그가 없으면 real 모드로 동작 중이다.
- 브라우저 Network 탭에서 `/api/auth/me`, `/api/auth/login` 요청이 `localhost:8080`으로 전달되는지 확인한다.
- 백엔드가 켜져 있어야 로그인, 데이터 조회가 정상 동작한다.

---

## 주의사항

- `src/generated/` 하위 파일은 직접 수정하지 않는다. 수정해도 다음 `generate` 실행 시 덮어씌워진다.
- CI는 `openapi.json`을 자동 갱신하지 않는다. 백엔드 API가 바뀌면 프론트가 `npm run generate:schema`로 명세를 갱신한 뒤 `npm run generate` 결과까지 함께 커밋해야 한다.
- `operationId`가 없는 API는 함수명이 지저분하게 생성된다. 백엔드에 `operationId` 명시를 요청한다.
- PR 리뷰 시 `src/generated/` 변경분은 명세 변경에 의한 것이므로 별도 커밋으로 분리하면 리뷰 노이즈를 줄일 수 있다.

---

## Orval 설정 분리 계획

현재는 `orval.config.ts` 하나로 통합 운영한다.
`apps/client`, `apps/consumer` 개발이 본격 시작되면 앱별로 분리한다.
자세한 근거는 [decisions.md — ADR-003](./decisions.md#adr-003--orval-설정-통합-config-앱별-분리-예정)을 참고한다.
