import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { MenuCategoryRow, MenuDetailRow } from '../types';

type MenuDetailTableProps = {
  selectedCategory: MenuCategoryRow | null;
  isLoading: boolean;
  isSaving: boolean;
  columns: EditableDetailColumn[];
  rows: MenuDetailRow[];
  rowErrors: DetailRowErrorState;
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, columnKey: string) => void;
  onAddRow: () => string;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onEditRow: (row: MenuDetailRow) => void;
  onSave: () => void;
};

export function MenuDetailTable({
  selectedCategory,
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
}: MenuDetailTableProps) {
  return (
    <EditableDetailTable
      table={{
        title: '메뉴 관리',
        titleBadge: selectedCategory ? (
          <span className="menu-management-table__category-badge">{selectedCategory.name}</span>
        ) : undefined,
        ariaLabel: '메뉴 관리',
        tableAriaLabel: '메뉴 관리 테이블',
        guideText: <>※ 메뉴설명 및 이미지 등록은 상세페이지를 이용해 주세요. </>,
        emptyRowsText: '메뉴가 없습니다.',
      }}
      statusText={{
        loadingTitle: '메뉴 목록을 불러오는 중입니다.',
      }}
      data={{
        selectedMaster: selectedCategory,
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
