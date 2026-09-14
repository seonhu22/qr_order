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
  onConfirmPaid: (ids: string[], paymentType: string) => Promise<void> | void;
  onConfirmUnpaid: (id: string, reason: string, description: string) => Promise<void> | void;
};

const INITIAL_ERRORS: UnpaidEditorErrors = { reason: false, description: false };

export function useOrderPaymentModalFlow({ onConfirmPaid, onConfirmUnpaid }: UseOrderPaymentModalFlowParams) {
  const [targetRow, setTargetRow] = useState<OrderBoardRow | null>(null);
  /** 결제완료 영수증에 합산할 같은 테이블의 결제 대상 주문 목록 (targetRow 포함) */
  const [tableOrders, setTableOrders] = useState<OrderBoardRow[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentTypeError, setPaymentTypeError] = useState(false);
  const [errors, setErrors] = useState<UnpaidEditorErrors>(INITIAL_ERRORS);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPaidNoticeOpen, setIsPaidNoticeOpen] = useState(false);
  const [isUnpaidEditorOpen, setIsUnpaidEditorOpen] = useState(false);
  const [isUnpaidNoticeOpen, setIsUnpaidNoticeOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOtherReason = reason === ORDER_UNPAID_REASON_OTHER_VALUE;

  const resetForm = () => {
    setReason('');
    setDescription('');
    setPaymentType('');
    setPaymentTypeError(false);
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
    setSubmitError(null);
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
    if (isPending) return;
    setIsReceiptOpen(false);
    resetAll();
  };

  const changePaymentType = (value: string) => {
    setPaymentType(value);
    setPaymentTypeError(false);
  };

  const confirmReceipt = async () => {
    if (tableOrders.length === 0 || isPending) return;
    if (!paymentType) {
      setPaymentTypeError(true);
      return;
    }
    setIsPending(true);
    setSubmitError(null);
    try {
      await onConfirmPaid(tableOrders.map((order) => order.id), paymentType);
      setIsReceiptOpen(false);
      setTargetRow(null);
      setTableOrders([]);
      setIsPaidNoticeOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '결제완료 처리에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
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
    if (isPending) return;
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

  const confirmUnpaid = async () => {
    const nextErrors: UnpaidEditorErrors = {
      reason: !reason,
      description: isOtherReason && !description.trim(),
    };
    setErrors(nextErrors);
    if (nextErrors.reason || nextErrors.description) return;
    if (!targetRow || isPending) return;

    setIsPending(true);
    setSubmitError(null);
    try {
      await onConfirmUnpaid(targetRow.id, reason, isOtherReason ? description.trim() : '');
      setIsUnpaidEditorOpen(false);
      setIsUnpaidNoticeOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '미결제 처리에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const closeUnpaidNotice = () => {
    setIsUnpaidNoticeOpen(false);
    resetAll();
  };

  return {
    tableOrders,
    reason,
    description,
    paymentType,
    paymentTypeError,
    errors,
    isOtherReason,
    isChoiceOpen,
    isReceiptOpen,
    isPaidNoticeOpen,
    isUnpaidEditorOpen,
    isUnpaidNoticeOpen,
    isPending,
    submitError,
    openPaymentModal,
    closeChoice,
    choosePaid,
    closeReceipt,
    changePaymentType,
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
