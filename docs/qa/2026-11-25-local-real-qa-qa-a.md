# 2026-11-25 로컬 실서버 QA / qa-a

- 대상은 `dev` `2d904c43`의 5번 B(`318ed9c1`), 주문 이력 옵션 조회(`0a1536f2`)와 화면(`b843c535`), CON-03(`361484b3`)이다.
- 실행 환경은 프론트 `localhost:3000` / 백엔드 `127.0.0.1:8080` / PostgreSQL 로컬 사본 `qrdemo`다.
- 재현은 [Playwright 명세](../../frontend/e2e-real/qa-a-regressions.spec.ts)를 사용한다. PowerShell에서 로컬 QA DB 환경을 불러오고 `QA_AUTH_PSQL`에 psql 실행 파일 경로, `QA_AUTH_FIXTURE_PASSWORD`에 브리프의 픽스처 비밀번호를 설정한다.

## 5번 B / Admin 관리자 관리

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| 신규 행의 사업장 선택지와 저장 | pass | `GET /api/combo/plant` 200 응답에 `DEMO01`이 포함됐고 신규 행 선택지는 `시스템 관리` 1개였다. `POST /api/system/settings/adminuser/save`의 `newItems[0].plantCd`가 `ADMIN`이고 응답은 200 / `success=true`였다. 새로고침 후 `qa_a_156c933e`가 나타났으며 psql에서 `ADMIN` 소속 1행을 확인했다. |
| 일반 매장 코드 신규·수정 거부 | pass | 같은 저장 API에 `plantCd=DEMO01`로 신규 `newItems`와 위 QA 계정 수정 `updateItems`를 각각 보냈다. 둘 다 400 / 응답 키 `{data,error,message,success}`. psql 신규 대상 행 수 `0 → 0`. 수정 대상은 행 수 `1 → 1`이며 사업장, 이름, 수정 시각이 동일했다. |
| 매장 계정의 Admin 로그인 | pass | `demo_owner` 인증 200 후 `/admin/login`에 머물렀고 `클라이언트 로그인` 링크가 `/client/login`을 가리켰다. `/admin/main`에 직접 접근해도 `/admin/login`으로 돌아왔다. |
| SUPER_ADMIN의 Admin 로그인 | pass | `demo_admin` 인증 200 / `GET /api/auth/me` 200에서 `role=SUPER_ADMIN` / `/admin/main`의 `관리자 메인` 제목을 확인했다. |

## Client 주문 이력 / 옵션 표시

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| Consumer 옵션 주문 접수 | pass | `demo_owner`로 `AUTO-QA qa-a 156c933e` 태그 메뉴/옵션을 생성했다. 지정 QR로 `DEMO01` 1번 테이블 방문을 열고 Consumer 메뉴 상세에서 옵션명과 500원 가격을 확인했다. `POST /api/client/consumer/orders` 201 / `RECEIVED` / 2,500원. 주문 ID `01M875ATZEVDF8Z9MB8GT18EDG`, 주문번호 `2`. |
| Client 주문 이력 API의 옵션 문구 | pass | 화면이 호출한 `GET /api/client/order_manage/history/search` 200 / `{orderDetailHistory,orderMasterHistory}`. 상세 ID `01M875ATZF24NMRN3GG5THTMS8`의 `menuOption`은 `- AUTO-QA qa-a 156c933e Option500`이었다. |
| Client 주문 이력 화면의 옵션 문구 | pass | `/client/order/history/list`에서 주문번호 `2` 행과 옵션명이 표시됐다. 이전 실행(`29ee4532`)에서 실패한 화면 단언이 기존 선택자로 통과했다. `주문 내역` 열이 메뉴명과 옵션 문구를 표시한다. [목록 컴포넌트](../../frontend/src/apps/client/features/order-history/components/OrderHistoryTable.tsx#L43) |

## CON-03 / 주문 당시 단가 보존

전용 테이블/QR/메뉴/옵션에 태그 `AUTO-QA qa-a con03 be4532b3de`를 사용했다. 메뉴 2개에 옵션 1종을 선택해 2,600원 주문을 접수했다. 메뉴 단가는 1,000→1,377원, 옵션 단가는 300→500원으로 변경했다. 앱과 동일하게 조리/제공 완료를 거쳐 결제 미리보기의 `header/body/footer`를 넘겨 카드 결제 처리했다. 결제 API는 200 / `success=true`, DB의 방문/주문 상태는 `02/04`였다.

같은 카탈로그에서 별도 방문과 대조 주문을 생성하고 해당 주문의 메뉴/옵션 저장 단가만 PostgreSQL에서 NULL로 설정했다. 기존 데이터와 같은 조건을 재현했다. 표의 금액은 카탈로그 변경 전→후다. 기준일은 `2026-11-25`이고 금액 단위는 원이다.

| HTTP 조회 경로 / 확인 필드 | 시점 | 신규 주문 | NULL 대조 주문 | 결과 |
| --- | --- | --- | --- | --- |
| `/api/client/consumer/orders` / 대상 주문 `totalAmount` | 진행 중 | 2,600→2,600 | 2,600→3,754 | pass / 200 |
| `/api/client/consumer/orders/{orderId}` / `totalAmount`, 옵션 `unitAmount/lineAmount` | 진행 중 | 2,600→2,600 / 300→300 / 600→600 | 2,600→3,754 / 300→500 / 600→1,000 | pass / 200 |
| `/api/client/order_manage/status/search` / `footer.totalPrice`, 메뉴/옵션 `price` | 진행 중 | 2,600→2,600 / 2,000→2,000 / 600→600 | 2,600→3,754 / 2,000→2,754 / 600→1,000 | pass / 200 |
| `/api/client/order_manage/status/get_payment_complete` / `footer.totalPrice` | 진행 중 / 결제 후 | 양쪽 모두 2,600→2,600 | 양쪽 모두 2,600→3,754 | pass / 200 |
| `/api/client/order_manage/status/get_change_order` / `footer.totalPrice` | 진행 중 / 결제 후 | 양쪽 모두 2,600→2,600 | 양쪽 모두 2,600→3,754 | pass / 200 |
| `/api/client/order_manage/history/search` / `totalPrice`, `menuPrice`, `menuOption` | 결제 후 | 합계/상세 2,600→2,600 / 옵션 문구 단가 300→300 | 합계/상세 2,600→3,754 / 옵션 문구 단가 300→500 | pass / 200 |
| `/api/client/payment_manage/history/master/search` / `totalPrice` | 결제 후 | 2,600→2,600 | 2,600→3,754 | pass / 200 |
| `/api/client/payment_manage/history/detail/search/{masterSysId}` / `items`의 메뉴/옵션 단가 및 합계 | 결제 후 | 메뉴 1,000 / 2,000, 옵션 300 / 600 유지 | 메뉴 1,000→1,377 / 2,000→2,754, 옵션 300→500 / 600→1,000 | pass / 200 |
| `/api/client/payment_manage/settlement/search` / 총매출·순매출·일별 총매출·일별 순매출 | 결제 후 | 네 지표 각각 2,600→2,600 | 두 주문 합계 기준 네 지표 각각 5,200→6,354 / 복원 후 5,200 | pass / 200 |

- 결제 후 Consumer 목록/상세는 모두 410 / `success=false`, `data=null`이었다. 주문현황은 200 / 해당 주문 0행이었다. 카탈로그 변경 전후 같은 결과였다.
- 신규 주문(`01M875AF2Q9VYC69SC5VMMGTN7`)의 `order_detail.order_unit_price=1000`, `order_detail_option.order_unit_price=300`이 결제와 카탈로그 수정 후에도 유지됐다. 메뉴와 옵션의 저장 수량은 각각 2였다. 대조 주문(`01M875AGMRBWWB97G0XPGG5DKP`)의 두 단가는 NULL을 유지했다.
- 각 가격 변경 단계에서 저장 API로 1,000원/300원을 복원하고 PostgreSQL에서 확인했다. 테스트가 생성한 행은 정리 후 방문/주문/상세/옵션/멱등성/테스트 픽스처 감사 기록/테이블/QR/카탈로그를 확인한 12개 조회에서 모두 0건이었다.
- 재현은 위 환경을 설정한 뒤 `frontend`에서 실행한다. 정산은 매장 단위로 집계되므로 같은 매장/같은 날짜의 결제나 취소가 동시에 발생하면 차액에 합산된다. [CON-03 Playwright 명세](../../frontend/e2e-real/qa-a-con03-price.spec.ts)

## 정리와 확인 범위

- psql로 QA 관리자와 방문/주문/메뉴/옵션 픽스처를 정리했다. 관리자 및 카탈로그 대상 행은 0건이고, 지정 테이블의 방문 ID 목록은 실행 전과 같았다.
- `npx playwright test -c playwright.real.config.ts qa-a-regressions.spec.ts qa-a-con03-price.spec.ts --max-failures=0 --output test-results/real-qa-a` / 4 통과.
- `npm run typecheck` / `npx tsc --noEmit -p tsconfig.e2e.json` / `npx eslint e2e-real/qa-a-regressions.spec.ts e2e-real/qa-a-con03-price.spec.ts` / 모두 통과.
- 팀 서버 / 실제 카드 승인 / 동시 가격 수정과 주문·결제 경합은 미검증이다.
