import { describe, expect, it } from 'vitest';
import type { OrderBoardRow } from './types';
import { groupOrderBoardRowsByStatus } from './utils';

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
