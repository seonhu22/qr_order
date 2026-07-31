---
title: Q&A update ModelAttribute requires flat FormData
date: 2026-07-31
category: integration-issues
module: qna-management-api-integration
problem_type: integration_issue
component: frontend_stimulus
symptoms:
  - "dev 병합 CI에서 useUpdateQna 호출 인자가 생성된 API 타입과 일치하지 않았다"
  - "생성 클라이언트는 params를 요구했지만 기존 프런트엔드는 data에 QnaRequest를 전달했다"
  - "중첩 객체를 URLSearchParams로 보내면 값이 [object Object]로 직렬화될 수 있었다"
root_cause: wrong_api
resolution_type: code_fix
severity: medium
related_components:
  - "spring-modelattribute"
  - "generated-api-client"
  - "multipart-form-data"
  - "qna-management"
tags:
  - "qna-update"
  - "api-contract"
  - "modelattribute"
  - "formdata"
  - "orval"
  - "ci-typecheck"
  - "object-serialization"
---

# Q&A update ModelAttribute requires flat FormData

## Problem

Orval 재생성 후 시스템 문의 수정 API의 mutation 인자가 `{ data: QnaRequest }`에서 `{ params: UpdateQnaParams }`로 바뀌어 CI Typecheck가 실패했다. 그러나 타입에 맞춰 중첩 객체를 `params`로 보내는 것만으로는 백엔드의 두 `@ModelAttribute` 계약을 올바르게 충족하지 못한다.

## Symptoms

- `Object literal may only specify known properties, and 'data' does not exist in type '{ params: UpdateQnaParams; }'` 오류가 발생했다.
- 공통 `httpClient`는 `params`를 `URLSearchParams`로 변환하므로 중첩 객체가 `[object Object]`가 될 수 있었다.
- 백엔드는 `QnaRequest`와 `FileRequest`를 평면 form 필드로 바인딩한다.

## What Didn't Work

- `{ data: request }`를 `{ params: { qnaRequest, fileRequest } }`로 단순 변경하면 TypeScript만 만족하고 실제 wire format은 잘못될 수 있다.
- 생성 함수의 타입이 맞는다는 사실만으로 serializer와 서버 바인딩까지 맞는다고 판단할 수 없다.

## Solution

feature-local wrapper에서 답변 필드를 평면 `FormData`로 구성하고 전용 mutation으로 전송한다.

```ts
export function buildInquiryAnswerFormData(request: QnaRequest): FormData {
  const formData = new FormData();

  Object.entries(request).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value);
    }
  });

  return formData;
}
```

```ts
export function updateInquiryAnswer(request: QnaRequest, signal?: AbortSignal) {
  return httpClient<CommonResponse>({
    url: '/api/system/settings/board/qna/update',
    method: 'POST',
    data: buildInquiryAnswerFormData(request),
    signal,
  });
}
```

호출부는 Orval의 `{ data }` 또는 `{ params }` envelope에 의존하지 않고 `QnaRequest`를 mutation에 직접 전달한다. 테스트는 URL, POST 메서드, `FormData` body와 실제 필드값을 확인한다.

## Why This Works

- `sysId`, `answerYn`, `answerDescription`가 Spring `@ModelAttribute`의 속성명과 직접 일치한다.
- 중첩 객체가 `[object Object]` 문자열로 손실되지 않는다.
- `Content-Type`을 직접 지정하지 않아 브라우저가 multipart boundary를 올바르게 생성한다.
- OpenAPI 표현이 바뀌어도 feature wrapper의 실제 서버 전송 계약은 유지된다.

## Prevention

- Orval 재생성 후 함수 시그니처와 함께 실제 serializer 및 wire format을 확인한다.
- `@ModelAttribute` API는 평면 form 필드명을 API 테스트로 고정한다.
- 중첩 객체를 `URLSearchParams`에 직접 전달하지 않는다.
- Typecheck 이후 드러나는 후속 생성 타입 오류까지 모두 해결한 뒤 PR을 재실행한다.

## Related Issues

- 관련 기존 solution 문서 없음.
