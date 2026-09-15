import { useState } from 'react';
import type { FileChangeState } from '@/shared/components/file-attachment';
import type { CreateInquiryPayload } from '../api/inquiryApi';

export type InquiryEditorErrors = {
  title: boolean;
  content: boolean;
};

type NoticeState = { title: string; description: string } | null;

type UseInquiryCreateModalFlowParams = {
  onCreate: (row: CreateInquiryPayload) => Promise<void>;
};

const EMPTY_ROW: CreateInquiryPayload = { title: '', content: '' };
const INITIAL_ERRORS: InquiryEditorErrors = { title: false, content: false };
const EMPTY_FILE_STATE: FileChangeState = { newFiles: [], deletedFiles: [] };

export function useInquiryCreateModalFlow({ onCreate }: UseInquiryCreateModalFlowParams) {
  const [editingRow, setEditingRow] = useState<CreateInquiryPayload | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [noticeState, setNoticeState] = useState<NoticeState>(null);
  const [editorErrors, setEditorErrors] = useState<InquiryEditorErrors>(INITIAL_ERRORS);
  const [fileChangeState, setFileChangeState] = useState<FileChangeState>(EMPTY_FILE_STATE);

  const isDirty =
    (editingRow !== null &&
      (editingRow.title.trim() !== '' || editingRow.content.trim() !== '')) ||
    fileChangeState.newFiles.length > 0;

  const resetErrors = () => setEditorErrors(INITIAL_ERRORS);
  const resetFileState = () => setFileChangeState(EMPTY_FILE_STATE);

  const openCreateModal = () => {
    setEditingRow({ ...EMPTY_ROW });
    resetErrors();
    setIsEditorOpen(true);
  };

  const forceCloseEditorModal = () => {
    setIsDirtyWarningOpen(false);
    setIsEditorOpen(false);
    setEditingRow(null);
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

  const changeEditingField = (key: keyof CreateInquiryPayload, value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const nextErrors: InquiryEditorErrors = {
      title: !editingRow?.title.trim(),
      content: !editingRow?.content.trim(),
    };
    setEditorErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!editingRow) {
      return;
    }
    setIsConfirming(true);
    try {
      await onCreate({ ...editingRow, fileChangeState });
      setIsSaveConfirmOpen(false);
      setIsEditorOpen(false);
      setNoticeState({ title: '알림', description: '등록되었습니다.' });
      setEditingRow(null);
      resetErrors();
      resetFileState();
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    editingRow,
    isDirty,
    editorErrors,
    fileChangeState,
    noticeState,
    isEditorOpen,
    isSaveConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    openCreateModal,
    closeEditorModal,
    forceCloseEditorModal,
    changeEditingField,
    changeFileState: setFileChangeState,
    requestSave,
    confirmSave,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeDirtyWarning: () => setIsDirtyWarningOpen(false),
    closeNotice: () => setNoticeState(null),
  };
}
