import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { MenuOptionDetailRow, MenuOptionGroupRow } from '../types';

type MenuOptionDetailTableProps = {
  selectedGroup: MenuOptionGroupRow | null;
  isLoading: boolean;
  isSaving: boolean;
  columns: EditableDetailColumn[];
  rows: MenuOptionDetailRow[];
  rowErrors: DetailRowErrorState;
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, columnKey: string) => void;
  onAddRow: () => string;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onEditRow: (row: MenuOptionDetailRow) => void;
  onSave: () => void;
};

export function MenuOptionDetailTable({
  selectedGroup,
  isLoading,
  isSaving,
  columns,
  rows,
  rowErrors,
  onChangeValue,
  onClearRowError,
  onAddRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
  onEditRow,
  onSave,
}: MenuOptionDetailTableProps) {
  return (
    <EditableDetailTable
      table={{
        title: '옵션 항목',
        titleBadge: selectedGroup ? (
          <span className="menu-option-table__selected-badge">{selectedGroup.values.groupName}</span>
        ) : undefined,
        ariaLabel: '옵션 항목',
        tableAriaLabel: '옵션 항목 테이블',
        guideText: (
          <>
            ※ 옵션설명 및 이미지 등록은 상세페이지를 이용해 주세요. / 수량 설정은 1회 구매 제한
            수량입니다.
          </>
        ),
        emptyRowsText: '옵션 항목이 없습니다.',
      }}
      statusText={{
        loadingTitle: '옵션 항목을 불러오는 중입니다.',
      }}
      data={{
        selectedMaster: selectedGroup,
        rows,
        columns,
        rowErrors,
      }}
      status={{
        isLoading,
        isSaving,
      }}
      actions={{
        showMoveActions: true,
        onChangeValue,
        onClearRowError,
        onAddRow,
        onDeleteRow,
        onMoveUp,
        onMoveDown,
        onEditRow,
        onSave,
      }}
    />
  );
}
