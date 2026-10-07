import { useMemo } from 'react';
import { useUnreadStaffCallsQuery } from '@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi';
import { useDismissedOrderIds } from './useDismissedOrderIds';
import type { StaffCallBoardRow } from '../types';

/**
 * 미확인 직원호출 API 응답을 주문현황 카드 모델로 변환한다.
 * "완료"는 개별 읽음 API가 없어 현재 화면에서만 숨긴다. 전체 DB 읽음 처리는 헤더 알림의
 * 기존 read-all 동작이 담당하며, 개별 처리 계약이 생기면 이 hook의 complete만 교체한다.
 */
export function useStaffCallBoard() {
  const unreadQuery = useUnreadStaffCallsQuery(true);
  const { dismiss, isDismissed } = useDismissedOrderIds();

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
        .filter((row) => !isDismissed(row.id))
        .sort((a, b) => a.calledAt.localeCompare(b.calledAt)),
    [unreadQuery.data, isDismissed],
  );

  return {
    rows: visibleRows,
    complete: dismiss,
    isLoading: unreadQuery.isLoading,
    isError: unreadQuery.isError,
    refetch: unreadQuery.refetch,
  };
}
