import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  mapToNoticeManageRow,
  useNoticeManageQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticesMutation,
} from '../api/noticeManageApi';
import { useNoticeManageModalFlow } from './useNoticeManageModalFlow';
import type { NoticeEditorRow } from './useNoticeManageModalFlow';
import type { NoticeManageRow } from '../types';

export function useNoticeManagePageState() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const noticeQuery = useNoticeManageQuery(keyword || undefined);
  const createMutation = useCreateNoticeMutation();
  const updateMutation = useUpdateNoticeMutation();
  const deleteMutation = useDeleteNoticesMutation();

  const rows = useMemo(
    () => (noticeQuery.data ?? []).map(mapToNoticeManageRow),
    [noticeQuery.data],
  );

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
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleToggleAll = () => {
    setCheckedIds(isAllChecked ? [] : rows.map((r) => r.id));
  };

  const handleSaveRow = async (editorRow: NoticeEditorRow, isCreateMode: boolean) => {
    const params = {
      noticeRequest: {
        sysId: editorRow.sysId || undefined,
        noticeTitle: editorRow.title,
        noticeDescription: editorRow.content,
      },
      fileRequest: {},
    };
    if (isCreateMode) {
      await createMutation.mutateAsync({ params });
    } else {
      await updateMutation.mutateAsync({ params });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.notice.list() });
  };

  const handleDeleteRows = async () => {
    const targets = rows.filter((row) => effectiveCheckedIds.includes(row.id));
    const noticeRequests = targets.map((row) => ({ sysId: row.sysId }));
    await deleteMutation.mutateAsync({ data: noticeRequests });
    await queryClient.invalidateQueries({ queryKey: queryKeys.notice.list() });
    setCheckedIds([]);
    return targets.length;
  };

  const modalFlow = useNoticeManageModalFlow({
    checkedIds: effectiveCheckedIds,
    onSaveRow: handleSaveRow,
    onDeleteRows: handleDeleteRows,
  });

  const modalProps = {
    editor: {
      open: modalFlow.isEditorOpen,
      isDirty: modalFlow.isDirty,
      isCreateMode: modalFlow.isCreateMode,
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
      isLoading: noticeQuery.isLoading,
      isError: noticeQuery.isError,
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
      handleEdit: (row: NoticeManageRow) => modalFlow.openEditModal(row),
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