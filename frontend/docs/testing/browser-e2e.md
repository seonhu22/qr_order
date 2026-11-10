# 브라우저 자동 테스트

## 무엇을 확인하나

Playwright가 실제 Chromium을 열어 버튼을 누르고 입력하며 화면과 전송 요청을 확인한다. 기존 Vitest/jsdom 테스트보다 브라우저 동작에 가까운 회귀 검증이다.

현재 API 응답은 테스트 fixture가 제공한다. 실제 Spring 서버/DB 저장까지 검증하는 E2E는 아니며, `dev:real` 수동 QA를 대체하지 않는다.

| 시나리오 | 확인 내용 |
|---|---|
| Client 로그인 | 비로그인 접근 → 로그인 → 보호된 주문현황 진입 |
| Client 주문처리 | 접수 → 조리 → 서빙 → 영수증 → 카드결제 요청과 화면 갱신 |
| Consumer 주문 | 메뉴 → 장바구니 → 주문 성공 → 장바구니/요청 ID 초기화 |
| Consumer 재시도 | 첫 요청 실패 → 장바구니 유지 → 같은 요청 ID/내용으로 재시도 |
| 관리자 알림 | 모두 읽음 → 다른 탭 동기화 → 새로고침 후 읽음 복원 |
| SSE fallback | 실제 EventSource 요청 차단 → 반복 연결 실패 → polling GET으로 외부 상태 변경 반영 |
| 주문 수정 | 오프라인 확인 시 POST 없음/초안 유지 → 온라인 재시도 409 안내/초안 유지 |
| 문의 답변 파일 | 첫 저장 실패 → 답변/파일 유지 → multipart 재시도 필드/파일 내용 검증 |
| Client 메뉴 권한 | 관리자 조회/스태프 직접 URL 차단/API 무요청/대소문자와 인코딩 우회 방지 |
| Client 제한 안내 | 서버 횟수 1~4 인라인/5회 모달 하나/비밀번호 초기화. 실제 서버 카운트 검증 제외 |

## 실행

frontend 폴더에서 실행한다.

```powershell
npm ci
npx playwright install chromium
npm run test:e2e
```

- Vite를 `127.0.0.1:4173`에 자동 실행하고 테스트 종료 후 정리한다.
- 기존 3000번 개발 서버와 분리한다. 4173번이 이미 사용 중이면 다른 서버를 재사용하지 않고 실패한다.
- 실행 모드는 `dev:real`이지만 테스트가 모든 `/api/` 요청을 가로채므로 백엔드 연결은 하지 않는다. Service Worker는 차단한다.
- fixture에 없는 API는 501로 응답하고 테스트를 실패시킨다. 실제 서버로 우회하지 않는다.
- 테스트별 새 브라우저 context를 사용해 쿠키/localStorage를 격리한다.
- SSE 테스트는 브라우저 시간을 앞당겨 백오프/polling을 검증한다. HTTP 응답 후 React Query 알림이 실행되도록 시간을 재개한 뒤 화면을 확인한다.
- 등록 경로는 `/api/`로 시작하는 요청만 포함한다. `**/api/**` 패턴은 Vite의 `/src/shared/api/...`까지 차단하므로 사용하지 않는다.

## 결과 보기

```powershell
npm run test:e2e:report
npm run test:e2e:ui
npm run test:e2e:typecheck
```

- report: HTML 결과를 연다.
- ui: 실행 과정을 직접 보고 특정 시나리오를 반복한다.
- typecheck: 테스트 fixture/설정의 타입을 확인한다.
- 실패 시 스크린샷과 trace는 `frontend/test-results/e2e/`, HTML은 `frontend/playwright-report/`에 남으며 Git에 올리지 않는다.
- `npm test`는 src 내부 Vitest 테스트만 실행한다. Playwright는 별도 명령으로 실행한다.

## 왜 이 방식인가

- 실제 DB 초기화/전용 계정이 준비되지 않은 상태에서도 브라우저 회귀를 반복할 수 있다.
- generated DTO와 기존 백엔드 계약에서 fixture를 구성해 앱 내부 mock의 성공 응답만 복사하지 않았다.
- 파일명/권한/서버 정책을 테스트 통과 목적으로 바꾸지 않는다. 커스텀 라디오 등은 사용자가 누르는 label을 클릭하고 선택 상태를 확인한다.
- 이후 전용 QA 환경에서 실제 서버용 설정/데이터 준비 및 정리를 별도 추가한다.

설정: [Playwright config](../../playwright.config.ts), 시나리오: [Client](../../e2e/client-operations.spec.ts), [Consumer](../../e2e/consumer-order.spec.ts).

확장 시나리오: [관리자 알림](../../e2e/manager-notifications.spec.ts), [SSE polling](../../e2e/client-realtime.spec.ts), [주문 수정](../../e2e/order-revision.spec.ts), [문의 파일](../../e2e/inquiry-attachments.spec.ts). 전체 검사/로그 요약은 [검증 실행](./verification.md)을 따른다.

권한 회귀: [Client 메뉴 관리](../../e2e/client-menu-permissions.spec.ts). 실제 API 서버 인가 테스트를 대체하지 않는다.

인증 응답 회귀: [Client 제한 안내](../../e2e/client-login-lock.spec.ts).

공식 근거: [Web server](https://playwright.dev/docs/test-webserver), [API mocking](https://playwright.dev/docs/mock), [Configuration](https://playwright.dev/docs/test-configuration).
