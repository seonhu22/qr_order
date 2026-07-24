/**
 * @fileoverview 주문 상태 관리 보드 페이지 상태 훅
 *
 * @description
 * - 조리시작/서빙완료/이전 버튼은 모달 없이 즉시 상태값을 변경한다.
 * - 취소 버튼은 `useOrderCancelModalFlow`(취소사유 입력 → 취소 확인 → 완료 안내)를 거쳐 처리한다.
 * - 결제처리 버튼은 `useOrderPaymentModalFlow`(결제완료/미결제 선택 → 미결제는 사유 입력 → 완료 안내)를 거쳐 처리한다.
 * - 취소사유 버튼은 저장된 취소사유/상세사유를 읽기 전용으로 보여주는 모달을 연다(닫기 버튼만 있음).
 * - 취소 컬럼의 휴지통(삭제) 버튼은 곧바로 지우지 않고 `DeleteConfirmModal` 확인을 한 번 거친다(`dismissConfirm`).
 *   확인해야 로컬 state(`rows`)에서 제거되며, 실제 데이터는 바뀌지 않아 "초기화"를 누르면 다시 보인다.
 * - 수정 버튼은 `useOrderEditModalFlow`(같은 테이블 주문 전체를 draft로 모아 메뉴 추가/줄 취소 후 "확인"에서 한 번에 반영)를 거쳐 처리한다.
 * - 카드 데이터는 mock 기반이라 React Query 캐시를 직접 변경하지 않고, 조회 결과를 로컬 state로
 *   복사해 변경한다. "초기화" 클릭 시 이 로컬 state를 조회 결과로 되돌린다.
 * - 상태 변경 시 카드 위치는 그대로 두고(시간순 정렬 유지), 방금 변경된 카드만 잠깐 배경을 강조한다.
 *   주문 수정처럼 한 번에 여러 행(기존 주문 수정 + 메뉴 추가로 생긴 새 주문)이 바뀔 수 있어 `lastMovedIds`는 배열이다.
 * - 주문 수정/메뉴 추가/옵션 추가 중 하나라도 dirty면 `usePreventLeave`로 새로고침/탭 닫기를 경고한다.
 *   모달 내부 닫기(닫기 버튼/ESC/배경 클릭) 경고는 `useOrderEditModalFlow`가 각 단계별로 따로 처리한다.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import { useOrderStatusBoardQuery } from '../api/orderStatusBoardApi';
import { ORDER_BOARD_PREV_STATUS } from '../constants';
import { useOrderCancelModalFlow } from './useOrderCancelModalFlow';
import { useOrderPaymentModalFlow } from './useOrderPaymentModalFlow';
import { useOrderEditModalFlow } from './useOrderEditModalFlow';
import {
  filterVisibleOrderBoardRows,
  getEditableOrdersForTable,
  getPayableOrdersForTable,
  groupOrderBoardRowsByStatus,
  nowOrderBoardDatetime,
} from '../utils';
import type { OrderBoardRow } from '../types';

const MOVED_HIGHLIGHT_DURATION_MS = 1200;

export function useOrderStatusBoardPage() {
  const query = useOrderStatusBoardQuery();
  const [rows, setRows] = useState<OrderBoardRow[]>([]);
  // 조회 결과가 바뀌면(최초 로드) 렌더 중에 로컬 state를 동기화한다.
  // 이후의 행 변경(상태 변경 버튼)은 로컬 state에서만 일어나므로 query.data와 다시 어긋나지 않는다.
  const [syncedData, setSyncedData] = useState<OrderBoardRow[] | null>(null);
  if (query.data && query.data !== syncedData) {
    setSyncedData(query.data);
    setRows(query.data);
  }

  const columns = useMemo(
    () => groupOrderBoardRowsByStatus(filterVisibleOrderBoardRows(rows)),
    [rows],
  );

  const [lastMovedIds, setLastMovedIds] = useState<string[]>([]);
  const moveHighlightTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(moveHighlightTimeoutRef.current);
  }, []);

  /** 방금 상태가 바뀐 행(들)을 잠깐 강조한다. 주문 수정처럼 여러 행이 한 번에 바뀔 수 있어 배열로 받는다. */
  const flashMoved = (ids: string[]) => {
    setLastMovedIds(ids);
    window.clearTimeout(moveHighlightTimeoutRef.current);
    moveHighlightTimeoutRef.current = window.setTimeout(() => {
      setLastMovedIds((current) => (current === ids ? [] : current));
    }, MOVED_HIGHLIGHT_DURATION_MS);
  };

  const updateRow = (id: string, updater: (row: OrderBoardRow) => OrderBoardRow) => {
    setRows((prev) => prev.map((row) => (row.id === id ? updater(row) : row)));
    flashMoved([id]);
  };

  /** 결제완료 영수증처럼 여러 행을 한 번에 바꿀 때 쓴다. 행이 바로 필터링되어 사라지므로 강조 효과는 생략한다. */
  const updateRows = (ids: string[], updater: (row: OrderBoardRow) => OrderBoardRow) => {
    setRows((prev) => prev.map((row) => (ids.includes(row.id) ? updater(row) : row)));
  };

  const handleStartCooking = (id: string) =>
    updateRow(id, (row) => ({ ...row, orderStatus: 'COOKING' }));

  const handleServe = (id: string) =>
    updateRow(id, (row) => ({ ...row, orderStatus: 'SERVED' }));

  const handleMoveBack = (id: string) =>
    updateRow(id, (row) => {
      const prevStatus = ORDER_BOARD_PREV_STATUS[row.orderStatus];
      return prevStatus ? { ...row, orderStatus: prevStatus } : row;
    });

  /** 취소 컬럼 카드 삭제 확인 대상. 휴지통 버튼 클릭 시 바로 지우지 않고 확인 모달을 먼저 띄운다. */
  const [dismissTargetId, setDismissTargetId] = useState<string | null>(null);
  const closeDismissConfirm = () => setDismissTargetId(null);

  /** 취소 컬럼 카드를 로컬 state에서만 제거한다 — 실제 데이터는 그대로라 "초기화"를 누르면 다시 보인다. */
  const confirmDismiss = () => {
    if (!dismissTargetId) return;
    setRows((prev) => prev.filter((row) => row.id !== dismissTargetId));
    setDismissTargetId(null);
  };

  const executeCancel = (id: string, reason: string, description: string) =>
    updateRow(id, (row) => ({
      ...row,
      orderStatus: 'CANCELLED',
      cancelledAt: nowOrderBoardDatetime(),
      cancelReason: reason,
      cancelDescription: description,
    }));

  const cancelModal = useOrderCancelModalFlow({ onConfirmCancel: executeCancel });

  const executePaid = (ids: string[]) => updateRows(ids, (row) => ({ ...row, paymentStatus: 'PAID' }));

  const executeUnpaid = (id: string, reason: string, description: string) =>
    updateRow(id, (row) => ({
      ...row,
      paymentStatus: 'UNPAID',
      unpaidReason: reason,
      unpaidDescription: description,
    }));

  const paymentModal = useOrderPaymentModalFlow({
    onConfirmPaid: executePaid,
    onConfirmUnpaid: executeUnpaid,
  });

  const handleOpenPaymentModal = (row: OrderBoardRow) =>
    paymentModal.openPaymentModal(row, getPayableOrdersForTable(rows, row.tableNum));

  const executeEditCommit = (originalOrderIds: string[], finalizedOrders: OrderBoardRow[]) => {
    setRows((prev) => [
      ...prev.filter((row) => !originalOrderIds.includes(row.id)),
      ...finalizedOrders,
    ]);
    flashMoved(finalizedOrders.map((order) => order.id));
  };

  const editModal = useOrderEditModalFlow({ onConfirmEdit: executeEditCommit });
  usePreventLeave(editModal.isEditorDirty || editModal.isMenuPickerDirty || editModal.isOptionPickerDirty);

  const handleOpenEditModal = (row: OrderBoardRow) =>
    editModal.openEditModal(getEditableOrdersForTable(rows, row.tableNum));

  const [cancelReasonViewRow, setCancelReasonViewRow] = useState<OrderBoardRow | null>(null);
  const closeCancelReasonView = () => setCancelReasonViewRow(null);

  const handleReset = () => {
    if (query.data) setRows(query.data);
  };

  return {
    data: { columns, lastMovedIds },
    status: {
      isLoading: query.isLoading,
      isError: query.isError,
    },
    cancelModal,
    paymentModal,
    editModal,
    cancelReasonView: {
      row: cancelReasonViewRow,
      close: closeCancelReasonView,
    },
    dismissConfirm: {
      targetId: dismissTargetId,
      confirm: confirmDismiss,
      close: closeDismissConfirm,
    },
    actions: {
      handleReset,
      cardActions: {
        onStartCooking: handleStartCooking,
        onServe: handleServe,
        onPay: handleOpenPaymentModal,
        onMoveBack: handleMoveBack,
        onCancel: cancelModal.openCancelModal,
        onEdit: handleOpenEditModal,
        onShowCancelReason: setCancelReasonViewRow,
        onDismiss: setDismissTargetId,
      },
    },
  };
}
