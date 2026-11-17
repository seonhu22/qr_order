# 스태프 로그인 500 / 매장 연결 누락

## 문제 근거

- 사용자 제공 요청: `POST /api/auth/login`, `autoTester22`, HTTP 500.
- 오류: `sys_login_log_master.sys_plant_cd`의 NOT NULL 위반. 이력의 실패 사유는 비밀번호 불일치였다.
- 사용자 DB 관찰: 기존 스태프는 `sys_plant_cd`만 채워지고 `plant_cd`는 누락되어 있다.
- [LoginMapper](../../qrorder/src/main/resources/mapper/auth/LoginMapper.xml)는 소속 `plant_cd`를 Login의 `sysPlantCd`로 매핑한다.
- [LogService](../../qrorder/src/main/java/htms/QROrder/log/service/LogService.java)는 이 값을 로그인 이력에 전달하므로, 소속 누락은 비밀번호 성공/실패 양쪽에서 이력 저장 오류를 유발한다.
- 최신 부모 커밋 `81f4970a`의 [신규 생성](../../qrorder/src/main/java/htms/QROrder/client/service/ClientUserService.java)과 [INSERT](../../qrorder/src/main/resources/mapper/client/ClientUserMapper.xml)는 두 컬럼을 세션 매장으로 채운다. 실행 서버 반영 커밋은 확인하지 못했다.

## 수정과 이유

- [LoginService](../../qrorder/src/main/java/htms/QROrder/auth/service/LoginService.java): 소속이 null/빈 문자열이면 비밀번호 검사/DB 이력/세션 생성 전에 기존 로그인 실패 응답 401로 거부한다.
- 매장 연결 오류 안내와 서버 경고를 남긴다. 유효한 매장 계정의 로그인 이력/실패 횟수/5회 잠금은 유지한다.
- 소속 누락을 비밀번호 실패로 세지 않는다. 비밀번호가 맞더라도 매장을 추측해 로그인시키지 않는다.
- `sys_plant_cd`는 가입 INSERT에서 생략되고 기존 스태프 생성에서는 기록되므로, 두 컬럼을 모든 계정에서 같은 뜻으로 취급하지 않는다. 권한 소속 `plant_cd`를 유지한다.
- 대안인 조회 시 무조건 COALESCE는 누락 데이터를 숨기고 로그인 외 목록/수정/권한 검사와 불일치를 남기므로 채택하지 않았다.
- 기존 데이터는 코드 방어만으로 복구되지 않는다. 확인한 소속을 `plant_cd`에 보정해야 정상 목록/로그인이 복구된다.

## 기존 계정 보정

[두 테스트 스태프 보정 SQL](./scripts/2026-11-17-staff-store-binding-repair.sql)은 별도 검토용이며 서버에서 실행하지 않았다.

1. 스크립트 상단 SELECT로 각 sys_id와 올바른 매장을 확인한다. 비밀번호/해시는 조회하지 않는다.
2. 실제 매장 코드/승인 관리자 아이디/두 스태프 sys_id의 네 placeholder를 입력한다.
3. DBeaver에서 전체 스크립트를 실행한다. 기본 ROLLBACK이므로 변경은 남지 않는다.
4. 결과의 두 행에서 예상 plant_cd/역할/매장을 확인한다.
5. 적용할 때만 마지막 ROLLBACK을 COMMIT으로 바꾸고 전체 재실행한다.
6. 이미 오류가 발생해 트랜잭션이 중단됐다면 ROLLBACK 후 원인을 확인한다. 실패한 상태에서 COMMIT으로 진행하지 않는다.

조건: 유효한 일반 매장/같은 매장의 관리자 1명/확인한 스태프 2개/기존 기록 매장 일치/plant_cd 누락.
조건이 다르거나 대상이 이미 보정됐다면 중단한다. 잠금은 3초/문장은 10초 제한이다.
비밀번호/권한/실패 횟수/초기 변경 상태는 수정하지 않는다. 수정자와 수정 시각만 함께 기록한다.

## 검증

- 수정 전 [누락 소속 단위 테스트](../../qrorder/src/test/java/htms/QROrder/auth/LoginMissingStoreTest.java)는 이력 저장 예외로 실패했다.
- 수정 전 [실제 PostgreSQL 재현](../../qrorder/src/test/java/htms/QROrder/system/ClientUserPromotionPersistenceTest.java)도 동일 NOT NULL 위반으로 실패했다.
- 독립 임시 PostgreSQL에서 실제 Controller/Service/Mapper/Log INSERT와 트랜잭션을 사용한다. 공유 DB 설정은 읽지 않는다.
- 검증 항목: 신규 스태프 로그인 200/성공 이력, 비밀번호 오류 401/실패 이력/횟수 커밋, 누락 소속 401/세션 없음, 보정 후 목록/로그인 복구/해시 유지.
- 보정 SQL 원문도 임시 DB에서 dry-run/적용/다른 매장 거부를 검사한다. 운영 DDL 전체 호환성 검증은 아니다.
- 실행: `qrorder`에서 `.\gradlew.bat test --console=plain` → 57개 파일/308개 테스트/실패 0/오류 0/skip 0.
- 위 PostgreSQL 테스트는 12개 모두 실행됐고 임시 클러스터 종료를 확인했다. 단위 재현 1개도 통과했다.

## 경계와 남은 확인

- DB 제약 → Mapper → Login 모델 → Service → 이력 저장/세션: 임시 PostgreSQL 검증 완료.
- 요청/응답 DTO → OpenAPI/생성 타입 → 프론트 매퍼/직렬화: 필드 변경 없음. 기존 401 오류 envelope를 사용한다.
- 실제 `dev:real`: 최신 백엔드 반영/기존 데이터 보정/신규 스태프 생성/로그인/목록 노출 확인 필요.
- 제공 로그에는 비밀번호 불일치도 있다. 서버의 `auth.default-password`와 대소문자를 확인하고, 최초 변경 후 비밀번호를 QA 환경파일에 입력한다.
- 프론트 고정 초기 비밀번호 안내와 서버 설정이 일치하는지는 별도 확인 대상이다. 실행 서버 설정값을 이번 작업에서 읽거나 바꾸지 않았다.
- 제품 DB 스키마/공유 데이터/비밀번호 변경/원격 push/병합은 수행하지 않는다.
