import type { SharedTableCell, SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { StoreTableInfo } from '../types';

type CreateStoreTableInfoRowsParams = {
  rows: StoreTableInfo[];
  selectedRowIds: Set<string>;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onEdit: (rowId: string) => void;
};

export function createStoreTableInfoColumns(): SharedTableColumn[] {
  return [
    { key: 'check', label: '', className: 'common-table__col--checkbox', ariaLabel: '선택' },
    { key: 'tableNumber', label: '테이블 번호', className: 'store-table-info-table__col--number' },
    { key: 'tableName', label: '테이블 명', tdClassName: 'common-table__cell--left' },
    { key: 'seatCount', label: '수용 인원', className: 'common-table__col--md' },
    { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
    { key: 'edit', label: '', className: 'common-table__col--action', ariaLabel: '수정' },
  ];
}

export function createStoreTableInfoHeaderOverrides({
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

export function createStoreTableInfoRows({
  rows,
  selectedRowIds,
  onToggleRow,
  onEdit,
}: CreateStoreTableInfoRowsParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedRowIds.has(row.id),
    cells: {
      check: {
        type: 'checkbox',
        checked: selectedRowIds.has(row.id),
        ariaLabel: `${row.tableNumber}번 테이블 선택`,
        onChange: (checked) => onToggleRow(row.id, checked),
      },
      tableNumber: {
        type: 'text',
        value: `${row.tableNumber}번`,
        className: 'common-table__mono',
      },
      tableName: {
        type: 'text',
        value: row.tableName,
        title: row.tableName,
        className: 'common-table__cell--truncate',
      },
      seatCount: {
        type: 'text',
        value: `${row.seatCount}명`,
      },
      useYn: {
        type: 'useYnBadge',
        value: row.useYn,
      },
      edit: {
        type: 'editButton',
        ariaLabel: `${row.tableNumber}번 테이블 수정`,
        onClick: () => onEdit(row.id),
      },
    },
  }));
}
