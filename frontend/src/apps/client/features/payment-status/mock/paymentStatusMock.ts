import type { PaymentHistory, SettlementHistory } from '../types';

export const PAYMENT_HISTORY_ROWS: PaymentHistory[] = [
  { id: 'payment-1', paymentNo: 'PAY-001', orderNo: 'ORD-20260611-001', tableNumber: 1, amount: 9700, method: '카드', status: '완료', paidAt: '2026-06-11 10:14' },
  { id: 'payment-2', paymentNo: 'PAY-002', orderNo: 'ORD-20260611-002', tableNumber: 2, amount: 5200, method: '간편결제', status: '완료', paidAt: '2026-06-11 10:30' },
  { id: 'payment-3', paymentNo: 'PAY-003', orderNo: 'ORD-20260611-003', tableNumber: 3, amount: 6500, method: '카드', status: '취소', paidAt: '2026-06-11 11:08' },
];

export const SETTLEMENT_HISTORY_ROWS: SettlementHistory[] = [
  { id: 'settlement-1', settlementNo: 'SET-20260610', businessDate: '2026-06-10', orderCount: 42, paymentAmount: 482000, feeAmount: 14460, settlementAmount: 467540 },
  { id: 'settlement-2', settlementNo: 'SET-20260609', businessDate: '2026-06-09', orderCount: 35, paymentAmount: 396000, feeAmount: 11880, settlementAmount: 384120 },
  { id: 'settlement-3', settlementNo: 'SET-20260608', businessDate: '2026-06-08', orderCount: 28, paymentAmount: 318000, feeAmount: 9540, settlementAmount: 308460 },
];
