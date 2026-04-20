export type PaymentRateRow = {
  id: string;
  /** 결제 요금 코드 */
  rateCode: string;
  /** 결제 요금 명 */
  rateName: string;
  /** 결제 요금 */
  rateAmount: number;
  /** 결제 요금 단위 */
  rateUnit: string;
  /** 라이센스 기간 */
  licensePeriod: string;
};
