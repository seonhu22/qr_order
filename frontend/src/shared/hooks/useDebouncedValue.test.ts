import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('지정된 시간이 지난 뒤 마지막 값만 반영한다', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '아메' },
    });

    rerender({ value: '아메리카노' });
    expect(result.current).toBe('아메');

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('아메리카노');
  });
});
