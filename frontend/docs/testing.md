# 테스트

> 프론트엔드 테스트 실행과 결과 확인 문서를 찾는 부모 문서다.

## 필요한 문서 선택

| 목적 | 문서 |
|---|---|
| 전체 테스트 실행 | [`frontend/README.md`의 권장 개발 사이클](../README.md#4-권장-개발-사이클) |
| 터미널에서 잘린 실패 결과 저장 | [테스트 결과 로그 저장](./testing/test-result-log.md) |
| Vitest, Testing Library, MSW 선택 이유 | [라이브러리/테스트 도구 구성](./libraries.md#1-테스트-도구-구성) |
| 테스트 환경 파일 역할 | [주요 설정 파일/`src/test/*`](./config.md#9-srctest) |

## 명령 선택

| 상황 | 명령 |
|---|---|
| 전체 테스트를 한 번 실행 | `npm test` |
| 간결한 전체 결과를 파일에도 저장 | `npm run test:log` |
| 개별 테스트 이름까지 파일에 저장 | `npm run test:log:verbose` |
| 수정 중인 테스트를 반복 실행 | `npm run test:watch` |
| 커버리지 확인 | `npm run test:coverage` |

명령의 세부 옵션과 출력 위치는 위 표의 상세 문서에서 확인한다.
