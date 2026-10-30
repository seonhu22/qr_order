import { useMemo } from 'react';
import { useUnreadStaffCallsQuery } from '@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi';
import { useClientStaffCallNotifyStore } from '@/apps/client/stores/clientStaffCallNotifyStore';
import { useDismissedOrderIds } from './useDismissedOrderIds';
import type { StaffCallBoardRow } from '../types';

/**
 * 미확인 직원호출 API 응답을 주문현황 카드 모델로 변환한다.
 * "완료"는 개별 읽음 API가 없어 현재 화면에서만 숨긴다(ADR-036/037). 이 화면의 페이드아웃
 * 애니메이션은 로컬 전용 useDismissedOrderIds가 담당하고, 헤더 알림 배지/드롭다운과
 * 공유해야 하는 "완료됨" 표시는 clientStaffCallNotifyStore.dismissCall로 같이 기록한다.
 * 개별 읽음 API가 생기면 이 hook의 complete만 실제 API 호출로 교체한다.
 */
export function useStaffCallBoard() {
  const unreadQuery = useUnreadStaffCallsQuery(true);
  const { dismiss, isDismissed } = useDismissedOrderIds();
  const dismissCallGlobally = useClientStaffCallNotifyStore((state) => state.dismissCall);

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

  const complete = (id: string) => {
    dismiss(id);
    dismissCallGlobally(id);
  };

  return {
    rows: visibleRows,
    complete,
    isLoading: unreadQuery.isLoading,
    isError: unreadQuery.isError,
    refetch: unreadQuery.refetch,
  };
}
