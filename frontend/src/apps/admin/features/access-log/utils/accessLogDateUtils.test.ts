import { describe, expect, it } from 'vitest';
import {
  ACCESS_LOG_MAX_RANGE_DAYS,
  createAccessLogSearchParams,
  createDefaultAccessLogDateRangeDraft,
  createDefaultAccessLogSearchParams,
  toAccessLogApiDatetime,
  validateAccessLogDateRange,
} from './accessLogDateUtils';

describe('accessLogDateUtils', () => {
  it('adds seconds when converting datetime-local values to api datetime', () => {
    expect(toAccessLogApiDatetime('2026-04-25T09:30')).toBe('2026-04-25 09:30:00');
    expect(toAccessLogApiDatetime('')).toBe('');
  });

  it('creates search params from draft values', () => {
    expect(createAccessLogSearchParams('2026-04-18T09:00', '2026-04-25T09:00', 'PC001')).toEqual({
      startDate: '2026-04-18 09:00:00',
      endDate: '2026-04-25 09:00:00',
      searchKeyword: 'PC001',
    });
  });

  it('creates a default date range draft and search params', () => {
    const draft = createDefaultAccessLogDateRangeDraft();
    const params = createDefaultAccessLogSearchParams();

    expect(draft.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(draft.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(params.startDate).toBe(`${draft.startDate.replace('T', ' ')}:00`);
    expect(params.endDate).toBe(`${draft.endDate.replace('T', ' ')}:00`);
    expect(params.searchKeyword).toBe('');
  });

  it('validates required dates, ordering, and max range days', () => {
    expect(validateAccessLogDateRange('', '2026-04-25T09:00')).toBe(
      '시작일시와 종료일시를 모두 입력해주세요.',
    );
    expect(validateAccessLogDateRange('2026-04-25T09:00', '2026-04-24T09:00')).toBe(
      '종료일시는 시작일시보다 이후여야 합니다.',
    );
    expect(validateAccessLogDateRange('2026-04-01T09:00', '2026-04-10T09:00')).toBe(
      `조회 기간은 최대 ${ACCESS_LOG_MAX_RANGE_DAYS}일까지 설정할 수 있습니다.`,
    );
    expect(validateAccessLogDateRange('2026-04-18T09:00', '2026-04-25T09:00')).toBe('');
  });
});
