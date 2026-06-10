/**
 * @fileoverview 트리 구조 목록 컴포넌트
 *
 * @description
 * 계층형 노드를 행/열 테이블 형태로 렌더하는 컴포넌트.
 * - 트리 연결선(│ ├ └) 자동 렌더 — 꾸미기 요소는 컴포넌트 담당
 * - 노드 펼치기/접기 (defaultExpandedIds로 초기 상태 제어)
 * - 행 클릭 선택 (selectedId + onSelect)
 * - labelRender로 레이블 셀 커스텀 렌더 (InputBase 등)
 * - columns prop으로 추가 셀 렌더 지원 (InputBase·SelectInput·숫자 등)
 * - disabled 노드는 클릭 선택 불가 + dim 처리
 *
 * @module shared/components/treeMenu/TreeMenu
 */

import './TreeMenu.css';
import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TreeMenuNode, TreeMenuColumn } from './types';
import { TreeMenuContext } from './_context';
import { TreeItem } from './TreeItem';


type TreeMenuProps<T> = {
  /** 트리 데이터 */
  nodes: TreeMenuNode<T>[];
  /** 레이블 열 헤더 텍스트 */
  labelHeader?: string;
  /**
   * 레이블 셀 커스텀 렌더 함수.
   * 생략 시 node.label 텍스트 표시.
   * InputBase 등 편집 가능한 입력 요소를 넣을 때 사용.
   *
   * @example
   * labelRender={(node) => (
   *   <InputBase size="sm" value={node.data?.code} disabled={node.disabled} />
   * )}
   */
  labelRender?: (node: TreeMenuNode<T>, depth: number) => ReactNode;
  /** 추가 컬럼 정의 */
  columns?: TreeMenuColumn<T>[];
  /** 현재 선택된 노드 ID */
  selectedId?: string;
  /** 노드 클릭 콜백 */
  onSelect?: (id: string) => void;
  /** 초기 펼침 상태 노드 ID 목록 */
  defaultExpandedIds?: string[];
  /**
   * 특정 노드 하나를 강제로 펼치는 신호.
   * id: 펼칠 노드 ID, n: 동일 id를 반복 요청할 때 변경되는 카운터.
   * 변경될 때마다 해당 노드 하나만 펼치고 다른 노드의 상태는 건드리지 않는다.
   */
  expandTrigger?: { id: string; n: number } | null;
  /** 루트 div에 추가할 CSS 클래스 */
  className?: string;
  /** 컨테이너 aria-label */
  ariaLabel?: string;
  /** 노드가 없을 때 tbody에 표시할 메시지 */
  emptyMessage?: string;
};

/**
 * 트리 메뉴 컴포넌트
 *
 * @example
 * // 기본 — 레이블 텍스트만
 * <TreeMenu nodes={menuNodes} selectedId={selectedId} onSelect={setSelectedId} />
 *
 * @example
 * // 레이블 셀에 InputBase + 추가 컬럼
 * <TreeMenu
 *   nodes={menuNodes}
 *   labelHeader="메뉴코드"
 *   labelRender={(node) => (
 *     <InputBase size="sm" value={node.data?.code} disabled={node.disabled} />
 *   )}
 *   columns={[
 *     {
 *       key: 'name',
 *       header: '메뉴 명',
 *       render: (node) => <InputBase size="sm" value={node.data?.name} />,
 *     },
 *   ]}
 *   selectedId={selectedId}
 *   onSelect={setSelectedId}
 *   defaultExpandedIds={['root-1']}
 * />
 */
export function TreeMenu<T = unknown>({
  nodes,
  labelHeader,
  labelRender,
  columns,
  selectedId,
  onSelect,
  defaultExpandedIds,
  expandTrigger,
  className = '',
  ariaLabel,
  emptyMessage,
}: TreeMenuProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? []),
  );

  /**
   * 하위추가 신호(expandTrigger)가 바뀔 때마다 해당 노드만 펼친다.
   * 기존에 열려 있던 다른 노드는 그대로 유지한다.
   */
  useEffect(() => {
    if (!expandTrigger?.id) return;
    setExpandedIds((prev) => {
      if (prev.has(expandTrigger.id)) return prev;
      const next = new Set(prev);
      next.add(expandTrigger.id);
      return next;
    });
  }, [expandTrigger]);

  const handleSelect = (id: string) => {
    onSelect?.(id);
  };

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const contextValue = useMemo(
    () => ({
      expandedIds,
      selectedId,
      columns: columns as TreeMenuColumn<unknown>[] | undefined,
      labelRender: labelRender as
        | ((node: TreeMenuNode<unknown>, depth: number) => ReactNode)
        | undefined,
      onSelect: handleSelect,
      onToggle: handleToggle,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedIds, selectedId, columns, labelRender],
  );

  const hasHeader = labelHeader != null || (columns != null && columns.length > 0);

  return (
    <TreeMenuContext.Provider value={contextValue}>
      <div
        className={`tree-menu${className ? ` ${className}` : ''}`}
        aria-label={ariaLabel}
      >
        <table className="tree-menu__table">
          {hasHeader && (
            <thead className="tree-menu__header">
              <tr>
                <th className="tree-menu__header-label">{labelHeader}</th>
                {columns?.map((col) => (
                  <th
                    key={col.key}
                    style={
                      col.width != null
                        ? {
                            width:
                              typeof col.width === 'number'
                                ? `${col.width}px`
                                : col.width,
                          }
                        : undefined
                    }
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="tree-menu__body">
            {nodes.length === 0 && emptyMessage ? (
              <tr>
                <td
                  colSpan={(columns?.length ?? 0) + 1}
                  className="tree-menu__empty"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              nodes.map((node, idx) => (
                <TreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  isLastSibling={idx === nodes.length - 1}
                  lines={[]}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </TreeMenuContext.Provider>
  );
}
