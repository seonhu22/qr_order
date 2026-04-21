# 운영 원칙

> 개발·설계 운영 원칙, 기능 리팩토링 규칙, Filter 페이지 표준, CSS 레이아웃 원칙을 다룬다.

현재 단계에서 반드시 이해해야 할 개발·설계 원칙을 정리한다.

## 목차

- [1. 서버 상태와 UI 상태를 분리한다](#1-서버-상태와-ui-상태를-분리한다)
- [2. 저장/수정/삭제 응답은 공통 응답 구조를 따른다](#2-저장수정삭제-응답은-공통-응답-구조를-따른다)
- [3. 브라우저 기본 alert 사용을 지양한다](#3-브라우저-기본-alert-사용을-지양한다)
- [4. 네이밍 규칙을 통일한다](#4-네이밍-규칙을-통일한다)
- [5. 기능 리팩토링 규칙](#5-기능-리팩토링-규칙)
- [6. Filter 페이지 추천 표준](#6-filter-페이지-추천-표준)
- [7. CSS 레이아웃 원칙 — Flex 스크롤 버블링 방지](#7-css-레이아웃-원칙--flex-스크롤-버블링-방지)

---

## 1. 서버 상태와 UI 상태를 분리한다

- 서버 데이터 조회: `TanStack Query`
- 전역 UI 상태: `Zustand`

이 원칙을 지키지 않으면 상태가 서로 섞여 화면이 복잡해지고 유지보수성이 크게 떨어진다.

---

## 2. 저장/수정/삭제 응답은 공통 응답 구조를 따른다

명세 기준으로 저장성 API는 `CommonResponse` 구조를 반환한다.

```json
{ "success": true, "message": "성공 메시지" }
```

```json
{ "success": false, "message": "에러 메시지", "error": "상세 오류" }
```

프론트에서는 이 구조를 공통 처리해야 한다.

---

## 3. 브라우저 기본 alert 사용을 지양한다

`window.alert`, `window.confirm`, `window.prompt`는 사용하지 않는다.
반드시 커스텀 모달 구조로 통일해야 한다.

---

## 4. 네이밍 규칙을 통일한다

- `className`은 BEM(Block\_\_Element--Modifier) 규칙을 사용한다.
- JS/TS에서 사용하는 변수·함수·상수 기반 클래스 문자열은 camelCase를 사용한다.
- 즉, CSS 셀렉터 체계는 BEM으로 유지하고, JS에서 동적으로 조합하는 클래스 키는 camelCase로 관리한다.

---

## 5. 기능 리팩토링 규칙

공통코드 관리 화면부터는 기능 리팩토링 시 아래 순서를 기본 원칙으로 사용한다.

### 1. 페이지는 조립만 담당한다

- `pages/*`는 레이아웃과 feature 컴포넌트 조합만 맡는다.
- 서버 조회, draft 편집, 저장/삭제 흐름은 feature hook으로 위임한다.

### 2. 서버 상태와 UI 상태를 분리한다

→ [섹션 1](#1-서버-상태와-ui-상태를-분리한다) 원칙과 동일하다. 서버 조회는 TanStack Query, 선택 상태·모달 열림·입력 draft는 로컬 state 또는 feature hook으로 처리한다.

### 3. generated API는 화면에서 직접 호출하지 않는다

- `generated/*`는 feature 전용 API wrapper에서만 사용한다.
- DTO → 화면 모델 변환, payload 조합, query key 지정은 feature `api/*` 계층에서 처리한다.

### 3-1. 새 쿼리를 추가할 때 `queryKeys.ts`에 키를 등록한다

> 추가일: 2026-04-21

`src/shared/api/queryKeys.ts`는 모든 TanStack Query 캐시 키의 단일 출처다.
새 feature의 조회 API를 추가할 때 반드시 이 파일에 키를 등록하고, feature `api/*` 계층에서만 참조한다.

```ts
// queryKeys.ts
export const queryKeys = {
  myFeature: {
    list: (searchKeyword = '') =>
      ['settings', 'myFeature', 'list', { searchKeyword }] as const,
  },
};

// features/my-feature/api/myFeatureApi.ts
return useGetMyFeature(params, {
  query: { queryKey: queryKeys.myFeature.list(searchKeyword) },
});
```

- `queryClient.invalidateQueries`로 캐시를 무효화할 때도 `queryKeys`를 통해 참조한다.
- 저장/삭제 후 목록을 갱신할 때: `queryClient.invalidateQueries({ queryKey: queryKeys.myFeature.list() })`

### 4. 리팩토링은 feature 내부 분리부터 시작한다

- 바로 `shared`로 올리지 않는다.
- 한 기능에서 2회 이상 반복되거나, 다른 기능에도 같은 흐름이 확인되면 그때 shared 승격을 검토한다.

### 4-1. 반복이 확인되면 shared로 승격한다

> 추가일: 2026-04-16

- 동일한 JSX 구조가 2개 이상 페이지/feature에서 반복되면 shared 추출을 우선 검토한다.
- 특히 아래는 반복이 확인되면 개별 화면에 복사하지 않는다.
  - filter 카드 레이아웃
  - 테이블 액션 버튼
  - badge 표현
  - 테이블 셀 조각(input, checkbox, button 등)
- 단, shared로 올릴 때도 기존 CSS 클래스와 동작 계약은 유지해야 한다.
- 즉 "새 추상화"보다 "기존 UI를 깨지 않는 반복 제거"를 우선한다.

### 4-2. 편집형 테이블 본체는 shared renderer와 상태 조각으로 수렴한다

> 추가일: 2026-04-18

마스터/상세/조회형 테이블에서 아래 반복이 확인되면 개별 화면 안에 다시 작성하지 않는다.

- `columns + rows + cells` 형태의 본문 렌더링
- loading / error / empty 피드백 분기
- 마스터 액션 버튼 묶음
- 상세 액션 버튼 묶음

현재 공통 기준은 아래 shared 컴포넌트다.

- `EditableMasterTable`
- `EditableDetailTable`
- `TableBodyRenderer`
- `TableCardContentState`

이때 원칙은 다음과 같다.

- 기존 CSS 클래스와 동작은 유지한다.
- 페이지/feature는 화면 모델과 핸들러를 조립만 한다.
- shared 본체 props는 가능하면 `table`, `statusText`, `data`, `actions`처럼 역할 기준 묶음으로 정리한다.
- 단, 실제 계약은 shared 본체 책임에 따라 달라질 수 있으며 모든 테이블 본체가 동일한 props 모양을 가져야 하는 것은 아니다.
- 화면별 `columns`, `rows` 조립은 모델 팩토리 파일로 분리해 테이블 컴포넌트 본문을 줄인다.

### 5. `normalize`, `map`, `buildRequest` 같은 유틸은 feature 가까이에 둔다

- 예: `normalizeOrdNo`, `mapCommonDetailToRow`, `buildCommonDetailRequest`
- 도메인 의미가 강하므로 우선 `features/<domain>/api` 또는 `features/<domain>/hooks`에 둔다.
- 여러 기능에서 같은 입력/출력 계약으로 반복될 때만 공용 유틸로 뺀다.

### 6. API wrapper의 변환 함수 이름은 방향이 드러나게 통일한다

- DTO → 화면 모델: `mapTo[Entity]Model`
- 화면 모델 → 저장 payload: `mapTo[Entity]Payload`

```ts
// 예시
mapToCommonMasterModel;
mapToCommonDetailModel;
mapToCommonMasterPayload;
```

이 규칙은 `features/<domain>/api/*` 계층에서 우선 적용한다.

### 7. 모달 재사용은 "컴포넌트"보다 "흐름"을 먼저 본다

- `SaveConfirmModal`, `DeleteConfirmModal`, `SimpleDefaultModal` 같은 표시 컴포넌트는 이미 공용이다.
- 앞으로 재사용 대상은 `저장 요청 → 저장 확인 → 결과 안내` 같은 CRUD 흐름 상태 훅이다.

### 8. 목록 상태와 공통 flow를 나눌 수 있으면 분리한다

업무형 CRUD 화면은 아래 두 층으로 분리하는 편이 유지보수에 유리하다.

**`use<Feature>ListState`**

- baseRows, draftRows, selectedRowId, rowErrors, isDirty
- 행 추가/삭제, 필드 변경, 필수 검증

**`use<Feature>Flow`**

- 조회 전 dirty 확인
- 저장 확인/완료
- 삭제 확인/완료
- 초기화/부가 액션 모달 흐름

이 패턴은 `AdminUser`에서 먼저 적용했다.
`MessageManagement`는 현재 `useMessagePage + useEditablePageFlow` 중심의 과도기 구조를 사용하며,
추후 `useMessageListState` + `useMessageFlow`로 분리해 동일 기준으로 수렴한다.

### 8-1. 반복되는 편집형 flow는 `shared`로 승격한다

> 추가일: 2026-04-14

편집형 목록 화면에서 아래 흐름이 두 기능 이상에서 반복되면 feature 훅 안에 복사하지 말고 `shared/hooks`로 승격한다.

- 조회 전 dirty 확인
- 초기화 전 dirty 확인
- 저장 확인 모달
- 저장 완료 / 변경 없음 안내 모달

현재 이 공통 패턴은 `shared/hooks/useEditablePageFlow.ts`로 관리한다.

```ts
const flow = useEditablePageFlow({
  isDirty,
  onApplySearch,
  onResetFilters,
  onResetDraftRows,
  onValidateRequiredFields,
  onSaveChanges,
});
```

- feature 훅은 `flow.requestSearch`, `flow.requestResetFilters`, `flow.requestSave`, `flow.confirmSave` 같은 공통 액션을 page에 전달한다.
- feature 고유 로직(예: `AdminUser`의 비밀번호 초기화, 삭제 버튼 안내 문구)은 feature 훅 또는 feature flow 훅에 남긴다.
- 즉, "여러 화면에서 동일한 UX 전이"만 shared로 올리고, "도메인 의미가 강한 분기"는 feature 내부에 둔다.

### 8-2. 마스터 모달/상세 행 편집 규칙도 반복되면 `shared`로 승격한다

> 추가일: 2026-04-15

`CommonCode`, `RuleManagement`처럼 마스터-상세 CRUD 화면이 반복되면 아래 규칙도 shared 훅으로 통일한다.

- 마스터 신규/수정/삭제 모달 흐름: `shared/hooks/useCodeMasterModalFlow.ts`
- 상세 행 순번 정리/위아래 이동/행 추가삭제: `shared/hooks/useOrderedRowEditor.ts`
- 상세 저장 확인/행 단위 에러/결과 안내: `shared/hooks/useDetailTableSaveFlow.ts`

이때 도메인 라벨(예: `공통코드`, `규칙`)과 실제 저장 함수만 feature에서 주입하고, 상태 전이 규칙은 shared 훅이 담당한다.

`RuleManagement`는 이 구조를 기준으로,
- mock 저장/삭제 로직은 feature `api/*` adapter에 두고
- page는 모달 조립과 화면 배치만 담당하는 page-level orchestration 예시로 구현한다.

### 9. Feature Hook 반환 구조는 가능한 한 일관되게 유지한다

```ts
const {
  data, // 화면 렌더링에 필요한 서버/화면 모델
  status, // query/mutation 진행 상태
  actions, // 사용자 이벤트 핸들러
  uiProps, // draft, selectedId, modal state 같은 화면 전용 상태
} = useSomeFeaturePage();
```

이 구조는 `PlantSearch`, `AdminUser`에서 적용 중이다.
편집형 페이지의 모달 상태는 `uiProps.flowState` 아래에 두는 방식을 우선한다.

### 10. 리팩토링 후 테스트도 레이어에 맞춰 나눈다

- `list state` 훅: draft/dirty/검증/행 추가삭제 테스트
- `flow` 훅: 저장/조회/초기화/안내 모달 분기 테스트
- UI 컴포넌트: readonly, error, selected 같은 렌더 계약 테스트
- page 통합 테스트: 저장 확인, 삭제 확인, dirty 경고처럼 화면 조립 기준의 핵심 사용자 흐름 테스트

### 10-1. shared 본체 리팩토링 시 wrapper 테스트 계약도 함께 본다

> 추가일: 2026-04-18

`EditableMasterTable`, `EditableDetailTable` 같은 shared 본체를 바꿀 때는
wrapper 컴포넌트(`CommonCodeMasterTable`, `RuleMasterTable` 등)와 page 통합 테스트가
같이 영향을 받는다는 점을 전제로 작업한다.

- shared 본체 변경 후에는 wrapper import 경로와 props 계약을 먼저 확인한다.
- 그 다음 page 통합 테스트가 현재 문구/모달 이름 계약과 맞는지 확인한다.

### 11. 조회/초기화 dirty guard는 `useFilterDirtyCheck`를 사용한다

> 추가일: 2026-04-14

편집 상태(dirty)에서 조회·초기화 버튼을 눌렀을 때 ConfirmModal을 거치는 흐름은 `shared/hooks/useFilterDirtyCheck`로 통일한다.

```ts
const {
  pendingFilterAction,
  requestSearch,
  requestReset,
  confirmFilterAction,
  cancelFilterAction,
} = useFilterDirtyCheck({ isDirty, onSearch, onReset });
```

- `onSearch` / `onReset` 콜백에 실제 실행 로직을 넣는다. `startTransition`이 필요하면 콜백 내부에 적용한다.
- 페이지에서는 `ConfirmModal`을 `AdminMainLayout` 외부에 두고, `pendingFilterAction !== null`을 open 조건으로 사용한다.

```tsx
<ConfirmModal
  open={pendingFilterAction !== null}
  tone="info"
  title={pendingFilterAction === 'reset' ? '초기화하시겠습니까?' : '조회하시겠습니까?'}
  description="저장되지 않은 내용이 있습니다."
  onClose={cancelFilterAction}
  primaryAction={{ onClick: confirmFilterAction }}
  secondaryAction={{ onClick: cancelFilterAction }}
/>
```

적용 위치: `useCommonCodePageState`, `shared/hooks/useEditablePageFlow`

### 12. 저장 확인/완료 공통 흐름은 `useEditablePageFlow`를 사용한다

> 추가일: 2026-04-14

편집형 목록 화면에서 저장 버튼을 눌렀을 때 아래 흐름은 `shared/hooks/useEditablePageFlow`로 통일한다.

```text
저장 클릭
-> 필수값 검증(선택)
-> SaveConfirmModal 오픈
-> 저장 실행
-> "저장되었습니다." 또는 "변경된 내용이 없습니다." 안내
```

```ts
const flow = useEditablePageFlow({
  isDirty,
  onApplySearch,
  onResetFilters,
  onSaveChanges,
});
```

- 필수값 검증이 필요한 화면만 `onValidateRequiredFields`를 전달한다.
- 저장 성공/변경 없음 문구가 다르면 `savedNotice`, `unchangedNotice`로 화면별 오버라이드한다.
- 페이지에서는 `uiProps.flowState`를 사용해 `ConfirmModal`, `SaveConfirmModal`, `SimpleDefaultModal`을 조립한다.

---

### 13. 리팩토링 요약 순서

1. 페이지 조립
2. 목록 상태 훅 (`use<Feature>ListState`)
3. 공통 flow 훅 (`useEditablePageFlow`)
4. feature hook
5. API wrapper
6. feature 전용 모달 흐름 (`use<Feature>Flow`, 필요 시)

**적용 예시:**

- `CommonCode`: 페이지 조립 + 상태 훅 + 마스터/디테일 flow 훅
- `PlantSearch`: 페이지 조립 + feature hook + API wrapper
- `AdminUser`: 페이지 조립 + `useAdminUserListState` + `useEditablePageFlow` + `useAdminUserFlow`
- `MessageManagement`(현재): 페이지 조립 + feature hook + `useEditablePageFlow`
- `MessageManagement`(목표): 페이지 조립 + `useMessageListState` + `useEditablePageFlow` + `useMessageFlow`
- `RuleManagement`: 페이지 조립 + feature hook + `useCodeMasterModalFlow` + `useOrderedRowEditor` + `useDetailTableSaveFlow`
- `PaymentManage`: 페이지 조립 + `usePaymentManagePageState` + `usePaymentManageModalFlow` (feature 전용 모달 CRUD)

---

## 6. Filter 페이지 추천 표준

필터(조회) 컴포넌트가 들어가는 페이지는 아래 표준을 기본으로 사용한다.

### 조회 전용 화면 표준

대상: `PlantSearch` 같은 read-only 목록

권장 구성:

- `pages/<Feature>Page.tsx` → 조립만 담당
- `features/<feature>/hooks/use<Feature>Page.ts` → `data/status/actions/uiProps`
- `features/<feature>/api/*` → generated wrapper + mapper
- `features/<feature>/components/<Feature>Filters.tsx`
- `features/<feature>/components/<Feature>Table.tsx`

### 편집형(CRUD) 화면 표준

대상: `CommonCode`, `AdminUser` 같은 draft/저장/삭제가 있는 목록

권장 구성:

- `use<Feature>ListState`: baseRows, draftRows, selectedRowId, rowErrors, isDirty, 행 추가/삭제, 필드 변경, 필수 검증
- `useEditablePageFlow`: 조회/초기화 dirty guard, 저장 확인/완료 같은 shared flow 담당
- `use<Feature>Flow`: 삭제 확인, 비밀번호 초기화, 도메인 전용 부가 모달처럼 feature 고유 흐름만 담당
- `use<Feature>Page`: list state + shared flow + feature flow + API wrapper 조합

### 모달 CRUD 화면 표준

> 추가일: 2026-04-21

행 직접 편집 없이 **모달을 통해 등록/수정/삭제**하는 목록 화면의 표준이다.

**shared 훅을 쓸 수 있는 경우 — `코드 / 명칭 / 사용여부` 3필드 구조**

- 대상: `CommonCode` 마스터, `RuleManagement` 마스터
- 모달 흐름: `shared/hooks/useCodeMasterModalFlow.ts` 재사용
- feature 훅은 API wrapper와 목록 상태만 담당

**feature 전용 훅이 필요한 경우 — 커스텀 필드 구조**

- 대상: `PaymentManage`처럼 숫자·셀렉트 등 고유 필드 구성이 있는 경우
- `useCodeMasterModalFlow`는 3필드(코드·명칭·사용여부) 구조와 문자열 검증이 하드코딩되어 있어 필드 수나 타입이 다르면 적합하지 않다.
- `features/<feature>/hooks/use<Feature>ModalFlow.ts` 직접 작성
- `<Feature>EditorRow` 타입은 폼 입력용 string 필드로 구성 (숫자 필드도 string으로 보관, 저장 시 변환)
- 코드 필드는 등록 시에만 편집 가능, 수정 시 `readonly` 처리

> **리팩토링 예정:** `useCodeMasterModalFlow`의 하드코딩 구조를 `PaymentManage` 방식처럼 필드 구성을 외부에서 주입할 수 있도록 범용화할 예정이다. 이후에는 모든 모달 CRUD 화면이 동일한 shared 훅을 재사용하게 수렴한다.

두 경우 공통 모달 전이 흐름:

```text
등록/수정 클릭 → EditorModal 오픈
  → 필수값 검증 실패 → 필드 오류 표시
  → 검증 통과 → SaveConfirmModal / EditConfirmModal
  → 저장 실행 → 결과 안내 (SimpleDefaultModal)
  → dirty 상태에서 닫기 → DirtyWarningModal

삭제 클릭 → 선택 항목 없음 → 안내 모달
  → 선택 있음 → DeleteConfirmModal
  → 삭제 실행 → 결과 안내 (SimpleDefaultModal)
```

- `use<Feature>PageState`는 `data / status / uiProps / actions` 구조로 page에 전달한다.
- page는 테이블과 모달 조립만 담당한다.

### 신규 화면 구현 체크리스트

- `Filters`가 draft/applied 상태를 분리하는가
- 페이지가 조립만 담당하는가
- generated API를 wrapper를 통해서만 사용하는가
- 필수값 검증이 row error 상태와 함께 표시되는가
- 저장/초기화 공통 흐름이 `useEditablePageFlow`로 분리됐는가
- 삭제/부가 액션처럼 도메인 전용 흐름만 `use<Feature>Flow`에 남아 있는가
- 레이어별 단위 테스트(list state / flow / UI)가 있는가

---

## 7. CSS 레이아웃 원칙 — Flex 스크롤 버블링 방지

> 추가일: 2026-04-09

### 문제: Flex 자식의 `min-height: auto`

Flex 자식 요소는 기본적으로 `min-height: auto`를 가진다.
이 때문에 내부 콘텐츠(테이블 행 추가 등)가 늘어나면 할당된 높이를 무시하고 부모를 밀어내며, 스크롤이 의도치 않게 바깥 요소(`body` 등)까지 전파된다.

**해결: flex 자식에 `min-height: 0` 명시**

```css
/* 스크롤을 내부에서 끊어야 하는 flex 자식 */
.admin-layout__main {
  flex: 1;
  min-height: 0; /* ← 이게 없으면 콘텐츠 높이로 늘어남 */
  overflow: hidden;
}
```

전체 flex 높이 체인의 **모든 중간 노드**에 `min-height: 0`이 필요하다.
하나라도 빠지면 스크롤이 다시 바깥으로 새어나온다.

```
html/body/root
  └ admin-layout          (height: 100%; overflow: hidden)
      └ admin-layout__main  (flex: 1; min-height: 0)
          └ section
              └ content-div
                  └ article
                      └ table-wrap  (flex: 1; min-height: 0; overflow: auto)  ← 실제 스크롤
```

### SPA 뷰포트 고정 패턴

Flex `min-height` 문제와 별도로, SPA에서는 `body` 자체가 늘어나 뷰포트 레벨 스크롤이 생기는 경우가 있다.
아래를 `global.css`에 추가해 뷰포트 스크롤을 원천 차단한다.

```css
/* global.css */
html,
body {
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100%;
}
```

`overflow: hidden`만으로는 높이를 줄이지 못하므로 `height: 100%`가 반드시 함께 있어야 한다.
