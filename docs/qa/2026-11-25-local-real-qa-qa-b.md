# 공용 첨부 저장·삭제 실서버 QA / 6번 C

2026-11-25 / `dev` `2d904c43`(5·10번 수정 포함) / 로컬 프런트엔드 `localhost:3000`, 백엔드 `127.0.0.1:8080`, PostgreSQL `qrdemo` 사본.

## 요약

정상 흐름 8건 8/8 통과(1차 6/8에서 5·10번 수정 후 재확인). 공격 검사 1-4는 실제 HTTP 요청 28건 28/28 통과. 읽기 API 매장 범위 부재는 별도 관찰로 기록한다.

## 정상 흐름 / API 및 저장 상태

Playwright API 클라이언트에서 저장 후 첨부 목록을 새로 요청했다. `psql`로 `attach_file`의 연결 ID, 삭제 플래그, 저장 경로를 조회했고, `Test-Path`로 파일을 확인했다. 정상 삭제는 DB `delete_yn=Y`와 물리 파일 제거를 모두 확인한다.

| 번호 / 확인 | 결과 | 증거 |
| --- | --- | --- |
| 5 / Client 문의 신규 | pass | `qna/new` 200 / 재조회 1건 / `qna/del` 200 / 문의 `Y`, 첨부 `Y` / 재조회 0건 / PNG 제거. 1차 fail(첨부 잔존)이 `5d43841e`로 수정됨. |
| 6 / Admin 공지 신규 | pass | `notice/new` 200 / 1건 → `notice/update` 삭제 200 / 0건 / DB `Y` / PNG 제거. |
| 7 / Admin 공지 수정 | pass | `notice/update` 추가·삭제 각 200 / 1건→0건 / DB `N`→`Y` / PNG 제거. |
| 8 / Admin 문의 답변 수정 | pass (API) | `board/qna/update` 추가·삭제 각 200 / 1건→0건 / PNG 제거. Admin 화면은 기존 답변 파일 삭제를 제공하지 않아 API로 직접 확인. |
| 9 / 메뉴 상세 | pass | `menu/detail/save` 메뉴+PNG 저장, 삭제 각 200 / 1건→0건 / PNG 제거. |
| 10 / 메뉴 옵션 상세 | pass | 새 옵션 행과 PNG를 같은 요청으로 `option/detail/save` 200 / 1건 / 삭제 200 / 0건 / PNG 제거. 1차 404 회귀가 `5d43841e`로 수정됨. |
| 11 / 공용 첨부 저장 | pass | 옵션 행 저장 200 후 `attach_file/save` 추가·삭제 각 200 / 1건→0건 / PNG 제거. |
| 12 / TXT 변환 및 삭제 | pass (API) | Admin 문의 답변에 TXT 저장 200 / 요청부터 응답까지 662 ms(이전 124 ms, 6,228 ms) / `pdf_yn=Y`, TXT와 `%PDF-` 헤더의 PDF 존재 / 삭제 200 / 두 파일 모두 제거. |

## 공격 검사 1-4 / 실제 HTTP

공격자는 `autoqa_manager_b`(`AUTOQA_B`) 또는 `demo_admin`(매장 `ADMIN`). 피해자 첨부는 `demo_owner`(`DEMO01`)가 만든 AUTO-QA 문의 첨부 1건이다. 각 요청 전후로 `attach_file` 행(`delete_yn`, `link_sys_id`, `file_path`, `convert_file_nm`, `ord_no`, `modify_datetime`)과 디스크 파일 존재(`Test-Path`)를 비교했고, 모두 변화가 없었다. 스크래치 파일은 `D:/coding/qr_order-local/logs/qa-b-victim.txt`(테스트가 생성·삭제)다.

### 1 / 다른 매장 첨부 삭제 → 404

| 번호 / 요청 | 상태 | 결과 |
| --- | --- | --- |
| 1a / `client/board/qna/new` + 타 매장 `delItems` | 200 | pass / 이 API는 `newItems[*].file`만 바인딩해 `delItems`를 무시한다(`BoardController` `initBinder`). 피해자 행·파일 불변. |
| 1b / `menu/detail/save` 자기 메뉴 + 타 매장 `delItems` | 404 | pass / “첨부파일을 찾을 수 없습니다.” |
| 1c / `menu/detail/save` 피해자 부모 `linkSysId` | 404 | pass / “메뉴를 찾을 수 없습니다.” |
| 1d / `option/detail/save` 자기 옵션 + 타 매장 `delItems` | 404 | pass |
| 1e / `attach_file/save` 자기 옵션 + 타 매장 `delItems` | 404 | pass |
| 1f / `attach_file/save` 피해자 부모 `linkSysId` | 404 | pass / “메뉴 옵션을 찾을 수 없습니다.” |
| 1g / `attach_file/save` 타 매장 `updateItems` | 404 | pass / `ord_no`·`modify_datetime` 불변 |
| 1h / 자기 첨부 + 타 매장 첨부 동시 삭제 | 404 | pass / 자기 첨부도 롤백(원자성) |
| 1i / `notice/update` 자기 공지 + 타 매장 `delItems` | 404 | pass |
| 1j / `board/qna/update`(답변) + 타 매장 `delItems` | 404 | pass |

### 2 / 위조 경로로 스크래치 파일 삭제 시도 → 파일 유지

| 번호 / 요청 | 상태 | 결과 |
| --- | --- | --- |
| 2a / 존재하지 않는 `sysId` + 위조 `filePath`·`convertFileNm`·`fileExt` | 404 | pass / 스크래치 파일 존재 |
| 2b / 피해자 `sysId` + 위조 경로 | 404 | pass / 스크래치 파일 존재 |
| 2c / 자기 첨부 삭제 + 위조 `filePath=logs`, `convertFileNm=qa-b-victim`, `fileExt=.txt`, `pdfYn=N` | 200 | pass / 자기 첨부 DB `Y`, 자기 PNG 제거, 스크래치 파일 존재(서버가 DB 행의 경로만 사용) |
| 2d / `updateItems`로 `filePath`·`convertFileNm` 위조 후 삭제 | 200/200 | pass / DB `file_path`·`convert_file_nm` 불변(update는 `ord_no`만 변경) / 스크래치 파일 존재 |

### 3 / 업로드 경로 위조 → 업로드 루트 하위에만 저장

| 번호 / 요청 | 상태 | 결과 |
| --- | --- | --- |
| 3a / `newItems[0].filePath=../../../qa-b-escape` | 200 | pass / 저장 경로 `uploads\MENU_OPTION`(루트 하위) / 위조 위치 파일 없음 |
| 3b / `filePath=D:/coding/qr_order-local/logs/qa-b-escape`(절대경로) | 200 | pass / 동일 |
| 3c / `filePath=..\..\qa-b-escape` | 200 | pass / 동일 |
| 3d / `convertFileNm=../../../qa-b-escape-name` | 400 | pass / “첨부파일 이름이 올바르지 않습니다.” / 행 0 |
| 3e / `convertFileNm=..\qa-b-escape-name` | 400 | pass / 행 0 |
| 3f / `convertFileNm=a:b` | 400 | pass / 행 0 |
| 3g / `convertFileNm=..` | 200 | pass(참고) / 파일 `...png`가 `MENU_OPTION` 안에 저장됨. 루트 밖 접근은 없으나 이름 검증이 `..`를 거르지 않는다. |
| 3h / 세션 `menuCd=../qa-b-menu-escape`(`menu_open_access_log`로 주입) 후 업로드 | 400 | pass / “첨부파일 저장 경로가 올바르지 않습니다.” / 행 0 / 루트 밖 디렉터리 생성 없음 |

### 4 / 같은 매장 다른 부모 → 거부

| 번호 / 요청 | 상태 | 결과 |
| --- | --- | --- |
| 4a / 옵션 A 요청으로 옵션 B 첨부 삭제 | 404 | pass |
| 4b / 메뉴 A 요청으로 메뉴 B 첨부 삭제 | 404 | pass |
| 4c / 공지 A 수정으로 공지 B 첨부 삭제 | 404 | pass |
| 4d / 옵션 A 요청 + 새 파일 `linkSysId`=옵션 B | 404 | pass / 신규 행 0 |
| 4e / 메뉴 A 요청 + 새 파일 `linkSysId`=메뉴 B | 404 | pass / 신규 행 0 |
| 4f / 공지 A 수정 + 새 파일 `linkSysId`=공지 B | 200 | pass / 서버가 연결 ID를 공지 A로 덮어써 공지 B에는 첨부되지 않음(404가 아닌 무시 방식). |

## 관찰 / 범위 밖

`AUTOQA_B` 세션이 `DEMO01` 첨부를 읽을 수 있었다: `GET /api/attach_file?linkSysId=` 200(231 bytes) / `download` 200 / `view` 200 / `download_all` 200. 읽기 API(`FileController` `getAttachFile`, `downloadFile`, `viewFile`, `downloadAllFile`)에는 매장 범위 검사가 없다. 6번 C(저장·삭제) 범위 밖이므로 판정에서 제외하고 별도 결정 사항으로 올린다.

## 실행 및 정리

- `npx playwright test -c playwright.real.config.ts qa-b-attachments.spec.ts --max-failures=0` / 2개 통과(정상 흐름, 공격 28/28) / API 전용. [QA 스펙](../../frontend/e2e-real/qa-b-attachments.spec.ts)
- 필요 환경 변수: `. D:/coding/qr_order-local/qa-env.ps1` 후 `QA_AUTH_PSQL`, `QA_AUTH_FIXTURE_PASSWORD`.
- `npm run typecheck` / `npx tsc --noEmit -p tsconfig.e2e.json`(qa-b 파일 오류 0; 다른 작업자 파일 `qa-a-con03-price.spec.ts` 오류는 범위 밖) / `git diff --check` 통과.
- 실행별 `AUTO-QA qa-b` 첨부·부모·감사·접근 로그 행과 업로드 파일, 스크래치 파일을 정리했다. 최종 확인: 첨부 0행, `AUTOQA_B` 활성 첨부 0행, `qa-b-victim.txt` 없음.
