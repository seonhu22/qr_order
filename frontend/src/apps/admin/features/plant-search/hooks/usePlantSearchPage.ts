/**
 * @fileoverview 사업장 조회 페이지 상태 조합 훅
 *
 * @description
 * - 검색어 draft와 실제 조회에 반영된 검색어를 분리한다.
 * - 페이지는 이 훅이 반환하는 data/status/actions/uiProps만 받아 조립한다.
 *
 * @remarks
 * 이 훅은 "조회형 화면 표준"의 기준 구현이다.
 * - API 호출/모델 변환: hook 내부
 * - UI 렌더링: page/component
 * 로 분리한다.
 */

import { useMemo } from 'react';
import { mapToPlantSearchModel, usePlantSearchQuery } from '../api/plantSearchApi';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';

/**
 * 사업장 조회 화면에서 사용하는 상태와 액션을 조합한다.
 *
 * @description
 * - draftKeyword는 사용자가 입력 중인 값이다.
 * - appliedKeyword는 실제 query key와 서버 요청에 반영된 값이다.
 * - 조회 버튼을 눌렀을 때만 appliedKeyword를 바꿔, 입력 중 타이핑마다 서버 호출이 일어나지 않게 한다.
 *
 * @returns
 * `data / status / actions / uiProps` 구조의 뷰모델
 *
 * @example
 * ```tsx
 * const { data, status, actions, uiProps } = usePlantSearchPage();
 *
 * <PlantSearchFilters
 *   draftKeyword={uiProps.draftKeyword}
 *   onKeywordChange={actions.handleKeywordChange}
 *   onSearch={actions.handleSearch}
 *   onReset={actions.handleReset}
 * />
 *
 * <PlantSearchTable
 *   rows={data.rows}
 *   isLoading={status.isLoading || status.isFetching}
 *   isError={status.isError}
 * />
 * ```
 */
export function usePlantSearchPage() {
  const {
    draftKeyword,
    appliedKeyword,
    setDraftKeyword,
    applyDraftKeyword,
    resetKeywords,
  } = useFilterKeywordState('');
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
   *
   * @description
   * `draftKeyword -> appliedKeyword` 반영만 수행하며,
   * 실제 서버 호출은 appliedKeyword가 바뀐 뒤 query 훅이 처리한다.
   */
  const handleSearch = () => {
    applyDraftKeyword();
  };

  /**
   * 입력값과 적용된 검색 조건을 모두 초기화한다.
   *
   * @description
   * 초기화 이후 query key도 빈 문자열 기준으로 바뀌므로
   * 초기 목록 조회 상태로 돌아간다.
   */
  const handleReset = () => {
    resetKeywords();
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
