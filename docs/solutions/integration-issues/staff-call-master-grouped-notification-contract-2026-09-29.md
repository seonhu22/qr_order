---
title: 직원 호출 알림은 마스터 단위로 묶고 SSE 재연결 시 재조회한다
date: 2026-09-29
category: integration-issues
module: staff-call-notifications
problem_type: integration_issue
component: service_object
symptoms:
  - "한 번의 직원 호출에 여러 항목이 있으면 미확인 배지가 항목 수만큼 증가함"
  - "새로고침 후 미확인 호출이 어느 테이블의 호출인지 복원되지 않음"
  - "SSE 연결 중 놓친 호출이 재연결 후에도 조회되지 않음"
root_cause: wrong_api
resolution_type: code_fix
severity: high
related_components:
  - "database"
  - "frontend_stimulus"
  - "sse"
tags:
  - "staff-call"
  - "master-detail"
  - "api-contract"
  - "unread-badge"
  - "sse-reconnect"
  - "query-invalidation"
  - "database-migration"
---

# 직원 호출 알림은 마스터 단위로 묶고 SSE 재연결 시 재조회한다

## Problem

직원 호출을 마스터 1건과 항목 N건으로 저장하도록 변경했지만, 알림 조회 API는 계속 자식 행을 평면 배열로 반환했다. 저장 단위와 조회 계약이 달라 한 번의 호출이 여러 알림으로 계산됐고, SSE가 끊겼다가 다시 연결될 때 누락된 호출도 복구되지 않았다.

## Symptoms

- 물과 냅킨을 한 번에 요청하면 Client 배지가 1건이 아니라 2건으로 증가했다.
- 조회 응답에 테이블 식별값과 묶인 항목 목록이 없어 호출 한 건을 리스트 한 행으로 복원할 수 없었다.
- SSE 연결이 끊긴 동안 발생한 호출은 재연결 후에도 배지에 반영되지 않았다.

## What Didn't Work

- 마스터 테이블만 추가하면 호출 단위 계약이 완성된다고 본 접근은 부족했다. 저장, 조회 DTO, MyBatis 매핑과 Frontend 집계가 모두 같은 경계를 사용해야 한다.
- 자식 행 배열의 `length`를 사용하면 항목 수를 호출 수로 오인한다.
- SSE 이벤트 수신만으로 상태를 유지하면 연결 단절 구간의 이벤트를 복구할 수 없다.

## Solution

Backend 응답을 호출 마스터 단위로 변경했다.

```text
StaffCallNotificationGroup
├─ masterSysId
├─ tableSysId / tableNum / insertDatetime
└─ items[]
   ├─ callCd / callNm
   └─ quantity / description
```

MyBatis는 부모의 `master_sys_id`와 자식의 `item_sys_id`를 각각 `<id>`로 지정한 중첩 `resultMap`으로 JOIN 결과를 마스터 한 건과 항목 목록으로 조립한다. Frontend는 마스터 배열 길이를 미확인 호출 수로 사용한다.

```ts
export function getUnreadStaffCallCount(notifications: StaffCallNotification[]) {
  return notifications.length;
}
```

SSE 연결이 열릴 때 DB의 미확인 목록을 다시 조회하도록 query를 무효화한다.

```ts
source.onopen = () => {
  failureCount = 0;
  setDegraded(false);
  void queryClient.invalidateQueries({
    queryKey: queryKeys.staffCallNotifications.unread,
  });
};
```

마이그레이션에는 매장별 호출 코드 UNIQUE 제약, 기존 archive 충돌 검사, `lock_timeout`과 일관된 잠금 순서를 추가했다.

## Why This Works

직원 호출의 aggregate root를 마스터로 통일했기 때문이다. DB 저장, REST 응답, 객체 조립과 배지 계산이 모두 사용자가 누른 호출 한 번을 같은 단위로 취급한다. SSE는 변경 신호로 사용하고 DB 조회를 최종 상태의 기준으로 삼아 연결 중 유실된 이벤트를 복구한다.

## Prevention

- master/detail 스키마를 도입할 때 저장뿐 아니라 조회 응답, 읽음 처리와 UI count 단위를 함께 검토한다.
- 계약 테스트에는 마스터 1건과 자식 2건인 사례를 포함한다.
- SSE/WebSocket 재연결 성공 시 서버 상태와 reconciliation하는 경로를 둔다.
- 분리된 SQL/Backend/Frontend PR은 함께 합친 상태로 테스트하고 배포 순서를 명시한다.

## Related Issues

- [Consumer SSE 명시적 재연결과 polling fallback](consumer-sse-explicit-eventsource-reconnect-2026-09-15.md)
- [Consumer 세션 주문 API 통합](consumer-session-order-api-integration-2026-09-01.md)
- [GitHub #113 / 주문 상태 관리 실시간 동기화 방식 결정 제안](https://github.com/seonhu22/qr_order/issues/113)
