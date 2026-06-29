import type { FacilityKind, LayoutSize } from './types';

export const FACILITY_CATALOG: { kind: FacilityKind; label: string; icon: string }[] = [
  { kind: 'counter', label: '카운터', icon: 'i-cashier' },
  { kind: 'frontDoor', label: '정문', icon: 'i-door' },
  { kind: 'backDoor', label: '후문', icon: 'i-door' },
  { kind: 'kitchen', label: '주방', icon: 'i-kitchen' },
  { kind: 'restroom', label: '화장실', icon: 'i-restroom' },
  { kind: 'stairs', label: '계단', icon: 'i-stairs' },
  { kind: 'elevator', label: '엘리베이터', icon: 'i-elevator' },
  { kind: 'smokingRoom', label: '흡연실', icon: 'i-smoking' },
];

export const FACILITY_LABEL_BY_KIND: Record<FacilityKind, string> = Object.fromEntries(
  FACILITY_CATALOG.map((facility) => [facility.kind, facility.label]),
) as Record<FacilityKind, string>;

export const FACILITY_ICON_BY_KIND: Record<FacilityKind, string> = Object.fromEntries(
  FACILITY_CATALOG.map((facility) => [facility.kind, facility.icon]),
) as Record<FacilityKind, string>;

// CSS의 rem 크기(1rem = 16px 기준)와 맞춘 px 추정값. 실제 배치/클램프 계산과
// 신규 배치 시 초기 width/height(백엔드 저장용)에 사용한다.
export const TABLE_SIZE_PX: Record<LayoutSize, { width: number; height: number }> = {
  small: { width: 120, height: 112 },
  medium: { width: 136, height: 128 },
  large: { width: 152, height: 144 },
};

export const TABLE_LAYOUT_CANVAS_DROPPABLE_ID = 'table-layout-canvas';

// 내부시설은 캔버스에서 자유롭게 크기를 조절할 수 있다. 이 범위를 벗어나지 않도록 클램프한다.
export const FACILITY_RESIZE_LIMITS = {
  minWidth: 72,
  minHeight: 40,
  maxWidth: 280,
  maxHeight: 160,
};
