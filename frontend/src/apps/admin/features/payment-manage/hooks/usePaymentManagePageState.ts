import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  mapToPaymentRateRow,
  useDeletePaymentRatesMutation,
  usePaymentRatesQuery,
  useSavePaymentRateMutation,
} from '../api/paymentManageApi';
import { editorRowToPaymentRateRow, usePaymentManageModalFlow } from './usePaymentManageModalFlow';
import type { PaymentEditorRow } from './usePaymentManageModalFlow';

export function usePaymentManagePageState() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const ratesQuery = usePaymentRatesQuery(keyword);
  const saveMutation = useSavePaymentRateMutation();
  const deleteMutation = useDeletePaymentRatesMutation();

  const rows = useMemo(() => (ratesQuery.data ?? []).map(mapToPaymentRateRow), [ratesQuery.data]);

  const effectiveCheckedIds = checkedIds.filter((id) => rows.some((row) => row.id === id));
  const isAllChecked = rows.length > 0 && effectiveCheckedIds.length === rows.length;

  const handleSearch = () => {
    setKeyword(draftKeyword);
    setCheckedIds([]);
  };

  const handleReset = () => {
    setDraftKeyword('');
    setKeyword('');
    setCheckedIds([]);
  };

  const handleToggleRow = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleToggleAll = () => {
    setCheckedIds(isAllChecked ? [] : rows.map((r) => r.id));
  };

  const handleSaveRow = async (editorRow: PaymentEditorRow, isCreateMode: boolean) => {
    const row = editorRowToPaymentRateRow(editorRow);
    await saveMutation.mutateAsync(row, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.payment.lists });
  };

  const handleDeleteRows = async () => {
    const targets = rows.filter((row) => effectiveCheckedIds.includes(row.id));
    await deleteMutation.mutateAsync(targets);
    await queryClient.invalidateQueries({ queryKey: queryKeys.payment.lists });
    setCheckedIds([]);
    return targets.length;
  };

  const modalFlow = usePaymentManageModalFlow({
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
      isLoading: ratesQuery.isLoading,
      isError: ratesQuery.isError,
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
