# TableCard 컴포넌트 가이드

> 관리자 화면에서 반복되는 테이블 카드 레이아웃(헤더 + 스크롤 테이블)과 공통 테이블 스타일을 제공하는 컴포넌트.

## 목차

- [1. 파일 구조](#1-파일-구조)
- [2. Props](#2-props)
- [3. 사용 패턴](#3-사용-패턴)
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
          <th className="common-table__cell--left">코드</th>
          <th className="common-table__cell--left">코드명</th>
          <th>사용여부</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="common-table__mono common-table__cell--left">{row.code}</td>
            <td className="common-table__cell--left">{row.name}</td>
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

### 패턴 B — 행 클릭 선택 + 체크박스 (CommonCodeMasterTable, AdminUserTable)

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

> **`onAddRow` 반환 타입 필수 규칙** — 추가일: 2026-04-18
>
> `EditableDetailTable`(또는 패턴 C 직접 구현)에서 행추가 버튼을 연결할 때,
> `onAddRow`는 반드시 **새로 추가된 행의 `id`를 `string`으로 반환**해야 한다.
>
> ```ts
> // ✅ 올바른 구현
> const handleAddRow = (): string => {
>   const newRow = { id: `new-${Date.now()}`, ... };
>   appendRow(newRow);
>   return newRow.id;
> };
>
> // ❌ 잘못된 구현 — 행 추가 후 is-selected 스타일이 적용되지 않음
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
  <FeedbackState
    variant="empty"
    title="목록을 선택해주세요"
    description="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
    className="common-code-card__empty"
  />
</TableCard>

// selectedMaster가 있을 때 — title 전달
<TableCard
  title={selectedMaster ? '공통코드 상세' : undefined}
  ariaLabel="공통코드 상세"
  actions={selectedMaster ? detailActions : undefined}
>
  {selectedMaster ? <div className="common-table-wrap">...</div> : <FeedbackState ... />}
</TableCard>
```

---

### 패턴 E — 로딩 / 에러 상태

`FeedbackState`를 children으로 전달한다.

```tsx
<TableCard title="공통코드 목록" ariaLabel="공통코드 목록">
  {isLoading ? (
    <FeedbackState variant="loading" title="목록을 불러오는 중입니다." />
  ) : isError ? (
    <FeedbackState variant="error" description="다시 한번 시도해주세요." />
  ) : (
    <div className="common-table-wrap">...</div>
  )}
</TableCard>
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
| `.common-code-card__empty` | `FeedbackState` | header 없는 카드에서 빈 상태를 카드 전체 높이에 맞춤 |
| `.common-code-card__footnote` | `p` | 테이블 하단 안내 문구 |

### 테이블

| 클래스 | 적용 요소 | 설명 |
|---|---|---|
| `.common-table-wrap` | `div` | 수평 스크롤 래퍼. `flex: 1`로 카드 높이를 채움 |
| `.common-table` | `table` | 테이블 기본 스타일. thead sticky, 행 hover, is-selected. `table-layout: fixed` 기본 적용 — 셀 내용(SelectInput 선택값 등)이 바뀌어도 컬럼 너비가 고정됨 |
| `.common-table--detail` | modifier | 인라인 편집 전용. 행 높이 축소 |
| `.common-table__cell--left` | `th`, `td` | 텍스트 좌정렬 셀 |
| `.common-table__mono` | `td` | 코드값 고정폭 폰트 (font-mono) |
| `.common-table__checkbox` | `CheckboxInput` | 테이블 내 체크박스 중앙 정렬 보조 |
| `.common-table__input` | `InputBase` | 인라인 편집 input (테두리 없음, 전체 너비) |
| `.common-table__input--readonly` | modifier | 읽기 전용 input (배경색 적용) |
| `.common-table__select` | `SelectInput` | 인라인 편집 select (전체 너비) |
| `.common-table__empty` | 빈 상태 셀 | `colspan` 전체 차지, 중앙 정렬 |
| `.common-table__cell--truncate` | `td` | 텍스트 말줄임 셀. 페이지 CSS에서 `max-width` 지정 필요, `title` 속성으로 전체 내용 제공 |

### 상태 배지

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
| 행 클릭 선택 | is-selected 강조 + 체크박스 + 수정 아이콘 (CommonCodeMasterTable / AdminUserTable 패턴) |
| 인라인 행 편집 | 행추가/삭제 + 위아래 이동 + InputBase·CheckboxInput 편집 (CommonCodeDetailTable 패턴) |
| 로딩 상태 | FeedbackState(variant="loading") children 전달 예시 |
| 에러 상태 | FeedbackState(variant="error") children 전달 예시 |
| header 없는 빈 상태 | title 생략 + FeedbackState(variant="empty") 예시 |