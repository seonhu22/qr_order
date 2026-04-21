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
import type { AccessLogDetailRow, AccessLogMasterRow } from '../types';

export function mapToAccessLogMasterRow(master: SysAccessLogMaster): AccessLogMasterRow {
  return {
    id: master.sysId ?? '',
    sysId: master.sysId ?? '',
    userId: master.userId ?? '',
    userNm: master.userNm ?? '',
    ipAddress: master.ipAddress ?? '',
    loginDatetime: master.loginDatetime ?? '',
    logoutDatetime: master.logoutDatetime ?? '',
  };
}

export function mapToAccessLogDetailRow(
  detail: SysAccessLogDetail & { menuNm?: string },
  index: number,
): AccessLogDetailRow {
  return {
    id: `detail-${index}-${detail.menuCd ?? ''}`,
    menuCd: detail.menuCd ?? '',
    menuNm: detail.menuNm ?? '',
    menuOpenDatetime: detail.menuOpenDatetime ?? '',
    menuCloseDatetime: detail.menuCloseDatetime ?? '',
  };
}

export function useAccessLogMasterQuery(params: {
  startDate: string;
  endDate: string;
  searchKeyword?: string;
}) {
  const { startDate, endDate, searchKeyword } = params;
  const queryParams = searchKeyword
    ? { startDate, endDate, searchKeyword }
    : { startDate, endDate };

  return useGetSysAccessLogMaster(queryParams, {
    query: {
      queryKey: queryKeys.accessLog.masters(params),
      enabled: Boolean(startDate && endDate),
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
      },
    },
  );
}