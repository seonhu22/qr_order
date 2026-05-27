export type CouponRow = {
  id: string;
  sysId?: string;
  couponCd: string;
  couponNm: string;
  startDate: string;
  endDate: string;
  useYn: 'Y' | 'N';
};