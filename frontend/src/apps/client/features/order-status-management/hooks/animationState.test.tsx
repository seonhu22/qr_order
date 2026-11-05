import { act, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDelayedPending } from './useDelayedPending';
import { useExitAnimatedRows } from './useExitAnimatedRows';
import { useFadeOutExit } from './useFadeOutExit';

function FadeOutHarness({ isLeaving }: { isLeaving: boolean }) {
  const ref = useFadeOutExit(isLeaving, vi.fn());
  return <article ref={ref} />;
}

describe('주문현황 애니메이션 상태', () => {
  afterEach(() => vi.useRealTimers());

  it('짧은 요청은 숨기고 표시된 로딩은 최소 시간 동안 유지한다', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ pending }) => useDelayedPending(pending),
      { initialProps: { pending: false } },
    );

    rerender({ pending: true });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(true);

    rerender({ pending: false });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('서버 목록에서 제거된 행을 퇴장 완료 전까지 유지한다', () => {
    vi.useFakeTimers();
    const row = { id: 'ORDER-1' };
    const { result, rerender } = renderHook(
      ({ rows }) => useExitAnimatedRows(rows),
      { initialProps: { rows: [row] } },
    );

    rerender({ rows: [] });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.renderedRows).toEqual([{ row, isLeaving: true }]);

    act(() => result.current.handleExited(row.id));
    expect(result.current.renderedRows).toEqual([]);
  });

  it('지연 시간 전에 끝난 요청은 로딩을 표시하지 않는다', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ pending }) => useDelayedPending(pending),
      { initialProps: { pending: false } },
    );

    rerender({ pending: true });
    act(() => vi.advanceTimersByTime(299));
    rerender({ pending: false });
    act(() => vi.runAllTimers());

    expect(result.current).toBe(false);
  });

  it('퇴장 중인 행이 복원되면 진행 중인 페이드아웃을 취소한다', () => {
    const cancel = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: vi.fn(() => []),
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: vi.fn(() => ({
        cancel,
        finished: new Promise<void>(() => undefined),
      } as unknown as Animation)),
    });

    const { rerender } = render(<FadeOutHarness isLeaving />);
    rerender(<FadeOutHarness isLeaving={false} />);

    expect(cancel).toHaveBeenCalledOnce();
    delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });
});
