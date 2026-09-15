---
title: Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다
date: 2026-09-01
category: integration-issues
module: consumer-frontend-api-integration
problem_type: integration_issue
component: frontend_stimulus
symptoms:
  - "Consumer 세션과 주문 완료 상태가 로컬 stub과 타이머에 의해 결정된다"
  - "비활성 테이블의 신규 주문을 막으면서 기존 메뉴/주문 조회는 유지해야 한다"
  - "실제 세션 Guard를 켜면 동기식 라우트 테스트가 로딩 화면에서 실패한다"
root_cause: wrong_api
resolution_type: code_fix
severity: high
related_components:
  - "testing-framework"
  - "authentication"
tags:
  - "consumer-api"
  - "react-query"
  - "generated-client"
  - "session-guard"
  - "table-inactive"
  - "order-api"
  - "msw"
---

# Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다

## Problem

Consumer 화면이 로컬 세션 stub, 주문 성공 타이머, Zustand 주문내역에 의존해 실제 백엔드 계약과 분리되어 있었다. API 연동 시에는 방문 생명주기와 테이블 주문 가능 상태를 구분하고, 주문 제출 시점의 `TABLE_INACTIVE` 경쟁 응답도 처리해야 했다.

## Symptoms

- 새로고침하거나 유효한 서버 세션이 없어도 주문 화면에 진입할 수 있었다.
- 주문 성공 여부가 서버 응답이 아닌 1.8초 타이머로 결정됐다.
- 비활성 테이블에서도 주문 버튼이 활성화됐고 주문내역은 브라우저에만 남았다.
- `ConsumerSessionGuard`를 활성화하자 동기식 `AppRoutes` 테스트와 불완전한 MSW 구성이 실패했다.

## What Didn't Work

- `status === ACTIVE`만 주문 가능 조건으로 사용하면 활성 방문/비활성 테이블 조합을 표현할 수 없다.
- 모든 `409`를 같은 메시지로 처리하면 `TABLE_INACTIVE`와 품절 충돌을 구분할 수 없다.
- 주문 성공 전에 장바구니를 비우면 실패하거나 테이블이 비활성화된 경우 사용자의 선택을 잃는다.
- Guard를 켠 뒤 기존 동기식 `getBy...` assertion만 유지하면 실제 비동기 진입 순서를 검증하지 못한다.

## Solution

생성 클라이언트는 수정하지 않고 feature API wrapper에서 envelope 해제와 화면 모델 변환을 담당한다.

```ts
export async function fetchConsumerSession(signal?: AbortSignal) {
  const response = await getConsumerSession(undefined, signal);
  return mapConsumerSession(response.data);
}
```

세션 생명주기와 주문 가능 여부는 별도 필드로 유지한다. `ACTIVE`이면서 `orderingAllowed=false`인 세션은 메뉴와 기존 주문내역을 계속 보여주고 제출 버튼만 비활성화한다.

주문 요청은 장바구니를 생성 DTO로 변환하며, 현재 저장되지 않는 `requestNote`는 보내지 않는다.

```ts
return {
  clientRequestId: crypto.randomUUID(),
  items: cart.map((line) => ({
    menuSysId: line.menuId,
    quantity: line.qty,
    options: line.options.map((option) => ({
      optionSysId: option.choiceId,
      quantity: option.qty ?? 1,
    })),
  })),
};
```

POST 오류는 HTTP 상태뿐 아니라 안정적인 payload 코드를 함께 확인한다.

```ts
const tableInactive =
  error instanceof HttpError &&
  error.status === 409 &&
  error.payload?.error === 'TABLE_INACTIVE';
```

`TABLE_INACTIVE`이면 장바구니를 유지하고 세션 캐시를 주문 불가로 즉시 바꾼 뒤 재조회한다. 주문 성공 응답을 받은 경우에만 장바구니를 비우고 주문 목록 캐시를 무효화한다. 주문내역은 목록 API로 식별자를 얻고 상세 API로 메뉴/옵션을 조합한다.

Guard 활성화 후 테스트는 정상 세션 MSW handler를 기본 제공하고, QR/만료/종료/테이블 비활성 상태를 테스트별 override로 관리한다. 세션 조회 완료가 필요한 assertion은 `findBy...` 또는 `waitFor`를 사용한다.

## Why This Works

- UI가 생성 DTO에 직접 결합되지 않고 feature 모델만 사용한다.
- 방문 접근 가능 여부와 신규 주문 정책을 독립적으로 표현한다.
- 사전 버튼 비활성화는 UX를 개선하고, POST의 서버 판정은 경쟁 상태에서 최종 권위를 유지한다.
- 실패 시 장바구니가 보존되어 테이블 재활성화 후 그대로 다시 주문할 수 있다.
- 라우트 테스트가 실제 앱의 비동기 세션 확인 순서를 포함한다.

## Prevention

- 생성 API는 화면에서 직접 사용하지 않고 feature wrapper/mapper 뒤에 둔다.
- `session.status`와 `orderingAllowed`를 하나의 상태로 합치지 않는다.
- mutation 오류 테스트는 `HttpError.status`와 `payload.error`를 함께 검증한다.
- mutation 성공 전에는 장바구니를 비우지 않는다.
- Guard나 전역 provider를 활성화할 때 최상위 라우트 테스트와 공통 MSW handler도 함께 점검한다.
- Consumer query key에는 테이블 ID가 아니라 서버가 발급한 `consumerSessionId`를 사용한다.

## Related Issues

- [Consumer 주문/세션 API는 master 종료 상태와 잠금 기준을 먼저 고정한다](../workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md)
- [Consumer 메뉴 API는 백엔드/프론트 브랜치를 분리해 병합한다](../workflow-issues/consumer-menu-backend-frontend-branch-separation-2026-08-24.md)
- [Option menu cache not invalidated after menu CRUD](./option-menu-cache-not-invalidated-after-menu-crud-2026-07-28.md)
