import type { StoreInfo } from '../types';

/**
 * 매장 기본 정보 mock — UI 단계용.
 * 실제 데이터는 백엔드 `/api/client/store_manage/store_info/search` 응답으로 대체된다.
 */
export const STORE_INFO_MOCK: StoreInfo = {
  storeName: '쌀국수 먹고싶다',
  businessNumber: '123-45-67890',
  ownerName: '홍길동',
  address: '서울특별시 강남구 테헤란로 123',
  contactPhone: '02-1234-5678',
  emergencyPhone: '010-1234-5678',
  businessHours: '11:00 - 22:00',
  email: 'info@restaurant.com',
};
