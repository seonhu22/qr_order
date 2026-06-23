import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { MenuOptionGroupRow, MenuOptionMasterRow } from '../types';

type MenuOptionGroupTableProps = {
  selectedMaster: MenuOptionMasterRow | null;
  isLoading: boolean;
  isSaving: boolean;
  columns: EditableDetailColumn[];
  rows: MenuOptionGroupRow[];
  rowErrors: DetailRowErrorState;
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, columnKey: string) => void;
  onAddRow: () => string;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onSave: () => void;
};

export function MenuOptionGroupTable({
  selectedMaster,
  isLoading,
  isSaving,
  columns,
  rows,
  rowErrors,
  selectedGroupId,
  onSelectGroup,
  onChangeValue,
  onClearRowError,
  onAddRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
  onSave,
}: MenuOptionGroupTableProps) {
  return (
    <EditableDetailTable
      table={{
        title: '옵션 그룹',
        titleBadge: selectedMaster ? (
          <span className="menu-option-table__selected-badge">{selectedMaster.name}</span>
        ) : undefined,
        ariaLabel: '옵션 그룹',
        tableAriaLabel: '옵션 그룹 테이블',
        emptyRowsText: '옵션 그룹이 없습니다.',
      }}
      statusText={{
        loadingTitle: '옵션 그룹을 불러오는 중입니다.',
      }}
      data={{
        selectedMaster,
        rows,
        columns,
        rowErrors,
      }}
      status={{
        isLoading,
        isSaving,
      }}
      selection={{
        selectedRowId: selectedGroupId,
        onSelectRow: onSelectGroup,
      }}
      actions={{
        showMoveActions: true,
        onChangeValue,
        onClearRowError,
        onAddRow,
        onDeleteRow,
        onMoveUp,
        onMoveDown,
        onSave,
      }}
    />
  );
}
