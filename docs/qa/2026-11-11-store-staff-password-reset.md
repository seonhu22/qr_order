# 매장 스태프 비밀번호 초기화

## 사용자 결정과 적용

- Client 관리자 `01`은 자기 매장의 스태프 `02`만 초기화한다.
- Client 관리자 초기화는 시스템 관리자에게 수동 이메일로 요청한다. 자동 이메일 발송/연락처 추가는 하지 않았다.
- 시스템 관리자는 기존 Admin 사용자 관리의 지원 초기화를 사용한다.
- 로그인 후 본인 비밀번호 변경은 본인만 허용한다.
- DB 스키마와 요청/응답 필드/생성 타입은 변경하지 않았다.

## 실제 API와 이전 보고 정정

| 용도 | 실제 API | 서버 경계 |
| --- | --- | --- |
| Client 스태프 초기화 | `POST /api/client/store_manage/user_manage/reset_pwd/{sysId}` | 세션 관리자 01/동일 매장/대상 스태프 02 |
| Admin 지원 초기화 | `POST /api/auth/init-pwd?userId=...` | 기존 시스템 관리자 `SUPER_ADMIN` |
| 본인 변경 | `POST /api/auth/init-pwd-active?userId=...` | 세션 사용자와 대상 아이디 일치 |

이전 보고에서 Client도 `init-pwd`를 쓴다고 한 것은 잘못이었다. [Client API wrapper](../../frontend/src/apps/client/features/client-user/api/clientUserApi.ts)와 생성 클라이언트를 끝까지 확인하여 별도 경로를 찾았다. API 이름이 비슷해도 각 화면의 wrapper → generated URL → Controller → Mapper를 따로 확인해야 한다.

## 작은 커밋과 변경 이유

1. `738cd961`: 스태프 초기화의 Controller에서 세션 사용자를 전달한다. Service는 관리자 역할을 검사하고 SQL은 같은 매장/02/미삭제 조건을 원자적으로 검사한다. 조회 후 무조건 갱신하는 방식보다 역할/매장 변경 경쟁을 줄인다.
2. `ea26a0ce`: 지원 초기화에는 기존 시스템 관리자 인터셉터를 사용하고, 본인 변경의 소유자 검사는 유지한다. 지원 초기화 후 실패 횟수도 0으로 돌린다.
3. `cbd0d8ab`: Client 관리자 행에는 이메일 안내만 표시한다. 스태프 대상도 현재 인증/매장/역할을 검사하고 확인 시 재검사한다.
4. `ad16df65`: 실제 HTTP Controller/Service를 연결해 위조한 매장 파라미터 무효/스태프 행위자 403을 확인한다.

초기화된 스태프는 `password_fail_cnt=0`, `init_yn=Y`가 된다. 실제 `/auth/me`는 `init_yn=Y`를 `initPwdRequired=true`로 제공하므로 다음 로그인에서 비밀번호 변경을 요구한다. 프론트 권한은 별도 state/effect에 복사하지 않고 현재 인증에서 계산했다.

## 검증 결과

- 변경 전 테스트에서 초기화 SQL의 매장 조건 누락을 재현했다.
- 시스템 관리자 지원 초기화 허용 테스트도 기존 본인 전용 설정에서는 실패했고, 경로 분리 후 통과했다.
- 프론트에서 관리자 이메일 안내/확인 시 권한 상실/다른 매장 차단 3개를 먼저 실패로 재현했다.
- `.\gradlew.bat test --console=plain`: 48개 파일/275개 테스트 통과. DB가 아닌 mock/SQL 생성 검증 포함.
- `npm test -- --run src/apps/client/features/client-user --reporter=dot`: 4개 파일/36개 테스트 통과.
- `npm run typecheck`, `npm run lint`, `npm run build -- --logLevel error`: 모두 종료 코드 0.
- 읽기전용 독립 검토: 이번 diff에서 수정 필수 결함 없음. 실제 PostgreSQL 동작은 검증하지 않았다.
- [서버 테스트](../../qrorder/src/test/java/htms/QROrder/client/StaffPasswordResetContractTest.java), [인가 경로 테스트](../../qrorder/src/test/java/htms/QROrder/config/PasswordOwnerBoundaryTest.java), [프론트 테스트](../../frontend/src/apps/client/features/client-user/hooks/useClientUserPage.test.tsx).

## 경계별 확인과 남은 한계

| 경계 | 상태 |
| --- | --- |
| DB 스키마/제약 | 변경 없음 |
| 영속 Mapper | 매장/역할 조건과 초기화 값 생성 검증. PostgreSQL 실행 미검증 |
| DTO/OpenAPI/생성 타입 | 외부 필드 변경 없음. 실행 서버 명세 재조회 미실행 |
| 프론트 모델/응답/요청/직렬화 | 기존 sysId 경로 사용. 역할별 API 호출 여부 훅 테스트 검증 |
| Controller/Service/인가 | 경로와 세션 역할 전달/권한 거부 자동 검증 |
| 실제 저장/로그인/dev:real | 일괄 QA 대기 |

실제 QA는 전용 계정으로 같은 매장 스태프 초기화 성공/다른 매장과 관리자 대상 403/스태프 행위자 403/잠금 해제/다음 로그인 강제 변경을 확인한다. Admin은 수동 이메일 요청 확인 후 지원 초기화 성공/재로그인을 확인한다. 공유 계정과 DB를 자동 변경하지 않았다.

별도 보안 후속: 사용자 등록/수정/삭제는 이번 초기화와 다른 경로다. 기존 역할 변경 API의 인가가 부족하므로 역할 상승을 포함한 감사와 정책 확인이 필요하다. 초기화 API 차단을 사용자 관리 전체의 안전성 완료로 해석하지 않는다.

[일괄 QA와 후속 TODO](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록) / [이전 서버 보안 보완](./2026-11-11-backend-security-boundaries.md).
