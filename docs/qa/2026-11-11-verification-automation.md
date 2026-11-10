# 검증 자동화와 핵심 회귀 확대

## 요구와 변경 이유

- 사용자 승인: 검증 실행/실패 보고 단일화 후 핵심 브라우저 회귀를 확대한다. push/공유 DB 변경은 하지 않는다.
- 기존 근거: [로그 실행기](../../frontend/scripts/run-tests-with-log.mjs), [기존 CI](../../.github/workflows/ci.yml), [QA 대기 목록](../../frontend/docs/todo.md).
- 긴 로그를 매번 읽는 대신 검사별 결과/실패 이름/증거 위치부터 확인한다. 기존 Vitest/Playwright/GitHub Actions를 재사용해 추가 서비스나 의존성은 도입하지 않았다.

## 변경 범위

| 범위 | 구현과 이유 |
|---|---|
| 로컬 실행 | `npm run verify`로 프론트 7개 검사를 실행하고 시간별 폴더에 로그/JSON/Markdown 저장 |
| 실패 보존 | 실패 이후 나머지 검사도 실행하고 마지막에 실패 종료 코드 반환. 실행 파일 누락도 실패 처리 |
| CI 요약 | 전체 job 결과/실패 테스트명/원본 artifact 안내를 Summary에 표시 |
| CI 증거 | Vitest JSON/원본 로그 7일 보관. 기존 브라우저 실패 증거 보관 유지 |
| 관리자 알림 | 실제 항목 로드를 기다린 뒤 모두 읽음/다른 탭/새로고침 복원 확인 |
| SSE | 실제 EventSource 요청 차단 후 백오프/polling으로 외부 상태 변경 반영 확인 |
| 주문 수정 | 오프라인 무요청/초안 유지와 온라인 409 충돌 안내/직렬화 요청 확인 |
| 문의 파일 | 첫 500 후 초안 보존/재시도. 브라우저 실제 multipart 바이트의 필드/파일 내용 확인 |

생산 API/DB/권한 정책/사용자 화면 동작은 바꾸지 않았다. 미설정 API는 501로 차단하고 Service Worker를 차단해 실제 서버로 우회하지 않는다.

## 실행 중 발견과 처리

- 최초 통합 실행에서 Node 테스트의 `URL` 전역이 lint에 걸렸다. Node 모듈에서 명시적으로 import했고 lint 규칙은 완화하지 않았다.
- 이 실행은 lint 실패 후에도 단위/브라우저/build 검사를 완료한 뒤 종료 코드 1을 반환했다. 실패를 숨기지 않고 나머지 증거를 모으는 동작을 실제로 확인했다.
- SSE 테스트에서 가상 시간이 멈추면 HTTP 응답 후 React Query 렌더 타이머도 멈췄다. 시간을 재개하고 실제 카드 상태까지 검증하도록 수정했다. 생산 코드는 바꾸지 않았다.
- CI의 `tee`가 원 테스트 실패를 덮지 않도록 `shell: bash`의 pipefail을 명시했다.
- 변경 문서 링크 검사에서 기존 README 예제의 상태 정책 링크가 잘못된 상대 경로임을 확인해 실제 파일 위치로 수정했다.
- 읽기전용 검토에서 실패 종료 보존/Windows 실행/미등록 API 차단/CI 결과 누락 처리의 차단 이슈는 없었다.

## 검증 근거

- Node 스크립트 테스트 6개 통과: stdout/stderr 보존, 실행 파일 누락, 실패 이름 추출, CI 실패/건너뜀/결과 누락, 단위 테스트 요약.
- 전체 Vitest 148개 파일/635개 테스트 통과.
- Chromium 회귀 8개 통과한 1차 기록: 40.0초. 관리자 알림/주문 수정/SSE/문의 파일을 포함한다.
- CI YAML 파싱/요약 job 의존성 8개/명시적 bash 설정 검사 통과.
- 최종 `npm run verify` 종료 코드 0: 스크립트 6개/타입/lint/Vitest 148파일과 635테스트/E2E 타입/Chromium 8개/build 모두 통과. Chromium 41.8초.
- 최종 로컬 증거 폴더: `frontend/src/test/test-result/verify-2026-11-11-042256-170-28180/`. 요약/검사별 로그/Vitest JSON은 Git에서 제외한다.
- 변경 문서 링크와 `git diff --check` 통과. 테스트 실행 중 기존 Vitest/MSW 경고 로그는 남아 있어 무경고 실행을 주장하지 않는다.

## 커밋 추적

- `2a8a690e`: 로컬 검증 실행/시간별 로그/요약.
- `77d9f3c6`, `90e214a0`, `79a98d3c`: CI 결과 요약/실패 보존/실패 이름과 artifact.
- `62881627`: Node URL import/lint 오류 수정.
- `8a765c9c`: 관리자 알림 복원.
- `e0d41bb1`: SSE polling.
- `db4eba6f`: 주문 수정 오프라인/409.
- `6daec0bd`: 문의 multipart 실패/재시도.

## 남은 경계와 사용자 작업

- GitHub Actions 원격 실행/Ubuntu와 다른 OS의 CI 동작/필수 병합 검사 지정은 미검증이다. 사용자 push 후 실행 결과를 확인한다.
- 전용 QA DB/계정/초기 데이터/정리 범위가 준비되기 전 공유 DB를 사용하는 자동 쓰기는 실행하지 않는다.
- 모의 API 브라우저 통과는 실제 서버 저장/다운로드/매장 권한 검증 완료를 의미하지 않는다. 기존 수동 QA 항목은 삭제하지 않았다.
- 새 작업은 `feat/verification-summary`에 보관한다. dev 추가 병합/push는 수행하지 않는다.
- 원본 폴더의 사용자 수정 중인 마감 계획 문서는 보존했다.

사용법과 결과 위치: [검증 실행 안내](../../frontend/docs/testing/verification.md). 시나리오별 코드는 [브라우저 테스트 안내](../../frontend/docs/testing/browser-e2e.md)에서 찾는다.
