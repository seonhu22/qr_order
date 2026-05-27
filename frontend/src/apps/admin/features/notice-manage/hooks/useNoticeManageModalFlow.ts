import { useState } from 'react';
import type { FileChangeState } from '@/shared/components/file-attachment';
import type { NoticeManageRow } from '../types';

export type NoticeEditorRow = {
  id: string;
  sysId: string;
  fileUlid?: string;
  useYn?: string;
  noticeType: string; // 공지 유형
  target: string; // 수신 대상
  title: string;
  content: string;
};

export type NoticeEditorErrors = {
  title: boolean;
  content: boolean;
};

type NoticeState = { title: string; description: string } | null;

type UseNoticeManageModalFlowParams = {
  checkedIds: string[];
  onSaveRow: (row: NoticeEditorRow, isCreateMode: boolean) => Promise<void>;
  onDeleteRows: () => Promise<number>;
};

const EMPTY_ROW: NoticeEditorRow = {
  id: '',
  sysId: '',
  useYn: 'Y',
  noticeType: 'notice',
  target: 'all',
  title: '',
  content: '',
};
const INITIAL_ERRORS: NoticeEditorErrors = { title: false, content: false };
const EMPTY_FILE_STATE: FileChangeState = { newFiles: [], deletedFiles: [] };

function toEditorRow(row: NoticeManageRow): NoticeEditorRow {
  return {
    id: row.id,
    sysId: row.sysId,
    fileUlid: row.fileUlid,
    useYn: row.useYn,
    noticeType: row.noticeType || 'notice',
    target: row.target || 'all',
    title: row.title,
    content: row.content,
  };
}

export function useNoticeManageModalFlow({
  checkedIds,
  onSaveRow,
  onDeleteRows,
}: UseNoticeManageModalFlowParams) {
  const [editingRow, setEditingRow] = useState<NoticeEditorRow | null>(null);
  const [originalRow, setOriginalRow] = useState<NoticeEditorRow | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [noticeState, setNoticeState] = useState<NoticeState>(null);
  const [editorErrors, setEditorErrors] = useState<NoticeEditorErrors>(INITIAL_ERRORS);
  const [fileChangeState, setFileChangeState] = useState<FileChangeState>(EMPTY_FILE_STATE);

  const hasFileChanges =
    fileChangeState.newFiles.length > 0 || fileChangeState.deletedFiles.length > 0;

  const isDirty =
    (editingRow !== null &&
      originalRow !== null &&
      JSON.stringify(editingRow) !== JSON.stringify(originalRow)) ||
    hasFileChanges;

  const resetErrors = () => setEditorErrors(INITIAL_ERRORS);
  const resetFileState = () => setFileChangeState(EMPTY_FILE_STATE);

  const openCreateModal = () => {
    setEditingRow({ ...EMPTY_ROW });
    setOriginalRow({ ...EMPTY_ROW });
    setIsCreateMode(true);
    resetErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: NoticeManageRow) => {
    const editorRow = toEditorRow(row);
    setEditingRow(editorRow);
    setOriginalRow(editorRow);
    setIsCreateMode(false);
    resetErrors();
    setIsEditorOpen(true);
  };

  const forceCloseEditorModal = () => {
    setIsDirtyWarningOpen(false);
    setIsEditorOpen(false);
    setEditingRow(null);
    setOriginalRow(null);
    setIsCreateMode(false);
    resetErrors();
    resetFileState();
  };

  const closeEditorModal = () => {
    if (isDirty) {
      setIsDirtyWarningOpen(true);
      return;
    }
    forceCloseEditorModal();
  };

  const changeEditingField = (key: keyof Omit<NoticeEditorRow, 'id' | 'sysId'>, value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const nextErrors: NoticeEditorErrors = {
      title: !editingRow?.title.trim(),
      content: !editingRow?.content.trim(),
    };
    setEditorErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (!isCreateMode && !isDirty) {
      setNoticeState({ title: '알림', description: '변경된 내용이 없습니다.' });
      return;
    }
    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!editingRow) return;
    setIsConfirming(true);
    try {
      await onSaveRow(editingRow, isCreateMode);
      setIsSaveConfirmOpen(false);
      setIsEditorOpen(false);
      setNoticeState({ title: '알림', description: '저장되었습니다.' });
      setEditingRow(null);
      setOriginalRow(null);
      setIsCreateMode(false);
      resetErrors();
      resetFileState();
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const requestDelete = () => {
    if (checkedIds.length === 0) {
      setNoticeState({ title: '안내', description: '항목을 먼저 선택해주세요.' });
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsConfirmingDelete(true);
    try {
      const count = await onDeleteRows();
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: '알림',
        description: count > 1 ? `${count}건이 삭제되었습니다.` : '삭제되었습니다.',
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

  return {
    editingRow,
    isCreateMode,
    isDirty,
    editorErrors,
    fileChangeState,
    noticeState,
    isEditorOpen,
    isSaveConfirmOpen,
    isDeleteConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    isConfirmingDelete,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    forceCloseEditorModal,
    changeEditingField,
    changeFileState: setFileChangeState,
    requestSave,
    confirmSave,
    requestDelete,
    confirmDelete,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    closeDirtyWarning: () => setIsDirtyWarningOpen(false),
    closeNotice: () => setNoticeState(null),
  };
}
