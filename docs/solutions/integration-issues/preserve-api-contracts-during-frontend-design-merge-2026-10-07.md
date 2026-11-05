---
title: 프론트 디자인 병합에서는 화면 구조와 실제 API 계약을 따로 검증한다
date: 2026-10-07
last_updated: 2026-11-05
category: integration-issues
module: frontend-merge-integration
problem_type: integration_issue
component: development_workflow
symptoms:
  - "디자인 브랜치를 병합하자 실제 결제 API 호출이 UI 전용 동작으로 퇴행함"
  - "직원 호출 보드가 미확인 호출 API 대신 mock 데이터에 의존함"
  - "확정되지 않은 requestNote UI가 서버에 저장되는 기능처럼 보일 수 있음"
  - "지연 로딩 표시 전 상태 변경 버튼을 다시 누를 수 있고 일부 memo가 최신 actions를 놓칠 수 있음"
root_cause: wrong_api
resolution_type: code_fix
severity: high
related_components:
  - "frontend_stimulus"
  - "payments"
tags:
  - "frontend-merge"
  - "api-contract"
  - "payment-api"
  - "staff-call"
  - "request-note"
  - "mock-regression"
---

# 프론트 디자인 병합에서는 화면 구조와 실제 API 계약을 따로 검증한다

## Problem

`origin/frontend`의 영수증/취소 이력/직원 호출 디자인을 `dev`에 병합하는 과정에서, `dev`가 이미 연결한 결제와 직원 호출 API가 mock 또는 UI 전용 동작으로 되돌아갈 수 있었다. Git 충돌이 없는 자동 병합 구간에도 의미적인 회귀가 있었다.

## Symptoms

- 결제 완료/미결제 확인 버튼이 실제 mutation을 호출하지 않았다.
- 결제 수단 선택이 새 영수증 디자인에서 빠졌다.
- 직원 호출 목록이 서버의 미확인 호출 마스터 대신 mock을 사용했다.
- 주문 단위 `requestNote` 입력이 현재 서버 저장 계약보다 앞서 추가됐다.

## What Didn't Work

- 디자인 브랜치의 파일 전체를 선택하면 검증된 API 동작을 잃는다.
- `dev` 파일 전체를 선택하면 새 디자인과 분리된 컴포넌트 구조를 잃는다.
- 충돌 표식만 제거해서는 자동 병합된 파일의 API 회귀를 찾을 수 없다.

## Solution

병합 기준을 두 축으로 나눴다.

1. 화면 구조/CSS/분리된 컴포넌트는 `origin/frontend`를 기준으로 유지했다.
2. 결제 mutation/결제 수단/직원 호출 query 같은 실행 계약은 검증된 `dev` 구현을 복원했다.
3. `useStaffCallBoard`는 실제 미확인 호출 API를 보드 모델로 변환한다. 호출 마스터 1건은 카드 1개이며 하위 항목은 카드의 배지다.
4. 취소 주문은 보드 열에서 제외하고 취소 이력 모달에 표시하되, 상태 라벨 자체는 다른 화면에서 계속 쓸 수 있게 유지했다.
5. 계약이 확정되지 않은 `requestNote`는 입력 디자인만 남기고 주문 POST에는 포함하지 않았다.
6. 로딩 스피너는 지연된 `showLoading`을 사용하되, 중복 실행 방지는 실제 mutation 상태인 `isPending`으로 즉시 비활성화했다.
7. `actions`를 비교하지 않던 `OrderStatusCard`의 사용자 정의 `memo`를 제거해 최신 콜백을 사용하게 했다.
8. 퇴장 중인 행이 복원되면 `animation.cancel()`을 호출해 이전 Web Animation의 스타일이 남지 않게 했다.

## Why This Works

디자인과 API 계약은 서로 대체 관계가 아니다. 화면은 최신 디자인을 따르면서도 이미 QA한 서버 요청/응답 계약은 별도로 보존해야 한다. 직원 호출도 DB와 SSE의 마스터 단위를 카드 단위에 맞춰야 새로고침과 실시간 갱신이 같은 의미를 가진다.

비동기 UI에서도 표시 상태와 실행 상태는 역할이 다르다. 스피너를 늦춰 깜빡임을 줄이더라도 요청은 시작 즉시 잠가야 한다. 또한 함수 prop을 누락한 사용자 정의 `memo`와 cleanup 없는 Web Animation은 각각 오래된 동작과 복원 실패를 만들 수 있으므로 정확성을 우선해 별도로 검증해야 한다.

## Prevention

- 디자인 브랜치 병합 시 충돌 파일뿐 아니라 결제/주문/SSE/직원 호출의 자동 병합 파일도 기능 단위로 비교한다.
- 실제 API hook이나 mutation이 mock import 또는 안내 문구로 바뀌지 않았는지 검색한다.
- 확정되지 않은 UI 필드는 요청 DTO에 자동으로 포함하지 않는다.
- 충돌 해소 후 typecheck/lint/build/영향 범위 테스트를 실행한다.
- 전체 테스트 시간 초과는 관련 파일 단독 재실행으로 기능 실패와 실행 부하를 구분한다.
- 지연 스피너에는 `showLoading`, 중복 요청 차단에는 실제 `isPending`을 사용한다.
- 최신 목록 상태를 참조하는 함수 prop이 있다면 사용자 정의 `memo`의 비교 대상에서 빠지지 않았는지 확인한다.
- `animate`, timer, EventSource처럼 컴포넌트보다 오래 실행될 수 있는 작업은 복원/unmount 회귀 테스트와 cleanup을 둔다.

2026-11-05 재통합에서는 typecheck/lint/build와 전체 테스트 141개 파일/609개가 통과했다. 프로덕션 빌드에는 기존 500kB 초과 chunk 경고만 남았다. 병합 커밋은 `3ab5a347`이며, `dev:real` 수동 QA는 별도 잔여 검증이다.

## Related Issues

- [Consumer 메뉴 API 작업은 백엔드와 프론트 통합 브랜치를 분리한다](../workflow-issues/consumer-menu-backend-frontend-branch-separation-2026-08-24.md)
- [Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다](./consumer-session-order-api-integration-2026-09-01.md)
- [직원 호출 알림은 마스터 단위로 묶고 SSE 재연결 시 재조회한다](./staff-call-master-grouped-notification-contract-2026-09-29.md)
- [직원 호출 개별 읽음 실패는 카드에 남기고 재시도 가능하게 한다](./staff-call-individual-read-error-feedback-2026-10-07.md)
- [오프라인 주문 수정은 자동 재시작하지 않는다](../ui-bugs/order-revision-offline-mutation-auto-resume-2026-11-05.md)
