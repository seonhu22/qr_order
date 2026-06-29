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
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacedItem = PlacedTableItem | PlacedFacilityItem;

export type DraggedItemData =
  | { origin: 'facility-catalog'; kind: FacilityKind }
  | { origin: 'placed'; id: string };
