---
title: 결제 API 생성 타입과 mock 주문번호 타입 불일치
date: 2026-09-17
category: build-errors
module: frontend payment status mock
problem_type: build_error
component: payments
severity: medium
symptoms:
  - "PR 병합 후 frontend CI typecheck가 실패했다"
  - "PaymentInfoMasterResponse.orderNum은 string이지만 paymentStatusMock은 number를 사용했다"
root_cause: wrong_api
resolution_type: code_fix
related_components:
  - testing_framework
  - tooling
tags:
  - typescript
  - generated-api-types
  - payment-status
  - mock-data
  - typecheck
---

# 결제 API 생성 타입과 mock 주문번호 타입 불일치

## Problem

PR #126~#129와 `staff-call-operations` 병합 후, 생성된 API 타입과 결제 mock 데이터의 타입 계약이 어긋나 프론트엔드 CI 타입 검사가 실패했다.

## Symptoms

- `npm run typecheck`가 실패했다.
- `paymentStatusMock.ts`의 9개 `orderNum`에서 `number`를 `string`에 할당할 수 없다는 오류가 발생했다.
- Git 병합과 프론트 빌드는 성공했지만 CI 전체 결과는 실패였다.

## What Didn't Work

- 충돌이 없고 병합 커밋이 생성된 것만으로 통합 완료를 판단하면 typed mock의 계약 드리프트를 발견하지 못한다.
- 빌드 성공만 확인해도 부족하다. 이 프로젝트의 Vite 빌드는 TypeScript 전체 타입 검사를 대신하지 않는다.

## Solution

`paymentStatusMock.ts`의 숫자형 `orderNum` 9개를 생성된 응답 타입과 같은 문자열로 변경했다.

```ts
// Before
orderNum: 1001,

// After
orderNum: '1001',
```

수정 후 다음 검증을 통과했다.

- `npm run typecheck`
- `npm run build`
- 결제/직원호출/SSE 관련 Vitest 22개
- 변경 파일과 관련 통합 파일의 ESLint 검사

## Why This Works

`PaymentInfoMasterResponse.orderNum`은 계산값이 아니라 표시와 식별에 쓰는 문자열이다. mock도 생성 타입과 같은 문자열을 사용하면 실제 API 응답을 올바르게 모사하고 앞자리 `0`도 보존할 수 있다.

## Prevention

- API 생성 파일이 바뀌거나 여러 PR을 병합한 뒤 `typecheck`를 별도 실행한다.
- mock과 fixture에 생성된 응답 타입을 적용해 계약 변경이 컴파일 단계에서 드러나게 한다.
- 병합 검증은 충돌 확인, 타입 검사, 빌드와 영향 범위 테스트를 함께 수행한다.

## Related Issues

- [Q&A update ModelAttribute requires flat FormData](../integration-issues/qna-update-modelattribute-formdata-contract-2026-07-31.md)
- [Consumer 주문/세션 API는 master 종료 상태와 잠금 기준을 먼저 고정한다](../workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md)
