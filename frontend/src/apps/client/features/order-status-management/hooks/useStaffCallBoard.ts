import { useCallback, useMemo, useRef, useState } from 'react';
import {
  useMarkStaffCallReadMutation,
  useUnreadStaffCallsQuery,
} from '@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi';
import type { StaffCallBoardRow } from '../types';

/**
 * 미확인 직원호출 API 응답을 주문현황 카드 모델로 변환한다.
 * 카드 완료는 개별 읽음 API 성공 뒤 공유 미확인 query cache를 갱신한다.
 */
export function useStaffCallBoard() {
  const unreadQuery = useUnreadStaffCallsQuery(true);
  const markReadMutation = useMarkStaffCallReadMutation();
  const pendingIdsRef = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Map<string, string>>(() => new Map());

  const visibleRows = useMemo(
    () =>
      (unreadQuery.data ?? [])
        .map<StaffCallBoardRow>((notification) => ({
          id: notification.masterSysId,
          tableNum: String(notification.tableNum),
          calledAt: notification.insertDatetime,
          items: notification.items.map((item) => ({
            name: item.callNm,
            qty: item.quantity > 1 ? item.quantity : undefined,
          })),
        }))
        .sort((a, b) => a.calledAt.localeCompare(b.calledAt)),
    [unreadQuery.data],
  );

  const complete = useCallback(async (id: string) => {
    if (pendingIdsRef.current.has(id)) return;

    pendingIdsRef.current.add(id);
    setPendingIds((current) => new Set(current).add(id));
    setErrors((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });

    try {
      await markReadMutation.mutateAsync(id);
    } catch (error) {
      setErrors((current) => new Map(current).set(
        id,
        error instanceof Error ? error.message : '직원호출을 완료하지 못했습니다.',
      ));
    } finally {
      pendingIdsRef.current.delete(id);
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, [markReadMutation]);

  return {
    rows: visibleRows,
    complete,
    pendingIds,
    errors,
    isLoading: unreadQuery.isLoading,
    isError: unreadQuery.isError,
    refetch: unreadQuery.refetch,
  };
}
