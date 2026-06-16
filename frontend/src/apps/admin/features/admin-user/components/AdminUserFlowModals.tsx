/**
 * @fileoverview 관리자 관리 flow 모달 조립 컴포넌트
 *
 * @description
 * useAdminUserFlow가 만든 상태를 실제 modal UI로 연결한다.
 * 개별 modal의 노출 조건과 버튼 동작을 여기서만 조립하고,
 * 비즈니스 판단은 훅으로 남긴다.
 */

import { SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import type { AdminUserFlowState, AdminUserSimpleModalState } from '../types';

type AdminUserFlowModalsProps = {
  state: AdminUserFlowState;
  isSaving: boolean;
  isResettingPassword: boolean;
  onConfirmSave: () => void | Promise<void>;
  onCloseSaveConfirm: () => void;
  onCloseSimpleModal: () => void;
  onConfirmSimpleModal: () => void | Promise<void>;
};

/**
 * 관리자 관리 화면의 flow 관련 모달 조립 컴포넌트
 *
 * @remarks
 * - SaveConfirmModal: 저장 확인
 * - SimpleDefaultModal: 조회/초기화/저장 완료 등 단순 확인
 */
export function AdminUserFlowModals({
  state,
  isSaving,
  isResettingPassword,
  onConfirmSave,
  onCloseSaveConfirm,
  onCloseSimpleModal,
  onConfirmSimpleModal,
}: AdminUserFlowModalsProps) {
  const simpleModalState: AdminUserSimpleModalState = state.simpleModalState;
  const isPasswordResetConfirm = simpleModalState?.type === 'passwordResetConfirm';
  const simpleDescription =
    isPasswordResetConfirm ? (
      <>
        <strong className="admin-user-reset-modal__account-id">
          {simpleModalState.userId}
        </strong>
        {' 비밀번호를 초기화 하시겠습니까?'}
      </>
    ) : (
      simpleModalState?.description
    );

  return (
    <>
      <SaveConfirmModal
        open={state.isSaveConfirmOpen}
        description="저장하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: isSaving,
          onClick: onConfirmSave,
        }}
        secondaryAction={{
          disabled: isSaving,
          onClick: onCloseSaveConfirm,
        }}
        onClose={onCloseSaveConfirm}
      />

      <SimpleDefaultModal
        open={!!simpleModalState}
        description={simpleDescription}
        helperText={simpleModalState?.helperText}
        primaryAction={
          simpleModalState?.onConfirm
            ? { loading: isResettingPassword, onClick: onConfirmSimpleModal }
            : undefined
        }
        secondaryAction={
          isPasswordResetConfirm
            ? { disabled: isResettingPassword, onClick: onCloseSimpleModal }
            : undefined
        }
        onClose={onCloseSimpleModal}
      />
    </>
  );
}
