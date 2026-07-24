export type FacilityKind =
  | 'counter'
  | 'frontDoor'
  | 'backDoor'
  | 'kitchen'
  | 'restroom'
  | 'stairs'
  | 'elevator'
  | 'smokingRoom';

export type LayoutSize = 'small' | 'medium' | 'large';

export type PlacedTableItem = {
  id: string;
  kind: 'table';
  sysId?: string;
  tableNum: string;
  tableName: string;
  seatCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacedFacilityItem = {
  id: string;
  kind: FacilityKind;
  sysId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// 고정 8종 카탈로그에 없는, 사용자가 이름을 직접 입력해 만드는 시설(object_type '03').
export type PlacedCustomFacilityItem = {
  id: string;
  kind: 'custom';
  sysId?: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacedNonTableItem = PlacedFacilityItem | PlacedCustomFacilityItem;

export type PlacedItem = PlacedTableItem | PlacedNonTableItem;

export type DraggedItemData = { origin: 'placed'; id: string };
