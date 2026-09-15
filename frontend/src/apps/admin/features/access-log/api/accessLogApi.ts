/**
 * @fileoverview 접속정보조회 feature의 서버 연동 계층
 */

import {
  useGetSysAccessLogDetail,
  useGetSysAccessLogMaster,
} from '@/generated/settings-controller/settings-controller';
import type { SysAccessLogDetail } from '@/generated/types/sysAccessLogDetail';
import type { SysAccessLogMaster } from '@/generated/types/sysAccessLogMaster';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import type { QueryDateRangeParams } from '@/shared/utils/queryDateRange';
import type { AccessLogDetailRow, AccessLogMasterRow } from '../types';

function getSafeText(value?: string) {
  return value ?? '';
}

function createAccessLogDetailId(detail: SysAccessLogDetail, index: number) {
  return `detail-${index}-${detail.menuCd ?? ''}-${detail.menuOpenDatetime ?? ''}`;
}

export function mapToAccessLogMasterRow(master: SysAccessLogMaster): AccessLogMasterRow {
  return {
    id: getSafeText(master.sysId),
    sysId: getSafeText(master.sysId),
    userId: getSafeText(master.userId),
    userNm: getSafeText(master.userNm),
    ipAddress: getSafeText(master.ipAddress),
    loginDatetime: formatDateTimeForDisplay(master.loginDatetime),
    logoutDatetime: formatDateTimeForDisplay(master.logoutDatetime),
  };
}

export function mapToAccessLogDetailRow(
  detail: SysAccessLogDetail,
  index: number,
): AccessLogDetailRow {
  const menuCd = getSafeText(detail.menuCd);

  return {
    id: createAccessLogDetailId(detail, index),
    menuCd,
    menuNm: menuCd,
    menuOpenDatetime: formatDateTimeForDisplay(detail.menuOpenDatetime),
    menuCloseDatetime: formatDateTimeForDisplay(detail.menuCloseDatetime),
  };
}

export function useAccessLogMasterQuery(params: QueryDateRangeParams) {
  const { startDate, endDate, searchKeyword } = params;
  const queryParams = searchKeyword
    ? { startDate, endDate, searchKeyword }
    : { startDate, endDate };

  return useGetSysAccessLogMaster(queryParams, {
    query: {
      queryKey: queryKeys.accessLog.masters(params),
      enabled: Boolean(startDate && endDate),
      ...queryPolicies.searchResult,
    },
  });
}

export function useAccessLogDetailQuery(sysId: string) {
  return useGetSysAccessLogDetail(
    { sysId },
    {
      query: {
        queryKey: queryKeys.accessLog.details(sysId),
        enabled: Boolean(sysId),
        ...queryPolicies.searchResult,
      },
    },
  );
}
