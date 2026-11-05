import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useConsumerStaffCallStore } from '@/apps/consumer/stores/consumerStaffCallStore';
import { StaffCallToast } from './StaffCallToast';

describe('StaffCallToast', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    act(() => useConsumerStaffCallStore.setState({ called: false, message: '' }));
  });

  it('모션 감소 환경에서 호출 상태가 해제되면 즉시 토스트를 제거한다', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    useConsumerStaffCallStore.setState({ called: true, message: '물 1개' });
    render(<StaffCallToast />);

    expect(screen.getByRole('status')).toHaveTextContent('물 1개');

    act(() => useConsumerStaffCallStore.setState({ called: false }));
    act(() => vi.advanceTimersByTime(0));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
