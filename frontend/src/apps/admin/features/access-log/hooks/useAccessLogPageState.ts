/**
 * @fileoverview 접속정보조회 페이지 상태 훅
 *
 * @description
 * - 페이지 진입 시 기본 7일 범위로 자동 조회한다.
 * - 날짜 범위 유효성 검사: 종료 > 시작, 최대 7일 제한
 * - 마스터 행 클릭 시 해당 sysId로 디테일을 조회한다.
 */

import { useMemo, useState } from 'react';
import {
  mapToAccessLogDetailRow,
  mapToAccessLogMasterRow,
  useAccessLogDetailQuery,
  useAccessLogMasterQuery,
} from '../api/accessLogApi';
import type { AccessLogMasterRow } from '../types';
import {
  createDefaultAccessLogDateRangeDraft,
  createDefaultAccessLogSearchParams,
  createAccessLogSearchParams,
  validateAccessLogDateRange,
} from '../utils/accessLogDateUtils';

export function useAccessLogPageState() {
  const defaultDateRange = useMemo(() => createDefaultAccessLogDateRangeDraft(), []);
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStartDate, setDraftStartDate] = useState(defaultDateRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(defaultDateRange.endDate);
  const [dateRangeError, setDateRangeError] = useState('');

  /* 페이지 진입 시 기본 7일 범위로 즉시 조회 */
  const [searchParams, setSearchParams] = useState(createDefaultAccessLogSearchParams);

  const [selectedRow, setSelectedRow] = useState<AccessLogMasterRow | null>(null);

  const validateDateRange = (start: string, end: string): boolean => {
    const nextError = validateAccessLogDateRange(start, end);
    setDateRangeError(nextError);

    if (nextError) {
      return false;
    }

    return true;
  };

  const handleStartDateChange = (value: string) => {
    setDraftStartDate(value);
    if (value && draftEndDate) validateDateRange(value, draftEndDate);
  };

  const handleEndDateChange = (value: string) => {
    setDraftEndDate(value);
    if (draftStartDate) validateDateRange(draftStartDate, value);
  };

  const masterQuery = useAccessLogMasterQuery({
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    searchKeyword: searchParams.searchKeyword,
  });

  const detailQuery = useAccessLogDetailQuery(selectedRow?.sysId ?? '');

  const masterRows = useMemo(
    () => (masterQuery.data ?? []).map(mapToAccessLogMasterRow),
    [masterQuery.data],
  );
  const detailRows = useMemo(
    () => (detailQuery.data ?? []).map((item, idx) => mapToAccessLogDetailRow(item, idx)),
    [detailQuery.data],
  );

  const handleSearch = () => {
    if (!validateDateRange(draftStartDate, draftEndDate)) return;
    setSearchParams(createAccessLogSearchParams(draftStartDate, draftEndDate, draftKeyword));
    setSelectedRow(null);
  };

  const handleReset = () => {
    const nextDefaultDateRange = createDefaultAccessLogDateRangeDraft();
    setDraftKeyword('');
    setDraftStartDate(nextDefaultDateRange.startDate);
    setDraftEndDate(nextDefaultDateRange.endDate);
    setDateRangeError('');
    setSearchParams(createDefaultAccessLogSearchParams());
    setSelectedRow(null);
  };

  const handleSelectRow = (row: AccessLogMasterRow) => {
    setSelectedRow((prev) => (prev?.id === row.id ? null : row));
  };

  return {
    data: { masterRows, detailRows, selectedRow },
    status: {
      isLoadingMasters: masterQuery.isLoading,
      isErrorMasters: masterQuery.isError,
      isLoadingDetails: detailQuery.isLoading,
      isErrorDetails: detailQuery.isError,
    },
    actions: {
      handleSearch,
      handleReset,
      handleSelectRow,
      handleKeywordChange: setDraftKeyword,
      handleStartDateChange,
      handleEndDateChange,
    },
    uiProps: {
      draftKeyword,
      draftStartDate,
      draftEndDate,
      dateRangeError,
      selectedId: selectedRow?.id ?? '',
      hasSelected: selectedRow !== null,
    },
  };
}
