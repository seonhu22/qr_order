# 클라이언트 이메일 인증 구현 플랜

> 추가일: 2026-06-14
> 대상 흐름: 회원가입(`step === 'signup'`), 비밀번호 찾기(`step === 'find-password*'`)
> 대상 파일: `frontend/src/apps/client/pages/login/LoginPage.tsx`

## 핵심 개념

이메일 인증은 **challenge-response 패턴**이다.
서버가 랜덤 코드를 만들어 이메일로 보내고, 사용자가 같은 코드를 입력해 되돌려 보내면 통과한다.
이메일함을 보지 못하면 입력할 수 없으므로 **이메일 소유권을 간접 증명**한다.

API는 두 개로 구성된다.

- **발송 API**: 이메일을 받아 서버가 코드 생성·저장·메일 발송
- **확인 API**: 사용자가 입력한 코드를 서버가 저장된 코드와 비교

## 표준 흐름

```
[사용자]      [Frontend]              [Backend]               [Email]
   │ 이메일+"인증"  │ POST /email/send      │
   │──────────────>│──────────────────────>│ 코드 생성/저장 + 메일 전송 ──>│
   │               │<──────────────────────│ 200 OK
   │               │ 코드 입력 UI + 타이머
   │ 코드+"확인"    │ POST /email/verify    │
   │──────────────>│──────────────────────>│ 코드 비교, verified 표시
   │               │<──────────────────────│ 200 OK
   │               │ 가입/비번재설정 요청 시 verified 상태 첨부 →
```

## 부수 정책

| 항목 | 의미 | 기본값 |
| :--- | :--- | :--- |
| TTL (유효시간) | 코드 살아있는 시간 | 3~5분 |
| 재발송 쿨다운 | "재전송" 버튼 도배 방지 | 30초~1분 |
| 시도 횟수 제한 | 코드 추측(brute force) 방지 | 5회 |
| 인증 상태 보관 | 확인 통과 사실을 다음 요청까지 유지하는 방식 | 서버 세션 플래그 또는 단기 토큰 |

마지막 항목은 백엔드 정책 결정 사항이다.
세션 방식이면 프론트는 이메일만 보내면 되고, 토큰 방식이면 토큰을 저장했다가 가입 요청에 첨부한다.

## 책임 분담

**프론트**
1. 이메일 형식 클라이언트 검증
2. 발송 API 호출 + 응답 처리
3. UI 상태 전이: 입력 → 발송됨 → 타이머 → 확인됨/만료됨
4. 타이머 카운트다운 (서버 TTL과 시각적 동기화)
5. 확인 API 호출 + 응답 처리
6. 인증 완료 상태를 다음 폼 단계로 전달

**백엔드 (프론트 관여 X)**
- 코드 생성·저장·만료·시도 제한
- SMTP 발송
- verified 상태 발급/검증

## 현재 코드 매핑

UI 자체는 이미 표준 흐름대로 구현되어 있다. API 연결만 남았다.

| 흐름 단계 | 코드 위치 |
| :--- | :--- |
| 이메일 형식 검증 | `LoginPage.tsx:152-160` |
| **발송 API 호출 (TODO)** | `LoginPage.tsx:164` |
| 발송됨 → 코드 입력 UI 노출 + 타이머 시작 | `LoginPage.tsx:165-166`, `LoginPage.tsx:143-147` |
| 코드 입력 받기 | `LoginPage.tsx:759-799` |
| **확인 API 호출 (TODO, 현재 임시 통과)** | `LoginPage.tsx:174` |
| 확인 성공 → verified 표시 | `LoginPage.tsx:175` |
| 가입 시 verified 검사 | `LoginPage.tsx:413-416` |
| 비번찾기 발송 stub | `LoginPage.tsx:42-51` (`findPassword`) |
| 비번찾기 확인 stub | `LoginPage.tsx:53-62` (`verifyFindPasswordCode`) |

## 이미 codegen된 훅

- `frontend/src/generated/sign-up-controller/sign-up-controller.ts:156` — `useEmailValid` (`POST /api/auth/signup/email_valid/{encodeSysId}`)
- `frontend/src/generated/email-valid-controller/email-valid-controller.ts:29` — `useNewUserEmailValid` (`POST /api/auth/email_valid/new_user/{encodeSysId}`)
- `frontend/src/generated/sign-up-controller/sign-up-controller.ts:40` — `useNewUser` (가입 본요청)
- `frontend/src/generated/sign-up-controller/sign-up-controller.ts:98` — `useChkBRN` (사업자번호 검사)
- 비밀번호 찾기용 endpoint는 아직 codegen에 없음 → 백엔드 신규 작성 필요

현재 codegen된 두 emailValid 훅은 path param `encodeSysId` 하나만 받는다.
발송/확인 중 어느 것인지, 이메일·코드 본문은 어떻게 전달하는지 시그니처만으로는 불명확하다.
→ 백엔드 명세 확정이 가장 큰 블로커.

## 백엔드 합의 체크리스트

이 6가지가 합의되면 프론트 구현은 30분이면 끝난다.

**발송 API**
1. URL과 메서드
2. Request body: `{ email }`인지, 추가 식별자가 필요한지
3. Response: 성공/실패 외에 발급 토큰 같은 게 있는지

**확인 API**
4. URL과 메서드
5. Request body: `{ email, code }`인지, `{ token, code }`인지
6. Response: 성공 시 어떤 값이 오는지

**+ 회원가입과 비번찾기가 같은 API를 쓰는지 확인**
- 같은 API + `purpose: 'signup' | 'reset-password'` 파라미터로 구분
- 또는 endpoint 분리 (`/auth/signup/email/*`, `/auth/password-reset/email/*`)

## 구현 순서

1. **백엔드와 위 체크리스트 합의** ← 시작점
2. 백엔드 변경 시 `npm run generate:schema && npm run generate` 실행 (`docs/api-codegen.md` 참고)
3. wrapper 훅 작성 (`shared/auth/hooks/`)
   - 패턴: `useAuthLoginMutation.ts` 참조
   - `useEmailVerifyRequestMutation` (발송)
   - `useEmailVerifyConfirmMutation` (확인)
   - 비번찾기 endpoint가 다르면 별도 wrapper 추가
4. LoginPage TODO 두 곳 교체
   - `LoginPage.tsx:164`, `LoginPage.tsx:174`의 임시 처리 제거
   - `findPassword`, `verifyFindPasswordCode` stub 함수 (`LoginPage.tsx:42-62`) 제거 후 wrapper 호출로 교체
5. mock 핸들러 추가
   - `src/test/handlers.js`에 stateful 커스텀 핸들러 (코드 일치 비교 가능해야 함)
   - generated MSW는 랜덤 응답이라 코드 확인 흐름엔 부적합
6. 검증
   - `npm run dev:mock`으로 회원가입/비번찾기 두 흐름 직접 진행
   - 만료 시나리오(타이머 종료 후 확인 시도)도 확인
   - `npm run lint && npm run typecheck && npm test`

## 주의

- 백엔드 확정 전에 wrapper만 미리 만들면 두 번 일하게 된다.
- `src/generated/`는 직접 수정하지 않는다.
- `LoginPage.tsx:32-88`의 stub fetch들은 wrapper로 모두 교체 대상이다.
