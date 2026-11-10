# QR Order 마감 TODO

> 기준일: 2026-11-10  
> 목적: 팀장 보고와 후속 작업 순서를 위한 프로젝트 공통 백로그  
> 원칙: 사용자 결정과 코드·문서 근거가 함께 확인된 항목만 기록한다. 구현되지 않은 항목은 현재 기능처럼 표현하지 않는다.

## 1. 우선순위 요약

| 순서 | 구분 | 작업 | 현재 상태 |
|---:|---|---|---|
| 1 | 보안 | 비밀번호 초기화 API 권한 경계 | 구현 필요 |
| 2 | 권한 | Client 관리자/스태프 업무 권한 정책 | 정책 확정, 구현 필요 |
| 3 | 인증 | 로그인 5회 실패 잠금 정합성 | 결함 수정 필요 |
| 4 | 인증 | 계정 잠금 해제 UX와 공식 연락처 | 저장소 내 결정 근거 재확인 필요 |
| 5 | 보안 QA | 결제 상세 조회의 매장 범위 검증 | 보안 테스트 우선 |
| 6 | QA | 사업자 인증 QA 우회 조건 갱신 | 테스트 데이터 확보 전까지 유지 |
| 7 | 운영 | 관리자 알림 실제 API 연동 | mock 제거 필요 |
| 8 | 동시성 | 주문 상태 변경 시각 계약 | 구현 필요 |
| 9 | 누락 | 사업장 조회 임시 필드 정리 | 계약/회원가입 매핑 확인 필요 |
| 10 | 누락 | 문의 수정일과 답변 첨부파일 | 구현 필요 |
| 11 | 기능 | 한정수량 모델/API 확정 및 구현 | 다음 기능 후보 1순위 |
| 12 | 문서 | 문서 드리프트 1차 정리 | 위 작업 착수 전 수행 |
| 13 | 후순위 | 공통코드·Consumer·플로어플랜·이미지 후속 | 아래 분류 참조 |
| 14 | 품질 | 핵심 브라우저 E2E | 기능 TODO 뒤, CI 앞 |
| 15 | 품질 | CI 전체 프론트 테스트와 lint | 최종 자동화 단계 |

## 2. 즉시 보완할 보안·권한·정합성

### SEC-01. 비밀번호 초기화 API 권한 경계

- 결정: 요청의 `userId`만 믿지 않는다. 일반 사용자의 `init-pwd-active`는 세션 사용자 본인만, 다른 사용자 초기화는 권한 있는 관리자 전용으로 분리하거나 서버에서 권한을 검증한다.
- 이유: 두 API가 요청 파라미터의 `userId`를 그대로 서비스에 전달하고, 현재 인터셉터는 로그인 여부만 확인한다.
- 완료 조건: 타인 `userId` 요청은 `403`, 본인 변경과 관리자 초기화는 정상이며 권한 경계 테스트가 있다.
- 근거: [LoginController](../../qrorder/src/main/java/htms/QROrder/auth/controller/LoginController.java), [WebConfig](../../qrorder/src/main/java/htms/QROrder/config/WebConfig.java), 사용자 결정(2026-11-10).

### AUTHZ-01. Client 업무 권한 정책

- 결정: `staffRole=01` 관리자만 메뉴 관리에 접근한다. 그 외 Client 업무는 현재 권한을 유지한다.
- 구현 범위: 메뉴 노출, 프론트 라우트 가드, 메뉴 관리 API 서버 권한 검사를 함께 적용한다. UI 숨김만으로 권한을 보장하지 않는다.
- 완료 조건: `02` 스태프의 직접 URL과 직접 API 요청이 모두 차단되고 `01`은 정상 동작한다.
- 근거: [인증 문서의 권한 필드 구분](../../frontend/docs/auth.md#4-authme-권한-필드-사용-기준), 현재 서버 권한 검사가 `/api/system/**` 중심인 [WebConfig](../../qrorder/src/main/java/htms/QROrder/config/WebConfig.java), 사용자 결정(2026-11-10).

### AUTH-01. 로그인 5회 실패 잠금 정합성

- 결정: 다섯 번째 실패 요청부터 잠금 응답을 반환하고 프론트 잠금 안내를 표시한다.
- 현재 문제: 서버는 조회된 횟수가 `> 5`인지 먼저 검사하고, 실패 횟수를 증가시킨 뒤 증가 전 값을 예외에 담는다. 문서/UI의 `>= 5` 계약과 어긋난다.
- 완료 조건: 1~4회는 일반 실패, 5회째는 증가 후 값 `5`와 잠금 응답, 이후 올바른 비밀번호도 해제 전까지 거부한다.
- 근거: [LoginService](../../qrorder/src/main/java/htms/QROrder/auth/service/LoginService.java), [인증 문서](../../frontend/docs/auth.md#6-password_fail_cnt-계정-잠금-흐름), 사용자 결정(2026-11-10).

### AUTH-02. 계정 잠금 해제 UX와 공식 연락처

- 상태: **재확인 필요**. 현재 문서와 최초 정책 커밋 `1f95ebdd` 모두 잠금 해제 API를 “추후 확정”, 연락처를 임시 `admin@qrorder.co.kr`로 기록한다.
- 필요한 결정: 해제 주체, 본인 확인 수단, 실패 횟수 초기화 시점, 공식 문의 연락처, 관리자 초기화와 잠금 해제의 관계.
- 완료 조건: 결정 문서 갱신 후 UI/API/운영 절차가 같은 정책을 사용한다.
- 근거: [인증 문서](../../frontend/docs/auth.md#6-password_fail_cnt-계정-잠금-흐름), 최초 정책 커밋 `1f95ebdd`.

### SEC-02. 결제 상세 조회 매장 범위 보안 테스트

- 현재 위험: 결제 목록 조회는 세션의 `sysPlantCd`를 전달하지만 상세 조회는 `masterSysId`만 서비스에 전달한다.
- 우선 작업: A매장 세션으로 B매장 `masterSysId` 상세 조회를 시도한다. 재현되면 mapper까지 `sysPlantCd`를 전달해 `404` 또는 `403`으로 차단한다.
- 완료 조건: 교차 매장 조회 실패와 같은 매장 조회 성공을 서버 통합 테스트 및 `dev:real`로 확인한다.
- 근거: [PaymentManageController](../../qrorder/src/main/java/htms/QROrder/client/controller/PaymentManageController.java), 사용자 결정(2026-11-10).

### AUTH-03. CSRF 운영 전환 정책

- 결정: 개발 단계에서는 비활성 상태를 유지한다.
- 운영 전 조건: 세션 쿠키 기반 변경 API의 CSRF 방어 방식과 허용 origin을 별도 보안 체크리스트에서 확정한다.
- 근거: 사용자 결정(2026-11-10), [SecurityConfig](../../qrorder/src/main/java/htms/QROrder/config/SecurityConfig.java).

### QA-01. 사업자 인증 QA 우회 유지 조건 갱신

- 결정: 유효한 테스트 사업자 데이터 확보 전까지 로컬 개발 우회를 유지한다.
- 보완: 기존 “4주 경과 시 제거” 조건은 폐기하고, 테스트 데이터 또는 mock NTS 제공 시 제거하도록 문서와 코드 주석을 맞춘다.
- 안전 조건: `DEV`와 명시적 환경변수와 HTTP 400의 AND 조건, 운영 번들 제외를 유지한다.
- 근거: [QA 우회 문서](../../frontend/docs/qa-bypass-business-verification.md), 사용자 결정(2026-11-10).

## 3. 누락 기능과 실제 API 전환

### OPS-01. 관리자 알림 실제 API 연동

- 현재 상태: 관리자 알림은 로컬 mock 상태로만 동작한다.
- 범위: 공지/문의 답변 알림 조회, 미확인 수, 개별/전체 확인 API와 갱신 정책을 정하고 실제 Query 훅으로 교체한다.
- 완료 조건: 새로고침 후 미확인 상태가 복원되고 mock 파일을 런타임에서 사용하지 않는다.
- 근거: [useManagerNotificationCenterMock](../../frontend/src/apps/client/features/notification-center/hooks/useManagerNotificationCenterMock.ts), [ClientLayout](../../frontend/src/apps/client/layout/ClientLayout.tsx).

### ORDER-01. 주문 상태 변경 시각 계약

- 목적: 다중 사용자가 상태를 바꿔도 카드 정렬과 최신 상태 판단이 서버의 단일 시각을 사용하게 한다.
- 현재 상태: DB의 `order_group.modify_datetime`은 갱신되고 조회 SQL은 `update_datetime`으로 내리지만, 프론트는 별도 `statusChangedAt` 계약을 기다린다.
- 범위: 응답 필드 의미와 형식을 확정하고 DTO/OpenAPI/generated type/mapper/UI 정렬까지 연결한다.
- 완료 조건: 서로 다른 두 Client에서 상태 변경 후 동일한 순서로 수렴한다.
- 근거: [StatusMapper.xml](../../qrorder/src/main/resources/mapper/client/StatusMapper.xml), [orderStatusBoardMapper](../../frontend/src/apps/client/features/order-status-management/api/orderStatusBoardMapper.ts), [주문현황 문서](../../frontend/docs/page/order-status-management.md).

### PLANT-01. 사업장 조회 임시 필드와 회원가입 계약 정리

- 현재 상태: 사업장 검색 화면의 일부 필드는 DB 미존재라고 명시되어 있고, Admin 사용자 화면에는 임시 사업장 옵션이 남아 있다.
- 선행 조사: 회원가입 입력값 → `SignUpRequest` → DB 저장 → 사업장 조회 DTO의 필드별 연결표를 작성한다.
- 결정: 실제 저장 필드는 API에 연결하고, 저장하지 않는 표시용 필드는 제거하거나 명확히 파생한다. 확인 전 DB 컬럼을 추측해 추가하지 않는다.
- 완료 조건: 회원가입 값의 저장/조회 왕복 테스트와 임시 fallback 제거 여부가 기록된다.
- 근거: [plantSearch types](../../frontend/src/apps/admin/features/plant-search/types.ts), [plantSearch API](../../frontend/src/apps/admin/features/plant-search/api/plantSearchApi.ts), [Admin 사업장 fallback](../../frontend/src/apps/admin/features/admin-user/constants.ts).

### QNA-01. 문의 수정일과 답변 첨부파일

- 수정일: `brd_qna.modify_datetime`을 조회 SQL/DTO/OpenAPI/프론트 매핑까지 노출한다.
- 첨부파일: 답변 저장 FormData의 파일 계약과 파일 소유 관계를 확정한 뒤 저장/재조회/다운로드를 연결한다.
- 완료 조건: 답변 수정 후 수정일이 갱신되고, 첨부파일을 저장한 뒤 새로고침해도 조회된다.
- 근거: [inquiryManageApi](../../frontend/src/apps/admin/features/inquiry-manage/api/inquiryManageApi.ts), [InquiryManagePage](../../frontend/src/apps/admin/pages/inquiry-manage/InquiryManagePage.tsx).

### PRODUCT-01. 한정수량 모델과 API

- 우선순위: 다음 신규 기능 후보 1순위.
- 선행 결정: 수량 소유 단위(메뉴/옵션, 매장/영업일), 차감 시점(주문 접수/결제), 취소 복원, 동시 주문 원자성, 품절과 사용중지의 차이를 먼저 확정한다.
- 완료 조건: 동시 주문에서도 잔여 수량이 음수가 되지 않고 Consumer 표시와 주문 생성 검증이 같은 재고를 사용한다.
- 근거: UI에는 한정수량 배지 표현만 있는 [Consumer 주문 문서](../../frontend/docs/page/consumer-order.md), 사용자 결정(2026-11-10).

## 4. 공통코드 작업 묶음

공통코드는 코드값, 표시명, 사용 여부, 순서를 서버에서 관리해야 여러 화면이 같은 선택지를 사용한다. 각 항목은 먼저 마스터 코드와 상세 코드 목록을 확정한 뒤 Admin 공통코드 등록 → 조회 API → 화면 옵션 매핑 → 저장 검증 순으로 진행한다.

| ID | 대상 | 현재 상태 | 다음 결정/작업 | 근거 |
|---|---|---|---|---|
| CODE-01 | 직원호출 선택 방식 | `singleYn` 저장은 되지만 UI는 고정 Y/N | 단건/다건 공통코드 마스터·상세 등록 후 셀렉트 연결 | [직원호출 문서](../../frontend/docs/page/staff-call-management.md) |
| CODE-02 | 취소 사유 | 프론트 정적 목록 | `cancel_type` 코드/명칭 확정, 서버 허용값 검증과 UI 조회 연결 | [주문현황 문서](../../frontend/docs/page/order-status-management.md) |
| CODE-03 | 미결제 사유 | 프론트 정적 목록과 서버 허용 목록 | 기존 값의 공통코드 전환 및 `OTHER` 상세 입력 규칙 유지 | [결제 플랜](./2026-09-14-001-fix-client-visit-payment-flow-plan.md) |
| CODE-04 | 테이블 배치 객체/시설 종류 | `objectType`, `tableType`, 이름 매칭 일부가 mock 우선 | 값 체계와 source of truth를 공통코드로 확정 후 API/DB/UI 연결 | [테이블 배치 문서](../../frontend/docs/page/table-layout-management.md) |

직원호출의 `useYn`과 `ordNo`는 최소 컬럼 유지 결정에 따라 현재 범위에서 제외한다. 최초 등록순을 유지한다.

## 5. Consumer 후순위와 보류

| ID | 작업 | 상태와 재개 조건 | 근거 |
|---|---|---|---|
| CON-01 | 메뉴별 요청사항 `requestNote` | 보류. 재개 시 메뉴 상세 입력 → 주문 저장 → 주문 조회 → Client 주문 상태 카드 표시까지 한 계약으로 구현 | [Consumer 주문 문서](../../frontend/docs/page/consumer-order.md), [MVP 구현 계획](../specs/consumer-mvp/implementation-plan.md) |
| CON-02 | 외부 QR PIN 차단 | 방식은 선택형 PIN으로 결정. 우선순위는 낮으며 UX와 PIN 발급/만료/재인증 계약부터 작성 | [정책 결정](../specs/consumer-mvp/policy-decisions.md), 사용자 결정(2026-11-10) |
| CON-03 | 가격 변경과 주문 가격 보존 | 보류. 주문 당시 가격 스냅샷 저장 구조와 가격 변경 이력 정책이 준비될 때 재개 | 사용자 결정(2026-11-10) |
| CON-04 | 결제 완료 후 최종 화면 | 현재 실제 동작을 `dev:real`에서 관찰한 뒤 상태 문구, 새 방문 시작 조건, 장바구니 정리를 문서화 | [실시간 계약표](../specs/realtime-contract-matrix.md), 사용자 결정(2026-11-10) |
| CON-05 | 서버 영속 멱등성 | 단일 서버 범위에서는 메모리 10분 정책 유지. 재시작 복구 또는 다중 서버 도입 시 DB/공유 저장소로 전환 | [멱등성 플랜](./2026-09-14-003-feat-consumer-ttl-idempotency-plan.md), [정책 결정](../specs/consumer-mvp/policy-decisions.md) |

## 6. 운영 화면과 인프라 후순위

| ID | 작업 | 다음 단계 | 근거 |
|---|---|---|---|
| UI-01 | 읽기 전용 테이블 플로어플랜 | 기존 `table_gui` 좌표를 재사용하는 별도 조회 화면 설계 | [테이블 배치 문서](../../frontend/docs/page/table-layout-management.md#플로어플랜-재사용-시-데이터-처리-가이드-향후-작업) |
| PERF-01 | 이미지 전송 최적화 2단계 | 이미지 저장/공급 서버와 썸네일 URL·포맷 계약을 먼저 정한 뒤 `srcSet`/`sizes`와 LCP 측정 | [프론트 TODO](../../frontend/docs/todo.md#메뉴-이미지-전송-최적화) |

로컬 파일만 제공하는 현재 구조에서는 프론트의 `lazy` 속성만으로 전송량 감소를 보장할 수 없다. 이미지 서버 계획이 없으므로 PERF-01은 인프라 결정 전까지 보류한다.

## 7. 문서와 품질 마감 순서

### DOC-01. 문서 드리프트 1차 정리

- 시점: 이 백로그 확정 직후.
- 범위: 완료된 인증 TODO, 오래된 mock/stub 설명, 테스트 개수, `authResponse.ts`의 오래된 TODO, README 구현 현황을 실제 코드에 맞춘다.
- 완료 조건: 문서 내부 링크 검사와 코드 검색에서 완료 기능을 미완료로 안내하는 기록이 없다.
- 근거: [frontend decisions](../../frontend/docs/decisions.md), [authResponse](../../frontend/src/shared/auth/authResponse.ts), [루트 README](../../README.md).

### E2E-01. 핵심 브라우저 E2E

- 시점: 위 기능 TODO를 마친 뒤, CI 확대 직전.
- 의미: 사람이 클릭하던 로그인 → 메뉴 조회 → 주문 → 상태 변경 → 결제/종료의 핵심 흐름을 실제 브라우저가 반복 실행하고 화면, 네트워크, 상태를 검증한다.
- 시작 범위: 인증 1개, Consumer 주문 1개, Client 주문처리/결제 1개만 만든다. DB 데이터 준비와 정리 전략을 먼저 정한다.
- 도구 결정: 기존 Vitest/MSW는 컴포넌트 테스트이므로 브라우저 E2E 도구(예: Playwright)는 별도 검토한다.
- 완료 조건: 독립 실행 가능한 핵심 시나리오와 실패 증거(스크린샷/trace)가 남는다.

### CI-01. CI 전체 프론트 테스트와 lint

- 시점: 최종 자동화 단계.
- 현재 상태: CI는 build/typecheck와 직원호출 관련 일부 테스트만 실행하며 전체 `npm test`와 `npm run lint`는 실행하지 않는다.
- 작업: 실행 시간과 flaky 테스트를 정리한 뒤 lint, 전체 테스트, 필요하면 핵심 E2E를 단계별 job으로 추가한다.
- 완료 조건: PR에서 lint/전체 단위·통합 테스트 실패가 병합을 막고, 로컬과 CI 명령이 문서에 동일하게 적힌다.
- 근거: [CI workflow](../../.github/workflows/ci.yml), [CI 정책](../../CI_POLICY.md), [frontend package scripts](../../frontend/package.json).

## 8. 이번 백로그에서 제외한 항목

- 공용 IconButton 도입, 에러 페이지 이미지 에셋, 관리자 삭제 최초 경고는 개선 아이디어이지만 현재 기능 결함이나 확정 요구가 아니므로 마감 필수 TODO에서 제외한다.
- 공지사항의 `sysId` 없는 저장 의미는 기존 생성/수정 계약을 별도로 검토할 때 다룬다.
- Flyway/Liquibase 등 DB 마이그레이션 도구 도입은 사용자 결정에 따라 범위에서 제외한다.

## 9. 보고용 결론

- 마감 전 필수 범위는 보안·권한 5건, QA 우회 조건 1건, 실제 API/누락 계약 4건, 문서 정리 1건이다.
- 다음 신규 기능은 한정수량이며, 데이터 모델과 동시성 계약을 먼저 확정해야 한다.
- PIN, 요청사항, 가격 스냅샷, 영속 멱등성, 플로어플랜, 이미지 서버는 요구는 남아 있지만 현재 마감 필수 범위가 아니다.
- E2E는 후순위 두 번째, CI 전체 자동화는 마지막에 진행한다.
