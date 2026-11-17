# 실제 서버 자동 QA

## 목적과 범위

기존 [모의 API 브라우저 테스트](./browser-e2e.md)와 분리한 Playwright 실행기다.
기존 계정과 전용 테스트 매장을 사용하며 DB 초기화는 하지 않는다.

- 기본: A매장 관리자/스태프의 실제 매장과 역할, 사용자 관리 API와 화면 권한.
- 선택: Consumer 주문 1개 → Client 조리/서빙 → 카드 결제 → Consumer 세션 CLOSED.
- B매장을 입력하면 해당 관리자 로그인/권한도 확인한다. 교차 매장 객체 접근 테스트까지 포함하지는 않는다.
- 실제 로그인 폼 입력, 비밀번호 잠금, 주문 수정 충돌, 미결제, SSE 복구는 이번 실제 서버 시나리오에 포함되지 않는다.

## 준비

1. 최신 백엔드를 실행한다. 프론트 Vite의 현재 프록시 대상은 `localhost:8080`이다.
2. 이 브랜치의 `frontend`에서 `npm ci`와 `npx playwright install chromium`을 실행한다.
3. [.env.qa.example](../../.env.qa.example)을 참고해 Git 제외 `.env.qa.local`에 값을 입력한다.
4. 같은 폴더에서 `npm run dev:real`을 실행한다. QA 실행기는 기존 서버를 임의 재사용/교체하거나 백엔드를 시작하지 않는다.

```powershell
npm run test:qa:real
```

다른 체크아웃에 작성한 환경변수 파일도 복사하지 않고 지정할 수 있다.

```powershell
npm run test:qa:real -- --env-file ../../../frontend/.env.qa.local
```

위 상대 경로는 `.worktrees/real-server-qa/frontend`에서 원본 `frontend` 파일을 참조하는 경우다.
계정은 파일에서만 읽으며 `VITE_` 접두사를 사용하지 않는다.
파일을 Git에 추가하거나 계정 내용을 채팅/보고서에 복사하지 않는다.

## 주문/결제 켜기

- A매장에 옵션 없는 판매 가능 메뉴를 준비하고 이름에 `AUTO-QA`를 포함한다.
- 테스트에만 사용할 빈 테이블과 해당 QR 주소/테이블 sysId/테이블 번호를 준비한다.
- QR은 A매장 관리자 계정의 매장에 속해야 한다. 테이블 sysId는 Consumer 세션 응답의 `data.tableSysId`이며 QR URL 식별자와 다르다.
- 예시 파일의 `QA_QR_URL`, `QA_TABLE_SYS_ID`, `QA_TABLE_NUM`, `QA_MENU_NAME`을 입력한다.
- `QA_ENABLE_ORDER_PAYMENT=1`로 설정하면 다음 실행에서 주문과 카드 결제를 각 1회 수행한다.
- 테이블을 다른 사람이 동시에 사용하지 않아야 한다. 공유 서버에서 완전한 배타 사용을 보장하는 기능은 없다.
- 생성 주문은 `AUTO-QA` 메뉴명으로 구분하고, 실행 기록에는 실행 ID와 생성 orderId를 남긴다.
- 실패 후 남은 주문은 기록의 orderId로 확인한다. 자동 취소/삭제/DB 초기화는 하지 않는다.
- 생성 후 실패했다면 [기존 주문 재개 조건](../../../docs/qa/2026-11-17-real-qa-order-number-resume.md)을 따른다. 재개는 실행 프로세스 환경변수 `QA_RESUME_ORDER_ID`로 지정하며 새 주문을 만들지 않는다.

## 안전장치와 선택 이유

- workers=1/retries=0/maxFailures=1: 병렬 주문 충돌과 로그인 실패 누적을 줄인다.
- 로그인 전 `/api/auth/me` 연결 검사: 백엔드 장애 상태에서는 로그인도 보내지 않는다.
- 계정당 로그인 한 번 후 `/api/auth/me`의 userId/sysPlantCd/staffRole/initPwdRequired를 확인한다.
- 계정/매장/역할이 예상과 다르면 중단한다. 중복 아이디를 임의로 추정하지 않는다.
- 기존 진행 주문이 있는 테이블은 새 주문을 만들지 않는다.
- 새 주문 POST는 지정 메뉴 1개/수량 1/옵션 없음으로 1회만 허용한다.
- Client 상태 변경은 생성 orderId만 허용하고, 결제 body에 다른 orderId가 섞이면 전송을 차단한다.
- 기존 화면 접근 로그 POST는 허용한다. 업무 쓰기와 별도로 서버 로그가 남을 수 있다.
- 요청/화면 대기에 제한 시간을 두며 실패 시 전체 실행을 중단한다. 서버 전체의 부하를 측정하는 도구는 아니다.
- 실제 계정 실행은 trace/HAR/영상/스크린샷을 끈다. 로그인 본문과 쿠키 유출 방지가 우선이다.
- 민감정보를 제외한 실행 단계/orderId는 `test-results/real-qa`의 첨부 결과로 남긴다.

## 검증 근거와 현재 한계

- 환경변수와 계정 안전장치: [Node 테스트](../../scripts/utils/real-qa-env.test.mjs).
- 정상 주문/결제와 기존 주문/다른 주문 결제 차단: [실행기 브라우저 회귀](../../e2e/real-qa-harness.spec.ts).
- 자동 결과: `npm run test:scripts` 12개 통과 / `npx playwright test e2e/real-qa-harness.spec.ts` Chromium 3개 통과 / E2E typecheck와 lint 통과.
- 첫 차단 회귀는 응답 대기 타임아웃으로 실패했다. 차단 신호를 즉시 전달하도록 수정한 후 3개를 다시 통과했다.
- 실제 실행: `npm run test:qa:real -- --env-file ../../../frontend/.env.qa.local`.
- 2026-11-17 관찰: 백엔드 연결 거부로 사전 검사 HTTP 502. 로그인/주문/결제 전 중단했다.
- 이후 연결/로그인은 복구됐으나 스태프 목록 권한에서 중단했다. 최신 [dev 병합과 재실행 결과](../../../docs/qa/2026-11-17-dev-worktree-integration.md)를 기준으로 확인한다.
- 따라서 실제 DB 저장과 실서비스 SSE 동기화 통과를 주장하지 않는다.
- 실제 실행 성공 후 실행 날짜/단계/orderId와 관찰 결과를 기록한다.
- 주문 단계의 [QR 대기 수정과 설정 불일치](../../../docs/qa/2026-11-17-real-qa-qr-session-wait.md): 인증/세션 대기와 매장/테이블 설정을 각각 확인한다.

구현: [실행 스크립트](../../scripts/run-real-qa.mjs), [실제 서버 설정](../../playwright.real.config.ts), [권한 시나리오](../../e2e-real/client-permissions.spec.ts), [주문/결제 흐름](../../e2e-real/order-payment.ts).
