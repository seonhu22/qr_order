---
title: 사용자 관리의 매장 격리와 시스템 관리자 전용 승격
type: fix
status: active
date: 2026-11-16
---

# 사용자 관리 권한 보완 플랜

## 요약 / 확정 정책

사용자 결정(2026-11-16): 기존 설계인 “Client 관리자는 본인 매장 스태프만 관리하고, 시스템 관리자만 관리자 승격”을 서버와 프론트에서 강제한다.
구현 방식은 A안으로 확정한다. 기존 API/Service/Mapper를 유지하며 인가/대상 범위를 보완하고 승격 API만 별도 추가한다.
이 문서는 구현 전 계획이다. 코드 변경/실제 DB 검증이 완료됐다는 뜻이 아니다.

- 시스템 관리자: 별도 API로 일반 매장 스태프 `02`를 Client 관리자 `01`로 승격.
- Client 관리자: 같은 매장 스태프 등록/수정/삭제/비밀번호 초기화만 허용. 관리자 행은 변경 불가.
- 스태프: 사용자 관리/역할 변경 불가. 주문/결제/직원호출 등 기존 업무 권한은 유지.
- 일반 사용자 저장 API: 역할 승격/매장 이동 불가. 시스템 관리자도 승격은 별도 API 사용.
- 관리자 비밀번호 초기화는 기존 수동 이메일 요청/시스템 관리자 지원 절차 유지.

---

## 문제 근거

- `qrorder/src/main/java/htms/QROrder/client/controller/StoreManageController.java`: 등록/수정/삭제에 로그인 세션은 사용하지만 요청자 역할 검사가 없음.
- `qrorder/src/main/resources/mapper/client/ClientUserMapper.xml`: 등록은 요청의 `plantCd/userRole` 사용. 수정은 `userRole` 갱신, 수정/삭제는 대상 매장 조건 누락.
- `qrorder/src/main/java/htms/QROrder/auth/service/LoginService.java`: 매장 코드가 `ADMIN`인 계정은 로그인 시 시스템 관리자 역할을 받음. 등록 요청의 매장 변조는 특히 위험함.
- `frontend/src/apps/client/features/client-user/api/clientUserApi.ts`: 화면의 역할/매장을 요청에 전달하므로 UI 제한만으로 방어할 수 없음.
- 로그인 시 저장한 역할만 검사하면 DB 역할 변경/삭제 후 기존 세션이 오래된 권한을 유지할 수 있음.
- 위는 코드 검사 근거이며, 공유 DB에 공격 요청을 실행해 재현한 결과는 아님.

---

## 요구사항

- R1. 요청자는 세션으로 식별하고 현재 DB의 존재/미삭제/매장/역할을 인가 근거로 사용한다.
- R2. Client 사용자 관리는 관리자01만 접근하며 같은 매장의 스태프02만 변경한다.
- R3. 등록 매장/역할은 서버가 결정하고 일반 수정으로 역할/매장/아이디를 바꾸지 않는다.
- R4. 관리자 승격은 시스템 관리자 전용 API에서 `02 → 01`만 수행한다.
- R5. 잘못된 요청과 일괄 삭제 실패는 변경을 남기지 않으며, 기존 세션/일반 업무를 회귀 검증한다.
- R6. DB 스키마/인프라를 변경하지 않고 테스트와 실제 서버 QA를 구분해 기록한다.

## 범위 / 제외

- 포함: Client 사용자 목록/등록/수정/삭제/초기화, 현재 권한 확인, 승격 API, Client 화면과 관련 계약/테스트.
- 제외: 역할 강등/매장 이전/소유권 양도/자동 이메일/CSRF 정책 변경/새 권한 테이블/Redis.
- 승격 전용 Admin 화면은 별도 후속이다. 이번 승격 API는 인증된 시스템 관리자 세션과 Swagger 또는 개발자 도구로 QA한다. 화면까지 제공했다고 보고하지 않는다.
- 이미 열린 SSE 연결의 즉시 강제 종료는 제외한다. 역할/삭제 반영은 다음 인증된 HTTP 요청을 기준으로 한다.
- 과거 비정상 계정이 있는지 읽기 전용으로 확인하되 기존 계정을 자동 삭제/보정하지 않는다.

---

## 기술 선택 / 다른 방법을 쓰지 않는 이유

1. 기존 세션/MyBatis/CommonResponse 재사용: 현재 프로젝트 구조에 맞고 DB/운영 시스템 추가 없이 보완 가능하다.
2. 로그인 식별자는 세션, 현재 권한은 DB: 프론트 값과 오래된 세션 역할을 신뢰하지 않는다. 직원 API에 가벼운 권한 조회 비용이 추가되지만 무효화 인프라보다 단순하다.
3. 권한 조회는 별도 최소 필드 조회: 로그인 실패 횟수용 `FOR UPDATE` 조회를 일반 요청마다 재사용하지 않는다. `/auth/me`의 사용자/초기화 필드 계약도 보존한다.
4. Service 인가와 SQL 조건을 함께 적용: 경로 검사만 추가하면 다른 진입점/대상 ID 변조를 놓칠 수 있다.
5. 일반 정보 수정과 승격 API 분리: 이름 저장에 역할 변경이 섞이지 않아 승인/테스트/추적 범위가 명확하다.
6. Client 관리자에게 승격을 허용하는 안은 제외: 사용자 확정 정책에 어긋나며 초기화 권한 경계도 복잡해진다.

### 검토한 구현 대안

- A안 / 채택: 기존 구조에 공통 인가와 SQL 범위 조건을 보완. 현재 결함을 작은 변경으로 막고 단계별 리뷰가 가능하다.
- B안 / 보류: 모든 사용자 API/DTO 재설계. 요청 의도는 명확해지지만 생성 타입/프론트/QA 변경이 커진다. 기존 API에 필드 허용 목록과 검증을 적용해 먼저 방어한다.
- C안 / 보류: Spring Security 중심의 전면 인가 통합. 정책 확장에는 유리하지만 기존 세션/인터셉터 이관이 필요하고 매장 검사도 여전히 필요하다.
- 이는 구현 방식의 비교다. 어떤 방식을 택해도 “시스템 관리자만 승격”이라는 정책은 바뀌지 않는다.

### 성능 검증 / 1만 사용자 가정의 한계

- 가입자 수만으로 처리량을 보장하지 않는다. 실제 활성 사용자/초당 API 요청/조회와 쓰기 비율/SSE 연결 수를 구분한다.
- 같은 요청 안에서 요청자 권한 조회는 한 번 수행하고 후속 계층은 해당 요청의 결과를 재사용한다. 요청 간 오래된 역할 캐시는 도입하지 않는다.
- 사용자 ID 조회 인덱스는 실제 스키마/실행 계획으로 확인한다. 다건 대상은 일괄 조회하고 대상별 반복 조회를 피한다.
- 정상 권한 조회에 행 잠금을 추가하지 않는다. 삭제/승격 등 변경 경합 경로만 필요한 트랜잭션/잠금을 사용한다.
- 전용 QA 환경에서 변경 전후 SQL 횟수/응답 p95와 p99/DB 연결 대기를 비교한다. 부하와 목표 지연을 정한 후 평가하며 “1만 사용자 수용 완료”로 추정 보고하지 않는다.

## API 계약 방향

기존 Client 접두사: `/api/client/store_manage/user_manage`.

- `GET /search`: 관리자만 자기 매장 목록 조회. 관리자 행도 표시하되 Client에서는 읽기 전용.
- `POST /new`: 매장=서버의 현재 매장, 역할=02. 누락값은 서버 기본값 사용; 타 매장/다른 역할을 명시하면 403으로 거부.
- `POST /update`: 같은 매장/미삭제/02 대상의 이름만 수정. 기존 아이디/매장/역할은 보존하고 변조 요청은 거부.
- `POST /del`: 비어 있지 않은 고유 ID 집합을 검사. 타 매장/관리자/삭제 대상이 섞이면 403으로 전체 거부; 일부만 삭제하지 않음.
- 기존 `POST /reset_pwd/{sysId}`: 동일 매장 스태프 조건과 초기화 후 강제 변경/횟수0 계약 유지.
- 신규 `POST /api/system/client-users/{sysId}/promote`: 시스템 관리자만 호출. 요청 본문으로 매장/역할을 받지 않음. 대상 DB 매장을 사용하며 `ADMIN` 매장과 삭제 계정은 대상에서 제외.
- 승격 성공/이미01은 기존 CommonResponse 성공 응답. 이미01이면 수정 시각을 다시 쓰지 않음. 없는 승격 대상은404/허용되지 않은 역할 전이는409.
- 공통: 미인증/삭제된 요청자는401, 권한/대상 범위 위반은403, 필수값/형식 오류는400. 오류는 기존 공통 응답 형식 유지.

## 설계 흐름

아래는 검토용 방향이며 구현 코드를 지정하지 않는다.

```text
직원 요청 → 세션 ID로 현재 DB 사용자 확인
          → Client 관리자 / 시스템 관리자 경계 판정
          → 대상의 매장 / 삭제 여부 / 현재 역할 확인
          → 허용 필드만 구성
          → 트랜잭션 안에서 조건부 갱신 / 변경 건수 확인
          → 기존 응답 형식 반환
```

삭제/승격은 대상 행의 공통 잠금 순서를 정하고 조건부 갱신을 병행한다. 승격과 삭제가 경합하면 양쪽이 모두 성공하지 않아야 한다.
중복 ID는 고유 집합으로 처리하고, 일괄 변경 건수 불일치 시 트랜잭션을 롤백한다.

---

## 구현 단위 / 작은 커밋 경계

아래 신규 파일명은 예정이며 구현 시 기존 유틸/인가 로직을 먼저 확인한다. 각 단위는 실패 재현 테스트부터 작성하고 통과 후 독립 커밋한다.

### U1. 현재 DB 기반 직원 인가

- 요구: R1/R5. 의존: 없음.
- 변경: `qrorder/src/main/java/htms/QROrder/auth/Interceptor/LoginCheckInterceptor.java`, `qrorder/src/main/java/htms/QROrder/config/WebConfig.java`, `qrorder/src/main/java/htms/QROrder/auth/repository/LoginMapper.java`, `qrorder/src/main/resources/mapper/auth/LoginMapper.xml`.
- 역할 검사 연결: `qrorder/src/main/java/htms/QROrder/auth/Interceptor/RoleCheckInterceptor.java`, `qrorder/src/main/java/htms/QROrder/auth/Interceptor/ClientMenuRoleInterceptor.java`도 현재 요청의 판정 정보를 사용.
- 접근: 현재 DB 사용자 정보가 후속 역할 검사에도 사용되도록 공용 인가 흐름 연결. Consumer 인증은 별도 경계 유지. DB 조회 실패 시 세션의 옛 권한으로 우회하지 않음. 매장이 로그인 당시와 달라지면 세션을 무효화하고 재로그인 요구.
- 패턴: 기존 LoginCheck/RoleCheck/ClientMenuRoleInterceptor와 직원/Consumer 세션 분리 테스트.
- 테스트: `qrorder/src/test/java/htms/QROrder/auth/Interceptor/SessionAuthenticationInterceptorTest.java`, 신규 `qrorder/src/test/java/htms/QROrder/auth/StaffAuthorizationTest.java`.
- 시나리오: 정상01/02, 미인증/삭제 사용자, DB 오류, DB 승격 후 기존 세션, 매장 변경 후401, `/auth/me`와 메뉴 권한 반영, Consumer 세션 불인정, 한 요청에서 권한 중복 조회 없음.
- 검증: 오래된 역할로 우회하지 않으며 02의 기존 주문/결제와 시스템 관리자 로그인이 유지됨.

### U2. Client 사용자 CRUD의 매장/역할 격리

- 요구: R2/R3/R5. 의존: U1.
- 변경: `qrorder/src/main/java/htms/QROrder/client/controller/StoreManageController.java`, `qrorder/src/main/java/htms/QROrder/client/service/ClientUserService.java`, `qrorder/src/main/java/htms/QROrder/client/repository/ClientUserMapper.java`, `qrorder/src/main/resources/mapper/client/ClientUserMapper.xml`.
- 접근: 조회/등록/수정/삭제/초기화에 공통 관리자 경계. DB 조회와 UPDATE/DELETE 모두 매장/대상 역할/미삭제 조건 사용. DTO 전체를 그대로 저장하지 않음.
- 패턴: 기존 resetPwd의 매장/02 조건과 실제 갱신 건수 검사.
- 테스트: 신규 `qrorder/src/test/java/htms/QROrder/client/ClientUserAuthorizationTest.java`, `qrorder/src/test/java/htms/QROrder/client/ClientUserMapperScopeTest.java`.
- 시나리오: 정상 등록/이름 수정/삭제, 스태프 호출403, 타 매장 ID/ADMIN 매장 등록/역할01 변조 거부, 기존 역할 보존, 빈 목록/중복 ID, 섞인 일괄 삭제의 전체 롤백, 변경0건 실패.
- 검증: Controller→Service→실제 Mapper 통합과 PostgreSQL 결과로 타 매장/관리자 계정에 변경이 없음을 확인.

### U3. 시스템 관리자 전용 승격 API

- 요구: R1/R4/R5. 의존: U1/U2.
- 신규: `qrorder/src/main/java/htms/QROrder/system/controller/ClientUserRoleController.java`, `qrorder/src/main/java/htms/QROrder/system/service/ClientUserRoleService.java`, `qrorder/src/main/java/htms/QROrder/system/repository/ClientUserRoleMapper.java`, `qrorder/src/main/resources/mapper/system/ClientUserRoleMapper.xml`.
- 접근: 기존 시스템 관리자 경계 재사용. 대상 조건을 확인해02→01만 갱신하고 수정자/시각 기록. 시스템 관리자 전환/강등/매장 이전 필드는 노출하지 않음.
- 테스트: 신규 `qrorder/src/test/java/htms/QROrder/system/ClientUserPromotionTest.java`, `qrorder/src/test/java/htms/QROrder/system/ClientUserPromotionPersistenceTest.java`.
- 시나리오: 시스템 관리자 성공, Client 관리자/스태프403, 없는 대상404, 삭제/ADMIN/잘못된 역할 차단, 이미01 재요청 무변경, 동시 승격과 삭제, 커밋 실패 시 성공으로 보고하지 않음.
- 검증: DB 역할만 의도대로 변경되고 대상 계정의 다음 요청에서 새 권한이 확인됨. mock만으로 동시성 완료를 선언하지 않음.

### U4. Client 화면과 생성 계약 연결

- 요구: R2/R3/R4. 의존: U2/U3.
- 변경: `frontend/openapi.json`, `frontend/src/generated/**`, `frontend/src/apps/client/features/client-user/api/clientUserApi.ts`, 같은 feature의 `hooks/useClientUserPage.ts`, `hooks/useClientUserModalFlow.ts`, `components/clientUserTableModel.tsx`와 에디터 구성요소.
- 메뉴/라우트 연결: `frontend/src/shared/menu/clientNavigation.ts`, `frontend/src/apps/client/hooks/useClientNavigationMenus.ts`, `frontend/src/apps/client/routes/ClientRoutes.tsx`와 기존 판정/가드 유틸. 사용자 관리 경로를 확인해 보호 범위만 확장.
- 접근: 실행 서버 명세에서 생성. 등록 역할은02로 고정, 관리자 행은 읽기 전용, 스태프의 사용자 관리 메뉴/직접 URL/조회/변경 버튼 차단. 공통코드 원본은 수정하지 않음.
- 패턴: 기존 메뉴 관리의 메뉴 필터/보호 라우트와 초기화 확인 시점 재인가.
- 테스트: 기존 feature의 훅/모달/테이블 테스트, 신규 `frontend/src/apps/client/features/client-user/api/clientUserWriteContract.test.tsx`, `frontend/e2e/client-user-permissions.spec.ts`.
- 시나리오: 정상 등록의 직렬화 본문/매장 기본값, 관리자 수정 불가, 스태프 직접 경로 차단, 권한/계정 변경 후 열린 확인창 차단, 서버403 시 성공 안내/초기화 없음, 기존 초기화/이메일 안내 유지.
- 검증: 생성 타입뿐 아니라 실제 HTTP 요청과 화면 연결 확인. 승격 API 생성 성공을 Admin 화면 구현으로 혼동하지 않음.

### U5. 실제 서버 QA와 문서 마감

- 요구: R1~R6. 의존: U1~U4.
- 변경: 신규 `docs/qa/2026-11-16-client-user-authorization.md`, `frontend/docs/todo.md`, `frontend/docs/auth.md`의 관련 링크. 사용자 개인 다음 작업 문서는 커밋하지 않음.
- 접근: backend 회귀/프론트 관련 테스트/typecheck/lint/build/브라우저 검사 후 실제 QA는 사용자에게 일괄 인계. 노션 허브에는 검증된 계약만 동기화.
- 시나리오: A/B매장과 시스템 관리자/01/02 계정으로 정상 저장/타 매장 차단/일괄 롤백/승격 후 권한 반영/기존 초기화 확인. 공유 DB 자동 실행 금지.
- 검증: 실행 명령/실제 결과/커밋별 이유/남은 수동 증거를 기록. 배포 전 동일 매장 정상 저장과401/403/500 증가를 확인하고 오류 시 해당 작은 변경의 적용을 중단.

---

## 계약 영향과 완료 기준

```text
기존 DB 제약 → Mapper → Controller/DTO/OpenAPI
 → 생성 타입 → 프론트 모델/응답/요청/직렬화
 → 통합 테스트 → dev:real / PostgreSQL QA
```

- 기존 필드 소비자는 map/build/normalize/FormData/URLSearchParams/생성 어댑터까지 검색한다. 생성 타입 통과만으로 쓰기 성공을 판단하지 않는다.
- DB 제약은 실제 스키마로 확인하고 기존 값 보존/신규 기본값을 독립 fixture로 검증한다. nullable/optional 불일치는 서버 검증/기본값으로 명시적으로 해결한다.
- 모든 경계를 검증/해당 없음/미검증으로 구분한다. 실제 저장/롤백/동시성 증거가 없으면 해당 통합 완료를 보류한다.
- 기존 데이터 무결성/불필요한 권한 계정 여부는 읽기 전용 점검 후 담당자 판단을 받는다. 새 인가만으로 과거 계정이 정리됐다고 하지 않는다.
- 성능은 위 전용 QA 측정으로 별도 판정한다. 단위 테스트의 SQL 호출 횟수 검증은 실제 부하 시험을 대체하지 않는다.
- 남은 구현 확인: SQL/Java의 실제 새 파일명과 공용 helper 위치는 최소 변경으로 결정한다. DB 실행 환경/전용 계정/정리 범위는 실제 QA 전에 확보한다.

## 근거 링크

- [기존 초기화 정책과 분리된 실제 API](../qa/2026-11-11-store-staff-password-reset.md).
- [검증 계약](../verification/contracts.json) / [구조 지도](../architecture/README.md).
- [OWASP 인가 원칙](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) / [객체 속성 권한 검사](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/).
