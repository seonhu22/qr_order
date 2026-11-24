# 2026-11-24 로컬 실서버 QA / 환경 보정

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| Client 초기 비밀번호 설정 | pass | `demo-start.ps1`의 `AUTH_DEFAULT_PASSWORD`를 [Client 안내 값](../../frontend/src/apps/client/features/client-user/hooks/useClientUserPage.ts#L175)인 `SN111111`로 지정했다. |
| 실행 중인 서버에서 초기 비밀번호 적용 | blocked | 공유 백엔드 재시작 이후 확인할 항목이다. 인증 시나리오는 재실행하지 않았다. |
| 로컬 PostgreSQL 메뉴 시드 / 재실행 | pass | `qrdemo`에서 `psql -X -v ON_ERROR_STOP=1 -f D:/coding/qr_order-local/seed_qa.sql`을 두 번 실행했다. 첫 실행은 Client 30건을 삽입했다. 두 번째는 삽입 0건이며 전체 메뉴 행의 해시가 같았다. |
| Client 메뉴 카탈로그 / 내비게이션 | pass | `demo_owner` 로그인과 `GET /api/auth/me` 모두 200 / 역할 `01`. `GET http://127.0.0.1:8080/api/system/settings/menu/search`는 200 / 전체 34건 / Client 30건이다. `CLIENT` 루트 1건 / 섹션 5건 / 그룹 10건 / 경로 14건을 확인했다. 응답의 레이블, 부모, 순서, 깊이, 경로가 [프런트엔드 정의](../../frontend/src/shared/menu/clientNavigation.ts#L24)와 일치했고, 실제 내비게이션 함수가 `STO`, `MNU`, `ORD`, `PAY`, `CBRD` 순서로 구성했다. |
| 로컬 Admin 카탈로그 분리 | fail | 같은 API 응답을 `ADMIN` 루트 옵션으로 [내비게이션 함수](../../frontend/src/shared/menu/adminNavigation.ts#L111)에 전달하면 `SYSTEM`, `STO`, `BOARD`, `MNU`, `ORD`, `PAY`, `CBRD`가 반환된다. 로컬 시드에 `ADMIN` 루트가 없어 전체 카탈로그를 사용하는 분기가 실행된다. 브라우저 렌더링은 확인하지 않았다. |
| 로컬 Admin 루트 추가 후 재검증 | pass | `psql -X -v ON_ERROR_STOP=1`로 시드를 두 번 적용했다. 첫 실행에서 `ADMIN` 루트 1건을 추가하고 `SYSTEM` / `BOARD`의 부모를 바꿨다. 재실행은 삽입 / 수정 0건이며 전체 메뉴 행의 해시가 같았다. `demo_owner`의 `GET /api/system/settings/menu/search`는 200 / 전체 35건 / Client 30건이다. 같은 응답으로 Admin 함수는 `SYSTEM` / `BOARD`를, Client 함수는 `STO` / `MNU` / `ORD` / `PAY` / `CBRD`를 반환했다. |

로컬 픽스처 안내에 초기 비밀번호와 Client 메뉴 시드의 출처를 기록했다. 인증 QA 체크 상태는 이전 [인증 QA 기록](2026-11-24-local-real-qa-auth.md)을 따른다.
