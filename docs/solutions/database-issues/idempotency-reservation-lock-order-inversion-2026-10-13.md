---
title: FK 기반 멱등성 예약은 업무 행 잠금 뒤에 수행한다
date: 2026-10-13
category: database-issues
module: client-order-revision
problem_type: database_issue
component: database
severity: high
symptoms:
  - "Consumer 주문 생성과 Client 주문 수정이 동시에 실행되면 서로 다른 순서로 업무 행을 잠글 위험이 있었다."
  - "후행 동일 요청이 잠금을 기다리는 동안 선행 요청이 완료되면 최신 replay 결과를 놓칠 수 있었다."
root_cause: logic_error
resolution_type: code_fix
related_components:
  - "service_object"
tags:
  - "idempotency"
  - "transaction"
  - "lock-order"
  - "deadlock"
  - "postgresql"
  - "order-revision"
  - "foreign-key"
---

# FK 기반 멱등성 예약은 업무 행 잠금 뒤에 수행한다

## Problem

`client_order_revision`은 주문 마스터와 테이블을 외래 키로 참조한다. 따라서 멱등성 예약 INSERT도 단순 기록이 아니라 참조 행의 잠금 흐름에 참여할 수 있다.

예약을 먼저 실행하고 업무 행을 잠그면 기존 Consumer 주문의 `table_info → order_master` 순서와 달라져 교착 위험이 생긴다. 이 문제는 실제 장애가 아니라 주문 수정 구현 리뷰에서 발견한 위험이다.

## Symptoms

- 주문 생성과 주문 수정이 서로 다른 순서로 테이블/주문 행을 기다릴 수 있다.
- 동일한 `clientRequestId`의 후행 요청이 완료 응답을 replay하지 못하고 상태 충돌로 처리될 수 있다.
- PostgreSQL이 교착을 감지하면 한 트랜잭션이 롤백될 수 있다.

## What Didn't Work

초기 설계는 멱등성 키를 먼저 선점한 뒤 테이블/주문 master/group/detail을 잠그는 순서였다. 하지만 예약 행의 FK 검사가 업무 잠금보다 먼저 수행되므로 전체 시스템의 잠금 순서를 보장하지 못했다.

최초 `findRevision()` 결과만 확인하는 것도 부족하다. 후행 요청이 업무 잠금을 기다리는 사이 선행 요청이 완료될 수 있기 때문이다.

## Solution

`OrderRevisionTransactionService.revise()`는 다음 순서로 처리한다.

```text
완료 결과 조회
→ 대상 범위 조회
→ table(메뉴 추가가 있을 때)
→ order_master
→ 정렬된 order_group
→ 정렬된 order_detail
→ 완료 결과 재조회
→ 상태/메뉴 검증
→ 멱등성 예약
→ 변경과 완료 응답 저장
```

`reserveRevision()`이 충돌로 `0`을 반환하면 승자 기록을 다시 조회한다. fingerprint가 같을 때만 저장된 응답을 replay하고, 다르면 충돌로 거부한다. 예약/제거 이력/주문 변경/응답은 하나의 트랜잭션에 포함한다.

## Why This Works

모든 주문 변경이 `table_info → order_master → order_group → order_detail` 방향으로 잠근다. 동일 키 후행 요청은 선행 요청의 커밋을 기다린 뒤 두 번째 조회에서 완료 결과를 찾으므로 이미 바뀐 주문을 다시 처리하지 않는다.

서로 다른 키의 요청도 같은 업무 행에서 직렬화된다. 중간 실패 시 멱등성 예약도 함께 롤백되어 불완전한 처리 행이 남지 않는다.

## Prevention

- FK가 있는 멱등성 INSERT를 잠금 없는 기록으로 취급하지 않는다.
- 트랜잭션 설계에 전체 기능이 공유하는 잠금 순서를 명시한다.
- 멱등성 결과는 진입 시점과 잠금 대기 직후에 확인한다.
- 복수 ID는 정렬한 뒤 `FOR UPDATE`로 잠근다.
- 단위 테스트로 예약 전 검증, 대기 후 replay와 payload 충돌을 고정한다.
- 실제 PostgreSQL 두 세션에서 동일 키/다른 키의 대기, replay, rollback과 교착 부재를 확인한다.

## Related Issues

- [Consumer 주문/세션 API 잠금 계약](../workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md)
- [Client 주문 수정 구현 계획](../../plans/2026-10-12-001-feat-client-order-revision-plan.md)
