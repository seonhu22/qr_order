import type { TreeMenuNode } from './types';
import { TreeToggle } from './TreeToggle';
import { useTreeMenuContext } from './_context';


type TreeItemProps<T> = {
  node: TreeMenuNode<T>;
  /** 트리 깊이. 루트 = 0 */
  depth: number;
  /** 같은 부모 내에서 마지막 형제 여부 — 연결선(└ vs ├) 결정 */
  isLastSibling: boolean;
  /**
   * 각 조상 깊이에서 세로선을 이어 그릴지 여부
   * lines[i] = true  → 깊이 i 조상에 다음 형제가 있음 (│ 표시)
   * lines[i] = false → 깊이 i 조상이 마지막 자식이었음 (공백)
   */
  lines: boolean[];
};

/**
 * 트리 행 컴포넌트.
 * - 조상 깊이별 연결선(│)과 현재 노드의 커넥터(├ / └)를 렌더
 * - 자식 노드가 있으면 재귀 렌더
 */
export function TreeItem<T>({ node, depth, isLastSibling, lines }: TreeItemProps<T>) {
  const { expandedIds, selectedId, columns, labelRender, onSelect, onToggle } =
    useTreeMenuContext();

  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = hasChildren && expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isDisabled = node.disabled === true;

  const rowClass = [
    'tree-item__row',
    isSelected ? 'is-selected' : '',
    isDisabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleRowClick = () => {
    if (!isDisabled) onSelect(node.id);
  };

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggle(node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
      e.preventDefault();
      onSelect(node.id);
    }
  };

  /* 자식 노드에 전달할 lines:
     현재 노드가 마지막 형제이면 false (세로선 종료),
     아니면 true (세로선 계속) */
  const childLines = [...lines, !isLastSibling];

  return (
    <>
      <tr
        className={rowClass}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        aria-selected={isSelected}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : 0}
      >
        {/* 레이블 셀 — 연결선 + 토글 + 레이블 콘텐츠 */}
        <td className="tree-item__label-cell">
          <div className="tree-item__label-wrap">
            {/* 조상 깊이별 세로 연결선
                i === 0 (depth-0 조상)은 depth-0 spacer와 동일하게 항상 투명으로 처리한다.
                i > 0 (depth-1+ 조상)만 hasLine 여부에 따라 │선을 그린다. */}
            {lines.map((hasLine, i) => (
              <span
                key={i}
                className={`tree-item__indent${(hasLine && i > 0) ? ' tree-item__indent--line' : ''}`}
              />
            ))}

            {/* 현재 노드의 커넥터 — depth 1+ 에서만 ├ / └ 표시. depth 0은 커넥터 없음 */}
            {depth > 0 && (
              <span
                className={`tree-item__indent tree-item__indent--${isLastSibling ? 'corner' : 'branch'}`}
              />
            )}

            {/* 펼치기/접기 토글 또는 리프 노드 placeholder
                depth 1은 ├/└ 커넥터로 계층이 구분되므로 placeholder 생략.
                depth 0과 depth 2+는 형제 간 정렬을 위해 placeholder 유지. */}
            {hasChildren ? (
              <TreeToggle expanded={isExpanded} onToggle={handleToggleClick} />
            ) : depth !== 1 && (
              <span className="tree-toggle tree-toggle--placeholder" aria-hidden="true" />
            )}

            {/* 레이블 콘텐츠 — labelRender 있으면 커스텀, 없으면 텍스트 */}
            <div className="tree-item__label-inner">
              {labelRender ? (
                labelRender(node as TreeMenuNode<unknown>, depth)
              ) : (
                <span className="tree-item__label">{node.label}</span>
              )}
            </div>
          </div>
        </td>

        {/* 추가 컬럼 셀 */}
        {columns?.map((col) => (
          <td key={col.key} className="tree-item__cell">
            {col.render(node as TreeMenuNode<unknown>, depth)}
          </td>
        ))}
      </tr>

      {/* 펼침 상태일 때 자식 노드 재귀 렌더 */}
      {isExpanded &&
        node.children?.map((child, idx) => (
          <TreeItem
            key={child.id}
            node={child as TreeMenuNode<T>}
            depth={depth + 1}
            isLastSibling={idx === (node.children?.length ?? 0) - 1}
            lines={childLines}
          />
        ))}
    </>
  );
}
