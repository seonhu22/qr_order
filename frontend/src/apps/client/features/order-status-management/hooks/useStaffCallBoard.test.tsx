import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStaffCallBoard } from './useStaffCallBoard';

const mutateAsync = vi.fn();

vi.mock('@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi', () => ({
  useUnreadStaffCallsQuery: () => ({
    data: [
      { masterSysId: 'MASTER-1', tableNum: 3, insertDatetime: '2026-09-18T12:00:00', items: [{ callNm: '물', quantity: 1 }] },
      { masterSysId: 'MASTER-2', tableNum: 4, insertDatetime: '2026-09-18T12:01:00', items: [{ callNm: '냅킨', quantity: 2 }] },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useMarkStaffCallReadMutation: () => ({ mutateAsync }),
}));

describe('useStaffCallBoard', () => {
  beforeEach(() => mutateAsync.mockReset());

  it('같은 카드의 완료 요청을 처리 중에는 중복 전송하지 않는다', async () => {
    mutateAsync.mockResolvedValue(undefined);
    const { result } = renderHook(() => useStaffCallBoard());

    await act(async () => {
      await Promise.all([
        result.current.complete('MASTER-1'),
        result.current.complete('MASTER-1'),
      ]);
    });
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(result.current.pendingIds.has('MASTER-1')).toBe(false);
  });

  it('실패 시 카드를 유지하고 오류를 표시하며 재시도할 때 오류를 지운다', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('완료 처리 실패')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useStaffCallBoard());

    await act(async () => { await result.current.complete('MASTER-1'); });
    expect(result.current.rows.map((row) => row.id)).toContain('MASTER-1');
    expect(result.current.errors.get('MASTER-1')).toBe('완료 처리 실패');

    await act(async () => { await result.current.complete('MASTER-1'); });
    expect(result.current.errors.has('MASTER-1')).toBe(false);
    expect(mutateAsync).toHaveBeenCalledTimes(2);
  });
});
