import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  buildCreateInquiryRequest,
  mapToInquiryListRow,
  mapFileResponseToServerFile,
  useCreateInquiryMutation,
  useInquiryAttachFileQuery,
  useInquiryListQuery,
  downloadInquiryFile,
  downloadAllInquiryFiles,
} from '../api/inquiryApi';
import { useInquiryCreateModalFlow } from './useInquiryCreateModalFlow';
import type { InquiryListRow } from '../types';

export type InquiryAnswerFilterKey = 'ALL' | 'answered' | 'pending';

export function useInquiryListPage() {
  const queryClient = useQueryClient();
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [draftAnswerStatus, setDraftAnswerStatus] = useState<InquiryAnswerFilterKey>('ALL');
  const [answerStatus, setAnswerStatus] = useState<InquiryAnswerFilterKey>('ALL');
  const [selectedRow, setSelectedRow] = useState<InquiryListRow | null>(null);

  const inquiryQuery = useInquiryListQuery(keyword || undefined);
  const createMutation = useCreateInquiryMutation();

  const allRows = useMemo(
    () => (inquiryQuery.data ?? []).map(mapToInquiryListRow),
    [inquiryQuery.data],
  );
  const rows = useMemo(
    () =>
      answerStatus === 'ALL' ? allRows : allRows.filter((row) => row.answerStatus === answerStatus),
    [allRows, answerStatus],
  );

  const handleSearch = () => {
    setKeyword(draftKeyword);
    setAnswerStatus(draftAnswerStatus);
  };

  const handleReset = () => {
    setDraftKeyword('');
    setKeyword('');
    setDraftAnswerStatus('ALL');
    setAnswerStatus('ALL');
  };

  const handleCreate = async (editorRow: { title: string; content: string }) => {
    await createMutation.mutateAsync({ data: buildCreateInquiryRequest(editorRow) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.clientInquiry.lists });
  };

  const modalFlow = useInquiryCreateModalFlow({ onCreate: handleCreate });

  const attachFileQuery = useInquiryAttachFileQuery(selectedRow?.fileUlid);
  const attachFiles = useMemo(
    () => (attachFileQuery.data ?? []).map(mapFileResponseToServerFile),
    [attachFileQuery.data],
  );

  const handleDownloadFile = (file: Parameters<typeof downloadInquiryFile>[0]) => {
    downloadInquiryFile(file).catch(() => {});
  };

  const handleDownloadAllFiles = () => {
    if (selectedRow?.fileUlid) {
      downloadAllInquiryFiles(selectedRow.fileUlid).catch(() => {});
    }
  };

  const modalProps = {
    editor: {
      open: modalFlow.isEditorOpen,
      isDirty: modalFlow.isDirty,
      editingRow: modalFlow.editingRow,
      editorErrors: modalFlow.editorErrors,
      fileChangeState: modalFlow.fileChangeState,
    },
    saveConfirm: {
      open: modalFlow.isSaveConfirmOpen,
      isLoading: modalFlow.isConfirming,
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
      isLoading: inquiryQuery.isLoading,
      isError: inquiryQuery.isError,
    },
    uiProps: {
      draftKeyword,
      draftAnswerStatus,
      selectedRow,
      attachFiles,
      modalProps,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleAnswerStatusChange: setDraftAnswerStatus,
      handleSearch,
      handleReset,
      handleRowClick: setSelectedRow,
      closeDetail: () => setSelectedRow(null),
      downloadFile: handleDownloadFile,
      downloadAllFiles: handleDownloadAllFiles,
      handleCreateClick: modalFlow.openCreateModal,
      changeEditingField: modalFlow.changeEditingField,
      changeFileState: modalFlow.changeFileState,
      requestSave: modalFlow.requestSave,
      confirmSave: modalFlow.confirmSave,
      closeEditorModal: modalFlow.closeEditorModal,
      forceCloseEditorModal: modalFlow.forceCloseEditorModal,
      closeSaveConfirm: modalFlow.closeSaveConfirm,
      closeDirtyWarning: modalFlow.closeDirtyWarning,
      closeNotice: modalFlow.closeNotice,
    },
  };
}
