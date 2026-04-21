/**
 * @fileoverview 접속정보조회 페이지 상태 훅
 *
 * @description
 * - 페이지 진입 시 기본 7일 범위로 자동 조회한다.
 * - 날짜 범위 유효성 검사: 종료 > 시작, 최대 7일 제한
 * - 마스터 행 클릭 시 해당 sysId로 디테일을 조회한다.
 */

import { useState } from 'react';
import {
  mapToAccessLogDetailRow,
  mapToAccessLogMasterRow,
  useAccessLogDetailQuery,
  useAccessLogMasterQuery,
} from '../api/accessLogApi';
import type { AccessLogMasterRow } from '../types';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** datetime-local 입력값 형식: YYYY-MM-DDTHH:MM — 현재 시각 */
function getNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 현재 시각 기준 정확히 7일 전 */
function getWeekAgoFromNow() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local 값(YYYY-MM-DDTHH:MM)을 API용 ISO 문자열로 변환한다 (초 추가). */
function toApiDatetime(value: string) {
  return value ? `${value}:00` : '';
}

const MAX_RANGE_DAYS = 7;

type SearchParams = {
  startDate: string;
  endDate: string;
  searchKeyword: string;
};

function makeDefaultSearchParams(): SearchParams {
  return {
    startDate: toApiDatetime(getWeekAgoFromNow()),
    endDate: toApiDatetime(getNow()),
    searchKeyword: '',
  };
}

export function useAccessLogPageState() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStartDate, setDraftStartDate] = useState(getWeekAgoFromNow);
  const [draftEndDate, setDraftEndDate] = useState(getNow);
  const [dateRangeError, setDateRangeError] = useState('');

  /* 페이지 진입 시 기본 7일 범위로 즉시 조회 */
  const [searchParams, setSearchParams] = useState<SearchParams>(makeDefaultSearchParams);

  const [selectedRow, setSelectedRow] = useState<AccessLogMasterRow | null>(null);

  const validateDateRange = (start: string, end: string): boolean => {
    if (!start || !end) {
      setDateRangeError('시작일시와 종료일시를 모두 입력해주세요.');
      return false;
    }
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (endMs < startMs) {
      setDateRangeError('종료일시는 시작일시보다 이후여야 합니다.');
      return false;
    }
    const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
      setDateRangeError(`조회 기간은 최대 ${MAX_RANGE_DAYS}일까지 설정할 수 있습니다.`);
      return false;
    }
    setDateRangeError('');
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
    searchKeyword: searchParams.searchKeyword || undefined,
  });

  const detailQuery = useAccessLogDetailQuery(selectedRow?.sysId ?? '');

  const masterRows = (masterQuery.data ?? []).map(mapToAccessLogMasterRow);
  const detailRows = (detailQuery.data ?? []).map((item, idx) =>
    mapToAccessLogDetailRow(item, idx),
  );

  const handleSearch = () => {
    if (!validateDateRange(draftStartDate, draftEndDate)) return;
    setSearchParams({
      startDate: toApiDatetime(draftStartDate),
      endDate: toApiDatetime(draftEndDate),
      searchKeyword: draftKeyword,
    });
    setSelectedRow(null);
  };

  const handleReset = () => {
    const defaultStart = getWeekAgoFromNow();
    const defaultEnd = getNow();
    setDraftKeyword('');
    setDraftStartDate(defaultStart);
    setDraftEndDate(defaultEnd);
    setDateRangeError('');
    setSearchParams({
      startDate: toApiDatetime(defaultStart),
      endDate: toApiDatetime(defaultEnd),
      searchKeyword: '',
    });
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