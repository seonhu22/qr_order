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

### 저장 후 테이블이 로딩 상태로 깜빡임

- 의미: 저장 완료 후 `invalidateQueries`가 background refetch를 트리거하면서 테이블이 다시 로딩 UI로 진입함
- 원인: `isLoading={query.isLoading || query.isFetching}` 형태로 `isFetching`을 포함했을 때 발생
  - `isLoading`: 캐시 없는 최초 로딩에만 `true`
  - `isFetching`: 백그라운드 refetch 포함 모든 fetch 중 `true` → 저장 후에도 `true`가 됨
- 수정: `isFetching` 제거, `isLoading={query.isLoading}`만 사용

### 저장 후 로그인 만료(401) 리다이렉트

- mock 모드(`npm run dev:mock`)에서 특정 저장 API 호출 시 "로그인 인증이 만료되었습니다." 모달이 뜨며 로그인 화면으로 이동함
- 원인: `src/mocks/handlers.ts`에 해당 mutation 핸들러가 등록되지 않아 MSW가 가로채지 못하고 실제 백엔드로 fall-through → 개발 환경 백엔드가 401 반환 → `httpClient`가 `notifyUnauthorized()` 호출
- 우선 확인:
  - `src/generated/{controller}/{controller}.msw.ts`에 해당 핸들러 함수가 존재하는지
  - `src/mocks/handlers.ts` import에 해당 함수가 포함됐는지
  - `handlers` 배열에 실제로 등록됐는지(`import`만 하고 배열에 추가 안 하는 경우 주의)
- 참고: generated MSW 핸들러 중 조회(GET)는 `getXxxControllerMock()`처럼 일괄 등록되기도 하지만, 등록 및 mutation(POST/PUT/DELETE) 핸들러는 개별 등록 대상인 경우가 많으므로 신규 API 추가 시 반드시 확인
