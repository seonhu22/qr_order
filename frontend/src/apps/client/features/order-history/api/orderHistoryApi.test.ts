import { describe, expect, it } from 'vitest';
import { filterOrderHistoryMock } from './orderHistoryApi';
import { ORDER_HISTORY_MOCK } from '../mock/orderHistoryMock';

// mock 날짜가 조회 시점 기준 상대값이라, 절대 날짜 대신 항상 전체를 포함하는/제외하는 범위를 사용한다.
const WIDE_RANGE = {
  startDate: '2000-01-01 00:00:00',
  endDate: '2999-12-31 23:59:59',
};
const NON_OVERLAPPING_RANGE = {
  startDate: '2000-01-01 00:00:00',
  endDate: '2000-01-02 00:00:00',
};

describe('filterOrderHistoryMock', () => {
  it('returns all mock rows within the date range when orderStatus is not selected', async () => {
    const rows = await filterOrderHistoryMock({ ...WIDE_RANGE, searchKeyword: '', orderStatus: '' });
    expect(rows).toHaveLength(ORDER_HISTORY_MOCK.length);
  });

  it('filters rows by orderStatus', async () => {
    const rows = await filterOrderHistoryMock({
      ...WIDE_RANGE,
      searchKeyword: '',
      orderStatus: 'COOKING',
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.orderStatus === 'COOKING')).toBe(true);
  });

  it('combines orderStatus filter with keyword search', async () => {
    const [target] = ORDER_HISTORY_MOCK.filter((row) => row.orderStatus === 'CANCELLED');
    const rows = await filterOrderHistoryMock({
      ...WIDE_RANGE,
      searchKeyword: target.orderNo,
      orderStatus: 'CANCELLED',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].orderNo).toBe(target.orderNo);
  });

  it('excludes rows outside the date range even when orderStatus matches', async () => {
    const rows = await filterOrderHistoryMock({
      ...NON_OVERLAPPING_RANGE,
      searchKeyword: '',
      orderStatus: 'CANCELLED',
    });
    expect(rows).toHaveLength(0);
  });
});
