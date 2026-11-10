# 프론트 품질 자동화 검증

## 변경 근거

- 기존 CI는 build/typecheck와 직원호출 관련 일부 테스트만 실행했다.
- 사용자 지정 순서에 따라 기능 연결 → 브라우저 자동 회귀 → CI 확대 순으로 진행했다.
- 실제 서버/DB용 전용 계정과 데이터가 준비되지 않아 브라우저 테스트는 독립 모의 API를 사용한다.
- 기존 CI의 Node 24/Ubuntu 환경을 유지하고 새 시스템/시크릿/배포 설정은 추가하지 않았다.

## 로컬 검증과 실행 경계

- Playwright Chromium 4개 시나리오 통과: 로그인, Client 상태변경/결제, Consumer 성공, Consumer 동일 ID 재시도.
- `npm run test:e2e:typecheck`, `npm run typecheck`, `npm run lint` 통과.
- CI YAML을 parser로 읽고 quality/browser job이 존재함을 확인했다.
- 전체 Vitest: 148개 파일/635개 테스트 통과(`npm test -- --maxWorkers=2`, 291.44초).
- 실제 GitHub Actions는 아직 실행하지 않았다. push하지 않았으므로 워크플로우의 원격 통과를 주장하지 않는다.
- 브라우저 테스트는 HTTP 응답을 가로채며 실제 DB 저장/트랜잭션/정산 검증을 대체하지 않는다.

## CI 구성

- Frontend Lint and Tests: `npm run lint` → `npm test -- --maxWorkers=2`.
- 동시 실행 수를 로컬/CI 모두 2로 맞춰 같은 명령으로 재현한다.
- Frontend Browser Regression: Chromium 설치 → E2E typecheck → 브라우저 4개 시나리오.
- 실패 시 HTML/스크린샷/trace를 artifact로 7일 보관한다.
- 브랜치 보호의 required check 목록 변경은 GitHub 저장소 설정 영역이므로 수행하지 않았다. 기존 job 이름을 required로 설정했다면 담당자가 새 이름으로 갱신해야 한다.

## 확인한 실행 실수와 수정

- 넓은 `**/api/**` 패턴이 Vite 소스의 `/src/shared/api/...`까지 차단해 빈 화면이 발생했다. API 경로 prefix만 검사하도록 수정했다.
- 커스텀 radio의 native input 위에 label이 있어 직접 check가 막혔다. 실제 사용자가 클릭하는 label을 클릭하고 checked 상태를 검증했다.
- 테스트 fixture의 누락 endpoint는 501과 unexpected request 목록으로 실패시켜 실제 서버로 흘러가지 않게 했다.
- 설치 후 자동 재생성된 MSW worker 변경은 이번 범위와 무관하여 복원했다.
- 기존 node_modules junction 제거가 도구 정책으로 거부되어 그대로 보존하고 새 워크트리에 독립 설치했다.

## 후속

### dev 병합 확인 / 2026-11-11

- 사용자 승인에 따라 로컬 dev를 `aed7d013`에서 `d8348d7a`로 fast-forward했다. 작업 커밋 29개를 보존했으며 충돌이나 코드 재선택은 없었다.
- 병합된 코드에서 `npm run test:e2e`를 재실행해 Chromium 4개 시나리오가 모두 통과했다(23.8초).
- 원본 폴더의 수정 중인 마감 계획 문서는 건드리지 않았고 별도 워크트리에서 처리했다.
- 실제 서버/DB 수동 QA와 원격 Actions는 여전히 미검증이다. origin push는 수행하지 않았다.

- 사용자 수동 QA: [대기 목록](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록).
- 실제 서버 자동 E2E: 전용 QA 환경/계정/초기 데이터/정리 절차 확정 후 추가한다.
- 사용자가 push한 뒤 Actions에서 새 job과 실패 artifact의 동작을 확인한다.

설정과 근거: [CI workflow](../../.github/workflows/ci.yml), [CI 정책](../../CI_POLICY.md), [브라우저 실행 안내](../../frontend/docs/testing/browser-e2e.md), [artifact 공식 문서](https://github.com/actions/upload-artifact).
