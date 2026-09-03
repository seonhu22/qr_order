---
title: Menu image multipart fields caused duplicate DTO binding
date: 2026-09-03
category: integration-issues
module: client-menu-management
problem_type: integration_issue
component: service_object
symptoms:
  - "POST /api/client/menu_manage/menu/detail/save returned HTTP 500 when saving a menu image"
  - "File newItems fields created a menu insert with menu_name set to null"
root_cause: wrong_api
resolution_type: code_fix
severity: high
related_components:
  - "spring-modelattribute"
  - "spring-requestpart"
  - "multipart-form-data"
  - "file-attachment"
tags:
  - "menu-image"
  - "multipart-form-data"
  - "request-binding"
  - "spring-mvc"
---

# Menu image multipart fields caused duplicate DTO binding

## Problem

`POST /api/client/menu_manage/menu/detail/save`가 파일만 저장하는 요청에서도 빈 메뉴를 추가로 INSERT하려 했다. 파일용 multipart 필드와 메뉴 DTO의 컬렉션 필드명이 같아 하나의 요청이 서로 다른 두 객체에 중복 바인딩됐다.

## Symptoms

- 메뉴 이미지를 저장하면 HTTP 500이 반환됐다.
- PostgreSQL은 `store_menu_detail.menu_name`의 NOT NULL 제약 위반을 보고했다.
- 실패한 메뉴 행에는 파일 요청의 `linkSysId`와 `ordNo`만 있고 `menuName`과 `menuPrice`는 null이었다.

## What Didn't Work

- 네트워크 기록상 save 요청은 한 번뿐이어서 프론트의 중복 호출은 원인이 아니었다.
- 파일 바이너리, `filePath`, `convertFileNm`은 전송되고 있었으며 오류는 파일 저장 전에 메뉴 INSERT에서 발생했다.
- DB 제약을 완화하면 잘못 생성된 빈 메뉴가 저장되므로 원인을 해결하지 못한다.

## Solution

메뉴 변경 데이터는 별도의 JSON multipart 파트로 전송한다.

```ts
formData.append(
  'menuDetailRequest',
  new Blob([JSON.stringify(request)], { type: 'application/json' }),
);
```

첨부파일은 기존 indexed multipart 필드를 유지한다.

```text
newItems[0].file
newItems[0].linkSysId
newItems[0].convertFileNm
newItems[0].filePath
newItems[0].ordNo
```

백엔드는 메뉴 JSON과 파일 form 필드의 바인딩 경계를 명시적으로 분리한다.

```java
@PostMapping(value = "/menu/detail/save", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<CommonResponse> saveMenuDetail(
        @RequestPart("menuDetailRequest") MenuDetailRequest menuDetailRequest,
        @ModelAttribute FileRequest fileRequest,
        HttpSession session) {
    // 기존 서비스 호출
}
```

Service, Mapper, SQL, DB 스키마는 변경하지 않는다.

## Why This Works

기존 Controller는 `newItems`, `updateItems`, `delItems`를 가진 `MenuDetailRequest`와 `FileRequest`를 모두 `@ModelAttribute`로 받았다. Spring은 파일용 `newItems[0].*`도 메뉴 요청에 바인딩해 `menuName = null`인 가짜 신규 메뉴를 만들었다.

수정 후 메뉴 컬렉션은 `menuDetailRequest` JSON 파트에서만 역직렬화되고, indexed multipart 필드는 `FileRequest`에만 바인딩된다. 파일 전용 요청에서는 메뉴 신규 항목이 생성되지 않는다.

## Prevention

- multipart endpoint의 여러 DTO가 동일한 루트 속성명을 공유하면 `@RequestPart` 등으로 namespace를 분리한다.
- 프론트 테스트에서 JSON 파트와 파일 필드의 실제 wire format을 검증한다.
- MockMvc 테스트에서 파일 전용 요청의 메뉴 목록은 비어 있고 파일 목록만 채워지는지 검증한다.
- DB 제약 오류를 완화하기 전에 Controller에서 만들어진 요청 객체의 실제 값을 확인한다.

## Related Issues

- [Q&A update ModelAttribute requires flat FormData](./qna-update-modelattribute-formdata-contract-2026-07-31.md)
