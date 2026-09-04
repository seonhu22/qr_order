/**
 * @fileoverview 주문 상태 관리 보드 페이지 상태 훅
 *
 * @description
 * - 조리시작/서빙완료/이전 버튼은 generated API 성공과 서버 재조회 뒤 상태를 반영한다.
 * - 취소 버튼은 `useOrderCancelModalFlow`(취소사유 입력 → 취소 확인 → 완료 안내)를 거쳐 처리한다.
 * - 결제처리 버튼은 `useOrderPaymentModalFlow`(결제완료/미결제 선택 → 미결제는 사유 입력 → 완료 안내)를 거쳐 처리한다.
 * - 취소사유 버튼은 저장된 취소사유/상세사유를 읽기 전용으로 보여주는 모달을 연다(닫기 버튼만 있음).
 * - 취소 컬럼의 휴지통(삭제) 버튼은 곧바로 지우지 않고 `DeleteConfirmModal` 확인을 한 번 거친다(`dismissConfirm`).
 *   확인하면 페이지 메모리의 ID 필터에서만 숨기며 서버와 query cache는 변경하지 않는다.
 * - 수정 버튼은 `useOrderEditModalFlow`(같은 테이블 주문 전체를 draft로 모아 메뉴 추가/줄 취소 후 "확인"에서 한 번에 반영)를 거쳐 처리한다.
 * - 카드 데이터는 React Query의 서버 상태에서 직접 파생하며 writable 로컬 복사본을 만들지 않는다.
 * - 상태 변경 시 카드 위치는 그대로 두고(시간순 정렬 유지), 방금 변경된 카드만 잠깐 배경을 강조한다.
 *   주문 수정처럼 한 번에 여러 행(기존 주문 수정 + 메뉴 추가로 생긴 새 주문)이 바뀔 수 있어 `lastMovedIds`는 배열이다.
 * - 주문 수정/메뉴 추가/옵션 추가 중 하나라도 dirty면 `usePreventLeave`로 새로고침/탭 닫기를 경고한다.
 *   모달 내부 닫기(닫기 버튼/ESC/배경 클릭) 경고는 `useOrderEditModalFlow`가 각 단계별로 따로 처리한다.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import {
  useOrderCancelReasonQuery,
  useOrderPaymentMutations,
  useOrderStatusBoardMutations,
  useOrderStatusBoardQuery,
} from '../api/orderStatusBoardApi';
import { ORDER_BOARD_PREV_STATUS } from '../constants';
import { useOrderCancelModalFlow } from './useOrderCancelModalFlow';
import { useOrderPaymentModalFlow } from './useOrderPaymentModalFlow';
import { useOrderEditModalFlow } from './useOrderEditModalFlow';
import { useDismissedOrderIds } from './useDismissedOrderIds';
import {
  filterVisibleOrderBoardRows,
  getEditableOrdersForTable,
  getPayableOrdersForTable,
  groupOrderBoardRowsByStatus,
} from '../utils';
import type { OrderBoardRow } from '../types';
import { cloneOrderBoardRow } from '../utils/orderBoardSnapshot';

const MOVED_HIGHLIGHT_DURATION_MS = 1200;
const EMPTY_ROWS: OrderBoardRow[] = [];

export function useOrderStatusBoardPage() {
  const query = useOrderStatusBoardQuery();
  const mutations = useOrderStatusBoardMutations();
  const rows = query.data ?? EMPTY_ROWS;
  const { dismiss: dismissOrder, isDismissed } = useDismissedOrderIds();
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<string>>(() => new Set());
  const [mutationErrors, setMutationErrors] = useState<Map<string, string>>(() => new Map());

  const columns = useMemo(
    () => groupOrderBoardRowsByStatus(
      filterVisibleOrderBoardRows(rows).filter((row) => !isDismissed(row.id)),
    ),
    [isDismissed, rows],
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

  const runStatusMutation = async (
    id: string,
    action: 'START_COOKING' | 'SERVE' | 'BACK_TO_RECEIVED' | 'BACK_TO_COOKING' | 'CANCEL',
    cancelInput?: { reason: string; description: string },
  ) => {
    const row = rows.find((item) => item.id === id);
    if (!row || pendingOrderIds.has(id)) return;

    setMutationErrors((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
    setPendingOrderIds((current) => new Set(current).add(id));
    try {
      await mutations.mutate(action, row, cancelInput);
      flashMoved([id]);
    } catch (error) {
      setMutationErrors((current) => new Map(current).set(
        id,
        error instanceof Error ? error.message : '주문 상태를 변경하지 못했습니다.',
      ));
      throw error;
    } finally {
      setPendingOrderIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const runCardStatusMutation = async (
    id: string,
    action: 'START_COOKING' | 'SERVE' | 'BACK_TO_RECEIVED' | 'BACK_TO_COOKING',
  ) => {
    try {
      await runStatusMutation(id, action);
    } catch {
      // U3에서 카드 가까이에 mutationError를 표시한다. 이벤트 Promise는 여기서 소비한다.
    }
  };

  const handleStartCooking = (id: string) => runCardStatusMutation(id, 'START_COOKING');
  const handleServe = (id: string) => runCardStatusMutation(id, 'SERVE');
  const handleMoveBack = (id: string) => {
    const row = rows.find((item) => item.id === id);
    const prevStatus = row ? ORDER_BOARD_PREV_STATUS[row.orderStatus] : undefined;
    if (prevStatus === 'RECEIVED') return runCardStatusMutation(id, 'BACK_TO_RECEIVED');
    if (prevStatus === 'COOKING') return runCardStatusMutation(id, 'BACK_TO_COOKING');
    return Promise.resolve();
  };

  /** 취소 컬럼 카드 삭제 확인 대상. 휴지통 버튼 클릭 시 바로 지우지 않고 확인 모달을 먼저 띄운다. */
  const [dismissTargetId, setDismissTargetId] = useState<string | null>(null);
  const closeDismissConfirm = () => setDismissTargetId(null);

  /** query cache와 서버 데이터는 건드리지 않고 현재 페이지 메모리에서만 숨긴다. */
  const confirmDismiss = () => {
    if (!dismissTargetId) return;
    dismissOrder(dismissTargetId);
    setDismissTargetId(null);
  };

  const executeCancel = (id: string, reason: string, description: string) =>
    runStatusMutation(id, 'CANCEL', { reason, description });

  const cancelModal = useOrderCancelModalFlow({ onConfirmCancel: executeCancel });

  const paymentMutations = useOrderPaymentMutations();
  const executePaid = (ids: string[], paymentType: string) => {
    const orderGroupId = ids[0];
    if (!orderGroupId) return Promise.resolve();
    return paymentMutations.completePaid(orderGroupId, paymentType);
  };
  const executeUnpaid = (id: string, reason: string, description: string) =>
    paymentMutations.completeUnpaid(id, reason, description);

  const paymentModal = useOrderPaymentModalFlow({
    onConfirmPaid: executePaid,
    onConfirmUnpaid: executeUnpaid,
  });

  const handleOpenPaymentModal = (row: OrderBoardRow) =>
    paymentModal.openPaymentModal(row, getPayableOrdersForTable(rows, row.tableNum));

  // TODO(order-edit-api): 주문 수정 API 계약 연결 전에는 query data를 로컬에서 성공 처리하지 않는다.
  const executeEditCommit = (_originalOrderIds: string[], _finalizedOrders: OrderBoardRow[]) => undefined;

  const editModal = useOrderEditModalFlow({ onConfirmEdit: executeEditCommit });
  usePreventLeave(editModal.isEditorDirty || editModal.isMenuPickerDirty || editModal.isOptionPickerDirty);

  const handleOpenEditModal = (row: OrderBoardRow) =>
    editModal.openEditModal(getEditableOrdersForTable(rows, row.tableNum));

  const [cancelReasonViewRow, setCancelReasonViewRow] = useState<OrderBoardRow | null>(null);
  const cancelReasonQuery = useOrderCancelReasonQuery(cancelReasonViewRow?.id);
  const openCancelReasonView = (row: OrderBoardRow) => setCancelReasonViewRow(cloneOrderBoardRow(row));
  const closeCancelReasonView = () => setCancelReasonViewRow(null);
  const cancelReasonSnapshot = cancelReasonViewRow
    ? {
        ...cancelReasonViewRow,
        ...(cancelReasonQuery.data
          ? {
              cancelType: cancelReasonQuery.data.cancelType,
              cancelReason: cancelReasonQuery.data.cancelReason,
              cancelDescription: cancelReasonQuery.data.cancelDescription,
              cancelledAt: cancelReasonQuery.data.cancelDatetime
                ? cancelReasonQuery.data.cancelDatetime.replace(' ', 'T')
                : cancelReasonViewRow.cancelledAt,
            }
          : {}),
      }
    : null;

  const handleRefresh = () => {
    if (!query.isFetching) void query.refetch();
  };

  // 빈 배열도 한 번 정상 동기화된 유효한 서버 데이터다.
  const hasData = query.data !== undefined;
  const isInitialError = query.isError && !hasData;
  const isSyncError = query.isRefetchError && hasData;

  return {
    data: { columns, lastMovedIds, pendingOrderIds, mutationErrors },
    status: {
      isLoading: query.isLoading,
      isInitialError,
      isSyncError,
      isRefreshing: query.isFetching && hasData,
    },
    cancelModal,
    paymentModal,
    editModal,
    cancelReasonView: {
      row: cancelReasonSnapshot,
      isLoading: cancelReasonQuery.isLoading,
      isError: cancelReasonQuery.isError,
      close: closeCancelReasonView,
    },
    dismissConfirm: {
      targetId: dismissTargetId,
      confirm: confirmDismiss,
      close: closeDismissConfirm,
    },
    actions: {
      handleRefresh,
      cardActions: {
        onStartCooking: handleStartCooking,
        onServe: handleServe,
        onPay: handleOpenPaymentModal,
        onMoveBack: handleMoveBack,
        onCancel: cancelModal.openCancelModal,
        onEdit: handleOpenEditModal,
        onShowCancelReason: openCancelReasonView,
        onDismiss: setDismissTargetId,
      },
    },
  };
}
