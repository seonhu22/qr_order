/**
 * @fileoverview 주문 취소 처리 모달 흐름 훅
 *
 * @description
 * - 1단계(취소사유 입력) → 2단계(취소 확인) → 3단계(취소 완료 안내) 순서로 진행한다.
 * - 2단계에서 "닫기"를 누르면 2단계만 닫히고 1단계(취소사유 입력) 모달은 그대로 열려 있는다.
 * - "기타" 선택 시에만 "상세입력"이 필수가 된다.
 */

import { useState } from 'react';
import { ORDER_CANCEL_REASON_OTHER_VALUE } from '../constants';
import type { OrderBoardRow } from '../types';

type CancelEditorErrors = {
  reason: boolean;
  description: boolean;
};

type UseOrderCancelModalFlowParams = {
  onConfirmCancel: (id: string, reason: string, description: string) => void;
};

const INITIAL_ERRORS: CancelEditorErrors = { reason: false, description: false };

export function useOrderCancelModalFlow({ onConfirmCancel }: UseOrderCancelModalFlowParams) {
  const [targetRow, setTargetRow] = useState<OrderBoardRow | null>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<CancelEditorErrors>(INITIAL_ERRORS);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  const isOtherReason = reason === ORDER_CANCEL_REASON_OTHER_VALUE;

  const resetForm = () => {
    setReason('');
    setDescription('');
    setErrors(INITIAL_ERRORS);
  };

  const openCancelModal = (row: OrderBoardRow) => {
    setTargetRow(row);
    resetForm();
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorOpen(false);
    setTargetRow(null);
    resetForm();
  };

  const changeReason = (value: string) => {
    setReason(value);
    const stillNeedsDescription = value === ORDER_CANCEL_REASON_OTHER_VALUE;
    setErrors((prev) => ({ reason: false, description: stillNeedsDescription && prev.description }));
    if (!stillNeedsDescription) setDescription('');
  };

  const changeDescription = (value: string) => {
    setDescription(value);
    setErrors((prev) => ({ ...prev, description: false }));
  };

  const requestCancel = () => {
    const nextErrors: CancelEditorErrors = {
      reason: !reason,
      description: isOtherReason && !description.trim(),
    };
    setErrors(nextErrors);
    if (nextErrors.reason || nextErrors.description) return;
    setIsConfirmOpen(true);
  };

  const confirmCancel = () => {
    if (!targetRow) return;
    onConfirmCancel(targetRow.id, reason, isOtherReason ? description.trim() : '');
    setIsConfirmOpen(false);
    setIsEditorOpen(false);
    setIsNoticeOpen(true);
  };

  const closeConfirm = () => setIsConfirmOpen(false);

  const closeNotice = () => {
    setIsNoticeOpen(false);
    setTargetRow(null);
    resetForm();
  };

  return {
    targetRow,
    reason,
    description,
    errors,
    isOtherReason,
    isEditorOpen,
    isConfirmOpen,
    isNoticeOpen,
    openCancelModal,
    closeEditorModal,
    changeReason,
    changeDescription,
    requestCancel,
    confirmCancel,
    closeConfirm,
    closeNotice,
  };
}
