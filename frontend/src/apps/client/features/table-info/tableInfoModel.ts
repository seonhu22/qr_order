import type { TableInfoItem, TableInfoResponse } from '@/generated/types';
import type { TableInfoRow, TableInfoRowError, TableInfoRowErrors } from './types';

export const emptyTableInfoRowError: TableInfoRowError = {
  tableNum: false,
  tableName: false,
  tableQty: false,
  useYn: false,
};

export function normalizeTableInfoNumber(value: string) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function toTableInfoRow(item: TableInfoResponse, index: number): TableInfoRow {
  const id = item.sysId || `table-${index + 1}`;

  return {
    id,
    sysId: item.sysId,
    tableNum: item.tableNum == null ? '' : String(item.tableNum),
    tableName: item.tableName ?? '',
    tableQty: item.tableQty == null ? '' : String(item.tableQty),
    useYn: item.useYn === 'N' ? 'N' : 'Y',
    isNew: false,
  };
}

export function toTableInfoItem(row: TableInfoRow): TableInfoItem {
  return {
    sysId: row.sysId,
    tableNum: normalizeTableInfoNumber(row.tableNum),
    tableName: row.tableName.trim(),
    tableQty: normalizeTableInfoNumber(row.tableQty),
    useYn: row.useYn || 'Y',
  };
}

export function isTableInfoRowDirty(row: TableInfoRow, original?: TableInfoRow) {
  if (!original) {
    return true;
  }

  return (
    row.tableNum !== original.tableNum ||
    row.tableName !== original.tableName ||
    row.tableQty !== original.tableQty ||
    row.useYn !== original.useYn
  );
}

export function validateTableInfoRows(rows: TableInfoRow[]): TableInfoRowErrors {
  const tableNumCounts = new Map<number, number>();

  rows.forEach((row) => {
    const tableNum = normalizeTableInfoNumber(row.tableNum.trim());

    if (tableNum != null) {
      tableNumCounts.set(tableNum, (tableNumCounts.get(tableNum) ?? 0) + 1);
    }
  });

  return Object.fromEntries(
    rows.map((row) => {
      const tableNum = normalizeTableInfoNumber(row.tableNum.trim());

      return [
        row.id,
        {
          tableNum: tableNum == null || (tableNumCounts.get(tableNum) ?? 0) > 1,
          tableName: row.tableName.trim().length === 0,
          tableQty: normalizeTableInfoNumber(row.tableQty.trim()) == null,
          useYn: row.useYn !== 'Y' && row.useYn !== 'N',
        },
      ];
    }),
  );
}

export function hasTableInfoRowErrors(rowErrors: TableInfoRowErrors) {
  return Object.values(rowErrors).some((error) => Object.values(error).some(Boolean));
}

export function createTableInfoSaveRequest(
  rows: TableInfoRow[],
  originalRows: TableInfoRow[],
  deletedRows: TableInfoRow[],
) {
  const originalRowById = new Map(originalRows.map((row) => [row.id, row]));

  return {
    newItems: rows.filter((row) => row.isNew).map(toTableInfoItem),
    updateItems: rows
      .filter((row) => !row.isNew && isTableInfoRowDirty(row, originalRowById.get(row.id)))
      .map(toTableInfoItem),
    delItems: deletedRows.map(toTableInfoItem),
  };
}
