---
title: 프론트 디자인 병합에서는 화면 구조와 실제 API 계약을 따로 검증한다
date: 2026-10-07
category: integration-issues
module: frontend-merge-integration
problem_type: integration_issue
component: development_workflow
symptoms:
  - "디자인 브랜치를 병합하자 실제 결제 API 호출이 UI 전용 동작으로 퇴행함"
  - "직원 호출 보드가 미확인 호출 API 대신 mock 데이터에 의존함"
  - "확정되지 않은 requestNote UI가 서버에 저장되는 기능처럼 보일 수 있음"
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

## Why This Works

디자인과 API 계약은 서로 대체 관계가 아니다. 화면은 최신 디자인을 따르면서도 이미 QA한 서버 요청/응답 계약은 별도로 보존해야 한다. 직원 호출도 DB와 SSE의 마스터 단위를 카드 단위에 맞춰야 새로고침과 실시간 갱신이 같은 의미를 가진다.

## Prevention

- 디자인 브랜치 병합 시 충돌 파일뿐 아니라 결제/주문/SSE/직원 호출의 자동 병합 파일도 기능 단위로 비교한다.
- 실제 API hook이나 mutation이 mock import 또는 안내 문구로 바뀌지 않았는지 검색한다.
- 확정되지 않은 UI 필드는 요청 DTO에 자동으로 포함하지 않는다.
- 충돌 해소 후 typecheck/lint/build/영향 범위 테스트를 실행한다.
- 전체 테스트 시간 초과는 관련 파일 단독 재실행으로 기능 실패와 실행 부하를 구분한다.

이번 병합에서는 typecheck/lint/build와 영향 범위 테스트 43개가 통과했다. 전체 테스트는 572개 중 3개가 5초 제한에 걸렸으나, 같은 Consumer 테스트 파일을 단독 실행했을 때 17개가 모두 통과했다.

## Related Issues

- [Consumer 메뉴 API 작업은 백엔드와 프론트 통합 브랜치를 분리한다](../workflow-issues/consumer-menu-backend-frontend-branch-separation-2026-08-24.md)
- [Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다](./consumer-session-order-api-integration-2026-09-01.md)
- [직원 호출 알림은 마스터 단위로 묶고 SSE 재연결 시 재조회한다](./staff-call-master-grouped-notification-contract-2026-09-29.md)
