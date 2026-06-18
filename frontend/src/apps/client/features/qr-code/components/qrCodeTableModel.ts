import type { SelectOption } from '@/shared/components/input';
import type { SharedTableCell, SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { QrCodeRow, QrCodeRowErrors } from '../types';

type CreateQrCodeTableModelParams = {
  rows: QrCodeRow[];
  selectedRowId: string;
  checkedRowIds: Set<string>;
  rowErrors: QrCodeRowErrors;
  tableNumOptions: SelectOption[];
  onSelectRow: (rowId: string) => void;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onChangeRowField: (rowId: string, key: 'tableNum' | 'remark', value: string) => void;
  onPrintRow: (rowId: string) => void;
};

export function createQrCodeColumns(): SharedTableColumn[] {
  return [
    { key: 'check', label: '', className: 'common-table__col--checkbox', ariaLabel: '선택' },
    { key: 'tableNum', label: '테이블 번호', required: true },
    { key: 'remark', label: '비고' },
    { key: 'print', label: '', className: 'common-table__col--action', ariaLabel: 'QR 출력' },
  ];
}

export function createQrCodeHeaderOverrides({
  allChecked,
  onToggleAll,
}: {
  allChecked: boolean;
  onToggleAll: (checked: boolean) => void;
}): Partial<Record<string, SharedTableCell>> {
  return {
    check: {
      type: 'checkbox',
      checked: allChecked,
      ariaLabel: '전체 선택',
      onChange: onToggleAll,
    },
  };
}

export function createQrCodeRows({
  rows,
  selectedRowId,
  checkedRowIds,
  rowErrors,
  tableNumOptions,
  onSelectRow,
  onToggleRow,
  onChangeRowField,
  onPrintRow,
}: CreateQrCodeTableModelParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedRowId === row.id,
    selectOn: 'mouseDown',
    onSelect: () => onSelectRow(row.id),
    cells: {
      check: {
        type: 'checkbox',
        checked: checkedRowIds.has(row.id),
        ariaLabel: `${row.id} 선택`,
        onChange: (checked) => onToggleRow(row.id, checked),
      },
      tableNum: {
        type: 'select',
        value: row.tableNum,
        options: tableNumOptions,
        placeholder: '테이블 선택',
        searchable: true,
        isError: rowErrors[row.id]?.tableNum ?? false,
        onChange: (value) => onChangeRowField(row.id, 'tableNum', value),
      },
      remark: {
        type: 'input',
        inputId: `${row.id}-qr-remark`,
        className: 'common-table__input',
        value: row.remark,
        placeholder: '비고',
        ariaLabel: `${row.id} 비고`,
        onChange: (value) => onChangeRowField(row.id, 'remark', value),
      },
      print: {
        type: 'printButton',
        ariaLabel: `${row.id} QR 출력`,
        onClick: () => onPrintRow(row.id),
      },
    },
  }));
}
