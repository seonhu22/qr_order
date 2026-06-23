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

### 기본 조회기간과 최대 허용기간이 다른 경우

`useQueryDateRangeDraft(maxRangeDays)`는 "초기값 offset"과 "검증 최대일수"에 같은 `maxRangeDays`를 쓴다. `OrderHistory`/`PaymentStatus`(기본 7일 / 최대 365일)처럼 두 값이 다르면 이 훅을 그대로 쓸 수 없으므로, 공용 `shared/hooks/useDateRangePresetDraft.ts`를 쓴다. `defaultRangeDays`/`maxRangeDays`를 인자로 분리해서 받고, 내부적으로는 `shared/utils/queryDateRange.ts`의 `createDefaultQueryDateRangeDraft`/`validateQueryDateRange`를 서로 다른 인자로 호출한다. feature에서 기본값만 다르게 호출하는 thin wrapper를 두는 패턴은 `useOrderHistoryDateRangeDraft.ts` 참고.

### 기간 프리셋 콤보 (이번 주 / 이번 달 / 최근 1년)

기간 조회 화면에 "오늘 기준 최근 N일" 프리셋 콤보를 추가할 때의 패턴이다(`useDateRangePresetDraft`, 사용처: `OrderHistory`, `PaymentStatus`).

- 프리셋 선택 시 시작·종료일시를 한 번에 계산해 채운다(`getDateTimeLocalDaysAgo(days)` + `getCurrentDateTimeLocal()`).
- 프리셋이 선택된 상태에서 시작일시를 바꾸면 종료일시를 `getAutoEndDate(value, days)`로, 종료일시를 바꾸면 시작일시를 `getAutoStartDate(value, days)`로 자동 재계산해 항상 프리셋 일수를 유지한다. `getAutoStartDate`는 `getAutoEndDate`의 대칭 버전으로 `shared/utils/queryDateRange.ts`에 있다.
- "직접 선택"(프리셋 없음) 상태에서는 자동 계산을 하지 않고 입력값을 최대 허용일수로만 검증한다.

**`SelectInput` 사용 시 주의 — 빈 문자열 value 옵션은 무효 처리된다**

`SelectInput`은 `options` 중 `value`가 빈 문자열(`''`)인 항목을 유효하지 않은 옵션으로 간주해 자동으로 제외한다(`SelectInput.tsx`의 `normalizedOptions` 로직). "전체"나 "직접 선택"처럼 빈 값을 표현하는 옵션을 추가할 때 `value: ''`을 쓰면 드롭다운에서 옵션 자체가 사라지는 버그가 생긴다.

- 빈 값이 필요한 옵션은 `'ALL'`, `'direct'` 같은 비어 있지 않은 sentinel 값을 쓴다.
- 데이터 계층(검색 파라미터를 만드는 지점)에서 sentinel 값을 실제 빈 문자열로 변환한다.

```ts
// 잘못된 예 — 'value: ""' 옵션이 SelectInput에서 자동 제외됨
{ value: '', label: '전체' }

// 올바른 예
{ value: 'ALL', label: '전체' }
// ...
orderStatus: draftOrderStatus === 'ALL' ? '' : draftOrderStatus,
```

## 좌우 분할 마스터-디테일 조회 화면

편집 없이 마스터 클릭 시 우측 디테일이 바뀌는 조회 화면은 아래 패턴을 따른다.

- `AdminMainLayout`의 `children`에 래퍼 `div`를 두고 `flex-direction: row` 적용
- 래퍼에는 `flex: 1; min-height: 0; overflow: hidden` 명시
- 두 `article`은 각각 `flex: 1`로 동일 비율 차지
- 마스터 클릭 시 `selectedRow` 상태로 관리하고 같은 행 재클릭 시 선택 해제
- 디테일 조회 훅은 `enabled: Boolean(sysId)`로 제어

### 디테일이 테이블이 아니라 읽기전용 label-input 폼인 경우

> 추가일: 2026-06-23

`PaymentStatus`(결제 목록 조회)처럼 디테일 영역이 행 목록이 아니라 "주문번호/결제상태/취소사유…" 같은 단일 레코드를 보여주는 화면은 위 좌우 분할 구조는 그대로 두고 우측 `article`의 내용만 폼으로 바꾼다.

- 마스터 미선택 상태는 `TableCardContentState`의 `isEmpty` + `emptyVariant="select"` + `emptyDescription="좌측 목록에서 항목을 선택하면 ...를 조회할 수 있습니다."`로 분기한다(`AccessLogDetailTable`과 동일한 분기 방식, 내용만 폼으로 교체).
- 필드는 완성형 컴포넌트(`TextInput`/`TextareaInput`)에 `readOnly`만 주고 직접 렌더한다. `controlState`는 컴포넌트가 `readOnly`로부터 자동 계산하므로 별도로 넘기지 않는다. `InputWrapper`로 다시 감싸지 않는다 — `TextInput`/`TextareaInput`은 이미 내부적으로 `InputWrapper`를 포함한 완성형이라 이중으로 감싸면 레이블이 중복 렌더된다.
- 레이블 위치는 기본값(top)을 쓰고, 필드는 한 줄에 하나씩 세로로 쌓는다. `StoreInfoFormCard.tsx`(`apps/client/features/store-info/components/StoreInfoFormCard.tsx`)의 정렬·간격(`gap: var(--spacing-9); padding: var(--spacing-10);`)을 기준으로 따른다. 긴 텍스트(여러 줄)는 `TextareaInput`을 쓴다.
- read-only 필드는 `.input-control[data-state='readonly']`/`.textarea-control[data-state='readonly']` 배경을 `--color-bg-muted`로 강조해 입력 불가 상태임을 시각적으로 드러낸다(`StoreInfoFormCard.css`와 동일).
- 상세 응답이 배열로 오는 API(예: `GetPaymentInfoDetail`)는 mapper에서 첫 번째 요소만 꺼내 단일 객체로 변환한다(`mapToPaymentStatusDetail` 참고) — 배열인 이유가 불명확하면 그 가정을 주석과 ADR 체크리스트에 남긴다.
- 필드가 특정 상태에서만 의미가 있으면(예: 결제수단·취소사유는 결제완료 건에만 의미가 있음) 값이 있어도 무시하고 항상 `'-'`를 표시하는 포맷 함수를 컴포넌트에 둔다(`formatPaymentType`/`formatCancelField` 참고). mock 데이터 자체도 해당 상태에서는 의미 있는 값을 비워 둬서(또는 `'-'`로 채워서) 화면 로직과 데이터가 어긋나지 않게 한다.
- 여러 줄 항목 리스트(예: 주문 내역)는 별도 리스트 렌더링 컴포넌트를 만들지 않고, API가 줄바꿈(`\n`)으로 구분된 문자열을 내려준다고 가정해 `TextareaInput`에 그대로 표시한다. mock도 "항목명 X 수량 ( 옵션 ) 금액" 형식의 줄을 `\n`으로 이어붙여 동일하게 보이게 한다.

## 마스터 1 + 디테일 2단 세로 스택 레이아웃

> 추가일: 2026-06-22

`MenuOptionManagementPage`(옵션 관리)처럼 좌측 마스터 1개를 선택하면 우측에 디테일 테이블 2개가 세로로 이어지는 화면(메뉴 선택 → 옵션 그룹 로드 → 옵션 그룹 선택 → 옵션 항목 로드)은 위 좌우 분할 패턴을 확장한다.

- 마스터는 기존 좌우 분할과 동일하게 `flex: 2`인 `article`
- 우측은 `flex: 4`인 래퍼 `div`(`<feature>-page__detail-stack`)를 두고 그 안을 `flex-direction: column`으로 세로 분할
- 디테일 스택 내부 두 `article`은 각각 `flex: 1; min-height: 0; overflow: hidden`
- 두 번째 디테일 테이블의 "마스터"는 첫 번째 디테일 테이블에서 선택된 행이다. `EditableDetailTable`은 기본적으로 행 선택을 내부 state로 관리하므로, 이 선택값을 다음 테이블에 전달하려면 `selection`(컨트롤드 선택) prop으로 부모가 선택 상태를 들고 있어야 한다([TableCard.md](../components/TableCard.md) §EditableDetailTable — 컨트롤드 선택 참고).

```css
.menu-option-page__layout {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-8);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.menu-option-page__layout > article:first-child { flex: 2; min-height: 0; overflow: hidden; }

.menu-option-page__detail-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  flex: 4;
  min-height: 0;
  overflow: hidden;
}
.menu-option-page__detail-stack > article { flex: 1; min-height: 0; overflow: hidden; }
```

### 상위 선택값이 하위 테이블 컬럼을 바꿀 때 저장 순서 보장

> 추가일: 2026-06-22

옵션 그룹의 "옵션/수량"처럼 한 테이블의 선택값이 다른(하위) 테이블의 컬럼 구성을 바꾸는 경우, 상위만 저장하고 하위를 그대로 두면 화면에 보이는 컬럼과 실제 저장된 값이 어긋난 채로 DB에 남을 수 있다(예: 고객 화면에 "수량 설정" UI가 노출되는데 정작 수량 제한 값은 비어 있는 상태).

- 컬럼이 **새로 생기는** 방향으로 값이 바뀌면(예: "수량 설정"으로 변경) 해당 그룹에 "하위 테이블 정리 필요" 플래그를 남긴다.
- 그 플래그가 있는 동안은 상위(그룹) 저장을 막고 안내한다. 하위(항목) 테이블을 먼저 저장(필수값 검증 통과)해야 플래그가 풀린다.
- 컬럼이 **사라지는** 방향으로 바뀔 때는(예: "주문 옵션"으로 변경) 막을 필요가 없다 — 새로 필수값이 생기는 게 아니기 때문이다.
- 새로 필수값이 되는 필드는 임의 기본값(예: `0`)을 채우지 않고 비워 둔다. 하위 테이블의 `required` 검증이 저장 시 실제 값 입력을 강제하도록 맡긴다.
- 차단 플래그는 "값이 실제로 바뀌었는지"(dirty)가 아니라 "필수값 검증을 통과해 저장을 시도했는지"로 해제한다. 비어있던 값을 다시 비우는 경우처럼 dirty가 안 잡히는 케이스가 있기 때문이다.

적용 예: `MenuOptionManagementPage` / `useMenuOptionManagementPage.ts`의 `groupIdNeedingDetailSync`.

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

### draft에만 반영되는 행 단위 상세설정 모달

`MenuManagement`의 메뉴 상세설정 모달처럼, 인라인 편집 테이블의 행을 모달로 한 번 더 편집하되 실제 저장 API 호출은 외부 테이블의 "저장" 버튼에서만 일어나는 경우가 있다. 이 모달은 `/admin/system/common-code`(`useCodeMasterModalFlow`)의 등록/수정 모달과 동일한 확인/로딩/안내 UX를 따르되, "확인" 클릭이 실제 mutation을 호출하지 않고 draft 행 값을 그대로 commit(이미 입력 시점에 반영됨)한다는 점만 다르다.

- 모달을 열 때 행 snapshot을 떠서 dirty 판정과 "닫기" 시 되돌리기에 사용한다.
- 입력 필드는 외부 테이블과 같은 `onChangeValue`로 즉시 draft에 반영한다(모달 전용 별도 상태를 만들지 않음).
- "확인": dirty가 아니면 바로 닫는다. dirty면 `EditConfirmModal`로 확인받고, `confirmDetailEditor`를 `async`로 작성해 `isConfirming` 동안 primaryAction을 `loading` 상태로 둔 뒤(`useCodeMasterModalFlow.confirmSave`와 동일한 형태), 완료되면 모달을 닫고 "저장되었습니다." `SimpleDefaultModal` 안내를 띄운다. 현재는 실제 API가 없어 `await Promise.resolve()`로 자리만 잡아 두고, 추후 백엔드 연동 시 그 자리에 실제 save mutation을 추가한다.
- "닫기"·헤더 닫기 버튼(`X`)·ESC·오버레이 클릭은 모두 같은 핸들러로 연결해 dirty 경고를 동일하게 받는다 — 헤더 닫기만 예외로 빠지지 않게 한다.
- dirty 경고에서 "확인"(나가기)을 누르면 snapshot으로 행 값을 되돌린다.
- 한 줄에 들어가는 필드 수는 가로 길이가 짧은 select 2개라도 임의로 grid 2열에 묶지 않고, 다른 필드와 동일하게 전체 폭으로 쌓는다.
