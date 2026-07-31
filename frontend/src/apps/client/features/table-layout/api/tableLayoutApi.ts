import {
  useGetTableGui,
  useSaveTableGui,
} from '@/generated/store-manage-controller/store-manage-controller';
import type { TableGuiItem } from '@/generated/types/tableGuiItem';
import type { TableGuiRequest } from '@/generated/types/tableGuiRequest';
import type { TableGuiResponse } from '@/generated/types/tableGuiResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { FACILITY_KIND_BY_LABEL, FACILITY_LABEL_BY_KIND } from '../constants';
import type { PlacedFacilityItem, PlacedNonTableItem, PlacedTableItem } from '../types';

// 백엔드 object_type 컬럼 — 01: 테이블, 02: 내부시설, 03: 기타.
// 일부 응답에서 테이블도 objectType='02'로 내려오는 동안에는 tableNum 존재 여부를 우선해 테이블을 판별한다.
export type TableGuiObjectType = '01' | '02' | '03';
type TableGuiItemWire = TableGuiItem & { objectType?: TableGuiObjectType };

type TableGuiSaveItemWire = TableGuiItemWire & {
  xCoordinate?: number;
  yCoordinate?: number;
};
export type TableGuiResponseWire = TableGuiResponse & {
  objectType?: TableGuiObjectType;
  xCoordinate?: number;
  yCoordinate?: number;
};

// 의미 분리를 위한 함수 작성, 가장 좋은 방법은 백앤드 dto를 generated 타입과 맞추는 것이 이상적이지만 현실적으로 가장 간단한 국소 패치를 진행한다.
function getGuiX(item: TableGuiResponse) {
  const wireItem = item as TableGuiResponseWire;
  return wireItem.xcoordinate ?? wireItem.xCoordinate;
}

function getGuiY(item: TableGuiResponse) {
  const wireItem = item as TableGuiResponseWire;
  return wireItem.ycoordinate ?? wireItem.yCoordinate;
}

export function isTableGuiRow(item: TableGuiResponse) {
  if (item.tableNum != null) return true;
  // objectType이 아직 없는 기존 mock 행은 전부 테이블로 취급한다 — 하위 호환.
  return ((item as TableGuiResponseWire).objectType ?? '01') === '01';
}

function isFixedFacilityRow(item: TableGuiResponseWire) {
  return item.tableNum == null && item.objectType === '02';
}

function isCustomFacilityRow(item: TableGuiResponseWire) {
  return item.objectType === '03';
}

// useYn 활성 + QR코드 등록까지 끝난 테이블 중, 캔버스에 좌표가 저장되어 실제로 배치된 테이블만 true
export function isTableGuiPlaced(item: TableGuiResponse) {
  return isTableGuiRow(item) && getGuiX(item) != null && getGuiY(item) != null;
}

export function isFixedFacilityGuiPlaced(item: TableGuiResponse) {
  const wireItem = item as TableGuiResponseWire;
  return isFixedFacilityRow(wireItem) && getGuiX(wireItem) != null && getGuiY(wireItem) != null;
}

export function isCustomFacilityGuiPlaced(item: TableGuiResponse) {
  const wireItem = item as TableGuiResponseWire;
  return isCustomFacilityRow(wireItem) && getGuiX(wireItem) != null && getGuiY(wireItem) != null;
}

export function mapToPlacedTableItem(item: TableGuiResponse): PlacedTableItem {
  return {
    id: item.sysId ?? `table-${item.tableNum ?? Date.now()}`,
    kind: 'table',
    sysId: item.sysId,
    tableNum: item.tableNum != null ? String(item.tableNum) : '',
    tableName: item.tableName ?? '',
    seatCount: item.tableQty ?? 0,
    x: getGuiX(item) ?? 0,
    y: getGuiY(item) ?? 0,
    width: item.width ?? 0,
    height: item.height ?? 0,
  };
}

// object_type '02' 행은 종류를 tableType이 아니라 공통코드 이름(common_nm → tableName)으로 들고 온다 —
// 그 이름 텍스트를 FACILITY_KIND_BY_LABEL로 매칭해서 kind/아이콘을 역으로 찾는다. 매칭 실패 시(알 수
// 없는 이름) 카운터로 대체한다.
export function mapToPlacedFacilityItem(item: TableGuiResponse): PlacedFacilityItem {
  const wireItem = item as TableGuiResponseWire;
  const kind = FACILITY_KIND_BY_LABEL[wireItem.tableName ?? ''] ?? 'counter';
  return {
    id: wireItem.sysId ?? `facility-${kind}-${Date.now()}`,
    kind,
    sysId: wireItem.sysId,
    x: getGuiX(wireItem) ?? 0,
    y: getGuiY(wireItem) ?? 0,
    width: wireItem.width ?? 0,
    height: wireItem.height ?? 0,
  };
}

// 커스텀 시설은 고정 종류가 없어 tableType 대신, 비어있던 tableName 필드에 유저가 입력한 이름을 실어 보낸다.
export function mapToPlacedCustomFacilityItem(item: TableGuiResponse): PlacedNonTableItem {
  const wireItem = item as TableGuiResponseWire;
  return {
    id: wireItem.sysId ?? `facility-custom-${Date.now()}`,
    kind: 'custom',
    label: wireItem.tableName ?? '기타 시설',
    sysId: wireItem.sysId,
    x: getGuiX(wireItem) ?? 0,
    y: getGuiY(wireItem) ?? 0,
    width: wireItem.width ?? 0,
    height: wireItem.height ?? 0,
  };
}

function mapToTableGuiItem(item: PlacedTableItem): TableGuiSaveItemWire {
  return {
    sysId: item.sysId,
    objectType: '01',
    tableName: item.tableName,
    tableNum: item.tableNum ? Number(item.tableNum) : undefined,
    tableQty: item.seatCount,
    xCoordinate: Math.round(item.x),
    yCoordinate: Math.round(item.y),
    width: Math.round(item.width),
    height: Math.round(item.height),
  };
}

function mapToNonTableGuiItem(item: PlacedNonTableItem): TableGuiSaveItemWire {
  if (item.kind === 'custom') {
    return {
      sysId: item.sysId,
      objectType: '03',
      tableName: item.label,
      xCoordinate: Math.round(item.x),
      yCoordinate: Math.round(item.y),
      width: Math.round(item.width),
      height: Math.round(item.height),
    };
  }
  return {
    sysId: item.sysId,
    objectType: '02',
    tableType: item.kind,
    // 응답을 다시 받을 때 tableName(common_nm)으로 종류를 매칭하므로, 저장 시에도 라벨을 실어 보낸다.
    tableName: FACILITY_LABEL_BY_KIND[item.kind],
    xCoordinate: Math.round(item.x),
    yCoordinate: Math.round(item.y),
    width: Math.round(item.width),
    height: Math.round(item.height),
  };
}

function isSamePlacement(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return (
    Math.round(a.x) === Math.round(b.x) &&
    Math.round(a.y) === Math.round(b.y) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}

// 테이블·내부시설을 같은 저장 버튼 한 번으로 함께 저장한다(내부시설만 따로 저장하는 액션은 없다).
// 내부시설은 sysId 없이 캔버스에 새로 배치되므로(백엔드가 저장 시 sys_id를 생성) newItems로 보내고,
// 저장 후 재조회(baseFacilityItems 갱신)로 실제 sys_id를 받아온다.
export function buildTableGuiRequest(
  draftTableItems: PlacedTableItem[],
  baseTableItems: PlacedTableItem[],
  draftFacilityItems: PlacedNonTableItem[],
  baseFacilityItems: PlacedNonTableItem[],
): TableGuiRequest {
  const baseTableBySysId = new Map(
    baseTableItems.filter((item) => item.sysId).map((item) => [item.sysId as string, item]),
  );
  const draftTableBySysId = new Map(
    draftTableItems.filter((item) => item.sysId).map((item) => [item.sysId as string, item]),
  );

  // newItems: 이번에 처음 캔버스에 배치된 테이블(기존 배치 정보 없음)
  // updateItems: 이미 배치되어 있던 테이블의 좌표/크기 변경
  // 백엔드 저장 동작은 동일하고 감사로그(insert/update) 구분에만 사용된다.
  const newTableItems = draftTableItems
    .filter((item) => item.sysId && !baseTableBySysId.has(item.sysId))
    .map(mapToTableGuiItem);
  const updateTableItems = draftTableItems
    .filter((item) => item.sysId && baseTableBySysId.has(item.sysId))
    .filter(
      (item) =>
        !isSamePlacement(item, baseTableBySysId.get(item.sysId as string) as PlacedTableItem),
    )
    .map(mapToTableGuiItem);
  const delTableItems = baseTableItems
    .filter((item) => item.sysId && !draftTableBySysId.has(item.sysId as string))
    .map(mapToTableGuiItem);

  const baseFacilityBySysId = new Map(
    baseFacilityItems.filter((item) => item.sysId).map((item) => [item.sysId as string, item]),
  );
  const draftFacilityBySysId = new Map(
    draftFacilityItems.filter((item) => item.sysId).map((item) => [item.sysId as string, item]),
  );

  const newFacilityItems = draftFacilityItems
    .filter((item) => !item.sysId || !baseFacilityBySysId.has(item.sysId))
    .map(mapToNonTableGuiItem);
  const updateFacilityItems = draftFacilityItems
    .filter((item) => item.sysId && baseFacilityBySysId.has(item.sysId))
    .filter(
      (item) =>
        !isSamePlacement(item, baseFacilityBySysId.get(item.sysId as string) as PlacedNonTableItem),
    )
    .map(mapToNonTableGuiItem);
  const delFacilityItems = baseFacilityItems
    .filter((item) => item.sysId && !draftFacilityBySysId.has(item.sysId as string))
    .map(mapToNonTableGuiItem);

  return {
    newItems: [...newTableItems, ...newFacilityItems],
    updateItems: [...updateTableItems, ...updateFacilityItems],
    delItems: [...delTableItems, ...delFacilityItems],
  };
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
