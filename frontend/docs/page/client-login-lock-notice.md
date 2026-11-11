# Client 로그인 제한 안내

## 현재 적용 범위

사용자가 승인한 다섯 번째 실패 안내를 기존 결과 모달에 연결했다. 프론트는 실제 계정을 잠그거나 DB 실패 횟수를 변경하지 않는다.

- 서버 실패 횟수 1~4: 기존 인라인 오류 유지.
- 서버 실패 횟수 5 이상: 제한 안내 모달/비밀번호 입력 초기화/인라인 오류 중복 표시 방지.
- 기존 서버의 `비밀번호 5회 ... 사용 중지` 메시지: 횟수가 없어도 서버 메시지로 안내.
- HTTP 401과 기존 mock의 HTTP 200/`success:false`를 모두 처리한다.
- 일반 서버/네트워크 오류는 잠금으로 분류하지 않는다.
- 아이디와 로그인 경로는 유지한다. 연락처/해제 방법/지속 잠금 UI는 새로 정하지 않았다.

## 구현을 읽는 순서

1. [공용 해석기](../../src/shared/auth/loginFailure.ts)와 인접 테스트: 실제 숫자 응답과 기존 snake/camel 객체 응답을 읽는다. 횟수에 1을 더하지 않는다.
2. [Admin 연결](../../src/apps/admin/pages/login/LoginPage.tsx): 기존 잠금 화면/판정 동작을 유지하고 중복 함수만 제거했다.
3. [Client 연결](../../src/apps/client/features/login/hooks/useClientLoginAuthFlow.ts): 기존 로그인 실패 처리에만 제한 안내를 연결한다.
4. [훅 통합 테스트](../../src/apps/client/features/login/hooks/useClientLoginAuthFlow.test.tsx): 실제 httpClient/생성 mutation/React Query/결과 모달 상태를 MSW 응답으로 검증한다.
5. [브라우저 회귀](../../e2e/client-login-lock.spec.ts): 1~4회 인라인/5회 모달 하나/비밀번호 초기화 확인.

새 UI 컴포넌트/라이브러리/DB 컬럼/API 필드는 추가하지 않았다. 기존 결과 모달과 Admin에서 검증된 응답 처리를 재사용했다.

## 서버 후속 구현과 검증 한계

후속 `LoginService` 수정으로 증가 후 횟수를 응답하고 `>= 5`부터 차단한다. 동일 계정 로그인에 행 잠금/트랜잭션을 추가했다. [서버 구현 근거](../../../docs/qa/2026-11-11-backend-security-boundaries.md).
프론트 별도 카운터는 브라우저/새로고침/다중 요청마다 달라지므로 서버 오류를 보정하는 용도로 추가하지 않았다.
실제 서버의 다섯 번째 잠금/DB 증가 유지/동시성은 전용 QA 계정과 복구 방법을 확보하고 별도 검증해야 한다. 공유 계정을 반복 오입력하여 잠그지 않는다.

## 실행

```powershell
npm test -- --run src/shared/auth/loginFailure.test.ts src/apps/client/features/login/hooks/useClientLoginAuthFlow.test.tsx
npx playwright test e2e/client-login-lock.spec.ts
```

전체 실행과 결과 요약은 [검증 명령](../testing/verification.md)을 따른다. 테스트 fixture의 실패 횟수는 승인된 기대 계약이며 실제 DB 카운터의 통과 증거가 아니다.

커밋별 학습 순서/실패 재현/검증 결과: [제한 안내 보고서](../../../docs/qa/2026-11-11-client-login-lock-notice.md).
