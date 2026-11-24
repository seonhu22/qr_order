# INV-AUTH02 / 비밀번호 찾기 후 로그인 제한 해제

2026-11-24 / 로컬 사본 DB / 조사 기준 `dev` 커밋 `b9fa3f6d`.

## 비밀번호 변경 경로

다섯 POST API가 기존 계정의 `sys_user.user_password`를 바꾼다. 아래 SQL은 수정 전 기준이다. 로컬 스키마 `D:/coding/qr_order-local/qr_schema.sql:3392–3401`에서 `user_password`와 `password_fail_cnt integer NOT NULL`을 확인했다.

| 경로 / 프론트엔드 호출 | 권한 / 컨트롤러 / 서비스 | 매퍼 SQL / 실패 횟수 |
| --- | --- | --- |
| Client 비밀번호 찾기 / `POST /api/auth/pwd_change`. [로그인 화면](../../frontend/src/apps/client/pages/login/LoginPage.tsx#L55) → [찾기 훅](../../frontend/src/apps/client/features/password-reset/hooks/useClientFindPasswordFlow.ts#L153) → [생성 API](../../frontend/src/generated/pwd-chg-controller/pwd-chg-controller.ts#L37) | [WebConfig](../../qrorder/src/main/java/htms/QROrder/config/WebConfig.java#L41)에서 로그인 검사 제외. [PwdChgController.changePwd](../../qrorder/src/main/java/htms/QROrder/auth/controller/PwdChgController.java#L21)가 같은 세션에서 인증한 사용자만 허용 → [PwdChgService.changePwd](../../qrorder/src/main/java/htms/QROrder/auth/service/PwdChgService.java#L32) | [PwdChgMapper.chgPwd](../../qrorder/src/main/resources/mapper/auth/PwdChgMapper.xml#L6) / `SET user_password = #{pwd}, modify_user_id = #{userId}, modify_datetime = now()` / 유지 |
| Client / Admin 최초 변경 / `POST /api/auth/init-pwd-active`. [Client](../../frontend/src/apps/client/features/login/hooks/useClientLoginAuthFlow.ts#L113), [Admin](../../frontend/src/apps/admin/pages/login/LoginPage.tsx#L193) | 로그인과 [PasswordOwnerInterceptor](../../qrorder/src/main/java/htms/QROrder/auth/Interceptor/PasswordOwnerInterceptor.java#L11)의 본인 확인 → [LoginController.initPwdAndActive](../../qrorder/src/main/java/htms/QROrder/auth/controller/LoginController.java#L62) → [LoginService.initPwdAndActive](../../qrorder/src/main/java/htms/QROrder/auth/service/LoginService.java#L94) | [LoginMapper.initPwdAndActive](../../qrorder/src/main/resources/mapper/auth/LoginMapper.xml#L53) / `SET user_password = #{initPwdRequest.password}, password_fail_cnt = 0, init_yn = 'N'` / 0 |
| 시스템 관리자 지원 초기화 / `POST /api/auth/init-pwd`. [Admin 사용자 관리](../../frontend/src/apps/admin/features/admin-user/api/adminUserApi.ts#L128) | 로그인과 [RoleCheckInterceptor](../../qrorder/src/main/java/htms/QROrder/auth/Interceptor/RoleCheckInterceptor.java#L10)의 `SUPER_ADMIN` 확인 → [LoginController.initPwd](../../qrorder/src/main/java/htms/QROrder/auth/controller/LoginController.java#L48) → [LoginService.initPwd](../../qrorder/src/main/java/htms/QROrder/auth/service/LoginService.java#L82) | [LoginMapper.initPwd](../../qrorder/src/main/resources/mapper/auth/LoginMapper.xml#L29) / `SET init_yn = 'Y', password_fail_cnt = 0, user_password = #{initPwdRequest.password}` / 0 |
| 동일 매장 스태프 초기화 / `POST /api/client/store_manage/user_manage/reset_pwd/{sysId}`. [Client 사용자 관리](../../frontend/src/apps/client/features/client-user/api/clientUserApi.ts#L99) | 로그인과 [ClientMenuRoleInterceptor](../../qrorder/src/main/java/htms/QROrder/auth/Interceptor/ClientMenuRoleInterceptor.java#L10)의 매장 관리자 `01` 확인 → [StoreManageController.resetPwd](../../qrorder/src/main/java/htms/QROrder/client/controller/StoreManageController.java#L88) → [ClientUserService.resetPwd](../../qrorder/src/main/java/htms/QROrder/client/service/ClientUserService.java#L96). SQL에서 같은 매장 / 스태프 `02` / 삭제 여부 확인 | [ClientUserMapper.resetPwd](../../qrorder/src/main/resources/mapper/client/ClientUserMapper.xml#L85) / `SET user_password = #{tempPwd}, init_yn = 'Y', password_fail_cnt = 0, …` / 0 |
| 팝업 비밀번호 변경 / `POST /api/popup/change_password/change`. 생성 클라이언트 외 프론트엔드 호출 0건 | [WebConfig](../../qrorder/src/main/java/htms/QROrder/config/WebConfig.java#L35)의 로그인 검사 → [PopupController.changePassword](../../qrorder/src/main/java/htms/QROrder/popup/controller/PopupController.java#L20) → [PopupPasswordRoleService.changePassword](../../qrorder/src/main/java/htms/QROrder/popup/service/PopupPasswordRoleService.java#L21) | [PopupPasswordRoleMapper.changePassword](../../qrorder/src/main/resources/mapper/popup/PopupPasswordRoleMapper.xml#L16) / `SET user_password = #{chkNewPwd}` / 유지 |

- `rg -n -i 'password\s*=' qrorder/src/main/resources/mapper`에서 비밀번호 UPDATE 5건을 확인했다. `git grep`으로 `frontend/src/apps/admin`의 `useChangePwd(` / `find-password` / `비밀번호 찾기`를 조회한 결과 0건이었다. [Admin 로그인](../../frontend/src/apps/admin/pages/login/LoginPage.tsx#L215)은 잠금 시 관리자 문의를 표시한다.
- 정상 로그인은 비밀번호를 변경하지 않고 횟수를 0으로 만든다. [LoginService.loginCheck](../../qrorder/src/main/java/htms/QROrder/auth/service/LoginService.java#L46)는 횟수 5 이상을 비밀번호 비교 전에 거부하고, 성공하면 [LoginMapper.pwdCntReset](../../qrorder/src/main/resources/mapper/auth/LoginMapper.xml#L46)의 `SET password_fail_cnt = 0`을 호출한다.

## 이력

- `git log --all -S password_fail_cnt -- ':(glob)**/PwdChg*'`는 0건이다. `git log --all -- ':(glob)**/PwdChg*'`는 4건이다. `5d24932d` (2026-06-16)가 이메일 인증과 `chgPwd`를 도입했다. 매퍼는 `aa5cec64` / `7517bc68` (2026-06-25)에서 DTO 매개변수 표기만 변경됐다. `e7adb252` (2026-06-24)는 `PwdChgMapper.xml` 변경이 없다.
- `git log --all -S password_fail_cnt -- qrorder/src/main/resources/mapper`와 해당 diff에서 로그인 성공 `fdc579a0` (2026-05-11), 최초 변경 `67b72ba9` (2026-05-26), 스태프 초기화 `738cd961` (2026-11-11), 시스템 관리자 초기화 `ea26a0ce` (2026-11-11)의 0 저장을 확인했다.
- 추정 / 노트북에서 최초 변경이나 관리자 초기화를 실행했다면 0을 관찰할 수 있다. 해당 환경의 요청 기록과 배포 버전은 확인하지 못했다.

## 로컬 서버 검사

| 확인 | 결과 | 증거 |
| --- | --- | --- |
| `demo_lock` 잠금 상태 준비 | pass | `SELECT count(*), min(password_fail_cnt), count(email) FROM public.sys_user WHERE user_id='demo_lock'` → `1 / 0 / 1`. `UPDATE public.sys_user SET password_fail_cnt=5 WHERE user_id='demo_lock' AND password_fail_cnt=0 RETURNING password_fail_cnt` → `5`. `pg_trigger`의 비내부 트리거와 `pg_rules`의 규칙은 각각 0건. |
| 이메일 인증 코드 발송 | blocked | `POST /api/auth/email_valid/pwd_change/send`, 요청 `{userId,email}` → HTTP 500 / `{data,error,message,success}` / `success=false` / `error="메일 발송에 실패하였습니다."`. 해당 요청 이후 `sys_email_log`를 `insert_user_id='demo_lock' AND sys_plant_cd='CHGPWD'` 및 요청 시각으로 한정한 결과 `success_status='F'` 1건. |
| 세션 인증 / 비밀번호 변경 / 변경 후 DB | blocked | `POST /api/auth/email_valid/pwd_change` 및 `POST /api/auth/pwd_change`에 필요한 세션 인증을 만들지 못했다. 발송 실패 뒤 `SELECT password_fail_cnt FROM public.sys_user WHERE user_id='demo_lock'`은 `5`, `modify_datetime`은 동일했다. |
| 테스트 상태 복구 | pass | 같은 행의 실패 횟수 `0`을 `UPDATE … RETURNING password_fail_cnt`로 확인했다. 비밀번호 변경 요청은 보내지 않았다. 이 요청에서 만든 메일 실패 로그 1건을 정리했다. |

[프론트엔드 찾기 훅](../../frontend/src/apps/client/features/password-reset/hooks/useClientFindPasswordFlow.ts#L52)은 발송 → 검증 → 변경 순서로 요청한다. [EmailValidService](../../qrorder/src/main/java/htms/QROrder/auth/service/EmailValidService.java#L41)와 [EmailValidMapper](../../qrorder/src/main/resources/mapper/auth/EmailValidMapper.xml#L6)가 `WHERE email = #{email} AND user_id = #{userId}`로 계정을 확인한 뒤 6자리 코드를 만든다. [EmailService](../../qrorder/src/main/java/htms/QROrder/common/service/EmailService.java#L48)는 본문을 [sys_email_log](../../qrorder/src/main/resources/mapper/audit/EmailLogMapper.xml#L6)에 남기며, 발송 실패 시 예외를 던진다. DB에 실패 메일 본문이 있어도 [EmailValidController](../../qrorder/src/main/java/htms/QROrder/auth/controller/EmailValidController.java#L59)의 세션 저장은 발송 성공 뒤에만 실행된다. [검증 요청](../../qrorder/src/main/java/htms/QROrder/auth/controller/EmailValidController.java#L101)은 같은 세션의 이메일과 코드를 비교한 뒤 인증한 사용자 ID를 저장한다.

## 판정 / 수정

- 수정 전 Client 비밀번호 찾기는 새 비밀번호를 저장한 뒤에도 실패 횟수 5를 유지한다. [PwdChgMapper.chgPwd](../../qrorder/src/main/resources/mapper/auth/PwdChgMapper.xml#L9)에 `password_fail_cnt = 0`을 추가해 비밀번호와 동시에 저장한다.
- `psql -X -w -A -t -v ON_ERROR_STOP=1`로 `chgPwd`에서 추출한 수정 전후 SQL을 각각 실행했다. `demo_lock` 1행을 본뜬 PostgreSQL 세션 임시 테이블에 테스트용 비밀번호 값과 횟수 5를 넣었다. 각 실행에서 `UPDATE 1`, 새 비밀번호 값 일치 `t`를 확인했다. 수정 전 `before|1|5 → after|1|5|t`, 수정 후 `before|1|5 → after|1|0|t`. 두 트랜잭션 모두 `ROLLBACK`했고 원본 행은 `restored_source|1|0`이었다.
- [백엔드 회귀 테스트](../../qrorder/src/test/java/htms/QROrder/auth/LoginTransactionContractTest.java#L18)는 MyBatis가 만드는 `chgPwd` SQL 한 문장에 비밀번호 저장과 실패 횟수 0 저장이 모두 있는지 검사한다. Java 17 / JUnit Platform으로 수정 전 매퍼에서 2개 중 1개 실패, 수정 후 매퍼에서 2개 통과를 확인했다.
- `.\gradlew.bat test --tests htms.QROrder.auth.LoginTransactionContractTest --offline --no-daemon --init-script build/inv-auth02-javac.init.gradle --console=plain`도 통과했다. 2개 실행 / 실패 0 / 건너뜀 0. Windows JAR 접근 오류를 피하기 위해 `build/` 안의 임시 스크립트로 외부 Java 17 컴파일러를 지정했다.
- [Client 잠금 안내](../../frontend/src/apps/client/features/login/hooks/useClientLoginAuthFlow.ts#L40)는 횟수 5 이상에서 안내한다. 현재 문구는 복구 방법을 단정하지 않으므로 유지했다.
