# 테스트 결과 로그 저장

> 추가일: 2026-10-07

터미널의 출력 한도를 넘어가는 테스트 실패 내용을 파일로 보관하는 방법을 설명한다.

## 전체 테스트 실행

`frontend` 디렉터리에서 실행한다.

```powershell
npm run test:log
```

결과는 터미널에 표시되는 동시에 다음 파일에 저장된다.

```text
frontend/src/test/test-result/test-result.log
```

실행할 때마다 기존 `test-result.log`를 덮어쓴다. 비교가 필요한 로그는 실행 전에 별도 위치로 복사한다.

## 특정 테스트만 실행

명령 뒤에 파일 경로를 전달한다.

```powershell
npm run test:log -- src/test/handlers.test.js
```

여러 실행 옵션도 같은 위치에 추가할 수 있다.

## 저장된 결과 확인

PowerShell에서 전체 로그를 읽는다.

```powershell
Get-Content .\src\test\test-result\test-result.log
```

마지막 300줄만 확인한다.

```powershell
Get-Content .\src\test\test-result\test-result.log -Tail 300
```

실패 관련 문구만 찾는다.

```powershell
Select-String -Path .\src\test\test-result\test-result.log `
    -Pattern "FAIL|failed|AssertionError|Error:"
```

## 동작 기준

- 결과 디렉터리가 없으면 자동으로 만든다.
- 표준 출력과 오류 출력을 터미널과 로그 파일에 함께 기록한다.
- Vitest의 종료 코드를 그대로 반환해 테스트 실패를 성공으로 처리하지 않는다.
- 로그 파일은 로컬 진단 자료이므로 Git에서 추적하지 않는다.

## 구현 위치

- [npm 명령 정의](../../package.json)
- [로그 실행 스크립트](../../scripts/run-tests-with-log.mjs)
- [로그 디렉터리 제외 규칙](../../../.gitignore)
