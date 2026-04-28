import { useGetAuditTrail } from '@/generated/settings-controller/settings-controller';
import type { AuditTrail } from '@/generated/types/auditTrail';
import { queryKeys } from '@/shared/api/queryKeys';
import type { QueryDateRangeParams } from '@/shared/utils/queryDateRange';
import type { ChangeHistoryRow } from '../types';

export function mapToChangeHistoryRow(item: AuditTrail, index: number): ChangeHistoryRow {
  return {
    id: `change-${index}-${item.insertDatetime ?? ''}`,
    auditFlag: item.auditFlag ?? '',
    menuNm: item.menuNm ?? '',
    auditTrailContents: item.auditTrailContents ?? '',
    insertDatetime: item.insertDatetime ?? '',
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
