import { useMemo, useState } from 'react';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import {
  mapToNoticeListRow,
  useNoticeListQuery,
  useNoticeAttachFileQuery,
  mapFileResponseToServerFile,
  downloadNoticeFile,
  downloadAllNoticeFiles,
} from '../api/noticeApi';
import type { NoticeListRow } from '../types';

export function useNoticeListPage() {
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');

  const [selectedRow, setSelectedRow] = useState<NoticeListRow | null>(null);

  const query = useNoticeListQuery(appliedKeyword.trim() || undefined);
  const rows = useMemo(() => (query.data ?? []).map(mapToNoticeListRow), [query.data]);

  const attachFileQuery = useNoticeAttachFileQuery(selectedRow?.fileUlid);
  const attachFiles = useMemo(
    () => (attachFileQuery.data ?? []).map(mapFileResponseToServerFile),
    [attachFileQuery.data],
  );

  const handleDownloadFile = (file: Parameters<typeof downloadNoticeFile>[0]) => {
    downloadNoticeFile(file).catch(() => {});
  };

  const handleDownloadAllFiles = () => {
    if (selectedRow?.fileUlid) {
      downloadAllNoticeFiles(selectedRow.fileUlid).catch(() => {});
    }
  };

  return {
    data: { rows },
    status: {
      isLoading: query.isLoading,
      isError: query.isError,
    },
    uiProps: {
      draftKeyword,
      selectedRow,
      attachFiles,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch: applyDraftKeyword,
      handleReset: resetKeywords,
      handleRowClick: setSelectedRow,
      closeDetail: () => setSelectedRow(null),
      downloadFile: handleDownloadFile,
      downloadAllFiles: handleDownloadAllFiles,
    },
  };
}
