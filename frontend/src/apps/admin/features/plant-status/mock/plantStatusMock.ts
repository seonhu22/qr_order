import type { PlantStatusResponse } from '@/generated/types/plantStatusResponse';

export const PLANT_STATUS_MOCK_ROWS: PlantStatusResponse[] = [
  { sysId: '1', plantCd: 'PLT-001', plantNm: '강남 1호점',    paymentCd: 'PRO_M12',     paymentNm: '프리미엄 플랜 (연)',      lastCheckoutDate: '2025-04-20', estimateCheckoutDate: '2026-10-20' },
  { sysId: '2', plantCd: 'PLT-002', plantNm: '홍대 2호점',    paymentCd: 'STD_M6',      paymentNm: '스탠다드 플랜 (반기)',    lastCheckoutDate: '2025-11-01', estimateCheckoutDate: '2026-05-05' },
  { sysId: '3', plantCd: 'PLT-003', plantNm: '신촌 3호점',    paymentCd: 'BASIC_M1',    paymentNm: '베이직 플랜 (월)',        lastCheckoutDate: '2026-03-20', estimateCheckoutDate: '2026-04-28' },
  { sysId: '4', plantCd: 'PLT-004', plantNm: '종로 4호점',    paymentCd: 'PRO_M12',     paymentNm: '프리미엄 플랜 (연)',      lastCheckoutDate: '2025-06-15', estimateCheckoutDate: '2027-06-15' },
  { sysId: '5', plantCd: 'PLT-005', plantNm: '이태원 5호점',  paymentCd: 'STD_M3',      paymentNm: '스탠다드 플랜 (분기)',    lastCheckoutDate: '2026-01-20', estimateCheckoutDate: '2026-05-15' },
  { sysId: '6', plantCd: 'PLT-006', plantNm: '부산 서면점',   paymentCd: 'ENT_USD_M12', paymentNm: '엔터프라이즈 (연)',       lastCheckoutDate: '2025-04-20', estimateCheckoutDate: '2026-04-25' },
  { sysId: '7', plantCd: 'PLT-007', plantNm: '대구 동성로점', paymentCd: 'BASIC_M12',   paymentNm: '베이직 플랜 (연)',        lastCheckoutDate: '2025-08-01', estimateCheckoutDate: '2026-08-01' },
  { sysId: '8', plantCd: 'PLT-008', plantNm: '수원 영통점',   paymentCd: undefined,      paymentNm: undefined,                lastCheckoutDate: undefined,    estimateCheckoutDate: '2026-05-10' },
  { sysId: '9', plantCd: 'PLT-009', plantNm: '인천 부평점',   paymentCd: 'STD_M1',      paymentNm: '스탠다드 플랜 (월)',      lastCheckoutDate: undefined,    estimateCheckoutDate: '2026-04-30' },
];