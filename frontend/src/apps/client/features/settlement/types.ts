export type SettlementSearchParams = {
  /** "YYYY-MM-DD HH:mm:ss" */
  startDate: string;
  /** "YYYY-MM-DD HH:mm:ss" */
  endDate: string;
};

export type SettlementSummary = {
  totalPrice: number;
  cancelPrice: number;
  discountPrice: number;
  netPrice: number;
  orderCount: number;
  /** dailySales의 dayCancelCount 합산 — 응답 최상위에는 취소 건수 필드가 없다 */
  cancelCount: number;
};

export type SettlementRow = {
  id: string;
  date: string;
  totalPrice: number;
  cancelPrice: number;
  netPrice: number;
  orderCount: number;
};
