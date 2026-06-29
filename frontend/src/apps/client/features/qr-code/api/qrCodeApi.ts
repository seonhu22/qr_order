/**
 * @fileoverview QR 코드 관리 feature의 서버 연동 계층
 *
 * @description
 * 백엔드 API 명세가 아직 없어 generated 코드 대신 httpClient를 직접 호출한다.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { httpClient } from '@/shared/lib/httpClient';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { QrCodeRow } from '../types';

export type QrCodeItem = {
  sysId?: string;
  linkSysId?: string;
  tableNum?: number;
  description?: string;
  url?: string;
  useYn?: string;
};

export type QrCodeResponse = QrCodeItem;

export type QrCodeRequest = {
  newItems?: QrCodeItem[];
  updateItems?: QrCodeItem[];
  delItems?: QrCodeItem[];
};

export function mapToQrCodeModel(item: QrCodeResponse): QrCodeRow {
  return {
    id: item.sysId ?? `qr-code-${item.tableNum ?? Date.now()}`,
    sysId: item.sysId,
    linkSysId: item.linkSysId,
    url: item.url,
    useYn: item.useYn ?? 'Y',
    tableNum: item.tableNum != null ? String(item.tableNum) : '',
    remark: item.description ?? '',
    isNew: false,
  };
}

export function mapToQrCodePayload(row: QrCodeRow): QrCodeItem {
  return {
    sysId: row.sysId,
    linkSysId: row.linkSysId,
    tableNum: row.tableNum ? Number(row.tableNum) : undefined,
    description: row.remark,
    url: row.url,
    useYn: row.useYn ?? 'Y',
  };
}

function isSameQrCodeRow(a: QrCodeRow, b: QrCodeRow) {
  return a.tableNum === b.tableNum && a.remark === b.remark;
}

export function buildQrCodeRequest(
  currentRows: QrCodeRow[],
  originalRows: QrCodeRow[],
): QrCodeRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToQrCodePayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameQrCodeRow(row, originalRow) : false;
    })
    .map(mapToQrCodePayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToQrCodePayload);

  return { newItems, updateItems, delItems };
}

export function hasQrCodeChanges(request: QrCodeRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

function getQrCodeList() {
  return httpClient<QrCodeResponse[]>({
    url: '/api/client/store_manage/qr_code/search',
    method: 'GET',
  });
}

function saveQrCode(request: QrCodeRequest) {
  return httpClient<{ success: boolean }>({
    url: '/api/client/store_manage/qr_code/save',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: request,
  });
}

export function useQrCodeQuery() {
  return useQuery({
    queryKey: queryKeys.qrCode.lists,
    queryFn: getQrCodeList,
    ...queryPolicies.clientCrudList,
  });
}

export function useSaveQrCodeMutation() {
  const mutation = useMutation({ mutationFn: saveQrCode });

  return {
    mutateAsync: async (request: QrCodeRequest) => mutation.mutateAsync(request),
    isPending: mutation.isPending,
  };
}
