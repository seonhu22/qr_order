import { STORE_INFO_MOCK_ROWS } from '../mock/storeInfoMock';
import type { StoreInfo } from '../types';
import type { StoreInfoRequest } from '@/generated/types/storeInfoRequest';

export type StoreInfoSaveRequest = Omit<StoreInfoRequest, 'openTime' | 'closeTime'> & {
  openTime?: string;
  closeTime?: string;
};

function formatTimeForRequest(time: string): string {
  const [hour = '00', minute = '00'] = time.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

export function toStoreInfoRequest(values: StoreInfo): StoreInfoSaveRequest {
  return {
    sysId: STORE_INFO_MOCK_ROWS[0]?.sysId,
    storeName: values.storeName,
    address: values.address,
    phoneNumber: Number(values.contactPhone.replace(/[^0-9]/g, '')) || undefined,
    emergencyPhoneNumber: Number(values.emergencyPhone.replace(/[^0-9]/g, '')) || undefined,
    email: values.email,
    openTime: values.businessHoursStart ? formatTimeForRequest(values.businessHoursStart) : undefined,
    closeTime: values.businessHoursEnd ? formatTimeForRequest(values.businessHoursEnd) : undefined,
  };
}
