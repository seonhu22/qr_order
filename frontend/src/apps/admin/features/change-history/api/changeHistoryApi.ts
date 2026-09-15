import { useGetAuditTrail } from '@/generated/settings-controller/settings-controller';
import type { AuditTrail } from '@/generated/types/auditTrail';
import type { GetAuditTrailParams } from '@/generated/types/getAuditTrailParams';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import type { ChangeHistoryRow } from '../types';

type AuditTrailWithUserNames = AuditTrail & {
  insertUserNm?: string;
  modifyUserNm?: string;
};

export type ChangeHistoryQueryParams = GetAuditTrailParams & {
  auditFlag: string;
};

function getSafeText(value?: string) {
  return value ?? '';
}

function createChangeHistoryRowId(item: AuditTrailWithUserNames, index: number) {
  const insertDatetime = getSafeText(item.insertDatetime);
  const auditFlag = getSafeText(item.auditFlag);
  const menuNameOrCode = getSafeText(item.menuNm || item.menuCd);

  return `change-${insertDatetime}-${auditFlag}-${menuNameOrCode}-${index}`;
}

export function mapToChangeHistoryRow(item: AuditTrailWithUserNames, index: number): ChangeHistoryRow {
  return {
    id: createChangeHistoryRowId(item, index),
    auditFlag: getSafeText(item.auditFlag),
    menuNm: getSafeText(item.menuNm),
    auditTrailContents: getSafeText(item.auditTrailContents),
    insertUserNm: getSafeText(item.insertUserNm),
    modifyUserNm: getSafeText(item.modifyUserNm),
    insertDatetime: formatDateTimeForDisplay(item.insertDatetime),
  };
}

export function useChangeHistoryQuery(params: ChangeHistoryQueryParams) {
  const { startDate, endDate, searchKeyword, changeType } = params;
  const queryParams: GetAuditTrailParams = {
    startDate,
    endDate,
    changeType,
    ...(searchKeyword ? { searchKeyword } : {}),
  };

  return useGetAuditTrail(queryParams, {
    query: {
      queryKey: queryKeys.changeHistory.list(params),
      enabled: Boolean(startDate && endDate),
      ...queryPolicies.searchResult,
    },
  });
}
