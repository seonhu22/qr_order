import { describe, expect, it } from 'vitest';
import { areQueryParamsEqual } from './queryParams';

describe('areQueryParamsEqual', () => {
  it('returns true for two empty objects', () => {
    expect(areQueryParamsEqual({}, {})).toBe(true);
  });

  it('returns true when keys and values match', () => {
    expect(
      areQueryParamsEqual(
        { startDate: '2026-01-01', endDate: '2026-01-07', searchKeyword: 'a' },
        { startDate: '2026-01-01', endDate: '2026-01-07', searchKeyword: 'a' },
      ),
    ).toBe(true);
  });

  it('ignores key insertion order', () => {
    expect(
      areQueryParamsEqual(
        { startDate: '2026-01-01', searchKeyword: 'a' },
        { searchKeyword: 'a', startDate: '2026-01-01' },
      ),
    ).toBe(true);
  });

  it('returns false when any value differs', () => {
    expect(
      areQueryParamsEqual(
        { startDate: '2026-01-01', searchKeyword: 'a' },
        { startDate: '2026-01-01', searchKeyword: 'b' },
      ),
    ).toBe(false);
  });

  it('returns false when key counts differ', () => {
    expect(
      areQueryParamsEqual(
        { startDate: '2026-01-01' },
        { startDate: '2026-01-01', searchKeyword: '' },
      ),
    ).toBe(false);
  });

  it('treats undefined and null as distinct values', () => {
    expect(areQueryParamsEqual({ a: null }, { a: undefined })).toBe(false);
  });
});
