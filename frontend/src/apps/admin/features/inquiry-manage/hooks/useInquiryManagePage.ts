import { useMemo } from 'react';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { mapToInquiryManageRow, useInquiryManageQuery } from '../api/inquiryManageApi';

export function useInquiryManagePage() {
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');

  const query = useInquiryManageQuery(appliedKeyword.trim());

  const rows = useMemo(
    () => (query.data ?? []).map(mapToInquiryManageRow),
    [query.data],
  );

  return {
    data: { rows },
    status: {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch: applyDraftKeyword,
      handleReset: resetKeywords,
    },
    uiProps: { draftKeyword },
  };
}