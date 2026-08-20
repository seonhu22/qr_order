import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDismissedOrderIds } from './useDismissedOrderIds';

describe('useDismissedOrderIds', () => {
  it('서버 주문 ID를 중복 없이 페이지 메모리에 저장한다', () => {
    const { result, rerender } = renderHook(() => useDismissedOrderIds());

    act(() => {
      result.current.dismiss('order-1');
      result.current.dismiss('order-1');
    });
    rerender();

    expect(result.current.isDismissed('order-1')).toBe(true);
    expect([...result.current.dismissedIds]).toEqual(['order-1']);
  });

  it('hook을 재마운트하면 숨긴 ID가 초기화된다', () => {
    const first = renderHook(() => useDismissedOrderIds());
    act(() => first.result.current.dismiss('order-1'));
    expect(first.result.current.isDismissed('order-1')).toBe(true);
    first.unmount();

    const second = renderHook(() => useDismissedOrderIds());
    expect(second.result.current.isDismissed('order-1')).toBe(false);
  });
});
