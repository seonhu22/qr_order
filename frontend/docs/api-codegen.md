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

## MSW 핸들러 오버라이드

generated MSW 핸들러(`*.msw.ts`)는 Faker 기반 랜덤 데이터를 반환한다.
특정 기능 화면 개발 시 **고정 목업 데이터**가 필요하면 오버라이드 핸들러를 추가한다.

### 오버라이드 방법

```text
1. features/<feature>/mock/<feature>Mock.ts  ← 고정 목업 데이터 작성
2. mocks/handlers.ts                          ← 오버라이드 핸들러 등록
```

`handlers.ts`에서 오버라이드 핸들러는 반드시 `getSettingsControllerMock()` 앞에 배치해야 한다.
MSW는 배열에서 첫 번째 매칭 핸들러를 사용하므로 순서가 우선순위를 결정한다.

```ts
// mocks/handlers.ts
const myOverrideHandler = http.get('*/api/system/settings/my-feature/search', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
  const filtered = keyword
    ? MY_MOCK_ROWS.filter((row) => row.code?.toLowerCase().includes(keyword))
    : MY_MOCK_ROWS;
  return HttpResponse.json(filtered);
});

export const handlers = [
  ...authHandlers,
  myOverrideHandler,          // ← generated 핸들러보다 앞에
  ...getSettingsControllerMock(),
  // ...
];
```

- 목업 파일은 `features/<feature>/mock/` 에 두고 `import` 해서 사용한다.
- 검색어 필터링이 있는 API라면 `searchKeyword` 파라미터도 함께 처리한다.

### 목업 파일 작성 양식

목업 데이터는 반드시 **generated 응답 타입**으로 typed한다. 화면 모델(StoreInfo 등)이 아닌 API 응답 타입을 사용해야 MSW 핸들러가 실제 서버 응답과 동일한 형태를 반환한다.

```ts
// features/<feature>/mock/<feature>Mock.ts

import type { MyFeatureResponse } from '@/generated/types/myFeatureResponse';

// MSW 핸들러용 — API 응답 형식으로 typed
export const MY_FEATURE_MOCK_ROWS: MyFeatureResponse[] = [
  {
    sysId: 'row-001',
    name: '샘플 이름',
    // ... API 응답 필드
  },
];
```

- 배열 엔드포인트는 `Response[]`, 단일 엔드포인트는 `Response` 타입을 사용한다.
- 화면 전용 초기값이 별도로 필요하면 화면 모델 타입으로 추가 export 가능하지만, **MSW 핸들러에 주입하는 상수는 반드시 generated 타입 기준**이다.
- 파일 내 export 네이밍: `MY_FEATURE_MOCK_ROWS` (리스트), `MY_FEATURE_MOCK` (단일)

**handlers.ts 주입 방식:**

```ts
// mocks/handlers.ts

import { MY_FEATURE_MOCK_ROWS } from '../apps/.../features/my-feature/mock/myFeatureMock';
import { getGetMyFeatureMockHandler } from '../generated/my-controller/my-controller.msw';

// generated 핸들러 팩토리에 고정 데이터 주입
const myFeatureOverrideHandler = getGetMyFeatureMockHandler(MY_FEATURE_MOCK_ROWS);

// 또는 검색·필터링 로직이 필요한 경우 직접 작성
const myFeatureOverrideHandler = http.get('*/api/.../search', ({ request }) => {
  const keyword = new URL(request.url).searchParams.get('searchKeyword')?.toLowerCase() ?? '';
  const filtered = keyword
    ? MY_FEATURE_MOCK_ROWS.filter((row) => row.name?.toLowerCase().includes(keyword))
    : MY_FEATURE_MOCK_ROWS;
  return HttpResponse.json(filtered);
});
```

단순 고정 데이터면 `getGetMyFeatureMockHandler(rows)` 형태로 주입하고, 검색·필터·조건 분기가 필요하면 직접 `http.get` 핸들러를 작성한다.

### 저장(POST) 결과가 화면에 반영되게 만들기

generated 저장 mutation 핸들러(`getSaveXxxMockHandler()`)는 성공/실패를 랜덤(Faker)으로 응답할 뿐, 목업 배열을 실제로 바꾸지 않는다. 그래서 행추가 후 저장하면 `invalidateQueries`로 재조회가 일어나도 새 행이 보이지 않는다.

행추가/수정/삭제가 실제로 목록에 반영되도록 테스트하려면, 저장 POST 핸들러를 직접 작성해서 `newItems`/`updateItems`/`delItems`를 목업 배열에 in-place로 반영한다.

```ts
// mocks/handlers.ts
const myFeatureSaveOverrideHandler = http.post(
  '*/api/.../my-feature/save',
  async ({ request }) => {
    const body = (await request.json()) as MyFeatureRequest;

    body.newItems?.forEach((item) => {
      MY_FEATURE_MOCK_ROWS.push({ ...item, sysId: `my-feature-${Date.now()}-${MY_FEATURE_MOCK_ROWS.length}` });
    });
    body.updateItems?.forEach((item) => {
      const target = MY_FEATURE_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    body.delItems?.forEach((item) => {
      const index = MY_FEATURE_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) MY_FEATURE_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);
```

- `newItems`는 보통 `sysId`가 없는 상태로 오므로 mock에서 직접 생성해 부여한다.
- generated 저장 핸들러를 이 방식으로 대체했다면 `getSaveXxxMockHandler` import/등록을 `handlers.ts`에서 제거한다(같은 경로에 두 핸들러를 동시에 두지 않는다 — MSW는 첫 매칭만 쓰므로 우리 핸들러가 위에 있으면 동작은 하지만 죽은 import가 남는다).
- 로딩 스피너(`isSaving`) 동작까지 확인하려면 핸들러 안에 `await delay(1000)`(msw의 `delay`)을 추가했다가 확인 후 제거한다. 평소엔 즉시 응답하는 게 개발 흐름상 더 편하므로 delay는 기본적으로 넣지 않는다.

---

## 주의사항

- `src/generated/` 하위 파일은 직접 수정하지 않는다. 수정해도 다음 `generate` 실행 시 덮어씌워진다.
- CI는 `openapi.json`을 자동 갱신하지 않는다. 백엔드 API가 바뀌면 프론트가 `npm run generate:schema`로 명세를 갱신한 뒤 `npm run generate` 결과까지 함께 커밋해야 한다.
- `operationId`가 없는 API는 함수명이 지저분하게 생성된다. 백엔드에 `operationId` 명시를 요청한다.
- PR 리뷰 시 `src/generated/` 변경분은 명세 변경에 의한 것이므로 별도 커밋으로 분리하면 리뷰 노이즈를 줄일 수 있다.
- **mutation 핸들러는 `handlers.ts`에 개별 등록해야 한다.** `getXxxControllerMock()` 같은 일괄 등록 함수가 없는 컨트롤러의 경우, generated `.msw.ts`에 핸들러 함수가 있더라도 `handlers.ts` import와 배열 등록을 모두 직접 추가하지 않으면 MSW가 가로채지 않는다. 누락 시 요청이 실제 백엔드로 fall-through → 401 → "로그인 인증이 만료되었습니다." 리다이렉트 발생. 신규 API 추가 후 mock 모드에서 반드시 확인할 것.

---

## Orval 설정 분리 계획

현재는 `orval.config.ts` 하나로 통합 운영한다.
`apps/client`, `apps/consumer` 개발이 본격 시작되면 앱별로 분리한다.
자세한 근거는 [decisions.md — ADR-003](./decisions.md#adr-003--orval-설정-통합-config-앱별-분리-예정)을 참고한다.
