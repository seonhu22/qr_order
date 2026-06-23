import type { OrderHistoryRow } from '../types';

/**
 * 백엔드 주문 이력 조회 API가 아직 화면 요구 필드(주문번호/결제상태)를 제공하지 않아
 * 임시로 사용하는 mock 데이터. 최근 ~60일 범위에 분산시켜 날짜 필터 동작을 확인할 수 있게 한다.
 */
export const ORDER_HISTORY_MOCK: OrderHistoryRow[] = [
  {
    id: 'order-001',
    orderNo: 'ORD-20260622-001',
    tableNum: '1',
    orderStatus: 'SERVED',
    paymentStatus: 'PAID',
    orderDatetime: '2026-06-22T12:05:00',
  },
  {
    id: 'order-002',
    orderNo: 'ORD-20260621-004',
    tableNum: '3',
    orderStatus: 'COOKING',
    paymentStatus: 'PAID',
    orderDatetime: '2026-06-21T19:32:00',
  },
  {
    id: 'order-003',
    orderNo: 'ORD-20260621-003',
    tableNum: '5',
    orderStatus: 'RECEIVED',
    paymentStatus: 'PENDING',
    orderDatetime: '2026-06-21T19:10:00',
  },
  {
    id: 'order-004',
    orderNo: 'ORD-20260618-002',
    tableNum: '2',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: '2026-06-18T13:45:00',
  },
  {
    id: 'order-005',
    orderNo: 'ORD-20260615-001',
    tableNum: '4',
    orderStatus: 'SERVED',
    paymentStatus: 'PAID',
    orderDatetime: '2026-06-15T18:20:00',
  },
  {
    id: 'order-006',
    orderNo: 'ORD-20260530-006',
    tableNum: '6',
    orderStatus: 'SERVED',
    paymentStatus: 'UNPAID',
    orderDatetime: '2026-05-30T11:50:00',
  },
  {
    id: 'order-007',
    orderNo: 'ORD-20260512-002',
    tableNum: '1',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: '2026-05-12T20:05:00',
  },
  {
    id: 'order-008',
    orderNo: 'ORD-20260428-003',
    tableNum: '7',
    orderStatus: 'SERVED',
    paymentStatus: 'PAID',
    orderDatetime: '2026-04-28T12:40:00',
  },
];
