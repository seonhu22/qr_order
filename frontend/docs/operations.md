# 운영 원칙

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

- 서버 조회/재조회: `TanStack Query`
- 선택 상태, 모달 열림, 입력 draft, 체크 상태: 로컬 state 또는 feature hook

### 3. generated API는 화면에서 직접 호출하지 않는다

- `generated/*`는 feature 전용 API wrapper에서만 사용한다.
- DTO → 화면 모델 변환, payload 조합, query key 지정은 feature `api/*` 계층에서 처리한다.

### 4. 리팩토링은 feature 내부 분리부터 시작한다

- 바로 `shared`로 올리지 않는다.
- 한 기능에서 2회 이상 반복되거나, 다른 기능에도 같은 흐름이 확인되면 그때 shared 승격을 검토한다.

### 5. `normalize`, `map`, `buildRequest` 같은 유틸은 feature 가까이에 둔다

- 예: `normalizeOrdNo`, `mapCommonDetailToRow`, `buildCommonDetailRequest`
- 도메인 의미가 강하므로 우선 `features/<domain>/api` 또는 `features/<domain>/hooks`에 둔다.
- 여러 기능에서 같은 입력/출력 계약으로 반복될 때만 공용 유틸로 뺀다.

### 6. API wrapper의 변환 함수 이름은 방향이 드러나게 통일한다

- DTO → 화면 모델: `mapTo[Entity]Model`
- 화면 모델 → 저장 payload: `mapTo[Entity]Payload`

```ts
// 예시
mapToCommonMasterModel
mapToCommonDetailModel
mapToCommonMasterPayload
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

### 9. Feature Hook 반환 구조는 가능한 한 일관되게 유지한다

```ts
const {
  data,      // 화면 렌더링에 필요한 서버/화면 모델
  status,    // query/mutation 진행 상태
  actions,   // 사용자 이벤트 핸들러
  uiProps,   // draft, selectedId, modal state 같은 화면 전용 상태
} = useSomeFeaturePage();
```

이 구조는 `PlantSearch`, `AdminUser`에서 적용 중이다.

### 10. 리팩토링 후 테스트도 레이어에 맞춰 나눈다

- `list state` 훅: draft/dirty/검증/행 추가삭제 테스트
- `flow` 훅: 저장/조회/초기화/안내 모달 분기 테스트
- UI 컴포넌트: readonly, error, selected 같은 렌더 계약 테스트

### 11. 리팩토링 요약 순서

1. 페이지 조립
2. 목록 상태 훅 (`use<Feature>ListState`)
3. feature hook
4. API wrapper
5. 모달 흐름 상태 (`use<Feature>Flow`)

**적용 예시:**
- `CommonCode`: 페이지 조립 + 상태 훅 + 마스터/디테일 flow 훅
- `PlantSearch`: 페이지 조립 + feature hook + API wrapper
- `AdminUser`: 페이지 조립 + `useAdminUserListState` + `useAdminUserFlow`

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
- `use<Feature>Flow`: 조회 전 dirty 확인, 저장 확인/완료, 삭제 확인/완료, 초기화/부가 액션 모달 흐름
- `use<Feature>Page`: list state + flow + API wrapper 조합

### 공통 명명 규칙

- mapper:
  - DTO → 화면 모델: `mapTo[Entity]Model`
  - 화면 모델 → payload: `mapTo[Entity]Payload`
- hook 반환: `data`, `status`, `actions`, `uiProps` 유지

### 신규 화면 구현 체크리스트

- `Filters`가 draft/applied 상태를 분리하는가
- 페이지가 조립만 담당하는가
- generated API를 wrapper를 통해서만 사용하는가
- 필수값 검증이 row error 상태와 함께 표시되는가
- 저장/삭제/초기화 흐름이 `Flow` 훅으로 분리됐는가
- 레이어별 단위 테스트(list state / flow / UI)가 있는가
