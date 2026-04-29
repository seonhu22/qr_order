import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuOpenAccessLog } from './useMenuOpenAccessLog';
import { useInsertMenuOpenAccessLog } from '@/generated/log-controller/log-controller';

const mutateMock = vi.fn();

vi.mock('@/generated/log-controller/log-controller', () => ({
  useInsertMenuOpenAccessLog: vi.fn(),
}));

const mockedUseInsertMenuOpenAccessLog = vi.mocked(useInsertMenuOpenAccessLog);

describe('useMenuOpenAccessLog', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReturnValue({
      mutate: mutateMock,
    } as never);
  });

  it('calls menu open access log once with the given menuCd', () => {
    const { rerender } = renderHook(({ menuCd }) => useMenuOpenAccessLog(menuCd), {
      initialProps: { menuCd: 'coupon' },
    });

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith(
      { params: { menuCd: 'coupon' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );

    rerender({ menuCd: 'coupon' });

    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it('calls menu open access log again when menuCd changes', () => {
    const { rerender } = renderHook(({ menuCd }) => useMenuOpenAccessLog(menuCd), {
      initialProps: { menuCd: 'coupon' },
    });

    rerender({ menuCd: 'adminUser' });

    expect(mutateMock).toHaveBeenCalledTimes(2);
    expect(mutateMock).toHaveBeenLastCalledWith(
      { params: { menuCd: 'adminUser' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('does not call menu open access log when menuCd is undefined', () => {
    const { result } = renderHook(() => useMenuOpenAccessLog(undefined));

    expect(mutateMock).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it('marks current menu as ready after menu open access log succeeds', async () => {
    mutateMock.mockImplementation((_variables, options) => {
      options.onSuccess();
    });

    const { result } = renderHook(() => useMenuOpenAccessLog('coupon'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.loggedMenuCd).toBe('coupon');
    expect(result.current.isPending).toBe(false);
  });
});
