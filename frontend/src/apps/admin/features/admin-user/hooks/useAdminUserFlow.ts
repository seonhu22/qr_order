/**
 * @fileoverview 관리자 관리 공통 flow 훅
 *
 * @description
 * - 조회/삭제/저장/비밀번호 초기화와 관련된 모달 상태 및 흐름을 관리한다.
 * - 목록 자체의 편집 상태는 useAdminUserListState가 담당하고,
 *   이 훅은 그 상태를 사용해 어떤 모달을 띄우고 어떤 후처리를 할지 결정한다.
 * - 즉, "무엇을 검증할지"는 list state 훅이 알고,
 *   "검증 결과에 따라 어떤 UX 플로우를 밟을지"는 이 훅이 결정한다.
 */

import { startTransition, useState } from 'react';
import type {
  AdminUserFlowState,
  AdminUserSimpleModalState,
  AdminUserWrapperModalState,
} from '../types';

type UseAdminUserFlowParams = {
  draftKeyword: string;
  isDirty: boolean;
  selectedRowId: string;
  onApplySearch: (keyword: string) => void;
  onResetFilters: () => void;
  onResetDraftRows: () => void;
  onDeleteSelectedRow: () => void;
  onValidateRequiredFields: () => boolean;
  onSaveChanges: () => Promise<'saved' | 'unchanged'>;
  onResetPassword: (userId: string) => Promise<void>;
};

/**
 * 관리자 관리 화면의 공통 flow를 관리한다.
 *
 * @description
 * - 조회 전 dirty 확인
 * - 저장 전 필수값 검증 실패 안내
 * - 저장 확인 / 저장 완료 안내
 * - 비밀번호 초기화 확인 / 완료 안내
 * 를 한 곳에 모은다.
 *
 * @remarks
 * 실제 목록 데이터 변경, row error 생성, active row 선택은
 * useAdminUserListState가 담당한다.
 */
export function useAdminUserFlow({
  draftKeyword,
  isDirty,
  selectedRowId,
  onApplySearch,
  onResetFilters,
  onResetDraftRows,
  onDeleteSelectedRow,
  onValidateRequiredFields,
  onSaveChanges,
  onResetPassword,
}: UseAdminUserFlowParams) {
  const [simpleModalState, setSimpleModalState] = useState<AdminUserSimpleModalState>(null);
  const [wrapperModalState, setWrapperModalState] = useState<AdminUserWrapperModalState>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  /**
   * 조회 버튼 흐름.
   *
   * @description
   * 저장되지 않은 편집 내용이 있으면 즉시 조회하지 않고 확인 모달을 띄운다.
   * 사용자가 확인한 경우에만 검색어를 반영하고 draft를 버린다.
   */
  const requestSearch = () => {
    if (isDirty) {
      setSimpleModalState({
        description: '조회하시겠습니까?',
        helperText: '저장되지 않은 내용이 있습니다.',
        onConfirm: () => {
          startTransition(() => {
            onApplySearch(draftKeyword);
          });
          onResetDraftRows();
          setSimpleModalState(null);
        },
      });
      return;
    }

    startTransition(() => {
      onApplySearch(draftKeyword);
    });
    onResetDraftRows();
  };

  /**
   * 검색 필터 초기화 흐름.
   *
   * @description
   * 관리자 관리 화면에서는 초기화 시 검색어와 draft rows를 함께 되돌린다.
   */
  const requestResetFilters = () => {
    startTransition(() => {
      onResetFilters();
    });
    onResetDraftRows();
  };

  /**
   * 행 삭제 흐름의 진입점.
   *
   * @description
   * 선택 행이 있으면 즉시 삭제하고,
   * 선택이 없을 때만 안내 모달을 띄운다.
   */
  const requestDeleteRow = () => {
    if (!selectedRowId) {
      setSimpleModalState({
        description: '항목을 먼저 선택해주세요.',
        helperText: '삭제할 행을 클릭 후 진행하세요.',
      });
      return;
    }
    // TODO : 행삭제 버튼은 추후 초회에만 주의를 주는 경고 모달을 추가할 수도 있다. 급한 사항은 아님.
    onDeleteSelectedRow();
  };

  /**
   * 저장 요청 흐름의 진입점.
   *
   * @description
   * 필수값 검증은 list state 훅에 위임하고,
   * 실패 시 안내 모달, 성공 시 저장 확인 모달로 분기한다.
   */
  const requestSave = () => {
    if (!onValidateRequiredFields()) {
      setWrapperModalState({
        title: '안내',
        description: '필수 항목을 모두 입력해주세요.',
      });
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  /**
   * 저장 확인 모달의 확인 버튼 후처리.
   *
   * @description
   * 실제 mutation은 외부 콜백(onSaveChanges)에 위임한다.
   * 이 훅은 결과값(saved/unchanged/throw)에 따라 사용자 안내만 담당한다.
   */
  const confirmSave = async () => {
    try {
      const result = await onSaveChanges();
      setIsSaveConfirmOpen(false);

      if (result === 'unchanged') {
        setSimpleModalState({
          description: '변경된 내용이 없습니다.',
        });
        return;
      }

      setSimpleModalState({
        description: '저장되었습니다.',
        helperText: '초기 비밀번호는 SN111111 입니다.',
      });
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setSimpleModalState({
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    }
  };

  /**
   * 저장되지 않은 draft가 없는 경우의 비밀번호 초기화 확인 흐름.
   */
  const openPasswordResetConfirm = (userId: string) => {
    setSimpleModalState({
      description: '초기화하겠습니까?',
      helperText: '비밀번호가 초기화됩니다.',
      onConfirm: async () => {
        if (!userId) {
          setSimpleModalState({
            description: '초기화할 사용자 아이디가 없습니다.',
          });
          return;
        }

        try {
          await onResetPassword(userId);
          setSimpleModalState({
            description: '저장되었습니다.',
            helperText: '초기 비밀번호는 SN111111 입니다.',
          });
        } catch (error) {
          setSimpleModalState({
            description:
              error instanceof Error ? error.message : '비밀번호 초기화 중 오류가 발생했습니다.',
          });
        }
      },
    });
  };

  /**
   * 비밀번호 초기화 진입점.
   *
   * @description
   * dirty 상태라면 먼저 "저장되지 않은 내용" 경고를 띄우고,
   * 아니면 즉시 비밀번호 초기화 확인 플로우로 들어간다.
   */
  const requestResetPassword = (userId: string) => {
    if (isDirty) {
      setSimpleModalState({
        description: '초기화하겠습니까?',
        helperText: '저장되지 않은 내용이 있습니다.',
        onConfirm: async () => {
          if (!userId) {
            setSimpleModalState({
              description: '초기화할 사용자 아이디가 없습니다.',
            });
            return;
          }

          try {
            await onResetPassword(userId);
            setSimpleModalState({
              description: '저장되었습니다.',
              helperText: '초기 비밀번호는 SN111111 입니다.',
            });
          } catch (error) {
            setSimpleModalState({
              description:
                error instanceof Error ? error.message : '비밀번호 초기화 중 오류가 발생했습니다.',
            });
          }
        },
      });
      return;
    }

    openPasswordResetConfirm(userId);
  };

  const state: AdminUserFlowState = {
    simpleModalState,
    wrapperModalState,
    isSaveConfirmOpen,
  };

  return {
    state,
    requestSearch,
    requestResetFilters,
    requestDeleteRow,
    requestSave,
    confirmSave,
    requestResetPassword,
    closeSimpleModal: () => setSimpleModalState(null),
    closeWrapperModal: () => setWrapperModalState(null),
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    confirmSimpleModal: async () => {
      await simpleModalState?.onConfirm?.();
    },
  };
}
