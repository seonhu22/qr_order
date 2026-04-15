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
          onAddRow={onAddRow}
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
      </TableCardContentState>
    </TableCard>
  );
}
