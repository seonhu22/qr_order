import { useMemo, useState } from 'react';
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

async function refetchOrThrow<TError>(
  refetch: () => Promise<{ isError: boolean; error: TError | null }>,
  errorMessage: string,
) {
  const result = await refetch();

  if (result.isError) {
    throw result.error instanceof Error ? result.error : new Error(errorMessage);
  }
}

export function useNoticeManagePageState() {
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

  const selectableRows = useMemo(() => rows.filter((row) => Boolean(row.sysId)), [rows]);
  const effectiveCheckedIds = checkedIds.filter((id) => rows.some((row) => row.id === id));
  const isAllChecked =
    selectableRows.length > 0 && effectiveCheckedIds.length === selectableRows.length;

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
    setCheckedIds(isAllChecked ? [] : selectableRows.map((row) => row.id));
  };

  const handleSaveRow = async (editorRow: NoticeEditorRow, isCreateMode: boolean) => {
    if (!isCreateMode && !editorRow.sysId) {
      throw new Error(
        '공지사항 조회 응답에 sysId가 없어 수정할 수 없습니다. 백엔드 응답 계약 확인이 필요합니다.',
      );
    }

    const data = {
      sysId: editorRow.sysId || undefined,
      fileUuid: editorRow.fileUuid,
      title: editorRow.title,
      content: editorRow.content,
      fileChangeState: modalFlow.fileChangeState,
    };

    if (isCreateMode) {
      await createMutation.mutateAsync({ data });
    } else {
      await updateMutation.mutateAsync({ data });
    }
    await refetchOrThrow(noticeQuery.refetch, '저장 후 공지사항 목록을 다시 조회하지 못했습니다.');
  };

  const handleDeleteRows = async () => {
    const targets = rows.filter((row) => effectiveCheckedIds.includes(row.id));
    if (targets.some((row) => !row.sysId)) {
      throw new Error(
        '공지사항 조회 응답에 sysId가 없어 삭제할 수 없습니다. 백엔드 응답 계약 확인이 필요합니다.',
      );
    }
    const noticeRequests = targets.map((row) => ({ sysId: row.sysId }));
    await deleteMutation.mutateAsync({ data: noticeRequests });
    await refetchOrThrow(noticeQuery.refetch, '삭제 후 공지사항 목록을 다시 조회하지 못했습니다.');
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
      fileChangeState: modalFlow.fileChangeState,
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
      changeFileState: modalFlow.changeFileState,
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
