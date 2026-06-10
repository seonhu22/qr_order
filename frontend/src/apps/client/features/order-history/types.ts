export type OrderHistoryMaster = {
  id: string;
  orderNo: string;
  tableNumber: number;
  orderedAt: string;
  totalAmount: number;
  status: '완료' | '취소';
};

export type OrderHistoryDetail = {
  id: string;
  orderId: string;
  menuName: string;
  quantity: number;
  optionSummary: string;
  amount: number;
};
