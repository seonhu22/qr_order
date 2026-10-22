# 메뉴 옵션 `soldOutYn` 계약 누락 QA 보고서

## 상태

- 발견일: 2026-10-22
- 발견 단계: 주문 수정 QA-8 선행 데이터 생성
- 상태: 코드 수정 및 자동 검증 완료, `dev:real` 수동 QA 대기
- 영향 API: `POST /api/client/menu_manage/option/detail/save`

## 관찰된 오류

Client 옵션 관리에서 상세 옵션을 추가하고 저장하면 PostgreSQL이 다음 제약조건 오류를 반환했다.

```text
null value in column "sold_out_yn" of relation "store_menu_option_detail"
violates not-null constraint
```

MyBatis 로그에는 `MenuOptionDetailMapper.xml`의 INSERT에서 `#{item.soldOutYn}`이 `NULL`로 전달된 사실이 남았다.

## 원인

데이터 흐름을 계층별로 추적하면 다음과 같다.

1. DB의 `store_menu_option_detail.sold_out_yn`은 `NOT NULL`이다.
2. 백엔드 `MenuOptionDetailItem`에는 `soldOutYn`이 있다.
3. MyBatis INSERT와 UPDATE는 `#{item.soldOutYn}`을 그대로 사용한다.
4. 생성된 프론트 타입에도 `soldOutYn?: string`이 있지만 optional이다.
5. 수동으로 작성한 `mapToMenuOptionDetailPayload()`는 `soldOutYn`을 만들지 않는다.
6. 수동으로 작성한 `appendMenuOptionDetailItem()`도 FormData에 `soldOutYn`을 넣지 않는다.
7. Spring 바인딩 결과가 `null`이 되고 DB 제약조건에서 저장이 실패한다.

직접적인 결함은 프론트 요청 변환과 직렬화에서 필드를 누락한 것이다. 구조적인 결함은 DB 필수값이 OpenAPI/생성 타입에서는 optional로 표현되어 컴파일러가 누락을 막지 못한 점이다.

## 왜 기존 검증이 잡지 못했는가

### 변경 영향 범위가 끝까지 추적되지 않음

`30aecc15` 커밋에서 백엔드 DTO와 MyBatis에 `soldOutYn`이 추가됐지만 다음 소비자가 함께 검토되지 않았다.

- 프론트 화면 행 모델
- 조회 응답 → 화면 행 mapper
- 화면 행 → 요청 DTO mapper
- 요청 DTO → FormData serializer
- 실제 DB 제약조건을 포함한 저장 통합 테스트

### 테스트가 현재 구현을 복제했을 뿐 계약을 검증하지 않음

기존 FormData 테스트 fixture 자체에 `soldOutYn`이 없었다. 따라서 “DB INSERT에 필요한 모든 필드가 전송되는가”가 아니라 “현재 serializer가 전송하는 일부 필드가 존재하는가”만 확인했다.

### 자동 생성 타입을 계약 완성의 증거로 잘못 볼 수 있음

생성 타입에 필드가 존재해도 optional이면 누락이 컴파일 오류가 되지 않는다. 생성 성공과 실제 저장 계약의 완전성은 별도 검증 대상이다.

### QA 선행 데이터가 없었음

옵션 그룹에는 상세 옵션 데이터가 없어 실제 생성 저장 경로가 QA-8 직전까지 실행되지 않았다. 조회와 화면 렌더링 성공만으로 쓰기 계약까지 정상이라고 판단할 수 없었다.

## 권장 수정 방향

- 신규 상세 옵션은 `soldOutYn = 'N'`으로 생성한다.
- 기존 상세 옵션은 조회 응답의 `soldOutYn`을 화면 행에 보존한다.
- 요청 DTO mapper와 FormData serializer가 값을 전송한다.
- 기존 품절 옵션을 수정해도 `Y`가 `N`으로 바뀌지 않는 회귀 테스트를 추가한다.
- 신규 옵션 FormData에 `newItems[0].soldOutYn = N`이 존재하는지 검증한다.

백엔드 SQL에서 무조건 `N`으로 치환하는 방식은 기존 품절 상태를 소실할 수 있으므로 사용하지 않는다. 백엔드에는 별도로 요청값 검증 또는 신규 항목 기본값 부여를 추가할 수 있지만, 프론트의 계약 누락을 숨기는 대체 수정으로 사용해서는 안 된다.

## 오케스트레이션 개선

### 1. 계약 변경 영향 지도 작성

API 또는 DB 필드가 추가·변경되면 구현 전에 아래 경로를 한 줄로 연결한다.

```text
DB constraint
→ backend mapper
→ request/response DTO
→ OpenAPI/generated type
→ frontend domain model
→ inbound mapper
→ outbound mapper
→ serializer
→ contract test
→ dev:real QA
```

각 노드에 해당 파일을 적고 확인되지 않은 노드가 있으면 구현 완료로 판단하지 않는다.

### 2. 읽기 성공과 쓰기 성공을 분리

GET `200`과 화면 렌더링은 저장 계약의 증거가 아니다. CRUD 기능은 최소한 생성, 조회, 수정, 삭제 중 실제 요구 범위를 각각 한 번씩 검증한다.

### 3. 테스트를 구현이 아닌 외부 계약에서 작성

테스트 fixture는 mapper 구현을 복사해서 만들지 않는다. DB `NOT NULL`, API 명세, 백엔드 DTO처럼 독립된 계약을 기준으로 필수 필드를 나열하고 직렬화 결과를 검증한다.

### 4. 생성 코드 이후 수동 어댑터 감사

OpenAPI 생성 파일이 바뀌면 생성 파일만 확인하지 않는다. 해당 타입을 사용하는 `map*`, `build*`, `normalize*`, FormData/URLSearchParams serializer를 검색해 필드가 양방향으로 보존되는지 확인한다.

### 5. QA 차단 조건 명시

선행 데이터 생성이 실패하면 상위 시나리오를 억지로 진행하지 않는다. 실패 지점, 요청/응답, DB 오류, 재개 조건을 문서에 기록하고 해당 계약을 수정·검증한 뒤 재개한다.

## 재개 조건

- 신규 옵션 저장 API `200`
- DB의 `sold_out_yn = 'N'`
- 기존 `soldOutYn = 'Y'` 항목 수정 후 값 유지
- 새로고침 후 상세 옵션 유지
- 주문 수정 카탈로그의 `optionGroups[].options`에 저장 항목 표시

위 조건을 확인한 뒤 주문 수정 QA-8을 재개한다.

## 자동 검증 결과

- 실패 테스트 확인: `soldOutYn`을 입력 fixture에 넣어도 FormData 조회 결과가 `null`이어서 수정 전 실패함
- 수정 후 메뉴 옵션 API 테스트: 14개 통과
- 전체 프론트 테스트: 136개 파일, 589개 테스트 통과
- `npm run typecheck`: 통과
- `npm run lint`: 통과
- `npm run build`: 통과(기존 대용량 chunk 경고만 존재)

자동 검증은 프론트가 신규 `N`과 기존 `Y`를 보존해 FormData에 싣는다는 증거다. 실제 Spring 바인딩, MyBatis INSERT와 DB 저장 성공은 위 재개 조건의 수동 QA로 별도 확인한다.

