/**
 * @fileoverview 결제 목록 조회 페이지 상태 훅
 *
 * @description
 * - 페이지 진입 시 기본 7일 범위(이번 주 프리셋)로 자동 조회한다.
 * - 서버에는 결제상태·날짜range만 보낸다(API에 키워드 검색 파라미터가 없음).
 *   키워드는 fetch된 마스터 행을 주문번호 기준으로 클라이언트에서 후필터링한다.
 * - 마스터 행 클릭 시 해당 sysId로 디테일을 조회한다. 같은 행 재클릭 시 선택 해제.
 */

import { useMemo, useState } from 'react';
import { createDefaultQueryDateRangeDraft, toQueryDateParam } from '@/shared/utils/queryDateRange';
import { useDateRangePresetDraft } from '@/shared/hooks/useDateRangePresetDraft';
import {
  mapToPaymentStatusDetail,
  mapToPaymentStatusMasterRow,
  usePaymentStatusDetailQuery,
  usePaymentStatusMasterQuery,
} from '../api/paymentStatusApi';
import type { PaymentStatusFilterKey, PaymentStatusMasterRow, PaymentStatusSearchParams } from '../types';

const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 365;

function createSearchParams(
  startDate: string,
  endDate: string,
  paymentStatus: PaymentStatusFilterKey,
): PaymentStatusSearchParams {
  return {
    startDate: toQueryDateParam(startDate),
    endDate: toQueryDateParam(endDate),
    paymentStatus: paymentStatus === 'ALL' ? '' : paymentStatus,
  };
}

/** draft 상태와 별개로 기본 7일 범위를 매번 새로 계산한다(리셋 시 stale closure 방지). */
function createDefaultSearchParams(): PaymentStatusSearchParams {
  const { startDate, endDate } = createDefaultQueryDateRangeDraft(DEFAULT_RANGE_DAYS);
  return createSearchParams(startDate, endDate, 'ALL');
}

export function usePaymentStatusPageState() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<PaymentStatusFilterKey>('ALL');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PaymentStatusMasterRow | null>(null);

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
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const masterQuery = usePaymentStatusMasterQuery(searchParams);
  const detailQuery = usePaymentStatusDetailQuery(selectedRow?.id ?? '');

  const masterRows = useMemo(
    () => (masterQuery.data ?? []).map(mapToPaymentStatusMasterRow),
    [masterQuery.data],
  );

  const rows = useMemo(() => {
    const keyword = appliedKeyword.trim();
    if (!keyword) return masterRows;
    return masterRows.filter((row) => row.orderNo.includes(keyword));
  }, [appliedKeyword, masterRows]);

  const detail = useMemo(() => mapToPaymentStatusDetail(detailQuery.data ?? []), [detailQuery.data]);

  const handleSearch = () => {
    if (!validateDraftDateRange()) return;

    setSearchParams(createSearchParams(draftStartDate, draftEndDate, draftPaymentStatus));
    setAppliedKeyword(draftKeyword);
    setSelectedRow(null);
    setHasSearched(true);
  };

  const handleReset = () => {
    setDraftKeyword('');
    setDraftPaymentStatus('ALL');
    resetDraftDateRange();
    setSearchParams(createDefaultSearchParams());
    setAppliedKeyword('');
    setSelectedRow(null);
    setHasSearched(false);
  };

  const handleSelectRow = (row: PaymentStatusMasterRow) => {
    setSelectedRow((prev) => (prev?.id === row.id ? null : row));
  };

  return {
    data: { rows, detail },
    status: {
      isLoadingMaster: masterQuery.isLoading,
      isErrorMaster: masterQuery.isError,
      isLoadingDetail: detailQuery.isLoading,
      isErrorDetail: detailQuery.isError,
    },
    actions: {
      handleSearch,
      handleReset,
      handleSelectRow,
      handleKeywordChange: setDraftKeyword,
      handlePaymentStatusChange: setDraftPaymentStatus,
      handlePresetChange,
      handleStartDateChange,
      handleEndDateChange,
    },
    uiProps: {
      draftKeyword,
      draftPaymentStatus,
      draftPreset,
      draftStartDate,
      draftEndDate,
      dateRangeError,
      selectedId: selectedRow?.id ?? '',
      hasSelection: selectedRow !== null,
      emptyMessage: hasSearched ? '조회 결과가 없습니다.' : '데이터가 없습니다.',
    },
  };
}
