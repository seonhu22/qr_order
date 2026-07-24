/**
 * @fileoverview 정산 조회 페이지 상태 훅
 *
 * @description
 * - 페이지 진입 시 기본 7일 범위(이번 주 프리셋)로 자동 조회한다.
 * - 키워드/상태 필터 없이 날짜range+프리셋만 사용한다(다른 화면과 다른 점).
 */

import { useMemo, useState } from 'react';
import { createDefaultQueryDateRangeDraft, toQueryDateParam } from '@/shared/utils/queryDateRange';
import { useDateRangePresetDraft } from '@/shared/hooks/useDateRangePresetDraft';
import { mapToSettlementRow, mapToSettlementSummary, useSettlementQuery } from '../api/settlementApi';
import type { SettlementSearchParams } from '../types';

const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 365;

function createSearchParams(startDate: string, endDate: string): SettlementSearchParams {
  return {
    startDate: toQueryDateParam(startDate),
    endDate: toQueryDateParam(endDate),
  };
}

/** draft 상태와 별개로 기본 7일 범위를 매번 새로 계산한다(리셋 시 stale closure 방지). */
function createDefaultSearchParams(): SettlementSearchParams {
  const { startDate, endDate } = createDefaultQueryDateRangeDraft(DEFAULT_RANGE_DAYS);
  return createSearchParams(startDate, endDate);
}

export function useSettlementPageState() {
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
  } = useDateRangePresetDraft({ defaultRangeDays: DEFAULT_RANGE_DAYS, maxRangeDays: MAX_RANGE_DAYS });

  const [searchParams, setSearchParams] = useState(createDefaultSearchParams);

  const query = useSettlementQuery(searchParams);

  const summary = useMemo(() => (query.data ? mapToSettlementSummary(query.data) : null), [query.data]);
  const rows = useMemo(
    () => (query.data?.dailySales ?? []).map((item, index) => mapToSettlementRow(item, index)),
    [query.data],
  );

  const handleSearch = () => {
    if (!validateDraftDateRange()) return;
    setSearchParams(createSearchParams(draftStartDate, draftEndDate));
    setHasSearched(true);
  };

  const handleReset = () => {
    resetDraftDateRange();
    setSearchParams(createDefaultSearchParams());
    setHasSearched(false);
  };

  return {
    data: { summary, rows },
    status: {
      isLoading: query.isLoading,
      isError: query.isError,
    },
    actions: {
      handleSearch,
      handleReset,
      handlePresetChange,
      handleStartDateChange,
      handleEndDateChange,
    },
    uiProps: {
      draftPreset,
      draftStartDate,
      draftEndDate,
      dateRangeError,
      emptyMessage: hasSearched ? '조회 결과가 없습니다.' : '데이터가 없습니다.',
    },
  };
}
