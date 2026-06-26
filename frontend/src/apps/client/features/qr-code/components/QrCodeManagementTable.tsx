import { useEffect, useRef } from 'react';
import {
  AddRowTableButton,
  DeleteRowTableButton,
  PrintListTableButton,
  SaveTableButton,
} from '@/shared/components/button';
import type { SelectOption } from '@/shared/components/input';
import { TableBodyRenderer, TableCard, TableCardContentState } from '@/shared/components/table';
import type { QrCodeRow, QrCodeRowErrors } from '../types';
import {
  createQrCodeColumns,
  createQrCodeHeaderOverrides,
  createQrCodeRows,
} from './qrCodeTableModel';

type QrCodeManagementTableProps = {
  rows: QrCodeRow[];
  selectedRowId: string;
  checkedRowIds: Set<string>;
  rowErrors: QrCodeRowErrors;
  tableNumOptions: SelectOption[];
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onSelectRow: (rowId: string) => void;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onChangeRowField: (rowId: string, key: 'tableNum' | 'remark', value: string) => void;
  onPrintRow: (rowId: string) => void;
  onBulkPrint: () => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

export function QrCodeManagementTable({
  rows,
  selectedRowId,
  checkedRowIds,
  rowErrors,
  tableNumOptions,
  isLoading,
  isError,
  isSaving,
  onSelectRow,
  onToggleRow,
  onToggleAll,
  onChangeRowField,
  onPrintRow,
  onBulkPrint,
  onAddRow,
  onDeleteRow,
  onSave,
}: QrCodeManagementTableProps) {
  const shouldScrollRef = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldScrollRef.current || !selectedRowId || !tableRef.current) return;
    shouldScrollRef.current = false;
    const selectedRow = tableRef.current.querySelector('tr.is-selected');
    selectedRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedRowId]);

  const columns = createQrCodeColumns();
  const tableRows = createQrCodeRows({
    rows,
    selectedRowId,
    checkedRowIds,
    rowErrors,
    tableNumOptions,
    onSelectRow,
    onToggleRow,
    onChangeRowField,
    onPrintRow,
  });
  const headerCellOverrides = createQrCodeHeaderOverrides({
    allChecked: rows.length > 0 && rows.every((row) => checkedRowIds.has(row.id)),
    onToggleAll,
  });

  return (
    <TableCard
      title="QR 코드 목록"
      ariaLabel="QR 코드 목록"
      className="qr-code-management-table"
      actions={
        <>
          <AddRowTableButton
            disabled={isSaving}
            onClick={() => {
              shouldScrollRef.current = true;
              onAddRow();
            }}
          />
          <DeleteRowTableButton disabled={!selectedRowId || isSaving} onClick={onDeleteRow} />
          <PrintListTableButton disabled={isSaving} onClick={onBulkPrint} />
          <SaveTableButton loading={isSaving} onClick={onSave} />
        </>
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="QR 코드 목록을 불러오는 중입니다."
      >
        <div ref={tableRef} className="layout-contents">
          <TableBodyRenderer
            tableAriaLabel="QR 코드 관리 테이블"
            columns={columns}
            rows={tableRows}
            headerCellOverrides={headerCellOverrides}
            emptyMessage="조회 결과가 없습니다."
          />
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
