# QR Order 마감 TODO

기준일 2026-11-24 / dev `7a92a024`. 상태는 코드와 기록된 검증 범위에 따라 표시한다. 로컬 실서버 QA는 PostgreSQL `qrdemo` 사본과 로컬 프론트/백엔드에서 수행했다.

- [후속 작업 / 사용자 관리·공지·자동 QA·Client 첫 화면](./2026-11-17-followup-work-backlog.md)
- [프론트 QA 체크리스트](../../frontend/docs/todo.md#로컬-사본-db-qa-결과와-남은-확인)
- [인증 QA](../qa/2026-11-24-local-real-qa-auth.md) / [운영 QA](../qa/2026-11-24-local-real-qa-ops.md) / [로컬 환경 보정](../qa/2026-11-24-local-real-qa-env.md)

## 구현과 검증 현황

| ID | 상태 | 확인 내용과 근거 |
|---|---|---|
| SEC-01 | 구현 / 로컬 사본 DB QA 통과 | 동일 매장 관리자만 스태프 초기화 가능. 금지 대상/행위자 403, 실패 횟수 복구와 강제 변경, 본인 변경 및 Admin 지원을 확인했다. [초기화 구현](../qa/2026-11-11-store-staff-password-reset.md) / [인증 재검증](../qa/2026-11-24-local-real-qa-auth.md#재검증-2026-11-24) |
| SEC-02 | 구현 / 로컬 사본 DB QA 통과 | 자기 매장 상세는 정상 조회. 타 매장 상세는 양방향으로 `200 []`이며 URL의 `sysPlantCd`를 바꿔도 동일했다. [결제 상세 QA](../qa/2026-11-24-local-real-qa-auth.md#sec-02--결제-상세-매장-범위) |
| AUTHZ-01 | 구현 / 로컬 사본 DB QA 통과 | 관리자 메뉴/옵션 조회, 스태프 직접 URL/GET/POST 차단과 기존 업무 접근을 확인했다. 내비게이션은 로컬 카탈로그 보정 후 검증했다. [메뉴 권한 QA](../qa/2026-11-24-local-real-qa-auth.md#authz-01--메뉴-관리-권한) |
| AUTH-01 | 구현 / 로컬 사본 DB QA 통과 | 다섯 번째 실패 응답, 동시 실패 누적, 잠긴 계정의 올바른 비밀번호 거부와 테스트 계정 복구를 확인했다. [로그인 제한 QA](../qa/2026-11-24-local-real-qa-auth.md#auth-01--로그인-제한) |
| OPS-01 | 구현 / 로컬 사본 DB QA 통과 | 실제 공지/문의 답변과 스태프 호출, 브라우저 로컬 읽음 복원 및 계정/매장/탭 범위를 확인했다. 빈 상태와 장애 화면은 응답을 주입해 검증했다. [운영 QA](../qa/2026-11-24-local-real-qa-ops.md#ops-01) |
| ORDER-01 | 구현 / 로컬 사본 DB QA 통과 | `statusChangedAt`의 OpenAPI 정의, 상태 전환/되돌리기 시 DB와 응답 일치, 두 창 새로고침 후 카드 순서와 신규 주문의 null을 확인했다. [주문 시각 QA](../qa/2026-11-24-local-real-qa-ops.md#order-01) |
| PLANT-01 | 구현 / 로컬 사본 DB QA 통과 | 대표자명은 DB `emp_nm`, 담당자/접속 URL 미제공은 `-`로 표시한다. Admin 사업장 옵션과 저장은 검증했고 관리자 목록은 승인된 `plant_cd='ADMIN'` 범위를 따른다. [운영 재검증](../qa/2026-11-24-local-real-qa-ops.md#재검증-2026-11-24) |
| QNA-01a | 구현 / 로컬 사본 DB QA 통과 | 신규 수정일 `-`, Client 수정과 Admin 답변 후 응답/화면/DB를 확인했다. Admin 조회 범위와 Client 수정 경로를 보완했다(`708356f1`). [운영 재검증](../qa/2026-11-24-local-real-qa-ops.md#재검증-2026-11-24) |
| QNA-01b | 구현 / 로컬 사본 DB QA 통과(PNG) | 원문 저장과 답변 첨부를 분리해 저장/재조회/다운로드, 실패 후 재시도, 파일 한도를 확인했다. TXT 응답 시간/PDF 변환 결과와 Admin 메뉴 진입은 미확인이다. [운영 재검증](../qa/2026-11-24-local-real-qa-ops.md#재검증-2026-11-24) |
| QNA 삭제 범위 | 구현 | Client 문의 삭제를 같은 매장/작성자의 활성 문의로 제한하고 변경 0건이면 404를 반환한다(`02c1ef4f`). [계약 테스트](../../qrorder/src/test/java/htms/QROrder/client/ClientQnaContractTest.java) |
| CON-01 | 입력 제거 완료 | 주문 확인 모달의 저장되지 않던 요청사항 입력과 상태를 제거했다(`26620502`). [Consumer 주문](../../frontend/docs/page/consumer-order.md) |
| CON-04 | 구현 / 로컬 사본 DB QA 통과 | 카드 결제 후 `CLOSED` 안내와 장바구니 초기화, 같은 QR 재스캔 시 빈 상태의 새 방문을 확인했다. [방문 마감 QA](../qa/2026-11-24-local-real-qa-ops.md#con-04) |
| CODE-00 | 보고 완료 | 화면별 공통코드 연결/고정값/등록 필요 범위를 조사했다. [연결 현황 보고](../qa/2026-11-24-common-code-connection-report.md) |
| CI-01 | workflow 연결 완료 / 원격 확인 대기 | lint, 전체 Vitest, Playwright 회귀 job과 실패 증거 저장을 연결했다. GitHub Actions 실행 결과와 required check 설정은 확인 대기다. [workflow](../../.github/workflows/ci.yml) / [자동화 기록](../qa/2026-11-10-frontend-quality-automation.md) |
| DOC-01 | 백로그와 README 정리 | 인증 응답 주석 정리(`e0d87968`)에 이어 최신 구현과 로컬 QA 범위, 남은 확인을 백로그와 README에 반영했다. |

### QA-01. 사업자 인증 QA 우회 유지 조건 갱신

- 로컬 개발 우회는 `DEV`, 명시적 환경변수, HTTP 400 조건으로 제한한다. 유효한 테스트 사업자 또는 QA NTS mock을 확보하면 우회를 끄고 사업자/이메일 검증과 최종 가입을 확인한다. [우회 제거 조건](../../frontend/docs/qa-bypass-business-verification.md#제거-조건)

## 범위 제외

- Flyway/Liquibase 등 DB 마이그레이션 도구 도입은 사용자 결정에 따라 범위에서 제외한다.
- 공용 IconButton, 에러 페이지 이미지 에셋, 관리자 삭제 최초 경고는 마감 필수 TODO가 아니다.
- 공지사항의 `sysId` 없는 저장 의미는 기존 생성/수정 계약을 검토할 때 다룬다.

## 팀 서버 검증 대기

- 공유 DB에 공지 대상 컬럼을 적용한 뒤 팀 서버에서 역할별 알림을 검증한다. 팀 서버의 메뉴 카탈로그와 직원호출 공통코드도 확인한다. [공지 적용 순서](../qa/2026-11-18-notice-audience-integration.md) / [로컬 환경 보정](../qa/2026-11-24-local-real-qa-env.md)
- 기존 계정 확인과 팀 운영 DDL/부하, 주문 생애주기 자동 QA의 남은 항목은 [후속 작업](./2026-11-17-followup-work-backlog.md)에서 관리한다.

## 제품 담당자 질문 / 결정 대기

- AUTH-02 / 잠금 해제 주체, 본인 확인, 실패 횟수 초기화 시점, 관리자 초기화와의 관계 및 공식 연락처는 무엇인가? [로그인 잠금 흐름](../../frontend/docs/auth.md#6-password_fail_cnt-계정-잠금-흐름)
- AUTH-03 / 운영에서 세션 쿠키를 쓰는 변경 API에 어떤 CSRF 방어와 허용 origin을 적용할 것인가? [현재 보안 설정](../../qrorder/src/main/java/htms/QROrder/config/SecurityConfig.java)
- AUTH-STAFF-INIT / `init_yn=N`으로 남은 기존 스태프에게도 최초 비밀번호 변경을 요구할 것인가? [기존 계정 관찰](../qa/2026-11-17-staff-login-store-binding.md#경계와-남은-확인)
- 팀 초기 비밀번호 / 팀 서버의 `auth.default-password`가 Client 안내 `SN111111`과 일치하는가? [로컬 환경 보정](../qa/2026-11-24-local-real-qa-env.md)
- USER-02 / 시스템 관리자 전용 승격 UI를 Admin의 어느 화면에 배치할 것인가? [승격 API 검증](../qa/2026-11-16-client-user-authorization.md)
- Admin 신규 사용자 / 사업장 선택지를 관리자 목록 범위(`ADMIN`)로 제한할 것인가? [사업장 선택 재검증](../qa/2026-11-24-local-real-qa-ops.md#재검증-2026-11-24)
- 공용 첨부 삭제 / 삭제 조건을 파일 식별자 외에 소유 범위로도 제한할 것인가? [FileMapper.xml:106](../../qrorder/src/main/resources/mapper/common/FileMapper.xml#L106)
- Admin 공지 삭제 / 이미 삭제된 공지를 제외하는 활성 조건이 필요한가? [NoticeMapper.xml:74](../../qrorder/src/main/resources/mapper/system/NoticeMapper.xml#L74)
- OPS-02 / 알림 읽음을 기기 간에 동기화할 것인가? 계정/매장별 저장 범위는 어떻게 정할 것인가? [알림 검증 범위](../../frontend/docs/page/manager-notifications.md)
- PLANT-02 / 일반 가입에서 사업장명을 어떻게 수집하고 계정 이메일과 사업장 이메일을 동기화할 것인가? [가입/조회 연결표](../qa/2026-11-10-plant-search-contract.md)
- CODE-01 / 현재 `singleYn` Y/N 선택을 공통코드로 전환할 것인가? [공통코드 보고](../qa/2026-11-24-common-code-connection-report.md#후속-작업-매핑)
- CODE-02 / 취소 사유를 공통코드로 관리할 것인가? [공통코드 보고](../qa/2026-11-24-common-code-connection-report.md#후속-작업-매핑)
- CODE-03 / `OTHER` 상세 입력 규칙을 유지하며 미결제 사유를 공통코드로 전환할 것인가? [공통코드 보고](../qa/2026-11-24-common-code-connection-report.md#후속-작업-매핑)
- CODE-04 / 기존 배치의 이름 매핑을 유지하면서 객체/시설 종류를 공통코드로 전환할 것인가? [공통코드 보고](../qa/2026-11-24-common-code-connection-report.md#후속-작업-매핑)
- PRODUCT-01 / 한정수량을 도입할 것인가? 수량 단위, 차감 시점, 취소 복원과 품절 정책은 어떻게 정할 것인가? [Consumer 메뉴 표시](../../frontend/docs/page/consumer-order.md)
- CON-02 / 외부 QR에 선택형 PIN을 언제 적용하고 발급/만료/재인증 규칙을 어떻게 정할 것인가? [Consumer 정책](../specs/consumer-mvp/policy-decisions.md)
- CON-03 / 주문 당시 가격을 보존할 것인가? 가격 변경 후 기존 주문 조회와 결제에는 어떤 값을 쓸 것인가? [현재 주문 조회 매퍼](../../qrorder/src/main/resources/mapper/consumer/order/ConsumerOrderMapper.xml#L111)
- CON-05 / 서버 재시작/다중 서버에서도 중복 주문을 막기 위해 멱등성 키를 영속화할 것인가? [현재 멱등성 정책](./2026-09-14-003-feat-consumer-ttl-idempotency-plan.md)
- PERF-01 / 이미지 크기별 URL/포맷을 서버나 CDN에서 제공할 것인가? [이미지 최적화](../../frontend/docs/todo.md#메뉴-이미지-전송-최적화)
- UI-01 / 기존 테이블 배치를 재사용하는 읽기 전용 플로어플랜을 제공할 것인가? [테이블 배치](../../frontend/docs/page/table-layout-management.md)
