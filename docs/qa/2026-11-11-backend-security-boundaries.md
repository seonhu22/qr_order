# 서버 보안 경계 보완

## 근거와 범위

- 사용자 허가: 비밀번호 초기화/메뉴 권한/로그인 잠금/결제 상세의 백엔드 수정 허용. DB 스키마 변경 제외.
- 실제 초기화 Controller는 요청 `userId`를 그대로 전달했고, 메뉴 API는 로그인 여부만 검사했다.
- 로그인은 `> 5`로 검사하고 증가 전 횟수를 응답했다.
- 결제 상세 SQL에는 결제번호만 있고 매장 조건이 없었다.
- 요청/응답 필드와 생성 타입을 유지하고 기존 세션/실패 횟수/매장 컬럼으로 보완했다. CSRF/잠금 해제 정책은 변경하지 않았다.

## 작은 커밋 순서와 이유

1. `1dd52869`: 초기화 두 경로의 세션 본인 검사. 타인 대상이면 변경 서비스 실행 전에 403.
2. `37e1f4f4`: `/api/client/menu_manage/**`에만 세션 `userRole=01` 검사. 주문/결제/직원호출은 유지.
3. `5d496b0e`: 다섯 번째 실패 응답을 5로 맞추고, 이미 5 이상이면 올바른 비밀번호도 거부.
4. `8c54977e`: 같은 계정 로그인은 `FOR UPDATE`로 직렬화. 예상된 `LoginFailException`에는 횟수 증가를 롤백하지 않음.
5. `7dc600b2`: 결제 상세의 Controller/Service/Mapper에 세션 매장 전달. SQL에서 `order_master` 매장 확인.
6. `e6e20f8d`: 실제 초기화 Controller 연결 테스트로 차단 시 서비스 미호출 확인.

실패 횟수는 프론트에서 보정하지 않는다. DB 행을 잠그는 트랜잭션이 없으면 동시 요청이 같은 이전 횟수를 읽을 수 있다. 일반 런타임 예외의 롤백은 유지했다.

## 검증 근거

- 수정 전 실패 재현: 본인 경계 2개/메뉴 경계 1개/로그인 임계값 2개/트랜잭션 설정 1개/결제 SQL 매장 조건 1개.
- 각 수정 후 관련 테스트 통과. 실제 WebConfig 경로와 결제 Controller → Service → Mapper 전달을 검증했다.
- 최종 `qrorder`에서 `.\gradlew.bat test --console=plain` 종료 코드 0 / 47개 파일 / 270개 테스트 / 실패와 오류와 건너뜀 0. 결과는 `qrorder/build/test-results/test/TEST-*.xml`에서 집계했다.
- 프론트 실행 코드는 이번 서버 보완에서 바꾸지 않았다. 전체 프론트 검증을 재실행했다고 보고하지 않는다.
- [초기화 테스트](../../qrorder/src/test/java/htms/QROrder/config/PasswordOwnerBoundaryTest.java), [메뉴 테스트](../../qrorder/src/test/java/htms/QROrder/config/ClientMenuBoundaryTest.java).
- [로그인 임계값](../../qrorder/src/test/java/htms/QROrder/auth/LoginLockServiceTest.java), [트랜잭션 설정](../../qrorder/src/test/java/htms/QROrder/auth/LoginTransactionContractTest.java), [결제 상세](../../qrorder/src/test/java/htms/QROrder/client/PaymentDetailStoreScopeTest.java).
- 읽기전용 독립 검토에서 아래 기존 버튼 호환성 영향을 확인했다. PostgreSQL 동작을 mock 테스트 통과로 대체하지 않았다.

## 정책 확인 대기 / 기존 버튼 영향

- 현재 초기화 두 경로 모두 본인만 허용한다. 기존 Admin/Client 사용자 관리의 타인 초기화 버튼은 403이 된다.
- 관리자 예외 허용 범위를 사용자에게 질문했다. 답변 전에는 임의의 관리자 우회를 추가하지 않는다.
- 이 항목은 최종 통합 완료가 아니다. 답변에 따라 서버 인가와 버튼 동작을 함께 마무리해야 한다.
- 결제 상세는 타 매장/없는 번호에 기존 목록 형식인 `200 []`를 반환하며 상세를 노출하지 않는다. 403/404 응답으로 바꿨다고 보고하지 않는다.

## 계약 영향 경계

| 경계 | 상태 |
| --- | --- |
| DB 스키마/제약 | 변경 없음 |
| 영속 매퍼 | 로그인 행 잠금/결제 매장 조건 수정. MyBatis SQL 생성 확인, 실제 PostgreSQL 미검증 |
| 백엔드 DTO/OpenAPI/생성 타입 | 필드/자료형 변경 없음. 실행 서버 명세 재조회 미실행 |
| 프론트 모델/응답/요청 매퍼/직렬화 | 변경 없음. 기존 숫자 실패 횟수 사용 |
| 세션 인가/서버 통합 테스트 | WebConfig/MockMvc/실제 Service 연결 검증. DB 경계는 mock |
| dev:real/DB 성공/동시성 | 아래 일괄 QA 대기 |

## 일괄 수동 QA와 운영 확인

1. 관리자 정책 답변 반영 후 본인 변경 성공/타인 변경 거부/허용된 관리자 초기화 확인.
2. 관리자 01의 메뉴 조회/저장 성공, 스태프 02의 직접 GET/POST 403. 기존 다른 업무 유지.
3. 전용 QA 계정과 복구 방법을 준비하고 1~4회/5회/정상 비밀번호 거부/해제 후 로그인 확인. 공유 계정을 잠그지 않는다.
4. 같은 전용 계정에 동시 실패 요청 후 DB 횟수와 응답 일치/증가 유지 확인. 트랜잭션 설정 테스트만으로 실제 커밋/잠금을 입증하지 않는다.
5. A매장 세션으로 A의 결제 상세 정상/B의 번호 `[]`/요청 매장값 위조 무효 확인.

백엔드 재시작 후 HTTP 401/403 비율과 로그인 500/잠금 대기를 확인한다. 정상 본인 변경/관리자 메뉴/동일 매장 결제까지 막히면 적용을 중단하고 해당 작은 커밋의 영향을 확인한다. 원격 push/공유 DB 실행은 하지 않았다.

수동 확인 대기: [프론트 TODO](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록).
