# 검증 실행과 실패 요약

## 한 번에 실행

frontend 폴더에서 최초 설치 후 실행한다.

```powershell
npm ci
npx playwright install chromium
npm run verify
```

- 순서: 스크립트 테스트 → 타입 검사 → lint → 전체 Vitest → E2E 타입 검사 → Chromium 회귀 → build.
- 한 검사가 실패해도 다음 검사를 실행한다. 하나라도 실패하면 최종 종료 코드는 1이다.
- 이 명령은 프론트 검증 묶음이다. CI의 백엔드/시크릿/하네스/생성 코드 drift/다른 OS 빌드를 대신 실행하지 않는다.
- build는 기존 프로젝트 설정에 따라 백엔드 static 경로에 결과물을 생성하지만 서버를 시작하거나 DB에 접근하지 않는다.
- 다른 Playwright 실행과 동시에 실행하지 않는다. 4173 포트 충돌은 실패로 처리한다.

## 무엇부터 읽나

실행 시작/종료 시 출력되는 `src/test/test-result/verify-시간-PID/summary.md`부터 읽는다.

1. `summary.md`: 검사별 PASS/FAIL/소요 시간/로그 링크와 실패한 Vitest 파일/테스트명.
2. `results.json`: 검사별 종료 코드/실행 오류/소요 시간.
3. 실패한 검사 이름의 `.log`: 해당 검사 원본 stdout/stderr만 확인한다.
4. `vitest.json`: Vitest 구조화 결과. 전체 로그를 읽지 않고 실패 테스트를 추출하는 근거다.
5. 브라우저 실패는 [HTML/trace 열기](./browser-e2e.md#결과-보기)를 따른다.

각 검사 종료 시 결과를 저장한다. 강제 종료된 실행은 완료된 검사만 포함하며 전체 통과 증거로 사용하지 않는다.
원본 로그/JSON/브라우저 증거는 Git 추적 대상이 아니다. 외부 전달 전 민감정보 포함 여부를 확인한다.

## 기존 명령과의 차이

- `test:log`/`test:log:verbose`는 기존대로 Vitest만 실행한다. [로그 저장](./test-result-log.md).
- `verify`는 프론트 전체 검사를 묶고 요약한다. 기존 테스트 구현이나 실패 기준은 바꾸지 않는다.
- npm이 전달하는 npm CLI 경로를 Node로 실행하여 Windows `.cmd`/shell 인자 해석 차이를 피한다.
- 시간 문자열은 기존 `test-log-file.mjs` 유틸을 재사용하며 추가 라이브러리는 설치하지 않는다.

## CI 결과 확인

- 개별 검사 job은 유지하고 `Verification Summary` job이 전체 성공/실패/취소/건너뜀 결과와 실행 링크를 표시한다.
- 검사 결과가 없거나 하나라도 성공이 아니면 요약 job도 실패한다.
- `frontend-unit-evidence`: Vitest JSON/원본 로그를 7일 보관한다.
- 품질 job의 Summary에는 실패 파일/테스트명도 표시한다. 구조화 결과가 없으면 앞 단계의 설치/lint/테스트 실패부터 확인한다.
- `browser-failure-evidence`: 브라우저 실패 시 HTML/스크린샷/trace를 7일 보관한다.
- Actions 실행 화면의 Summary/Artifacts에서 확인한다. 원격 실행은 사용자 push 이후 별도 검증해야 한다.
- 브랜치 보호의 필수 검사 지정은 자동 변경하지 않는다.

## 검증 경계

브라우저 회귀는 실제 Chromium을 사용하지만 API는 독립 fixture다. 실제 서버/DB 저장/파일 다운로드 검증은 [수동 QA](../todo.md#일괄-수동-qa-대기-목록)에 남아 있다.
실제 서버 자동 테스트는 전용 QA 계정/독립 데이터/정리 범위가 확정된 후 추가한다.

구현: [실행기](../../scripts/run-verification.mjs), [로그/요약 유틸과 테스트](../../scripts/utils/verification-runner.test.mjs), [CI](../../../.github/workflows/ci.yml).

실제 검증 결과/변경 이유/커밋: [자동화 검증 보고서](../../../docs/qa/2026-11-11-verification-automation.md).
