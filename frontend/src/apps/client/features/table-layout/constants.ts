import type { FacilityKind } from './types';

export const FACILITY_CATALOG: { kind: FacilityKind; label: string; icon: string }[] = [
  { kind: 'counter', label: '카운터', icon: 'i-cashier' },
  { kind: 'frontDoor', label: '정문', icon: 'i-door' },
  { kind: 'backDoor', label: '후문', icon: 'i-door' },
  { kind: 'kitchen', label: '주방', icon: 'i-kitchen' },
  { kind: 'restroom', label: '화장실', icon: 'i-restroom' },
];
