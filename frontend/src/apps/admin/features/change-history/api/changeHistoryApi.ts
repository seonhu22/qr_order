import { useGetAuditTrail } from '@/generated/settings-controller/settings-controller';
import type { AuditTrail } from '@/generated/types/auditTrail';
import { queryKeys } from '@/shared/api/queryKeys';
import type { QueryDateRangeParams } from '@/shared/utils/queryDateRange';
import type { ChangeHistoryRow } from '../types';
import type { QueryDateRangeParams } from '@/shared/utils/queryDateRange';

function getSafeText(value?: string) {
  return value ?? '';
}

function createChangeHistoryRowId(item: AuditTrail, index: number) {
  const insertDatetime = getSafeText(item.insertDatetime);
  const auditFlag = getSafeText(item.auditFlag);
  const menuNameOrCode = getSafeText(item.menuNm || item.menuCd);

  return `change-${insertDatetime}-${auditFlag}-${menuNameOrCode || index}`;
}

export function mapToChangeHistoryRow(item: AuditTrail, index: number): ChangeHistoryRow {
  return {
    id: createChangeHistoryRowId(item, index),
    auditFlag: getSafeText(item.auditFlag),
    menuNm: getSafeText(item.menuNm),
    auditTrailContents: getSafeText(item.auditTrailContents),
    insertDatetime: getSafeText(item.insertDatetime),
  };
}

export function useChangeHistoryQuery(params: QueryDateRangeParams) {
  const { startDate, endDate, searchKeyword } = params;
  const queryParams = searchKeyword
    ? { startDate, endDate, searchKeyword }
    : { startDate, endDate };

  return useGetAuditTrail(queryParams, {
    query: {
      queryKey: queryKeys.changeHistory.list(params),
      enabled: Boolean(startDate && endDate),
    },
  });
}
