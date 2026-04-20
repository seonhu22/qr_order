import { useMemo } from 'react';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { mapToPlantStatusRow, usePlantStatusQuery } from '../api/plantStatusApi';

export function usePlantStatusPage() {
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');

  const query = usePlantStatusQuery(appliedKeyword.trim());

  const rows = useMemo(
    () => (query.data ?? []).map(mapToPlantStatusRow),
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