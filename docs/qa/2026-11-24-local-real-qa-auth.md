# 2026-11-24 로컬 실서버 QA / 인증과 권한

- 대상은 실행 중인 `dev:real` / `dev` 백엔드 / `qrdemo` PostgreSQL 사본이다. QA 워크트리 HEAD는 `b90371ed`이며 실행 프로세스의 정확한 커밋은 확인하지 않았다.
- 아래 첫 실행의 fail 4건은 로컬 환경 공백이었고 [재검증](#재검증-2026-11-24)에서 pass로 바뀌었다.
- Playwright 실행 결과는 3개 시나리오 중 1개 통과, 2개 실패다. 각 시나리오에서 독립 검증을 이어서 수행했다. 모든 조건을 통과한 체크만 [대기 목록](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록)에 표시했다.
- 주문과 결제는 기존 데이터 조회만 사용했다. 사용자 변경은 이 실행이 만든 `AUTO-QA auth` 계정으로 제한했다. 로그인 잠금은 `demo_lock`으로 검증하고 복구했다.

## SEC-01 / 비밀번호 초기화 권한

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| 동일 매장 관리자 → 스태프 초기화와 실패 횟수 복구 | pass | `demo_owner`의 사용자 목록에서 초기화/확인. `POST /api/client/store_manage/user_manage/reset_pwd/{sysId}` → `200 {data,error,message,success}`. 스태프 실패 횟수 `2 → 0`, `init_yn=Y`. |
| 타 매장 스태프 / 동일 매장 관리자 / 스태프 행위자 | pass | 같은 POST의 세 요청이 모두 403. 대상 범위 오류는 `{data,error,message,success}`, 행위자 역할 오류는 `{success,message}`. 관리자 대상은 이번 실행이 승격한 계정을 사용했다. |
| 매장 초기화 후 재로그인과 강제 변경 | fail | 성공 모달에 표시된 초기 비밀번호로 `POST /api/auth/login` → `401 {data,error,message,success}`, `success=false`, `data=1`. 초기화 직후 재현했다. |
| Admin 지원 초기화 / 본인 변경 | pass | `POST /api/auth/init-pwd?userId=…`는 Client 관리자 403 / `demo_admin` 200. 지원 초기화 값으로 로그인 200, `/api/auth/me`의 `initPwdRequired=true`, 강제 변경 폼 표시. `POST /api/auth/init-pwd-active?userId=…`는 타인 403 / 본인 200. 변경 성공 안내와 `/api/auth/me`의 `initPwdRequired=false`를 확인했다. |

초기화 후 401의 조사 지점은 [서버 기본 비밀번호 적용](../../qrorder/src/main/java/htms/QROrder/client/service/ClientUserService.java#L96)과 [Client 안내 고정값](../../frontend/src/apps/client/features/client-user/hooks/useClientUserPage.ts#L175)이다. 실행 서버의 설정값과 대소문자 차이의 원인은 확인하지 않았다.

## SEC-02 / 결제 상세 매장 범위

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| `DEMO01`과 `AUTOQA_B`의 자기 매장 상세 조회 | pass | DB에서 결제 완료 상세가 있는 주문을 한 건씩 선택했다. `GET /api/client/payment_manage/history/detail/search/{masterSysId}` → 양쪽 모두 `200` / 상세 배열 1건. `DEMO01`은 `01M86E8DHC7E0PGTNMWCE5DTBM`, `AUTOQA_B`는 `01M86FQYX55G33CVTHF5NNF9RZ`. |
| 양방향 타 매장 번호 차단 | pass | 두 매장 관리자 세션을 바꿔 같은 번호로 조회했다. 쿼리 없음 / `sysPlantCd`에 대상 매장을 넣은 경우 모두 `200 []`. |

## AUTHZ-01 / 메뉴 관리 권한

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| 관리자 01 메뉴/옵션 페이지와 데이터 | pass | `/client/menu/info/management`와 `/client/menu/info/option`의 영역 표시. 각 페이지의 `GET /api/client/menu_manage/menu/master/search`, `GET /api/client/menu_manage/menu/detail/search` 모두 200. |
| 관리자 01 내비게이션 메뉴 | fail | `demo_owner` 로그인 후 상단 메뉴는 `시스템` / `게시판`만 표시하고 관리/옵션 버튼이 없다. `GET /api/system/settings/menu/search` → `200` / 배열 4건, 두 경로 없음. DB `sys_menu`에도 `CLIENT` 루트 / 직속 항목 / 두 경로가 없었다. |
| 스태프 02 일반 URL / 대문자 / 인코딩 / 계정 전환 | pass | 같은 브라우저에서 관리자 로그아웃 후 `autoqa_staff_a`로 로그인했다. 일반 메뉴/옵션 URL, `/CLIENT/MENU/INFO/OPTION`, `/client/%6denu/info/option` 모두 `/client/main`으로 이동했다. 메뉴 관리 API 요청 0건, 메뉴/옵션 버튼 없음. 역할별 내비게이션의 양성 대조는 관리자 메뉴 누락으로 미확인이다. |
| 스태프 02 직접 API GET/POST | pass | `GET /api/client/menu_manage/menu/master/search`와 `POST /api/client/menu_manage/menu/master/update` → 각각 `403 {success,message}`. POST에는 실제 행과 일치하지 않는 테스트 식별자를 사용했다. |
| 직원호출 설정 / 주문 상태 / 결제 목록 조회 | pass | 스태프 세션에서 세 화면을 직접 방문해 영역 표시와 해당 조회 API 각각 200을 확인했다. 조회와 화면 접근 로그만 허용했다. |

관리자 메뉴 누락은 로컬 카탈로그에 Client 항목이 없는 상태에서 재현됐다. [루트 미등록 시 카탈로그 처리](../../frontend/src/shared/menu/adminNavigation.ts#L97)와 [Client 기본 메뉴 선택](../../frontend/src/shared/menu/clientNavigation.ts#L232)이 조사 지점이다. Client 메뉴 시드가 있는 환경의 내비게이션은 미검증이다.

## AUTH-01 / 로그인 제한

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| 다섯 번째 실패 / 정상 비밀번호 거부 | pass | `demo_lock`의 정상 로그인 200을 확인하고 별도 세션에서 틀린 값 5회. `POST /api/auth/login` → 모두 401, 응답 `data=1,2,3,4,5`, DB 5. 다섯 번째 요청은 Client 폼으로 전송해 `로그인 제한 안내` 모달을 확인했다. 이후 올바른 비밀번호도 `401` / 잠금 안내 / `data=5`, `/api/auth/me` 401. |
| 동시 실패 누락 방지와 복구 | pass | 실패 횟수 3에서 두 세션으로 동시에 같은 계정의 실패 요청을 보냈다. 응답은 각 401 / `data=4,5`, DB 5. 종료 시 `password_fail_cnt=0` 확인. |

## AUTH-STAFF / 신규 스태프 소속과 초기 로그인

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| 신규 스태프 매장 컬럼 / 목록 재조회 | pass | `POST /api/client/store_manage/user_manage/new` → `200 {data,error,message,success}`. DB `plant_cd=DEMO01`, `sys_plant_cd=DEMO01`, `user_role=02`, `init_yn=Y`, 실패 0, 미삭제. 목록 API 200 / 1건, Client 새로고침 후 계정 행 표시. |
| 최초 로그인 / 변경과 안내 비밀번호 일치 | fail | 신규 계정과 화면에 안내되는 초기 비밀번호로 첫 로그인 → `401 {data,error,message,success}`, `data=1`. 강제 변경 폼에 도달하지 못했다. Admin이 설정한 초기 비밀번호의 강제 변경은 SEC-01에서 통과했다. |
| 이전 보고의 기존 두 계정 소속 보정과 로그인 | blocked | 별도 보정 대상 계정은 이번 픽스처 범위 밖이다. 신규 계정 및 현재 QA 스태프의 소속 증거로 대체하지 않았다. |

최초 로그인 401의 조사 지점은 [등록 시 임시 비밀번호 적용](../../qrorder/src/main/java/htms/QROrder/client/service/ClientUserService.java#L55)과 [Client 안내](../../frontend/src/apps/client/features/client-user/hooks/useClientUserPage.ts#L175)이다.

## USER-01 / 사용자 관리와 승격

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| 같은 매장 스태프 등록/이름 수정/삭제 | pass | `POST /api/client/store_manage/user_manage/{new,update,del}` → 각각 200. 목록 재조회에 신규/수정 이름을 확인했고 삭제 후 `200 []` / DB `delete_yn=Y`. |
| 매장/역할 위반과 스태프 직접 요청 | pass | `update` 요청의 역할 `01`, 타 매장 본문, 타 매장 대상 세 경우와 타 매장 대상을 포함한 일괄 `del` 모두 403. 스태프 `GET search` / `POST update`도 403. 두 매장 목록에서 대상이 그대로 남았고 해당 이름/역할/매장 값 확인. |
| 관리자 행 읽기 전용 / 이메일 안내 | pass | 관리자 행에 수정 버튼/선택 체크박스 없음. 초기화 클릭은 관리자에게 이메일로 요청하라는 안내를 표시했다. |
| 기존 스태프 초기화 이후 강제 변경 | fail | 목록 행의 초기화는 200 / DB 초기 상태 복구를 확인했다. 안내 비밀번호로 재로그인 401이 발생해 강제 변경에 도달하지 못했다. SEC-01과 같은 재현이다. |
| 승격 / 중복 무변경 / 다음 요청 권한 | pass | `POST /api/system/client-users/{sysId}/promote`에서 Client 관리자 `403 {success,message}`, `demo_admin` `200 {data,error,message,success}`. 대상의 기존 세션에서 즉시 `staffRole=01`, 목록 `403 → 200`. 재요청 200 후 DB 역할/수정자/수정 시각/행 버전 동일. |
| 계정 전환 / 별도 세션 / 새로고침의 목록 범위 | pass | `DEMO01`로 로그인한 브라우저를 로그아웃하고 `AUTOQA_B`로 재로그인했다. 다른 브라우저 컨텍스트와 전환/새로고침한 창 모두 B 스태프가 표시되고 A 스태프 행은 없었다. |

## 재실행과 정리

- [실서버 Playwright 시나리오](../../frontend/e2e-real/local-auth.spec.ts)는 로컬 QA 전용이다. 제공된 계정 비밀번호를 `QA_AUTH_FIXTURE_PASSWORD`, Client 안내 값을 `QA_AUTH_INITIAL_PASSWORD`, `psql.exe` 절대 경로를 `QA_AUTH_PSQL`에 설정한다. 제공된 연결 스크립트를 실행하고 `PGHOST=127.0.0.1`, `PGPORT=55432`, `PGDATABASE=qrdemo`를 확인한다. 비밀번호는 결과에 기록하지 않는다.
- `frontend`에서 `npx playwright test -c playwright.real.config.ts local-auth.spec.ts --max-failures=0` → 실패 2 / 통과 1 / 37.8초. `npm run typecheck`와 `npx tsc --noEmit -p tsconfig.e2e.json` → 통과.
- 세 차례 실행에서 만든 픽스처 9개를 소프트 삭제했다. 마지막 `psql` 조회에서 활성 픽스처 0개와 `demo_lock` 실패 횟수 0을 확인했다.

## 재검증 2026-11-24

[로컬 환경 보정](2026-11-24-local-real-qa-env.md) 후 실행 중인 스택에서 재검증했다.

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| AUTHZ-01 / 관리자 01 메뉴 / 옵션 표시와 조회 | pass | `demo_owner`의 `GET /api/system/settings/menu/search` → `200` / 35건 / 두 관리 경로 포함. 상단에 매장 / 메뉴 / 주문 / 결제 / 게시판을 표시했다. 사이드바의 메뉴 관리 / 옵션 관리 버튼과 각 화면을 확인했다. 메뉴 목록 / 옵션 조회는 각각 200. |
| AUTHZ-01 / 스태프 02 메뉴 표시와 계정 전환 | pass | 같은 브라우저에서 `autoqa_staff_a`로 전환 후 상단 메뉴를 눌러 메뉴 정보 관리 그룹을 열었다. 직원호출 관리 버튼은 표시됐고 메뉴 관리 / 옵션 관리 버튼은 없었다. 일반 메뉴 / 옵션 URL과 대문자 / 인코딩 변형은 모두 `/client/main`으로 이동했다. 브라우저의 메뉴 관리 API 호출은 0건이다. |
| AUTH-STAFF / 신규 매장 소속과 안내 비밀번호로 최초 로그인 | pass | DB의 `plant_cd` / `sys_plant_cd`는 모두 `DEMO01`, 목록 재조회와 새로고침 후 신규 행 표시. 안내값으로 `POST /api/auth/login` → `200 {data,error,message,success}`. `/api/auth/me`의 `initPwdRequired=true`와 변경 폼을 확인했다. 본인 변경 200 후 `false`, 새 비밀번호 로그인 200. |
| SEC-01 / 초기화 후 실패 횟수 복구와 강제 변경 | pass | 목록에서 초기화하면 `POST /api/client/store_manage/user_manage/reset_pwd/{sysId}` → `200 {data,error,message,success}`. DB `password_fail_cnt=0` / `init_yn=Y`. 모달에 표시된 값으로 로그인 200, 강제 변경 폼 표시, 본인 변경 200 후 `/api/auth/me`의 `initPwdRequired=false`. Admin 지원 초기화 200 / 타인 변경 403도 다시 확인했다. |
| USER-01 / 관리자 행과 기존 스태프 초기화 | pass | 관리자 행은 편집 버튼 / 선택 체크박스가 없고 초기화 버튼은 이메일 요청을 안내했다. 이미 최초 변경을 마친 이번 QA 스태프는 위 Client 목록 초기화 후 안내값으로 다시 로그인해 강제 변경을 완료했다. |
| AUTH-STAFF / 이전 보고의 기존 두 계정 | blocked | 별도 보정 대상은 이번 로컬 QA 픽스처 범위 밖이다. |

- 기존 스펙 실행은 2개 통과 / 1개 실패였다. 스태프는 메인 URL로 이동했으나 스펙이 [현재 메인 화면](../../frontend/src/apps/client/pages/main/MainPage.tsx#L21)에 없는 제목을 기다렸다. 스펙에서 현재 바로가기 영역과 스태프의 직원호출 메뉴 표시를 확인하도록 수정했다.
- `npx playwright test -c playwright.real.config.ts local-auth.spec.ts --max-failures=0` → 3개 통과 / 26.8초. `npm run typecheck` / `npx tsc --noEmit -p tsconfig.e2e.json` → 통과.
- 종료 후 `psql` 조회에서 `demo_lock` 실패 횟수 0 / 활성 `AUTO-QA-auth-` 픽스처 0건을 확인했다.
