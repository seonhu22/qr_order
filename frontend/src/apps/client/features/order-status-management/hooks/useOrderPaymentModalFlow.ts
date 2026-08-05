/**
 * @fileoverview 결제 처리 모달 흐름 훅
 *
 * @description
 * - 1단계(결제완료/미결제/닫기 선택)
 *   - 결제완료 → 2-A단계: 같은 테이블의 결제 대상 주문을 합친 영수증 확인 → 확인 시 전체 일괄 결제완료 처리 → 완료 안내
 *   - 미결제 → 2-B단계: 클릭한 주문 1건에 대해서만 사유 입력 → 확인 시 즉시 처리(취소 흐름과 달리 별도 확인 단계 없음) → 완료 안내
 * - "기타" 선택 시에만 "상세입력"이 필수가 된다.
 */

import { useState } from 'react';
import { ORDER_UNPAID_REASON_OTHER_VALUE } from '../constants';
import type { OrderBoardRow } from '../types';
import { cloneOrderBoardRow } from '../utils/orderBoardSnapshot';

type UnpaidEditorErrors = {
  reason: boolean;
  description: boolean;
};

type UseOrderPaymentModalFlowParams = {
  onConfirmPaid: (ids: string[]) => void;
  onConfirmUnpaid: (id: string, reason: string, description: string) => void;
};

const INITIAL_ERRORS: UnpaidEditorErrors = { reason: false, description: false };

export function useOrderPaymentModalFlow({ onConfirmPaid, onConfirmUnpaid }: UseOrderPaymentModalFlowParams) {
  const [targetRow, setTargetRow] = useState<OrderBoardRow | null>(null);
  /** 결제완료 영수증에 합산할 같은 테이블의 결제 대상 주문 목록 (targetRow 포함) */
  const [tableOrders, setTableOrders] = useState<OrderBoardRow[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<UnpaidEditorErrors>(INITIAL_ERRORS);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPaidNoticeOpen, setIsPaidNoticeOpen] = useState(false);
  const [isUnpaidEditorOpen, setIsUnpaidEditorOpen] = useState(false);
  const [isUnpaidNoticeOpen, setIsUnpaidNoticeOpen] = useState(false);

  const isOtherReason = reason === ORDER_UNPAID_REASON_OTHER_VALUE;

  const resetForm = () => {
    setReason('');
    setDescription('');
    setErrors(INITIAL_ERRORS);
  };

  const resetAll = () => {
    setTargetRow(null);
    setTableOrders([]);
    resetForm();
  };

  const openPaymentModal = (row: OrderBoardRow, payableTableOrders: OrderBoardRow[]) => {
    setTargetRow(cloneOrderBoardRow(row));
    setTableOrders(payableTableOrders.map(cloneOrderBoardRow));
    resetForm();
    setIsChoiceOpen(true);
  };

  const closeChoice = () => {
    setIsChoiceOpen(false);
    resetAll();
  };

  const choosePaid = () => {
    setIsChoiceOpen(false);
    setIsReceiptOpen(true);
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    resetAll();
  };

  const confirmReceipt = () => {
    if (tableOrders.length === 0) return;
    onConfirmPaid(tableOrders.map((order) => order.id));
    setIsReceiptOpen(false);
    setTargetRow(null);
    setTableOrders([]);
    setIsPaidNoticeOpen(true);
  };

  const closePaidNotice = () => {
    setIsPaidNoticeOpen(false);
    resetAll();
  };

  const chooseUnpaid = () => {
    setIsChoiceOpen(false);
    setIsUnpaidEditorOpen(true);
  };

  const closeUnpaidEditor = () => {
    setIsUnpaidEditorOpen(false);
    resetAll();
  };

  const changeReason = (value: string) => {
    setReason(value);
    const stillNeedsDescription = value === ORDER_UNPAID_REASON_OTHER_VALUE;
    setErrors((prev) => ({ reason: false, description: stillNeedsDescription && prev.description }));
    if (!stillNeedsDescription) setDescription('');
  };

  const changeDescription = (value: string) => {
    setDescription(value);
    setErrors((prev) => ({ ...prev, description: false }));
  };

  const confirmUnpaid = () => {
    const nextErrors: UnpaidEditorErrors = {
      reason: !reason,
      description: isOtherReason && !description.trim(),
    };
    setErrors(nextErrors);
    if (nextErrors.reason || nextErrors.description) return;
    if (!targetRow) return;

    onConfirmUnpaid(targetRow.id, reason, isOtherReason ? description.trim() : '');
    setIsUnpaidEditorOpen(false);
    setIsUnpaidNoticeOpen(true);
  };

  const closeUnpaidNotice = () => {
    setIsUnpaidNoticeOpen(false);
    resetAll();
  };

  return {
    tableOrders,
    reason,
    description,
    errors,
    isOtherReason,
    isChoiceOpen,
    isReceiptOpen,
    isPaidNoticeOpen,
    isUnpaidEditorOpen,
    isUnpaidNoticeOpen,
    openPaymentModal,
    closeChoice,
    choosePaid,
    closeReceipt,
    confirmReceipt,
    closePaidNotice,
    chooseUnpaid,
    closeUnpaidEditor,
    changeReason,
    changeDescription,
    confirmUnpaid,
    closeUnpaidNotice,
  };
}
