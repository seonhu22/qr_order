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
- [8. Admin/Client 기능 패리티 원칙](#8-adminclient-기능-패리티-원칙)
- [관련 문서](#관련-문서)

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
- 행추가/행삭제가 있는 인라인 편집 테이블은 필수값 검증 실패 시 바로 필드 error를 표시하지 않는다. 먼저 안내 모달을 띄우고, 확인 클릭 후 row error 상태를 적용한다.
- 검증 안내가 1개면 `SimpleDefaultModal`, 2개 이상이면 `ValidationNoticeModal`을 사용한다.
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
- `PlantStatus`: 페이지 조립 + feature hook + API mapper (날짜 기반 상태·기간 파생, 조회 전용)
- `PaymentManage`: 페이지 조립 + `usePaymentManagePageState` + `usePaymentManageModalFlow` (feature 전용 모달 CRUD)
- `CouponManage`: 페이지 조립 + `useCouponManagePageState` + `useCouponManageModalFlow` (feature 전용 모달 CRUD, useYn 뱃지 포함)
- `AccessLog`: 페이지 조립 + `useAccessLogPageState` (datetime-local 날짜 범위 필터, 좌우 분할 마스터-디테일 조회 전용)
- `ChangeHistory`: 페이지 조립 + `useChangeHistoryPageState` (datetime-local 날짜 범위 필터, 변경 구분(auditFlag) 클라이언트 필터링 포함)
- `NoticeManage`: 페이지 조립 + `useNoticeManagePageState` + `useNoticeManageModalFlow` (feature 전용 모달 CRUD, textarea 내용 입력)

---

### 14. 페이지 이탈방지(미저장 변경 경고)는 `usePreventLeave` / `useGuardedNavigate`를 사용한다

> 추가일: 2026-06-15

편집형 페이지에서 저장하지 않은 변경(dirty) 상태로 ① 다른 메뉴/홈으로 이동, ② 새로고침/탭·창 닫기,
③ 로그아웃을 시도하면 `shared/stores/preventLeaveStore`(zustand) 기반의 공용 이탈방지 가드를 거친다.

**1) 페이지 상태 훅에서 `usePreventLeave(isDirty)` 등록**

```ts
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';

// isDirty가 확정되는 지점 바로 아래에 1줄 추가
usePreventLeave(isDirty);
```

- `isDirty === true`인 동안만 `beforeunload`를 등록해 새로고침/탭·창 닫기를 경고한다(문구는 브라우저 기본값).
- 저장이 완료되어 각 훅이 `isDirty`를 `false`로 되돌리면 별도 처리 없이 가드가 자동 해제된다.
- unmount 시에도 자동으로 dirty 상태를 해제한다.
- 페이지 안에 별도의 추가/수정 모달(예: `useCodeMasterModalFlow`)이 있다면 그 모달의 `isDirty`도 페이지 `isDirty`에 OR로 포함해야 한다. 모달만 열어 입력 중인 상태에서 새로고침해도 경고가 떠야 한다. (적용 예: `useCommonCodePageState`, `useRuleManagementPage`는 `isDetailDirty || masterFlow.isDirty`)

**2) 메뉴/홈 이동은 `guardedNavigate`로 처리**

```ts
const { guardedNavigate } = useGuardedNavigate();

guardedNavigate('/admin/main', undefined, () => {
  setActiveSection(null);
  closeSidebar();
});
```

- `isDirty === false`면 즉시 이동하고 `onNavigate` 콜백을 실행한다.
- `isDirty === true`면 이동을 보류하고 `ConfirmModal`을 띄운다. **`onNavigate`로 넘긴 부수효과(섹션 초기화, 사이드바 닫기 등)는 사용자가 "이동"을 확인한 뒤에만 실행되며, 취소 시에는 전혀 실행되지 않는다.**

**3) 로그아웃 등 navigate가 아닌 액션은 `requestLeaveConfirm`으로 처리**

```ts
const { requestLeaveConfirm } = useGuardedNavigate();

const handleLogoutClick = () => {
  requestLeaveConfirm({
    type: 'custom',
    title: '로그아웃하시겠습니까?',
    description: '저장하지 않은 내용이 있습니다.\n로그아웃하면 변경사항이 사라집니다.',
    confirmLabel: '로그아웃',
    onConfirm: () => logoutMutate(),
  });
};
```

- `isDirty === false`면 즉시 `onConfirm()`을 실행하므로, 변경사항이 없을 때는 기존과 동일하게 즉시 로그아웃된다.

**4) `ConfirmModal`은 앱 셸(`AdminLayout`/`ClientLayout`)에서 1곳만 렌더링**

`useGuardedNavigate()`가 반환하는 `pendingLeaveAction`/`confirmPendingLeaveAction`/`cancelPendingLeaveAction`을
레이아웃에서 구독해 `ConfirmModal` 1개로 처리한다. Sidebar/Header에서 호출한 `guardedNavigate`/`requestLeaveConfirm`은
같은 zustand store를 공유하므로 레이아웃의 모달에 즉시 반영된다.

**알려진 제한사항**

- 브라우저 뒤로/앞으로가기 버튼은 가드하지 않는다(`<BrowserRouter>` history stack 조작이 필요해 fragile).
- `beforeunload` 확인창 문구는 브라우저 기본값이며 커스터마이징할 수 없다.
- 한 시점에 하나의 dirty source만 존재한다고 가정한다(여러 화면이 동시에 dirty를 등록하는 구조는 미지원).

적용 위치: `useMessagePage`, `useCommonCodePageState`, `useAdminUserPage`, `useRuleManagementPage`, `useCouponManagePageState`, `usePaymentManagePageState`, `useNoticeManagePageState`, `useSystemMenuPageState`

설계 배경(`useBlocker` 대신 guarded navigate를 선택한 이유, 검토했던 대안)은 [`decisions.md`](./decisions.md) ADR-009 참고.

---

## 6. Filter 페이지 추천 표준

필터(조회) 컴포넌트가 들어가는 페이지는 아래 표준을 기본으로 사용한다.

### 조회 전용 화면 표준

대상: `PlantSearch`, `PlantStatus`, `AccessLog` 같은 read-only 목록

권장 구성:

- `pages/<Feature>Page.tsx` → 조립만 담당
- `features/<feature>/hooks/use<Feature>Page.ts` → `data/status/actions/uiProps`
- `features/<feature>/api/*` → generated wrapper + mapper
- `features/<feature>/components/<Feature>Filters.tsx`
- `features/<feature>/components/<Feature>Table.tsx`

**서버 응답에 없는 필드는 API 레이어(mapper)에서 파생한다**

서버가 계산하지 않고 날짜 등 원시값만 반환하는 경우, 화면에 필요한 값은 `features/<feature>/api/*` mapper에서 직접 계산한다.
page나 component에서 계산하지 않는다.

```ts
// 예시: PlantStatus — estimateCheckoutDate로 상태·기간 파생
function deriveStatus(estimateCheckoutDate: string): 'active' | 'expiring' | 'expired' {
  const diff = daysBetween(today, estimateCheckoutDate);
  if (diff > 30) return 'active';
  if (diff >= 0) return 'expiring';
  return 'expired';
}

export function mapToPlantStatusRow(res: PlantStatusResponse): PlantStatusRow {
  return {
    // ...
    licenseValidMonth: deriveLicenseMonths(res.lastCheckoutDate, res.estimateCheckoutDate),
    status: deriveStatus(res.estimateCheckoutDate ?? ''),
  };
}
```

**datetime-local 날짜 범위 필터가 있는 경우**

> 추가일: 2026-04-21
> 수정일: 2026-06-15 - draft 상태/검증/자동 종료일시 채움을 공용 훅 `useQueryDateRangeDraft`로 통일

`AccessLog`, `ChangeHistory`처럼 기간 조회가 필수인 화면은 아래 패턴을 따른다.

- 필터 입력 타입은 `type="datetime-local"` 사용 (날짜+시간 선택)
- draft 상태(`draftStartDate`, `draftEndDate`, `dateRangeError`)와 핸들러는 공용 훅 `useQueryDateRangeDraft(maxRangeDays?)`(`@/shared/hooks/useQueryDateRangeDraft`)로 관리하고, 조회 버튼 클릭 시에만 `searchParams`에 반영한다.
- 시작일시를 변경하면 `maxRangeDays`(기본 7일) 내에서 가능한 가장 늦은 종료일시를 자동으로 채워준다. 계산된 종료일시가 현재 시각보다 미래면 오늘 날짜에 시작 시각을 적용한 값으로 대체하고, 그 값마저 미래면 현재 시각으로 대체한다(`getAutoEndDate`).
- 날짜 범위 유효성 검사 규칙(`useQueryDateRangeDraft` 내부에서 처리):
  - 종료일시가 시작일시보다 이전이면 에러
  - 최대 조회 기간(`maxRangeDays`)을 초과하면 에러
  - 에러가 있으면 `handleSearch` 내부에서 조회를 막고 에러 메시지를 filter 컴포넌트에 전달
- 페이지 진입 시 기본값(현재 시각 기준 `maxRangeDays`일 전 ~ 현재)으로 즉시 조회
- API로 전달하는 datetime 포맷: `YYYY-MM-DD HH:MM:SS` (`createQueryDateRangeParams` / `toQueryDateTimeParam` 유틸로 변환)
- 화면마다 조회 제한이 다른 경우(1주/1개월/1년 등) `useQueryDateRangeDraft(maxRangeDays)`에 일수를 전달하면 자동 채움/검증에 동일하게 적용된다.

```ts
// hooks/useAccessLogPageState.ts
const {
  draftStartDate,
  draftEndDate,
  dateRangeError,
  handleStartDateChange,
  handleEndDateChange,
  resetDraftDateRange,
  validateDraftDateRange,
} = useQueryDateRangeDraft(); // 다른 제한이 필요하면 maxRangeDays 인자로 전달

const [searchParams, setSearchParams] = useState(createDefaultQueryDateRangeParams);

const handleSearch = () => {
  if (!validateDraftDateRange()) return;
  setSearchParams(createQueryDateRangeParams(draftStartDate, draftEndDate, draftKeyword));
};
```

**좌우 분할 마스터-디테일 조회 전용 화면 레이아웃**

> 추가일: 2026-04-21

편집 없이 마스터 클릭 시 우측 디테일이 바뀌는 좌우 분할 조회 화면은 아래 패턴을 따른다.

- `AdminMainLayout`의 `children`에 래퍼 `div`를 두고 `flex-direction: row`를 적용
- 래퍼 `div`는 `--fixed` 레이아웃에서 `flex: 1; min-height: 0; overflow: hidden` 명시
- 두 `article`(TableCard)이 래퍼 내에서 각각 `flex: 1`로 동일 비율 차지

```css
/* pages/<Feature>/<Feature>Page.css */
.access-log-page__layout {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-8);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.access-log-page__layout > article {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

```tsx
/* pages/<Feature>/<Feature>Page.tsx */
<AdminMainLayout className="admin-main-layout-page--fixed" filterSlot={...}>
  <div className="access-log-page__layout">
    <MasterTable ... />
    <DetailTable ... />
  </div>
</AdminMainLayout>
```

- 마스터 클릭 시 선택된 행을 `selectedRow` 상태로 관리하고, 같은 행을 다시 클릭하면 선택 해제
- 디테일 조회 훅은 `selectedRow?.sysId ?? ''`를 sysId로 받고 `enabled: Boolean(sysId)`로 제어

---

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
- 위 흐름은 모달 CRUD 폼 기준이다. 행추가/행삭제 인라인 편집 테이블은 저장 검증 실패 시 안내 모달 확인 후 필드 오류를 표시한다.

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

---

## 8. Admin/Client 기능 패리티 원칙

> 추가일: 2026-06-15

Admin과 Client(추후 Consumer 포함) 앱은 **권한(역할) 범위만 다를 뿐, 동일 도메인 기능의 로직·흐름·화면 구조는 동일하게 유지한다.**

폴더 구조 미러링은 [`decisions.md`](./decisions.md) ADR-008에서 다룬다. 이 절은 그 위에서 **기능 단위 로직 패리티**를 다룬다.

### 동일하게 맞춰야 하는 항목

- ViewModel 구조: `data / status / actions / uiProps`, `use{Feature}PageViewModel` 타입
- 모달/CRUD 전이 흐름: 등록·수정·삭제·비밀번호 초기화 등 흐름 순서와 분기
- 목록 로딩/에러/빈 목록 처리(`TableCardContentState` 연동 등)
- 안내 모달의 구조(제목/본문/helperText 유무) — 문구 자체는 권한별로 다를 수 있음
- 테스트 커버리지 레이어: api mapper / modal flow hook / page hook / table 컴포넌트 단위 테스트

### 차이가 있어도 되는 항목

- 권한·메뉴 노출 범위
- 접근 가능한 API 엔드포인트·요청 파라미터
- 화면에 노출되는 문구·라벨

위 두 분류 밖의 로직 차이가 생기면 의도된 차이인지 먼저 확인한다.

### 적용 절차

Admin feature를 기준으로 Client(추후 Consumer)의 동일 feature를 구현·리팩토링할 때는 Admin 구현을 1:1로 대조해 위 "동일하게 맞춰야 하는 항목"의 누락 여부를 확인한다.

적용 예시: `AdminUser` ↔ `ClientUser` — ViewModel 타입, 모달 플로우, 테이블 loading/error 처리, 테스트 4종(`*Api.test`, `use*ModalFlow.test`, `use*Page.test`, `*Table.test`)을 동일한 구조로 미러링했다.

### 셸 레이아웃 공유 규칙

> 추가일: 2026-06-16

어드민/클라이언트 대쉬보드는 셸 레이아웃이 통일돼 있다. 브레드크럼, 간격 등 셸 공통 요소는 앱 구분 없이 동일한 컴포넌트와 토큰을 사용한다.

**브레드크럼 네비게이션**

항상 `src/shared/components/navigation/PageNavigation`을 사용한다. 어드민 또는 클라이언트에서 별도 브레드크럼 JSX/CSS를 새로 작성하지 않는다.

- `AdminMainNavigation`: 라우트 정보를 해석한 뒤 `<PageNavigation>`에 위임한다.
- `ClientPageNavigation`: `breadcrumb` prop을 받아 null 체크 후 `<PageNavigation>`에 위임한다.

**사이드바 헤더**

사이드바 헤더는 항상 `src/shared/components/sidebar/SidebarHeader`를 사용한다. 앱별로 헤더 JSX를 새로 작성하지 않는다.

- `brand`: 앱 로고/브랜드 노드를 주입한다.
- `onClose`: 사이드바 닫기 콜백을 주입한다.
- 앱별 어댑터(`AdminSidebarHeader`, `ClientSidebarHeader` 등)는 스토어·이벤트 연결만 담당하고 UI 마크업은 `SidebarHeader`에 위임한다.

**레이아웃 gap**

브레드크럼 ↔ 첫 번째 콘텐츠(검색 카드·테이블) 간격은 `--spacing-8`(16px)로 통일한다.

| 앱 | 위치 | 값 |
|---|---|---|
| Admin | `admin-main-layout-page` — `gap` | `var(--spacing-8)` |
| Client | `client-layout__main` — `gap` | `var(--spacing-8)` |

---

## 관련 문서

- [콤보 API 사용 기준](./combo-api-policy.md): 검색용 콤보와 저장용 콤보의 API 분리 기준
- [비동기 데이터 연동 패턴](./async-patterns.md): Mutation 결과 안내 모달, generated API 직접 호출, 단일 엔티티 폼 화면
