# 기존 Consumer API 계약

> 상위 문서: [Consumer MVP API 명세](../consumer-mvp-api-spec.md)  
> 기준: 현재 백엔드 Controller/DTO. 회의 화면 모델보다 우선한다.

## 공통 JSON 응답

이미지를 제외한 API는 `CommonResponse`를 사용한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `success` | `boolean` | 요청 성공 여부 |
| `message` | `string \| null` | 사용자 안내 메시지 |
| `error` | `string \| null` | 오류 상세. 운영 응답에는 내부정보를 노출하지 않는다 |
| `data` | `object \| null` | API별 데이터 |

Consumer 요청은 쿠키 기반 `HttpSession`을 사용한다. 메뉴 API 호출 전 `GET /api/qr/{url}`이 성공해 `qrTableInfo`가 설정되어야 한다.

## `GET /api/qr/{url}`

QR과 연결된 유효한 테이블을 조회하고 `qrTableInfo`를 서버 세션에 저장한다.

성공 `200`의 `data`:

| 필드 | 타입 | 설명 |
|---|---|---|
| `sysId` | `string` | `table_info.sys_id` |
| `tableName` | `string` | 테이블 이름 |
| `tableNum` | `integer` | 테이블 번호 |
| `tableQty` | `integer` | 수용 인원 |
| `sysPlantCd` | `string` | 사업장 코드 |

유효하지 않은 QR은 `404`와 `message: "유효하지 않은 QR코드입니다."`를 반환하고 이전 `qrTableInfo`를 제거한다.

## 메뉴 공통 모델

`MenuItem`:

| 필드 | 타입 | 제약 |
|---|---|---|
| `menuSysId` | `string` | 필수 |
| `categorySysId` | `string` | 필수 |
| `categoryName` | `string` | 필수 |
| `menuName` | `string` | 필수 |
| `menuPrice` | `integer` | 원 단위, 필수 |
| `menuDescription` | `string \| null` | 선택 |
| `fileSysId` | `string \| null` | 선택 |
| `menuTag` | `string \| null` | 선택 |
| `optionUseYn` | `'Y' \| 'N'` | 필수 |
| `soldOutYn` | `'Y' \| 'N'` | 필수 |

`OptionGroup`:

| 필드 | 타입 | 제약 |
|---|---|---|
| `optionGroupSysId` | `string` | 필수 |
| `groupName` | `string` | 필수 |
| `requiredYn` | `'Y' \| 'N'` | 필수 |
| `selectionType` | `'01' \| '02' \| '03'` | 단일/복수/수량 |
| `optionList` | `OptionItem[]` | 필수 |

`OptionItem`:

| 필드 | 타입 | 제약 |
|---|---|---|
| `menuOptionSysId` | `string` | 필수 |
| `menuOptionName` | `string` | 필수 |
| `menuOptionPrice` | `integer` | 원 단위, 필수 |
| `menuOptionDescription` | `string \| null` | 선택 |
| `maximumNum` | `integer` | 수량형은 1 이상, 단일/복수는 0 |
| `defaultYn` | `'Y' \| 'N'` | 필수 |

## `GET /api/consumer/menu/main`

성공 `data` 구조:

```text
storeName: string
tableNum: integer
header.categoryList[]: { categorySysId, categoryName }
body.menuList[]: MenuItem
```

상태: `200`, QR 세션 없음 `401`, 데이터 조회 실패 `500`.

## `GET /api/consumer/menu/search`

쿼리:

- `searchKeyword?: string` — 최대 100자
- `categorySysId?: string` — 최대 64자

성공 `data.body.menuList`는 `MenuItem[]`이다. 상태: `200`, 길이 오류 `400`, QR 세션 없음 `401`, 조회 실패 `500`.

## `GET /api/consumer/menu/{menuSysId}`

성공 `data.body`는 `MenuItem` 필드 전체와 `optionGroupList: OptionGroup[]`를 가진다.

상태: `200`, 잘못된 ID `400`, QR 세션 없음 `401`, 현재 사업장 메뉴 아님 `404`, 조회/옵션 계약 오류 `500`.

## `GET /api/consumer/menu/{menuSysId}/image`

- 성공 `200`: 이미지 binary, 실제 `Content-Type`
- `Content-Disposition: inline`
- `Cache-Control: private, max-age=3600`
- QR 세션 없음 `401`
- 다른 사업장/연결 없음/삭제 파일/이미지 없음 `404`
- DB 또는 파일 읽기 실패 `500`

이미지 응답은 `CommonResponse`를 사용하지 않으며 파일 경로와 존재 사유를 노출하지 않는다.

## 코드 근거

- [QrConnectController.java](../../../qrorder/src/main/java/htms/QROrder/qr/controller/QrConnectController.java)
- [ConsumerMenuController.java](../../../qrorder/src/main/java/htms/QROrder/consumer/menu/controller/ConsumerMenuController.java)
- [Consumer menu DTO](../../../qrorder/src/main/java/htms/QROrder/consumer/menu/dto)
- [백엔드 구현 주의사항](https://app.notion.com/p/3c37bac9288d80fbacd9f536419829eb)
