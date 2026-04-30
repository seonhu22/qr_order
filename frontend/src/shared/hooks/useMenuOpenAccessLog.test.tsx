import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuOpenAccessLog } from './useMenuOpenAccessLog';
import {
  useInsertMenuCloseAccessLog,
  useInsertMenuOpenAccessLog,
} from '@/generated/log-controller/log-controller';

const openMutateMock = vi.fn();
const closeMutateMock = vi.fn();

vi.mock('@/generated/log-controller/log-controller', () => ({
  useInsertMenuCloseAccessLog: vi.fn(),
  useInsertMenuOpenAccessLog: vi.fn(),
}));

const mockedUseInsertMenuOpenAccessLog = vi.mocked(useInsertMenuOpenAccessLog);
const mockedUseInsertMenuCloseAccessLog = vi.mocked(useInsertMenuCloseAccessLog);

describe('useMenuOpenAccessLog', () => {
  beforeEach(() => {
    openMutateMock.mockReset();
    closeMutateMock.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReturnValue({
      mutate: openMutateMock,
    } as never);
    mockedUseInsertMenuCloseAccessLog.mockReset();
    mockedUseInsertMenuCloseAccessLog.mockReturnValue({
      mutate: closeMutateMock,
    } as never);
  });

  it('calls menu open access log once with the given menuCd', async () => {
    const { rerender } = renderHook(({ menuCd }) => useMenuOpenAccessLog(menuCd), {
      initialProps: { menuCd: 'coupon' },
    });

    await waitFor(() => {
      expect(openMutateMock).toHaveBeenCalledTimes(1);
    });
    expect(openMutateMock).toHaveBeenCalledWith(
      { params: { menuCd: 'coupon' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );

    rerender({ menuCd: 'coupon' });

    expect(openMutateMock).toHaveBeenCalledTimes(1);
  });

  it('closes current menu before opening next menu when menuCd changes', async () => {
    openMutateMock.mockImplementation((_variables, options) => {
      options.onSuccess();
    });
    closeMutateMock.mockImplementation((_variables, options) => {
      options.onSettled();
    });

    const { rerender } = renderHook(({ menuCd }) => useMenuOpenAccessLog(menuCd), {
      initialProps: { menuCd: 'coupon' },
    });

    await waitFor(() => {
      expect(openMutateMock).toHaveBeenCalledTimes(1);
    });

    rerender({ menuCd: 'adminUser' });

    await waitFor(() => {
      expect(closeMutateMock).toHaveBeenCalledTimes(1);
      expect(openMutateMock).toHaveBeenCalledTimes(2);
    });
    expect(openMutateMock).toHaveBeenLastCalledWith(
      { params: { menuCd: 'adminUser' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('waits for an in-flight close before opening the next menu', async () => {
    let closeOptions: { onSettled: () => void } | undefined;

    openMutateMock.mockImplementation((_variables, options) => {
      options.onSuccess();
    });
    closeMutateMock.mockImplementation((_variables, options) => {
      closeOptions = options;
    });

    const { rerender } = renderHook(({ menuCd }) => useMenuOpenAccessLog(menuCd), {
      initialProps: { menuCd: 'coupon' as string | undefined },
    });

    await waitFor(() => {
      expect(openMutateMock).toHaveBeenCalledTimes(1);
    });

    rerender({ menuCd: undefined });

    await waitFor(() => {
      expect(closeMutateMock).toHaveBeenCalledTimes(1);
    });

    rerender({ menuCd: 'adminUser' });

    expect(openMutateMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      closeOptions?.onSettled();
    });

    await waitFor(() => {
      expect(openMutateMock).toHaveBeenCalledTimes(2);
    });
    expect(openMutateMock).toHaveBeenLastCalledWith(
      { params: { menuCd: 'adminUser' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('does not call menu open access log when menuCd is undefined', () => {
    const { result } = renderHook(() => useMenuOpenAccessLog(undefined));

    expect(openMutateMock).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it('marks current menu as ready after menu open access log succeeds', async () => {
    openMutateMock.mockImplementation((_variables, options) => {
      options.onSuccess();
    });

    const { result } = renderHook(() => useMenuOpenAccessLog('coupon'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.loggedMenuCd).toBe('coupon');
    expect(result.current.isPending).toBe(false);
  });

  it('closes current menu on unmount after open succeeds', async () => {
    openMutateMock.mockImplementation((_variables, options) => {
      options.onSuccess();
    });

    const { result, unmount } = renderHook(() => useMenuOpenAccessLog('coupon'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    unmount();

    expect(closeMutateMock).toHaveBeenCalledTimes(1);
    expect(closeMutateMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        onSettled: expect.any(Function),
      }),
    );
  });
});
