import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import { USE_YN_OPTIONS } from '../constants';
import type { StoreTableRow, StoreTableRowErrors } from '../types';

type CreateStoreTableModelParams = {
  rows: StoreTableRow[];
  selectedRowId: string;
  rowErrors: StoreTableRowErrors;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (
    rowId: string,
    key: 'tableNum' | 'tableName' | 'tableQty' | 'useYn',
    value: string,
  ) => void;
};

export function createStoreTableColumns(): SharedTableColumn[] {
  return [
    { key: 'tableNum', label: '테이블 번호', required: true },
    { key: 'tableName', label: '테이블 이름', required: true },
    { key: 'tableQty', label: '좌석 수', required: true },
    { key: 'useYn', label: '사용여부', required: true },
  ];
}

export function createStoreTableRows({
  rows,
  selectedRowId,
  rowErrors,
  onSelectRow,
  onChangeRowField,
}: CreateStoreTableModelParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedRowId === row.id,
    selectOn: 'mouseDown',
    onSelect: () => onSelectRow(row.id),
    cells: {
      tableNum: {
        type: 'input',
        inputId: `${row.id}-table-num`,
        className: 'common-table__input',
        controlState: rowErrors[row.id]?.tableNum ? 'error' : '',
        value: row.tableNum,
        placeholder: '번호',
        ariaLabel: `${row.id} 테이블 번호`,
        onChange: (value) => onChangeRowField(row.id, 'tableNum', value.replace(/\D/g, '')),
      },
      tableName: {
        type: 'input',
        inputId: `${row.id}-table-name`,
        className: 'common-table__input',
        controlState: rowErrors[row.id]?.tableName ? 'error' : '',
        value: row.tableName,
        placeholder: '테이블 이름',
        ariaLabel: `${row.id} 테이블 이름`,
        onChange: (value) => onChangeRowField(row.id, 'tableName', value),
      },
      tableQty: {
        type: 'input',
        inputId: `${row.id}-table-qty`,
        className: 'common-table__input',
        controlState: rowErrors[row.id]?.tableQty ? 'error' : '',
        value: row.tableQty,
        placeholder: '좌석 수',
        ariaLabel: `${row.id} 좌석 수`,
        onChange: (value) => onChangeRowField(row.id, 'tableQty', value.replace(/\D/g, '')),
      },
      useYn: {
        type: 'select',
        value: row.useYn,
        options: USE_YN_OPTIONS,
        placeholder: '선택',
        isError: rowErrors[row.id]?.useYn ?? false,
        onChange: (value) => onChangeRowField(row.id, 'useYn', value),
      },
    },
  }));
}
