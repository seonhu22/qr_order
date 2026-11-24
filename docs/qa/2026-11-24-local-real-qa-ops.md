# 로컬 실서버 QA / ops / 2026-11-24

기동 중인 로컬 프론트 `localhost:3000`, 백엔드 `127.0.0.1:8080`, PostgreSQL `qrdemo` 사본으로 확인했다. 주문은 `AUTOQA_B`의 AUTO-QA 92번 테이블과 옵션 없는 AUTO-QA 메뉴를 사용했다. 공지/문의/사용자 데이터는 `AUTO-QA ops` 표기로 생성했다. [QA 체크리스트](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록)

## NOTICE-01

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 전체/관리자/스태프 등록, 수정, 새로고침 | pass | Admin multipart `new`/`update` 200, 대상별 DB 행 1개. Admin 목록 새로고침 후 수정 창에서 전체/관리자/스태프 선택값이 각각 유지됐다. |
| 역할별 API와 알림 | pass | `GET /api/client/board/notice/search` 200 배열과 알림 창에서 관리자 all/manager, 스태프 all/staff 확인. 스태프 문의 조회 0건. |
| 60초 주기/창 복귀 | pass | 전경 진입 60,010 ms 뒤 실제 GET 200과 신규 제목 표시. 별도 hidden → visible 이벤트에서 즉시 실제 GET 200과 신규 제목을 확인했다. |
| 로컬 읽음/전환 | pass | 공지 개별/전체 읽음과 다른 탭, 계정/매장 전환은 OPS-01에서 확인했다. |
| 대상 변경/미사용/예약/삭제 | pass | staff에서 manager로 수정한 뒤 역할별 노출이 바뀌었다. 미사용, 미래 공개일, 삭제 후 Client 200 배열에서 제외됐다. |
| 모두 읽음 후 직원호출 미확인 유지 | blocked | 사본 DB에 `STAFF_CALL_TYPE` 마스터와 활성 세부 코드가 없다. 92번에 미확인 직원호출 0건. |

## OPS-01

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 공지/답변 완료 문의 표시 | pass | `demo_owner` 알림 창에 실제 공개 공지와 Admin이 답변한 `AUTO-QA ops` 문의가 표시됐다. |
| 스태프 직원호출 유지 | blocked | 사본 DB의 직원호출 공통코드/미확인 데이터 조건은 NOTICE-01과 같다. |
| 개별/전체 읽음과 새로고침 | pass | 개별 읽음 직후 localStorage 읽음 ID 1개. 모두 읽음 후 새로고침해도 공지는 목록에 남고 읽지 않은 건수는 0이었다. |
| 계정/매장과 다른 탭 | pass | 같은 컨텍스트의 두 번째 탭에서 읽지 않은 건수가 0으로 갱신됐다. 같은 컨텍스트를 `demo_owner/DEMO01`에서 `autoqa_manager_b/AUTOQA_B`로 바꾸면 공지가 다시 미확인으로 표시됐고 저장 키 2개가 각각 유지됐다. |
| 빈 알림/실패 안내 | pass | 실제 로그인과 페이지를 유지한 채 공지/문의 GET만 200 `[]`와 503 `{message}`로 주입했다. “알림이 없습니다.”와 “알림을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.”가 각각 표시됐다. |

## ORDER-01

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 실행 OpenAPI | pass | `/v3/api-docs` 200. 저장 명세와 `StatusHeader.statusChangedAt` 정의 동일. string/date-time, 예시 `2026-11-10 14:30:00.123456`. |
| 접수 → 조리 → 서빙 → 조리 → 접수 | pass | 주문 #0002의 변경 POST 4건 200/`success=true`. search 응답과 `order_group.modify_datetime`의 소수점 6자리까지 일치했다. |
| 두 브라우저의 카드 순서 | pass | 두 Client 컨텍스트에서 새로고침 후 서빙 컬럼의 AUTO-QA 카드가 모두 #0001 → #0002였다. 마지막 이동 카드 #0002가 아래에 표시됐다. |
| 변경 시각 없는 주문 | pass | 신규 #0002가 접수 카드에 표시됐다. DB `modify_datetime IS NULL`, 조회 `statusChangedAt=null`. |

| 상태 변경 | 응답과 DB 시각 |
| --- | --- |
| `go_to_cooking` / 02 | 2026-11-24 18:47:58.505890 |
| `go_to_serving_complete` / 03 | 2026-11-24 18:47:58.589189 |
| `back_to_cooking` / 02 | 2026-11-24 18:48:00.918772 |
| `back_to_receive_order` / 01 | 2026-11-24 18:48:00.992554 |

## QNA-01a

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 실행 OpenAPI | pass | `/v3/api-docs` 200. `QnaResponse.modifyDatetime`은 저장 명세와 동일한 `["string","null"]`/date-time. |
| 신규 문의 수정일 `-` | fail | Client 등록 200, DB 신규 `modify_datetime=NULL`. Admin 검색 200 `[]`로 같은 문의의 수정일 셀을 열 수 없다. |
| Client 수정 → Admin/DB 재조회 | fail | `POST /api/client/board/qna/update`에 해당 `sysId`/제목/본문을 보내면 500, `{data,error,message,success}`. 정상 로그인과 메뉴 진입 로그를 둔 채 반복 재현했다. |
| Admin 답변 후 수정일 재조회 | fail | 소유 문의 ID로 Admin multipart 답변 저장 200. Client 응답 `answerYn=Y`, `answerDatetime=2026-11-24T18:59:40.346519`, DB 수정일 `2026-11-24 18:59:40.346519`. Admin GET은 다시 200 `[]`. |

- 재현 순서 / `demo_owner`로 DEMO01 문의를 등록하고 `demo_admin`으로 동일 제목을 검색한다. Admin GET은 세션 매장 `ADMIN`을 전달하고 SQL은 `bq.sys_plant_cd`를 그 값과 비교한다. Admin의 지원 범위를 확인한 뒤 문의 조회/답변 계약을 맞추는 방안을 권장한다. [SettingsController.java](../../qrorder/src/main/java/htms/QROrder/system/controller/SettingsController.java#L527), [QnaMapper.xml](../../qrorder/src/main/resources/mapper/system/QnaMapper.xml#L29)
- Client 수정 500의 의심 경로는 갱신 전 `qnaMapper.getOldData` 호출이다. 대응 SQL 매핑을 확인한다. [ClientQnaService.java](../../qrorder/src/main/java/htms/QROrder/client/service/ClientQnaService.java#L49), [ClientQnaMapper.xml](../../qrorder/src/main/resources/mapper/client/ClientQnaMapper.xml)

## QNA-01b

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| Admin 화면의 답변 multipart/DB 연결 | blocked | Admin 문의 행 누락. 같은 소유 ID에 답변과 `newItems[0].file/linkSysId/convertFileNm/filePath/ordNo`를 직접 전송하면 200, `attach_file.link_sys_id=문의 ID`. |
| 새로고침 후 원문/답변 조회 및 다운로드 | fail | Client 문의 생성 multipart 200인데 원문 연결 ID의 파일 GET 200 `[]`. `/api/attach_file/save`로 원문을 소유 문의에 별도 연결한 뒤 Client 상세에서 원문/답변 두 파일 클릭 다운로드 성공. Admin/Client API 모두 각 파일 200, 14/12바이트 일치. Admin 문의 화면은 목록 누락으로 차단됐다. |
| 실패 후 초안 유지/재시도/닫기 초기화 | blocked | Admin 문의 행 누락으로 에디터 진입 불가. |
| 기존 파일 포함 추가 개수/용량 | blocked | 같은 에디터 진입 조건이 필요하다. |

- 원문 재현 / `POST /api/client/board/qna/new`에 제목/내용과 원문 파일 필드를 함께 전송하고, 응답 뒤 문의 목록의 `fileUlid`로 `GET /api/attach_file?linkSysId=...`를 호출한다. Client 등록 핸들러의 파일 바인딩/저장을 확인한다. [BoardController.java](../../qrorder/src/main/java/htms/QROrder/client/controller/BoardController.java#L44), [ClientQnaService.java](../../qrorder/src/main/java/htms/QROrder/client/service/ClientQnaService.java#L30)

## PLANT-01

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 대표자명 | pass | 사업장 API 200 배열의 `DEMO01.empNm`과 DB `sys_plant.emp_nm`, 화면 대표자명이 모두 `김데모`. |
| 담당자/접속 URL 대체 표시 | fail | 담당자는 `-`, 링크 0개. 접속 열에 기대 문구 `-` 대신 비활성 `접속` 버튼 표시. |
| 빈 목록/조회 실패에 가짜 선택지 없음 | pass | 콤보 GET만 200 `[]`와 503 `{message}`로 주입했다. 신규 행에 비활성 “검색 결과 없음”만 표시됐다. |
| 실제 사업장 선택/저장과 기존 코드 보존 | fail | 실서버 콤보의 `AUTOQA_B`로 선택/저장 POST 200 `{data,error,message,success}`, DB 코드 일치. 새로고침 후 관리자 검색 200 `[]`로 같은 신규 행 수정 불가. 별도 `ADMIN` 소유 픽스처는 이름 수정 200 후 요청/DB 코드 보존 확인. |

- 접속 열은 URL이 비어도 버튼을 렌더링한다. 미제공 값의 표시 계약을 맞춘다. [plantSearchTableModel.tsx](../../frontend/src/apps/admin/features/plant-search/components/plantSearchTableModel.tsx#L82)
- 관리자 목록과 저장의 사업장 범위를 맞춘다. 현재 목록 SQL은 `plant_cd='ADMIN'`만 조회한다. [AdminUserMapper.xml](../../qrorder/src/main/resources/mapper/system/AdminUserMapper.xml#L21)

## CON-04

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 결제 후 방문 종료/장바구니/재스캔 | pass | #0019를 주문한 뒤 Consumer에 미제출 장바구니를 남겼다. Client 카드 결제 POST 200 후 세션 `CLOSED`, “주문이 마감되었습니다.” 표시와 장바구니 저장값 비움 확인. 같은 QR 재스캔은 이전과 다른 방문 ID / `ACTIVE` / 빈 장바구니와 주문내역을 반환했다. |

## E2E-01

| 확인 항목 | 결과 | 근거 |
| --- | --- | --- |
| 수정/취소/미결제/정산 | pass | 주문 수정 200으로 #0016을 교체하고 #0017을 취소했다. Consumer 상세 `CANCELLED`, DB `99!`. #0018만 미결제 마감 200 / DB `05`, 정산 검색 200과 집계 필드 확인. |
| Consumer ↔ Client SSE | pass | Consumer 접수 후 Client `ORDER_STATUS_CHANGED`와 카드 표시. Client 수정 후 Consumer `STATUS_CHANGED`, 목록 재조회 200과 수정 주문 2개 표시. 미결제 후 `VISIT_CLOSED`와 마감 안내 확인. |

[추가한 실서버 스펙](../../frontend/e2e-real/ops-order-lifecycle.spec.ts)은 `frontend/.env.qa.local`에 `QA_ENABLE_ORDER_PAYMENT=1`과 주문 픽스처(`QA_TABLE_SYS_ID`/`QA_MENU_NAME` 등)를 설정해 실행한다. 이미 진행 중인 주문이 있으면 사전 검사에서 중단한다.

- `npx.cmd playwright test -c playwright.real.config.ts ops-order-lifecycle.spec.ts` / pass, 2개.
- `npm.cmd run typecheck`, `npx.cmd tsc --noEmit -p tsconfig.e2e.json`, `npx.cmd eslint e2e-real/order-payment.ts e2e-real/ops-order-lifecycle.spec.ts` / pass.
- Playwright 브라우저/API 프로브와 `psql -X -At -c` 읽기 쿼리로 수동 항목을 확인했다. 빈 응답/장애 주입 범위는 표에 명시했다.
- 공지와 문의/관리자 계정 테스트 행은 삭제 API로 정리했다. 주문 이력과 첨부 테스트 파일은 로컬 사본에 남는다. 마지막 QR 재스캔이 만든 방문에는 주문이 없다.
- 전체 테스트, 빌드, 공유 DB 적용과 배포 후 QA는 실행 범위에서 제외했다.
