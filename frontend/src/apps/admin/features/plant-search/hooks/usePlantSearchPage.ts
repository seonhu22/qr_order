/**
 * @fileoverview 사업장 조회 페이지 상태 조합 훅
 *
 * @description
 * - 검색어 draft와 실제 조회에 반영된 검색어를 분리한다.
 * - 페이지는 이 훅이 반환하는 data/status/actions/uiProps만 받아 조립한다.
 */

import { startTransition, useMemo, useState } from 'react';
import { mapToPlantSearchModel, usePlantSearchQuery } from '../api/plantSearchApi';

/**
 * 사업장 조회 화면에서 사용하는 상태와 액션을 조합한다.
 *
 * @description
 * - draftKeyword는 사용자가 입력 중인 값이다.
 * - appliedKeyword는 실제 query key와 서버 요청에 반영된 값이다.
 * - 조회 버튼을 눌렀을 때만 appliedKeyword를 바꿔, 입력 중 타이핑마다 서버 호출이 일어나지 않게 한다.
 */
export function usePlantSearchPage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const plantQuery = usePlantSearchQuery(appliedKeyword.trim());

  /**
   * 사업장 목록은 대량 데이터가 될 수 있으므로,
   * 동일한 query data 참조에 대해서는 DTO -> 화면 모델 변환을 다시 수행하지 않는다.
   */
  const rows = useMemo(
    () => (plantQuery.data ?? []).map(mapToPlantSearchModel),
    [plantQuery.data],
  );

  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  /**
   * 현재 입력값을 실제 조회 조건으로 반영한다.
   */
  const handleSearch = () => {
    startTransition(() => {
      setAppliedKeyword(draftKeyword);
    });
  };

  /**
   * 입력값과 적용된 검색 조건을 모두 초기화한다.
   */
  const handleReset = () => {
    startTransition(() => {
      setDraftKeyword('');
      setAppliedKeyword('');
    });
  };

  return {
    data: {
      rows,
    },
    status: {
      isLoading: plantQuery.isLoading,
      isFetching: plantQuery.isFetching,
      isError: plantQuery.isError,
      error: plantQuery.error,
    },
    actions: {
      handleKeywordChange,
      handleSearch,
      handleReset,
    },
    uiProps: {
      draftKeyword,
      appliedKeyword,
    },
  };
}
