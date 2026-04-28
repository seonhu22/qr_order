import { useMemo, useState } from 'react';
import { mapToChangeHistoryRow, useChangeHistoryQuery } from '../api/changeHistoryApi';
import {
  createDefaultQueryDateRangeDraft,
  createDefaultQueryDateRangeParams,
  createQueryDateRangeParams,
  validateQueryDateRange,
} from '@/shared/utils/queryDateRange';

export function useChangeHistoryPageState() {
  const defaultDateRange = useMemo(() => createDefaultQueryDateRangeDraft(), []);
  const [draftAuditFlag, setDraftAuditFlag] = useState('ALL');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStartDate, setDraftStartDate] = useState(defaultDateRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(defaultDateRange.endDate);
  const [dateRangeError, setDateRangeError] = useState('');

  const [searchParams, setSearchParams] = useState(createDefaultQueryDateRangeParams);

  const validateDateRange = (start: string, end: string): boolean => {
    const nextError = validateQueryDateRange(start, end);
    setDateRangeError(nextError);

    if (nextError) {
      return false;
    }

    return true;
  };

  const query = useChangeHistoryQuery({
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    searchKeyword: searchParams.searchKeyword,
  });

  const allRows = useMemo(() => (query.data ?? []).map(mapToChangeHistoryRow), [query.data]);

  const rows = useMemo(
    () =>
      draftAuditFlag && draftAuditFlag !== 'ALL'
        ? allRows.filter((row) => row.auditFlag === draftAuditFlag)
        : allRows,
    [allRows, draftAuditFlag],
  );

  const handleSearch = () => {
    if (!validateDateRange(draftStartDate, draftEndDate)) return;
    setSearchParams(createQueryDateRangeParams(draftStartDate, draftEndDate, draftKeyword));
  };

  const handleReset = () => {
    const nextDefaultDateRange = createDefaultQueryDateRangeDraft();
    setDraftAuditFlag('ALL');
    setDraftKeyword('');
    setDraftStartDate(nextDefaultDateRange.startDate);
    setDraftEndDate(nextDefaultDateRange.endDate);
    setDateRangeError('');
    setSearchParams(createDefaultQueryDateRangeParams());
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
