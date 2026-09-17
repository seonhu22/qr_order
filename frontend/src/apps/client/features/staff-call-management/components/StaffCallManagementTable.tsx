import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { EditableDetailColumn, EditableDetailRow } from '@/shared/components/table/editableTableTypes';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import { SINGLE_YN_OPTIONS, USE_YN_OPTIONS } from '../api/staffCallManagementApi';
import type { StaffCallItemRow } from '../types';

const STAFF_CALL_COLUMNS: EditableDetailColumn[] = [
  { key: 'callCd', label: '호출코드', type: 'text', required: true, readOnlyOnExisting: true },
  { key: 'callNm', label: '호출명', type: 'text', required: true },
  { key: 'description', label: '설명', type: 'text' },
  {
    key: 'singleYn',
    label: '선택방식',
    type: 'select',
    className: 'common-table__col--md',
    options: SINGLE_YN_OPTIONS,
  },
  {
    key: 'useYn',
    label: '사용여부',
    type: 'select',
    className: 'common-table__col--md',
    options: USE_YN_OPTIONS,
    disabled: true,
  },
];

type StaffCallManagementTableProps = {
  masterId: string;
  isLoading: boolean;
  isSaving: boolean;
  rows: StaffCallItemRow[];
  emptyRowsText: string;
  rowErrors: DetailRowErrorState;
  onChangeValue: (rowId: string, key: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, key: string) => void;
  onAddRow: () => string;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onSave: () => void;
};

function mapToEditableRows(rows: StaffCallItemRow[]): EditableDetailRow[] {
  return rows.map((row) => ({
    id: row.id,
    ordNo: row.ordNo,
    isNew: row.isNew,
    values: {
      callCd: row.callCd,
      callNm: row.callNm,
      singleYn: row.singleYn,
      description: row.description,
      useYn: row.useYn,
    },
  }));
}

/**
 * 직원호출 항목 편집 테이블 — 마스터/디테일 선택 구조가 아니라 매장당 하나뿐인 평평한 목록이라,
 * `EditableDetailTable`에 고정된 `masterId`를 항상 넘겨 "선택됨" 상태로만 쓴다(ADR 참고).
 */
export function StaffCallManagementTable({
  masterId,
  isLoading,
  isSaving,
  rows,
  emptyRowsText,
  rowErrors,
  onChangeValue,
  onClearRowError,
  onAddRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
  onSave,
}: StaffCallManagementTableProps) {
  return (
    <EditableDetailTable
      table={{
        title: '직원호출 항목',
        className: 'staff-call-management-table',
        ariaLabel: '직원호출 항목',
        tableAriaLabel: '직원호출 항목 테이블',
        guideText:
          '※ 등록된 항목은 모두 고객 화면에 노출됩니다. 사용여부와 순서 변경은 준비 중이며, 항목은 최초 등록순으로 표시됩니다.',
        emptyRowsText,
      }}
      statusText={{
        loadingTitle: '직원호출 항목을 불러오는 중입니다.',
      }}
      data={{
        selectedMaster: { id: masterId },
        rows: mapToEditableRows(rows),
        columns: STAFF_CALL_COLUMNS,
        rowErrors,
      }}
      status={{
        isLoading,
        isSaving,
      }}
      getInputAriaLabel={(row, column) => {
        const name = String(row.values.callNm || row.id);

        if (column.key === 'callNm') return `${name} 호출명`;
        if (column.key === 'description') return `${name} 설명`;

        return `${name} ${column.label}`;
      }}
      actions={{
        showMoveActions: false,
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
