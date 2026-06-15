/**
 * @fileoverview 매장 > 유저 관리 > 유저 정보 관리 페이지 상태 조합 훅
 *
 * @description
 * - 조회/삭제/비밀번호 초기화 흐름을 조합해 `data / status / actions / uiProps` 뷰모델을 만든다.
 * - 등록/수정 모달 흐름은 별도 단계에서 추가한다.
 */

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import {
  mapToClientUserModel,
  useClientUserQuery,
  useDeleteClientUsersMutation,
  useResetClientUserPasswordMutation,
  useSaveClientUserMutation,
} from '../api/clientUserApi';
import type {
  ClientUserNoticeState,
  ClientUserPageViewModel,
  ClientUserPasswordResetTarget,
} from '../types';
import { useClientUserModalFlow } from './useClientUserModalFlow';
import type { ClientUserEditorRow } from './useClientUserModalFlow';

export function useClientUserPage(): ClientUserPageViewModel {
  const queryClient = useQueryClient();
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [passwordResetTarget, setPasswordResetTarget] = useState<ClientUserPasswordResetTarget | null>(
    null,
  );
  const [noticeState, setNoticeState] = useState<ClientUserNoticeState>(null);

  const userQuery = useClientUserQuery(appliedKeyword.trim());
  const deleteMutation = useDeleteClientUsersMutation();
  const resetPasswordMutation = useResetClientUserPasswordMutation();
  const saveMutation = useSaveClientUserMutation();

  const rows = useMemo(() => (userQuery.data ?? []).map(mapToClientUserModel), [userQuery.data]);

  const handleSearch = () => {
    applyDraftKeyword();
    setSelectedRowIds(new Set());
  };

  const handleReset = () => {
    resetKeywords();
    setSelectedRowIds(new Set());
  };

  const toggleRow = (rowId: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedRowIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
  };

  const requestDelete = () => {
    if (selectedRowIds.size === 0) {
      setNoticeState({ title: '안내', description: '항목을 먼저 선택해주세요.' });
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const targets = rows.filter((row) => selectedRowIds.has(row.id));
    setIsConfirmingDelete(true);
    try {
      await deleteMutation.mutateAsync(targets);
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientUser.lists });
      setSelectedRowIds(new Set());
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: '알림',
        description: targets.length > 1 ? `${targets.length}건이 삭제되었습니다.` : '삭제되었습니다.',
      });
    } catch (error) {
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  const requestResetPassword = (userId: string) => {
    const target = rows.find((row) => row.userId === userId);
    if (!target?.sysId) return;
    setPasswordResetTarget({ sysId: target.sysId, userId });
  };

  const confirmResetPassword = async () => {
    if (!passwordResetTarget) return;
    try {
      await resetPasswordMutation.mutateAsync(passwordResetTarget.sysId);
      setPasswordResetTarget(null);
      setNoticeState({
        title: '알림',
        description: '비밀번호가 초기화되었습니다.',
        helperText: '초기 비밀번호는 SN111111 입니다.',
      });
    } catch (error) {
      setPasswordResetTarget(null);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '비밀번호 초기화 중 오류가 발생했습니다.',
      });
    }
  };

  const handleSaveRow = async (row: ClientUserEditorRow, isCreateMode: boolean) => {
    await saveMutation.mutateAsync(row, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.clientUser.lists });
  };

  const modalFlow = useClientUserModalFlow({ onSaveRow: handleSaveRow, onNotice: setNoticeState });

  usePreventLeave(modalFlow.isDirty);

  const handleEdit = (rowId: string) => {
    const target = rows.find((row) => row.id === rowId);
    if (!target) return;
    modalFlow.openEditModal(target);
  };

  return {
    data: { rows },
    status: {
      isLoading: userQuery.isLoading,
      isFetching: userQuery.isFetching,
      isError: userQuery.isError,
      error: userQuery.error,
      isDeleting: isConfirmingDelete,
      isResettingPassword: resetPasswordMutation.isPending,
    },
    uiProps: {
      draftKeyword,
      selectedRowIds,
      isDeleteConfirmOpen,
      selectedDeleteCount: selectedRowIds.size,
      passwordResetTarget,
      noticeState,
      editor: {
        open: modalFlow.isEditorOpen,
        isDirty: modalFlow.isDirty,
        isCreateMode: modalFlow.isCreateMode,
        isUserIdReadonly: modalFlow.isUserIdReadonly,
        editingRow: modalFlow.editingRow,
        editorErrors: modalFlow.editorErrors,
      },
      saveConfirm: {
        open: modalFlow.isSaveConfirmOpen,
        isCreateMode: modalFlow.isCreateMode,
        isLoading: modalFlow.isConfirming,
      },
      dirtyWarning: {
        open: modalFlow.isDirtyWarningOpen,
      },
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch,
      handleReset,
      handleToggleRow: toggleRow,
      handleToggleAll: toggleAll,
      handleCreate: modalFlow.openCreateModal,
      handleEdit,
      handleDelete: requestDelete,
      confirmDelete,
      closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
      handleResetPassword: requestResetPassword,
      confirmResetPassword,
      closePasswordResetConfirm: () => setPasswordResetTarget(null),
      closeNotice: () => setNoticeState(null),
      changeEditingField: modalFlow.changeEditingField,
      requestSave: modalFlow.requestSave,
      confirmSave: modalFlow.confirmSave,
      confirmEdit: modalFlow.confirmSave,
      closeEditorModal: modalFlow.closeEditorModal,
      forceCloseEditorModal: modalFlow.forceCloseEditorModal,
      closeSaveConfirm: modalFlow.closeSaveConfirm,
      closeDirtyWarning: modalFlow.closeDirtyWarning,
    },
  };
}
