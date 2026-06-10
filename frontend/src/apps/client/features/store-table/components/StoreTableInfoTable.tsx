import './StoreTableInfoTable.css';
import { CreateTableButton, DeleteTableButton } from '@/shared/components/button';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { StoreTableInfo } from '../types';
import {
  createStoreTableInfoColumns,
  createStoreTableInfoHeaderOverrides,
  createStoreTableInfoRows,
} from './storeTableInfoTableModel';

type StoreTableInfoTableProps = {
  rows: StoreTableInfo[];
  selectedRowIds: Set<string>;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onCreate: () => void;
  onDelete: () => void;
  onEdit: (rowId: string) => void;
};

export function StoreTableInfoTable({
  rows,
  selectedRowIds,
  onToggleRow,
  onToggleAll,
  onCreate,
  onDelete,
  onEdit,
}: StoreTableInfoTableProps) {
  const allChecked = rows.length > 0 && rows.every((row) => selectedRowIds.has(row.id));
  const columns = createStoreTableInfoColumns();
  const tableRows = createStoreTableInfoRows({ rows, selectedRowIds, onToggleRow, onEdit });
  const headerOverrides = createStoreTableInfoHeaderOverrides({ allChecked, onToggleAll });

  return (
    <TableCard
      title="테이블 정보 목록"
      ariaLabel="테이블 정보 목록"
      className="store-table-info-table"
      actions={
        <>
          <CreateTableButton onClick={onCreate} />
          <DeleteTableButton disabled={selectedRowIds.size === 0} onClick={onDelete} />
        </>
      }
    >
      <TableBodyRenderer
        tableAriaLabel="테이블 정보 목록 테이블"
        tableClassName="common-table store-table-info-table__table"
        columns={columns}
        rows={tableRows}
        headerCellOverrides={headerOverrides}
        emptyMessage="조회된 테이블이 없습니다."
      />
    </TableCard>
  );
}
