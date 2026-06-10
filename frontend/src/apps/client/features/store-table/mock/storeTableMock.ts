import type { StoreQRCode, StoreTableInfo } from '../types';

export const STORE_TABLE_INFO_MOCK_ROWS: StoreTableInfo[] = [
  { id: 'table-1', tableNumber: 1, tableName: '홀 중앙 4인석', seatCount: 4, useYn: 'Y' },
  { id: 'table-2', tableNumber: 2, tableName: '창가 2인석', seatCount: 2, useYn: 'Y' },
  { id: 'table-3', tableNumber: 3, tableName: '룸 A 6인석', seatCount: 6, useYn: 'Y' },
  { id: 'table-4', tableNumber: 4, tableName: '테라스 2인석', seatCount: 2, useYn: 'N' },
];

export const STORE_QR_CODE_MOCK_ROWS: StoreQRCode[] = [
  {
    id: 'qr-1',
    qrCode: 'QR-001',
    tableNumber: 1,
    description: '홀 중앙 QR',
    url: 'https://qr-order.local/store/1/table/1',
    useYn: 'Y',
  },
  {
    id: 'qr-2',
    qrCode: 'QR-002',
    tableNumber: 2,
    description: '창가 2인석 QR',
    url: 'https://qr-order.local/store/1/table/window',
    useYn: 'Y',
  },
  {
    id: 'qr-3',
    qrCode: 'QR-003',
    tableNumber: 3,
    description: '룸 A QR',
    url: 'https://qr-order.local/store/1/table/room-a',
    useYn: 'N',
  },
];
