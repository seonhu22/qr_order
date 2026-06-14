import {
  EditableTableActions,
  TableBodyRenderer,
  TableCard,
  TableCardContentState,
} from '@/shared/components/table';
import type {
  SharedTableColumn,
  SharedTableRow,
} from '@/shared/components/table/tableModelTypes';
import type { TableInfoRow, TableInfoRowErrors, TableInfoRowField } from '../types';

type TableInfoTableProps = {
  rows: TableInfoRow[];
  selectedRowId: string;
  rowErrors: TableInfoRowErrors;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (rowId: string, field: TableInfoRowField, value: string) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

const useYnOptions = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

const columns: SharedTableColumn[] = [
  { key: 'tableNum', label: '테이블 번호', required: true },
  { key: 'tableName', label: '테이블 이름', required: true },
  { key: 'tableQty', label: '좌석 개수', required: true },
  { key: 'useYn', label: '사용여부', required: true },
];

function getRowErrors(rowErrors: TableInfoRowErrors, rowId: string) {
  return rowErrors[rowId] ?? {
    tableNum: false,
    tableName: false,
    tableQty: false,
    useYn: false,
  };
}

function createTableRows({
  rows,
  selectedRowId,
  rowErrors,
  onSelectRow,
  onChangeRowField,
}: Pick<
  TableInfoTableProps,
  'rows' | 'selectedRowId' | 'rowErrors' | 'onSelectRow' | 'onChangeRowField'
>): SharedTableRow[] {
  return rows.map((row) => {
    const errors = getRowErrors(rowErrors, row.id);

    return {
      id: row.id,
      selected: row.id === selectedRowId,
      selectOn: 'mouseDown',
      onSelect: () => onSelectRow(row.id),
      cells: {
        tableNum: {
          type: 'input',
          inputId: `table-info-num-${row.id}`,
          value: row.tableNum,
          ariaLabel: `${row.tableName || '신규 테이블'} 테이블 번호`,
          controlState: errors.tableNum ? 'error' : '',
          onChange: (value) => onChangeRowField(row.id, 'tableNum', value),
        },
        tableName: {
          type: 'input',
          inputId: `table-info-name-${row.id}`,
          value: row.tableName,
          ariaLabel: `${row.tableNum || '신규'} 테이블 이름`,
          controlState: errors.tableName ? 'error' : '',
          onChange: (value) => onChangeRowField(row.id, 'tableName', value),
        },
        tableQty: {
          type: 'input',
          inputId: `table-info-qty-${row.id}`,
          value: row.tableQty,
          ariaLabel: `${row.tableName || '신규 테이블'} 좌석 개수`,
          controlState: errors.tableQty ? 'error' : '',
          onChange: (value) => onChangeRowField(row.id, 'tableQty', value),
        },
        useYn: {
          type: 'select',
          value: row.useYn,
          options: useYnOptions,
          isError: errors.useYn,
          onChange: (value) => onChangeRowField(row.id, 'useYn', value),
        },
      },
    };
  });
}

export function TableInfoTable({
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
}: TableInfoTableProps) {
  const tableRows = createTableRows({
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
      actions={
        <EditableTableActions
          isSaving={isSaving}
          canDelete={!!selectedRowId}
          onAddRow={onAddRow}
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
        <TableBodyRenderer
          tableAriaLabel="테이블 목록"
          columns={columns}
          rows={tableRows}
          emptyMessage="데이터가 없습니다."
        />
      </TableCardContentState>
    </TableCard>
  );
}
