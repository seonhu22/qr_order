# 실제 주문 QA / QR 인증 대기와 설정 불일치

기준일: 2026-11-17. [실행 방법](../../frontend/docs/testing/real-server-qa.md).

최신 상태는 [메뉴 추가 후 주문 생성과 재개 기록](./2026-11-17-real-qa-order-number-resume.md)에서 확인한다. 아래는 이전 설정/메뉴 준비 이력이다.

## 이전 재실행 / 설정 일치 후 메뉴 준비 대기

- 사용자 설정 수정 후 매장/테이블/ACTIVE/주문 허용/기존 진행 주문 없음 검사는 통과했다.
- 실행기는 `AUTO-QA 테스트 메뉴` 버튼을 찾지 못해 주문 전에 중단했다.
- 실제 `GET /api/client/consumer/menu/main`은 HTTP 200/success=true이며 `data.body.menuList`는 배열 길이 0이었다.
- 현재 QR의 매장에서 카테고리/메뉴 사용 여부와 저장/노출 여부를 확인해야 한다. 원인을 다른 매장 등록이나 사용 여부로 단정하지 않는다.
- 아래 QR/매장 설정 불일치와 자동화 대기 문제는 이전 실행 기록이다. 실제 주문/결제는 아직 수행하지 않았다.

## 관찰과 재현

- 사용자 환경파일 갱신 후 `npm run test:qa:real` 실행. 주문/결제 옵션은 활성이다.
- 실제 실행은 Consumer 세션 생성 확인에서 중단됐다. 주문 POST/조리/서빙/결제 요청은 보내지 않았다.
- 별도 읽기 진단에서 QR 인증 200/success=true → 주문 화면 이동 → 세션 200/ACTIVE를 확인했다.
- 인증 완료 후 실제 세션과 환경 설정을 비교하면 매장 코드와 테이블 sysId가 불일치하고 테이블 번호는 일치했다.
- QR 연결 GET은 방문 세션을 생성/갱신할 수 있다. 주문 미생성이 DB 전체 무변경을 뜻하지는 않는다.
- 실제 계정/QR 식별자/매장 값은 이 문서에 저장하지 않는다.

## 자동화 수정

- 원인: `page.goto(QR)` 완료는 React의 비동기 QR 인증 완료를 보장하지 않는다.
- [실행기](../../frontend/e2e-real/order-payment.ts)는 QR API 응답 200/success=true와 `/consumer/order` 이동을 확인한 뒤 세션을 조회하도록 수정했다.
- 고정 sleep이나 무조건 재시도로 통과시키지 않는다. API/화면 상태를 최대 15초 기다린다.
- 불일치 오류에는 환경변수 이름만 포함한다. 실제 QR 주소/계정/쿠키는 출력하지 않는다.
- 실제 매장/테이블 검증과 기존 주문/결제 범위 차단은 유지한다.
- 지연된 QR 응답을 제공하는 [회귀 테스트](../../frontend/e2e/real-qa-harness.spec.ts)는 수정 전 동일 세션 오류로 실패했다.

## 검증 결과

- `npx playwright test e2e/real-qa-harness.spec.ts`: 기존 주문/결제/범위 차단과 신규 QR 지연/매장 불일치 5개 통과.
- 최종 오류 진단 보완 후 QR 지연/매장 불일치 2개를 다시 실행해 통과했다.
- `npm run test:e2e:typecheck`와 `npm run lint` 통과.
- 첫 lint는 실패한 브라우저 테스트의 생성 리포트까지 검사해 실패했다. Git 제외 생성물인 `playwright-report/**`/`test-results/**`만 [lint 제외](../../frontend/eslint.config.js)에 추가했다.
- ESLint API로 생성물 두 경로 제외/실제 Client 소스 경로 검사 유지도 확인했다. 제품 소스 검사 규칙은 약화하지 않았다.

## 설정 확인과 재개 조건

1. `QA_MANAGER_A_ID`로 로그인한 매장에서 생성한 전용 테이블 QR인지 확인한다.
2. 그 QR로 Consumer에 접속해 개발자도구 Network의 `GET /api/client/consumer/session` 응답을 확인한다.
3. `data.sysPlantCd`는 `QA_STORE_A_CODE`와 같아야 한다. 단순히 설정만 다른 매장으로 바꾸면 관리자 로그인 범위 검사가 실패할 수 있다.
4. `QA_TABLE_SYS_ID`는 `data.tableSysId`와 같아야 한다. QR URL 식별자나 테이블 표시 번호가 아니다.
5. `QA_TABLE_NUM`은 `data.tableNum`과 같아야 한다.
6. 일치하는 설정으로 다시 실행한다. 기존 진행 주문이 있으면 자동 생성/결제를 중단한다.

이 단계에서는 실제 주문/결제 통과를 기록하지 않는다. 최초 비밀번호 변경과 사용자 관리 권한 QA 결과와도 구분한다.
