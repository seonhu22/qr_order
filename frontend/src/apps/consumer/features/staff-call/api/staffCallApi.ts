import { httpClient } from '@/shared/lib/httpClient';

export type StaffCallSetting = {
  sysId: string;
  callCd: string;
  callNm: string;
  singleYn: 'Y' | 'N';
  description?: string | null;
};

export type StaffCallRequestItem = { callCd: string; quantity: number };

export function fetchStaffCallSettings(signal?: AbortSignal): Promise<StaffCallSetting[]> {
  return httpClient({ url: '/api/client/consumer/orders/staffcall/search', method: 'GET', signal });
}

export async function callStaff(items: StaffCallRequestItem[]): Promise<void> {
  await httpClient({
    url: '/api/client/consumer/orders/staffcall/new',
    method: 'POST',
    data: { items },
  });
}
