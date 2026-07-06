import type { StoreInfoResponse } from '@/generated/types/storeInfoResponse';

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
