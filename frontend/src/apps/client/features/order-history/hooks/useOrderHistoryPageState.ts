/**
 * @fileoverview 주문 이력 조회 페이지 상태 훅
 *
 * @description
 * - 페이지 진입 시 기본 7일 범위(이번 주 프리셋)로 자동 조회한다.
 * - 날짜 범위 유효성 검사: 종료 > 시작, 최대 365일 제한
 * - 검색 전/후 빈 결과 문구를 `hasSearched`로 구분한다.
 * - 주문상태 필터 콤보는 `ALL`(전체)을 검색 파라미터의 빈 문자열로 변환해 전달한다.
 */

import { useMemo, useState } from 'react';
import { createDefaultQueryDateRangeDraft, toQueryDateParam } from '@/shared/utils/queryDateRange';
import { areQueryParamsEqual } from '@/shared/utils/queryParams';
import { useOrderHistoryQuery } from '../api/orderHistoryApi';
import {
  ORDER_HISTORY_DEFAULT_RANGE_DAYS,
  useOrderHistoryDateRangeDraft,
} from './useOrderHistoryDateRangeDraft';
import type { OrderHistorySearchParams, OrderHistoryStatusFilterKey } from '../types';

function createSearchParams(
  startDate: string,
  endDate: string,
  searchKeyword: string,
  orderStatus: OrderHistoryStatusFilterKey,
): OrderHistorySearchParams {
  return {
    startDate: toQueryDateParam(startDate),
    endDate: toQueryDateParam(endDate),
    searchKeyword,
    orderStatus: orderStatus === 'ALL' ? '' : orderStatus,
  };
}

/** draft 상태와 별개로 기본 7일 범위를 매번 새로 계산한다(초기 조회·리셋 시 stale closure 방지). */
function createDefaultSearchParams(): OrderHistorySearchParams {
  const { startDate, endDate } = createDefaultQueryDateRangeDraft(ORDER_HISTORY_DEFAULT_RANGE_DAYS);
  return createSearchParams(startDate, endDate, '', 'ALL');
}

export function useOrderHistoryPageState() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftOrderStatus, setDraftOrderStatus] = useState<OrderHistoryStatusFilterKey>('ALL');
  const [hasSearched, setHasSearched] = useState(false);
  const {
    draftPreset,
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handlePresetChange,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  } = useOrderHistoryDateRangeDraft();

  const [searchParams, setSearchParams] = useState(createDefaultSearchParams);

  const query = useOrderHistoryQuery(searchParams);
  const rows = useMemo(() => query.data ?? [], [query.data]);

  const handleSearch = () => {
    if (!validateDraftDateRange()) return;

    const nextParams = createSearchParams(draftStartDate, draftEndDate, draftKeyword, draftOrderStatus);
    if (areQueryParamsEqual(nextParams, searchParams)) {
      void query.refetch();
    } else {
      setSearchParams(nextParams);
    }
    setHasSearched(true);
  };

  const handleReset = () => {
    setDraftKeyword('');
    setDraftOrderStatus('ALL');
    resetDraftDateRange();
    setSearchParams(createDefaultSearchParams());
    setHasSearched(false);
  };

  return {
    data: { rows },
    status: {
      isLoading: query.isLoading,
      isError: query.isError,
    },
    actions: {
      handleSearch,
      handleReset,
      handleKeywordChange: setDraftKeyword,
      handleOrderStatusChange: setDraftOrderStatus,
      handlePresetChange,
      handleStartDateChange,
      handleEndDateChange,
    },
    uiProps: {
      draftKeyword,
      draftOrderStatus,
      draftPreset,
      draftStartDate,
      draftEndDate,
      dateRangeError,
      emptyMessage: hasSearched ? '조회 결과가 없습니다.' : '데이터가 없습니다.',
    },
  };
}
