# 의사결정 기록

> 기술 의사결정 기록(ADR). 왜 이런 선택을 했는지 근거를 남겨 팀원 합류 시 맥락을 전달한다.

프로젝트에서 내린 주요 기술 선택과 그 근거를 기록한다.
"왜 이렇게 했는가"를 남겨서 나중에 다시 보거나 팀원이 합류했을 때 맥락을 이해할 수 있게 한다.

---

## ADR-001 — API 코드 생성 도구: Orval 채택

**날짜**: 2026-03-31
**상태**: 채택

### 배경

API가 50개 이상이고 팀원 3명이(backend, frontend) 각자 API 함수, TanStack Query 훅, MSW 핸들러를 수동 작성하면 아래 문제가 생긴다.

- 경로 변경 시 여러 파일을 수동으로 고쳐야 함
- 백엔드 DTO가 바뀌면 MSW 핸들러도 손으로 맞춰야 함
- 사람마다 작성 스타일이 달라 컨벤션 불일치 발생

### 검토한 방식

**패턴 1 — openapi-fetch 직접 사용**
`src/generated/types/schema.d.ts`를 기반으로 httpClient, API 함수, queryKeys, 훅을 전부 수동 작성.
코드 흐름이 눈에 보이고 커스터마이징이 자유롭지만, API 50개 기준 수백 줄을 3명이 각자 작성하면 스타일 불일치와 누락 위험이 높다.

**패턴 2 — Orval 자동 생성 (채택)**
OpenAPI 명세를 기반으로 Orval이 API 함수, TanStack Query 훅, MSW 핸들러를 자동 생성.
설정 파일 하나로 50개 API를 일관성 있게 관리하고, DTO가 바뀌면 `npm run generate` 한 번으로 전체 동기화된다.

### 결정

Orval을 채택한다.

- API 50개 이상 — 패턴 1로 가면 수백 줄 수동 작성, 스타일 불일치 위험
- 팀원 3명 — 자동화가 컨벤션 역할을 대신하여 일관성 보장
- `src/generated/types/schema.d.ts` + `operationId` 이미 확인됨 — 도입 비용 절반 완료 상태
- MSW DTO 동기화 — `npm run generate` 한 번으로 동시 해결

---

## ADR-002 — Orval 입력 방식: 로컬 파일(`openapi.json`)

**날짜**: 2026-03-31
**상태**: 채택

### 배경

Orval이 OpenAPI 명세를 읽는 방식이 두 가지다.

| 방식 | 내용 |
|------|------|
| URL 직접 | `http://localhost:8080/v3/api-docs` |
| 로컬 파일 | `openapi.json` 저장 후 참조 |

### 결정

로컬 파일 방식(`openapi.json`)을 채택한다.

- 백엔드가 꺼져 있어도 `npm run generate`가 실행됨
- `openapi.json`을 git에 커밋해두면 팀원 전체가 동일한 명세 기준으로 작업
- 명세 변경 이력을 git으로 추적 가능

### 운영 방식

백엔드 API가 변경된 경우에만 아래 명령으로 `openapi.json`을 갱신한다.

```bash
npm run generate:schema   # openapi.json 갱신 (백엔드 켜야 함)
npm run generate          # openapi.json → 코드 생성 (백엔드 불필요)
```

---

## ADR-003 — Orval 설정: 통합 config, 앱별 분리 예정

**날짜**: 2026-03-31
**상태**: 채택

### 배경

프로젝트 앱 구조가 `apps/admin`, `apps/client`, `apps/consumer`로 분리되어 있다.
Orval 설정을 처음부터 앱별로 분리할지, 통합으로 시작할지 결정이 필요하다.

### 결정

현재는 `orval.config.ts` 하나로 통합 운영하고, 앱별 분리는 나중에 필요 시 진행한다.

**현재 단계에서 통합을 선택한 이유:**
- 현재 개발 중심이 `apps/admin`이고 `client`, `consumer`는 골격 수준
- 분리하면 config 파일이 여러 개가 되어 초기 진입 장벽이 높아짐
- 통합 상태에서도 생성 경로를 앱별로 지정하면 구조는 유지됨

**분리 기준 (향후):**
- `apps/client`, `apps/consumer` 개발이 본격 시작될 때
- 앱별로 다른 생성 규칙이 필요해질 때
- config 파일을 분리하고 `package.json` 스크립트도 앱별로 나눈다

### 향후 전환 가능 경로

현재 `src/generated/types/schema.d.ts` 기반 구조는 어떤 방향으로 전환해도 기반이 된다.

- **Hey API** — TanStack Query 플러그인 내장, queryKey 자동 생성
- **openapi-react-query** — openapi-fetch 기반 경량 래퍼, 훅 직접 제어 가능
