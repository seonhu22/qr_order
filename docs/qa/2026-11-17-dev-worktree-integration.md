# dev / 워크트리 작업 병합

기준일: 2026-11-17. 사용자 승인: 작업한 워크트리/브랜치를 병합하고 검증한다. 원격 push는 하지 않는다.

## 병합 결과와 이유

- 병합 전 dev: `fb5d9683` / 병합 대상: `fix/staff-login-store`, `b73b4f67`.
- `git rev-list --left-right --count dev...fix/staff-login-store`가 `0 75`여서 dev만의 별도 변경이 없었다.
- `git merge --ff-only fix/staff-login-store`로 dev를 전진시켰다. 충돌/수동 코드 선택/새 merge commit은 없고 75개 기존 커밋을 보존했다.
- `fix/manager-notification-api`, `docs/notification-automation-dashboard-backlog`, `test/real-server-qa`, `fix/staff-login-store`는 모두 dev의 조상으로 확인했다.
- 관리자 알림/자동화/권한/로그인 보완을 각각 다시 병합할 필요가 없다. 관계없는 과거 브랜치는 병합하지 않았다.
- 병합 후 `qrorder`, `frontend/src`, package.json/package-lock.json은 검증한 대상 브랜치와 차이가 없었다.
- 원본 체크아웃은 dev로 전환했다. 워크트리와 브랜치는 삭제하지 않았다.

## 기존 변경 보존

- 기존 마감 백로그의 사용자 편집과 신규 후속 요구사항 문서/프론트 TODO 연결을 stash로 보존한 뒤 복원했다.
- 개인용 다음 작업 문서와 그 링크는 다른 워크트리에 그대로 두었으며 커밋/병합하지 않았다.
- 기존 미추적 `.env.qa.example`은 새 추적 템플릿과 충돌하지 않도록 `.git/merge-preserve-20261117/`에 보관했다.
- 실제 `.env.qa.local`은 Git 제외 상태를 유지했다. 비밀번호 값은 커밋/보고서에 넣지 않았다.
- 복구용 stash는 삭제하지 않았다. 사용자 편집 백로그는 별도 미커밋 상태로 보존한다.

## 검증 결과

- 원본 `qrorder`에서 `.\gradlew.bat test --console=plain`: 58개 파일/311개 테스트/실패 0/오류 0/skip 0.
- 원본에는 기존 로컬 SSEControllerTest 3개가 추가로 있어 이전 독립 워크트리의 57개/308개보다 많다.
- 임시 PostgreSQL 클러스터의 프로세스 종료를 확인했다. 공유 DB 초기화/보정 SQL 적용은 하지 않았다.
- 프론트 설치 첫 시도는 실행 중 Vite의 rolldown 모듈 잠금으로 EPERM이었다. 프로젝트 Vite PID를 확인해 종료한 뒤 `npm ci --ignore-scripts`를 재실행해 성공했다.
- 프론트 개발 서버는 원본 dev의 localhost:3000에서 복구했다.
- `npm run verify`의 단계별 결과는 [원본 실행 로그](../../frontend/src/test/test-result/verify-2026-11-17-163511-093-17000/summary.md)에 기록한다. 로그는 Git 제외 로컬 증거다.
- 원본 frontend의 `npm run verify`는 7개 검사 모두 종료 0: Node 12개/단위 156개 파일·695개 테스트/Chromium 19개/일반 타입 검사/E2E 타입 검사/lint/build 통과.
- 프론트 695개 테스트는 실패 0/skip 0이다. Chromium은 모의 API이므로 실제 서버 권한 실패를 대신 통과시킨 결과가 아니다.

## 실제 서버 반영과 QA

- 코드 병합/컴파일과 이미 실행 중인 Java 서버의 클래스 교체는 별개다.
- 기존 백엔드 프로세스는 종료하지 않았다. 운영 방식/환경을 유지하며 최신 코드 재시작이 필요하다.
- 병합 후 원본 frontend에서 `npm run test:qa:real` 실행: 서버 연결/관리자와 스태프 로그인 통과, 스태프 목록 기대 403/실제 200으로 종료 1. 주문/결제는 비활성이고 재시도하지 않았다.
- [실제 서버 자동 QA](../../frontend/docs/testing/real-server-qa.md) 결과와 모의 API 브라우저 결과는 구분한다.
- 실제 서버에서 스태프 사용자 관리 목록이 403이 된 것을 확인하기 전까지 [권한 QA 실패](./2026-11-17-real-server-permission-run.md)를 해결 완료로 표시하지 않는다.
- 추가 DB 스키마 변경/비밀번호 초기화/원격 CI 실행은 이번 병합에 포함하지 않는다.

관련 기록: [스태프 로그인](./2026-11-17-staff-login-store-binding.md), [후속 요구사항](../plans/2026-11-17-followup-work-backlog.md).
