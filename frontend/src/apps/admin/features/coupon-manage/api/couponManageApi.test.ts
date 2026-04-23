import { describe, expect, it } from 'vitest';
import { editorRowToCouponRow } from '../hooks/useCouponManageModalFlow';
import { buildCouponRequest, mapToCouponRow } from './couponManageApi';

describe('couponManageApi', () => {
  it('maps payment coupon response into page row', () => {
    expect(
      mapToCouponRow({
        sysId: 'coupon-1',
        couponCd: 'CP001',
        couponNm: '신규 가입 쿠폰',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        useYn: 'Y',
      }),
    ).toEqual({
      id: 'coupon-1',
      sysId: 'coupon-1',
      couponCd: 'CP001',
      couponNm: '신규 가입 쿠폰',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      useYn: 'Y',
    });
  });

  it('builds coupon requests with empty arrays instead of undefined', () => {
    expect(buildCouponRequest({})).toEqual({
      newItems: [],
      updateItems: [],
      delItems: [],
    });
  });

  it('keeps coupon fields when editor row is converted back to payload row', () => {
    expect(
      editorRowToCouponRow({
        id: 'coupon-1',
        sysId: 'coupon-1',
        couponCd: 'CP001',
        couponNm: '신규 가입 쿠폰',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        useYn: 'N',
      }),
    ).toEqual({
      id: 'coupon-1',
      sysId: 'coupon-1',
      couponCd: 'CP001',
      couponNm: '신규 가입 쿠폰',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      useYn: 'N',
    });
  });
});
