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

| 방식      | 내용                                |
| --------- | ----------------------------------- |
| URL 직접  | `http://localhost:8080/v3/api-docs` |
| 로컬 파일 | `openapi.json` 저장 후 참조         |

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

| 항목                   | 현재 임시값                               | 확정 필요            |
| ---------------------- | ----------------------------------------- | -------------------- |
| 로그인 API 경로        | `POST /api/client/auth/login`             | 실제 엔드포인트 확인 |
| 응답 구조              | `{ success, message, data }`              | 백엔드 DTO 확인      |
| 인증 방식              | 세션 쿠키 (`credentials: 'include'`) 가정 | JWT 여부 등 확인     |
| 로그인 성공 후 이동    | `/client/main`                            | 실제 진입 경로 확인  |
| 비밀번호 찾기          | 버튼만 존재, 동작 없음                    | 흐름 및 API 미정     |
| 계정 잠금·init_yn 정책 | 어드민과 동일 여부 미확인                 | 백엔드 정책 확인     |

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

| 필드            | 입력 타입 | 비고                         |
| --------------- | --------- | ---------------------------- |
| 아이디          | text      | 중복 확인 API 미구현         |
| 비밀번호        | password  | 규칙(길이·특수문자 등) 미정  |
| 비밀번호 확인   | password  | 클라이언트 단순 일치 검사만  |
| 사업자 등록번호 | text      | 형식 검증·실명 인증 API 미정 |
| 이메일          | email     | 인증 메일 발송 여부 미정     |

추가 필드(매장명, 전화번호 등) 여부는 백엔드 협의 후 확정 예정.

### 임시로 정한 사항

| 항목                    | 현재 임시값                               | 확정 필요                  |
| ----------------------- | ----------------------------------------- | -------------------------- |
| 회원가입 API            | `POST /api/client/auth/signup`            | 실제 엔드포인트 확인       |
| 요청 바디               | `{ userId, password, businessNo, email }` | 백엔드 DTO 확인            |
| 응답 구조               | `{ success, message }`                    | 백엔드 DTO 확인            |
| 개인정보 동의 전달 여부 | 프론트에서만 체크, 서버 미전달            | 동의 내역 저장 정책 확인   |
| 가입 완료 후 이동       | 로그인 step 복귀                          | 자동 로그인 처리 여부 확인 |

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

| 항목                | 현재 임시값                                  | 확정 필요                                     |
| ------------------- | -------------------------------------------- | --------------------------------------------- |
| 인증 코드 발송 API  | `POST /api/client/auth/find-password`        | 실제 엔드포인트 확인                          |
| 인증 코드 확인 API  | `POST /api/client/auth/find-password/verify` | 실제 엔드포인트 확인                          |
| 요청 바디 (발송)    | `{ userId, email }`                          | 백엔드 DTO 확인                               |
| 요청 바디 (확인)    | `{ userId, verifyCode }`                     | 백엔드 DTO 확인                               |
| 완료 처리           | 임시 비밀번호 이메일 발송 가정               | 실제 정책 확인 (재설정 링크 vs 임시 비밀번호) |
| 인증 코드 유효 시간 | 미구현                                       | 유효 시간 표시 여부 확인                      |

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

| 영역          | 컴포넌트                  | 비고                                                          |
| ------------- | ------------------------- | ------------------------------------------------------------- |
| 사이드바      | `ClientSidebar`           | `Sidebar` · `SidebarNav` · `SidebarUser` 공용 컴포넌트 재사용 |
| 헤더          | `ClientHeader`            | 어드민 헤더와 동일한 CSS 패턴                                 |
| 레이아웃 상태 | `ClientLayout` (useState) | 2026-06-10 결정: `clientLayoutStore`로 전환 예정              |

### 임시로 정한 사항

| 항목               | 현재 임시값                          | 확정 필요                         |
| ------------------ | ------------------------------------ | --------------------------------- |
| 헤더 섹션 탭       | "주문", "매장"                       | 실제 메뉴 구조 확정 후 교체       |
| 사이드바 메뉴 경로 | `/client/order/*`, `/client/store/*` | 실제 라우트 확정 후 교체          |
| 사용자 이름        | `홍길동`                             | 로그인 응답 user 데이터로 교체    |
| 사용자 역할        | `매장 관리자`                        | 실제 role 필드로 교체             |
| 로그아웃 동작      | `/client/login`으로 이동             | 클라이언트 auth 흐름 확정 후 교체 |

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

---

## ADR-012 — 결제 목록 조회: 백엔드 API는 실재하나 일부 계약이 불명확, 임시 가정으로 진행

**날짜**: 2026-06-23
**상태**: 임시 (백엔드 협의 후 수정 예정)

### 배경

`/client/payment/status/list` 화면은 `order-history`와 달리 실제 백엔드 API(`getPaymentInfoMaster`, `getPaymentInfoDetail` — `payment-manage-controller.ts`)가 존재하고 화면 필드와도 잘 맞는다. 다만 OpenAPI 명세에 enum이나 관계 필드가 노출되지 않아 아래 세 가지는 프론트에서 임시로 가정하고 진행했다.

1. **결제상태 코드값**: `GetPaymentInfoMasterParams.paymentStatus`와 응답의 `orderStatus`(필드명은 orderStatus이지만 실제로는 결제상태) 모두 `string`만 노출돼 있어, 화면 요구사항(결제완료/미결제/식사중)에 맞춰 `PAID`/`UNPAID`/`DINING`을 임시로 정했다.
2. **"전체" 필터 시 빈 문자열 전송**: `paymentStatus`가 필수 파라미터라 "전체" 선택 시 빈 문자열(`''`)을 보낸다. 백엔드가 빈 값을 "전체 조회"로 처리하는지는 미확인.
3. **상세 응답의 배열 의미**: `getPaymentInfoDetail`은 `PaymentInfoDetailResponse[]`(배열)를 반환하지만 화면은 단일 레코드 폼이라 첫 번째 요소만 사용한다(`mapToPaymentStatusDetail`). 배열인 이유(여러 취소 이력 등)는 불명확.
4. **결제완료 전용 필드**: 결제수단(`paymentType`)과 취소사유/취소상세사유(`cancelReason`/`cancelDescription`)는 결제완료(PAID) 건에만 의미가 있다고 가정해, 미결제·식사중 건은 값이 있어도 화면에서 항상 `'-'`로 표시한다(`formatPaymentType`/`formatCancelField`). 백엔드가 실제로 이 필드들을 PAID 건에만 채우는지는 미확인.

### 결정

위 세 가지를 임시 가정으로 두고 화면을 완성한다. mock은 `mock/paymentStatusMock.ts` + `src/mocks/handlers.ts`의 오버라이드 핸들러로 큐레이션해, orval이 자동 생성한 faker 기반 무작위 응답 대신 의미 있는 결제상태 값으로 개발 환경에서 화면을 확인할 수 있게 한다.

### 연동 시 체크리스트

- [ ] 결제상태 enum 실제 코드값을 백엔드와 확정하고 `PaymentStatusCode`/라벨 매핑 갱신
- [ ] "전체" 필터 시 빈 문자열 처리 여부를 백엔드와 확인(처리 안 하면 별도 "전체 조회" 엔드포인트/파라미터 필요)
- [ ] 상세 응답이 배열인 이유 확인 — 여러 건이 의미 있다면 화면에 다중 표시로 변경
- [ ] `mock/paymentStatusMock.ts` + `src/mocks/handlers.ts` 오버라이드 핸들러는 실제 enum 확정 후에도 개발용으로 유지할지, 제거할지 결정
- [ ] 결제수단/취소사유가 결제완료 건에만 채워지는지 백엔드와 확인 — 아니라면 `formatPaymentType`/`formatCancelField`의 "-" 강제 표시 로직 재검토
- [ ] `items` 필드 실제 포맷 확정(text vs JSON 배열). 확정 후 `parsePaymentOrderItems`의 fallback 분기 제거 여부 결정

### 추가 — `items` 필드 포맷 이중화 대응

> 추가일: 2026-07-01

응답 `items` 필드가 (a) 단일 텍스트(줄바꿈 구분) 또는 (b) JSON 배열(메뉴·옵션·수량·가격 구조) 양쪽으로 관찰됨. 백엔드 계약이 확정되지 않은 상태에서 프론트가 양쪽을 모두 처리한다.

- 파서: `features/payment-status/utils/parsePaymentOrderItems.ts`가 우선 `JSON.parse`로 배열 시도, 실패 시 텍스트 라인 fallback으로 판별 유니온 `ParsedPaymentOrderItems`(`kind: 'structured' | 'text'`) 반환
- 렌더:
  - `kind: 'structured'` → 신규 `PaymentOrderItemsList` 컴포넌트가 메뉴/옵션/수량/합계 표시
  - `kind: 'text'` → 기존 줄 단위 표시 유지 (하위 호환)
- 타입: `PaymentOrderItem`, `PaymentOrderOption`, `ParsedPaymentOrderItems`를 `features/payment-status/types.ts`에 추가
- mock: `mock/paymentStatusMock.ts`에 JSON 배열 케이스 반영해 구조화 렌더 경로가 개발 환경에서 확인 가능하도록 함

포맷 확정 시 fallback 분기와 판별 유니온을 제거하고 단일 경로로 축소한다.

---

## ADR-013 — 정산 조회: 백엔드 API는 실재하나 부호·날짜 포맷 가정으로 진행

**날짜**: 2026-06-23
**상태**: 임시 (백엔드 협의 후 수정 예정)

### 배경

`/client/payment/calculation/list` 화면은 Figma(node 977:462)와 실제 백엔드 API(`getSettlement`, `payment-manage-controller.ts`)가 필드 단위로 정확히 일치한다. 다만 다음 두 가지는 응답 스키마만으로 확정할 수 없어 임시로 가정했다.

1. **`cancelPrice`/`discountPice`(오타 그대로) 부호**: 백엔드가 양수 금액으로 내려준다고 가정하고, 화면(통계 카드·안내문구)에서 `-` 부호를 붙여 표시한다. 음수로 내려온다면 이중 부호가 생긴다.
2. **`DailySale.groupDate` 포맷**: 날짜만(`YYYY-MM-DD`)인지 날짜+시간인지 명세에 없다. 화면 요구사항(`YYYY-MM-DD HH:MM`)에 맞춰 `mapToSettlementRow`의 `formatSettlementDate`가 시간 정보가 있으면 그대로 쓰고, 없으면 `00:00`을 붙여 항상 같은 포맷으로 표시한다.
3. **`DailySale`에 할인 필드 없음**: 일별 행에는 할인액이 없어 `dayNetPrice`가 상위 `netPrice`(할인 차감 포함)와 다른 기준(할인 미차감)일 수 있다. 화면 테이블의 "순 매출" 컬럼은 `dayNetPrice`를 그대로 쓰므로, 상위 카드의 "순 매출"과 테이블 합계가 정확히 일치하지 않을 수 있다.

### 결정

위 가정으로 화면을 완성한다. mock(`mock/settlementMock.ts`)은 일별 합계가 상위 집계와 실제로 맞물리도록 `buildSettlementMockResponse`로 계산해서 구성하고, `src/mocks/handlers.ts`의 오버라이드 핸들러가 날짜 필터링 후에도 합계가 깨지지 않도록 동일 함수로 재계산한다.

### 연동 시 체크리스트

- [ ] `cancelPrice`/`discountPice`의 실제 부호 컨벤션을 백엔드와 확인
- [ ] `groupDate`가 날짜만인지 날짜+시간인지 확인 후 `formatSettlementDate` 단순화
- [ ] 일별 할인액 추적 필요 여부 확인 — 필요하면 `DailySale`에 필드 추가 요청
- [ ] `mock/settlementMock.ts` + `src/mocks/handlers.ts` 오버라이드 핸들러를 실제 검증 후 유지/제거 결정

---

## ADR-014 — 주문 상태 관리(칸반 보드): 생성된 API가 echo-back 구조라 mock 우선 구현

**날짜**: 2026-06-26
**상태**: 임시 (백엔드 API 확정 후 연동 예정)

### 배경

`/client/order/status/management`(접수/조리중/서빙완료/취소 칸반 보드) 구현 중 `generated/order-manage-controller`에 취소·결제완료·미결제 처리 API가 이미 존재함을 확인했다. 다만 전부 주문 1건을 `header`/`body`/`footer`로 통째로 echo-back 받는 요청/응답 구조라, 이 화면이 보드에 쓰는 가벼운 행 데이터(`OrderBoardRow`)만으로는 바로 연동할 수 없었다.

### 검토한 방식

**패턴 1 — 생성 API에 맞춰 화면 데이터 모델을 `header`/`body`/`footer` 구조로 다시 설계**: 보드 카드가 매번 주문 상세 구조 전체를 들고 있어야 해서 카드/컬럼 렌더링이 불필요하게 무거워진다.

**패턴 2 — 프론트 mock 우선 구현 (채택)**: ADR-004/005/006/010/011/012/013과 동일한 선례. 칸반 보드·모달 흐름(취소/결제/주문수정) UI는 전부 완성하고, 데이터는 `mock/orderStatusBoardMock.ts` 정적 배열을 로컬 state로 관리한다.

### 결정

패턴 2를 채택한다.

- `api/orderStatusBoardApi.ts`의 `useOrderStatusBoardQuery`는 `fetchOrderStatusBoardMock`(정적 mock을 그대로 resolve)을 `queryFn`으로 쓴다.
- 상태 변경(조리시작/서빙완료/이전/취소/결제완료/미결제/주문수정)은 React Query 캐시가 아니라 `useOrderStatusBoardPage`의 로컬 state에서 처리한다. "초기화" 버튼을 누르면 mock 조회 결과로 되돌린다.
- 메뉴 카탈로그(`mock/menuCatalogMock.ts`)도 같은 이유로 이 페이지 전용 mock을 새로 만들었다(다른 feature의 메뉴 mock과 테마가 달라 혼용하지 않음).
- 취소사유(`ORDER_CANCEL_REASON_OPTIONS`)·미결제사유(`ORDER_UNPAID_REASON_OPTIONS`) 콤보 옵션은 백엔드에 확정된 선택지 API가 없어 `constants.ts`에 임의로 정의했다.
- 상세 화면 동작·생성 API와의 필드 대응 관계는 [`docs/page/order-status-management.md`](./page/order-status-management.md#mock--실제-api-전환-가이드)에 모아뒀다.

### 연동 시 체크리스트

- [ ] `getPaymentComplete`의 `sysId`가 주문 1건 단위인지 테이블 결제 세션 단위인지 백엔드와 확인 (`docs/page/order-status-management.md` "확인이 필요한 것" 참고)
- [ ] `paymentComplete`/`cancelOrder`가 요구하는 `header`/`body`/`footer`를 보드 조회 API가 함께 내려주는지, 별도 상세 조회가 필요한지 확인
- [ ] 메뉴 줄 단위 취소, 새 주문(메뉴 추가) 등록에 대응하는 API 확정 — 현재 candidate 없음
- [ ] 취소/미결제 사유 코드가 백엔드 공통코드로 존재하면 `constants.ts`의 임의 옵션을 교체
- [ ] `mock/orderStatusBoardMock.ts`, `mock/menuCatalogMock.ts` 제거, `api/orderStatusBoardApi.ts`의 `queryFn`을 실제 생성 훅으로 교체

## ADR-015 — 테이블 배치 관리: dnd-kit 도입, 실제 `table_gui` API 재사용, 내부시설은 비영속

**날짜**: 2026-06-29
**상태**: 적용 완료. ⚠️ "내부시설은 비영속" 결정은 [ADR-017](#adr-017--테이블-배치-관리-내부시설-영속화object_type-mock-우선-구현)로 대체됨 — 주문 화면 재사용은 여전히 후속 작업

### 배경

`/client/store/table/layout` 화면에 마우스/터치 드래그·클릭 배치 이벤트를 연결하는 작업이었다. 시작 시점에는 README "진행 중 작업" 메모에 "mock GET/POST 핸들러 추가" 항목이 있었지만, 실제로는 백엔드에 `table_gui` 검색/저장 API(`TableGuiService`, `table_info.x_coordinate`/`y_coordinate`/`height`/`width` 컬럼)와 그에 대응하는 orval 생성 훅(`useGetTableGui`/`useSaveTableGui`)·MSW mock이 이미 존재하는 상태였다.

### 검토한 방식

**드래그 라이브러리 — `@dnd-kit/core`(채택) vs 직접 Pointer Events 구현**: 네이티브 HTML5 Drag & Drop은 터치를 지원하지 않아 제외했다. 직접 구현은 마우스/터치/스크롤 컨테이너 간 좌표 보정을 전부 손으로 처리해야 해서, `PointerSensor` + `useDraggable`/`useDroppable`/`DragOverlay`를 그대로 쓰는 `@dnd-kit/core`를 선택했다. 다만 내부시설의 자유 리사이즈는 dnd-kit이 지원하지 않아 커스텀 Pointer Events(`setPointerCapture`)로 별도 구현했다.

**좌표 저장 방식 — 캔버스 기준 절대 px(채택) vs 캔버스 비율(%)**: `table_gui`가 정수 px 컬럼으로 좌표를 받기 때문에, 비율로 저장했다가 저장 시점에 px로 환산하는 추가 단계 없이 1:1로 맞추는 절대 px를 택했다. 캔버스 리사이즈 시 `ResizeObserver`로 기존 배치를 다시 클램프해 화면 밖으로 나가지 않게 한다.

**영속화 범위 — 테이블만 `table_gui`로 실제 저장(채택) vs 시설까지 mock으로 영속화**: `table_gui`의 update SQL이 `table_info.sys_id` 매칭이라, 테이블이 아닌 시설(카운터/문/주방 등)은 대응하는 행이 없어 저장할 수 없다. 시설까지 영속화하려면 백엔드 스키마 변경(시설용 행 또는 별도 테이블)이 필요해 이번 단계 범위에서 제외하고, 시설은 프론트 상태로만 유지하기로 했다(새로고침 시 사라짐, 의도된 동작).

### 결정

위 세 가지 모두 "(채택)" 표시한 방식으로 적용했다.

- `features/table-layout/api/tableLayoutApi.ts`의 `useTableGuiQuery`/`useSaveTableGuiMutation`가 생성된 `useGetTableGui`/`useSaveTableGui`를 그대로 감싼다. `buildTableGuiRequest`가 draft/base 비교로 `newItems`/`updateItems`/`delItems`를 만든다.
- `TableListCard`는 `table_info/search`(전체 테이블) 대신 `table_gui/search`(useYn='Y' + QR 등록된 테이블만) 결과를 그대로 쓴다 — 페이지 안내문("활성+QR 등록해야 목록에 표시됩니다")과 일치시키기 위함이다.
- MSW mock은 자동 생성된 faker 응답 대신 `src/mocks/handlers.ts`의 `tableGuiOverrideHandler`/`tableGuiSaveOverrideHandler` + `mock/tableLayoutMock.ts`의 고정 데이터로 교체했다(다른 feature의 override 패턴과 동일).
- 상세 동작은 [`docs/page/table-layout-management.md`](./page/table-layout-management.md)에 모아뒀다.

### 향후 작업

- [ ] 주문 상태 관리(또는 별도 화면)에서 같은 `table_gui` 좌표를 읽기 전용으로 그려 테이블 클릭 시 주문이력/결제상태 이벤트를 여는 플로어플랜 뷰 추가 — 데이터 조회/필터링/클릭 매칭 키(`tableNum`)·주의사항은 [`docs/page/table-layout-management.md`](./page/table-layout-management.md) "플로어플랜 재사용 시 데이터 처리 가이드" 참고
- [x] 내부시설 영속화 — [ADR-017](#adr-017--테이블-배치-관리-내부시설-영속화object_type-mock-우선-구현) 참고(mock 우선 구현, 실제 백엔드 스키마는 별도 진행)
- [ ] `tableType` 필드 활용처가 정해지면 `PlacedTableItem`에 반영

---

## ADR-016 — 태블릿 반응형 기준: 뷰포트 대신 메인 컨테이너(Client 레이아웃) 기준

**날짜**: 2026-06-30
**상태**: 채택 (Client 전 화면 적용 완료)

### 배경

태블릿 대응이 필요한 화면은 `apps/client`뿐이다(`apps/admin`은 데스크톱 전용). Client 레이아웃은 사이드바를 가진 3단 구조(ADR-007)이고 사이드바는 열고 닫을 수 있다 — 열려 있으면 콘텐츠 영역이 사이드바 폭만큼 줄어든다.

주문 상태 관리 화면(`docs/page/order-status-management.md` "태블릿 반응형" 항목)에 처음 태블릿 대응을 넣을 때 `@media (max-width: 1200px)` 뷰포트 기준으로 작업했다. 뷰포트 기준 미디어쿼리는 사이드바 상태를 알 수 없어, 사이드바를 열어둔 채 쓰는 사용자는 브레이크포인트보다 훨씬 넓은 창에서도 콘텐츠가 좁아 보이는 구간이 생긴다 — 반대로 사이드바를 닫고 보는 사용자 기준으로 값을 낮추면, 사이드바를 연 사용자에게는 전환이 너무 늦게 일어난다. 뷰포트 폭과 실제 콘텐츠 폭이 사이드바 상태에 따라 어긋나는 게 근본 원인이다.

### 검토한 방식

**패턴 1 — 뷰포트 `@media` 유지, 사이드바 폭만큼 여유를 더해 보정**: 추가 구조 변경이 없어 간단하지만, 사이드바 폭이 바뀌거나 화면마다 보정값을 따로 추정해야 해서 매직넘버 유지보수 비용이 계속 든다.

**패턴 2 — 메인 컨테이너 기준 컨테이너 쿼리(`container-type: inline-size`) 채택**: Client 레이아웃 셸(사이드바+콘텐츠를 감싸는 메인 컨테이너)에 컨테이너 컨텍스트를 한 번 잡아두면, 그 안의 화면들은 실제 콘텐츠 폭 기준으로 반응형이 걸려 사이드바 열림/닫힘과 무관하게 항상 같은 기준으로 동작한다. Admin은 반응형이 필요 없어 새 패턴이 Admin까지 퍼지지 않는다.

### 결정

패턴 2를 채택한다. Client 레이아웃 메인 컨테이너에 컨테이너 컨텍스트를 두고, 태블릿 반응형이 필요한 화면은 뷰포트 `@media` 대신 컨테이너 쿼리(`@container`)로 작성한다.

- 기준 브레이크포인트는 기존 뷰포트 구현과 동일하게 1200px을 유지한다. 컨테이너 쿼리로 바뀌면서 사이드바 보정 목적은 사라졌지만, 작은 노트북 창까지 같이 여유 있게 대응하려는 의도로 1200px을 그대로 쓰기로 했다(일반 태블릿 디바이스 단독 기준은 1024px).
- 신규로 태블릿 대응이 필요한 Client 화면도 같은 `client-main` 컨테이너 기준으로 작성하되, 값은 화면별로 실측해 정한다.

### 적용 내용

- [x] `client-layout__content`(사이드바 옆 헤더+메인을 감싸는 영역, `ClientLayout.css`)에 `container-type: inline-size; container-name: client-main;` 적용 — 사이드바 자체가 아니라 사이드바에 밀려 실제로 좁아지는 영역을 기준으로 잡았다. `client-layout__main` 자신에게 걸면 컨테이너 쿼리가 "조상"에서만 컨테이너를 찾는 규칙 때문에 자기 자신의 padding 등은 쿼리 대상이 안 돼서, 한 단계 위인 `client-layout__content`로 옮겼다(폭은 동일).
- [x] 주문 상태 관리 화면의 `@media (max-width: 1200px)` 2곳(`OrderStatusCard.css`, `OrderStatusBoard.css`)을 `@container client-main (max-width: 1200px)`로 전환 — 기준 폭은 그대로 두고 뷰포트 대신 컨테이너 폭을 보게만 바꿨다.
- [x] `client-layout__main`도 1200px 이하에서 `gap: var(--spacing-8)` → `var(--spacing-4)`, 좌우 패딩 `var(--spacing-page-x)`(24px) → `var(--spacing-6)`으로 줄였다(위아래 패딩은 유지).
- [x] Client의 모든 페이지(`client-user-page`, `store-table-management-page`, `qr-code-management-page`, `menu-management-page`, `menu-option-page`, `order-history-page`, `order-status-management-page`, `payment-status-page`, `notice-list-page`, `inquiry-management-page`, `table-layout-page`, `settlement-page`) 최상위 wrapper와 좌우 분할 레이아웃 안쪽 래퍼(`__layout`, `__detail-stack`)에 동일하게 1200px 이하 `gap: var(--spacing-4)`를 적용했다.
- [x] 컨테이너 쿼리 작성 규칙(브레이크포인트 값, 적용 대상)을 [`docs/operations/page-patterns.md`](./operations/page-patterns.md#태블릿-반응형-client-전용)에 정리했다.
- [x] `table-layout-page`에 화면 전용 반응형(부제목 숨김, 헤더 패딩·제목 축소, 사이드바 카드 제목 정렬 보정)을 추가했다 — 상세는 [`docs/page/table-layout-management.md`](./page/table-layout-management.md#태블릿-반응형) 참고.

### 향후 작업

- [ ] Client의 새 화면에 태블릿 대응이 필요해지면 같은 `client-main` 컨테이너 + `docs/operations/page-patterns.md` 규칙을 따라 작성
- [x] 테이블 배치 관리(`table-layout-page`)의 캔버스 좌표-반응형 상충 — 2026-06-30 고정 크기 캔버스(1280×800) + 내부 스크롤로 해결. [`docs/page/table-layout-management.md`](./page/table-layout-management.md#좌표-모델) 참고

---

## ADR-017 — 테이블 배치 관리: 내부시설 영속화(object_type), mock 우선 구현

**날짜**: 2026-07-02
**상태**: mock 우선 구현 완료 (실제 백엔드 스키마는 별도 진행 예정)

### 배경

ADR-015에서는 `table_gui`의 update SQL이 `table_info.sys_id` 매칭이라 내부시설(카운터/문/주방 등)은 대응하는 행이 없어 저장할 수 없다고 판단해, 내부시설을 프론트 상태로만 유지하기로 했다(새로고침하면 사라짐). 이후 "되돌리기를 누르면 내부시설이 사라지는 게 이상하다"는 피드백이 나왔고, 백엔드가 `table_info`(또는 대응 테이블)에 `object_type` 컬럼을 추가해 한 저장소에서 테이블/내부시설/기타를 구분하기로 방향을 잡았다(백엔드 작업은 별도 진행, 프론트는 그 계약을 미리 가정하고 mock으로 먼저 구현).

### 검토한 방식

**내부시설 저장소 — localStorage(1차 시도) vs 서버 API(object_type, 채택)**: 처음에는 브라우저 `localStorage`에 내부시설 배치만 저장하는 방식으로 구현했다(사용자가 "일단 mock 위주로 진행" 요청 전, 백엔드 결정이 나오기 전 임시 방편). 이후 백엔드가 `object_type` 컬럼을 실제로 추가하기로 결정하면서 이 방식은 되돌리고, 테이블과 같은 `table_gui` 저장/조회 흐름에 내부시설도 함께 태워 보내는 방식으로 교체했다 — 브라우저 로컬 저장은 기기/브라우저 간 공유가 안 되는 근본적 한계가 있었다.

**object_type 값 정리 — 01/02/03**: `01`=테이블(기존과 동일), `02`=내부시설(고정 8종 카탈로그를 클릭 배치한 것), `03`=기타(유저가 "커스텀 시설 추가" 모달로 이름을 직접 입력해 만든 것). 처음에는 내부시설 전부(고정 8종 포함)를 `03`으로 보냈다가, "02는 내부시설, 03은 유저가 추가한 기타"라는 정정을 받아 8종 카탈로그는 `02`로, 커스텀 추가 버튼으로 만든 것만 `03`으로 나누어 보내도록 수정했다.

**내부시설 종류 매칭 — tableType(1차) vs tableName/common_nm(채택)**: 처음에는 생성된 `TableGuiItem.tableType` 필드에 프론트 내부 kind 값(`'counter'` 등 영문 식별자)을 그대로 실어 보냈다. 이후 "실제로는 공통코드 이름(`common_nm`)을 보고 매칭해야 하고, `table_gui` 응답에서 그 값은 `tableName` 필드로 온다"는 정정을 받아, `object_type==='02'`인 행은 `tableName`(한글 라벨 텍스트, 예: "카운터")을 8종 라벨과 매칭해 종류/아이콘을 역으로 찾는 방식으로 바꿨다(`FACILITY_KIND_BY_LABEL`, `tableLayoutApi.ts`). `tableType`은 저장 시 계속 같이 보내지만(하위 호환·감사 목적), 매칭의 기준(source of truth)은 `tableName`이다.

### 결정

- 아직 생성된 API 타입(`TableGuiItem`/`TableGuiResponse`, `src/generated/types/`)에는 `objectType` 필드가 없다 — `tableLayoutApi.ts`에 로컬 확장 타입(`TableGuiObjectType = '01'|'02'|'03'`, `TableGuiItemWire`/`TableGuiResponseWire`)을 두고 요청/응답을 이 타입으로 캐스팅해서 다룬다. 실제 백엔드 스키마가 확정되고 `openapi.json`이 재생성되면 이 임시 타입은 걷어낸다.
- 테이블·내부시설(고정+커스텀)을 **하나의 저장 요청**으로 함께 보낸다 — 별도의 "내부시설 저장" 액션은 없다. `buildTableGuiRequest`(`tableLayoutApi.ts`)가 `PlacedTableItem[]`과 `PlacedNonTableItem[]`(고정 8종 + 커스텀)을 함께 받아 `newItems`/`updateItems`/`delItems`를 만든다. sysId 없는 내부시설(캔버스에 새로 배치된 것)은 그대로 `newItems`에 담아 보내고, 저장 성공 후 재조회(`queryKeys.tableLayout.lists` invalidate)로 서버가 발급한 sysId를 받아온다 — 테이블이 이미 쓰던 것과 같은 흐름이다.
- 커스텀 시설(`object_type='03'`)은 자유 텍스트라 종류 매칭이 필요 없다 — 유저가 입력한 이름을 그대로 `tableName`에 실어 보내고 받는다(`PlacedCustomFacilityItem.label`).
- `isDirty`/되돌리기/전체 비우기 판정도 테이블과 내부시설을 합쳐서 본다(`useTableLayoutPage.ts`) — ADR-015 시점에는 "내부시설은 저장 대상이 아니다"로 dirty 판정에서 제외했으나, 이제는 같은 저장 흐름을 타므로 함께 판정한다.
- MSW mock(`src/mocks/handlers.ts`의 `tableGuiSaveOverrideHandler`)은 `sysId`가 없는 항목이 들어오면 mock이 `sys_id`를 생성해서 새 행으로 추가하도록 확장했다(기존에는 매칭 실패 시 조용히 무시했다) — 실제 백엔드의 INSERT 동작을 흉내낸 것이다.

### 향후 작업

- [ ] 백엔드에 실제 `object_type` 컬럼과 저장 API 반영 — 현재 프론트 가정(필드명 `objectType`, 값 `'01'|'02'|'03'`, 내부시설 종류는 `tableName`으로 매칭)과 실제 스키마가 다르면 `tableLayoutApi.ts`의 로컬 wire 타입/매핑 함수만 조정하면 되도록 그 파일에 격리해뒀다.
- [ ] 내부시설 카탈로그(현재 `FACILITY_CATALOG`, 프론트 고정 8종) 자체를 공통코드 API(`useSearchCommon`/`useSearchCommonDetail`, `commonNm`)에서 받아오는 방식으로 바꿀지는 미정 — 현재는 카탈로그는 프론트 고정이고, "매칭"만 텍스트 기준으로 한다.
- [ ] ADR-015의 "내부시설은 비영속" 결정은 이 ADR로 대체됐다.

---

## ADR-018 — QR 코드 생성: `qrcode` 라이브러리 채택

**날짜**: 2026-06-30
**상태**: 채택

### 배경

`/client/store/table/qr` 페이지의 출력 기능에서 백엔드 `qr_code.url` 필드(ULID 문자열)를 풀 URL로 조립한 뒤 QR 코드 이미지로 렌더링해 인쇄해야 한다.
백엔드는 QR 이미지/dataURL을 제공하지 않고 ULID만 저장하므로(`QRCodeService.java:65-69`), 프론트가 QR 비트맵 생성을 전담한다.
출력은 숨김 `<iframe>` + `window.print()`로 진행하므로 QR 출력 형식은 iframe srcdoc HTML에 임베드 가능한 PNG dataURL이 단순하다.

### 검토한 방식

| 후보                                | 형태                                      | 출력                   | 평가                                                                                            |
| ----------------------------------- | ----------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| **qrcode** (채택)                   | pure JS 함수 API (`QRCode.toDataURL`)     | DataURL / Canvas / SVG | iframe 컨텍스트에서 함수 직접 호출 가능. PNG dataURL을 `<img src="...">`로 임베드 — 인쇄 친화적 |
| qrcode.react / react-qr-code        | React 컴포넌트 (`<QRCode value=... />`)   | SVG                    | iframe 외부에 별도 React 트리 마운트가 필요. 다중 QR 렌더링/dataURL 추출이 우회적               |
| qr-code-styling                     | 클래스 API + 디자인 옵션(로고/그라데이션) | Canvas/SVG             | 디자인 커스터마이징 풍부하나 본 작업 요구(테이블당 단일 QR + 번호) 초과                         |
| 외부 QR API (api.qrserver.com 등)   | 원격 호출                                 | 이미지 URL             | 의존성 0이지만 네트워크 필수. 매장 인터넷 불안정 시 인쇄 실패. 외부 서비스 신뢰·프라이버시 우려 |
| 직접 구현 (Reed-Solomon + 매트릭스) | 수동 알고리즘                             | 자체 캔버스            | 학습 가치는 있으나 검증 비용·테스트 부담 과다. 실무 도입 가치 낮음                              |

### 결정

`qrcode` v1.5.4 (MIT, soldair/node-qrcode)를 채택한다.

- **API 형태가 본 작업에 정합**: `QRCode.toDataURL(targetUrl, { width, margin })` 한 줄로 PNG dataURL 생성. iframe srcdoc 내부 `<img>`에 그대로 임베드
- **오프라인 동작**: 매장 환경에서 인터넷 불안정 시에도 인쇄 보장
- **React 컴포넌트 의존 없음**: 본 출력은 React 트리 밖(`document.createElement('iframe')`)에서 일어남. JSX 기반 라이브러리는 트리 마운트·dataURL 추출 단계가 추가됨
- **에러 정정 + 마스킹 표준 구현**: ISO/IEC 18004 호환. 카메라 인식률 검증된 라이브러리
- **TypeScript 타입 제공**: `@types/qrcode` 보조 타입 사용 가능
- **번들 영향 적음**: 클라이언트 진입(`apps/client`)에서만 사용. 코드 스플리팅 영향권 안에서만 추가됨

### 알려진 제한사항

- 라이브러리 자체에 `pngjs`, `yargs`, `dijkstrajs` 등 Node 전용 트랜지티브 의존성이 있으나, 브라우저 빌드(`package.json`의 `browser` 필드)가 `lib/browser.js`로 우회되어 클라이언트 번들엔 포함되지 않는다
- 디자인(로고 삽입·색상)이 추후 필요해지면 `qr-code-styling`으로 교체 검토. 본 ADR의 채택 사유 중 "단순성"이 무너지는 시점이 교체 트리거

### 사용 위치

- `frontend/src/apps/client/features/qr-code/utils/qrCodePrint.ts` — `generateQrDataUrl` 래퍼
- 그 외 직접 사용 금지. QR 생성이 다른 feature에도 필요해지면 본 유틸을 `shared/`로 승격

---

## ADR-019 — 주문 상태 시각: SQL `::time` 대신 원본 `LocalDateTime` 유지

**날짜**: 2026-08-06
**상태**: 채택

### 배경

주문 상태 조회 QA 중 PostgreSQL `timestamp` 컬럼을 Java `LocalTime` DTO로 직접 매핑해 500 오류가 발생했다. 과거에는 카드에 `HH:mm`만 표시하려고 `orderDatetime`을 `LocalDateTime`에서 `LocalTime`으로 변경했지만, SQL은 `og.insert_datetime` 원본 `timestamp`를 그대로 반환하고 있었다.

### 검토한 방식

- **SQL `::time` 변환**: 기존 `LocalTime` 계약과 `HH:mm` 표시를 유지하고 JDBC 오류를 작게 수정할 수 있다. 그러나 날짜가 사라져 전날과 당일 주문을 구분할 수 없고, 당일 취소 필터·자정 전후 정렬·향후 경과시간 계산에서 프론트가 오늘 날짜를 임의로 복원해야 한다.
- **원본 `LocalDateTime` 응답(채택)**: DB의 날짜와 시간을 손실 없이 전달하고 프론트가 화면에서 `HH:mm`만 표시한다. 응답 정보는 늘지만 표시 책임과 데이터 책임이 분리된다.

### 결정

- `StatusItem.Header.orderDatetime`, `StatusItem.Header.cancelDatetime`, `StatusCancelResponse.cancelDatetime`은 `LocalDateTime`을 사용한다.
- JSON은 프로젝트 규칙인 `yyyy-MM-dd HH:mm:ss` 공백 형식으로 직렬화한다.
- 프론트 mapper는 공백을 `T`로 정규화해 내부 ISO 형태로 보존하고, 카드에서만 `HH:mm`으로 표시한다.
- OpenAPI를 갱신하고 Orval regenerate 후 생성 타입에 날짜·시간 계약이 반영됐는지 확인한다.

### 결과

- PostgreSQL `timestamp`와 Java DTO 타입 불일치를 제거한다.
- 날짜 손실 없이 당일 취소 필터와 시간 정렬 기준을 유지한다.
- API 원본과 UI 표시 형식을 분리해 다른 화면에서도 같은 시각을 재사용할 수 있다.

---

## ADR-020 — Consumer 앱 골격: 뷰포트 반응형과 QR 세션 가드

**날짜**: 2026-08-20
**상태**: 채택

### 배경

Consumer(QR 소비자 주문) 앱의 첫 골격 PR에서 Admin/Client에 없던 세 가지 상황이 새로 생겼다: 사이드바가 없는 전체화면 모바일 셸의 반응형 기준, 로그인이 아닌 QR 세션 유효성을 판단해야 하는 보호 라우트, 메뉴상세·장바구니·주문내역·직원호출이 공유하는 바텀시트 UI. 세 항목 모두 기존 문서의 결정을 그대로 재사용할 수 없어 하나의 ADR로 묶어 기록한다.

### 결정

**뷰포트 `@media`가 1차, Viewport Segments API는 progressive enhancement (ADR-016과 대비)**

[ADR-016](#adr-016--태블릿-반응형-기준-뷰포트-대신-메인-컨테이너client-레이아웃-기준)은 Client가 열고 닫을 수 있는 사이드바를 가져 뷰포트 폭과 실제 콘텐츠 폭이 어긋나기 때문에 컨테이너 쿼리를 채택했다. Consumer는 사이드바가 없는 전체화면 앱이라 콘텐츠 폭이 항상 뷰포트 폭과 같다 — ADR-016의 전제가 성립하지 않는다. 따라서 Consumer는 표준 뷰포트 `@media`를 1차 기준으로 삼는다.

디자인/퍼블리싱 단계에서는 "폴더블인지"를 먼저 판별하려 하지 않는다. 대신 넓은 뷰포트에서도 중요한 UI가 화면 중앙에 애매하게 걸리지 않는 레이아웃을 뷰포트 폭 기준으로 먼저 만들고, 그 위에 실제 힌지 정보를 얻을 수 있는 기기에서만 `@media (horizontal-viewport-segments: 2)`로 세밀하게 보정한다 — 미지원 브라우저는 이 블록 자체가 매치되지 않아 1차 레이아웃 그대로 동작하므로 폴백이 따로 필요 없다.

브레이크포인트:

| 구간 | 기준 | 적용 |
|---|---|---|
| ~480px 미만 | `ConsumerHeader` | 아이콘+액션 한 줄, 매장 정보가 다음 줄로 wrap (`flex-wrap` + `order`) |
| 480px 이상 | `ConsumerHeader` | 매장 정보가 아이콘 옆으로 붙어 한 줄로 합쳐짐 |
| ~653px | 폴드 커버 화면 상한 | 별도 규칙 없음 — 480px 규칙 안에서 자연스럽게 처리됨 |
| ~717px 이상 | 폴드 펼침·태블릿·웹(데스크톱) | `ConsumerLayout` 셸의 `max-width` 제한을 없애 뷰포트를 꽉 채운다. `order-shell` 메뉴 목록은 `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`로 열 수를 고정하지 않고 카드 폭에 맞춰 자동으로 늘린다(717px≈2열, 1024px≈3열, 1440px≈4열…) |
| `horizontal-viewport-segments: 2` 매치 시 | 실제 듀얼세그먼트 지원 기기 | `--fold-gap`(힌지 폭, `env(viewport-segment-*)`)을 그리드의 `column-gap`에 반영해 카드가 힌지 위에 걸치지 않게 함 |

717px 이상은 "웹은 화면을 꽉 채운다"는 요구사항에 맞춰 셸 폭 제한을 아예 두지 않는다. 태블릿과 데스크톱을 가르는 별도 브레이크포인트가 없어도 auto-fit 그리드가 폭에 맞춰 열 수를 알아서 조절하므로 두 경우 모두 자연스럽게 채워진다.

**QR 세션 가드는 401 리다이렉트·에러 페이지에 이은 세 번째 상태 처리 카테고리**

[`architecture.md` §6](./architecture.md#6-상태-처리-라우팅-기준)은 401(인증 리다이렉트)과 403/404/500(`ErrorPageTemplate` 기반 에러 페이지)만 다룬다. Consumer의 세션 만료·마감·없음은 둘 다 아니다 — 보여줄 의미 있는 HTTP 상태 코드가 없고(임의로 401/403 등을 표시하면 아직 정해지지 않은 백엔드 세션 API의 의미를 프론트가 먼저 확정하는 셈이 된다), 이동할 로그인 페이지도 없다. 그래서 `ConsumerSessionGuard`(로그인 인증이 아닌 QR 세션 검사)가 `ConsumerStatusScreen`(아이콘+제목+설명+선택적 버튼)을 렌더링하는 것을 세 번째 카테고리로 둔다. 반면 가드를 통과한 뒤 `/consumer/*` 내부의 알 수 없는 경로는 여전히 기존 404 카테고리를 따라 공유 `NotFoundPage`를 그대로 재사용한다.

세션 조회는 `GET /api/consumer/session`이 없어 mock 상태다. 정확한 API 계약과 401/403/409/410의 의미는 여전히 미정이며, 인수인계 문서(`consumer-app-skeleton-handoff.md`) §14 "백엔드 협의 항목"에서 다룬다.

**`ConsumerSessionGuard`는 만들되 지금은 끔(`SESSION_GUARD_ENABLED = false`)**

실제 세션 조회 API가 없는 상태에서 "세션 없음" 화면을 항상 보여주면, QR을 거치지 않고 `/consumer/order`를 직접 열어 화면을 확인/데모하려 할 때마다 막힌다. 가드 로직 자체는 나중에 API가 생겼을 때 그대로 켜서 쓰도록 [`ConsumerSessionGuard.tsx`](../src/apps/consumer/routes/ConsumerSessionGuard.tsx)에 남겨두고, 최상단에 `SESSION_GUARD_ENABLED` 상수 하나로 우회한다 — 꺼져 있는 동안은 세션 상태와 무관하게 children을 그대로 렌더링한다. 같은 이유로 세션 조회의 로딩 분기도 실제 로딩이라 부를 기능이 없어 문구 없는 빈 프레임으로만 남겨뒀다(쿼리가 항상 `pending`으로 시작하는 순간의 화면 깜빡임만 막는 용도).

**`ConsumerBottomSheet`는 `WrapperModal`을 재사용하지 않고 신규 primitive로 작성**

기존 `shared/components/modal/wrapper/WrapperModal`은 화면 중앙 다이얼로그 계약(포커스 트랩, 다중 모달 스택, body 스크롤 잠금)을 갖는다. Consumer 하단 시트는 이와 달리 화면 하단에서 슬라이드로 열리고, 드래그 핸들 스와이프로 닫히며, 항상 한 번에 하나만 열린다(다중 스택 불필요). 또한 이 프로젝트는 이미 `html/body`를 `overflow: hidden`으로 고정해 두어(`global.css`) `WrapperModal`의 body 스크롤 잠금 로직이 애초에 의미가 없다. 계약이 겹치지 않아 `apps/consumer/features/bottom-sheet/components/ConsumerBottomSheet`로 새로 작성했다. 메뉴상세·장바구니·주문내역·직원호출 4개 기능이 공유하며, 다른 앱에서도 동일한 계약으로 재사용될 때만 `shared/components`로 승격한다.

### 결과

- Consumer 반응형 작업은 ADR-016의 컨테이너 쿼리 패턴을 따르지 않아도 된다 — 표준 `@media`가 1차 기준이고, Viewport Segments API는 그 위에 얹는 progressive enhancement다.
- Consumer의 상태 처리는 architecture.md §6의 표에 없다고 해서 누락된 것이 아니라 의도된 세 번째 카테고리다.
- `/consumer/order`는 지금 QR 세션 없이 열어도 주문 화면이 보인다 — 버그가 아니라 `SESSION_GUARD_ENABLED = false`로 인한 의도된 현재 상태이며, 세션 API가 붙으면 이 값만 뒤집는다.
- 바텀시트 신규 작성은 `WrapperModal` 승격 실패가 아니라 계약이 다른 별도 컴포넌트를 만든 것이다.

---

## ADR-021 — Consumer 골격 단계의 mock 경계 원칙

**날짜**: 2026-08-21
**상태**: 채택

### 배경

Consumer 골격 작업 도중 반복해서 마주친 질문이 있다: 아직 없는 백엔드 API를 mock으로 채울 때, 그 mock을 어디에 어떻게 두어야 나중에 실제 API로 바꾸기 쉬운가? ADR-020은 `SESSION_GUARD_ENABLED` 하나만 다뤘지만, 이후 QR 인증(`connectQrStub`)에도 같은 요구가 생겨 패턴으로 정리해둔다.

### 결정

**"실제 로직은 남기고 플래그로 우회" 패턴을 mock 경계의 기본형으로 삼는다**

실제 API가 이미 있지만 아직 그 응답에 의존하고 싶지 않을 때(예: `/api/qr/:url`은 실제로 동작하지만 MSW/백엔드 상태와 무관하게 흐름을 확인해야 함), 또는 API 자체가 없을 때(예: `GET /api/consumer/session`) 모두 아래 형태를 따른다.

```ts
// 실제 호출 코드는 삭제하지 않고 그대로 둔다
const XXX_MOCK_ENABLED = true; // 또는 SESSION_GUARD_ENABLED = false 처럼 반대 극성

const result = XXX_MOCK_ENABLED ? await xxxStub(...) : await xxxReal(...);
```

- 실제 함수 호출부는 지우지 않는다 — 나중에 플래그 하나만 뒤집으면 원래 경로로 복귀한다.
- stub 함수는 별도 파일(`*Stub.ts`)로 분리해 "이 부분은 mock"이 파일 단위로 드러나게 한다.
- stub의 응답 모양은 **실제 API가 이미 있으면 그 응답을 그대로 베끼고**, 없으면 화면에 필요한 최소 모양으로 임의로 정하되 타입에 주석으로 "mock 전용"임을 남긴다 — 실제 계약이 나오면 이 타입과 매핑 로직은 다시 손볼 대상이라는 뜻이다.
- 이 패턴은 Consumer뿐 아니라 다른 앱에서 같은 상황(API는 있지만 흐름 확인엔 방해, 또는 API 자체가 미정)이 생기면 동일하게 적용한다.

### 결과

- 앞으로 Consumer(또는 다른 앱)에서 "API는 있는데 mock으로 우회해야 하는 상황"이 생기면 새로 고민하지 않고 이 ADR의 플래그 패턴을 그대로 적용한다.
- mock 응답 타입에 "mock 전용" 표시가 있으면, 실제 API 연동 시 그 타입과 매핑 로직부터 다시 봐야 한다는 신호로 읽는다.

---
