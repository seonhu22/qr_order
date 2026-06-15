import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreventLeave } from './usePreventLeave';
import { usePreventLeaveStore } from '@/shared/stores/preventLeaveStore';

describe('usePreventLeave', () => {
  beforeEach(() => {
    usePreventLeaveStore.setState({ isDirty: false, pendingLeaveAction: null });
  });

  it('syncs isDirty to the store', () => {
    const { rerender } = renderHook(({ isDirty }) => usePreventLeave(isDirty), {
      initialProps: { isDirty: false },
    });

    expect(usePreventLeaveStore.getState().isDirty).toBe(false);

    rerender({ isDirty: true });
    expect(usePreventLeaveStore.getState().isDirty).toBe(true);

    rerender({ isDirty: false });
    expect(usePreventLeaveStore.getState().isDirty).toBe(false);
  });

  it('registers a beforeunload listener only while dirty', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { rerender, unmount } = renderHook(({ isDirty }) => usePreventLeave(isDirty), {
      initialProps: { isDirty: false },
    });

    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    rerender({ isDirty: true });
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    rerender({ isDirty: false });
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('prevents default on beforeunload when dirty', () => {
    renderHook(() => usePreventLeave(true));

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('resets isDirty to false on unmount', () => {
    const { unmount } = renderHook(() => usePreventLeave(true));

    expect(usePreventLeaveStore.getState().isDirty).toBe(true);

    unmount();

    expect(usePreventLeaveStore.getState().isDirty).toBe(false);
  });
});
