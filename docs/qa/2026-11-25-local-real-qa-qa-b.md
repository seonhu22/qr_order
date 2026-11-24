# 공용 첨부 저장·삭제 실서버 QA / 6번 C

2026-11-25 / `dev` `2d904c43`(5·10번 수정 포함) / 로컬 프런트엔드 `localhost:3000`, 백엔드 `127.0.0.1:8080`, PostgreSQL `qrdemo` 사본.

## 요약

정상 흐름 8건 8/8 통과(1차 6/8에서 5·10번 수정 후 재확인). 공격 검사 1-4와 읽기 확인 5a-5d는 실제 HTTP 요청 35건 35/35 통과. 읽기 범위 확인(6a-6k) 11/11 통과(2026-11-25 `dev` `65ef41aa`). 읽기 API 매장 범위 부재는 병합으로 해소됐다.

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
| 3g / `convertFileNm=..` | 400 | pass / 재실행(`65ef41aa`)에서 400, 행 0. 이전에는 200으로 `...png`가 저장됐다. 읽기 범위 절 참고. |
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

## 읽기 범위 / `dev` `65ef41aa`(`sec/attach-read-scope` 병합)

수정 전에는 `AUTOQA_B` 세션이 `DEMO01` 첨부를 목록 200(231 bytes) / `download`·`view`·`download_all` 200으로 읽을 수 있었다. 병합 후 같은 요청을 실제 HTTP로 다시 보냈다. 본문 크기는 응답 bytes다. 목록은 범위 밖이면 404 대신 `200 []`(2 bytes)로 돌려 부모 존재 여부를 숨긴다(수정 담당 결정). 공격 spec 5a-5d(범위 밖 4건)와 새 읽기 spec 6a-6k(11건)가 각각 4/4, 11/11 통과했다.

| 번호 / 요청 | 상태 / 본문 | 결과 |
| --- | --- | --- |
| 5a-5d / `AUTOQA_B` → `DEMO01` 문의 첨부: 목록, `download`, `view`, `download_all` | 200 `[]` 2 B / 404 95 B ×3 | pass / 수정 전 200 ×4 |
| 6a / 같은 요청을 6번 spec에서 재확인 | 200 2 B / 404 ×3 | pass |
| 6b / 같은 매장 문의 첨부(`AUTOQA_B` → `AUTOQA_B`) | 200 228 B / 200 68 B ×2 / 200 235 B | pass / 정상 읽기 유지 |
| 6c / Admin → Client 문의 원문 첨부(`DEMO01`) | 200 231 B / 200 68 B ×2 / 200 241 B | pass |
| 6d / Client → Admin 답변 첨부(매장 `ADMIN`) | 200 231 B / 200 68 B ×2 / 200 241 B | pass |
| 6e / Client(`target=manager`, `use_yn=Y`) → Admin 공지 첨부(매장 `ADMIN`) | 200 234 B / 200 68 B ×2 / 200 241 B | pass |
| 6f / 역방향 `DEMO01` → `AUTOQA_B` 문의 첨부 | 200 2 B / 404 ×3 | pass |
| 6g / 존재하지 않는 `sysId`로 `download` | 404 95 B | pass / 수정 전 500 |
| 6h / 존재하지 않는 `sysId`로 `view` | 404 95 B | pass / 수정 전 500 |
| 6i / 존재하지 않는 `linkSysId`로 `download_all` | 404 95 B | pass |
| 6j / 존재하지 않는 `linkSysId`로 목록 | 200 `[]` 2 B | pass |
| 6k / 부모 문의를 `qna/del`로 삭제한 뒤 같은 매장 읽기 | 200 2 B / 404 ×3 | pass / 삭제된 부모는 같은 매장도 차단 |

`convertFileNm` 검증은 위 3d-3g 표에 더해 아래를 실제 HTTP로 확인했다. 점만으로 된 이름과 경로 문자는 거절하고 한글 이름은 저장한다.

| 번호 / 이름 | 상태 | 결과 |
| --- | --- | --- |
| 3g / `..` | 400 | pass / 이전 200(`...png` 저장)에서 변경. 행 0 |
| 3i / `...` | 400 | pass / 행 0 |
| 3j / `a/b` | 400 | pass / 행 0 |
| 3f / `a:b` | 400 | pass / 행 0 |
| 3k / `메뉴 사진(1)` | 200 | pass / DB `convert_file_nm=메뉴 사진(1)`, 디스크 파일 존재 확인 |

## 실행 및 정리

- `npx playwright test -c playwright.real.config.ts qa-b-attachments.spec.ts --max-failures=0` / 3개 통과(정상 흐름, 공격 35/35, 읽기 범위 11/11) / API 전용. `ops-board-recheck.spec.ts`도 함께 3개 통과(Admin·Client 문의 원문/답변 첨부 200 유지). [QA 스펙](../../frontend/e2e-real/qa-b-attachments.spec.ts)
- 필요 환경 변수: `. D:/coding/qr_order-local/qa-env.ps1` 후 `QA_AUTH_PSQL`, `QA_AUTH_FIXTURE_PASSWORD`.
- `npm run typecheck` / `npx tsc --noEmit -p tsconfig.e2e.json`(qa-b 파일 오류 0; 다른 작업자 파일 `qa-a-con03-price.spec.ts` 오류는 범위 밖) / `git diff --check` 통과.
- 실행별 `AUTO-QA qa-b` 첨부·부모·감사·접근 로그 행과 업로드 파일, 스크래치 파일을 정리했다. 최종 확인: 첨부 0행, `AUTOQA_B` 활성 첨부 0행, `qa-b-victim.txt` 없음.
