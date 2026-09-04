import { describe, expect, it } from 'vitest';
import type { OrderBoardRow } from '../types';
import { toStatusRequest } from './orderStatusBoardApi';

describe('toStatusRequest', () => {
  it('백엔드 LocalDateTime 입력 계약에 맞춰 전체 주문일시를 전송한다', () => {
    const row: OrderBoardRow = {
      id: 'order-1',
      orderNo: '12',
      tableNum: '3',
      orderStatus: 'RECEIVED',
      paymentStatus: 'UNPAID',
      orderDatetime: '2026-08-24T13:27:45',
      menuItems: [],
    };

    expect(toStatusRequest(row).header?.orderDatetime).toBe('2026-08-24 13:27:45');
  });
});
