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

### 네이티브 a/button/input 포커스·호버 색상이 브랜드 컬러가 아니라 파란색으로 보임

- 증상: `Button`/`Checkbox`처럼 자체 CSS로 포커스를 override하는 공용 컴포넌트가 아닌, 일반 `<a>`/`<button>`/`<input>`/`<select>`/`<textarea>`의 포커스 외곽선과 링크 hover 색이 브랜드 오렌지가 아니라 `#3b82f6`(파란색)로 보임
- 원인: `reset.css`가 `var(--input-focus-border, #3b82f6)`/`var(--input-focus-border)`를 참조하는데, `--input-focus-border` 토큰 자체가 `semantic-tokens.css`에 정의돼 있지 않았다. CSS 커스텀 프로퍼티가 미정의면 fallback(`#3b82f6`)으로 빠지거나(`outline`), fallback이 없는 선언(`a:hover { color: var(--input-focus-border) }`)은 무효 처리되어 아무 변화도 안 보인다
- 수정: `semantic-tokens.css`에 `--input-focus-border: var(--color-border-focus);`를 추가해 브랜드 포커스 컬러와 동일하게 연결함(`Button`/`Checkbox` 등 컴포넌트별 override와 같은 값으로 통일)
- 참고: `--input-focus-border`는 `reset.css`의 네이티브 엘리먼트 포커스·호버 전용 별칭(alias)이다. 새 컴포넌트에서 포커스 스타일이 필요하면 이 토큰을 직접 참조하지 말고 `--focus-ring-brand`/`--color-border-focus`를 쓴다.

### `Icon` + 텍스트를 같은 색상 배너에 넣으면 아이콘이 의도보다 어둡게 보임

- 증상: `FormAlert--success`처럼 아이콘과 텍스트를 같은 success 계열로 칠했는데, 직접 만든 배너는 두 색이 똑같이 어두워 보여서 기존 컴포넌트와 톤이 다르게 느껴짐
- 원인: `Icon`(`shared/assets/icons/Icon.tsx`)은 `className`만 받는 raw `<svg>`이고 내부 `<use>`가 `currentColor`를 그대로 쓴다. 아이콘과 텍스트를 한 wrapper에 넣고 wrapper에만 `color`를 주면 아이콘도 텍스트와 같은 색으로 상속된다. 그런데 `FormAlert.css`는 아이콘에 `--color-status-success-default`(밝은 톤), 텍스트에 `--color-status-success-text`(어두운 톤)를 **따로** 지정해서 의도적으로 두 색을 분리해 둔 상태다
- 수정: wrapper에 텍스트 색만 주고, 아이콘은 `Icon`이 렌더한 `svg`를 직접 선택해 `--color-status-success-default`로 덮어쓴다(`InquiryManagementPage.css`의 `.inquiry-detail-answered-banner__left svg` 참고). `Icon`에 `className`을 넘겨 받을 수 있으면 그 클래스로 선택하는 쪽이 더 명확하다
- 참고: 상태 배너에 아이콘 + 텍스트를 같이 쓸 때는 항상 `FormAlert.css`의 `-default`(아이콘)/`-text`(텍스트) 분리 패턴을 기준으로 맞춘다.

### Enter로 ConfirmModal을 열면 뜨자마자 바로 확인되어 닫힘

- 증상: 편집 중(`isDirty`) 검색창에서 **Enter**로 조회하면 "조회하시겠습니까?" 확인 모달이 떴다가 즉시 사라지고 조회가 그대로 실행됨. 같은 동작을 조회 버튼 **클릭**으로 하면 정상적으로 모달이 유지됨.
- 원인: `WrapperModal`의 포커스 트랩 `useEffect`가 모달이 열리자마자(`open` 변경 시점) 첫 번째 버튼(확인 버튼)에 동기적으로 `focus()`를 건다. 모달을 열게 한 Enter 키 입력의 `keyup`이 아직 처리되기 전이면, 이 keyup이 막 포커스된 확인 버튼에 떨어져 버튼을 즉시 클릭시켜 버린다.
- 재현/디버깅 방법: `useFilterDirtyCheck`의 `requestSearch`/`confirmFilterAction`에 `console.log`를 추가해 보면, `isDirty=true`로 모달이 열린 직후 사용자 클릭 없이 `confirmFilterAction`이 곧바로 호출되는 것을 확인할 수 있다(Playwright로 로그인 → 행추가 → 검색창 Enter 흐름을 재현해서 검증함).
- 수정: `WrapperModal.tsx`의 자동 포커스를 `setTimeout(() => firstInput?.focus(), 0)`으로 한 tick 미뤄서, 모달을 연 키 입력이 완전히 끝난 뒤에야 포커스가 이동하도록 함(`focusTimer`는 cleanup에서 `clearTimeout`).
- 주의: 이 컴포넌트는 모든 `ConfirmModal`/`SaveConfirmModal`/`SimpleDefaultModal` 등의 공용 베이스이므로, 비슷하게 "키 입력으로 연 모달이 의도치 않게 즉시 닫힌다"는 증상이 보이면 가장 먼저 이 포커스 트랩을 의심한다.
