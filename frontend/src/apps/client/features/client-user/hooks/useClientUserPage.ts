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
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserStaffRole } from '@/shared/auth/authUserDisplay';
import {
  getClientUserAuthorityOptionsWithFallback,
  mapToClientUserModel,
  useClientUserAuthorityComboQuery,
  useClientUserQuery,
  useDeleteClientUsersMutation,
  useResetClientUserPasswordMutation,
  useSaveClientUserMutation,
} from '../api/clientUserApi';
import type {
  ClientUserNoticeState,
  ClientUserPageViewModel,
  ClientUserPasswordResetTarget,
  ClientUser,
} from '../types';
import { useClientUserModalFlow } from './useClientUserModalFlow';
import { getClientUserAuthorityLabel } from '../constants';
import type { ClientUserEditorRow } from './useClientUserModalFlow';

export function useClientUserPage(): ClientUserPageViewModel {
  const { user } = useAuth();
  const userId = typeof user?.userId === 'string' ? user.userId : '';
  const sysPlantCd = typeof user?.sysPlantCd === 'string' ? user.sysPlantCd : '';
  const hasScope = userId.trim() !== '' && sysPlantCd.trim() !== '';
  const isManager = getAuthUserStaffRole(user) === '01' && hasScope && sysPlantCd !== 'ADMIN';
  const actorKey = JSON.stringify([user?.userId, user?.sysPlantCd]);
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
  const [deleteActor, setDeleteActor] = useState<string | null>(null);
  const [editorActor, setEditorActor] = useState<string | null>(null);
  const [passwordResetActor, setPasswordResetActor] = useState<string | null>(null);

  const userQuery = useClientUserQuery(appliedKeyword.trim(), isManager,
    hasScope ? { userId, sysPlantCd } : undefined);
  const authorityComboQuery = useClientUserAuthorityComboQuery(isManager);
  const deleteMutation = useDeleteClientUsersMutation();
  const resetPasswordMutation = useResetClientUserPasswordMutation();
  const saveMutation = useSaveClientUserMutation();

  const authorityOptions = useMemo(
    () => getClientUserAuthorityOptionsWithFallback(authorityComboQuery.data),
    [authorityComboQuery.data],
  );

  const rows = useMemo(
    () => (isManager ? userQuery.data ?? [] : [])
      .filter((item) => item.plantCd === sysPlantCd)
      .map((item) => mapToClientUserModel(item, authorityOptions)),
    [userQuery.data, authorityOptions, isManager, sysPlantCd],
  );

  const canManageStaff = (target: ClientUser | undefined) =>
    isManager && Boolean(target?.sysId) && target?.authorityCode === '02' && target.plantCd === user?.sysPlantCd;

  const showPermissionNotice = () => setNoticeState({ title: '안내', description: '같은 매장의 스태프만 관리할 수 있습니다.' });

  const handleSearch = () => {
    applyDraftKeyword();
    setSelectedRowIds(new Set());
  };

  const handleReset = () => {
    resetKeywords();
    setSelectedRowIds(new Set());
  };

  const toggleRow = (rowId: string, checked: boolean) => {
    if (checked && !canManageStaff(rows.find((row) => row.id === rowId))) return;
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedRowIds(checked ? new Set(rows.filter(canManageStaff).map((row) => row.id)) : new Set());
  };

  const requestDelete = () => {
    if (!isManager) { showPermissionNotice(); return; }
    if (selectedRowIds.size === 0) {
      setNoticeState({ title: '안내', description: '항목을 먼저 선택해주세요.' });
      return;
    }
    if ([...selectedRowIds].some((id) => !canManageStaff(rows.find((row) => row.id === id)))) {
      showPermissionNotice(); return;
    }
    setDeleteActor(actorKey);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const targets = rows.filter((row) => selectedRowIds.has(row.id));
    if (!isDeleteConfirmOpen || deleteActor !== actorKey || targets.length === 0 ||
      targets.length !== selectedRowIds.size || !targets.every(canManageStaff)) {
      setIsDeleteConfirmOpen(false);
      showPermissionNotice(); return;
    }
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
    setPasswordResetTarget(null);
    const target = rows.find((row) => row.userId === userId);
    if (!target?.sysId) return;
    if (target.authorityCode === '01') {
      setNoticeState({ title: '안내', description: '매장 관리자 비밀번호 초기화는 관리자에게 이메일로 요청해주세요.' });
      return;
    }
    if (!canManageStaff(target)) {
      setNoticeState({ title: '안내', description: '매장 관리자는 같은 매장의 스태프만 초기화할 수 있습니다.' });
      return;
    }
    setPasswordResetActor(actorKey);
    setPasswordResetTarget({ sysId: target.sysId, userId });
  };

  const confirmResetPassword = async () => {
    if (!passwordResetTarget) return;
    const target = rows.find((row) => row.sysId === passwordResetTarget.sysId);
    if (passwordResetActor !== actorKey || !canManageStaff(target)) {
      setPasswordResetTarget(null);
      setNoticeState({ title: '안내', description: '계정이나 권한이 변경되었습니다. 다시 확인해주세요.' });
      return;
    }
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
    const original = rows.find((item) => item.sysId === row.sysId);
    if (!isManager || editorActor !== actorKey || row.authorityCode !== '02' ||
      (row.plantCd !== undefined && row.plantCd !== user?.sysPlantCd) ||
      (!isCreateMode && (!canManageStaff(original) || row.userId !== original?.userId))) {
      throw new Error('계정이나 대상 권한이 변경되었습니다. 다시 확인해주세요.');
    }
    await saveMutation.mutateAsync(row, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.clientUser.lists });
  };

  const modalFlow = useClientUserModalFlow({ onSaveRow: handleSaveRow, onNotice: setNoticeState });

  usePreventLeave(modalFlow.isDirty);

  const handleEdit = (rowId: string) => {
    const target = rows.find((row) => row.id === rowId);
    if (!canManageStaff(target) || !target) { showPermissionNotice(); return; }
    setEditorActor(actorKey);
    modalFlow.openEditModal(target);
  };

  const handleCreate = () => {
    if (!isManager) { showPermissionNotice(); return; }
    setEditorActor(actorKey);
    modalFlow.openCreateModal();
  };

  const staffAuthorityOptions = authorityOptions.filter((option) => option.value === '02');

  return {
    data: { rows, authorityOptions: staffAuthorityOptions.length ? staffAuthorityOptions :
      [{ value: '02', label: getClientUserAuthorityLabel('02') }] },
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
      handleCreate,
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
