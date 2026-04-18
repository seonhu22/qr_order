import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { RuleDetailColumn, RuleDetailRow, RuleMasterRow } from '../types';

type RuleDetailTableProps = {
  selectedMaster: RuleMasterRow | null;
  isLoading: boolean;
  isSaving: boolean;
  columns: RuleDetailColumn[];
  rows: RuleDetailRow[];
  rowErrors: DetailRowErrorState;
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, columnKey: string) => void;
  onAddRow: () => string;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onSave: () => void;
};

export function RuleDetailTable({
  selectedMaster,
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
  onSave,
}: RuleDetailTableProps) {
  return (
    <EditableDetailTable
      title="규칙 상세"
      ariaLabel="규칙 상세"
      tableAriaLabel="규칙 상세 테이블"
      loadingTitle="규칙 상세를 불러오는 중입니다."
      emptyRowsText="상세 항목이 없습니다."
      selectedMaster={selectedMaster}
      rows={rows}
      columns={columns}
      isLoading={isLoading}
      isSaving={isSaving}
      rowErrors={rowErrors}
      footnote={selectedMaster ? `${selectedMaster.name} 상세 규칙을 편집 중입니다.` : undefined}
      onChangeValue={onChangeValue}
      onClearRowError={onClearRowError}
      onAddRow={onAddRow}
      onDeleteRow={onDeleteRow}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onSave={onSave}
    />
  );
}
