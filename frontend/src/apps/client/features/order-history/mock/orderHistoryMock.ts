import type { OrderHistoryRow } from '../types';

/**
 * 백엔드 주문 이력 조회 API가 아직 화면 요구 필드(주문번호/결제상태)를 제공하지 않아
 * 임시로 사용하는 mock 데이터. 조회 시점(now) 기준 상대 날짜로 생성해서
 * 화면 기본 조회 범위(최근 7일)에서도 항상 결과가 보이게 한다.
 */
function orderDatetimeDaysAgo(daysAgo: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:00`;
}

function orderNoOf(datetime: string, seq: number) {
  const datePart = datetime.slice(0, 10).replace(/-/g, '');
  return `ORD-${datePart}-${String(seq).padStart(3, '0')}`;
}

type MockOrderSeed = {
  daysAgo: number;
  hour: number;
  minute: number;
  seq: number;
  tableNum: string;
  orderStatus: OrderHistoryRow['orderStatus'];
  paymentStatus: OrderHistoryRow['paymentStatus'];
};

// daysAgo를 0~6(기본 7일 범위 안)과 20/35/50(범위 확장 검증용)으로 분산시킨다.
const MOCK_SEEDS: MockOrderSeed[] = [
  // daysAgo 0(오늘)은 실행 시각과 무관하게 항상 "과거"가 되도록 자정(00:00)으로 고정한다.
  { daysAgo: 0, hour: 0, minute: 0, seq: 1, tableNum: '1', orderStatus: 'SERVED', paymentStatus: 'PAID' },
  { daysAgo: 1, hour: 19, minute: 32, seq: 4, tableNum: '3', orderStatus: 'COOKING', paymentStatus: 'PAID' },
  { daysAgo: 1, hour: 19, minute: 10, seq: 3, tableNum: '5', orderStatus: 'RECEIVED', paymentStatus: 'PENDING' },
  { daysAgo: 4, hour: 13, minute: 45, seq: 2, tableNum: '2', orderStatus: 'CANCELLED', paymentStatus: 'REFUNDED' },
  { daysAgo: 6, hour: 18, minute: 20, seq: 1, tableNum: '4', orderStatus: 'SERVED', paymentStatus: 'PAID' },
  { daysAgo: 20, hour: 11, minute: 50, seq: 6, tableNum: '6', orderStatus: 'SERVED', paymentStatus: 'UNPAID' },
  { daysAgo: 35, hour: 20, minute: 5, seq: 2, tableNum: '1', orderStatus: 'CANCELLED', paymentStatus: 'REFUNDED' },
  { daysAgo: 50, hour: 12, minute: 40, seq: 3, tableNum: '7', orderStatus: 'SERVED', paymentStatus: 'PAID' },
];

export const ORDER_HISTORY_MOCK: OrderHistoryRow[] = MOCK_SEEDS.map((seed, index) => {
  const orderDatetime = orderDatetimeDaysAgo(seed.daysAgo, seed.hour, seed.minute);

  return {
    id: `order-${String(index + 1).padStart(3, '0')}`,
    orderNo: orderNoOf(orderDatetime, seed.seq),
    tableNum: seed.tableNum,
    orderStatus: seed.orderStatus,
    paymentStatus: seed.paymentStatus,
    orderDatetime,
  };
});
