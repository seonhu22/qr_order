import {
  useGetTableGui,
  useSaveTableGui,
} from '@/generated/store-manage-controller/store-manage-controller';
import type { TableGuiItem } from '@/generated/types/tableGuiItem';
import type { TableGuiRequest } from '@/generated/types/tableGuiRequest';
import type { TableGuiResponse } from '@/generated/types/tableGuiResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { PlacedTableItem } from '../types';

// useYn 활성 + QR코드 등록까지 끝난 테이블 중, 캔버스에 좌표가 저장되어 실제로 배치된 테이블만 true
export function isTableGuiPlaced(item: TableGuiResponse) {
  return item.xcoordinate != null && item.ycoordinate != null;
}

export function mapToPlacedTableItem(item: TableGuiResponse): PlacedTableItem {
  return {
    id: item.sysId ?? `table-${item.tableNum ?? Date.now()}`,
    kind: 'table',
    sysId: item.sysId,
    tableNum: item.tableNum != null ? String(item.tableNum) : '',
    tableName: item.tableName ?? '',
    seatCount: item.tableQty ?? 0,
    x: item.xcoordinate ?? 0,
    y: item.ycoordinate ?? 0,
    width: item.width ?? 0,
    height: item.height ?? 0,
  };
}

function mapToTableGuiItem(item: PlacedTableItem): TableGuiItem {
  return {
    sysId: item.sysId,
    tableName: item.tableName,
    tableNum: item.tableNum ? Number(item.tableNum) : undefined,
    tableQty: item.seatCount,
    xcoordinate: Math.round(item.x),
    ycoordinate: Math.round(item.y),
    width: Math.round(item.width),
    height: Math.round(item.height),
  };
}

function isSamePlacement(a: PlacedTableItem, b: PlacedTableItem) {
  return (
    Math.round(a.x) === Math.round(b.x) &&
    Math.round(a.y) === Math.round(b.y) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}

export function buildTableGuiRequest(
  draftItems: PlacedTableItem[],
  baseItems: PlacedTableItem[],
): TableGuiRequest {
  const baseBySysId = new Map(baseItems.filter((item) => item.sysId).map((item) => [item.sysId as string, item]));
  const draftBySysId = new Map(draftItems.filter((item) => item.sysId).map((item) => [item.sysId as string, item]));

  // newItems: 이번에 처음 캔버스에 배치된 테이블(기존 배치 정보 없음)
  // updateItems: 이미 배치되어 있던 테이블의 좌표/크기 변경
  // 백엔드 저장 동작은 동일하고 감사로그(insert/update) 구분에만 사용된다.
  const newItems = draftItems.filter((item) => item.sysId && !baseBySysId.has(item.sysId)).map(mapToTableGuiItem);
  const updateItems = draftItems
    .filter((item) => item.sysId && baseBySysId.has(item.sysId))
    .filter((item) => !isSamePlacement(item, baseBySysId.get(item.sysId as string) as PlacedTableItem))
    .map(mapToTableGuiItem);
  const delItems = baseItems
    .filter((item) => item.sysId && !draftBySysId.has(item.sysId as string))
    .map(mapToTableGuiItem);

  return { newItems, updateItems, delItems };
}

export function hasTableGuiChanges(request: TableGuiRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

export function useTableGuiQuery() {
  return useGetTableGui({
    query: {
      queryKey: queryKeys.tableLayout.lists,
      ...queryPolicies.clientCrudList,
    },
  });
}

export function useSaveTableGuiMutation() {
  const mutation = useSaveTableGui();

  return {
    mutateAsync: async (request: TableGuiRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}
