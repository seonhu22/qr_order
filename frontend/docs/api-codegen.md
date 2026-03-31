# API 코드 생성 가이드

본 프로젝트는 OpenAPI 명세를 기반으로 API 함수, TanStack Query 훅, MSW 핸들러를 자동 생성한다.
도구 선택 근거는 [decisions.md](./decisions.md)를 참고한다.

---

## 전체 흐름

```text
Spring Boot Swagger (/v3/api-docs)
         ↓ npm run generate:schema   (백엔드 켜야 함)
openapi.json                         ← OpenAPI 명세 원본 (git 커밋)
         ↓ npm run generate          (백엔드 불필요)
src/types/schema.d.ts                ← DTO 타입 (openapi-typescript)
         ↓ Orval
┌─────────────────────────────────────────┐
│ src/generated/  (자동 생성 — 직접 수정 금지) │
│  plant.ts / auth.ts   — API fetch 함수  │
│  plant.msw.ts         — MSW 핸들러      │
│  hooks/                                 │
│    usePlant.ts        — TanStack Query 훅│
│    useAuth.ts                           │
└─────────────────────────────────────────┘
         ↓
PlantPage.tsx
usePlantList() 훅만 호출 — 경로·타입·캐시 신경 쓸 필요 없음
```

---

## 명령어

| 명령어 | 용도 | 백엔드 필요 여부 |
|--------|------|-----------------|
| `npm run generate:schema` | `openapi.json` 갱신 | 필요 |
| `npm run generate` | `openapi.json` → 전체 코드 재생성 | 불필요 |

**DTO 변경 대응 순서:**

```bash
# 1. 백엔드 기동 후 명세 갱신
npm run generate:schema

# 2. 코드 전체 재생성 (백엔드 불필요)
npm run generate

# 3. 생성 결과 커밋
git add openapi.json src/types/schema.d.ts src/generated/
```

---

## 파일 구조

### 자동 생성 영역 — 직접 수정하지 않는다

```text
openapi.json                     ← OpenAPI 명세 원본
src/types/schema.d.ts            ← DTO 타입 (openapi-typescript 생성)
src/generated/
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

---

## 개발 모드 전환

| 명령어 | 동작 |
|--------|------|
| `npm run dev:mock` | MSW 활성 — 백엔드 없이 화면 개발 |
| `npm run dev:real` | MSW 비활성 — 실제 백엔드 연동 |

---

## 상태 분리 원칙

| 상태 종류 | 도구 | 예시 |
|-----------|------|------|
| 서버 데이터 조회 | TanStack Query | 사업장 목록, 사용자 정보, 주문 내역 |
| 전역 UI 상태 | Zustand | 모달 열림 여부, 사이드바 상태 |

서버 상태와 UI 상태를 섞으면 화면이 복잡해지고 유지보수성이 크게 떨어진다.

---

## 주의사항

- `src/generated/` 하위 파일은 직접 수정하지 않는다. 수정해도 다음 `generate` 실행 시 덮어씌워진다.
- `operationId`가 없는 API는 함수명이 지저분하게 생성된다. 백엔드에 `operationId` 명시를 요청한다.
- PR 리뷰 시 `src/generated/` 변경분은 명세 변경에 의한 것이므로 별도 커밋으로 분리하면 리뷰 노이즈를 줄일 수 있다.

---

## Orval 설정 분리 계획

현재는 `orval.config.ts` 하나로 통합 운영한다.
`apps/client`, `apps/consumer` 개발이 본격 시작되면 앱별로 분리한다.
자세한 근거는 [decisions.md — ADR-003](./decisions.md#adr-003--orval-설정-통합-config-앱별-분리-예정)을 참고한다.