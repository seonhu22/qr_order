# 테스트 결과 로그 저장

> 추가일: 2026-10-07

터미널의 출력 한도를 넘어가는 테스트 실패 내용을 파일로 보관하는 방법을 설명한다.

## 기본 로그 실행

`frontend` 디렉터리에서 실행한다.

```powershell
npm run test:log
```

기본 reporter를 사용해 파일별 결과와 전체 요약을 간결하게 출력한다. 결과는 터미널에 표시되는 동시에 실행 시각이 포함된 파일에 저장된다.

```text
frontend/src/test/test-result/test-result-YYYY-MM-DD-HHmmss-SSS.log
```

예시:

```text
frontend/src/test/test-result/test-result-2026-10-07-163925-266.log
```

밀리초까지 파일명에 포함하므로 이전 실행 결과를 덮어쓰지 않는다.

## 상세 로그 실행

개별 테스트 이름과 성공/실패 결과까지 확인해야 할 때만 verbose 명령을 사용한다.

```powershell
npm run test:log:verbose
```

전체 테스트에 사용하면 로그가 길어지므로 먼저 기본 로그에서 실패 파일을 찾고, 해당 파일만 상세 실행하는 방식을 권장한다.

## 특정 테스트만 실행

명령 뒤에 파일 경로를 전달한다.

```powershell
npm run test:log -- src/test/handlers.test.js
```

특정 파일을 상세하게 실행한다.

```powershell
npm run test:log:verbose -- src/test/handlers.test.js
```

## 최신 결과만 확인

가장 최근에 생성된 로그를 선택한다.

```powershell
$latest = Get-ChildItem .\src\test\test-result\test-result-*.log |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
```

전체 파일을 읽기 전에 마지막 요약만 확인한다.

```powershell
Get-Content -LiteralPath $latest.FullName -Tail 50
```

실패 표시가 있을 때만 관련 줄을 추출한다.

```powershell
Select-String -LiteralPath $latest.FullName `
    -Pattern "FAIL|failed|AssertionError|Error:" `
    -Context 3,10
```

## 저장된 결과 확인

특정 로그의 전체 내용이 필요한 경우에만 파일명을 지정해 읽는다.

```powershell
Get-Content .\src\test\test-result\test-result-2026-10-07-163925-266.log
```

## 동작 기준

- 결과 디렉터리가 없으면 자동으로 만든다.
- 실행마다 새 시간별 로그 파일을 만든다.
- 기본 명령은 간결한 reporter, verbose 명령은 상세 reporter를 사용한다.
- 표준 출력과 오류 출력을 터미널과 로그 파일에 함께 기록한다.
- Vitest의 종료 코드를 그대로 반환해 테스트 실패를 성공으로 처리하지 않는다.
- 로그 파일은 로컬 진단 자료이므로 Git에서 추적하지 않는다.

## 구현 위치

- [npm 명령 정의](../../package.json)
- [로그 실행 스크립트](../../scripts/run-tests-with-log.mjs)
- [시간별 파일명 유틸](../../scripts/utils/test-log-file.mjs)
- [로그 디렉터리 제외 규칙](../../../.gitignore)
