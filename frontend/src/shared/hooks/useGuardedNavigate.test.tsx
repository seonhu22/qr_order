import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGuardedNavigate } from './useGuardedNavigate';
import { usePreventLeaveStore } from '@/shared/stores/preventLeaveStore';

function renderGuardedNavigate() {
  return renderHook(
    () => {
      const guarded = useGuardedNavigate();
      const location = useLocation();
      return { ...guarded, pathname: location.pathname };
    },
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/admin/start']}>{children}</MemoryRouter>
      ),
    },
  );
}

describe('useGuardedNavigate', () => {
  beforeEach(() => {
    usePreventLeaveStore.setState({ isDirty: false, pendingLeaveAction: null });
  });

  it('navigates immediately and runs onNavigate when not dirty', () => {
    const onNavigate = vi.fn();
    const { result } = renderGuardedNavigate();

    act(() => {
      result.current.guardedNavigate('/admin/next', undefined, onNavigate);
    });

    expect(result.current.pathname).toBe('/admin/next');
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(result.current.pendingLeaveAction).toBeNull();
  });

  it('defers navigation behind a pending action when dirty', () => {
    const onNavigate = vi.fn();
    const { result } = renderGuardedNavigate();

    act(() => {
      usePreventLeaveStore.getState().setDirty(true);
    });

    act(() => {
      result.current.guardedNavigate('/admin/next', undefined, onNavigate);
    });

    expect(result.current.pathname).toBe('/admin/start');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(result.current.pendingLeaveAction).toEqual({
      type: 'navigate',
      to: '/admin/next',
      options: undefined,
      onNavigate,
    });
  });

  it('navigates and clears dirty when the pending navigate action is confirmed', async () => {
    const onNavigate = vi.fn();
    const { result } = renderGuardedNavigate();

    act(() => {
      usePreventLeaveStore.getState().setDirty(true);
    });
    act(() => {
      result.current.guardedNavigate('/admin/next', undefined, onNavigate);
    });

    await act(async () => {
      await result.current.confirmPendingLeaveAction();
    });

    expect(result.current.pathname).toBe('/admin/next');
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(result.current.pendingLeaveAction).toBeNull();
    expect(usePreventLeaveStore.getState().isDirty).toBe(false);
  });

  it('cancels the pending navigate action without navigating', () => {
    const onNavigate = vi.fn();
    const { result } = renderGuardedNavigate();

    act(() => {
      usePreventLeaveStore.getState().setDirty(true);
    });
    act(() => {
      result.current.guardedNavigate('/admin/next', undefined, onNavigate);
    });

    act(() => {
      result.current.cancelPendingLeaveAction();
    });

    expect(result.current.pathname).toBe('/admin/start');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(result.current.pendingLeaveAction).toBeNull();
    expect(usePreventLeaveStore.getState().isDirty).toBe(true);
  });

  it('runs a custom action immediately when not dirty', () => {
    const onConfirm = vi.fn();
    const { result } = renderGuardedNavigate();

    act(() => {
      result.current.requestLeaveConfirm({
        type: 'custom',
        description: '로그아웃하시겠습니까?',
        onConfirm,
      });
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.pendingLeaveAction).toBeNull();
  });

  it('defers a custom action behind confirmation when dirty', async () => {
    const onConfirm = vi.fn();
    const { result } = renderGuardedNavigate();

    act(() => {
      usePreventLeaveStore.getState().setDirty(true);
    });
    act(() => {
      result.current.requestLeaveConfirm({
        type: 'custom',
        description: '로그아웃하시겠습니까?',
        onConfirm,
      });
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(result.current.pendingLeaveAction?.type).toBe('custom');

    await act(async () => {
      await result.current.confirmPendingLeaveAction();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.pendingLeaveAction).toBeNull();
  });
});
