export type PaymentHistory = {
  id: string;
  paymentNo: string;
  orderNo: string;
  tableNumber: number;
  amount: number;
  method: string;
  status: '완료' | '취소';
  paidAt: string;
};

export type SettlementHistory = {
  id: string;
  settlementNo: string;
  businessDate: string;
  orderCount: number;
  paymentAmount: number;
  feeAmount: number;
  settlementAmount: number;
};
