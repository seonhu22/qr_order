import type { OrderHistoryDetail, OrderHistoryMaster } from '../types';

export const ORDER_HISTORY_MASTER_ROWS: OrderHistoryMaster[] = [
  { id: 'order-1', orderNo: 'ORD-20260611-001', tableNumber: 1, orderedAt: '2026-06-11 10:12', totalAmount: 9700, status: '완료' },
  { id: 'order-2', orderNo: 'ORD-20260611-002', tableNumber: 2, orderedAt: '2026-06-11 10:28', totalAmount: 5200, status: '완료' },
  { id: 'order-3', orderNo: 'ORD-20260611-003', tableNumber: 3, orderedAt: '2026-06-11 11:05', totalAmount: 6500, status: '취소' },
];

export const ORDER_HISTORY_DETAIL_ROWS: OrderHistoryDetail[] = [
  { id: 'detail-1', orderId: 'order-1', menuName: '아메리카노', quantity: 1, optionSummary: 'L 사이즈', amount: 5200 },
  { id: 'detail-2', orderId: 'order-1', menuName: '카페라떼', quantity: 1, optionSummary: '기본', amount: 4500 },
  { id: 'detail-3', orderId: 'order-2', menuName: '카페라떼', quantity: 1, optionSummary: '기본', amount: 5200 },
  { id: 'detail-4', orderId: 'order-3', menuName: '치즈 케이크', quantity: 1, optionSummary: '포장', amount: 6500 },
];
