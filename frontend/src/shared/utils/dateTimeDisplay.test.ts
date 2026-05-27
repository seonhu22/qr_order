import { describe, expect, it } from 'vitest';
import { formatDateTimeForDisplay } from './dateTimeDisplay';

describe('formatDateTimeForDisplay', () => {
  it('replaces T with a blank space', () => {
    expect(formatDateTimeForDisplay('2026-04-29T10:17:00')).toBe('2026-04-29 10:17:00');
  });

  it('keeps already blank-separated datetime values', () => {
    expect(formatDateTimeForDisplay('2026-04-29 10:17:00')).toBe('2026-04-29 10:17:00');
  });

  it('removes milliseconds and trailing Z from ISO values', () => {
    expect(formatDateTimeForDisplay('2026-04-29T10:17:00.123Z')).toBe('2026-04-29 10:17:00');
  });

  it('returns an empty string for empty-like values', () => {
    expect(formatDateTimeForDisplay('')).toBe('');
    expect(formatDateTimeForDisplay('   ')).toBe('');
    expect(formatDateTimeForDisplay(undefined)).toBe('');
    expect(formatDateTimeForDisplay(null)).toBe('');
  });
});
