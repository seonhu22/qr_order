import type { StoreInfoResponse } from '@/generated/types/storeInfoResponse';
import type { StoreInfo } from '../types';

export const STORE_INFO_MOCK_ROWS: StoreInfoResponse[] = [
  {
    sysId: 'store-001',
    storeName: '쌀국수 먹고싶다',
    address: '서울특별시 강남구 테헤란로 123',
    phoneNumber: 212345678,
    emergencyPhoneNumber: 1012345678,
    email: 'info@restaurant.com',
    openTime: { hour: 11, minute: 0 },
    closeTime: { hour: 22, minute: 0 },
  },
];

export const STORE_INFO_MOCK: StoreInfo = {
  storeName: '쌀국수 먹고싶다',
  businessNumber: '123-45-67890',
  ownerName: '홍길동',
  address: '서울특별시 강남구 테헤란로 123',
  contactPhone: '02-1234-5678',
  emergencyPhone: '010-1234-5678',
  businessHoursStart: '11:00',
  businessHoursEnd: '22:00',
  email: 'info@restaurant.com',
};
