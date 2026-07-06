import { describe, expect, it } from 'vitest';
import {
  mapStoreInfoResponseToForm,
  toStoreInfoRequest,
} from '@/apps/client/features/store-info/api/storeInfoRequestMapper';

describe('storeInfoRequestMapper', () => {
  it('maps store search response to form fields without mock values', () => {
    expect(
      mapStoreInfoResponseToForm({
        sysId: '01STOREINFO',
        storeName: '쌀국수 먹고싶다',
        address: '서울특별시 강남구 테헤란로 123',
        phoneNumber: 212345678,
        emergencyPhoneNumber: 1012345678,
        email: 'info@restaurant.com',
        openTime: { hour: 11, minute: 0 },
        closeTime: { hour: 22, minute: 0 },
      }),
    ).toEqual({
      storeName: '쌀국수 먹고싶다',
      businessNumber: '',
      ownerName: '',
      address: '서울특별시 강남구 테헤란로 123',
      contactPhone: '02-1234-5678',
      emergencyPhone: '010-1234-5678',
      businessHoursStart: '11:00',
      businessHoursEnd: '22:00',
      email: 'info@restaurant.com',
    });
  });

  it('serializes form values with the sysId from store search response', () => {
    expect(
      toStoreInfoRequest(
        {
          storeName: '쌀국수 먹고싶다1',
          businessNumber: '',
          ownerName: '',
          address: '서울특별시 강남구 테헤란로 123',
          contactPhone: '02-1234-5678',
          emergencyPhone: '010-1234-5678',
          businessHoursStart: '11:00',
          businessHoursEnd: '22:00',
          email: 'info@restaurant.com',
        },
        '01STOREINFO',
      ),
    ).toMatchObject({
      sysId: '01STOREINFO',
      phoneNumber: 212345678,
      emergencyPhoneNumber: 1012345678,
      openTime: '11:00',
      closeTime: '22:00',
    });
  });
});
