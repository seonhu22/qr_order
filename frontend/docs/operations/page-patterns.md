# 페이지 패턴

> 조회 전용, 편집형 CRUD, 모달 CRUD 화면을 만들 때 따르는 표준 구조다.

## 조회 전용 화면

대상: `PlantSearch`, `PlantStatus`, `AccessLog` 같은 read-only 목록

권장 구성:

- `pages/<Feature>Page.tsx`: 조립만 담당
- `features/<feature>/hooks/use<Feature>Page.ts`: `data/status/actions/uiProps`
- `features/<feature>/api/*`: generated wrapper + mapper
- `features/<feature>/components/<Feature>Filters.tsx`
- `features/<feature>/components/<Feature>Table.tsx`

서버 응답에 없는 필드는 API 레이어 mapper에서 파생한다. page나 component에서 계산하지 않는다.

## datetime-local 날짜 범위 필터

`AccessLog`, `ChangeHistory`처럼 기간 조회가 필수인 화면은 아래 패턴을 따른다.

- 필터 입력 타입은 `type="datetime-local"` 사용
- draft 상태와 핸들러는 `useQueryDateRangeDraft(maxRangeDays?)`로 관리
- 조회 버튼 클릭 시에만 `searchParams`에 반영
- API datetime 포맷은 `YYYY-MM-DD HH:MM:SS`
- 화면마다 조회 제한이 다르면 `maxRangeDays` 인자로 전달

```ts
const {
  draftStartDate,
  draftEndDate,
  dateRangeError,
  handleStartDateChange,
  handleEndDateChange,
  resetDraftDateRange,
  validateDraftDateRange,
} = useQueryDateRangeDraft();

const handleSearch = () => {
  if (!validateDraftDateRange()) return;
  setSearchParams(createQueryDateRangeParams(draftStartDate, draftEndDate, draftKeyword));
};
```

## 좌우 분할 마스터-디테일 조회 화면

편집 없이 마스터 클릭 시 우측 디테일이 바뀌는 조회 화면은 아래 패턴을 따른다.

- `AdminMainLayout`의 `children`에 래퍼 `div`를 두고 `flex-direction: row` 적용
- 래퍼에는 `flex: 1; min-height: 0; overflow: hidden` 명시
- 두 `article`은 각각 `flex: 1`로 동일 비율 차지
- 마스터 클릭 시 `selectedRow` 상태로 관리하고 같은 행 재클릭 시 선택 해제
- 디테일 조회 훅은 `enabled: Boolean(sysId)`로 제어

## 편집형 CRUD 화면

대상: `CommonCode`, `AdminUser` 같은 draft/저장/삭제가 있는 목록

권장 구성:

- `use<Feature>ListState`: baseRows, draftRows, selectedRowId, rowErrors, isDirty, 행 추가/삭제, 필드 변경, 필수 검증
- `useEditablePageFlow`: 조회/초기화 dirty guard, 저장 확인/완료 같은 shared flow
- `use<Feature>Flow`: 삭제 확인, 비밀번호 초기화, 도메인 전용 부가 모달
- `use<Feature>Page`: list state + shared flow + feature flow + API wrapper 조합

### 행삭제는 확인 모달 없이 즉시 draft에서 제거한다

`StoreTable` / `QrCode` / `Message` / `AdminUser` 같은 인라인 편집 테이블의 행삭제 버튼은 `DeleteConfirmModal` 없이 즉시 `draftRows`에서 행을 제거한다. 삭제는 서버에 바로 반영되지 않고 "저장" 버튼을 눌러야 영구 반영되며, 그 시점에 `SaveConfirmModal`로 한 번 확인받는다. 즉 삭제 확인은 저장 확인 단계에 합쳐져 있다.

이와 달리 클릭 즉시 서버에 영구 삭제 mutation을 호출하는 화면(모달 CRUD 화면의 마스터 목록, `ClientUser`의 체크박스 다중선택 삭제)은 되돌릴 수 없으므로 `DeleteConfirmModal`로 먼저 확인받는다.

새 인라인 편집 테이블을 만들 때 행삭제에 `DeleteConfirmModal`을 추가할지 고민된다면: draft 상태에서 저장 전까지 되돌릴 수 있으면 추가하지 않는다.

### 행 선택은 자동으로 첫 행을 선택하지 않는다

페이지 로드, 조회, 초기화 시 `selectedRowId`를 목록의 첫 행으로 자동 지정하지 않는다. 사용자가 직접 행을 클릭했을 때만 선택 상태가 된다. 기존 선택이 갱신된 목록에도 여전히 존재하면 유지하고, 없으면 선택을 해제한다.

```ts
setSelectedRowId((prev) => (prev && nextRows.some((row) => row.id === prev) ? prev : ''));
```

`fetchedRows[0]?.id ?? ''` 같은 fallback을 쓰지 않는다 — 행추가 직후처럼 의도적으로 새 행을 선택하는 경우(`handleAddRow`)는 예외다.

### 저장 전 같은 값 중복 검증

같은 필드 값이 여러 행에서 중복되면 안 되는 화면(예: `QrCode`의 테이블 번호)은 빈값 검증과 별개로 중복 검증을 추가한다. 중복된 모든 행을 에러로 표시한다(두 번째 행만이 아니라).

```ts
function getDuplicateRowErrors(rows: Row[]): RowErrors {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = row.field.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Object.fromEntries(
    rows
      .filter((row) => (counts.get(row.field.trim()) ?? 0) > 1)
      .map((row) => [row.id, { field: true }] as const),
  );
}
```

`handleSave`에서 빈값 검증 → 중복 검증 순서로 확인하고, 각각 별도 안내 모달을 띄운다.

### 다른 feature의 등록 데이터를 select 옵션으로 재사용

`QrCode`의 "테이블 번호" 콤보박스처럼 다른 feature에 이미 등록된 데이터를 옵션으로 보여줘야 하면, 그 feature의 query 훅을 그대로 재사용한다(`useStoreTableQuery()`). 별도 API나 중복 옵션 목록을 새로 만들지 않는다.

```ts
const storeTableQuery = useStoreTableQuery();
const tableNumOptions = useMemo(
  () =>
    (storeTableQuery.data ?? [])
      .filter((item) => item.tableNum != null)
      .map((item) => ({ value: String(item.tableNum), label: String(item.tableNum) })),
  [storeTableQuery.data],
);
```

### 조회 중 행추가

검색어가 적용된 상태(`appliedKeyword`가 있는 상태)에서 행추가를 하면 새 행이 필터에 걸려 화면에 나타나지 않는다.
`isNew` 행은 필터 조건과 무관하게 항상 표시되도록 예외 처리한다.

```ts
const rows = useMemo(() => {
  const keyword = appliedKeyword.trim().toLowerCase();
  if (!keyword) return draftRows;
  return draftRows.filter(
    (row) =>
      row.isNew ||
      [row.field1, row.field2].some((value) => value.toLowerCase().includes(keyword)),
  );
}, [appliedKeyword, draftRows]);
```

### 검색은 항상 클라이언트 필터링, 쿼리 키는 검색어와 무관하게 고정

`StoreTable` / `Message` / `AdminUser` 모두 `use<Feature>Query()`는 검색어 파라미터 없이 고정 쿼리 키(`<feature>.lists`)만 쓰고, 검색은 위의 `rows` useMemo에서 전부 클라이언트 사이드로 처리한다.

```ts
// 쿼리: 검색어 무관, 항상 같은 키
export function useMessageQuery() {
  return useGetMessage(undefined, {
    query: { queryKey: queryKeys.message.lists, ...queryPolicies.adminCrudList },
  });
}
```

검색어를 쿼리 키에 포함시키면(`queryKeys.message.list(searchKeyword)` 식) 저장 흐름의 `resetKeywords()`(내부적으로 `startTransition`)와 `invalidateQueries`가 서로 다른 시점의 쿼리 키를 바라보게 되는 타이밍 이슈가 생길 수 있다. 고정 키 + 클라이언트 필터링으로 통일하면 `invalidateQueries`가 항상 단일 쿼리만 정확히 갱신하므로 이 문제 자체가 발생하지 않는다.

### 저장 후 검색어 초기화 및 전체 목록 재조회

저장 성공 후 검색어가 남아 있으면 방금 저장한 행이 필터에 걸려 목록에서 사라질 수 있다.
`onSaveChanges` 콜백에서 `mutateAsync` 직후, `invalidateQueries` 앞에 `resetKeywords()`를 호출한다.

```ts
onSaveChanges: async () => {
  // ...변경 없으면 'unchanged' 반환...
  await saveMutation.mutateAsync(request);
  resetKeywords();                                        // 검색어 초기화
  await queryClient.invalidateQueries({ queryKey: ... }); // 전체 목록 재조회
  return 'saved';
},
```

`resetKeywords()`를 `invalidateQueries` 앞에 두는 이유: 서버사이드 필터 페이지에서 새 query key(`''`)가 즉시 무효화되어 refetch가 한 번으로 끝난다.

### `isSaving` 구성 기준

`SaveConfirmModal`의 스피너는 mutation이 완료된 뒤에도 `invalidateQueries` + 상태 업데이트가 완료될 때까지 유지돼야 한다.
`mutation.isPending`만으로는 mutation 완료 시점에 스피너가 꺼지고 "저장되었습니다." 모달이 뜨기 전 버튼이 활성화되는 gap이 생긴다.

`use<Feature>Page`에서 `isSaving`을 아래와 같이 합산한다.

```ts
isSaving: saveFeatureMutation.isPending || editableFlow.state.isConfirmingSave,
```

- `editableFlow.state.isConfirmingSave`는 `confirmSave()` 전체 async 구간(`mutateAsync` + `invalidateQueries` + 상태 업데이트)에 걸쳐 `true`로 유지된다.
- `SaveConfirmModal`의 `primaryAction.loading`과 `secondaryAction.disabled`에는 `status.isSaving`을 전달한다.

## 모달 CRUD 화면

행 직접 편집 없이 모달을 통해 등록/수정/삭제하는 목록 화면의 표준이다.

**shared 훅을 쓸 수 있는 경우**

- `코드 / 명칭 / 사용여부` 3필드 구조
- 대상: `CommonCode` 마스터, `RuleManagement` 마스터
- 모달 흐름: `shared/hooks/useCodeMasterModalFlow.ts` 재사용

**feature 전용 훅이 필요한 경우**

- 숫자·셀렉트 등 고유 필드 구성이 있는 경우
- `features/<feature>/hooks/use<Feature>ModalFlow.ts` 직접 작성
- 폼 입력용 row 타입은 string 필드 중심으로 구성하고 저장 시 변환
- 코드 필드는 등록 시에만 편집 가능, 수정 시 `readonly`

공통 모달 전이 흐름:

```text
등록/수정 클릭 -> EditorModal 오픈
  -> 필수값 검증 실패 -> 필드 오류 표시
  -> 검증 통과 -> SaveConfirmModal / EditConfirmModal
  -> 저장 실행 -> 결과 안내
  -> dirty 상태에서 닫기 -> DirtyWarningModal

삭제 클릭 -> 선택 항목 없음 -> 안내 모달
  -> 선택 있음 -> DeleteConfirmModal
  -> 삭제 실행 -> 결과 안내
```
