import type { PaymentResponse } from '@/generated/types/paymentResponse';

export const PAYMENT_MOCK_ROWS: PaymentResponse[] = [
  { sysId: '1', paymentCd: 'BASIC_M1', paymentNm: '베이직 플랜 (월)', paymentFee: 9900, paymentFeeUnit: '원', licenseValidMonth: 1 },
  { sysId: '2', paymentCd: 'BASIC_M12', paymentNm: '베이직 플랜 (연)', paymentFee: 99000, paymentFeeUnit: '원', licenseValidMonth: 12 },
  { sysId: '3', paymentCd: 'STD_M1', paymentNm: '스탠다드 플랜 (월)', paymentFee: 19900, paymentFeeUnit: '원', licenseValidMonth: 1 },
  { sysId: '4', paymentCd: 'STD_M3', paymentNm: '스탠다드 플랜 (분기)', paymentFee: 55000, paymentFeeUnit: '원', licenseValidMonth: 3 },
  { sysId: '5', paymentCd: 'STD_M12', paymentNm: '스탠다드 플랜 (연)', paymentFee: 199000, paymentFeeUnit: '원', licenseValidMonth: 12 },
  { sysId: '6', paymentCd: 'PRO_M1', paymentNm: '프리미엄 플랜 (월)', paymentFee: 39900, paymentFeeUnit: '원', licenseValidMonth: 1 },
  { sysId: '7', paymentCd: 'PRO_M6', paymentNm: '프리미엄 플랜 (반기)', paymentFee: 219000, paymentFeeUnit: '원', licenseValidMonth: 6 },
  { sysId: '8', paymentCd: 'PRO_M12', paymentNm: '프리미엄 플랜 (연)', paymentFee: 399000, paymentFeeUnit: '원', licenseValidMonth: 12 },
  { sysId: '9', paymentCd: 'ENT_USD_M1', paymentNm: '엔터프라이즈 (월)', paymentFee: 49, paymentFeeUnit: 'USD', licenseValidMonth: 1 },
  { sysId: '10', paymentCd: 'ENT_USD_M12', paymentNm: '엔터프라이즈 (연)', paymentFee: 499, paymentFeeUnit: 'USD', licenseValidMonth: 12 },
];