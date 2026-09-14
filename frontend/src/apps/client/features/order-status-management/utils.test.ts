import { describe, expect, it } from 'vitest';
import type { OrderBoardRow } from './types';
import {
  calculateOrderTotal,
  filterVisibleOrderBoardRows,
  formatOrderCancelReasonDisplay,
  groupOrderBoardRowsByStatus,
} from './utils';

function row(
  id: string,
  orderDatetime: string,
  statusChangedAt?: string,
): OrderBoardRow {
  return {
    id,
    orderNo: id,
    tableNum: '1',
    orderStatus: 'COOKING',
    paymentStatus: 'PENDING',
    orderDatetime,
    statusChangedAt,
    menuItems: [],
  };
}

describe('groupOrderBoardRowsByStatus', () => {
  it('기존 카드는 주문 시각순으로 두고 새로 이동한 카드는 섹션 맨 아래에 둔다', () => {
    const columns = groupOrderBoardRowsByStatus([
      row('newly-moved', '2026-08-05T10:00:00', '2026-08-05T12:00:00.000Z'),
      row('existing-late', '2026-08-05T11:00:00'),
      row('existing-early', '2026-08-05T09:00:00'),
    ]);

    expect(columns.find((column) => column.status === 'COOKING')?.rows.map((item) => item.id)).toEqual([
      'existing-early',
      'existing-late',
      'newly-moved',
    ]);
  });

  it('여러 카드가 이동하면 가장 최근에 이동한 카드가 가장 아래에 온다', () => {
    const columns = groupOrderBoardRowsByStatus([
      row('moved-second', '2026-08-05T09:00:00', '2026-08-05T12:01:00.000Z'),
      row('moved-first', '2026-08-05T11:00:00', '2026-08-05T12:00:00.000Z'),
    ]);

    expect(columns.find((column) => column.status === 'COOKING')?.rows.map((item) => item.id)).toEqual([
      'moved-first',
      'moved-second',
    ]);
  });
});

describe('formatOrderCancelReasonDisplay', () => {
  it('기타 유형은 직접 입력한 cancelReason을 함께 표시한다', () => {
    expect(formatOrderCancelReasonDisplay({
      cancelType: 'OTHER',
      cancelReason: '고객이 메뉴 변경을 요청함',
    })).toBe('기타 (고객이 메뉴 변경을 요청함)');
  });

  it('일반 유형은 코드에 해당하는 명칭만 표시한다', () => {
    expect(formatOrderCancelReasonDisplay({
      cancelType: 'CUSTOMER_REQUEST',
    })).toBe('고객 요청');
  });
});

describe('calculateOrderTotal', () => {
  it('서버가 계산한 totalPrice를 우선 사용한다', () => {
    expect(calculateOrderTotal({ totalPrice: 25000, menuItems: [] })).toBe(25000);
  });

  it('저장 전 주문 수정 draft는 메뉴 항목으로 계산한다', () => {
    expect(calculateOrderTotal({
      menuItems: [{
        id: 'menu-1',
        name: '쌀국수',
        quantity: 2,
        unitPrice: 10000,
        options: [{ id: 'option-1', name: '추가', quantity: 1, unitPrice: 1000 }],
      }],
    })).toBe(21000);
  });
});

describe('filterVisibleOrderBoardRows', () => {
  it('취소 시각의 날짜와 무관하게 백엔드가 조회한 취소 주문을 표시한다', () => {
    const cancelled = row('cancelled', 'CANCELLED', '2026-08-01T10:00:00');
    cancelled.paymentStatus = 'REFUNDED';
    cancelled.cancelledAt = '2026-08-01T10:10:00';

    expect(filterVisibleOrderBoardRows([cancelled])).toEqual([cancelled]);
  });

  it('결제 완료 주문은 화면에서 제외한다', () => {
    const paid = row('paid', 'SERVED', '2026-08-14T10:00:00');
    paid.paymentStatus = 'PAID';

    expect(filterVisibleOrderBoardRows([paid])).toEqual([]);
  });
});
