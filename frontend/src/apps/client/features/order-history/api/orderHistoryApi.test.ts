import { describe, expect, it } from 'vitest';
import { filterOrderHistoryMock } from './orderHistoryApi';

const WIDE_RANGE = {
  startDate: '2026-01-01 00:00:00',
  endDate: '2026-12-31 23:59:59',
};

describe('filterOrderHistoryMock', () => {
  it('returns all mock rows within the date range when orderStatus is not selected', async () => {
    const rows = await filterOrderHistoryMock({ ...WIDE_RANGE, searchKeyword: '', orderStatus: '' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => Boolean(row.orderStatus))).toBe(true);
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
    const rows = await filterOrderHistoryMock({
      ...WIDE_RANGE,
      searchKeyword: 'ORD-20260618',
      orderStatus: 'CANCELLED',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].orderNo).toBe('ORD-20260618-002');
  });

  it('excludes rows outside the date range even when orderStatus matches', async () => {
    // mock의 CANCELLED 건(2026-06-18, 2026-05-12)은 모두 이 범위(06-20~06-23) 밖에 있다.
    const rows = await filterOrderHistoryMock({
      startDate: '2026-06-20 00:00:00',
      endDate: '2026-06-23 23:59:59',
      searchKeyword: '',
      orderStatus: 'CANCELLED',
    });
    expect(rows).toHaveLength(0);
  });
});
