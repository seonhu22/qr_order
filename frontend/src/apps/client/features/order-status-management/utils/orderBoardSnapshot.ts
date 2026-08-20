import type { OrderBoardRow } from '../types';

/** Polling query 객체와 참조를 공유하지 않는 모달 전용 주문 스냅샷을 만든다. */
export function cloneOrderBoardRow(row: OrderBoardRow): OrderBoardRow {
  return {
    ...row,
    menuItems: row.menuItems.map((menu) => ({
      ...menu,
      options: menu.options.map((option) => ({ ...option })),
    })),
  };
}
