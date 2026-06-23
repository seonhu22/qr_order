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

---

## ADR-004 — 클라이언트 로그인 페이지: 백엔드 협의 전 임시 구현

**날짜**: 2026-05-08
**상태**: 임시 (백엔드 협의 후 수정 예정)

### 배경

클라이언트 앱(`apps/client`) 로그인 페이지를 백엔드 API 설계 확정 전에 프론트엔드 단독으로 먼저 제작했다.
화면 구조와 UX 흐름을 선행 확인하기 위한 목적이며, 백엔드 연동 시 아래 항목들을 재검토해야 한다.

### 임시로 정한 사항

| 항목 | 현재 임시값 | 확정 필요 |
|---|---|---|
| 로그인 API 경로 | `POST /api/client/auth/login` | 실제 엔드포인트 확인 |
| 응답 구조 | `{ success, message, data }` | 백엔드 DTO 확인 |
| 인증 방식 | 세션 쿠키 (`credentials: 'include'`) 가정 | JWT 여부 등 확인 |
| 로그인 성공 후 이동 | `/client/main` | 실제 진입 경로 확인 |
| 비밀번호 찾기 | 버튼만 존재, 동작 없음 | 흐름 및 API 미정 |
| 계정 잠금·init_yn 정책 | 어드민과 동일 여부 미확인 | 백엔드 정책 확인 |

### 현재 구현 범위

- 아이디/비밀번호 입력 폼 (어드민과 동일한 카드 레이아웃)
- 아이디 저장 (`localStorage` 기반)
- 비밀번호 찾기 버튼 (미구현 자리 표시자)
- MSW mock: `client` / `password` 계정으로 로그인 테스트 가능

### 연동 시 체크리스트

- [ ] 실제 API 경로·DTO로 `clientLogin` 함수 교체
- [ ] 인증 상태 관리 방식 결정 (어드민 `AuthProvider` 공유 or 클라이언트 전용)
- [ ] 비밀번호 찾기 흐름 구현
- [ ] 계정 잠금·초기 비밀번호 변경 정책 적용 여부 확인
- [ ] `/client/main` 이동 경로 확정 및 라우트 보호 적용

---

## ADR-005 — 클라이언트 회원가입 페이지: 백엔드 협의 전 임시 구현

**날짜**: 2026-05-11
**상태**: 임시 (백엔드 협의 후 수정 예정)

### 배경

클라이언트 로그인 페이지(`/client/login`) 내 step 전환 방식으로 회원가입 흐름을 선행 구현했다.
제출 데이터 항목과 API 설계가 미정이므로, 현재는 UI 흐름과 화면 구조 확인 목적의 임시 구현이다.

### 화면 흐름

```
로그인 step
  → [회원가입] 버튼
  → signup-consent step  : 개인정보 수집·이용 동의
  → signup step          : 회원가입 폼 입력
  → signup-complete step : 완료 안내 + 로그인으로 이동
```

- 로그인 카드가 `640px(modal-lg)`으로 확장, `max-height: 85vh` + 내부 스크롤 처리
- 필드가 추가되어도 카드 높이가 고정되고 body 영역에서 스크롤 가능

### 현재 임시 입력 필드

| 필드 | 입력 타입 | 비고 |
|---|---|---|
| 아이디 | text | 중복 확인 API 미구현 |
| 비밀번호 | password | 규칙(길이·특수문자 등) 미정 |
| 비밀번호 확인 | password | 클라이언트 단순 일치 검사만 |
| 사업자 등록번호 | text | 형식 검증·실명 인증 API 미정 |
| 이메일 | email | 인증 메일 발송 여부 미정 |

추가 필드(매장명, 전화번호 등) 여부는 백엔드 협의 후 확정 예정.

### 임시로 정한 사항

| 항목 | 현재 임시값 | 확정 필요 |
|---|---|---|
| 회원가입 API | `POST /api/client/auth/signup` | 실제 엔드포인트 확인 |
| 요청 바디 | `{ userId, password, businessNo, email }` | 백엔드 DTO 확인 |
| 응답 구조 | `{ success, message }` | 백엔드 DTO 확인 |
| 개인정보 동의 전달 여부 | 프론트에서만 체크, 서버 미전달 | 동의 내역 저장 정책 확인 |
| 가입 완료 후 이동 | 로그인 step 복귀 | 자동 로그인 처리 여부 확인 |

### 연동 시 체크리스트

- [ ] 실제 API 경로·DTO로 `clientSignup` 함수 교체
- [ ] 필드 추가·제거 확정 후 폼 항목 반영
- [ ] 아이디 중복 확인 API 연동
- [ ] 사업자 등록번호 형식 검증 및 인증 API 연동 여부 확인
- [ ] 이메일 인증 발송 흐름 구현 여부 확인
- [ ] 개인정보 동의 내역 서버 전달 방식 확정
- [ ] 가입 완료 후 자동 로그인 처리 여부 확인

---

## ADR-006 — 클라이언트 비밀번호 찾기: 백엔드 협의 전 임시 구현

**날짜**: 2026-05-11
**상태**: 임시 (백엔드 협의 후 수정 예정)

### 배경

클라이언트 로그인 페이지 내 비밀번호 찾기 흐름을 백엔드 API 설계 확정 전에 프론트엔드 단독으로 먼저 구현했다.
인증 방식(이메일 코드, SMS, 임시 비밀번호 발급 등)과 API가 미정이므로 UI 흐름 확인 목적의 임시 구현이다.

### 화면 흐름

```
로그인 step → [비밀번호 찾기] 버튼
  → find-password step       : 아이디 + 이메일 입력 → 인증 코드 받기
  → find-password-verify step: 인증 코드 입력 → 확인
  → find-password-complete   : 완료 안내 (임시 비밀번호 이메일 발송 가정) + 로그인으로 이동
```

### 임시로 정한 사항

| 항목 | 현재 임시값 | 확정 필요 |
|---|---|---|
| 인증 코드 발송 API | `POST /api/client/auth/find-password` | 실제 엔드포인트 확인 |
| 인증 코드 확인 API | `POST /api/client/auth/find-password/verify` | 실제 엔드포인트 확인 |
| 요청 바디 (발송) | `{ userId, email }` | 백엔드 DTO 확인 |
| 요청 바디 (확인) | `{ userId, verifyCode }` | 백엔드 DTO 확인 |
| 완료 처리 | 임시 비밀번호 이메일 발송 가정 | 실제 정책 확인 (재설정 링크 vs 임시 비밀번호) |
| 인증 코드 유효 시간 | 미구현 | 유효 시간 표시 여부 확인 |

### 연동 시 체크리스트

- [ ] 실제 API 경로·DTO로 `findPassword`, `verifyFindPasswordCode` 함수 교체
- [ ] 완료 후 처리 방식 확정 (임시 비밀번호 발급 or 재설정 링크 이동)
- [ ] 인증 코드 유효 시간 표시 및 재발송 기능 구현 여부 확인
- [ ] 아이디 대신 이메일만으로 찾기 가능 여부 백엔드 정책 확인

---

## ADR-007 — 클라이언트 레이아웃(헤더·사이드바): 백엔드 협의 전 임시 구현

**날짜**: 2026-05-11
**상태**: 임시 (백엔드 메뉴 데이터 연동 후 수정 예정)

### 배경

클라이언트 앱 레이아웃(헤더·사이드바)을 백엔드 메뉴 데이터 설계 확정 전에 프론트엔드 단독으로 먼저 구현했다.
스타일과 구조는 어드민과 동일하게 맞추되, 메뉴 데이터·사용자 정보는 임시값으로 채웠다.

### 구조

어드민 레이아웃과 동일한 3단 구조를 따른다.

| 영역 | 컴포넌트 | 비고 |
|---|---|---|
| 사이드바 | `ClientSidebar` | `Sidebar` · `SidebarNav` · `SidebarUser` 공용 컴포넌트 재사용 |
| 헤더 | `ClientHeader` | 어드민 헤더와 동일한 CSS 패턴 |
| 레이아웃 상태 | `ClientLayout` (useState) | 2026-06-10 결정: `clientLayoutStore`로 전환 예정 |

### 임시로 정한 사항

| 항목 | 현재 임시값 | 확정 필요 |
|---|---|---|
| 헤더 섹션 탭 | "주문", "매장" | 실제 메뉴 구조 확정 후 교체 |
| 사이드바 메뉴 경로 | `/client/order/*`, `/client/store/*` | 실제 라우트 확정 후 교체 |
| 사용자 이름 | `홍길동` | 로그인 응답 user 데이터로 교체 |
| 사용자 역할 | `매장 관리자` | 실제 role 필드로 교체 |
| 로그아웃 동작 | `/client/login`으로 이동 | 클라이언트 auth 흐름 확정 후 교체 |

### 연동 시 체크리스트

- [ ] `clientMenus.ts` 임시 데이터를 백엔드 메뉴 API 응답으로 교체
- [ ] `SidebarUser`의 `userName` · `userRole`을 클라이언트 auth 상태에서 읽도록 교체
- [ ] 로그아웃 동작을 `useAuthLogoutMutation` 패턴으로 교체
- [x] `ClientLayout`의 로컬 state를 Zustand store로 전환 필요 여부 검토
- [x] `clientLayoutStore` 도입: 사이드바 열림, 활성 섹션 UI 상태만 관리
- [ ] 주문 데이터는 TanStack Query로 관리하고, Zustand에는 주문 화면 UI 상태만 둔다
- [x] 실제 메뉴 경로에 맞게 `ClientRoutes.tsx` child route 추가

상세 추적 문서: [Client Zustand Policy](./client-zustand-policy.md)

---

## ADR-008 — 신규 앱은 Admin 폴더 규칙을 미러링한다

**날짜**: 2026-06-10
**상태**: 채택

### 배경

`feature/initClientApp` 진행 중 Client 앱이 Admin과 다른 폴더 구조로 분기할 위험이 드러났다. `apps/client/`에 Admin에 없는 `data/` 폴더가 생겼고, feature 내부 분할(`api/`, `hooks/`, `utils/`, `mock/` 등)과 페이지 상태 훅(`use{Feature}PageState`) 패턴이 명시되지 않은 채 컴포넌트만 쌓이고 있었다.

명세화 없이 누적되면 작업자별 패턴이 갈라지고 코드 리뷰에서 매번 폴더 위치를 결정해야 한다. 향후 Consumer 등 추가 앱이 생길 때마다 같은 비용이 반복된다.

### 검토한 방식

**패턴 1 — 앱별 독자 구조**
각 앱이 자유로운 폴더 구조를 가진다. 도메인 특성에 맞게 최적화 가능. 단, 일관성이 깨져 학습 곡선과 리뷰 비용이 증가하고 `shared/` 승격 기준이 모호해진다.

**패턴 2 — Admin 규칙 미러링 (채택)**
Admin 골격(`pages / features / layout / hooks / stores / contexts / routes`)과 feature 분할 규칙을 그대로 따른다. 일관성·학습 비용·`shared/` 승격 판단이 단순해지고, 메뉴 카탈로그 API 같은 향후 패턴 도입 시 Admin과 동일한 전이 경로를 그대로 쓸 수 있다.

### 결정

Admin 규칙 미러링을 채택한다.

- 앱 레벨 디렉터리: `pages / features / layout / hooks / stores / contexts / routes` 동일
- feature 내부 분할: `components / hooks / api / utils / mock / types.ts / constants.ts` 중 필요한 것만
- UI shell feature(header/sidebar/brand/navigation)는 `components/` + `styles/`만으로 충분
- Admin에 없는 폴더(`data/` 등) 신설 금지 — 다른 앱과 공용이면 `shared/`로
- 사적 폴더(`_components`), 라우트 그룹 `(group)` 사용 금지
- 페이지 상태 훅은 `use{Feature}PageState.ts` 패턴, 반환 `{ data, status, actions, uiProps }`

세부 규칙은 프로젝트 루트 `CLAUDE.md` §5 "Client 앱 폴더 규칙" 참조.

### 영향

본 ADR 채택과 동시에 Client 앱에 적용했다.

- `apps/client/data/clientMenus.ts` → `shared/menu/clientNavigation.ts`로 이전
- `apps/client/hooks/`, `apps/client/contexts/` 빈 폴더 + `.gitkeep` 생성
- import 경로 5개 갱신 (`ClientLayout`, `ClientPageNavigation`, `ClientSidebar`, `ClientHeader`, `clientLayoutStore`)
- `CLAUDE.md` §5 추가
- Client 범위 vitest 4 파일 / 13 테스트 통과

향후 신규 앱(Consumer 등)을 추가할 때 첫 PR에 이 골격을 포함한다.

### 추가 — 기능 로직 패리티

> 추가일: 2026-06-15

폴더 구조 미러링뿐 아니라, 동일 도메인 feature의 로직·흐름·ViewModel·테스트 커버리지도 Admin과 Client(추후 Consumer)가 동일하게 유지한다(차이는 권한·메뉴 노출 범위로 한정). 상세 기준은 [Admin/Client 패리티](./operations/app-parity.md) 참고.

---

## ADR-009 — 이탈방지 가드: `useBlocker` 대신 커스텀 guarded navigate

**날짜**: 2026-06-15
**상태**: 채택

### 배경

편집형 페이지(AdminUser, CommonCode, RuleManagement, Notice, Coupon, PaymentManage, SystemMenu, Message)에서 저장하지 않은 변경(dirty) 상태로 메뉴 이동/새로고침/로그아웃을 하면 변경 내용이 사라진다. react-router의 `useBlocker`가 표준 해법이지만 data router(`createBrowserRouter` + `RouterProvider`) 전용이고, 본 프로젝트는 `<BrowserRouter>`(선언형)을 사용 중이다.

### 검토한 방식

**패턴 1 — data router로 전환 후 `useBlocker` 사용**
표준적이지만 라우터 정의 전체를 `createBrowserRouter` 구조로 옮겨야 해 변경 범위가 크고, 기존 `<Outlet>` 기반 레이아웃과 얽힌 부분이 많아 이번 범위에는 과도하다.

**패턴 2 — `beforeunload` + 커스텀 guarded navigate (채택)**
새로고침/탭 닫기는 `beforeunload`, 인앱 이동은 코드베이스 전체가 `<Link>` 없이 `navigate(...)` 호출만 쓴다는 점을 이용해 `navigate`를 감싸는 훅 + zustand 공용 store로 가로챈다. 라우터 구조 변경 없이 적용 가능하다.

### 결정

패턴 2를 채택한다. `preventLeaveStore` + `usePreventLeave` + `useGuardedNavigate` 3종 세트로 구성하고, dirty를 노출하는 8개 페이지 상태 훅에 `usePreventLeave(isDirty)` 1줄씩 추가하는 방식으로 통일한다.

### 알려진 제한사항

- 브라우저 뒤로/앞으로가기 버튼은 가드하지 않음 (history stack 조작 필요, fragile)
- `beforeunload` 확인창 문구는 브라우저 기본값 (커스터마이징 불가)
- 단일 dirty-source 전제: 동시에 두 개 이상의 편집 화면이 dirty를 등록하는 구조는 지원하지 않음 (현재 라우팅 구조상 발생하지 않음)

### 향후 전환 경로

data router로 전환할 일이 생기면(예: 다른 이유로 `useBlocker`가 필요해지는 경우) `useGuardedNavigate`의 인터페이스(`guardedNavigate`/`pendingLeaveAction` 등)는 유지한 채 내부 구현만 `useBlocker` 기반으로 교체 가능하도록 설계했다.

### 적용 방법

훅 사용법, 적용 대상 8개 페이지, `onNavigate`/`requestLeaveConfirm` 패턴은 [`operations.md`](./operations.md) §5-14 참고.

---

## ADR-010 — 옵션 관리: 백엔드에 없는 필드는 프론트 우선 구현, 저장 시 미전송

**날짜**: 2026-06-22
**상태**: 임시 (백엔드 필드 추가 후 연동 예정)

### 배경

옵션 관리(`MenuOptionManagementPage`) 화면 설계 중 백엔드 DTO/DB를 직접 확인한 결과, 요청된 컬럼 중 두 개가 아직 없었다.

- 옵션 그룹 "사용여부": `store_menu_option_group` 테이블에 `use_yn` 컬럼은 있으나, 조회/등록/수정 API(`MenuOptionGroupResponse/Request`, MyBatis 쿼리)에는 빠져 있다.
- 옵션 항목 "기본 선택" 체크박스: DB·API 어디에도 해당 컬럼이 없다.

### 검토한 방식

**패턴 1 — 백엔드도 같이 수정**: DB 컬럼(기본선택) 추가 + Java DTO/MyBatis/openapi 재생성까지 진행. 데이터가 끝까지 일관되지만 백엔드 변경이 함께 필요해 이번 프론트 작업 범위를 벗어난다.

**패턴 2 — 이번 작업에서 제외**: 컬럼 자체를 빼고 나머지 필드만 구현. 단순하지만 사용자가 원래 요청한 화면 구성을 그대로 만들 수 없다.

**패턴 3 — 프론트만 우선 구현 (채택)**: UI 컬럼/모달 필드는 만들되, 해당 값은 저장 시 백엔드로 전송하지 않는다.

### 결정

패턴 3을 채택한다.

- `MenuOptionGroupRow.values.useYn`, `MenuOptionDetailRow.values.defaultYn`은 프론트 전용 필드로 유지한다.
- `mapToMenuOptionGroupPayload` / `mapToMenuOptionDetailPayload`에서 두 필드를 제외하고 매핑한다.
- dirty 비교(`isSameMenuOptionGroupRow`)에서 `useYn`은 비교하지 않는다(저장 대상이 아니므로 변경으로 취급할 이유가 없음).
- 타입 정의에 `@property` JSDoc으로 "백엔드 API에 아직 노출되지 않은 프론트 전용 필드. 저장 시 전송하지 않는다"를 명시해, 추후 합류하는 개발자가 백엔드 코드를 보지 않고도 이유를 알 수 있게 한다.

### 연동 시 체크리스트

- [ ] `store_menu_option_group.use_yn`을 `MenuOptionGroupResponse`/`MenuOptionGroupRequest`/관련 MyBatis 쿼리(조회·등록·수정)에 노출
- [ ] 옵션 항목 "기본 선택" 컬럼을 `store_menu_option_detail`에 추가하고 동일하게 DTO/쿼리에 노출
- [ ] `npm run generate:schema` + `npm run generate`로 타입 재생성
- [ ] `mapToMenuOptionGroupPayload`/`mapToMenuOptionDetailPayload`에 두 필드 추가, dirty 비교 로직도 갱신
- [ ] 프론트 전용 필드라는 JSDoc 주석 제거

---

## ADR-011 — 주문 이력 조회: 백엔드 API 미정, 프론트 mock 우선 구현

**날짜**: 2026-06-23
**상태**: 임시 (백엔드 API 확정 후 연동 예정)

### 배경

`/client/order/history/list` 화면(주문번호·테이블 번호·주문 상태·결제 상태·주문일자 목록) 구현 중 기존에 생성된 `getOrderHistory`(`/api/client/order_manage/history/search`) API를 확인한 결과, 이 화면 용도와 맞지 않았다.

- `orderStatus`를 필수 단일값 파라미터로 받는다 — 목록 전체 조회가 아니라 특정 상태 1건의 상태 변경 히스토리 조회용으로 보인다.
- 응답(`OrderMasterHistoryItem`)에 화면에 필요한 주문번호·결제상태 필드가 없다.

### 검토한 방식

**패턴 1 — 기존 API를 변형해 사용**: `orderStatus`를 빈 값/임의값으로 호출하거나 주문번호를 `sysId`로 대체. 화면이 원래 요청한 데이터 구조를 만족시키지 못한다.

**패턴 2 — 프론트 mock 우선 구현 (채택)**: ADR-004/005/006/010과 동일한 선례. UI·검색·필터 로직은 모두 구현하되, 데이터는 mock 배열을 필터링해 제공한다.

### 결정

패턴 2를 채택한다.

- `apps/client/features/order-history/mock/orderHistoryMock.ts`의 정적 데이터를 `api/orderHistoryApi.ts`의 `queryFn`(`filterOrderHistoryMock`, 테스트 가능하도록 export)에서 날짜범위·키워드·주문상태로 필터링해 반환한다.
- 네트워크 호출이 없으므로 MSW 핸들러를 별도로 만들지 않았다.
- 검색폼의 상태 필터는 주문상태 1개만 둔다(결제상태 필터는 화면에서 제외 — 결제상태는 목록 컬럼에 일반 텍스트로만 노출).
- `OrderHistoryStatus`(`RECEIVED`/`COOKING`/`SERVED`/`CANCELLED`), `OrderHistoryPaymentStatus`(`PENDING`/`PAID`/`UNPAID`/`REFUNDED`) 코드값은 임시로 정한 것이며 백엔드 enum과 일치 여부 확인이 필요하다.

### 연동 시 체크리스트

- [ ] 실제 주문 이력 조회 API(주문번호/결제상태 포함) 백엔드와 확정
- [ ] `mock/orderHistoryMock.ts` 제거, `api/orderHistoryApi.ts`의 `queryFn`을 실제 생성 훅으로 교체
- [ ] `npm run generate:schema` + `npm run generate`로 타입 동기화
- [ ] `OrderHistoryStatus`/`OrderHistoryPaymentStatus` 코드값이 백엔드 enum과 일치하는지 확인 후 라벨 매핑 갱신
