import { SelectInput } from '@/shared/components/input';
import type { SelectOption } from '@/shared/components/input';
import type { SharedTableCell, SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { StoreQRCode, StoreTableInfo } from '../types';

type CreateQRCodeRowsParams = {
  rows: StoreQRCode[];
  tableOptions: SelectOption[];
  selectedRowIds: Set<string>;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onChangeTableNumber: (rowId: string, tableNumber: number) => void;
  onEdit: (rowId: string) => void;
};

export function createQRCodeColumns(): SharedTableColumn[] {
  return [
    { key: 'check', label: '', className: 'common-table__col--checkbox', ariaLabel: '선택' },
    { key: 'qrCode', label: 'QR 코드', className: 'qr-code-table__col--code' },
    { key: 'tableNumber', label: '테이블 번호', className: 'qr-code-table__col--table' },
    { key: 'description', label: '설명', tdClassName: 'common-table__cell--left' },
    { key: 'url', label: 'URL', tdClassName: 'common-table__cell--left' },
    { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
    { key: 'edit', label: '', className: 'common-table__col--action', ariaLabel: '수정' },
  ];
}

export function createQRCodeHeaderOverrides({
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

export function createTableNumberOptions(rows: StoreTableInfo[]): SelectOption[] {
  return rows.map((row) => ({
    value: String(row.tableNumber),
    label: `${row.tableNumber}번 테이블`,
    description: row.tableName,
  }));
}

export function createQRCodeRows({
  rows,
  tableOptions,
  selectedRowIds,
  onToggleRow,
  onChangeTableNumber,
  onEdit,
}: CreateQRCodeRowsParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedRowIds.has(row.id),
    cells: {
      check: {
        type: 'checkbox',
        checked: selectedRowIds.has(row.id),
        ariaLabel: `${row.qrCode} 선택`,
        onChange: (checked) => onToggleRow(row.id, checked),
      },
      qrCode: {
        type: 'text',
        value: row.qrCode,
        className: 'common-table__mono',
      },
      tableNumber: {
        type: 'custom',
        render: () => (
          <SelectInput
            size="sm"
            value={String(row.tableNumber)}
            options={tableOptions}
            placeholder="테이블 번호"
            aria-label="테이블 번호 선택"
            className="qr-code-table__table-select"
            onChange={(value) => onChangeTableNumber(row.id, Number(value))}
          />
        ),
      },
      description: {
        type: 'text',
        value: row.description,
        title: row.description,
        className: 'common-table__cell--truncate',
      },
      url: {
        type: 'text',
        value: row.url,
        title: row.url,
        className: 'common-table__mono common-table__cell--truncate',
      },
      useYn: {
        type: 'useYnBadge',
        value: row.useYn,
      },
      edit: {
        type: 'editButton',
        ariaLabel: `${row.qrCode} 수정`,
        onClick: () => onEdit(row.id),
      },
    },
  }));
}
