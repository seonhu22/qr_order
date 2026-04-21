import { useState } from 'react';
import { mapToChangeHistoryRow, useChangeHistoryQuery } from '../api/changeHistoryApi';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getMonthAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type SearchParams = {
  startDate: string;
  endDate: string;
  searchKeyword: string;
};

function makeDefaultSearchParams(): SearchParams {
  return {
    startDate: getMonthAgo(),
    endDate: getToday(),
    searchKeyword: '',
  };
}

export function useChangeHistoryPageState() {
  const [draftAuditFlag, setDraftAuditFlag] = useState('ALL');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStartDate, setDraftStartDate] = useState(getMonthAgo);
  const [draftEndDate, setDraftEndDate] = useState(getToday);
  const [dateRangeError, setDateRangeError] = useState('');

  const [searchParams, setSearchParams] = useState<SearchParams>(makeDefaultSearchParams);

  const validateDateRange = (start: string, end: string): boolean => {
    if (!start || !end) {
      setDateRangeError('시작일과 종료일을 모두 입력해주세요.');
      return false;
    }
    if (new Date(end) < new Date(start)) {
      setDateRangeError('종료일은 시작일보다 이후여야 합니다.');
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
      startDate: draftStartDate,
      endDate: draftEndDate,
      searchKeyword: draftKeyword,
    });
  };

  const handleReset = () => {
    const defaultStart = getMonthAgo();
    const defaultEnd = getToday();
    setDraftAuditFlag('ALL');
    setDraftKeyword('');
    setDraftStartDate(defaultStart);
    setDraftEndDate(defaultEnd);
    setDateRangeError('');
    setSearchParams({
      startDate: defaultStart,
      endDate: defaultEnd,
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
