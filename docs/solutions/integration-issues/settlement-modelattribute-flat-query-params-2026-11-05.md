---
title: Settlement ModelAttribute 조회는 평면 쿼리 계약을 사용한다
date: 2026-11-05
category: integration-issues
module: client-settlement
problem_type: integration_issue
component: payments
severity: high
symptoms:
  - "정산 조회 요청이 settlementRequest=[object Object]로 직렬화되었다"
  - "결제 데이터가 DB와 결제 목록에는 존재하지만 정산 조회에는 표시되지 않았다"
root_cause: wrong_api
resolution_type: code_fix
related_components:
  - "frontend-api-client"
  - "spring-modelattribute"
  - "query-serialization"
tags:
  - "settlement"
  - "query-params"
  - "modelattribute"
  - "urlsearchparams"
  - "generated-client"
  - "transport-contract"
---

# Settlement ModelAttribute 조회는 평면 쿼리 계약을 사용한다

## Problem

결제 완료 API와 DB 저장, 결제 목록은 정상이었지만 정산 화면에는 새 결제 금액이 나타나지 않았다. 생성 API 타입의 중첩 객체와 Spring `@ModelAttribute`가 요구하는 실제 HTTP 쿼리 형식이 달랐다.

## Symptoms

- 정산 API는 `200 OK`였지만 조회 결과에 새 결제 금액이 없었다.
- 실제 URL은 `?settlementRequest=%5Bobject+Object%5D`였다.
- 정상 계약은 `?searchStartDate=2026-11-05&searchEndDate=2026-11-05`처럼 날짜 필드가 최상위에 있는 평면 쿼리다.

## What Didn't Work

- 생성된 `useGetSettlement` 훅의 타입에 맞춰 `settlementRequest` 객체를 그대로 넘기면 TypeScript는 통과하지만 공용 `httpClient`의 `URLSearchParams`에서 객체가 `[object Object]`로 변환된다.
- HTTP 상태 `200`만 확인하면 날짜 바인딩 실패를 발견할 수 없다. 결제 목록 성공도 별도 정산 조회 계약을 증명하지 않는다.
- 공용 직렬화기를 바로 확장하면 다른 생성 API의 전송 형식까지 바뀌므로 단일 API 오류에 비해 영향 범위가 지나치게 크다.

## Solution

생성 파일을 수정하지 않고 정산 feature 어댑터에서 백엔드 필드명과 같은 평면 파라미터를 전송했다.

```ts
return useQuery({
  queryKey: queryKeys.settlement.detail(params),
  queryFn: ({ signal }) =>
    httpClient<SettlementResponse>({
      url: '/api/client/payment_manage/settlement/search',
      method: 'GET',
      params: {
        searchStartDate: params.startDate,
        searchEndDate: params.endDate,
      },
      signal,
    }),
});
```

결제 직후 열린 정산 화면도 최신 데이터를 다시 받도록 결제 mutation 성공 시 `queryKeys.settlement.lists`를 무효화했다.

전송 경계 테스트는 최종 URL에 두 날짜 필드가 있고 `settlementRequest`가 없음을 검증한다.

```ts
expect(url.searchParams.get('searchStartDate')).toBe('2026-11-01');
expect(url.searchParams.get('searchEndDate')).toBe('2026-11-05');
expect(url.searchParams.has('settlementRequest')).toBe(false);
```

## Why This Works

백엔드 `SettlementRequest`의 필드는 `searchStartDate`와 `searchEndDate`이고 컨트롤러는 이를 `@ModelAttribute`로 받는다. 두 이름을 최상위 쿼리 파라미터로 보내야 Spring이 `LocalDate`에 바인딩할 수 있다.

기능 로컬 어댑터는 실제 wire contract만 바로잡고 생성 파일이나 공용 직렬화기의 다른 소비자에는 영향을 주지 않는다. 수동 `dev:real` QA에서 평면 URL, 결제 목록, 정산 금액 반영을 확인했다.

## Prevention

- 생성 타입이 컴파일되더라도 최종 URL, FormData 또는 JSON body를 전송 경계 테스트로 확인한다.
- Spring `@ModelAttribute` GET 계약은 실제 필드명을 평면 `searchParams` 단위로 고정한다.
- 조회 성공은 상태 코드뿐 아니라 요청 파라미터와 의미 있는 응답값으로 판정한다.
- 여러 화면의 데이터를 바꾸는 mutation은 영향을 받는 React Query 키를 나열하고 무효화 테스트를 둔다.
- 생성 타입과 서버 계약이 다르면 생성 파일을 직접 수정하지 않는다. 단일 API 문제는 feature 어댑터에서 최소 범위로 보정한다.

## Related Issues

- [Q&A update ModelAttribute requires flat FormData](./qna-update-modelattribute-formdata-contract-2026-07-31.md): 같은 중첩 객체 직렬화 문제의 POST/FormData 사례
- [주문 수정 통합 QA](../../qa/2026-10-14-order-revision-integration-qa.md): 결제 목록과 정산 수동 검증 결과
