import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreventLeaveStore } from './preventLeaveStore';

describe('preventLeaveStore', () => {
  beforeEach(() => {
    usePreventLeaveStore.setState({ isDirty: false, pendingLeaveAction: null });
  });

  it('starts with isDirty=false and no pending leave action', () => {
    const state = usePreventLeaveStore.getState();

    expect(state.isDirty).toBe(false);
    expect(state.pendingLeaveAction).toBeNull();
  });

  it('updates isDirty', () => {
    usePreventLeaveStore.getState().setDirty(true);
    expect(usePreventLeaveStore.getState().isDirty).toBe(true);
  });

  it('sets and clears a pending navigate action', () => {
    const action = { type: 'navigate' as const, to: '/admin/main' };

    usePreventLeaveStore.getState().setPendingLeaveAction(action);
    expect(usePreventLeaveStore.getState().pendingLeaveAction).toEqual(action);

    usePreventLeaveStore.getState().clearPendingLeaveAction();
    expect(usePreventLeaveStore.getState().pendingLeaveAction).toBeNull();
  });

  it('sets a pending custom action', () => {
    const onConfirm = vi.fn();
    const action = {
      type: 'custom' as const,
      description: '로그아웃하시겠습니까?',
      onConfirm,
    };

    usePreventLeaveStore.getState().setPendingLeaveAction(action);
    expect(usePreventLeaveStore.getState().pendingLeaveAction).toEqual(action);
  });
});
