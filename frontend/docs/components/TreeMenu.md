# TreeMenu 컴포넌트 가이드

> 계층형 노드를 테이블 행으로 렌더하고, 펼치기/접기·행 선택·연결선(│ ├ └)을 내장한 트리 메뉴 컴포넌트.

## 목차

- [1. 파일 구조](#1-파일-구조)
- [2. Props](#2-props)
- [3. 사용 패턴](#3-사용-패턴)
- [4. CSS 클래스 레퍼런스](#4-css-클래스-레퍼런스)
- [5. CSS 커스텀 프로퍼티 오버라이드](#5-css-커스텀-프로퍼티-오버라이드)
- [6. 개발 가이드 페이지](#6-개발-가이드-페이지)

---

## 1. 파일 구조

```text
shared/components/treeMenu/
  index.ts          ← 외부 공개 API (배럴 파일)
  types.ts          ← TreeMenuNode<T>, TreeMenuColumn<T> 타입 정의
  _context.ts       ← 내부 Context (index.ts 미공개)
  TreeToggle.tsx    ← 펼치기/접기 버튼
  TreeItem.tsx      ← 재귀 행 컴포넌트 (연결선 렌더 포함)
  TreeMenu.tsx      ← 루트 컴포넌트
  TreeMenu.css      ← 트리 전용 스타일 (BEM, semantic-tokens만 참조)
```

`TreeMenu.css`는 `TreeMenu.tsx` 내부에서 import된다. 사용 측에서 별도 import 불필요.  
`_context.ts`는 `TreeMenu.tsx`와 `TreeItem.tsx` 간 순환 의존성을 방지하기 위한 내부 파일이며 `index.ts`에서 공개하지 않는다.

### import

```ts
import { TreeMenu } from '@/shared/components/treeMenu';
import type { TreeMenuNode, TreeMenuColumn } from '@/shared/components/treeMenu';

// 금지 — 내부 파일 직접 참조
import { TreeMenu } from '@/shared/components/treeMenu/TreeMenu';
```

---

## 2. Props

### TreeMenuProps\<T\>

```ts
type TreeMenuProps<T> = {
  nodes: TreeMenuNode<T>[];          // 필수 — 트리 데이터
  labelHeader?: string;              // 레이블 열 헤더 텍스트
  labelRender?: (node: TreeMenuNode<T>, depth: number) => ReactNode;
                                     // 레이블 셀 커스텀 렌더. 생략 시 node.label 텍스트 표시
  columns?: TreeMenuColumn<T>[];     // 추가 컬럼 정의
  selectedId?: string;               // 현재 선택된 노드 ID
  onSelect?: (id: string) => void;   // 노드 클릭 콜백
  defaultExpandedIds?: string[];     // 초기 펼침 상태 노드 ID 목록
  expandTrigger?: { id: string; n: number } | null;
                                     // 특정 노드 하나만 강제로 펼치는 신호.
                                     // n 카운터가 바뀔 때마다 동일 id라도 재발동.
                                     // 하위추가 후 부모 노드를 자동 펼칠 때 사용.
  className?: string;                // 루트 div에 추가할 CSS 클래스
  ariaLabel?: string;                // 컨테이너 aria-label
  emptyMessage?: string;             // nodes가 빈 배열일 때 tbody에 표시할 메시지. 기본값 없음
};
```

### TreeMenuNode\<T\>

```ts
type TreeMenuNode<T = unknown> = {
  id: string;                        // 필수 — 고유 식별자
  label: string;                     // 필수 — 행 레이블 (aria·키보드 기준값)
  disabled?: boolean;                // 클릭 선택 불가 + dim 처리
  children?: TreeMenuNode<T>[];      // 자식 노드 (있으면 펼치기/접기 토글 표시)
  data?: T;                          // 커스텀 데이터 (columns·labelRender에서 접근)
};
```

### TreeMenuColumn\<T\>

```ts
type TreeMenuColumn<T = unknown> = {
  key: string;                       // 필수 — React key 및 식별자
  header?: string;                   // 헤더 셀 텍스트
  width?: string | number;           // 컬럼 너비. 숫자는 px로 변환, 문자열은 그대로 사용
  render: (node: TreeMenuNode<T>, depth: number) => ReactNode;
                                     // 필수 — 셀 콘텐츠 렌더 함수
};
```

---

## 3. 사용 패턴

### 패턴 A — 기본 (텍스트 레이블만)

`columns`와 `labelRender` 없이 레이블 텍스트만 표시하는 가장 단순한 형태.  
클릭 선택·펼치기/접기·연결선은 컴포넌트가 자동 처리한다.

```tsx
const nodes: TreeMenuNode[] = [
  {
    id: 'main',
    label: '메인 메뉴',
    children: [
      { id: 'dashboard', label: '대시보드' },
      {
        id: 'stats',
        label: '통계',
        children: [
          { id: 'stats-daily',   label: '일별 통계' },
          { id: 'stats-monthly', label: '월별 통계' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: '관리자 설정',
    children: [
      { id: 'settings-user', label: '사용자 관리' },
      { id: 'settings-role', label: '권한 관리' },
    ],
  },
];

function MenuTree() {
  const [selectedId, setSelectedId] = useState('');
  return (
    <TreeMenu
      nodes={nodes}
      labelHeader="메뉴명"
      selectedId={selectedId}
      onSelect={setSelectedId}
      defaultExpandedIds={['main']}
      ariaLabel="메뉴 트리"
    />
  );
}
```

---

### 패턴 B — labelRender + columns (인라인 편집)

레이블 셀과 추가 컬럼 셀에 `InputBase`를 넣어 트리 내에서 직접 편집하는 패턴.  
데이터 업데이트는 `updateNodeData` 같은 재귀 헬퍼 함수로 처리한다.

```tsx
type MenuData = { code: string; name: string; path?: string };

// 재귀 노드 데이터 업데이트 헬퍼
function updateNodeData<T>(
  nodes: TreeMenuNode<T>[],
  id: string,
  patch: Partial<T>,
): TreeMenuNode<T>[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, data: { ...node.data, ...patch } as T };
    if (node.children?.length) return { ...node, children: updateNodeData(node.children, id, patch) };
    return node;
  });
}

function MenuEditor() {
  const [nodes, setNodes] = useState<TreeMenuNode<MenuData>[]>(initialNodes);
  const [selectedId, setSelectedId] = useState('');

  const columns: TreeMenuColumn<MenuData>[] = [
    {
      key: 'name',
      header: '메뉴 명',
      render: (node) => (
        <InputBase
          size="sm"
          className="common-table__input"
          value={node.data?.name ?? ''}
          aria-label={`${node.label} 메뉴명`}
          onChange={(e) =>
            setNodes((prev) => updateNodeData(prev, node.id, { name: e.target.value }))
          }
        />
      ),
    },
    {
      key: 'path',
      header: '메뉴주소',
      render: (node) => (
        <InputBase
          size="sm"
          className="common-table__input"
          value={node.data?.path ?? ''}
          placeholder="/path"
          leftSlot={
            node.data?.path
              ? <Icon id="i-link" size={12} style={{ color: 'var(--color-brand-default)' }} />
              : undefined
          }
          aria-label={`${node.label} 메뉴주소`}
          onChange={(e) =>
            setNodes((prev) => updateNodeData(prev, node.id, { path: e.target.value }))
          }
        />
      ),
    },
  ];

  return (
    <TreeMenu
      nodes={nodes}
      labelHeader="메뉴코드"
      labelRender={(node) => (
        <InputBase
          size="sm"
          className="common-table__input"
          value={node.data?.code ?? ''}
          aria-label={`${node.label} 메뉴코드`}
          onChange={(e) =>
            setNodes((prev) => updateNodeData(prev, node.id, { code: e.target.value }))
          }
        />
      )}
      columns={columns}
      selectedId={selectedId}
      onSelect={setSelectedId}
      defaultExpandedIds={['root']}
      ariaLabel="메뉴 관리 트리"
    />
  );
}
```

> **인라인 편집 시 행/셀 패딩 조정**  
> `InputBase`를 넣으면 기본 패딩이 높이를 늘린다. 페이지 CSS에서 오버라이드한다.
>
> ```css
> .my-tree .tree-item__label-inner,
> .my-tree .tree-item__cell {
>   padding-top: var(--spacing-2);
>   padding-bottom: var(--spacing-2);
> }
> ```

---

### 패턴 C — disabled 노드

`disabled: true`인 노드는 클릭 선택이 불가하고 행 전체가 dim 처리된다.  
자식 노드의 펼치기/접기 토글은 정상 동작한다.

```tsx
const nodes: TreeMenuNode[] = [
  {
    id: 'root',
    label: '루트',
    children: [
      { id: 'active', label: '활성 노드' },
      { id: 'disabled', label: '비활성 노드', disabled: true },
    ],
  },
];
```

---

## 4. CSS 클래스 레퍼런스

### 컨테이너 / 테이블

| 클래스 | 적용 요소 | 설명 |
|---|---|---|
| `.tree-menu` | `div` (루트) | 테두리·스크롤·배경. `--tree-item-indent`, `--tree-line-width` CSS 변수 선언 |
| `.tree-menu__table` | `table` | `width: 100%`, `border-collapse: collapse`, `table-layout: fixed` |
| `.tree-menu__header` | `thead` | 헤더 행 |
| `.tree-menu__header th` | `th` | sticky 헤더. caption 크기, secondary 색상 |
| `.tree-menu__header-label` | 레이블 열 `th` | `width: auto` (남은 너비 자동 배분) |
| `.tree-menu__empty` | `td` (빈 상태) | `nodes`가 비어 있을 때 tbody 한 행. 세로 가운데 정렬, tertiary 색상 |

### 행 / 셀

| 클래스 | 적용 요소 | 설명 |
|---|---|---|
| `.tree-item__row` | `tr` | 기본 행. hover·focus-visible·is-selected·is-disabled 상태 포함. 마지막 행에 하단 보더 자동 적용 |
| `.tree-item__label-cell` | 레이블 열 `td` | `height: 0.0625rem` 트릭으로 자식 flex 요소가 `height: 100%` 참조 가능 |
| `.tree-item__label-wrap` | `div` | 연결선 세그먼트 + 토글 + 레이블 콘텐츠를 가로로 배치하는 flex 컨테이너 |
| `.tree-item__label-inner` | `div` | 레이블 콘텐츠 영역. `flex: 1`, 패딩 포함 |
| `.tree-item__label` | `span` | 텍스트 레이블. `white-space: nowrap`, `text-overflow: ellipsis` |
| `.tree-item__cell` | 추가 컬럼 `td` | 좌측 divider border, `vertical-align: middle` |

### 연결선 세그먼트

| 클래스 | 기호 | 설명 |
|---|---|---|
| `.tree-item__indent` | (공백) | 조상 깊이 세로선 없음 — 너비만 확보 |
| `.tree-item__indent--line` | │ | 조상에 다음 형제 있음 — 세로선 전체 |
| `.tree-item__indent--branch` | ├ | 현재 레벨에 다음 형제 있음 — 세로선 전체 + 우측 절반 가로선 |
| `.tree-item__indent--corner` | └ | 현재 레벨 마지막 형제 — 상단 절반 세로선 + 우측 절반 가로선 |

연결선은 `background-image: linear-gradient`로 구현된다. 절대 위치·border 미사용.

### 토글 버튼

| 클래스 | 설명 |
|---|---|
| `.tree-toggle` | 펼치기/접기 버튼. `btn--icon` 패턴 (hover·active·focus-visible 포함) |
| `.tree-toggle--expanded` | 펼침 상태 — chevron 90도 회전, 브랜드 컬러 |
| `.tree-toggle--placeholder` | 리프 노드용 placeholder — 공간 확보, 이벤트 없음. depth 1 리프는 ├/└ 커넥터로 계층이 구분되므로 placeholder를 생략한다 |

### 행 상태 클래스

| 클래스 | 설명 |
|---|---|
| `.is-selected` | `tr`에 적용. 브랜드 컬러 좌측 border(`inset box-shadow`) + 연한 배경. 레이블 브랜드 컬러 |
| `.is-disabled` | `tr`에 적용. `cursor: not-allowed`, `opacity: 0.5`, hover 배경 없음 |

---

## 5. CSS 커스텀 프로퍼티 오버라이드

`.tree-menu` 루트에 두 개의 CSS 커스텀 프로퍼티가 선언되어 있다.  
사용 측에서 오버라이드하면 컴포넌트 내 모든 연결선과 들여쓰기에 일괄 적용된다.

| 프로퍼티 | 기본값 | 설명 |
|---|---|---|
| `--tree-item-indent` | `1.5rem` | 깊이 레벨 당 들여쓰기 너비. 연결선 중앙 X 위치 계산에도 사용 |
| `--tree-line-width` | `0.09375rem` (≈ 1.5px) | 연결선 굵기 |

```css
/* 들여쓰기를 넓히고 연결선을 두껍게 */
.my-tree {
  --tree-item-indent: 2rem;
  --tree-line-width: 0.125rem; /* 2px */
}
```

```tsx
<TreeMenu className="my-tree" ... />
```

---

## 6. 개발 가이드 페이지

로컬 개발 서버 실행 후 아래 주소로 접속한다.

```text
http://localhost:3000/dev/tree-menu
```

| 섹션 | 설명 |
|---|---|
| 기본 | `columns` 없이 레이블 텍스트만. 클릭 선택·토글·연결선(│ ├ └) 동작 확인 |
| labelRender + columns | 레이블 셀에 InputBase(메뉴코드), 메뉴 명·메뉴주소 컬럼 추가. 연결선은 컴포넌트 자동 렌더 |
