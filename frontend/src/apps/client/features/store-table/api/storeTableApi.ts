import {
  useGetTableInfo1,
  useNewTableInfo,
} from '@/generated/store-manage-controller/store-manage-controller';
import type { TableInfoItem } from '@/generated/types/tableInfoItem';
import type { TableInfoRequest } from '@/generated/types/tableInfoRequest';
import type { TableInfoResponse } from '@/generated/types/tableInfoResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { StoreTableRow } from '../types';

export function mapToStoreTableModel(item: TableInfoResponse): StoreTableRow {
  return {
    id: item.sysId ?? `table-${item.tableNum ?? Date.now()}`,
    sysId: item.sysId,
    tableNum: item.tableNum != null ? String(item.tableNum) : '',
    tableName: item.tableName ?? '',
    tableQty: item.tableQty != null ? String(item.tableQty) : '',
    useYn: item.useYn ?? '',
    isNew: false,
  };
}

export function mapToStoreTablePayload(row: StoreTableRow): TableInfoItem {
  return {
    sysId: row.sysId,
    tableNum: row.tableNum ? Number(row.tableNum) : undefined,
    tableName: row.tableName,
    tableQty: row.tableQty ? Number(row.tableQty) : undefined,
    useYn: row.useYn,
  };
}

function isSameStoreTableRow(a: StoreTableRow, b: StoreTableRow) {
  return (
    a.tableNum === b.tableNum &&
    a.tableName === b.tableName &&
    a.tableQty === b.tableQty &&
    a.useYn === b.useYn
  );
}

export function buildStoreTableRequest(
  currentRows: StoreTableRow[],
  originalRows: StoreTableRow[],
): TableInfoRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToStoreTablePayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameStoreTableRow(row, originalRow) : false;
    })
    .map(mapToStoreTablePayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToStoreTablePayload);

  return { newItems, updateItems, delItems };
}

export function hasStoreTableChanges(request: TableInfoRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

export function useStoreTableQuery() {
  return useGetTableInfo1({
    query: {
      queryKey: queryKeys.storeTable.lists,
      ...queryPolicies.clientCrudList,
    },
  });
}

export function useSaveStoreTableMutation() {
  const mutation = useNewTableInfo();

  return {
    mutateAsync: async (request: TableInfoRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}
