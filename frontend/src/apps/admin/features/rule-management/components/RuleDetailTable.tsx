import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import { RULE_DETAIL_SUPPORTS_ORD_NO } from '../api/ruleManagementApi';
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
      table={{
        title: '규칙 상세',
        ariaLabel: '규칙 상세',
        tableAriaLabel: '규칙 상세 테이블',
        footnote: selectedMaster ? `${selectedMaster.name} 상세 규칙을 편집 중입니다.` : undefined,
        emptyRowsText: '상세 항목이 없습니다.',
      }}
      statusText={{
        loadingTitle: '규칙 상세를 불러오는 중입니다.',
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
      actions={{
        showMoveActions: RULE_DETAIL_SUPPORTS_ORD_NO,
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
