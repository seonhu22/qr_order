# 기능 리팩토링 가이드

> 기능 화면을 page, 상태 훅, flow 훅, API wrapper로 나누는 기준이다.

## 기본 순서

1. 페이지 조립
2. 목록 상태 훅 (`use<Feature>ListState`)
3. 공통 flow 훅 (`useEditablePageFlow`)
4. feature hook
5. API wrapper
6. feature 전용 모달 흐름 (`use<Feature>Flow`, 필요 시)

## 페이지는 조립만 담당한다

- `pages/*`는 레이아웃과 feature 컴포넌트 조합만 맡는다.
- 서버 조회, draft 편집, 저장/삭제 흐름은 feature hook으로 위임한다.

## feature 내부 분리부터 시작한다

바로 `shared`로 올리지 않는다. 한 기능에서 2회 이상 반복되거나, 다른 기능에도 같은 흐름이 확인되면 그때 shared 승격을 검토한다.

## 반복이 확인되면 shared로 승격한다

동일한 JSX 구조가 2개 이상 페이지/feature에서 반복되면 shared 추출을 우선 검토한다.

- filter 카드 레이아웃
- 테이블 액션 버튼
- badge 표현
- 테이블 셀 조각(input, checkbox, button 등)

shared로 올릴 때도 기존 CSS 클래스와 동작 계약은 유지한다. 새 추상화보다 기존 UI를 깨지 않는 반복 제거를 우선한다.

## 편집형 테이블 본체

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

## 목록 상태와 flow 분리

업무형 CRUD 화면은 아래 두 층으로 분리하는 편이 유지보수에 유리하다.

**`use<Feature>ListState`**

- baseRows, draftRows, selectedRowId, rowErrors, isDirty
- 행 추가/삭제, 필드 변경, 필수 검증

**`use<Feature>Flow`**

- 조회 전 dirty 확인
- 저장 확인/완료
- 삭제 확인/완료
- 초기화/부가 액션 모달 흐름

## 공통 flow

편집형 목록 화면에서 아래 흐름이 두 기능 이상에서 반복되면 `shared/hooks`로 승격한다.

- 조회 전 dirty 확인
- 초기화 전 dirty 확인
- 저장 확인 모달
- 저장 완료 / 변경 없음 안내 모달

현재 공통 패턴은 `shared/hooks/useEditablePageFlow.ts`로 관리한다.

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

feature 고유 로직은 feature 훅 또는 feature flow 훅에 남긴다. 여러 화면에서 동일한 UX 전이만 shared로 올린다.

## 테스트 기준

- `list state` 훅: draft/dirty/검증/행 추가삭제 테스트
- `flow` 훅: 저장/조회/초기화/안내 모달 분기 테스트
- UI 컴포넌트: readonly, error, selected 같은 렌더 계약 테스트
- page 통합 테스트: 저장 확인, 삭제 확인, dirty 경고 같은 핵심 사용자 흐름 테스트

shared 본체를 바꿀 때는 wrapper 컴포넌트와 page 통합 테스트가 같이 영향을 받는다는 점을 전제로 확인한다.
