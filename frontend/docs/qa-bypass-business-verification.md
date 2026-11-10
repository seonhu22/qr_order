# QA 모드: 사업자 인증 우회 (로컬 dev 한정)

## 배경

회원가입 흐름의 사업자 인증(`POST /api/auth/signup/new/chkBRN`)은 NTS 공개 API로 실제 검증한다. 유효한 테스트 사업자 데이터가 없으면 회원가입 이후 단계(이메일 인증, 가입 완료)를 끝까지 QA할 수 없다.

이 문서는 **로컬 dev 환경에서만** 사업자 인증 400 응답을 성공으로 우회하는 임시 기능 사용법을 설명한다.

## 동작 조건 (3조건 AND)

1. `import.meta.env.DEV === true` — vite dev 서버 (`npm run dev`/`dev:mock`/`dev:real`)
2. `VITE_BYPASS_BUSINESS_VERIFICATION === 'true'` — `.env.local`에서 명시 설정
3. `POST /api/auth/signup/new/chkBRN` 응답이 **HTTP 400**

세 조건 중 하나라도 빠지면 우회되지 않는다.

> production 환경에서는 `DEV === false`이므로 우회하지 않는다. 이번 검증은 우회 판정과 호출부 가드를 기준으로 하며, 빌드 산출물에서 코드가 완전히 제거되는지는 별도 검증 대상이다.

## 사용 방법

1. `frontend/.env.local` 파일 생성 (없으면):
   ```env
   VITE_BYPASS_BUSINESS_VERIFICATION=true
   ```
   - `.env.local`은 `.gitignore`에 등록돼 있어 커밋되지 않는다.
   - 절대 `.env.real` 또는 `.env.mock`에 추가하지 말 것 (이 두 파일은 커밋됨).

2. dev 서버 재시작 (env는 build-time에 inline됨):
   ```sh
   npm run dev:real
   ```

3. 회원가입 흐름 진입 → 사업자 인증 단계에서 임의의 정보 입력 → 제출.

4. 결과:
   - 정상 응답: 기존과 동일 (인증 완료 모달)
   - 400 응답 + 우회 활성: **"QA 모드 — 사업자 인증 오류를 우회했습니다"** 모달 출력 후 회원가입 단계 진입
   - 401/500/network: 우회 안 됨, 일반 실패 모달

5. 브라우저 콘솔에 `[QA bypass] 사업자 인증 400 응답 우회.` 1회 출력 → 우회 활성 상태 확인 가능.

## ⚠️ 주의

- **가짜 사업자 데이터가 DB에 저장됨**. 회원가입 최종 단계(`/api/auth/signup/new`)는 NTS 재검증을 수행하지 않으므로, 우회 후 가입한 회원의 plant 레코드에 가짜 사업자번호가 그대로 저장된다. QA 후 DB 정리가 필요할 수 있다.
- production env에 `VITE_BYPASS_BUSINESS_VERIFICATION=true`가 들어가도 `import.meta.env.DEV === false`라 우회되지 않지만, env 설정 자체를 production에 두지 않는 것이 정석이다.

## 제거 조건

2026-11-10 결정: 유효한 테스트 사업자 데이터 확보 전까지 개발 전용 우회를 유지한다. 기존의 “추가 후 4주 경과” 제거 조건은 폐기한다. 현재 코드에는 날짜에 따른 자동 만료 로직이 없다.

다음 대체 수단 중 하나를 확보하고, 우회 환경변수를 끈 상태에서 사업자 인증 → 이메일 인증 → 최종 가입 QA가 통과하면 우회를 제거한다.

- 실제 검증에 사용할 수 있는 테스트 사업자 데이터
- QA 환경에서 사용할 수 있는 NTS mock endpoint 또는 별도 mock 인프라

대체 수단을 확보한 것만으로 제거하지 않는다. 회원가입 전체 흐름의 통과 기록을 먼저 남기고, 우회로 생성한 QA 데이터의 정리 필요 여부도 확인한다.

**제거 범위** (단일 commit):
- `frontend/src/apps/client/features/signup/api/signupBusinessVerificationBypass.ts` 삭제
- `frontend/src/apps/client/features/signup/api/signupBusinessVerificationBypass.test.ts` 삭제
- `frontend/src/apps/client/features/signup/hooks/useClientSignupFlow.ts` 내 bypass 분기 롤백
- `frontend/.gitignore`의 `.env.local*` 패턴은 유지 (Vite 표준)
- 본 문서에 제거 결과와 검증 기록을 남기거나 [완료 기록](./completed.md)으로 연결

## 검증 범위

- 자동 테스트: 개발 환경, 명시적 활성화 값, HTTP 400의 AND 조건과 비허용 오류의 차단을 확인한다.
- 2026-11-10 검증: 관련 Vitest 1개 파일/9개 테스트, `npm run typecheck`, `npm run lint` 통과.
- 이번 조건 갱신은 실행 로직을 변경하지 않는다. `dev:real`의 사업자 인증/가입 완료 검증은 미수행이며, 대체 수단 확보 후 제거 단계에서 수행한다.
- 결정과 전체 우선순위: [프로젝트 마감 TODO / QA-01](../../docs/plans/2026-11-10-project-closeout-backlog.md#qa-01-사업자-인증-qa-우회-유지-조건-갱신).

## 관련 파일

- 유틸: `frontend/src/apps/client/features/signup/api/signupBusinessVerificationBypass.ts`
- 테스트: 동일 디렉터리 `.test.ts`
- 호출처: `frontend/src/apps/client/features/signup/hooks/useClientSignupFlow.ts` (`useSignupBusinessVerificationMutation` onError)
- gitignore: `.gitignore` (root)
