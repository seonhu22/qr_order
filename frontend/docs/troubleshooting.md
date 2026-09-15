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

### 감싸는 박스에 `:focus-within` 포커스 링을 만들었는데 `<input>` 자체에도 테두리가 따로 생김

- 증상: 검색창처럼 `<input>`을 감싼 박스에 `.wrapper:focus-within { box-shadow: ... }`로 포커스 링을 만들어뒀는데, input을 클릭하면 감싼 박스와 별개로 input 자체에도 사각 테두리가 튀어나와 보임. input에 `outline: none`을 직접 줬는데도 사라지지 않음
- 원인: `reset.css`가 `input:focus-visible { outline: 2px solid var(--input-focus-border, #3b82f6); }`를 갖고 있는데, 이 선택자(요소+가상클래스, 특이성 0-1-1)가 `.wrapper-input { outline: none; }`(클래스 1개, 특이성 0-1-0)보다 특이성이 더 높아서 이긴다. 텍스트 `<input>`은 마우스 클릭만으로도 브라우저가 `:focus-visible`을 매치시키는 경우가 많아(버튼과 다름) 클릭 시에도 재현된다
- 수정: `outline: none`을 기본 상태뿐 아니라 `:focus`/`:focus-visible`에도 명시적으로 다시 건다(`shared/components/input/Input.css`의 `.input-control__input:focus, .input-control__input:focus-visible { outline: none; box-shadow: none; }`와 같은 패턴). `ConsumerHeader.css`의 `.consumer-header__search-input`에 이 패턴이 빠져 있어 재현됐다
- 참고: `<input>`을 감싼 박스가 포커스 시각화를 전담하는 모든 곳(검색창, `input-control` 계열 등)은 이 `:focus`/`:focus-visible` 이중 선언이 있어야 안전하다. 새로 비슷한 wrapper+input 구조를 만들 때 빠뜨리기 쉽다.

### `Icon` + 텍스트를 같은 색상 배너에 넣으면 아이콘이 의도보다 어둡게 보임

- 증상: `FormAlert--success`처럼 아이콘과 텍스트를 같은 success 계열로 칠했는데, 직접 만든 배너는 두 색이 똑같이 어두워 보여서 기존 컴포넌트와 톤이 다르게 느껴짐
- 원인: `Icon`(`shared/assets/icons/Icon.tsx`)은 `className`만 받는 raw `<svg>`이고 내부 `<use>`가 `currentColor`를 그대로 쓴다. 아이콘과 텍스트를 한 wrapper에 넣고 wrapper에만 `color`를 주면 아이콘도 텍스트와 같은 색으로 상속된다. 그런데 `FormAlert.css`는 아이콘에 `--color-status-success-default`(밝은 톤), 텍스트에 `--color-status-success-text`(어두운 톤)를 **따로** 지정해서 의도적으로 두 색을 분리해 둔 상태다
- 수정: wrapper에 텍스트 색만 주고, 아이콘은 `Icon`이 렌더한 `svg`를 직접 선택해 `--color-status-success-default`로 덮어쓴다(`InquiryManagementPage.css`의 `.inquiry-detail-answered-banner__left svg` 참고). `Icon`에 `className`을 넘겨 받을 수 있으면 그 클래스로 선택하는 쪽이 더 명확하다
- 참고: 상태 배너에 아이콘 + 텍스트를 같이 쓸 때는 항상 `FormAlert.css`의 `-default`(아이콘)/`-text`(텍스트) 분리 패턴을 기준으로 맞춘다.

### Playwright로 RadioInput/CheckboxInput을 `role` 클릭하면 타임아웃

- 증상: `RadioInput`/`CheckboxInput`을 쓰는 화면을 Playwright로 자동화할 때 `getByRole('checkbox' | 'radio', { name: ... }).click()`이 계속 재시도만 하다 30초 안팎에 타임아웃된다. 로그에 `<label class="checkbox-control__row">…</label> intercepts pointer events`가 남는다.
- 원인: `RadioInput`/`CheckboxInput`은 접근성을 위해 네이티브 `<input>`을 시각적으로 숨기고(`position:absolute; width:1px; height:1px; clip:...`) 그 위에 커스텀 원/박스를 그린 라벨로 감싼다. Playwright의 role 기반 `.click()`은 그 `<input>`의 실제 화면 좌표(1×1px)를 클릭하려 하는데, 같은 좌표에 더 큰 라벨 엘리먼트가 겹쳐 있어 포인터 이벤트를 가로챈다(hit-testing 실패). Testing Library의 `userEvent.click()`은 jsdom에서 좌표 히트테스트 없이 이벤트를 직접 디스패치하므로, 같은 대상을 쓰는 vitest 테스트는 이 문제 없이 통과한다.
- 재현: Playwright로 `/consumer/order`에서 메뉴 상세 시트를 열고 `dialog.getByRole('checkbox', { name: /계란후라이/ }).click()`을 실행하면 재현된다(`MenuOptionGroupList` 검증 중 확인).
- 해결: 실제 사용자처럼 보이는 라벨 텍스트(예: `.menu-option-choice__text`)를 클릭하거나, Playwright의 체크박스/라디오 전용 `.check()`(hit-testing을 우회)를 쓴다. `.click({ force: true })`도 되지만 실제 클릭 가능 여부 검증을 건너뛰므로 지양한다.
- 참고: `RadioInput`/`CheckboxInput`을 감싸는 새 화면을 Playwright로 자동화할 때 항상 해당되는 문제다.

### 모달/시트가 열릴 때만 애니메이션되고 닫힐 때는 즉시 사라짐

- 증상: `open` prop으로 여닫는 오버레이 컴포넌트(`ConsumerBottomSheet` 등)에 진입 애니메이션(`@keyframes ...`)만 걸어두면, `open`이 `false`가 되는 순간 컴포넌트가 바로 `return null`돼서 나갈 때는 애니메이션 없이 뚝 사라진다.
- 원인: React는 조건부 렌더링(`if (!open) return null`)이 꺼지는 즉시 언마운트한다 — CSS 애니메이션이 끝날 때까지 기다려주지 않는다. 닫힘 애니메이션을 넣으려면 "실제 언마운트는 애니메이션이 끝난 뒤"로 미뤄야 한다.
- 수정: `open`과 별개로 `shouldRender`/`isClosing` 상태를 두고, `open`이 `false`로 바뀌는 순간엔 `isClosing`만 켠 채 계속 렌더링하다가 `onAnimationEnd`에서 `shouldRender`를 끈다(`ConsumerBottomSheet.tsx`). `prefers-reduced-motion: reduce`면 애니메이션 자체가 없어 `onAnimationEnd`가 안 오므로, 그 경우엔 `isClosing`을 건너뛰고 바로 `shouldRender`를 끈다.
- 주의: 이 상태 조정을 `useEffect` 안에서 `setState`하면 `react-hooks/set-state-in-effect` 린트에 걸린다(effect의 setState는 한 프레임 늦게 반영돼 깜빡임 위험도 있다). `useEffect` 대신 렌더 본문에서 `if (open !== prevOpen) { setPrevOpen(open); ...setState... }` 형태로 prop 변경을 감지해 그 자리에서 상태를 조정한다 — React가 공식적으로 권장하는 "prop 변경 시 상태 조정" 패턴이다.
- 참고: 오버레이 컴포넌트(모달/시트/토스트 등)에 닫힘 애니메이션을 새로 추가할 때 항상 이 패턴을 기준으로 삼는다.

### 다른 컴포넌트의 zustand 스토어 변경에 반응해 setState하면 `set-state-in-effect` 린트 에러

- 증상: 헤더(`ConsumerHeader`)에서 zustand 스토어 값을 바꾸고, 다른 컴포넌트(`useConsumerOrderPage`)가 그 값을 `useState`로 구독한 뒤 `useEffect(() => { if (value) setLocalState(...); }, [value])`처럼 반응하면 `react-hooks/set-state-in-effect` 린트 에러가 남(`Calling setState synchronously within an effect can trigger cascading renders`).
- 원인: 이 규칙은 "effect 본문에서 곧바로 setState를 부르는" 패턴을 렌더링 파생값 계산으로 간주해 막는다. props처럼 렌더 중 계산 가능한 값이면 렌더 본문에서 처리해야 하지만, 외부 스토어의 "방금 눌린 버튼" 같은 즉발성 이벤트는 렌더 중 계산할 방법이 없다 — 그런데도 `useState` 구독 방식은 "값이 바뀌었으니 effect에서 setState"라는 같은 모양이 돼서 규칙에 걸린다.
- 해결: `useState`로 스토어 값을 구독하는 대신, zustand가 훅과 함께 노출하는 vanilla `.subscribe(callback)`을 `useEffect` 안에서 한 번만 등록하고, 실제 `setState`는 그 콜백 안에서만 부른다(`consumerOrderQaStore`를 구독하는 `useConsumerOrderPage.ts`). effect 본문 자체는 구독 등록/해제만 하므로 규칙에 걸리지 않는다.
- 참고: React 공식 문서가 권장하는 "외부 시스템 구독" 패턴과 동일하다. [모달/시트 닫힘 애니메이션](#모달시트가-열릴-때만-애니메이션되고-닫힐-때는-즉시-사라짐) 항목의 "렌더 중 상태 조정" 패턴과는 성격이 다르다 — 그건 **자기 자신의 prop** 변화이고, 이건 **남의 스토어에서 온 이벤트**라 렌더 중에 계산할 수 없다.

### 참고 저장소의 Tailwind 값을 숫자만 보고 `--spacing-N` 토큰에 옮기면 간격이 좁아진다

- 증상: 참고 저장소(Qrorder)의 `mt-2`/`mt-3`/`gap-5` 같은 Tailwind 클래스를 이 프로젝트 `--spacing-N` 토큰으로 옮기면서 숫자(2, 3, 5)를 그대로 토큰 번호로 썼더니(`--spacing-2`, `--spacing-3`, `--spacing-5`) 실제 화면 간격이 레퍼런스보다 훨씬 좁게 나옴(`OrderFailureScreen` 최초 구현에서 발견 — 사용자가 "간격이 없어 보인다"고 지적해 확인함).
- 원인: Tailwind 스페이싱 스케일(`mt-2` = 0.5rem = 8px, 4px 단위)과 이 프로젝트 `--spacing-N` 스케일(`--spacing-2` = 0.25rem = 4px, 2px 단위)은 번호가 같아도 실제 px 값이 다르다. 이 프로젝트 스케일이 더 촘촘히 늘어나 있어, Tailwind 숫자를 그대로 토큰 번호에 대입하면 항상 의도보다 좁게 나온다.
- 해결: 참고 저장소 값을 옮길 땐 번호가 아니라 **실제 px/rem 값**을 기준으로 `primitive-tokens.css`의 `--spacing-N` 표에서 같은 px를 찾아 매칭한다. 예: `mt-2`(8px) → `--spacing-4`, `mt-3`(12px) → `--spacing-6`, `gap-5`(20px) → `--spacing-9`.
- 참고: 참고 저장소 스타일을 옮기는 모든 신규 화면에서 반복될 수 있는 실수다. 간격이 유독 좁아 보이면 이 매핑부터 의심한다.

### Enter로 ConfirmModal을 열면 뜨자마자 바로 확인되어 닫힘

- 증상: 편집 중(`isDirty`) 검색창에서 **Enter**로 조회하면 "조회하시겠습니까?" 확인 모달이 떴다가 즉시 사라지고 조회가 그대로 실행됨. 같은 동작을 조회 버튼 **클릭**으로 하면 정상적으로 모달이 유지됨.
- 원인: `WrapperModal`의 포커스 트랩 `useEffect`가 모달이 열리자마자(`open` 변경 시점) 첫 번째 버튼(확인 버튼)에 동기적으로 `focus()`를 건다. 모달을 열게 한 Enter 키 입력의 `keyup`이 아직 처리되기 전이면, 이 keyup이 막 포커스된 확인 버튼에 떨어져 버튼을 즉시 클릭시켜 버린다.
- 재현/디버깅 방법: `useFilterDirtyCheck`의 `requestSearch`/`confirmFilterAction`에 `console.log`를 추가해 보면, `isDirty=true`로 모달이 열린 직후 사용자 클릭 없이 `confirmFilterAction`이 곧바로 호출되는 것을 확인할 수 있다(Playwright로 로그인 → 행추가 → 검색창 Enter 흐름을 재현해서 검증함).
- 수정: `WrapperModal.tsx`의 자동 포커스를 `setTimeout(() => firstInput?.focus(), 0)`으로 한 tick 미뤄서, 모달을 연 키 입력이 완전히 끝난 뒤에야 포커스가 이동하도록 함(`focusTimer`는 cleanup에서 `clearTimeout`).
- 주의: 이 컴포넌트는 모든 `ConfirmModal`/`SaveConfirmModal`/`SimpleDefaultModal` 등의 공용 베이스이므로, 비슷하게 "키 입력으로 연 모달이 의도치 않게 즉시 닫힌다"는 증상이 보이면 가장 먼저 이 포커스 트랩을 의심한다.
