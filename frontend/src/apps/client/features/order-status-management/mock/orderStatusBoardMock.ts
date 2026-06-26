import { buildOrderBoardDatetime } from '../utils';
import type { OrderBoardRow } from '../types';

/**
 * 백엔드 주문 상태 보드 API가 아직 없어 임시로 사용하는 mock 데이터.
 * "취소는 당일만 표시" 규칙을 검증할 수 있도록 어제 취소된 주문(order-020)을 포함한다.
 * "결제완료 제외" 규칙을 검증할 수 있도록 결제완료(PAID) 주문(order-015)을 포함한다.
 * 결제완료 영수증의 "같은 테이블 주문 묶음" 처리를 확인할 수 있도록 한 테이블에 서빙완료 주문이
 * 1건(4번 테이블/order-005), 2건(2번 테이블/order-003,023), 3건(5번 테이블/order-004,021,022)인
 * 케이스를 모두 포함한다. 결제완료 영수증에서 옵션 줄도 함께 보이는지 확인할 수 있도록 이 묶음
 * 케이스(order-004, order-003)에는 옵션이 있는 메뉴를 하나씩 섞어 넣었다.
 * 주문 총액은 저장된 합계 필드 없이 메뉴/옵션 단가(`unitPrice`)로 항상 계산한다(`calculateOrderTotal`).
 */
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function todayAt(hours: number, minutes: number): string {
  return buildOrderBoardDatetime(today, hours, minutes);
}

function yesterdayAt(hours: number, minutes: number): string {
  return buildOrderBoardDatetime(yesterday, hours, minutes);
}

export const ORDER_STATUS_BOARD_MOCK: OrderBoardRow[] = [
  // 접수
  {
    id: 'order-010',
    orderNo: '0010',
    tableNum: '5',
    orderStatus: 'RECEIVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 30),
    menuItems: [
      {
        id: 'order-010-menu-1',
        name: '쌀국수',
        quantity: 2,
        unitPrice: 11900,
        options: [
          { id: 'order-010-opt-1', name: '고수 추가', quantity: 1, unitPrice: 1000 },
          { id: 'order-010-opt-2', name: '곰배기', quantity: 1, unitPrice: 2000 },
        ],
      },
      { id: 'order-010-menu-2', name: '쌀국수반미세트', quantity: 1, unitPrice: 15900, options: [] },
    ],
  },
  {
    id: 'order-011',
    orderNo: '0011',
    tableNum: '6',
    orderStatus: 'RECEIVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 32),
    menuItems: [
      {
        id: 'order-011-menu-1',
        name: '분짜',
        quantity: 1,
        unitPrice: 12900,
        options: [{ id: 'order-011-opt-1', name: '땅콩 추가', quantity: 1, unitPrice: 500 }],
      },
      { id: 'order-011-menu-2', name: '베트남 커피', quantity: 2, unitPrice: 6000, options: [] },
    ],
  },
  // 조리중
  {
    id: 'order-009',
    orderNo: '0009',
    tableNum: '1',
    orderStatus: 'COOKING',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 15),
    menuItems: [
      {
        id: 'order-009-menu-1',
        name: '쌀국수',
        quantity: 2,
        unitPrice: 11900,
        options: [
          { id: 'order-009-opt-1', name: '고수 추가', quantity: 1, unitPrice: 1000 },
          { id: 'order-009-opt-2', name: '곰배기', quantity: 1, unitPrice: 2000 },
        ],
      },
      { id: 'order-009-menu-2', name: '쌀국수반미세트', quantity: 1, unitPrice: 15900, options: [] },
    ],
  },
  {
    id: 'order-008',
    orderNo: '0008',
    tableNum: '7',
    orderStatus: 'COOKING',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 18),
    menuItems: [{ id: 'order-008-menu-1', name: '분짜', quantity: 3, unitPrice: 12900, options: [] }],
  },
  {
    id: 'order-007',
    orderNo: '0007',
    tableNum: '3',
    orderStatus: 'COOKING',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 20),
    menuItems: [
      { id: 'order-007-menu-1', name: '베트남 커피', quantity: 2, unitPrice: 6000, options: [] },
      { id: 'order-007-menu-2', name: '월남쌈', quantity: 1, unitPrice: 9500, options: [] },
    ],
  },
  {
    id: 'order-006',
    orderNo: '0006',
    tableNum: '2',
    orderStatus: 'COOKING',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 22),
    menuItems: [{ id: 'order-006-menu-1', name: '쌀국수', quantity: 1, unitPrice: 11900, options: [] }],
  },
  // 서빙완료
  {
    id: 'order-004',
    orderNo: '0004',
    tableNum: '5',
    orderStatus: 'SERVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 5),
    menuItems: [
      {
        id: 'order-004-menu-1',
        name: '쌀국수',
        quantity: 1,
        unitPrice: 11900,
        options: [{ id: 'order-004-opt-1', name: '고수 추가', quantity: 1, unitPrice: 1000 }],
      },
      { id: 'order-004-menu-2', name: '베트남 커피', quantity: 1, unitPrice: 6000, options: [] },
    ],
  },
  {
    id: 'order-003',
    orderNo: '0003',
    tableNum: '2',
    orderStatus: 'SERVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 8),
    menuItems: [
      {
        id: 'order-003-menu-1',
        name: '분짜',
        quantity: 2,
        unitPrice: 12900,
        options: [{ id: 'order-003-opt-1', name: '땅콩 추가', quantity: 1, unitPrice: 500 }],
      },
      { id: 'order-003-menu-2', name: '월남쌈', quantity: 1, unitPrice: 9500, options: [] },
    ],
  },
  {
    id: 'order-015',
    orderNo: '0015',
    tableNum: '6',
    orderStatus: 'SERVED',
    paymentStatus: 'PAID',
    orderDatetime: todayAt(14, 10),
    menuItems: [{ id: 'order-015-menu-1', name: '쌀국수', quantity: 1, unitPrice: 11900, options: [] }],
  },
  {
    id: 'order-005',
    orderNo: '0005',
    tableNum: '4',
    orderStatus: 'SERVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 12),
    menuItems: [{ id: 'order-005-menu-1', name: '베트남 커피', quantity: 2, unitPrice: 6000, options: [] }],
  },
  // order-004와 같은 5번 테이블 — 결제완료 영수증이 같은 테이블의 주문 2건을 합쳐 보여주는지 확인하는 mock
  {
    id: 'order-021',
    orderNo: '0021',
    tableNum: '5',
    orderStatus: 'SERVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(16, 18),
    menuItems: [
      { id: 'order-021-menu-1', name: '반미', quantity: 1, unitPrice: 6900, options: [] },
      { id: 'order-021-menu-2', name: '콜라', quantity: 1, unitPrice: 2900, options: [] },
    ],
  },
  // order-004/order-021과 같은 5번 테이블 — 3건 묶음 케이스를 확인하는 mock
  {
    id: 'order-022',
    orderNo: '0022',
    tableNum: '5',
    orderStatus: 'SERVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(16, 25),
    menuItems: [{ id: 'order-022-menu-1', name: '월남쌈', quantity: 1, unitPrice: 9500, options: [] }],
  },
  // order-003과 같은 2번 테이블 — 2건 묶음 케이스를 확인하는 mock
  {
    id: 'order-023',
    orderNo: '0023',
    tableNum: '2',
    orderStatus: 'SERVED',
    paymentStatus: 'PENDING',
    orderDatetime: todayAt(14, 10),
    menuItems: [{ id: 'order-023-menu-1', name: '베트남 커피', quantity: 1, unitPrice: 6000, options: [] }],
  },
  // 취소
  {
    id: 'order-002',
    orderNo: '0002',
    tableNum: '3',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: todayAt(14, 0),
    cancelledAt: todayAt(14, 25),
    menuItems: [
      {
        id: 'order-002-menu-1',
        name: '쌀국수',
        quantity: 2,
        unitPrice: 11900,
        options: [
          { id: 'order-002-opt-1', name: '고수 추가', quantity: 1, unitPrice: 1000 },
          { id: 'order-002-opt-2', name: '곰배기', quantity: 1, unitPrice: 2000 },
        ],
      },
      { id: 'order-002-menu-2', name: '쌀국수반미세트', quantity: 1, unitPrice: 15900, options: [] },
    ],
  },
  {
    id: 'order-001',
    orderNo: '0001',
    tableNum: '7',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: todayAt(13, 55),
    cancelledAt: todayAt(14, 10),
    menuItems: [{ id: 'order-001-menu-1', name: '분짜', quantity: 1, unitPrice: 12900, options: [] }],
  },
  {
    id: 'order-018',
    orderNo: '0018',
    tableNum: '9',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: todayAt(14, 3),
    cancelledAt: todayAt(14, 20),
    menuItems: [{ id: 'order-018-menu-1', name: '베트남 커피', quantity: 1, unitPrice: 6000, options: [] }],
  },
  {
    id: 'order-019',
    orderNo: '0019',
    tableNum: '8',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: todayAt(13, 40),
    cancelledAt: todayAt(13, 50),
    menuItems: [{ id: 'order-019-menu-1', name: '월남쌈', quantity: 2, unitPrice: 9500, options: [] }],
  },
  {
    id: 'order-020',
    orderNo: '0020',
    tableNum: '4',
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    orderDatetime: yesterdayAt(19, 0),
    cancelledAt: yesterdayAt(19, 5),
    menuItems: [{ id: 'order-020-menu-1', name: '쌀국수', quantity: 1, unitPrice: 11900, options: [] }],
  },
];
