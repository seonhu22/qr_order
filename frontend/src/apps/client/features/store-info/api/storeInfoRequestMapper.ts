import type { StoreInfo } from '../types';
import type { StoreInfoResponse } from '@/generated/types/storeInfoResponse';
import type { StoreInfoRequest } from '@/generated/types/storeInfoRequest';
import type { LocalTime } from '@/generated/types/localTime';

export type StoreInfoSaveRequest = Omit<StoreInfoRequest, 'openTime' | 'closeTime'> & {
  openTime?: string;
  closeTime?: string;
};

export const EMPTY_STORE_INFO: StoreInfo = {
  storeName: '',
  businessNumber: '',
  ownerName: '',
  address: '',
  contactPhone: '',
  emergencyPhone: '',
  businessHoursStart: '',
  businessHoursEnd: '',
  email: '',
};

function formatPhoneForDisplay(value?: number): string {
  if (value == null) return '';

  // 저장 과정에서 number 변환으로 날아간 맨 앞 '0'을 복원한 뒤 자릿수 기준으로 하이픈을 채운다.
  const full = `0${value}`;

  if (full.startsWith('02')) {
    if (full.length === 9) return `02-${full.slice(2, 5)}-${full.slice(5)}`;
    if (full.length === 10) return `02-${full.slice(2, 6)}-${full.slice(6)}`;
  } else {
    if (full.length === 10) return `${full.slice(0, 3)}-${full.slice(3, 6)}-${full.slice(6)}`;
    if (full.length === 11) return `${full.slice(0, 3)}-${full.slice(3, 7)}-${full.slice(7)}`;
  }

  return String(value);
}

function isLocalTime(value: unknown): value is LocalTime {
  return typeof value === 'object' && value !== null && ('hour' in value || 'minute' in value);
}

function formatTimeForDisplay(value?: LocalTime | string): string {
  if (!value) return '';

  if (typeof value === 'string') {
    const [hour = '00', minute = '00'] = value.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  if (isLocalTime(value)) {
    const hour = String(value.hour ?? 0).padStart(2, '0');
    const minute = String(value.minute ?? 0).padStart(2, '0');
    return `${hour}:${minute}`;
  }

  return '';
}

function formatTimeForRequest(time: string): string {
  const [hour = '00', minute = '00'] = time.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

export function mapStoreInfoResponseToForm(response?: StoreInfoResponse): StoreInfo {
  if (!response) return EMPTY_STORE_INFO;

  return {
    storeName: response.storeName ?? '',
    businessNumber: '',
    ownerName: '',
    address: response.address ?? '',
    contactPhone: formatPhoneForDisplay(response.phoneNumber),
    emergencyPhone: formatPhoneForDisplay(response.emergencyPhoneNumber),
    businessHoursStart: formatTimeForDisplay(response.openTime),
    businessHoursEnd: formatTimeForDisplay(response.closeTime),
    email: response.email ?? '',
  };
}

export function toStoreInfoRequest(values: StoreInfo, sysId?: string): StoreInfoSaveRequest {
  return {
    sysId,
    storeName: values.storeName,
    address: values.address,
    phoneNumber: Number(values.contactPhone.replace(/[^0-9]/g, '')) || undefined,
    emergencyPhoneNumber: Number(values.emergencyPhone.replace(/[^0-9]/g, '')) || undefined,
    email: values.email,
    openTime: values.businessHoursStart ? formatTimeForRequest(values.businessHoursStart) : undefined,
    closeTime: values.businessHoursEnd ? formatTimeForRequest(values.businessHoursEnd) : undefined,
  };
}
