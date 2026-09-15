import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResultModalFlow } from './useResultModalFlow';

describe('useResultModalFlow', () => {
  it('opens and closes a result modal', () => {
    const { result } = renderHook(() => useResultModalFlow());

    act(() => {
      result.current.showSuccess({ title: '완료', description: '저장되었습니다.' });
    });

    expect(result.current.modalProps).toMatchObject({
      open: true,
      title: '완료',
      description: '저장되었습니다.',
    });

    act(() => {
      result.current.modalProps.onConfirm();
    });

    expect(result.current.modalProps.open).toBe(false);
  });

  it('runs a custom confirm handler when provided', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useResultModalFlow());

    act(() => {
      result.current.showConfirm({ description: '계속할까요?', onConfirm });
    });

    act(() => {
      result.current.modalProps.onConfirm();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
