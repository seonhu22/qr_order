export type PaymentStatusCode = 'PAID' | 'UNPAID' | 'DINING';

export type PaymentStatusMasterRow = {
  id: string;
  orderNo: string;
  paymentType: string;
  totalPrice: number;
  paymentStatus: PaymentStatusCode;
};

export type PaymentStatusDetail = {
  orderNo: string;
  paymentStatus: PaymentStatusCode;
  cancelReason: string;
  items: string;
  cancelDescription: string;
};

export type PaymentStatusSearchParams = {
  /** "YYYY-MM-DD HH:mm:ss" */
  startDate: string;
  /** "YYYY-MM-DD HH:mm:ss" */
  endDate: string;
  /** ''이면 전체 — 백엔드 GetPaymentInfoMasterParams.paymentStatus는 필수 파라미터라 빈 문자열로 보낸다 */
  paymentStatus: PaymentStatusCode | '';
};

/** 결제상태 필터 콤보 값. `ALL`은 전체(필터 미적용)를 의미한다. */
export type PaymentStatusFilterKey = 'ALL' | PaymentStatusCode;
