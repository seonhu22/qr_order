/**
 * @fileoverview TreeMenu 컴포넌트 개발 가이드 페이지 (/dev/tree-menu)
 * @module dev/TreeMenuGuide
 */

import { useState } from 'react';
import { TreeMenu } from '@/shared/components/treeMenu';
import type { TreeMenuNode, TreeMenuColumn } from '@/shared/components/treeMenu';
import { InputBase } from '@/shared/components/input';
import { Icon } from '@/shared/assets/icons/Icon';
import './devStyles/TreeMenuGuide.css';


/* =====================================================
 * 가이드 레이아웃 헬퍼
 * ===================================================== */

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tree-menu-guide__section">
      <div className="tree-menu-guide__section-header">
        <h2 className="tree-menu-guide__section-title">{title}</h2>
        {desc && <p className="tree-menu-guide__section-desc">{desc}</p>}
      </div>
      {children}
    </section>
  );
}


/* =====================================================
 * 섹션 1 — 기본 (레이블 텍스트만)
 * ===================================================== */

const BASIC_NODES: TreeMenuNode[] = [
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

function BasicExample() {
  const [selectedId, setSelectedId] = useState('');
  return (
    <TreeMenu
      nodes={BASIC_NODES}
      labelHeader="메뉴명"
      selectedId={selectedId}
      onSelect={setSelectedId}
      defaultExpandedIds={['main']}
      ariaLabel="기본 트리 예시"
    />
  );
}


/* =====================================================
 * 섹션 2 — labelRender + columns (스크린샷 패턴)
 * ===================================================== */

type MenuData = { code: string; name: string; path?: string };

const INITIAL_MENU_NODES: TreeMenuNode<MenuData>[] = [
  {
    id: 'sys',
    label: 'SYS',
    data: { code: 'SYS', name: '시스템 관리' },
    children: [
      {
        id: 'sys-biz',
        label: 'SYS-BIZ',
        data: { code: 'SYS-BIZ', name: '사업장 관리' },
        children: [
          { id: 'sys-biz-srch', label: 'SYS-BIZ-SRCH', data: { code: 'SYS-BIZ-SRCH', name: '사업장 조회', path: '/system/business' } },
          { id: 'sys-biz-reg',  label: 'SYS-BIZ-REG',  data: { code: 'SYS-BIZ-REG',  name: '사업장 등록', path: '/system/business/new' } },
        ],
      },
    ],
  },
  {
    id: 'ord',
    label: 'ORD',
    data: { code: 'ORD', name: '주문 관리' },
    children: [
      { id: 'ord-list', label: 'ORD-LIST', data: { code: 'ORD-LIST', name: '주문 목록', path: '/order' } },
    ],
  },
];

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

function FullExample() {
  const [nodes, setNodes] = useState(INITIAL_MENU_NODES);
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
          placeholder="/path (입력 시 하위 추가 불가)"
          leftSlot={node.data?.path ? <Icon id="i-link" size={12} className="tree-menu-guide__link-icon" /> : undefined}
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
      defaultExpandedIds={['sys', 'sys-biz']}
      className="tree-menu-guide__full-example"
      ariaLabel="메뉴 관리 트리 예시"
    />
  );
}


/* =====================================================
 * 섹션 3 — disabled 노드
 * ===================================================== */

const DISABLED_NODES: TreeMenuNode[] = [
  {
    id: 'root',
    label: '루트',
    children: [
      { id: 'active-1', label: '활성 노드 A' },
      { id: 'disabled-1', label: '비활성 노드 (disabled)', disabled: true },
      {
        id: 'parent-1',
        label: '부모 노드 (펼치기 가능)',
        children: [
          { id: 'child-1', label: '자식 노드 A' },
          { id: 'child-2', label: '자식 노드 B (disabled)', disabled: true },
        ],
      },
      { id: 'active-2', label: '활성 노드 B' },
    ],
  },
];

function DisabledExample() {
  const [selectedId, setSelectedId] = useState('');
  return (
    <TreeMenu
      nodes={DISABLED_NODES}
      labelHeader="메뉴명"
      selectedId={selectedId}
      onSelect={setSelectedId}
      defaultExpandedIds={['root', 'parent-1']}
      ariaLabel="disabled 노드 예시"
    />
  );
}


/* =====================================================
 * 섹션 4 — 빈 상태
 * ===================================================== */

function EmptyExample() {
  return (
    <TreeMenu
      nodes={[]}
      labelHeader="메뉴코드"
      emptyMessage="데이터가 없습니다."
      ariaLabel="빈 상태 트리 예시"
    />
  );
}


/* =====================================================
 * TreeMenuGuide
 * ===================================================== */

export default function TreeMenuGuide() {
  return (
    <div className="tree-menu-guide">
      <h1 className="tree-menu-guide__title">TreeMenu</h1>

      {/* 1. 기본 */}
      <Section
        title="기본"
        desc="columns 없이 레이블 텍스트만. 클릭 선택·토글·연결선(│ ├ └) 동작 확인. depth 1 리프는 placeholder 생략"
      >
        <BasicExample />
      </Section>

      {/* 2. labelRender + columns */}
      <Section
        title="labelRender + columns"
        desc="레이블 셀에 InputBase(labelRender), 메뉴 명·메뉴주소 컬럼 추가. 연결선은 컴포넌트 자동 렌더"
      >
        <FullExample />
      </Section>

      {/* 3. disabled 노드 */}
      <Section
        title="disabled 노드"
        desc="disabled=true 노드는 클릭 선택 불가 + opacity dim. 부모 노드의 펼치기/접기는 정상 동작"
      >
        <DisabledExample />
      </Section>

      {/* 4. 빈 상태 */}
      <Section
        title="빈 상태 (emptyMessage)"
        desc="nodes가 빈 배열일 때 thead(컬럼명)를 유지한 채 tbody에 메시지를 표시한다."
      >
        <EmptyExample />
      </Section>
    </div>
  );
}
