import { useMemo, useState } from 'react';
import { useDismissedOrderIds } from './useDismissedOrderIds';
import { STAFF_CALL_BOARD_MOCK } from '../mock/staffCallBoardMock';
import type { StaffCallBoardRow } from '../types';

/**
 * 직원호출 보드 컬럼 상태. 실시간 호출 API가 아직 없어 mock 배열을 그대로 보여준다.
 * "완료" 버튼은 서버 처리 없이 `useDismissedOrderIds`로 화면에서만 지운다 — 실제 완료 처리
 * 로직(API 연동)이 정해지면 이 부분을 교체한다.
 */
export function useStaffCallBoard() {
  const [rows] = useState<StaffCallBoardRow[]>(STAFF_CALL_BOARD_MOCK);
  const { dismiss, isDismissed } = useDismissedOrderIds();

  const visibleRows = useMemo(
    () =>
      rows
        .filter((row) => !isDismissed(row.id))
        .sort((a, b) => a.calledAt.localeCompare(b.calledAt)),
    [rows, isDismissed],
  );

  return {
    rows: visibleRows,
    complete: dismiss,
  };
}
