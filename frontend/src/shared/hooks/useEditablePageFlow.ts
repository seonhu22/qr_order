/**
 * @fileoverview 편집형 목록 화면의 공통 flow 훅
 *
 * @description
 * - 조회/초기화 dirty guard
 * - 저장 확인 모달
 * - 단순 안내 모달
 * 을 공통으로 관리한다.
 *
 * admin-user, message 같은 편집형 목록 화면에서 재사용한다.
 */

import { startTransition, useState } from 'react';
import { useFilterDirtyCheck } from './useFilterDirtyCheck';

export type EditablePageSimpleModalState = {
  description: string;
  helperText?: string;
  onConfirm?: () => void | Promise<void>;
} | null;

export type EditablePageFlowState = {
  simpleModalState: EditablePageSimpleModalState;
  isSaveConfirmOpen: boolean;
  pendingFilterAction: 'search' | 'reset' | null;
};

type SaveResult = 'saved' | 'unchanged';

type UseEditablePageFlowParams = {
  isDirty: boolean;
  onApplySearch: () => void;
  onResetFilters: () => void;
  onResetDraftRows?: () => void;
  onValidateRequiredFields?: () => boolean;
  onSaveChanges: () => Promise<SaveResult> | SaveResult;
  savedNotice?: {
    description: string;
    helperText?: string;
  };
  unchangedNotice?: {
    description: string;
    helperText?: string;
  };
  saveErrorMessage?: string;
};

/**
 * 편집형 목록 화면에서 반복되는 공통 UX flow를 관리한다.
 */
export function useEditablePageFlow({
  isDirty,
  onApplySearch,
  onResetFilters,
  onResetDraftRows,
  onValidateRequiredFields,
  onSaveChanges,
  savedNotice = {
    description: '저장되었습니다.',
  },
  unchangedNotice = {
    description: '변경된 내용이 없습니다.',
  },
  saveErrorMessage = '저장 중 오류가 발생했습니다.',
}: UseEditablePageFlowParams) {
  const [simpleModalState, setSimpleModalState] = useState<EditablePageSimpleModalState>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  const {
    pendingFilterAction,
    requestSearch,
    requestReset: requestResetFilters,
    confirmFilterAction,
    cancelFilterAction,
  } = useFilterDirtyCheck({
    isDirty,
    onSearch: () => {
      startTransition(() => {
        onApplySearch();
      });
      onResetDraftRows?.();
    },
    onReset: () => {
      startTransition(() => {
        onResetFilters();
      });
      onResetDraftRows?.();
    },
  });

  /**
   * 저장 요청 진입점.
   *
   * 필수값 검증 함수가 있으면 먼저 검사하고,
   * 성공 시에만 저장 확인 모달을 연다.
   */
  const requestSave = () => {
    if (onValidateRequiredFields && !onValidateRequiredFields()) {
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  /**
   * 저장 확인 모달에서 실제 저장을 확정한다.
   */
  const confirmSave = async () => {
    try {
      const result = await onSaveChanges();
      setIsSaveConfirmOpen(false);

      if (result === 'unchanged') {
        setSimpleModalState(unchangedNotice);
        return;
      }

      setSimpleModalState(savedNotice);
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setSimpleModalState({
        description: error instanceof Error ? error.message : saveErrorMessage,
      });
    }
  };

  const state: EditablePageFlowState = {
    simpleModalState,
    isSaveConfirmOpen,
    pendingFilterAction,
  };

  return {
    state,
    requestSearch,
    requestResetFilters,
    requestSave,
    confirmSave,
    confirmFilterAction,
    cancelFilterAction,
    closeSimpleModal: () => setSimpleModalState(null),
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    confirmSimpleModal: async () => {
      await simpleModalState?.onConfirm?.();
    },
    setSimpleModalState,
  };
}
