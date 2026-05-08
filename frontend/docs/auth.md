# 인증 구조

> 로그인 흐름, 인증 상태 관리, 비밀번호 강제 변경 정책, 계정 잠금 정책을 다룬다.

## 목차

- [1. 기본 흐름](#1-기본-흐름)
- [2. auth/me와 auth/profile 쿼리 키 분리](#2-authme와-authprofile-쿼리-키-분리)
- [3. 사용자 이름 필드 우선순위](#3-사용자-이름-필드-우선순위)
- [4. init_yn 비밀번호 강제 변경 흐름](#4-init_yn-비밀번호-강제-변경-흐름)
- [5. password_fail_cnt 계정 잠금 흐름](#5-password_fail_cnt-계정-잠금-흐름)
- [6. 인증 전환 중 401 처리](#6-인증-전환-중-401-처리)

---

## 1. 기본 흐름

```text
login mutation 성공
→ auth/me 캐시 갱신 + auth/profile 캐시 갱신
→ AuthProvider가 Query 캐시를 읽어 인증 상태 계산
→ 보호 라우트가 /admin/* 접근 허용
```

관련 파일:

- `src/shared/auth/AuthProvider.jsx`
- `src/shared/auth/hooks/useCurrentUser.ts`
- `src/shared/auth/hooks/useAuthLoginMutation.ts`
- `src/shared/auth/hooks/useAuthLogoutMutation.ts`

---

## 2. auth/me와 auth/profile 쿼리 키 분리

로그인 성공 후 `invalidateQueries`가 `/api/auth/me`를 재조회하면, 백엔드가 user 정보 없이 `{ success: true }`만 반환하는 경우 user 데이터가 사라지는 문제가 있다.

이를 방지하기 위해 로그인 응답의 user 데이터를 `auth/profile`에 별도 보존한다.

| 쿼리 키 | 역할 |
|---|---|
| `queryKeys.auth.me` | `/api/auth/me` 응답 — 인증 상태 확인용 |
| `queryKeys.auth.profile` | 로그인 응답의 user 데이터 — user 이름·역할 표시용 |

`AuthProvider`는 `auth/me`에서 user 데이터가 없으면 `auth/profile`로 보완한다. 로그아웃 시 두 캐시를 모두 비운다.

---

## 3. 사용자 이름 필드 우선순위

실제 백엔드는 `userNm` 필드를 사용한다. `AdminSidebar`는 아래 순서로 사용자 이름을 결정한다.

```
user.userNm → user.userName → user.userId → '관리자' (fallback)
```

---

## 4. init_yn 비밀번호 강제 변경 흐름

> 추가일: 2026-05-07

로그인 응답의 `data.init_yn`이 `'Y'`(대소문자 무관)이면 사용자는 비밀번호를 변경하기 전까지 메인 페이지에 진입할 수 없다.

```text
login mutation 성공 + init_yn === 'Y'
→ 안내 모달 표시 ("비밀번호가 초기화되었습니다. 변경해주세요.")
→ 확인 클릭 → LoginPage 내부에서 비밀번호 변경 폼으로 전환
→ 변경 성공 → 완료 모달 → 확인 클릭 → auth/me 캐시의 init_yn을 'N'으로 갱신 → /admin/main 이동
```

- `RequireAuth`는 `isAuthenticated && init_yn === 'Y'`이면 `/admin/login`으로 리다이렉트한다. 이미 로그인한 상태에서 `/admin/main`을 직접 입력해도 접근이 차단된다.
- `LoginPage`는 `useEffect`로 인증 상태를 감지해, 리다이렉트로 돌아왔을 때도 자동으로 변경 폼을 표시한다.
- 비밀번호 변경 API: `POST /api/auth/init-pwd` — `InitPwdRequest { password, chkPassword }` + `InitPwdParams { userId }`
- auth/me 캐시의 `init_yn` 업데이트는 완료 모달의 확인 버튼 클릭 시점에 수행한다. 모달이 표시되기 전에 캐시를 갱신하면 `AppRoutes`가 즉시 리다이렉트해 모달이 뜨지 않기 때문이다.

---

## 5. password_fail_cnt 계정 잠금 흐름

> 추가일: 2026-05-07

로그인 실패 응답의 `data.password_fail_cnt`가 `5` 이상이면 잠금 화면으로 전환된다. 잠금 상태에서는 로그인 폼에 접근할 수 없다.

```text
login mutation 실패 + password_fail_cnt >= 5
→ LoginPage가 step을 'locked'로 전환
→ 잠금 안내 화면 표시 (관리자 문의 이메일 포함)
→ "로그인으로 돌아가기" 클릭 → step을 'login'으로 복귀
```

- `LoginPage`의 `step: 'login' | 'changePassword' | 'locked'` 중 `'locked'`가 잠금 화면 역할을 한다.
- 잠금 해제(비밀번호 초기화) 방법과 초기화 API는 백엔드 연동 시 확정 예정이다.
- 관리자 문의 이메일: `admin@qrorder.co.kr` (추후 실제 값으로 교체).

**목업 테스트**: `locked` 아이디로 로그인하면 즉시 잠금 화면을 확인할 수 있다. 그 외 아이디로 로그인에 실패할 때마다 `password_fail_cnt`가 1씩 증가해 5에 도달하면 잠금 화면으로 전환된다.

---

## 6. 인증 전환 중 401 처리

> 추가일: 2026-05-08

로그아웃처럼 사용자가 의도적으로 인증 상태를 끊는 작업 중에는 기존 화면의 API가 뒤늦게 401을 받을 수 있다. 이 401은 세션 만료가 아니라 인증 전환 과정에서 발생한 부수 효과이므로, "로그인 인증이 만료되었습니다" 모달을 띄우지 않는다.

관련 파일:

- `src/shared/auth/authTransition.ts`
- `src/shared/auth/authRedirect.ts`
- `src/shared/auth/hooks/useAuthLogoutMutation.ts`

기본 정책:

- 일반 사용 중 401: `httpClient`가 인증 만료 이벤트를 발행하고 `AuthRedirectHandler`가 모달을 표시한다.
- 인증 전환 중 401: `authTransition` 상태를 확인해 인증 만료 이벤트를 발행하지 않는다.
- Orval generated API 파일은 직접 수정하지 않는다.
- 로그인, 로그아웃, 비밀번호 변경처럼 인증 상태를 바꾸는 흐름은 generated hook을 감싼 커스텀 훅에서 제어한다.

로그아웃 흐름:

```text
logout mutation onMutate
→ beginAuthTransition()
→ /api/auth/logout 호출
→ queryClient.cancelQueries()
→ auth/me 비로그인 상태 설정
→ auth/me 외 query cache 제거
→ finally에서 endAuthTransition()
→ 호출부 콜백에서 /admin/login 이동
```

`authTransition`은 count 방식으로 관리한다. 인증 전환 작업이 겹쳐도 먼저 끝난 작업이 전체 전환 상태를 잘못 해제하지 않도록 하기 위함이다.
