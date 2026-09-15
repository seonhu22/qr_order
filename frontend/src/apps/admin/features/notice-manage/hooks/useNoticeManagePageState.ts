import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAttachFileQueryKey } from '@/generated/file-controller/file-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import {
  mapToNoticeManageRow,
  useNoticeManageQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticesMutation,
  useNoticeAttachFileQuery,
} from '../api/noticeManageApi';
import { mapFileResponseToServerFile } from '@/shared/utils/attachFile';
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
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleToggleAll = () => {
    setCheckedIds(isAllChecked ? [] : rows.map((row) => row.id));
  };

  const handleSaveRow = async (editorRow: NoticeEditorRow, isCreateMode: boolean) => {
    // TODO : 나중에 백앤드와 상의하여 SYSID가 없는 경우 공지사항은 생성으로 간주하는 방식이 맞는지 확인 필요
    // if (!isCreateMode && !editorRow.sysId) {
    //   throw new Error(
    //     '공지사항 조회 응답에 sysId가 없어 수정할 수 없습니다. 백엔드 응답 계약 확인이 필요합니다.',
    //   );
    // }
    const data = {
      sysId: editorRow.sysId || undefined,
      fileUlid: editorRow.fileUlid,
      useYn: editorRow.useYn,
      title: editorRow.title,
      content: editorRow.content,
      fileChangeState: modalFlow.fileChangeState,
    };

    if (isCreateMode) {
      await createMutation.mutateAsync({ data });
    } else {
      await updateMutation.mutateAsync({ data });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.notice.lists });

    const fileUlid = editorRow.fileUlid?.trim();
    if (!isCreateMode && fileUlid) {
      await queryClient.invalidateQueries({
        queryKey: getGetAttachFileQueryKey({ linkSysId: fileUlid }),
      });
    }
  };

  const handleDeleteRows = async () => {
    const targets = rows.filter((row) => effectiveCheckedIds.includes(row.id));
    // if (targets.some((row) => !row.sysId)) {
    //   throw new Error(
    //     '공지사항 조회 응답에 sysId가 없어 삭제할 수 없습니다. 백엔드 응답 계약 확인이 필요합니다.',
    //   );
    // }
    const noticeRequests = targets.map((row) => ({ sysId: row.sysId }));
    await deleteMutation.mutateAsync({ data: noticeRequests });
    await queryClient.invalidateQueries({ queryKey: queryKeys.notice.lists });
    setCheckedIds([]);
    return targets.length;
  };

  const modalFlow = useNoticeManageModalFlow({
    checkedIds: effectiveCheckedIds,
    onSaveRow: handleSaveRow,
    onDeleteRows: handleDeleteRows,
  });

  usePreventLeave(modalFlow.isDirty);

  const editingFileUlid =
    !modalFlow.isCreateMode && modalFlow.isEditorOpen
      ? modalFlow.editingRow?.fileUlid
      : undefined;
  const attachFileQuery = useNoticeAttachFileQuery(editingFileUlid);
  const attachFiles = useMemo(
    () => (attachFileQuery.data ?? []).map(mapFileResponseToServerFile),
    [attachFileQuery.data],
  );

  const modalProps = {
    editor: {
      open: modalFlow.isEditorOpen,
      isDirty: modalFlow.isDirty,
      isCreateMode: modalFlow.isCreateMode,
      editingRow: modalFlow.editingRow,
      editorErrors: modalFlow.editorErrors,
      fileChangeState: modalFlow.fileChangeState,
      attachFiles,
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
