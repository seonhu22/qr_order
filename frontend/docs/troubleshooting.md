# 트러블슈팅

> 추가일: 2026-04-30

## 먼저 볼 것

1. Network payload / response
2. generated DTO 타입
3. 프론트 fallback 로직
4. 백엔드 mapper / SQL / 로그

## 자주 나온 오류

### `Invalid bound statement`

- 의미: MyBatis가 mapper XML의 `id`를 못 찾음
- 우선 확인:
  - interface 메서드명
  - XML `namespace`
  - XML `select/update/insert id`
  - `build/resources/main` 반영 여부

### `Parameter 'sysId' not found`

- 의미: 리스트/foreach 문맥인데 단건 파라미터처럼 참조함
- 우선 확인:
  - `#{sysId}` 대신 `#{item.sysId}`가 맞는지
  - `@Param` 이름과 XML 참조명이 일치하는지

### `integer but expression is of type character varying`

- 의미: 숫자 컬럼에 문자열이 들어감
- 우선 확인:
  - 프론트 payload 타입
  - 백엔드 domain/DTO 타입
  - mapper 바인딩 직전 실제 타입

### 날짜 변환 오류

- 의미: 프론트가 보낸 문자열 형식과 백엔드 `Date`/`LocalDateTime` 파싱 규칙이 다름
- 우선 확인:
  - 실제 요청 문자열
  - 백엔드 `@DateTimeFormat(pattern = ...)`
  - 백엔드 재기동/반영 여부

### `200`인데 빈 배열

- 의미: 프론트보다 백엔드 조회 조건/DB 데이터 문제일 가능성이 큼
- 우선 확인:
  - 실제 response가 `[]`인지
  - SQL `where` 조건
  - `delete_yn`, `use_yn`, join 조건
  - 서버가 연결한 DB와 내가 보는 DB가 같은지
