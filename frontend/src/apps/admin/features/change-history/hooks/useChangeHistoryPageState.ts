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
} from '@/shared/utils/queryDateRange';
import { useQueryDateRangeDraft } from '@/shared/hooks/useQueryDateRangeDraft';
import { areQueryParamsEqual } from '@/shared/utils/queryParams';

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
  const [draftAuditFlag, setDraftAuditFlag] = useState('ALL');
  const [draftKeyword, setDraftKeyword] = useState('');
  const {
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  } = useQueryDateRangeDraft();

  const [searchParams, setSearchParams] = useState(() =>
    createChangeHistorySearchParams(draftStartDate, draftEndDate),
  );

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
    if (!validateDraftDateRange()) return;
    const nextParams = createChangeHistorySearchParams(
      draftStartDate,
      draftEndDate,
      draftKeyword,
      draftAuditFlag,
    );
    if (areQueryParamsEqual(nextParams, searchParams)) {
      void query.refetch();
    } else {
      setSearchParams(nextParams);
    }
  };

  const handleReset = () => {
    setDraftAuditFlag('ALL');
    setDraftKeyword('');
    resetDraftDateRange();
    const nextDefaultDateRange = createDefaultQueryDateRangeDraft();
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
      handleStartDateChange,
      handleEndDateChange,
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
