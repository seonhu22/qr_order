/**
 * @fileoverview 메뉴 관리 트리 테이블 컴포넌트
 *
 * @description
 * - TableCard + TreeMenu 조합으로 공통코드 상세 테이블과 동일한 카드 헤더 패턴을 따른다.
 * - 컬럼: 메뉴코드(label·readonly for existing), 메뉴 명, 메뉴주소
 * - 액션: ↑ ↓ 행추가  행삭제  하위추가  저장  초기화
 * - 저장 시 필수 미입력 / 부모+경로 충돌 필드에 error 상태를 표시한다.
 */

import { useEffect, useRef } from 'react';
import { TreeMenu } from '@/shared/components/treeMenu';
import type { TreeMenuColumn } from '@/shared/components/treeMenu';
import { InputBase } from '@/shared/components/input';
import {
  AddChildRowTableButton,
  AddRowTableButton,
  DeleteRowTableButton,
  MoveDownTableButton,
  MoveUpTableButton,
  ResetTableButton,
  SaveTableButton,
} from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard } from '@/shared/components/table';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import type { MenuData, MenuNode, NodeFieldErrors } from '../types';


type SystemMenuTreeProps = {
  nodes: MenuNode[];
  isLoading: boolean;
  isError: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onUpdateData: (id: string, patch: Partial<MenuData>) => void;
  defaultExpandedIds?: string[];
  expandTrigger?: { id: string; n: number } | null;
  canAddChild: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isSaving: boolean;
  onAddSibling: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: () => void;
  onReset: () => void;
  /** 저장 유효성 검사 결과 — 필드별 오류 노드 ID 집합 */
  nodeErrors: NodeFieldErrors;
};

export function SystemMenuTree({
  nodes,
  isLoading,
  isError,
  selectedId,
  onSelect,
  onUpdateData,
  defaultExpandedIds,
  expandTrigger,
  canAddChild,
  canDelete,
  canMoveUp,
  canMoveDown,
  isSaving,
  onAddSibling,
  onAddChild,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSave,
  onReset,
  nodeErrors,
}: SystemMenuTreeProps) {
  /**
   * 행추가/하위추가 버튼으로 발생한 선택 변경인지 추적한다.
   * 클릭 선택과 달리 추가 직후에만 스크롤해야 하므로 플래그로 구분한다.
   */
  const shouldScrollRef = useRef(false);
  /** 트리 영역의 DOM 참조. 선택 행 스크롤 대상을 이 트리로 좁히기 위해 사용한다. */
  const treeContainerRef = useRef<HTMLDivElement>(null);

  /**
   * 추가된 새 노드가 DOM에 반영된 뒤 보이지 않을 경우에만 스크롤한다.
   * scrollIntoView({ block: 'nearest' })는 이미 가시 영역 내 요소에는 스크롤하지 않는다.
   * shouldScrollRef가 true일 때(추가 직후)에만 실제로 스크롤한다.
   */
  useEffect(() => {
    if (!shouldScrollRef.current || !selectedId || !treeContainerRef.current) return;
    shouldScrollRef.current = false;
    const selectedRow = treeContainerRef.current.querySelector('.tree-item__row.is-selected');
    if (selectedRow instanceof HTMLElement && typeof selectedRow.scrollIntoView === 'function') {
      selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedId]);
  const columns: TreeMenuColumn<MenuData>[] = [
    {
      key: 'name',
      header: '메뉴 명',
      width: '16rem',
      render: (node) => (
        <InputBase
          size="sm"
          className="common-table__input"
          value={node.data?.name ?? ''}
          aria-label={`${node.label} 메뉴명`}
          controlState={nodeErrors.name.has(node.id) ? 'error' : ''}
          onChange={(e) => onUpdateData(node.id, { name: e.target.value })}
        />
      ),
    },
    {
      key: 'path',
      header: '메뉴주소',
      width: '20rem',
      render: (node) => (
        <InputBase
          size="sm"
          className="common-table__input"
          value={node.data?.path ?? ''}
          placeholder="/path (입력 시 하위 메뉴 추가 불가)"
          leftSlot={
            node.data?.path
              ? <Icon id="i-link" size={12} className="system-menu-tree__link-icon" />
              : undefined
          }
          aria-label={`${node.label} 메뉴주소`}
          controlState={nodeErrors.path.has(node.id) ? 'error' : ''}
          onChange={(e) => onUpdateData(node.id, { path: e.target.value })}
        />
      ),
    },
  ];

  const actions = (
    <>
      <MoveUpTableButton
        ariaLabel="위로 이동"
        disabled={!canMoveUp || isSaving}
        onClick={onMoveUp}
      />
      <MoveDownTableButton
        ariaLabel="아래로 이동"
        disabled={!canMoveDown || isSaving}
        onClick={onMoveDown}
      />
      <AddRowTableButton
        disabled={isSaving}
        onClick={() => {
          shouldScrollRef.current = true;
          onAddSibling();
        }}
      />
      <DeleteRowTableButton disabled={!canDelete || isSaving} onClick={onDelete} />
      <AddChildRowTableButton
        disabled={!canAddChild || isSaving}
        onClick={() => {
          shouldScrollRef.current = true;
          onAddChild();
        }}
      />
      <SaveTableButton loading={isSaving} onClick={onSave} />
      <ResetTableButton disabled={isSaving} onClick={onReset} />
    </>
  );

  return (
    <TableCard
      title="메뉴 목록"
      ariaLabel="메뉴 목록"
      actions={actions}
      actionsClassName="common-code-card__actions--detail"
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="메뉴 목록을 불러오는 중입니다."

      >
        <>
          {/* 타이틀-테이블 사이 안내문구 */}
          <p className="system-menu-tree__guide-text">
            ※ 메뉴코드·메뉴 명은 필수 입력 항목입니다. 메뉴주소를 입력한 항목에는 하위 메뉴를 추가할 수 없습니다.
          </p>

          <div ref={treeContainerRef} className="layout-contents">
            <TreeMenu
              nodes={nodes}
              emptyMessage="데이터가 없습니다."
              labelHeader="메뉴코드"
              labelRender={(node) => (
                <InputBase
                  size="sm"
                  className="common-table__input"
                  value={node.data?.code ?? ''}
                  aria-label={`${node.label} 메뉴코드`}
                  readOnly={!node.data?.isNew}
                  controlState={
                    !node.data?.isNew
                      ? 'readonly'
                      : nodeErrors.code.has(node.id)
                      ? 'error'
                      : ''
                  }
                  onChange={(e) => onUpdateData(node.id, { code: e.target.value })}
                />
              )}
              columns={columns}
              selectedId={selectedId}
              onSelect={onSelect}
              defaultExpandedIds={defaultExpandedIds}
              expandTrigger={expandTrigger}
              className="system-menu-tree__inner"
              ariaLabel="메뉴 관리 트리"
            />
          </div>
        </>
      </TableCardContentState>
    </TableCard>
  );
}
