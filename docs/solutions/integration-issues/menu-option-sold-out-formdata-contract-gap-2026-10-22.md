---
title: 메뉴/옵션 soldOutYn의 계층 간 저장 계약 누락
date: 2026-10-22
last_updated: 2026-10-22
category: integration-issues
module: client-menu-option-management
problem_type: integration_issue
component: frontend_stimulus
symptoms:
  - "옵션 상세 신규 저장 API가 sold_out_yn NOT NULL 위반으로 500을 반환함"
  - "생성 타입과 백엔드 DTO에 soldOutYn이 존재하지만 실제 FormData에는 필드가 없음"
root_cause: wrong_api
resolution_type: code_fix
severity: high
related_components:
  - "database"
  - "spring-modelattribute"
  - "multipart-formdata"
  - "openapi-generated-types"
tags:
  - "menu-option"
  - "sold-out"
  - "formdata"
  - "api-contract"
  - "not-null"
  - "hidden-state"
---

# 메뉴/옵션 soldOutYn의 계층 간 저장 계약 누락

## Problem

Client 옵션 관리에서 상세 옵션을 추가하면 `POST /api/client/menu_manage/option/detail/save`가 PostgreSQL의 `sold_out_yn NOT NULL` 위반으로 실패했다. 생성된 프론트 타입에는 `soldOutYn`이 있었지만, 수동 요청 mapper와 FormData serializer가 값을 전달하지 않았다.

같은 날 메뉴 관리의 `POST /api/client/menu_manage/menu/detail/save`에서도 동일한 DB 오류가 재발했다. 두 번째 사례는 프론트 직렬화뿐 아니라 백엔드 DTO와 MyBatis 조회/저장 SQL에도 `soldOutYn`이 없었다.

## Symptoms

- 옵션 상세 INSERT에서 `item.soldOutYn`이 `null`이었다.
- API는 일반 오류 envelope와 함께 `500`을 반환했다.
- GET과 화면 렌더링은 정상이라 쓰기 경로를 실행하기 전에는 문제가 드러나지 않았다.

## What Didn't Work

- 생성 타입에 필드가 존재한다는 사실을 계약 연결의 증거로 보았다. 필드가 optional이어서 누락해도 컴파일은 통과했다.
- 기존 FormData 테스트 fixture도 구현과 동일하게 `soldOutYn`을 누락해 DB 필수 계약을 검증하지 못했다.
- SQL에서 항상 `N`을 사용하면 오류는 사라지지만 기존 품절 상태 `Y`가 수정 저장 중 소실될 수 있다.
- DB default는 명시적으로 전달된 `NULL`과 UPDATE의 상태 보존 문제를 함께 해결하지 못한다.
- 메뉴 상세 수정 후 처음 재시험할 때 기존 `qr_order`의 백엔드가 계속 실행 중이었다. 오류의 `build/resources` 경로가 수정 worktree가 아닌 기존 폴더를 가리켰으므로, 같은 `500`은 새 코드의 실패 증거가 아니었다.
- 공용 `QuantityStepper`의 메뉴 수량 기본값을 `0`으로 바꾸는 것은 별도 문제다. 메뉴 주문 수량은 `1`, 선택되지 않은 수량형 옵션은 이미 별도 상태에서 `0`을 사용한다.

## Solution

화면에 노출되지 않는 품절 상태를 프론트 행 모델의 계약값으로 보존했다.

```ts
type MenuOptionDetailRow = {
  soldOutYn: 'Y' | 'N';
  // ...
};

// 신규 옵션은 아직 품절이 아니다.
const newRow = { soldOutYn: 'N', /* ... */ };

// 기존 품절 상태는 조회부터 저장까지 유지한다.
const row = { soldOutYn: item.soldOutYn === 'Y' ? 'Y' : 'N', /* ... */ };
```

요청 mapper와 FormData serializer에도 `soldOutYn`을 연결했다. 회귀 테스트는 신규 항목의 `N` 전송과 기존 항목의 `Y` 보존을 별도로 검증한다.

수정 전 테스트는 fixture에 값을 넣어도 `formData.get('newItems[0].soldOutYn')`이 `null`임을 확인했다. 수정 후 메뉴 옵션 테스트 14개, 전체 136개 파일/589개 테스트, typecheck, lint, build가 통과했고 사용자가 올바른 워크트리의 `dev:real`에서 저장 오류 해소를 확인했다.

메뉴 상세 재발 건은 누락 범위가 더 넓어 백엔드와 프론트를 함께 연결했다.

```text
store_menu_detail.sold_out_yn
→ MenuDetailMapper 조회/INSERT/UPDATE
→ MenuDetailItem
→ OpenAPI/generated type
→ frontend MenuDetailRow
→ response mapper
→ request mapper와 FormData JSON
```

- 신규 메뉴는 프론트에서 `N`을 보내고, 구형 요청이 값을 생략해도 서버가 `N`으로 보정한다.
- 기존 메뉴는 조회한 `Y/N`을 숨은 행 상태로 유지한다. 구형 요청이 값을 생략하면 서버가 저장된 값을 복원한다.
- 서버는 최종값이 `Y/N`인지 저장 전에 검증한다.
- 프론트 테스트는 최종 FormData JSON의 신규 `N`과 기존 `Y`를 검사하고, 백엔드 테스트는 Mapper 연결과 서비스 기본값/보존 정책을 검사한다.

## Why This Works

신규 레코드는 업무상 자연스러운 기본값 `N`으로 DB 필수 조건을 만족한다. 기존 레코드는 서버가 반환한 `Y/N`을 UI 편집 여부와 무관하게 그대로 전송하므로 숨은 상태를 잃지 않는다.

핵심은 필드를 한 계층에 추가하는 것이 아니라 다음 계약 전체를 연결하는 것이다.

```text
DB constraint
→ persistence mapper
→ backend DTO
→ OpenAPI/generated type
→ frontend model
→ response mapper
→ request mapper
→ transport serializer
→ contract test
→ dev:real QA
```

## Prevention

- 생성 타입의 존재만으로 연동 완료를 판단하지 않고 수동 mapper와 serializer 소비자를 모두 검색한다.
- DB 필수 필드가 생성 타입에서 optional이면 기본값, 검증 또는 스키마 정정 중 하나를 명시적으로 결정한다.
- GET/렌더링과 POST/PUT 영속 경로를 별도로 검증한다.
- fixture는 현재 구현을 복사하지 않고 DB 제약조건이나 API 명세 같은 독립 계약에서 작성한다.
- UI에 보이지 않는 상태값은 신규 기본값과 기존값 보존을 모두 테스트한다.
- worktree에서 검증할 때 오류 stack의 빌드 경로와 실제 실행 중인 프론트/백엔드 경로가 일치하는지 먼저 확인한다.

## Related Issues

- [메뉴 옵션 soldOutYn 계약 누락 QA 보고서](../../qa/2026-10-22-menu-option-sold-out-contract-gap-report.md)
- [메뉴 상세 soldOutYn 계약 누락 QA 보고서](../../qa/2026-10-22-menu-detail-sold-out-contract-gap-report.md)
- [ModelAttribute FormData 계약](./qna-update-modelattribute-formdata-contract-2026-07-31.md)
- [메뉴 이미지 multipart 필드 중복 바인딩](./menu-image-multipart-fields-double-binding-2026-09-03.md)
- [렌더링 중 저장 검증으로 발생한 옵션 상세 빈 화면](../runtime-errors/client-menu-option-render-dirty-validation-blank-screen-2026-10-22.md)

