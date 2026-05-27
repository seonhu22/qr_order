# TableCard 컴포넌트 가이드

> 관리자 화면에서 반복되는 테이블 카드 레이아웃(헤더 + 스크롤 테이블)과 공통 테이블 스타일을 제공하는 컴포넌트.

## 목차

- [1. 파일 구조](#1-파일-구조)
- [2. Props](#2-props)
- [3. 사용 패턴](#3-사용-패턴)
  - [빈 상태 규칙](#빈-상태-규칙)
- [4. CSS 클래스 레퍼런스](#4-css-클래스-레퍼런스)
- [5. 페이지별 오버라이드](#5-페이지별-오버라이드)
- [6. 개발 가이드 페이지](#6-개발-가이드-페이지)

---

## 1. 파일 구조

```text
shared/components/table/
  index.ts        ← 외부 공개 API (배럴 파일)
  types.ts        ← TableCardProps 타입 정의
  TableCard.css   ← 공통 테이블 카드 스타일
  TableCard.tsx   ← 카드 레이아웃 컴포넌트
```

`TableCard.css`는 `TableCard.tsx` 내부에서 import된다. 사용 측에서 별도 import 불필요.

---

## 2. Props

```ts
type TableCardProps = {
  ariaLabel: string;          // 필수 — article의 aria-label
  title?: string;             // 카드 헤더 타이틀. 생략 시 header 미렌더링
  actions?: ReactNode;        // 헤더 우측 액션 버튼 영역
  actionsClassName?: string;  // 액션 div에 추가할 클래스
  className?: string;         // 카드 루트(article)에 추가할 클래스
  children: ReactNode;        // 테이블 본문
};
```

### title 동작

| 값 | 결과 |
|---|---|
| `"공통코드 마스터"` | header + h2 + actions 렌더링 |
| `undefined` (생략) | header 전체 미렌더링 — 빈 상태 카드에 활용 |

### import

```ts
import { TableCard } from '@/shared/components/table';
import type { TableCardProps } from '@/shared/components/table';
```

---

## 3. 사용 패턴

### 패턴 A — 읽기 전용 (PlantSearchTable)

행 클릭 이벤트 없이 데이터만 표시. 헤더 타이틀은 있지만 actions 없음.
페이지 CSS에서 `cursor: default` 오버라이드 필요.

```tsx
<TableCard title="사업장 목록" ariaLabel="사업장 목록">
  <div className="common-table-wrap">
    <table className="common-table">
      <thead>
        <tr>
          <th>코드</th>
          <th>코드명</th>
          <th>사용여부</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="common-table__mono">{row.code}</td>
            <td>{row.name}</td>
            <td>
              <span className={`status-badge ${row.useYn ? 'status-badge--yes' : 'status-badge--no'}`}>
                {row.useYn ? 'Y' : 'N'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</TableCard>
```

```css
/* PlantSearchPage.css */
.plant-search-page .common-table tbody tr { cursor: default; }
```

---

### 패턴 B — 행 클릭 선택 + 체크박스 (마스터 목록형 테이블 패턴)

행 클릭 → `is-selected` 강조. 헤더에 신규/삭제 버튼 포함.

```tsx
const [selectedId, setSelectedId] = useState('');

const headerActions = (
  <>
    <Button variant="primary" size="sm" leftIcon={<Icon id="i-plus" size={13} />}>신규</Button>
    <Button variant="outline" size="sm">삭제</Button>
  </>
);

<TableCard title="공통코드 마스터" ariaLabel="공통코드 마스터" actions={headerActions}>
  <div className="common-table-wrap">
    <table className="common-table">
      <thead>...</thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={selectedId === row.id ? 'is-selected' : undefined}
            onClick={() => setSelectedId(row.id)}
          >
            ...
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</TableCard>
```

---

### 패턴 C — 인라인 행 편집 (CommonCodeDetailTable)

행 클릭 선택 + 행추가/삭제 + 위아래 이동 + InputBase·CheckboxInput 인라인 편집.
액션 영역이 촘촘하므로 `actionsClassName="common-code-card__actions--detail"` 추가.
상세 액션(위/아래 이동, 텍스트 행추가/삭제 버튼)은 `common-code-card__text-action` 클래스 적용.

> **테이블 액션 버튼 순서 규칙**
>
> 테이블마다 모든 버튼이 들어가지는 않지만, 사용하는 버튼은 아래 순서를 유지한다.
>
> ```text
> 위/아래 이동 → 행추가 → 행삭제 → 하위추가 → 저장 → 초기화
> ```
>
> 예를 들어 하위추가가 없는 테이블은 `위/아래 이동 → 행추가 → 행삭제 → 저장` 순서만 유지한다.
> 위/아래 이동이나 초기화가 없는 테이블도 나머지 버튼의 상대 순서는 바꾸지 않는다.

> **`onAddRow` 반환 타입 필수 규칙** — 추가일: 2026-04-18
>
> `EditableDetailTable`(또는 패턴 C 직접 구현)에서 행추가 버튼을 연결할 때,
> `onAddRow`는 반드시 **새로 추가된 행의 `id`를 `string`으로 반환**해야 한다.
>
> ```ts
> // 올바른 구현
> const handleAddRow = (): string => {
>   const newRow = { id: `new-${Date.now()}`, ... };
>   appendRow(newRow);
>   return newRow.id;
> };
>
> // 잘못된 구현 — 행 추가 후 is-selected 스타일이 적용되지 않음
> const handleAddRow = (): void => {
>   appendRow({ id: `new-${Date.now()}`, ... });
> };
> ```
>
> 반환된 id를 `EditableDetailTable` 내부에서 `selectedDetailId`로 설정하기 때문에,
> `void`로 구현하면 새 행이 추가돼도 `is-selected` 스타일이 활성화되지 않는다.
> 이 규칙은 `EditableDetailTable`을 감싸는 feature 컴포넌트(`RuleDetailTable`, `CommonCodeDetailTable` 등)와
> 이를 호출하는 page hook의 `handleAddRow`까지 동일하게 적용된다.

> **행추가 후 자동 스크롤 규칙** — 추가일: 2026-04-18
>
> 행추가 시 새 행이 스크롤 밖에 있으면 자동으로 스크롤되어야 한다.
> `scrollIntoView({ block: 'nearest' })`는 이미 보이는 요소에는 스크롤하지 않으므로,
> 중간에 삽입되는 경우에도 필요할 때만 스크롤된다.
>
> **`EditableDetailTable` 계열** (`CommonCodeDetailTable`, `RuleDetailTable` 등)
> `onAddRow: () => string`이 새 행 id를 반환하면 컴포넌트 내부에서 자동 처리된다.
>
> **`EditableTableActions` 계열** (`AdminUserTable`, `MessageTable` 등) 및 **트리** (`SystemMenuTree`)
> `selectedRowId`(또는 `selectedId`)가 외부 훅에서 관리되므로, 컴포넌트 내부에서 아래 패턴을 사용한다.
>
> ```tsx
> const shouldScrollRef = useRef(false);   // 추가 버튼 클릭 시에만 스크롤
> const tableRef = useRef<HTMLDivElement>(null);
>
> useEffect(() => {
>   if (!shouldScrollRef.current || !selectedRowId || !tableRef.current) return;
>   shouldScrollRef.current = false;
>   tableRef.current.querySelector('tr.is-selected')  // 트리는 '.tree-item__row.is-selected'
>     ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
> }, [selectedRowId]);
>
> // 버튼 핸들러:
> onAddRow={() => { shouldScrollRef.current = true; onAddRow(); }}
>
> // TableBodyRenderer / TreeMenu 래퍼:
> <div ref={tableRef} className="layout-contents">
>   <TableBodyRenderer ... />
> </div>
> ```

> **행추가 테이블 저장 검증 규칙** — 추가일: 2026-04-29
>
> 행추가/행삭제가 있는 인라인 편집 테이블은 셀 내부에 필드별 안내 문구를 둘 공간이 부족하므로,
> 저장 버튼 클릭 시 빈값을 바로 error 스타일로 표시하지 않는다.
>
> ```text
> 저장 클릭 → 검증 안내 모달 → 확인 클릭 → 해당 필드 error 스타일 표시
> ```
>
> 검증 안내가 1개면 `SimpleDefaultModal`로 문장만 표시한다.
> 검증 안내가 2개 이상이면 `ValidationNoticeModal`로 리스트 형태로 표시한다.
>
> 예:
>
> ```text
> - 빈값을 채워주세요.
> - 하위 메뉴가 있는 항목은 메뉴주소를 비워주세요.
> ```
>
> 이 규칙은 `CommonCodeDetailTable`, `RuleDetailTable`, `AdminUserTable`, `MessageTable`,
> `SystemMenuTree`처럼 행을 직접 추가/삭제하고 저장하는 화면에 적용한다.
> 일반 등록/수정 폼 모달은 기존처럼 필드 옆 errorText를 사용한다.

```tsx
const detailActions = (
  <>
    <Button variant="icon" size="sm" iconOnly={<Icon id="i-chevron-up" size={12} />} aria-label="위로 이동" />
    <Button variant="icon" size="sm" iconOnly={<Icon id="i-chevron-down" size={12} />} aria-label="아래로 이동" />
    <Button variant="text" size="sm" className="common-code-card__text-action">+ 행추가</Button>
    <Button variant="text" size="sm" className="common-code-card__text-action">- 행삭제</Button>
    <Button variant="outline" size="sm">저장</Button>
  </>
);

<TableCard
  title="공통코드 상세"
  ariaLabel="공통코드 상세"
  actions={detailActions}
  actionsClassName="common-code-card__actions--detail"
>
  <div className="common-table-wrap">
    <table className="common-table common-table--detail">
      ...
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={selectedId === row.id ? 'is-selected' : undefined}
            onClick={() => setSelectedId(row.id)}
          >
            <td>
              <InputBase
                size="sm"
                className={`common-table__input${row.isNew ? '' : ' common-table__input--readonly-code'}`}
                controlState={row.isNew ? '' : 'readonly'}
                readOnly={!row.isNew}
                value={row.code}
                onChange={(e) => handleFieldChange(row.id, 'code', e.target.value)}
              />
            </td>
            <td>
              <CheckboxInput
                checked={row.useYn}
                onChange={(checked) => handleUseYnChange(row.id, checked)}
                size="sm"
                className="common-table__checkbox"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</TableCard>
```

---

### 패턴 D — header 없는 빈 상태 (마스터 미선택 시)

마스터를 선택하기 전 상세 카드에 안내 메시지만 표시. `title`을 생략하면 header가 렌더링되지 않는다.

```tsx
// selectedMaster가 없을 때
<TableCard ariaLabel="공통코드 상세">
  <TableCardContentState
    isLoading={false}
    isError={false}
    isEmpty
    emptyTitle="목록을 선택해주세요"
    emptyDescription="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
    emptyClassName="common-code-card__empty"
  />
</TableCard>

// selectedMaster가 있을 때 — title 전달
<TableCard
  title={selectedMaster ? '공통코드 상세' : undefined}
  ariaLabel="공통코드 상세"
  actions={selectedMaster ? detailActions : undefined}
>
  {selectedMaster ? <div className="common-table-wrap">...</div> : <TableCardContentState ... />}
</TableCard>
```

---

### 패턴 E — 로딩 / 에러 / 빈 상태

`TableCardContentState`로 공통 분기를 처리한다.

```tsx
<TableCard title="공통코드 목록" ariaLabel="공통코드 목록">
  <TableCardContentState
    isLoading={isLoading}
    isError={isError}
    loadingTitle="목록을 불러오는 중입니다."
    errorDescription="다시 한번 시도해주세요."
  >
    <div className="common-table-wrap">...</div>
  </TableCardContentState>
</TableCard>
```

---

### 빈 상태 규칙

> 추가일: 2026-04-27

#### 피드백(FeedbackState)과 인라인의 구분

**피드백(FeedbackState)**은 카드 바디 전체를 덮는 오버레이로, 테이블 구조(thead/tbody)가 대체된다.
**인라인**은 thead를 유지한 채 tbody 한 행에 메시지만 표시한다.

> **핵심 원칙**: 서버 통신이 성공한 경우 thead(컬럼명)는 항상 유지한다. 통신 실패·로딩·마스터 미선택처럼 테이블 자체를 표시할 수 없는 상황에만 FeedbackState를 사용한다.

#### 피드백(FeedbackState) 문구 정의

카드 바디 전체를 대체하는 상황에서 사용한다. `TableCardContentState`의 `isLoading` · `isError` · `isEmpty` prop으로 제어된다.

| variant | 제목 | 설명 | 아이콘 | 사용 시점 |
|---|---|---|---|---|
| `loading` | 불러오는 중입니다. | — | 스피너 | API 호출 중 |
| `error` | 불러오는데 실패했습니다 | 다시 한번 시도해주세요. | `i-error` | 통신 실패 |
| `empty` | 데이터가 없습니다. | 등록된 데이터가 없습니다. | `i-empty-file` | 통신 성공 + 데이터 0건 (단독 사용 시) |
| `select` | 목록을 선택해주세요. | 위 목록에서 행을 클릭하면 상세 코드가 표시됩니다. | `i-feedback-pointer` | 마스터 미선택 (디테일 패널) |
| `unauthorized` | 접근 권한이 없습니다. | — | `i-lock` | 권한 없음 |

> `select` variant의 설명 문구는 레이아웃에 따라 달라질 수 있다.
> 예) 좌측 목록형: `"좌측 목록에서 항목을 선택하면 메뉴 접근 이력을 조회할 수 있습니다."`

#### 인라인 문구 정의

통신 성공 후 표시할 데이터가 없을 때 thead를 유지한 채 tbody 한 행에 표시한다.

| 상황 | 문구 | 적용 테이블 |
|---|---|---|
| 초기 로딩 성공 + 데이터 없음 | `데이터가 없습니다.` | CouponManage, PaymentManage, NoticeManage, SystemMenu 등 |
| 조회 버튼 클릭 후 + 데이터 없음 | `조회 결과가 없습니다.` | AccessLog, ChangeHistory, AdminUser, CommonCode, Rule, Message, InquiryManage, PlantStatus(조회 후) 등 |
| 조회 전 초기 상태 (조회형) | `데이터가 없습니다.` | PlantSearch, PlantStatus (조회 버튼 클릭 전) |
| 디테일 행 없음 (마스터 선택 후) | `상세 항목이 없습니다.` | CommonCodeDetailTable, RuleDetailTable |
| 특정 컨텍스트 | `접근한 메뉴 이력이 없습니다.` | AccessLogDetailTable (로그 선택 후 이력 없음) |

#### 상황별 처리 흐름

```
로딩 중          → FeedbackState loading  (thead 없음)
통신 실패        → FeedbackState error    (thead 없음)
마스터 미선택    → FeedbackState select   (thead 없음)
─────────────────────────────────────────────────────
통신 성공 + 데이터 있음   → 테이블 정상 렌더링  (thead 있음)
통신 성공 + 데이터 없음   → tbody 인라인 메시지 (thead 있음)
```

#### TableBodyRenderer 사용 시

`emptyMessage` prop으로 전달한다. 기본값은 `데이터가 없습니다.`

```tsx
// 조회형 테이블 (검색 버튼 있음)
<TableBodyRenderer
  tableAriaLabel="..."
  columns={columns}
  rows={rows}
  emptyMessage="조회 결과가 없습니다."
/>

// 로딩형 테이블 (기본값 사용)
<TableBodyRenderer tableAriaLabel="..." columns={columns} rows={rows} />
```

#### 조회형 테이블 — hasSearched 분기

검색 전 초기 상태와 검색 후 빈 결과를 다른 문구로 구분한다.
hook `uiProps`에서 `hasSearched` 기반으로 분기한 메시지를 테이블에 전달한다.

```ts
// usePlantSearchPage.ts
uiProps: {
  emptyMessage: hasSearched ? '조회 결과가 없습니다.' : '데이터가 없습니다.',
}
```

```tsx
// PlantSearchTable.tsx
<TableBodyRenderer
  tableAriaLabel="..."
  columns={columns}
  rows={rows}
  emptyMessage={emptyMessage}
/>
```

#### 커스텀 테이블 (TableBodyRenderer 미사용)

`<thead>`는 항상 유지하고, `<tbody>`에 직접 빈 row를 렌더링한다.

```tsx
<tbody>
  {rows.length === 0 ? (
    <tr>
      <td colSpan={5} className="common-table__empty">조회 결과가 없습니다.</td>
    </tr>
  ) : (
    rows.map((row) => ( ... ))
  )}
</tbody>
```

#### EditableMasterTable

`statusText.emptyMessage`로 전달한다.

```tsx
statusText={{
  loading: '목록을 불러오는 중입니다.',
  emptyMessage: '조회 결과가 없습니다.',
}}
```

---

## 4. CSS 클래스 레퍼런스

### 카드 구조

| 클래스 | 적용 요소 | 설명 |
|---|---|---|
| `.common-code-card` | `article` | 카드 루트. border, border-radius, overflow: hidden |
| `.common-code-card__header` | `header` | 타이틀 + 액션 행. flex, min-height: 3rem, 하단 border |
| `.common-code-card__title` | `h2` | 카드 타이틀 텍스트 |
| `.common-code-card__actions` | `div` | 액션 버튼 묶음 (gap: spacing-3) |
| `.common-code-card__actions--detail` | modifier | 인라인 편집 액션 영역의 좁은 gap |
| `.common-code-card__text-action` | `Button(variant="text")` | 행추가/행삭제 텍스트 버튼의 padding 조정 |
| `.common-code-card__empty` | `TableCardContentState(isEmpty)` | header 없는 카드에서 빈 상태를 카드 전체 높이에 맞춤 |
| `.common-code-card__footnote` | `p` | 테이블 하단 안내 문구 |

### 테이블

> 정렬 기본값 — 추가일: 2026-04-22
>
> `th`는 항상 중앙 정렬, `td`는 항상 좌측 정렬이 기본이다.
> 별도 클래스 없이 이 규칙을 따른다.
> 체크박스 · 버튼 · 뱃지(`[class*="badge"]`)를 포함한 셀은 `:has()` 규칙으로 자동 중앙 정렬된다.
> 날짜 · 시간 · 코드 등 명시적으로 중앙 정렬이 필요한 `td`에만 `common-table__cell--center`를 추가한다.
> 컬럼 간 구분선(border-right)은 자동 적용된다.

| 클래스 | 적용 요소 | 설명 |
|---|---|---|
| `.common-table-wrap` | `div` | 수평 스크롤 래퍼. `flex: 1`로 카드 높이를 채움 |
| `.common-table` | `table` | 테이블 기본 스타일. thead sticky, 행 hover, is-selected. `table-layout: fixed` 기본 적용 — 셀 내용(SelectInput 선택값 등)이 바뀌어도 컬럼 너비가 고정됨 |
| `.common-table--detail` | modifier | 인라인 편집 전용. 행 높이 축소 |
| `.common-table__cell--center` | `td` | 날짜 · 시간 · 코드 등 명시적 중앙 정렬이 필요한 셀. 체크박스 · 버튼 · 뱃지는 자동 적용되므로 불필요 |
| `.common-table__mono` | `td` | 코드값 고정폭 폰트 (font-mono) |
| `.common-table__checkbox` | `CheckboxInput` | 테이블 내 체크박스 중앙 정렬 보조. 포함된 `th`/`td`는 자동 중앙 정렬 |
| `.common-table__input` | `InputBase` | 인라인 편집 input (테두리 없음, 전체 너비) |
| `.common-table__input--readonly` | modifier | 읽기 전용 input (배경색 적용) |
| `.common-table__select` | `SelectInput` | 인라인 편집 select (전체 너비) |
| `.common-table__empty` | 빈 상태 셀 | `colspan` 전체 차지, 중앙 정렬 |
| `.common-table__cell--truncate` | `td` | 텍스트 말줄임 셀. 페이지 CSS에서 `max-width` 지정 필요, `title` 속성으로 전체 내용 제공 |

### 컬럼 너비 클래스

> 추가일: 2026-04-22

`colgroup`의 `col` 요소에 적용한다. `table-layout: fixed` 환경에서 특정 컬럼을 고정 너비로 지정할 때 사용한다.

| 클래스 | 너비 | 용도 |
|---|---|---|
| `.common-table__col--checkbox` | `var(--spacing-14)` — 48px | 체크박스 전용 컬럼 |
| `.common-table__col--action` | `var(--spacing-16)` — 64px | 수정 버튼(아이콘) 전용 컬럼 |
| `.common-table__col--sm` | `5.625rem` — 90px | 뱃지/태그 컬럼 (소형) |
| `.common-table__col--md` | `8rem` — 128px | 뱃지/태그 컬럼 (기본) |
| `.common-table__col--lg` | `10rem` — 160px | 뱃지/태그 컬럼 (대형) |

뱃지/태그 컬럼의 기본 사이즈는 `md`이다.

```tsx
<colgroup>
  <col className="common-table__col--checkbox" />
  <col />
  <col />
  <col className="common-table__col--md" />   {/* 뱃지 컬럼 */}
  <col className="common-table__col--action" />
</colgroup>
```

### TableBodyRenderer — tdClassName

> 추가일: 2026-04-22

`SharedTableColumn`의 `tdClassName` 속성으로 `td`에 직접 클래스를 적용할 수 있다.
컬럼 모델을 사용하는 테이블(`TableBodyRenderer`)에서 특정 셀을 중앙 정렬할 때 사용한다.
헤더(`th`)는 항상 중앙 정렬이므로, 바디(`td`) 정렬만 이 속성으로 조정한다.

```ts
// plantSearchTableModel.tsx
{ key: 'ownerName', label: '대표자명', tdClassName: 'common-table__cell--center' }
```

- `column.className`은 `th`에만 적용된다.
- `column.tdClassName`은 해당 컬럼의 모든 `td`에 적용된다.
- `column.align` 같은 헤더·바디 공용 정렬 속성은 사용하지 않는다.

### EditableDetailTable — className / 정렬 규칙

> 추가일: 2026-04-22

`EditableDetailTable`의 헤더(`th`)도 일반 테이블과 동일하게 **항상 중앙 정렬**이다.
`td` 내용은 좌측 정렬(기본), 체크박스는 `:has()` 규칙으로 자동 중앙 정렬된다.

`EditableDetailColumn`의 `className`은 해당 컬럼의 `th`에 적용된다.
`common-table--detail` 환경에서는 `colgroup`이 동작하지 않으므로,
컬럼 너비를 고정하려면 `className`에 너비 클래스를 지정한다.
`EditableDetailTable`은 이 값을 `th`와 `td`에 함께 적용해 헤더와 바디의 컬럼 폭을 맞춘다.

```ts
// 사용여부 체크박스 컬럼 너비 고정
{ key: 'useYn', label: '사용여부', type: 'boolean', className: 'common-table__col--md' }
```

- `common-table--detail`은 `thead`/`tbody`가 `display: block`이므로 `colgroup`이 무효
- `className`에 너비 클래스를 적용하면 해당 컬럼의 `th`와 모든 `td` 너비가 함께 고정됨
- 마스터 테이블의 사용여부 컬럼과 같은 폭이 필요하면 `common-table__col--md`를 사용한다.

### 테이블 수정 버튼

행 오른쪽 끝 수정 아이콘 버튼은 `EditTableButton` 공용 컴포넌트를 사용한다.
직접 `Button`이나 아이콘을 조합하지 않는다.

```tsx
import { EditTableButton } from '@/shared/components/button';

<td>
  <EditTableButton
    ariaLabel={`${row.name} 수정`}
    onClick={() => onEdit(row)}
  />
</td>
```

### 상태 배지

배지는 **두 가지 사이즈**가 의도적으로 구분된다.

| 종류 | 사이즈 | 사용 기준 |
|---|---|---|
| 공용 배지 (`.status-badge`) | 소형 — `height: 1.125rem`, `border-radius: --radius-xs` | Y/N 단일 문자처럼 짧은 값 |
| feature 전용 배지 | 기본 — `padding: 0.1875rem 0.5rem`, `border-radius: --radius-sm` | 도메인 고유 상태 또는 2글자 이상 텍스트 |

두 사이즈를 혼용하지 않는다. 같은 테이블 안에서는 한 가지 사이즈만 사용한다.

**공용 배지 (사용여부 2가지)**

| 클래스 | 설명 |
|---|---|
| `.status-badge` | 기본 배지 스타일 (inline-flex, border-radius, padding) |
| `.status-badge--yes` | 사용(Y) 배지 — success 색상 |
| `.status-badge--no` | 미사용(N) 배지 — muted 색상 |

```tsx
<span className={`status-badge ${row.useYn ? 'status-badge--yes' : 'status-badge--no'}`}>
  {row.useYn ? 'Y' : 'N'}
</span>
```

**feature 전용 배지 (도메인 고유 상태)**

상태가 도메인 고유 의미를 갖거나 텍스트가 2글자 이상이면 feature 페이지 CSS에 별도 클래스를 작성하고
`--color-status-*-bg` / `--color-status-*-text` 토큰을 사용한다.

```css
/* pages/<feature>/<Feature>Page.css */
.my-status-badge { display: inline-block; padding: 0.1875rem 0.5rem; border-radius: var(--radius-sm); font-size: var(--typography-size-caption); font-weight: var(--typography-weight-ui); }
.my-status-badge--active   { background-color: var(--color-status-success-bg); color: var(--color-status-success-text); }
.my-status-badge--expiring { background-color: var(--color-status-warning-bg); color: var(--color-status-warning-text); }
.my-status-badge--expired  { background-color: var(--color-status-error-bg);   color: var(--color-status-error-text); }
```

- primitive 토큰(`--green-*`, `--red-*` 등) 직접 참조 금지 — semantic 토큰만 사용한다.
- 적용 예시: `PlantStatus`(active/expiring/expired), `CouponManage`(사용/미사용)

### 행 상태 클래스

| 클래스 | 설명 |
|---|---|
| `.is-selected` | `tr`에 직접 적용. 브랜드 컬러 좌측 border + 연한 배경 |

### 레이아웃 유틸리티

| 클래스 | 적용 요소 | 설명 |
|---|---|---|
| `.layout-contents` | `div` wrapper | `display: contents` — 레이아웃에 투명한 래퍼. DOM 참조(`ref`)는 유지하면서 flex 체인을 끊지 않아야 할 때 사용 |

### common-table--detail 스크롤 구조

> 추가일: 2026-04-18

`.common-table--detail`을 사용하는 인라인 편집 테이블은 `thead`가 고정되고 `tbody`만 세로 스크롤된다.
이 동작은 CSS에 의해 자동 적용되며 별도 설정이 필요 없다.

- `.common-table-wrap:has(.common-table--detail)` — `overflow-y: hidden`, `display: flex`로 재정의
- `.common-table--detail thead` — `display: block; flex-shrink: 0` (스크롤 영역 밖 고정)
- `.common-table--detail tbody` — `display: block; overflow-y: auto; flex: 1` (실제 스크롤 컨테이너)
- `thead tr`, `tbody tr` — `display: table; width: 100%; table-layout: fixed` (컬럼 너비 동기화)

---

## 5. 페이지별 오버라이드

### 가로 스크롤 설정

컬럼이 많거나 날짜·긴 텍스트가 포함되어 셀이 압축될 경우 가로 스크롤을 추가한다.
`common-table-wrap`은 이미 `overflow: auto`를 가지므로, 테이블에 `min-width`만 지정하면 자동으로 스크롤이 생긴다.

**Step 1** — `TableCard`에 feature 고유 클래스 지정:
```tsx
<TableCard title="..." ariaLabel="..." className="my-feature-table">
```

**Step 2** — 페이지 CSS에 `min-width` 지정:
```css
/* 카드 너비보다 큰 값을 지정해야 스크롤이 트리거된다 */
.my-feature-table .common-table { min-width: 60rem; } /* 적절한 값으로 조정 */
```

`min-width`가 카드 너비보다 작으면 스크롤이 생기지 않으므로, 테이블의 컬럼 수와 예상 데이터 길이를 고려해 충분히 크게 설정한다.

> **분할 레이아웃(좌우 나눔) 주의** — `common-table-wrap`을 커스텀 클래스로 대체하는 경우,
> `overflow-y: auto`만 설정하면 가로 스크롤이 막힌다. 반드시 `overflow: auto`로 지정한다.
>
> ```css
> /* 잘못된 예 — 가로 스크롤 차단 */
> .my-wrap { overflow-y: auto; }
>
> /* 올바른 예 */
> .my-wrap { overflow: auto; }
> ```

**구현 사례**:

| 페이지 | className | min-width | 비고 |
|---|---|---|---|
| 사업장 조회 | `plant-search-table` | `90rem` | 빈 상태 시 `min-width: unset` |
| 관리자 관리 | `admin-user-table` | `58rem` | — |
| 문의사항 관리 | `inquiry-manage-table` | `72rem` | — |
| 접속 로그 (분할) | `access-log-master-table` | `45rem` | 분할 레이아웃, 커스텀 wrap 사용 |

---

`TableCard.css`에는 `min-width`가 없다. 컬럼이 많아 스크롤이 필요한 경우 페이지 CSS에서 오버라이드한다.

```css
/* PlantSearchPage.css */
.plant-search-table .common-table { min-width: 90rem; }
/* 읽기 전용 테이블 — 행 클릭 커서 제거 */
.plant-search-table .common-table tbody tr { cursor: default; }
/* 말줄임 셀 max-width 오버라이드 */
.plant-search-table .common-table__cell--truncate { max-width: 10rem; }

/* AdminUserPage.css */
.admin-user-table .common-table { min-width: 58rem; }
```

### table-layout: fixed 와 컬럼 너비

> 추가일: 2026-04-14

`.common-table`은 `table-layout: fixed`를 기본으로 사용한다.
너비가 지정되지 않은 컬럼은 브라우저가 균등 분배한다.
특정 컬럼에 비율이 필요하면 `<th>` 또는 `<colgroup>`으로 지정한다.

```tsx
// th width 지정 예시 — 4컬럼 테이블에서 마지막 컬럼만 고정
<thead>
  <tr>
    <th>사용자 아이디</th>
    <th>사용자 명</th>
    <th>사업장</th>
    <th style={{ width: '10rem' }}>비밀번호 초기화</th>
  </tr>
</thead>
```

- 인라인 편집 테이블(`SelectInput`, `InputBase` 포함)에서 선택값 변경 시 컬럼이 밀리는 현상을 방지하기 위해 도입했다.
- 페이지별 `nth-child` CSS로 컬럼 너비를 지정하지 않아도 된다.

---

## 6. 개발 가이드 페이지

로컬 개발 서버 실행 후 아래 주소로 접속한다.

```text
http://localhost:3000/dev/table
```

| 섹션 | 설명 |
|---|---|
| 읽기 전용 | 행 클릭 없음, 타이틀만 (PlantSearchTable 패턴) |
| 행 클릭 선택 | is-selected 강조 + 체크박스 + 수정 아이콘 (마스터 목록형 테이블 패턴) |
| 인라인 행 편집 | 행추가/삭제 + 위아래 이동 + InputBase·CheckboxInput 편집 (EditableDetailTable 계열 패턴) |
| 로딩 상태 | `TableCardContentState`의 `isLoading` 분기 예시 |
| 에러 상태 | `TableCardContentState`의 `isError` 분기 예시 |
| header 없는 빈 상태 | title 생략 + `TableCardContentState`의 `isEmpty` 분기 예시 |
