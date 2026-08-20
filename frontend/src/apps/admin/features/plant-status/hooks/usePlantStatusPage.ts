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

  const handleSearch = () => {
    if (!draftKeyword.trim()) return;
    applyDraftKeyword();
  };

  const handleReset = () => {
    resetKeywords();
  };

  return {
    data: { rows },
    status: {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch,
      handleReset,
    },
    uiProps: {
      draftKeyword,
      emptyMessage: '조회 결과가 없습니다.',
    },
  };
}