import { useMemo, useState } from 'react';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { mapToPlantStatusRow, usePlantStatusQuery } from '../api/plantStatusApi';

export function usePlantStatusPage() {
  const [hasSearched, setHasSearched] = useState(false);
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');

  const query = usePlantStatusQuery(appliedKeyword.trim(), hasSearched);

  const rows = useMemo(
    () => (query.data ?? []).map(mapToPlantStatusRow),
    [query.data],
  );

  const handleSearch = () => {
    if (!draftKeyword.trim()) return;
    setHasSearched(true);
    applyDraftKeyword();
  };

  const handleReset = () => {
    setHasSearched(false);
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
      emptyMessage: hasSearched ? '조회 결과가 없습니다.' : '데이터가 없습니다.',
    },
  };
}