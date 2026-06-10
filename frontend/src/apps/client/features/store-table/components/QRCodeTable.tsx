import './QRCodeTable.css';
import { CreateTableButton, DeleteTableButton } from '@/shared/components/button';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { StoreQRCode, StoreTableInfo } from '../types';
import {
  createQRCodeColumns,
  createQRCodeHeaderOverrides,
  createQRCodeRows,
  createTableNumberOptions,
} from './qrCodeTableModel';

type QRCodeTableProps = {
  rows: StoreQRCode[];
  tableRows: StoreTableInfo[];
  selectedRowIds: Set<string>;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onCreate: () => void;
  onDelete: () => void;
  onChangeTableNumber: (rowId: string, tableNumber: number) => void;
  onEdit: (rowId: string) => void;
};

export function QRCodeTable({
  rows,
  tableRows,
  selectedRowIds,
  onToggleRow,
  onToggleAll,
  onCreate,
  onDelete,
  onChangeTableNumber,
  onEdit,
}: QRCodeTableProps) {
  const allChecked = rows.length > 0 && rows.every((row) => selectedRowIds.has(row.id));
  const tableOptions = createTableNumberOptions(tableRows);
  const columns = createQRCodeColumns();
  const bodyRows = createQRCodeRows({
    rows,
    tableOptions,
    selectedRowIds,
    onToggleRow,
    onChangeTableNumber,
    onEdit,
  });
  const headerOverrides = createQRCodeHeaderOverrides({ allChecked, onToggleAll });

  return (
    <TableCard
      title="QR 코드 목록"
      ariaLabel="QR 코드 목록"
      className="qr-code-table"
      actions={
        <>
          <CreateTableButton onClick={onCreate} />
          <DeleteTableButton disabled={selectedRowIds.size === 0} onClick={onDelete} />
        </>
      }
    >
      <TableBodyRenderer
        tableAriaLabel="QR 코드 목록 테이블"
        tableClassName="common-table qr-code-table__table"
        columns={columns}
        rows={bodyRows}
        headerCellOverrides={headerOverrides}
        emptyMessage="조회된 QR 코드가 없습니다."
      />
    </TableCard>
  );
}
