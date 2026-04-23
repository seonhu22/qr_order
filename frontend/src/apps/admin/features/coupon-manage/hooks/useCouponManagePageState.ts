import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import {
  mapToCouponRow,
  useCouponQuery,
  useSaveCouponMutation,
  useDeleteCouponsMutation,
} from '../api/couponManageApi';
import { editorRowToCouponRow, useCouponManageModalFlow } from './useCouponManageModalFlow';
import type { CouponEditorRow } from './useCouponManageModalFlow';

export function useCouponManagePageState() {
  const queryClient = useQueryClient();
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const couponQuery = useCouponQuery(appliedKeyword.trim());
  const saveMutation = useSaveCouponMutation();
  const deleteMutation = useDeleteCouponsMutation();

  const rows = useMemo(() => (couponQuery.data ?? []).map(mapToCouponRow), [couponQuery.data]);

  const effectiveCheckedIds = checkedIds.filter((id) => rows.some((row) => row.id === id));
  const isAllChecked = rows.length > 0 && effectiveCheckedIds.length === rows.length;

  const handleSearch = () => {
    applyDraftKeyword();
    setCheckedIds([]);
  };

  const handleReset = () => {
    resetKeywords();
    setCheckedIds([]);
  };

  const handleToggleRow = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleToggleAll = () => {
    setCheckedIds(isAllChecked ? [] : rows.map((r) => r.id));
  };

  const handleSaveRow = async (editorRow: CouponEditorRow, isCreateMode: boolean) => {
    const row = editorRowToCouponRow(editorRow);
    await saveMutation.mutateAsync(row, isCreateMode);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.coupon.list(appliedKeyword.trim()),
    });
  };

  const handleDeleteRows = async () => {
    const targets = rows.filter((row) => effectiveCheckedIds.includes(row.id));
    await deleteMutation.mutateAsync(targets);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.coupon.list(appliedKeyword.trim()),
    });
    setCheckedIds([]);
    return targets.length;
  };

  const modalFlow = useCouponManageModalFlow({
    checkedIds: effectiveCheckedIds,
    onSaveRow: handleSaveRow,
    onDeleteRows: handleDeleteRows,
  });

  const modalProps = {
    editor: {
      open: modalFlow.isEditorOpen,
      isDirty: modalFlow.isDirty,
      isCreateMode: modalFlow.isCreateMode,
      isCodeReadonly: modalFlow.isCodeReadonly,
      editingRow: modalFlow.editingRow,
      editorErrors: modalFlow.editorErrors,
    },
    saveConfirm: {
      open: modalFlow.isSaveConfirmOpen,
      isCreateMode: modalFlow.isCreateMode,
      isLoading: modalFlow.isConfirming,
    },
    deleteConfirm: {
      open: modalFlow.isDeleteConfirmOpen,
      isLoading: modalFlow.isConfirmingDelete,
      selectedDeleteCount: effectiveCheckedIds.length,
    },
    dirtyWarning: {
      open: modalFlow.isDirtyWarningOpen,
    },
    notice: {
      open: !!modalFlow.noticeState,
      title: modalFlow.noticeState?.title ?? '알림',
      description: modalFlow.noticeState?.description,
    },
  };

  return {
    data: { rows },
    status: {
      isLoading: couponQuery.isLoading,
      isError: couponQuery.isError,
    },
    uiProps: {
      draftKeyword,
      checkedIds: effectiveCheckedIds,
      isAllChecked,
      modalProps,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch,
      handleReset,
      handleToggleRow,
      handleToggleAll,
      handleCreate: modalFlow.openCreateModal,
      handleDelete: modalFlow.requestDelete,
      handleEdit: modalFlow.openEditModal,
      changeEditingField: modalFlow.changeEditingField,
      requestSave: modalFlow.requestSave,
      confirmSave: modalFlow.confirmSave,
      confirmDelete: modalFlow.confirmDelete,
      closeEditorModal: modalFlow.closeEditorModal,
      forceCloseEditorModal: modalFlow.forceCloseEditorModal,
      closeSaveConfirm: modalFlow.closeSaveConfirm,
      closeDeleteConfirm: modalFlow.closeDeleteConfirm,
      closeDirtyWarning: modalFlow.closeDirtyWarning,
      closeNotice: modalFlow.closeNotice,
    },
  };
}
