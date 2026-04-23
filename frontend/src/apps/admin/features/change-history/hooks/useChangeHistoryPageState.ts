import { useState } from 'react';
import { mapToChangeHistoryRow, useChangeHistoryQuery } from '../api/changeHistoryApi';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getWeekAgoFromNow() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

export function useChangeHistoryPageState() {
  const [draftAuditFlag, setDraftAuditFlag] = useState('ALL');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStartDate, setDraftStartDate] = useState(getWeekAgoFromNow);
  const [draftEndDate, setDraftEndDate] = useState(getNow);
  const [dateRangeError, setDateRangeError] = useState('');

  const [searchParams, setSearchParams] = useState<SearchParams>(makeDefaultSearchParams);

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

  const query = useChangeHistoryQuery({
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    searchKeyword: searchParams.searchKeyword || undefined,
  });

  const allRows = (query.data ?? []).map(mapToChangeHistoryRow);

  const rows =
    draftAuditFlag && draftAuditFlag !== 'ALL'
      ? allRows.filter((r) => r.auditFlag === draftAuditFlag)
      : allRows;

  const handleSearch = () => {
    if (!validateDateRange(draftStartDate, draftEndDate)) return;
    setSearchParams({
      startDate: toApiDatetime(draftStartDate),
      endDate: toApiDatetime(draftEndDate),
      searchKeyword: draftKeyword,
    });
  };

  const handleReset = () => {
    const defaultStart = getWeekAgoFromNow();
    const defaultEnd = getNow();
    setDraftAuditFlag('ALL');
    setDraftKeyword('');
    setDraftStartDate(defaultStart);
    setDraftEndDate(defaultEnd);
    setDateRangeError('');
    setSearchParams({
      startDate: toApiDatetime(defaultStart),
      endDate: toApiDatetime(defaultEnd),
      searchKeyword: '',
    });
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
      handleAuditFlagChange: setDraftAuditFlag,
      handleStartDateChange: (value: string) => {
        setDraftStartDate(value);
        if (value && draftEndDate) validateDateRange(value, draftEndDate);
      },
      handleEndDateChange: (value: string) => {
        setDraftEndDate(value);
        if (draftStartDate) validateDateRange(draftStartDate, value);
      },
    },
    uiProps: {
      draftAuditFlag,
      draftKeyword,
      draftStartDate,
      draftEndDate,
      dateRangeError,
    },
  };
}
