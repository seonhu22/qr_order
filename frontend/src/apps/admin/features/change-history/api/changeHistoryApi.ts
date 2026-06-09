import { useGetAuditTrail } from '@/generated/settings-controller/settings-controller';
import type { AuditTrail } from '@/generated/types/auditTrail';
import type { GetAuditTrailParams } from '@/generated/types/getAuditTrailParams';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import type { QueryDateRangeParams } from '@/shared/utils/queryDateRange';
import type { ChangeHistoryRow } from '../types';

export type ChangeHistoryQueryParams = QueryDateRangeParams & {
  auditFlag: string;
  changeType: string;
};

type GetAuditTrailParamsWithChangeType = GetAuditTrailParams & {
  changeType: string;
};

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
    insertDatetime: formatDateTimeForDisplay(item.insertDatetime),
  };
}

export function useChangeHistoryQuery(params: ChangeHistoryQueryParams) {
  const { startDate, endDate, searchKeyword, changeType } = params;
  const queryParams: GetAuditTrailParamsWithChangeType = {
    startDate,
    endDate,
    changeType,
    ...(searchKeyword ? { searchKeyword } : {}),
  };

  return useGetAuditTrail(queryParams, {
    query: {
      queryKey: queryKeys.changeHistory.list(params),
      enabled: Boolean(startDate && endDate),
    },
  });
}
