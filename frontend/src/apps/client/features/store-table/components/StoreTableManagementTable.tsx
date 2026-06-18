import './StoreTableManagementTable.css';
import { useEffect, useRef } from 'react';
import {
  EditableTableActions,
  TableBodyRenderer,
  TableCard,
  TableCardContentState,
} from '@/shared/components/table';
import type { StoreTableRow, StoreTableRowErrors } from '../types';
import { createStoreTableColumns, createStoreTableRows } from './storeTableModel';

type StoreTableManagementTableProps = {
  rows: StoreTableRow[];
  selectedRowId: string;
  rowErrors: StoreTableRowErrors;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (
    rowId: string,
    key: 'tableNum' | 'tableName' | 'tableQty' | 'useYn',
    value: string,
  ) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

export function StoreTableManagementTable({
  rows,
  selectedRowId,
  rowErrors,
  isLoading,
  isError,
  isSaving,
  onSelectRow,
  onChangeRowField,
  onAddRow,
  onDeleteRow,
  onSave,
}: StoreTableManagementTableProps) {
  const shouldScrollRef = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldScrollRef.current || !selectedRowId || !tableRef.current) return;
    shouldScrollRef.current = false;
    const selectedRow = tableRef.current.querySelector('tr.is-selected');
    selectedRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedRowId]);

  const columns = createStoreTableColumns();
  const tableRows = createStoreTableRows({
    rows,
    selectedRowId,
    rowErrors,
    onSelectRow,
    onChangeRowField,
  });

  return (
    <TableCard
      title="테이블 목록"
      ariaLabel="테이블 목록"
      className="store-table-management-table"
      actions={
        <EditableTableActions
          isSaving={isSaving}
          canDelete={!!selectedRowId}
          onAddRow={() => {
            shouldScrollRef.current = true;
            onAddRow();
          }}
          onDeleteRow={onDeleteRow}
          onSave={onSave}
        />
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="테이블 목록을 불러오는 중입니다."
      >
        <div ref={tableRef} className="layout-contents">
          <TableBodyRenderer
            tableAriaLabel="테이블 관리 테이블"
            columns={columns}
            rows={tableRows}
            emptyMessage="조회 결과가 없습니다."
            colGroup={
              <colgroup>
                <col className="store-table-col-num" />
                <col className="store-table-col-name" />
                <col className="store-table-col-qty" />
                <col className="store-table-col-use-yn" />
              </colgroup>
            }
          />
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
