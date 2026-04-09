/**
 * @fileoverview 관리자 관리 flow 모달 조립 컴포넌트
 *
 * @description
 * useAdminUserFlow가 만든 상태를 실제 modal UI로 연결한다.
 * 개별 modal의 노출 조건과 버튼 동작을 여기서만 조립하고,
 * 비즈니스 판단은 훅으로 남긴다.
 */

import { SaveConfirmModal, SimpleDefaultModal, WrapperModal } from '@/shared/components/modal';
import type {
  AdminUserFlowState,
  AdminUserSimpleModalState,
  AdminUserWrapperModalState,
} from '../types';

type AdminUserFlowModalsProps = {
  state: AdminUserFlowState;
  isSaving: boolean;
  onConfirmSave: () => void | Promise<void>;
  onCloseSaveConfirm: () => void;
  onCloseSimpleModal: () => void;
  onCloseWrapperModal: () => void;
  onConfirmSimpleModal: () => void | Promise<void>;
};

/**
 * 관리자 관리 화면의 flow 관련 모달 조립 컴포넌트
 *
 * @remarks
 * - SaveConfirmModal: 저장 확인
 * - WrapperModal: 필수값 누락 등 강한 안내
 * - SimpleDefaultModal: 조회/초기화/저장 완료 등 단순 확인
 */
export function AdminUserFlowModals({
  state,
  isSaving,
  onConfirmSave,
  onCloseSaveConfirm,
  onCloseSimpleModal,
  onCloseWrapperModal,
  onConfirmSimpleModal,
}: AdminUserFlowModalsProps) {
  const simpleModalState: AdminUserSimpleModalState = state.simpleModalState;
  const wrapperModalState: AdminUserWrapperModalState = state.wrapperModalState;

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

      <WrapperModal
        open={!!wrapperModalState}
        title={wrapperModalState?.title}
        subtitle={wrapperModalState?.description}
        primaryAction={{
          label: '확인',
          onClick: onCloseWrapperModal,
        }}
        onClose={onCloseWrapperModal}
      />

      <SimpleDefaultModal
        open={!!simpleModalState}
        description={simpleModalState?.description}
        helperText={simpleModalState?.helperText}
        primaryAction={simpleModalState?.onConfirm ? { onClick: onConfirmSimpleModal } : undefined}
        onClose={onCloseSimpleModal}
      />
    </>
  );
}
