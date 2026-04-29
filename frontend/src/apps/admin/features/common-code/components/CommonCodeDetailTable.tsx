import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { EditableDetailColumn, EditableDetailRow } from '@/shared/components/table/editableTableTypes';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { DetailCode, MasterCode } from '../types';

const COMMON_CODE_DETAIL_COLUMNS: EditableDetailColumn[] = [
  { key: 'code', label: '공통코드', type: 'text', required: true, readOnlyOnExisting: true },
  { key: 'name', label: '공통코드명', type: 'text', required: true },
  { key: 'useYn', label: '사용여부', type: 'boolean', className: 'common-table__col--md' },
];

type CommonCodeDetailTableProps = {
  selectedMaster: MasterCode | null;
  isLoading: boolean;
  rows: DetailCode[];
  onFieldChange: (detailId: string, key: 'code' | 'name', value: string) => void;
  onUseYnChange: (detailId: string, checked: boolean) => void;
  onAddRow: () => string;
  onDeleteRows: (selectedId?: string) => void;
  onMoveUp: (selectedId?: string) => void;
  onMoveDown: (selectedId?: string) => void;
  isSaving: boolean;
  rowErrors: DetailRowErrorState;
  onClearRowError: (rowId: string, key: string) => void;
  onSave: () => void;
};

function mapToEditableRows(rows: DetailCode[]): EditableDetailRow[] {
  return rows.map((row) => ({
    id: row.id,
    ordNo: row.ordNo,
    isNew: row.isNew,
    values: {
      code: row.code,
      name: row.name,
      useYn: row.useYn,
    },
  }));
}

export function CommonCodeDetailTable({
  selectedMaster,
  isLoading,
  rows,
  onFieldChange,
  onUseYnChange,
  onAddRow,
  onDeleteRows,
  onMoveUp,
  onMoveDown,
  isSaving,
  rowErrors,
  onClearRowError,
  onSave,
}: CommonCodeDetailTableProps) {
  return (
    <EditableDetailTable
      table={{
        title: selectedMaster ? '공통코드 상세' : undefined,
        ariaLabel: '공통코드 상세',
        tableAriaLabel: '공통코드 상세 테이블',
        footnote: selectedMaster ? `${selectedMaster.name} 상세 코드를 편집 중입니다.` : undefined,
      }}
      statusText={{
        loadingTitle: '상세 코드를 불러오는 중입니다.',
      }}
      data={{
        selectedMaster,
        rows: mapToEditableRows(rows),
        columns: COMMON_CODE_DETAIL_COLUMNS,
        rowErrors,
      }}
      status={{
        isLoading,
        isSaving,
      }}
      getInputAriaLabel={(row, column) => {
        const code = String(row.values.code ?? row.id);

        if (column.key === 'code') {
          return `${code} 코드`;
        }

        if (column.key === 'name') {
          return `${code} 코드명`;
        }

        if (column.key === 'useYn') {
          return `${code} 사용 여부`;
        }

        return `${row.id} ${column.label}`;
      }}
      actions={{
        onChangeValue: (rowId, columnKey, value) => {
          if (columnKey === 'useYn') {
            onUseYnChange(rowId, Boolean(value));
            return;
          }

          if (columnKey === 'code' || columnKey === 'name') {
            onFieldChange(rowId, columnKey, String(value));
          }
        },
        onClearRowError,
        onAddRow,
        onDeleteRow: onDeleteRows,
        onMoveUp,
        onMoveDown,
        onSave,
      }}
    />
  );
}
