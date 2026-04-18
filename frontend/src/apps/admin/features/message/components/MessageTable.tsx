import { useEffect, useRef } from 'react';
import {
  EditableTableActions,
  TableBodyRenderer,
  TableCard,
  TableCardContentState,
} from '@/shared/components/table';
import type { MessageRow } from '../types';
import {
  createMessageTableColumns,
  createMessageTableRows,
} from './messageTableModel';

type MessageTableProps = {
  rows: MessageRow[];
  selectedRowId: string;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (rowId: string, key: 'code' | 'name' | 'content', value: string) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

/**
 * 메시지 관리 인라인 편집 테이블.
 *
 * @description
 * - 행 선택, 셀 입력, 하단 액션 버튼 렌더링만 담당한다.
 * - 데이터 저장 여부나 검색 조건 같은 상태 판단은 상위 훅에 맡긴다.
 */
export function MessageTable({
  rows,
  selectedRowId,
  isLoading,
  isError,
  isSaving,
  onSelectRow,
  onChangeRowField,
  onAddRow,
  onDeleteRow,
  onSave,
}: MessageTableProps) {
  /**
   * 행추가 버튼으로 발생한 선택 변경인지 추적한다.
   * 클릭 선택과 달리 행추가 직후에만 스크롤해야 하므로 플래그로 구분한다.
   */
  const shouldScrollRef = useRef(false);
  /** 테이블 본문 영역의 DOM 참조. 선택 행 스크롤 대상을 좁히기 위해 사용한다. */
  const tableRef = useRef<HTMLDivElement>(null);

  /**
   * 행추가로 새 행이 DOM에 반영된 뒤 해당 행이 보이도록 스크롤한다.
   * shouldScrollRef가 true일 때(행추가 직후)에만 실제로 스크롤한다.
   */
  useEffect(() => {
    if (!shouldScrollRef.current || !selectedRowId || !tableRef.current) return;
    shouldScrollRef.current = false;
    const selectedRow = tableRef.current.querySelector('tr.is-selected');
    selectedRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedRowId]);

  const columns = createMessageTableColumns();
  const tableRows = createMessageTableRows({
    rows,
    selectedRowId,
    onSelectRow,
    onChangeRowField,
  });

  return (
    <TableCard
      title="메세지 목록"
      ariaLabel="메세지 목록"
      actions={
        <EditableTableActions
          isSaving={isSaving}
          canDelete={!!selectedRowId}
          onAddRow={() => {
            shouldScrollRef.current = true;
            onAddRow();
          }}
          onDeleteRow={onDeleteRow}
          onSave={onSave}
        />
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="메세지 목록을 불러오는 중입니다."
      >
        <div ref={tableRef} className="layout-contents">
          <TableBodyRenderer
            tableAriaLabel="메세지 관리 테이블"
            columns={columns}
            rows={tableRows}
            colGroup={
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '52%' }} />
              </colgroup>
            }
          />
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
