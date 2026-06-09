import { useMemo, useState } from 'react';
import { mapToChangeHistoryRow, useChangeHistoryQuery } from '../api/changeHistoryApi';
import { resolveMenuDisplayName } from '@/shared/menu/menuCatalog';
import { useAdminMenuCatalogQuery } from '@/shared/menu/useAdminMenuCatalogQuery';
import {
  getChangeTypeByAuditFlag,
  shouldFilterAuditFlagOnClient,
} from '../constants/changeHistoryAuditFlag';
import {
  createDefaultQueryDateRangeDraft,
  createQueryDateRangeParams,
  validateQueryDateRange,
} from '@/shared/utils/queryDateRange';

function createChangeHistorySearchParams(
  startDate: string,
  endDate: string,
  searchKeyword = '',
  auditFlag = 'ALL',
) {
  return {
    ...createQueryDateRangeParams(startDate, endDate, searchKeyword),
    auditFlag,
    changeType: getChangeTypeByAuditFlag(auditFlag),
  };
}

export function useChangeHistoryPageState() {
  const defaultDateRange = useMemo(() => createDefaultQueryDateRangeDraft(), []);
  const [draftAuditFlag, setDraftAuditFlag] = useState('ALL');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStartDate, setDraftStartDate] = useState(defaultDateRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(defaultDateRange.endDate);
  const [dateRangeError, setDateRangeError] = useState('');

  const [searchParams, setSearchParams] = useState(() =>
    createChangeHistorySearchParams(defaultDateRange.startDate, defaultDateRange.endDate),
  );

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
    auditFlag: searchParams.auditFlag,
    changeType: searchParams.changeType,
  });
  const { catalog } = useAdminMenuCatalogQuery();

  const allRows = useMemo(
    () =>
      (query.data ?? []).map((item, index) => {
        const row = mapToChangeHistoryRow(item, index);

        return {
          ...row,
          menuNm: resolveMenuDisplayName(catalog, item.menuCd, row.menuNm),
        };
      }),
    [catalog, query.data],
  );

  const rows = useMemo(
    () =>
      shouldFilterAuditFlagOnClient(searchParams.auditFlag)
        ? allRows.filter((row) => row.auditFlag === searchParams.auditFlag)
        : allRows,
    [allRows, searchParams.auditFlag],
  );

  const handleSearch = () => {
    if (!validateDateRange(draftStartDate, draftEndDate)) return;
    setSearchParams(
      createChangeHistorySearchParams(
        draftStartDate,
        draftEndDate,
        draftKeyword,
        draftAuditFlag,
      ),
    );
  };

  const handleReset = () => {
    const nextDefaultDateRange = createDefaultQueryDateRangeDraft();
    setDraftAuditFlag('ALL');
    setDraftKeyword('');
    setDraftStartDate(nextDefaultDateRange.startDate);
    setDraftEndDate(nextDefaultDateRange.endDate);
    setDateRangeError('');
    setSearchParams(
      createChangeHistorySearchParams(nextDefaultDateRange.startDate, nextDefaultDateRange.endDate),
    );
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
