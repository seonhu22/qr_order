---
title: 직원호출 개별 완료는 서버에 저장하고 조회 오류를 빈 상태와 구분한다
date: 2026-10-07
category: integration-issues
module: staff-call-notifications
problem_type: integration_issue
component: frontend_stimulus
symptoms:
  - "완료한 직원호출 카드가 새로고침 후 다시 나타남"
  - "미확인 직원호출 조회가 실패해도 직원호출이 없습니다라는 빈 상태가 표시됨"
  - "사용자가 조회 실패를 확인하거나 같은 화면에서 재시도할 수 없음"
root_cause: logic_error
resolution_type: code_fix
severity: medium
related_components:
  - "service_object"
  - "testing_framework"
tags:
  - "staff-call"
  - "react-query"
  - "error-state"
  - "retry"
  - "state-propagation"
  - "api-integration"
---

# 직원호출 개별 완료는 서버에 저장하고 조회 오류를 빈 상태와 구분한다

## Problem

주문현황의 직원호출 카드는 완료해도 현재 페이지에서만 숨겨져 새로고침하면 다시 나타났다. 개별 완료 API를 연결한 뒤 최종 리뷰에서는 미확인 호출 조회가 실패해도 정상 빈 상태처럼 보이는 별도 문제가 발견됐다.

## Symptoms

- 완료 상태가 DB에 저장되지 않아 브라우저를 새로 열면 카드가 복원됐다.
- 조회 hook은 `isLoading`, `isError`, `refetch`를 반환했지만 상위 보드가 `rows`만 전달했다.
- 최초 조회 실패도 빈 배열과 같은 렌더링 경로를 타서 "직원호출이 없습니다"라고 표시됐다.

## What Didn't Work

- 컴포넌트의 로컬 `Set`에서 카드 ID를 숨기는 방식은 서버의 `read_yn`과 일치하지 않는다.
- 데이터 배열만 전달하면 성공한 빈 응답과 실패로 데이터가 없는 상황을 구분할 수 없다.
- 성공 전에 카드를 제거하는 낙관적 처리는 API 실패 시 복구 상태를 추가로 관리해야 한다.

## Solution

`POST /api/client/staff-call/notifications/{masterSysId}/read`를 추가해 호출 마스터의 `read_yn`을 변경했다.

- UPDATE는 `masterSysId`, 로그인 세션의 `sysPlantCd`, `read_yn = 'N'`을 함께 조건으로 사용한다.
- 이미 읽음/미존재/타 매장 요청으로 0행이 변경돼도 성공 처리해 재시도와 존재 여부 비노출을 보장한다.
- 프론트는 API 성공 뒤 함수형 cache updater로 해당 마스터만 제거하고 unread query를 다시 조회한다.
- 카드별 pending/error를 보드에서 카드까지 전달해 중복 클릭을 막고 실패 시 카드를 유지한다.
- `isLoading`, `isError`, `refetch`도 컬럼까지 전달한다. 로딩/오류/재시도는 공용 `FeedbackState`로 표시하고, 성공한 빈 응답에만 정상 빈 상태를 표시한다.

## Why This Works

DB의 마스터 `read_yn`이 완료 여부의 최종 기준이므로 새로고침과 다른 브라우저에서도 같은 결과를 얻는다. React Query의 unread cache를 거쳐 `ClientLayout`이 Zustand 헤더 배지를 동기화하므로 카드와 배지가 서버 결과에 수렴한다. 조회 상태를 컴포넌트 경계 끝까지 전달해 실패와 정상 빈 응답도 구분된다.

## Prevention

- 목록 hook이 반환하는 데이터/로딩/오류/재시도 상태를 소비 UI까지 함께 전달한다.
- 서버 상태 변경은 성공 전 UI에서 제거하지 않고 실패 복구 경로를 명시한다.
- 소유권이 있는 UPDATE는 리소스 ID와 세션의 소유자 ID를 같은 WHERE 조건에 둔다.
- 목록 테스트에는 로딩/오류/재시도/성공 빈 결과를 별도 시나리오로 둔다.
- 캐시와 별도 UI store를 함께 쓰면 둘 사이의 동기화 경로까지 검증한다.

## Related Issues

- [직원 호출 알림은 마스터 단위로 묶고 SSE 재연결 시 재조회한다](./staff-call-master-grouped-notification-contract-2026-09-29.md)
- [프론트 디자인 병합에서는 화면 구조와 실제 API 계약을 따로 검증한다](./preserve-api-contracts-during-frontend-design-merge-2026-10-07.md)
- [직원호출 개별 완료 구현 계획](../../plans/2026-10-07-001-feat-staff-call-individual-read-plan.md)
