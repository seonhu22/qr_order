import { describe, expect, it } from 'vitest';
import {
  MAX_QUERY_RANGE_DAYS,
  createDefaultQueryDateRangeDraft,
  createDefaultQueryDateRangeParams,
  createQueryDateRangeParams,
  toQueryDateTimeParam,
  validateQueryDateRange,
} from './queryDateRange';

describe('queryDateRange', () => {
  it('converts datetime-local values into query params', () => {
    expect(toQueryDateTimeParam('2026-04-28T10:30')).toBe('2026-04-28 10:30:00');
    expect(toQueryDateTimeParam('')).toBe('');
  });

  it('creates query params from draft values', () => {
    expect(createQueryDateRangeParams('2026-04-21T10:00', '2026-04-28T10:00', 'PC001')).toEqual({
      startDate: '2026-04-21 10:00:00',
      endDate: '2026-04-28 10:00:00',
      searchKeyword: 'PC001',
    });
  });

  it('creates default draft values and params', () => {
    const draft = createDefaultQueryDateRangeDraft();
    const params = createDefaultQueryDateRangeParams();

    expect(draft.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(draft.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(params.startDate).toBe(`${draft.startDate.replace('T', ' ')}:00`);
    expect(params.endDate).toBe(`${draft.endDate.replace('T', ' ')}:00`);
    expect(params.searchKeyword).toBe('');
  });

  it('validates required dates, ordering, and max range', () => {
    expect(validateQueryDateRange('', '2026-04-28T10:00')).toBe(
      '시작일시와 종료일시를 모두 입력해주세요.',
    );
    expect(validateQueryDateRange('2026-04-28T10:00', '2026-04-27T10:00')).toBe(
      '종료일시는 시작일시보다 이후여야 합니다.',
    );
    expect(validateQueryDateRange('2026-04-01T10:00', '2026-04-10T10:00')).toBe(
      `조회 기간은 최대 ${MAX_QUERY_RANGE_DAYS}일까지 설정할 수 있습니다.`,
    );
    expect(validateQueryDateRange('2026-04-21T10:00', '2026-04-28T10:00')).toBe('');
  });
});
