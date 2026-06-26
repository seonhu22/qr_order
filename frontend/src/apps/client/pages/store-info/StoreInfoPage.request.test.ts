import { describe, expect, it } from 'vitest';
import { toStoreInfoRequest } from '@/apps/client/features/store-info/api/storeInfoRequestMapper';

describe('toStoreInfoRequest', () => {
  it('serializes business hours as LocalTime strings for the backend', () => {
    expect(
      toStoreInfoRequest({
        storeName: '쌀국수 먹고싶다1',
        businessNumber: '123-45-67890',
        ownerName: '홍길동',
        address: '서울특별시 강남구 테헤란로 123',
        contactPhone: '02-1234-5678',
        emergencyPhone: '010-1234-5678',
        businessHoursStart: '11:00',
        businessHoursEnd: '22:00',
        email: 'info@restaurant.com',
      }),
    ).toMatchObject({
      phoneNumber: 212345678,
      emergencyPhoneNumber: 1012345678,
      openTime: '11:00',
      closeTime: '22:00',
    });
  });
});
