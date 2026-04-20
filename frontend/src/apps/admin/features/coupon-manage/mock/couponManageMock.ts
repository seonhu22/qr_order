import type { PaymentCoupon } from '@/generated/types/paymentCoupon';

export const COUPON_MOCK_ROWS: PaymentCoupon[] = [
  { sysId: '1', couponCd: 'CPN-001', couponNm: '신규 가입 할인 쿠폰',     startDate: '2025-01-01', endDate: '2025-12-31', useYn: 'Y' },
  { sysId: '2', couponCd: 'CPN-002', couponNm: '봄 시즌 프로모션',         startDate: '2025-03-01', endDate: '2025-05-31', useYn: 'Y' },
  { sysId: '3', couponCd: 'CPN-003', couponNm: '연간 구독 특별 혜택',      startDate: '2024-06-01', endDate: '2024-12-31', useYn: 'N' },
  { sysId: '4', couponCd: 'CPN-004', couponNm: '파트너사 제휴 쿠폰',       startDate: '2025-04-01', endDate: '2026-03-31', useYn: 'Y' },
  { sysId: '5', couponCd: 'CPN-005', couponNm: '여름 할인 이벤트',         startDate: '2025-07-01', endDate: '2025-08-31', useYn: 'N' },
  { sysId: '6', couponCd: 'CPN-006', couponNm: '기업 고객 전용 쿠폰',      startDate: '2025-01-15', endDate: '2025-06-30', useYn: 'Y' },
  { sysId: '7', couponCd: 'CPN-007', couponNm: '추석 감사 할인',           startDate: '2025-09-15', endDate: '2025-10-15', useYn: 'N' },
  { sysId: '8', couponCd: 'CPN-008', couponNm: '프리미엄 업그레이드 쿠폰', startDate: '2025-02-01', endDate: '2026-01-31', useYn: 'Y' },
];