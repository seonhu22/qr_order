import { httpClient } from '@/shared/lib/httpClient';

export type QrTableInfo = {
  sysId?: string;
  tableName?: string;
  tableNum?: number;
  tableQty?: number;
  sysPlantCd?: string;
};

type QrConnectResponse = {
  success: boolean;
  data?: QrTableInfo | null;
  message?: string | null;
  error?: unknown;
};

export async function connectQr(url: string, signal?: AbortSignal) {
  return httpClient<QrConnectResponse>({
    url: `/api/qr/${encodeURIComponent(url)}`,
    method: 'GET',
    signal,
  });
}
