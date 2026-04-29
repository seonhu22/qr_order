/**
 * @fileoverview 관리자 관리 공통 flow 훅
 *
 * @description
 * - 조회/삭제/저장/비밀번호 초기화와 관련된 모달 상태 및 흐름을 관리한다.
 * - 목록 자체의 편집 상태는 useAdminUserListState가 담당하고,
 *   이 훅은 그 상태를 사용해 어떤 모달을 띄우고 어떤 후처리를 할지 결정한다.
 * - 즉, "무엇을 검증할지"는 list state 훅이 알고,
 *   "검증 결과에 따라 어떤 UX 플로우를 밟을지"는 이 훅이 결정한다.
 *
 * @remarks
 * 이 훅은 "흐름 오케스트레이션" 레이어다.
 * 도메인 데이터 수정 자체는 수행하지 않고, 아래만 담당한다.
 * - 사용자 확인이 필요한 시점 결정
 * - 어떤 모달을 먼저 띄울지 결정
 * - confirm 이후 어떤 콜백을 실행할지 결정
 */

import { useEditablePageFlow } from '@/shared/hooks/useEditablePageFlow';
import type {
  AdminUserFlowState,
} from '../types';

type UseAdminUserFlowParams = {
  isDirty: boolean;
  selectedRowId: string;
  onApplySearch: () => void;
  onResetFilters: () => void;
  onResetDraftRows: () => void;
  onDeleteSelectedRow: () => void;
  onValidateRequiredFields: () => boolean;
  onApplyRequiredFieldErrors: () => void;
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
 *
 * @example
 * ```ts
 * const flow = useAdminUserFlow({
 *   isDirty,
 *   selectedRowId,
 *   onApplySearch,
 *   onResetFilters,
 *   onResetDraftRows,
 *   onDeleteSelectedRow,
 *   onValidateRequiredFields,
 *   onSaveChanges,
 *   onResetPassword,
 * });
 *
 * // 페이지에서는 액션을 이벤트에 연결만 한다.
 * <SearchFilterCard onSearch={flow.requestSearch} onReset={flow.requestResetFilters} />
 * <Button onClick={flow.requestSave}>저장</Button>
 * ```
 */
export function useAdminUserFlow({
  isDirty,
  selectedRowId,
  onApplySearch,
  onResetFilters,
  onResetDraftRows,
  onDeleteSelectedRow,
  onValidateRequiredFields,
  onApplyRequiredFieldErrors,
  onSaveChanges,
  onResetPassword,
}: UseAdminUserFlowParams) {
  const editableFlow = useEditablePageFlow({
    isDirty,
    onApplySearch,
    onResetFilters,
    onResetDraftRows,
    onValidateRequiredFields,
    onApplyRequiredFieldErrors,
    onSaveChanges,
    savedNotice: {
      description: '저장되었습니다.',
      helperText: '초기 비밀번호는 SN111111 입니다.',
    },
  });
  /**
   * 행 삭제 흐름의 진입점.
   *
   * @description
   * 선택 행이 있으면 즉시 삭제하고,
   * 선택이 없을 때만 안내 모달을 띄운다.
   */
  const requestDeleteRow = () => {
    if (!selectedRowId) {
      editableFlow.setSimpleModalState({
        description: '항목을 먼저 선택해주세요.',
        helperText: '삭제할 행을 클릭 후 진행하세요.',
      });
      return;
    }
    // TODO : 행삭제 버튼은 추후 초회에만 주의를 주는 경고 모달을 추가할 수도 있다. 급한 사항은 아님.
    onDeleteSelectedRow();
  };

  /**
   * 저장되지 않은 draft가 없는 경우의 비밀번호 초기화 확인 흐름.
   */
  const openPasswordResetConfirm = (userId: string) => {
    editableFlow.setSimpleModalState({
      type: 'passwordResetConfirm',
      userId,
      description: `${userId} 비밀번호를 초기화 하시겠습니까?`,
      onConfirm: async () => {
        if (!userId) {
          editableFlow.setSimpleModalState({
            description: '초기화할 사용자 아이디가 없습니다.',
          });
          return;
        }

        try {
          await onResetPassword(userId);
          editableFlow.setSimpleModalState({
            description: '비밀번호가 초기화되었습니다.',
            helperText: '초기 비밀번호는 SN111111 입니다.',
          });
        } catch (error) {
          editableFlow.setSimpleModalState({
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
   * 사용자 아이디를 포함한 확인 모달을 먼저 띄우고,
   * 확인을 누른 뒤에만 비밀번호 초기화 API를 실행한다.
   *
   * @example
   * ```text
   * 초기화 버튼 -> "{아이디} 비밀번호를 초기화 하시겠습니까?" 확인 -> 초기화 API -> 결과 안내
   * ```
   */
  const requestResetPassword = (userId: string) => {
    openPasswordResetConfirm(userId);
  };

  const state: AdminUserFlowState = editableFlow.state;

  return {
    state,
    requestSearch: editableFlow.requestSearch,
    requestResetFilters: editableFlow.requestResetFilters,
    requestDeleteRow,
    requestSave: editableFlow.requestSave,
    confirmSave: editableFlow.confirmSave,
    requestResetPassword,
    confirmFilterAction: editableFlow.confirmFilterAction,
    cancelFilterAction: editableFlow.cancelFilterAction,
    closeSimpleModal: editableFlow.closeSimpleModal,
    closeSaveConfirm: editableFlow.closeSaveConfirm,
    confirmSimpleModal: editableFlow.confirmSimpleModal,
  };
}
